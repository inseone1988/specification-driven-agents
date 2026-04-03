import { defineConfig } from 'tsup'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // Cambiar a CJS para compatibilidad con shebang
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node'
  },
  // Copiar plantillas al directorio dist
  onSuccess: async () => {
    const templatesDir = path.join(__dirname, 'templates')
    const distTemplatesDir = path.join(__dirname, 'dist', 'templates')
    
    // Crear directorio de plantillas en dist
    if (!fs.existsSync(distTemplatesDir)) {
      fs.mkdirSync(distTemplatesDir, { recursive: true })
    }
    
    // Copiar todas las plantillas
    const templateFiles = fs.readdirSync(templatesDir)
    for (const file of templateFiles) {
      const srcPath = path.join(templatesDir, file)
      const destPath = path.join(distTemplatesDir, file)
      fs.copyFileSync(srcPath, destPath)
      console.log(`Copied template: ${file}`)
    }
    
    // También copiar schemas desde tooling/schemas
    const schemasDir = path.join(__dirname, 'schemas')
    const distSchemasDir = path.join(__dirname, 'dist', 'schemas')
    
    if (fs.existsSync(schemasDir)) {
      if (!fs.existsSync(distSchemasDir)) {
        fs.mkdirSync(distSchemasDir, { recursive: true })
      }
      
      const schemaFiles = fs.readdirSync(schemasDir)
      for (const file of schemaFiles) {
        const srcPath = path.join(schemasDir, file)
        const destPath = path.join(distSchemasDir, file)
        fs.copyFileSync(srcPath, destPath)
        console.log(`Copied schema: ${file}`)
      }
    }
  }
})