# Beluga Discord Bot

Serverless Discord bot for Rocket League using Cloudflare Workers.

## Project Structure

Based on [Discord's official Cloudflare Workers sample app](https://github.com/discord/cloudflare-sample-app):

```
src/
├── index.ts        # Main Worker entry point (server.js equivalent)
├── commands.ts     # Command definitions
├── register.ts     # Command registration utility
├── handlers/       # Command handlers
│   └── register.ts # /register command handler
└── utils/          # Utility functions
    └── discord.ts  # Discord interaction utilities
```

## Setup

1. Copy environment variables:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Register Discord commands:
   ```bash
   npm run register
   ```

4. Start local development:
   ```bash
   npm start
   ```

## Commands

- `/register` - Register up to 4 Rocket League tracker URLs