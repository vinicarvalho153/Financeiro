import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Fornecer valores placeholder se não configurado (para evitar erro)
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas! Configure o arquivo .env.local')
}

export const supabase: SupabaseClient = createClient(url, key)

// Verificar se está configurado corretamente
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export interface Salary {
  id?: string
  person: 'person1' | 'person2' | 'conjunto' | 'vr'
  name: string
  value: number
  created_at?: string
  updated_at?: string
}

export interface MonthlyProjection {
  month: string
  total: number
  person1: number
  person2: number
  conjunto: number
  vr: number
}

export interface SiteConfig {
  id?: string
  key: string
  value: string
  label: string
  category: string
  type: 'text' | 'number' | 'textarea'
  created_at?: string
  updated_at?: string
}

export interface Expense {
  id?: string
  name: string
  category: string
  amount: number
  type: 'fixo' | 'parcelado'
  paid_by?: 'person1' | 'person2' | 'vr' | 'conjunto'
  is_recurring: boolean
  total_installments?: number | null
  notes?: string | null
  start_date?: string | null
  created_at?: string
  updated_at?: string
  installments?: Installment[]
}

export interface Installment {
  id?: string
  expense_id: string
  installment_number: number
  amount: number
  due_date: string
  status: 'pending' | 'paid'
  paid_at?: string | null
  created_at?: string
  updated_at?: string
  expense?: Expense
}

export interface MonthlyProjection {
  id?: string
  year: number
  month: number
  total: number
  expenses: number
  created_at?: string
  updated_at?: string
}
