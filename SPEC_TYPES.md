# SPEC_TYPES.md

All specifications share the same contract envelope, but not all specifications serve the same purpose.

## Supported types

### 1. `genesis`
The root narrative and architectural entry point.
Defines project vision, major domains, foundational constraints, and expected derivative specs.

### 2. `standard`
Global engineering laws and cross-cutting rules.
Examples: security rules, event rules, database conventions, naming rules, architectural constraints.

### 3. `domain`
Defines a bounded context or core business capability.
Examples: identity, device management, orders, presence, billing.

### 4. `implementation`
Defines concrete realization details for code, migrations, routes, modules, jobs, or infrastructure changes.

### 5. `api`
Defines interface contracts for endpoints, request/response schemas, permissions, and behavior.

### 6. `migration`
Defines safe structural changes to persistence layers or state evolution mechanisms.

### 7. `security`
Defines security-specific controls, constraints, trust boundaries, threat assumptions, and validation requirements.

### 8. `validation`
Defines how a system, domain, or implementation must be verified.
Examples: completeness rules, test requirements, reference integrity, compliance checks.

### 9. `operational`
Defines runtime, deployment, monitoring, incident, scaling, or environment requirements.

### 10. `task-change`
A focused change specification tied to one unit of delivery.
Useful for isolated implementation work with strict traceability back to higher-level specs.

## Shared rule

Every spec type must declare:
- identity
- authority level
- inheritance/dependencies
- purpose and scope
- implementation impact
- validation requirements

## Important distinction

Different types may vary in payload content, but they must all comply with the same top-level contract.

That is how we keep flexibility without losing structure.
