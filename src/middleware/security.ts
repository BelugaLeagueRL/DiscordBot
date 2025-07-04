/**
 * Security middleware for Discord request validation and protection
 */

import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

// Rate limiting storage (in-memory for Workers)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Security configuration constants
const RATE_LIMIT_REQUESTS = 100; // requests per window
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const BYTES_PER_KB = 1024;
const KB_PER_MB = 1024;
const REQUEST_TIMEOUT_SECONDS = 10;

const RATE_LIMIT_WINDOW = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND; // 1 minute
const REQUEST_TIMEOUT = REQUEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND; // 10 seconds
const MAX_PAYLOAD_SIZE = BYTES_PER_KB * KB_PER_MB; // 1MB

export interface SecurityContext {
  readonly clientIP: string;
  readonly userAgent: string;
  readonly timestamp: number;
  readonly requestId: string;
}

export interface SecurityValidationResult {
  readonly isValid: boolean;
  readonly error?: string | undefined;
  readonly context?: SecurityContext | undefined;
}

/**
 * Extract security context from request
 */
export function extractSecurityContext(request: Readonly<Request>): SecurityContext {
  const clientIP =
    request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown';
  const userAgent = request.headers.get('User-Agent') ?? 'unknown';
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

  if (existing === undefined || now > existing.resetTime) {
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
export function validateDiscordHeaders(request: Readonly<Request>): {
  isValid: boolean;
  error?: string;
} {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  const contentType = request.headers.get('Content-Type');

  if (signature === null) {
    return { isValid: false, error: 'Missing X-Signature-Ed25519 header' };
  }

  if (timestamp === null) {
    return { isValid: false, error: 'Missing X-Signature-Timestamp header' };
  }

  if (contentType?.includes('application/json') !== true) {
    return { isValid: false, error: 'Invalid Content-Type, expected application/json' };
  }

  // Validate timestamp (prevent replay attacks)
  const timestampNum = parseInt(timestamp, 10);
  const now = Date.now() / 1000;
  const timeDiff = Math.abs(now - timestampNum);

  const MAX_TIMESTAMP_DIFF_SECONDS = 300; // 5 minutes
  if (timeDiff > MAX_TIMESTAMP_DIFF_SECONDS) {
    return { isValid: false, error: 'Request timestamp too old or too far in future' };
  }

  return { isValid: true };
}

/**
 * Enhanced Discord request verification with security checks
 */
export async function verifyDiscordRequestSecure(
  request: Readonly<Request>,
  publicKey: string,
  context: Readonly<SecurityContext>
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

    const isValidSignature = nacl.sign.detached.verify(
      Buffer.from(timestamp + new TextDecoder().decode(body)),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    );

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
 * Clear all rate limit entries (for testing purposes)
 */
export function clearRateLimits(): void {
  rateLimitMap.clear();
}

/**
 * Timeout wrapper for request processing
 */
export function withTimeout<TData>(
  promise: Promise<TData>,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<TData> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeoutMs)
    ),
  ]);
}
