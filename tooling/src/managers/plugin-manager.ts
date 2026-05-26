import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import { Logger } from '../utils/logger'
import { SpecPlugin, SpecTypeRegistration, CustomValidator, CustomGenerator } from '../types'

export interface DiscoveredPlugin {
  name: string
  version: string
  source: 'project' | 'global' | 'npm' | 'builtin'
  path: string
  config: SpecPlugin
  templatesDir?: string
  validatorsDir?: string
  generatorsDir?: string
}

export class PluginManager {
  private plugins: DiscoveredPlugin[] = []
  private specTypes: Map<string, SpecTypeRegistration> = new Map()
  private validators: Map<string, CustomValidator> = new Map()
  private generators: Map<string, CustomGenerator> = new Map()
  private templateDirs: string[] = []
  private discovered = false

  /**
   * Discover all available plugins from multiple sources
   */
  async discoverPlugins(projectPath: string = process.cwd()): Promise<DiscoveredPlugin[]> {
    if (this.discovered) {
      return this.plugins
    }

    Logger.section('Discovering plugins')

    const discovered: DiscoveredPlugin[] = []

    // 1. Project-local plugins (.sda/plugins/)
    const projectPluginsDir = path.join(projectPath, '.sda', 'plugins')
    const projectPlugins = await this.scanPluginDirectory(projectPluginsDir, 'project')
    discovered.push(...projectPlugins)

    // 2. Global user plugins (~/.sda/plugins/)
    const globalPluginsDir = path.join(this.getHomeDir(), '.sda', 'plugins')
    const globalPlugins = await this.scanPluginDirectory(globalPluginsDir, 'global')
    discovered.push(...globalPlugins)

    // 3. NPM packages (sda-plugin-*)
    const npmPlugins = await this.discoverNpmPlugins(projectPath)
    discovered.push(...npmPlugins)

    // 4. Built-in templates (always last)
    const builtinDir = path.join(__dirname, '..', '..', 'templates')
    discovered.push({
      name: 'builtin',
      version: '0.1.0',
      source: 'builtin',
      path: builtinDir,
      config: { name: 'builtin', version: '0.1.0' },
      templatesDir: builtinDir
    })

    this.plugins = discovered
    this.discovered = true

    // Register all discovered plugins
    await this.registerPlugins()

    Logger.success(`Discovered ${discovered.length} plugin sources`)
    discovered.forEach(p => {
      Logger.info(`  ${p.name} (${p.source})`)
    })

    return discovered
  }

  /**
   * Scan a directory for plugins
   */
  private async scanPluginDirectory(dir: string, source: DiscoveredPlugin['source']): Promise<DiscoveredPlugin[]> {
    const plugins: DiscoveredPlugin[] = []

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const pluginPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // Try to load plugin from directory
          const plugin = await this.loadPluginFromDirectory(pluginPath, source)
          if (plugin) {
            plugins.push(plugin)
          }
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
          // Single-file plugin
          const plugin = await this.loadPluginFromFile(pluginPath, source)
          if (plugin) {
            plugins.push(plugin)
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return plugins
  }

  /**
   * Load a plugin from a directory
   */
  private async loadPluginFromDirectory(pluginPath: string, source: DiscoveredPlugin['source']): Promise<DiscoveredPlugin | null> {
    try {
      // Try to find plugin config
      const configFiles = [
        'plugin.yaml',
        'plugin.json',
        'package.json',
        '.sda-plugin.yaml'
      ]

      let config: SpecPlugin | null = null
      let configPath: string | null = null

      for (const configFile of configFiles) {
        const fullPath = path.join(pluginPath, configFile)
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const parsed = configFile.endsWith('.json') ? JSON.parse(content) : yaml.load(content)
          
          if (configFile === 'package.json') {
            // Extract from package.json sda field
            if (parsed.sda) {
              config = {
                name: parsed.name || path.basename(pluginPath),
                version: parsed.version || '0.1.0',
                ...parsed.sda
              }
            }
          } else {
            config = parsed as SpecPlugin
          }

          configPath = fullPath
          break
        } catch {
          // File doesn't exist or invalid, try next
        }
      }

      if (!config) {
        // No config found, but check for templates directory
        const templatesDir = path.join(pluginPath, 'templates')
        try {
          await fs.access(templatesDir)
          // Has templates, treat as anonymous plugin
          config = {
            name: path.basename(pluginPath),
            version: '0.1.0'
          }
        } catch {
          return null
        }
      }

      const plugin: DiscoveredPlugin = {
        name: config.name || path.basename(pluginPath),
        version: config.version || '0.1.0',
        source,
        path: pluginPath,
        config,
        templatesDir: path.join(pluginPath, 'templates'),
        validatorsDir: path.join(pluginPath, 'validators'),
        generatorsDir: path.join(pluginPath, 'generators')
      }

      return plugin
    } catch (error) {
      Logger.warn(`Failed to load plugin from ${pluginPath}:`, error instanceof Error ? error.message : String(error))
      return null
    }
  }

