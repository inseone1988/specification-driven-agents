// Type definitions for Specification-Driven Agents

export type SpecType =
  | 'genesis'
  | 'standard'
  | 'domain'
  | 'implementation'
  | 'api'
  | 'migration'
  | 'security'
  | 'validation'
  | 'operational'
  | 'task-change'

export type SpecStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'implemented'
  | 'deprecated'
  | 'archived'

export type AuthorityLevel =
  | 'genesis'
  | 'standard'
  | 'domain'
  | 'implementation'
  | 'task-change'

export type ChangeType =
  | 'additive'
  | 'breaking'
  | 'deprecation'
  | 'correction'
  | 'refactor'

export interface SpecMeta {
  id: string
  title: string
  type: SpecType
  version: string
  contract_version: string
  compatibility?: {
    supported_from: string
    deprecated_after: string | null
  }
  status: SpecStatus
  owner: string
  created_at: string
  updated_at: string
  tags?: string[]
}

export interface Authority {
  level: AuthorityLevel
  inherits_from: string[]
  depends_on: string[]
  supersedes?: string[]
  conflicts_with?: string[]
}

export interface Purpose {
  summary: string
  problem: string
  scope: {
    includes: string[]
    excludes: string[]
  }
  non_goals: string[]
}

export interface Context {
  bounded_context: string
  actors: string[]
  capabilities: string[]
  constraints: string[]
}

export interface Contracts {
  entities?: string[]
  commands?: string[]
  queries?: string[]
  events?: string[]
  invariants: string[]
  validations: string[]
  permissions?: string[]
}

export interface Implementation {
  targets: string[]
  affected_paths: string[]
  generation_mode: 'guided' | 'automatic' | 'manual'
  migration_strategy: 'safe' | 'breaking' | 'deprecation'
  notes?: string[]
}

export interface Validation {
  required_checks: string[]
  acceptance_criteria: string[]
  test_requirements?: string[]
  traceability_requirements?: string[]
}

export interface AgentDirectives {
  required_read_order: string[]
  must: string[]
  must_not: string[]
  completion_requirements: string[]
}

export interface History {
  change_reason: string
  previous_version: string | null
  change_type: ChangeType
  approved_by: string[]
  review_ref?: string | null
  notes?: string[]
}

export interface SpecContract {
  meta: SpecMeta
  authority: Authority
  purpose: Purpose
  context: Context
  contracts: Contracts
  implementation: Implementation
  validation: Validation
  agent_directives?: AgentDirectives
  history: History
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  spec?: SpecContract
}

export interface ValidationError {
  path: string
  message: string
  code: string
  severity: 'error'
}

export interface ValidationWarning {
  path: string
  message: string
  code: string
  severity: 'warning'
}

export interface GenerationOptions {
  type: SpecType
  name: string
  outputPath?: string
  force?: boolean
  template?: string
  values?: Record<string, any>
}

export interface ResolutionResult {
  specId: string
  hierarchy: string[]
  dependencies: string[]
  conflicts: string[]
  circularDependencies: string[][]
}