import { Command } from 'commander'
import { AuthorityResolver } from '../resolvers/authority-resolver'
import { StatusManager } from '../managers/status-manager'
import { GraphGenerator } from '../generators/graph-generator'
import { Logger } from '../utils/logger'

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
        const generator = new GraphGenerator()
        
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
              output = generator.formatAsMermaid(result)
              break
            default:
              Logger.error(`Unsupported output format: ${options.output}`)
              process.exit(1)
          }
          
          await generator.outputGraph(output, options.file)
          
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
              output = generator.generateDotGraph(Array.from(nodes), edges, specData)
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
              output = generator.generateMermaidGraph(Array.from(nodes), edges, specData)
              break
            default:
              Logger.error(`Unsupported output format: ${options.output}`)
              process.exit(1)
          }
          
          await generator.outputGraph(output, options.file)
        }
        
        Logger.success('Graph generated successfully!')
        
      } catch (error) {
        Logger.error('Graph generation failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}
