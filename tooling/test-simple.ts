// Simple test file
import { TemplateLoader } from './src/generators/template-loader'

async function test() {
  console.log('Testing TemplateLoader...')
  const loader = new TemplateLoader()
  
  try {
    const templates = await loader.listTemplates()
    console.log('Available templates:', templates)
    
    if (templates.length > 0) {
      const content = await loader.loadTemplate(templates[0])
      console.log(`Loaded ${templates[0]} template (first ${100} chars):`)
      console.log(content.substring(0, 100) + '...')
    }
    
    console.log('✅ TemplateLoader test passed!')
  } catch (error) {
    console.error('❌ TemplateLoader test failed:', error)
  }
}

test().catch(console.error)