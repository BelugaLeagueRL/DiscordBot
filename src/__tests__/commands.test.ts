/**
 * Tests for Discord command definitions
 */

import { describe, it, expect } from 'vitest';
import { REGISTER_COMMAND, commands } from '../commands';

describe('Command Definitions', () => {
  describe('REGISTER_COMMAND', () => {
    it('should have correct basic properties', () => {
      expect(REGISTER_COMMAND.name).toBe('register');
      expect(REGISTER_COMMAND.description).toBe('Register with the league');
      expect(REGISTER_COMMAND.options).toBeInstanceOf(Array);
      expect(REGISTER_COMMAND.options).toHaveLength(4);
    });

    it('should have tracker1 as required option', () => {
      const tracker1 = REGISTER_COMMAND.options[0];
      if (!tracker1) {
        throw new Error('tracker1 option not found');
      }

      expect(tracker1.name).toBe('tracker1');
      expect(tracker1.description).toBe('First Rocket League tracker URL');
      expect(tracker1.type).toBe(3); // STRING type
      expect(tracker1.required).toBe(true);
    });

    it('should have tracker2 as optional option', () => {
      const tracker2 = REGISTER_COMMAND.options[1];
      if (!tracker2) {
        throw new Error('tracker2 option not found');
      }

      expect(tracker2.name).toBe('tracker2');
      expect(tracker2.description).toBe('Second Rocket League tracker URL (optional)');
      expect(tracker2.type).toBe(3); // STRING type
      expect(tracker2.required).toBe(false);
    });

    it('should have tracker3 as optional option', () => {
      const tracker3 = REGISTER_COMMAND.options[2];
      if (!tracker3) {
        throw new Error('tracker3 option not found');
      }

      expect(tracker3.name).toBe('tracker3');
      expect(tracker3.description).toBe('Third Rocket League tracker URL (optional)');
      expect(tracker3.type).toBe(3); // STRING type
      expect(tracker3.required).toBe(false);
    });

    it('should have tracker4 as optional option', () => {
      const tracker4 = REGISTER_COMMAND.options[3];
      if (!tracker4) {
        throw new Error('tracker4 option not found');
      }

      expect(tracker4.name).toBe('tracker4');
      expect(tracker4.description).toBe('Fourth Rocket League tracker URL (optional)');
      expect(tracker4.type).toBe(3); // STRING type
      expect(tracker4.required).toBe(false);
    });

    it('should have all options with string type', () => {
      REGISTER_COMMAND.options.forEach(option => {
        expect(option.type).toBe(3); // STRING type in Discord API
      });
    });

    it('should have descriptive option descriptions', () => {
      REGISTER_COMMAND.options.forEach((option, index) => {
        expect(option.description).toBeTruthy();
        expect(option.description.length).toBeGreaterThan(10);

        if (index === 0) {
          expect(option.description).toContain('First');
        } else {
          expect(option.description).toContain('optional');
        }
      });
    });

    it('should have unique option names', () => {
      const names = REGISTER_COMMAND.options.map(option => option.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have tracker option names in sequence', () => {
      const expectedNames = ['tracker1', 'tracker2', 'tracker3', 'tracker4'];
      const actualNames = REGISTER_COMMAND.options.map(option => option.name);

      expect(actualNames).toEqual(expectedNames);
    });
  });

  describe('commands array', () => {
    it('should contain REGISTER_COMMAND', () => {
      expect(commands).toContain(REGISTER_COMMAND);
    });

    it('should have exactly one command', () => {
      expect(commands).toHaveLength(1);
    });

    it('should be an array', () => {
      expect(Array.isArray(commands)).toBe(true);
    });

    it('should have all commands with required properties', () => {
      commands.forEach(command => {
        expect(command).toHaveProperty('name');
        expect(command).toHaveProperty('description');
        expect(command).toHaveProperty('options');

        expect(typeof command.name).toBe('string');
        expect(typeof command.description).toBe('string');
        expect(Array.isArray(command.options)).toBe(true);
      });
    });

    it('should have commands with valid names', () => {
      commands.forEach(command => {
        // Discord command names must be lowercase and contain only letters, numbers, and hyphens
        expect(command.name).toMatch(/^[a-z0-9-]+$/);
        expect(command.name.length).toBeGreaterThanOrEqual(1);
        expect(command.name.length).toBeLessThanOrEqual(32);
      });
    });

    it('should have commands with valid descriptions', () => {
      commands.forEach(command => {
        expect(command.description.length).toBeGreaterThanOrEqual(1);
        expect(command.description.length).toBeLessThanOrEqual(100);
      });
    });

    it('should have unique command names', () => {
      const names = commands.map(command => command.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Discord API compliance', () => {
    it('should have commands that comply with Discord slash command format', () => {
      commands.forEach(command => {
        // Check command structure
        expect(command).toHaveProperty('name');
        expect(command).toHaveProperty('description');
        expect(command).toHaveProperty('options');

        // Check command name constraints
        expect(command.name).toMatch(/^[a-z0-9-]{1,32}$/);

        // Check description constraints
        expect(command.description.length).toBeLessThanOrEqual(100);
        expect(command.description.length).toBeGreaterThan(0);

        // Check options
        expect(command.options.length).toBeLessThanOrEqual(25); // Discord limit

        command.options.forEach(option => {
          expect(option).toHaveProperty('name');
          expect(option).toHaveProperty('description');
          expect(option).toHaveProperty('type');
          expect(option).toHaveProperty('required');

          // Option name constraints
          expect(option.name).toMatch(/^[a-z0-9-_]{1,32}$/);

          // Option description constraints
          expect(option.description.length).toBeLessThanOrEqual(100);
          expect(option.description.length).toBeGreaterThan(0);

          // Type should be a valid Discord option type
          expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).toContain(option.type);

          // Required should be boolean
          expect(typeof option.required).toBe('boolean');
        });
      });
    });

    it('should have valid option types for string inputs', () => {
      const REGISTER_COMMAND_OPTIONS = REGISTER_COMMAND.options;

      REGISTER_COMMAND_OPTIONS.forEach(option => {
        expect(option.type).toBe(3); // STRING type
      });
    });

    it('should have reasonable number of options', () => {
      // Discord allows max 25 options, but 4 is reasonable for our use case
      expect(REGISTER_COMMAND.options.length).toBeLessThanOrEqual(25);
      expect(REGISTER_COMMAND.options.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility and UX', () => {
    it('should have clear and descriptive command name', () => {
      expect(REGISTER_COMMAND.name).toBe('register');
      // Name should be intuitive for users
      expect(REGISTER_COMMAND.name).not.toContain('_');
      expect(REGISTER_COMMAND.name).not.toContain(' ');
    });

    it('should have helpful command description', () => {
      expect(REGISTER_COMMAND.description).toContain('Register');
      expect(REGISTER_COMMAND.description).toContain('league');
    });

    it('should have clear option descriptions', () => {
      REGISTER_COMMAND.options.forEach((option, index) => {
        expect(option.description).toContain('Rocket League');
        expect(option.description).toContain('tracker');
        expect(option.description).toContain('URL');

        if (index > 0) {
          expect(option.description).toContain('optional');
        }
      });
    });

    it('should indicate which options are required vs optional', () => {
      const requiredOptions = REGISTER_COMMAND.options.filter(opt => opt.required);
      const optionalOptions = REGISTER_COMMAND.options.filter(opt => !opt.required);

      expect(requiredOptions).toHaveLength(1);
      expect(optionalOptions).toHaveLength(3);

      // First option should be required
      const firstOption = REGISTER_COMMAND.options[0];
      if (!firstOption) {
        throw new Error('First option not found');
      }
      expect(firstOption.required).toBe(true);

      // Rest should be optional
      for (let i = 1; i < REGISTER_COMMAND.options.length; i++) {
        const option = REGISTER_COMMAND.options[i];
        if (!option) {
          throw new Error(`Option at index ${String(i)} not found`);
        }
        expect(option.required).toBe(false);
      }
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle command object immutability', () => {
      const originalName = REGISTER_COMMAND.name;

      // Attempt to modify (should not affect original)
      const modifiedCommand = { ...REGISTER_COMMAND, name: 'modified' };

      expect(REGISTER_COMMAND.name).toBe(originalName);
      expect(modifiedCommand.name).toBe('modified');
    });

    it('should handle options array immutability', () => {
      const originalLength = REGISTER_COMMAND.options.length;
      const firstOption = REGISTER_COMMAND.options[0];
      if (!firstOption) {
        throw new Error('First option not found');
      }
      const originalFirst = firstOption.name;

      // Create modified copy
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
      const firstOptionAfter = REGISTER_COMMAND.options[0];
      if (!firstOptionAfter) {
        throw new Error('First option not found after modification');
      }
      expect(firstOptionAfter.name).toBe(originalFirst);
      expect(modifiedOptions.length).toBe(originalLength + 1);
    });

    it('should have consistent option structure', () => {
      const requiredProperties = ['name', 'description', 'type', 'required'];

      REGISTER_COMMAND.options.forEach(option => {
        requiredProperties.forEach(prop => {
          expect(option).toHaveProperty(prop);
        });

        // No unexpected properties
        const optionKeys = Object.keys(option);
        optionKeys.forEach(key => {
          expect(requiredProperties).toContain(key);
        });
      });
    });
  });
});
