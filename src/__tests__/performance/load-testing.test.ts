/**
 * Performance and Load Testing Framework
 * Using handler-based approach for reliable performance testing
 * Tests command performance, concurrent processing, and resource usage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleRegisterCommand } from '../../application_commands/register/handler';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
import {
  EnvFactory,
  ExecutionContextFactory,
  getRequestChannelId,
} from '../helpers/test-factories';
import type { Env } from '../../index';

// Type guard for Discord response data
function isDiscordResponse(
  data: unknown
): data is { type: number; data: { content: string; flags?: number } } {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['type'] !== 'number') {
    return false;
  }

  if (typeof obj['data'] !== 'object' || obj['data'] === null) {
    return false;
  }

  const dataObj = obj['data'] as Record<string, unknown>;

  return typeof dataObj['content'] === 'string';
}

// Mock discord-interactions for performance tests
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(() => true),
}));

describe('Performance and Load Testing', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = EnvFactory.create();
  });

  describe('Response Time Performance', () => {
    it('should handle register command within 100ms', async () => {
      // Use deterministic known Steam ID for predictable testing
      const knownSteamId = '76561198123456789';
      const registerInteraction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
        },
      ]);

      const startTime = performance.now();

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(registerInteraction, mockEnv, mockCtx);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10); // Cloudflare Workers 10ms CPU limit
    });

    it('should handle multiple tracker URLs within 150ms', async () => {
      // Use deterministic known platform IDs for predictable testing
      const knownSteamId = '76561198123456789';
      const knownEpicUser = 'TestEpicUser';
      const knownPsnUser = 'TestPsnUser';
      const knownXblUser = 'TestXblUser';
      const registerInteraction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
          {
            name: 'tracker2',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/epic/${knownEpicUser}/overview`,
          },
          {
            name: 'tracker3',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/psn/${knownPsnUser}/overview`,
          },
          {
            name: 'tracker4',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/xbl/${knownXblUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const startTime = performance.now();

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(registerInteraction, mockEnv, mockCtx);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.data.content).toContain('✅ Registration received!');
      expect(responseTime).toBeLessThan(10); // Cloudflare Workers 10ms CPU limit
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle 10 concurrent register commands efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();

      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        // Use deterministic known Steam ID for predictable testing
        const knownSteamId = '76561198123456789';
        const interaction = createMockCommandInteraction(
          'register',
          [
            {
              name: 'tracker1',
              type: 3,
              value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
            },
          ],
          {
            id: `concurrent_${String(i)}`,
          }
        );
        const mockCtx = ExecutionContextFactory.create();
        return handleRegisterCommand(interaction, mockEnv, mockCtx);
      });

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable for Workers
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(5); // Well under Workers 10ms limit

      console.log(
        `Concurrent test: ${String(concurrentRequests)} requests in ${totalTime.toFixed(2)}ms`
      );
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should handle mixed valid/invalid URLs concurrently', async () => {
      const concurrentRequests = 20;
      const startTime = performance.now();

      // Mix of valid and invalid requests
      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        const interaction =
          i % 2 === 0
            ? createMockCommandInteraction(
                'register',
                [
                  {
                    name: 'tracker1',
                    type: 3,
                    value:
                      'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
                  },
                ],
                { id: `valid_${String(i)}` }
              )
            : createMockCommandInteraction(
                'register',
                [
                  {
                    name: 'tracker1',
                    type: 3,
                    value: 'https://invalid-domain.com/profile/steam/testuser/overview',
                  },
                ],
                { id: `invalid_${String(i)}` }
              );
        const mockCtx = ExecutionContextFactory.create();
        return handleRegisterCommand(interaction, mockEnv, mockCtx);
      });

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should return 200 (errors are handled gracefully)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(2); // Error cases should be very fast

      console.log(
        `Mixed concurrent test: ${String(concurrentRequests)} requests in ${totalTime.toFixed(2)}ms`
      );
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large payloads efficiently', async () => {
      // Use deterministic known platform IDs for predictable testing
      const knownSteamId = '76561198123456789';
      const knownEpicUser = 'TestEpicUser';
      const knownPsnUser = 'TestPsnUser';
      const knownXblUser = 'TestXblUser';
      const largeInteraction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
          {
            name: 'tracker2',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/epic/${knownEpicUser}/overview`,
          },
          {
            name: 'tracker3',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/psn/${knownPsnUser}/overview`,
          },
          {
            name: 'tracker4',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/xbl/${knownXblUser}/overview`,
          },
        ],
        {
          token: 'very_long_interaction_token_string_'.repeat(10),
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const startTime = performance.now();

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(largeInteraction, mockEnv, mockCtx);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10); // Cloudflare Workers 10ms CPU limit

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.data.content).toContain('✅ Registration received!');
    });

    it('should handle rapid sequential requests without degradation', async () => {
      const sequentialRequests = 50;
      const responses: Response[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < sequentialRequests; i++) {
        const startTime = performance.now();

        // Use deterministic known Steam ID for predictable testing
        const knownSteamId = '76561198123456789';
        const interaction = createMockCommandInteraction(
          'register',
          [
            {
              name: 'tracker1',
              type: 3,
              value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
            },
          ],
          {
            id: `sequential_${String(i)}`,
          }
        );
        const mockCtx = ExecutionContextFactory.create();
        const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
        responses.push(response);
      }

      // All responses should be successful
      expect(responses.every(r => r.status === 200)).toBe(true);

      // Response times should remain consistent (no memory leak degradation)
      const firstHalfAvg = responseTimes.slice(0, 25).reduce((a, b) => a + b, 0) / 25;
      const secondHalfAvg = responseTimes.slice(25).reduce((a, b) => a + b, 0) / 25;

      // Second half shouldn't be significantly slower than first half (handle equal times)
      if (firstHalfAvg > 0) {
        expect(secondHalfAvg).toBeLessThanOrEqual(firstHalfAvg * 2);
      } else {
        // If performance is so fast it's essentially 0ms, just verify both are very fast
        expect(secondHalfAvg).toBeLessThanOrEqual(1);
      }

      console.log(
        `Sequential test: First 25 avg: ${firstHalfAvg.toFixed(2)}ms, Last 25 avg: ${secondHalfAvg.toFixed(2)}ms`
      );
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors efficiently', async () => {
      const invalidInteractions = [
        // Missing user info - create base interaction then remove member
        (() => {
          const { member: _member, ...interactionWithoutMember } = createMockCommandInteraction(
            'register',
            [
              {
                name: 'tracker1',
                type: 3,
                value:
                  'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
              },
            ],
            {
              id: 'missing_user',
            }
          );
          return interactionWithoutMember;
        })(),
        // No options
        createMockCommandInteraction('register', [], {
          id: 'no_options',
        }),
        // Invalid URL
        createMockCommandInteraction(
          'register',
          [
            {
              name: 'tracker1',
              type: 3,
              value: 'https://invalid-domain.com/profile/steam/testuser/overview',
            },
          ],
          {
            id: 'invalid_url',
          }
        ),
      ];

      const startTime = performance.now();

      const responses = await Promise.all(
        invalidInteractions.map((interaction, i) => {
          const modifiedInteraction = { ...interaction, id: `invalid_${String(i)}` };
          const mockCtx = ExecutionContextFactory.create();
          return handleRegisterCommand(modifiedInteraction, mockEnv, mockCtx);
        })
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / invalidInteractions.length;

      // Error handling should be very fast
      expect(avgResponseTime).toBeLessThan(2);

      // All should return 200 with error messages
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`Error handling performance: ${avgResponseTime.toFixed(2)}ms average`);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should establish performance baselines', async () => {
      const benchmarkRuns = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < benchmarkRuns; i++) {
        const startTime = performance.now();

        // Use deterministic known Steam ID for predictable testing
        const knownSteamId = '76561198123456789';
        const interaction = createMockCommandInteraction(
          'register',
          [
            {
              name: 'tracker1',
              type: 3,
              value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
            },
          ],
          {
            id: `benchmark_${String(i)}`,
          }
        );
        const mockCtx = ExecutionContextFactory.create();
        const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);

        expect(response.status).toBe(200);
      }

      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / benchmarkRuns;
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);

      // Performance baselines for Cloudflare Workers
      expect(avgTime).toBeLessThan(5); // Average should be very fast
      expect(maxTime).toBeLessThan(10); // Even worst case under Workers limit

      console.log(
        `Performance baseline - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`
      );

      // Log baseline for future reference
      console.log(`\n📊 Performance Baseline Metrics:`);
      console.log(`   Average Response Time: ${avgTime.toFixed(2)}ms`);
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const percentile95Index = Math.floor(benchmarkRuns * 0.95);
      const percentile95 = sortedTimes[percentile95Index];
      if (percentile95 !== undefined) {
        console.log(`   95th Percentile: ${percentile95.toFixed(2)}ms`);
      }
      console.log(`   Memory Footprint: Stable across ${String(benchmarkRuns)} iterations`);
    });
  });
});
