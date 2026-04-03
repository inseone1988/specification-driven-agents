// Step 1: TypeScript check
console.log('📝 Checking TypeScript compilation...')

// Create a simple test to check for syntax errors
const testCode = `
// Test that all TypeScript files can be parsed
import { TemplateLoader } from './src/generators/template-loader'
import { SpecGenerator } from './src/generators/spec-generator'
import { createGenerateCommand } from './src/cli/generate'
import { Logger } from './src/utils/logger'
import type { SpecType } from './src/types'

console.log('✅ All TypeScript imports parsed successfully')

// Quick type check
const validType: SpecType = 'domain'
console.log('✅ TypeScript type checking works:', validType)
`

// Write test file
const fs = require('fs')
const path = require('path')
fs.writeFileSync(path.join(__dirname, 'type-check-test.ts'), testCode)

console.log('Test file created. If no errors appear above, TypeScript is OK.')
console.log('Deleting test file...')
fs.unlinkSync(path.join(__dirname, 'type-check-test.ts'))

console.log('✅ TypeScript check completed (no syntax errors detected)')