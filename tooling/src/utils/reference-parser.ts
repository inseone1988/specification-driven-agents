/**
 * Specification Reference Parser and Utilities
 * Handles typed references between specifications
 */

export interface SpecReference {
  type: 'local' | 'versioned' | 'external' | 'remote' | 'cross-project'
  raw: string
  specId?: string
  version?: string
  project?: string
  path?: string
  url?: string
}

export class ReferenceParser {
  // Pattern: @type:target[@version]
  // Examples:
  //   @genesis
  //   @genesis@v1.0
  //   @external:./shared/security.yaml
  //   @remote:owner/repo/spec.yaml
  //   @tbs:domain-account
  
  private static readonly REFERENCE_PATTERN = /^@(?<type>local|external|remote|project)?:?(?<target>[^@]+)(?:@(?<version>.+))?$/
  private static readonly SIMPLE_PATTERN = /^@(?<specId>[a-z0-9-_]+)$/
  private static readonly LEGACY_PATTERN = /^([a-z0-9-_]+)$/ // For [spec-id] format without @
  
  /**
   * Parse a reference string into structured data
   */
  static parse(ref: string): SpecReference {
    const trimmed = ref.trim()
    
    // Simple local reference: @genesis
    const simpleMatch = trimmed.match(this.SIMPLE_PATTERN)
    if (simpleMatch) {
      return {
        type: 'local',
        raw: trimmed,
        specId: simpleMatch.groups?.specId
      }
    }
    
    // Legacy format without @: genesis-puente-snacks
    const legacyMatch = trimmed.match(this.LEGACY_PATTERN)
    if (legacyMatch && !trimmed.includes(':') && !trimmed.includes('@')) {
      return {
        type: 'local',
        raw: trimmed,
        specId: trimmed
      }
    }
    
    // Complex reference with type: @type:target[@version]
    const complexMatch = trimmed.match(this.REFERENCE_PATTERN)
    if (complexMatch) {
      const type = (complexMatch.groups?.type as SpecReference['type']) || 'local'
      const target = complexMatch.groups?.target || ''
      const version = complexMatch.groups?.version
      
      if (type === 'local' && version) {
        return {
          type: 'versioned',
          raw: trimmed,
          specId: target,
          version
        }
      }
      
      if (type === 'external') {
        return {
          type: 'external',
          raw: trimmed,
          path: target
        }
      }
      
      if (type === 'remote') {
        return {
          type: 'remote',
          raw: trimmed,
          path: target
        }
      }
      
      if (type === 'project') {
        const [project, specId] = target.split('/')
        return {
          type: 'cross-project',
          raw: trimmed,
          project,
          specId
        }
      }
      
      // Default to local with target
      return {
        type: 'local',
        raw: trimmed,
        specId: target
      }
    }
    
    // Unrecognized format - treat as local reference
    return {
      type: 'local',
      raw: trimmed,
      specId: trimmed.replace(/^@/, '')
    }
  }
  
  /**
   * Format a spec reference for display
   */
  static format(ref: SpecReference): string {
    switch (ref.type) {
      case 'local':
        return `@${ref.specId}`
      case 'versioned':
        return `@${ref.specId}@${ref.version}`
      case 'external':
        return `@external:${ref.path}`
      case 'remote':
        return `@remote:${ref.path}`
      case 'cross-project':
        return `@${ref.project}:${ref.specId}`
    }
  }
  
  /**
   * Check if a string is a reference
   * Supports both new (@ref) and legacy (ref-id) formats
   */
  static isReference(value: string): boolean {
    if (value.startsWith('@')) return true
    // Legacy format: alphanumeric with hyphens/underscores
    return /^[a-z0-9-_]+$/.test(value)
  }
  
  /**
   * Extract all references from an array
   */
  static extractAll(refs: string[]): SpecReference[] {
    return refs
      .filter(ref => this.isReference(ref))
      .map(ref => this.parse(ref))
  }
  
  /**
   * Resolve a reference to its full form
   */
  static resolve(ref: SpecReference, baseProject?: string): string {
    switch (ref.type) {
      case 'local':
        return `@local:${ref.specId}`
      case 'versioned':
        return `@local:${ref.specId}@${ref.version}`
      case 'external':
        return `@external:${ref.path}`
      case 'remote':
        return `@remote:${ref.path}`
      case 'cross-project':
        return `@${ref.project}:${ref.specId}`
    }
  }
  
  /**
   * Get the display name for a reference type
   */
  static getTypeName(type: SpecReference['type']): string {
    const names: Record<SpecReference['type'], string> = {
      local: 'Local',
      versioned: 'Versioned',
      external: 'External File',
      remote: 'Remote Repository',
      'cross-project': 'Cross-Project'
    }
    return names[type]
  }
}

/**
 * Validate references in a specification
 */
export interface ReferenceValidationResult {
  valid: boolean
  references: SpecReference[]
  unresolved: string[]
  invalid: string[]
}

export class ReferenceValidator {
  constructor(
    private specsDir: string = './specs',
    private projectName: string = 'local'
  ) {}
  
  /**
   * Validate all references in a spec
   */
  async validateReferences(spec: Record<string, any>): Promise<ReferenceValidationResult> {
    const result: ReferenceValidationResult = {
      valid: true,
      references: [],
      unresolved: [],
      invalid: []
    }
    
    // Extract references from authority section
    const authority = spec.authority
    if (authority) {
      const inheritsFrom = authority.inherits_from || []
      const dependsOn = authority.depends_on || []
      const conflictsWith = authority.conflicts_with || []
      
      const allRefs = [...inheritsFrom, ...dependsOn, ...conflictsWith]
      const refs = ReferenceParser.extractAll(allRefs)
      
      result.references.push(...refs)
      
      // Check each reference
      for (const ref of refs) {
        const isValid = await this.checkReference(ref)
        if (!isValid) {
          result.valid = false
          if (ref.type === 'local' || ref.type === 'versioned') {
            result.unresolved.push(ref.raw)
          } else {
            result.invalid.push(ref.raw)
          }
        }
      }
    }
    
    return result
  }
  
  /**
   * Check if a reference can be resolved
   */
  private async checkReference(ref: SpecReference): Promise<boolean> {
    switch (ref.type) {
      case 'local':
        return this.localExists(ref.specId!)
      case 'versioned':
        // For versioned refs, just check local exists for now
        return this.localExists(ref.specId!)
      case 'external':
      case 'remote':
      case 'cross-project':
        // These would require network/filesystem checks
        // For now, assume they're valid
        return true
      default:
        return false
    }
  }
  
  /**
   * Check if a local spec exists
   */
  private async localExists(specId: string): Promise<boolean> {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Try different locations
    const locations = [
      path.join(this.specsDir, `${specId}.yaml`),
      path.join(this.specsDir, `${specId}.md`),
      path.join(this.specsDir, 'genesis', `${specId}.yaml`),
      path.join(this.specsDir, 'standards', `${specId}.yaml`),
      path.join(this.specsDir, 'domains', `${specId}.yaml`),
    ]
    
    for (const location of locations) {
      try {
        await fs.access(location)
        return true
      } catch {
        continue
      }
    }
    
    return false
  }
}
