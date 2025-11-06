const API_BASE_URL = import.meta.env.VITE_NETLIFY_URL || 'http://localhost:8888';

export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const response = await fetch(`${API_BASE_URL}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Email sent successfully to:', to);
      return true;
    } else {
      console.error('❌ Email failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
};

// Weekly Report Email (keep your existing HTML templates)
export const sendWeeklyReport = async (user, reportData) => {
  const { totalIncome, totalExpenses, savings, topCategories, goalsProgress } = reportData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; color: white; text-align: center; }
        .content { padding: 20px; max-width: 600px; margin: 0 auto; }
        .card { background: #f8fafc; padding: 20px; border-radius: 10px; margin: 15px 0; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .stat-item { text-align: center; padding: 15px; background: white; border-radius: 8px; }
        .positive { color: #10b981; font-weight: bold; }
        .negative { color: #ef4444; font-weight: bold; }
        .category-bar { background: #e5e7eb; border-radius: 10px; margin: 5px 0; }
        .category-fill { background: #10b981; border-radius: 10px; padding: 5px; color: white; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Your Weekly Financial Report</h1>
        <p>EduWallet - Student Finance Tracker</p>
      </div>
      
      <div class="content">
        <div class="card">
          <h2>💰 Financial Summary</h2>
          <div class="stats">
            <div class="stat-item">
              <h3>Total Income</h3>
              <p class="positive">₹${totalIncome.toFixed(2)}</p>
            </div>
            <div class="stat-item">
              <h3>Total Expenses</h3>
              <p class="negative">₹${totalExpenses.toFixed(2)}</p>
            </div>
            <div class="stat-item">
              <h3>Net Savings</h3>
              <p class="${savings >= 0 ? 'positive' : 'negative'}">₹${savings.toFixed(2)}</p>
            </div>
            <div class="stat-item">
              <h3>Savings Rate</h3>
              <p class="${savings >= 0 ? 'positive' : 'negative'}">${((savings / totalIncome) * 100 || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>📈 Spending by Category</h2>
          ${topCategories.map(cat => `
            <div>
              <strong>${cat.category}:</strong> ₹${cat.amount.toFixed(2)}
              <div class="category-bar">
                <div class="category-fill" style="width: ${(cat.amount / totalExpenses) * 100}%">
                  ${((cat.amount / totalExpenses) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${goalsProgress.length > 0 ? `
        <div class="card">
          <h2>🎯 Goals Progress</h2>
          ${goalsProgress.map(goal => `
            <div style="margin: 10px 0;">
              <strong>${goal.title}:</strong> 
              ₹${goal.current_amount} / ₹${goal.target_amount} 
              (${((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%)
              <div class="category-bar">
                <div class="category-fill" style="width: ${(goal.current_amount / goal.target_amount) * 100}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="card">
          <h3>💡 Financial Tip</h3>
          <p>${savings >= 0 ? 
            'Great job! You\'re saving money. Consider investing your savings for long-term growth.' : 
            'Watch your spending! Try to reduce expenses in high-spending categories next week.'
          }</p>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated report from EduWallet</p>
        <p>To manage your notification settings, visit the app</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, '📊 Your Weekly Financial Report - EduWallet', html);
};

// Budget Alert Email
export const sendBudgetAlert = async (user, budgetData) => {
  const { currentSpending, budgetLimit, overspentAmount, topCategories } = budgetData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; color: white; text-align: center; }
        .content { padding: 20px; max-width: 600px; margin: 0 auto; }
        .alert { background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 5px solid #ef4444; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-item { text-align: center; padding: 15px; background: white; border-radius: 8px; }
        .tip { background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 5px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Budget Limit Exceeded</h1>
        <p>EduWallet - Budget Alert</p>
      </div>
      
      <div class="content">
        <div class="alert">
          <h2>Your monthly spending has exceeded the budget limit!</h2>
          
          <div class="stats">
            <div class="stat-item">
              <h3>Budget Limit</h3>
              <p>₹${budgetLimit}</p>
            </div>
            <div class="stat-item">
              <h3>Current Spending</h3>
              <p style="color: #ef4444; font-weight: bold;">₹${currentSpending.toFixed(2)}</p>
            </div>
            <div class="stat-item">
              <h3>Overspent By</h3>
              <p style="color: #ef4444; font-weight: bold;">₹${overspentAmount.toFixed(2)}</p>
            </div>
            <div class="stat-item">
              <h3>Overspent %</h3>
              <p style="color: #ef4444; font-weight: bold;">${((overspentAmount / budgetLimit) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div style="margin: 20px 0;">
          <h3>📊 Top Spending Categories</h3>
          ${topCategories.map(cat => `
            <div style="margin: 10px 0;">
              <strong>${cat.category}:</strong> ₹${cat.amount.toFixed(2)}
            </div>
          `).join('')}
        </div>

        <div class="tip">
          <h3>💡 How to Get Back on Track</h3>
          <p>1. Review your spending in high-cost categories</p>
          <p>2. Consider reducing discretionary spending</p>
          <p>3. Set smaller weekly budgets for the rest of the month</p>
          <p>4. Look for areas where you can save money</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, '🚨 Budget Limit Exceeded - EduWallet', html);
};

// Large Expense Alert Email
export const sendLargeExpenseAlert = async (user, expenseData) => {
  const { amount, category, description, date, threshold } = expenseData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; color: white; text-align: center; }
        .content { padding: 20px; max-width: 600px; margin: 0 auto; }
        .expense-details { background: #fffbeb; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; }
        .tip { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Large Expense Alert</h1>
        <p>EduWallet - Spending Alert</p>
      </div>
      
      <div class="content">
        <div class="expense-details">
          <h2>You've recorded a large expense</h2>
          <div style="margin: 15px 0;">
            <p><strong>Amount:</strong> <span style="color: #dc2626; font-size: 1.2em; font-weight: bold;">₹${amount}</span></p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Category Limit:</strong> ₹${threshold}</p>
            <p><strong>Exceeded by:</strong> ₹${(amount - threshold).toFixed(2)}</p>
          </div>
        </div>

        <div class="tip">
          <h3>💡 Spending Consideration</h3>
          <p>This expense exceeds your usual spending pattern for ${category}. Consider:</p>
          <p>• Was this expense necessary or impulsive?</p>
          <p>• Can you offset this with reduced spending in other areas?</p>
          <p>• Review your budget to accommodate this expense</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, `⚠️ Large ${category} Expense - ₹${amount}`, html);
};