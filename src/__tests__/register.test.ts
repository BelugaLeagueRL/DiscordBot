import { describe, it, expect } from 'vitest';
import { handleRegisterCommand } from '../handlers/register';
import type { Env } from '../index';

// Mock environment
const mockEnv: Env = {
  DISCORD_TOKEN: 'test-token',
  DISCORD_PUBLIC_KEY: 'test-key',
  DISCORD_APPLICATION_ID: 'test-app-id',
  ENVIRONMENT: 'test',
};

describe('Register command handler', () => {
  it('should validate tracker URLs correctly', async () => {
    const validInteraction = {
      member: { user: { id: 'test-user-123' } },
      data: {
        options: [
          {
            name: 'tracker1',
            value: 'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198000000000/overview'
          }
        ]
      }
    };

    const response = await handleRegisterCommand(validInteraction, mockEnv);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.type).toBe(4); // CHANNEL_MESSAGE_WITH_SOURCE
    expect(data.data.content).toContain('✅ Successfully registered');
    expect(data.data.content).toContain('STEAM: 76561198000000000');
  });

  it('should reject invalid tracker URLs', async () => {
    const invalidInteraction = {
      member: { user: { id: 'test-user-123' } },
      data: {
        options: [
          {
            name: 'tracker1',
            value: 'https://invalid-url.com/profile'
          }
        ]
      }
    };

    const response = await handleRegisterCommand(invalidInteraction, mockEnv);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.type).toBe(4); // CHANNEL_MESSAGE_WITH_SOURCE
    expect(data.data.content).toContain('Invalid tracker URLs');
    expect(data.data.flags).toBe(64); // Ephemeral
  });

  it('should handle missing user ID', async () => {
    const noUserInteraction = {
      data: {
        options: [
          {
            name: 'tracker1',
            value: 'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198000000000/overview'
          }
        ]
      }
    };

    const response = await handleRegisterCommand(noUserInteraction, mockEnv);
    const data = await response.json();
    
    expect(data.data.content).toContain('❌ Could not identify user');
    expect(data.data.flags).toBe(64); // Ephemeral
  });

  it('should handle missing tracker URLs', async () => {
    const noOptionsInteraction = {
      member: { user: { id: 'test-user-123' } },
      data: {
        options: []
      }
    };

    const response = await handleRegisterCommand(noOptionsInteraction, mockEnv);
    const data = await response.json();
    
    expect(data.data.content).toContain('❌ Please provide at least one tracker URL');
    expect(data.data.flags).toBe(64); // Ephemeral
  });
});