import { Command } from 'commander'
import pkg from '../package.json' assert { type: 'json' }
const { version } = pkg
import figlet from 'figlet'
import chalk from 'chalk'

// Import command modules
import { createGenerateCommand } from './cli/generate'
import { createInitCommand } from './cli/init'
import { createValidateCommand } from './cli/validate'
import { createResolveCommand } from './cli/resolve'
import { createValidateProjectCommand } from './cli/validate-project'

const program = new Command()

// ASCII art banner
console.log(
  chalk.blue(
    figlet.textSync('SDA Tooling', {
      font: 'Small',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
)

program
  .name('sda')
  .description('CLI tooling for Specification-Driven Agents framework')
  .version(version, '-v, --version')
  .addHelpText('before', chalk.yellow('Specification-Driven Agents Tooling v' + version))

// Add the init command (should be first)
program.addCommand(createInitCommand())

// Add the generate command
program.addCommand(createGenerateCommand())

// Add the validate command
program.addCommand(createValidateCommand())

// Add the resolve command
program.addCommand(createResolveCommand())

// Add the validate-project command
program.addCommand(createValidateProjectCommand())

// Add the status command
import { createStatusCommand } from './cli/status'
program.addCommand(createStatusCommand())

// Add the graph command
import { createGraphCommand } from './cli/graph'
program.addCommand(createGraphCommand())

// Default help for unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '))
  console.log('See --help for a list of available commands.')
  process.exit(1)
})

// Handle errors
program.exitOverride((err) => {
  if (err.code === 'commander.unknownCommand') {
    console.error(chalk.red(`Unknown command: ${err.message}`))
    program.outputHelp()
  } else if (err.code !== 'commander.helpDisplayed') {
    console.error(chalk.red(err.message))
  }
  process.exit(err.exitCode)
})

// Parse arguments
try {
  program.parse(process.argv)
} catch (error) {
  console.error(chalk.red('Error:', error instanceof Error ? error.message : String(error)))
  process.exit(1)
}