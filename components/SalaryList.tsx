'use client'

import { Salary } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import { Edit, Trash2, User, Users } from 'lucide-react'

interface SalaryListProps {
  salaries: Salary[]
  onEdit: (salary: Salary) => void
  onDelete: (id: string) => void
}

export default function SalaryList({ salaries, onEdit, onDelete }: SalaryListProps) {
  const { getConfigValue } = useConfig()

  const getPersonLabel = (person: string) => {
    switch (person) {
      case 'conjunto':
        return getConfigValue('conjunto_label') || 'Conjunto'
      case 'person1':
        return getConfigValue('person1_name') || 'Pessoa 1'
      case 'person2':
        return getConfigValue('person2_name') || 'Pessoa 2'
      case 'vr':
        return getConfigValue('vr_label') || 'Vale Refeição (VR)'
      default:
        return person
    }
  }

  const getPersonColor = (person: string) => {
    switch (person) {
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

  const getPersonIcon = (person: string) => {
    if (person === 'conjunto') return <Users size={16} />
    if (person === 'vr') return <User size={16} />
    return <User size={16} />
  }

  if (salaries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {getConfigValue('empty_salaries_message') || 'Nenhum salário cadastrado ainda. Clique em "Adicionar Salário" para começar.'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome/Descrição
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data de Criação
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {salaries.map((salary) => (
            <tr key={salary.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getPersonColor(salary.person)}`}>
                  {getPersonIcon(salary.person)}
                  {getPersonLabel(salary.person)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{salary.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  R$ {salary.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {salary.created_at
                  ? new Date(salary.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(salary)}
                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => salary.id && onDelete(salary.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
