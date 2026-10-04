'use client'

import React, { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useTaskStore } from '@/store/useTaskStore'
import { FolderKanban, Plus, Trash2, CheckCircle2 } from 'lucide-react'

export default function ProjectsPage() {
  const { projects, addProject, removeProject } = useProjectStore()
  const tasks = useTaskStore((s) => s.tasks)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedColor, setSelectedColor] = useState('#6366F1')

  const projectColors = ['#6366F1', '#A78BFA', '#34D399', '#60A5FA', '#FBBF24', '#FB7185']

  const handleAdd = () => {
    if (!newName.trim()) return
    addProject({
      name: newName.trim(),
      description: newDesc.trim() || null,
      color: selectedColor,
    })
    setNewName('')
    setNewDesc('')
    setShowAddModal(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Project Workspaces</h1>
          <p className="text-stone-400 text-sm">Organize complex endeavors into dedicated environments.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id)
          const completedTasks = projectTasks.filter((t) => t.status === 'done')
          const progress = projectTasks.length > 0
            ? Math.round((completedTasks.length / projectTasks.length) * 100)
            : 0

          return (
            <div
              key={project.id}
              className="world-deck p-5 flex flex-col justify-between space-y-4 hover:border-amber-400/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <button
                    onClick={() => removeProject(project.id)}
                    className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-foreground mt-2">{project.name}</h3>
                {project.description && (
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Progress Bar & Task Counts */}
              <div className="space-y-2 pt-2 border-t border-stone-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">
                    {completedTasks.length}/{projectTasks.length} tasks
                  </span>
                  <span className="font-bold text-amber-400">{progress}%</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {projects.length === 0 && (
          <div className="md:col-span-3 p-12 text-center world-deck border-dashed border-stone-800">
            <FolderKanban className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No projects created yet</h3>
            <p className="text-xs text-stone-400 mt-1">Group your tasks into purposeful project spaces.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-foreground">Create Project Workspace</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Mobile App, Biology Exam..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Description (optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Goals and scope for this workspace..."
                  rows={2}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2">Theme Color</label>
                <div className="flex gap-2">
                  {projectColors.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setSelectedColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        selectedColor === hex ? 'border-amber-400 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
