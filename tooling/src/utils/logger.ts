import chalk from 'chalk'

export class Logger {
  static info(message: string, ...args: any[]) {
    console.log(chalk.blue('ℹ'), message, ...args)
  }

  static success(message: string, ...args: any[]) {
    console.log(chalk.green('✓'), message, ...args)
  }

  static warn(message: string, ...args: any[]) {
    console.log(chalk.yellow('⚠'), message, ...args)
  }

  static error(message: string, ...args: any[]) {
    console.log(chalk.red('✗'), message, ...args)
  }

  static debug(message: string, ...args: any[]) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🔍'), message, ...args)
    }
  }

  static section(title: string) {
    console.log()
    console.log(chalk.cyan('='.repeat(50)))
    console.log(chalk.cyan.bold(title))
    console.log(chalk.cyan('='.repeat(50)))
    console.log()
  }

  static divider() {
    console.log(chalk.gray('-'.repeat(50)))
  }
}