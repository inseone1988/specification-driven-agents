import { Command } from 'commander'
import { AuthorityResolver } from '../resolvers/authority-resolver'
import { StatusManager } from '../managers/status-manager'
import { Logger } from '../utils/logger'
import fs from 'fs/promises'
import path from 'path'

export function createGraphCommand(): Command {
  const command = new Command('graph')
    .description('Generate dependency graph of specifications')
    .option('-o, --output <format>', 'Output format (dot, json, mermaid)', 'dot')
    .option('-f, --file <path>', 'Output file path')
    .option('-a, --all', 'Generate graph for all specifications')
    .option('-s, --spec <spec-id>', 'Generate graph for specific specification')
    .action(async (options) => {
      try {
        if (options.all && options.spec) {
          Logger.error('Cannot use both --all and --spec options')
          process.exit(1)
        }
        
        if (!options.all && !options.spec) {
          Logger.error('Must specify either --all or --spec')
          process.exit(1)
        }
        
        const statusManager = new StatusManager()
        const resolver = new AuthorityResolver()
        
        if (options.spec) {
          // Generate graph for single spec
          Logger.section(`Generating graph for: ${options.spec}`)
          const result = await resolver.resolve(options.spec, 10)
          let output = ''
          
          switch (options.output.toLowerCase()) {
            case 'dot':
              output = resolver.formatResults(result, true)
              break
            case 'json':
              output = JSON.stringify(result, null, 2)
              break
            case 'mermaid':
              output = this.formatAsMermaid(result)
              break
            default:
              Logger.error(`Unsupported output format: ${options.output}`)
              process.exit(1)
          }
          
          await this.outputGraph(output, options.file)
          
        } else if (options.all) {
          // Generate graph for all specs
          Logger.section('Generating graph for all specifications')
          const specs = await statusManager.listStatus()
          
          if (specs.length === 0) {
            Logger.warn('No specifications found')
            return
          }
          
          // Collect all relationships
          const nodes = new Set<string>()
          const edges: Array<{ from: string; to: string; type: 'inherits' | 'depends' | 'conflicts' }> = []
          const specData: Record<string, any> = {}
          
          for (const spec of specs) {
            try {
              const result = await resolver.resolve(spec.specId, 3)
              
              // Add node
              nodes.add(spec.specId)
              specData[spec.specId] = {
                type: spec.type,
                status: spec.status
              }
              
              // Add hierarchy edges
              if (result.hierarchy.length > 1) {
                for (let i = 0; i < result.hierarchy.length - 1; i++) {
                  const from = result.hierarchy[i + 1]
                  const to = result.hierarchy[i]
                  edges.push({ from, to, type: 'inherits' })
                }
              }
              
              // Add dependency edges
              result.dependencies.forEach(depId => {
                edges.push({ from: spec.specId, to: depId, type: 'depends' })
                nodes.add(depId)
              })
              
              // Add conflict edges
              result.conflicts.forEach(conflict => {
                const conflictId = conflict.replace('Explicit conflict declared with: ', '')
                if (nodes.has(conflictId)) {
                  edges.push({ from: spec.specId, to: conflictId, type: 'conflicts' })
                }
              })
              
            } catch (error) {
              Logger.warn(`Failed to resolve ${spec.specId}:`, error instanceof Error ? error.message : String(error))
            }
          }
          
          // Generate graph
          let output = ''
          switch (options.output.toLowerCase()) {
            case 'dot':
              output = this.generateDotGraph(Array.from(nodes), edges, specData)
              break
            case 'json':
              output = JSON.stringify({
                nodes: Array.from(nodes).map(id => ({
                  id,
                  ...specData[id]
                })),
                edges
              }, null, 2)
              break
            case 'mermaid':
              output = this.generateMermaidGraph(Array.from(nodes), edges, specData)
              break
            default:
              Logger.error(`Unsupported output format: ${options.output}`)
              process.exit(1)
          }
          
          await this.outputGraph(output, options.file)
        }
        
        Logger.success('Graph generated successfully!')
        
      } catch (error) {
        Logger.error('Graph generation failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}

// Add methods to the command class
createGraphCommand.prototype.outputGraph = async function(output: string, filePath?: string) {
  if (filePath) {
    const fullPath = path.resolve(filePath)
    await fs.writeFile(fullPath, output, 'utf-8')
    console.log(`Graph written to: ${fullPath}`)
  } else {
    console.log(output)
  }
}

createGraphCommand.prototype.formatAsMermaid = function(result: any): string {
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

createGraphCommand.prototype.generateDotGraph = function(
  nodes: string[],
  edges: Array<{ from: string; to: string; type: 'inherits' | 'depends' | 'conflicts' }>,
  specData: Record<string, any>
): string {
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

createGraphCommand.prototype.generateMermaidGraph = function(
  nodes: string[],
  edges: Array<{ from: string; to: string; type: 'inherits' | 'depends' | 'conflicts' }>,
  specData: Record<string, any>
): string {
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