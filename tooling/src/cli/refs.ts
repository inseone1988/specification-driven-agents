import { Command } from 'commander'
import { Logger } from '../utils/logger'
import { ReferenceParser, SpecReference } from '../utils/reference-parser'
import { glob } from 'glob'
import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'path'

interface RefStats {
  total: number
  local: number
  versioned: number
  external: number
  remote: number
  crossProject: number
}

export function createRefsCommand(): Command {
  const command = new Command('refs')
    .description('List and validate references between specifications')
    .option('-p, --path <path>', 'Project path', '.')
    .option('-r, --recursive', 'Search recursively', true)
    .option('-v, --validate', 'Validate references (check if targets exist)')
    .option('-j, --json', 'Output as JSON')
    .option('-s, --spec <spec-id>', 'Show refs for specific spec only')
    .action(async (options) => {
      try {
        const projectPath = path.resolve(options.path)
        Logger.section(`Analyzing references in: ${projectPath}`)
        
        // Find all spec files
        const patterns = options.recursive 
          ? ['**/*.yaml', '**/*.yml', '**/*.md']
          : ['*.yaml', '*.yml', '*.md']
        
        const files: string[] = []
        for (const pattern of patterns) {
          const matches = await glob(pattern, {
            cwd: projectPath,
            absolute: true,
            windowsPathsNoEscape: true,
            ignore: ['**/node_modules/**', '**/.git/**']
          })
          files.push(...matches)
        }
        
        // Filter out non-spec files
        const specFiles = files.filter(file => {
          const basename = path.basename(file).toLowerCase()
          if (basename === 'readme.md' || basename === 'changelog.md') return false
          return true
        })
        
        Logger.info(`Found ${specFiles.length} specification files`)
        
        const allRefs: Map<string, { ref: SpecReference; spec: string }[]> = new Map()
        const stats: RefStats = { total: 0, local: 0, versioned: 0, external: 0, remote: 0, crossProject: 0 }
        
        for (const file of specFiles) {
          const relativePath = path.relative(projectPath, file)
          
          try {
            const content = await fs.readFile(file, 'utf-8')
            let spec: Record<string, any>
            
            // Skip MD files that aren't specs
            if (file.endsWith('.md') && !file.includes('specs/')) {
              continue
            }
            
            try {
              spec = yaml.load(content) as Record<string, any>
            } catch {
              continue // Skip invalid YAML
            }
            
            if (!spec || !spec.authority) continue
            
            const specId = spec.meta?.id || path.basename(file, path.extname(file))
            
            // Extract references
            const authority = spec.authority
            const inheritsFrom = authority.inherits_from || []
            const dependsOn = authority.depends_on || []
            const conflictsWith = authority.conflicts_with || []
            
            const allAuthorityRefs = [...inheritsFrom, ...dependsOn, ...conflictsWith]
            const refs = ReferenceParser.extractAll(allAuthorityRefs)
            
            // Group by spec
            if (!allRefs.has(specId)) {
              allRefs.set(specId, [])
            }
            
            for (const ref of refs) {
              allRefs.get(specId)!.push({ ref, spec: relativePath })
              
              // Update stats
              stats.total++
              switch (ref.type) {
                case 'local': stats.local++; break
                case 'versioned': stats.versioned++; break
                case 'external': stats.external++; break
                case 'remote': stats.remote++; break
                case 'cross-project': stats.crossProject++; break
              }
            }
            
          } catch (error) {
            Logger.warn(`Failed to parse ${relativePath}: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
        
        // Output results
        if (options.json) {
          console.log(JSON.stringify({
            project: projectPath,
            stats,
            references: Object.fromEntries(allRefs)
          }, null, 2))
        } else {
          // Summary
          console.log('\n' + '='.repeat(60))
          console.log('📊 Reference Statistics')
          console.log('='.repeat(60))
          console.log(`Total References: ${stats.total}`)
          console.log(`  ├─ Local: ${stats.local}`)
          console.log(`  ├─ Versioned: ${stats.versioned}`)
          console.log(`  ├─ External: ${stats.external}`)
          console.log(`  ├─ Remote: ${stats.remote}`)
          console.log(`  └─ Cross-Project: ${stats.crossProject}`)
          console.log('='.repeat(60))
          
          // Detailed references by spec
          if (options.spec) {
            // Show only for specific spec
            const specRefs = allRefs.get(options.spec)
            if (specRefs) {
              console.log(`\n📎 References in @${options.spec}:`)
              for (const { ref } of specRefs) {
                console.log(`   ${ref.raw} (${ReferenceParser.getTypeName(ref.type)})`)
              }
            } else {
              console.log(`\n⚠️  No references found for: ${options.spec}`)
            }
          } else {
            // Show all
            console.log('\n📋 References by Specification:')
            for (const [specId, refs] of allRefs) {
              if (refs.length > 0) {
                console.log(`\n  @${specId}:`)
                for (const { ref } of refs) {
                  const typeIcon = getTypeIcon(ref.type)
                  console.log(`     ${typeIcon} ${ref.raw}`)
                }
              }
            }
          }
          
          // Validation
          if (options.validate) {
            console.log('\n' + '='.repeat(60))
            console.log('✅ Validation Results')
            console.log('='.repeat(60))
            
            // For now, just validate local references
            const localRefs = Array.from(allRefs.values())
              .flat()
              .filter(r => r.ref.type === 'local' || r.ref.type === 'versioned')
            
            console.log(`\nLocal references to validate: ${localRefs.length}`)
            
            // Check if targets exist
            const unresolved: string[] = []
            for (const { ref, spec } of localRefs) {
              const targetExists = await checkLocalSpecExists(
                path.join(projectPath, 'specs'),
                ref.specId!
              )
              if (!targetExists) {
                unresolved.push(`${ref.raw} (referenced by @${spec})`)
              }
            }
            
            if (unresolved.length === 0) {
              console.log('\n✅ All local references resolved successfully!')
            } else {
              console.log(`\n❌ Unresolved references: ${unresolved.length}`)
              for (const ref of unresolved) {
                console.log(`   - ${ref}`)
              }
            }
          }
          
          // Reference format help
          console.log('\n' + '='.repeat(60))
          console.log('📖 Reference Format Guide')
          console.log('='.repeat(60))
          console.log('  @spec-id              → Local reference')
          console.log('  @spec-id@v1.0        → Versioned reference')
          console.log('  @external:./path     → External file reference')
          console.log('  @remote:owner/repo   → Remote repository reference')
          console.log('  @project:spec-id     → Cross-project reference')
          console.log('='.repeat(60))
        }
        
      } catch (error) {
        Logger.error('Failed to analyze references:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })
  
  return command
}

function getTypeIcon(type: SpecReference['type']): string {
  const icons: Record<SpecReference['type'], string> = {
    local: '🔗',
    versioned: '📌',
    external: '📁',
    remote: '🌐',
    'cross-project': '🔀'
  }
  return icons[type]
}

async function checkLocalSpecExists(specsDir: string, specId: string): Promise<boolean> {
  const locations = [
    path.join(specsDir, `${specId}.yaml`),
    path.join(specsDir, `${specId}.md`),
    path.join(specsDir, 'genesis', `${specId}.yaml`),
    path.join(specsDir, 'standards', `${specId}.yaml`),
    path.join(specsDir, 'domains', `${specId}.yaml`),
    path.join(specsDir, 'implementations', `${specId}.yaml`),
    path.join(specsDir, 'apis', `${specId}.yaml`),
    path.join(specsDir, 'migrations', `${specId}.yaml`),
  ]
  
  for (const location of locations) {
    try {
      await fs.access(location)
      return true
    } catch {
      continue
    }
  }
  
  return false
}
