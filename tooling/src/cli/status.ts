import { Command } from 'commander'
import { StatusManager } from '../managers/status-manager'
import { Logger } from '../utils/logger'
import { SpecStatus } from '../types'

export function createStatusCommand(): Command {
  const command = new Command('status')
    .description('Update specification lifecycle status')
    .argument('<spec-id>', 'ID of the specification')
    .argument('<status>', 'New status (draft, review, approved, implemented, deprecated, archived)')
    .option('-m, --message <message>', 'Status change message')
    .option('-l, --list', 'List all specifications with their status')
    .action(async (specId: string, status: string, options) => {
      try {
        const statusManager = new StatusManager()
        
        // Handle list option
        if (options.list) {
          Logger.section('Listing specification status')
          const specs = await statusManager.listStatus()
          
          if (specs.length === 0) {
            console.log('No specifications found')
            return
          }
          
          // Group by status
          const byStatus: Record<string, typeof specs> = {}
          specs.forEach(spec => {
            if (!byStatus[spec.status]) {
              byStatus[spec.status] = []
            }
            byStatus[spec.status].push(spec)
          })
          
          // Display by status
          const statusOrder: SpecStatus[] = ['draft', 'review', 'approved', 'implemented', 'deprecated', 'archived']
          
          statusOrder.forEach(status => {
            const specsInStatus = byStatus[status]
            if (specsInStatus && specsInStatus.length > 0) {
              console.log(`\n${status.toUpperCase()}:`)
              specsInStatus.forEach(spec => {
                console.log(`  • ${spec.specId} (${spec.type} v${spec.version}) - ${spec.owner}`)
              })
            }
          })
          
          console.log(`\nTotal: ${specs.length} specification(s)`)
          return
        }
        
        // Validate status
        const validStatus: SpecStatus[] = ['draft', 'review', 'approved', 'implemented', 'deprecated', 'archived']
        if (!validStatus.includes(status as SpecStatus)) {
          Logger.error(`Invalid status: ${status}. Valid statuses are: ${validStatus.join(', ')}`)
          process.exit(1)
        }
        
        // Update status
        Logger.section(`Updating status: ${specId} -> ${status}`)
        
        const result = await statusManager.updateStatus(
          specId,
          status as SpecStatus,
          options.message
        )
        
        if (result.success) {
          console.log(`✅ Status updated successfully!`)
          console.log(`   Specification: ${specId}`)
          console.log(`   Previous: ${result.previousStatus}`)
          console.log(`   New: ${status}`)
          console.log(`   File: ${result.filePath}`)
        }
        
      } catch (error) {
        Logger.error('Status update failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return command
}