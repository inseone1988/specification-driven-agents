import { Command } from 'commander'
import { SchemaValidator } from '../validators/schema-validator'
import { Logger } from '../utils/logger'
import fs from 'fs/promises'

export function createValidateCommand(): Command {
  const command = new Command('validate')
    .description('Validate a specification against the contract schema')
    .argument('<path>', 'Path to the specification file')
    .option('-s, --strict', 'Enable strict validation (treat warnings as errors)')
    .option('-j, --json', 'Output as JSON')
    .option('-f, --fix', 'Automatically fix common issues (show changes without writing)')
    .option('-w, --write', 'Write fixed file to disk (requires --fix)')
    .action(async (filePath: string, options) => {
      try {
        Logger.section(`Validating specification: ${filePath}`)
        
        // Read file
        const content = await fs.readFile(filePath, 'utf-8')
        
        // Validate
        const validator = new SchemaValidator()
        await validator.loadSchema()
        let result = validator.validateSpec(content, filePath)
        
        // Apply fix if requested
        if (options.fix && !result.valid) {
          console.log('Applying automatic fixes...')
          const fixResult = await validator.fixSpec(content, filePath)
          
          if (fixResult.changes.length > 0) {
            console.log('Changes made:')
            fixResult.changes.forEach(change => {
              console.log(`  + ${change}`)
            })
            
            if (options.write) {
              await fs.writeFile(filePath, fixResult.fixed, 'utf-8')
              console.log(`✓ Written to disk: ${filePath}`)
              // Re-validate after fix
              result = validator.validateSpec(fixResult.fixed, filePath)
            } else {
              console.log(`\nTip: Use --write to save changes to disk`)
            }
          } else {
            console.log('No changes needed - file is already complete')
          }
        }
        
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