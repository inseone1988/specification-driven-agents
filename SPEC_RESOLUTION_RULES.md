# SPEC_RESOLUTION_RULES.md

This document defines how humans and agents determine which specifications to read before making changes.

## Goal

Do not read the whole tree by default.
Resolve the minimum authoritative read set needed for the task.

That reduces token waste, review overhead, and accidental contradictions.

## Resolution process

Given a task or change request:

1. identify the target capability, domain, or artifact
2. locate the nearest directly relevant spec
3. walk upward through `inherits_from` to collect governing specs
4. collect required sibling dependencies from `depends_on` only when relevant
5. include validation specs if the task changes behavior, data shape, or interfaces
6. stop when the authority chain is complete and the task is unambiguous

## Minimum read set

For most implementation tasks, the minimum read set should include:
- one root or genesis source
- one or more applicable standards
- the direct domain spec
- the local implementation or task-change spec
- any required validation spec

## Resolution priorities

Prefer specs that are:
1. higher in authority
2. more directly relevant to the requested change
3. more current by active status
4. explicit about affected paths and invariants

## When to expand the read set

Expand when:
- references do not resolve
- two specs appear to conflict
- security boundaries are involved
- data migrations are involved
- the task crosses bounded contexts
- the implementation target is unclear

## When to stop

Stop reading when all of these are true:
- the governing authority chain is known
- the direct scope is known
- affected targets are identified
- validation requirements are identified
- no unresolved conflicts remain

## Anti-patterns

Avoid:
- reading dozens of files because the structure is unclear
- implementing from examples instead of governing specs
- assuming a local file overrides a higher-order rule
- treating dependency references as authority references

## Practical outcome

A well-structured specification system should let a human or agent answer:
- what do I need to read?
- what governs this change?
- what must I update?
- how will I know it is valid?

If those questions require hunting through the repository, the spec system is not mature enough yet.
