/**
 * 🟢 GREEN Phase: Error context and structured logging tests
 * Unit tests for structured-logger.ts focusing on severity classification
 * Following TDD best practices with proper mocking and factories
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createProductionLogger,
  type LogLevel,
  type LogEntry,
  type ProductionLogger,
} from '../../utils/structured-logger';

describe('Structured Logger Unit Tests', () => {
  let consoleMocks: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Mock all console methods
    consoleMocks = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Mock Date.now for consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('createProductionLogger function', () => {
    it('should create logger with specified environment', () => {
      // Arrange & Act
      const logger = createProductionLogger('test');

      // Assert
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should create different logger instances for different environments', () => {
      // Arrange & Act
      const testLogger = createProductionLogger('test');
      const prodLogger = createProductionLogger('production');

      // Assert
      expect(testLogger).not.toBe(prodLogger);
      expect(testLogger).toBeDefined();
      expect(prodLogger).toBeDefined();
    });
  });

  describe('Log Level Severity Classification', () => {
    let logger: ProductionLogger;

    beforeEach(() => {
      logger = createProductionLogger('test');
    });

    describe('info level logging', () => {
      it('should use console.log for info level', () => {
        // Arrange
        const message = 'Information message';

        // Act
        logger.info(message);

        // Assert
        expect(consoleMocks.log).toHaveBeenCalledOnce();
        expect(consoleMocks.warn).not.toHaveBeenCalled();
        expect(consoleMocks.error).not.toHaveBeenCalled();
      });

      it('should create structured log entry for info level', () => {
        // Arrange
        const message = 'Test info message';
        const metadata = { userId: '123', action: 'test' };

        // Act
        logger.info(message, metadata);

        // Assert
        expect(consoleMocks.log).toHaveBeenCalledWith(
          JSON.stringify({
            level: 'info',
            message,
            timestamp: 1704110400000, // 2024-01-01T12:00:00.000Z
            environment: 'test',
            metadata: { userId: '123', action: 'test' },
          })
        );
      });
    });

    describe('warn level logging', () => {
      it('should use console.warn for warn level', () => {
        // Arrange
        const message = 'Warning message';

        // Act
        logger.warn(message);

        // Assert
        expect(consoleMocks.warn).toHaveBeenCalledOnce();
        expect(consoleMocks.log).not.toHaveBeenCalled();
        expect(consoleMocks.error).not.toHaveBeenCalled();
      });

      it('should create structured log entry for warn level', () => {
        // Arrange
        const message = 'Test warning message';
        const metadata = { reason: 'validation_failed', field: 'email' };

        // Act
        logger.warn(message, metadata);

        // Assert
        expect(consoleMocks.warn).toHaveBeenCalledWith(
          JSON.stringify({
            level: 'warn',
            message,
            timestamp: 1704110400000,
            environment: 'test',
            metadata: { reason: 'validation_failed', field: 'email' },
          })
        );
      });
    });

    describe('error level logging', () => {
      it('should use console.error for error level', () => {
        // Arrange
        const message = 'Error message';

        // Act
        logger.error(message);

        // Assert
        expect(consoleMocks.error).toHaveBeenCalledOnce();
        expect(consoleMocks.log).not.toHaveBeenCalled();
        expect(consoleMocks.warn).not.toHaveBeenCalled();
      });

      it('should create structured log entry for error level', () => {
        // Arrange
        const message = 'Critical error occurred';
        const metadata = { errorCode: 500, stack: 'Error stack trace' };

        // Act
        logger.error(message, metadata);

        // Assert
        expect(consoleMocks.error).toHaveBeenCalledWith(
          JSON.stringify({
            level: 'error',
            message,
            timestamp: 1704110400000,
            environment: 'test',
            metadata: { errorCode: 500, stack: 'Error stack trace' },
          })
        );
      });
    });

    describe('debug level logging', () => {
      it('should use console.log for debug level', () => {
        // Arrange
        const message = 'Debug message';

        // Act
        logger.debug(message);

        // Assert
        expect(consoleMocks.log).toHaveBeenCalledOnce();
        expect(consoleMocks.warn).not.toHaveBeenCalled();
        expect(consoleMocks.error).not.toHaveBeenCalled();
      });

      it('should create structured log entry for debug level', () => {
        // Arrange
        const message = 'Debug information';
        const metadata = { step: 'validation', duration: 150 };

        // Act
        logger.debug(message, metadata);

        // Assert
        expect(consoleMocks.log).toHaveBeenCalledWith(
          JSON.stringify({
            level: 'debug',
            message,
            timestamp: 1704110400000,
            environment: 'test',
            metadata: { step: 'validation', duration: 150 },
          })
        );
      });
    });
  });

  describe('Metadata Sanitization Security', () => {
    let logger: ProductionLogger;

    beforeEach(() => {
      logger = createProductionLogger('test');
    });

    it('should remove sensitive keys from metadata', () => {
      // Arrange
      const message = 'User action logged';
      const sensitiveMetadata = {
        userId: '123',
        discordToken: 'secret_token_123',
        password: 'user_password',
        token: 'api_token_456',
        secret: 'secret_value',
        key: 'private_key_789',
        auth: 'auth_header',
        authorization: 'Bearer token',
        normalField: 'safe_value',
      };

      // Act
      logger.info(message, sensitiveMetadata);

      // Assert
      const logCall = consoleMocks.log.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.metadata).toEqual({
        userId: '123',
        normalField: 'safe_value',
      });
    });

    it('should handle case-insensitive sensitive key detection', () => {
      // Arrange
      const message = 'Mixed case sensitive keys';
      const mixedCaseMetadata = {
        userToken: 'should_be_removed',
        ACCESS_KEY: 'should_be_removed',
        MySecret: 'should_be_removed',
        authHeader: 'should_be_removed',
        normalValue: 'should_remain',
      };

      // Act
      logger.warn(message, mixedCaseMetadata);

      // Assert
      const logCall = consoleMocks.warn.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.metadata).toEqual({
        normalValue: 'should_remain',
      });
    });

    it('should handle metadata with no sensitive keys', () => {
      // Arrange
      const message = 'Safe metadata only';
      const safeMetadata = {
        userId: '456',
        action: 'register_command',
        duration: 200,
        success: true,
      };

      // Act
      logger.debug(message, safeMetadata);

      // Assert
      const logCall = consoleMocks.log.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.metadata).toEqual(safeMetadata);
    });

    it('should handle empty metadata object', () => {
      // Arrange
      const message = 'Empty metadata test';

      // Act
      logger.error(message, {});

      // Assert
      const logCall = consoleMocks.error.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.metadata).toEqual({});
    });

    it('should handle undefined metadata', () => {
      // Arrange
      const message = 'No metadata provided';

      // Act
      logger.info(message);

      // Assert
      const logCall = consoleMocks.log.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.metadata).toBeUndefined();
    });
  });

  describe('Structured Log Entry Format', () => {
    let logger: ProductionLogger;

    beforeEach(() => {
      logger = createProductionLogger('production');
    });

    it('should create log entry with all required fields', () => {
      // Arrange
      const message = 'Complete log entry test';
      const metadata = { requestId: 'req-123', userId: 'user-456' };

      // Act
      logger.info(message, metadata);

      // Assert
      const logCall = consoleMocks.log.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;

      expect(logEntry).toEqual({
        level: 'info',
        message: 'Complete log entry test',
        timestamp: 1704110400000,
        environment: 'production',
        metadata: { requestId: 'req-123', userId: 'user-456' },
      });
    });

    it('should create log entry without metadata when not provided', () => {
      // Arrange
      const message = 'Log without metadata';

      // Act
      logger.warn(message);

      // Assert
      const logCall = consoleMocks.warn.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;

      expect(logEntry).toEqual({
        level: 'warn',
        message: 'Log without metadata',
        timestamp: 1704110400000,
        environment: 'production',
      });
    });

    it('should handle different environment values', () => {
      // Arrange
      const testLogger = createProductionLogger('development');
      const message = 'Environment test';

      // Act
      testLogger.error(message);

      // Assert
      const logCall = consoleMocks.error.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;

      expect(logEntry.environment).toBe('development');
    });

    it('should use current timestamp for each log entry', () => {
      // Arrange
      const logger1 = createProductionLogger('test');
      const logger2 = createProductionLogger('test');

      // Act - Log at different times
      logger1.info('First message');

      vi.setSystemTime(new Date('2024-01-01T12:05:00.000Z'));
      logger2.info('Second message');

      // Assert
      const firstCall = consoleMocks.log.mock.calls[0];
      const secondCall = consoleMocks.log.mock.calls[1];
      expect(firstCall).toBeDefined();
      expect(secondCall).toBeDefined();
      const firstEntry = JSON.parse(firstCall![0] as string) as LogEntry;
      const secondEntry = JSON.parse(secondCall![0] as string) as LogEntry;

      expect(firstEntry.timestamp).toBe(1704110400000); // 12:00:00
      expect(secondEntry.timestamp).toBe(1704110700000); // 12:05:00
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let logger: ProductionLogger;

    beforeEach(() => {
      logger = createProductionLogger('test');
    });

    it('should handle very long log messages', () => {
      // Arrange
      const longMessage = 'x'.repeat(10000);

      // Act
      logger.info(longMessage);

      // Assert
      expect(consoleMocks.log).toHaveBeenCalledOnce();
      const logCall = consoleMocks.log.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.message).toBe(longMessage);
    });

    it('should handle special characters in log messages', () => {
      // Arrange
      const specialMessage = 'Message with "quotes" and \n newlines \t tabs';
      const metadata = { field: 'value with "quotes"' };

      // Act
      logger.warn(specialMessage, metadata);

      // Assert
      expect(consoleMocks.warn).toHaveBeenCalledOnce();
      const logCall = consoleMocks.warn.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.message).toBe(specialMessage);
      expect(logEntry.metadata?.['field']).toBe('value with "quotes"');
    });

    it('should handle complex nested metadata objects', () => {
      // Arrange
      const complexMetadata = {
        user: {
          id: '123',
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        request: {
          id: 'req-456',
          headers: {
            'user-agent': 'test-agent',
            'content-type': 'application/json',
          },
        },
      };

      // Act
      logger.debug('Complex metadata test', complexMetadata);

      // Assert
      expect(consoleMocks.log).toHaveBeenCalledOnce();
      const logCall = consoleMocks.log.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;
      expect(logEntry.metadata).toEqual(complexMetadata);
    });

    it('should handle null and undefined values in metadata', () => {
      // Arrange
      const metadataWithNulls = {
        definedValue: 'test',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zeroNumber: 0,
        falseBoolean: false,
      };

      // Act
      logger.error('Null values test', metadataWithNulls);

      // Assert
      expect(consoleMocks.error).toHaveBeenCalledOnce();
      const logCall = consoleMocks.error.mock.calls[0];
      expect(logCall).toBeDefined();
      const logEntry = JSON.parse(logCall![0] as string) as LogEntry;

      // JSON.stringify will remove undefined values but keep null
      expect(logEntry.metadata).toEqual({
        definedValue: 'test',
        nullValue: null,
        emptyString: '',
        zeroNumber: 0,
        falseBoolean: false,
      });
    });
  });

  describe('LogLevel Type Safety', () => {
    it('should accept valid log levels', () => {
      // Arrange
      const validLevels: LogLevel[] = ['info', 'warn', 'error', 'debug'];

      // Act & Assert - Should compile without errors
      for (const level of validLevels) {
        expect(typeof level).toBe('string');
        expect(['info', 'warn', 'error', 'debug']).toContain(level);
      }
    });

    it('should create LogEntry interface with correct types', () => {
      // Arrange
      const logEntry: LogEntry = {
        level: 'info',
        message: 'Test message',
        timestamp: Date.now(),
        environment: 'test',
        metadata: { key: 'value' },
      };

      // Act & Assert - Type checking at compile time
      expect(logEntry.level).toBe('info');
      expect(typeof logEntry.message).toBe('string');
      expect(typeof logEntry.timestamp).toBe('number');
      expect(typeof logEntry.environment).toBe('string');
      expect(typeof logEntry.metadata).toBe('object');
    });

    it('should create ProductionLogger interface with correct method signatures', () => {
      // Arrange
      const logger = createProductionLogger('test');

      // Act & Assert - Type checking at compile time
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');

      // Verify methods can be called with correct parameters
      logger.info('test');
      logger.warn('test', {});
      logger.error('test', { key: 'value' });
      logger.debug('test', { nested: { key: 'value' } });

      expect(consoleMocks.log).toHaveBeenCalledTimes(2); // info and debug
      expect(consoleMocks.warn).toHaveBeenCalledTimes(1);
      expect(consoleMocks.error).toHaveBeenCalledTimes(1);
    });
  });
});
