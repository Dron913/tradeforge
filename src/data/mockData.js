export const portfolioMetrics = {
  totalValue: 124892.45,
  totalReturn: 24.8,
  dailyPnL: 1245.23,
  dailyPnLPercent: 0.98,
  weeklyPnL: 3892.45,
  weeklyPnLPercent: 3.21,
  monthlyPnL: 12456.78,
  monthlyPnLPercent: 11.09,
  winRate: 67.3,
  profitFactor: 2.14,
  sharpeRatio: 1.89,
  maxDrawdown: -8.4,
  activeTrades: 3,
  closedTrades: 147,
  currentStrategy: 'v3.2.1',
  aiStatus: 'active'
};

export const equityCurveData = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (89 - i));
  const baseValue = 100000;
  const trend = i * 300;
  const noise = Math.sin(i * 0.5) * 2000 + Math.random() * 1500;
  const value = baseValue + trend + noise;

  return {
    date: date.toISOString().split('T')[0],
    value: Math.round(value * 100) / 100,
    drawdown: Math.round((Math.random() * 10 - 2) * 100) / 100
  };
});

export const monthlyReturnsData = [
  { month: 'Jun', returns: 4.2 },
  { month: 'Jul', returns: 6.8 },
  { month: 'Aug', returns: -2.1 },
  { month: 'Sep', returns: 8.3 },
  { month: 'Oct', returns: 5.7 },
  { month: 'Nov', returns: 12.4 },
  { month: 'Dec', returns: 3.2 },
  { month: 'Jan', returns: -1.8 },
  { month: 'Feb', returns: 9.1 },
  { month: 'Mar', returns: 4.5 },
  { month: 'Apr', returns: 7.2 },
  { month: 'May', returns: 11.3 }
];

export const winLossDistribution = [
  { range: '-$500+', count: 12, type: 'loss' },
  { range: '-$250 to -$500', count: 18, type: 'loss' },
  { range: '-$1 to -$250', count: 24, type: 'loss' },
  { range: '$0 to $250', count: 32, type: 'win' },
  { range: '$250 to $500', count: 28, type: 'win' },
  { range: '$500 to $1000', count: 21, type: 'win' },
  { range: '$1000+', count: 12, type: 'win' }
];

export const assetContribution = [
  { asset: 'BTC', value: 45234.56, percentage: 36.2, color: '#F7931A' },
  { asset: 'ETH', value: 32145.78, percentage: 25.7, color: '#627EEA' },
  { asset: 'SOL', value: 18923.45, percentage: 15.1, color: '#00FFA3' },
  { asset: 'Others', value: 28588.66, percentage: 23, color: '#64748B' }
];

export const openPositions = [
  {
    id: 'pos-001',
    asset: 'BTC',
    side: 'long',
    entryPrice: 64234.50,
    currentPrice: 67234.12,
    quantity: 0.5234,
    pnl: 1567.89,
    pnlPercent: 4.67,
    duration: '2d 4h',
    strategy: 'v3.2.1',
    entryTime: '2026-05-29T14:32:00Z'
  },
  {
    id: 'pos-002',
    asset: 'ETH',
    side: 'long',
    entryPrice: 3421.00,
    currentPrice: 3512.45,
    quantity: 2.345,
    pnl: 214.45,
    pnlPercent: 2.67,
    duration: '1d 8h',
    strategy: 'v3.2.1',
    entryTime: '2026-05-30T10:15:00Z'
  },
  {
    id: 'pos-003',
    asset: 'SOL',
    side: 'short',
    entryPrice: 178.45,
    currentPrice: 172.34,
    quantity: 45.5,
    pnl: 278.21,
    pnlPercent: 3.43,
    duration: '6h 22m',
    strategy: 'v3.2.1',
    entryTime: '2026-05-31T12:08:00Z'
  }
];

