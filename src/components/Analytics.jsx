import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Analytics({ user }) {
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [timeRange, setTimeRange] = useState('month')

  useEffect(() => {
    fetchData()
  }, [user, timeRange])

  const fetchData = async () => {
    // Fetch incomes and expenses for analytics
    const [incomesResult, expensesResult] = await Promise.all([
      supabase.from('income').select('*'),
      supabase.from('expenses').select('*')
    ])

    setIncomes(incomesResult.data || [])
    setExpenses(expensesResult.data || [])
  }

  // Calculate analytics data
  const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)
  const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
  const netSavings = totalIncome - totalExpense

  // Expense by category
  const expenseByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += parseFloat(expense.amount)
    return acc
  }, {})

  const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value
  }))

  // Income by source
  const incomeBySource = incomes.reduce((acc, income) => {
    const source = income.source
    if (!acc[source]) {
      acc[source] = 0
    }
    acc[source] += parseFloat(income.amount)
    return acc
  }, {})

  const barChartData = Object.entries(incomeBySource).map(([name, value]) => ({
    name,
    income: value
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">₹{totalExpense.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Net Savings</h3>
          <p className={`text-3xl font-bold ${netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ₹{netSavings.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              No expense data available
            </div>
          )}
        </div>

        {/* Income by Source Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Income by Source</h3>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Income']} />
                <Bar dataKey="income" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              No income data available
            </div>
          )}
        </div>
      </div>

      {/* Spending Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Spending Insights</h3>
        <div className="space-y-4">
          {pieChartData.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{category.value.toFixed(2)}</div>
                <div className="text-sm text-gray-500">
                  {((category.value / totalExpense) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
          ))}
          
          {pieChartData.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No spending data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}