import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger'
import { SpecContract, ValidationResult, ValidationError, ValidationWarning } from '../types'

interface ContractSchema {
  schema: {
    name: string
    version: string
    status: string
    description: string
  }
  required_top_level_sections: string[]
  optional_top_level_sections: string[]
  rules: string[]
  sections: Record<string, {
    required_fields?: string[]
    conditional_fields?: Record<string, string[]>
    field_rules?: Record<string, string>
  }>
  recommended_authority_hierarchy: string[]
  validation_outcomes: Record<string, string>
  machine_validation: {
    companion_schemas: string[]
  }
}

export class SchemaValidator {
  private schema: ContractSchema | null = null
  private schemaPath: string

  constructor(schemaPath?: string) {
    if (schemaPath) {
      this.schemaPath = schemaPath
    } else {
      // Determine if we're in the tooling directory or project root
      const cwd = process.cwd()
      const isToolingDir = cwd.endsWith('tooling') || path.basename(cwd) === 'tooling'
      
      if (isToolingDir) {
        // We're in tooling directory, go up one level to project root
        this.schemaPath = path.join(cwd, '..', 'schemas', 'specification-contract.schema.yaml')
      } else {
        // We're in project root or somewhere else
        this.schemaPath = path.join(cwd, 'schemas', 'specification-contract.schema.yaml')
      }
    }
  }

  /**
   * Load the contract schema from file
   */
  async loadSchema(): Promise<void> {
    try {
      const content = await fs.readFile(this.schemaPath, 'utf-8')
      this.schema = yaml.load(content) as ContractSchema
      Logger.debug(`Schema loaded: ${this.schema.schema.name} v${this.schema.schema.version}`)
    } catch (error) {
      Logger.warn(`Failed to load schema from ${this.schemaPath}: ${error instanceof Error ? error.message : String(error)}`)
      this.schema = null
    }
  }

