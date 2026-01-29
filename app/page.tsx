'use client'

import { useState, useEffect } from 'react'
import { Salary, Expense, Installment, isSupabaseConfigured } from '@/lib/supabase'
import { getSalaries, createSalary, updateSalary, deleteSalary } from '@/lib/database'
import { getExpenses, createExpense, deleteExpense, ExpenseInput } from '@/lib/expenses'
import { Plus, TrendingUp, Wallet, DollarSign, Calendar, ArrowUp, ArrowDown, X, Settings } from 'lucide-react'
import { useConfig } from '@/contexts/ConfigContext'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ConfigEditor from '@/components/ConfigEditor'

// Componente de Card Minimalista
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  )
}

// Componente de Botão Minimalista
function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  icon: Icon,
  type = 'button'
}: { 
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
  icon?: any
  type?: 'button' | 'submit'
}) {
  const variants = {
    primary: 'bg-gray-900 hover:bg-gray-800 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

// Formulário Simplificado de Salário
function SalaryFormSimple({ 
  salary, 
  onSubmit, 
  onCancel 
}: { 
  salary?: Salary | null
  onSubmit: (data: Omit<Salary, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}) {
  const { getConfigValue } = useConfig()
  const [formData, setFormData] = useState({
    person: 'conjunto' as 'person1' | 'person2' | 'conjunto' | 'vr',
    name: '',
    value: 0
  })

  useEffect(() => {
    if (salary) {
      setFormData({
        person: salary.person,
        name: salary.name,
        value: salary.value
      })
    }
  }, [salary])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {salary ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo</label>
            <select
              value={formData.person}
              onChange={(e) => setFormData({ ...formData, person: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="conjunto">{getConfigValue('conjunto_label') || 'Conjunto'}</option>
              <option value="person1">{getConfigValue('person1_name') || 'Pessoa 1'}</option>
              <option value="person2">{getConfigValue('person2_name') || 'Pessoa 2'}</option>
              <option value="vr">{getConfigValue('vr_label') || 'VR'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Ex: Salário, Freelance..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" className="flex-1">
            {salary ? 'Atualizar' : 'Adicionar'}
          </Button>
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}

// Formulário Simplificado de Despesa
function ExpenseFormSimple({ 
  expense, 
  onSubmit, 
  onCancel 
}: { 
  expense?: Expense | null
  onSubmit: (data: ExpenseInput) => void
  onCancel: () => void
}) {
  const { getConfigValue } = useConfig()
  const [formData, setFormData] = useState({
    type: 'fixo' as 'fixo' | 'parcelado' | 'unico',
    name: '',
    category: '',
    amount: 0,
    paid_by: 'conjunto' as 'person1' | 'person2' | 'vr' | 'conjunto',
    total_installments: 1,
    paid_installments: 0,
    first_due_date: '',
    due_date: '',
    notes: ''
  })

  useEffect(() => {
    if (expense && expense.id) {
      console.log('Carregando dados da despesa no formulário:', expense)
      const paidCount = expense.installments?.filter(inst => inst.status === 'paid').length || 0
      setFormData({
        type: expense.type,
        name: expense.name,
        category: expense.category,
        amount: expense.amount,
        paid_by: expense.paid_by || 'conjunto',
        total_installments: expense.total_installments || 1,
        paid_installments: paidCount,
        first_due_date: expense.start_date ? expense.start_date.slice(0, 10) : '',
        due_date: expense.due_date ? expense.due_date.slice(0, 10) : '',
        notes: expense.notes || ''
      })
    } else {
      // Resetar formulário quando não há expense (criar novo)
      setFormData({
        type: 'fixo' as 'fixo' | 'parcelado' | 'unico',
        name: '',
        category: '',
        amount: 0,
        paid_by: 'conjunto' as 'person1' | 'person2' | 'vr' | 'conjunto',
        total_installments: 1,
        paid_installments: 0,
        first_due_date: '',
        due_date: '',
        notes: ''
      })
    }
  }, [expense])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: formData.name,
      category: formData.category,
      amount: formData.amount,
      type: formData.type,
      paid_by: formData.paid_by,
      notes: formData.notes,
      total_installments: formData.type === 'parcelado' ? formData.total_installments : undefined,
      paid_installments: formData.type === 'parcelado' ? formData.paid_installments : undefined,
      first_due_date: formData.type === 'parcelado' ? formData.first_due_date : undefined,
      due_date: formData.type === 'unico' ? formData.due_date : undefined,
    })
  }

  // Calcular projeção de parcelas
  const projectionMonths = formData.type === 'parcelado' && formData.amount > 0 && formData.total_installments > 0 && formData.first_due_date
    ? Array.from({ length: Math.min(formData.total_installments, 12) }, (_, i) => {
        const date = addMonths(new Date(formData.first_due_date), i)
        const amount = formData.amount / formData.total_installments
        return { date, amount, month: format(date, 'MMM/yyyy', { locale: ptBR }) }
      })
    : []

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {expense ? 'Editar Despesa' : 'Nova Despesa'}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="fixo">Fixo Mensal</option>
              <option value="parcelado">Parcelado</option>
              <option value="unico">Único</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Pago Por</label>
            <select
              value={formData.paid_by}
              onChange={(e) => setFormData({ ...formData, paid_by: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="conjunto">{getConfigValue('conjunto_label') || 'Conjunto'}</option>
              <option value="person1">{getConfigValue('person1_name') || 'Pessoa 1'}</option>
              <option value="person2">{getConfigValue('person2_name') || 'Pessoa 2'}</option>
              <option value="vr">{getConfigValue('vr_label') || 'VR'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Ex: Aluguel, Cartão..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoria</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Ex: Moradia, Transporte..."
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          {formData.type === 'parcelado' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_installments}
                  onChange={(e) => {
                    const total = parseInt(e.target.value) || 1
                    const paid = Math.min(formData.paid_installments, total)
                    setFormData({ ...formData, total_installments: total, paid_installments: paid })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Já Pagas</label>
                <input
                  type="number"
                  min="0"
                  max={formData.total_installments}
                  value={formData.paid_installments}
                  onChange={(e) => {
                    const paid = Math.min(parseInt(e.target.value) || 0, formData.total_installments)
                    setFormData({ ...formData, paid_installments: paid })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        {formData.type === 'parcelado' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Primeira Parcela</label>
            <input
              type="date"
              value={formData.first_due_date}
              onChange={(e) => setFormData({ ...formData, first_due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>
        )}

        {formData.type === 'unico' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Data</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>
        )}

        {/* Projeção de Parcelas */}
        {projectionMonths.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Projeção dos Próximos Meses</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {projectionMonths.map((proj, idx) => (
                <div key={idx} className="bg-white rounded p-2 border border-gray-200">
                  <p className="text-xs text-gray-600">{proj.month}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    R$ {proj.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" className="flex-1">
            {expense ? 'Atualizar' : 'Adicionar'}
          </Button>
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function Home() {
  const { getConfigValue, reloadConfigs } = useConfig()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de formulários
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  
  // Mês selecionado
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [salariesData, expensesData] = await Promise.all([
        getSalaries(),
        getExpenses()
      ])
      setSalaries(salariesData)
      setExpenses(expensesData)
      const allInstallments = expensesData.flatMap(exp => exp.installments || [])
      setInstallments(allInstallments)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular valores do mês
  const calculateMonthlyValues = () => {
    const totalIncome = salaries.reduce((sum, s) => sum + s.value, 0)
    
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth))
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth))
    
    const fixedExpenses = expenses
      .filter(e => e.type === 'fixo')
      .reduce((sum, e) => sum + e.amount, 0)
    
    const monthInstallments = installments
      .filter(inst => {
        if (inst.status === 'paid') return false
        const dueDate = new Date(inst.due_date)
        return dueDate >= monthStart && dueDate <= monthEnd
      })
      .reduce((sum, inst) => sum + inst.amount, 0)
    
    const monthUniqueExpenses = expenses
      .filter(e => {
        if (e.type !== 'unico' || !e.due_date) return false
        const dueDate = new Date(e.due_date)
        return dueDate >= monthStart && dueDate <= monthEnd
      })
      .reduce((sum, e) => sum + e.amount, 0)
    
    const totalExpenses = fixedExpenses + monthInstallments + monthUniqueExpenses
    const balance = totalIncome - totalExpenses
    
    return { totalIncome, totalExpenses, balance }
  }

  const { totalIncome, totalExpenses, balance } = calculateMonthlyValues()

  // Handlers
  const handleCreateSalary = async (data: Omit<Salary, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingSalary) {
        await updateSalary(editingSalary.id!, data)
      } else {
        await createSalary(data)
      }
      await loadData()
      setShowSalaryForm(false)
      setEditingSalary(null)
    } catch (error: any) {
      console.error('Erro ao salvar receita:', error)
      const errorMessage = error?.message || 'Erro desconhecido ao salvar receita'
      alert(`❌ Erro ao salvar receita:\n\n${errorMessage}\n\nVerifique:\n- Se o Supabase está configurado no .env.local\n- Se as tabelas foram criadas no banco de dados\n- Console do navegador (F12) para mais detalhes`)
    }
  }

  const handleCreateExpense = async (data: ExpenseInput) => {
    try {
      if (editingExpense) {
        const { updateExpense } = await import('@/lib/expenses')
        await updateExpense(editingExpense.id!, data)
      } else {
        await createExpense(data)
      }
      await loadData()
      setShowExpenseForm(false)
      setEditingExpense(null)
    } catch (error: any) {
      console.error('Erro ao salvar despesa:', error)
      const errorMessage = error?.message || 'Erro desconhecido ao salvar despesa'
      alert(`❌ Erro ao salvar despesa:\n\n${errorMessage}\n\nVerifique:\n- Se o Supabase está configurado no .env.local\n- Se as tabelas foram criadas no banco de dados\n- Se todos os campos obrigatórios foram preenchidos\n- Console do navegador (F12) para mais detalhes`)
    }
  }

  const handleDeleteSalary = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await deleteSalary(id)
        await loadData()
      } catch (error) {
        console.error('Erro ao excluir receita:', error)
      }
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await deleteExpense(id)
        await loadData()
      } catch (error) {
        console.error('Erro ao excluir despesa:', error)
      }
    }
  }

  const monthLabel = format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {getConfigValue('site_title') || 'Controle Financeiro'}
            </h1>
            <p className="text-sm text-gray-600">
              {getConfigValue('site_subtitle') || 'Gestão simples do seu dinheiro'}
            </p>
          </div>
          <Button onClick={() => setShowConfig(true)} variant="secondary" icon={Settings}>
            Configurações
          </Button>
        </div>

        {/* Alerta Supabase */}
        {!isSupabaseConfigured && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Configure o Supabase no arquivo <code className="bg-yellow-100 px-1 rounded">.env.local</code>
            </p>
          </div>
        )}

        {/* Seletor de Mês */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <Calendar size={18} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Visualizar:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {format(new Date(2024, i), 'MMMM', { locale: ptBR })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 1 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Button 
              onClick={() => {
                setSelectedMonth(today.getMonth())
                setSelectedYear(today.getFullYear())
              }}
              variant="secondary"
              className="ml-auto"
            >
              Mês Atual
            </Button>
          </div>
        </Card>

        {/* Dashboard - Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Receitas</span>
              <ArrowUp size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{monthLabel}</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Despesas</span>
              <ArrowDown size={18} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{monthLabel}</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Saldo</span>
              <DollarSign size={18} className={balance >= 0 ? 'text-green-600' : 'text-red-600'} />
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{monthLabel}</p>
          </Card>
        </div>

        {/* Formulários */}
        {showSalaryForm && (
          <div className="mb-6">
            <SalaryFormSimple
              salary={editingSalary}
              onSubmit={handleCreateSalary}
              onCancel={() => {
                setShowSalaryForm(false)
                setEditingSalary(null)
              }}
            />
          </div>
        )}

        {showExpenseForm && (
          <div className="mb-6">
            <ExpenseFormSimple
              expense={editingExpense}
              onSubmit={handleCreateExpense}
              onCancel={() => {
                setShowExpenseForm(false)
                setEditingExpense(null)
              }}
            />
          </div>
        )}

        {/* Botões de Ação */}
        {!showSalaryForm && !showExpenseForm && (
          <div className="flex gap-3 mb-8">
            <Button onClick={() => setShowSalaryForm(true)} variant="primary" icon={Plus}>
              Nova Receita
            </Button>
            <Button onClick={() => setShowExpenseForm(true)} variant="primary" icon={Plus}>
              Nova Despesa
            </Button>
          </div>
        )}

        {/* Lista de Receitas */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Receitas</h2>
            <span className="text-sm text-gray-500">{salaries.length} itens</span>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Carregando...</p>
          ) : salaries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Nenhuma receita cadastrada</p>
          ) : (
            <div className="space-y-2">
              {salaries.map(salary => (
                <div key={salary.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{salary.name}</p>
                    <p className="text-xs text-gray-500">
                      {getConfigValue(salary.person === 'person1' ? 'person1_name' : salary.person === 'person2' ? 'person2_name' : salary.person === 'vr' ? 'vr_label' : 'conjunto_label') || salary.person}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-gray-900">
                      R$ {salary.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => {
                          setEditingSalary(salary)
                          setShowSalaryForm(true)
                        }}
                        variant="secondary"
                        className="px-2 py-1"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteSalary(salary.id!)}
                        variant="danger"
                        className="px-2 py-1"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lista de Despesas */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Despesas</h2>
            <span className="text-sm text-gray-500">{expenses.length} itens</span>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Carregando...</p>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Nenhuma despesa cadastrada</p>
          ) : (
            <div className="space-y-2">
              {expenses.map(expense => {
                const pendingInstallments = expense.installments?.filter(i => i.status === 'pending').length || 0
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expense.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{expense.category}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                          {expense.type === 'fixo' ? 'Fixo' : expense.type === 'parcelado' ? `Parcelado (${pendingInstallments} pendentes)` : 'Único'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-gray-900">
                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => {
                            console.log('Editando despesa:', expense)
                            setEditingExpense(expense)
                            setShowExpenseForm(true)
                          }}
                          variant="secondary"
                          className="px-2 py-1"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteExpense(expense.id!)}
                          variant="danger"
                          className="px-2 py-1"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Projeção Futura */}
        <Card className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Projeção dos Próximos 12 Meses</h2>
          </div>
          <ProjectionChart salaries={salaries} expenses={expenses} installments={installments} />
        </Card>

        {/* Config Editor */}
        {showConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ConfigEditor onClose={async () => {
                setShowConfig(false)
                await reloadConfigs()
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de Projeção Visual Melhorado
function ProjectionChart({ 
  salaries, 
  expenses, 
  installments 
}: { 
  salaries: Salary[]
  expenses: Expense[]
  installments: Installment[]
}) {
  const [chartData, setChartData] = useState<Array<{
    month: string
    income: number
    expenses: number
    balance: number
    date: Date
  }>>([])
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null)

  useEffect(() => {
    const today = new Date()
    const projection: typeof chartData = []

    const totalIncome = salaries.reduce((sum, s) => sum + s.value, 0)
    const fixedExpenses = expenses
      .filter(e => e.type === 'fixo')
      .reduce((sum, e) => sum + e.amount, 0)

    const pendingInstallments = installments.filter(i => i.status === 'pending')

    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(today, i)
      const monthLabel = format(monthDate, 'MMM/yyyy', { locale: ptBR })

      const monthInstallments = pendingInstallments
        .filter(inst => {
          const instDate = new Date(inst.due_date)
          return instDate.getMonth() === monthDate.getMonth() && instDate.getFullYear() === monthDate.getFullYear()
        })
        .reduce((sum, inst) => sum + inst.amount, 0)

      const monthUniqueExpenses = expenses
        .filter(e => {
          if (e.type !== 'unico' || !e.due_date) return false
          const expenseDate = new Date(e.due_date)
          return expenseDate.getMonth() === monthDate.getMonth() && expenseDate.getFullYear() === monthDate.getFullYear()
        })
        .reduce((sum, e) => sum + e.amount, 0)

      const totalExpenses = fixedExpenses + monthInstallments + monthUniqueExpenses
      const balance = totalIncome - totalExpenses

      projection.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        income: totalIncome,
        expenses: totalExpenses,
        balance,
        date: monthDate
      })
    }

    setChartData(projection)
  }, [salaries, expenses, installments])

  if (chartData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Carregando projeção...</p>
  }

  const today = new Date()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chartData.map((data, idx) => {
        const isCurrentMonth = data.date.getMonth() === today.getMonth() && data.date.getFullYear() === today.getFullYear()
        
        return (
          <div key={idx} className="space-y-3">
            {/* Card do Mês */}
            <div className={`border rounded-lg p-4 ${
              isCurrentMonth 
                ? 'border-gray-900 bg-gray-50' 
                : 'border-gray-200 bg-white'
            }`}>
              <div className="mb-3">
                <div className={`text-sm font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-700'}`}>
                  {data.month}
                </div>
                {isCurrentMonth && (
                  <div className="text-xs text-gray-500 mt-0.5">Mês Atual</div>
                )}
              </div>

              {/* KPI Receitas - Verde */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-700 font-medium">Receitas</span>
                  <ArrowUp size={16} className="text-green-600" />
                </div>
                <p className="text-xl font-bold text-green-700">
                  R$ {data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* KPI Despesas - Vermelho */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-700 font-medium">Despesas</span>
                  <ArrowDown size={16} className="text-red-600" />
                </div>
                <p className="text-xl font-bold text-red-700">
                  R$ {data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Saldo */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Saldo</span>
                  <div className={`text-lg font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {data.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className={`text-xs mt-1 text-right ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.balance >= 0 ? '✓ Positivo' : '⚠ Negativo'}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
