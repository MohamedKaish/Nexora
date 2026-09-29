'use client'

import { useEffect, useState } from 'react'
import { useProjectStore, Project } from '@/store/useProjectStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Trash2, Search, FolderKanban, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EditProjectDialog } from './EditProjectDialog'
import { toast } from 'sonner'

import { useWorkspace } from '@/hooks/useWorkspace'

export function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const { projects, setProjects, isLoading } = useProjectStore()
  const { deleteProject } = useWorkspace()
  const [search, setSearch] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only set if we haven't loaded local data or if it's the first render
    if (initialProjects && initialProjects.length > 0) {
      setProjects(initialProjects)
    }
  }, [initialProjects, setProjects])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse h-44 bg-secondary/30 border-border/50 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-[24px] bg-secondary/20 shadow-inner">
        <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-sm">
          <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">No projects yet</h3>
        <p className="mt-2 text-[14px] font-medium text-muted-foreground max-w-sm text-center">
          Get started by creating a new project to organize your tasks.
        </p>
      </div>
    )
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await deleteProject(id)
      toast.success('Project and associated tasks deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete project')
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10 h-11 bg-card/50 border-border/80 focus:border-primary transition-colors rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-[20px] bg-card/30 backdrop-blur-sm">
            <p className="text-muted-foreground font-medium">No projects match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="cursor-pointer block"
              >
                <Card
                  className="glass-card border-white/5 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 h-full border-l-[6px] relative group rounded-[20px] overflow-hidden"
                  style={{ borderLeftColor: project.color }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500"
                    style={{ backgroundImage: `linear-gradient(to bottom right, transparent, ${project.color})` }}
                  />
                  <CardHeader className="pb-3 relative z-10 pl-6">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight pr-14">
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                        className="uppercase tracking-wider text-[10px] font-bold shadow-sm"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2 min-h-[40px] text-[13px] font-medium text-muted-foreground/90 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </CardDescription>

                    {/* Progress Bar & Stats */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">
                          {(() => {
                            const tasks = project.tasks || []
                            if (tasks.length === 0) return '0%'
                            const completed = tasks.filter((t) => t.status === 'done').length
                            return Math.round((completed / tasks.length) * 100) + '%'
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: (() => {
                              const tasks = project.tasks || []
                              if (tasks.length === 0) return '0%'
                              const completed = tasks.filter((t) => t.status === 'done').length
                              return Math.round((completed / tasks.length) * 100) + '%'
                            })(),
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2">
                        <span>{project.tasks?.filter((t) => t.status !== 'done').length || 0} remaining</span>
                        <span>
                          {project.tasks?.filter(
                            (t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()
                          ).length || 0}{' '}
                          overdue
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-0 pl-6 pb-5">
                    <div className="text-[11px] text-muted-foreground/80 flex justify-between items-center font-bold tracking-wide uppercase mt-4">
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-border" />
                        Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                      </span>

                      <div className="flex items-center space-x-1 absolute top-4 right-4 z-20">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProject(project)
                            setIsEditDialogOpen(true)
                          }}
                          title="Edit Project"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger
                            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-brand-rose hover:bg-brand-rose/10"
                            onClick={(e) => e.stopPropagation()}
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()} className="border-border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.4)] sm:rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Are you sure you want to delete this project? This will also archive all associated tasks.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary/50 border-border hover:bg-secondary hover:text-foreground">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => handleDelete(e as unknown as React.MouseEvent, project.id)}
                                className="bg-brand-rose hover:bg-brand-rose/90 text-white border-transparent"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditProjectDialog
        project={editingProject}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  )
}
