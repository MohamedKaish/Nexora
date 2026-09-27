import { useEffect, useRef, useCallback } from 'react'
import { KyroContext } from '../types'
import { TimelineBlock } from '@/types/timeline'
import { KyroEngine } from '../core/KyroEngine'

export function useKyroWorker() {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(new URL('../workers/kyro.worker.ts', import.meta.url))
      } catch (err) {
        console.warn('[useKyroWorker] Worker initialization failed, will use fallback:', err)
        workerRef.current = null
      }
    }
    
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const schedule = useCallback((context: KyroContext, targetDate?: Date): Promise<TimelineBlock[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Resilient fallback: direct KyroEngine execution for SSR / vitest / unsupported browser environments
        try {
          const engine = new KyroEngine()
          engine.schedule(context, targetDate).then(resolve).catch(reject)
        } catch (err) {
          reject(err)
        }
        return
      }
      
      workerRef.current.onmessage = (e) => {
        if (e.data.status === 'success') {
          resolve(e.data.blocks)
        } else {
          const errObj = e.data.error
          reject(new Error(errObj?.message || 'Worker scheduling failed'))
        }
      }

      workerRef.current.onerror = (e) => {
        console.warn('[useKyroWorker] Worker runtime error, falling back to direct engine:', e)
        try {
          const engine = new KyroEngine()
          engine.schedule(context, targetDate).then(resolve).catch(reject)
        } catch (err) {
          reject(err)
        }
      }
      
      workerRef.current.postMessage({ context, targetDate: targetDate?.toISOString() })
    })
  }, [])

  return { schedule }
}
