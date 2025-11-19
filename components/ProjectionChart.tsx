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
  net: number
  pessoa1: number
  pessoa2: number
  conjunto: number
  vr: number
}

export default function ProjectionChart({ salaries, expenses, installments }: ProjectionChartProps) {
  const { getConfigValue } = useConfig()
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // Calcular valores médios por tipo
    const conjuntoSalaries = salaries.filter(s => s.person === 'conjunto')
    const person1Salaries = salaries.filter(s => s.person === 'person1')
    const person2Salaries = salaries.filter(s => s.person === 'person2')
    const vrSalaries = salaries.filter(s => s.person === 'vr')

    const avgConjunto = conjuntoSalaries.length > 0
      ? conjuntoSalaries.reduce((sum, s) => sum + s.value, 0) / conjuntoSalaries.length
      : 0

    const avgPerson1 = person1Salaries.length > 0
      ? person1Salaries.reduce((sum, s) => sum + s.value, 0) / person1Salaries.length
      : 0

    const avgPerson2 = person2Salaries.length > 0
      ? person2Salaries.reduce((sum, s) => sum + s.value, 0) / person2Salaries.length
      : 0

    const avgVR = vrSalaries.length > 0
      ? vrSalaries.reduce((sum, s) => sum + s.value, 0) / vrSalaries.length
      : 0

    const recurringExpenses = expenses
      .filter(expense => expense.type === 'fixo')
      .reduce((sum, expense) => sum + expense.amount, 0)

    const parcelInstallments = installments.filter(inst => inst.status !== 'paid')

    const projection: ChartData[] = []
    const today = new Date()

    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(today, i)
      const monthLabel = format(monthDate, 'MMM/yyyy', { locale: ptBR })
      const totalIncome = avgConjunto + avgPerson1 + avgPerson2 + avgVR

      const monthInstallments = parcelInstallments
        .filter(inst => {
          const instDate = new Date(inst.due_date)
          return instDate.getMonth() === monthDate.getMonth() && instDate.getFullYear() === monthDate.getFullYear()
        })
        .reduce((sum, inst) => sum + inst.amount, 0)

      const totalExpenses = recurringExpenses + monthInstallments
      const net = totalIncome - totalExpenses

      projection.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        total: totalIncome,
        expenses: totalExpenses,
        net,
        pessoa1: avgPerson1,
        pessoa2: avgPerson2,
        conjunto: avgConjunto,
        vr: avgVR,
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
            name={getConfigValue('total_geral_label') || 'Total Receitas'}
            stroke="#1f2937"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Despesas"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Saldo"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 0 }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="conjunto"
            name={getConfigValue('conjunto_label') || 'Salário Conjunto'}
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="pessoa1"
            name={getConfigValue('person1_name') || 'Pessoa 1'}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="pessoa2"
            name={getConfigValue('person2_name') || 'Pessoa 2'}
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="vr"
            name={getConfigValue('vr_label') || 'Vale Refeição (VR)'}
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
