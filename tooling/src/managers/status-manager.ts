import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger'
import { SpecStatus } from '../types'

export class StatusManager {
  /**
   * Update the status of a specification
   */
  async updateStatus(
    specId: string,
    newStatus: SpecStatus,
    message?: string
  ): Promise<{ success: boolean; filePath: string; previousStatus?: string }> {
    try {
      // Find the spec file
      const specPath = await this.findSpecFile(specId)
      if (!specPath) {
        throw new Error(`Specification not found: ${specId}`)
      }
      
      // Read and parse the spec
      const content = await fs.readFile(specPath, 'utf-8')
      const spec = yaml.load(content) as Record<string, any>
      
      if (!spec || !spec.meta) {
        throw new Error(`Invalid specification: ${specPath}`)
      }
      
      const previousStatus = spec.meta.status
      
      // Validate status transition
      if (!this.isValidStatusTransition(previousStatus, newStatus)) {
        throw new Error(`Invalid status transition: ${previousStatus} -> ${newStatus}`)
      }
      
      // Update status
      spec.meta.status = newStatus
      spec.meta.updated_at = new Date().toISOString().split('T')[0]
      
      // Update history
      if (!spec.history) {
        spec.history = {
          change_reason: message || `Status changed to ${newStatus}`,
          previous_version: spec.meta.version,
          change_type: 'correction',
          approved_by: []
        }
      } else {
        // Add new history entry
        const historyEntry = {
          change_reason: message || `Status changed to ${newStatus}`,
          previous_version: spec.meta.version,
          change_type: 'correction',
          approved_by: [],
          timestamp: new Date().toISOString()
        }
        
        // Keep existing history, add new entry
        if (!Array.isArray(spec.history.entries)) {
          spec.history.entries = []
        }
        spec.history.entries.unshift(historyEntry)
      }
      
      // Write updated spec
      const updatedContent = yaml.dump(spec, { lineWidth: -1 })
      await fs.writeFile(specPath, updatedContent, 'utf-8')
      
      Logger.success(`Status updated: ${specId} (${previousStatus} -> ${newStatus})`)
      
      return {
        success: true,
        filePath: specPath,
        previousStatus
      }
      
    } catch (error) {
      Logger.error('Failed to update status:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }
  
  /**
   * Get the current status of a specification
   */
  async getStatus(specId: string): Promise<{
    specId: string
    status: SpecStatus
    filePath: string
    meta: Record<string, any>
  } | null> {
    try {
      const specPath = await this.findSpecFile(specId)
      if (!specPath) {
        return null
      }
      
      const content = await fs.readFile(specPath, 'utf-8')
      const spec = yaml.load(content) as Record<string, any>
      
      if (!spec || !spec.meta) {
        return null
      }
      
      return {
        specId,
        status: spec.meta.status as SpecStatus,
        filePath: specPath,
        meta: spec.meta
      }
      
    } catch (error) {
      Logger.error('Failed to get status:', error instanceof Error ? error.message : String(error))
      return null
    }
  }
  
  /**
   * List all specifications with their status
   */
  async listStatus(specsDir?: string): Promise<Array<{
    specId: string
    status: SpecStatus
    type: string
    version: string
    owner: string
    filePath: string
  }>> {
    const dir = specsDir || './specs'
    
    try {
      const files = await this.findAllSpecFiles(dir)
      const results = []
      
      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          const spec = yaml.load(content) as Record<string, any>
          
          if (spec && spec.meta && spec.meta.id && spec.meta.status) {
            results.push({
              specId: spec.meta.id,
              status: spec.meta.status as SpecStatus,
              type: spec.meta.type || 'unknown',
              version: spec.meta.version || '0.0.0',
              owner: spec.meta.owner || 'unknown',
              filePath: path.relative(dir, filePath)
            })
          }
        } catch {
          // Skip invalid files
          continue
        }
      }
      
      return results.sort((a, b) => a.specId.localeCompare(b.specId))
      
    } catch (error) {
      Logger.error('Failed to list status:', error instanceof Error ? error.message : String(error))
      return []
    }
  }
  
  private async findSpecFile(specId: string): Promise<string | null> {
    // Try different file patterns
    const patterns = [
      `${specId}.yaml`,
      `${specId}.yml`,
      `${specId}.md`,
      `**/${specId}.yaml`,
      `**/${specId}.yml`,
      `**/${specId}.md`
    ]
    
    for (const pattern of patterns) {
      try {
        const fullPath = path.join('./specs', pattern)
        
        // For glob patterns
        if (pattern.includes('**')) {
          const { glob } = await import('glob')
          const files = await glob(fullPath, { windowsPathsNoEscape: true })
          if (files.length > 0) {
            return files[0]
          }
        } else {
          // For exact paths
          await fs.access(fullPath)
          return fullPath
        }
      } catch {
        // File not found, try next pattern
        continue
      }
    }
    
    return null
  }
  
  private async findAllSpecFiles(dir: string): Promise<string[]> {
    try {
      const { glob } = await import('glob')
      const patterns = ['**/*.yaml', '**/*.yml', '**/*.md']
      const files: string[] = []
      
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: dir,
          absolute: true,
          windowsPathsNoEscape: true,
          ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
        })
        files.push(...matches)
      }
      
      return files
      
    } catch (error) {
      Logger.error('Failed to find spec files:', error instanceof Error ? error.message : String(error))
      return []
    }
  }
  
  private isValidStatusTransition(from: string, to: SpecStatus): boolean {
    // Allowed transitions
    const transitions: Record<string, SpecStatus[]> = {
      'draft': ['review', 'archived'],
      'review': ['approved', 'draft', 'archived'],
      'approved': ['implemented', 'review', 'archived'],
      'implemented': ['deprecated', 'archived'],
      'deprecated': ['archived'],
      'archived': [] // Archived is terminal
    }
    
    const allowed = transitions[from] || []
    return allowed.includes(to)
  }
}