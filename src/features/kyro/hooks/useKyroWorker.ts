import { useEffect, useRef, useCallback } from 'react'
import { KyroContext } from '../types'
import { TimelineBlock } from '@/types/timeline'

export function useKyroWorker() {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/kyro.worker.ts', import.meta.url))
    
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const schedule = useCallback((context: KyroContext): Promise<TimelineBlock[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) return reject(new Error('Worker not initialized'))
      
      workerRef.current.onmessage = (e) => {
        if (e.data.status === 'success') {
          resolve(e.data.blocks)
        } else {
          reject(e.data.error)
        }
      }
      
      workerRef.current.postMessage(context)
    })
  }, [])

  return { schedule }
}
