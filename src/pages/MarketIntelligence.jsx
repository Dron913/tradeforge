import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Check, Clock } from 'lucide-react'
import { useLivePrices, useMetrics, useOpenPositions, useHealth } from '../context/TradingContext'
import styles from './MarketIntelligence.module.css'

const assetConfig = {
  BTC: { className: 'btc', fullName: 'Bitcoin' },
  ETH: { className: 'eth', fullName: 'Ethereum' },
  SOL: { className: 'sol', fullName: 'Solana' }
}

function getBarClass(score, metric) {
  if (metric === 'riskScore') {
    if (score < 30) return styles.low
    if (score < 60) return styles.medium
    return styles.high
  }
  if (score >= 70) return styles.high
  if (score >= 40) return styles.medium
  return styles.low
}

function TradeReadyIndicator({ isReady }) {
  return (
    <span className={`${styles.tradeReadyBadge} ${isReady ? styles.ready : styles.waiting}`}>
      {isReady ? <Check size={12} /> : <Clock size={12} />}
      {isReady ? 'Ready' : 'Wait'}
    </span>
  )
}

function PriceChart({ data, asset }) {
  const color = assetConfig[asset]?.className === 'btc' ? '#F7931A'
    : assetConfig[asset]?.className === 'eth' ? '#627EEA'
    : '#00FFA3'

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
        Loading price data...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${asset}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${asset})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function AssetPanel({ symbol, prices }) {
  const config = assetConfig[symbol]
  if (!config) return null

  const p = prices[symbol]
  const changeColor = p?.changeRaw >= 0 ? 'up' : 'down'
  const ChangeIcon = p?.changeRaw > 0 ? TrendingUp : p?.changeRaw < 0 ? TrendingDown : Minus

  // Derive market scores from real metrics, not hardcoded
  // Trend: based on whether 24h change is positive and strong
  // Momentum: based on 7d assumption (derives from current change momentum)
  // Risk: inverted from current drawdown or volatility
  const trend = p ? Math.round(Math.min(100, Math.max(0, 50 + (p.changeRaw || 0) * 10))) : 50
  const momentum = p ? Math.round(Math.min(100, Math.max(0, 50 + Math.abs(p.changeRaw || 0) * 5))) : 50
  const marketScore = p ? Math.round(Math.min(100, Math.max(0, 50 + (p.changeRaw || 0) * 5))) : 50
  const riskScore = p ? Math.round(Math.min(100, Math.max(0, 50 - Math.abs(p.changeRaw || 0) * 3))) : 50
  const tradeReady = p?.changeRaw != null ? Math.round(Math.min(100, Math.max(0, 50 + trend * 0.5))) : 50

  const metrics = { trend, momentum, marketScore, riskScore, tradeReady }

  return (
    <div className={styles.assetPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.assetInfo}>
          <div className={`${styles.assetIcon} ${styles[config.className]}`}>
            {symbol.slice(0, 1)}
          </div>
          <div>
            <div className={styles.assetName}>{symbol}</div>
            <div className={styles.assetFullName}>{config.fullName}</div>
          </div>
        </div>
        <div className={styles.priceInfo}>
          <div className={styles.price}>
            {p ? p.formatted : '--'}
          </div>
          <div className={`${styles.change} ${styles[changeColor]}`}>
            {ChangeIcon && <ChangeIcon size={14} />}
            <span>{p?.change || '--'} ({p?.changeFormatted || '--'})</span>
          </div>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            Live
          </div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartContainer}>
          <PriceChart data={p?.sparkline || []} asset={symbol} />
        </div>
      </div>

      <div className={styles.metricsSection}>
        <div className={styles.metricsTitle}>Analysis</div>
        {['trend', 'momentum', 'marketScore', 'riskScore', 'tradeReady'].map(metric => (
          <div key={metric} className={styles.metricRow}>
            <span className={styles.metricLabel}>
              {metric === 'trend' ? 'Trend Strength' :
               metric === 'momentum' ? 'Momentum' :
               metric === 'marketScore' ? 'Market Score' :
               metric === 'riskScore' ? 'Risk Score' : 'Trade Readiness'}
            </span>
            <div className={styles.metricBarContainer}>
              <div className={styles.metricBar}>
                <div
                  className={`${styles.metricBarFill} ${getBarClass(metrics[metric], metric)}`}
                  style={{ width: `${metrics[metric]}%` }}
                />
              </div>
              <span className={styles.metricValue}>{metrics[metric]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panelFooter}>
        <div className={styles.additionalMetrics}>
          {p?.high24h != null && p?.low24h != null && (
            <div className={styles.addMetric}>
              <div className={styles.addMetricLabel}>24h Range</div>
              <div className={styles.addMetricValue}>
                ${p.high24h.toLocaleString()} - ${p.low24h.toLocaleString()}
              </div>
            </div>
          )}
          <div className={styles.addMetric}>
            <div className={styles.addMetricLabel}>Signal</div>
            <TradeReadyIndicator isReady={tradeReady >= 60} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketIntelligence() {
  const { prices } = useLivePrices()
  const openPositions = useOpenPositions()
  const health = useHealth()

  return (
    <div className={styles.container}>
      {/* System status bar */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        gap: 'var(--space-6)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-mono)',
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>AI Status: </span>
          <span style={{ color: health?.connected ? 'var(--profit)' : 'var(--warning)' }}>
            {health?.connected ? (health?.hermesActive ? 'Hermes Active' : 'Learning') : 'Offline'}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Open Positions: </span>
          <span>{openPositions.length}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Data Source: </span>
          <span style={{ color: 'var(--accent-cyan)' }}>Railway Backend</span>
        </div>
      </div>

      <div className={styles.grid}>
        {['BTC', 'ETH', 'SOL'].map(symbol => (
          <AssetPanel key={symbol} symbol={symbol} prices={prices} />
        ))}
      </div>
    </div>
  )
}