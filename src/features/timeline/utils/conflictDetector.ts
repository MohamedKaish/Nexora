import { TimelineBlock } from '@/types/timeline'

export function detectConflicts(blocks: TimelineBlock[]): Record<string, boolean> {
  const conflicts: Record<string, boolean> = {}
  
  type Event = { time: number; type: 'start' | 'end'; block: TimelineBlock }
  const events: Event[] = []

  // 1. Create start and end events for valid blocks
  for (const block of blocks) {
    if (!block.startTime || !block.endTime) continue
    events.push({ time: new Date(block.startTime).getTime(), type: 'start', block })
    events.push({ time: new Date(block.endTime).getTime(), type: 'end', block })
  }

  // 2. Sort events: by time, then 'end' before 'start' to avoid adjacent overlaps
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time
    return a.type === 'end' ? -1 : 1
  })

  // 3. Sweep line
  const activeBlocks = new Set<TimelineBlock>()

  for (const event of events) {
    if (event.type === 'start') {
      if (activeBlocks.size > 0) {
        conflicts[event.block.id] = true
        for (const activeBlock of activeBlocks) {
          conflicts[activeBlock.id] = true
        }
      }
      activeBlocks.add(event.block)
    } else {
      activeBlocks.delete(event.block)
    }
  }

  return conflicts
}
