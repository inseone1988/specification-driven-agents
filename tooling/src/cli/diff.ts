import { Command } from 'commander'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'
import { Logger } from '../utils/logger'

interface DiffResult {
  path: string
  oldValue: any
  newValue: any
  type: 'added' | 'removed' | 'changed'
}

export function createDiffCommand(): Command {
  const command = new Command('diff')
    .description('Compare two specifications or versions')
    .argument('<spec-path>', 'Path to specification file')
    .argument('[compare-path]', 'Path to compare with (defaults to showing current file state)')
    .option('-j, --json', 'Output as JSON')
    .option('-s, --summary', 'Show summary only')
    .action(async (specPath: string, comparePath: string | undefined, options) => {
      try {
        Logger.section(`Comparing specifications`)
        
        // Read main spec
        const absoluteSpecPath = path.resolve(specPath)
        const specContent = await fs.readFile(absoluteSpecPath, 'utf-8')
        const spec = yaml.load(specContent) as Record<string, any>
        
        if (!spec || !spec.meta) {
          throw new Error(`Invalid specification: ${specPath}`)
        }
        
        let compareSpec: Record<string, any>
        
        if (comparePath) {
          // Compare with another file
          const absoluteComparePath = path.resolve(comparePath)
          const compareContent = await fs.readFile(absoluteComparePath, 'utf-8')
          compareSpec = yaml.load(compareContent) as Record<string, any>
          
          if (!compareSpec || !compareSpec.meta) {
            throw new Error(`Invalid comparison specification: ${comparePath}`)
          }
          
          Logger.info(`Comparing: ${specPath} ↔ ${comparePath}`)
        } else {
          // Show self-analysis (meta and structure overview)
          Logger.info(`Analyzing: ${specPath}`)
          await showSpecOverview(spec, specPath, options)
          return
        }
        
        // Calculate diff
        const diffs = calculateDiff(spec, compareSpec, '')
        
        if (options.json) {
          console.log(JSON.stringify({
            spec1: { path: specPath, id: spec.meta?.id },
            spec2: { path: comparePath, id: compareSpec.meta?.id },
            differences: diffs
          }, null, 2))
        } else {
          // Pretty print
          console.log('\n' + '='.repeat(60))
          console.log('📊 Diff Summary')
          console.log('='.repeat(60))
          console.log(`Spec 1: ${spec.meta?.id || 'unknown'} (${specPath})`)
          console.log(`Spec 2: ${compareSpec.meta?.id || 'unknown'} (${comparePath})`)
          console.log(`Changes: ${diffs.length}`)
          
          if (diffs.length === 0) {
            console.log('\n✅ Specifications are identical in structure and values')
          } else {
            const added = diffs.filter(d => d.type === 'added')
            const removed = diffs.filter(d => d.type === 'removed')
            const changed = diffs.filter(d => d.type === 'changed')
            
            console.log(`  Added: ${added.length}`)
            console.log(`  Removed: ${removed.length}`)
            console.log(`  Changed: ${changed.length}`)
            
            if (!options.summary) {
              // Show details
              if (added.length > 0) {
                console.log('\n🟢 Added:')
                added.forEach(d => {
                  console.log(`  + ${d.path}: ${formatValue(d.newValue)}`)
                })
              }
              
              if (removed.length > 0) {
                console.log('\n🔴 Removed:')
                removed.forEach(d => {
                  console.log(`  - ${d.path}: ${formatValue(d.oldValue)}`)
                })
              }
              
              if (changed.length > 0) {
                console.log('\n🟡 Changed:')
                changed.forEach(d => {
                  console.log(`  ~ ${d.path}:`)
                  console.log(`    - ${formatValue(d.oldValue)}`)
                  console.log(`    + ${formatValue(d.newValue)}`)
                })
              }
            }
          }
          
          console.log('='.repeat(60))
        }
        
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          Logger.error(`File not found: ${error.message}`)
        } else {
          Logger.error('Diff failed:', error instanceof Error ? error.message : String(error))
        }
        process.exit(1)
      }
    })

  return command
}

