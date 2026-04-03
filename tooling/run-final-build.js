// Final build execution
const { spawn } = require('child_process')

console.log('🚀 INICIANDO BUILD FINAL - FASE 2\n')

const build = spawn('node', ['execute-build.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
})

build.on('close', (code) => {
  if (code === 0) {
    console.log('\n✨ ¡FASE 2 COMPLETADA! ✨')
    
    // Show quick verification
    console.log('\n🔍 VERIFICACIÓN RÁPIDA:')
    console.log('1. Ejecuta: node dist/index.js --help')
    console.log('2. Prueba: node dist/index.js generate domain mi-dominio')
    console.log('3. Revisa: specs/domain-mi-dominio.yaml')
    
    console.log('\n📁 ESTRUCTURA COMPLETADA:')
    console.log('tooling/')
    console.log('├── templates/          # ✅ 10 plantillas YAML')
    console.log('├── src/generators/     # ✅ TemplateLoader + SpecGenerator')
    console.log('├── src/cli/           # ✅ Comando generate')
    console.log('├── dist/              # ✅ Build output')
    console.log('└── specs/             # ✅ Specs generados')
    
  } else {
    console.error(`\n❌ Build falló con código: ${code}`)
  }
})