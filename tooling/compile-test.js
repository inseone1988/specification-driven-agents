const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

async function compileTest() {
  console.log('Compiling test-simple.ts...')
  
  try {
    // First, try to compile just the test file
    const { stdout, stderr } = await execAsync('npx tsc test-simple.ts --noEmit --module commonjs --target es2020', {
      cwd: __dirname
    })
    
    if (stderr) {
      console.error('Compilation errors:', stderr)
    } else {
      console.log('✅ TypeScript compilation successful!')
      
      // Now try to run the actual build
      console.log('\nRunning full build...')
      const buildResult = await execAsync('npx tsup', {
        cwd: __dirname,
        stdio: 'inherit'
      })
      
      console.log('✅ Build completed!')
    }
    
  } catch (error) {
    console.error('Compilation failed:', error.message)
    if (error.stderr) {
      console.error('Error details:', error.stderr)
    }
  }
}

compileTest()