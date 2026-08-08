import { getProjects } from '@/features/projects/actions'
import { getTasks } from '@/features/tasks/actions'
import { TaskList } from '@/features/tasks/components/TaskList'
import { CreateTaskDialog } from '@/features/tasks/components/CreateTaskDialog'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projects = await getProjects()
  const project = projects.find((p: { id: string }) => p.id === id)
  return { title: project ? `${project.name} - Nexora` : 'Project Not Found' }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projects = await getProjects()
  const project = projects.find((p: { id: string; name: string; description: string | null; color: string; status: string }) => p.id === id)
  
  if (!project) notFound()

  const tasks = await getTasks(project.id)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          <Badge variant="secondary" className="capitalize">{project.status}</Badge>
        </div>
        
        {project.description && (
          <p className="text-gray-600 max-w-3xl">{project.description}</p>
        )}
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Tasks</h3>
          <CreateTaskDialog projects={[project]} />
        </div>
        
        <div className="max-w-4xl">
          <TaskList initialTasks={tasks} />
        </div>
      </div>
    </div>
  )
}
