/**
 * Security middleware for Discord request validation and protection
 */

import { verifyKey } from 'discord-interactions';

// Rate limiting storage (in-memory for Workers)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const RATE_LIMIT_REQUESTS = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const REQUEST_TIMEOUT = 10 * 1000; // 10 seconds
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

export interface SecurityContext {
  clientIP: string;
  userAgent: string;
  timestamp: number;
  requestId: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  error?: string | undefined;
  context?: SecurityContext | undefined;
}

/**
 * Extract security context from request
 */
export function extractSecurityContext(request: Request): SecurityContext {
  const clientIP =
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const timestamp = Date.now();
  const requestId = crypto.randomUUID();

  return {
    clientIP,
    userAgent,
    timestamp,
    requestId,
  };
}

/**
 * Validate request rate limiting
 */
export function validateRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const key = `rate_limit:${clientIP}`;
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new rate limit entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (existing.count >= RATE_LIMIT_REQUESTS) {
    return false; // Rate limit exceeded
  }

  // Increment counter
  existing.count++;
  return true;
}

/**
 * Validate request headers for Discord requirements
 */
export function validateDiscordHeaders(request: Request): { isValid: boolean; error?: string } {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  const contentType = request.headers.get('Content-Type');

  if (!signature) {
    return { isValid: false, error: 'Missing X-Signature-Ed25519 header' };
  }

  if (!timestamp) {
    return { isValid: false, error: 'Missing X-Signature-Timestamp header' };
  }

  if (!contentType || !contentType.includes('application/json')) {
    return { isValid: false, error: 'Invalid Content-Type, expected application/json' };
  }

  // Validate timestamp (prevent replay attacks)
  const timestampNum = parseInt(timestamp, 10);
  const now = Date.now() / 1000;
  const timeDiff = Math.abs(now - timestampNum);

  if (timeDiff > 300) {
    // 5 minutes
    return { isValid: false, error: 'Request timestamp too old or too far in future' };
  }

  return { isValid: true };
}

/**
 * Enhanced Discord request verification with security checks
 */
export async function verifyDiscordRequestSecure(
  request: Request,
  publicKey: string,
  context: SecurityContext
): Promise<SecurityValidationResult> {
  try {
    // Validate headers first
    const headerValidation = validateDiscordHeaders(request);
    if (!headerValidation.isValid) {
      return {
        isValid: false,
        error: headerValidation.error,
        context,
      };
    }

    // Check rate limiting
    if (!validateRateLimit(context.clientIP)) {
      return {
        isValid: false,
        error: 'Rate limit exceeded',
        context,
      };
    }

    // Verify Discord signature
    const signature = request.headers.get('X-Signature-Ed25519') as string;
    const timestamp = request.headers.get('X-Signature-Timestamp') as string;
    const body = await request.clone().arrayBuffer();

    // Check payload size
    if (body.byteLength > MAX_PAYLOAD_SIZE) {
      return {
        isValid: false,
        error: 'Payload too large',
        context,
      };
    }

    const isValidSignature = await verifyKey(body, signature, timestamp, publicKey);

    if (!isValidSignature) {
      return {
        isValid: false,
        error: 'Invalid Discord signature',
        context,
      };
    }

    return {
      isValid: true,
      context,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      context,
    };
  }
}

/**
 * Create security headers for responses
 */
export function createSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Sanitize input string to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'&]/g, '') // Remove dangerous HTML chars
    .replace(/[^\w\s\-_.]/g, '') // Allow only safe characters
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Timeout wrapper for request processing
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}
