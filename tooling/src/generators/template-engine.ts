import { Logger } from '../utils/logger'

/**
 * Template variable with type and default value
 */
export interface TemplateVariable {
  name: string
  type: 'string' | 'array' | 'boolean' | 'number'
  required: boolean
  default?: any
  description?: string
}

/**
 * Template condition block
 */
interface ConditionBlock {
  type: 'if' | 'unless' | 'each'
  variable: string
  content: string
  elseContent?: string
}

/**
 * Enhanced template engine with conditionals, loops, and validation
 */
export class TemplateEngine {
  private variables: Record<string, any> = {}
  private errors: string[] = []
  private warnings: string[] = []

  /**
   * Set template variables
   */
  setVariables(vars: Record<string, any>): void {
    this.variables = { ...this.variables, ...vars }
  }

  /**
   * Get all errors from last render
   */
  getErrors(): string[] {
    return [...this.errors]
  }

  /**
   * Get all warnings from last render
   */
  getWarnings(): string[] {
    return [...this.warnings]
  }

  /**
   * Clear errors and warnings
   */
  clearDiagnostics(): void {
    this.errors = []
    this.warnings = []
  }

  /**
   * Validate that all required variables are present
   */
  validateVariables(requiredVars: TemplateVariable[]): { valid: boolean; missing: TemplateVariable[]; warnings: string[] } {
    const missing: TemplateVariable[] = []
    const warnings: string[] = []

    for (const req of requiredVars) {
      const value = this.variables[req.name]
      
      if (value === undefined || value === null) {
        if (req.default !== undefined) {
          this.variables[req.name] = req.default
          warnings.push(`Variable '${req.name}' not provided, using default: ${req.default}`)
        } else if (req.required) {
          missing.push(req)
        }
      }

      // Type validation
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== req.type && !(req.type === 'array' && actualType === 'object')) {
          warnings.push(`Variable '${req.name}' expected type '${req.type}' but got '${actualType}'`)
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings
    }
  }

  /**
   * Render a template with the current variables
   */
  render(template: string): string {
    this.clearDiagnostics()
    
    let result = template
    
    // Process in order: loops first (they create scoped engines for inner content),
    // then conditionals, then simple variables
    result = this.processLoops(result)
    result = this.processConditionals(result)
    result = this.processVariables(result)
    
    // Check for unreplaced variables
    this.checkUnreplacedVariables(result)
    
    return result
  }

  /**
   * Process conditional blocks {{#if var}}...{{/if}}
   */
  private processConditionals(template: string): string {
    let result = template
    
    // Process #if blocks
    result = this.processBlock(result, 'if', (content, condition) => {
      const value = this.getVariableValue(condition)
      const isTruthy = this.isTruthy(value)
      
      if (isTruthy) {
        return content
      } else {
        return ''
      }
    })
    
    // Process #unless blocks
    result = this.processBlock(result, 'unless', (content, condition) => {
      const value = this.getVariableValue(condition)
      const isTruthy = this.isTruthy(value)
      
      if (!isTruthy) {
        return content
      } else {
        return ''
      }
    })
    
    return result
  }

  /**
   * Process loop blocks {{#each items}}...{{/each}}
   */
  private processLoops(template: string): string {
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g
    
    return template.replace(eachRegex, (fullMatch, arrayName, innerContent) => {
      const array = this.getVariableValue(arrayName)
      
      if (!Array.isArray(array)) {
        if (array === undefined || array === null) {
          this.warnings.push(`Loop variable '${arrayName}' is undefined, skipping block`)
        } else {
          this.warnings.push(`Loop variable '${arrayName}' is not an array, skipping block`)
        }
        return ''
      }
      
      const rendered = array.map((item, index) => {
        // Create scoped variables for this iteration
        const itemVars: Record<string, any> = {
          [`${arrayName}_item`]: item,
          [`${arrayName}_index`]: index,
          [`${arrayName}_first`]: index === 0,
          [`${arrayName}_last`]: index === array.length - 1
        }
        
        // If item is a string/number, also set 'this' and 'item'
        if (typeof item !== 'object') {
          itemVars['this'] = item
          itemVars['item'] = item
        } else {
          // Merge object properties
          Object.assign(itemVars, item)
        }
        
        // Render inner content with scoped variables
        const scopedEngine = new TemplateEngine()
        scopedEngine.setVariables({ ...this.variables, ...itemVars })
        return scopedEngine.render(innerContent)
      }).join('')
      
      return rendered
    })
  }