export const closedTrades = [
  {
    id: 'trade-147',
    asset: 'BTC',
    side: 'long',
    entryPrice: 61234.00,
    exitPrice: 63890.50,
    quantity: 0.345,
    pnl: 918.89,
    pnlPercent: 4.35,
    duration: '3d 6h',
    strategy: 'v3.2.1',
    exitReason: 'Target reached',
    entryTime: '2026-05-26T09:15:00Z',
    exitTime: '2026-05-29T15:30:00Z'
  },
  {
    id: 'trade-146',
    asset: 'ETH',
    side: 'short',
    entryPrice: 3580.00,
    exitPrice: 3534.20,
    quantity: 1.8,
    pnl: 82.44,
    pnlPercent: 1.28,
    duration: '4h 45m',
    strategy: 'v3.2.1',
    exitReason: 'Stop loss triggered',
    entryTime: '2026-05-30T16:00:00Z',
    exitTime: '2026-05-30T20:45:00Z'
  },
  {
    id: 'trade-145',
    asset: 'SOL',
    side: 'long',
    entryPrice: 165.00,
    exitPrice: 172.80,
    quantity: 28.5,
    pnl: 222.30,
    pnlPercent: 4.73,
    duration: '1d 2h',
    strategy: 'v3.1.4',
    exitReason: 'Profit taking',
    entryTime: '2026-05-29T08:00:00Z',
    exitTime: '2026-05-30T10:00:00Z'
  },
  {
    id: 'trade-144',
    asset: 'BTC',
    side: 'short',
    entryPrice: 65400.00,
    exitPrice: 62800.00,
    quantity: 0.25,
    pnl: 650.00,
    pnlPercent: 3.97,
    duration: '2d 18h',
    strategy: 'v3.1.4',
    exitReason: 'Trend reversal',
    entryTime: '2026-05-26T12:00:00Z',
    exitTime: '2026-05-29T06:30:00Z'
  },
  {
    id: 'trade-143',
    asset: 'ETH',
    side: 'long',
    entryPrice: 3456.00,
    exitPrice: 3490.00,
    quantity: 1.5,
    pnl: 51.00,
    pnlPercent: 0.98,
    duration: '8h 15m',
    strategy: 'v3.1.3',
    exitReason: 'Time limit',
    entryTime: '2026-05-28T20:00:00Z',
    exitTime: '2026-05-29T04:15:00Z'
  }
];

export const marketAssets = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 67234.12,
    change24h: 2.34,
    change7d: 5.67,
    trend: 85,
    momentum: 72,
    marketScore: 78,
    riskScore: 35,
    tradeReady: 82,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 66000 + Math.sin(i * 0.3) * 1500 + Math.random() * 500
    }))
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3512.45,
    change24h: 1.89,
    change7d: 4.23,
    trend: 78,
    momentum: 65,
    marketScore: 72,
    riskScore: 42,
    tradeReady: 75,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 3400 + Math.sin(i * 0.4) * 200 + Math.random() * 100
    }))
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    price: 172.34,
    change24h: -1.23,
    change7d: 2.45,
    trend: 68,
    momentum: 58,
    marketScore: 65,
    riskScore: 55,
    tradeReady: 60,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 168 + Math.sin(i * 0.5) * 8 + Math.random() * 4
    }))
  }
};

