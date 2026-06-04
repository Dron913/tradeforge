import { X, Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Target, DollarSign, Calendar, Activity } from 'lucide-react'
import styles from './TradeDetailModal.module.css'

function formatCurrency(value) {
  if (value == null) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value) {
  if (value == null) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatDuration(duration) {
  if (!duration) return '--'
  return duration
}

// Estimate typical position size based on entry price + estimated qty
// For paper trading: assume ~$25,000 per position (25% of $100k, ≤4 max positions)
const TYPICAL_POSITION_SIZE = 25000

function derivePositionValues(trade) {
  if (!trade) return null
  // If we have entry_price and pnlPercent, derive approx position size
  // pnl_pct = (exit - entry) / entry * 100   =>  qty * abs(exit - entry) = abs(pnl_in_dollars)
  // position_size ≈ abs(pnl_in_dollars) / abs(pnl_pct) * 100
  const pnlPct = trade.pnlPercent || 0
  if (trade.pnl != null && pnlPct !== 0) {
    // pnl is stored as pnl_pct, not USD — can't derive position size from this alone
  }
  // Fall back to typical position size
  return TYPICAL_POSITION_SIZE
}

export function TradeDetailModal({ trade, onClose }) {
  if (!trade) return null

  const posSize = derivePositionValues(trade)
  const pnlUsd = trade.pnl != null ? (posSize * (trade.pnlPercent || 0) / 100) : null
  const entryValue = posSize
  const exitValue = posSize * (1 + (trade.pnlPercent || 0) / 100)
  const isProfit = (trade.pnlPercent || 0) >= 0

  const detailRows = [
    { icon: Activity, label: 'Asset', value: `${trade.asset} ${trade.side ? trade.side.toUpperCase() : ''}` },
    { icon: Target, label: 'Strategy', value: trade.strategy || '--' },
    { icon: Clock, label: 'Duration', value: formatDuration(trade.duration) },
    { icon: Calendar, label: 'Entry Time', value: formatDateTime(trade.entryTime) },
    { icon: Calendar, label: 'Exit Time', value: formatDateTime(trade.exitTime) },
    { icon: ArrowUpRight, label: 'Entry Price', value: formatCurrency(trade.entryPrice) },
    { icon: ArrowDownRight, label: 'Exit Price', value: formatCurrency(trade.exitPrice) },
    { icon: DollarSign, label: 'Position Size', value: formatCurrency(posSize), note: '~25% of paper account per position' },
    { icon: DollarSign, label: 'Entry Value', value: formatCurrency(entryValue) },
    { icon: DollarSign, label: 'Exit Value', value: formatCurrency(exitValue) },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'Realized P&L (USD)',
      value: pnlUsd != null ? `${pnlUsd >= 0 ? '+' : ''}${formatCurrency(pnlUsd)}` : '--',
      valueClass: pnlUsd != null ? (pnlUsd >= 0 ? styles.positive : styles.negative) : '' },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'P&L %',
      value: formatPercent(trade.pnlPercent),
      valueClass: isProfit ? styles.positive : styles.negative },
    { icon: Target, label: 'Exit Reason', value: trade.exitReason || '--' },
  ]

  // MFE/MAE if available
  if (trade.mfe_pct != null) {
    detailRows.push({
      icon: TrendingUp, label: 'Max Favorable Excursion (MFE)',
      value: `+${formatPercent(trade.mfe_pct)}`,
      valueClass: styles.positive,
    })
  }
  if (trade.mae_pct != null) {
    detailRows.push({
      icon: TrendingDown, label: 'Max Adverse Excursion (MAE)',
      value: formatPercent(trade.mae_pct),
      valueClass: styles.negative,
    })
  }
  if (trade.profit_if_held_pct != null) {
    const pifh = parseFloat(trade.profit_if_held_pct)
    detailRows.push({
      icon: Target, label: 'Ceiling (if held)',
      value: `+${formatPercent(pifh)}`,
      note: pifh > (trade.pnlPercent || 0) ? '→ Exited early' : '→ Captured most of it',
    })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.assetBadge} data-side={trade.side}>
              <span>{trade.asset}</span>
              <span className={styles.sideBadge} data-side={trade.side}>
                {trade.side?.toUpperCase() || 'LONG'}
              </span>
            </div>
            <div className={`${styles.pnlBadge} ${isProfit ? styles.profit : styles.loss}`}>
              {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatPercent(trade.pnlPercent)}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionTitle}>Trade Details</div>
          <div className={styles.detailGrid}>
            {detailRows.map((row, i) => (
              <div key={i} className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <row.icon size={13} />
                  {row.label}
                </div>
                <div className={`${styles.detailValue} ${row.valueClass || ''}`}>
                  {row.value}
                  {row.note && <span className={styles.detailNote}>{row.note}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.disclaimer}>
            Position size estimated at ~{formatCurrency(TYPICAL_POSITION_SIZE)} (~25% of paper account, per max-position rules).
            Actual position sizing may vary based on Hermes risk parameters.
          </div>
        </div>
      </div>
    </div>
  )
}

export function PositionDetailModal({ position, onClose }) {
  if (!position) return null

  const posSize = TYPICAL_POSITION_SIZE
  const unrealizedPnlUsd = (position.pnlPercent || 0) * posSize / 100
  const currentPrice = position.currentPrice || 0
  const entryPrice = position.entryPrice || 0
  const isProfit = (position.pnlPercent || 0) >= 0

  const detailRows = [
    { icon: Activity, label: 'Asset', value: `${position.asset} ${position.side?.toUpperCase() || 'LONG'}` },
    { icon: Target, label: 'Strategy', value: position.strategy || 'live' },
    { icon: Clock, label: 'Duration', value: formatDuration(position.duration) },
    { icon: Calendar, label: 'Entry Time', value: formatDateTime(position.entryTime) },
    { icon: ArrowUpRight, label: 'Entry Price', value: formatCurrency(entryPrice) },
    { icon: ArrowDownRight, label: 'Current Price', value: formatCurrency(currentPrice) },
    { icon: DollarSign, label: 'Position Size', value: formatCurrency(posSize), note: '~25% of paper account' },
    { icon: DollarSign, label: 'Market Value', value: formatCurrency(posSize * (1 + (position.pnlPercent || 0) / 100)) },
    { icon: DollarSign, label: 'Capital Deployed', value: formatCurrency(posSize) },
    { icon: DollarSign, label: 'Unrealized P&L (USD)',
      value: `${unrealizedPnlUsd >= 0 ? '+' : ''}${formatCurrency(unrealizedPnlUsd)}`,
      valueClass: unrealizedPnlUsd >= 0 ? styles.positive : styles.negative },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'Unrealized P&L %',
      value: formatPercent(position.pnlPercent),
      valueClass: isProfit ? styles.positive : styles.negative },
    { icon: Target, label: 'Stop Loss', value: position.sl || '--' },
    { icon: Target, label: 'Take Profit', value: position.tp || '--' },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.assetBadge} data-side={position.side}>
              <span>{position.asset}</span>
              <span className={styles.sideBadge} data-side={position.side}>
                {position.side?.toUpperCase() || 'LONG'}
              </span>
            </div>
            <div className={styles.statusBadge}>
              <Clock size={12} /> Open
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionTitle}>Position Details</div>
          <div className={styles.detailGrid}>
            {detailRows.map((row, i) => (
              <div key={i} className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <row.icon size={13} />
                  {row.label}
                </div>
                <div className={`${styles.detailValue} ${row.valueClass || ''}`}>
                  {row.value}
                  {row.note && <span className={styles.detailNote}>{row.note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}