'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Salary, Expense, Installment } from '@/lib/supabase'
import { useConfig } from '@/contexts/ConfigContext'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProjectionChartProps {
  salaries: Salary[]
  expenses: Expense[]
  installments: Installment[]
}

interface ChartData {
  month: string
  total: number
  expenses: number
}

export default function ProjectionChart({ salaries, expenses, installments }: ProjectionChartProps) {
  const { getConfigValue } = useConfig()
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // Calcular valor médio total de todos os salários
    const allSalaries = salaries
    const avgTotal = allSalaries.length > 0
      ? allSalaries.reduce((sum, s) => sum + s.value, 0) / allSalaries.length
      : 0

    // Calcular despesas fixas
    const recurringExpenses = expenses
      .filter(expense => expense.type === 'fixo')
      .reduce((sum, expense) => sum + expense.amount, 0)

    // Filtrar parcelas pendentes
    const parcelInstallments = installments.filter(inst => inst.status !== 'paid')

    const projection: ChartData[] = []
    const today = new Date()

    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(today, i)
      const monthLabel = format(monthDate, 'MMM/yyyy', { locale: ptBR })

      // Calcular parcelas deste mês
      const monthInstallments = parcelInstallments
        .filter(inst => {
          const instDate = new Date(inst.due_date)
          return instDate.getMonth() === monthDate.getMonth() && instDate.getFullYear() === monthDate.getFullYear()
        })
        .reduce((sum, inst) => sum + inst.amount, 0)
      
      // Total de despesas do mês (fixas + parcelas)
      const expensesValue = recurringExpenses + monthInstallments

      projection.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        total: avgTotal,
        expenses: expensesValue,
      })
    }

    setChartData(projection)
  }, [salaries, expenses, installments])

  const hasData = chartData.some(item => item.total > 0 || item.expenses > 0)

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
            dataKey="total"
            name={getConfigValue('total_geral_label') || 'Total'}
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
