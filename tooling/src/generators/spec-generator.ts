import yaml from 'js-yaml'
import { TemplateLoader } from './template-loader'
import { Logger } from '../utils/logger'
import { SpecType } from '../types'

export interface GenerationOptions {
  type: SpecType
  name: string
  outputPath?: string
  force?: boolean
  values?: Record<string, any>
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
      values = {}
    } = options

    this.currentType = type
    Logger.section(`Generating ${type} specification: ${name}`)

    // Validate template exists
    if (!await this.templateLoader.templateExists(type)) {
      throw new Error(`No template found for type: ${type}`)
    }

    // Load template
    const template = await this.templateLoader.loadTemplate(type)
    
    // Prepare values
    const templateValues = this.prepareValues(type, name, values)
    
    // Render template
    const specContent = this.renderTemplate(template, templateValues)
    
    // Validate generated spec
    this.validateGeneratedSpec(specContent)
    
    // Determine output path
    const finalOutputPath = outputPath || this.getDefaultOutputPath(type, name)
    
    // Write file
    await this.writeSpecFile(finalOutputPath, specContent, force)
    
    Logger.success(`Specification generated: ${finalOutputPath}`)
    return finalOutputPath
  }

  private prepareValues(type: SpecType, name: string, userValues: Record<string, any>) {
    const now = new Date().toISOString().split('T')[0]
    const id = this.generateId(type, name)
    
    const defaultValues = {
      id,
      title: this.generateTitle(type, name),
      type,
      level: type === 'genesis' ? 'genesis' : 
             type === 'standard' ? 'standard' : 
             type === 'domain' ? 'domain' : 'implementation',
      owner: process.env.USER || process.env.USERNAME || 'unknown',
      date: now,
      summary: `[Brief summary of the ${type} specification]`,
      bounded_context: this.generateBoundedContext(type, name),
      ...userValues
    }

    return defaultValues
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

  private renderTemplate(template: string, values: Record<string, any>): string {
    let rendered = template
    
    for (const [key, value] of Object.entries(values)) {
      const placeholder = `{{${key}}}`
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value))
    }
    
    // Remove any remaining placeholders
    rendered = rendered.replace(/\{\{[\w]+\}\}/g, '')
    
    return rendered
  }

  private validateGeneratedSpec(content: string): void {
    // Genesis specs are Markdown, skip YAML validation
    if (this.currentType === 'genesis') {
      if (!content.trim()) {
        throw new Error('Generated genesis spec is empty')
      }
      Logger.debug('Generated genesis spec passed basic validation')
      return
    }
    
    // For YAML specs, validate structure
    try {
      const parsed = yaml.load(content)
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Generated spec is not valid YAML')
      }
      
      // Basic validation
      const spec = parsed as Record<string, any>
      
      if (!spec.meta?.id) {
        throw new Error('Generated spec missing meta.id')
      }
      
      if (!spec.meta?.type) {
        throw new Error('Generated spec missing meta.type')
      }
      
      Logger.debug('Generated spec passed basic validation')
    } catch (error) {
      Logger.error('Generated spec validation failed:', error)
      throw new Error(`Invalid generated spec: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private getDefaultOutputPath(type: SpecType, name: string): string {
    const id = this.generateId(type, name)
    const extension = type === 'genesis' ? '.md' : '.yaml'
    return `./specs/${id}${extension}`
  }

  private async writeSpecFile(
    filePath: string,
    content: string,
    force: boolean
  ): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    // Check if file exists
    try {
      await fs.access(filePath)
      
      if (!force) {
        throw new Error(`File already exists: ${filePath}. Use --force to overwrite.`)
      }
      
      Logger.warn(`Overwriting existing file: ${filePath}`)
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    // Write file
    await fs.writeFile(filePath, content, 'utf-8')
  }
}