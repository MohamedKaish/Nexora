import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentInterface } from '@/features/agent/components/AgentInterface'
import { getAgentMemoryPreferences } from '@/features/agent/actions'

export const metadata = {
  title: 'Agent | Nexora',
  description: 'Controlled agentic productivity assistant with verifiable execution.'
}

export default async function AgentPage() {
  const { data: { user } } = await getUser()

  if (!user) {
    redirect('/login')
  }

  const memory = await getAgentMemoryPreferences()

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <AgentInterface initialMemory={memory} />
    </div>
  )
}