  /**
   * Load a single-file plugin
   */
  private async loadPluginFromFile(filePath: string, source: DiscoveredPlugin['source']): Promise<DiscoveredPlugin | null> {
    try {
      // For JS/TS files, we'd require them dynamically
      // For now, skip single-file plugins (would need dynamic import)
      return null
    } catch {
      return null
    }
  }

  /**
   * Discover NPM-installed plugins
   */
  private async discoverNpmPlugins(projectPath: string): Promise<DiscoveredPlugin[]> {
    const plugins: DiscoveredPlugin[] = []

    // Check local node_modules
    const localNodeModules = path.join(projectPath, 'node_modules')
    const localPlugins = await this.scanNpmPackages(localNodeModules)
    plugins.push(...localPlugins)

    // Check global node_modules
    try {
      const { stdout } = await import('child_process').then(m => {
        const { execSync } = m
        return { stdout: execSync('npm root -g', { encoding: 'utf-8' }) }
      })
      const globalNodeModules = stdout.trim()
      const globalPlugins = await this.scanNpmPackages(globalNodeModules)
      plugins.push(...globalPlugins)
    } catch {
      // Can't find global node_modules
    }

    return plugins
  }

  /**
   * Scan NPM packages for sda-plugin-*
   */
  private async scanNpmPackages(nodeModulesPath: string): Promise<DiscoveredPlugin[]> {
    const plugins: DiscoveredPlugin[] = []

    try {
      const entries = await fs.readdir(nodeModulesPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('sda-plugin-')) {
          const pluginPath = path.join(nodeModulesPath, entry.name)
          const plugin = await this.loadPluginFromDirectory(pluginPath, 'npm')
          if (plugin) {
            plugins.push(plugin)
          }
        }
      }
    } catch {
      // node_modules doesn't exist
    }

