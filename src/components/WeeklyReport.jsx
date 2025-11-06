import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendWeeklyReport } from '../utils/emailService';

export default function WeeklyReport({ user }) {
  const [loading, setLoading] = useState(false);

  const generateWeeklyReport = async () => {
    setLoading(true);
    
    try {
      // Get data from last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [incomesResult, expensesResult, goalsResult] = await Promise.all([
        supabase.from('income').select('amount, source').gte('date', oneWeekAgo.toISOString().split('T')[0]).eq('user_id', user.id),
        supabase.from('expenses').select('amount, category').gte('date', oneWeekAgo.toISOString().split('T')[0]).eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id)
      ]);

      const totalIncome = incomesResult.data?.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
      const totalExpenses = expensesResult.data?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
      const savings = totalIncome - totalExpenses;

      // Calculate category spending
      const categorySpending = expensesResult.data?.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
      }, {});

      const topCategories = Object.entries(categorySpending || {})
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      const goalsProgress = goalsResult.data || [];

      const reportData = {
        totalIncome,
        totalExpenses,
        savings,
        topCategories,
        goalsProgress
      };

      const emailSent = await sendWeeklyReport(user, reportData);
      
      if (emailSent) {
        alert('📧 Weekly report sent to your email! Check your inbox.');
      } else {
        alert('❌ Failed to send email. Make sure Netlify server is running.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Email Reports</h2>
      <div className="space-y-4">
        <p className="text-gray-600">
          Get a detailed weekly financial report delivered to your email with:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Income vs Expenses summary</li>
          <li>Spending breakdown by category</li>
          <li>Goals progress tracking</li>
          <li>Financial tips and insights</li>
        </ul>
        
        <button
          onClick={generateWeeklyReport}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
        >
          {loading ? 'Sending Report...' : '📧 Send Weekly Report to My Email'}
        </button>
        
        <p className="text-sm text-gray-500">
          Note: Run <code>netlify dev</code> to test emails locally
        </p>
      </div>
    </div>
  );
}