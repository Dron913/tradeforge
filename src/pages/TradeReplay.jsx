import { useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Circle, Target } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useClosedTrades } from '../context/TradingContext'
import styles from './TradeReplay.module.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatShortTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function TradeReplay() {
  const closedTrades = useClosedTrades()
  const [selectedTrade, setSelectedTrade] = useState(closedTrades[closedTrades.length - 1] || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Build a price chart from the trade entry/exit - real trades don't have intraday data
  // so we generate synthetic price movement for display purposes
  function buildPriceData(trade) {
    if (!trade) return []
    const steps = 24
    const startP = trade.entryPrice
    const endP = trade.exitPrice
    const start = new Date(trade.exitTime || trade.entryTime)
    return Array.from({ length: steps }, (_, i) => ({
      time: new Date(start.getTime() - (steps - i) * 3600000).toISOString(),
      price: startP + (endP - startP) * (i / (steps - 1)) + (Math.random() - 0.5) * (endP - startP) * 0.1,
      volume: Math.round(Math.random() * 100 + 50),
    }))
  }

  // Build mock events from MFE/MAE data where available
  function buildEvents(trade) {
    if (!trade) return []
    const baseEvents = [
      { time: trade.entryTime, type: 'entry', price: trade.entryPrice,
        note: `Entry signal: ${(trade.side || 'unknown').toUpperCase()} ${trade.asset}` },
      { time: trade.exitTime, type: 'exit', price: trade.exitPrice,
        note: `${trade.exitReason || 'Closed'} — P&L: ${(trade.pnlPercent || 0).toFixed(2)}%` },
    ]
    if (trade.mfe_pct && trade.mfe_pct > 0) {
      baseEvents.splice(1, 0, { time: trade.entryTime, type: 'update',
        price: trade.entryPrice * (1 + trade.mfe_pct / 200),
        note: `Max Favorable Excursion: +${trade.mfe_pct.toFixed(2)}%` })
    }
    return baseEvents
  }

  const trade = selectedTrade
  const priceData = trade ? buildPriceData(trade) : []
  const allEvents = trade ? buildEvents(trade) : []
  const entryPrice = allEvents.find(e => e.type === 'entry')?.price || 0
  const exitPrice = allEvents.find(e => e.type === 'exit')?.price || 0

  const getEventType = (type) => {
    switch (type) {
      case 'entry': return styles.entry
      case 'exit': return styles.exit
      default: return styles.update
    }
  }

  const EventIcon = ({ type }) => {
    switch (type) {
      case 'entry': return <Circle size={14} />
      case 'exit': return <Target size={14} />
      default: return <Circle size={14} />
    }
  }

  if (!trade) {
    return (
      <div className={styles.container}>
        <div className={styles.tradeSelector}>
          <span className={styles.selectorLabel}>Closed Trades ({closedTrades.length})</span>
        </div>
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Target size={32} style={{ opacity: 0.3 }} />
          <p style={{ marginTop: 'var(--space-4)' }}>
            No closed trades yet. Trade Replay shows detailed analysis once trades close.
          </p>
          {closedTrades.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <select
                className={styles.filterSelect}
                onChange={(e) => setSelectedTrade(closedTrades.find(t => t.id === e.target.value) || null)}
              >
                <option value="">Select a trade...</option>
                {closedTrades.map(t => (
                  <option key={t.id} value={t.id}>{t.asset} {t.side?.toUpperCase() || '?'} — {t.exitTime ? new Date(t.exitTime).toLocaleDateString() : 'Unknown'}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tradeSelector}>
        <span className={styles.selectorLabel}>Select Trade:</span>
        <select
          className={styles.filterSelect}
          value={trade.id}
          onChange={(e) => setSelectedTrade(closedTrades.find(t => t.id === e.target.value) || null)}
        >
          {closedTrades.map(t => (
            <option key={t.id} value={t.id}>
              {t.asset} {t.side?.toUpperCase()} | {t.exitTime ? new Date(t.exitTime).toLocaleDateString() : 'Unknown'}
            </option>
          ))}
        </select>
        <span className={styles.selectorLabel} style={{ marginLeft: 'var(--space-4)' }}>
          {trade.asset}/{trade.side?.toUpperCase()} | Strategy: {trade.strategy}
        </span>
      </div>

      <div className={styles.playbackSection}>
        <div className={styles.playbackHeader}>
          <div>
            <h2 className={styles.tradeTitle}>
              {trade.asset} {trade.side?.toUpperCase()} — Exit Analysis
            </h2>
            <div className={styles.tradeMeta}>
              <span>Entry: {formatCurrency(trade.entryPrice || 0)}</span>
              <span>Exit: {formatCurrency(trade.exitPrice || 0)}</span>
              <span style={{ color: (trade.pnlPercent || 0) >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                P&L: {(trade.pnlPercent || 0) >= 0 ? '+' : ''}{trade.pnlPercent?.toFixed(2) || 0}%
              </span>
            </div>
            {trade.mfe_pct != null && (
              <div className={styles.tradeMeta} style={{ marginTop: '4px', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>MFE: +{trade.mfe_pct.toFixed(2)}%</span>
                <span style={{ color: 'var(--loss)' }}>MAE: {trade.mae_pct?.toFixed(2) || 0}%</span>
                {trade.profit_if_held_pct > 0 && (
                  <span>Profit if held: +{trade.profit_if_held_pct.toFixed(2)}%</span>
                )}
              </div>
            )}
          </div>
          <div className={styles.controls}>
            <button className={styles.controlBtn}>
              <SkipBack size={18} />
            </button>
            <button
              className={`${styles.controlBtn} ${styles.primary}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className={styles.controlBtn}>
              <SkipForward size={18} />
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-3)' }}>
              {playbackProgress.toFixed(0)}%
            </span>
            <div className={styles.speedSelector}>
              {[1, 2, 5, 10].map(speed => (
                <button
                  key={speed}
                  className={`${styles.speedBtn} ${playbackSpeed === speed ? styles.active : ''}`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          {priceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="tradeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  dataKey="time"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => formatShortTime(val)}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-2) var(--space-3)',
                          boxShadow: 'var(--shadow-lg)'
                        }}>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {formatTime(payload[0].payload.time)}
                          </p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                            {formatCurrency(payload[0].value)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine
                  y={entryPrice}
                  stroke="var(--profit)"
                  strokeDasharray="5 5"
                  label={{ value: 'Entry', position: 'left', fill: 'var(--profit)', fontSize: 10 }}
                />
                <ReferenceLine
                  y={exitPrice}
                  stroke="var(--loss)"
                  strokeDasharray="5 5"
                  label={{ value: 'Exit', position: 'left', fill: 'var(--loss)', fontSize: 10 }}
                />
                <Area type="monotone" dataKey="price" stroke="#00D4FF" strokeWidth={2} fill="url(#tradeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No price data available for this trade
            </div>
          )}
        </div>

        <div className={styles.timelineTrack}>
          <div className={styles.timelineProgress} style={{ width: `${playbackProgress}%` }}>
            <div className={styles.timelineHandle} />
          </div>
          <div className={styles.timelineMarkers}>
            {allEvents.map((event, index) => (
              <div
                key={index}
                className={styles.timelineMarker}
                style={{ left: `${(index / Math.max(allEvents.length - 1, 1)) * 100}%` }}
              >
                <span className={styles.markerLabel} style={{
                  color: event.type === 'entry' ? 'var(--profit)' : event.type === 'exit' ? 'var(--loss)' : 'var(--text-muted)'
                }}>
                  {event.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.eventsList}>
          <div className={styles.eventsTitle}>Trade Timeline</div>
          {allEvents.map((event, index) => (
            <div key={index} className={styles.eventItem}>
              <div className={`${styles.eventDot} ${getEventType(event.type)}`}>
                <EventIcon type={event.type} />
              </div>
              <div className={styles.eventContent}>
                <div className={styles.eventHeader}>
                  <span className={styles.eventTime}>{formatTime(event.time)}</span>
                  <span className={`${styles.eventType} ${getEventType(event.type)}`}>
                    {event.type}
                  </span>
                </div>
                <div className={styles.eventPrice}>{formatCurrency(event.price)}</div>
                <p className={styles.eventNote}>{event.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.tradeDetails}>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Entry Price</div>
            <div className={styles.detailValue}>{formatCurrency(trade.entryPrice || 0)}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Exit Price</div>
            <div className={styles.detailValue}>{formatCurrency(trade.exitPrice || 0)}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Exit Reason</div>
            <div className={styles.detailValue}>{trade.exitReason || 'Unknown'}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>P&L</div>
            <div className={`${styles.detailValue} ${(trade.pnlPercent || 0) >= 0 ? styles.positive : styles.negative}`}>
              {(trade.pnlPercent || 0) >= 0 ? '+' : ''}{trade.pnlPercent?.toFixed(2) || 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}