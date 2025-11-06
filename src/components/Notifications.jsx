import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Mail, Settings } from 'lucide-react';

export default function Notifications({ user }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    weeklyReport: true,
    budgetAlerts: true,
    largeExpenseAlerts: true
  });
  const [budgetLimit, setBudgetLimit] = useState(1000);

  // Check for budget alerts
  useEffect(() => {
    checkBudgetAlerts();
  }, []);

  const checkBudgetAlerts = async () => {
    // Get current month's expenses
    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('amount, category, date')
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0])
      .eq('user_id', user.id);

    if (error) return;

    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // Check if exceeded budget
    if (settings.budgetAlerts && totalExpenses > budgetLimit) {
      sendEmailNotification(
        user.email,
        '💰 Budget Alert - EduWallet',
        `You have exceeded your monthly budget limit of ₹${budgetLimit}. Current spending: ₹${totalExpenses.toFixed(2)}`
      );
    }

    // Check for large expenses
    if (settings.largeExpenseAlerts) {
      expenses.forEach(expense => {
        if (parseFloat(expense.amount) > 500) { // Alert for expenses over ₹500
          sendEmailNotification(
            user.email,
            '⚠️ Large Expense Alert - EduWallet',
            `Large expense recorded: ₹${expense.amount} for ${expense.category} on ${new Date(expense.date).toLocaleDateString()}`
          );
        }
      });
    }
  };

  const sendEmailNotification = async (to, subject, message) => {
    // For now, we'll use alert. In production, you'd use a backend service
    if (settings.emailNotifications) {
      alert(`📧 Notification:\n${subject}\n\n${message}`);
      
      // In production, you would call your backend API here:
      // await fetch('/api/send-email', {
      //   method: 'POST',
      //   body: JSON.stringify({ to, subject, message }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
    }
  };

  const sendWeeklyReport = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category')
      .gte('date', oneWeekAgo.toISOString().split('T')[0])
      .eq('user_id', user.id);

    const { data: incomes } = await supabase
      .from('income')
      .select('amount, source')
      .gte('date', oneWeekAgo.toISOString().split('T')[0])
      .eq('user_id', user.id);

    const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
    const totalIncome = incomes?.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
    const savings = totalIncome - totalExpenses;

    const message = `
📊 Weekly Financial Report - EduWallet

Income: ₹${totalIncome.toFixed(2)}
Expenses: ₹${totalExpenses.toFixed(2)}
Savings: ₹${savings.toFixed(2)}

${savings >= 0 ? '✅ Great job saving money!' : '⚠️ Watch your spending!'}
    `;

    sendEmailNotification(user.email, '📊 Your Weekly Financial Report', message);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-6">
        <Bell className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h2>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Notification Settings
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({...prev, emailNotifications: e.target.checked}))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">Enable Email Notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.weeklyReport}
                onChange={(e) => setSettings(prev => ({...prev, weeklyReport: e.target.checked}))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">Weekly Financial Reports</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={(e) => setSettings(prev => ({...prev, budgetAlerts: e.target.checked}))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">Budget Limit Alerts</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.largeExpenseAlerts}
                onChange={(e) => setSettings(prev => ({...prev, largeExpenseAlerts: e.target.checked}))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">Large Expense Alerts (₹500+)</span>
            </label>
          </div>
        </div>

        {/* Budget Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Budget Settings</h3>
          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Budget Limit
              </span>
              <input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(parseFloat(e.target.value))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="1000"
              />
            </label>
          </div>
        </div>

        {/* Manual Triggers */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Test Notifications</h3>
          <div className="space-x-4">
            <button
              onClick={sendWeeklyReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Send Weekly Report
            </button>
            <button
              onClick={checkBudgetAlerts}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Check Budget Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}