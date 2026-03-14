# Specification-Driven Agents

A contract-first standard for building software with humans and AI working together.

## Why this exists

Prompt-only software creation does not scale well.
As projects grow, agents guess, humans forget, specifications drift, and architecture turns into folklore.

Specification-Driven Agents proposes a stricter model:

- architecture before implementation
- contracts before generation
- explicit authority and inheritance
- traceable relationships between specs
- validation before change

The goal is simple: make human+AI engineering auditable, reproducible, and structurally sound.

## Core idea

A project is not just a repository full of documents.
A project is a **directed contract graph**.

Every specification should clearly define:
- what it is
- why it exists
- what governs it
- what it depends on
- what it affects
- how it is validated

## Initial contents

- `VISION.md` — philosophy and framing
- `SPEC_TYPES.md` — taxonomy of supported specification types
- `SPEC_AUTHORITY_MODEL.md` — authority, inheritance, and contradiction rules
- `SPEC_LIFECYCLE.md` — lifecycle states for specifications
- `SPEC_RESOLUTION_RULES.md` — how humans and agents determine what to read
- `VERSIONING.md` — semantic versioning policy for the standard and specs
- `AUDIT_POLICY.md` — traceability and audit rules
- `schemas/specification-contract.schema.yaml` — canonical contract structure
- `schemas/spec-audit.schema.json` — machine-readable audit metadata validation
- `specs/spec-template.yaml` — human authoring template
- `examples/domain-spec.example.yaml` — worked example
- `examples/standard-spec.example.yaml` — worked standard example
- `examples/genesis.example.md` — worked genesis example
- `CHANGELOG.md` — release history

## Status

This is the first public foundation.
It is intentionally small, opinionated, and designed to evolve.

## Principles

- documentation is architecture, not decoration
- agents must resolve authority, not guess intent
- lower-level specs may refine but must not contradict higher-level contracts
- every meaningful change should be traceable from intention to implementation
- no silent contract mutation
- agent behavior should be directed by contract when automation is involved

## Long-term direction

This project aims to define a practical standard for:
- spec topology
- authority/inheritance rules
- validation rules
- machine-readable spec graphs
- agent read-resolution rules
- contract-driven implementation workflows

If we do this right, teams will spend less time re-explaining systems and more time building them.
