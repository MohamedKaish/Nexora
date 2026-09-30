import { useState, useCallback, useEffect } from 'react'
import { useCompanionStore } from '@/store/companionStore'

const CHIEF_DIALOGUES = [
  "Welcome back, Chief! What are we building today?",
  "System optimal, Chief. Ready when you are.",
  "Chief, you have tasks pending in the dashboard.",
  "Don't forget to take a break, Chief!",
  "I've got my eyes on the timeline, Chief.",
  "All systems green, Chief."
]

const CHEER_DIALOGUES = [
  "Incredible work, Chief!",
  "Task complete! You're on fire, Chief!",
  "Well done, Chief! Keep the momentum."
]

export function useCompanionDialogue() {
  const [currentDialogue, setCurrentDialogue] = useState<string | null>(null)
  const setMood = useCompanionStore(s => s.setMood)

  const speak = useCallback((text: string, duration = 4000) => {
    setCurrentDialogue(text)
    // Basic text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.pitch = 1.2 // slightly higher pitched/energetic
      utterance.rate = 1.1
      window.speechSynthesis.cancel() // clear queue
      window.speechSynthesis.speak(utterance)
    }

    setTimeout(() => {
      setCurrentDialogue(null)
      setMood('idle')
    }, duration)
  }, [setMood])

  const greet = useCallback(() => {
    setMood('happy')
    speak(CHIEF_DIALOGUES[Math.floor(Math.random() * CHIEF_DIALOGUES.length)])
  }, [setMood, speak])

  const cheer = useCallback(() => {
    setMood('celebrating')
    speak(CHEER_DIALOGUES[Math.floor(Math.random() * CHEER_DIALOGUES.length)])
  }, [setMood, speak])

  const promptBreak = useCallback(() => {
    setMood('focused')
    speak("Chief, it looks like you've been working hard. Maybe a short break?")
  }, [setMood, speak])

  return {
    currentDialogue,
    speak,
    greet,
    cheer,
    promptBreak
  }
}
