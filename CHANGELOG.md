# Changelog

All notable changes to this project.

## 0.2.0 - 2026-05-26

Major evolution from specification standard to CLI toolchain.

### Added
- **CLI Tooling**: Full `sda` command-line interface
  - `sda init` — Bootstrap projects with config, structure, and examples
  - `sda generate <type>` — Generate specs from templates with variable substitution
  - `sda validate <path>` — Single spec validation
  - `sda validate-project` — Bulk validation with auto-fix (`--fix --write`)
  - `sda resolve <spec-id>` — Walk authority tree, detect cycles
  - `sda status <spec-id> <state>` — Lifecycle state transitions
  - `sda graph --all` — DOT/Mermaid/JSON dependency graphs
  - `sda refs --validate` — Cross-spec reference validation
  - `sda diff` — Spec comparison and overview
- **Git Integration**: Native git workflow support
  - `sda git status` — Show spec changes
  - `sda git commit` — Auto-generate conventional commit messages
  - `sda git stage` — Stage spec files
  - `sda git hooks` — Pre-commit validation hook
  - `sda git clean` — Working tree check
- **Template Engine**: Advanced generation with conditionals and loops
  - `{{#if var}}...{{/if}}` conditionals
  - `{{#unless var}}...{{/unless}}` inverse conditionals
  - `{{#each items}}...{{/each}}` loops with `index`, `first`, `last`
  - `{{var | "default"}}` default values
  - Variable extraction and validation
- **Plugin System**: Extensible spec types without forking
  - Discovery from `.sda/plugins/`, `~/.sda/plugins/`, `sda-plugin-*` npm packages
  - Auto-registration of template-only plugins
  - `sda plugin list/show/init/validate` commands
- **Agent Onboarding**: Auto-generation of `AGENTS.md` and `CLAUDE.md`
- **Configurable Transitions**: Read `lifecycle.allowedTransitions` from `.sda-config.yaml`

### Changed
- **Unified format**: All specs (including genesis) now use `.yaml` exclusively
  - Removes the `genesis.md` special case
  - Genesis is just another node in the contract graph
- **Agent directives**: `AGENTS.md` and `CLAUDE.md` point to `genesis.yaml` as root

### Fixed
- Template engine replaced simple string replacement
- Graph command refactored from prototype methods to proper class
- Status transitions configurable from `.sda-config.yaml`
- Genesis now validatable like every other spec

## 0.1.0 - 2026-03-13

Initial public foundation.

Included:
- Project vision and framing
- Specification type taxonomy
- Specification contract schema
- Spec authoring template
- Authority model
- Lifecycle model
- Resolution rules
- Versioning policy
- Audit policy
- Audit metadata schema
- Genesis example (`.md` format)
- Domain example
- Standard example
- Initial agent directives support
