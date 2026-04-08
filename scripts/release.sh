#!/bin/bash
# Release Preparation Script
# Prepares the project for a new release

set -e

echo "=========================================="
echo "Specification-Driven Agents Release Prep"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Version from argument or prompt
VERSION=${1:-""}

if [ -z "$VERSION" ]; then
    read -p "Enter version (e.g., 0.2.0): " VERSION
fi

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version is required${NC}"
    exit 1
fi

echo -e "${BLUE}1. Running tests...${NC}"
cd tooling
npm test
npm run lint
npm run build
cd ..

echo ""
echo -e "${BLUE}2. Validating all specs...${NC}"
cd examples/api-project
sda init
sda validate-project --fix --write
cd ../..
sda refs --validate

echo ""
echo -e "${BLUE}3. Updating version in tooling/package.json...${NC}"
cd tooling
npm version $VERSION --no-git-tag-version
cd ..

echo ""
echo -e "${BLUE}4. Creating git tag...${NC}"
git add tooling/package.json
git commit -m "chore: bump version to $VERSION"
git tag -a v$VERSION -m "Release v$VERSION"

echo ""
echo -e "${GREEN}=========================================="
echo "Release preparation complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff HEAD~1"
echo "  2. Push changes: git push"
echo "  3. Push tag: git push origin v$VERSION"
echo "  4. Create GitHub release at:"
echo "     https://github.com/inseone1988/specification-driven-agents/releases/new"
echo "  5. Publish to npm: cd tooling && npm publish"
echo ""
echo "Or use GitHub Actions to automate the release:"
echo "  - Push the tag: git push origin v$VERSION"
echo "  - The publish workflow will run automatically"
