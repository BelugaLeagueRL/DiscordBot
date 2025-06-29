/**
 * Response routing for Discord application commands
 * Routes command responses to designated channels
 * STUB: Will be implemented in TDD cycle
 */

import type { Env } from '../../index';

export interface ResponseRoutingResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Route response message to configured channel
 * STUB: Minimal implementation for tests to run
 */
export function routeResponseToChannel(
  _message: string,
  env: Readonly<Env>
): Promise<ResponseRoutingResult> {
  // STUB: Minimal implementation
  if (env.SERVER_CHANNEL_ID_TEST_COMMAND_RECEIVE === undefined) {
    return Promise.resolve({
      success: false,
      error: 'Response channel not configured.',
    });
  }

  // STUB: Always return success for now
  return Promise.resolve({
    success: true,
  });
}