/**
 * Comprehensive tests for audit logging system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// Removed SpyInstance import - using vi.spyOn return type instead
import { AuditLogger, AuditEventType } from '../../utils/audit';
import { SecurityContextFactory } from '../helpers/test-factories';
import { mockInteractions } from '../mocks/interactions';
import type { SecurityContext } from '../../middleware/security';

describe('AuditLogger', () => {
  let logger: AuditLogger;
  let context: SecurityContext;
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; warn: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    logger = new AuditLogger('test');
    context = SecurityContextFactory.create();

    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      }),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {
        // Mock implementation
      }),
    };

    // Mock Date.now for consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create logger with environment', () => {
      const prodLogger = new AuditLogger('production');
      expect(prodLogger).toBeInstanceOf(AuditLogger);
    });

    it('should create logger with test environment', () => {
      expect(logger).toBeInstanceOf(AuditLogger);
    });
  });

  describe('log method', () => {
    it('should create basic audit entry', () => {
      logger.log(AuditEventType.RequestReceived, context);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `[INFO] request_received - ${context.requestId}`,
        expect.objectContaining({
          timestamp: '2024-01-01T00:00:00.000Z',
          requestId: context.requestId,
          eventType: AuditEventType.RequestReceived,
          clientIP: context.clientIP,
          userAgent: context.userAgent,
          success: true,
        })
      );
    });

    it('should create audit entry with interaction data', () => {
      const interaction = mockInteractions.registerValid();

      logger.log(AuditEventType.CommandExecuted, context, {
        interaction,
        success: true,
        responseTime: 150,
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `[INFO] command_executed - ${context.requestId}`,
        expect.objectContaining({
          userId: interaction.member?.user?.id,
          guildId: interaction.guild_id,
          channelId: interaction.channel_id,
          commandName: 'register',
          success: true,
          responseTime: 150,
        })
      );
    });

    it('should create audit entry with error details', () => {
      logger.log(AuditEventType.CommandFailed, context, {
        success: false,
        error: 'Invalid command parameters',
        metadata: { reason: 'validation_failed' },
      });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] command_failed - ${context.requestId}`,
        expect.objectContaining({
          success: false,
          error: 'Invalid command parameters',
          metadata: { reason: 'validation_failed' },
        })
      );
    });

    it('should handle interaction with user instead of member', () => {
      const dmInteraction = mockInteractions.directMessage();

      logger.log(AuditEventType.CommandExecuted, context, {
        interaction: dmInteraction,
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: dmInteraction.user?.id,
          guildId: undefined,
        })
      );
    });

    it('should use production logging for production environment', () => {
      const prodLogger = new AuditLogger('production');

      prodLogger.log(AuditEventType.RequestReceived, context);

      // Should log to both console.log and external service
      expect(consoleSpy.log).toHaveBeenCalledTimes(2);

      // Check external service logging format
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('request_received')
      );
    });
  });

  describe('logRequestReceived', () => {
    it('should log request received with method and path', () => {
      logger.logRequestReceived(context, { method: 'POST', path: '/interactions' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `[INFO] request_received - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.RequestReceived,
          metadata: { method: 'POST', path: '/interactions' },
          success: true,
        })
      );
    });
  });

  describe('logRequestVerified', () => {
    it('should log successful request verification', () => {
      logger.logRequestVerified(context);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `[INFO] request_verified - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.RequestVerified,
          success: true,
        })
      );
    });
  });

  describe('logRequestRejected', () => {
    it('should log request rejection with reason', () => {
      const reason = 'Invalid signature';

      logger.logRequestRejected(context, { reason });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] request_rejected - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.RequestRejected,
          success: false,
          error: reason,
        })
      );
    });
  });

  describe('logCommandExecution', () => {
    it('should log successful command execution', () => {
      const interaction = mockInteractions.registerValid();
      const responseTime = 200;

      logger.logCommandExecution(context, { interaction, success: true, responseTime });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `[INFO] command_executed - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.CommandExecuted,
          commandName: 'register',
          success: true,
          responseTime,
        })
      );
    });

    it('should log failed command execution', () => {
      const interaction = mockInteractions.registerInvalid();
      const responseTime = 150;
      const error = 'Invalid tracker URLs';

      logger.logCommandExecution(context, { interaction, success: false, responseTime, error });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] command_failed - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.CommandFailed,
          success: false,
          responseTime,
          error,
        })
      );
    });

    it('should log failed command without error message', () => {
      const interaction = mockInteractions.registerValid();

      logger.logCommandExecution(context, { interaction, success: false, responseTime: 100 });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          eventType: AuditEventType.CommandFailed,
          success: false,
          error: undefined,
        })
      );
    });
  });

  describe('logSecurityViolation', () => {
    it('should log security violation with type and details', () => {
      const violationType = 'xss_attempt';
      const details = 'Script tag detected in input';

      logger.logSecurityViolation(context, { violationType, details });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] security_violation - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.SecurityViolation,
          success: false,
          error: `${violationType}: ${details}`,
          metadata: { violationType },
        })
      );
    });
  });

  describe('logRateLimitExceeded', () => {
    it('should log rate limit exceeded', () => {
      logger.logRateLimitExceeded(context);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] rate_limit_exceeded - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.RateLimitExceeded,
          success: false,
          error: 'Rate limit exceeded',
        })
      );
    });
  });

  describe('logHealthCheck', () => {
    it('should log health check', () => {
      logger.logHealthCheck(context);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `[INFO] health_check - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.HealthCheck,
          success: true,
        })
      );
    });
  });

  describe('logError', () => {
    it('should log error with message', () => {
      const error = 'Database connection failed';

      logger.logError(context, { error });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] error_occurred - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.ErrorOccurred,
          success: false,
          error,
          metadata: undefined,
        })
      );
    });

    it('should log error with metadata', () => {
      const error = 'API request failed';
      const metadata = { statusCode: 500, endpoint: '/api/users' };

      logger.logError(context, { error, metadata });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        `[WARN] error_occurred - ${context.requestId}`,
        expect.objectContaining({
          eventType: AuditEventType.ErrorOccurred,
          success: false,
          error,
          metadata,
        })
      );
    });
  });

  describe('startTiming', () => {
    it('should create timing function', () => {
      vi.useRealTimers();

      const timing = AuditLogger.startTiming();
      expect(typeof timing).toBe('function');
    });

    it('should measure elapsed time', async () => {
      vi.useRealTimers();

      const timing = AuditLogger.startTiming();

      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 15));

      const elapsed = timing();
      expect(elapsed).toBeGreaterThanOrEqual(5); // More tolerant for CI environments
      expect(elapsed).toBeLessThan(100); // Should be reasonable timing
    });

    it('should return different times for multiple calls', async () => {
      vi.useRealTimers();

      const timing = AuditLogger.startTiming();

      await new Promise(resolve => setTimeout(resolve, 5));
      const time1 = timing();

      await new Promise(resolve => setTimeout(resolve, 5));
      const time2 = timing();

      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe('AuditEventType enum', () => {
    it('should have all expected event types', () => {
      expect(AuditEventType.RequestReceived).toBe('request_received');
      expect(AuditEventType.RequestVerified).toBe('request_verified');
      expect(AuditEventType.RequestRejected).toBe('request_rejected');
      expect(AuditEventType.CommandExecuted).toBe('command_executed');
      expect(AuditEventType.CommandFailed).toBe('command_failed');
      expect(AuditEventType.SecurityViolation).toBe('security_violation');
      expect(AuditEventType.RateLimitExceeded).toBe('rate_limit_exceeded');
      expect(AuditEventType.HealthCheck).toBe('health_check');
      expect(AuditEventType.ErrorOccurred).toBe('error_occurred');
    });
  });

  describe('edge cases', () => {
    it('should handle empty metadata', () => {
      logger.log(AuditEventType.RequestReceived, context, {
        metadata: {},
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: {},
        })
      );
    });

    it('should handle undefined options', () => {
      logger.log(AuditEventType.RequestReceived, context, undefined);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle interaction without data', () => {
      const interaction = mockInteractions.ping();

      logger.log(AuditEventType.RequestReceived, context, {
        interaction,
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          commandName: undefined,
        })
      );
    });
  });
});
