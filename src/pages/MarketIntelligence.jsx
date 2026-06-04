import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Check, Clock } from 'lucide-react'
import { marketAssets } from '../data/mockData'
import styles from './MarketIntelligence.module.css'

const assetConfig = {
  BTC: { className: 'btc', fullName: 'Bitcoin' },
  ETH: { className: 'eth', fullName: 'Ethereum' },
  SOL: { className: 'sol', fullName: 'Solana' }
}

const metricLabels = {
  trend: 'Trend Strength',
  momentum: 'Momentum',
  marketScore: 'Market Score',
  riskScore: 'Risk Score',
  tradeReady: 'Trade Readiness'
}

function getBarClass(score, metric) {
  if (metric === 'riskScore') {
    if (score < 40) return styles.low
    if (score < 60) return styles.medium
    return styles.high
  }
  if (score >= 70) return styles.high
  if (score >= 40) return styles.medium
  return styles.low
}

function TradeReadyIndicator({ score }) {
  const isReady = score >= 70
  return (
    <span className={`${styles.tradeReadyBadge} ${isReady ? styles.ready : styles.waiting}`}>
      {isReady ? <Check size={12} /> : <Clock size={12} />}
      {isReady ? 'Ready' : 'Wait'}
    </span>
  )
}

function PriceChart({ data, asset }) {
  const color = assetConfig[asset].className === 'btc' ? '#F7931A'
    : assetConfig[asset].className === 'eth' ? '#627EEA'
    : '#00FFA3'

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

function AssetPanel({ symbol, data }) {
  const config = assetConfig[symbol]
  const changeColor = data.change24h >= 0 ? 'up' : 'down'
  const ChangeIcon = data.change24h > 0 ? TrendingUp : data.change24h < 0 ? TrendingDown : Minus

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
            ${symbol === 'BTC' ? data.price.toLocaleString()
              : symbol === 'ETH' ? data.price.toLocaleString()
              : data.price.toFixed(2)}
          </div>
          <div className={`${styles.change} ${styles[changeColor]}`}>
            <ChangeIcon size={14} />
            <span>{data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}% (24h)</span>
          </div>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            Live
          </div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartContainer}>
          <PriceChart data={data.sparklineData} asset={symbol} />
        </div>
      </div>

      <div className={styles.metricsSection}>
        <div className={styles.metricsTitle}>Analysis</div>
        {['trend', 'momentum', 'marketScore', 'riskScore', 'tradeReady'].map(metric => (
          <div key={metric} className={styles.metricRow}>
            <span className={styles.metricLabel}>{metricLabels[metric]}</span>
            <div className={styles.metricBarContainer}>
              <div className={styles.metricBar}>
                <div
                  className={`${styles.metricBarFill} ${getBarClass(data[metric], metric)}`}
                  style={{ width: `${data[metric]}%` }}
                />
              </div>
              <span className={styles.metricValue}>{data[metric]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panelFooter}>
        <div className={styles.additionalMetrics}>
          <div className={styles.addMetric}>
            <div className={styles.addMetricLabel}>7d Change</div>
            <div className={styles.addMetricValue} style={{ color: data.change7d >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
              {data.change7d >= 0 ? '+' : ''}{data.change7d.toFixed(2)}%
            </div>
          </div>
          <div className={styles.addMetric}>
            <div className={styles.addMetricLabel}>Signal</div>
            <TradeReadyIndicator score={data.tradeReady} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketIntelligence() {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {Object.entries(marketAssets).map(([symbol, data]) => (
          <AssetPanel key={symbol} symbol={symbol} data={data} />
        ))}
      </div>
    </div>
  )
}