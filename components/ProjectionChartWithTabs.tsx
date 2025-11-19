'use client'

import { useState } from 'react'
import { Salary, Expense, Installment } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import ProjectionChart from './ProjectionChart'

interface ProjectionChartWithTabsProps {
  salaries: Salary[]
  expenses: Expense[]
  installments: Installment[]
}

type TabType = 'total' | 'person1' | 'person2' | 'vr'

export default function ProjectionChartWithTabs({ salaries, expenses, installments }: ProjectionChartWithTabsProps) {
  const { getConfigValue } = useConfig()
  const [activeTab, setActiveTab] = useState<TabType>('total')

  const tabs = [
    { id: 'total' as TabType, label: 'Total Geral' },
    { id: 'person1' as TabType, label: getConfigValue('person1_name') || 'Pessoa 1' },
    { id: 'person2' as TabType, label: getConfigValue('person2_name') || 'Pessoa 2' },
    { id: 'vr' as TabType, label: getConfigValue('vr_label') || 'Vale Refeição (VR)' },
  ]

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

      {/* Conteúdo do Gráfico */}
      <ProjectionChart
        salaries={salaries}
        expenses={expenses}
        installments={installments}
        filterByPerson={activeTab}
      />
    </div>
  )
}
