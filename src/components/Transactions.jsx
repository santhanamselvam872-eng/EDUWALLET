import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function Transactions({ user }) {
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    // Fetch both incomes and expenses
    const [incomesResult, expensesResult] = await Promise.all([
      supabase.from('income').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false })
    ])

    const incomeTransactions = (incomesResult.data || []).map(income => ({
      ...income,
      type: 'income',
      date: income.date
    }))

    const expenseTransactions = (expensesResult.data || []).map(expense => ({
      ...expense,
      type: 'expense',
      date: expense.date
    }))

    // Combine and sort by date
    const allTransactions = [...incomeTransactions, ...expenseTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    setTransactions(allTransactions)
  }

  const getTransactionTitle = (transaction) => {
    return transaction.type === 'income' 
      ? `Income: ${transaction.source}`
      : `Expense: ${transaction.category}`
  }

  const getTransactionDescription = (transaction) => {
    return transaction.description || (transaction.type === 'income' ? 'Income' : 'Expense')
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Transactions</h2>
      
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={`${transaction.type}-${transaction.id}`} className="flex justify-between items-center p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {transaction.type === 'income' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {getTransactionTitle(transaction)}
                </div>
                <div className="text-sm text-gray-500">
                  {getTransactionDescription(transaction)}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(transaction.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className={`text-lg font-semibold ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}₹{parseFloat(transaction.amount).toFixed(2)}
            </div>
          </div>
        ))}
        
        {transactions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No transactions yet. Start adding income and expenses!
          </div>
        )}
      </div>
    </div>
  )
}