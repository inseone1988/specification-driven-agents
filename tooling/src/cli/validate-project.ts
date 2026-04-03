import { Command } from 'commander'
import { SchemaValidator } from '../validators/schema-validator'
import { Logger } from '../utils/logger'
import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

export function createValidateProjectCommand(): Command {
  const command = new Command('validate-project')
    .description('Validate all specifications in project')
    .option('-p, --path <path>', 'Project path', '.')
    .option('-r, --recursive', 'Recursive validation')
    .option('-s, --strict', 'Enable strict validation (treat warnings as errors)')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        const projectPath = path.resolve(options.path)
        Logger.section(`Validating project: ${projectPath}`)
        
        // Find specification files
        const specFiles = await findSpecificationFiles(projectPath, options.recursive)
        
        if (specFiles.length === 0) {
          Logger.warn('No specification files found')
          console.log('No specification files found in:', projectPath)
          return
        }
        
        Logger.info(`Found ${specFiles.length} specification file(s)`)
        
        // Validate each file
        const validator = new SchemaValidator()
        await validator.loadSchema()
        const results = []
        let totalValid = 0
        let totalErrors = 0
        let totalWarnings = 0
        
        for (const filePath of specFiles) {
          try {
            const relativePath = path.relative(projectPath, filePath)
            Logger.debug(`Validating: ${relativePath}`)
            
            const content = await fs.readFile(filePath, 'utf-8')
            const result = validator.validateSpec(content, relativePath)
            
            // Apply strict mode if enabled
            if (options.strict && result.warnings.length > 0) {
              result.valid = false
              result.errors.push(...result.warnings.map(w => ({
                ...w,
                severity: 'error' as const
              })))
              result.warnings = []
            }
            
            results.push({
              file: relativePath,
              ...result
            })
            
            if (result.valid) {
              totalValid++
            }
            totalErrors += result.errors.length
            totalWarnings += result.warnings.length
            
          } catch (error) {
            Logger.error(`Failed to validate ${filePath}:`, error instanceof Error ? error.message : String(error))
            results.push({
              file: path.relative(projectPath, filePath),
              valid: false,
              errors: [{
                path: filePath,
                message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
                code: 'VALIDATION_FAILED',
                severity: 'error'
              }],
              warnings: []
            })
            totalErrors++
          }
        }
        
        // Output results
        if (options.json) {
          console.log(JSON.stringify({
            project: projectPath,
            files: results.length,
            valid: totalValid,
            invalid: results.length - totalValid,
            errors: totalErrors,
            warnings: totalWarnings,
            results: results.map(r => ({
              file: r.file,
              valid: r.valid,
              errors: r.errors.length,
              warnings: r.warnings.length,
              specId: r.spec?.meta.id || 'unknown'
            }))
          }, null, 2))
        } else {
          console.log('\n' + '='.repeat(60))
          console.log('📊 Validation Summary')
          console.log('='.repeat(60))
          console.log(`Project: ${projectPath}`)
          console.log(`Files: ${results.length}`)
          console.log(`✅ Valid: ${totalValid}`)
          console.log(`❌ Invalid: ${results.length - totalValid}`)
          console.log(`⚠️  Errors: ${totalErrors}`)
          console.log(`🔶 Warnings: ${totalWarnings}`)
          console.log('='.repeat(60))
          
          // Show detailed results for invalid files
          const invalidResults = results.filter(r => !r.valid)
          if (invalidResults.length > 0) {
            console.log('\n❌ Invalid Specifications:')
            invalidResults.forEach((result, index) => {
              console.log(`\n${index + 1}. ${result.file}`)
              if (result.spec?.meta) {
                console.log(`   ID: ${result.spec.meta.id} (${result.spec.meta.type})`)
              }
              
              if (result.errors.length > 0) {
                console.log('   Errors:')
                result.errors.forEach((error, errorIndex) => {
                  console.log(`     ${errorIndex + 1}. ${error.message} (${error.code})`)
                })
              }
              
              if (result.warnings.length > 0) {
                console.log('   Warnings:')
                result.warnings.forEach((warning, warningIndex) => {
                  console.log(`     ${warningIndex + 1}. ${warning.message} (${warning.code})`)
                })
              }
            })
          }
          
          // Show valid files summary
          const validResults = results.filter(r => r.valid)
          if (validResults.length > 0) {
            console.log('\n✅ Valid Specifications:')
            validResults.forEach(result => {
              const specId = result.spec?.meta.id || 'unknown'
              const specType = result.spec?.meta.type || 'unknown'
              console.log(`   • ${result.file} (${specId} - ${specType})`)
            })
          }
        }
        
        // Exit with error code if any invalid files
        if (totalValid < results.length) {
          process.exit(1)
        }
        
      } catch (error) {
        Logger.error('Project validation failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}

/**
 * Find all specification files in a directory
 */
async function findSpecificationFiles(
  projectPath: string,
  recursive: boolean
): Promise<string[]> {
  try {
    const patterns = recursive 
      ? ['**/*.yaml', '**/*.yml', '**/*.md']
      : ['*.yaml', '*.yml', '*.md']
    
    const files: string[] = []
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        windowsPathsNoEscape: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
      })
      
      files.push(...matches)
    }
    
    // Filter to only include likely specification files
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      const filename = path.basename(file).toLowerCase()
      const dirname = path.basename(path.dirname(file)).toLowerCase()
      
      // Skip non-spec files
      if (filename.includes('package.json') || 
          filename.includes('tsconfig') ||
          filename.includes('.config.') ||
          filename === 'readme.md' ||
          filename === 'changelog.md') {
        return false
      }
      
      // Only include .md files that are in spec directories
      if (ext === '.md' && !['specs', 'specifications', 'templates'].includes(dirname)) {
        return false
      }
      
      return true
    })
    
  } catch (error) {
    Logger.error('Failed to find specification files:', error instanceof Error ? error.message : String(error))
    return []
  }
}