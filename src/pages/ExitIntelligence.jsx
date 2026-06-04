import { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, TrendingDown, Eye, Target, Zap, Shield, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Check, X, Clock, BarChart2 } from 'lucide-react'
import { useAuth } from '../context/TradingContext'
import styles from './ExitIntelligence.module.css'

const PHASE_COLORS = {
  1: { bg: 'var(--accent-cyan-glow)', border: 'var(--accent-cyan)', text: 'var(--accent-cyan)' },
  2: { bg: 'var(--warning-bg)', border: 'var(--warning)', text: 'var(--warning)' },
  3: { bg: 'var(--profit-bg)', border: 'var(--profit)', text: 'var(--profit)' },
  4: { bg: 'var(--accent-purple-glow)', border: 'var(--accent-purple)', text: 'var(--accent-purple)' },
}

const OBSERVATION_ICONS = {
  exited_too_early: TrendingUp,
  exited_too_late: TrendingDown,
  exited_correctly: Check,
  momentum_still_existed: Zap,
  trend_exhausted: AlertTriangle,
  stop_loss_appropriate: Shield,
  stop_loss_unnecessary: AlertTriangle,
  ceiling_missed: Target,
}

function PhaseBadge({ phase }) {
  const colors = PHASE_COLORS[phase] || PHASE_COLORS[1]
  const labels = { 1: 'Observer', 2: 'Advisor', 3: 'Shadow', 4: 'Authority' }
  return (
    <span className={styles.phaseBadge} style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
      <Brain size={12} />
      Phase {phase} — {labels[phase] || 'Observer'}
    </span>
  )
}

function GateStatus({ label, met, current, required, suffix = '' }) {
  return (
    <div className={`${styles.gateItem} ${met ? styles.gateMet : styles.gatePending}`}>
      <div className={styles.gateHeader}>
        <span className={styles.gateLabel}>{label}</span>
        {met ? (
          <Check size={14} color="var(--profit)" />
        ) : (
          <Clock size={14} color="var(--text-muted)" />
        )}
      </div>
      <div className={styles.gateProgress}>
        <div className={styles.gateBar}>
          <div className={styles.gateFill} style={{ width: met ? '100%' : `${Math.min(100, (current / (required || 1)) * 100)}%` }} />
        </div>
        <span className={styles.gateValue}>{current}{suffix} / {required}{suffix}</span>
      </div>
    </div>
  )
}

function PhaseProgress({ from, to, gateStatus }) {
  const gates = gateStatus || {}
  const nextPhaseGates = gates[`phase${from}_to_${to}`] || {}

  return (
    <div className={styles.phaseProgressCard}>
      <div className={styles.phaseProgressHeader}>
        <span className={styles.phaseLabel}>Phase {from} → {to}</span>
        <span className={`${styles.phaseStatus} ${nextPhaseGates.all_met ? styles.statusReady : styles.statusGathering}`}>
          {nextPhaseGates.all_met ? 'All gates met' : 'Gathering requirements'}
        </span>
      </div>
      <div className={styles.gatesList}>
        {Object.entries(nextPhaseGates).filter(([k]) => k !== 'all_met').map(([key, val]) => (
          <GateStatus
            key={key}
            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            met={val}
          />
        ))}
      </div>
    </div>
  )
}

function AssetStatsTable({ stats }) {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className={styles.emptyState}>
        <BarChart2 size={32} style={{ opacity: 0.3 }} />
        <p>No asset statistics yet. Analysis begins after first trade closes.</p>
      </div>
    )
  }

  return (
    <div className={styles.assetTable}>
      <div className={styles.assetTableHeader}>
        <span>Asset</span>
        <span>Trades</span>
        <span>Avg Quality</span>
        <span>Avg MFE</span>
        <span>Avg MAE</span>
        <span>Win Rate</span>
      </div>
      {Object.entries(stats).map(([asset, data]) => (
        <div key={asset} className={styles.assetTableRow}>
          <span className={styles.assetName}>{asset}</span>
          <span className={styles.assetValue}>{data.trades_analyzed || 0}</span>
          <span className={styles.assetValue}>
            {((data.avg_exit_quality_score || 0) * 100).toFixed(0)}%
          </span>
          <span className={styles.assetValue}>
            {data.avg_mfe != null ? `${((data.avg_mfe) * 1).toFixed(2)}%` : '--'}
          </span>
          <span className={styles.assetValue}>
            {data.avg_mae != null ? `${((data.avg_mae) * 1).toFixed(2)}%` : '--'}
          </span>
          <span className={styles.assetValue}>
            {data.win_rate != null ? `${data.win_rate.toFixed(1)}%` : '--'}
          </span>
        </div>
      ))}
    </div>
  )
}

