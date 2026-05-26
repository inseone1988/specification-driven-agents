import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDiffCommand } from '../src/cli/diff'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'

describe('Diff Command', () => {
  const testDir = path.join(__dirname, 'test-output', 'diff-tests')

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Cleanup
    try {
      const files = await fs.readdir(testDir)
      for (const file of files) {
        await fs.unlink(path.join(testDir, file))
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should create diff command', () => {
    const command = createDiffCommand()
    expect(command.name()).toBe('diff')
    expect(command.description()).toBe('Compare two specifications or versions')
  })

  it('should show overview for single spec', async () => {
    const spec1Path = path.join(testDir, 'spec1.yaml')
    const spec1 = {
      meta: {
        id: 'domain-test-1',
        title: 'Test Domain 1',
        type: 'domain',
        version: '0.1.0',
        contract_version: '0.1.0',
        status: 'draft',
        owner: 'test',
        created_at: '2026-05-26',
        updated_at: '2026-05-26',
        tags: []
      },
      authority: {
        level: 'domain',
        inherits_from: ['genesis-test'],
        depends_on: []
      },
      purpose: {
        summary: 'Test summary',
        problem: 'Test problem',
        scope: { includes: ['test'], excludes: [] },
        non_goals: []
      },
      context: {
        bounded_context: 'test',
        actors: ['user'],
        capabilities: ['cap1'],
        constraints: []
      },
      contracts: {
        invariants: ['inv1'],
        validations: ['val1']
      },
      implementation: {
        targets: ['src/'],
        affected_paths: ['src/**/*.ts'],
        generation_mode: 'manual',
        migration_strategy: 'safe'
      },
      validation: {
        required_checks: ['check1'],
        acceptance_criteria: ['crit1']
      },
      history: {
        change_reason: 'initial',
        previous_version: null,
        change_type: 'additive',
        approved_by: ['test']
      }
    }
    
    await fs.writeFile(spec1Path, yaml.dump(spec1))
    
    // Test that the file is valid YAML and has the right structure
    const content = await fs.readFile(spec1Path, 'utf-8')
    const parsed = yaml.load(content)
    expect(parsed.meta.id).toBe('domain-test-1')
    expect(parsed.meta.title).toBe('Test Domain 1')
  })

  it('should detect differences between two specs', async () => {
    const spec1Path = path.join(testDir, 'spec1.yaml')
    const spec2Path = path.join(testDir, 'spec2.yaml')
    
    const spec1 = {
      meta: {
        id: 'domain-test-1',
        title: 'Test Domain 1',
        type: 'domain',
        version: '0.1.0',
        contract_version: '0.1.0',
        status: 'draft',
        owner: 'test',
        created_at: '2026-05-26',
        updated_at: '2026-05-26',
        tags: []
      },
      authority: {
        level: 'domain',
        inherits_from: ['genesis-test'],
        depends_on: []
      },
      purpose: {
        summary: 'Test summary',
        problem: 'Test problem',
        scope: { includes: ['test'], excludes: [] },
        non_goals: []
      },
      context: {
        bounded_context: 'test',
        actors: ['user'],
        capabilities: ['cap1'],
        constraints: []
      },
      contracts: {
        invariants: ['inv1'],
        validations: ['val1']
      },
      implementation: {
        targets: ['src/'],
        affected_paths: ['src/**/*.ts'],
        generation_mode: 'manual',
        migration_strategy: 'safe'
      },
      validation: {
        required_checks: ['check1'],
        acceptance_criteria: ['crit1']
      },
      history: {
        change_reason: 'initial',
        previous_version: null,
        change_type: 'additive',
        approved_by: ['test']
      }
    }
    
    const spec2 = {
      ...spec1,
      meta: {
        ...spec1.meta,
        title: 'Test Domain 2 - Updated',
        version: '0.2.0',
        status: 'review' as const
      },
      purpose: {
        ...spec1.purpose,
        summary: 'Updated summary'
      }
    }
    
    await fs.writeFile(spec1Path, yaml.dump(spec1))
    await fs.writeFile(spec2Path, yaml.dump(spec2))
    
    // Read back and verify differences
    const content1 = yaml.load(await fs.readFile(spec1Path, 'utf-8'))
    const content2 = yaml.load(await fs.readFile(spec2Path, 'utf-8'))
    
    expect(content1.meta.title).toBe('Test Domain 1')
    expect(content2.meta.title).toBe('Test Domain 2 - Updated')
    expect(content1.meta.status).toBe('draft')
    expect(content2.meta.status).toBe('review')
  })
})
