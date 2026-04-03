import { Command } from 'commander'
import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/logger'

export interface InitOptions {
  force?: boolean
  name?: string
  description?: string
  author?: string
  skipExamples?: boolean
}

export async function initProject(
  projectPath: string = '.',
  options: InitOptions = {}
): Promise<void> {
  const {
    force = false,
    name = path.basename(path.resolve(projectPath)),
    description = 'A Specification-Driven Agents project',
    author = process.env.USER || process.env.USERNAME || 'unknown',
    skipExamples = false
  } = options

  Logger.section(`Initializing Specification-Driven Agents project: ${name}`)

  const absolutePath = path.resolve(projectPath)
  
  // Check if directory exists and is not empty
  try {
    const files = await fs.readdir(absolutePath)
    if (files.length > 0 && !force) {
      throw new Error(`Directory is not empty: ${absolutePath}. Use --force to initialize anyway.`)
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      // Directory exists but we can't read it
      throw error
    }
    // Directory doesn't exist, create it
    await fs.mkdir(absolutePath, { recursive: true })
  }

  // Create directory structure
  const directories = [
    'specs/genesis',
    'specs/standards',
    'specs/domains',
    'specs/implementations',
    'specs/apis',
    'specs/migrations',
    'specs/security',
    'specs/validation',
    'specs/operational',
    'specs/task-changes',
    'schemas',
    'templates',
    'docs'
  ]

  Logger.info('Creating directory structure...')
  for (const dir of directories) {
    const dirPath = path.join(absolutePath, dir)
    await fs.mkdir(dirPath, { recursive: true })
    Logger.debug(`Created: ${dir}`)
  }

  // Create .sda-config.yaml
  Logger.info('Creating configuration file...')
  const configContent = `# Specification-Driven Agents Configuration
# Version: 0.1.0

project:
  name: "${name}"
  description: "${description}"
  author: "${author}"
  version: "0.1.0"
  created: "${new Date().toISOString().split('T')[0]}"

paths:
  specs: "./specs"
  schemas: "./schemas"
  templates: "./templates"
  docs: "./docs"

generation:
  defaultOwner: "\${USER}"
  askForValues: true
  autoOpen: false

validation:
  strict: false
  autoFix: false
  checkOnSave: true

authority:
  defaultInheritsFrom: ["genesis"]
  requireAuthorityChain: true
  allowOrphanSpecs: false

lifecycle:
  defaultStatus: "draft"
  requireApproval: true
  allowedTransitions:
    draft: ["review", "archived"]
    review: ["approved", "draft", "archived"]
    approved: ["implemented", "review", "archived"]
    implemented: ["deprecated", "archived"]
    deprecated: ["archived"]
    archived: []

# Git integration (optional)
git:
  autoCommit: false
  commitMessage: "spec: {action} {type} {name}"
  branchStrategy: "spec/{type}/{name}"

# CI/CD integration (optional)
ci:
  validateOnPush: true
  validateOnPR: true
  requireApproval: true
`
  await fs.writeFile(
    path.join(absolutePath, '.sda-config.yaml'),
    configContent,
    'utf-8'
  )

  // Copy schema file
  Logger.info('Setting up schemas...')
  try {
    const targetSchema = path.join(absolutePath, 'schemas/specification-contract.schema.yaml')
    const packageRoot = path.join(__dirname, '..', '..')
    
    const possibleSchemaPaths = [
      path.join(packageRoot, 'schemas', 'specification-contract.schema.yaml'),
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'spec-driven-agents', 'schemas', 'specification-contract.schema.yaml'),
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'spec-driven-agents', 'dist', 'schemas', 'specification-contract.schema.yaml'),
      path.join(process.cwd(), 'schemas', 'specification-contract.schema.yaml'),
      path.join(process.cwd(), '..', 'schemas', 'specification-contract.schema.yaml'),
    ]
    
    let schemaCopied = false
    for (const schemaPath of possibleSchemaPaths) {
      if (await fileExists(schemaPath)) {
        await fs.copyFile(schemaPath, targetSchema)
        Logger.info(`Copied schema from: ${schemaPath}`)
        schemaCopied = true
        break
      }
    }
    
    if (!schemaCopied) {
      Logger.warn('No schema found, creating basic schema')
      const basicSchema = `# Basic Specification Contract Schema
# For full schema, see: https://github.com/inseone1988/specification-driven-agents

schema:
  name: specification-contract
  version: 0.1.0
  description: Basic validation schema for specification contracts

# Note: Full schema validation requires the spec-driven-agents CLI
`
      await fs.writeFile(targetSchema, basicSchema, 'utf-8')
    }
  } catch (error) {
    Logger.warn('Could not setup schemas:', error instanceof Error ? error.message : String(error))
  }

  // Copy templates
  Logger.info('Setting up templates...')
  try {
    const templatesDir = path.join(absolutePath, 'templates')
    await copyTemplates(absolutePath, templatesDir)
    Logger.debug('Templates setup completed')
  } catch (error) {
    Logger.warn('Could not setup templates:', error instanceof Error ? error.message : String(error))
  }

  // Create example specs if not skipped
  if (!skipExamples) {
    Logger.info('Creating example specifications...')
    
    const examples = [
      {
        type: 'genesis',
        name: 'project-foundation',
        content: `meta:
  id: genesis-project-foundation
  title: Project Foundation Genesis
  type: genesis
  version: 0.1.0
  contract_version: 0.1.0
  status: draft
  owner: ${author}
  created_at: "${new Date().toISOString().split('T')[0]}"
  updated_at: "${new Date().toISOString().split('T')[0]}"

authority:
  level: genesis
  inherits_from: []
  depends_on: []

purpose:
  summary: Root specification for ${name}
  problem: Establish foundation and vision for the project
  scope:
    includes: [project vision, major domains, foundational constraints]
    excludes: [implementation details, specific APIs]
  non_goals: []

# ... rest of genesis spec structure
`
      },
      {
        type: 'standard',
        name: 'coding-standards',
        content: `meta:
  id: standard-coding-standards
  title: Coding Standards
  type: standard
  version: 0.1.0
  contract_version: 0.1.0
  status: draft
  owner: ${author}
  created_at: "${new Date().toISOString().split('T')[0]}"

authority:
  level: standard
  inherits_from: [genesis-project-foundation]
  depends_on: []

purpose:
  summary: Engineering standards for code quality
  problem: Ensure consistent, maintainable code across the project
  scope:
    includes: [code style, testing, documentation, review process]
    excludes: [business logic, domain-specific rules]
  non_goals: []
`
      }
    ]

    for (const example of examples) {
      // Special handling for 'genesis' type (no 's' plural)
      const typeDir = example.type === 'genesis' ? 'genesis' : `${example.type}s`
      const examplePath = path.join(absolutePath, 'specs', typeDir, `${example.name}.yaml`)
      await fs.writeFile(examplePath, example.content, 'utf-8')
      Logger.debug(`Created example: ${example.type}/${example.name}`)
    }
  }

  // Create README.md
  Logger.info('Creating project documentation...')
  const readmeContent = `# ${name}

A Specification-Driven Agents project.

## Project Structure

\`\`\`
${name}/
├── .sda-config.yaml          # Project configuration
├── specs/                    # Specification contracts
│   ├── genesis/             # Root specifications
│   ├── standards/           # Engineering standards
│   ├── domains/             # Business domains
│   ├── implementations/     # Implementation details
│   ├── apis/                # API contracts
│   ├── migrations/          # Data migrations
│   ├── security/            # Security specifications
│   ├── validation/          # Validation rules
│   ├── operational/         # Operational requirements
│   └── task-changes/        # Specific task changes
├── schemas/                 # Validation schemas
├── templates/               # Custom templates (optional)
└── docs/                    # Generated documentation
\`\`\`

## Getting Started

1. **Review the configuration**: \`.sda-config.yaml\`
2. **Explore examples**: \`specs/genesis/project-foundation.yaml\`
3. **Generate new specs**: \`sda generate <type> <name>\`
4. **Validate specs**: \`sda validate <path>\`

## Available Commands

\`\`\`bash
# Generate a new specification
sda generate domain user-management

# Validate a specification
sda validate specs/domains/user-management.yaml

# Validate entire project
sda validate-project

# Update specification status
sda status domain-user-management approved
\`\`\`

## Specification Types

- **genesis**: Root narrative and architectural foundation
- **standard**: Global engineering rules and conventions
- **domain**: Business capabilities and bounded contexts
- **implementation**: Technical implementation details
- **api**: Interface contracts and endpoints
- **migration**: Data structure evolution
- **security**: Security controls and requirements
- **validation**: Verification and testing rules
- **operational**: Deployment and runtime requirements
- **task-change**: Focused implementation tasks

## Links

- [Specification-Driven Agents Framework](https://github.com/inseone1988/specification-driven-agents)
- [Documentation](https://github.com/inseone1988/specification-driven-agents)
- [CLI Tooling](https://www.npmjs.com/package/spec-driven-agents)
`
  await fs.writeFile(
    path.join(absolutePath, 'README.md'),
    readmeContent,
    'utf-8'
  )

  // Create .gitignore if not exists
  const gitignorePath = path.join(absolutePath, '.gitignore')
  if (!await fileExists(gitignorePath)) {
    const gitignoreContent = `# SDA generated files
docs/generated/
.sda-cache/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
tmp/
temp/
`
    await fs.writeFile(gitignorePath, gitignoreContent, 'utf-8')
  }

  Logger.success(`✅ Project initialized successfully!`)
  Logger.info(`📁 Location: ${absolutePath}`)
  Logger.info(`📄 Configuration: .sda-config.yaml`)
  Logger.info(`📚 Documentation: README.md`)
  
  if (!skipExamples) {
    Logger.info(`📋 Examples: specs/genesis/project-foundation.yaml`)
    Logger.info(`              specs/standards/coding-standards.yaml`)
  }

  Logger.info('\n🚀 Next steps:')
  Logger.info(`1. Review .sda-config.yaml`)
  Logger.info(`2. Generate your first spec: sda generate domain <name>`)
  Logger.info(`3. Validate: sda validate specs/domains/<name>.yaml`)
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function copyTemplates(sourceDir: string, targetDir: string): Promise<void> {
  try {
    await fs.mkdir(targetDir, { recursive: true })
    
    // Determinar la ruta base del paquete instalado
    // __dirname en dist/src/cli/init.js -> necesitamos subir a dist/
    const packageRoot = path.join(__dirname, '..', '..')
    
    const possibleSourceDirs = [
      // 1. Desde instalación global (dist/templates en el paquete)
      path.join(packageRoot, 'templates'),
      // 2. Desde desarrollo local (tooling/templates)
      path.join(process.cwd(), 'templates'),
      path.join(process.cwd(), '..', 'templates'),
      // 3. Desde node_modules (instalación global en Windows)
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'spec-driven-agents', 'templates'),
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'spec-driven-agents', 'dist', 'templates'),
      // 4. Desde node_modules (instalación global en Unix)
      '/usr/local/lib/node_modules/spec-driven-agents/templates',
      '/usr/local/lib/node_modules/spec-driven-agents/dist/templates',
      // 5. Desde código fuente
      path.join(__dirname, '..', '..', 'templates'),
      path.join(__dirname, '..', '..', '..', 'templates'),
    ]
    
    let foundTemplates = false
    for (const possibleDir of possibleSourceDirs) {
      try {
        if (await fileExists(possibleDir)) {
          const files = await fs.readdir(possibleDir)
          const templateFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.md'))
          
          if (templateFiles.length > 0) {
            Logger.info(`Found templates in: ${possibleDir}`)
            for (const file of templateFiles) {
              const sourcePath = path.join(possibleDir, file)
              const targetPath = path.join(targetDir, file)
              await fs.copyFile(sourcePath, targetPath)
              Logger.debug(`Copied template: ${file}`)
            }
            foundTemplates = true
            Logger.info(`Copied ${templateFiles.length} templates`)
            break
          }
        }
      } catch {
        continue
      }
    }
    
    if (!foundTemplates) {
      Logger.warn('No templates found. Creating minimal templates...')
      await createMinimalTemplates(targetDir)
    }
  } catch (error) {
    Logger.warn(`Failed to copy templates: ${error instanceof Error ? error.message : String(error)}`)
    try {
      await createMinimalTemplates(targetDir)
    } catch {
      // Directorio ya existe
    }
  }
}

