'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Salary, Expense, Installment } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getMonthlyProjections } from '@/lib/projections'

interface ProjectionChartProps {
  salaries: Salary[]
  expenses: Expense[]
  installments: Installment[]
  monthlyProjections?: { [key: string]: { conjunto: number; expenses: number } }
  onEditProjection?: (year: number, month: number) => void
}

interface ChartData {
  month: string
  conjunto: number
  expenses: number
}

export default function ProjectionChart({ salaries, expenses, installments, monthlyProjections, onEditProjection }: ProjectionChartProps) {
  const { getConfigValue } = useConfig()
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // Calcular valor médio apenas de salários conjuntos (padrão)
    const conjuntoSalaries = salaries.filter(s => s.person === 'conjunto')
    const avgConjunto = conjuntoSalaries.length > 0
      ? conjuntoSalaries.reduce((sum, s) => sum + s.value, 0) / conjuntoSalaries.length
      : 0

    // Calcular despesas fixas (padrão)
    const recurringExpenses = expenses
      .filter(expense => expense.type === 'fixo')
      .reduce((sum, expense) => sum + expense.amount, 0)

    // Filtrar parcelas pendentes
    const parcelInstallments = installments.filter(inst => inst.status !== 'paid')

    const projection: ChartData[] = []
    const today = new Date()

    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(today, i)
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth() + 1
      const monthLabel = format(monthDate, 'MMM/yyyy', { locale: ptBR })
      const projectionKey = `${year}-${month}`

      // Verificar se existe projeção customizada para este mês
      let conjuntoValue = avgConjunto
      let expensesValue = recurringExpenses

      if (monthlyProjections && monthlyProjections[projectionKey]) {
        // Usar valores customizados se disponíveis
        conjuntoValue = monthlyProjections[projectionKey].conjunto
        expensesValue = monthlyProjections[projectionKey].expenses
      } else {
        // Usar valores calculados automaticamente
        // Calcular parcelas deste mês
        const monthInstallments = parcelInstallments
          .filter(inst => {
            const instDate = new Date(inst.due_date)
            return instDate.getMonth() === monthDate.getMonth() && instDate.getFullYear() === monthDate.getFullYear()
          })
          .reduce((sum, inst) => sum + inst.amount, 0)
        
        // Total de despesas do mês (fixas + parcelas)
        expensesValue = recurringExpenses + monthInstallments
      }

      projection.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        conjunto: conjuntoValue,
        expenses: expensesValue,
      })
    }

    setChartData(projection)
  }, [salaries, expenses, installments, monthlyProjections])

  const hasData = chartData.some(item => item.conjunto > 0 || item.expenses > 0)

  if (!hasData) {
    return (
      <div className="text-center py-8 text-gray-500">
        {getConfigValue('empty_projection_message') || 'Adicione pelo menos um salário para ver a projeção'}
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number, name) => [
              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              name as string,
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="conjunto"
            name={getConfigValue('conjunto_label') || 'Salário Conjunto'}
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Despesas"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
