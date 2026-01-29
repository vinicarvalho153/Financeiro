import { supabase, Salary, isSupabaseConfigured } from './supabase'

export async function getSalaries() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Retornando array vazio.')
    return []
  }

  const { data, error } = await supabase
    .from('salaries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar salários:', error)
    return []
  }

  return data as Salary[]
}

export async function createSalary(salary: Omit<Salary, 'id' | 'created_at' | 'updated_at'>) {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { data, error } = await supabase
    .from('salaries')
    .insert([salary])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar salário:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    throw new Error(`Erro ao criar receita: ${error?.message || 'Erro desconhecido'}`)
  }

  return data as Salary
}

export async function updateSalary(id: string, salary: Partial<Salary>) {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { data, error } = await supabase
    .from('salaries')
    .update({ ...salary, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar salário:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    throw new Error(`Erro ao atualizar receita: ${error?.message || 'Erro desconhecido'}`)
  }

  return data as Salary
}

export async function deleteSalary(id: string) {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { error } = await supabase
    .from('salaries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar salário:', error)
    throw error
  }
}
