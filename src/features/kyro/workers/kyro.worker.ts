/// <reference lib="webworker" />

import { KyroEngine } from '../core/KyroEngine'
import { KyroContext } from '../types'

const engine = new KyroEngine()

addEventListener('message', async (e: MessageEvent<KyroContext>) => {
  try {
    const blocks = await engine.schedule(e.data)
    postMessage({ status: 'success', blocks })
  } catch (err) {
    postMessage({ status: 'error', error: err })
  }
})
