import yaml from 'js-yaml'
import { TemplateLoader } from './template-loader'
import { TemplateEngine, TemplateVariable } from './template-engine'
import { Logger } from '../utils/logger'
import { SpecType } from '../types'

export interface GenerationOptions {
  type: SpecType
  name: string
  outputPath?: string
  force?: boolean
  values?: Record<string, any>
  interactive?: boolean  // Enable interactive mode for missing vars
}

export class SpecGenerator {
  private templateLoader: TemplateLoader
  private currentType: SpecType | null = null

  constructor(templateLoader?: TemplateLoader) {
    this.templateLoader = templateLoader || new TemplateLoader()
  }

  async generate(options: GenerationOptions): Promise<string> {
    const {
      type,
      name,
      outputPath,
      force = false,
      values = {},
      interactive = false
    } = options

    this.currentType = type
    Logger.section(`Generating ${type} specification: ${name}`)

    // Validate template exists
    if (!await this.templateLoader.templateExists(type)) {
      throw new Error(`No template found for type: ${type}`)
    }

    // Load template
    const template = await this.templateLoader.loadTemplate(type)
    
    // Create engine and extract variables
    const engine = new TemplateEngine()
    const templateVars = engine.extractVariables(template)
    
    // Prepare values
    const templateValues = this.prepareValues(type, name, values, templateVars)
    engine.setVariables(templateValues)
    
    // Validate variables
    const validation = engine.validateVariables(templateVars)
    if (!validation.valid) {
      const missing = validation.missing.map(v => v.name).join(', ')
      throw new Error(`Missing required variables: ${missing}`)
    }
    
    // Log warnings about defaults
    validation.warnings.forEach(w => Logger.warn(w))
    
    // Render template
    const specContent = engine.render(template)
    
    // Check for errors
    const errors = engine.getErrors()
    if (errors.length > 0) {
      errors.forEach(e => Logger.error(e))
      throw new Error(`Template rendering failed with ${errors.length} error(s)`)
    }
    
    // Log warnings
    engine.getWarnings().forEach(w => Logger.warn(w))
    
    // Validate generated spec structure
    this.validateGeneratedSpec(specContent)
    
    // Determine output path
    const finalOutputPath = outputPath || this.getDefaultOutputPath(type, name)
    
    // Write file
    await this.writeSpecFile(finalOutputPath, specContent, force)
    
    Logger.success(`Specification generated: ${finalOutputPath}`)
    return finalOutputPath
  }

  /**
   * Generate a spec with interactive prompts for missing values
   */
  async generateInteractive(options: Omit<GenerationOptions, 'interactive'>): Promise<string> {
    // This would use a prompt library in real implementation
    // For now, just call regular generate
    return this.generate({ ...options, interactive: true })
  }

  private prepareValues(
    type: SpecType,
    name: string,
    userValues: Record<string, any>,
    templateVars: TemplateVariable[]
  ): Record<string, any> {
    const now = new Date().toISOString().split('T')[0]
    const id = this.generateId(type, name)
    
    // Build default values based on template requirements
    const defaultValues: Record<string, any> = {
      id,
      title: this.generateTitle(type, name),
      type,
      level: this.getAuthorityLevel(type),
      owner: process.env.USER || process.env.USERNAME || 'unknown',
      date: now,
      summary: `[Brief summary of the ${type} specification]`,
      bounded_context: this.generateBoundedContext(type, name),
      ...userValues
    }
    
    // Add type-specific defaults
    switch (type) {
      case 'domain':
        defaultValues.entities = []
        defaultValues.commands = []
        defaultValues.queries = []
        defaultValues.events = []
        break
      case 'api':
        defaultValues.endpoints = []
        defaultValues.methods = []
        break
      case 'security':
        defaultValues.trust_boundaries = []
        defaultValues.control_requirements = []
        break
      case 'task-change':
        defaultValues.tasks = []
        defaultValues.acceptance = []
        break
    }

    return defaultValues
  }

  private getAuthorityLevel(type: SpecType): string {
    switch (type) {
      case 'genesis':
        return 'genesis'
      case 'standard':
        return 'standard'
      case 'domain':
        return 'domain'
      case 'implementation':
        return 'implementation'
      case 'task-change':
        return 'task-change'
      default:
        return type
    }
  }

  private generateId(type: SpecType, name: string): string {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `${type}-${normalizedName}`
  }

  private generateTitle(type: SpecType, name: string): string {
    const typeName = type.charAt(0).toUpperCase() + type.slice(1)
    const specName = name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `${specName} ${typeName} Specification`
  }

  private generateBoundedContext(type: SpecType, name: string): string {
    if (type === 'domain') {
      return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    }
    return type
  }

  private validateGeneratedSpec(content: string): void {
    try {
      const parsed = yaml.load(content)
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Generated spec is not valid YAML')
      }
      
      const spec = parsed as Record<string, any>
      
      if (!spec.meta?.id) {
        throw new Error('Generated spec missing meta.id')
      }
      
      if (!spec.meta?.type) {
        throw new Error('Generated spec missing meta.type')
      }
      
      // Validate YAML structure completeness
      const requiredTopLevel = ['meta', 'authority', 'purpose', 'context', 'contracts', 'implementation', 'validation', 'history']
      const missing = requiredTopLevel.filter(section => !spec[section])
      
      if (missing.length > 0) {
        Logger.warn(`Generated spec missing optional sections: ${missing.join(', ')}`)
      }
      
      Logger.debug('Generated spec passed basic validation')
    } catch (error) {
      Logger.error('Generated spec validation failed:', error)
      throw new Error(`Invalid generated spec: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private getDefaultOutputPath(type: SpecType, name: string): string {
    const id = this.generateId(type, name)
    return `./specs/${id}.yaml`
  }

  private async writeSpecFile(
    filePath: string,
    content: string,
    force: boolean
  ): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    try {
      await fs.access(filePath)
      
      if (!force) {
        throw new Error(`File already exists: ${filePath}. Use --force to overwrite.`)
      }
      
      Logger.warn(`Overwriting existing file: ${filePath}`)
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    await fs.writeFile(filePath, content, 'utf-8')
  }
}
