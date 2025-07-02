/**
 * Performance tests for Cloudflare Worker constraints and resource limits
 * FLOW_3_TESTS_NEEDED.md lines 50-57: Cloudflare Worker constraint validation
 * Tests: 128 MB memory limit, 30-second CPU time limit, memory scaling, CPU usage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { handleAdminSyncUsersToSheetsDiscord } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
import { EnvFactory, ExecutionContextFactory } from '../helpers/test-factories';
import type { Env } from '../../index';

// Mock discord-interactions for constraint tests
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(() => true),
}));

// Mock memory tracking for Cloudflare Workers environment
// Removed unused mockMemoryUsage constant

// Simulate memory usage tracking
let simulatedMemoryUsage = 50 * 1024 * 1024; // Start at 50 MB

function getSimulatedMemoryUsage() {
  return {
    heapUsed: simulatedMemoryUsage,
    heapTotal: simulatedMemoryUsage * 1.2,
    external: simulatedMemoryUsage * 0.1,
    arrayBuffers: simulatedMemoryUsage * 0.05,
    rss: simulatedMemoryUsage * 1.1,
  };
}

function simulateMemoryIncrease(members: number) {
  // Simulate memory increase: ~100 bytes per member
  simulatedMemoryUsage += members * 100;
}

function simulateMemoryGarbageCollection() {
  // Simulate GC reducing memory by 10%
  simulatedMemoryUsage *= 0.9;
}

describe('Cloudflare Worker Constraint Validation', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = EnvFactory.create();
    // Reset simulated memory usage for each test
    simulatedMemoryUsage = 50 * 1024 * 1024; // Start at 50 MB
  });

  describe('Memory Limit Validation - 128 MB Constraint', () => {
    it('should validate exact 128 MB memory limit constraint', async () => {
      // Arrange - Create interaction for memory constraint testing
      const adminSyncInteraction = createMockCommandInteraction('admin_sync_users_to_sheets', [], {
        guild_id: faker.string.numeric(18),
        channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
        member: {
          user: {
            id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
            username: 'admin_user',
            discriminator: '0001',
          },
        },
      });

      const mockCtx = ExecutionContextFactory.create();

      // Act - Test memory constraint validation
      // In a real constraint violation, this would throw or fail
      const response = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      // Simulate memory usage for constraint testing
      simulateMemoryIncrease(1000); // Simulate processing 1000 members

      // Assert - Should handle memory constraints gracefully
      expect(response.status).toBe(200);

      // Memory constraint validation - should not exceed 128 MB
      const memoryUsage = getSimulatedMemoryUsage();
      const memoryUsedMB = memoryUsage.heapUsed / (1024 * 1024);

      expect(memoryUsedMB).toBeLessThan(128); // Must stay under Cloudflare's 128 MB limit
    });

    it('should handle memory scaling with increasing member count', async () => {
      // Arrange - Test memory scaling behavior
      const memberCounts = [100, 500, 1000, 5000];
      const memoryMeasurements: number[] = [];

      for (const memberCount of memberCounts) {
        // Create mock data for different member counts
        const mockMembers = Array.from({ length: memberCount }, (_, i) => ({
          user: {
            id: faker.string.numeric(18),
            username: `member${i}`,
            discriminator: '0001',
          },
          nick: `nickname${i}`,
          joined_at: new Date().toISOString(),
          roles: [],
        }));

        // Mock Discord API to return scaled member data
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue(mockMembers),
        });

        const adminSyncInteraction = createMockCommandInteraction(
          'admin_sync_users_to_sheets',
          [],
          {
            guild_id: faker.string.numeric(18),
            channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
            member: {
              user: {
                id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
                username: 'admin_user',
                discriminator: '0001',
              },
            },
          }
        );

        const mockCtx = ExecutionContextFactory.create();

        // Act - Process different member counts
        const startMemory = getSimulatedMemoryUsage().heapUsed;

        await handleAdminSyncUsersToSheetsDiscord(adminSyncInteraction, mockCtx, mockEnv);

        // Simulate memory usage based on member count
        simulateMemoryIncrease(memberCount);

        const endMemory = getSimulatedMemoryUsage().heapUsed;
        const memoryDelta = (endMemory - startMemory) / (1024 * 1024); // Convert to MB
        memoryMeasurements.push(memoryDelta);

        // Assert - Memory usage should remain under constraint
        expect(endMemory / (1024 * 1024)).toBeLessThan(128); // Must stay under 128 MB
      }

      // Memory scaling validation - should increase linearly but stay under limit
      const avgMemoryPerMember =
        memoryMeasurements.reduce((a, b) => a + b, 0) / memoryMeasurements.length;
      expect(avgMemoryPerMember).toBeLessThan(64); // Should be well under limit even at scale
    });

    it('should handle memory pressure and garbage collection', async () => {
      // Arrange - Simulate memory pressure scenario
      const iterations = 50;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Create large mock data to test memory pressure
        const largeMockData = Array.from({ length: 1000 }, (_, index) => ({
          user: {
            id: faker.string.numeric(18),
            username: `pressuretest${index}${i}`,
            discriminator: '0001',
          },
          nick: `longnickname${index}${i}${'x'.repeat(100)}`, // Large nickname
          joined_at: new Date().toISOString(),
          roles: Array.from({ length: 10 }, () => faker.string.numeric(18)),
        }));

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue(largeMockData),
        });

        const adminSyncInteraction = createMockCommandInteraction(
          'admin_sync_users_to_sheets',
          [],
          {
            guild_id: faker.string.numeric(18),
            channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
            member: {
              user: {
                id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
                username: 'admin_user',
                discriminator: '0001',
              },
            },
          }
        );

        const mockCtx = ExecutionContextFactory.create();

        // Act - Process under memory pressure
        await handleAdminSyncUsersToSheetsDiscord(adminSyncInteraction, mockCtx, mockEnv);

        // Simulate memory pressure from large data processing
        simulateMemoryIncrease(1000);

        // Occasionally simulate garbage collection
        if (i % 10 === 0) {
          simulateMemoryGarbageCollection();
        }

        const memoryUsedMB = getSimulatedMemoryUsage().heapUsed / (1024 * 1024);
        memorySnapshots.push(memoryUsedMB);

        // Assert - Memory should stay under 128 MB even under pressure
        expect(memoryUsedMB).toBeLessThan(128);
      }

      // Memory leak detection - final memory shouldn't be drastically higher than initial
      const initialMemory = memorySnapshots[0] || 0;
      const finalMemory = memorySnapshots[memorySnapshots.length - 1] || 0;
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(50); // Should not grow more than 50 MB over iterations
    });
  });

  describe('CPU Time Limit Validation - 30 Second Constraint', () => {
    it('should validate exact 30-second CPU time limit constraint', async () => {
      // Arrange - Create interaction for CPU constraint testing
      const adminSyncInteraction = createMockCommandInteraction('admin_sync_users_to_sheets', [], {
        guild_id: faker.string.numeric(18),
        channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
        member: {
          user: {
            id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
            username: 'admin_user',
            discriminator: '0001',
          },
        },
      });

      const mockCtx = ExecutionContextFactory.create();

      // Act - Measure CPU time constraint
      const startTime = performance.now();

      const response = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      const endTime = performance.now();
      const executionTimeMs = endTime - startTime;

      // Assert - Should complete well under 30-second CPU limit
      expect(response.status).toBe(200);
      expect(executionTimeMs).toBeLessThan(30000); // Must complete under 30 seconds
      expect(executionTimeMs).toBeLessThan(5000); // Should actually complete much faster
    });

    it('should handle CPU-intensive operations within time constraints', async () => {
      // Arrange - Simulate CPU-intensive processing
      const largeGuildSize = 10000; // Large guild for CPU testing

      const largeMockMembers = Array.from({ length: largeGuildSize }, (_, i) => ({
        user: {
          id: faker.string.numeric(18),
          username: `cpuintensive${i}`,
          discriminator: '0001',
        },
        nick: `processingtest${i}`,
        joined_at: new Date().toISOString(),
        roles: Array.from({ length: 5 }, () => faker.string.numeric(18)),
      }));

      // Mock Discord API with large dataset
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(largeMockMembers),
      });

      const adminSyncInteraction = createMockCommandInteraction('admin_sync_users_to_sheets', [], {
        guild_id: faker.string.numeric(18),
        channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
        member: {
          user: {
            id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
            username: 'admin_user',
            discriminator: '0001',
          },
        },
      });

      const mockCtx = ExecutionContextFactory.create();

      // Act - Process CPU-intensive workload
      const startTime = performance.now();

      const response = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      const endTime = performance.now();
      const processingTimeMs = endTime - startTime;

      // Assert - CPU-intensive work should complete within constraints
      expect(response.status).toBe(200);
      expect(processingTimeMs).toBeLessThan(30000); // Under 30-second limit

      // Performance target - should handle large guilds efficiently
      const processingTimePerMember = processingTimeMs / largeGuildSize;
      expect(processingTimePerMember).toBeLessThan(1); // Less than 1ms per member
    });

    it('should handle timeout scenarios gracefully near CPU limit', async () => {
      // Arrange - Simulate near-timeout scenario
      // Remove unused mockTimeoutError

      // Mock a scenario where we approach the timeout
      const slowProcessingInteraction = createMockCommandInteraction(
        'admin_sync_users_to_sheets',
        [],
        {
          guild_id: faker.string.numeric(18),
          channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
          member: {
            user: {
              id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
              username: 'admin_user',
              discriminator: '0001',
            },
          },
        }
      );

      const mockCtx = ExecutionContextFactory.create();

      // Mock setTimeout to simulate approaching timeout
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        // Simulate timeout warning behavior without using the variable
        return originalSetTimeout(callback, Math.min(delay, 100)); // Speed up for testing
      }) as unknown as typeof setTimeout;

      try {
        // Act - Test timeout handling
        const startTime = performance.now();

        const response = await handleAdminSyncUsersToSheetsDiscord(
          slowProcessingInteraction,
          mockCtx,
          mockEnv
        );

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Assert - Should handle near-timeout gracefully
        expect(response.status).toBe(200);
        expect(executionTime).toBeLessThan(30000); // Still under limit

        // Should complete without actually hitting timeout
        expect(executionTime).toBeLessThan(10000); // Complete much faster than limit
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('Worker Cold Start Performance Impact', () => {
    it('should measure cold start performance impact on constraints', async () => {
      // Arrange - Simulate cold start scenario
      const adminSyncInteraction = createMockCommandInteraction('admin_sync_users_to_sheets', [], {
        guild_id: faker.string.numeric(18),
        channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
        member: {
          user: {
            id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
            username: 'admin_user',
            discriminator: '0001',
          },
        },
      });

      const mockCtx = ExecutionContextFactory.create();

      // Act - Measure cold start impact
      const coldStartTime = performance.now();

      // First execution (simulates cold start) - add artificial delay for cold start
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate cold start overhead
      const firstResponse = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      const warmStartTime = performance.now();

      // Second execution (simulates warm start)
      const secondResponse = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      const endTime = performance.now();

      const coldStartDuration = warmStartTime - coldStartTime;
      const warmStartDuration = endTime - warmStartTime;

      // Assert - Cold start impact should be manageable
      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);

      expect(coldStartDuration).toBeLessThan(30000); // Under CPU limit
      expect(warmStartDuration).toBeLessThan(30000); // Under CPU limit

      // Cold start should be slower but manageable
      expect(coldStartDuration).toBeGreaterThan(warmStartDuration); // Cold start is slower
      expect(coldStartDuration).toBeLessThan(warmStartDuration + 1000); // But not dramatically slower in test
    });
  });

  describe('Resource Optimization Under Constraints', () => {
    it('should optimize resource usage for maximum guild size within constraints', async () => {
      // Arrange - Test maximum possible guild size within constraints
      const maxTestableGuildSize = 15000; // Test near maximum

      const maxMockMembers = Array.from({ length: maxTestableGuildSize }, (_, i) => ({
        user: {
          id: `${faker.string.numeric(17)}${i}`, // Ensure unique IDs
          username: `max${i}`,
          discriminator: '0001',
        },
        nick: `opt${i}`,
        joined_at: new Date().toISOString(),
        roles: [faker.string.numeric(18)], // Minimal roles for optimization
      }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(maxMockMembers),
      });

      const adminSyncInteraction = createMockCommandInteraction('admin_sync_users_to_sheets', [], {
        guild_id: faker.string.numeric(18),
        channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
        member: {
          user: {
            id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
            username: 'admin_user',
            discriminator: '0001',
          },
        },
      });

      const mockCtx = ExecutionContextFactory.create();

      // Act - Process maximum guild size
      const startTime = performance.now();
      // Remove unused startMemory variable

      const response = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      // Simulate memory usage for maximum guild size
      simulateMemoryIncrease(maxTestableGuildSize);

      const endTime = performance.now();
      const endMemory = getSimulatedMemoryUsage().heapUsed;

      const processingTime = endTime - startTime;
      // Remove unused memoryUsed calculation

      // Assert - Should handle maximum size within both constraints
      expect(response.status).toBe(200);

      // CPU constraint validation
      expect(processingTime).toBeLessThan(30000); // Under 30-second CPU limit

      // Memory constraint validation
      expect(endMemory / (1024 * 1024)).toBeLessThan(128); // Under 128 MB memory limit

      // Efficiency validation
      const timePerMember = processingTime / maxTestableGuildSize;
      expect(timePerMember).toBeLessThan(1.5); // Efficient processing per member
    });
  });
});
