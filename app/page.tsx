'use client'

import { useState, useEffect } from 'react'
import { Salary, Expense, Installment, MonthlyProjection, isSupabaseConfigured } from '@/lib/supabase'
import { getSalaries, createSalary, updateSalary, deleteSalary } from '@/lib/database'
import { getExpenses, createExpense, deleteExpense, ExpenseInput } from '@/lib/expenses'
import SalaryForm from '@/components/SalaryForm'
import SalaryList from '@/components/SalaryList'
import ProjectionChartWithTabs from '@/components/ProjectionChartWithTabs'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseListWithTabs from '@/components/ExpenseListWithTabs'
import ConfigEditor from '@/components/ConfigEditor'
import { useConfig } from '@/contexts/ConfigContext'
import { Plus, TrendingUp, AlertCircle, Settings, Wallet, DollarSign } from 'lucide-react'

export default function Home() {
  const { getConfigValue, reloadConfigs } = useConfig()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [monthlyProjections, setMonthlyProjections] = useState<{ [key: string]: { conjunto: number; expenses: number } }>({})
  const [editingProjection, setEditingProjection] = useState<{ year: number; month: number } | null>(null)
  const [showProjectionSelector, setShowProjectionSelector] = useState(false)

  useEffect(() => {
    loadSalaries()
    loadExpenses()
  }, [])

  const loadSalaries = async () => {
    setLoading(true)
    try {
      const data = await getSalaries()
      setSalaries(data)
    } catch (error) {
      console.error('Erro ao carregar salários:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExpenses = async () => {
    setLoadingExpenses(true)
    try {
      const data = await getExpenses()
      console.log('📊 Carregando despesas:', data.length, 'registros encontrados')
      setExpenses(data)
      const allInstallments = data.flatMap(expense => expense.installments || [])
      console.log('📊 Carregando parcelas:', allInstallments.length, 'parcelas encontradas')
      setInstallments(allInstallments)
    } catch (error) {
      console.error('❌ Erro ao carregar gastos:', error)
      alert('Erro ao carregar gastos. Verifique o console para mais detalhes.')
    } finally {
      setLoadingExpenses(false)
    }
  }

  const handleCreate = async (salary: Omit<Salary, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createSalary(salary)
      await loadSalaries()
      setShowForm(false)
    } catch (error: any) {
      console.error('Erro ao criar salário:', error)
      const errorMessage = error?.message || 'Erro desconhecido'
      if (errorMessage.includes('CHECK constraint') || errorMessage.includes('person')) {
        alert('⚠️ Erro: O banco de dados precisa ser atualizado.\n\nExecute o arquivo supabase/fix_database.sql no SQL Editor do Supabase para corrigir isso.')
      } else {
        alert(`Erro ao criar salário: ${errorMessage}\n\nVerifique o console para mais detalhes.`)
      }
    }
  }

  const handleUpdate = async (id: string, salary: Partial<Salary>) => {
    try {
      await updateSalary(id, salary)
      await loadSalaries()
      setEditingSalary(null)
    } catch (error) {
      console.error('Erro ao atualizar salário:', error)
      alert('Erro ao atualizar salário. Verifique o console para mais detalhes.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este salário?')) {
      try {
        await deleteSalary(id)
        await loadSalaries()
      } catch (error) {
        console.error('Erro ao deletar salário:', error)
        alert('Erro ao deletar salário. Verifique o console para mais detalhes.')
      }
    }
  }

  const handleEdit = (salary: Salary) => {
    setEditingSalary(salary)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSalary(null)
  }

  const handleConfigClose = async () => {
    setShowConfig(false)
    await reloadConfigs()
  }

  const handleCreateExpenseEntry = async (expenseData: ExpenseInput) => {
    try {
      if (editingExpense && editingExpense.id) {
        const { updateExpense } = await import('@/lib/expenses')
        await updateExpense(editingExpense.id, expenseData)
      } else {
        await createExpense(expenseData)
      }
      await loadExpenses()
      setShowExpenseForm(false)
      setEditingExpense(null)
    } catch (error: any) {
      console.error('Erro ao salvar gasto:', error)
      const errorMessage = error?.message || 'Erro desconhecido'
      if (errorMessage.includes('CHECK constraint') || errorMessage.includes('paid_by')) {
        alert('⚠️ Erro: O banco de dados precisa ser atualizado.\n\nExecute o arquivo supabase/fix_database.sql no SQL Editor do Supabase para corrigir isso.')
      } else {
        alert(`Erro ao salvar gasto: ${errorMessage}\n\nVerifique o console para mais detalhes.`)
      }
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const handleCancelExpenseForm = () => {
    setShowExpenseForm(false)
    setEditingExpense(null)
  }

  const handleDeleteExpenseEntry = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este gasto?')) {
      try {
        await deleteExpense(id)
        await loadExpenses()
      } catch (error) {
        console.error('Erro ao excluir gasto:', error)
        alert('Erro ao excluir gasto. Verifique o console para mais detalhes.')
      }
    }
  }

  const totalConjunto = salaries
    .filter(s => s.person === 'conjunto')
    .reduce((sum, s) => sum + s.value, 0)

  const totalPerson1 = salaries
    .filter(s => s.person === 'person1')
    .reduce((sum, s) => sum + s.value, 0)

  const totalPerson2 = salaries
    .filter(s => s.person === 'person2')
    .reduce((sum, s) => sum + s.value, 0)

  const totalVR = salaries
    .filter(s => s.person === 'vr')
    .reduce((sum, s) => sum + s.value, 0)

  const totalGeral = totalConjunto + totalPerson1 + totalPerson2 + totalVR

  const totalFixedExpenses = expenses
    .filter(expense => expense.type === 'fixo')
    .reduce((sum, expense) => sum + expense.amount, 0)

  const totalPendingInstallments = installments
    .filter(installment => installment.status !== 'paid')
    .reduce((sum, installment) => sum + installment.amount, 0)

  // Gastos únicos pendentes (vencimento futuro ou hoje)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalUniqueExpenses = expenses
    .filter(expense => {
      if (expense.type !== 'unico' || !expense.due_date) return false
      const dueDate = new Date(expense.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate >= today
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const totalDespesas = totalFixedExpenses + totalPendingInstallments + totalUniqueExpenses
  const saldoGeral = totalGeral - totalDespesas

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {getConfigValue('site_title') || 'Controle Financeiro'}
            </h1>
            <p className="text-gray-600">
              {getConfigValue('site_subtitle') || 'Gestão de salários para duas pessoas'}
            </p>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"
            title="Configurações do Site"
          >
            <Settings size={20} />
            Configurações
          </button>
        </div>

        {/* Alerta de configuração */}
        {!isSupabaseConfigured && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-yellow-600" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">⚠️ Supabase não configurado</h3>
                <p className="text-sm text-yellow-700">
                  Para salvar seus dados, configure o arquivo <code className="bg-yellow-100 px-1 rounded">.env.local</code> com suas credenciais do Supabase. 
                  Veja o arquivo <code className="bg-yellow-100 px-1 rounded">README.md</code> para instruções.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card de Saldo Restante - Destaque */}
        <div className={`mb-8 rounded-xl shadow-lg p-8 border-2 ${
          saldoGeral >= 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${
              saldoGeral >= 0 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              <DollarSign size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Saldo Restante
              </h2>
              <p className="text-sm text-gray-600">
                Total disponível após despesas
              </p>
            </div>
          </div>
          <div className={`text-5xl font-bold ${
            saldoGeral >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            R$ {saldoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={`mt-2 text-sm font-medium ${
            saldoGeral >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {saldoGeral >= 0 ? '✅ Saldo positivo' : '⚠️ Saldo negativo'}
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">
              {getConfigValue('total_geral_label') || 'Total Geral'}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">
              Total Despesas
            </div>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">
              {getConfigValue('person1_name') || 'Pessoa 1'}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              R$ {totalPerson1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">
              {getConfigValue('person2_name') || 'Pessoa 2'}
            </div>
            <div className="text-2xl font-bold text-purple-600">
              R$ {totalPerson2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 mb-1">
              {getConfigValue('vr_label') || 'Vale Refeição (VR)'}
            </div>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalVR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Botão Adicionar */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            {getConfigValue('button_add_salary') || 'Adicionar Salário'}
          </button>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="mb-8">
            <SalaryForm
              salary={editingSalary}
              onSubmit={editingSalary ? (data) => handleUpdate(editingSalary.id!, data) : handleCreate}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Gráfico de Projeção com Abas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">
              {getConfigValue('projection_title') || 'Projeção de Salários (Próximos 12 Meses)'}
            </h2>
          </div>
          <ProjectionChartWithTabs 
            salaries={salaries} 
            expenses={expenses} 
            installments={installments}
          />
        </div>

        {/* Lista de Salários */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {getConfigValue('salaries_list_title') || 'Salários Cadastrados'}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            <SalaryList
              salaries={salaries}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Gastos e Parcelamentos */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Gastos e Compras Parceladas</h2>
              <p className="text-gray-600">
                Cadastre gastos fixos mensais e compras parceladas. As parcelas são criadas automaticamente e podem ser marcadas como pagas.
              </p>
            </div>
            {!showExpenseForm && (
              <button
                onClick={() => {
                  setEditingExpense(null)
                  setShowExpenseForm(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Wallet size={20} />
                Adicionar Gasto ou Compra Parcelada
              </button>
            )}
          </div>

          {showExpenseForm && (
            <div className="mb-8">
              <ExpenseForm
                onSubmit={handleCreateExpenseEntry}
                onCancel={() => setShowExpenseForm(false)}
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Gastos Registrados</h3>
            {loadingExpenses ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : (
              <ExpenseList
                expenses={expenses}
                onDelete={handleDeleteExpenseEntry}
                onRefresh={loadExpenses}
              />
            )}
          </div>
        </div>

        {/* Editor de Configurações */}
        {showConfig && <ConfigEditor onClose={handleConfigClose} />}
      </div>
    </main>
  )
}