async function createMinimalTemplates(templatesDir: string): Promise<void> {
  const minimalTemplates = {
    'domain.yaml': `# Domain Specification: {{title}}
#
# Domain specifications define business domains with entities,
# value objects, aggregates, domain services, and business rules.

meta:
  id: {{id}}
  title: {{title}}
  type: domain
  version: 0.1.0
  contract_version: 0.1.0
  compatibility:
    supported_from: 0.1.0
    deprecated_after: null
  status: draft
  owner: {{owner}}
  created_at: {{date}}
  updated_at: {{date}}
  tags: []

# ... rest of domain template (truncated for brevity)
`,
    'standard.yaml': `# Standard Specification: {{title}}
#
# Standard specifications define engineering standards,
# coding conventions, and cross-cutting concerns.

meta:
  id: {{id}}
  title: {{title}}
  type: standard
  version: 0.1.0
  contract_version: 0.1.0
  compatibility:
    supported_from: 0.1.0
    deprecated_after: null
  status: draft
  owner: {{owner}}
  created_at: {{date}}
  updated_at: {{date}}
  tags: []

# ... rest of standard template
`,
    'genesis.md': `# Genesis Specification: {{title}}
#
# Genesis specifications define the overall vision, principles,
# and foundational decisions for a project or system.

## 🎯 Project Vision
{{summary}}

## 📋 Core Principles
1. **Principle 1**: [Description]
2. **Principle 2**: [Description]
3. **Principle 3**: [Description]

## 🏗️ Architectural Decisions
- [Decision 1]
- [Decision 2]
- [Decision 3]

## 📊 Success Metrics
- [Metric 1]
- [Metric 2]
- [Metric 3]
`
  }
  
  for (const [filename, content] of Object.entries(minimalTemplates)) {
    const filePath = path.join(templatesDir, filename)
    await fs.writeFile(filePath, content, 'utf-8')
    Logger.debug(`Created minimal template: ${filename}`)
  }
  
  Logger.info('Created minimal templates for domain, standard, and genesis types')
}

export function createInitCommand(): Command {
  const command = new Command('init')
    .description('Initialize a new Specification-Driven Agents project')
    .argument('[path]', 'Project path', '.')
    .option('-f, --force', 'Initialize even if directory is not empty')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('-a, --author <author>', 'Project author')
    .option('--skip-examples', 'Skip creating example specifications')
    .action(async (path: string, options) => {
      try {
        await initProject(path, options)
      } catch (error) {
        Logger.error('Failed to initialize project:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}