'use client'

import { useState } from 'react'
import { Expense, Installment } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import ExpenseList from './ExpenseList'

interface ExpenseListWithTabsProps {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit: (expense: Expense) => void
  onRefresh: () => void
}

type TabType = 'total' | 'person1' | 'person2'

export default function ExpenseListWithTabs({ expenses, onDelete, onEdit, onRefresh }: ExpenseListWithTabsProps) {
  const { getConfigValue } = useConfig()
  const [activeTab, setActiveTab] = useState<TabType>('total')

  const tabs = [
    { id: 'total' as TabType, label: 'Total Geral' },
    { id: 'person1' as TabType, label: getConfigValue('person1_name') || 'Pessoa 1' },
    { id: 'person2' as TabType, label: getConfigValue('person2_name') || 'Pessoa 2' },
  ]

  // Filtrar gastos por pessoa
  let filteredExpenses = expenses
  if (activeTab === 'person1' || activeTab === 'person2') {
    filteredExpenses = expenses.filter(expense => expense.paid_by === activeTab)
  }

  return (
    <div>
      {/* Abas */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Gastos */}
      <ExpenseList
        expenses={filteredExpenses}
        onDelete={onDelete}
        onEdit={onEdit}
        onRefresh={onRefresh}
      />
    </div>
  )
}

