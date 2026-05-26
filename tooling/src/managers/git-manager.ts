import { execSync, exec, ChildProcess } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { Logger } from '../utils/logger'

const execAsync = promisify(exec)

export interface GitStatus {
  isGitRepo: boolean
  branch: string
  hasUncommittedChanges: boolean
  modifiedSpecs: string[]
  untrackedSpecs: string[]
  lastCommit: string
  lastCommitDate: string
}

export interface SpecChange {
  specId: string
  filePath: string
  changeType: 'added' | 'modified' | 'deleted' | 'renamed'
  diff: string
}

export class GitManager {
  private cwd: string

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd
  }

  /**
   * Check if current directory is a git repository
   */
  async isGitRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.cwd })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get git status for the project
   */
  async getStatus(): Promise<GitStatus> {
    const isGitRepo = await this.isGitRepo()
    if (!isGitRepo) {
      return {
        isGitRepo: false,
        branch: '',
        hasUncommittedChanges: false,
        modifiedSpecs: [],
        untrackedSpecs: [],
        lastCommit: '',
        lastCommitDate: ''
      }
    }

    try {
      // Get branch
      const { stdout: branch } = await execAsync('git branch --show-current', { cwd: this.cwd })
      
      // Get last commit (handle repos with no commits)
      let lastCommit = ''
      let lastCommitDate = ''
      try {
        const { stdout: lc } = await execAsync(
          'git log -1 --format="%H %s"',
          { cwd: this.cwd }
        )
        lastCommit = lc.trim()
        
        const { stdout: lcd } = await execAsync(
          'git log -1 --format="%ci"',
          { cwd: this.cwd }
        )
        lastCommitDate = lcd.trim()
      } catch {
        // No commits yet
      }

      // Get modified files in specs/
      const { stdout: modified } = await execAsync(
        'git diff --name-only',
        { cwd: this.cwd }
      )

      // Get untracked files
      const { stdout: untracked } = await execAsync(
        'git ls-files --others --exclude-standard',
        { cwd: this.cwd }
      )

      const modifiedSpecs = modified
        .split('\n')
        .filter(f => f.startsWith('specs/') && f.endsWith('.yaml'))

      const untrackedSpecs = untracked
        .split('\n')
        .filter(f => f.startsWith('specs/') && f.endsWith('.yaml'))

      return {
        isGitRepo: true,
        branch: branch.trim(),
        hasUncommittedChanges: modifiedSpecs.length > 0 || untrackedSpecs.length > 0,
        modifiedSpecs,
        untrackedSpecs,
        lastCommit: lastCommit.trim(),
        lastCommitDate: lastCommitDate.trim()
      }
    } catch (error) {
      Logger.error('Failed to get git status:', error instanceof Error ? error.message : String(error))
      return {
        isGitRepo: true,
        branch: 'unknown',
        hasUncommittedChanges: false,
        modifiedSpecs: [],
        untrackedSpecs: [],
        lastCommit: '',
        lastCommitDate: ''
      }
    }
  }

  /**
   * Get changes for a specific spec file
   */
  async getSpecChanges(filePath: string): Promise<SpecChange[]> {
    if (!await this.isGitRepo()) {
      return []
    }

    try {
      // Get diff for the file
      const { stdout: diff } = await execAsync(
        `git diff HEAD -- "${filePath}"`,
        { cwd: this.cwd }
      )

      // Check if file is new
      const { stdout: status } = await execAsync(
        `git status --short "${filePath}"`,
        { cwd: this.cwd }
      )

      const statusCode = status.trim().substring(0, 2)
      let changeType: SpecChange['changeType']

      if (statusCode.includes('A') || statusCode.includes('??')) {
        changeType = 'added'
      } else if (statusCode.includes('M')) {
        changeType = 'modified'
      } else if (statusCode.includes('D')) {
        changeType = 'deleted'
      } else if (statusCode.includes('R')) {
        changeType = 'renamed'
      } else {
        changeType = 'modified'
      }

      // Extract spec ID from diff
      const specIdMatch = diff.match(/id:\s*([\w-]+)/)
      const specId = specIdMatch ? specIdMatch[1] : path.basename(filePath, '.yaml')

      return [{
        specId,
        filePath,
        changeType,
        diff
      }]
    } catch {
      return []
    }
  }

  /**
   * Stage spec files
   */
  async stageSpecs(filePaths: string[]): Promise<void> {
    if (!await this.isGitRepo()) {
      throw new Error('Not a git repository')
    }

    for (const filePath of filePaths) {
      await execAsync(`git add "${filePath}"`, { cwd: this.cwd })
      Logger.info(`Staged: ${filePath}`)
    }
  }

  /**
   * Generate commit message from spec changes
   */
  async generateCommitMessage(): Promise<string> {
    const status = await this.getStatus()
    const allSpecs = [...status.modifiedSpecs, ...status.untrackedSpecs]

    if (allSpecs.length === 0) {
      return 'chore: update specifications'
    }

    // Get change types
    const changes: { type: string; specs: string[] }[] = []

    for (const specPath of allSpecs) {
      const specChanges = await this.getSpecChanges(specPath)
      for (const change of specChanges) {
        const existing = changes.find(c => c.type === change.changeType)
        if (existing) {
          existing.specs.push(change.specId)
        } else {
          changes.push({ type: change.changeType, specs: [change.specId] })
        }
      }
    }

    // Build conventional commit message
    const parts: string[] = []
    
    if (changes.find(c => c.type === 'added')) {
      const added = changes.find(c => c.type === 'added')!.specs
      parts.push(`add ${added.join(', ')}`)
    }
    
    if (changes.find(c => c.type === 'modified')) {
      const modified = changes.find(c => c.type === 'modified')!.specs
      parts.push(`update ${modified.join(', ')}`)
    }
    
    if (changes.find(c => c.type === 'deleted')) {
      const deleted = changes.find(c => c.type === 'deleted')!.specs
      parts.push(`remove ${deleted.join(', ')}`)
    }

    if (parts.length === 0) {
      return 'chore: update specifications'
    }

    return `spec: ${parts.join('; ')}`
  }

  /**
   * Commit spec changes with generated message
   */
  async commitSpecs(message?: string, autoStage: boolean = false): Promise<void> {
    if (!await this.isGitRepo()) {
      throw new Error('Not a git repository')
    }

    const status = await this.getStatus()
    
    if (!status.hasUncommittedChanges) {
      Logger.info('No spec changes to commit')
      return
    }

    // Auto-stage if requested
    if (autoStage) {
      const allSpecs = [...status.modifiedSpecs, ...status.untrackedSpecs]
      await this.stageSpecs(allSpecs)
    }

    // Generate or use provided message
    const commitMessage = message || await this.generateCommitMessage()

    // Commit
    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: this.cwd
    })

    Logger.success(`Committed: ${commitMessage}`)
  }

  /**
   * Update spec timestamps before commit
   */
  async updateTimestamps(filePaths: string[]): Promise<void> {
    const now = new Date().toISOString().split('T')[0]

    for (const filePath of filePaths) {
      if (!filePath.endsWith('.yaml')) continue

      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.cwd, filePath)
        const content = await fs.readFile(fullPath, 'utf-8')
        
        // Simple regex replacement for updated_at
        const updated = content.replace(
          /updated_at:\s*"[^"]+"/,
          `updated_at: "${now}"`
        )

        if (updated !== content) {
          await fs.writeFile(fullPath, updated, 'utf-8')
          Logger.info(`Updated timestamp: ${filePath}`)
        }
      } catch (error) {
        Logger.warn(`Failed to update timestamp for ${filePath}:`, error instanceof Error ? error.message : String(error))
      }
    }
  }

  /**
   * Install git hooks for SDA
   */
  async installHooks(): Promise<void> {
    if (!await this.isGitRepo()) {
      throw new Error('Not a git repository')
    }

    const hooksDir = path.join(this.cwd, '.git', 'hooks')
    const preCommitPath = path.join(hooksDir, 'pre-commit')
    const postCommitPath = path.join(hooksDir, 'post-commit')

    // Pre-commit: validate specs
    const preCommitHook = `#!/bin/sh
# SDA Pre-commit Hook
# Validates all specs before allowing commit

echo "Running SDA spec validation..."

if command -v sda >/dev/null 2>&1; then
  sda validate-project --fail-fast
  if [ $? -ne 0 ]; then
    echo "❌ Spec validation failed. Fix errors before committing."
    exit 1
  fi
  echo "✅ Spec validation passed"
else
  echo "⚠️  sda not found in PATH. Skipping spec validation."
fi

exit 0
`

    // Post-commit: update timestamps (optional, can be enabled via config)
    const postCommitHook = `#!/bin/sh
# SDA Post-commit Hook
# Updates spec timestamps after commit

# This hook is disabled by default. Enable it by setting:
#   git:
#     updateTimestamps: true
# in your .sda-config.yaml

exit 0
`

    await fs.writeFile(preCommitPath, preCommitHook, 'utf-8')
    await fs.writeFile(postCommitPath, postCommitHook, 'utf-8')
    
    // Make executable
    await fs.chmod(preCommitPath, 0o755)
    await fs.chmod(postCommitPath, 0o755)

    Logger.success('Git hooks installed:')
    Logger.info('  - pre-commit: Validates specs before commit')
    Logger.info('  - post-commit: Placeholder for timestamp updates')
  }

  /**
   * Check if working tree is clean
   */
  async isWorkingTreeClean(): Promise<boolean> {
    if (!await this.isGitRepo()) {
      return true
    }

    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: this.cwd })
      return stdout.trim() === ''
    } catch {
      return true
    }
  }
}
