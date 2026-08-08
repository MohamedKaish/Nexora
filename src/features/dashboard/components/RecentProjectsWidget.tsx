import { getProjects } from '@/features/projects/actions'
import { FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export async function RecentProjectsWidget() {
  const projects = await getProjects()

  return (
    <div className="col-span-3 rounded-[20px] glass-card p-7 flex flex-col h-full border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Recent Projects</h3>
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors">View all</Link>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <p className="text-muted-foreground">No active projects.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project: { id: string; name: string; description: string | null; color: string; status: string; tasks?: { status: string }[] }) => (
              <div key={project.id} className="flex items-center space-x-4 p-3.5 rounded-[14px] border border-transparent hover:border-white/10 hover:bg-secondary/40 transition-all duration-300 cursor-pointer group">
                <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden" style={{ backgroundColor: `${project.color}15` }}>
                  <div className="w-1.5 h-full absolute left-0 top-0 transition-transform duration-300 group-hover:scale-y-110" style={{ backgroundColor: project.color }} />
                  <FolderKanban className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform duration-300" style={{ color: project.color }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-medium">{project.description || 'No description'}</p>
                  {project.tasks && (
                    <div className="flex items-center gap-2 mt-2 w-full max-w-[160px]">
                      <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${project.tasks.length > 0 ? Math.round((project.tasks.filter((t: { status: string }) => t.status === 'done').length / project.tasks.length) * 100) : 0}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                        {project.tasks.length > 0 ? Math.round((project.tasks.filter((t: { status: string }) => t.status === 'done').length / project.tasks.length) * 100) : 0}%
                      </span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-secondary/30 border-white/5 text-muted-foreground">{project.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
