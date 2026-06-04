import { AlertTriangle, AlertCircle, Shield, TrendingDown } from 'lucide-react'
import { useRisk } from '../context/TradingContext'
import styles from './RiskManagement.module.css'

function RiskGauge({ score }) {
  const getColor = (value) => {
    if (value <= 30) return 'var(--profit)'
    if (value <= 60) return 'var(--warning)'
    if (value <= 80) return '#F97316'
    return 'var(--loss)'
  }

  const color = getColor(score)
  const circumference = Math.PI * 160
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={styles.gaugeContainer}>
      <svg viewBox="0 0 200 100" className={styles.gaugeSvg}>
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          className={styles.gaugeTrack}
        />
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          className={styles.gaugeFill}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
        />
      </svg>
      <div className={styles.gaugeValue}>
        <div className={styles.gaugeNumber} style={{ color }}>{score}</div>
        <div className={styles.gaugeLabel}>Risk Score</div>
      </div>
    </div>
  )
}

function ExposureByAsset({ risk }) {
  const assetData = risk.exposureByAsset || []
  const sideDist = risk.exposureBySide || { long: 0, short: 0 }
  return (
    <div className={styles.exposureCard}>
      <div className={styles.exposureTitle}>Exposure by Asset</div>
      {assetData.length > 0 ? assetData.map(asset => (
        <div key={asset.asset} className={styles.assetBar}>
          <span className={styles.assetName}>{asset.asset}</span>
          <div className={styles.barContainer}>
            <div className={styles.barStack}>
              {asset.long > 0 && (
                <div className={`${styles.barSegment} ${styles.long}`} style={{ width: `${Math.min(asset.long * 20, 100)}%` }}>
                  {asset.long > 1 && `L ${asset.long}`}
                </div>
              )}
              {asset.short > 0 && (
                <div className={`${styles.barSegment} ${styles.short}`} style={{ width: `${Math.min(asset.short * 20, 100)}%` }}>
                  {asset.short > 1 && `S ${asset.short}`}
                </div>
              )}
            </div>
          </div>
          <span className={styles.assetPercent}>{asset.total.toFixed(1)}%</span>
        </div>
      )) : <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No open positions</p>}
      <div className={styles.sideDistribution}>
        <div className={styles.sideItem}>
          <div className={styles.sideLabel}>Long</div>
          <div className={`${styles.sideValue} ${styles.long}`}>{sideDist.long}%</div>
        </div>
        <div className={styles.sideItem}>
          <div className={styles.sideLabel}>Short</div>
          <div className={`${styles.sideValue} ${styles.short}`}>{sideDist.short}%</div>
        </div>
      </div>
    </div>
  )
}

