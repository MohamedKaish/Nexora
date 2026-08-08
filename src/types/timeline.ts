export type BlockType = 'task' | 'habit' | 'calendar' | 'kyro' | 'pinned_task' | 'break' | 'buffer'

export interface BaseBlock {
  id: string
  title: string
  type: BlockType
  startTime: Date | null
  endTime: Date | null
  isCompleted: boolean
  color?: string
  isFixed?: boolean
  sourceType?: 'kyro' | 'calendar_event' | 'manual'
}

export interface TaskBlock extends BaseBlock {
  type: 'task'
  projectId?: string
  priority: 'low' | 'medium' | 'high'
}

export interface HabitBlock extends BaseBlock {
  type: 'habit'
  habitId: string
  streak: number
}

export interface CalendarBlock extends BaseBlock {
  type: 'calendar'
  location?: string
  meetingLink?: string
}

export interface PinnedTaskBlock extends BaseBlock {
  type: 'pinned_task'
  taskId: string
}

export interface BreakBlock extends BaseBlock {
  type: 'break'
}

export interface BufferBlock extends BaseBlock {
  type: 'buffer'
}

export type TimelineBlock = TaskBlock | HabitBlock | CalendarBlock | PinnedTaskBlock | BreakBlock | BufferBlock
