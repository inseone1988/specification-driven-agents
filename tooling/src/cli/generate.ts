import { Command } from 'commander'
import { SpecGenerator } from '../generators/spec-generator'
import { Logger } from '../utils/logger'
import { SpecType } from '../types'

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .description('Generate a new specification from template')
    .argument('<type>', 'Type of specification to generate')
    .argument('<name>', 'Name of the specification')
    .option('-o, --output <path>', 'Output path for generated spec')
    .option('-f, --force', 'Overwrite existing file')
    .option('-v, --values <values>', 'Additional values as JSON string')
    .action(async (type: string, name: string, options) => {
      try {
        // Validate type
        const validTypes: SpecType[] = [
          'genesis', 'standard', 'domain', 'implementation',
          'api', 'migration', 'security', 'validation',
          'operational', 'task-change'
        ]
        
        if (!validTypes.includes(type as SpecType)) {
          Logger.error(`Invalid type: ${type}. Valid types are: ${validTypes.join(', ')}`)
          process.exit(1)
        }

        // Parse values if provided
        let values = {}
        if (options.values) {
          try {
            values = JSON.parse(options.values)
          } catch (error) {
            Logger.error(`Invalid JSON in --values: ${options.values}`)
            process.exit(1)
          }
        }

        // Generate spec
        const generator = new SpecGenerator()
        const outputPath = await generator.generate({
          type: type as SpecType,
          name,
          outputPath: options.output,
          force: options.force,
          values
        })

        Logger.success(`✅ Specification generated successfully!`)
        Logger.info(`📄 File: ${outputPath}`)
        Logger.info(`🔧 Type: ${type}`)
        Logger.info(`🏷️  ID: ${type}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
        
      } catch (error) {
        Logger.error('Failed to generate specification:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}