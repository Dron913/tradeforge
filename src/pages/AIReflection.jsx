import { Brain, Lightbulb, Check, X, ArrowRight } from 'lucide-react'
import { useHypotheses, useClosedTrades } from '../context/TradingContext'
import styles from './AIReflection.module.css'

// Build reflection cards from live hypothesis data
function buildReflectionCycles(hypotheses, closedTrades) {
  if (!hypotheses.length) return []
  // Group hypotheses by timestamp/version to form cycles
  const byTime = {}
  for (const h of hypotheses.reverse()) {
    const key = h.timestamp?.split('T')[0] || h.timestamp
    if (!byTime[key]) byTime[key] = []
    byTime[key].push(h)
  }
  return Object.entries(byTime).map(([time, hypos], i) => ({
    id: `ref-${hypotheses.length - i}`,
    status: 'completed',
    startedAt: time,
    completedAt: time,
    duration: hypos[0]?.mode === 'hermes' ? 'Hermes' : 'Auto',
    tradesAnalyzed: hypos[0]?.trades || closedTrades.length,
    hypotheses: hypos.map(h => ({
      id: h.id,
      text: h.text || `Change ${h.variable}: ${h.direction} ${h.amount}`,
      confidence: Math.round((h.confidence || h.stats?.win_rate || 50) * 10) / 10,
      outcome: h.mode === 'hermes' ? 'accepted' : 'from_hypothesis',
      impact: (h.stats?.profit_factor || 1) > 1.5 ? 'positive' : 'neutral',
    })),
    insights: hypos.map(h => h.text || h.reason || `${h.variable}: ${h.direction} ${h.amount}`),
    acceptedChanges: hypos
      .filter(h => h.variable)
      .map(h => ({ parameter: h.variable, change: `${h.direction} ${h.amount}` })),
    _raw: hypos,
  }))
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'In progress...'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Unknown'
}

