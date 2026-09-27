import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    }))
  })),
  getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-1' } } }))
}))

import { ToolRegistry } from '../tools/ToolRegistry'

describe('Controlled ToolRegistry & Contract Validation', () => {
  const registry = new ToolRegistry()

  it('should register exactly 23 tools (10 read tools and 13 action tools)', () => {
    const allTools = registry.listTools()
    const readTools = registry.getReadTools()
    const actionTools = registry.getActionTools()

    expect(allTools.length).toBe(23)
    expect(readTools.length).toBe(10)
    expect(actionTools.length).toBe(13)
  })

  it('should include all 10 specified read tools with LEVEL_0_READ', () => {
    const expectedReadTools = [
      'get_tasks',
      'get_overdue_tasks',
      'get_projects',
      'get_goals',
      'get_habits',
      'get_focus_stats',
      'get_schedule',
      'get_notifications',
      'get_productivity_report',
      'get_kyro_recommendation'
    ]

    for (const toolName of expectedReadTools) {
      const tool = registry.getTool(toolName)
      expect(tool).toBeDefined()
      expect(tool?.isMutation).toBe(false)
      expect(tool?.riskLevel).toBe('LEVEL_0_READ')
    }
  })

  it('should include all 13 specified action tools with mutation flag', () => {
    const expectedActionTools = [
      'create_task',
      'update_task',
      'complete_task',
      'delete_task',
      'create_project',
      'update_project',
      'create_goal',
      'update_goal',
      'schedule_tasks',
      'move_deadline',
      'create_timetable_block',
      'update_timetable_block',
      'create_notification'
    ]

    for (const toolName of expectedActionTools) {
      const tool = registry.getTool(toolName)
      expect(tool).toBeDefined()
      expect(tool?.isMutation).toBe(true)
    }
  })

  it('should reject parameter validation when required arguments are missing', async () => {
    // create_task requires a non-empty title
    const tool = registry.getTool('create_task')
    expect(tool).toBeDefined()

    const parseMissingTitle = tool!.schema.safeParse({ title: '' })
    expect(parseMissingTitle.success).toBe(false)

    // create_timetable_block requires day_of_week between 0 and 6
    const timetableTool = registry.getTool('create_timetable_block')
    const parseBadDay = timetableTool!.schema.safeParse({
      day_of_week: 10, // Invalid!
      start_time: '09:00',
      end_time: '10:00',
      label: 'Class'
    })
    expect(parseBadDay.success).toBe(false)
  })
})
