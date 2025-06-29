/**
 * Structured JSON logging for Cloudflare Workers tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductionLogger } from '../../utils/structured-logger';

describe('Structured JSON Logging', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods for Workers environment
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Empty implementation for testing
    });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Empty implementation for testing
    });
  });

  it('should log structured JSON format for Workers Logs', () => {
    const logger = createProductionLogger('production');

    logger.info('Test message', { userId: '123', action: 'register' });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logCall = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as {
      level: string;
      message: string;
      environment: string;
      timestamp: number;
      metadata: Record<string, unknown>;
    };

    expect(logCall).toMatchObject({
      level: 'info',
      message: 'Test message',
      environment: 'production',
      metadata: { userId: '123', action: 'register' },
    });
    expect(logCall.timestamp).toBeTypeOf('number');
  });

  it('should log errors with proper structure for Workers observability', () => {
    const logger = createProductionLogger('production');
    const error = new Error('Test error');

    logger.error('Operation failed', { error: error.message, stack: error.stack });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const errorCall = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as {
      level: string;
      message: string;
      environment: string;
      timestamp: number;
      metadata: { error: string; stack: string };
    };

    expect(errorCall).toMatchObject({
      level: 'error',
      message: 'Operation failed',
      environment: 'production',
      metadata: { error: 'Test error' },
    });
    expect(errorCall.timestamp).toBeTypeOf('number');
    expect(errorCall.metadata.stack).toBeTypeOf('string');
  });

  it('should filter out sensitive data from logs', () => {
    const logger = createProductionLogger('production');

    logger.info('User action', {
      userId: '123',
      discordToken: 'secret_token',
      password: 'secret123',
      data: 'safe_data',
    });

    const logCall = logSpy.mock.calls[0]?.[0] as string;
    const logData = JSON.parse(logCall) as { metadata: Record<string, unknown> };

    expect(logData.metadata).not.toHaveProperty('discordToken');
    expect(logData.metadata).not.toHaveProperty('password');
    expect(logData.metadata).toHaveProperty('userId', '123');
    expect(logData.metadata).toHaveProperty('data', 'safe_data');
  });
});
