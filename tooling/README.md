# SDA CLI

The `sda` command-line interface for Specification-Driven Agents.

## Installation

```bash
npm install -g spec-driven-agents
```

Or run without installing:
```bash
npx spec-driven-agents <command>
```

## Quick Start

```bash
# Initialize a new SDA project
sda init my-project
cd my-project

# Generate specs
sda generate genesis my-project
sda generate domain auth
sda generate task-change login-flow

# Validate
sda validate specs/genesis/my-project.yaml
sda validate-project

# Resolve authority chain
sda resolve domain-auth

# Visualize dependencies
sda graph --all -o mermaid

# Check git status of specs
sda git status
```

## Commands

### Core

#### `sda init <project-name>`

Initialize a new SDA project with:
- `.sda-config.yaml` — project configuration
- `specs/` directory structure
- Example specs (genesis, standard, domain)
- `README.md` — human documentation
- `AGENTS.md` — agent onboarding ("This project uses SDA")
- `CLAUDE.md` — same as AGENTS.md (both are standard entry points)
- `.sda/plugins/` — plugin directory with example

Options:
- `--skip-examples` — Don't create example specs
- `--force` — Overwrite existing directory

#### `sda generate <type> [name]`

Generate a new spec from template.

Types (built-in): genesis, standard, domain, implementation, api, migration, security, validation, operational, task-change

Types are extensible via plugins. Run `sda plugin list` to see all available types.

Options:
- `-o, --output <path>` — Output file path
- `-f, --force` — Overwrite existing file
- `-v, --value <key=value>` — Set template variable (repeatable)
- `-j, --json-values <json>` — Additional values as JSON string
- `--preview` — Preview generated spec without writing

Examples:
```bash
# Simple generation
sda generate domain user-management

# With variables
sda generate task-change oauth-integration \
  -v "title=OAuth 2.0 Integration" \
  -v "parent_spec=domain-auth" \
  -v "tags=backend,security"

# Preview before writing
sda generate api users --preview
```

#### `sda validate <path>`

Validate a single spec file against the contract schema.

Checks:
- Required sections present (meta, authority, purpose, context, contracts, implementation, validation, history)
- Authority level matches spec type
- Type-specific required fields
- YAML validity

Options:
- `--strict` — Treat warnings as errors

#### `sda validate-project`

Validate all specs in the project at once.

Options:
- `--fix` — Auto-fix common issues
- `--write` — Write fixes back to files
- `--fail-fast` — Stop on first error
- `-d, --dir <path>` — Custom specs directory

#### `sda resolve <spec-id>`

Walk the authority chain for a spec.

Resolves:
- `inherits_from` chain (parent specs)
- `depends_on` references (dependencies)
- Circular dependency detection

Options:
- `-d, --depth <n>` — Maximum resolution depth (default: 10)

Output format:
- Hierarchy (authority chain)
- Dependencies
- Conflicts
- Circular dependencies (if any)

#### `sda status <spec-id> <new-status>`

Update a spec's lifecycle status.

Valid statuses: draft, review, approved, implemented, deprecated, archived

Valid transitions are configurable via `.sda-config.yaml`:
```yaml
lifecycle:
  allowedTransitions:
    draft: [review, archived]
    review: [approved, draft, archived]
```

Default transitions if not configured:
- draft → review, archived
- review → approved, draft, archived
- approved → implemented, review, archived
- implemented → deprecated, archived
- deprecated → archived
- archived → (terminal)

#### `sda graph`

Generate dependency graphs.

Options:
- `-a, --all` — Graph all specs
- `-s, --spec <id>` — Graph single spec
- `-o, --output <format>` — Output format: dot, mermaid, json (default: dot)
- `-f, --file <path>` — Write to file instead of stdout

Formats:
- **DOT** — Graphviz format, color-coded by status
- **Mermaid** — Markdown-compatible flowchart syntax
- **JSON** — Machine-readable node/edge list

### Git Integration

#### `sda git status`

Show git status filtered to spec files.

Options:
- `-s, --short` — Compact format

#### `sda git commit [message]`

Commit spec changes with auto-generated conventional commit message.

The message format is:
```
spec: add spec-id-1, update spec-id-2; remove spec-id-3
```

Options:
- `-m, --message <msg>` — Custom commit message
- `-a, --auto-stage` — Stage all spec changes before commit

#### `sda git stage [files...]`

Stage spec files. If no files provided, stages all modified/untracked specs.

#### `sda git hooks`

Install git hooks:
- **pre-commit**: Runs `sda validate-project --fail-fast`
  - Blocks commit if specs are invalid
