import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { Logger } from '../utils/logger'
import { PluginManager } from '../managers/plugin-manager'

export class TemplateLoader {
  private templatesDir: string
  private pluginManager?: PluginManager

  constructor(templatesDir?: string, pluginManager?: PluginManager) {
    this.pluginManager = pluginManager
    
    if (templatesDir) {
      this.templatesDir = templatesDir
    } else {
      // Search multiple locations:
      // 1. Provided directory
      // 2. Current directory/templates (development)
      // 3. Installation directory (__dirname)
      // 4. dist/templates (build)
      
      const possiblePaths = [
        path.join(process.cwd(), 'templates'),
        path.join(__dirname, '..', 'templates'),
        path.join(__dirname, '..', '..', 'templates'),
        path.join(process.cwd(), 'node_modules', 'spec-driven-agents', 'dist', 'templates'),
      ]
      
      for (const possiblePath of possiblePaths) {
        try {
          if (fsSync.existsSync(possiblePath)) {
            this.templatesDir = possiblePath
            Logger.debug(`Using templates directory: ${this.templatesDir}`)
            return
          }
        } catch {
          // Continue with next path
        }
      }
      
      this.templatesDir = path.join(process.cwd(), 'templates')
      Logger.warn(`No templates directory found, using default: ${this.templatesDir}`)
    }
  }

  /**
   * Load a template, searching built-in dirs and plugin dirs
   */
  async loadTemplate(templateName: string): Promise<string> {
    // Try all template directories (plugins first for override)
    const searchPaths = this.getTemplateSearchPaths()
    
    for (const searchPath of searchPaths) {
      const templatePath = path.join(searchPath, `${templateName}.yaml`)
      
      try {
        const content = await fs.readFile(templatePath, 'utf-8')
        Logger.debug(`Loaded template: ${templateName} from ${searchPath}`)
        return content
      } catch {
        // Template not in this directory, try next
      }
    }
    
    // Template not found anywhere
    Logger.error(`Failed to load template: ${templateName}`)
    const availableTemplates = await this.listTemplates()
    throw new Error(
      `Template not found: ${templateName}. ` +
      `Available templates: ${availableTemplates.join(', ')}`
    )
  }

  /**
   * List all available templates from all sources
   */
  async listTemplates(): Promise<string[]> {
    const templates = new Set<string>()
    const searchPaths = this.getTemplateSearchPaths()
    
    for (const searchPath of searchPaths) {
      try {
        const files = await fs.readdir(searchPath)
        files
          .filter(file => file.endsWith('.yaml'))
          .map(file => file.replace('.yaml', ''))
          .forEach(name => templates.add(name))
      } catch {
        // Directory doesn't exist
      }
    }
    
    return Array.from(templates).sort()
  }

  /**
   * Check if a template exists in any search path
   */
  async templateExists(templateName: string): Promise<boolean> {
    const searchPaths = this.getTemplateSearchPaths()
    
    for (const searchPath of searchPaths) {
      const templatePath = path.join(searchPath, `${templateName}.yaml`)
      
      try {
        await fs.access(templatePath)
        return true
      } catch {
        // Not in this directory
      }
    }
    
    return false
  }

  /**
   * Get all template search paths (built-in + plugins)
   */
  private getTemplateSearchPaths(): string[] {
    const paths: string[] = []
    
    // Plugin template directories (first = highest priority)
    if (this.pluginManager) {
      const pluginDirs = this.pluginManager.getTemplateDirectories()
      paths.push(...pluginDirs)
    }
    
    // Built-in templates (last = lowest priority)
    paths.push(this.templatesDir)
    
    return paths
  }

  /**
   * Set plugin manager for extended template discovery
   */
  setPluginManager(pluginManager: PluginManager): void {
    this.pluginManager = pluginManager
  }
}
