// Run the manual build
const { exec } = require('child_process')

console.log('🚀 Starting build process...\n')

const buildProcess = exec('node manual-build.js', {
  cwd: __dirname,
  stdio: 'inherit'
})

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 Build completed successfully!')
    
    // Test generating a spec
    console.log('\n🧪 Testing spec generation...')
    const testProcess = exec('node dist/index.js generate domain test-user --force', {
      cwd: __dirname,
      stdio: 'inherit'
    })
    
    testProcess.on('close', (testCode) => {
      if (testCode === 0) {
        console.log('\n✅ Spec generation test passed!')
        console.log('\n📋 Next steps:')
        console.log('1. Check the generated spec at ./specs/domain-test-user.yaml')
        console.log('2. Run tests: npm test')
        console.log('3. Continue with Phase 3 (Validation)')
      } else {
        console.log('\n⚠️  Spec generation test completed with code:', testCode)
      }
    })
    
  } else {
    console.error('\n❌ Build failed with code:', code)
  }
})