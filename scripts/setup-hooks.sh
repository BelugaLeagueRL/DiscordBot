#!/bin/bash
# Setup script to install Git hooks for development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Setting up Git hooks...${NC}"

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install commit-msg hook
if [ -f ".githooks/commit-msg" ]; then
    cp .githooks/commit-msg .git/hooks/commit-msg
    chmod +x .git/hooks/commit-msg
    echo -e "${GREEN}✅ Installed commit-msg hook${NC}"
else
    echo "❌ .githooks/commit-msg not found"
    exit 1
fi

# Configure Git to use the hooks directory (optional alternative approach)
git config core.hooksPath .githooks

echo -e "${GREEN}✅ Git hooks setup complete!${NC}"
echo ""
echo -e "${YELLOW}The commit-msg hook will now validate all commit messages.${NC}"
echo -e "${YELLOW}It will enforce conventional commit format and prevent forbidden references.${NC}"