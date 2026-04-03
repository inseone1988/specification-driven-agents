// Simple test script to verify the build works
const { execSync } = require('child_process')
const path = require('path')

console.log('Testing build process...')

try {
  // Change to tooling directory
  process.chdir(__dirname)
  
  // Run npm run build
  console.log('Running npm run build...')
  execSync('npm run build', { stdio: 'inherit' })
  
  console.log('✅ Build successful!')
  
  // Check if dist/index.js exists
  const fs = require('fs')
  const distPath = path.join(__dirname, 'dist', 'index.js')
  
  if (fs.existsSync(distPath)) {
    console.log(`✅ dist/index.js created: ${distPath}`)
    
    // Try to run the CLI help
    console.log('\nTesting CLI help command...')
    execSync('node dist/index.js --help', { stdio: 'inherit' })
    
  } else {
    console.error('❌ dist/index.js not found')
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}