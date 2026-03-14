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
- `schemas/specification-contract.schema.yaml` — canonical contract structure
- `specs/spec-template.yaml` — human authoring template
- `examples/domain-spec.example.yaml` — worked example

## Status

This is the first public foundation.
It is intentionally small, opinionated, and designed to evolve.

## Principles

- documentation is architecture, not decoration
- agents must resolve authority, not guess intent
- lower-level specs may refine but must not contradict higher-level contracts
- every meaningful change should be traceable from intention to implementation

## Long-term direction

This project aims to define a practical standard for:
- spec topology
- authority/inheritance rules
- validation rules
- machine-readable spec graphs
- agent read-resolution rules
- contract-driven implementation workflows

If we do this right, teams will spend less time re-explaining systems and more time building them.
