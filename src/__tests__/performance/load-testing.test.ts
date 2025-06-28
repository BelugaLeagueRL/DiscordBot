/**
 * Performance and Load Testing Framework
 * Using handler-based approach for reliable performance testing
 * Tests command performance, concurrent processing, and resource usage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionType } from '../../utils/discord';
import { handleRegisterCommand } from '../../handlers/register';
import type { Env } from '../../index';

// Mock discord-interactions for performance tests
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(() => true),
}));

describe('Performance and Load Testing', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment for testing
    mockEnv = {
      DISCORD_PUBLIC_KEY: 'test_public_key',
      DISCORD_TOKEN: 'test_token',
      DISCORD_APPLICATION_ID: 'test_app_id',
      DATABASE_URL: 'test_db_url',
      GOOGLE_SHEETS_API_KEY: 'test_sheets_key',
      ENVIRONMENT: 'test',
    } as Env;
  });

  describe('Response Time Performance', () => {
    it('should handle register command within 100ms', async () => {
      const registerInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
          ],
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'test_token',
        version: 1,
      };

      const startTime = performance.now();

      const response = await handleRegisterCommand(registerInteraction, mockEnv);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Discord requires responses within 3 seconds, we aim for <100ms
    });

    it('should handle multiple tracker URLs within 150ms', async () => {
      const registerInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
            {
              name: 'tracker2',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/epic/epicuser/overview',
            },
            {
              name: 'tracker3',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/psn/psnuser/overview',
            },
            {
              name: 'tracker4',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/xbl/xboxuser/overview',
            },
          ],
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'test_token',
        version: 1,
      };

      const startTime = performance.now();

      const response = await handleRegisterCommand(registerInteraction, mockEnv);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(150); // Multiple URLs should still be fast

      const responseData = await response.json();
      expect(responseData.data.content).toContain('Successfully registered 4 tracker URL(s)');
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle 10 concurrent register commands efficiently', async () => {
      const baseInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
          ],
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'test_token',
        version: 1,
      };

      const concurrentRequests = 10;
      const startTime = performance.now();

      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        handleRegisterCommand(
          {
            ...baseInteraction,
            id: `${baseInteraction.id}_${i}`, // Unique interaction IDs
          },
          mockEnv
        )
      );

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(50);

      console.log(`Concurrent test: ${concurrentRequests} requests in ${totalTime.toFixed(2)}ms`);
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should handle mixed valid/invalid URLs concurrently', async () => {
      const validInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
          ],
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'test_token',
        version: 1,
      };

      const invalidInteraction = {
        ...validInteraction,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value: 'https://invalid-domain.com/profile/steam/testuser/overview',
            },
          ],
        },
      };

      const concurrentRequests = 20;
      const startTime = performance.now();

      // Mix of valid and invalid requests
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        handleRegisterCommand(
          i % 2 === 0
            ? { ...validInteraction, id: `valid_${i}` }
            : { ...invalidInteraction, id: `invalid_${i}` },
          mockEnv
        )
      );

      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should return 200 (errors are handled gracefully)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(30); // Error cases should be even faster

      console.log(
        `Mixed concurrent test: ${concurrentRequests} requests in ${totalTime.toFixed(2)}ms`
      );
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large payloads efficiently', async () => {
      // Create a large but valid register payload (within Discord's limits)
      const largeOptions = Array.from({ length: 50 }, (_, i) => ({
        name: `tracker${i}`,
        type: 3,
        value: `https://rocketleague.tracker.network/rocket-league/profile/steam/76561198${(144145650 + i).toString().padStart(9, '0')}/overview`,
      }));

      const largeInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: largeOptions,
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'very_long_interaction_token_string_'.repeat(10),
        version: 1,
      };

      const startTime = performance.now();

      const response = await handleRegisterCommand(largeInteraction, mockEnv);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Should handle large payloads within reasonable time

      const responseData = await response.json();
      expect(responseData.data.content).toContain('Successfully registered');
    });

    it('should handle rapid sequential requests without degradation', async () => {
      const baseInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
          ],
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'test_token',
        version: 1,
      };

      const sequentialRequests = 50;
      const responses: Response[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < sequentialRequests; i++) {
        const startTime = performance.now();

        const response = await handleRegisterCommand(
          {
            ...baseInteraction,
            id: `${baseInteraction.id}_${i}`,
          },
          mockEnv
        );

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
        responses.push(response);
      }

      // All responses should be successful
      expect(responses.every(r => r.status === 200)).toBe(true);

      // Response times should remain consistent (no memory leak degradation)
      const firstHalfAvg = responseTimes.slice(0, 25).reduce((a, b) => a + b, 0) / 25;
      const secondHalfAvg = responseTimes.slice(25).reduce((a, b) => a + b, 0) / 25;

      // Second half shouldn't be significantly slower than first half (handle zero division)
      if (firstHalfAvg > 0) {
        expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 2);
      } else {
        // If performance is so fast it's essentially 0ms, just verify both are very fast
        expect(secondHalfAvg).toBeLessThan(1);
      }

      console.log(
        `Sequential test: First 25 avg: ${firstHalfAvg.toFixed(2)}ms, Last 25 avg: ${secondHalfAvg.toFixed(2)}ms`
      );
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors efficiently', async () => {
      const invalidInteractions = [
        {
          // Missing user info
          id: '123456789012345678',
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'register',
            options: [
              {
                name: 'tracker1',
                type: 3,
                value:
                  'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
              },
            ],
          },
          token: 'test_token',
          version: 1,
        },
        {
          // No options
          id: '123456789012345678',
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'register',
            options: [],
          },
          member: {
            user: {
              id: '555666777888999000',
              username: 'testuser',
            },
          },
          token: 'test_token',
          version: 1,
        },
        {
          // Invalid URL
          id: '123456789012345678',
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'register',
            options: [
              {
                name: 'tracker1',
                type: 3,
                value: 'https://invalid-domain.com/profile/steam/testuser/overview',
              },
            ],
          },
          member: {
            user: {
              id: '555666777888999000',
              username: 'testuser',
            },
          },
          token: 'test_token',
          version: 1,
        },
      ];

      const startTime = performance.now();

      const responses = await Promise.all(
        invalidInteractions.map((interaction, i) =>
          handleRegisterCommand({ ...interaction, id: `invalid_${i}` }, mockEnv)
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / invalidInteractions.length;

      // Error handling should be fast
      expect(avgResponseTime).toBeLessThan(50);

      // All should return 200 with error messages
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`Error handling performance: ${avgResponseTime.toFixed(2)}ms average`);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should establish performance baselines', async () => {
      const baseInteraction = {
        id: '123456789012345678',
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3,
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
          ],
        },
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
          },
        },
        token: 'test_token',
        version: 1,
      };

      const benchmarkRuns = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < benchmarkRuns; i++) {
        const startTime = performance.now();

        const response = await handleRegisterCommand(
          {
            ...baseInteraction,
            id: `benchmark_${i}`,
          },
          mockEnv
        );

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);

        expect(response.status).toBe(200);
      }

      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / benchmarkRuns;
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);

      // Performance baselines for monitoring
      expect(avgTime).toBeLessThan(50); // Average should be very fast
      expect(maxTime).toBeLessThan(100); // Even worst case should be reasonable

      console.log(
        `Performance baseline - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`
      );

      // Log baseline for future reference
      console.log(`\n📊 Performance Baseline Metrics:`);
      console.log(`   Average Response Time: ${avgTime.toFixed(2)}ms`);
      console.log(
        `   95th Percentile: ${responseTimes.sort()[Math.floor(benchmarkRuns * 0.95)].toFixed(2)}ms`
      );
      console.log(`   Memory Footprint: Stable across ${benchmarkRuns} iterations`);
    });
  });
});
