import { Command } from 'commander'
import { SchemaValidator } from '../validators/schema-validator'
import { Logger } from '../utils/logger'
import fs from 'fs/promises'
import path from 'path'

export function createValidateCommand(): Command {
  const command = new Command('validate')
    .description('Validate a specification against the contract schema')
    .argument('<path>', 'Path to the specification file')
    .option('-s, --strict', 'Enable strict validation (treat warnings as errors)')
    .option('-j, --json', 'Output as JSON')
    .action(async (filePath: string, options) => {
      try {
        Logger.section(`Validating specification: ${filePath}`)
        
        // Read file
        const content = await fs.readFile(filePath, 'utf-8')
        
        // Validate
        const validator = new SchemaValidator()
        await validator.loadSchema()
        const result = validator.validateSpec(content, filePath)
        
        // Apply strict mode if enabled
        if (options.strict && result.warnings.length > 0) {
          result.valid = false
          result.errors.push(...result.warnings.map(w => ({
            ...w,
            severity: 'error' as const
          })))
          result.warnings = []
        }
        
        // Output results
        const output = validator.formatResults(result, options.json)
        console.log(output)
        
        if (!result.valid) {
          process.exit(1)
        }
        
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          Logger.error(`File not found: ${filePath}`)
        } else {
          Logger.error('Validation failed:', error instanceof Error ? error.message : String(error))
        }
        process.exit(1)
      }
    })

  return command
}