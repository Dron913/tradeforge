import { GitBranch, GitCommit, Sparkles, FileText } from 'lucide-react'
import { useStrategyVersions, useClosedTrades } from '../context/TradingContext'
import styles from './StrategyEvolution.module.css'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const versionIcons = {
  active: Sparkles,
  retired: GitCommit
}

function TimelineSection({ strategyVersions }) {
  return (
    <div className={styles.timelineSection}>
      <h2 className={styles.sectionTitle}>Strategy Versions</h2>
      <div className={styles.timelineSectionInner}>
      <div className={styles.timeline}>
        {strategyVersions.map((version) => {
          const Icon = versionIcons[version.status]
          const performanceClass = (version.totalPnl || 0) >= 0
            ? version.status === 'active' ? styles.active : styles.profitable
            : styles.loss

          return (
            <div key={version.version} className={styles.timelineNode}>
              <div
                className={`${styles.nodeCircle} ${version.status === 'active' ? styles.active : ''} ${styles[performanceClass]}`}
                style={{ flexShrink: 0 }}
              >
                v{version.version.replace(/^v/, '').replace(/^0+/, '')}
              </div>
              <div className={styles.nodeLabel}>{version.version}</div>
              <div className={styles.nodeStats}>
                {version.trades} trades | {formatDate(version.createdAt)}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

function VersionCard({ version, isActive }) {
  return (
    <div className={`${styles.versionCard} ${isActive ? styles.active : ''}`}>
      <div className={styles.versionHeader}>
        <div>
          <div className={styles.versionNumber}>{version.version}</div>
          <div className={styles.versionDate}>{formatDate(version.createdAt)}</div>
        </div>
      </div>

      <div className={styles.versionStats}>
        <div className={styles.vStat}>
          <div className={styles.vStatLabel}>Trades</div>
          <div className={styles.vStatValue}>{version.trades}</div>
        </div>

        {version.fromHypothesis && (
          <div className={styles.vStat}>
            <div className={styles.vStatLabel}>AI Status</div>
            <div className={styles.vStatValue} style={{ color: version.fromHypothesis.hermesFailed ? 'var(--warning)' : 'var(--accent)' }}>
              {version.fromHypothesis.hermesFailed ? 'FALLBACK' : 'HERMES'}
            </div>
          </div>
        )}

        <div className={styles.vStat}>
          <div className={styles.vStatLabel}>Win Rate</div>
          <div className={styles.vStatValue}>{(version.winRate || 0).toFixed(1)}%</div>
        </div>
        <div className={styles.vStat}>
          <div className={styles.vStatLabel}>P&L</div>
          <div className={`${styles.vStatValue} ${(version.totalPnl || 0) >= 0 ? styles.positive : styles.negative}`}>
            {(version.totalPnl || 0) >= 0 ? '+' : ''}{(version.pnlPercent || 0).toFixed(2)}%
          </div>
        </div>
      </div>

      {version.changes?.length > 0 && (
        <>
          <div className={styles.parametersTitle}>Parameters</div>
          <div className={styles.paramList}>
            {version.changes.map((change, i) => (
              <div key={i} className={styles.paramItem}>
                <span className={styles.paramName}>{change.parameter || version.variable || 'Strategy'}</span>
                <span className={`${styles.paramChange} ${styles.updated}`}>
                  {change.from || 'prev'} → {change.to || `${change.amount || version.amount}`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {version.fromHypothesis && (
        <div className={styles.parametersTitle}>Hypothesis</div>
      )}
    </div>
  )
}

function EvolutionSection({ evolutionEvents }) {
  const getEventIcon = (type) => {
    switch (type) {
      case 'reflection_completed': return Sparkles
      case 'strategy_created': return GitBranch
      default: return FileText
    }
  }

  return (
    <div className={styles.evolutionSection}>
      <div className={styles.evolutionTimeline}>
        <h2 className={styles.sectionTitle}>Evolution History</h2>
        {evolutionEvents.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4) 0' }}>
            No evolution events yet. Hermes updates strategy after every N closed trades.
          </div>
        ) : (
          evolutionEvents.map((event, index) => {
            const Icon = getEventIcon(event.type)
            return (
              <div key={event.id} className={styles.evolutionEvent}>
                <div className={`${styles.eventDot} ${event.type === 'reflection_completed' ? styles.current : ''} ${event.hermesFailed ? styles.loss : ''}`}>
                  <Icon size={14} />
                </div>
                <div className={styles.eventContent}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventVersion}>{event.version}</span>
                    {event.hermesFailed && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--warning)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        marginLeft: 'var(--space-2)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        FALLBACK
                      </span>
                    )}
                  </div>
                  <div className={styles.eventTime}>{formatDate(event.timestamp)}</div>
                  <p className={styles.eventSummary}>{event.summary}</p>
                  {event.changes?.length > 0 && (
                    <div className={styles.eventChanges}>
                      {event.changes.map((change, i) => (
                        <span key={i} className={styles.changeChip}>
                          {change.action} {change.parameter}
                          <span className={styles.arrow}>{change.from} → {change.to}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function StrategyEvolution() {
  const strategyVersions = useStrategyVersions()
  const closedTrades = useClosedTrades()

  // Check if a version came from a failed Hermes parse
  const isHermesFailed = (sv) => {
    const h = sv.fromHypothesis
    return h?.hermesFailed || (h?.reason || '').includes('Hermes parse failed')
  }

  // Build evolution events from hypotheses — newest first per user requirement
  const evolutionEvents = closedTrades.length === 0
    ? []
    : strategyVersions.map((sv, i) => ({
        id: `ev-${sv.version}`,
        type: 'reflection_completed',
        version: sv.version,
        timestamp: sv.createdAt || sv.fromHypothesis?.timestamp,
        title: `Strategy ${sv.version} deployed`,
        summary: sv.fromHypothesis?.reason || sv.fromHypothesis?.text || 'Hermes updated strategy parameters.',
        changes: sv.changes || [],
        hermesFailed: isHermesFailed(sv),
        sourceMode: sv.fromHypothesis?.mode || 'unknown',
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // newest first

  // Hermes effectiveness stats
  const hermesSuccess = strategyVersions.filter(sv => !isHermesFailed(sv) && (sv.fromHypothesis?.mode === 'hermes' || sv.fromHypothesis?.mode === 'hermes_phase3_test'))
  const hermesFailed = strategyVersions.filter(isHermesFailed)
  const totalReflections = strategyVersions.length

  return (
    <div className={styles.container}>
      {/* Hermes effectiveness summary */}
      {totalReflections > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          gap: 'var(--space-6)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Reflections: </span>
            <span style={{ color: 'var(--text-primary)' }}>{totalReflections}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Hermes AI Success: </span>
            <span style={{ color: 'var(--accent)' }}>{hermesSuccess.length}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Hermes Parse Failed (Fallback): </span>
            <span style={{ color: 'var(--warning)' }}>{hermesFailed.length}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Effectiveness: </span>
            <span style={{ color: hermesSuccess.length > hermesFailed.length ? 'var(--accent)' : 'var(--warning)' }}>
              {totalReflections > 0 ? Math.round(hermesSuccess.length / totalReflections * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      <TimelineSection strategyVersions={strategyVersions} />

      {strategyVersions.length > 0 ? (
        <>
          <h2 className={styles.sectionTitle}>Version Details</h2>
          <div className={styles.versionGrid}>
            {strategyVersions.map(version => (
              <VersionCard
                key={version.version}
                version={version}
                isActive={version.status === 'active'}
              />
            ))}
          </div>

          <EvolutionSection evolutionEvents={evolutionEvents} />
        </>
      ) : (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>
          <GitBranch size={32} style={{ opacity: 0.3 }} />
          <p style={{ marginTop: 'var(--space-4)' }}>
            No strategy versions yet. Strategy updates are created by Hermes after every N trades.
          </p>
        </div>
      )}
    </div>
  )
}