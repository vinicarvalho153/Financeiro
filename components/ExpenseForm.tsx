'use client'

import { useEffect, useState } from 'react'
import { X, Calculator, Calendar } from 'lucide-react'
import { Expense } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import { addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExpenseFormProps {
  expense?: Expense | null
  onSubmit: (data: {
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
  }) => void | Promise<void>
  onCancel: () => void
}

export default function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const { getConfigValue } = useConfig()
  const [formData, setFormData] = useState({
    type: 'fixo' as 'fixo' | 'parcelado' | 'unico',
    name: '',
    category: 'geral',
    amount: 0,
    paid_by: 'conjunto' as 'person1' | 'person2' | 'vr' | 'conjunto',
    total_installments: 1,
    paid_installments: 0,
    first_due_date: '',
    due_date: '',
    notes: '',
  })

  useEffect(() => {
    if (expense) {
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
        notes: expense.notes || '',
      })
    } else {
      // Resetar formulário quando não há expense (criar novo)
      setFormData({
        type: 'fixo' as 'fixo' | 'parcelado' | 'unico',
        name: '',
        category: 'geral',
        amount: 0,
        paid_by: 'conjunto' as 'person1' | 'person2' | 'vr' | 'conjunto',
        total_installments: 1,
        paid_installments: 0,
        first_due_date: '',
        due_date: '',
        notes: '',
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {expense && expense.id ? 'Editar Gasto' : 'Novo Gasto'}
        </h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Gasto
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fixo' | 'parcelado' | 'unico' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fixo">Gasto Fixo Mensal</option>
              <option value="parcelado">Compra Parcelada</option>
              <option value="unico">Gasto Único (Cartão, Fatura, etc.)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pago Por
            </label>
            <select
              value={formData.paid_by}
              onChange={(e) => setFormData({ ...formData, paid_by: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="conjunto">{getConfigValue('conjunto_label') || 'Salário Conjunto'}</option>
              <option value="person1">{getConfigValue('person1_name') || 'Pessoa 1'}</option>
              <option value="person2">{getConfigValue('person2_name') || 'Pessoa 2'}</option>
              <option value="vr">{getConfigValue('vr_label') || 'Vale Refeição (VR)'}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Moradia, Transporte, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome/Descrição
          </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={formData.type === 'parcelado' ? 'Ex: Notebook, Geladeira, Sofá, etc.' : 'Ex: Aluguel, Cartão, etc.'}
                required
              />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.type === 'fixo'
                ? 'Valor mensal do gasto.'
                : formData.type === 'parcelado'
                ? 'Valor total da compra. Será dividido automaticamente pelo número de parcelas.'
                : 'Valor único do gasto (ex: fatura de cartão, conta pontual).'}
            </p>
          </div>

          {formData.type === 'parcelado' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número Total de Parcelas
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_installments}
                  onChange={(e) => {
                    const total = parseInt(e.target.value) || 1
                    const paid = Math.min(formData.paid_installments, total)
                    setFormData({ ...formData, total_installments: total, paid_installments: paid })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parcelas Já Pagas
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.total_installments}
                  value={formData.paid_installments}
                  onChange={(e) => {
                    const paid = Math.min(parseInt(e.target.value) || 0, formData.total_installments)
                    setFormData({ ...formData, paid_installments: paid })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informe quantas parcelas já foram pagas (0 se for uma compra nova)
                </p>
              </div>
            </>
          )}
        </div>

        {formData.type === 'parcelado' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Primeira Parcela
              </label>
              <input
                type="date"
                value={formData.first_due_date}
                onChange={(e) => setFormData({ ...formData, first_due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Resumo do Parcelamento */}
            {formData.amount > 0 && formData.total_installments > 0 && formData.first_due_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="text-blue-600" size={20} />
                  <h4 className="font-semibold text-blue-900">Resumo do Parcelamento</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Valor Total:</span>
                    <span className="font-bold text-gray-900">
                      R$ {formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total de Parcelas:</span>
                    <span className="font-semibold text-gray-900">{formData.total_installments}x</span>
                  </div>
                  {formData.paid_installments > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Parcelas Pagas:</span>
                      <span className="font-semibold text-green-700">{formData.paid_installments}x</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Parcelas Pendentes:</span>
                    <span className="font-semibold text-orange-700">{formData.total_installments - formData.paid_installments}x</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                    <span className="text-sm font-medium text-blue-900">Valor por Parcela:</span>
                    <span className="font-bold text-lg text-blue-700">
                      R$ {(formData.amount / formData.total_installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {formData.paid_installments > 0 && (
                    <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                      <span className="text-sm font-medium text-green-900">Total Já Pago:</span>
                      <span className="font-bold text-lg text-green-700">
                        R$ {((formData.amount / formData.total_installments) * formData.paid_installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  
                  {/* Preview das Parcelas */}
                  {formData.total_installments <= 12 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-blue-600" size={16} />
                        <span className="text-xs font-semibold text-blue-900">Preview das Parcelas:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {Array.from({ length: Math.min(formData.total_installments, 6) }).map((_, index) => {
                          const dueDate = addMonths(new Date(formData.first_due_date), index)
                          const installmentAmount = formData.amount / formData.total_installments
                          const isPaid = index < formData.paid_installments
                          return (
                            <div 
                              key={index} 
                              className={`rounded p-2 border ${
                                isPaid 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-blue-100'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${isPaid ? 'text-green-700' : 'text-gray-700'}`}>
                                  Parcela {index + 1}
                                </p>
                                {isPaid && (
                                  <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-semibold">
                                    Paga
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <p className={`text-xs font-bold mt-1 ${isPaid ? 'text-green-700' : 'text-blue-700'}`}>
                                R$ {installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          )
                        })}
                        {formData.total_installments > 6 && (
                          <div className="bg-gray-100 rounded p-2 border border-gray-200 flex items-center justify-center">
                            <p className="text-xs text-gray-500">
                              + {formData.total_installments - 6} parcelas
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {formData.type === 'unico' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Data em que este gasto deve ser pago (aparecerá na projeção apenas neste mês)
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Informações adicionais..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
          >
            {expense ? 'Atualizar' : 'Criar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

