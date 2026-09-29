import { getTasks } from '@/features/tasks/actions'
import { getProjects } from '@/features/projects/actions'
import { TaskList } from '@/features/tasks/components/TaskList'
import { CreateTaskDialog } from '@/features/tasks/components/CreateTaskDialog'
import { EisenhowerMatrix } from '@/features/tasks/components/EisenhowerMatrix'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'

export const metadata = {
  title: 'Tasks - Nexora',
}

import { getUser } from '@/lib/supabase/server'

async function TasksContent() {
  const { data: { user } } = await getUser()
  const [tasks, projects] = user ? await Promise.all([
    getTasks(),
    getProjects(),
  ]) : [[], []]

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8 -mt-20">
        <div className="space-y-2 invisible" aria-hidden="true">
          <h2 className="text-4xl font-black">Tasks</h2>
        </div>
        <div className="flex items-center space-x-2 z-10 relative">
          <CreateTaskDialog projects={projects} />
        </div>
      </div>

      <div className="mt-6 w-full">
        <Tabs defaultValue="list" className="space-y-8 w-full">
          <TabsList className="bg-secondary/40 border border-white/5 p-1 rounded-[14px]">
            <TabsTrigger
              value="list"
              className="rounded-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_2px_10px_rgba(99,102,241,0.3)] font-semibold transition-all duration-300"
            >
              List View
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="rounded-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_2px_10px_rgba(99,102,241,0.3)] font-semibold transition-all duration-300"
            >
              Eisenhower Matrix
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="space-y-4">
            <TaskList initialTasks={tasks} projects={projects} />
          </TabsContent>
          <TabsContent value="matrix" className="space-y-4 mt-6">
            <EisenhowerMatrix />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

export default function TasksPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8 pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Tasks</h2>
          <p className="text-muted-foreground text-lg font-medium">Manage and prioritize your daily work.</p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse h-[600px] bg-secondary/30 rounded-2xl w-full" />}>
        <TasksContent />
      </Suspense>
    </div>
  )
}
