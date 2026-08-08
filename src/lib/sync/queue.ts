import { useSyncQueueStore, SyncAction } from '@/store/syncQueueStore'
import { createClient } from '@/lib/supabase/client'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

export class SyncEngine {
  private isProcessing = false;
  private supabase = createClient();

  async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;
    const store = useSyncQueueStore.getState();
    const queue = store.queue.filter(a => a.status !== 'syncing');
    
    if (queue.length === 0) return;

    this.isProcessing = true;
    store.setSyncing(true);

    for (const action of queue) {
      store.updateActionStatus(action.id, 'syncing');
      
      try {
        await this.executeAction(action);
        store.dequeue(action.id);
      } catch (error) {
        console.error('Sync failed for action:', action.id, error);
        store.updateActionStatus(action.id, 'failed', true);
        
        if (action.retryCount >= MAX_RETRIES) {
          // Keep it in queue but perhaps notify user or flag as permanently failed
          console.warn('Max retries reached for action:', action.id);
        } else {
          // Exponential backoff delay (only delay subsequent processing slightly)
          const delay = BASE_DELAY_MS * Math.pow(2, action.retryCount);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }

    this.isProcessing = false;
    store.setSyncing(false);
    store.setLastSyncTime(new Date().toISOString());
  }

  private async executeAction(action: SyncAction) {
    // Map entities to Supabase tables
    const tableMap: Record<string, string> = {
      'TASK': 'tasks',
      'PROJECT': 'projects',
      'HABIT': 'habits',
      'SUBTASK': 'subtasks',
      'TIMETABLE_SLOT': 'timetable_slots'
    };
    
    const tableName = tableMap[action.entity];
    if (!tableName) throw new Error('Unknown entity');

    if (action.type === 'CREATE') {
      const { error } = await this.supabase.from(tableName).insert(action.payload);
      if (error) throw error;
    } else if (action.type === 'UPDATE') {
      const { error } = await this.supabase.from(tableName).update(action.payload).eq('id', action.payload.id);
      if (error) throw error;
    } else if (action.type === 'DELETE') {
      const { error } = await this.supabase.from(tableName).delete().eq('id', action.payload.id);
      if (error) throw error;
    }
  }

  public initAutoResume() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
      
      // Listen to Service Worker messages
      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FLUSH_QUEUE') {
          this.processQueue();
        }
      });
      
      // Attempt on startup
      this.processQueue();
    }
  }
}

export const syncEngine = new SyncEngine();
