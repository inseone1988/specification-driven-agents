# SPEC_AUTHORITY_MODEL.md

This document defines how authority flows between specifications.

## Core rule

Lower-level specifications may **refine** higher-level specifications.
They may not **contradict** them.

If a lower-level spec conflicts with a higher-level one, the lower-level spec is invalid until the conflict is resolved explicitly.

## Recommended authority hierarchy

1. `genesis`
2. `standard`
3. `domain`
4. `implementation`
5. `task-change`

Other types such as `security`, `validation`, `api`, `migration`, and `operational` may sit alongside these based on project needs, but their governing relationship must always be explicit.

## Meaning of each level

### `genesis`
Defines the root vision, system philosophy, major bounded contexts, and foundational constraints.
It is the highest narrative and architectural authority.

### `standard`
Defines global rules that apply across the system or across many domains.
Examples: security laws, event rules, naming conventions, migration safety rules.

### `domain`
Defines a bounded context and its business or operational contracts.
Domain specs interpret higher-order rules for a specific area of responsibility.

### `implementation`
Defines concrete realization details such as modules, routes, schema changes, file generation, or infrastructure wiring.
Implementation specs must stay inside the domain and standard constraints above them.

### `task-change`
Defines a single scoped change tied to delivery work.
It is the narrowest authority level and must trace back to the governing domain and standard specs.

## Inheritance rules

A spec may inherit from one or more governing specs.
Inheritance means the child spec accepts the parent's relevant constraints unless it explicitly marks a compatible refinement.

A child spec must not:
- weaken a mandatory security rule
- bypass a declared trust boundary
- redefine the source of truth contrary to a governing spec
- introduce behavior forbidden by a parent spec

## Dependency vs authority

These are not the same.

- `inherits_from` means the parent governs this spec
- `depends_on` means this spec references or relies on another spec without implying authority over it

A spec can depend on a sibling spec.
A spec should not inherit from a sibling unless authority is intentionally designed that way.

## Conflict handling

When a conflict appears:
1. identify the highest-authority source involved
2. determine whether the lower-level spec is contradicting or legitimately refining
3. if contradiction exists, mark the lower-level spec invalid or draft until corrected
4. if the higher-level rule is wrong, update the higher-level spec first

## Practical rule for humans and agents

Never implement from a local spec alone when a higher-order governing spec exists.
Resolve the full chain first.

A safe chain looks like:

`genesis -> standard -> domain -> implementation -> task-change`

If that chain cannot be explained, the change is under-specified.
