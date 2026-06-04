import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Brain, ArrowRight, RefreshCw, Wallet, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMetrics, useOpenPositions, useClosedTrades, useEquityCurve, useHealth, usePaperAccount } from '../context/TradingContext'
import { TradeDetailModal, PositionDetailModal } from '../components/Modal/TradeDetailModal'
import styles from './Dashboard.module.css'

function formatCurrency(value) {
  if (value == null) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

function formatPercent(value) {
  if (value == null) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatPnlPercent(value) {
  if (value == null) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Live P&L percentage -> approximate USD (base $100k portfolio)
function pnlToUsd(pct) {
  return pct != null ? pct * 1000 : 0
}

export default function Dashboard() {
  const metrics = useMetrics()
  const openPositions = useOpenPositions()
  const closedTrades = useClosedTrades()
  const equityCurve = useEquityCurve()
  const { health, connected, loading, lastUpdated } = useHealth()
  const paperAccount = usePaperAccount()
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)

  // Derived stats from live data — newest first
  const recentTrades = [
    ...openPositions.slice(-3).reverse().map(p => ({ ...p, _type: 'open' })),
    ...closedTrades.slice(-3).reverse().map(t => ({ ...t, _type: 'closed' })),
  ]

  // Best and worst trade
  let bestTrade = null, worstTrade = null
  if (closedTrades.length > 0) {
    const sorted = [...closedTrades].sort((a, b) => (b.pnlPercent || 0) - (a.pnlPercent || 0))
    bestTrade = sorted[0]
    worstTrade = sorted[sorted.length - 1]
  }

  // Build metrics grid from live data
  const metricsGrid = [
    { label: 'Total Return', value: formatPercent(metrics.totalReturn), trend: `${formatPercent(metrics.dailyPnLPercent)} today`, direction: metrics.totalReturn >= 0 ? 'up' : 'down' },
    { label: 'Daily P&L', value: formatCurrency(metrics.dailyPnL), trend: formatPercent(metrics.dailyPnLPercent), direction: metrics.dailyPnL >= 0 ? 'up' : 'down' },
    { label: 'Win Rate', value: `${metrics.winRate || 0}%`, trend: `${closedTrades.length} trades`, direction: 'neutral' },
    { label: 'Profit Factor', value: metrics.profitFactor || '--', trend: 'all time', direction: metrics.profitFactor > 1 ? 'up' : 'down' },
    { label: 'Active Trades', value: openPositions.length, trend: 'positions open', direction: 'neutral' },
    { label: 'Strategy', value: metrics.currentStrategy || 'v0008', trend: 'live', direction: 'up' },
    { label: 'Max Drawdown', value: formatPercent(metrics.maxDrawdown), trend: 'all time', direction: 'down' },
    { label: 'Closed Trades', value: closedTrades.length, trend: 'all time', direction: 'neutral' },
  ]

  const chartData = equityCurve.length > 0 ? equityCurve.slice(-30) : []

  return (
    <div className={styles.dashboard}>
      {/* Connection status bar */}
      {loading && (
        <div className={styles.statusBar}>
          <RefreshCw size={12} className={styles.spinning} />
          <span>Connecting to TradeForge backend...</span>
        </div>
      )}
      {!loading && !connected && (
        <div className={styles.statusBar} style={{ background: 'rgba(244,63,94,0.1)', borderColor: 'var(--loss)' }}>
          <span className={styles.statusDotError} />
          <span>Backend offline — showing fallback data</span>
        </div>
      )}
      {!loading && connected && (
        <div className={styles.statusBar}>
          <span className={styles.statusDotLive} />
          <span>Live — {openPositions.length} open positions · {closedTrades.length} closed trades</span>
          {lastUpdated && <span className={styles.lastUpdated}>
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>}
        </div>
      )}

      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          <div className={styles.heroLabel}>Portfolio Value</div>
          <div className={styles.heroValue}>
            {formatCurrency(metrics.totalValue)}
          </div>
          <div className={`${styles.heroTrend} ${(metrics.monthlyPnL || 0) >= 0 ? styles.up : styles.down}`}>
            <TrendingUp size={18} />
            <span>{metrics.monthlyPnL >= 0 ? '+' : ''}{formatCurrency(metrics.monthlyPnL)} ({formatPercent(metrics.monthlyPnLPercent)}) this month</span>
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.heroMetaItem}>
              <div className={styles.heroMetaLabel}>Weekly P&L</div>
              <div className={styles.heroMetaValue} style={{ color: (metrics.weeklyPnL || 0) >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                {formatCurrency(metrics.weeklyPnL)}
              </div>
            </div>
            <div className={styles.heroMetaItem}>
              <div className={styles.heroMetaLabel}>Win Rate</div>
              <div className={styles.heroMetaValue}>{metrics.winRate || 0}%</div>
            </div>
            <div className={styles.heroMetaItem}>
              <div className={styles.heroMetaLabel}>Sharpe Ratio</div>
              <div className={styles.heroMetaValue}>
                {metrics.sharpeRatio?.toFixed(2) || '--'}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.miniChartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Portfolio Performance</span>
            {chartData.length === 0 && <span className={styles.chartPlaceholder}>No equity data yet</span>}
          </div>
          <div className={styles.sparklineContainer}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00D4FF"
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>
                <Activity size={24} />
                <span>Equity curve will appear as trades close</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paper Account Transparency Panel */}
      {paperAccount && (
        <div className={styles.paperAccountPanel}>
          <div className={styles.paperAccountHeader}>
            <div className={styles.paperAccountTitle}>
              <Wallet size={16} />
              Paper Account
            </div>
            <div className={styles.paperAccountBadge}>
              <DollarSign size={12} />
              Capital Tracking
            </div>
          </div>
          <div className={styles.paperAccountGrid}>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Starting Balance</div>
              <div className={styles.paperMetricValue}>
                {formatCurrency(paperAccount.starting_balance)}
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Current Balance</div>
              <div className={`${styles.paperMetricValue} ${paperAccount.current_balance >= paperAccount.starting_balance ? styles.positive : styles.negative}`}>
                {formatCurrency(paperAccount.current_balance)}
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Realized P&L</div>
              <div className={`${styles.paperMetricValue} ${paperAccount.realized_pnl_usd >= 0 ? styles.positive : styles.negative}`}>
                {paperAccount.realized_pnl_usd >= 0 ? '+' : ''}{formatCurrency(paperAccount.realized_pnl_usd)}
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Unrealized P&L</div>
              <div className={`${styles.paperMetricValue} ${paperAccount.unrealized_pnl_usd >= 0 ? styles.positive : styles.negative}`}>
                {paperAccount.unrealized_pnl_usd >= 0 ? '+' : ''}{formatCurrency(paperAccount.unrealized_pnl_usd)}
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Available Capital</div>
              <div className={`${styles.paperMetricValue} ${styles.muted}`}>
                {formatCurrency(paperAccount.available_capital)}
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Capital Deployed</div>
              <div className={`${styles.paperMetricValue} ${styles.muted}`}>
                {formatCurrency(paperAccount.deployed_capital)}
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Utilization</div>
              <div className={`${styles.paperMetricValue} ${paperAccount.capital_utilization_pct > 75 ? styles.warning : styles.muted}`}>
                {paperAccount.capital_utilization_pct.toFixed(1)}%
              </div>
            </div>
            <div className={styles.paperMetric}>
              <div className={styles.paperMetricLabel}>Net P&L</div>
              <div className={`${styles.paperMetricValue} ${(paperAccount.realized_pnl_usd + paperAccount.unrealized_pnl_usd) >= 0 ? styles.positive : styles.negative}`}>
                {(paperAccount.realized_pnl_usd + paperAccount.unrealized_pnl_usd) >= 0 ? '+' : ''}{formatCurrency(paperAccount.realized_pnl_usd + paperAccount.unrealized_pnl_usd)}
              </div>
            </div>
          </div>
          <div className={styles.paperAccountFormula}>
            Portfolio Value formula: Starting Balance × (1 + Σ P&L%) = {formatCurrency(paperAccount.starting_balance)} × (1 + {(metrics.totalReturn || 0).toFixed(2)}%)
            {' → '}{formatCurrency(metrics.totalValue || paperAccount.current_balance)}
            {' | '}
            Starting Balance confirmed from Railway persistent state
          </div>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Performance Metrics</h2>
        <div className={styles.quickActions}>
          <div className={`${styles.statusIndicator} ${connected ? styles.statusOk : styles.statusWarn}`}>
            <span className={connected ? styles.statusDot : styles.statusDotWarn} />
            {connected ? 'AI Active' : 'AI Offline'}
          </div>
          <Link to="/reflections" className="btn secondary sm">
            <Brain size={14} />
            Start Reflection
          </Link>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {metricsGrid.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.metricValue}>{metric.value}</div>
            <div className={`${styles.metricTrend} ${styles[metric.direction]}`}>
              {metric.direction === 'up' && <TrendingUp size={14} />}
              {metric.direction === 'down' && <TrendingDown size={14} />}
              <span>{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <Link to="/trading" className="btn ghost sm">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className={styles.activityGrid}>
        <div className={styles.recentTrades}>
          {recentTrades.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={32} />
              <p>No live trades yet. The trading loop is running on Railway.</p>
            </div>
          ) : (
            <table className={styles.tradesTable}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Current/Exit</th>
                  <th>P&L</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(trade => (
                  <tr
                    key={trade.id}
                    onClick={() => trade._type === 'open' ? setSelectedPosition(trade) : setSelectedTrade(trade)}
                    title="Click for trade details"
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className={styles.tradeAsset}>{trade.asset}</div>
                    </td>
                    <td>
                      <span className={`${styles.tradeSide} ${styles[trade.side]}`}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.mono}>{formatCurrency(trade.entryPrice)}</td>
                    <td className={styles.mono}>
                      {trade.currentPrice
                        ? formatCurrency(trade.currentPrice)
                        : trade.exitPrice
                          ? formatCurrency(trade.exitPrice)
                          : '-'}
                    </td>
                    <td className={`${styles.mono} ${(trade.pnlPercent || 0) >= 0 ? styles.positive : styles.negative}`}>
                      {formatPnlPercent(trade.pnlPercent)}
                    </td>
                    <td className={styles.muted}>{trade.duration || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Open Positions</div>
            <div className={styles.statValue}>{openPositions.length}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Today's Trades</div>
            <div className={styles.statValue}>{closedTrades.filter(t => {
              const tradeDate = new Date(t.exitTime || t.entryTime)
              const today = new Date()
              return tradeDate.toDateString() === today.toDateString()
            }).length}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statValue}>{metrics.winRate || 0}%</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Best Trade</div>
            <div className={styles.statValue} style={{ color: 'var(--profit)' }}>
              {bestTrade ? formatPnlPercent(bestTrade.pnlPercent) : '--'}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Worst Trade</div>
            <div className={styles.statValue} style={{ color: 'var(--loss)' }}>
              {worstTrade ? formatPnlPercent(worstTrade.pnlPercent) : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Trade & Position Detail Modals */}
      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
      {selectedPosition && (
        <PositionDetailModal position={selectedPosition} onClose={() => setSelectedPosition(null)} />
      )}
    </div>
  )
}