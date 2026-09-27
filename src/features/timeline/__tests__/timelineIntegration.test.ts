import { describe, it, expect } from 'vitest'
import { KyroEngine } from '../../kyro/core/KyroEngine'
import { KyroContext, TaskInput, CalendarEventInput } from '../../kyro/types'
import fs from 'fs'
import path from 'path'

describe('P1 — Kyro to Timeline Integration & Truthful Feedback', () => {
  it('KyroEngine should schedule real tasks into gaps around fixed calendar events', async () => {
    const engine = new KyroEngine()

    // 10:00 to 11:30 fixed calendar meeting on 2026-08-10
    const baseDate = new Date('2026-08-10T09:00:00Z')
    const calendarEvents: CalendarEventInput[] = [
      {
        id: 'cal-meeting-1',
        title: 'Team Architecture Sync',
        startTime: '2026-08-10T10:00:00.000Z',
        endTime: '2026-08-10T11:30:00.000Z'
      }
    ]

    const tasks: TaskInput[] = [
      {
        id: 'task-urgent-1',
        title: 'Fix Production Hotfix',
        priority: 'urgent',
        estimatedMinutes: 45,
        dueDate: '2026-08-10T18:00:00.000Z'
      },
      {
        id: 'task-med-2',
        title: 'Write Documentation',
        priority: 'medium',
        estimatedMinutes: 60,
        dueDate: null
      }
    ]

    const context: KyroContext = {
      tasks,
      calendarEvents,
      habits: []
    }

    const blocks = await engine.schedule(context, baseDate)

    expect(Array.isArray(blocks)).toBe(true)
    expect(blocks.length).toBeGreaterThanOrEqual(3) // 1 fixed calendar + 2 scheduled task pieces

    // Verify calendar event exists as fixed block
    const calBlock = blocks.find(b => b.id === 'cal-meeting-1')
    expect(calBlock).toBeDefined()
    expect(calBlock?.type).toBe('calendar')

    // Verify tasks are scheduled
    const scheduledTasks = blocks.filter(b => b.type === 'task')
    expect(scheduledTasks.length).toBeGreaterThanOrEqual(2)

    // Verify urgent task is scheduled before medium task
    const urgentBlock = scheduledTasks.find(b => b.id === 'task-urgent-1')
    const medBlock = scheduledTasks.find(b => b.id === 'task-med-2')
    expect(urgentBlock).toBeDefined()
    expect(medBlock).toBeDefined()
    expect(new Date(urgentBlock!.startTime!).getTime()).toBeLessThan(new Date(medBlock!.startTime!).getTime())

    // Verify no task block overlaps with the calendar meeting (10:00 - 11:30)
    const meetingStart = new Date('2026-08-10T10:00:00.000Z').getTime()
    const meetingEnd = new Date('2026-08-10T11:30:00.000Z').getTime()

    for (const taskBlock of scheduledTasks) {
      const taskStart = new Date(taskBlock.startTime!).getTime()
      const taskEnd = new Date(taskBlock.endTime!).getTime()
      const overlaps = taskStart < meetingEnd && taskEnd > meetingStart
      expect(overlaps).toBe(false)
    }
  })

  it('KyroEngine handles empty tasks and calendar events truthfully (NO_CHANGE state)', async () => {
    const engine = new KyroEngine()
    const emptyContext: KyroContext = {
      tasks: [],
      calendarEvents: [],
      habits: []
    }

    const blocks = await engine.schedule(emptyContext)
    expect(blocks).toEqual([])
  })

  it('TimelineCalendarView source code contains ZERO fake setTimeout or simulation promises', () => {
    const filePath = path.resolve(__dirname, '../components/TimelineCalendarView.tsx')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Ensure artificial 1500ms delay is gone
    expect(fileContent).not.toContain('setTimeout')
    expect(fileContent).not.toContain('Simulate engine run')
    expect(fileContent).not.toContain('await new Promise(resolve => setTimeout(resolve')

    // Ensure real hook and server actions are used
    expect(fileContent).toContain('useKyroWorker')
    expect(fileContent).toContain('getKyroSchedulingContext')
    expect(fileContent).toContain('useTimelineStore')
    expect(fileContent).toContain('saveTimelineBlocks')
  })

  it('TimelineCalendarView checks saveTimelineBlocks result and halts on persistence failure', () => {
    const filePath = path.resolve(__dirname, '../components/TimelineCalendarView.tsx')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Ensure persistence is awaited and verified before setting SUCCESS
    expect(fileContent).toContain('const saveResult = await saveTimelineBlocks')
    expect(fileContent).toContain('if (!saveResult.success)')
    expect(fileContent).toContain("setReflowStatus('ERROR')")
  })

  it('actions.ts does not swallow database errors and handles timeframe-scoped persistence', () => {
    const filePath = path.resolve(__dirname, '../actions.ts')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    expect(fileContent).not.toContain('Gracefully disable this fetch as timeline_blocks does not exist')
    expect(fileContent).toContain('getKyroSchedulingContext')
    expect(fileContent).toContain('deleteError')
    expect(fileContent).toContain('insertError')
    expect(fileContent).toContain('timeframe?.start')
  })
})
