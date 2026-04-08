# Specification-Driven Agents Demo (Windows PowerShell)
# A 2-minute showcase of the CLI tool

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Specification-Driven Agents Demo" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Initialize demo project
Write-Host "1. Initializing demo project..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path demo-api | Out-Null
Set-Location demo-api
sda init
Write-Host ""

# 2. Generate specs
Write-Host "2. Generating specification hierarchy..." -ForegroundColor Blue
Write-Host "Creating genesis (project vision)..."
sda generate genesis --force
Write-Host ""

Write-Host "Creating domain specification..."
sda generate domain users --force
Write-Host ""

Write-Host "Creating API specification..."
sda generate api authentication --force
Write-Host ""

# 3. View spec structure
Write-Host "3. Project structure created:" -ForegroundColor Blue
Get-ChildItem -Path specs -Recurse -Include *.yaml,*.md | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.FullName)" }
Write-Host ""

# 4. Validate with auto-fix
Write-Host "4. Validating and auto-fixing specs..." -ForegroundColor Blue
sda validate-project --fix --write
Write-Host ""

# 5. Analyze references
Write-Host "5. Analyzing specification references..." -ForegroundColor Blue
sda refs --validate
Write-Host ""

# 6. Generate dependency graph
Write-Host "6. Generating dependency graph (Mermaid format)..." -ForegroundColor Blue
sda graph --all -o mermaid -f dependencies.md
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Demo complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  sda resolve <spec-id>  # View authority hierarchy"
Write-Host "  sda graph --all -o dot # Generate DOT graph"
Write-Host "  sda validate <file>    # Validate single spec"
Write-Host ""
Write-Host "See specs/ directory for generated specifications"