    return plugins
  }

  /**
   * Register all discovered plugins
   */
  private async registerPlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      await this.registerPlugin(plugin)
    }
  }

  /**
   * Register a single plugin's contributions
   */
  private async registerPlugin(plugin: DiscoveredPlugin): Promise<void> {
    // Register spec types from config
    if (plugin.config.specTypes) {
      for (const specType of plugin.config.specTypes) {
        this.specTypes.set(specType.type, specType)
        Logger.debug(`Registered spec type: ${specType.type} from ${plugin.name}`)
      }
    }
    
    // Auto-register spec types from template files
    if (plugin.templatesDir) {
      try {
        const files = await fs.readdir(plugin.templatesDir)
        const templateFiles = files.filter(f => f.endsWith('.yaml'))
        
        for (const file of templateFiles) {
          const typeName = file.replace('.yaml', '')
          if (!this.specTypes.has(typeName)) {
            // Infer level from type name
            const level = this.inferLevelFromType(typeName)
            this.specTypes.set(typeName, { type: typeName, level })
            Logger.debug(`Auto-registered spec type: ${typeName} (level: ${level})`)
          }
        }
      } catch {
        // Can't read templates directory
      }
    }

    // Register template directories
    if (plugin.templatesDir) {
      try {
        await fs.access(plugin.templatesDir)
        this.templateDirs.push(plugin.templatesDir)
        Logger.debug(`Registered template directory: ${plugin.templatesDir}`)
      } catch {
        // Templates directory doesn't exist
      }
    }

    // Register validators (would need dynamic import for JS files)
    if (plugin.config.validators) {
      for (const validator of plugin.config.validators) {
        this.validators.set(validator.name, validator)
      }
    }

    // Register generators
    if (plugin.config.generators) {
      for (const generator of plugin.config.generators) {
        this.generators.set(generator.name, generator)
      }
    }
  }

  /**
   * Get all registered spec types
   */
  getSpecTypes(): Map<string, SpecTypeRegistration> {
    return new Map(this.specTypes)
  }

  /**
   * Get all template directories
   */
  getTemplateDirectories(): string[] {
    return [...this.templateDirs]
  }

  /**
   * Get all registered validators
   */
  getValidators(): Map<string, CustomValidator> {
    return new Map(this.validators)
  }

  /**
   * Get all registered generators
   */
  getGenerators(): Map<string, CustomGenerator> {
    return new Map(this.generators)
  }

  /**
   * Check if a spec type is registered
   */
  hasSpecType(type: string): boolean {
    return this.specTypes.has(type)
  }

  /**
   * Get spec type registration
   */
  getSpecType(type: string): SpecTypeRegistration | undefined {
    return this.specTypes.get(type)
  }

  /**
   * Get all valid spec type names
   */
  getValidSpecTypes(): string[] {
    return Array.from(this.specTypes.keys())
  }

  /**
   * Infer authority level from spec type name
   */
  private inferLevelFromType(typeName: string): string {
    // Map common type names to levels
    const levelMap: Record<string, string> = {
      genesis: 'genesis',
      standard: 'standard',
      domain: 'domain',
      implementation: 'implementation',
      api: 'implementation',
      migration: 'implementation',
      security: 'standard',
      validation: 'implementation',
      operational: 'implementation',
      'task-change': 'task-change'
    }
    
    return levelMap[typeName] || 'implementation'
  }

  /**
   * Get the home directory
   */
  private getHomeDir(): string {
    return process.env.HOME || process.env.USERPROFILE || '/tmp'
  }

  /**
   * Initialize plugin directory structure for a project
   */
  async initProjectPlugins(projectPath: string): Promise<void> {
    const pluginDir = path.join(projectPath, '.sda', 'plugins')
    
    await fs.mkdir(pluginDir, { recursive: true })
    
    // Create example plugin structure
    const exampleDir = path.join(pluginDir, 'example')
    await fs.mkdir(exampleDir, { recursive: true })
    await fs.mkdir(path.join(exampleDir, 'templates'), { recursive: true })
    
    // Create example plugin config
    const exampleConfig = {
      name: 'example',
      version: '0.1.0',
      specTypes: [
        {
          type: 'custom-example',
          level: 'implementation',
          template: 'custom-example.yaml'
        }
      ]
    }
    
    await fs.writeFile(
      path.join(exampleDir, 'plugin.yaml'),
      yaml.dump(exampleConfig),
      'utf-8'
    )
    
    // Create example template
    const exampleTemplate = `# Custom Example Specification: {{title}}

meta:
  id: {{id}}
  title: {{title}}
  type: custom-example
  version: 0.1.0
  status: draft
  owner: {{owner}}

authority:
  level: implementation
  inherits_from: []
  depends_on: []

purpose:
  summary: {{summary}}
  problem: |
    {{problem}}

history:
  change_reason: Initial custom example specification
  previous_version: null
  change_type: additive
  approved_by:
    - {{owner}}
`
    
    await fs.writeFile(
      path.join(exampleDir, 'templates', 'custom-example.yaml'),
      exampleTemplate,
      'utf-8'
    )
    
    Logger.info(`Created plugin directory: ${pluginDir}`)
    Logger.info('  Added example plugin in .sda/plugins/example/')
  }
}
