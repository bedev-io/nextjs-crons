#!/bin/bash

# Release script for nextjs-crons
# Usage: ./scripts/release.sh [major|minor|patch]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VERSION_TYPE=${1:-patch}

echo -e "${YELLOW}Starting release process...${NC}"

# Check if git working directory is clean
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: Git working directory is not clean${NC}"
  exit 1
fi

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm test

# Run coverage
echo -e "${YELLOW}Running coverage...${NC}"
npm run test:coverage

# Build
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Bump version
echo -e "${YELLOW}Bumping version (${VERSION_TYPE})...${NC}"
npm version $VERSION_TYPE -m "chore: release v%s"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

# Update CHANGELOG
echo -e "${YELLOW}Updating CHANGELOG...${NC}"
DATE=$(date +%Y-%m-%d)
sed -i.bak "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $DATE/" CHANGELOG.md
rm CHANGELOG.md.bak

# Commit CHANGELOG
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v$NEW_VERSION"

# Create git tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push to git
echo -e "${YELLOW}Pushing to git...${NC}"
git push origin main
git push origin "v$NEW_VERSION"

echo -e "${GREEN}Release v$NEW_VERSION completed successfully!${NC}"
echo -e "${YELLOW}To publish to npm, run: npm publish${NC}"
