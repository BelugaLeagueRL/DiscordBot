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

2. Full project setup (installs dependencies and Git hooks):
   ```bash
   make setup
   ```

3. Register Discord commands:
   ```bash
   make register
   ```

4. Start local development:
   ```bash
   make dev
   ```

### Git Hooks

The project includes Git hooks that enforce code quality:

- **commit-msg**: Validates conventional commit format and prevents forbidden references
- Automatically installed with `make setup`
- Provides helpful error messages and examples when validation fails

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