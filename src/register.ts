/**
 * Command registration utility
 * Following Discord sample app pattern from register.js
 */

import { commands } from './commands';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
  throw new Error(
    'Missing required environment variables: DISCORD_TOKEN and DISCORD_APPLICATION_ID'
  );
}

/**
 * Register all commands with Discord
 */
async function registerCommands(): Promise<void> {
  const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

  try {
    console.log('Registering commands...');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to register commands: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = (await response.json()) as Array<{ name: string; description: string }>;
    console.log('Successfully registered', data.length, 'commands');

    // Log registered commands
    data.forEach(command => {
      console.log(`  - ${command.name}: ${command.description}`);
    });
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

// Run command registration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  registerCommands();
}
