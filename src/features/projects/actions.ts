'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProjects() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw new Error(error.message);
  }
  return (data || []) as unknown as { id: string; user_id: string; category_id: string | null; name: string; description: string | null; color: string; status: 'active' | 'archived' | 'completed'; due_date: string | null; created_at: string; updated_at: string; deleted_at: string | null; tasks?: { id: string; status: string; due_date: string | null; updated_at: string; deleted_at: string | null }[] }[]
}

export async function createProject(input: { name: string, description?: string, color?: string, due_date?: string, status?: 'active' | 'archived' | 'completed' }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...input,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return data
}

export async function updateProject(id: string, input: { name?: string, description?: string, color?: string, status?: 'active' | 'archived' | 'completed', due_date?: string }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .update(input)
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
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return { success: true }
}
