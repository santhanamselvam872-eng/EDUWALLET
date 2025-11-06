import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2 } from 'lucide-react'
import { sendLargeExpenseAlert, sendBudgetAlert } from '../utils/emailService';

export default function Expense({ user }) {
  const [expenses, setExpenses] = useState([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  // Category-specific thresholds
  const categoryThresholds = {
    'Food': 300,        // Alert if food expense > ₹300
    'Transport': 200,   // Alert if transport > ₹200
    'Entertainment': 400, // Alert if entertainment > ₹400
    'Education': 1000,  // Education can be higher
    'Shopping': 500,    // Shopping alert at ₹500
    'Bills': 800,       // Bills can be higher
    'Healthcare': 600,  // Healthcare alert at ₹600
    'Other': 500        // Default threshold
  }

  const categories = Object.keys(categoryThresholds)

  useEffect(() => {
    fetchExpenses()
  }, [user])

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching expenses:', error)
    } else {
      setExpenses(data || [])
    }
  }

  const addExpense = async (e) => {
    e.preventDefault();
    
    // Request notification permission on first expense
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const { error } = await supabase
      .from('expenses')
      .insert([
        {
          user_id: user.id,
          amount: parseFloat(amount),
          category,
          description,
          date: new Date().toISOString().split('T')[0]
        }
      ]);

    if (error) {
      alert('Error adding expense: ' + error.message);
    } else {
      // 1. Large Expense Email Alert
      const threshold = categoryThresholds[category] || 500;
      
      if (parseFloat(amount) > threshold) {
        // Chrome notification
        if (Notification.permission === "granted") {
          new Notification(`💰 ${category} Expense Alert`, {
            body: `You spent ₹${amount} on ${category}. Your limit is ₹${threshold}.`,
            icon: "/favicon.svg"
          });
        } else {
          alert(`⚠️ ${category} Expense Alert: ₹${amount} (Limit: ₹${threshold})`);
        }
        
        // Email alert
        try {
          await sendLargeExpenseAlert(user, {
            amount: parseFloat(amount),
            category,
            description,
            date: new Date().toISOString().split('T')[0],
            threshold
          });
          console.log('✅ Large expense email sent');
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
        }
      }
      
      // 2. Budget Limit Email Alert
      const monthlyLimit = 1000;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', user.id)
        .gte('date', `${currentMonth}-01`)
        .lte('date', `${currentMonth}-31`);

      const totalMonthly = monthlyExpenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
      
      // Get top spending categories for email
      const categorySpending = monthlyExpenses?.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
      }, {});
      
      const topCategories = Object.entries(categorySpending || {})
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
      
      if (totalMonthly > monthlyLimit) {
        // Chrome notification
        if (Notification.permission === "granted") {
          new Notification("🚨 Monthly Budget Exceeded", {
            body: `You've spent ₹${totalMonthly.toFixed(2)} (Limit: ₹${monthlyLimit})`,
            icon: "/favicon.svg"
          });
        } else {
          alert(`🚨 Monthly Budget Exceeded! Total: ₹${totalMonthly.toFixed(2)} (Limit: ₹${monthlyLimit})`);
        }
        
        // Email alert
        try {
          await sendBudgetAlert(user, {
            currentSpending: totalMonthly,
            budgetLimit: monthlyLimit,
            overspentAmount: totalMonthly - monthlyLimit,
            topCategories
          });
          console.log('✅ Budget alert email sent');
        } catch (emailError) {
          console.error('❌ Failed to send budget email:', emailError);
        }
      }
      
      setAmount('');
      setCategory('');
      setDescription('');
      fetchExpenses();
    }
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting expense: ' + error.message)
    } else {
      fetchExpenses()
    }
  }

  const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Expense</h2>
        
        {/* Show category limits */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Category Spending Limits:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(categoryThresholds).map(([cat, limit]) => (
              <div key={cat} className="flex justify-between">
                <span>{cat}:</span>
                <span className="font-semibold">₹{limit}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={addExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount ₹</label>
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
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} (Limit: ₹{categoryThresholds[cat]})
                  </option>
                ))}
              </select>
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
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Expense History</h2>
          <div className="text-lg font-semibold text-red-600">
            Total: ₹{totalExpense.toFixed(2)}
          </div>
        </div>
        <div className="space-y-3">
          {expenses.map((expense) => {
            const threshold = categoryThresholds[expense.category] || 500;
            const isOverLimit = parseFloat(expense.amount) > threshold;
            
            return (
              <div key={expense.id} className={`flex justify-between items-center p-4 border rounded-lg ${
                isOverLimit ? 'bg-red-50 border-red-200' : ''
              }`}>
                <div>
                  <div className="font-medium text-gray-900 flex items-center">
                    {expense.category}
                    {isOverLimit && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Over Limit
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{expense.description}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-lg font-semibold ${
                    isOverLimit ? 'text-red-700' : 'text-red-600'
                  }`}>
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </div>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
          {expenses.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No expense records yet. Add your first expense above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}