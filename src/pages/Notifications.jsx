import { useState } from 'react'
import {
  Activity,
  Brain,
  ShieldAlert,
  Server,
  Check,
  X,
  Bell,
  CheckCheck
} from 'lucide-react'
import { useNotifications } from '../context/TradingContext'
import styles from './Notifications.module.css'

const categoryIcons = {
  trade: Activity,
  strategy: Brain,
  risk: ShieldAlert,
  system: Server
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'trade', label: 'Trades' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'risk', label: 'Risk' },
  { id: 'system', label: 'System' }
]

function getTimeAgo(dateStr) {
  const date = new Date(dateStr || Date.now())
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function getFullDate(dateStr) {
  return new Date(dateStr || Date.now()).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Notifications() {
  const liveNotifications = useNotifications()
  const [activeCategory, setActiveCategory] = useState('all')
  const [notifList, setNotifList] = useState(liveNotifications.length > 0 ? liveNotifications : [])

  const filteredNotifications = activeCategory === 'all'
    ? notifList
    : notifList.filter(n => n.type === activeCategory || n.category === activeCategory)

  const unreadCount = notifList.filter(n => !n.read).length

  const unreadByCategory = (category) => {
    if (category === 'all') return unreadCount
    return notifList.filter(n => (n.type === category || n.category === category) && !n.read).length
  }

  const markAsRead = (id) => {
    setNotifList(list => list.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const dismissNotification = (id) => {
    setNotifList(list => list.filter(n => n.id !== id))
  }

  const markAllRead = () => {
    setNotifList(list => list.map(n => ({ ...n, read: true })))
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.tabs}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
              {unreadByCategory(cat.id) > 0 && (
                <span className={styles.tabBadge}>{unreadByCategory(cat.id)}</span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllRead}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>No notifications</div>
            <div className={styles.emptyText}>
              {activeCategory === 'all'
                ? "You're all caught up!"
                : `No ${activeCategory} notifications`}
            </div>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const Icon = categoryIcons[notification.type] || Bell

            return (
              <div
                key={notification.id}
                className={`${styles.notificationCard} ${!notification.read ? styles.unread : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`${styles.iconContainer} ${styles[notification.type]}`}>
                  <Icon size={20} />
                </div>
                <div className={styles.content}>
                  <div className={styles.header}>
                    <span className={`${styles.title} ${!notification.read ? styles.unreadTitle : ''}`}>
                      {notification.title}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <span className={`${styles.severityBadge} ${styles[notification.severity]}`}>
                        {notification.severity}
                      </span>
                      <span className={styles.categoryBadge}>{notification.category}</span>
                    </div>
                  </div>
                  <p className={styles.description}>{notification.description}</p>
                  <span className={styles.timestamp} title={getFullDate(notification.timestamp)}>
                    {getTimeAgo(notification.timestamp)}
                  </span>
                </div>
                <div className={styles.actions}>
                  {!notification.read && (
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className={`${styles.actionBtn} ${styles.dismiss}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      dismissNotification(notification.id)
                    }}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}