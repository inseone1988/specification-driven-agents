# genesis.md - Specification-Driven Agents

## Project Vision

**What:** A standard for contract-first software development with humans and AI working together  
**Why:** Modern software creation needs stronger structure than freeform prompting can provide  
**Who:** Architects, engineers, teams, AI agents, and organizations that care about traceability  

**Tagline:** "Architecture first. Contracts first. Confidence first."

---

## Design Philosophy

We believe:

1. **Architecture must govern generation**
2. **Specifications are executable intent, not decorative documents**
3. **Authority must be explicit**
4. **Dependencies must be traceable**
5. **Agents should resolve, not guess**
6. **Validation is part of the contract**
7. **Documentation drift is a structural failure**

---

## System Goal

Create a shared standard that explains how specification files should be structured, linked, inherited, validated, and applied during human+AI software engineering.

This project does not aim to replace software design.
It aims to make software design resolvable, auditable, and machine-usable.

---

## Required Derived Artifacts

From this genesis, the project should define and maintain:

1. **A canonical contract schema**
   - what every spec must contain
   - required top-level sections
   - conditional fields by spec type

2. **A taxonomy of spec types**
   - genesis
   - standard
   - domain
   - implementation
   - api
   - migration
   - security
   - validation
   - operational
   - task-change

3. **An authority model**
   - inheritance rules
   - contradiction rules
   - precedence rules

4. **A lifecycle model**
   - draft
   - review
   - approved
   - implemented
   - deprecated
   - archived

5. **Resolution rules**
   - minimum read set
   - authority chain discovery
   - dependency expansion behavior

6. **Worked examples**
   - at least one domain example
   - at least one genesis example
   - future examples for api, security, migration, and validation

---

## Core Constraints

These apply to the whole standard:

- no spec without identity
- no implementation-driving spec without declared affected targets
- no lower-level contradiction of higher-order authority
- no validation-free contract
- no hidden authority assumptions
- no uncontrolled spec sprawl without linking rules

---

## Non-Negotiable Rules

1. Every active spec must declare its authority position
2. Every implementation-driving spec must declare what it affects
3. Every meaningful change must be traceable to a governing contract
4. Examples do not override standards
5. Agents must prefer governing specs over local convenience
6. Ambiguity is a defect, not a workflow

---

## First Public Release Goal

The first public release should be small but coherent.
It should give the world enough structure to understand the approach and enough examples to apply it.

Minimum release contents:
- vision
- contract schema
- spec template
- spec types
- authority model
- lifecycle model
- resolution rules
- worked examples

---

## Next Evolution

After the initial release, the project should expand toward:
- machine-readable spec graphs
- graph validation tools
- reference resolution tooling
- agent read-set computation
- contract linting
- implementation traceability automation

---

**Genesis Created:** 2026-03-13  
**Version:** 0.1.0  
**Contract Version:** 0.1.0  
**Status:** Draft  
**Maintained By:** Javier + godinez
