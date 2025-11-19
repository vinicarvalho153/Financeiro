'use client'

import { useState, useEffect } from 'react'
import { Salary, Expense, Installment, MonthlyProjection, isSupabaseConfigured } from '@/lib/supabase'
import { getSalaries, createSalary, updateSalary, deleteSalary } from '@/lib/database'
import { getExpenses, createExpense, deleteExpense, ExpenseInput } from '@/lib/expenses'
import { getMonthlyProjections } from '@/lib/projections'
import SalaryForm from '@/components/SalaryForm'
import SalaryList from '@/components/SalaryList'
import ProjectionChart from '@/components/ProjectionChart'
import ProjectionEditor from '@/components/ProjectionEditor'
import ProjectionMonthSelector from '@/components/ProjectionMonthSelector'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import ConfigEditor from '@/components/ConfigEditor'
import { useConfig } from '@/contexts/ConfigContext'
import { Plus, TrendingUp, AlertCircle, Settings, Wallet, Edit } from 'lucide-react'
import { addMonths } from 'date-fns'

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
  const [monthlyProjections, setMonthlyProjections] = useState<{ [key: string]: { conjunto: number; expenses: number } }>({})
  const [editingProjection, setEditingProjection] = useState<{ year: number; month: number } | null>(null)
  const [showProjectionSelector, setShowProjectionSelector] = useState(false)

  useEffect(() => {
    loadSalaries()
    loadExpenses()
    loadMonthlyProjections()
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
      setExpenses(data)
      const allInstallments = data.flatMap(expense => expense.installments || [])
      setInstallments(allInstallments)
    } catch (error) {
      console.error('Erro ao carregar gastos:', error)
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
      await createExpense(expenseData)
      await loadExpenses()
      await loadMonthlyProjections()
      setShowExpenseForm(false)
    } catch (error: any) {
      console.error('Erro ao criar gasto:', error)
      const errorMessage = error?.message || 'Erro desconhecido'
      if (errorMessage.includes('CHECK constraint') || errorMessage.includes('paid_by')) {
        alert('⚠️ Erro: O banco de dados precisa ser atualizado.\n\nExecute o arquivo supabase/fix_database.sql no SQL Editor do Supabase para corrigir isso.')
      } else {
        alert(`Erro ao criar gasto: ${errorMessage}\n\nVerifique o console para mais detalhes.`)
      }
    }
  }

  const handleDeleteExpenseEntry = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este gasto?')) {
      try {
        await deleteExpense(id)
        await loadExpenses()
        await loadMonthlyProjections()
      } catch (error) {
        console.error('Erro ao excluir gasto:', error)
        alert('Erro ao excluir gasto. Verifique o console para mais detalhes.')
      }
    }
  }

  const loadMonthlyProjections = async () => {
    try {
      const projections = await getMonthlyProjections()
      const projectionsMap: { [key: string]: { conjunto: number; expenses: number } } = {}
      
      projections.forEach(proj => {
        const key = `${proj.year}-${proj.month}`
        projectionsMap[key] = {
          conjunto: proj.conjunto,
          expenses: proj.expenses,
        }
      })
      
      setMonthlyProjections(projectionsMap)
    } catch (error) {
      console.error('Erro ao carregar projeções mensais:', error)
    }
  }

  const handleEditProjection = (year: number, month: number) => {
    setEditingProjection({ year, month })
  }

  const handleProjectionSave = async () => {
    setEditingProjection(null)
    await loadMonthlyProjections()
  }

  const handleProjectionCancel = () => {
    setEditingProjection(null)
  }

  const getDefaultProjectionValues = (year: number, month: number) => {
    // Calcular valores padrão para o mês específico
    const conjuntoSalaries = salaries.filter(s => s.person === 'conjunto')
    const avgConjunto = conjuntoSalaries.length > 0
      ? conjuntoSalaries.reduce((sum, s) => sum + s.value, 0) / conjuntoSalaries.length
      : 0

    const recurringExpenses = expenses
      .filter(expense => expense.type === 'fixo')
      .reduce((sum, expense) => sum + expense.amount, 0)

    const parcelInstallments = installments.filter(inst => inst.status !== 'paid')
    const monthDate = new Date(year, month - 1, 1)
    
    const monthInstallments = parcelInstallments
      .filter(inst => {
        const instDate = new Date(inst.due_date)
        return instDate.getMonth() === monthDate.getMonth() && instDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, inst) => sum + inst.amount, 0)

    return {
      conjunto: avgConjunto,
      expenses: recurringExpenses + monthInstallments,
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

  const totalDespesas = totalFixedExpenses + totalPendingInstallments
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

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
              {getConfigValue('total_conjunto_label') || 'Salário Conjunto'}
            </div>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalConjunto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              Saldo Projetado
            </div>
            <div className={`text-2xl font-bold ${saldoGeral >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {saldoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

        {/* Gráfico de Projeção */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">
                {getConfigValue('projection_title') || 'Projeção de Salários (Próximos 12 Meses)'}
              </h2>
            </div>
            <button
              onClick={() => setShowProjectionSelector(!showProjectionSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Editar projeções mensais"
            >
              <Edit size={18} />
              {showProjectionSelector ? 'Fechar Editor' : 'Editar Projeções'}
            </button>
          </div>
          <ProjectionChart 
            salaries={salaries} 
            expenses={expenses} 
            installments={installments}
            monthlyProjections={monthlyProjections}
            onEditProjection={handleEditProjection}
          />
          
          {/* Seletor de Mês para Editar */}
          {showProjectionSelector && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selecione o mês para editar a projeção:
              </h3>
              <ProjectionMonthSelector onSelectMonth={(year, month) => {
                handleEditProjection(year, month)
                setShowProjectionSelector(false)
              }} />
            </div>
          )}
        </div>

        {/* Editor de Projeção Mensal */}
        {editingProjection && (() => {
          const projectionKey = `${editingProjection.year}-${editingProjection.month}`
          const existingProjection = monthlyProjections[projectionKey]
          const defaults = getDefaultProjectionValues(editingProjection.year, editingProjection.month)
          
          return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <ProjectionEditor
                year={editingProjection.year}
                month={editingProjection.month}
                initialProjection={existingProjection ? {
                  id: '',
                  year: editingProjection.year,
                  month: editingProjection.month,
                  conjunto: existingProjection.conjunto,
                  expenses: existingProjection.expenses,
                } : null}
                defaultConjunto={defaults.conjunto}
                defaultExpenses={defaults.expenses}
                onSave={handleProjectionSave}
                onCancel={handleProjectionCancel}
              />
            </div>
          )
        })()}

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
                onClick={() => setShowExpenseForm(true)}
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
