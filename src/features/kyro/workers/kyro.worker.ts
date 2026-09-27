/// <reference lib="webworker" />

import { KyroEngine } from '../core/KyroEngine'
import { KyroContext } from '../types'

const engine = new KyroEngine()

addEventListener('message', async (e: MessageEvent<KyroContext | { context: KyroContext; targetDate?: string | Date }>) => {
  try {
    const data = e.data
    const context = data && 'context' in data ? (data as { context: KyroContext }).context : (data as KyroContext)
    const targetDate = data && 'targetDate' in data && (data as { targetDate?: string | Date }).targetDate
      ? new Date((data as { targetDate: string | Date }).targetDate!)
      : undefined

    const blocks = await engine.schedule(context, targetDate)
    postMessage({ status: 'success', blocks })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    postMessage({ status: 'error', error: { message } })
  }
})