export const strategyVersions = [
  {
    version: 'v3.2.1',
    status: 'active',
    createdAt: '2026-05-25T10:00:00Z',
    trades: 45,
    winRate: 68.9,
    totalPnl: 8923.45,
    pnlPercent: 7.15,
    parameters: [
      { name: 'RSI Period', oldValue: '16', newValue: '18', changed: true },
      { name: 'Stop Loss %', oldValue: '2.0', newValue: '1.8', changed: true },
      { name: 'Take Profit %', oldValue: '4.0', newValue: '4.5', changed: true },
      { name: 'Position Size', oldValue: '5%', newValue: '5%', changed: false },
      { name: 'Max Positions', oldValue: '3', newValue: '3', changed: false }
    ],
    parent: 'v3.1.4'
  },
  {
    version: 'v3.1.4',
    status: 'retired',
    createdAt: '2026-05-18T14:30:00Z',
    trades: 38,
    winRate: 65.8,
    totalPnl: 5678.90,
    pnlPercent: 4.54,
    parameters: [
      { name: 'RSI Period', oldValue: '14', newValue: '16', changed: true },
      { name: 'Stop Loss %', oldValue: '2.5', newValue: '2.0', changed: true },
      { name: 'Take Profit %', oldValue: '3.5', newValue: '4.0', changed: true },
      { name: 'Position Size', oldValue: '4%', newValue: '5%', changed: true },
      { name: 'Max Positions', oldValue: '2', newValue: '3', changed: true }
    ],
    parent: 'v3.1.3'
  },
  {
    version: 'v3.1.3',
    status: 'retired',
    createdAt: '2026-05-10T09:15:00Z',
    trades: 29,
    winRate: 62.1,
    totalPnl: 2345.67,
    pnlPercent: 1.88,
    parameters: [
      { name: 'RSI Period', oldValue: '14', newValue: '14', changed: false },
      { name: 'Stop Loss %', oldValue: '2.5', newValue: '2.5', changed: false },
      { name: 'Take Profit %', oldValue: '3.5', newValue: '3.5', changed: false },
      { name: 'Position Size', oldValue: '4%', newValue: '4%', changed: false },
      { name: 'Max Positions', oldValue: '2', newValue: '2', changed: false }
    ],
    parent: 'v3.1.2'
  },
  {
    version: 'v3.1.2',
    status: 'retired',
    createdAt: '2026-05-05T16:45:00Z',
    trades: 22,
    winRate: 59.1,
    totalPnl: -1234.56,
    pnlPercent: -0.99,
    parameters: [
      { name: 'RSI Period', oldValue: '12', newValue: '14', changed: true },
      { name: 'Stop Loss %', oldValue: '3.0', newValue: '2.5', changed: true },
      { name: 'Take Profit %', oldValue: '5.0', newValue: '3.5', changed: true },
      { name: 'Position Size', oldValue: '6%', newValue: '4%', changed: true },
      { name: 'Max Positions', oldValue: '4', newValue: '2', changed: true }
    ],
    parent: 'v3.1.1'
  }
];

export const evolutionEvents = [
  {
    id: 'ev-001',
    type: 'reflection_completed',
    version: 'v3.2.1',
    timestamp: '2026-05-30T18:45:00Z',
    title: 'Reflection Cycle #12 Completed',
    summary: 'Analyzed 45 recent trades. Identified overbought RSI signals were causing premature exits.',
    changes: [
      { action: 'increased', parameter: 'RSI Period', from: '16', to: '18' },
      { action: 'adjusted', parameter: 'Stop Loss', from: '2.0%', to: '1.8%' }
    ]
  },
  {
    id: 'ev-002',
    type: 'strategy_created',
    version: 'v3.2.1',
    timestamp: '2026-05-25T10:00:00Z',
    title: 'Strategy v3.2.1 Created',
    summary: 'Branched from v3.1.4 incorporating learnings from reflection cycles #10 and #11.',
    changes: []
  },
  {
    id: 'ev-003',
    type: 'reflection_completed',
    version: 'v3.1.4',
    timestamp: '2026-05-20T14:20:00Z',
    title: 'Reflection Cycle #10 Completed',
    summary: 'Reviewed consecutive losing trades. Adjusted position sizing and introduced trend confirmation.',
    changes: [
      { action: 'increased', parameter: 'Position Size', from: '4%', to: '5%' },
      { action: 'increased', parameter: 'Max Positions', from: '2', to: '3' }
    ]
  },
  {
    id: 'ev-004',
    type: 'reflection_completed',
    version: 'v3.1.3',
    timestamp: '2026-05-15T11:30:00Z',
    title: 'Reflection Cycle #8 Completed',
    summary: 'Identified pattern of missing breakout opportunities. Adjusted entry timing parameters.',
    changes: []
  }
];

