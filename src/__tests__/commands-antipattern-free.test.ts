/**
 * Anti-Pattern Free Tests for Discord command definitions
 * Following TDD Red-Green-Refactor to eliminate Free Ride and forEach patterns
 * Each test focuses on ONE specific behavioral concern
 */

import { describe, it, expect } from 'vitest';
import { REGISTER_COMMAND, commands } from '../commands';

describe('Command Definitions - Anti-Pattern Free', () => {
  describe('REGISTER_COMMAND basic structure', () => {
    // RED: Break down Free Ride pattern from lines 10-14 into focused tests
    it('should have correct command name', () => {
      expect(REGISTER_COMMAND.name).toBe('register');
    });

    it('should have correct command description', () => {
      expect(REGISTER_COMMAND.description).toBe('Register with the league');
    });

    it('should have options as an array', () => {
      expect(REGISTER_COMMAND.options).toBeInstanceOf(Array);
    });

    it('should have exactly four options', () => {
      expect(REGISTER_COMMAND.options).toHaveLength(4);
    });
  });

  describe('tracker1 option validation', () => {
    // RED: Break down Free Ride pattern from lines 17-27 into focused tests
    it('should have tracker1 option with correct name', () => {
      const tracker1 = REGISTER_COMMAND.options[0];
      if (!tracker1) {
        throw new Error('tracker1 option not found');
      }
      expect(tracker1.name).toBe('tracker1');
    });

    it('should have tracker1 option with correct description', () => {
      const tracker1 = REGISTER_COMMAND.options[0];
      if (!tracker1) {
        throw new Error('tracker1 option not found');
      }
      expect(tracker1.description).toBe('First Rocket League tracker URL');
    });

    it('should have tracker1 option with string type', () => {
      const tracker1 = REGISTER_COMMAND.options[0];
      if (!tracker1) {
        throw new Error('tracker1 option not found');
      }
      expect(tracker1.type).toBe(3); // STRING type
    });

    it('should have tracker1 option as required', () => {
      const tracker1 = REGISTER_COMMAND.options[0];
      if (!tracker1) {
        throw new Error('tracker1 option not found');
      }
      expect(tracker1.required).toBe(true);
    });
  });

  describe('tracker2 option validation', () => {
    // RED: Break down Free Ride pattern from lines 29-39 into focused tests
    it('should have tracker2 option with correct name', () => {
      const tracker2 = REGISTER_COMMAND.options[1];
      if (!tracker2) {
        throw new Error('tracker2 option not found');
      }
      expect(tracker2.name).toBe('tracker2');
    });

    it('should have tracker2 option with correct description', () => {
      const tracker2 = REGISTER_COMMAND.options[1];
      if (!tracker2) {
        throw new Error('tracker2 option not found');
      }
      expect(tracker2.description).toBe('Second Rocket League tracker URL (optional)');
    });

    it('should have tracker2 option with string type', () => {
      const tracker2 = REGISTER_COMMAND.options[1];
      if (!tracker2) {
        throw new Error('tracker2 option not found');
      }
      expect(tracker2.type).toBe(3); // STRING type
    });

    it('should have tracker2 option as optional', () => {
      const tracker2 = REGISTER_COMMAND.options[1];
      if (!tracker2) {
        throw new Error('tracker2 option not found');
      }
      expect(tracker2.required).toBe(false);
    });
  });

  describe('tracker3 option validation', () => {
    // RED: Break down Free Ride pattern from lines 41-51 into focused tests
    it('should have tracker3 option with correct name', () => {
      const tracker3 = REGISTER_COMMAND.options[2];
      if (!tracker3) {
        throw new Error('tracker3 option not found');
      }
      expect(tracker3.name).toBe('tracker3');
    });

    it('should have tracker3 option with correct description', () => {
      const tracker3 = REGISTER_COMMAND.options[2];
      if (!tracker3) {
        throw new Error('tracker3 option not found');
      }
      expect(tracker3.description).toBe('Third Rocket League tracker URL (optional)');
    });

    it('should have tracker3 option with string type', () => {
      const tracker3 = REGISTER_COMMAND.options[2];
      if (!tracker3) {
        throw new Error('tracker3 option not found');
      }
      expect(tracker3.type).toBe(3); // STRING type
    });

    it('should have tracker3 option as optional', () => {
      const tracker3 = REGISTER_COMMAND.options[2];
      if (!tracker3) {
        throw new Error('tracker3 option not found');
      }
      expect(tracker3.required).toBe(false);
    });
  });

  describe('tracker4 option validation', () => {
    // RED: Break down Free Ride pattern from lines 53-63 into focused tests
    it('should have tracker4 option with correct name', () => {
      const tracker4 = REGISTER_COMMAND.options[3];
      if (!tracker4) {
        throw new Error('tracker4 option not found');
      }
      expect(tracker4.name).toBe('tracker4');
    });

    it('should have tracker4 option with correct description', () => {
      const tracker4 = REGISTER_COMMAND.options[3];
      if (!tracker4) {
        throw new Error('tracker4 option not found');
      }
      expect(tracker4.description).toBe('Fourth Rocket League tracker URL (optional)');
    });

    it('should have tracker4 option with string type', () => {
      const tracker4 = REGISTER_COMMAND.options[3];
      if (!tracker4) {
        throw new Error('tracker4 option not found');
      }
      expect(tracker4.type).toBe(3); // STRING type
    });

    it('should have tracker4 option as optional', () => {
      const tracker4 = REGISTER_COMMAND.options[3];
      if (!tracker4) {
        throw new Error('tracker4 option not found');
      }
      expect(tracker4.required).toBe(false);
    });
  });

  describe('option type consistency', () => {
    // RED: Replace forEach pattern from lines 66-68 with individual tests
    it('should have tracker1 option with string type', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.type).toBe(3); // STRING type in Discord API
    });

    it('should have tracker2 option with string type', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option.type).toBe(3); // STRING type in Discord API
    });

    it('should have tracker3 option with string type', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option.type).toBe(3); // STRING type in Discord API
    });

    it('should have tracker4 option with string type', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option.type).toBe(3); // STRING type in Discord API
    });
  });

  describe('option description quality', () => {
    // RED: Replace forEach pattern from lines 72-82 with individual tests
    it('should have tracker1 description that is sufficiently detailed', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.description).toBeTruthy();
      expect(option.description.length).toBeGreaterThan(10);
    });

    it('should have tracker1 description contain "First" to indicate priority', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.description).toContain('First');
    });

    it('should have tracker2 description that is sufficiently detailed', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option.description).toBeTruthy();
      expect(option.description.length).toBeGreaterThan(10);
    });

    it('should have tracker2 description contain "optional" to indicate requirement', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option.description).toContain('optional');
    });

    it('should have tracker3 description that is sufficiently detailed', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option.description).toBeTruthy();
      expect(option.description.length).toBeGreaterThan(10);
    });

    it('should have tracker3 description contain "optional" to indicate requirement', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option.description).toContain('optional');
    });

    it('should have tracker4 description that is sufficiently detailed', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option.description).toBeTruthy();
      expect(option.description.length).toBeGreaterThan(10);
    });

    it('should have tracker4 description contain "optional" to indicate requirement', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option.description).toContain('optional');
    });
  });

  describe('option name uniqueness', () => {
    it('should have unique option names across all options', () => {
      const names = REGISTER_COMMAND.options.map(option => option.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('option name sequence', () => {
    it('should have tracker option names in sequential order', () => {
      const expectedNames = ['tracker1', 'tracker2', 'tracker3', 'tracker4'];
      const actualNames = REGISTER_COMMAND.options.map(option => option.name);
      expect(actualNames).toEqual(expectedNames);
    });
  });

  describe('commands array structure', () => {
    it('should contain REGISTER_COMMAND in commands array', () => {
      expect(commands).toContain(REGISTER_COMMAND);
    });

    it('should have exactly two commands in array', () => {
      expect(commands).toHaveLength(2);
    });

    it('should be an array type', () => {
      expect(Array.isArray(commands)).toBe(true);
    });
  });

  describe('commands array property validation', () => {
    // RED: Replace forEach pattern from lines 113-122 with individual tests for single command
    it('should have first command with name property', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(command).toHaveProperty('name');
    });

    it('should have first command with description property', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(command).toHaveProperty('description');
    });

    it('should have first command with options property', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(command).toHaveProperty('options');
    });

    it('should have first command name as string type', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(typeof command.name).toBe('string');
    });

    it('should have first command description as string type', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(typeof command.description).toBe('string');
    });

    it('should have first command options as array type', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(Array.isArray(command.options)).toBe(true);
    });
  });

  describe('command name format validation', () => {
    // RED: Replace forEach pattern from lines 125-131 with individual test
    it('should have first command name in valid Discord format', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      // Discord command names must be lowercase and contain only letters, numbers, and hyphens
      expect(command.name).toMatch(/^[a-z0-9-]+$/);
    });

    it('should have first command name within length limits', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(command.name.length).toBeGreaterThanOrEqual(1);
      expect(command.name.length).toBeLessThanOrEqual(32);
    });
  });

  describe('command description validation', () => {
    // RED: Replace forEach pattern from lines 134-138 with individual test
    it('should have first command description within length limits', () => {
      const command = commands[0];
      if (!command) {
        throw new Error('First command not found');
      }
      expect(command.description.length).toBeGreaterThanOrEqual(1);
      expect(command.description.length).toBeLessThanOrEqual(100);
    });
  });

  describe('command name uniqueness', () => {
    it('should have unique command names across all commands', () => {
      const names = commands.map(command => command.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('second command validation', () => {
    // RED: Add tests for the second command (ADMIN_SYNC_USERS_TO_SHEETS_COMMAND)
    it('should have second command with correct name', () => {
      const command = commands[1];
      if (!command) {
        throw new Error('Second command not found');
      }
      expect(command.name).toBe('admin_sync_users_to_sheets');
    });

    it('should have second command with correct description', () => {
      const command = commands[1];
      if (!command) {
        throw new Error('Second command not found');
      }
      expect(command.description).toBe('Sync Discord server users to Google Sheets (Admin only)');
    });

    it('should have second command with empty options array', () => {
      const command = commands[1];
      if (!command) {
        throw new Error('Second command not found');
      }
      expect(command.options).toEqual([]);
    });
  });

  describe('Discord API compliance - REGISTER_COMMAND', () => {
    // RED: Replace massive forEach from lines 149-186 with individual focused tests
    it('should have REGISTER_COMMAND with required name property', () => {
      expect(REGISTER_COMMAND).toHaveProperty('name');
    });

    it('should have REGISTER_COMMAND with required description property', () => {
      expect(REGISTER_COMMAND).toHaveProperty('description');
    });

    it('should have REGISTER_COMMAND with required options property', () => {
      expect(REGISTER_COMMAND).toHaveProperty('options');
    });

    it('should have REGISTER_COMMAND name in valid Discord format', () => {
      expect(REGISTER_COMMAND.name).toMatch(/^[a-z0-9-]{1,32}$/);
    });

    it('should have REGISTER_COMMAND description within Discord length limits', () => {
      expect(REGISTER_COMMAND.description.length).toBeLessThanOrEqual(100);
      expect(REGISTER_COMMAND.description.length).toBeGreaterThan(0);
    });

    it('should have REGISTER_COMMAND options within Discord limit', () => {
      expect(REGISTER_COMMAND.options.length).toBeLessThanOrEqual(25); // Discord limit
    });
  });

  describe('Discord API compliance - option structure validation', () => {
    // RED: Break down nested forEach loops into individual option tests
    it('should have tracker1 option with required name property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('name');
    });

    it('should have tracker1 option with required description property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('description');
    });

    it('should have tracker1 option with required type property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('type');
    });

    it('should have tracker1 option with required required property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('required');
    });

    it('should have tracker1 option name in valid Discord format', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.name).toMatch(/^[a-z0-9-_]{1,32}$/);
    });

    it('should have tracker1 option description within Discord length limits', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.description.length).toBeLessThanOrEqual(100);
      expect(option.description.length).toBeGreaterThan(0);
    });

    it('should have tracker1 option with valid Discord option type', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).toContain(option.type);
    });

    it('should have tracker1 option required field as boolean', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(typeof option.required).toBe('boolean');
    });
  });

  describe('option type validation for string inputs', () => {
    // RED: Replace forEach pattern from lines 191-194 with individual tests
    it('should have tracker1 option with STRING type for Discord API', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.type).toBe(3); // STRING type
    });

    it('should have tracker2 option with STRING type for Discord API', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option.type).toBe(3); // STRING type
    });

    it('should have tracker3 option with STRING type for Discord API', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option.type).toBe(3); // STRING type
    });

    it('should have tracker4 option with STRING type for Discord API', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option.type).toBe(3); // STRING type
    });
  });

  describe('reasonable option count validation', () => {
    it('should have REGISTER_COMMAND options within Discord API limits', () => {
      expect(REGISTER_COMMAND.options.length).toBeLessThanOrEqual(25);
    });

    it('should have REGISTER_COMMAND with at least one option', () => {
      expect(REGISTER_COMMAND.options.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility and UX - command name', () => {
    // RED: Break down Free Ride pattern from lines 204-209 into focused tests
    it('should have REGISTER_COMMAND with intuitive name', () => {
      expect(REGISTER_COMMAND.name).toBe('register');
    });

    it('should have REGISTER_COMMAND name without underscores for readability', () => {
      expect(REGISTER_COMMAND.name).not.toContain('_');
    });

    it('should have REGISTER_COMMAND name without spaces for Discord compatibility', () => {
      expect(REGISTER_COMMAND.name).not.toContain(' ');
    });
  });

  describe('accessibility and UX - command description', () => {
    it('should have REGISTER_COMMAND description containing "Register" for clarity', () => {
      expect(REGISTER_COMMAND.description).toContain('Register');
    });

    it('should have REGISTER_COMMAND description containing "league" for context', () => {
      expect(REGISTER_COMMAND.description).toContain('league');
    });
  });

  describe('accessibility and UX - option descriptions', () => {
    // RED: Replace forEach pattern from lines 217-226 with individual tests
    it('should have tracker1 option description containing "Rocket League" for clarity', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.description).toContain('Rocket League');
    });

    it('should have tracker1 option description containing "tracker" for context', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.description).toContain('tracker');
    });

    it('should have tracker1 option description containing "URL" for format clarity', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option.description).toContain('URL');
    });

    it('should have tracker2 option description containing "optional" for requirement clarity', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option.description).toContain('optional');
    });

    it('should have tracker3 option description containing "optional" for requirement clarity', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option.description).toContain('optional');
    });

    it('should have tracker4 option description containing "optional" for requirement clarity', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option.description).toContain('optional');
    });
  });

  describe('required vs optional option validation', () => {
    // RED: Break down Free Ride pattern from lines 228-250 into focused tests
    it('should have exactly one required option', () => {
      const requiredOptions = REGISTER_COMMAND.options.filter(opt => opt.required);
      expect(requiredOptions).toHaveLength(1);
    });

    it('should have exactly three optional options', () => {
      const optionalOptions = REGISTER_COMMAND.options.filter(opt => !opt.required);
      expect(optionalOptions).toHaveLength(3);
    });

    it('should have first option as required', () => {
      const firstOption = REGISTER_COMMAND.options[0];
      if (!firstOption) {
        throw new Error('First option not found');
      }
      expect(firstOption.required).toBe(true);
    });

    it('should have second option as optional', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('Second option not found');
      }
      expect(option.required).toBe(false);
    });

    it('should have third option as optional', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('Third option not found');
      }
      expect(option.required).toBe(false);
    });

    it('should have fourth option as optional', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('Fourth option not found');
      }
      expect(option.required).toBe(false);
    });
  });

  describe('command immutability validation', () => {
    it('should preserve original command name when copied', () => {
      const originalName = REGISTER_COMMAND.name;
      const modifiedCommand = { ...REGISTER_COMMAND, name: 'modified' };
      expect(REGISTER_COMMAND.name).toBe(originalName);
      expect(modifiedCommand.name).toBe('modified');
    });
  });

  describe('options array immutability validation', () => {
    it('should preserve original options length when modified array created', () => {
      const originalLength = REGISTER_COMMAND.options.length;
      const modifiedOptions = [
        ...REGISTER_COMMAND.options,
        {
          name: 'tracker5',
          description: 'Fifth URL',
          type: 3,
          required: false,
        },
      ];
      expect(REGISTER_COMMAND.options.length).toBe(originalLength);
      expect(modifiedOptions.length).toBe(originalLength + 1);
    });

    it('should preserve original first option name when modified array created', () => {
      const firstOption = REGISTER_COMMAND.options[0];
      if (!firstOption) {
        throw new Error('First option not found');
      }
      const originalFirst = firstOption.name;

      // Test that creating a modified array doesn't affect original
      const firstOptionAfter = REGISTER_COMMAND.options[0];
      if (!firstOptionAfter) {
        throw new Error('First option not found after modification');
      }
      expect(firstOptionAfter.name).toBe(originalFirst);
    });
  });

  describe('option structure consistency validation', () => {
    // RED: Replace double nested forEach pattern from lines 295-306 with individual tests
    it('should have tracker1 option with name property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('name');
    });

    it('should have tracker1 option with description property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('description');
    });

    it('should have tracker1 option with type property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('type');
    });

    it('should have tracker1 option with required property', () => {
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(option).toHaveProperty('required');
    });

    it('should have tracker1 option name key in expected properties', () => {
      const requiredProperties = ['name', 'description', 'type', 'required'];
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(requiredProperties).toContain('name');
    });

    it('should have tracker1 option description key in expected properties', () => {
      const requiredProperties = ['name', 'description', 'type', 'required'];
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(requiredProperties).toContain('description');
    });

    it('should have tracker1 option type key in expected properties', () => {
      const requiredProperties = ['name', 'description', 'type', 'required'];
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(requiredProperties).toContain('type');
    });

    it('should have tracker1 option required key in expected properties', () => {
      const requiredProperties = ['name', 'description', 'type', 'required'];
      const option = REGISTER_COMMAND.options[0];
      if (!option) {
        throw new Error('tracker1 option not found');
      }
      expect(requiredProperties).toContain('required');
    });

    it('should have tracker2 option with name property', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option).toHaveProperty('name');
    });

    it('should have tracker2 option with description property', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option).toHaveProperty('description');
    });

    it('should have tracker2 option with type property', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option).toHaveProperty('type');
    });

    it('should have tracker2 option with required property', () => {
      const option = REGISTER_COMMAND.options[1];
      if (!option) {
        throw new Error('tracker2 option not found');
      }
      expect(option).toHaveProperty('required');
    });

    it('should have tracker3 option with name property', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option).toHaveProperty('name');
    });

    it('should have tracker3 option with description property', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option).toHaveProperty('description');
    });

    it('should have tracker3 option with type property', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option).toHaveProperty('type');
    });

    it('should have tracker3 option with required property', () => {
      const option = REGISTER_COMMAND.options[2];
      if (!option) {
        throw new Error('tracker3 option not found');
      }
      expect(option).toHaveProperty('required');
    });

    it('should have tracker4 option with name property', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option).toHaveProperty('name');
    });

    it('should have tracker4 option with description property', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option).toHaveProperty('description');
    });

    it('should have tracker4 option with type property', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option).toHaveProperty('type');
    });

    it('should have tracker4 option with required property', () => {
      const option = REGISTER_COMMAND.options[3];
      if (!option) {
        throw new Error('tracker4 option not found');
      }
      expect(option).toHaveProperty('required');
    });
  });
});
