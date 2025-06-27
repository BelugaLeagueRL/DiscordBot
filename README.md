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
   make install
   ```

3. Register Discord commands:
   ```bash
   make register
   ```

4. Start local development:
   ```bash
   make dev
   ```

## Development Commands

Use the Makefile for consistent development workflow:

```bash
make help           # Show all available commands
make install        # Install dependencies
make dev            # Start local development server
make test           # Run tests
make check          # Quick lint and type check
make ci             # Run full CI pipeline
make pre-commit     # Run pre-commit checks with fixes
```

For a complete list of commands, run `make help`.

## Commands

- `/register` - Register up to 4 Rocket League tracker URLs