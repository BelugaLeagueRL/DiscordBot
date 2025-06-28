/**
 * Audit logging system for Discord bot interactions
 */

import type { SecurityContext } from '../middleware/security';
import type { DiscordInteraction } from '../types/discord';

export enum AuditEventType {
  REQUEST_RECEIVED = 'request_received',
  REQUEST_VERIFIED = 'request_verified',
  REQUEST_REJECTED = 'request_rejected',
  COMMAND_EXECUTED = 'command_executed',
  COMMAND_FAILED = 'command_failed',
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  HEALTH_CHECK = 'health_check',
  ERROR_OCCURRED = 'error_occurred',
}

export interface AuditLogEntry {
  timestamp: string;
  requestId: string;
  eventType: AuditEventType;
  clientIP: string;
  userAgent: string;
  userId?: string | undefined;
  guildId?: string | undefined;
  channelId?: string | undefined;
  commandName?: string | undefined;
  success: boolean;
  error?: string | undefined;
  responseTime?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export class AuditLogger {
  private environment: string;

  constructor(environment: string) {
    this.environment = environment;
  }

  /**
   * Log an audit event
   */
  log(
    eventType: AuditEventType,
    context: SecurityContext,
    options: {
      interaction?: DiscordInteraction | undefined;
      success?: boolean | undefined;
      error?: string | undefined;
      responseTime?: number | undefined;
      metadata?: Record<string, unknown> | undefined;
    } = {}
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      eventType,
      clientIP: context.clientIP,
      userAgent: context.userAgent,
      userId: options.interaction?.member?.user?.id || options.interaction?.user?.id,
      guildId: (options.interaction as { guild_id?: string })?.guild_id,
      channelId: (options.interaction as { channel_id?: string })?.channel_id,
      commandName: options.interaction?.data?.name,
      success: options.success ?? true,
      error: options.error,
      responseTime: options.responseTime,
      metadata: options.metadata,
    };

    // Log to console (Cloudflare Workers logs)
    this.logToConsole(entry);

    // In production, could also send to external logging service
    if (this.environment === 'production') {
      this.logToExternalService(entry);
    }
  }

  /**
   * Log request received
   */
  logRequestReceived(context: SecurityContext, method: string, path: string): void {
    this.log(AuditEventType.REQUEST_RECEIVED, context, {
      metadata: { method, path },
    });
  }

  /**
   * Log successful request verification
   */
  logRequestVerified(context: SecurityContext): void {
    this.log(AuditEventType.REQUEST_VERIFIED, context);
  }

  /**
   * Log request rejection
   */
  logRequestRejected(context: SecurityContext, reason: string): void {
    this.log(AuditEventType.REQUEST_REJECTED, context, {
      success: false,
      error: reason,
    });
  }

  /**
   * Log command execution
   */
  logCommandExecution(
    context: SecurityContext,
    interaction: DiscordInteraction,
    success: boolean,
    responseTime: number,
    error?: string
  ): void {
    this.log(
      success ? AuditEventType.COMMAND_EXECUTED : AuditEventType.COMMAND_FAILED,
      context,
      {
        interaction,
        success,
        responseTime,
        error: error || undefined,
      }
    );
  }

  /**
   * Log security violation
   */
  logSecurityViolation(
    context: SecurityContext,
    violationType: string,
    details: string
  ): void {
    this.log(AuditEventType.SECURITY_VIOLATION, context, {
      success: false,
      error: `${violationType}: ${details}`,
      metadata: { violationType },
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(context: SecurityContext): void {
    this.log(AuditEventType.RATE_LIMIT_EXCEEDED, context, {
      success: false,
      error: 'Rate limit exceeded',
    });
  }

  /**
   * Log health check
   */
  logHealthCheck(context: SecurityContext): void {
    this.log(AuditEventType.HEALTH_CHECK, context);
  }

  /**
   * Log general error
   */
  logError(context: SecurityContext, error: string, metadata?: Record<string, unknown>): void {
    this.log(AuditEventType.ERROR_OCCURRED, context, {
      success: false,
      error,
      metadata: metadata || undefined,
    });
  }

  /**
   * Log to console with structured format
   */
  private logToConsole(entry: AuditLogEntry): void {
    const logLevel = entry.success ? 'INFO' : 'WARN';
    const message = `[${logLevel}] ${entry.eventType} - ${entry.requestId}`;
    
    if (entry.success) {
      console.log(message, entry);
    } else {
      console.warn(message, entry);
    }
  }

  /**
   * Log to external service (placeholder for production)
   */
  private logToExternalService(entry: AuditLogEntry): void {
    // In production, this could send to:
    // - Cloudflare Analytics
    // - External logging service (DataDog, LogRocket, etc.)
    // - Database for audit trail
    // - Security monitoring system
    
    // For now, just console log in production
    console.log('[AUDIT]', JSON.stringify(entry));
  }

  /**
   * Create performance timing context
   */
  static startTiming(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}