- **post-commit**: Placeholder for timestamp updates (disabled by default)

#### `sda git clean`

Check if working tree is clean. Exit code 0 if clean, 1 if dirty.

### Comparison

#### `sda diff <spec-path> [compare-path]`

Compare two specs or analyze a single spec.

Without `compare-path`: Shows spec overview (meta, authority, purpose, implementation summary)

With `compare-path`: Shows structural differences:
- Added fields
- Removed fields
- Changed values

Options:
- `--json` — Output as JSON
- `--summary` — Show counts only, skip details

### Plugin Management

#### `sda plugin list`

List all discovered plugins.

Options:
- `-v, --verbose` — Show detailed information

#### `sda plugin show <name>`

Show details of a specific plugin.

#### `sda plugin init`

Create `.sda/plugins/` directory in current project with example plugin structure.

#### `sda plugin validate`

Validate all discovered plugins for configuration errors.

## Configuration

### `.sda-config.yaml`

Project-level configuration:

```yaml
project:
  name: my-project
  specsDirectory: specs
  strictValidation: false

lifecycle:
  allowedTransitions:
    draft: [review, archived]
    review: [approved, draft, archived]
    approved: [implemented, review, archived]
    implemented: [deprecated, archived]
    deprecated: [archived]
    archived: []

git:
  autoStage: true
  conventionalCommits: true
```

### Global Config

User-level config at `~/.sda/config.yaml`:

```yaml
templates:
  defaultAuthor: "Your Name"

plugins:
  directories:
    - ~/.sda/plugins/
```

## Plugin Development

### Simple Template Plugin

Create `.sda/plugins/my-plugin/`:

```
my-plugin/
├── plugin.yaml          # Optional config
└── templates/
    └── microservice.yaml # Template file
```

The template file is a standard SDA spec with `{{variable}}` placeholders:

```yaml
meta:
  id: {{id}}
  title: {{title}}
  type: microservice
```

SDA auto-discovers the `microservice` type from the template filename.

### Configured Plugin

```yaml
# .sda/plugins/my-plugin/plugin.yaml
name: my-plugin
version: 1.0.0
specTypes:
  - type: microservice
    level: implementation
    template: microservice.yaml
  - type: helm-chart
    level: implementation
    template: helm-chart.yaml
```

### NPM Package Plugin

Package name: `sda-plugin-<name>`

```json
{
  "name": "sda-plugin-kubernetes",
  "sda": {
    "specTypes": [
      { "type": "k8s-deployment", "level": "implementation" }
    ]
  }
}
```

Install: `npm install -g sda-plugin-kubernetes`

SDA automatically discovers and registers the plugin.

## Template Engine

The template engine supports Handlebars-like syntax:

### Variables
```yaml
meta:
  id: {{id}}
  title: {{title}}
  owner: {{owner | "team"}}  # Default value
```

### Conditionals
```yaml
{{#if hasDatabase}}
database:
  type: {{dbType}}
{{/if}}
```

### Loops
```yaml
features:
{{#each features}}  - {{this}}
{{/each}}
```

Loop variables:
- `items_index` — Current index
- `items_first` — True if first iteration
- `items_last` — True if last iteration
- Object properties are merged directly (use `{{property}}` for object arrays)

## Spec Contract Structure

Every SDA spec is a YAML file with these top-level sections:

```yaml
meta:          # Identity and metadata
  id: spec-id
  title: Title
  type: domain
  version: 0.1.0
  status: draft
  owner: name

authority:     # Graph relationships
  level: domain
  inherits_from: [parent-spec]
  depends_on: [dep-spec]
  conflicts_with: []

purpose:       # Intent and scope
  summary: What this spec does
  problem: Why it exists
  scope:
    includes: []
    excludes: []
  non_goals: []

context:       # Environment
  bounded_context: name
  actors: []
  capabilities: []
  constraints: []

contracts:     # Behavioral contracts
  entities: []
  commands: []
  queries: []
  events: []
  invariants: []
  validations: []

implementation:# Execution plan
  targets: []
  affected_paths: []
  generation_mode: manual
  migration_strategy: safe

validation:    # Verification
  required_checks: []
  acceptance_criteria: []

agent_directives: # AI behavior rules
  required_read_order: []
  must: []
  must_not: []

history:       # Change tracking
  change_reason: Initial spec
  previous_version: null
  change_type: additive
  approved_by: []
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation error / Invalid spec |
| 2 | Command error |
| 3 | Plugin error |

## Contributing

See `CONTRIBUTING.md` in the repository root.
