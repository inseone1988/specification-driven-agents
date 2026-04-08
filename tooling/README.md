# Specification-Driven Agents CLI

A command-line tool for generating, validating, and managing specification contracts following the Specification-Driven Agents framework.

## Installation

### Global installation (recommended for CLI usage):
```bash
npm install -g spec-driven-agents
```

### Local installation (for project dependencies):
```bash
npm install --save-dev spec-driven-agents
```

### Development installation (from local source):
```bash
cd /path/to/specification-driven-agents/tooling
npm install -g .
```

## Quick Start

```bash
# Initialize a new project with specification structure
sda init

# Generate a new specification
sda generate domain user-management
sda generate standard security-rules
sda generate api authentication

# Validate a specification
sda validate specs/domain-user-management.yaml

# Validate entire project
sda validate-project

# Resolve authority hierarchy
sda resolve domain-user-management

# Update specification status
sda status domain-user-management approved
```

## Available Commands

### `sda init`
Initialize a new project with the Specification-Driven Agents structure.

### `sda generate <type> <name>`
Generate a new specification from template.

**Types:** `genesis`, `standard`, `domain`, `implementation`, `api`, `migration`, `security`, `validation`, `operational`, `task-change`

**Options:**
- `-o, --output <path>`: Output path for generated spec
- `-f, --force`: Overwrite existing file
- `-v, --values <values>`: Additional values as JSON string

**Examples:**
```bash
sda generate domain user-auth
sda generate standard coding-standards -o ./standards/code.yaml
sda generate api products --values '{"version":"v1","owner":"api-team"}'
```

### `sda validate <path>`
Validate a specification against the contract schema.

**Options:**
- `-s, --strict`: Enable strict validation
- `-j, --json`: Output as JSON
- `-f, --fix`: Automatically fix common issues (preview changes)
- `-w, --write`: Write fixed specs to disk (requires --fix)

### `sda validate-project`
Validate all specifications in the project.

**Options:**
- `-p, --path <path>`: Project path (default: ".")
- `-r, --recursive`: Recursive validation (default: true)
- `-f, --fix`: Automatically fix common issues
- `-w, --write`: Write fixed specs to disk

### `sda resolve <spec-id>`
Resolve authority hierarchy and dependencies.

**Options:**
- `-d, --depth <number>`: Maximum depth for resolution (default: 3)
- `-g, --graph`: Output as graph format

### `sda status <spec-id> <status>`
Update specification lifecycle status.

**Status values:** `draft`, `review`, `approved`, `implemented`, `deprecated`, `archived`

**Options:**
- `-m, --message <message>`: Status change message

### `sda graph`
Generate dependency graph of specifications.

**Options:**
- `-o, --output <format>`: Output format (`dot`, `json`, `mermaid`) (default: "dot")
- `-f, --file <path>`: Output file path
- `-a, --all`: Generate graph for all specifications
- `-s, --spec <spec-id>`: Generate graph for specific specification

### `sda refs`
List and validate cross-specification references.

**Options:**
- `-p, --path <path>`: Project path (default: ".")
- `-r, --recursive`: Search recursively (default: true)
- `-v, --validate`: Validate references (check if targets exist)
- `-j, --json`: Output as JSON
- `-s, --spec <spec-id>`: Show refs for specific spec only

## Specification Types and Formats

The framework supports 10 types of specifications with strict format rules:

### 1. **`genesis`** - Root narrative and architectural entry point
   - **Format:** `.md` (Markdown)
   - **Purpose:** Human-readable vision document, project philosophy, core constraints
   - **Structure:** Narrative text with optional YAML frontmatter for metadata
   - **Rule:** Never executable YAML contract, only guidance document

### 2. **`standard`** - Global engineering laws and cross-cutting rules
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for cross-cutting concerns
   - **Structure:** Valid YAML against specification-contract schema

### 3. **`domain`** - Bounded context or core business capability
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for business domains
   - **Structure:** Valid YAML against specification-contract schema

### 4. **`implementation`** - Concrete realization details for code
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for implementation details
   - **Structure:** Valid YAML against specification-contract schema

### 5. **`api`** - Interface contracts for endpoints
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for API interfaces
   - **Structure:** Valid YAML against specification-contract schema

### 6. **`migration`** - Safe structural changes to persistence layers
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for data migrations
   - **Structure:** Valid YAML against specification-contract schema

