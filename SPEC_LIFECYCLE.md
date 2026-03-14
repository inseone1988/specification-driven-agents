# SPEC_LIFECYCLE.md

Specifications should move through a visible lifecycle.
This keeps teams and agents aligned on what is proposed, approved, implemented, or retired.

## Recommended statuses

- `draft` — early proposal, incomplete, not authoritative for implementation
- `review` — ready for discussion or validation, still not final
- `approved` — accepted as authoritative within its declared scope
- `implemented` — reflected in the system or codebase
- `deprecated` — still documented but should not guide new work
- `archived` — retained for history, no longer active

## Rules by status

### `draft`
- may be incomplete
- must not drive production implementation without explicit approval
- should identify open questions clearly

### `review`
- structure should be complete
- references should resolve
- acceptance criteria should be testable

### `approved`
- may govern implementation
- should have clear authority relationships
- should define traceability requirements

### `implemented`
- must map to actual implementation targets
- should have validation evidence where possible

### `deprecated`
- should state what replaces it
- should remain readable for trace history

### `archived`
- retained only for audit/history/reference
- should not be used as active authority

## Transition expectations

Typical path:

`draft -> review -> approved -> implemented -> deprecated -> archived`

Not every spec will pass through every state, but status should always reflect reality.

## Agent behavior

Agents should prefer higher-authority specs with the strongest active status.

Suggested order of trust when multiple candidates exist:
1. approved
2. implemented
3. review
4. draft
5. deprecated
6. archived

If an `implemented` spec contradicts an `approved` higher-authority spec, treat the conflict as drift and flag it.
