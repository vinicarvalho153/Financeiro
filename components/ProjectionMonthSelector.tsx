'use client'

import { useState } from 'react'
import { Calendar, Edit } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectionMonthSelectorProps {
  onSelectMonth: (year: number, month: number) => void
}

export default function ProjectionMonthSelector({ onSelectMonth }: ProjectionMonthSelectorProps) {
  const today = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = addMonths(today, i)
    return {
      year: monthDate.getFullYear(),
      month: monthDate.getMonth() + 1,
      label: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
      shortLabel: format(monthDate, 'MMM/yyyy', { locale: ptBR }),
    }
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {months.map((m) => (
        <button
          key={`${m.year}-${m.month}`}
          onClick={() => onSelectMonth(m.year, m.month)}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 group-hover:text-blue-600" size={18} />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-900">
              {m.shortLabel.charAt(0).toUpperCase() + m.shortLabel.slice(1)}
            </span>
          </div>
          <Edit className="text-gray-300 group-hover:text-blue-600" size={16} />
        </button>
      ))}
    </div>
  )
}

