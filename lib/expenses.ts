import { addMonths } from 'date-fns'
import { supabase, Expense, Installment, isSupabaseConfigured } from './supabase'

export interface ExpenseInput {
  name: string
  category: string
  amount: number
  type: 'fixo' | 'parcelado' | 'unico'
  paid_by?: 'person1' | 'person2' | 'vr' | 'conjunto'
  notes?: string
  total_installments?: number
  paid_installments?: number
  first_due_date?: string
  due_date?: string
}

export async function getExpenses(): Promise<Expense[]> {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Retornando array vazio para despesas.')
    return []
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*, installments(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar gastos:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    return []
  }

  console.log('✅ Despesas carregadas:', data?.length || 0, 'registros')
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
      due_date: input.type === 'unico' ? input.due_date ?? null : null,
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
    const paidCount = input.paid_installments || 0
    const now = new Date()

    for (let i = 0; i < input.total_installments; i++) {
      const dueDate = addMonths(new Date(input.first_due_date), i)
      const roundedAmount = Number(baseAmount.toFixed(2))
      const isPaid = i < paidCount
      
      installments.push({
        expense_id: expense.id,
        installment_number: i + 1,
        amount: roundedAmount,
        due_date: dueDate.toISOString(),
        status: isPaid ? 'paid' : 'pending',
        paid_at: isPaid ? now.toISOString() : null,
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

export async function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const updateData: any = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.category !== undefined) updateData.category = input.category
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.type !== undefined) {
    updateData.type = input.type
    updateData.is_recurring = input.type === 'fixo'
  }
  if (input.paid_by !== undefined) updateData.paid_by = input.paid_by
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.due_date !== undefined) updateData.due_date = input.due_date

  const { error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar gasto:', error)
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

export async function payMonthInstallments(expenseId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  // Primeiro, buscar todas as parcelas pendentes do gasto
  const { data: installments, error: fetchError } = await supabase
    .from('installments')
    .select('*')
    .eq('expense_id', expenseId)
    .eq('status', 'pending')

  if (fetchError) {
    console.error('Erro ao buscar parcelas:', fetchError)
    throw fetchError
  }

  if (!installments || installments.length === 0) {
    return
  }

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1)

  // Filtrar parcelas do mês atual
  const monthInstallments = installments.filter(inst => {
    const dueDate = new Date(inst.due_date)
    return dueDate >= startOfMonth && dueDate < startOfNextMonth
  })

  if (monthInstallments.length === 0) {
    return
  }

  // Atualizar todas as parcelas do mês
  const installmentIds = monthInstallments.map(inst => inst.id)
  const { error } = await supabase
    .from('installments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .in('id', installmentIds)

  if (error) {
    console.error('Erro ao pagar parcelas do mês:', error)
    throw error
  }
}

export async function finishExpense(expenseId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('⚠️ Supabase não configurado. Configure o arquivo .env.local com suas credenciais do Supabase.')
  }

  const { error } = await supabase
    .from('installments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('expense_id', expenseId)
    .eq('status', 'pending')

  if (error) {
    console.error('Erro ao finalizar gasto:', error)
    throw error
  }
}

