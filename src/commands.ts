/**
 * Command definitions for the Beluga Discord Bot
 * Following Discord sample app pattern from commands.js
 */

// Define the /register command
export const REGISTER_COMMAND = {
  name: 'register',
  description: 'Register with the league',
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

// Define the /admin_sync_users_to_sheets command
export const ADMIN_SYNC_USERS_TO_SHEETS_COMMAND = {
  name: 'admin_sync_users_to_sheets',
  description: 'Sync Discord server users to Google Sheets (Admin only)',
  options: [], // No parameters needed - credentials are server-side
};

/**
 * Array of all commands to be registered
 */
export const commands = [REGISTER_COMMAND, ADMIN_SYNC_USERS_TO_SHEETS_COMMAND];
