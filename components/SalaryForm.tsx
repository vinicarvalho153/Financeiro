'use client'

import { useState, useEffect } from 'react'
import { Salary } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import { X } from 'lucide-react'

interface SalaryFormProps {
  salary?: Salary | null
  onSubmit: (data: Omit<Salary, 'id' | 'created_at' | 'updated_at'>) => void | Promise<void>
  onCancel: () => void
}

export default function SalaryForm({ salary, onSubmit, onCancel }: SalaryFormProps) {
  const { getConfigValue } = useConfig()
  const [formData, setFormData] = useState({
    person: 'conjunto' as 'person1' | 'person2' | 'conjunto' | 'vr',
    name: '',
    value: 0,
  })

  useEffect(() => {
    if (salary) {
      setFormData({
        person: salary.person,
        name: salary.name,
        value: salary.value,
      })
    }
  }, [salary])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {salary ? 'Editar Salário' : 'Novo Salário'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getConfigValue('salary_type_label') || 'Tipo de Salário'}
          </label>
          <select
            value={formData.person}
            onChange={(e) => setFormData({ ...formData, person: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="conjunto">{getConfigValue('conjunto_label') || 'Salário Conjunto'}</option>
            <option value="person1">{getConfigValue('person1_name') || 'Pessoa 1'}</option>
            <option value="person2">{getConfigValue('person2_name') || 'Pessoa 2'}</option>
            <option value="vr">{getConfigValue('vr_label') || 'Vale Refeição (VR)'}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getConfigValue('salary_name_label') || 'Nome/Descrição'}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Salário Mensal, 13º Salário, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getConfigValue('salary_value_label') || 'Valor (R$)'}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
          >
            {salary ? 'Atualizar' : 'Criar'}
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
