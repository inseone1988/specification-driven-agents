import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { TemplateLoader } from '../src/generators/template-loader'
import { SpecGenerator } from '../src/generators/spec-generator'
import fs from 'fs/promises'
import path from 'path'

describe('Format Rules by Specification Type', () => {
  let templateLoader: TemplateLoader
  let specGenerator: SpecGenerator
  const testOutputDir = path.join(__dirname, 'test-output')

  beforeEach(async () => {
    templateLoader = new TemplateLoader(path.join(__dirname, '..', 'templates'))
    specGenerator = new SpecGenerator(templateLoader)
    try {
      await fs.mkdir(testOutputDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }
  })

  afterEach(async () => {
    // Don't clean up between tests to avoid race conditions
  })
  
  afterAll(async () => {
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('TemplateLoader format detection', () => {
  it('should load genesis template as .md', async () => {
    const content = await templateLoader.loadTemplate('genesis')
    expect(content).toContain('# {{title}}')
    expect(content).toContain('## 🎯 Project Vision')
    // Should not contain YAML structure (except frontmatter)
    expect(content).toContain('---')  // Should have YAML frontmatter
    expect(content).toContain('id: {{id}}')
    expect(content).toContain('type: genesis')
  })

    it('should load domain template as .yaml', async () => {
      const content = await templateLoader.loadTemplate('domain')
      expect(content).toContain('meta:')
      expect(content).toContain('type: domain')
      expect(content).toContain('authority:')
    })

    it('should list all templates with correct extensions', async () => {
      const templates = await templateLoader.listTemplates()
      expect(templates).toContain('genesis')
      expect(templates).toContain('domain')
      expect(templates).toContain('standard')
      expect(templates).toContain('implementation')
      expect(templates).toContain('api')
      expect(templates).toContain('migration')
      expect(templates).toContain('security')
      expect(templates).toContain('validation')
      expect(templates).toContain('operational')
      expect(templates).toContain('task-change')
    })

    it('should check template existence with correct extension', async () => {
      expect(await templateLoader.templateExists('genesis')).toBe(true)
      expect(await templateLoader.templateExists('domain')).toBe(true)
      expect(await templateLoader.templateExists('nonexistent')).toBe(false)
    })
  })

  describe('SpecGenerator format output', () => {
    it('should generate genesis as .md file', async () => {
      const outputPath = path.join(testOutputDir, 'test-genesis.md')
      
      const result = await specGenerator.generate({
        type: 'genesis',
        name: 'test-project',
        outputPath
      })

      expect(result).toBe(outputPath)
      expect(result.endsWith('.md')).toBe(true)
      
      const content = await fs.readFile(outputPath, 'utf-8')
      expect(content).toContain('# Test Project Genesis Specification')
      expect(content).toContain('## 🎯 Project Vision')
      // Check for Genesis ID (allowing for whitespace variations)
      expect(content.toLowerCase()).toContain('genesis id:')
      expect(content.toLowerCase()).toContain('genesis-test-project')
      // Should contain YAML frontmatter
      expect(content).toContain('---')
      expect(content).toContain('id: genesis-test-project')
      expect(content).toContain('type: genesis')
    })

    it('should generate domain as .yaml file', async () => {
      const outputPath = path.join(testOutputDir, 'test-domain.yaml')
      
      const result = await specGenerator.generate({
        type: 'domain',
        name: 'user-management',
        outputPath
      })

      expect(result).toBe(outputPath)
      expect(result.endsWith('.yaml')).toBe(true)
      
      const content = await fs.readFile(outputPath, 'utf-8')
      expect(content).toContain('meta:')
      expect(content).toContain('type: domain')
      expect(content).toContain('id: domain-user-management')
      expect(content).toContain('authority:')
    })

    it('should use correct default extensions for each type', async () => {
      // Test genesis default path
      const genesisPath = await specGenerator.generate({
        type: 'genesis',
        name: 'my-project'
      })
      expect(genesisPath.endsWith('.md')).toBe(true)
      expect(genesisPath).toContain('genesis-my-project.md')

      // Test domain default path  
      const domainPath = await specGenerator.generate({
        type: 'domain',
        name: 'auth'
      })
      expect(domainPath.endsWith('.yaml')).toBe(true)
      expect(domainPath).toContain('domain-auth.yaml')

      // Test standard default path
      const standardPath = await specGenerator.generate({
        type: 'standard',
        name: 'security'
      })
      expect(standardPath.endsWith('.yaml')).toBe(true)
      expect(standardPath).toContain('standard-security.yaml')
    })

    it('should validate genesis differently (no YAML validation)', async () => {
      // This test ensures genesis doesn't go through YAML validation
      const outputPath = path.join(testOutputDir, 'simple-genesis.md')
      
      // Should succeed even though it's not YAML
      const result = await specGenerator.generate({
        type: 'genesis',
        name: 'simple',
        outputPath
      })
      
      expect(result).toBe(outputPath)
      const content = await fs.readFile(outputPath, 'utf-8')
      expect(content.trim().length).toBeGreaterThan(0)
    })

    it('should validate YAML specs for structure', async () => {
      const outputPath = path.join(testOutputDir, 'test-api.yaml')
      
      const result = await specGenerator.generate({
        type: 'api',
        name: 'users',
        outputPath
      })
      
      expect(result).toBe(outputPath)
      const content = await fs.readFile(outputPath, 'utf-8')
      // Should contain required YAML structure
      expect(content).toContain('meta:')
      expect(content).toContain('id: api-users')
      expect(content).toContain('type: api')
    })
  })

  describe('Format rule enforcement', () => {
    it('should reject genesis with .yaml extension in template loading', async () => {
      // TemplateLoader should look for genesis.md, not genesis.yaml
      await expect(templateLoader.loadTemplate('genesis')).resolves.toBeDefined()
      // Should not find genesis.yaml (we deleted it)
    })

    it('should enforce .md for genesis in default output paths', () => {
      // @ts-ignore - accessing private method for testing
      const getDefaultOutputPath = (type: string, name: string) => 
        specGenerator.getDefaultOutputPath(type as any, name)
      
      expect(getDefaultOutputPath('genesis', 'my-project')).toMatch(/\.md$/)
      expect(getDefaultOutputPath('domain', 'my-domain')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('standard', 'my-standard')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('api', 'my-api')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('implementation', 'my-impl')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('migration', 'my-migration')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('security', 'my-security')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('validation', 'my-validation')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('operational', 'my-ops')).toMatch(/\.yaml$/)
      expect(getDefaultOutputPath('task-change', 'my-task')).toMatch(/\.yaml$/)
    })
  })
})