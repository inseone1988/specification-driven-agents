// Simple build test
const { spawn } = require('child_process')
const path = require('path')

console.log('Starting simple build test...')

// Run tsup directly
const tsup = spawn('npx', ['tsup'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
})

tsup.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully!')
    
    // Test the CLI
    console.log('\nTesting CLI...')
    const node = spawn('node', ['dist/index.js', '--help'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    })
    
    node.on('close', (nodeCode) => {
      if (nodeCode === 0) {
        console.log('✅ CLI test passed!')
      } else {
        console.log('⚠️  CLI test completed with code:', nodeCode)
      }
    })
    
  } else {
    console.error('❌ Build failed with code:', code)
  }
})