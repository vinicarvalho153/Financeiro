import { supabase, MonthlyProjection, isSupabaseConfigured } from './supabase'

export async function getMonthlyProjections(): Promise<MonthlyProjection[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('projection_monthly')
    .select('*')
    .order('year', { ascending: true })
    .order('month', { ascending: true })

  if (error) {
    console.error('Erro ao buscar projeções mensais:', error)
    return []
  }

  return data as MonthlyProjection[]
}

export async function getMonthlyProjection(year: number, month: number): Promise<MonthlyProjection | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('projection_monthly')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado
      return null
    }
    console.error('Erro ao buscar projeção mensal:', error)
    return null
  }

  return data as MonthlyProjection
}

export async function upsertMonthlyProjection(projection: Omit<MonthlyProjection, 'id' | 'created_at' | 'updated_at'>): Promise<MonthlyProjection> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { data, error } = await supabase
    .from('projection_monthly')
    .upsert({
      year: projection.year,
      month: projection.month,
      conjunto: projection.conjunto,
      expenses: projection.expenses,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'year,month'
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar projeção mensal:', error)
    throw error
  }

  return data as MonthlyProjection
}

export async function deleteMonthlyProjection(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { error } = await supabase
    .from('projection_monthly')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar projeção mensal:', error)
    throw error
  }
}

