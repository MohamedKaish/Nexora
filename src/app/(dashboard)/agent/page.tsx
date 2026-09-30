import { AgentInterface } from '@/features/agent/components/AgentInterface'

export const metadata = {
  title: 'Agent | Nexora',
  description: 'Controlled agentic productivity assistant with verifiable execution.'
}

const defaultMemory = {
  id: 'default',
  workDayStartHour: 9,
  workDayEndHour: 17,
  strictMode: false,
}

export default function AgentPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full p-6 md:p-8 max-w-5xl mx-auto">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AgentInterface initialMemory={defaultMemory as any} />
    </div>
  )
}
