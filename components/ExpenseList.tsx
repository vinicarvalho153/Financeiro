'use client'

import { Expense, Installment } from '@/lib/supabase'
import { updateInstallmentStatus, payMonthInstallments, finishExpense } from '@/lib/expenses'
import { useConfig } from '@/contexts/ConfigContext'
import { Clock, CreditCard, Trash2, ChevronDown, ChevronUp, Edit, CheckCircle, Calendar } from 'lucide-react'
import { useState } from 'react'

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit: (expense: Expense) => void
  onRefresh: () => void
}

export default function ExpenseList({ expenses, onDelete, onEdit, onRefresh }: ExpenseListProps) {
  const { getConfigValue } = useConfig()
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set())

  const getPaidByLabel = (paidBy: string | undefined) => {
    switch (paidBy) {
      case 'conjunto':
        return getConfigValue('conjunto_label') || 'Salário Conjunto'
      case 'person1':
        return getConfigValue('person1_name') || 'Pessoa 1'
      case 'person2':
        return getConfigValue('person2_name') || 'Pessoa 2'
      case 'vr':
        return getConfigValue('vr_label') || 'Vale Refeição (VR)'
      default:
        return 'Conjunto'
    }
  }

  const getPaidByColor = (paidBy: string | undefined) => {
    switch (paidBy) {
      case 'conjunto':
        return 'bg-green-100 text-green-800'
      case 'person1':
        return 'bg-blue-100 text-blue-800'
      case 'person2':
        return 'bg-purple-100 text-purple-800'
      case 'vr':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum gasto cadastrado ainda. Clique em "Adicionar Gasto" para começar.
      </div>
    )
  }

  const handleInstallmentStatus = async (installment: Installment) => {
    setUpdating(installment.id || null)
    try {
      await updateInstallmentStatus(installment.id!, installment.status === 'paid' ? 'pending' : 'paid')
      await onRefresh()
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error)
      alert('Erro ao atualizar parcela. Verifique o console para mais detalhes.')
    } finally {
      setUpdating(null)
    }
  }

  const toggleExpense = (expenseId: string) => {
    const newExpanded = new Set(expandedExpenses)
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId)
    } else {
      newExpanded.add(expenseId)
    }
    setExpandedExpenses(newExpanded)
  }

  const handlePayMonth = async (expenseId: string) => {
    if (!confirm('Deseja marcar todas as parcelas pendentes deste mês como pagas?')) {
      return
    }
    
    setUpdating(expenseId)
    try {
      await payMonthInstallments(expenseId)
      await onRefresh()
    } catch (error) {
      console.error('Erro ao pagar parcelas do mês:', error)
      alert('Erro ao pagar parcelas do mês. Verifique o console para mais detalhes.')
    } finally {
      setUpdating(null)
    }
  }

  const handleFinish = async (expenseId: string) => {
    if (!confirm('Deseja finalizar este gasto? Todas as parcelas pendentes serão marcadas como pagas.')) {
      return
    }
    
    setUpdating(expenseId)
    try {
      await finishExpense(expenseId)
      await onRefresh()
    } catch (error) {
      console.error('Erro ao finalizar gasto:', error)
      alert('Erro ao finalizar gasto. Verifique o console para mais detalhes.')
    } finally {
      setUpdating(null)
    }
  }

  const handleFinalizeAndRemove = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId)
    const isParcelled = expense?.type === 'parcelado'
    const isUnique = expense?.type === 'unico'
    
    let confirmMessage = ''
    if (isParcelled) {
      confirmMessage = 'Todas as parcelas já foram pagas. Deseja finalizar e remover este gasto parcelado da lista?'
    } else if (isUnique) {
      confirmMessage = 'Deseja finalizar e remover este gasto único da lista?'
    } else {
      return
    }
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    setUpdating(expenseId)
    try {
      await onDelete(expenseId)
    } catch (error) {
      console.error('Erro ao remover gasto:', error)
      alert('Erro ao remover gasto. Verifique o console para mais detalhes.')
    } finally {
      setUpdating(null)
    }
  }

  const getPendingInstallmentsCount = (expense: Expense): number => {
    if (!expense.installments) return 0
    return expense.installments.filter(inst => inst.status === 'pending').length
  }

  const getPaidInstallmentsCount = (expense: Expense): number => {
    if (!expense.installments) return 0
    return expense.installments.filter(inst => inst.status === 'paid').length
  }

  const isFinished = (expense: Expense): boolean => {
    if (expense.type !== 'parcelado' || !expense.installments || expense.installments.length === 0) return false
    return getPendingInstallmentsCount(expense) === 0
  }

  const hasCurrentMonthInstallments = (expense: Expense): boolean => {
    if (expense.type !== 'parcelado' || !expense.installments) return false
    
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    return expense.installments.some(inst => {
      if (inst.status === 'paid') return false
      const instDate = new Date(inst.due_date)
      return instDate.getMonth() === currentMonth && instDate.getFullYear() === currentYear
    })
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => {
        const shouldShowFinalizeButton = 
          expense.type === 'unico' || 
          (expense.type === 'parcelado' && 
           expense.installments && 
           expense.installments.length > 0 && 
           isFinished(expense))
        
        const shouldShowInstallmentsSection = 
          expense.type === 'parcelado' && 
          expense.installments && 
          expense.installments.length > 0

        return (
        <div key={expense.id} className="border rounded-lg shadow-sm overflow-hidden bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b bg-gray-50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {expense.name}
                  {expense.type === 'parcelado' && expense.installments && expense.installments.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({expense.installments.filter(inst => inst.status === 'paid').length}/{expense.installments.length})
                    </span>
                  )}
                </h3>
                <span className="text-xs uppercase tracking-wide text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  {expense.category}
                </span>
                {shouldShowFinalizeButton && (
                  <button
                    onClick={() => expense.id && handleFinalizeAndRemove(expense.id)}
                    disabled={updating === expense.id}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title={expense.type === 'unico' ? 'Finalizar e Remover Gasto Único' : 'Finalizar e Remover Gasto Parcelado'}
                  >
                    <CheckCircle size={12} />
                    Finalizar
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">
                  {expense.type === 'fixo' 
                    ? 'Gasto Fixo Mensal' 
                    : expense.type === 'parcelado'
                    ? 'Gasto Parcelado'
                    : 'Gasto Único'}
                </p>
                {expense.type === 'unico' && expense.due_date && (
                  <span className="text-xs text-gray-500">
                    (Vencimento: {new Date(expense.due_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })})
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaidByColor(expense.paid_by)}`}>
                  Pago por: {getPaidByLabel(expense.paid_by)}
                </span>
              </div>
              {expense.notes && (
                <p className="text-sm text-gray-600 mt-2">{expense.notes}</p>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {expense.type === 'fixo' ? 'Valor Mensal' : 'Valor Total'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {expense.type === 'parcelado' && expense.installments && expense.installments.length > 0 && (
                  <>
                    {hasCurrentMonthInstallments(expense) && (
                      <button
                        onClick={() => expense.id && handlePayMonth(expense.id)}
                        disabled={updating === expense.id}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Pagar Parcelas do Mês"
                      >
                        <Calendar size={20} />
                      </button>
                    )}
                    {!isFinished(expense) && (
                      <button
                        onClick={() => expense.id && handleFinish(expense.id)}
                        disabled={updating === expense.id}
                        className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Finalizar (Pagar Todas as Parcelas Pendentes)"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => onEdit(expense)}
                  className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded transition-colors"
                  title="Editar Gasto"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => expense.id && onDelete(expense.id)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                  title="Excluir Gasto"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {shouldShowInstallmentsSection && (
            <div className="border-t">
              <button
                onClick={() => expense.id && toggleExpense(expense.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard size={16} />
                  Parcelas ({expense.installments!.filter(inst => inst.status === 'paid').length}/{expense.installments!.length} pagas)
                </h4>
                {expense.id && expandedExpenses.has(expense.id) ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              {expense.id && expandedExpenses.has(expense.id) && (
                <div className="p-4 bg-gray-50">
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {expense.installments!.map((installment) => (
                      <div
                        key={installment.id}
                        className="flex items-center justify-between p-3 bg-white rounded border"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            Parcela {installment.installment_number}/{expense.total_installments}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock size={14} />
                            Vencimento:{' '}
                            {new Date(installment.due_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <button
                            onClick={() => handleInstallmentStatus(installment)}
                            disabled={updating === installment.id}
                            className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              installment.status === 'paid'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {installment.status === 'paid' ? 'Pago' : 'Pendente'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )
      })}
    </div>
  )
}

