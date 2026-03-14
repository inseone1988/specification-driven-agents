# VISION.md

## The shift

We are entering a new era of software creation.
AI can produce code quickly, but speed without structure produces systems that are hard to trust.

The difference between durable software and prompt garbage is not whether AI was used.
It is whether architecture, contracts, and validation governed the work.

## Our position

We reject the idea that serious software should emerge from untracked prompting alone.
We believe human + AI collaboration works best when it is grounded in explicit specifications.

That means:
- a human can audit the intent
- an agent can resolve the relevant rules
- implementation can be traced to contracts
- validation can prove alignment

## The problem

As systems grow:
- specs become fragmented
- agents read too many files
- dependencies become implicit
- changes drift across docs, code, and behavior
- teams lose confidence in what is true

## The answer

Use specifications as a governed contract system.

A specification is not just text.
A specification is a structured agreement that defines:
- authority
- scope
- dependencies
- invariants
- implementation impact
- validation requirements

## Standard goals

This project aims to provide:
1. a canonical contract shape for specs
2. a shared taxonomy for spec types
3. an authority model for inheritance and precedence
4. a validation model for consistency and completeness
5. examples that humans and agents can both follow

## Principle statement

A project should be explainable as a chain:

**vision -> standards -> domain contracts -> implementation contracts -> validation -> code**

When that chain breaks, confidence breaks.
When that chain is explicit, AI becomes a multiplier instead of a chaos engine.
