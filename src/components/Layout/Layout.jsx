import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  LineChart,
  GitBranch,
  Brain,
  ShieldAlert,
  PlayCircle,
  Bell,
  Settings,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'
import { notifications } from '../../data/mockData'
import styles from './Layout.module.css'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trading', label: 'Trading Activity', icon: Activity },
  { path: '/analytics', label: 'Portfolio Analytics', icon: BarChart3 },
  { path: '/markets', label: 'Market Intelligence', icon: LineChart },
  { path: '/strategy', label: 'Strategy Evolution', icon: GitBranch },
  { path: '/reflections', label: 'AI Reflection', icon: Brain },
  { path: '/exit-intelligence', label: 'Exit Intelligence', icon: Brain },
  { path: '/risk', label: 'Risk Management', icon: ShieldAlert },
  { path: '/replay', label: 'Trade Replay', icon: PlayCircle },
]

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/trading': 'Trading Activity',
  '/analytics': 'Portfolio Analytics',
  '/markets': 'Market Intelligence',
  '/strategy': 'Strategy Evolution',
  '/reflections': 'AI Reflection Center',
  '/exit-intelligence': 'Exit Intelligence',
  '/risk': 'Risk Management',
  '/replay': 'Trade Replay',
  '/notifications': 'Notifications',
  '/settings': 'Settings'
}

const marketData = [
  { asset: 'BTC', price: '$67,234', change: '+2.34%', positive: true },
  { asset: 'ETH', price: '$3,512', change: '+1.89%', positive: true },
  { asset: 'SOL', price: '$172.34', change: '-1.23%', positive: false }
]

export default function Layout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  const currentTitle = pageTitles[location.pathname] || 'TradeForge'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className={styles.layout}>
      <div
        className={`${styles.sidebarOverlay} ${mobileMenuOpen ? styles.show : ''}`}
        onClick={closeMobileMenu}
      />

      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoInner}>
            <div className={styles.logoIcon}>TF</div>
            <div>
              <div className={styles.logoText}>TradeForge</div>
              <div className={styles.logoTagline}>AI Trading Agent</div>
            </div>
          </div>
        </div>

        <button className={styles.closeMobileMenu} onClick={closeMobileMenu}>
          <X size={24} />
        </button>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Navigation</div>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={closeMobileMenu}
              >
                <item.icon className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>System</div>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Bell className={styles.navIcon} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className={styles.navBadge}>{unreadCount}</span>
              )}
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Settings className={styles.navIcon} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        <div className={styles.footer}>
          <div className={styles.aiStatus}>
            <div className={styles.aiIndicator} />
            <div className={styles.aiInfo}>
              <div className={styles.aiLabel}>AI Status</div>
              <div className={styles.aiValue}>Learning</div>
            </div>
            <TrendingUp size={16} color="var(--profit)" />
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label="Toggle menu">
              <Menu size={24} />
            </button>
            <h1 className={styles.pageTitle}>{currentTitle}</h1>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.marketTicker}>
              {marketData.map(item => (
                <div key={item.asset} className={styles.tickerItem}>
                  <span className={styles.tickerAsset}>{item.asset}</span>
                  <span className={styles.tickerPrice}>{item.price}</span>
                  <span className={`${styles.tickerChange} ${item.positive ? styles.positive : styles.negative}`}>
                    {item.change}
                  </span>
                </div>
              ))}
            </div>

            <NavLink to="/notifications" className={styles.headerButton}>
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.notificationDot} />}
            </NavLink>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}