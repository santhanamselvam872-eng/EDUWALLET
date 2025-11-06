import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

export default function Income({ user }) {
  const [incomes, setIncomes] = useState([])
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchIncomes()
  }, [user])

  const fetchIncomes = async () => {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching incomes:', error)
    } else {
      setIncomes(data || [])
    }
  }

  const addIncome = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('income')
      .insert([
        {
          user_id: user.id,
          amount: parseFloat(amount),
          source,
          description,
          date: new Date().toISOString().split('T')[0]
        }
      ])

    if (error) {
      alert('Error adding income: ' + error.message)
    } else {
      setAmount('')
      setSource('')
      setDescription('')
      fetchIncomes()
    }
  }

  const deleteIncome = async (id) => {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting income: ' + error.message)
    } else {
      fetchIncomes()
    }
  }

  const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Income</h2>
        <form onSubmit={addIncome} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <input
                type="text"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Salary, Freelance, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Optional description"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Income History</h2>
          <div className="text-lg font-semibold text-green-600">
            Total: ₹{totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="space-y-3">
          {incomes.map((income) => (
            <div key={income.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{income.source}</div>
                <div className="text-sm text-gray-500">{income.description}</div>
                <div className="text-sm text-gray-400">
                  {new Date(income.date).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-green-600">
                  ₹{parseFloat(income.amount).toFixed(2)}
                </div>
                <button
                  onClick={() => deleteIncome(income.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {incomes.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No income records yet. Add your first income above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}