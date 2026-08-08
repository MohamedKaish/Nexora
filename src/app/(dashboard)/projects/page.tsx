import { getProjects } from '@/features/projects/actions'
import { ProjectList } from '@/features/projects/components/ProjectList'
import { CreateProjectDialog } from '@/features/projects/components/CreateProjectDialog'

export const metadata = {
  title: 'Projects - Nexora',
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Projects</h2>
          <p className="text-muted-foreground text-lg font-medium">Organize tasks and track overall progress.</p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateProjectDialog />
        </div>
      </div>
      
      <div className="mt-6 w-full">
        <ProjectList initialProjects={projects} />
      </div>
    </div>
  )
}
