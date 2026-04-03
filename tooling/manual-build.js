// Manual build approach
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('Starting manual build process...')

// 1. Check TypeScript compilation
console.log('\n1. Checking TypeScript compilation...')
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ TypeScript compilation check passed')
} catch (error) {
  console.error('❌ TypeScript compilation failed')
  process.exit(1)
}

// 2. Create a simple test to verify imports work
console.log('\n2. Creating import test...')
const importTest = `
import { TemplateLoader } from './src/generators/template-loader'
import { SpecGenerator } from './src/generators/spec-generator'
import { createGenerateCommand } from './src/cli/generate'

console.log('✅ All imports work!')

// Test TemplateLoader
const loader = new TemplateLoader()
console.log('TemplateLoader created')

// Test SpecGenerator  
const generator = new SpecGenerator()
console.log('SpecGenerator created')

// Test createGenerateCommand
const command = createGenerateCommand()
console.log('Generate command created:', command.name())
`

fs.writeFileSync(path.join(__dirname, 'import-test.ts'), importTest)

// 3. Try to compile the import test
console.log('\n3. Compiling import test...')
try {
  execSync('npx tsc import-test.ts --noEmit --module commonjs --target es2020', { 
    stdio: 'inherit', 
    cwd: __dirname 
  })
  console.log('✅ Import test compilation passed')
  
  // Clean up
  fs.unlinkSync(path.join(__dirname, 'import-test.ts'))
  
} catch (error) {
  console.error('❌ Import test compilation failed')
  fs.unlinkSync(path.join(__dirname, 'import-test.ts'))
  process.exit(1)
}

// 4. Try the actual build
console.log('\n4. Running tsup build...')
try {
  execSync('npx tsup', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ tsup build successful!')
  
  // 5. Test the built CLI
  console.log('\n5. Testing built CLI...')
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.js'))) {
    console.log('dist/index.js exists, testing help command...')
    execSync('node dist/index.js --help', { stdio: 'inherit', cwd: __dirname })
  } else {
    console.error('❌ dist/index.js not found')
  }
  
} catch (error) {
  console.error('❌ tsup build failed')
  process.exit(1)
}