  /**
   * Process a generic block (if/unless)
   */
  private processBlock(
    template: string,
    blockType: string,
    handler: (content: string, condition: string) => string
  ): string {
    // Use String.raw to avoid double-escaping issues
    const pattern = String.raw`\{\{#${blockType}\s+(\w+)\}\}([\s\S]*?)\{\{\/${blockType}\}\}`
    const regex = new RegExp(pattern, 'g')
    
    return template.replace(regex, (fullMatch, condition, content) => {
      return handler(content, condition)
    })
  }

  /**
   * Process simple {{variable}} replacements
   */
  private processVariables(template: string): string {
    let result = template
    
    // Match {{variable}} or {{variable | default}}
    const varRegex = /\{\{(\w+)(?:\s*\|\s*(.+?))?\}\}/g
    
    let match
    while ((match = varRegex.exec(template)) !== null) {
      const fullMatch = match[0]
      const varName = match[1]
      const defaultValue = match[2]?.trim()
      
      const value = this.getVariableValue(varName)
      
      if (value !== undefined && value !== null) {
        result = result.replace(fullMatch, String(value))
      } else if (defaultValue) {
        // Remove quotes from default if present
        const cleanDefault = defaultValue.replace(/^["']|["']$/g, '')
        result = result.replace(fullMatch, cleanDefault)
        this.warnings.push(`Variable '${varName}' not set, using default: ${cleanDefault}`)
      } else {
        // Leave unreplaced for now, will check later
      }
    }
    
    return result
  }

  /**
   * Get variable value, supporting nested paths like "user.name"
   */
  private getVariableValue(name: string): any {
    if (this.variables[name] !== undefined) {
      return this.variables[name]
    }
    
    // Try nested path
    const parts = name.split('.')
    let value: any = this.variables
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }
    
    return value
  }

  /**
   * Check if a value is truthy
   */
  private isTruthy(value: any): boolean {
    if (value === undefined || value === null) return false
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return false
  }

  /**
   * Check for unreplaced template variables
   */
  private checkUnreplacedVariables(rendered: string): void {
    const unreplaced = rendered.match(/\{\{(\w+)\}\}/g)
    if (unreplaced) {
      const uniqueVars = new Set(unreplaced.map(m => m.replace(/[{}]/g, '')))
      uniqueVars.forEach(varName => {
        this.errors.push(`Variable '${varName}' was not replaced — no value provided`)
      })
    }
  }

  /**
   * Extract required variables from template
   */
  extractVariables(template: string): TemplateVariable[] {
    const vars: TemplateVariable[] = []
    const seen = new Set<string>()
    
    // Extract simple variables
    const simpleRegex = /\{\{(\w+)(?:\s*\|\s*(.+?))?\}\}/g
    let match
    while ((match = simpleRegex.exec(template)) !== null) {
      const varName = match[1]
      const defaultVal = match[2]?.trim()
      
      if (!seen.has(varName)) {
        seen.add(varName)
        vars.push({
          name: varName,
          type: 'string',
          required: !defaultVal,
          default: defaultVal ? defaultVal.replace(/^["']|["']$/g, '') : undefined
        })
      }
    }
    
    // Extract conditional variables
    const condRegex = /\{\{#(?:if|unless)\s+(\w+)\}\}/g
    while ((match = condRegex.exec(template)) !== null) {
      const varName = match[1]
      if (!seen.has(varName)) {
        seen.add(varName)
        vars.push({
          name: varName,
          type: 'boolean',
          required: false,
          default: false
        })
      }
    }
    
    // Extract loop variables
    const loopRegex = /\{\{#each\s+(\w+)\}\}/g
    while ((match = loopRegex.exec(template)) !== null) {
      const varName = match[1]
      if (!seen.has(varName)) {
        seen.add(varName)
        vars.push({
          name: varName,
          type: 'array',
          required: false,
          default: []
        })
      }
    }
    
    return vars
  }

  /**
   * Create a safe YAML string (escape special characters)
   */
  static escapeYaml(value: string): string {
    if (value.includes(':') || value.includes('#') || value.includes('\n') || 
        value.startsWith('"') || value.startsWith("'") || value.startsWith('{') || 
        value.startsWith('[') || value.includes('|') || value.includes('>')) {
      // Wrap in double quotes and escape internal quotes
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }

  /**
   * Format array as YAML list
   */
  static formatYamlArray(items: string[], indent: number = 0): string {
    if (items.length === 0) return '[]'
    
    const spaces = ' '.repeat(indent)
    return items.map(item => {
      const escaped = this.escapeYaml(item)
      return `${spaces}- ${escaped}`
    }).join('\n')
  }
}
