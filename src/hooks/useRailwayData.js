/**
 * useRailwayData — polling hook for live TradeForge data.
 * Polls /debug/state every 30s and merges with mock data for charts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLiveState } from '../services/railwayApi';
import { mockData } from '../data/mockDataFallback';

const POLL_INTERVAL = parseInt(import.meta.env.VITE_POLL_INTERVAL || '30000', 10);

export function useRailwayData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef(null);
  const lastUpdatedRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const live = await fetchLiveState();
      setData(live);
      setError(null);
      setConnected(true);
      lastUpdatedRef.current = new Date();
    } catch (e) {
      setError(e.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  // Merge live data with static mock data for charts/metadata
  const merged = data
    ? {
        ...data,
        // Charts: use mock data as base, live data augments positions/trades
        equityCurveData: data.equityCurveData.length
          ? data.equityCurveData
          : mockData.equityCurveData,
        monthlyReturnsData: mockData.monthlyReturnsData,
        winLossDistribution: data.closedTrades.length > 3
          ? deriveWinLossDistribution(data.closedTrades)
          : mockData.winLossDistribution,
        assetContribution: data.openPositions.length > 0
          ? deriveAssetContribution(data.openPositions, data.closedTrades)
          : mockData.assetContribution,
        marketAssets: mockData.marketAssets, // live price fetching deferred
      }
    : null;

  return { data: merged, loading, error, connected, refresh: load };
}

// --- Derived calculators ---
// These enrich live data with format-compatible metadata

function deriveWinLossDistribution(trades) {
  const buckets = {
    '-$500+': 0, '-$250 to -$500': 0, '-$1 to -$250': 0,
    '$0 to $250': 0, '$250 to $500': 0, '$500 to $1000': 0, '$1000+': 0,
  };
  for (const t of trades) {
    const p = t.pnlPercent || 0;
    if (p <= -500) buckets['-$500+']++;
    else if (p <= -250) buckets['-$250 to -$500']++;
    else if (p <= -1) buckets['-$1 to -$250']++;
    else if (p <= 250) buckets['$0 to $250']++;
    else if (p <= 500) buckets['$250 to $500']++;
    else if (p <= 1000) buckets['$500 to $1000']++;
    else buckets['$1000+']++;
  }
  return Object.entries(buckets).map(([range, count]) => ({
    range, count,
    type: range.startsWith('-') ? 'loss' : 'win',
  }));
}

function deriveAssetContribution(open, closed) {
  const assets = {};
  for (const p of open) {
    const a = p.asset;
    if (!assets[a]) assets[a] = 0;
    assets[a] += Math.abs(p.pnlPercent || 0) * 1000; // proxy for value
  }
  for (const t of closed) {
    const a = t.asset;
    if (!assets[a]) assets[a] = 0;
    assets[a] += Math.abs(t.pnlPercent || 0) * 1000;
  }
  const colors = { BTC: '#F7931A', ETH: '#627EEA', SOL: '#00FFA3', XRP: '#23292F' };
  const total = Object.values(assets).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(assets).map(([asset, value]) => ({
    asset,
    value: Math.round(value),
    percentage: Math.round((value / total) * 100 * 10) / 10,
    color: colors[asset] || '#64748B',
  }));
}

// Fallback mock data (kept separate so real pages can still render)
export const mockData = {
  equityCurveData: [],
  monthlyReturnsData: [
    { month: 'Jun', returns: 4.2 }, { month: 'Jul', returns: 6.8 },
    { month: 'Aug', returns: -2.1 }, { month: 'Sep', returns: 8.3 },
    { month: 'Oct', returns: 5.7 }, { month: 'Nov', returns: 12.4 },
    { month: 'Dec', returns: 3.2 }, { month: 'Jan', returns: -1.8 },
    { month: 'Feb', returns: 9.1 }, { month: 'Mar', returns: 4.5 },
    { month: 'Apr', returns: 7.2 }, { month: 'May', returns: 11.3 },
  ],
  winLossDistribution: [
    { range: '-$500+', count: 0, type: 'loss' },
    { range: '-$250 to -$500', count: 0, type: 'loss' },
    { range: '-$1 to -$250', count: 0, type: 'loss' },
    { range: '$0 to $250', count: 0, type: 'win' },
    { range: '$250 to $500', count: 0, type: 'win' },
    { range: '$500 to $1000', count: 0, type: 'win' },
    { range: '$1000+', count: 0, type: 'win' },
  ],
  assetContribution: [],
  marketAssets: { BTC: { symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, trend: 50, momentum: 50 }, ETH: { symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, trend: 50, momentum: 50 }, SOL: { symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, trend: 50, momentum: 50 } },
};