function DrawdownMonitor({ risk }) {
  const maxDD = Math.abs(risk.maxDrawdown || 5.0)
  const currentDD = Math.abs(risk.currentDrawdown || 0)
  const recoveryProgress = maxDD > 0 ? ((maxDD - currentDD) / maxDD) * 100 : 100
  return (
    <div className={styles.drawdownSection}>
      <h2 className={styles.sectionTitle}>Drawdown Monitor</h2>
      <div className={styles.drawdownGrid}>
        <div className={styles.drawdownMetric}>
          <div className={styles.drawdownLabel}>Current Drawdown</div>
          <div className={`${styles.drawdownValue} ${styles.current}`}>
            {(risk.currentDrawdown || 0).toFixed(1)}%
          </div>
        </div>
        <div className={styles.drawdownMetric}>
          <div className={styles.drawdownLabel}>Maximum Historical</div>
          <div className={`${styles.drawdownValue} ${styles.max}`}>
            {-(risk.maxDrawdown || 5.0).toFixed(1)}%
          </div>
        </div>
        <div className={styles.drawdownMetric}>
          <div className={styles.drawdownLabel}>Recovery Progress</div>
          <div className={`${styles.drawdownValue} ${styles.high}`}>
            {recoveryProgress.toFixed(0)}%
          </div>
        </div>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${Math.min(recoveryProgress, 100)}%` }} />
      </div>
      <div className={styles.progressLabels}>
        <span>-{(risk.maxDrawdown || 5.0).toFixed(1)}%</span>
        <span>Recovery from max DD</span>
        <span>0%</span>
      </div>
    </div>
  )
}

function ProtectionSystems({ risk }) {
  const systems = risk.protectionSystems || []
  const risks = risk.riskPerTrade || 1.5
  return (
    <div className={styles.protectionCard}>
      <h2 className={styles.sectionTitle}>Active Protection Systems</h2>
      <div className={styles.protectionList}>
        {systems.map((system) => (
          <div
            key={system.name}
            className={`${styles.protectionItem} ${system.status === 'warning' ? styles.warning : ''}`}
          >
            <div className={styles.protectionLeft}>
              <div className={`${styles.statusDot} ${system.status === 'warning' ? styles.warning : ''}`} />
              <span className={styles.protectionName}>{system.name}</span>
            </div>
            <div className={styles.protectionRight}>
              <span className={styles.protectionValue}>{system.value}</span>
              <span className={`${styles.statusBadge} ${styles[system.status]}`}>
                {system.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskWarnings({ risk }) {
  const warnings = risk.warnings || []
  return (
    <div className={styles.warningsCard}>
      <h2 className={styles.sectionTitle}>Recent Alerts</h2>
      {warnings.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
          No active alerts. All systems nominal.
        </div>
      ) : warnings.map(warning => (
        <div key={warning.id} className={styles.warningItem}>
          <div className={`${styles.warningIcon} ${styles[warning.severity]}`}>
            {warning.severity === 'warning' ? <AlertTriangle size={14} /> : <AlertCircle size={14} />}
          </div>
          <div className={styles.warningContent}>
            <div className={styles.warningTitle}>
              {warning.severity === 'warning' ? 'Correlation Warning' : 'Info'}
            </div>
            <div className={styles.warningMessage}>{warning.message}</div>
            <div className={styles.warningTime}>{warning.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RiskManagement() {
  const risk = useRisk()
  const sideDist = risk.exposureBySide || { long: 0, short: 0 }
  const totalExposure = sideDist.long + sideDist.short || 100

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.gaugeCard}>
          <h2 className={styles.gaugeTitle}>Portfolio Risk Score</h2>
          <RiskGauge score={risk.riskScore} />
          <div className={styles.metricsGrid} style={{ width: '100%' }}>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Risk/Trade</div>
              <div className={styles.metricValue}>{risk.riskPerTrade?.toFixed(1) || '1.5'}%</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Max Loss</div>
              <div className={styles.metricValue}>-$2,000</div>
            </div>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Protection</div>
              <div className={styles.metricValue}>Active</div>
            </div>
          </div>
        </div>

        <div className={styles.exposureSection}>
          <h2 className={styles.sectionTitle}>Risk Exposure</h2>
          <div className={styles.exposureGrid}>
            <ExposureByAsset risk={risk} />
            <div className={styles.exposureCard}>
              <div className={styles.exposureTitle}>Side Distribution</div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className={styles.sideItem} style={{ flex: sideDist.long || 1 }}>
                  <div className={styles.sideLabel}>Long Positions</div>
                  <div className={`${styles.sideValue} ${styles.long}`}>{sideDist.long}%</div>
                </div>
              </div>
              <div style={{
                height: '24px',
                background: 'var(--bg-hover)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex'
              }}>
                <div style={{
                  width: `${totalExposure > 0 ? (sideDist.long / totalExposure) * 100 : 50}%`,
                  background: 'linear-gradient(180deg, var(--accent-cyan-dim), var(--accent-cyan))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--bg-void)'
                }}>
                  L {sideDist.long}%
                </div>
                <div style={{
                  width: `${totalExposure > 0 ? (sideDist.short / totalExposure) * 100 : 50}%`,
                  background: 'linear-gradient(180deg, var(--loss-dim), var(--loss))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'white'
                }}>
                  S {sideDist.short}%
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total Exposure</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                    {totalExposure}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DrawdownMonitor risk={risk} />

      <div className={styles.protectionSection}>
        <ProtectionSystems risk={risk} />
        <RiskWarnings risk={risk} />
      </div>
    </div>
  )
}