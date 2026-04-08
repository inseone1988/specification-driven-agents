import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger'
import { ResolutionResult } from '../types'

export class AuthorityResolver {
  private specsDir: string
  
  constructor(specsDir?: string) {
    this.specsDir = specsDir || './specs'
  }
  
  /**
   * Resolve authority hierarchy and dependencies for a specification
   */
  async resolve(specId: string, maxDepth: number = 3): Promise<ResolutionResult> {
    Logger.debug(`Resolving authority for: ${specId}`)
    
    const hierarchy: string[] = []
    const dependencies: string[] = []
    const conflicts: string[] = []
    const circularDependencies: string[][] = []
    const visited = new Set<string>()
    const pathStack: string[] = []
    
    try {
      // Find the spec file
      const specPath = await this.findSpecFile(specId)
      if (!specPath) {
        throw new Error(`Specification not found: ${specId}`)
      }
      
      // Resolve hierarchy
      await this.resolveHierarchy(
        specPath,
        hierarchy,
        dependencies,
        conflicts,
        circularDependencies,
        visited,
        pathStack,
        0,
        maxDepth
      )
      
      // Remove duplicates while preserving order
      const uniqueHierarchy = Array.from(new Set(hierarchy))
      const uniqueDependencies = Array.from(new Set(dependencies.filter(dep => !uniqueHierarchy.includes(dep))))
      
      return {
        specId,
        hierarchy: uniqueHierarchy,
        dependencies: uniqueDependencies,
        conflicts,
        circularDependencies
      }
      
    } catch (error) {
      Logger.error('Resolution failed:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }
  
  private async resolveHierarchy(
    specPath: string,
    hierarchy: string[],
    dependencies: string[],
    conflicts: string[],
    circularDependencies: string[][],
    visited: Set<string>,
    pathStack: string[],
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    if (currentDepth >= maxDepth) {
      Logger.warn(`Maximum depth reached (${maxDepth}) while resolving hierarchy`)
      return
    }
    
    // Read and parse spec
    const content = await fs.readFile(specPath, 'utf-8')
    const spec = yaml.load(content) as Record<string, any>
    
    if (!spec || !spec.meta) {
      throw new Error(`Invalid specification: ${specPath}`)
    }
    
    const specId = spec.meta.id
    
    // Check for circular dependencies
    if (pathStack.includes(specId)) {
      const cycle = [...pathStack.slice(pathStack.indexOf(specId)), specId]
      circularDependencies.push(cycle)
      Logger.warn(`Circular dependency detected: ${cycle.join(' -> ')}`)
      return
    }
    
    // Add to hierarchy if not already visited
    if (!visited.has(specId)) {
      hierarchy.push(specId)
      visited.add(specId)
      pathStack.push(specId)
    }
    
    // Resolve inherits_from (authority hierarchy)
    const authority = spec.authority
    if (authority && Array.isArray(authority.inherits_from)) {
      for (const parentId of authority.inherits_from) {
        if (!parentId || typeof parentId !== 'string') continue
        
        // Find parent spec
        const parentPath = await this.findSpecFile(parentId)
        if (!parentPath) {
          conflicts.push(`Parent specification not found: ${parentId}`)
          continue
        }
        
        // Recursively resolve parent
        await this.resolveHierarchy(
          parentPath,
          hierarchy,
          dependencies,
          conflicts,
          circularDependencies,
          visited,
          [...pathStack],
          currentDepth + 1,
          maxDepth
        )
      }
    }
    
    // Resolve depends_on (dependencies)
    if (authority && Array.isArray(authority.depends_on)) {
      for (const depId of authority.depends_on) {
        if (!depId || typeof depId !== 'string') continue
        
        // Find dependency spec
        const depPath = await this.findSpecFile(depId)
        if (!depPath) {
          conflicts.push(`Dependency specification not found: ${depId}`)
          continue
        }
        
        // Add to dependencies if not already in hierarchy
        if (!visited.has(depId)) {
          dependencies.push(depId)
          visited.add(depId)
        }
      }
    }
    
    // Check for conflicts_with
    if (authority && Array.isArray(authority.conflicts_with)) {
      for (const conflictId of authority.conflicts_with) {
        if (!conflictId || typeof conflictId !== 'string') continue
        
        // Find conflicting spec
        const conflictPath = await this.findSpecFile(conflictId)
        if (conflictPath) {
          conflicts.push(`Explicit conflict declared with: ${conflictId}`)
        }
      }
    }
    
    // Pop from path stack
    const index = pathStack.indexOf(specId)
    if (index !== -1) {
      pathStack.splice(index, 1)
    }
  }
  
  /**
   * Find a specification file by ID
   */
  private async findSpecFile(specId: string): Promise<string | null> {
    // Try different file patterns
    const patterns = [
      `${specId}.yaml`,
      `${specId}.yml`,
      `${specId}.md`, // For genesis
      `**/${specId}.yaml`,
      `**/${specId}.yml`,
      `**/${specId}.md`
    ]
    
    for (const pattern of patterns) {
      try {
        const fullPath = path.join(this.specsDir, pattern)
        
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
  
  /**
   * Format resolution results for display
   */
  formatResults(result: ResolutionResult, graphFormat: boolean = false): string {
    if (graphFormat) {
      return this.formatAsGraph(result)
    }
    
    const output: string[] = []
    
    output.push(`📋 Authority Resolution for: ${result.specId}`)
    output.push('='.repeat(50))
    
    if (result.hierarchy.length > 0) {
      output.push('\n🏛️  Authority Hierarchy:')
      result.hierarchy.forEach((specId, index) => {
        const indent = '  '.repeat(index)
        output.push(`${indent}${index === 0 ? '└── ' : '├── '}${specId}`)
      })
    }
    
    if (result.dependencies.length > 0) {
      output.push('\n🔗 Dependencies:')
      result.dependencies.forEach(depId => {
        output.push(`  • ${depId}`)
      })
    }
    
    if (result.conflicts.length > 0) {
      output.push('\n⚠️  Conflicts:')
      result.conflicts.forEach(conflict => {
        output.push(`  • ${conflict}`)
      })
    }
    
    if (result.circularDependencies.length > 0) {
      output.push('\n🔄 Circular Dependencies:')
      result.circularDependencies.forEach((cycle, index) => {
        output.push(`  ${index + 1}. ${cycle.join(' → ')}`)
      })
    }
    
    output.push('\n' + '='.repeat(50))
    output.push(`Total specs in hierarchy: ${result.hierarchy.length}`)
    output.push(`Total dependencies: ${result.dependencies.length}`)
    
    return output.join('\n')
  }
  
  private formatAsGraph(result: ResolutionResult): string {
    const nodes = new Set<string>()
    
    // Add all specs to nodes
    result.hierarchy.forEach(specId => nodes.add(specId))
    result.dependencies.forEach(depId => nodes.add(depId))
    
    // Create DOT format graph
    const dotOutput: string[] = []
    dotOutput.push('digraph AuthorityHierarchy {')
    dotOutput.push('  rankdir=TB;')
    dotOutput.push('  node [shape=box, style=filled, fillcolor=lightblue];')
    
    // Add nodes
    Array.from(nodes).forEach(specId => {
      dotOutput.push(`  "${specId}" [label="${specId}"];`)
    })
    
    // Add hierarchy edges (inherits_from)
    if (result.hierarchy.length > 1) {
      for (let i = 0; i < result.hierarchy.length - 1; i++) {
        const from = result.hierarchy[i + 1]
        const to = result.hierarchy[i]
        dotOutput.push(`  "${from}" -> "${to}" [color=blue, penwidth=2];`)
      }
    }
    
    // Add dependency edges (depends_on)
    result.dependencies.forEach(depId => {
      dotOutput.push(`  "${result.specId}" -> "${depId}" [color=green, style=dashed];`)
    })
    
    // Add conflict edges
    result.conflicts.forEach(conflict => {
      const conflictId = conflict.replace('Explicit conflict declared with: ', '')
      if (nodes.has(conflictId)) {
        dotOutput.push(`  "${result.specId}" -> "${conflictId}" [color=red, style=dotted];`)
      }
    })
    
    dotOutput.push('}')
    
    return dotOutput.join('\n')
  }
}