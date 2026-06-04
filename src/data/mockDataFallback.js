/**
 * Fallback mock data used when Railway API is unreachable.
 * Also provides chart/skeleton data that doesn't come from the trading system.
 */

export const mockData = {
  portfolioMetrics: {
    totalValue: 100000,
    totalReturn: 0,
    dailyPnL: 0,
    dailyPnLPercent: 0,
    weeklyPnL: 0,
    weeklyPnLPercent: 0,
    monthlyPnL: 0,
    monthlyPnLPercent: 0,
    winRate: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    activeTrades: 0,
    closedTrades: 0,
    currentStrategy: 'v0008',
    aiStatus: 'offline'
  },

  equityCurveData: Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (89 - i));
    return {
      date: date.toISOString().split('T')[0],
      value: 100000 + i * 100,
      drawdown: Math.round((Math.random() * 6 - 1) * 100) / 100,
    };
  }),

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

  assetContribution: [
    { asset: 'BTC', value: 0, percentage: 0, color: '#F7931A' },
    { asset: 'ETH', value: 0, percentage: 0, color: '#627EEA' },
    { asset: 'SOL', value: 0, percentage: 0, color: '#00FFA3' },
    { asset: 'Others', value: 0, percentage: 0, color: '#64748B' },
  ],

  openPositions: [],
  closedTrades: [],

  marketAssets: {
    BTC: {
      symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, change7d: 0,
      trend: 50, momentum: 50, marketScore: 50, riskScore: 50,
      tradeReady: 50,
      sparklineData: Array.from({ length: 24 }, (_, i) => ({ time: i, price: 0 })),
    },
    ETH: {
      symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, change7d: 0,
      trend: 50, momentum: 50, marketScore: 50, riskScore: 50,
      tradeReady: 50,
      sparklineData: Array.from({ length: 24 }, (_, i) => ({ time: i, price: 0 })),
    },
    SOL: {
      symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, change7d: 0,
      trend: 50, momentum: 50, marketScore: 50, riskScore: 50,
      tradeReady: 50,
      sparklineData: Array.from({ length: 24 }, (_, i) => ({ time: i, price: 0 })),
    },
  },

  strategyVersions: [],
  evolutionEvents: [],
  reflectionCycles: [],
  riskMetrics: {
    riskScore: 0, riskPerTrade: 0, maxDrawdown: 0, currentDrawdown: 0,
    exposureByAsset: [], exposureBySide: { long: 0, short: 0 },
    protectionSystems: [
      { name: 'Stop Loss', active: true, value: '1.5%', status: 'nominal' },
      { name: 'Circuit Breaker', active: true, value: '-5% DD', status: 'nominal' },
    ],
    warnings: [],
  },

  notifications: [{
    id: 'notif-init',
    type: 'system',
    category: 'health',
    title: 'TradeForge Connecting...',
    description: 'Attempting to reach Railway backend...',
    timestamp: new Date().toISOString(),
    read: false,
    severity: 'info',
  }],

  tradeReplayData: null,
  dashboardSparkline: [],
};

// Named export for backward compatibility with pages importing { portfolioMetrics } etc.
export const { portfolioMetrics, dashboardSparkline, openPositions, closedTrades, equityCurveData } = mockData;