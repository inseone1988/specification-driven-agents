import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { Logger } from '../utils/logger'

export class TemplateLoader {
  private templatesDir: string

  constructor(templatesDir?: string) {
    if (templatesDir) {
      this.templatesDir = templatesDir
    } else {
      // Buscar plantillas en múltiples ubicaciones:
      // 1. Directorio proporcionado
      // 2. Directorio actual/templates (desarrollo)
      // 3. Directorio de instalación global (__dirname)
      // 4. Directorio dist/templates (build)
      
      const possiblePaths = [
        path.join(process.cwd(), 'templates'), // Desarrollo local
        path.join(__dirname, '..', 'templates'), // Desde código fuente
        path.join(__dirname, '..', '..', 'templates'), // Desde dist
        path.join(process.cwd(), 'node_modules', 'spec-driven-agents', 'dist', 'templates'), // Instalación global
      ]
      
      // Usar la primera ruta que exista
      for (const possiblePath of possiblePaths) {
        try {
          if (fsSync.existsSync(possiblePath)) {
            this.templatesDir = possiblePath
            Logger.debug(`Using templates directory: ${this.templatesDir}`)
            return
          }
        } catch {
          // Continuar con la siguiente ruta
        }
      }
      
      // Si no se encuentra ninguna, usar la predeterminada
      this.templatesDir = path.join(process.cwd(), 'templates')
      Logger.warn(`No templates directory found, using default: ${this.templatesDir}`)
    }
  }

  async loadTemplate(templateName: string): Promise<string> {
    const extension = templateName === 'genesis' ? '.md' : '.yaml'
    const templatePath = path.join(this.templatesDir, `${templateName}${extension}`)
    
    try {
      const content = await fs.readFile(templatePath, 'utf-8')
      Logger.debug(`Loaded template: ${templateName}`)
      return content
    } catch (error) {
      Logger.error(`Failed to load template: ${templateName}`)
      const availableTemplates = await this.listTemplates()
      throw new Error(`Template not found: ${templateName}. Available templates: ${availableTemplates.join(', ')}`)
    }
  }

  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesDir)
      return files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.md'))
        .map(file => file.replace('.yaml', '').replace('.md', ''))
    } catch (error) {
      Logger.error(`Failed to list templates: ${error}`)
      return []
    }
  }

  async templateExists(templateName: string): Promise<boolean> {
    const extension = templateName === 'genesis' ? '.md' : '.yaml'
    const templatePath = path.join(this.templatesDir, `${templateName}${extension}`)
    
    try {
      await fs.access(templatePath)
      return true
    } catch {
      return false
    }
  }
}