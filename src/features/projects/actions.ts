'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { projectSchema, updateProjectSchema, ProjectInput } from '@/lib/validations/projects'

export async function getProjects() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as unknown as {
    id: string
    user_id: string
    category_id: string | null
    name: string
    description: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
    due_date: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    tasks?: { id: string; status: string; due_date: string | null; updated_at: string; deleted_at: string | null }[]
  }[]
}

export async function getProjectById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as {
    id: string
    user_id: string
    name: string
    description: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
    due_date: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
    tasks?: { id: string; status: string; due_date: string | null; updated_at: string; deleted_at: string | null }[]
  }
}

export async function createProject(input: ProjectInput) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  // Resource limit: max 50 active projects per user
  const { count, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (countError) throw new Error(countError.message)
  if (count !== null && count >= 50) {
    throw new Error('You have reached the maximum limit of 50 active projects. Please delete some projects before creating new ones.')
  }

  const validated = projectSchema.parse(input)

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...validated,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return {
    ...data,
    tasks: [],
  }
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = updateProjectSchema.parse(input)
  const fieldsToUpdate = Object.entries(parsed).reduce((acc, [key, val]) => {
    if (val !== undefined) acc[key] = val
    return acc
  }, {} as Record<string, unknown>)

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...fieldsToUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return data
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const now = new Date().toISOString()

  // 1. Soft-delete project
  const { error: projError } = await supabase
    .from('projects')
    .update({ deleted_at: now })
    .eq('id', id)
    .eq('user_id', user.id)

  if (projError) throw new Error(projError.message)

  // 2. Cascade soft-delete to associated tasks
  await supabase
    .from('tasks')
    .update({ deleted_at: now })
    .eq('project_id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  revalidatePath('/', 'layout')
  return { success: true }
}
