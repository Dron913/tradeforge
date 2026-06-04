import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, Shield, ExternalLink, AlertCircle } from 'lucide-react'
import styles from './Login.module.css'

// Get backend URL from environment
const API_BASE = import.meta.env.VITE_RAILWAY_API_URL || 'https://tradeforge-production-fbc1.up.railway.app'

export default function Login({ onLogin, error }) {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking')

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/status`, {
          signal: AbortSignal.timeout(5000)
        })
        if (res.ok) setConnectionStatus('connected')
        else setConnectionStatus('error')
      } catch {
        setConnectionStatus('offline')
      }
    }
    checkConnection()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onLogin(password)
    setLoading(false)
  }

  const connectionLabels = {
    checking: { text: 'Checking backend...', color: 'var(--text-muted)' },
    connected: { text: `Connected to ${new URL(API_BASE).hostname}`, color: 'var(--profit)' },
    offline: { text: 'Backend offline - check Railway status', color: 'var(--loss)' },
    error: { text: 'Connection error', color: 'var(--loss)' },
  }

  const conn = connectionLabels[connectionStatus]

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Lock size={28} />
        </div>
        <h1 className={styles.title}>TradeForge</h1>
        <p className={styles.subtitle}>AI Trading Agent Dashboard</p>

        {/* Backend connection status */}
        <div className={styles.connectionStatus} style={{ color: conn.color }}>
          <span className={`${styles.statusDot} ${styles[connectionStatus]}`} />
          <span>{conn.text}</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Dashboard Password</label>
            <div className={styles.inputWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the dashboard password"
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !password}
          >
            {loading ? 'Authenticating...' : 'Unlock Dashboard'}
          </button>
        </form>

        {/* Help section */}
        <div className={styles.helpSection}>
          <span>The password is configured in Railway environment variables.</span>
          <a
            href={API_BASE}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.helpLink}
          >
            View Railway Status <ExternalLink size={12} />
          </a>
        </div>

        <div className={styles.footer}>
          <Shield size={12} />
          <span>Session-based authentication</span>
        </div>
      </div>
    </div>
  )
}