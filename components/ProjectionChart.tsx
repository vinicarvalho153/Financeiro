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
  filterByPerson?: 'person1' | 'person2' | 'vr' | 'total'
}

interface ChartData {
  month: string
  total: number
  expenses: number
  net: number
}

export default function ProjectionChart({ salaries, expenses, installments, filterByPerson = 'total' }: ProjectionChartProps) {
  const { getConfigValue } = useConfig()
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // Filtrar salários por pessoa ou somar todos
    let filteredSalaries: Salary[]
    if (filterByPerson === 'person1' || filterByPerson === 'person2' || filterByPerson === 'vr') {
      filteredSalaries = salaries.filter(s => s.person === filterByPerson)
    } else {
      filteredSalaries = salaries
    }
    const totalSalaries = filteredSalaries.reduce((sum, s) => sum + s.value, 0)

    // Calcular despesas fixas filtradas por pessoa
    let filteredExpenses = expenses
    if (filterByPerson === 'person1' || filterByPerson === 'person2' || filterByPerson === 'vr') {
      filteredExpenses = expenses.filter(expense => expense.paid_by === filterByPerson)
    }
    
    const recurringExpenses = filteredExpenses
      .filter(expense => expense.type === 'fixo')
      .reduce((sum, expense) => sum + expense.amount, 0)

    // Separar gastos únicos por mês
    const uniqueExpenses = filteredExpenses.filter(expense => expense.type === 'unico')

    console.log('📊 Gráfico - Despesas fixas:', recurringExpenses, '| Total de expenses:', filteredExpenses.length)
    console.log('📊 Gráfico - Parcelas:', installments.length, '| Pendentes:', installments.filter(inst => inst.status !== 'paid').length)
    console.log('📊 Gráfico - Gastos únicos:', uniqueExpenses.length)

    // Filtrar parcelas pendentes e por pessoa (através da relação com expense)
    let pendingInstallments = installments.filter(inst => inst.status !== 'paid')
    
    // Criar um mapa de expense_id -> expense para busca rápida
    const expenseMap = new Map(expenses.map(e => [e.id, e]))
    
    let filteredInstallments = pendingInstallments
    if (filterByPerson === 'person1' || filterByPerson === 'person2' || filterByPerson === 'vr') {
      // Filtrar parcelas que pertencem a despesas pagas pela pessoa
      filteredInstallments = pendingInstallments.filter(inst => {
        const expense = expenseMap.get(inst.expense_id)
        return expense && expense.paid_by === filterByPerson
      })
    }
    const parcelInstallments = filteredInstallments

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
      
      // Calcular gastos únicos deste mês
      const monthUniqueExpenses = uniqueExpenses
        .filter(expense => {
          if (!expense.due_date) return false
          const expenseDate = new Date(expense.due_date)
          return expenseDate.getMonth() === monthDate.getMonth() && expenseDate.getFullYear() === monthDate.getFullYear()
        })
        .reduce((sum, expense) => sum + expense.amount, 0)
      
      // Total de despesas do mês (fixas + parcelas + gastos únicos)
      const expensesValue = recurringExpenses + monthInstallments + monthUniqueExpenses
      
      // Saldo do mês (total - despesas)
      const netValue = totalSalaries - expensesValue

      projection.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        total: totalSalaries,
        expenses: expensesValue,
        net: netValue,
      })
    }

    setChartData(projection)
  }, [salaries, expenses, installments, filterByPerson])

  const hasData = chartData.some(item => item.total > 0 || item.expenses > 0 || item.net !== 0)

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
            dataKey="net"
            name="Saldo"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
