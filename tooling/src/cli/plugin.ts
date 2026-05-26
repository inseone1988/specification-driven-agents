import { Command } from 'commander'
import { PluginManager } from '../managers/plugin-manager'
import { Logger } from '../utils/logger'

export function createPluginCommand(): Command {
  const command = new Command('plugin')
    .description('Manage SDA plugins')

  // List plugins
  command
    .command('list')
    .description('List all discovered plugins')
    .option('-v, --verbose', 'Show detailed information')
    .action(async (options) => {
      try {
        const manager = new PluginManager()
        const plugins = await manager.discoverPlugins()

        if (plugins.length === 0) {
          Logger.info('No plugins found')
          return
        }

        Logger.section(`Discovered ${plugins.length} plugins`)

        plugins.forEach(plugin => {
          console.log(`\n${plugin.name} v${plugin.version} (${plugin.source})`)
          console.log(`  Path: ${plugin.path}`)
          
          if (options.verbose) {
            if (plugin.config.specTypes) {
              console.log(`  Spec types: ${plugin.config.specTypes.map(s => s.type).join(', ')}`)
            }
            if (plugin.config.validators) {
              console.log(`  Validators: ${plugin.config.validators.length}`)
            }
            if (plugin.config.generators) {
              console.log(`  Generators: ${plugin.config.generators.length}`)
            }
          }
        })
      } catch (error) {
        Logger.error('Plugin list failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Show plugin details
  command
    .command('show <name>')
    .description('Show details of a specific plugin')
    .action(async (name: string) => {
      try {
        const manager = new PluginManager()
        const plugins = await manager.discoverPlugins()
        const plugin = plugins.find(p => p.name === name)

        if (!plugin) {
          Logger.error(`Plugin not found: ${name}`)
          process.exit(1)
        }

        Logger.section(`Plugin: ${plugin.name}`)
        console.log(`Version: ${plugin.version}`)
        console.log(`Source: ${plugin.source}`)
        console.log(`Path: ${plugin.path}`)
        
        if (plugin.config.specTypes) {
          console.log('\nSpec Types:')
          plugin.config.specTypes.forEach(type => {
            console.log(`  - ${type.type} (level: ${type.level})`)
          })
        }

        const specTypes = manager.getSpecTypes()
        console.log('\nAll registered spec types:')
        specTypes.forEach((reg, type) => {
          console.log(`  - ${type}`)
        })
      } catch (error) {
        Logger.error('Plugin show failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Initialize plugin directory
  command
    .command('init')
    .description('Create plugin directory structure in current project')
    .action(async () => {
      try {
        const manager = new PluginManager()
        await manager.initProjectPlugins(process.cwd())
        Logger.success('Plugin directory initialized')
        Logger.info('Add custom templates to .sda/plugins/<your-plugin>/templates/')
      } catch (error) {
        Logger.error('Plugin init failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Validate plugins
  command
    .command('validate')
    .description('Validate all discovered plugins')
    .action(async () => {
      try {
        const manager = new PluginManager()
        const plugins = await manager.discoverPlugins()

        Logger.section('Validating plugins')
        
        let validCount = 0
        let invalidCount = 0

        for (const plugin of plugins) {
          const issues: string[] = []

          if (!plugin.config.name) {
            issues.push('Missing name')
          }

          if (!plugin.config.version) {
            issues.push('Missing version')
          }

          if (plugin.config.specTypes) {
            for (const specType of plugin.config.specTypes) {
              if (!specType.type) {
                issues.push('Spec type missing "type" field')
              }
              if (!specType.level) {
                issues.push(`Spec type ${specType.type} missing "level"`)
              }
            }
          }

          if (issues.length === 0) {
            Logger.success(`✓ ${plugin.name}`)
            validCount++
          } else {
            Logger.error(`✗ ${plugin.name}`)
            issues.forEach(issue => console.log(`  - ${issue}`))
            invalidCount++
          }
        }

        Logger.info(`\nValid: ${validCount}, Invalid: ${invalidCount}`)
      } catch (error) {
        Logger.error('Plugin validation failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}