async function showSpecOverview(spec: Record<string, any>, path: string, options: any): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('📋 Specification Overview')
  console.log('='.repeat(60))
  
  // Meta
  if (spec.meta) {
    console.log('\n📝 Meta:')
    console.log(`  ID: ${spec.meta.id || 'N/A'}`)
    console.log(`  Title: ${spec.meta.title || 'N/A'}`)
    console.log(`  Type: ${spec.meta.type || 'N/A'}`)
    console.log(`  Version: ${spec.meta.version || 'N/A'}`)
    console.log(`  Status: ${spec.meta.status || 'N/A'}`)
    console.log(`  Owner: ${spec.meta.owner || 'N/A'}`)
  }
  
  // Authority
  if (spec.authority) {
    console.log('\n🏛️ Authority:')
    console.log(`  Level: ${spec.authority.level || 'N/A'}`)
    if (spec.authority.inherits_from?.length > 0) {
      console.log(`  Inherits from: ${spec.authority.inherits_from.join(', ')}`)
    }
    if (spec.authority.depends_on?.length > 0) {
      console.log(`  Depends on: ${spec.authority.depends_on.join(', ')}`)
    }
  }
  
  // Purpose
  if (spec.purpose) {
    console.log('\n🎯 Purpose:')
    console.log(`  Summary: ${spec.purpose.summary || 'N/A'}`)
    if (spec.purpose.scope) {
      const includes = spec.purpose.scope.includes?.length || 0
      const excludes = spec.purpose.scope.excludes?.length || 0
      console.log(`  Scope: ${includes} includes, ${excludes} excludes`)
    }
  }
  
  // Implementation
  if (spec.implementation) {
    console.log('\n🔧 Implementation:')
    console.log(`  Generation mode: ${spec.implementation.generation_mode || 'N/A'}`)
    console.log(`  Migration strategy: ${spec.implementation.migration_strategy || 'N/A'}`)
    if (spec.implementation.affected_paths?.length > 0) {
      console.log(`  Affected paths: ${spec.implementation.affected_paths.length}`)
    }
  }
  
  // Top-level section count
  const topLevelSections = Object.keys(spec).filter(k => !k.startsWith('_'))
  console.log(`\n📊 Top-level sections: ${topLevelSections.length}`)
  console.log(`  ${topLevelSections.join(', ')}`)
  
  console.log('='.repeat(60))
}

function calculateDiff(
  obj1: any,
  obj2: any,
  currentPath: string
): DiffResult[] {
  const diffs: DiffResult[] = []
  
  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      path: currentPath || 'root',
      oldValue: obj1,
      newValue: obj2,
      type: 'changed'
    })
    return diffs
  }
  
  if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      diffs.push({
        path: currentPath || 'root',
        oldValue: obj1,
        newValue: obj2,
        type: 'changed'
      })
    }
    return diffs
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // Array comparison - simplified: compare lengths and check elements
    const maxLen = Math.max(obj1.length, obj2.length)
    for (let i = 0; i < maxLen; i++) {
      const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`
      if (i >= obj1.length) {
        diffs.push({ path: itemPath, oldValue: undefined, newValue: obj2[i], type: 'added' })
      } else if (i >= obj2.length) {
        diffs.push({ path: itemPath, oldValue: obj1[i], newValue: undefined, type: 'removed' })
      } else {
        diffs.push(...calculateDiff(obj1[i], obj2[i], itemPath))
      }
    }
    return diffs
  }
  
  // Object comparison
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
  
  for (const key of allKeys) {
    const newPath = currentPath ? `${currentPath}.${key}` : key
    
    if (!(key in obj1)) {
      diffs.push({ path: newPath, oldValue: undefined, newValue: obj2[key], type: 'added' })
    } else if (!(key in obj2)) {
      diffs.push({ path: newPath, oldValue: obj1[key], newValue: undefined, type: 'removed' })
    } else {
      diffs.push(...calculateDiff(obj1[key], obj2[key], newPath))
    }
  }
  
  return diffs
}

function formatValue(value: any): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === 'object') return `{${Object.keys(value).length} keys}`
  return String(value)
}
