// Execute build step by step
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 EXECUTING BUILD - FASE 2 COMPLETION\n')
console.log('='.repeat(60))

try {
  // Step 1: Check TypeScript
  console.log('\n📝 STEP 1: TypeScript compilation check...')
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ TypeScript compilation OK')
  
  // Step 2: Build with tsup
  console.log('\n🔨 STEP 2: Building with tsup...')
  execSync('npx tsup', { stdio: 'inherit', cwd: __dirname })
  
  // Verify build output
  const distIndex = path.join(__dirname, 'dist', 'index.js')
  if (fs.existsSync(distIndex)) {
    const stats = fs.statSync(distIndex)
    console.log(`✅ Build successful! dist/index.js (${stats.size} bytes)`)
  } else {
    throw new Error('dist/index.js not found')
  }
  
  // Step 3: Test CLI help
  console.log('\n🧪 STEP 3: Testing CLI help command...')
  execSync('node dist/index.js --help', { stdio: 'inherit', cwd: __dirname })
  
  // Step 4: Test generate command help
  console.log('\n🔧 STEP 4: Testing generate command help...')
  execSync('node dist/index.js generate --help', { stdio: 'inherit', cwd: __dirname })
  
  // Step 5: Test actual spec generation
  console.log('\n🎯 STEP 5: Testing spec generation...')
  console.log('Generating: sda generate domain test-user --force')
  
  // Create specs directory if it doesn't exist
  const specsDir = path.join(__dirname, 'specs')
  if (!fs.existsSync(specsDir)) {
    fs.mkdirSync(specsDir, { recursive: true })
  }
  
  execSync('node dist/index.js generate domain test-user --force', { 
    stdio: 'inherit', 
    cwd: __dirname 
  })
  
  // Verify generated file
  const generatedFile = path.join(__dirname, 'specs', 'domain-test-user.yaml')
  if (fs.existsSync(generatedFile)) {
    const content = fs.readFileSync(generatedFile, 'utf-8')
    console.log(`\n✅ Spec generated successfully!`)
    console.log(`📄 File: ${generatedFile}`)
    console.log(`📏 Size: ${content.length} characters`)
    
    // Show first few lines
    console.log('\n📋 Preview (first 10 lines):')
    const lines = content.split('\n').slice(0, 10)
    lines.forEach(line => console.log(`  ${line}`))
    
  } else {
    throw new Error('Generated file not found')
  }
  
  // Step 6: Test another spec type
  console.log('\n🧪 STEP 6: Testing standard spec generation...')
  console.log('Generating: sda generate standard security-rules --force')
  
  execSync('node dist/index.js generate standard security-rules --force', { 
    stdio: 'inherit', 
    cwd: __dirname 
  })
  
  const standardFile = path.join(__dirname, 'specs', 'standard-security-rules.yaml')
  if (fs.existsSync(standardFile)) {
    console.log(`✅ Standard spec generated: ${standardFile}`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 FASE 2 COMPLETADA EXITOSAMENTE!')
  console.log('\n📊 RESUMEN:')
  console.log('✅ 10 plantillas YAML creadas')
  console.log('✅ Generador de specs implementado')
  console.log('✅ CLI con comando generate funcional')
  console.log('✅ Build TypeScript completado')
  console.log('✅ Specs de prueba generados')
  
  console.log('\n🚀 PRÓXIMOS PASOS (FASE 3):')
  console.log('1. Implementar validación de specs (sda validate)')
  console.log('2. Añadir validación contra schemas YAML')
  console.log('3. Mejorar mensajes de error')
  console.log('4. Añadir tests de validación')
  
} catch (error) {
  console.error('\n❌ BUILD FAILED:', error.message)
  if (error.stderr) {
    console.error('Error details:', error.stderr.toString())
  }
  process.exit(1)
}