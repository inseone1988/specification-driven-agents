import { Command } from 'commander'
import { GitManager } from '../managers/git-manager'
import { Logger } from '../utils/logger'

export function createGitCommand(): Command {
  const command = new Command('git')
    .description('Git integration for SDA specifications')

  // Status subcommand
  command
    .command('status')
    .description('Show git status for spec files')
    .option('-s, --short', 'Short format')
    .action(async (options) => {
      try {
        const git = new GitManager()
        const status = await git.getStatus()
        
        if (!status.isGitRepo) {
          Logger.warn('Not a git repository')
          return
        }

        if (options.short) {
          console.log(`${status.branch}: ${status.modifiedSpecs.length} modified, ${status.untrackedSpecs.length} untracked`)
        } else {
          Logger.section('Git Status')
          console.log(`Branch: ${status.branch}`)
          console.log(`Last commit: ${status.lastCommit}`)
          console.log(`Last commit date: ${status.lastCommitDate}`)
          console.log('')
          
          if (status.modifiedSpecs.length > 0) {
            console.log('Modified specs:')
            status.modifiedSpecs.forEach(spec => console.log(`  M ${spec}`))
          }
          
          if (status.untrackedSpecs.length > 0) {
            console.log('')
            console.log('Untracked specs:')
            status.untrackedSpecs.forEach(spec => console.log(`  A ${spec}`))
          }
          
          if (!status.hasUncommittedChanges) {
            console.log('✅ Working tree clean')
          }
        }
      } catch (error) {
        Logger.error('Git status failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Commit subcommand
  command
    .command('commit')
    .description('Commit spec changes with generated message')
    .option('-m, --message <msg>', 'Custom commit message')
    .option('-a, --auto-stage', 'Auto-stage all spec changes')
    .action(async (options) => {
      try {
        const git = new GitManager()
        
        if (!await git.isGitRepo()) {
          Logger.error('Not a git repository')
          process.exit(1)
        }

        await git.commitSpecs(options.message, options.autoStage)
      } catch (error) {
        Logger.error('Git commit failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Stage subcommand
  command
    .command('stage')
    .description('Stage spec files')
    .argument('[files...]', 'Specific files to stage (default: all specs)')
    .action(async (files: string[]) => {
      try {
        const git = new GitManager()
        
        if (!await git.isGitRepo()) {
          Logger.error('Not a git repository')
          process.exit(1)
        }

        const status = await git.getStatus()
        const toStage = files.length > 0 
          ? files 
          : [...status.modifiedSpecs, ...status.untrackedSpecs]

        if (toStage.length === 0) {
          Logger.info('No spec changes to stage')
          return
        }

        await git.stageSpecs(toStage)
      } catch (error) {
        Logger.error('Git stage failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Hooks subcommand
  command
    .command('hooks')
    .description('Install git hooks for SDA validation')
    .action(async () => {
      try {
        const git = new GitManager()
        await git.installHooks()
      } catch (error) {
        Logger.error('Hook installation failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  // Clean check
  command
    .command('clean')
    .description('Check if working tree is clean')
    .action(async () => {
      try {
        const git = new GitManager()
        const clean = await git.isWorkingTreeClean()
        
        if (clean) {
          console.log('✅ Working tree clean')
          process.exit(0)
        } else {
          console.log('❌ Working tree dirty')
          process.exit(1)
        }
      } catch (error) {
        Logger.error('Git clean check failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}
