import { Command } from 'commander'
import { SpecGenerator } from '../generators/spec-generator'
import { TemplateLoader } from '../generators/template-loader'
import { PluginManager } from '../managers/plugin-manager'
import { TemplateEngine } from '../generators/template-engine'
import { Logger } from '../utils/logger'
import { SpecType } from '../types'

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .description('Generate a new specification from template')
    .argument('<type>', 'Type of specification to generate')
    .argument('[name]', 'Name of the specification (optional, ignored for genesis type)')
    .option('-o, --output <path>', 'Output path for generated spec')
    .option('-f, --force', 'Overwrite existing file')
    .option('-v, --value <key=value>', 'Set template variable (can be used multiple times)', collectValues, {})
    .option('-j, --json-values <json>', 'Additional values as JSON string')
    .option('--preview', 'Preview the generated spec without writing')
    .action(async (type: string, name: string | undefined, options) => {
      try {
        // Discover plugins and get valid types
        const pluginManager = new PluginManager()
        await pluginManager.discoverPlugins()
        
        const validTypes = pluginManager.getValidSpecTypes()
        
        if (!validTypes.includes(type)) {
          Logger.error(`Invalid type: ${type}. Valid types are: ${validTypes.join(', ')}`)
          process.exit(1)
        }

        // For genesis type, name is always "genesis"
        const specName = type === 'genesis' ? 'genesis' : (name || type)

        // Determine output path
        const outputPath = type === 'genesis' && !options.output
          ? 'genesis.yaml'
          : options.output

        // Build values from multiple sources
        const values = buildValues(options.value, options.jsonValues)

        // Generate spec
        const generator = new SpecGenerator()
        
        if (options.preview) {
          // Preview mode: generate but don't write
          Logger.section(`Preview ${type} specification: ${specName}`)
          const resultPath = await generator.generate({
            type: type as SpecType,
            name: specName,
            outputPath: outputPath,
            force: true,  // Allow overwrite in preview
            values
          })
          
          // Read and display the generated content
          const fs = await import('fs/promises')
          const content = await fs.readFile(resultPath, 'utf-8')
          
          Logger.info('\n--- Generated Content Preview ---')
          console.log(content)
          Logger.info('--- End Preview ---\n')
          
          // Clean up preview file
          await fs.unlink(resultPath)
          Logger.info('Preview only — file not saved. Remove --preview to write.')
        } else {
          // Normal generation
          const resultPath = await generator.generate({
            type: type as SpecType,
            name: specName,
            outputPath: outputPath,
            force: options.force,
            values
          })

          Logger.success(`✅ Specification generated successfully!`)
          Logger.info(`📄 File: ${resultPath}`)
          Logger.info(`🔧 Type: ${type}`)
          Logger.info(`🏷️  ID: ${type}-${specName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
          
          // Show template warnings if any
          const engine = new TemplateEngine()
          engine.setVariables(values)
        }
        
      } catch (error) {
        Logger.error('Failed to generate specification:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}

/**
 * Collect multiple -v flags into a single object
 */
function collectValues(acc: Record<string, any>, value: string): Record<string, any> {
  const [key, ...valParts] = value.split('=')
  const val = valParts.join('=') // Handle values with = in them
  
  if (!key || val === undefined) {
    Logger.warn(`Invalid value format: ${value}. Expected key=value`)
    return acc
  }
  
  // Detect array syntax: tags=item1,item2,item3
  if (val.includes(',')) {
    acc[key] = val.split(',').map(v => v.trim())
  } else if (val === 'true') {
    acc[key] = true
  } else if (val === 'false') {
    acc[key] = false
  } else if (!isNaN(Number(val)) && val !== '') {
    acc[key] = Number(val)
  } else {
    acc[key] = val
  }
  
  return acc
}

/**
 * Build values from CLI options and JSON
 */
function buildValues(cliValues: Record<string, any>, jsonValues?: string): Record<string, any> {
  let values = { ...cliValues }
  
  // Parse JSON values if provided
  if (jsonValues) {
    try {
      const parsed = JSON.parse(jsonValues)
      values = { ...values, ...parsed }
    } catch (error) {
      Logger.error(`Invalid JSON in --json-values: ${jsonValues}`)
      process.exit(1)
    }
  }
  
  return values
}
