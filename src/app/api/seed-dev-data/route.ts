import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development mode' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)
  const origin = url.origin

  if (!user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Check if data already exists to make it idempotent
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('id')
    .limit(1)

  if (existingProjects && existingProjects.length > 0) {
    // Data already exists, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // SEED PROJECTS
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .insert([
      { user_id: user.id, name: 'Nexora', description: 'Productivity OS', color: '#3b82f6', status: 'active' },
      { user_id: user.id, name: 'TruthLens AI', description: 'AI detector', color: '#8b5cf6', status: 'active' },
      { user_id: user.id, name: 'College Semester', description: 'Fall 2026 courses', color: '#10b981', status: 'active' },
      { user_id: user.id, name: 'Hackathon', description: 'Weekend build', color: '#f59e0b', status: 'active' },
    ])
    .select()

  if (projectsError || !projects) {
    console.error('Failed to seed projects', projectsError)
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  const nexoraId = projects.find(p => p.name === 'Nexora')?.id
  const collegeId = projects.find(p => p.name === 'College Semester')?.id
  const hackathonId = projects.find(p => p.name === 'Hackathon')?.id

  // SEED TASKS
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  
  await supabase.from('tasks').insert([
    { user_id: user.id, project_id: nexoraId, title: 'Finish Dashboard', priority: 'high', status: 'todo', is_schedule_for_today: true, due_date: today },
    { user_id: user.id, project_id: hackathonId, title: 'Push Repository', priority: 'urgent', status: 'in_progress', is_schedule_for_today: true, due_date: today },
    { user_id: user.id, project_id: hackathonId, title: 'Prepare Presentation', priority: 'high', status: 'todo', is_schedule_for_today: true, due_date: tomorrow },
    { user_id: user.id, project_id: collegeId, title: 'Study for Internal Exam', priority: 'medium', status: 'todo', is_schedule_for_today: false, due_date: tomorrow },
    { user_id: user.id, project_id: nexoraId, title: 'Complete UI Review', priority: 'medium', status: 'done', is_schedule_for_today: true },
  ])

  // SEED HABITS
  await supabase.from('habits').insert([
    { user_id: user.id, name: 'Exercise', frequency: 'daily', color: '#ef4444', streak: 12 },
    { user_id: user.id, name: 'Read', frequency: 'daily', color: '#3b82f6', streak: 5 },
    { user_id: user.id, name: 'LeetCode', frequency: 'weekdays', color: '#f59e0b', streak: 2 },
    { user_id: user.id, name: 'Revision', frequency: 'weekly', color: '#8b5cf6', streak: 4 },
    { user_id: user.id, name: 'Wake Early', frequency: 'daily', color: '#10b981', streak: 15 },
  ])

  // SEED CALENDAR EVENTS
  await supabase.from('calendar_events').insert([
    { user_id: user.id, title: 'Hackathon Deadline', start_time: `${tomorrow}T00:00:00Z`, end_time: `${tomorrow}T23:59:59Z`, is_all_day: true },
    { user_id: user.id, title: 'Assignment Submission', start_time: `${tomorrow}T14:00:00Z`, end_time: `${tomorrow}T15:00:00Z`, is_all_day: false },
    { user_id: user.id, title: 'Internal Exam', start_time: `${new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}T09:00:00Z`, end_time: `${new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}T12:00:00Z`, is_all_day: false },
    { user_id: user.id, title: 'Team Meeting', start_time: `${today}T16:00:00Z`, end_time: `${today}T17:00:00Z`, is_all_day: false },
  ])

  // SEED TIMETABLE SLOTS
  await supabase.from('timetable_slots').insert([
    { user_id: user.id, day_of_week: 1, start_time: '08:00', end_time: '10:00', label: 'Deep Work', color: '#3b82f6' },
    { user_id: user.id, day_of_week: 1, start_time: '10:30', end_time: '12:00', label: 'Meetings', color: '#8b5cf6' },
    { user_id: user.id, day_of_week: 1, start_time: '13:00', end_time: '17:00', label: 'Coding', color: '#10b981' },
    { user_id: user.id, day_of_week: 1, start_time: '18:00', end_time: '19:30', label: 'Gym', color: '#ef4444' },
    { user_id: user.id, day_of_week: 2, start_time: '08:00', end_time: '10:00', label: 'Deep Work', color: '#3b82f6' },
    { user_id: user.id, day_of_week: 3, start_time: '08:00', end_time: '10:00', label: 'Deep Work', color: '#3b82f6' },
    { user_id: user.id, day_of_week: 4, start_time: '08:00', end_time: '10:00', label: 'Deep Work', color: '#3b82f6' },
    { user_id: user.id, day_of_week: 5, start_time: '08:00', end_time: '10:00', label: 'Deep Work', color: '#3b82f6' },
  ])

  return NextResponse.redirect(new URL('/dashboard', origin))
}
