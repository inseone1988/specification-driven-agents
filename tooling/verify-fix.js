// Verify the shebang fix
const fs = require('fs')
const path = require('path')

console.log('🔍 VERIFYING SHEBANG FIX')
console.log('='.repeat(40))

const distIndex = path.join(__dirname, 'dist', 'index.js')

if (!fs.existsSync(distIndex)) {
  console.log('❌ dist/index.js not found. Run build first.')
  console.log('\nRun: npx tsup')
  process.exit(1)
}

// Read first few lines
const content = fs.readFileSync(distIndex, 'utf-8')
const lines = content.split('\n').slice(0, 5)

console.log('\nFirst 5 lines of dist/index.js:')
lines.forEach((line, i) => {
  console.log(`${i + 1}: ${line}`)
})

// Check for duplicate shebang
const shebangCount = lines.filter(line => line.trim() === '#!/usr/bin/env node').length

console.log('\n' + '='.repeat(40))
if (shebangCount === 1) {
  console.log('✅ PERFECT! Single shebang detected.')
  console.log('\n🚀 Test with: node dist/index.js --help')
} else if (shebangCount === 0) {
  console.log('⚠️  WARNING: No shebang found.')
  console.log('The CLI may not work as a global command.')
} else {
  console.log(`❌ PROBLEM: ${shebangCount} shebangs detected (should be 1).`)
  console.log('\n🔧 Fix by running: fix-build.cmd')
}

// Also check bin wrapper
console.log('\n📦 Checking bin wrapper...')
const binWrapper = path.join(__dirname, 'bin', 'sda.js')
if (fs.existsSync(binWrapper)) {
  const binContent = fs.readFileSync(binWrapper, 'utf-8')
  if (binContent.includes('#!/usr/bin/env node')) {
    console.log('✅ bin/sda.js has correct shebang')
  } else {
    console.log('❌ bin/sda.js missing shebang')
  }
}

console.log('\n🎯 NEXT STEPS:')
console.log('1. If single shebang: node dist/index.js --help')
console.log('2. Reinstall globally: npm install -g .')
console.log('3. Test: sda generate domain test --force')