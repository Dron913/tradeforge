import { X, Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Target, DollarSign, Calendar, Activity, Zap } from 'lucide-react'
import styles from './TradeDetailModal.module.css'

function formatCurrency(value) {
  if (value == null || isNaN(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value) {
  if (value == null || isNaN(value)) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatDateTime(dateStr) {
  if (!dateStr || dateStr === '--') return '--'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatDuration(secs) {
  if (secs == null) return '--'
  const s = Number(secs)
  if (isNaN(s)) return '--'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m` : '<1m'
}

/**
 * Derive position size from entry price and quantity.
 * Falls back to starting balance percentage if quantity unavailable.
 */
function getPositionSize(trade, startingBalance = 100000) {
  // If we have quantity, calculate real value
  if (trade.quantity && trade.entryPrice) {
    return trade.entryPrice * trade.quantity;
  }
  // If no quantity, derive from 25% of starting balance (Hermes MAX_POSITION_PCT)
  return startingBalance * 0.25;
}

function formatSLTP(value) {
  if (value == null || value === '?' || isNaN(Number(value))) return '--'
  return `${Number(value).toFixed(2)}%`
}

export function TradeDetailModal({ trade, onClose }) {
  if (!trade) return null

  const POSITION_SIZE = getPositionSize(trade)
  const pnlPercent = trade.pnlPercent || 0
  const pnlUsd = POSITION_SIZE * pnlPercent / 100
  const isProfit = pnlPercent >= 0

  const detailRows = [
    { icon: Activity, label: 'Asset', value: `${trade.asset} ${trade.side ? trade.side.toUpperCase() : ''}` },
    { icon: Zap, label: 'Strategy Version', value: trade.strategy || '--' },
    { icon: Clock, label: 'Duration', value: formatDuration(trade.duration) },
    { icon: Calendar, label: 'Entry Time', value: formatDateTime(trade.entryTime) },
    { icon: Calendar, label: 'Exit Time', value: formatDateTime(trade.exitTime) },
    { icon: ArrowUpRight, label: 'Entry Price', value: formatCurrency(trade.entryPrice) },
    { icon: ArrowDownRight, label: 'Exit Price', value: formatCurrency(trade.exitPrice) },
    { icon: DollarSign, label: 'Position Size', value: formatCurrency(POSITION_SIZE),
      note: trade.quantity ? `${trade.quantity.toFixed(4)} @ ${formatCurrency(trade.entryPrice)}` : 'Derived: 25% × starting balance' },
    { icon: DollarSign, label: 'Capital Deployed', value: formatCurrency(POSITION_SIZE) },
    { icon: DollarSign, label: 'Capital Returned', value: formatCurrency(POSITION_SIZE + pnlUsd) },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'Profit / Loss (USD)',
      value: `${pnlUsd >= 0 ? '+' : ''}${formatCurrency(pnlUsd)}`,
      valueClass: pnlUsd >= 0 ? styles.positive : styles.negative },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'Profit / Loss (%)',
      value: formatPercent(pnlPercent),
      valueClass: isProfit ? styles.positive : styles.negative },
    { icon: Target, label: 'Exit Reason', value: (trade.exitReason || '--').replace(/_/g, ' ') },
  ]

  if (trade.mfe_pct != null && !isNaN(Number(trade.mfe_pct))) {
    detailRows.push({
      icon: TrendingUp, label: 'Max Favorable Excursion (MFE)',
      value: `+${formatPercent(Number(trade.mfe_pct))}`,
      valueClass: styles.positive,
    })
  }
  if (trade.mae_pct != null && !isNaN(Number(trade.mae_pct))) {
    detailRows.push({
      icon: TrendingDown, label: 'Max Adverse Excursion (MAE)',
      value: formatPercent(Number(trade.mae_pct)),
      valueClass: styles.negative,
    })
  }
  if (trade.profit_if_held_pct != null && !isNaN(Number(trade.profit_if_held_pct))) {
    const pifh = Number(trade.profit_if_held_pct)
    detailRows.push({
      icon: Target, label: 'Ceiling (if held)',
      value: `+${formatPercent(pifh)}`,
      note: pifh > pnlPercent ? '— Exited early' : '— Captured most of it',
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
              {formatPercent(pnlPercent)}
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
        </div>
      </div>
    </div>
  )
}

export function PositionDetailModal({ position, onClose }) {
  if (!position) return null

  const POSITION_SIZE = getPositionSize()
  const pnlPercent = position.pnlPercent || 0
  const unrealizedUsd = POSITION_SIZE * pnlPercent / 100
  const marketValue = POSITION_SIZE * (1 + pnlPercent / 100)
  const isProfit = pnlPercent >= 0

  const detailRows = [
    { icon: Activity, label: 'Asset', value: `${position.asset} ${position.side?.toUpperCase() || 'LONG'}` },
    { icon: Zap, label: 'Strategy Version', value: position.strategy || 'live' },
    { icon: Clock, label: 'Duration', value: formatDuration(position.duration) },
    { icon: Calendar, label: 'Entry Time', value: formatDateTime(position.entryTime) },
    { icon: ArrowUpRight, label: 'Entry Price', value: formatCurrency(position.entryPrice) },
    { icon: ArrowDownRight, label: 'Current Price', value: formatCurrency(position.currentPrice) },
    { icon: DollarSign, label: 'Position Size', value: formatCurrency(POSITION_SIZE),
      note: trade.quantity ? `${trade.quantity.toFixed(4)} @ ${formatCurrency(trade.entryPrice)}` : 'Derived: 25% × starting balance' },
    { icon: DollarSign, label: 'Capital Deployed', value: formatCurrency(POSITION_SIZE) },
    { icon: DollarSign, label: 'Market Value', value: formatCurrency(marketValue) },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'Unrealized P&L (USD)',
      value: `${unrealizedUsd >= 0 ? '+' : ''}${formatCurrency(unrealizedUsd)}`,
      valueClass: unrealizedUsd >= 0 ? styles.positive : styles.negative },
    { icon: isProfit ? TrendingUp : TrendingDown, label: 'Unrealized P&L (%)',
      value: formatPercent(pnlPercent),
      valueClass: isProfit ? styles.positive : styles.negative },
    { icon: Target, label: 'Stop Loss', value: formatSLTP(position.sl) },
    { icon: Target, label: 'Take Profit', value: formatSLTP(position.tp) },
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