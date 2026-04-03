import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger'

export class TemplateLoader {
  private templatesDir: string

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(process.cwd(), 'templates')
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