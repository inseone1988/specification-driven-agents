// Check if imports work
try {
  // Test template-loader
  const templateLoaderCode = `
import fs from 'fs/promises'
import path from 'path'

console.log('✅ fs/promises import works')
console.log('✅ path import works')

// Test template exists
const templatesDir = path.join(process.cwd(), 'templates')
console.log('Templates dir:', templatesDir)
`
  
  // Test spec-generator
  const specGeneratorCode = `
import yaml from 'js-yaml'
console.log('✅ js-yaml import works')
`
  
  // Test CLI generate
  const generateCode = `
import { Command } from 'commander'
console.log('✅ commander import works')
`
  
  console.log('Testing imports...')
  eval(templateLoaderCode)
  eval(specGeneratorCode)
  eval(generateCode)
  
  console.log('✅ All imports should work!')
  
} catch (error) {
  console.error('Import error:', error.message)
}