function ObservationCard({ observation }) {
  const Icon = OBSERVATION_ICONS[observation.type] || Eye
  const confidence = (observation.confidence || 0)

  return (
    <div className={styles.observationCard}>
      <div className={styles.observationIcon}>
        <Icon size={14} />
      </div>
      <div className={styles.observationContent}>
        <div className={styles.observationHeader}>
          <span className={styles.observationType}>{observation.type.replace(/_/g, ' ')}</span>
          <span className={styles.observationConfidence}>{Math.round(confidence * 100)}%</span>
        </div>
        <p className={styles.observationDetail}>{observation.detail}</p>
      </div>
    </div>
  )
}

function RecommendationsPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Target size={32} style={{ opacity: 0.3 }} />
        <p>No recommendations generated yet. Phase 2 activates after gates are met.</p>
      </div>
    )
  }

  return (
    <div className={styles.recommendationsList}>
      {recommendations.slice(-10).reverse().map((rec, i) => (
        <div key={i} className={styles.recCard}>
          <div className={styles.recHeader}>
            <span className={styles.recType}>{rec.rec_type?.replace(/_/g, ' ') || rec.type?.replace(/_/g, ' ') || '—'}</span>
            <span className={styles.recAsset}>{rec.asset}</span>
          </div>
          <p className={styles.recText}>{rec.recommendation || rec.text || rec.reason || '—'}</p>
          <div className={styles.recMeta}>
            {rec.outcome && (
              <span className={`${styles.recOutcome} ${styles[rec.outcome]}`}>
                {rec.outcome === 'accurate' ? <Check size={10} /> : rec.outcome === 'inaccurate' ? <X size={10} /> : <Clock size={10} />}
                {rec.outcome}
              </span>
            )}
            {rec.timestamp && (
              <span className={styles.recTime}>{new Date(rec.timestamp).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ShadowPerformancePanel({ shadowPerf }) {
  if (!shadowPerf) {
    return (
      <div className={styles.emptyState}>
        <Eye size={32} style={{ opacity: 0.3 }} />
        <p>Shadow trading activates in Phase 3.</p>
      </div>
    )
  }

  const improvement = (shadowPerf.win_rate_improvement || 0)
  const pnlDelta = (shadowPerf.avg_pnl_delta || 0)

  return (
    <div className={styles.shadowStats}>
      <div className={styles.shadowStatCard}>
        <div className={styles.shadowStatLabel}>Shadow Trades</div>
        <div className={styles.shadowStatValue}>{shadowPerf.shadow_trades_evaluated || 0}</div>
      </div>
      <div className={styles.shadowStatCard}>
        <div className={styles.shadowStatLabel}>Win Rate Improvement</div>
        <div className={`${styles.shadowStatValue} ${improvement >= 0 ? styles.positive : styles.negative}`}>
          {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
        </div>
      </div>
      <div className={styles.shadowStatCard}>
        <div className={styles.shadowStatLabel}>Avg PnL Delta</div>
        <div className={`${styles.shadowStatValue} ${pnlDelta >= 0 ? styles.positive : styles.negative}`}>
          {pnlDelta >= 0 ? '+' : ''}{pnlDelta.toFixed(2)}%
        </div>
      </div>
      <div className={styles.shadowStatCard}>
        <div className={styles.shadowStatLabel}>Shadow Win Rate</div>
        <div className={styles.shadowStatValue}>{(shadowPerf.shadow_win_rate || 0).toFixed(1)}%</div>
      </div>
      <div className={styles.shadowStatCard}>
        <div className={styles.shadowStatLabel}>Actual Win Rate</div>
        <div className={styles.shadowStatValue}>{(shadowPerf.actual_win_rate || 0).toFixed(1)}%</div>
      </div>
      {shadowPerf.multi_asset && (
        <div className={styles.shadowStatCard}>
          <div className={styles.shadowStatLabel}>Multi-Asset Proof</div>
          <div className={styles.shadowMultiAsset}>
            {Object.entries(shadowPerf.multi_asset).map(([asset, delta]) => (
              <span key={asset} className={styles.assetChip}>{asset}: {delta}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Phase4Panel({ phaseState, onApprove, onDisable, loading }) {
  const [showEvidence, setShowEvidence] = useState(false)
  const phase4 = phaseState?.phase4 || {}
  const proposals = phaseState?.active_proposal
  const shadowPerf = phaseState?.shadow_performance
  const evidence = proposals?.evidence || {}
  const isEnabled = phase4?.approved

  return (
    <div className={styles.phase4Card}>
      <div className={styles.phase4Header}>
        <div className={styles.phase4Title}>
          <Shield size={18} color={isEnabled ? 'var(--accent-purple)' : 'var(--text-muted)'} />
          <span>Phase 4 — Exit Authority</span>
          {isEnabled ? (
            <span className={styles.enabledBadge}><Check size={10} /> Enabled</span>
          ) : (
            <span className={styles.disabledBadge}>Requires Approval</span>
          )}
        </div>
      </div>

      {proposals && !isEnabled && (
        <>
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceTitle}>Evidence Summary</div>
            <div className={styles.evidenceGrid}>
              <div className={styles.evidenceItem}>
                <span className={styles.evidenceLabel}>Shadow Trades Evaluated</span>
                <span className={styles.evidenceValue}>{evidence.shadow_trades_evaluated || 0}</span>
              </div>
              <div className={styles.evidenceItem}>
                <span className={styles.evidenceLabel}>Win Rate Improvement</span>
                <span className={`${styles.evidenceValue} ${(evidence.shadow_win_rate_improvement || 0) >= 0 ? styles.positive : styles.negative}`}>
                  +{(evidence.shadow_win_rate_improvement || 0).toFixed(1)}%
                </span>
              </div>
              <div className={styles.evidenceItem}>
                <span className={styles.evidenceLabel}>Avg PnL Delta</span>
                <span className={`${styles.evidenceValue} ${(evidence.avg_pnl_delta || 0) >= 0 ? styles.positive : styles.negative}`}>
                  +{(evidence.avg_pnl_delta || 0).toFixed(2)}%
                </span>
              </div>
              <div className={styles.evidenceItem}>
                <span className={styles.evidenceLabel}>Recommendation Accuracy</span>
                <span className={styles.evidenceValue}>{((evidence.recommendation_accuracy || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className={styles.evidenceItem}>
                <span className={styles.evidenceLabel}>Multi-Asset Proven</span>
                <span className={styles.evidenceValue}>{(evidence.multi_asset_proven || []).join(', ') || '--'}</span>
              </div>
              <div className={styles.evidenceItem}>
                <span className={styles.evidenceLabel}>Recommendations Evaluated</span>
                <span className={styles.evidenceValue}>{evidence.recommendations_evaluated || 0}</span>
              </div>
            </div>

            {showEvidence && (
              <div className={styles.fullEvidence}>
                <h4 className={styles.fullEvidenceTitle}>Restrictions When Enabled</h4>
                <ul className={styles.restrictionsList}>
                  {(proposals.restrictions || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className={styles.viewEvidenceBtn} onClick={() => setShowEvidence(!showEvidence)}>
              {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showEvidence ? 'Hide Full Evidence' : 'View Full Evidence'}
            </button>
          </div>

          <div className={styles.phase4Actions}>
            <button
              className={styles.enableBtn}
              onClick={onApprove}
              disabled={loading}
            >
              <Shield size={14} />
              Enable Phase 4
            </button>
            <button
              className={styles.disableBtn}
              onClick={onDisable}
              disabled={loading}
            >
              Disable Phase 4
            </button>
          </div>
        </>
      )}

      {isEnabled && (
        <div className={styles.phase4EnabledState}>
          <p>Phase 4 is active. Hermes may generate exit modification proposals for human review.</p>
          <div className={styles.phase4Actions}>
            <button
              className={styles.disableBtn}
              onClick={onDisable}
              disabled={loading}
            >
              Disable Phase 4
            </button>
          </div>
        </div>
      )}

      {!proposals && !isEnabled && (
        <div className={styles.emptyState}>
          <Shield size={32} style={{ opacity: 0.3 }} />
          <p>Phase 4 gates not yet met. Continue trading to build evidence.</p>
        </div>
      )}
    </div>
  )
}

function RecentObservations({ records }) {
  if (!records || records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Eye size={32} style={{ opacity: 0.3 }} />
        <p>No observations yet. Analysis begins when trades close.</p>
      </div>
    )
  }

  return (
    <div className={styles.observationsList}>
      {records.slice(-10).reverse().map((record, i) => (
        <div key={i} className={styles.recordCard}>
          <div className={styles.recordHeader}>
            <span className={styles.recordAsset}>{record.asset}</span>
            <span className={styles.recordTime}>{record.timestamp ? new Date(record.timestamp).toLocaleDateString() : ''}</span>
          </div>
          <div className={styles.recordScore}>
            Exit Quality: <strong>{((record.exit_quality_score || 0) * 100).toFixed(0)}%</strong>
          </div>
          <div className={styles.recordMeta}>
            PnL: {((record.pnl_pct || 0) >= 0 ? '+' : '')}{(record.pnl_pct || 0).toFixed(2)}% |
            MFE: {((record.mfe_pct || 0) >= 0 ? '+' : '')}{(record.mfe_pct || 0).toFixed(2)}% |
            MAE: {((record.mae_pct || 0) >= 0 ? '+' : '')}{(record.mae_pct || 0).toFixed(2)}%
          </div>
          {record.observations && record.observations.length > 0 && (
            <div className={styles.recordObservations}>
              {record.observations.map((obs, j) => (
                <ObservationCard key={j} observation={obs} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ExitIntelligence() {
  const { authToken } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)

  const fetchData = useCallback(async () => {
    if (!authToken) return
    try {
      const url = `https://tradeforge-production-fbc1.up.railway.app/debug/exit-intelligence?token=${encodeURIComponent(authToken)}`
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleApprove = async () => {
    setActionLoading(true)
    setActionMsg(null)
    try {
      const res = await fetch(
        `https://tradeforge-production-fbc1.up.railway.app/debug/exit-intelligence/phase4-approve?token=${encodeURIComponent(authToken)}`,
        { method: 'POST', signal: AbortSignal.timeout(10000) }
      )
      const json = await res.json()
      setActionMsg(res.ok ? 'Phase 4 approved!' : `Error: ${json.error || res.statusText}`)
      if (res.ok) fetchData()
    } catch (e) {
      setActionMsg(`Error: ${e.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisable = async () => {
    setActionLoading(true)
    setActionMsg(null)
    try {
      const res = await fetch(
        `https://tradeforge-production-fbc1.up.railway.app/debug/exit-intelligence/phase4-disable?token=${encodeURIComponent(authToken)}`,
        { method: 'POST', signal: AbortSignal.timeout(10000) }
      )
      const json = await res.json()
      setActionMsg(res.ok ? 'Phase 4 disabled.' : `Error: ${json.error || res.statusText}`)
      if (res.ok) fetchData()
    } catch (e) {
      setActionMsg(`Error: ${e.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Brain size={32} style={{ opacity: 0.3, animation: 'pulse 2s ease-in-out infinite' }} />
          <p>Loading Exit Intelligence data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <AlertTriangle size={32} />
          <p>Failed to load Exit Intelligence: {error}</p>
          <button className={styles.retryBtn} onClick={fetchData}>Retry</button>
        </div>
      </div>
    )
  }

  const phaseState = data?.phase_state || {}
  const currentPhase = phaseState.current_phase || 1
  const assetStats = data?.asset_exit_stats || {}
  const gatewayStatus = data?.gateway_status || {}
  const recentRecords = data?.recent_exit_records || []
  const recentRecs = data?.recent_recommendations || []
  const shadowPerf = data?.shadow_performance
  const activeProposal = data?.active_proposal

  const phase4Ready = phaseState.phase3?.to_phase_4?.all_met || gatewayStatus?.phase3_to_phase4?.all_met || false

  return (
    <div className={styles.container}>
      {/* Phase Header */}
      <div className={styles.phaseHeader}>
        <div className={styles.phaseHeaderLeft}>
          <PhaseBadge phase={currentPhase} />
          <span className={styles.phaseDescription}>
            {currentPhase === 1 && 'Learning from every exit. Score quality, generate observations.'}
            {currentPhase === 2 && 'Hermes provides exit recommendations for open positions.'}
            {currentPhase === 3 && 'Phantom exits tracked against actual outcomes.'}
            {currentPhase === 4 && 'Exit proposals generated for human review.'}
          </span>
        </div>
        <div className={styles.backfillBadge}>
          {phaseState.phase1?.total_trades_analyzed || 0} trades analyzed
        </div>
      </div>

      {/* Phase 1 Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Exit Quality Score</div>
          <div className={styles.statValue}>
            {((phaseState.phase1?.avg_exit_quality_score || 0) * 100).toFixed(0)}%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Observations</div>
          <div className={styles.statValue}>{phaseState.phase1?.total_observations_generated || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Recommendations</div>
          <div className={styles.statValue}>{phaseState.phase2?.recommendations_made || 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Rec Accuracy</div>
          <div className={`${styles.statValue} ${(phaseState.phase2?.accuracy_rate || 0) >= 0.6 ? styles.positive : ''}`}>
            {phaseState.phase2?.accuracy_rate != null ? `${((phaseState.phase2?.accuracy_rate) * 100).toFixed(0)}%` : '--'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Shadow Trades</div>
          <div className={styles.statValue}>{phaseState.phase3?.shadow_trades || 0}</div>
        </div>
      </div>

      {/* Phase Progression */}
      {currentPhase < 4 && (
        <div className={styles.phaseProgression}>
          <h2 className={styles.sectionHeading}>Phase Progression</h2>
          <div className={styles.phaseGatesGrid}>
            {currentPhase === 1 && <PhaseProgress from={1} to={2} gateStatus={gatewayStatus} />}
            {currentPhase < 3 && <PhaseProgress from={2} to={3} gateStatus={gatewayStatus} />}
            {currentPhase < 4 && phase4Ready && <PhaseProgress from={3} to={4} gateStatus={gatewayStatus} />}
            {currentPhase < 4 && !phase4Ready && (
              <PhaseProgress from={Math.min(currentPhase + 1, 3)} to={Math.min(currentPhase + 2, 4)} gateStatus={gatewayStatus} />
            )}
          </div>
        </div>
      )}

      {/* Per-Asset Stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>Per-Asset Performance</h2>
        <AssetStatsTable stats={assetStats} />
      </div>

      {/* Phase 2+ Recommendations */}
      {currentPhase >= 2 && (
        <div className={styles.section}>
          <h2 className={styles.sectionHeading}>Recent Recommendations</h2>
          <RecommendationsPanel recommendations={recentRecs} />
        </div>
      )}

      {/* Phase 3 Shadow Performance */}
      {currentPhase >= 3 && (
        <div className={styles.section}>
          <h2 className={styles.sectionHeading}>Shadow Trading Performance</h2>
          <ShadowPerformancePanel shadowPerf={shadowPerf} />
        </div>
      )}

      {/* Phase 4 Controls */}
      {phase4Ready || phaseState.phase4?.approved ? (
        <div className={styles.section}>
          <h2 className={styles.sectionHeading}>Phase 4 Controls</h2>
          <Phase4Panel
            phaseState={phaseState}
            activeProposal={activeProposal}
            onApprove={handleApprove}
            onDisable={handleDisable}
            loading={actionLoading}
          />
          {actionMsg && (
            <div className={`${styles.actionMsg} ${actionMsg.includes('Error') ? styles.errorMsg : styles.successMsg}`}>
              {actionMsg}
            </div>
          )}
        </div>
      ) : null}

      {/* Recent Observations */}
      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>Recent Exit Observations</h2>
        <RecentObservations records={recentRecords} />
      </div>
    </div>
  )
}