export const reflectionCycles = [
  {
    id: 'ref-012',
    status: 'completed',
    startedAt: '2026-05-30T18:00:00Z',
    completedAt: '2026-05-30T18:45:00Z',
    duration: '45m',
    tradesAnalyzed: 45,
    hypotheses: [
      {
        id: 'hyp-001',
        text: 'Overbought RSI readings (70+) frequently precede trend reversals in current volatility conditions',
        confidence: 85,
        outcome: 'accepted',
        impact: 'positive'
      },
      {
        id: 'hyp-002',
        text: 'The 4-hour timeframe provides better signal quality than 1-hour for our strategy',
        confidence: 72,
        outcome: 'accepted',
        impact: 'neutral'
      },
      {
        id: 'hyp-003',
        text: 'Stop loss at 2.0% is too wide for current market conditions',
        confidence: 78,
        outcome: 'accepted',
        impact: 'positive'
      }
    ],
    insights: [
      'Reduce position sizes during high volatility periods',
      'Implement dynamic stop loss based on ATR',
      'Add momentum confirmation for entry signals'
    ],
    acceptedChanges: [
      { parameter: 'RSI Period', change: '16 → 18' },
      { parameter: 'Stop Loss %', change: '2.0 → 1.8' },
      { parameter: 'Take Profit %', change: '4.0 → 4.5' }
    ]
  },
  {
    id: 'ref-011',
    status: 'completed',
    startedAt: '2026-05-28T09:00:00Z',
    completedAt: '2026-05-28T10:15:00Z',
    duration: '1h 15m',
    tradesAnalyzed: 38,
    hypotheses: [
      {
        id: 'hyp-004',
        text: 'ETH/BTC correlation is higher than expected, causing clustered risk exposure',
        confidence: 91,
        outcome: 'accepted',
        impact: 'positive'
      },
      {
        id: 'hyp-005',
        text: 'Exit timing can be improved by checking multiple timeframes',
        confidence: 65,
        outcome: 'rejected',
        impact: 'negative'
      }
    ],
    insights: [
      'Consider SOL as diversification from ETH-heavy portfolio',
      'Reduce cross-asset correlation risk through timing offsets'
    ],
    acceptedChanges: [
      { parameter: 'Correlations Check', change: 'Added to risk checks' }
    ]
  },
  {
    id: 'ref-010',
    status: 'in_progress',
    startedAt: '2026-05-31T10:00:00Z',
    completedAt: null,
    duration: 'Running...',
    tradesAnalyzed: 52,
    hypotheses: [],
    insights: [],
    acceptedChanges: []
  }
];

export const riskMetrics = {
  riskScore: 42,
  riskPerTrade: 1.8,
  maxDrawdown: -8.4,
  currentDrawdown: -2.1,
  exposureByAsset: [
    { asset: 'BTC', long: 45, short: 0, total: 45 },
    { asset: 'ETH', long: 28, short: 0, total: 28 },
    { asset: 'SOL', long: 12, short: 8, total: 20 }
  ],
  exposureBySide: {
    long: 85,
    short: 15
  },
  protectionSystems: [
    { name: 'Max Position Size', active: true, value: '5%', status: 'nominal' },
    { name: 'Stop Loss', active: true, value: '1.8%', status: 'nominal' },
    { name: 'Daily Loss Limit', active: true, value: '$2,000', status: 'nominal' },
    { name: 'Circuit Breaker', active: true, value: '-5% DD', status: 'nominal' },
    { name: 'Correlation Monitor', active: true, value: '0.75 max', status: 'warning' }
  ],
  warnings: [
    { id: 'warn-001', severity: 'low', message: 'ETH/BTC correlation approaching threshold (0.72)', time: '2h ago' },
    { id: 'warn-002', severity: 'info', message: 'Portfolio concentration in BTC within acceptable range', time: '1d ago' }
  ]
};

