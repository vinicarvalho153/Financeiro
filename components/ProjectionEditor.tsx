'use client'

import { useState, useEffect } from 'react'
import { X, Save, Calendar } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MonthlyProjection } from '@/lib/supabase'
import { upsertMonthlyProjection } from '@/lib/projections'
import { useConfig } from '@/contexts/ConfigContext'

interface ProjectionEditorProps {
  year: number
  month: number
  initialProjection?: MonthlyProjection | null
  defaultConjunto: number
  defaultExpenses: number
  onSave: () => void
  onCancel: () => void
}

export default function ProjectionEditor({
  year,
  month,
  initialProjection,
  defaultConjunto,
  defaultExpenses,
  onSave,
  onCancel,
}: ProjectionEditorProps) {
  const { getConfigValue } = useConfig()
  const [formData, setFormData] = useState({
    conjunto: initialProjection?.conjunto ?? defaultConjunto,
    expenses: initialProjection?.expenses ?? defaultExpenses,
  })
  const [saving, setSaving] = useState(false)

  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await upsertMonthlyProjection({
        year,
        month,
        conjunto: formData.conjunto,
        expenses: formData.expenses,
      })
      onSave()
    } catch (error) {
      console.error('Erro ao salvar projeção:', error)
      alert('Erro ao salvar projeção. Verifique o console para mais detalhes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold text-gray-900">
            Editar Projeção - {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          </h3>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900">
            💡 Defina valores personalizados para este mês. Os valores padrão são apenas para referência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getConfigValue('conjunto_label') || 'Salário Conjunto'} (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.conjunto}
              onChange={(e) => setFormData({ ...formData, conjunto: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Padrão: R$ {defaultConjunto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Despesas (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.expenses}
              onChange={(e) => setFormData({ ...formData, expenses: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Padrão: R$ {defaultExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Projeção'}
          </button>
        </div>
      </form>
    </div>
  )
}

