import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config'

describe('NEXORA REAL MULTI-USER ISOLATION & RLS VERIFICATION', () => {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  let userAClient: SupabaseClient<Database>
  let userBClient: SupabaseClient<Database>
  let userAId: string
  let userBId: string

  const createdByUserA: { tasks: string[]; projects: string[]; goals: string[]; habits: string[] } = {
    tasks: [],
    projects: [],
    goals: [],
    habits: [],
  }

  const createdByUserB: { tasks: string[]; projects: string[]; goals: string[]; habits: string[] } = {
    tasks: [],
    projects: [],
    goals: [],
    habits: [],
  }

  beforeAll(async () => {
    // 1. Establish User A session
    const clientAAnon = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
    let authARes = await clientAAnon.auth.signInAnonymously()
    if (authARes.error) {
      await new Promise(r => setTimeout(r, 1000))
      authARes = await clientAAnon.auth.signInAnonymously()
    }
    expect(authARes.error).toBeNull()
    expect(authARes.data.session).toBeDefined()
    userAId = authARes.data.user!.id
    userAClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${authARes.data.session!.access_token}` } },
    })

    // 2. Establish User B session
    const clientBAnon = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
    let authBRes = await clientBAnon.auth.signInAnonymously()
    if (authBRes.error) {
      await new Promise(r => setTimeout(r, 1000))
      authBRes = await clientBAnon.auth.signInAnonymously()
    }
    expect(authBRes.error).toBeNull()
    expect(authBRes.data.session).toBeDefined()
    userBId = authBRes.data.user!.id
    userBClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${authBRes.data.session!.access_token}` } },
    })

    expect(userAId).not.toBe(userBId)
  }, 45000)

  afterAll(async () => {
    // Cleanup User A resources
    for (const id of createdByUserA.tasks) await userAClient.from('tasks').delete().eq('id', id)
    for (const id of createdByUserA.projects) await userAClient.from('projects').delete().eq('id', id)
    for (const id of createdByUserA.goals) await userAClient.from('goals').delete().eq('id', id)
    for (const id of createdByUserA.habits) {
      await userAClient.from('habit_completions').delete().eq('habit_id', id)
      await userAClient.from('habits').delete().eq('id', id)
    }

    // Cleanup User B resources
    for (const id of createdByUserB.tasks) await userBClient.from('tasks').delete().eq('id', id)
    for (const id of createdByUserB.projects) await userBClient.from('projects').delete().eq('id', id)
    for (const id of createdByUserB.goals) await userBClient.from('goals').delete().eq('id', id)
    for (const id of createdByUserB.habits) {
      await userBClient.from('habit_completions').delete().eq('habit_id', id)
      await userBClient.from('habits').delete().eq('id', id)
    }
  }, 45000)

  it('Step 1: User A creates Task A, Project A, Goal A, Habit A', async () => {
    const { data: taskA, error: taskErr } = await userAClient
      .from('tasks')
      .insert({ title: '[TEST-ISO] Task A', priority: 'high', user_id: userAId })
      .select('id')
      .single()
    expect(taskErr).toBeNull()
    expect(taskA?.id).toBeDefined()
    createdByUserA.tasks.push(taskA!.id)

    const { data: projA, error: projErr } = await userAClient
      .from('projects')
      .insert({ name: '[TEST-ISO] Project A', color: '#6366f1', status: 'active', user_id: userAId })
      .select('id')
      .single()
    expect(projErr).toBeNull()
    expect(projA?.id).toBeDefined()
    createdByUserA.projects.push(projA!.id)

    const { data: goalA, error: goalErr } = await userAClient
      .from('goals')
      .insert({
        title: '[TEST-ISO] Goal A',
        type: 'monthly',
        status: 'active',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        user_id: userAId,
      })
      .select('id')
      .single()
    expect(goalErr).toBeNull()
    expect(goalA?.id).toBeDefined()
    createdByUserA.goals.push(goalA!.id)

    const { data: habitA, error: habitErr } = await userAClient
      .from('habits')
      .insert({ name: '[TEST-ISO] Habit A', frequency: 'daily', color: '#10b981', streak: 0, user_id: userAId })
      .select('id')
      .single()
    expect(habitErr).toBeNull()
    expect(habitA?.id).toBeDefined()
    createdByUserA.habits.push(habitA!.id)
  })

  it('Step 2: User B creates Task B, Project B, Goal B, Habit B', async () => {
    const { data: taskB, error: taskErr } = await userBClient
      .from('tasks')
      .insert({ title: '[TEST-ISO] Task B', priority: 'medium', user_id: userBId })
      .select('id')
      .single()
    expect(taskErr).toBeNull()
    expect(taskB?.id).toBeDefined()
    createdByUserB.tasks.push(taskB!.id)

    const { data: projB, error: projErr } = await userBClient
      .from('projects')
      .insert({ name: '[TEST-ISO] Project B', color: '#ec4899', status: 'active', user_id: userBId })
      .select('id')
      .single()
    expect(projErr).toBeNull()
    expect(projB?.id).toBeDefined()
    createdByUserB.projects.push(projB!.id)

    const { data: goalB, error: goalErr } = await userBClient
      .from('goals')
      .insert({
        title: '[TEST-ISO] Goal B',
        type: 'weekly',
        status: 'active',
        period_start: '2026-09-28',
        period_end: '2026-10-04',
        user_id: userBId,
      })
      .select('id')
      .single()
    expect(goalErr).toBeNull()
    expect(goalB?.id).toBeDefined()
    createdByUserB.goals.push(goalB!.id)

    const { data: habitB, error: habitErr } = await userBClient
      .from('habits')
      .insert({ name: '[TEST-ISO] Habit B', frequency: 'weekly', color: '#f59e0b', streak: 0, user_id: userBId })
      .select('id')
      .single()
    expect(habitErr).toBeNull()
    expect(habitB?.id).toBeDefined()
    createdByUserB.habits.push(habitB!.id)
  })

  it('Step 3: User A can read Task A, Project A, Goal A, Habit A', async () => {
    const { data: tasks } = await userAClient.from('tasks').select('id').eq('id', createdByUserA.tasks[0])
    expect(tasks?.length).toBe(1)

    const { data: projs } = await userAClient.from('projects').select('id').eq('id', createdByUserA.projects[0])
    expect(projs?.length).toBe(1)

    const { data: goals } = await userAClient.from('goals').select('id').eq('id', createdByUserA.goals[0])
    expect(goals?.length).toBe(1)

    const { data: habits } = await userAClient.from('habits').select('id').eq('id', createdByUserA.habits[0])
    expect(habits?.length).toBe(1)
  })

  it('Step 4: User A CANNOT read User B data', async () => {
    const { data: tasks } = await userAClient.from('tasks').select('id').eq('id', createdByUserB.tasks[0])
    expect(tasks?.length).toBe(0)

    const { data: projs } = await userAClient.from('projects').select('id').eq('id', createdByUserB.projects[0])
    expect(projs?.length).toBe(0)

    const { data: goals } = await userAClient.from('goals').select('id').eq('id', createdByUserB.goals[0])
    expect(goals?.length).toBe(0)

    const { data: habits } = await userAClient.from('habits').select('id').eq('id', createdByUserB.habits[0])
    expect(habits?.length).toBe(0)
  })

  it('Step 5: User B can read Task B, Project B, Goal B, Habit B', async () => {
    const { data: tasks } = await userBClient.from('tasks').select('id').eq('id', createdByUserB.tasks[0])
    expect(tasks?.length).toBe(1)

    const { data: projs } = await userBClient.from('projects').select('id').eq('id', createdByUserB.projects[0])
    expect(projs?.length).toBe(1)

    const { data: goals } = await userBClient.from('goals').select('id').eq('id', createdByUserB.goals[0])
    expect(goals?.length).toBe(1)

    const { data: habits } = await userBClient.from('habits').select('id').eq('id', createdByUserB.habits[0])
    expect(habits?.length).toBe(1)
  })

  it('Step 6: User B CANNOT read User A data', async () => {
    const { data: tasks } = await userBClient.from('tasks').select('id').eq('id', createdByUserA.tasks[0])
    expect(tasks?.length).toBe(0)

    const { data: projs } = await userBClient.from('projects').select('id').eq('id', createdByUserA.projects[0])
    expect(projs?.length).toBe(0)

    const { data: goals } = await userBClient.from('goals').select('id').eq('id', createdByUserA.goals[0])
    expect(goals?.length).toBe(0)

    const { data: habits } = await userBClient.from('habits').select('id').eq('id', createdByUserA.habits[0])
    expect(habits?.length).toBe(0)
  })

  it('Step 7: User A CANNOT insert data spoofing User B user_id (RLS check violation)', async () => {
    const { data, error } = await userAClient
      .from('tasks')
      .insert({ title: 'Malicious Spoofed Task', priority: 'high', user_id: userBId })
      .select('id')

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('Step 8: User A CANNOT update User B data', async () => {
    const { data } = await userAClient
      .from('tasks')
      .update({ title: 'Hacked by User A' })
      .eq('id', createdByUserB.tasks[0])
      .select('id')

    // RLS filters out the row; zero rows updated
    expect(data?.length || 0).toBe(0)

    // Verify User B task was NOT modified
    const { data: verifyB } = await userBClient
      .from('tasks')
      .select('title')
      .eq('id', createdByUserB.tasks[0])
      .single()
    expect(verifyB?.title).toBe('[TEST-ISO] Task B')
  })

  it('Step 9: User A CANNOT delete User B data', async () => {
    const { data } = await userAClient
      .from('tasks')
      .delete()
      .eq('id', createdByUserB.tasks[0])
      .select('id')

    // RLS filters out the row; zero rows deleted
    expect(data?.length || 0).toBe(0)

    // Verify User B task still exists
    const { data: verifyB } = await userBClient
      .from('tasks')
      .select('id')
      .eq('id', createdByUserB.tasks[0])
      .single()
    expect(verifyB?.id).toBe(createdByUserB.tasks[0])
  })
})
