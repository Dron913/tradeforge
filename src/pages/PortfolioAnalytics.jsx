import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { useEquityCurve, useMetrics, useClosedTrades } from '../context/TradingContext'
import styles from './PortfolioAnalytics.module.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const timeRanges = ['1W', '1M', '3M', 'YTD', '1Y', 'All']

const getCellColor = (value) => {
  if (value > 8) return 'rgba(16, 185, 129, 0.9)'
  if (value > 5) return 'rgba(16, 185, 129, 0.6)'
  if (value > 2) return 'rgba(16, 185, 129, 0.3)'
  if (value > 0) return 'rgba(16, 185, 129, 0.15)'
  if (value > -2) return 'rgba(244, 63, 94, 0.15)'
  if (value > -5) return 'rgba(244, 63, 94, 0.3)'
  return 'rgba(244, 63, 94, 0.6)'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {formatCurrency(payload[0].value)}
        </p>
        {payload[1] && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--loss)', marginTop: '4px' }}>
            DD: {payload[1].value.toFixed(2)}%
          </p>
        )}
      </div>
    )
  }
  return null
}

const BarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2) var(--space-3)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
          {payload[0].payload.count} trades
        </p>
      </div>
    )
  }
  return null
}

function deriveWinLoss(trades) {
  const buckets = { '-$500+': 0, '-$250 to -$500': 0, '-$1 to -$250': 0, '$0 to $250': 0, '$250 to $500': 0, '$500 to $1000': 0, '$1000+': 0 }
  for (const t of trades) {
    const p = t.pnlPercent || 0
    if (p <= -500) buckets['-$500+']++
    else if (p <= -250) buckets['-$250 to -$500']++
    else if (p <= -1) buckets['-$1 to -$250']++
    else if (p <= 250) buckets['$0 to $250']++
    else if (p <= 500) buckets['$250 to $500']++
    else if (p <= 1000) buckets['$500 to $1000']++
    else buckets['$1000+']++
  }
  return Object.entries(buckets).map(([range, count]) => ({ range, count, type: range.startsWith('-') ? 'loss' : 'win' }))
}

function deriveAssetContrib(trades) {
  const assets = {}
  const colors = { BTC: '#F7931A', ETH: '#627EEA', SOL: '#00FFA3', XRP: '#23292F' }
  for (const t of trades) {
    if (!assets[t.asset]) assets[t.asset] = 0
    assets[t.asset] += Math.abs(t.pnlPercent || 0)
  }
  const total = Object.values(assets).reduce((s, v) => s + v, 1)
  return Object.entries(assets).map(([asset, val]) => ({
    asset, value: Math.round(val * 100), percentage: Math.round(val / total * 1000) / 10, color: colors[asset] || '#64748B',
  }))
}

