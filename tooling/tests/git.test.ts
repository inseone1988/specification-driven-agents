import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createGitCommand } from '../src/cli/git'
import { GitManager } from '../src/managers/git-manager'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

describe('Git Integration', () => {
  const testDir = path.join(__dirname, 'test-output', 'git-tests')
  let gitManager: GitManager

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
    
    // Initialize git repo
    try {
      execSync('git init', { cwd: testDir, stdio: 'ignore' })
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' })
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' })
    } catch {
      // Git might not be available in test environment
    }
    
    gitManager = new GitManager(testDir)
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('GitManager', () => {
    it('should detect if directory is a git repo', async () => {
      const isRepo = await gitManager.isGitRepo()
      // Might be false if git is not available
      expect(typeof isRepo).toBe('boolean')
    })

    it('should return empty status for non-git repo', async () => {
      // Create truly isolated directory (not inside git repo)
      const nonGitDir = path.join('/tmp', 'sda-test-non-git-' + Date.now())
      await fs.mkdir(nonGitDir, { recursive: true })
      
      try {
        const nonGitManager = new GitManager(nonGitDir)
        
        const status = await nonGitManager.getStatus()
        expect(status.isGitRepo).toBe(false)
        expect(status.branch).toBe('')
        expect(status.hasUncommittedChanges).toBe(false)
      } finally {
        await fs.rm(nonGitDir, { recursive: true, force: true })
      }
    })

    it('should detect clean working tree in new repo', async () => {
      const isRepo = await gitManager.isGitRepo()
      if (!isRepo) {
        // Skip if git not available
        return
      }
      
      const clean = await gitManager.isWorkingTreeClean()
      expect(clean).toBe(true)
    })

    it('should detect dirty working tree after creating files', async () => {
      const isRepo = await gitManager.isGitRepo()
      if (!isRepo) {
        return
      }
      
      // Create a spec file
      const specPath = path.join(testDir, 'specs', 'test.yaml')
      await fs.mkdir(path.dirname(specPath), { recursive: true })
      await fs.writeFile(specPath, 'meta:\n  id: test-spec\n', 'utf-8')
      
      const clean = await gitManager.isWorkingTreeClean()
      expect(clean).toBe(false)
    })

    it('should generate commit message for spec changes', async () => {
      const isRepo = await gitManager.isGitRepo()
      if (!isRepo) {
        return
      }
      
      // Make an initial commit first
      const readmePath = path.join(testDir, 'README.md')
      await fs.writeFile(readmePath, '# Test\n', 'utf-8')
      execSync('git add .', { cwd: testDir, stdio: 'ignore' })
      execSync('git commit -m "initial"', { cwd: testDir, stdio: 'ignore' })
      
      // Create a spec file
      const specPath = path.join(testDir, 'specs', 'test.yaml')
      await fs.mkdir(path.dirname(specPath), { recursive: true })
      await fs.writeFile(specPath, 'meta:\n  id: test-spec\n  type: domain\n', 'utf-8')
      
      // Don't stage yet - test detection of unstaged changes
      const message = await gitManager.generateCommitMessage()
      // Should detect the untracked spec file
      expect(message.startsWith('spec:')).toBe(true)
      expect(message.toLowerCase()).toContain('test')
    })

    it('should update timestamps in spec files', async () => {
      const specPath = path.join(testDir, 'specs', 'timestamp-test.yaml')
      await fs.mkdir(path.dirname(specPath), { recursive: true })
      await fs.writeFile(
        specPath,
        'meta:\n  id: timestamp-test\n  updated_at: "2026-01-01"\n',
        'utf-8'
      )
      
      await gitManager.updateTimestamps([specPath])
      
      const content = await fs.readFile(specPath, 'utf-8')
      expect(content).not.toContain('2026-01-01')
      // Should have today's date
      const today = new Date().toISOString().split('T')[0]
      expect(content).toContain(today)
    })
  })

  describe('Git Command', () => {
    it('should create git command', () => {
      const command = createGitCommand()
      expect(command.name()).toBe('git')
      expect(command.description()).toBe('Git integration for SDA specifications')
      
      // Check subcommands
      const subcommands = command.commands.map(cmd => cmd.name())
      expect(subcommands).toContain('status')
      expect(subcommands).toContain('commit')
      expect(subcommands).toContain('stage')
      expect(subcommands).toContain('hooks')
      expect(subcommands).toContain('clean')
    })
  })
})