### 7. **`security`** - Security controls, trust boundaries, threat assumptions
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for security requirements
   - **Structure:** Valid YAML against specification-contract schema

### 8. **`validation`** - How a system must be verified
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for validation rules
   - **Structure:** Valid YAML against specification-contract schema

### 9. **`operational`** - Runtime, deployment, monitoring requirements
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for operational concerns
   - **Structure:** Valid YAML against specification-contract schema

### 10. **`task-change`** - Focused change tied to one unit of delivery
   - **Format:** `.yaml`
   - **Purpose:** Executable contracts for specific task changes
   - **Structure:** Valid YAML against specification-contract schema

**Format Rule:** Only `genesis` uses `.md`, all other types use `.yaml`

## 🔗 Typed References System

Specifications reference each other using typed references in the `authority` section:

### Reference Types

| Syntax | Type | Example |
|--------|------|---------|
| `@spec-id` | Local | `@genesis`, `@domain-auth` |
| `@spec-id@v1.0` | Versioned | `@standard-api@v1.2` |
| `@external:./path` | External File | `@external:./shared/rules.yaml` |
| `@remote:owner/repo` | Remote Repository | `@remote:org/shared-specs` |
| `@project:spec-id` | Cross-Project | `@tbs:domain-account` |

### Usage Examples

```yaml
authority:
  inherits_from:
    - genesis
    - @external:./standards/security.yaml
    - @standard-authentication@v2.0
  depends_on:
    - domain-payments
    - @remote:team/api-specs
```

### Commands

```bash
# List all references in project
sda refs

# Validate that all references exist
sda refs --validate

# Show refs for specific spec
sda refs --spec api-orders
```

## 🔧 Auto-fix Validation

The CLI can automatically fix common specification issues:

```bash
# Preview fixes without writing
sda validate-project --fix

# Apply fixes and save
sda validate-project --fix --write

# Fix single file
sda validate specs/domain.yaml --fix --write
```

### Auto-fixable Fields

The `--fix` option automatically adds missing required fields:
- `meta.tags`, `meta.compatibility`, dates
- `contracts.invariants`, `contracts.validations`
- `context.capabilities`, `context.constraints`
- `implementation.targets`, `implementation.migration_strategy`
- `validation.required_checks`, `validation.acceptance_criteria`
- And more...

## Project Structure

A typical Specification-Driven Agents project:

```
my-project/
├── specs/                    # Specification contracts
│   ├── genesis.yaml         # Root specification
│   ├── standards/           # Engineering standards
│   │   ├── security.yaml
│   │   └── coding.yaml
│   ├── domains/             # Business domains
│   │   ├── identity.yaml
│   │   └── billing.yaml
│   └── implementations/     # Implementation specs
│       └── api-v1.yaml
├── schemas/                 # Contract schemas
│   └── specification-contract.schema.yaml
└── .sda-config.yaml        # Tool configuration
```

## Configuration

Create `.sda-config.yaml` in your project root:

```yaml
# .sda-config.yaml
specsDir: ./specs
templatesDir: ./templates
schemasDir: ./schemas
defaultOwner: ${USER}
validation:
  strict: false
  autoFix: false
generation:
  defaultOutput: ./specs
  askForValues: true
```

## Philosophy

Specification-Driven Agents proposes a "contract-first" approach to software development where:

1. **Human-legible** - Specifications are written for humans to understand first
2. **AI-executable** - Agents can parse, validate, and execute contract directives
3. **Team-analyzable** - Every decision is traceable and question-able
4. **Explicit authority** - Clear hierarchy of what governs what
5. **Validation before change** - Automated checks ensure contract compliance

Every specification should answer:
- **What?** - What is this spec defining?
- **Why?** - Why does it exist?
- **Who governs?** - What authority does it inherit from?
- **What depends on it?** - What specs reference this?
- **How do we validate it?** - What are the acceptance criteria?

## Development

```bash
# Clone and setup
git clone https://github.com/inseone1988/specification-driven-agents.git
cd specification-driven-agents/tooling

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Link for local development
npm link

# Test locally
sda --help
```

## License

MIT - See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/inseone1988/specification-driven-agents) for contribution guidelines.

## Support

- [GitHub Issues](https://github.com/inseone1988/specification-driven-agents/issues)
- [Documentation](https://github.com/inseone1988/specification-driven-agents)