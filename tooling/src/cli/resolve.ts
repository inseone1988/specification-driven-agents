import { Command } from 'commander'
import { AuthorityResolver } from '../resolvers/authority-resolver'
import { Logger } from '../utils/logger'

export function createResolveCommand(): Command {
  const command = new Command('resolve')
    .description('Resolve authority hierarchy and dependencies')
    .argument('<spec-id>', 'ID of the specification to resolve')
    .option('-d, --depth <number>', 'Maximum depth for resolution', '3')
    .option('-g, --graph', 'Output as graph format (DOT)')
    .action(async (specId: string, options) => {
      try {
        Logger.section(`Resolving authority for: ${specId}`)
        
        const depth = parseInt(options.depth, 10)
        if (isNaN(depth) || depth < 1 || depth > 10) {
          Logger.error('Depth must be a number between 1 and 10')
          process.exit(1)
        }
        
        const resolver = new AuthorityResolver()
        const result = await resolver.resolve(specId, depth)
        
        const output = resolver.formatResults(result, options.graph)
        console.log(output)
        
      } catch (error) {
        Logger.error('Resolution failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}