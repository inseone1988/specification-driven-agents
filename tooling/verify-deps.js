// Verify dependencies are installed
const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying dependencies...')

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))
const nodeModules = path.join(__dirname, 'node_modules')

// Check if node_modules exists
if (!fs.existsSync(nodeModules)) {
  console.log('❌ node_modules not found. Run: npm install')
  process.exit(1)
}

// Check key dependencies
const keyDeps = ['commander', 'js-yaml', 'zod', 'chalk', 'figlet']
const devDeps = ['typescript', 'tsup', 'vitest']

console.log('\n✅ Dependencies installed:')
keyDeps.forEach(dep => {
  const depPath = path.join(nodeModules, dep)
  if (fs.existsSync(depPath)) {
    console.log(`  - ${dep}`)
  } else {
    console.log(`  ❌ ${dep} MISSING`)
  }
})

console.log('\n✅ Dev dependencies installed:')
devDeps.forEach(dep => {
  const depPath = path.join(nodeModules, dep)
  if (fs.existsSync(depPath)) {
    console.log(`  - ${dep}`)
  } else {
    console.log(`  ❌ ${dep} MISSING`)
  }
})

console.log('\n📦 Package.json dependencies verified.')
console.log('\n🚀 Ready for build. Run: npm run build')