function ReflectionCard({ reflection }) {
  return (
    <div className={`${styles.reflectionCard} ${reflection.status === 'in_progress' ? styles.inProgress : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.reflectionId}>Cycle #{reflection.id.split('-')[1]}</span>
          <span className={`${styles.statusBadge} ${styles[reflection.status]}`}>
            {reflection.status === 'in_progress' && <span className={styles.statusDot} />}
            {reflection.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.timing}>
          <div className={styles.timingItem}>
            <span className={styles.timingLabel}>Started</span>
            <span className={styles.timingValue}>{formatDateTime(reflection.startedAt)}</span>
          </div>
          <div className={styles.timingItem}>
            <span className={styles.timingLabel}>Duration</span>
            <span className={styles.timingValue}>{reflection.duration}</span>
          </div>
          <div className={styles.timingItem}>
            <span className={styles.timingLabel}>Trades Analyzed</span>
            <span className={styles.timingValue}>{reflection.tradesAnalyzed}</span>
          </div>
        </div>

        {reflection.hypotheses.length > 0 && (
          <div className={styles.hypothesesSection}>
            <h4 className={styles.sectionTitle}>
              <Lightbulb size={14} />
              Hypotheses Generated
            </h4>
            {reflection.hypotheses.map(hypothesis => (
              <div key={hypothesis.id} className={styles.hypothesisCard}>
                <div className={styles.hypothesisHeader}>
                  <span className={styles.hypothesisText}>{hypothesis.text}</span>
                  <span className={styles.confidenceBadge}>{hypothesis.confidence}% confidence</span>
                </div>
                <div className={styles.hypothesisFooter}>
                  <span className={`${styles.outcomeBadge} ${styles[hypothesis.outcome]}`}>
                    {hypothesis.outcome === 'accepted' ? <Check size={10} /> : <X size={10} />}
                    {hypothesis.outcome}
                  </span>
                  <span className={`${styles.impactBadge} ${styles[hypothesis.impact]}`}>
                    {hypothesis.impact} impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {reflection.insights.length > 0 && (
          <div className={styles.insightsSection}>
            <h4 className={styles.sectionTitle}>Key Insights</h4>
            <div className={styles.insightsList}>
              {reflection.insights.map((insight, i) => (
                <div key={i} className={styles.insightItem}>
                  <span className={styles.insightBullet} />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reflection.acceptedChanges.length > 0 && (
          <div className={styles.changesSection}>
            <h4 className={styles.sectionTitle}>Accepted Changes</h4>
            <div className={styles.changesList}>
              {reflection.acceptedChanges.map((change, i) => (
                <div key={i} className={styles.changeChip}>
                  <span className={styles.param}>{change.parameter}</span>
                  <span className={styles.arrow}><ArrowRight size={12} /></span>
                  <span className={styles.value}>{change.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActiveReflection() {
  const hypotheses = useHypotheses()
  const closedTrades = useClosedTrades()
  const cycles = buildReflectionCycles(hypotheses, closedTrades)
  const active = cycles.find(r => r.status === 'in_progress')
  if (!active) {
    return (
      <div className={styles.activeReflection}>
        <div className={styles.activeReflectionHeader}>
          <div className={styles.activeReflectionTitle}>
            <Brain size={24} color="var(--profit)" />
            <span className={styles.activeBadge}>
              <span className={styles.statusDot} />
              Hermes Active
            </span>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {closedTrades.length} trades analyzed · {hypotheses.length} hypotheses generated
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '100%' }} />
        </div>
        <div className={styles.analysisStatus}>
          <div className={styles.statusItem}>
            <div className={styles.statusItemLabel}>Trades Analyzed</div>
            <div className={styles.statusItemValue}>{closedTrades.length}</div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusItemLabel}>Hypotheses</div>
            <div className={styles.statusItemValue}>{hypotheses.length}</div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusItemLabel}>Strategy</div>
            <div className={styles.statusItemValue}>
              {hypotheses[hypotheses.length - 1]?.version || 'v0008'}
            </div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusItemLabel}>Win Rate</div>
            <div className={styles.statusItemValue}>
              {hypotheses[hypotheses.length - 1]?.winRate
                ? `${hypotheses[hypotheses.length - 1].winRate.toFixed(1)}%`
                : '--'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.activeReflection}>
      <div className={styles.activeReflectionHeader}>
        <div className={styles.activeReflectionTitle}>
          <Brain size={24} color="var(--warning)" />
          <span className={styles.activeBadge}>
            <span className={styles.statusDot} />
            Reflection #{active.id.split('-')[1]} In Progress
          </span>
        </div>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        Analyzing {active.tradesAnalyzed} recent trades to identify patterns and generate improvement hypotheses...
      </p>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} />
      </div>
      <div className={styles.analysisStatus}>
        <div className={styles.statusItem}>
          <div className={styles.statusItemLabel}>Trades Analyzed</div>
          <div className={styles.statusItemValue}>{active.tradesAnalyzed}</div>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusItemLabel}>Patterns Found</div>
          <div className={styles.statusItemValue}>{active.hypotheses.length}</div>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusItemLabel}>Hypotheses</div>
          <div className={styles.statusItemValue}>{active.hypotheses.length}</div>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusItemLabel}>Confidence</div>
          <div className={styles.statusItemValue}>
            {active.hypotheses[0]?.confidence
              ? `${active.hypotheses[0].confidence.toFixed(0)}%`
              : '--'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AIReflection() {
  const hypotheses = useHypotheses()
  const closedTrades = useClosedTrades()
  const reflectionCycles = buildReflectionCycles(hypotheses, closedTrades)
  const completedReflections = reflectionCycles.filter(r => r.status === 'completed')

  return (
    <div className={styles.container}>
      <ActiveReflection />

      <h2 className={styles.sectionTitle}>Completed Reflections</h2>
      {completedReflections.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 'var(--space-8)', textAlign: 'center' }}>
          <Brain size={32} style={{ opacity: 0.3 }} />
          <p style={{ marginTop: 'var(--space-4)' }}>
            No reflection cycles yet. Hermes runs after every {hypotheses[0]?.trades || '2'} trades.
          </p>
        </div>
      ) : (
        <div className={styles.reflectionGrid}>
          {completedReflections.map(reflection => (
            <ReflectionCard key={reflection.id} reflection={reflection} />
          ))}
        </div>
      )}
    </div>
  )
}