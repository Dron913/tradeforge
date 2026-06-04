import { useState } from 'react'
import { Save, RotateCcw, LogOut, Shield, Lock, Unlock } from 'lucide-react'
import { useAuth } from '../context/TradingContext'
import styles from './Settings.module.css'

export default function Settings() {
  const { authToken, authRequired, logout } = useAuth()
  const [settings, setSettings] = useState({
    theme: 'dark',
    accentColor: 'cyan',
    chartStyle: 'area',
    compactMode: false,
    showMiniCharts: true,
    notifications: {
      trades: true,
      strategy: true,
      risk: true,
      system: true,
      email: false,
      sound: false
    },
    defaultPage: 'dashboard',
    dateFormat: 'MMM D, YYYY',
    timeFormat: '24h'
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNotification = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Appearance</h2>

        <div className={styles.settingGroup}>
          <div className={styles.groupTitle}>Accent Color</div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Primary Color</div>
              <div className={styles.settingDescription}>
                Choose the accent color for interactive elements
              </div>
            </div>
            <div className={styles.colorPicker}>
              <div
                className={`${styles.colorOption} ${styles.colorCyan} ${settings.accentColor === 'cyan' ? styles.selected : ''}`}
                onClick={() => updateSetting('accentColor', 'cyan')}
              />
              <div
                className={`${styles.colorOption} ${styles.colorPurple} ${settings.accentColor === 'purple' ? styles.selected : ''}`}
                onClick={() => updateSetting('accentColor', 'purple')}
              />
              <div
                className={`${styles.colorOption} ${styles.colorGreen} ${settings.accentColor === 'green' ? styles.selected : ''}`}
                onClick={() => updateSetting('accentColor', 'green')}
              />
              <div
                className={`${styles.colorOption} ${styles.colorOrange} ${settings.accentColor === 'orange' ? styles.selected : ''}`}
                onClick={() => updateSetting('accentColor', 'orange')}
              />
            </div>
          </div>
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.groupTitle}>Chart Style</div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Default Chart Type</div>
              <div className={styles.settingDescription}>
                Choose how charts are displayed by default
              </div>
            </div>
            <select
              className={styles.select}
              value={settings.chartStyle}
              onChange={(e) => updateSetting('chartStyle', e.target.value)}
            >
              <option value="area">Area</option>
              <option value="line">Line</option>
              <option value="candlestick">Candlestick</option>
            </select>
          </div>
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.groupTitle}>Display Mode</div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Compact Mode</div>
              <div className={styles.settingDescription}>
                Show more data with smaller spacing
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.compactMode ? styles.active : ''}`}
              onClick={() => updateSetting('compactMode', !settings.compactMode)}
            />
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Mini Charts</div>
              <div className={styles.settingDescription}>
                Show sparkline charts in cards and lists
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.showMiniCharts ? styles.active : ''}`}
              onClick={() => updateSetting('showMiniCharts', !settings.showMiniCharts)}
            />
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Notifications</h2>

        <div className={styles.settingGroup}>
          <div className={styles.groupTitle}>Alert Types</div>
          {[
            { key: 'trades', label: 'Trade Alerts', desc: 'Entry, exit, and position updates' },
            { key: 'strategy', label: 'Strategy Updates', desc: 'Version changes and reflections' },
            { key: 'risk', label: 'Risk Warnings', desc: 'Drawdown and exposure alerts' },
            { key: 'system', label: 'System Events', desc: 'Health checks and maintenance' }
          ].map(item => (
            <div key={item.key} className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>{item.label}</div>
                <div className={styles.settingDescription}>{item.desc}</div>
              </div>
              <div
                className={`${styles.toggle} ${settings.notifications[item.key] ? styles.active : ''}`}
                onClick={() => updateNotification(item.key, !settings.notifications[item.key])}
              />
            </div>
          ))}
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.groupTitle}>Delivery</div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Email Notifications</div>
              <div className={styles.settingDescription}>
                Receive daily digest via email
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.notifications.email ? styles.active : ''}`}
              onClick={() => updateNotification('email', !settings.notifications.email)}
            />
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Sound Alerts</div>
              <div className={styles.settingDescription}>
                Play sounds for important events
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.notifications.sound ? styles.active : ''}`}
              onClick={() => updateNotification('sound', !settings.notifications.sound)}
            />
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Display Preferences</h2>

        <div className={styles.settingGroup}>
          <div className={styles.groupTitle}>Defaults</div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Default Page</div>
              <div className={styles.settingDescription}>
                Page to show when you log in
              </div>
            </div>
            <select
              className={styles.select}
              value={settings.defaultPage}
              onChange={(e) => updateSetting('defaultPage', e.target.value)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="trading">Trading Activity</option>
              <option value="analytics">Portfolio Analytics</option>
              <option value="markets">Market Intelligence</option>
            </select>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Date Format</div>
              <div className={styles.settingDescription}>
                How dates are displayed
              </div>
            </div>
            <select
              className={styles.select}
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
            >
              <option value="MMM D, YYYY">Jan 1, 2024</option>
              <option value="D MMM YYYY">1 Jan 2024</option>
              <option value="YYYY-MM-DD">2024-01-01</option>
            </select>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Time Format</div>
              <div className={styles.settingDescription}>
                12-hour or 24-hour clock
              </div>
            </div>
            <select
              className={styles.select}
              value={settings.timeFormat}
              onChange={(e) => updateSetting('timeFormat', e.target.value)}
            >
              <option value="24h">24-hour (14:00)</option>
              <option value="12h">12-hour (2:00 PM)</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Authentication</h2>

        <div className={styles.settingGroup}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Session Status</div>
              <div className={styles.settingDescription}>
                {authRequired
                  ? authToken ? 'Authenticated — session active' : 'Password protected. Auth required to access dashboard.'
                  : 'No authentication required. To enable, set DASHBOARD_PASSWORD in Railway env vars.'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {authToken ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--profit)', fontSize: 'var(--text-sm)' }}>
                  <Unlock size={14} />
                  <span>Active</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  <Lock size={14} />
                  <span>No auth</span>
                </div>
              )}
            </div>
          </div>
          {authToken && (
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Lock Dashboard</div>
                <div className={styles.settingDescription}>
                  End your session and require password to access dashboard
                </div>
              </div>
              <button
                className={styles.dangerButton}
                onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          )}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Auth Mode</div>
              <div className={styles.settingDescription}>
                Configured via Railway environment variable DASHBOARD_PASSWORD
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: authRequired ? 'var(--profit)' : 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              <Shield size={14} />
              <span>{authRequired ? 'Password enabled' : 'Public access'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Data Management</h2>

        <div className={styles.settingGroup}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Export Data</div>
              <div className={styles.settingDescription}>
                Download all your trading data as CSV
              </div>
            </div>
            <button className={styles.dangerButton} style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Export CSV
            </button>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Clear Cache</div>
              <div className={styles.settingDescription}>
                Remove temporary data and refresh the app
              </div>
            </div>
            <button className={styles.dangerButton} style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      <div className={styles.settingsSection} style={{ borderColor: 'var(--loss)' }}>
        <h2 className={styles.sectionTitle} style={{ color: 'var(--loss)' }}>Danger Zone</h2>

        <div className={styles.settingGroup}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Reset All Settings</div>
              <div className={styles.settingDescription}>
                Restore all settings to their default values
              </div>
            </div>
            <button
              className={styles.dangerButton}
              onClick={() => updateSetting('accentColor', 'cyan')}
            >
              Reset
            </button>
          </div>
        </div>

        <div className={styles.versionInfo}>
          <div className={styles.versionNumber}>TradeForge v1.0.0</div>
          <div className={styles.versionCopyright}>AI-Powered Crypto Trading Dashboard</div>
          <button className={styles.resetBtn}>
            <RotateCcw size={14} />
            Reset to factory defaults
          </button>
        </div>
      </div>

      <button className={styles.saveButton}>
        <Save size={18} />
        Save Settings
      </button>
    </div>
  )
}