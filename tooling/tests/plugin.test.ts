import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PluginManager } from '../src/managers/plugin-manager'
import fs from 'fs/promises'
import path from 'path'

describe('Plugin System', () => {
  const testDir = path.join(__dirname, 'test-output', 'plugin-tests')
  let manager: PluginManager

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
    manager = new PluginManager()
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should discover built-in plugins', async () => {
    const plugins = await manager.discoverPlugins(testDir)
    
    // Should find at least the built-in plugin
    const builtin = plugins.find(p => p.source === 'builtin')
    expect(builtin).toBeDefined()
    expect(builtin?.name).toBe('builtin')
  })

  it('should register built-in spec types', async () => {
    await manager.discoverPlugins(testDir)
    
    const specTypes = manager.getValidSpecTypes()
    expect(specTypes.length).toBeGreaterThan(0)
    expect(specTypes).toContain('genesis')
    expect(specTypes).toContain('domain')
    expect(specTypes).toContain('task-change')
  })

  it('should discover project-local plugins', async () => {
    // Create a test plugin in .sda/plugins/
    const pluginDir = path.join(testDir, '.sda', 'plugins', 'test-plugin')
    await fs.mkdir(pluginDir, { recursive: true })
    await fs.mkdir(path.join(pluginDir, 'templates'), { recursive: true })
    
    const pluginConfig = {
      name: 'test-plugin',
      version: '1.0.0',
      specTypes: [
        { type: 'custom-test', level: 'implementation' }
      ]
    }
    
    await fs.writeFile(
      path.join(pluginDir, 'plugin.yaml'),
      JSON.stringify(pluginConfig, null, 2),
      'utf-8'
    )
    
    // Create a template for the custom type
    await fs.writeFile(
      path.join(pluginDir, 'templates', 'custom-test.yaml'),
      'meta:\n  id: {{id}}\n  type: custom-test\n',
      'utf-8'
    )
    
    const plugins = await manager.discoverPlugins(testDir)
    const testPlugin = plugins.find(p => p.name === 'test-plugin')
    
    expect(testPlugin).toBeDefined()
    expect(testPlugin?.source).toBe('project')
    expect(manager.hasSpecType('custom-test')).toBe(true)
  })

  it('should initialize project plugin directory', async () => {
    await manager.initProjectPlugins(testDir)
    
    const pluginDir = path.join(testDir, '.sda', 'plugins')
    const exampleDir = path.join(pluginDir, 'example')
    
    // Check directory structure was created
    const stats = await fs.stat(exampleDir)
    expect(stats.isDirectory()).toBe(true)
    
    // Check example plugin config exists
    const configPath = path.join(exampleDir, 'plugin.yaml')
    const configExists = await fs.access(configPath).then(() => true).catch(() => false)
    expect(configExists).toBe(true)
    
    // Check example template exists
    const templatePath = path.join(exampleDir, 'templates', 'custom-example.yaml')
    const templateExists = await fs.access(templatePath).then(() => true).catch(() => false)
    expect(templateExists).toBe(true)
  })

  it('should get template directories from plugins', async () => {
    // Create plugin with templates
    const pluginDir = path.join(testDir, '.sda', 'plugins', 'template-plugin')
    await fs.mkdir(path.join(pluginDir, 'templates'), { recursive: true })
    
    await fs.writeFile(
      path.join(pluginDir, 'plugin.yaml'),
      JSON.stringify({ name: 'template-plugin', version: '1.0.0' }),
      'utf-8'
    )
    
    await fs.writeFile(
      path.join(pluginDir, 'templates', 'test.yaml'),
      'meta:\n  id: test\n',
      'utf-8'
    )
    
    await manager.discoverPlugins(testDir)
    
    const templateDirs = manager.getTemplateDirectories()
    expect(templateDirs.some(dir => dir.includes('template-plugin'))).toBe(true)
  })
})