export const notifications = [
  {
    id: 'notif-001',
    type: 'trade',
    category: 'trade_entry',
    title: 'New Long Position Opened',
    description: 'BTC long entry at $67,234.12 | Size: 0.52 BTC | Strategy: v3.2.1',
    timestamp: '2026-05-31T12:32:00Z',
    read: false,
    severity: 'info'
  },
  {
    id: 'notif-002',
    type: 'strategy',
    category: 'reflection',
    title: 'Reflection Cycle #12 Completed',
    description: '3 hypotheses generated, 3 accepted. Strategy v3.2.1 updated.',
    timestamp: '2026-05-30T18:45:00Z',
    read: false,
    severity: 'success'
  },
  {
    id: 'notif-003',
    type: 'risk',
    category: 'warning',
    title: 'Correlation Warning',
    description: 'ETH/BTC correlation at 0.72 - approaching threshold of 0.75',
    timestamp: '2026-05-30T16:45:00Z',
    read: false,
    severity: 'warning'
  },
  {
    id: 'notif-004',
    type: 'system',
    category: 'update',
    title: 'System Update Complete',
    description: 'Risk monitoring module updated to version 2.1.4',
    timestamp: '2026-05-29T02:00:00Z',
    read: true,
    severity: 'info'
  },
  {
    id: 'notif-005',
    type: 'trade',
    category: 'trade_exit',
    title: 'Trade Closed with Profit',
    description: 'BTC long closed at $63,890.50 | P&L: +$918.89 (+4.35%)',
    timestamp: '2026-05-29T15:30:00Z',
    read: true,
    severity: 'success'
  },
  {
    id: 'notif-006',
    type: 'strategy',
    category: 'evolution',
    title: 'Strategy v3.2.1 Created',
    description: 'New strategy version branched from v3.1.4 with 2 parameter updates',
    timestamp: '2026-05-25T10:00:00Z',
    read: true,
    severity: 'info'
  },
  {
    id: 'notif-007',
    type: 'system',
    category: 'health',
    title: 'All Systems Operational',
    description: 'Market data feed, trading engine, and risk monitors functioning normally',
    timestamp: '2026-05-31T00:00:00Z',
    read: true,
    severity: 'success'
  },
  {
    id: 'notif-008',
    type: 'risk',
    category: 'limit',
    title: 'Daily P&L Target Achieved',
    description: 'Already exceeded daily profit target by +$245.23',
    timestamp: '2026-05-31T14:00:00Z',
    read: false,
    severity: 'success'
  }
];

export const tradeReplayData = {
  tradeId: 'trade-147',
  asset: 'BTC',
  side: 'long',
  entryPrice: 61234.00,
  exitPrice: 63890.50,
  quantity: 0.345,
  pnl: 918.89,
  pnlPercent: 4.35,
  entryTime: '2026-05-26T09:15:00Z',
  exitTime: '2026-05-29T15:30:00Z',
  strategy: 'v3.2.1',
  events: [
    { time: '2026-05-26T09:15:00Z', type: 'entry', price: 61234.00, note: 'Entry signal confirmed - RSI oversold, trend bullish' },
    { time: '2026-05-26T18:30:00Z', type: 'update', price: 61500.00, note: 'Price consolidating - holding position' },
    { time: '2026-05-27T12:00:00Z', type: 'update', price: 62200.00, note: 'Strong momentum - adding to confidence' },
    { time: '2026-05-28T08:45:00Z', type: 'update', price: 63100.00, note: 'Approaching take profit zone - monitoring' },
    { time: '2026-05-29T10:20:00Z', type: 'update', price: 63500.00, note: 'RSI reaching overbought - preparing to exit' },
    { time: '2026-05-29T15:30:00Z', type: 'exit', price: 63890.50, note: 'Target reached - closing position' }
  ],
  priceData: Array.from({ length: 78 }, (_, i) => {
    const date = new Date('2026-05-26T09:15:00Z');
    date.setHours(date.getHours() + i);
    const progress = i / 77;
    const startPrice = 61234;
    const endPrice = 63890.5;
    const price = startPrice + (endPrice - startPrice) * progress + (Math.random() - 0.5) * 500 * (1 - progress);
    return {
      time: date.toISOString(),
      price: Math.round(price * 100) / 100,
      volume: Math.round(Math.random() * 100 + 50)
    };
  })
};

export const dashboardSparkline = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  value: 100000 + Math.sin(i * 0.3) * 3000 + i * 300 + Math.random() * 500
}));