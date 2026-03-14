# VERSIONING.md

This project uses Semantic Versioning for the **standard itself**, not just the repository.

## Version format

`MAJOR.MINOR.PATCH`

Examples:
- `0.1.0`
- `1.0.0`
- `1.2.3`

## Meaning

### MAJOR
Increment when a change is **breaking** for compliant specifications or tooling.

Examples:
- required top-level sections are renamed or removed
- authority rules change incompatibly
- required fields are redefined in a way that invalidates older compliant specs
- spec type behavior changes incompatibly

### MINOR
Increment when new capabilities are added in a **backward-compatible** way.

Examples:
- new optional fields
- new supported spec types
- new recommended rules
- additional validation guidance that does not invalidate already compliant specs

### PATCH
Increment for **non-breaking corrections or clarifications**.

Examples:
- typos
- wording improvements
- schema clarifications
- examples corrected without changing the contract meaning

## Scope of versioning

There are multiple relevant versions in this project:

1. **Project/release version**
   - the repository release version

2. **Contract/schema version**
   - the version of the specification contract itself

3. **Spec document version**
   - the version declared by each individual specification

These may move at different speeds, but compatibility must remain clear.

## Required metadata in specs

Every active spec should declare:
- `meta.version`
- `meta.contract_version`
- `meta.compatibility.supported_from`
- `meta.compatibility.deprecated_after`

## Change classification

Meaningful spec changes should also declare a `history.change_type`.

Recommended values:
- `breaking`
- `additive`
- `clarification`
- `deprecation`
- `security`

## Release guidance

### Before a release
- validate the contract schema
- validate examples and templates against the current contract expectations
- review any breaking changes explicitly
- update changelog or release notes

### On release
- create a git tag
- publish release notes with version impact summary
- highlight any migration guidance when required

## Compatibility rule

A spec is considered compatible when its declared `contract_version` is supported by the current validation and resolution rules.

If the standard introduces breaking changes, migration guidance should be published before or with the new major version.

## Early-stage policy

Until `1.0.0`, the standard is still evolving quickly.
Even so, breaking changes should be called out explicitly and not hidden inside vague updates.

No silent contract mutation.
