// Check TypeScript compilation
const { execSync } = require('child_process')

console.log('Checking TypeScript compilation...')

try {
  // Run TypeScript compiler check
  execSync('npx tsc --noEmit', { stdio: 'inherit' })
  console.log('✅ TypeScript compilation check passed!')
} catch (error) {
  console.error('❌ TypeScript compilation errors:')
  console.error(error.message)
  process.exit(1)
}