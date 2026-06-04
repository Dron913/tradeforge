import { useState } from 'react'
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react'
import { useOpenPositions, useClosedTrades, useStrategyVersions } from '../context/TradingContext'
import { TradeDetailModal, PositionDetailModal } from '../components/Modal/TradeDetailModal'
import styles from './TradingActivity.module.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function TradingActivity() {
  const openPositions = useOpenPositions()
  const closedTrades = useClosedTrades()
  const strategyVersions = useStrategyVersions()
  const [filters, setFilters] = useState({
    search: '',
    asset: 'all',
    side: 'all',
    status: 'all',
    strategy: 'all'
  })
  const [sortConfig, setSortConfig] = useState({ key: 'exitTime', direction: 'desc' })
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)

  const filteredOpenPositions = openPositions.filter(pos => {
    if (filters.search && !pos.asset.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.asset !== 'all' && pos.asset !== filters.asset) return false
    if (filters.side !== 'all' && pos.side !== filters.side) return false
    return true
  })

  const filteredClosedTrades = closedTrades.filter(trade => {
    if (filters.search && !trade.asset.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.asset !== 'all' && trade.asset !== filters.asset) return false
    if (filters.side !== 'all' && trade.side !== filters.side) return false
    if (filters.strategy !== 'all' && trade.strategy !== filters.strategy) return false
    return true
  })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className={styles.sortIcon} />
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} className={styles.sortIcon} />
      : <ArrowDown size={14} className={styles.sortIcon} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search assets..."
            className={styles.filterInput}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Asset</span>
          <select
            className={styles.filterSelect}
            value={filters.asset}
            onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
          >
            <option value="all">All</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Side</span>
          <select
            className={styles.filterSelect}
            value={filters.side}
            onChange={(e) => setFilters({ ...filters, side: e.target.value })}
          >
            <option value="all">All</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <select
            className={styles.filterSelect}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Strategy</span>
          <select
            className={styles.filterSelect}
            value={filters.strategy}
            onChange={(e) => setFilters({ ...filters, strategy: e.target.value })}
          >
            <option value="all">All</option>
            {strategyVersions.map(sv => (
              <option key={sv.version} value={sv.version}>{sv.version}</option>
            ))}
          </select>
        </div>

        <button
          className={styles.clearBtn}
          onClick={() => setFilters({
            search: '',
            asset: 'all',
            side: 'all',
            status: 'all',
            strategy: 'all'
          })}
        >
          Clear All
        </button>
      </div>

      {filteredOpenPositions.length > 0 && (
        <>
          <h3 className={styles.sectionDivider}>Open Positions ({filteredOpenPositions.length})</h3>

          <div className={styles.positionsContainer}>
            {filteredOpenPositions.map(position => (
              <div key={position.id} className={styles.positionCard} onClick={() => setSelectedPosition(position)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSelectedPosition(position)}>
                <div className={styles.positionHeader}>
                  <div className={styles.positionMeta}>
                    <div className={styles.assetBadge}>
                      <span className={styles.assetName}>{position.asset}</span>
                      <span className={`${styles.sideBadge} ${styles[position.side]}`}>
                        {position.side.toUpperCase()}
                      </span>
                    </div>
                    <span className={styles.strategyBadge}>{position.strategy}</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {position.duration}
                  </span>
                </div>
                <div className={styles.positionStats}>
                  <div className={styles.statCell}>
                    <span className={styles.statLabel}>Entry Price</span>
                    <span className={styles.statValue}>{formatCurrency(position.entryPrice)}</span>
                  </div>
                  <div className={styles.statCell}>
                    <span className={styles.statLabel}>Current Price</span>
                    <span className={styles.statValue}>{formatCurrency(position.currentPrice)}</span>
                  </div>
                  <div className={styles.statCell}>
                    <span className={styles.statLabel}>Quantity</span>
                    <span className={styles.statValue}>{position.quantity}</span>
                  </div>
                  <div className={styles.statCell}>
                    <span className={styles.statLabel}>P&L</span>
                    <span className={`${styles.pnlValue} ${position.pnl >= 0 ? styles.positive : styles.negative}`}>
                      {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                    </span>
                  </div>
                  <div className={styles.statCell}>
                    <span className={styles.statLabel}>Return</span>
                    <span className={`${styles.pnlValue} ${position.pnlPercent >= 0 ? styles.positive : styles.negative}`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className={styles.sectionDivider}>Trade History ({filteredClosedTrades.length})</h3>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>Closed Positions</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('asset')}>
                Asset <SortIcon column="asset" />
              </th>
              <th onClick={() => handleSort('side')}>
                Side <SortIcon column="side" />
              </th>
              <th onClick={() => handleSort('entryPrice')}>
                Entry <SortIcon column="entryPrice" />
              </th>
              <th onClick={() => handleSort('exitPrice')}>
                Exit <SortIcon column="exitPrice" />
              </th>
              <th onClick={() => handleSort('pnl')}>
                P&L <SortIcon column="pnl" />
              </th>
              <th onClick={() => handleSort('exitTime')}>
                Closed <SortIcon column="exitTime" />
              </th>
              <th>Reason</th>
              <th>Strategy</th>
            </tr>
          </thead>
          <tbody>
            {filteredClosedTrades.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  <div className={styles.emptyTitle}>No trades match your filters</div>
                  <div className={styles.emptyText}>Try adjusting your filter criteria</div>
                </td>
              </tr>
            ) : (
              filteredClosedTrades.map(trade => (
                <tr key={trade.id} onClick={() => setSelectedTrade(trade)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className={styles.assetCell}>
                      <div className={`${styles.assetIcon} ${styles[trade.asset.toLowerCase()]}`}>
                        {trade.asset.slice(0, 1)}
                      </div>
                      <span className={styles.assetName}>{trade.asset}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.sideCell} ${styles[trade.side]}`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.mono}>{formatCurrency(trade.entryPrice)}</td>
                  <td className={styles.mono}>{formatCurrency(trade.exitPrice)}</td>
                  <td className={`${styles.mono} ${trade.pnl >= 0 ? styles.positive : styles.negative}`}>
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                    <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                      ({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)
                    </span>
                  </td>
                  <td className={styles.mono}>{formatDate(trade.exitTime)}</td>
                  <td>
                    <span className={styles.reasonBadge}>{trade.exitReason}</span>
                  </td>
                  <td className={styles.muted}>{trade.strategy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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