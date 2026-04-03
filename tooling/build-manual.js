// Manual build script
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔨 MANUAL BUILD SCRIPT')
console.log('='.repeat(50))

try {
  // Step 1: Check if we're in the right directory
  console.log('\n📁 Step 1: Checking directory...')
  const currentDir = process.cwd()
  console.log(`Current directory: ${currentDir}`)
  
  const packageJsonPath = path.join(currentDir, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found in current directory')
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  console.log(`Package: ${packageJson.name} v${packageJson.version}`)
  
  // Step 2: Check if node_modules exists
  console.log('\n📦 Step 2: Checking dependencies...')
  const nodeModulesPath = path.join(currentDir, 'node_modules')
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('node_modules not found. Installing dependencies...')
    execSync('npm install', { stdio: 'inherit' })
  } else {
    console.log('node_modules exists')
  }
  
  // Step 3: Check if tsup is installed
  console.log('\n⚡ Step 3: Checking build tools...')
  try {
    execSync('npx tsup --version', { stdio: 'pipe' })
    console.log('✅ tsup is available')
  } catch (error) {
    console.log('❌ tsup not available. Installing...')
    execSync('npm install --save-dev tsup', { stdio: 'inherit' })
  }
  
  // Step 4: Run the build
  console.log('\n🏗️  Step 4: Running build...')
  console.log('Executing: npx tsup')
  
  execSync('npx tsup', { stdio: 'inherit' })
  
  // Step 5: Verify build output
  console.log('\n✅ Step 5: Verifying build output...')
  const distDir = path.join(currentDir, 'dist')
  const indexJs = path.join(distDir, 'index.js')
  
  if (fs.existsSync(indexJs)) {
    const stats = fs.statSync(indexJs)
    console.log(`✅ Build successful! dist/index.js (${stats.size} bytes)`)
    
    // Show first few lines
    const content = fs.readFileSync(indexJs, 'utf-8').split('\n').slice(0, 5).join('\n')
    console.log('\n📄 First 5 lines of dist/index.js:')
    console.log(content)
    
  } else {
    throw new Error('dist/index.js not created')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 MANUAL BUILD COMPLETED SUCCESSFULLY!')
  console.log('\n🚀 Next steps:')
  console.log('1. Test CLI: node dist/index.js --help')
  console.log('2. Install globally: npm install -g .')
  console.log('3. Test: sda generate domain test --force')
  
} catch (error) {
  console.error('\n❌ BUILD FAILED:', error.message)
  
  if (error.stderr) {
    console.error('Error details:', error.stderr.toString())
  }
  
  console.log('\n🔧 Troubleshooting steps:')
  console.log('1. Delete node_modules: rmdir /s node_modules')
  console.log('2. Delete package-lock.json: del package-lock.json')
  console.log('3. Clean install: npm install')
  console.log('4. Try manual TypeScript compile: npx tsc --noEmit')
  
  process.exit(1)
}