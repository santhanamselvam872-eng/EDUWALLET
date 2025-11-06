import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Target, Trash2 } from 'lucide-react'

export default function Goals({ user }) {
  const [goals, setGoals] = useState([])
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')

  useEffect(() => {
    fetchGoals()
  }, [user])

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching goals:', error)
    } else {
      setGoals(data || [])
    }
  }

  const addGoal = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: user.id,
          title,
          target_amount: parseFloat(targetAmount),
          current_amount: parseFloat(currentAmount) || 0,
          target_date: targetDate
        }
      ])

    if (error) {
      alert('Error adding goal: ' + error.message)
    } else {
      setTitle('')
      setTargetAmount('')
      setTargetDate('')
      setCurrentAmount('')
      fetchGoals()
    }
  }

  const deleteGoal = async (id) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting goal: ' + error.message)
    } else {
      fetchGoals()
    }
  }

  const updateGoalProgress = async (id, newCurrentAmount) => {
    const { error } = await supabase
      .from('goals')
      .update({ current_amount: parseFloat(newCurrentAmount) })
      .eq('id', id)

    if (error) {
      alert('Error updating goal: ' + error.message)
    } else {
      fetchGoals()
    }
  }

  const getProgressPercentage = (goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  }

  const getDaysRemaining = (targetDate) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Goal</h2>
        <form onSubmit={addGoal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="e.g., New Laptop, Vacation, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Amount</label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Goals</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal)
            const daysRemaining = getDaysRemaining(goal.target_date)
            const amountNeeded = goal.target_amount - goal.current_amount

            return (
              <div key={goal.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                    <p className="text-sm text-gray-500">
                      Target: ₹{parseFloat(goal.target_amount).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress: ₹{parseFloat(goal.current_amount).toFixed(2)} / ₹{parseFloat(goal.target_amount).toFixed(2)}</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div>Target Date: {new Date(goal.target_date).toLocaleDateString()}</div>
                  <div>Days Remaining: {daysRemaining}</div>
                  <div className="font-medium">
                    Amount Needed: ₹{amountNeeded.toFixed(2)}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Progress
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={goal.current_amount}
                      onChange={(e) => updateGoalProgress(goal.id, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )
          })}
          
          {goals.length === 0 && (
            <div className="col-span-2 text-center text-gray-500 py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No goals yet. Create your first financial goal above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}