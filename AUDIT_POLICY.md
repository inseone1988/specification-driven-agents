# AUDIT_POLICY.md

This project treats traceability as part of engineering quality.
If a contract changes, the change must be explainable.

## Audit goals

The audit model exists to answer:
- what changed?
- why did it change?
- who approved it?
- what authority did it affect?
- what implementation targets or behaviors are impacted?
- which version of the standard governs it?

## Traceability layers

### 1. Git history
Git is the primary audit trail for:
- authorship
- timestamps
- diffs
- commit history
- tags and releases

All meaningful changes to standards, templates, schemas, or examples must be committed.

### 2. Spec metadata
Each active spec should carry internal audit metadata.

Required fields:
- `meta.version`
- `meta.updated_at`
- `meta.contract_version`
- `history.change_reason`
- `history.previous_version`
- `history.change_type`
- `history.approved_by`

Recommended fields:
- `history.review_ref`
- `history.notes`

### 3. Machine-readable validation
Specs should be machine-validatable so tools and agents can check audit completeness instead of relying on memory or convention.

## Mandatory rules

1. No silent contract mutation
   - meaningful changes must update version and change metadata

2. No implementation-driving spec without affected targets
   - if a spec can drive change, it must say what it affects

3. No unresolved authority ambiguity
   - `inherits_from` and `depends_on` must remain explicit

4. No breaking change without explicit classification
   - breaking changes must be marked as such

5. No deprecation without replacement guidance when applicable
   - if something is deprecated, point to what supersedes it

## Review expectations

The following changes should receive explicit human review:
- authority model changes
- contract schema changes
- security rule changes
- breaking changes to required fields
- examples that redefine standard behavior implicitly

## Release audit expectations

Before publishing a release:
- ensure the declared contract version is current
- ensure examples and templates reflect the intended contract
- ensure breaking changes are documented
- ensure tags/releases reflect the version policy

## Suggested commit discipline

Prefer commits that make the audit trail readable.
Examples:
- `Add versioning and audit policies`
- `Introduce contract compatibility metadata`
- `Mark authority conflict handling as normative`

Bad example:
- `misc changes`

## Practical principle

If a future human or agent cannot explain why a rule changed, the audit trail is insufficient.
