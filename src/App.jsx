import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import TradingActivity from './pages/TradingActivity'
import PortfolioAnalytics from './pages/PortfolioAnalytics'
import MarketIntelligence from './pages/MarketIntelligence'
import StrategyEvolution from './pages/StrategyEvolution'
import AIReflection from './pages/AIReflection'
import RiskManagement from './pages/RiskManagement'
import TradeReplay from './pages/TradeReplay'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import ExitIntelligence from './pages/ExitIntelligence'
import Login from './pages/Login'
import { TradingProvider, useAuth } from './context/TradingContext'

function ProtectedLayout() {
  const { authRequired, authChecked, authToken, login, loginError } = useAuth()

  if (!authChecked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)',
      }}>
        <span>Connecting to TradeForge&hellip;</span>
      </div>
    )
  }

  if (authRequired && !authToken) {
    return <Login onLogin={login} error={loginError} />
  }

  return <Layout />
}

function LoginPage() {
  const { login, loginError } = useAuth()
  return <Login onLogin={login} error={loginError} />
}

function App() {
  return (
    <TradingProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trading" element={<TradingActivity />} />
          <Route path="/analytics" element={<PortfolioAnalytics />} />
          <Route path="/markets" element={<MarketIntelligence />} />
          <Route path="/strategy" element={<StrategyEvolution />} />
          <Route path="/reflections" element={<AIReflection />} />
          <Route path="/exit-intelligence" element={<ExitIntelligence />} />
          <Route path="/risk" element={<RiskManagement />} />
          <Route path="/replay" element={<TradeReplay />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </TradingProvider>
  )
}

export default App