/**
 * Command definitions for the Beluga Discord Bot
 * Following Discord sample app pattern from commands.js
 */

import { SlashCommandBuilder } from 'discord-interactions';

// Define the /register command
export const REGISTER_COMMAND = {
  name: 'register',
  description: 'Register your Rocket League tracker URLs',
  options: [
    {
      name: 'tracker1',
      description: 'First Rocket League tracker URL',
      type: 3, // STRING
      required: true,
    },
    {
      name: 'tracker2',
      description: 'Second Rocket League tracker URL (optional)',
      type: 3, // STRING
      required: false,
    },
    {
      name: 'tracker3',
      description: 'Third Rocket League tracker URL (optional)',
      type: 3, // STRING
      required: false,
    },
    {
      name: 'tracker4',
      description: 'Fourth Rocket League tracker URL (optional)',
      type: 3, // STRING
      required: false,
    },
  ],
};

/**
 * Array of all commands to be registered
 */
export const commands = [REGISTER_COMMAND];