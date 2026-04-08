#!/bin/bash
# Specification-Driven Agents Demo
# A 2-minute showcase of the CLI tool

set -e

echo "=========================================="
echo "Specification-Driven Agents Demo"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Initialize demo project
echo -e "${BLUE}1. Initializing demo project...${NC}"
mkdir -p demo-api
cd demo-api
sda init
echo ""

# 2. Generate specs
echo -e "${BLUE}2. Generating specification hierarchy...${NC}"
echo "Creating genesis (project vision)..."
sda generate genesis --force
echo ""

echo "Creating domain specification..."
sda generate domain users --force
echo ""

echo "Creating API specification..."
sda generate api authentication --force
echo ""

# 3. View spec structure
echo -e "${BLUE}3. Project structure created:${NC}"
find specs -type f -name "*.yaml" -o -name "*.md" | head -10
echo ""

# 4. Validate with auto-fix
echo -e "${BLUE}4. Validating and auto-fixing specs...${NC}"
sda validate-project --fix --write
echo ""

# 5. Analyze references
echo -e "${BLUE}5. Analyzing specification references...${NC}"
sda refs --validate
echo ""

# 6. Generate dependency graph
echo -e "${BLUE}6. Generating dependency graph (Mermaid format)...${NC}"
sda graph --all -o mermaid -f dependencies.md
echo ""

echo "=========================================="
echo -e "${GREEN}Demo complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  sda resolve <spec-id>  # View authority hierarchy"
echo "  sda graph --all -o dot # Generate DOT graph"
echo "  sda validate <file>    # Validate single spec"
echo ""
echo "See specs/ directory for generated specifications"
