import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Income from './components/Income'
import Expense from './components/Expense'
import Transactions from './components/Transactions'
import Goals from './components/Goals'
import Analytics from './components/Analytics'
import Notifications from './components/Notifications';
import WeeklyReport from './components/WeeklyReport';
import { Wallet, TrendingUp, TrendingDown, List, Target, BarChart3, Bell, Mail } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('income')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function sendAutomaticWeeklyReport() {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .insert([{ sent_at: new Date().toISOString() }]);

    if (error) throw error;
    console.log("✅ Weekly report sent successfully!");
  } catch (err) {
    console.error("❌ Error sending weekly report:", err);
  }
}

  useEffect(() => {
  const setupAutomaticEmails = () => {
    // Check if it's Monday and time to send weekly report
    const today = new Date();
    const isMonday = today.getDay() === 1; // 0 = Sunday, 1 = Monday
    const lastReportSent = localStorage.getItem('lastWeeklyReport');
    
    if (isMonday && lastReportSent !== today.toDateString()) {
      // Send weekly report automatically
      sendAutomaticWeeklyReport();
      localStorage.setItem('lastWeeklyReport', today.toDateString());
    }
  };

  if (user) {
    setupAutomaticEmails();
    
    // Check every day at 9 AM
    const interval = setInterval(setupAutomaticEmails, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [user]);

  const handleSignOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert('Sign out error: ' + error.message)
      }
    } catch (error) {
      alert('Sign out failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-green-600 animate-pulse" />
          <p className="mt-4 text-gray-600">Loading EduWallet...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  const tabs = [
    { id: 'income', name: 'Income', icon: TrendingUp },
    { id: 'expense', name: 'Expense', icon: TrendingDown },
    { id: 'transactions', name: 'Transactions', icon: List },
    { id: 'goals', name: 'Goals', icon: Target },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'notifications', name: 'Alerts', icon: Bell },
    { id: 'reports', name: 'Email Reports', icon: Mail }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-green-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">EduWallet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'income' && <Income user={user} />}
        {activeTab === 'expense' && <Expense user={user} />}
        {activeTab === 'transactions' && <Transactions user={user} />}
        {activeTab === 'goals' && <Goals user={user} />}
        {activeTab === 'analytics' && <Analytics user={user} />}
        {activeTab === 'notifications' && <Notifications user={user} />}
        {activeTab === 'reports' && <WeeklyReport user={user} />}
      </main>
    </div>
  )
}

// Auth Component
function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`
          }
        })
        
        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('already registered')) {
            setMessage('⚠️ Please wait 30 seconds or use a different email. This is a security measure.')
          } else if (error.message.includes('Email rate limit exceeded')) {
            setMessage('⏳ Too many attempts. Please wait 30 seconds before trying again.')
          } else {
            setMessage('❌ ' + error.message)
          }
        } else {
          if (data.user && data.user.identities && data.user.identities.length === 0) {
            setMessage('⚠️ This email is already registered. Please sign in instead.')
          } else if (data.user && !data.user.email_confirmed_at) {
            setMessage('📧 Check your email for verification link! Please verify your account.')
          } else {
            setMessage('✅ Account created successfully! Signing you in...')
            // Auto sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            if (signInError) {
              setMessage('✅ Account created! Please sign in manually.')
            }
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setMessage('❌ Invalid email or password. Please try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setMessage('📧 Please check your email and verify your account first.')
          } else if (error.message.includes('rate limit')) {
            setMessage('⏳ Too many attempts. Please wait 30 seconds.')
          } else {
            setMessage('❌ ' + error.message)
          }
        } else {
          setMessage('✅ Signed in successfully!')
        }
      }
    } catch (error) {
      setMessage('❌ Authentication failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      })
      
      if (error) {
        setMessage('❌ ' + error.message)
      } else {
        setMessage('📧 Check your email for the magic link! Click it to sign in.')
      }
    } catch (error) {
      setMessage('❌ Failed to send magic link: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Wallet className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to EduWallet'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Track your student finances easily
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('❌') ? 'bg-red-100 text-red-700' :
              message.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' :
              message.includes('⏳') ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }}
              disabled={loading}
              className="text-green-600 hover:text-green-500 font-medium disabled:opacity-50"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send Magic Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App