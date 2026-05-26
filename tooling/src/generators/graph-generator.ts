import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger'
import { ResolutionResult } from '../types'

interface Edge {
  from: string
  to: string
  type: 'inherits' | 'depends' | 'conflicts'
}

interface SpecData {
  type: string
  status: string
}

export class GraphGenerator {
  /**
   * Output graph to file or stdout
   */
  async outputGraph(output: string, filePath?: string): Promise<void> {
    if (filePath) {
      const fullPath = path.resolve(filePath)
      await fs.writeFile(fullPath, output, 'utf-8')
      console.log(`Graph written to: ${fullPath}`)
    } else {
      console.log(output)
    }
  }

  /**
   * Format resolution result as Mermaid for single spec
   */
  formatAsMermaid(result: ResolutionResult): string {
    const nodes = new Set<string>()
    
    // Add all specs to nodes
    result.hierarchy.forEach((specId: string) => nodes.add(specId))
    result.dependencies.forEach((depId: string) => nodes.add(depId))
    
    // Generate Mermaid syntax
    const mermaid: string[] = []
    mermaid.push('graph TD')
    
    // Add nodes
    Array.from(nodes).forEach(specId => {
      mermaid.push(`  ${specId.replace(/[^a-zA-Z0-9]/g, '_')}["${specId}"]`)
    })
    
    // Add hierarchy edges
    if (result.hierarchy.length > 1) {
      for (let i = 0; i < result.hierarchy.length - 1; i++) {
        const from = result.hierarchy[i + 1].replace(/[^a-zA-Z0-9]/g, '_')
        const to = result.hierarchy[i].replace(/[^a-zA-Z0-9]/g, '_')
        mermaid.push(`  ${from} --> ${to}`)
      }
    }
    
    // Add dependency edges
    result.dependencies.forEach((depId: string) => {
      const from = result.specId.replace(/[^a-zA-Z0-9]/g, '_')
      const to = depId.replace(/[^a-zA-Z0-9]/g, '_')
      mermaid.push(`  ${from} -.-> ${to}`)
    })
    
    return mermaid.join('\n')
  }

  /**
   * Generate DOT format graph
   */
  generateDotGraph(nodes: string[], edges: Edge[], specData: Record<string, SpecData>): string {
    const dot: string[] = []
    dot.push('digraph SpecificationGraph {')
    dot.push('  rankdir=TB;')
    dot.push('  node [shape=box, style=filled];')
    
    // Define color schemes for status
    const statusColors: Record<string, string> = {
      'draft': 'lightyellow',
      'review': 'lightblue',
      'approved': 'lightgreen',
      'implemented': 'palegreen',
      'deprecated': 'lightgray',
      'archived': 'gray'
    }
    
    // Add nodes with styling based on status
    nodes.forEach(specId => {
      const data = specData[specId] || {}
      const status = data.status || 'draft'
      const color = statusColors[status] || 'white'
      const type = data.type || 'unknown'
      
      dot.push(`  "${specId}" [label="${specId}\\n(${type})", fillcolor="${color}"];`)
    })
    
    // Add edges with different styles
    edges.forEach(edge => {
      switch (edge.type) {
        case 'inherits':
          dot.push(`  "${edge.from}" -> "${edge.to}" [color=blue, penwidth=2];`)
          break
        case 'depends':
          dot.push(`  "${edge.from}" -> "${edge.to}" [color=green, style=dashed];`)
          break
        case 'conflicts':
          dot.push(`  "${edge.from}" -> "${edge.to}" [color=red, style=dotted];`)
          break
      }
    })
    
    dot.push('}')
    return dot.join('\n')
  }

  /**
   * Generate Mermaid format graph
   */
  generateMermaidGraph(nodes: string[], edges: Edge[], specData: Record<string, SpecData>): string {
    const mermaid: string[] = []
    mermaid.push('graph TD')
    
    // Define status styles
    const statusStyles: Record<string, string> = {
      'draft': 'fill:#fffacd',
      'review': 'fill:#add8e6',
      'approved': 'fill:#90ee90',
      'implemented': 'fill:#98fb98',
      'deprecated': 'fill:#d3d3d3',
      'archived': 'fill:#a9a9a9'
    }
    
    // Add nodes with styling
    nodes.forEach(specId => {
      const data = specData[specId] || {}
      const status = data.status || 'draft'
      const type = data.type || 'unknown'
      const style = statusStyles[status] || ''
      
      const nodeId = specId.replace(/[^a-zA-Z0-9]/g, '_')
      mermaid.push(`  ${nodeId}["${specId}\\n(${type})"]${style ? `:::${status}` : ''}`)
    })
    
    // Define CSS classes for status
    mermaid.push('')
    Object.entries(statusStyles).forEach(([status, fill]) => {
      mermaid.push(`  classDef ${status} ${fill}`)
    })
    
    // Add edges
    edges.forEach(edge => {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_')
      const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_')
      
      switch (edge.type) {
        case 'inherits':
          mermaid.push(`  ${fromId} --> ${toId}`)
          break
        case 'depends':
          mermaid.push(`  ${fromId} -.-> ${toId}`)
          break
        case 'conflicts':
          mermaid.push(`  ${fromId} -.x ${toId}`)
          break
      }
    })
    
    return mermaid.join('\n')
  }
}
