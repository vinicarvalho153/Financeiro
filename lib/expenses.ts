import { addMonths } from 'date-fns'
import { supabase, Expense, Installment, isSupabaseConfigured } from './supabase'

export interface ExpenseInput {
  name: string
  category: string
  amount: number
  type: 'fixo' | 'parcelado'
  paid_by?: 'person1' | 'person2' | 'vr' | 'conjunto'
  notes?: string
  total_installments?: number
  first_due_date?: string
}

export async function getExpenses(): Promise<Expense[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*, installments(*)')
    .order('created_at', { ascending: false })
    .order('installments', { ascending: true })

  if (error) {
    console.error('Erro ao buscar gastos:', error)
    return []
  }

  return data as Expense[]
}

export async function getInstallments(): Promise<Installment[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Erro ao buscar parcelas:', error)
    return []
  }

  return data as Installment[]
}

export async function createExpense(input: ExpenseInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert([{
      name: input.name,
      category: input.category,
      amount: input.amount,
      type: input.type,
      paid_by: input.paid_by || 'conjunto',
      is_recurring: input.type === 'fixo',
      total_installments: input.type === 'parcelado' ? input.total_installments ?? null : null,
      notes: input.notes ?? null,
      start_date: input.first_due_date ?? null,
    }])
    .select()
    .single()

  if (error || !expense) {
    console.error('Erro ao criar gasto:', error)
    throw error
  }

  if (input.type === 'parcelado') {
    if (!input.total_installments || !input.first_due_date) {
      throw new Error('Número de parcelas e data inicial são obrigatórios para gastos parcelados.')
    }

    const installments: Partial<Installment>[] = []
    const baseAmount = input.amount / input.total_installments

    for (let i = 0; i < input.total_installments; i++) {
      const dueDate = addMonths(new Date(input.first_due_date), i)
      const roundedAmount = Number(baseAmount.toFixed(2))
      installments.push({
        expense_id: expense.id,
        installment_number: i + 1,
        amount: roundedAmount,
        due_date: dueDate.toISOString(),
        status: 'pending',
      })
    }

    const { error: installmentsError } = await supabase
      .from('installments')
      .insert(installments)

    if (installmentsError) {
      console.error('Erro ao criar parcelas:', installmentsError)
      throw installmentsError
    }
  }
}

export async function deleteExpense(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar gasto:', error)
    throw error
  }
}

export async function updateInstallmentStatus(installmentId: string, status: 'pending' | 'paid'): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { error } = await supabase
    .from('installments')
    .update({
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', installmentId)

  if (error) {
    console.error('Erro ao atualizar parcela:', error)
    throw error
  }
}

