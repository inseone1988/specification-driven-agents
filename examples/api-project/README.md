# Example: Building an API with Specification-Driven Agents

A complete example showing how to use Specification-Driven Agents for API development.

## Problem

How do we ensure consistency across API design, implementation, and documentation?
How do we make sure every team member—and AI agent—understands the API contract?

## Solution

Follow the specification hierarchy:

```
genesis.md → standards/ → domains/ → apis/ → implementations/
    ↓              ↓            ↓          ↓           ↓
 Vision      Security &     Business   Endpoint    Code that
             Coding         Domains    Contracts   implements
```

## Project Structure

```
api-project/
├── specs/
│   ├── genesis.md              # Project vision
│   ├── standards/
│   │   ├── security.yaml       # Auth, HTTPS, data protection
│   │   └── coding.yaml        # Naming conventions, format
│   ├── domains/
│   │   └── catalog.yaml        # Product domain
│   └── apis/
│       └── products-api.yaml   # Product endpoints
├── schemas/
│   └── specification-contract.schema.yaml
└── .sda-config.yaml
```

## Getting Started

```bash
# Install the CLI
npm install -g spec-driven-agents

# Initialize this example
cd api-project
sda init

# Explore the spec hierarchy
sda resolve products-api
sda graph --all -o mermaid

# Validate everything
sda validate-project --fix --write
sda refs --validate
```

## Key Commands

```bash
# Generate a new spec
sda generate genesis
sda generate domain my-domain
sda generate api my-api

# Validate
sda validate specs/apis/products-api.yaml
sda validate-project --fix --write

# Analyze dependencies
sda refs --validate
sda resolve products-api

# Generate visualization
sda graph --all -o mermaid -f graph.md
```

## Specification Types Used

| Type | File | Purpose |
|------|------|---------|
| genesis | `genesis.md` | Project vision and goals |
| standard | `standards/security.yaml` | Security requirements |
| standard | `standards/coding.yaml` | API naming conventions |
| domain | `domains/catalog.yaml` | Product domain model |
| api | `apis/products-api.yaml` | Product API contract |

## Questions This Approach Answers

1. **"Why does this endpoint exist?"** → `sda resolve products-api`
2. **"What security rules must this API follow?"** → Check `inherits_from` in products-api.yaml
3. **"What breaks if we change this field?"** → `sda refs --spec products-api`
4. **"Is this API spec valid?"** → `sda validate specs/apis/products-api.yaml`

## Learn More

- [Main Documentation](https://github.com/inseone1988/specification-driven-agents)
- [CLI Reference](../tooling/README.md)
- [Specification Types](../SPEC_TYPES.md)
- [Authority Model](../SPEC_AUTHORITY_MODEL.md)