  /**
   * Validate a specification against the contract schema
   */
  validateSpec(content: string, filePath: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    try {
      // Parse YAML
      const parsed = yaml.load(content)
      
      if (!parsed || typeof parsed !== 'object') {
        errors.push({
          path: filePath,
          message: 'File is not valid YAML',
          code: 'INVALID_YAML',
          severity: 'error'
        })
        return { valid: false, errors, warnings }
      }
      
      const spec = parsed as Record<string, any>
      
      // Validate against schema if loaded
      if (this.schema) {
        this.validateAgainstSchema(spec, filePath, errors, warnings)
      } else {
        // Fallback to basic validation
        this.validateMeta(spec, filePath, errors, warnings)
        this.validateAuthority(spec, filePath, errors, warnings)
        this.validatePurpose(spec, filePath, errors, warnings)
        this.validateContext(spec, filePath, errors, warnings)
        this.validateContracts(spec, filePath, errors, warnings)
        this.validateImplementation(spec, filePath, errors, warnings)
        this.validateValidation(spec, filePath, errors, warnings)
        this.validateHistory(spec, filePath, errors, warnings)
        
        // Type-specific validation
        const specType = spec.meta?.type
        if (specType) {
          this.validateTypeSpecific(spec, specType, filePath, errors, warnings)
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        spec: spec as SpecContract
      }
      
    } catch (error) {
      errors.push({
        path: filePath,
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'VALIDATION_ERROR',
        severity: 'error'
      })
      return { valid: false, errors, warnings }
    }
  }
  
  private validateMeta(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.meta) {
      errors.push({
        path: `${filePath}#meta`,
        message: 'Missing required section: meta',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const meta = spec.meta
    const requiredFields = ['id', 'title', 'type', 'version', 'contract_version', 'status', 'owner', 'created_at', 'updated_at']
    
    for (const field of requiredFields) {
      if (meta[field] === undefined) {
        errors.push({
          path: `${filePath}#meta.${field}`,
          message: `Missing required field: meta.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
    
    // Validate type
    const validTypes = [
      'genesis', 'standard', 'domain', 'implementation', 'api',
      'migration', 'security', 'validation', 'operational', 'task-change'
    ]
    
    if (meta.type && !validTypes.includes(meta.type)) {
      errors.push({
        path: `${filePath}#meta.type`,
        message: `Invalid type: ${meta.type}. Valid types are: ${validTypes.join(', ')}`,
        code: 'INVALID_TYPE',
        severity: 'error'
      })
    }
    
    // Validate status
    const validStatus = ['draft', 'review', 'approved', 'implemented', 'deprecated', 'archived']
    if (meta.status && !validStatus.includes(meta.status)) {
      warnings.push({
        path: `${filePath}#meta.status`,
        message: `Unusual status: ${meta.status}. Expected one of: ${validStatus.join(', ')}`,
        code: 'UNUSUAL_STATUS',
        severity: 'warning'
      })
    }
  }
  
  private validateAuthority(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.authority) {
      errors.push({
        path: `${filePath}#authority`,
        message: 'Missing required section: authority',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const authority = spec.authority
    const requiredFields = ['level', 'inherits_from', 'depends_on']
    
    for (const field of requiredFields) {
      if (authority[field] === undefined) {
        errors.push({
          path: `${filePath}#authority.${field}`,
          message: `Missing required field: authority.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
    
    // Validate level matches type
    const metaType = spec.meta?.type
    const authorityLevel = authority.level
    
    if (metaType && authorityLevel) {
      const expectedLevel = this.getExpectedLevel(metaType)
      if (expectedLevel && authorityLevel !== expectedLevel) {
        warnings.push({
          path: `${filePath}#authority.level`,
          message: `Authority level '${authorityLevel}' doesn't match expected level '${expectedLevel}' for type '${metaType}'`,
          code: 'LEVEL_MISMATCH',
          severity: 'warning'
        })
      }
    }
  }
  
  private validatePurpose(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.purpose) {
      errors.push({
        path: `${filePath}#purpose`,
        message: 'Missing required section: purpose',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const purpose = spec.purpose
    const requiredFields = ['summary', 'problem', 'scope', 'non_goals']
    
    for (const field of requiredFields) {
      if (purpose[field] === undefined) {
        errors.push({
          path: `${filePath}#purpose.${field}`,
          message: `Missing required field: purpose.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
    
    // Validate scope structure
    if (purpose.scope && typeof purpose.scope === 'object') {
      if (!Array.isArray(purpose.scope.includes)) {
        warnings.push({
          path: `${filePath}#purpose.scope.includes`,
          message: 'scope.includes should be an array',
          code: 'INVALID_SCOPE',
          severity: 'warning'
        })
      }
      if (!Array.isArray(purpose.scope.excludes)) {
        warnings.push({
          path: `${filePath}#purpose.scope.excludes`,
          message: 'scope.excludes should be an array',
          code: 'INVALID_SCOPE',
          severity: 'warning'
        })
      }
    }
  }
  
  private validateContext(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.context) {
      errors.push({
        path: `${filePath}#context`,
        message: 'Missing required section: context',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const context = spec.context
    const requiredFields = ['bounded_context', 'actors', 'capabilities', 'constraints']
    
    for (const field of requiredFields) {
      if (context[field] === undefined) {
        errors.push({
          path: `${filePath}#context.${field}`,
          message: `Missing required field: context.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
  }
  
  private validateContracts(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.contracts) {
      errors.push({
        path: `${filePath}#contracts`,
        message: 'Missing required section: contracts',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const contracts = spec.contracts
    const requiredFields = ['invariants', 'validations']
    
    for (const field of requiredFields) {
      if (contracts[field] === undefined) {
        errors.push({
          path: `${filePath}#contracts.${field}`,
          message: `Missing required field: contracts.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
  }
  
  private validateImplementation(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.implementation) {
      errors.push({
        path: `${filePath}#implementation`,
        message: 'Missing required section: implementation',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const implementation = spec.implementation
    const requiredFields = ['targets', 'affected_paths', 'generation_mode', 'migration_strategy']
    
    for (const field of requiredFields) {
      if (implementation[field] === undefined) {
        errors.push({
          path: `${filePath}#implementation.${field}`,
          message: `Missing required field: implementation.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
    
    // Validate generation_mode
    const validModes = ['guided', 'automatic', 'manual']
    if (implementation.generation_mode && !validModes.includes(implementation.generation_mode)) {
      warnings.push({
        path: `${filePath}#implementation.generation_mode`,
        message: `Invalid generation mode: ${implementation.generation_mode}. Valid modes: ${validModes.join(', ')}`,
        code: 'INVALID_GENERATION_MODE',
        severity: 'warning'
      })
    }
    
    // Validate migration_strategy
    const validStrategies = ['safe', 'breaking', 'deprecation']
    if (implementation.migration_strategy && !validStrategies.includes(implementation.migration_strategy)) {
      warnings.push({
        path: `${filePath}#implementation.migration_strategy`,
        message: `Invalid migration strategy: ${implementation.migration_strategy}. Valid strategies: ${validStrategies.join(', ')}`,
        code: 'INVALID_MIGRATION_STRATEGY',
        severity: 'warning'
      })
    }
  }
  
  private validateValidation(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.validation) {
      errors.push({
        path: `${filePath}#validation`,
        message: 'Missing required section: validation',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const validation = spec.validation
    const requiredFields = ['required_checks', 'acceptance_criteria']
    
    for (const field of requiredFields) {
      if (validation[field] === undefined) {
        errors.push({
          path: `${filePath}#validation.${field}`,
          message: `Missing required field: validation.${field}`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
  }
  
  private validateHistory(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!spec.history) {
      errors.push({
        path: `${filePath}#history`,
        message: 'Missing required section: history',
        code: 'MISSING_SECTION',
        severity: 'error'
      })
      return
    }
    
    const history = spec.history
    const requiredFields = ['change_reason', 'previous_version', 'change_type', 'approved_by']
    
    for (const field of requiredFields) {
      if (history[field] === undefined) {
        errors.push({
          path: `${filePath}#history.${field}`,
          message: `Missing required field: history.${field} (value: ${JSON.stringify(history[field])})`,
          code: 'MISSING_FIELD',
          severity: 'error'
        })
      }
    }
    
    // Validate change_type
    const validChangeTypes = ['additive', 'breaking', 'deprecation', 'correction', 'refactor']
    if (history.change_type && !validChangeTypes.includes(history.change_type)) {
      warnings.push({
        path: `${filePath}#history.change_type`,
        message: `Invalid change type: ${history.change_type}. Valid types: ${validChangeTypes.join(', ')}`,
        code: 'INVALID_CHANGE_TYPE',
        severity: 'warning'
      })
    }
  }
  
  private validateTypeSpecific(
    spec: Record<string, any>,
    specType: string,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const contracts = spec.contracts
    if (!contracts) return
    
    // Type-specific required fields
    switch (specType) {
      case 'domain':
        if (!contracts.entities) {
          warnings.push({
            path: `${filePath}#contracts.entities`,
            message: 'Domain specifications should define entities',
            code: 'DOMAIN_MISSING_ENTITIES',
            severity: 'warning'
          })
        }
        if (!contracts.commands) {
          warnings.push({
            path: `${filePath}#contracts.commands`,
            message: 'Domain specifications should define commands',
            code: 'DOMAIN_MISSING_COMMANDS',
            severity: 'warning'
          })
        }
        if (!contracts.queries) {
          warnings.push({
            path: `${filePath}#contracts.queries`,
            message: 'Domain specifications should define queries',
            code: 'DOMAIN_MISSING_QUERIES',
            severity: 'warning'
          })
        }
        if (!contracts.events) {
          warnings.push({
            path: `${filePath}#contracts.events`,
            message: 'Domain specifications should define events',
            code: 'DOMAIN_MISSING_EVENTS',
            severity: 'warning'
          })
        }
        break
        
      case 'api':
        if (!contracts.endpoints) {
          warnings.push({
            path: `${filePath}#contracts.endpoints`,
            message: 'API specifications should define endpoints',
            code: 'API_MISSING_ENDPOINTS',
            severity: 'warning'
          })
        }
        break
        
      case 'security':
        if (!contracts.trust_boundaries) {
          warnings.push({
            path: `${filePath}#contracts.trust_boundaries`,
            message: 'Security specifications should define trust boundaries',
            code: 'SECURITY_MISSING_TRUST_BOUNDARIES',
            severity: 'warning'
          })
        }
        if (!contracts.control_requirements) {
          warnings.push({
            path: `${filePath}#contracts.control_requirements`,
            message: 'Security specifications should define control requirements',
            code: 'SECURITY_MISSING_CONTROLS',
            severity: 'warning'
          })
        }
        break
    }
  }
  
  private getExpectedLevel(type: string): string | null {
    switch (type) {
      case 'genesis': return 'genesis'
      case 'standard': return 'standard'
      case 'domain': return 'domain'
      case 'implementation': return 'implementation'
      case 'task-change': return 'task-change'
      default: return null
    }
  }

  /**
   * Validate specification against the loaded schema
   */
  private validateAgainstSchema(
    spec: Record<string, any>,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!this.schema) return

    const specType = spec.meta?.type
    
    // 1. Validate required top-level sections
    for (const section of this.schema.required_top_level_sections) {
      if (!spec[section]) {
        errors.push({
          path: `${filePath}#${section}`,
          message: `Missing required section: ${section}`,
          code: 'MISSING_SECTION',
          severity: 'error'
        })
      }
    }

    // 2. Validate each section against schema rules
    for (const [sectionName, sectionSchema] of Object.entries(this.schema.sections)) {
      if (!spec[sectionName]) {
        // Section might be optional or conditional
        continue
      }

      const sectionData = spec[sectionName]
      
      // Validate required fields
      if (sectionSchema.required_fields) {
        for (const field of sectionSchema.required_fields) {
          if (sectionData[field] === undefined) {
            errors.push({
              path: `${filePath}#${sectionName}.${field}`,
              message: `Missing required field: ${sectionName}.${field}`,
              code: 'MISSING_FIELD',
              severity: 'error'
            })
          }
        }
      }

      // Validate conditional fields based on spec type
      if (sectionSchema.conditional_fields && specType) {
        const conditionalFields = sectionSchema.conditional_fields[specType]
        if (conditionalFields) {
          for (const field of conditionalFields) {
           if (sectionData[field] === undefined) {
             warnings.push({
               path: `${filePath}#${sectionName}.${field}`,
               message: `Missing recommended field for type '${specType}': ${sectionName}.${field}`,
               code: 'MISSING_CONDITIONAL_FIELD',
               severity: 'warning'
             })
           }
          }
        }
      }

      // Validate field rules
      if (sectionSchema.field_rules) {
        for (const [field, rule] of Object.entries(sectionSchema.field_rules)) {
          if (sectionData[field] !== undefined && sectionData[field] !== null) {
            // Apply field-specific validation rules
            this.validateFieldRule(sectionName, field, sectionData[field], rule, filePath, errors, warnings, specType)
          }
        }
      }
    }

    // 3. Validate authority hierarchy
    if (spec.meta?.type && spec.authority?.level) {
      const expectedIndex = this.schema.recommended_authority_hierarchy.indexOf(spec.authority.level)
      if (expectedIndex === -1) {
        warnings.push({
          path: `${filePath}#authority.level`,
          message: `Authority level '${spec.authority.level}' not in recommended hierarchy`,
          code: 'UNRECOGNIZED_AUTHORITY_LEVEL',
          severity: 'warning'
        })
      }
    }

    // 4. Validate spec type
    if (spec.meta?.type) {
      const validTypes = ['genesis', 'standard', 'domain', 'implementation', 'api', 'migration', 'security', 'validation', 'operational', 'task-change']
      if (!validTypes.includes(spec.meta.type)) {
        errors.push({
          path: `${filePath}#meta.type`,
          message: `Invalid type: ${spec.meta.type}. Valid types are: ${validTypes.join(', ')}`,
          code: 'INVALID_TYPE',
          severity: 'error'
        })
      }
    }

    // 5. Validate status
    if (spec.meta?.status) {
      const validStatus = ['draft', 'review', 'approved', 'implemented', 'deprecated', 'archived']
      if (!validStatus.includes(spec.meta.status)) {
        warnings.push({
          path: `${filePath}#meta.status`,
          message: `Unusual status: ${spec.meta.status}. Expected one of: ${validStatus.join(', ')}`,
          code: 'UNUSUAL_STATUS',
          severity: 'warning'
        })
      }
    }
  }

  /**
   * Validate a specific field against its rule
   */
  private validateFieldRule(
    section: string,
    field: string,
    value: any,
    rule: string,
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    specType?: string
  ): void {
    switch (rule) {
      case 'unique_within_project':
        // This would require checking against other specs - just a warning for now
        warnings.push({
          path: `${filePath}#${section}.${field}`,
          message: `Field '${field}' should be unique within the project`,
          code: 'UNIQUENESS_WARNING',
          severity: 'warning'
        })
        break

      case 'must_be_one_of_supported_spec_types':
        const validTypes = ['genesis', 'standard', 'domain', 'implementation', 'api', 'migration', 'security', 'validation', 'operational', 'task-change']
        if (!validTypes.includes(value)) {
          errors.push({
            path: `${filePath}#${section}.${field}`,
            message: `Invalid type: ${value}. Valid types are: ${validTypes.join(', ')}`,
            code: 'INVALID_TYPE',
            severity: 'error'
          })
        }
        break

      case 'semantic_version_recommended':
        const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/
        if (!semverRegex.test(value)) {
          warnings.push({
            path: `${filePath}#${section}.${field}`,
            message: `Version '${value}' doesn't follow semantic versioning (recommended: X.Y.Z)`,
            code: 'NON_SEMANTIC_VERSION',
            severity: 'warning'
          })
        }
        break

      case 'must_reflect_place_in_authority_hierarchy':
        if (specType) {
          const expectedLevel = this.getExpectedLevel(specType)
          if (expectedLevel && value !== expectedLevel) {
            warnings.push({
              path: `${filePath}#${section}.${field}`,
              message: `Authority level '${value}' doesn't match expected level '${expectedLevel}' for type '${specType}'`,
              code: 'LEVEL_MISMATCH',
              severity: 'warning'
            })
          }
        }
        break

      case 'must_not_be_empty_for_specs_that_drive_code_change':
        if (specType && ['implementation', 'api', 'migration', 'task-change'].includes(specType)) {
          if (Array.isArray(value) && value.length === 0) {
            errors.push({
              path: `${filePath}#${section}.${field}`,
              message: `Field '${field}' must not be empty for ${specType} specifications`,
              code: 'EMPTY_REQUIRED_FIELD',
              severity: 'error'
            })
          }
        }
        break

      case 'should_default_to_safe_when_state_is_involved':
        const validStrategies = ['safe', 'breaking', 'deprecation']
        if (!validStrategies.includes(value)) {
          warnings.push({
            path: `${filePath}#${section}.${field}`,
            message: `Invalid migration strategy: ${value}. Valid strategies: ${validStrategies.join(', ')}`,
            code: 'INVALID_MIGRATION_STRATEGY',
            severity: 'warning'
          })
        }
        break

      case 'must_be_testable':
        if (typeof value === 'string' && value.trim().length === 0) {
          warnings.push({
            path: `${filePath}#${section}.${field}`,
            message: `Field '${field}' should contain testable criteria`,
            code: 'UNTESTABLE_CRITERIA',
            severity: 'warning'
          })
        }
        break

      default:
        // Unknown rule - just log for debugging
        Logger.debug(`Unknown field rule: ${rule} for ${section}.${field}`)
    }
  }
  
  /**
   * Format validation results for display
   */
  formatResults(result: ValidationResult, jsonOutput: boolean = false): string {
    if (jsonOutput) {
      return JSON.stringify({
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
        spec: result.spec ? { meta: result.spec.meta } : undefined
      }, null, 2)
    }
    
    const output: string[] = []
    
    if (result.valid) {
      output.push('✅ Specification is valid!')
    } else {
      output.push('❌ Specification has validation errors:')
    }
    
    if (result.errors.length > 0) {
      output.push('\nErrors:')
      result.errors.forEach((error, index) => {
        output.push(`  ${index + 1}. ${error.path}`)
        output.push(`     ${error.message} (${error.code})`)
      })
    }
    
    if (result.warnings.length > 0) {
      output.push('\nWarnings:')
      result.warnings.forEach((warning, index) => {
        output.push(`  ${index + 1}. ${warning.path}`)
        output.push(`     ${warning.message} (${warning.code})`)
      })
    }
    
    if (result.spec) {
      output.push(`\nSpecification: ${result.spec.meta.id} (${result.spec.meta.type})`)
      output.push(`Status: ${result.spec.meta.status}`)
      output.push(`Version: ${result.spec.meta.version}`)
    }
    
    return output.join('\n')
  }
}