export default function PortfolioAnalytics() {
  const equityCurveData = useEquityCurve()
  const metrics = useMetrics()
  const closedTrades = useClosedTrades()
  const [timeRange, setTimeRange] = useState('3M')

  // Derive stats from closed trades
  const wins = closedTrades.filter(t => (t.pnlPercent || 0) > 0)
  const losses = closedTrades.filter(t => (t.pnlPercent || 0) <= 0)
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0
  const grossProfits = wins.reduce((s, t) => s + (t.pnlPercent || 0), 0)
  const grossLosses = Math.abs(losses.reduce((s, t) => s + (t.pnlPercent || 0), 0))
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 999 : 0
  const sortedPnl = [...closedTrades].map(t => t.pnlPercent || 0).sort((a, b) => a - b)
  const largestWin = sortedPnl[sortedPnl.length - 1] || 0
  const largestLoss = sortedPnl[0] || 0

  // Win/loss distribution from live trades
  const winLossDistribution = closedTrades.length > 0 ? deriveWinLoss(closedTrades) : []
  const assetContribution = closedTrades.length > 0 ? deriveAssetContrib(closedTrades) : []

  const totalReturn = equityCurveData.length > 0
    ? equityCurveData[equityCurveData.length - 1].value - equityCurveData[0].value
    : 0
  const returnPercent = equityCurveData.length > 1 && equityCurveData[0].value > 0
    ? (totalReturn / equityCurveData[0].value) * 100
    : 0

  // Derive monthly returns from closed trades
  function deriveMonthlyReturns(trades) {
    const buckets = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (const t of trades) {
      const d = new Date(t.exitTime || t.entryTime)
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`
      if (!buckets[key]) buckets[key] = { month: key, returns: 0, count: 0 }
      buckets[key].returns += Math.abs(t.pnlPercent || 0) * (t.pnlPercent >= 0 ? 1 : -1)
      buckets[key].count++
    }
    return Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month))
  }

  const monthlyReturnsData = closedTrades.length > 0 ? deriveMonthlyReturns(closedTrades) : []
  const bestMonth = monthlyReturnsData.length > 0
    ? monthlyReturnsData.reduce((max, m) => m.returns > max.returns ? m : max)
    : null
  const worstMonth = monthlyReturnsData.length > 0
    ? monthlyReturnsData.reduce((min, m) => m.returns < min.returns ? m : min)
    : null
  const avgMonthly = monthlyReturnsData.length > 0
    ? monthlyReturnsData.reduce((s, m) => s + m.returns, 0) / monthlyReturnsData.length
    : 0

  return (
    <div className={styles.container}>
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Return</div>
          <div className={`${styles.metricValue} ${totalReturn >= 0 ? styles.positive : styles.negative}`}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            {returnPercent.toFixed(2)}%
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Best Month</div>
          <div className={`${styles.metricValue} ${styles.positive}`}>
            {bestMonth ? `+${bestMonth.returns.toFixed(1)}%` : '--'}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Worst Month</div>
          <div className={`${styles.metricValue} ${styles.negative}`}>
            {worstMonth ? `${worstMonth.returns.toFixed(1)}%` : '--'}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Avg Monthly</div>
          <div className={`${styles.metricValue} ${avgMonthly >= 0 ? styles.positive : styles.negative}`}>
            {monthlyReturnsData.length > 0 ? `${avgMonthly >= 0 ? '+' : ''}${avgMonthly.toFixed(2)}%` : '--'}
          </div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Equity Curve & Drawdown</h2>
          <div className={styles.chartControls}>
            {timeRanges.map(range => (
              <button
                key={range}
                className={`${styles.timeBtn} ${timeRange === range ? styles.active : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurveData}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="drawdown"
                stackId="1"
                stroke="#F43F5E"
                strokeWidth={0}
                fill="url(#drawdownGradient)"
                opacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00D4FF"
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#00D4FF' }} />
            Portfolio Value
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#F43F5E' }} />
            Drawdown
          </div>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsCard}>
          <h3 className={styles.analyticsTitle}>Monthly Returns</h3>
          {monthlyReturnsData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>
              No monthly data yet. Returns accumulate as trades close.
            </div>
          ) : (
            <div className={styles.performanceGrid}>
              {monthlyReturnsData.map(month => {
                const maxReturn = Math.max(...monthlyReturnsData.map(m => Math.abs(m.returns)), 1)
                const height = Math.abs(month.returns) / maxReturn * 100
                return (
                  <div key={month.month} className={styles.monthBar}>
                    <div className={styles.barWrapper}>
                      <div
                        className={`${styles.bar} ${month.returns >= 0 ? styles.positive : styles.negative}`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className={styles.monthLabel}>{month.month}</span>
                    <span className={`${styles.monthValue} ${month.returns >= 0 ? styles.positive : styles.negative}`}>
                      {month.returns > 0 ? '+' : ''}{month.returns.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={styles.analyticsCard}>
          <h3 className={styles.analyticsTitle}>Win/Loss Distribution</h3>
          <div className={styles.histogramContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winLossDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis
                  dataKey="range"
                  type="category"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {winLossDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === 'win' ? '#10B981' : '#F43F5E'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <h3 className={styles.analyticsTitle}>Asset Allocation</h3>
          <div style={{ padding: 'var(--space-4) 0' }}>
            {assetContribution.map(asset => (
              <div key={asset.asset} className={styles.assetBar}>
                <span className={styles.assetBarLabel}>{asset.asset}</span>
                <div className={styles.assetBarTrack}>
                  <div
                    className={styles.assetBarFill}
                    style={{ width: `${asset.percentage}%`, background: asset.color }}
                  />
                </div>
                <span className={styles.assetBarValue}>{asset.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.analyticsCard}>
          <h3 className={styles.analyticsTitle}>Trade Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Trades</span>
              <span className={styles.statValue}>{closedTrades.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Win Rate</span>
              <span className={styles.statValue}>{winRate.toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Profit Factor</span>
              <span className={styles.statValue}>{profitFactor > 999 ? '∞' : profitFactor.toFixed(2)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Avg Win</span>
              <span className={styles.statValue} style={{ color: 'var(--profit)' }}>
                {wins.length > 0 ? `+${(grossProfits / wins.length).toFixed(2)}%` : '--'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Avg Loss</span>
              <span className={styles.statValue} style={{ color: 'var(--loss)' }}>
                {losses.length > 0 ? `-${(grossLosses / losses.length).toFixed(2)}%` : '--'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Largest Win</span>
              <span className={styles.statValue} style={{ color: 'var(--profit)' }}>
                {largestWin > 0 ? `+${largestWin.toFixed(2)}%` : '--'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Largest Loss</span>
              <span className={styles.statValue} style={{ color: 'var(--loss)' }}>
                {largestLoss < 0 ? `${largestLoss.toFixed(2)}%` : '--'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Sharpe Ratio</span>
              <span className={styles.statValue}>{(metrics.sharpeRatio || 1.5).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}