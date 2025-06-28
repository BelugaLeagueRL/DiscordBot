/**
 * Audit logging system for Discord bot interactions
 */

import type { SecurityContext } from '../middleware/security';
import type { DiscordInteraction } from '../types/discord';

export enum AuditEventType {
  RequestReceived = 'request_received',
  RequestVerified = 'request_verified',
  RequestRejected = 'request_rejected',
  CommandExecuted = 'command_executed',
  CommandFailed = 'command_failed',
  SecurityViolation = 'security_violation',
  RateLimitExceeded = 'rate_limit_exceeded',
  HealthCheck = 'health_check',
  ErrorOccurred = 'error_occurred',
}

export interface AuditLogEntry {
  readonly timestamp: string;
  readonly requestId: string;
  readonly eventType: AuditEventType;
  readonly clientIP: string;
  readonly userAgent: string;
  readonly userId?: string | undefined;
  readonly guildId?: string | undefined;
  readonly channelId?: string | undefined;
  readonly commandName?: string | undefined;
  readonly success: boolean;
  readonly error?: string | undefined;
  readonly responseTime?: number | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

export class AuditLogger {
  private readonly environment: string;

  constructor(environment: string) {
    this.environment = environment;
  }

  /**
   * Extract user ID from interaction
   */
  private extractUserId(interaction?: Readonly<DiscordInteraction>): string | undefined {
    return interaction?.member?.user?.id ?? interaction?.user?.id;
  }

  /**
   * Extract guild ID from interaction
   */
  private extractGuildId(interaction?: Readonly<DiscordInteraction>): string | undefined {
    return (interaction as { guild_id?: string } | undefined)?.guild_id;
  }

  /**
   * Extract channel ID from interaction
   */
  private extractChannelId(interaction?: Readonly<DiscordInteraction>): string | undefined {
    return (interaction as { channel_id?: string } | undefined)?.channel_id;
  }

  /**
   * Log an audit event
   */
  log(
    eventType: AuditEventType,
    context: Readonly<SecurityContext>,
    options: Readonly<{
      readonly interaction?: DiscordInteraction | undefined;
      readonly success?: boolean | undefined;
      readonly error?: string | undefined;
      readonly responseTime?: number | undefined;
      readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    }> = {}
  ): void {
    const entry = this.createAuditEntry(eventType, context, options);
    this.writeAuditEntry(entry);
  }

  /**
   * Create audit log entry
   */
  private createAuditEntry(
    eventType: AuditEventType,
    context: Readonly<SecurityContext>,
    options: Readonly<{
      readonly interaction?: DiscordInteraction | undefined;
      readonly success?: boolean | undefined;
      readonly error?: string | undefined;
      readonly responseTime?: number | undefined;
      readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    }>
  ): AuditLogEntry {
    return {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      eventType,
      clientIP: context.clientIP,
      userAgent: context.userAgent,
      userId: this.extractUserId(options.interaction),
      guildId: this.extractGuildId(options.interaction),
      channelId: this.extractChannelId(options.interaction),
      commandName: options.interaction?.data?.name,
      success: options.success ?? true,
      error: options.error,
      responseTime: options.responseTime,
      metadata: options.metadata,
    };
  }

  /**
   * Write audit entry to appropriate destinations
   */
  private writeAuditEntry(entry: Readonly<AuditLogEntry>): void {
    this.logToConsole(entry);

    if (this.environment === 'production') {
      this.logToExternalService(entry);
    }
  }

  /**
   * Log request received
   */
  logRequestReceived(
    context: Readonly<SecurityContext>,
    requestData: { readonly method: string; readonly path: string }
  ): void {
    this.log(AuditEventType.RequestReceived, context, {
      metadata: { method: requestData.method, path: requestData.path },
    });
  }

  /**
   * Log successful request verification
   */
  logRequestVerified(context: Readonly<SecurityContext>): void {
    this.log(AuditEventType.RequestVerified, context);
  }

  /**
   * Log request rejection
   */
  logRequestRejected(
    context: Readonly<SecurityContext>,
    rejectionData: { readonly reason: string }
  ): void {
    this.log(AuditEventType.RequestRejected, context, {
      success: false,
      error: rejectionData.reason,
    });
  }

  /**
   * Log command execution
   */
  logCommandExecution(
    context: Readonly<SecurityContext>,
    commandExecutionData: Readonly<{
      readonly interaction: DiscordInteraction;
      readonly success: boolean;
      readonly responseTime: number;
      readonly error?: string;
    }>
  ): void {
    this.log(
      commandExecutionData.success ? AuditEventType.CommandExecuted : AuditEventType.CommandFailed,
      context,
      {
        interaction: commandExecutionData.interaction,
        success: commandExecutionData.success,
        responseTime: commandExecutionData.responseTime,
        error: commandExecutionData.error,
      }
    );
  }

  /**
   * Log security violation
   */
  logSecurityViolation(
    context: Readonly<SecurityContext>,
    violationData: { readonly violationType: string; readonly details: string }
  ): void {
    this.log(AuditEventType.SecurityViolation, context, {
      success: false,
      error: `${violationData.violationType}: ${violationData.details}`,
      metadata: { violationType: violationData.violationType },
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(context: Readonly<SecurityContext>): void {
    this.log(AuditEventType.RateLimitExceeded, context, {
      success: false,
      error: 'Rate limit exceeded',
    });
  }

  /**
   * Log health check
   */
  logHealthCheck(context: Readonly<SecurityContext>): void {
    this.log(AuditEventType.HealthCheck, context);
  }

  /**
   * Log general error
   */
  logError(
    context: Readonly<SecurityContext>,
    errorData: Readonly<{
      readonly error: string;
      readonly metadata?: Readonly<Record<string, unknown>>;
    }>
  ): void {
    this.log(AuditEventType.ErrorOccurred, context, {
      success: false,
      error: errorData.error,
      metadata: errorData.metadata,
    });
  }

  /**
   * Log to console with structured format
   */
  private logToConsole(entry: Readonly<AuditLogEntry>): void {
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
  private logToExternalService(entry: Readonly<AuditLogEntry>): void {
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
