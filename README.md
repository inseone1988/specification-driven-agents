# Specification-Driven Agents (SDA)

> **"Specifications that humans understand, AI agents execute"**

A contract-first standard and CLI toolchain for building software where specifications are human-legible, AI-executable, and team-analyzable.

## Why This Exists

Prompt-only software creation does not scale. As projects grow, agents guess, humans forget, specifications drift, and architecture turns into folklore.

SDA proposes a stricter model:

- Architecture before implementation
- Contracts before generation
- Explicit authority and inheritance
- Traceable relationships between specs
- Validation before change
- Git-native workflow integration

The goal: make human-AI-agent engineering legible, traceable, and analytically rigorous.

## Quick Start

```bash
# Install the CLI globally
npm install -g spec-driven-agents

# Initialize a new SDA project
sda init my-project
cd my-project

# Generate your first spec
sda generate genesis my-project

# Validate all specs
sda validate-project

# Check git integration
sda git status
```

## What Changed

This project evolved from a specification standard to a full CLI toolchain:

### Core Framework
- **Unified format**: All specs are YAML (no more `.md` mixing)
- **Agent onboarding**: Auto-generates `AGENTS.md` and `CLAUDE.md`
- **Contract graph**: Every spec participates in a directed authority graph
- **Reference system**: `@spec-id`, `@remote:owner/repo`, `@external:./path`

### CLI Tooling (`sda`)
- `sda init` — Bootstrap project with config, folder structure, and example specs
- `sda generate <type> [name]` — Generate specs from templates with variable substitution
- `sda validate <path>` — Single spec validation
- `sda validate-project` — Bulk validation across entire project
- `sda resolve <spec-id>` — Walk authority tree and detect cycles
- `sda status <spec-id> <state>` — Lifecycle state machine enforcement
- `sda graph --all` — Generate DOT/Mermaid/JSON dependency graphs
- `sda refs --validate` — Parse and validate cross-spec references
- `sda diff <spec> [compare-spec]` — Compare specs or show overview

### Git Integration
- `sda git status` — Show spec changes in git
- `sda git commit` — Auto-generate conventional commits from spec changes
- `sda git stage` — Stage spec files
- `sda git hooks` — Install pre-commit validation hook
- `sda git clean` — Check working tree state

### Template Engine
- **Conditionals**: `{{#if var}}...{{/if}}`, `{{#unless var}}...{{/unless}}`
- **Loops**: `{{#each items}}...{{/each}}` with `index`, `first`, `last`
- **Defaults**: `{{var | "default"}}`
- **Validation**: Required variable detection, type checking

### Plugin System
- **Discovery**: Project-local `.sda/plugins/`, global `~/.sda/plugins/`, NPM `sda-plugin-*`, built-in
- **Registration**: Auto-discovers `plugin.yaml` or anonymous template directories
- **Extensibility**: Add custom spec types, validators, generators without forking

## Specification Types

Every spec shares the same YAML contract structure:

```yaml
meta:          # id, type, version, status, owner, tags
authority:     # level, inherits_from[], depends_on[], conflicts_with[]
purpose:       # summary, problem, scope, non_goals[]
context:       # bounded_context, actors[], capabilities[], constraints[]
contracts:     # entities, commands, queries, events, invariants, validations, permissions
implementation:# targets[], affected_paths[], generation_mode, migration_strategy
validation:    # required_checks[], acceptance_criteria[]
agent_directives: # required_read_order[], must[], must_not[], completion_requirements[]
history:       # change_reason, previous_version, change_type, approved_by[]
```

**Types:** genesis, standard, domain, implementation, api, migration, security, validation, operational, task-change

## Agent Onboarding

When SDA initializes a project, it creates:

```
AGENTS.md       # "This project uses SDA. Read specs/genesis/... first."
CLAUDE.md       # Same instructions (both are standard agent entry points)
```

These tell any AI agent:
1. Read the genesis spec first (root of authority graph)
2. Follow `inherits_from` and `depends_on` edges
3. Validate specs before editing
4. Use `implementation.affected_paths` to know what changes

## Philosophy

A project is not just a repository full of documents. A project is a **directed contract graph**.

Every specification defines:
- **What** it is (`meta`, `purpose`)
- **Why** it exists (`purpose.problem`, `purpose.vision`)
- **Who governs** it (`authority.inherits_from`)
- **What depends on** it (`authority.depends_on`)
- **What it affects** (`implementation.affected_paths`)
- **How to validate** it (`validation`)

## Status

This is a working CLI toolchain built on the original specification standard. It is intentionally opinionated and designed to evolve.

## Documentation

- `VISION.md` — Philosophy and framing
- `SPEC_TYPES.md` — Taxonomy of specification types
- `SPEC_AUTHORITY_MODEL.md` — Authority, inheritance, contradiction rules
- `SPEC_LIFECYCLE.md` — Lifecycle states and transitions
- `SPEC_RESOLUTION_RULES.md` — How agents determine what to read
- `VERSIONING.md` — Semantic versioning policy
- `AUDIT_POLICY.md` — Traceability and audit rules
- `tooling/README.md` — CLI documentation

## Principles

- Specifications are architecture, not decoration
- Agents must resolve authority, not guess intent
- Lower-level specs may refine but must not contradict higher-level contracts
- Every meaningful change should be traceable from intention to implementation
- No silent contract mutation
- Agent behavior should be directed by contract when automation is involved
- Every spec should answer: **What?** **Why?** **Who governs?** **What depends on it?** **How do we validate it?**

## Long-Term Direction

- Plugin marketplace for domain-specific spec types
- IDE integrations (VS Code, Cursor) for spec-aware editing
- CI/CD hooks for spec validation gates
- Spec-to-code generation pipelines
- Cross-project spec import/export

If we do this right, teams will spend less time re-explaining systems and more time building them.
