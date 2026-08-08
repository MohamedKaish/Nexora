import { describe, it, expect, beforeEach } from 'vitest'
import { useFocusStore } from '../useFocusStore'

describe('useFocusStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFocusStore.setState({
      isActive: false,
      timeLeft: 25 * 60,
      mode: 'pomodoro',
      sessionsCompleted: 0,
      elapsedTime: 0,
      isFullScreen: false,
      history: []
    })
  })

  it('should initialize with default pomodoro values', () => {
    const state = useFocusStore.getState()
    expect(state.mode).toBe('pomodoro')
    expect(state.timeLeft).toBe(25 * 60)
    expect(state.isActive).toBe(false)
  })

  it('should toggle full screen mode', () => {
    const store = useFocusStore.getState()
    store.toggleFullScreen()
    expect(useFocusStore.getState().isFullScreen).toBe(true)
    
    useFocusStore.getState().toggleFullScreen()
    expect(useFocusStore.getState().isFullScreen).toBe(false)
  })

  it('should cycle session correctly (work -> short break)', () => {
    const store = useFocusStore.getState()
    
    // Simulate completing a pomodoro session
    store.completeSession()
    
    const state = useFocusStore.getState()
    expect(state.sessionsCompleted).toBe(1)
    expect(state.mode).toBe('short_break')
    expect(state.timeLeft).toBe(5 * 60)
    expect(state.history.length).toBe(1)
    expect(state.history[0].mode).toBe('pomodoro')
  })

  it('should cycle session correctly (short break -> work)', () => {
    useFocusStore.setState({ mode: 'short_break', sessionsCompleted: 1 })
    
    useFocusStore.getState().completeSession()
    
    const state = useFocusStore.getState()
    expect(state.mode).toBe('pomodoro')
    expect(state.timeLeft).toBe(25 * 60)
    expect(state.sessionsCompleted).toBe(1) // Break completion doesn't increment sessionsCompleted
  })

  it('should go to long break after 4 sessions', () => {
    useFocusStore.setState({ mode: 'pomodoro', sessionsCompleted: 3 })
    
    useFocusStore.getState().completeSession()
    
    const state = useFocusStore.getState()
    expect(state.sessionsCompleted).toBe(4)
    expect(state.mode).toBe('long_break')
    expect(state.timeLeft).toBe(15 * 60)
  })

  it('should skip break and go back to work', () => {
    useFocusStore.setState({ mode: 'short_break', sessionsCompleted: 1 })
    
    useFocusStore.getState().skipBreak()
    
    const state = useFocusStore.getState()
    expect(state.mode).toBe('pomodoro')
    expect(state.timeLeft).toBe(25 * 60)
    expect(state.isActive).toBe(true) // Should auto-start next session
  })
})
