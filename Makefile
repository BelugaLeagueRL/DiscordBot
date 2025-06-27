# Beluga Discord Bot - Development Makefile

.PHONY: help install clean build test lint format typecheck ci pre-commit dev deploy register

# Default target
help: ## Show this help message
	@echo "Beluga Discord Bot - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Setup and installation
install: ## Install dependencies
	npm install

clean: ## Clean node_modules and reinstall
	rm -rf node_modules package-lock.json
	npm install

# Development commands
dev: ## Start local development server
	npm start

register: ## Register Discord commands
	npm run register

# Quality assurance
lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

typecheck: ## Run TypeScript type checking
	npm run typecheck

# Testing
test: ## Run tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage
	npm run test:coverage

# Build and deployment
build: ## Build the project
	npm run build

deploy: ## Deploy to Cloudflare Workers
	npm run deploy

# CI/CD commands
ci: lint format-check typecheck test ## Run all CI checks
	@echo "✅ All CI checks passed!"

pre-commit: lint-fix format test ## Run pre-commit checks with fixes
	@echo "✅ Pre-commit checks completed!"

# Quick quality check (faster than full CI)
check: lint typecheck ## Quick lint and type check
	@echo "✅ Quick checks passed!"

# Full quality assurance
qa: clean install lint format-check typecheck test ## Full quality assurance pipeline
	@echo "✅ Full QA pipeline completed!"