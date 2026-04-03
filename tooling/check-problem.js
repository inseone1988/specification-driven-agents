// Check what's wrong with the build
const fs = require('fs')
const path = require('path')

console.log('🔍 DIAGNOSTICANDO PROBLEMA DE BUILD')
console.log('='.repeat(50))

const currentDir = process.cwd()
console.log(`Directorio actual: ${currentDir}`)

// 1. Check package.json
console.log('\n1. 📦 Verificando package.json...')
const packagePath = path.join(currentDir, 'package.json')
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  console.log(`   Nombre: ${pkg.name}`)
  console.log(`   Versión: ${pkg.version}`)
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log(`   ✅ Script build: "${pkg.scripts.build}"`)
  } else {
    console.log(`   ❌ NO hay script "build" en package.json`)
    console.log(`   Scripts disponibles:`, pkg.scripts || 'Ninguno')
  }
} else {
  console.log('   ❌ package.json NO encontrado')
}

// 2. Check node_modules
console.log('\n2. 📁 Verificando node_modules...')
const nodeModulesPath = path.join(currentDir, 'node_modules')
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules existe')
  
  // Check tsup
  const tsupPath = path.join(nodeModulesPath, 'tsup')
  if (fs.existsSync(tsupPath)) {
    console.log('   ✅ tsup instalado')
  } else {
    console.log('   ❌ tsup NO instalado')
  }
} else {
  console.log('   ❌ node_modules NO existe')
}

// 3. Check TypeScript config
console.log('\n3. ⚙️  Verificando configuración TypeScript...')
const tsconfigPath = path.join(currentDir, 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  console.log('   ✅ tsconfig.json existe')
} else {
  console.log('   ❌ tsconfig.json NO existe')
}

// 4. Check tsup config
console.log('\n4. ⚡ Verificando configuración tsup...')
const tsupConfigPath = path.join(currentDir, 'tsup.config.ts')
if (fs.existsSync(tsupConfigPath)) {
  console.log('   ✅ tsup.config.ts existe')
} else {
  console.log('   ❌ tsup.config.ts NO existe')
}

console.log('\n' + '='.repeat(50))
console.log('🔧 SOLUCIÓN RECOMENDADA:')
console.log('\nEjecuta estos comandos:')
console.log('1. cd C:\\Users\\lupit\\projects\\specification-driven-agents\\tooling')
console.log('2. npm install')
console.log('3. npx tsup --version  (para verificar)')
console.log('4. npx tsup  (build manual)')
console.log('5. node dist/index.js --help  (probar)')

console.log('\n📋 Si npm run build sigue fallando:')
console.log('- Usa: node build-manual.js')
console.log('- O: simple-build.cmd')
console.log('- O ejecuta directamente: npx tsup')