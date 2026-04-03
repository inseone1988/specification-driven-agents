import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SchemaValidator } from '../src/validators/schema-validator'
import fs from 'fs/promises'
import path from 'path'

describe('SchemaValidator', () => {
  let validator: SchemaValidator
  
  beforeEach(() => {
    validator = new SchemaValidator()
  })
  
  describe('validateSpec', () => {
    it('should validate a complete specification', () => {
      const validSpec = `meta:
  id: domain-user-management
  title: User Management Domain
  type: domain
  version: 1.0.0
  contract_version: 1.0.0
  status: draft
  owner: team@example.com
  created_at: 2024-01-01
  updated_at: 2024-01-01
authority:
  level: domain
  inherits_from: []
  depends_on: []
purpose:
  summary: Manage user accounts and authentication
  problem: Need centralized user management
  scope:
    includes:
      - user registration
      - authentication
    excludes:
      - billing
  non_goals:
    - social login integration
context:
  bounded_context: user-management
  actors:
    - user
    - admin
  capabilities:
    - create user accounts
    - authenticate users
  constraints:
    - passwords must be hashed
contracts:
  entities:
    - user
    - role
  commands:
    - register_user
    - authenticate_user
  queries:
    - get_user
  events:
    - user_registered
  invariants:
    - user emails must be unique
  validations:
    - email format validation
implementation:
  targets:
    - src/modules/users
  affected_paths:
    - src/modules/users/**
  generation_mode: guided
  migration_strategy: safe
validation:
  required_checks:
    - email_uniqueness
  acceptance_criteria:
    - users can register
    - users can authenticate
history:
  change_reason: initial specification
  previous_version: '0.0.0'
  change_type: additive
  approved_by:
    - team-lead`
      
      const result = validator.validateSpec(validSpec, 'test.yaml')
      
      // Debug output
      if (!result.valid) {
        console.log('Validation errors:', result.errors)
        console.log('Validation warnings:', result.warnings)
      }
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.spec).toBeDefined()
      expect(result.spec?.meta.id).toBe('domain-user-management')
    })
    
    it('should detect missing required sections', () => {
      const invalidSpec = `
meta:
  id: test-spec
  title: Test
  type: domain
  version: 1.0.0
  contract_version: 1.0.0
  status: draft
  owner: test
  created_at: 2024-01-01
  updated_at: 2024-01-01
`
      
      const result = validator.validateSpec(invalidSpec, 'test.yaml')
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      
      // Should have errors for missing sections
      const errorMessages = result.errors.map(e => e.message)
      expect(errorMessages).toContain('Missing required section: authority')
      expect(errorMessages).toContain('Missing required section: purpose')
    })
    
    it('should detect invalid spec type', () => {
      const invalidSpec = `
meta:
  id: test-spec
  title: Test
  type: invalid-type
  version: 1.0.0
  contract_version: 1.0.0
  status: draft
  owner: test
  created_at: 2024-01-01
  updated_at: 2024-01-01
`
      
      const result = validator.validateSpec(invalidSpec, 'test.yaml')
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_TYPE')).toBe(true)
    })
    
    it('should validate type-specific requirements', () => {
      const domainSpec = `
meta:
  id: domain-test
  title: Test Domain
  type: domain
  version: 1.0.0
  contract_version: 1.0.0
  status: draft
  owner: test
  created_at: 2024-01-01
  updated_at: 2024-01-01

authority:
  level: domain
  inherits_from: []
  depends_on: []

purpose:
  summary: Test
  problem: Test
  scope:
    includes: []
    excludes: []
  non_goals: []

context:
  bounded_context: test
  actors: []
  capabilities: []
  constraints: []

contracts:
  invariants: []
  validations: []

implementation:
  targets: []
  affected_paths: []
  generation_mode: guided
  migration_strategy: safe

validation:
  required_checks: []
  acceptance_criteria: []

history:
  change_reason: test
  previous_version: null
  change_type: additive
  approved_by: []
`
      
      const result = validator.validateSpec(domainSpec, 'test.yaml')
      
      // Domain spec should have warnings for missing entities, commands, etc.
      expect(result.warnings.some(w => w.code === 'DOMAIN_MISSING_ENTITIES')).toBe(true)
      expect(result.warnings.some(w => w.code === 'DOMAIN_MISSING_COMMANDS')).toBe(true)
    })
  })
  
  describe('formatResults', () => {
    it('should format valid results', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        spec: {
          meta: {
            id: 'test-spec',
            type: 'domain',
            status: 'draft',
            version: '1.0.0'
          }
        }
      }
      
      const formatted = validator.formatResults(result)
      
      expect(formatted).toContain('✅ Specification is valid!')
      expect(formatted).toContain('test-spec')
    })
    
    it('should format results with errors', () => {
      const result = {
        valid: false,
        errors: [
          {
            path: 'test.yaml#meta.id',
            message: 'Missing required field: meta.id',
            code: 'MISSING_FIELD',
            severity: 'error' as const
          }
        ],
        warnings: [],
        spec: undefined
      }
      
      const formatted = validator.formatResults(result)
      
      expect(formatted).toContain('❌ Specification has validation errors:')
      expect(formatted).toContain('Missing required field')
    })
    
    it('should format JSON output', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        spec: {
          meta: {
            id: 'test-spec',
            type: 'domain'
          }
        }
      }
      
      const formatted = validator.formatResults(result, true)
      const parsed = JSON.parse(formatted)
      
      expect(parsed.valid).toBe(true)
      expect(parsed.spec.meta.id).toBe('test-spec')
    })
  })
})