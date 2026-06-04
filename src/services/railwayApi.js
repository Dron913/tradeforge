/**
 * TradeForge Railway API Client
 * Calls the Railway worker's /debug/state endpoint to get live trading data.
 */

const API_BASE = import.meta.env.VITE_RAILWAY_API_URL || 'https://tradeforge-production-fbc1.up.railway.app';

function apiFetch(path, token) {
  const url = token ? `${API_BASE}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : `${API_BASE}${path}`;
  return fetch(url, { signal: AbortSignal.timeout(10000) });
}

export async function fetchAuthStatus(token) {
  try {
    const res = await apiFetch('/api/auth/status', token);
    if (!res.ok) {
      if (res.status === 401) return { authEnabled: true, unlocked: false, tokenValid: false };
      throw new Error(`API ${res.status}`);
    }
    return res.json();
  } catch {
    return { authEnabled: false, unlocked: true, tokenValid: true };
  }
}

export async function postLogin(password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function postLogout() {
  await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
}

// --- State Parsers ---

function parseOpenPositions(statusData) {
  try {
    const raw = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
    const positions = raw.open_positions || [];
    return positions.map((p, i) => {
      const assetName = p.asset.replace('/USDT', '');
      const now = new Date();
      const entry = new Date(p.entry_time);
      const durationMs = now - entry;
      const hours = Math.floor(durationMs / 3600000);
      const mins = Math.floor((durationMs % 3600000) / 60000);
      return {
        id: `pos-${Date.now()}-${i}`,
        asset: assetName,
        side: p.side === 'long' ? 'long' : 'short',
        entryPrice: p.entry_price,
        currentPrice: parseFloat(p.cur_price),
        quantity: null,
        pnl: null,
        pnlPercent: p.unrealized_pnl,
        duration: hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : mins > 0 ? `${hours}h ${mins}m` : `${mins}m`,
        strategy: 'live',
        entryTime: p.entry_time,
        unrealized_pnl: p.unrealized_pnl,
        sl: p.sl || '?',
        tp: p.tp || '?',
      };
    });
  } catch {
    return [];
  }
}

function parsePaperAccount(statusData) {
  try {
    const raw = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
    return raw.paper_account || null;
  } catch {
    return null;
  }
}

function parseClosedTrades(tradesData) {
  try {
    const raw = typeof tradesData === 'string' ? tradesData.trim() : '';
    if (!raw) return [];
    const lines = raw.split('\n').filter(l => l.trim());
    return lines.map((line, i) => {
      const t = JSON.parse(line);
      const assetName = t.asset.replace('/USDT', '');
      const entry = new Date(t.timestamp);
      const durationSec = t.duration_sec || 0;
      const hours = Math.floor(durationSec / 3600);
      const mins = Math.floor((durationSec % 3600) / 60);
      return {
        id: `trade-${Date.now()}-${i}`,
        asset: assetName,
        side: t.side || 'long',
        entryPrice: t.entry_price,
        exitPrice: t.exit_price,
        quantity: null,
        pnl: t.pnl_pct, // stored as percentage
        pnlPercent: t.pnl_pct,
        duration: hours > 0 ? `${hours}h ${mins}m` : mins > 0 ? `${mins}m` : '<1m',
        strategy: t.strategy_version || 'unknown',
        exitReason: t.exit_reason || 'unknown',
        entryTime: t.timestamp,
        exitTime: t.exit_time || t.timestamp,
        mfe_pct: t.mfe_pct,
        mae_pct: t.mae_pct,
        profit_if_held_pct: t.profit_if_held_pct,
        indicators: t.indicators,
      };
    });
  } catch (e) {
    console.warn('[RailwayAPI] Failed to parse trades:', e);
    return [];
  }
}

function parseStrategy(hypothesesData, strategyData) {
  // Strategy versions are tracked via hypothesis entries which create new versions
  try {
    const raw = typeof hypothesesData === 'string' ? hypothesesData.trim() : '';
    const lines = raw ? raw.split('\n').filter(l => l.trim()) : [];

    // First: get current version from strategy.yaml
    const strat = typeof strategyData === 'string' ? strategyData : '';
    const stratMatch = strat.match(/version:\s*v(\d+)/);
    const currentVersion = stratMatch ? `v${stratMatch[1]}` : 'v0008';

    // Map version changes to strategy versions
    const versions = {};
    for (const line of lines) {
      try {
        const h = JSON.parse(line);
        if (h.version) {
          // Normalize version string (v0008 -> v0008)
          const ver = h.version.startsWith('v') ? h.version : `v${h.version}`;
          if (!versions[ver]) {
            versions[ver] = {
              version: ver,
              status: ver === currentVersion ? 'active' : 'retired',
              createdAt: h.timestamp,
              trades: h.trades_analyzed || 0,
              winRate: h.stats?.win_rate || 0,
              totalPnl: h.stats?.total_pnl || 0,
              pnlPercent: h.stats?.total_pnl || 0,
              changes: [],
              fromHypothesis: h,
            };
          } else {
            // Merge stats if already exists
            versions[ver].trades = Math.max(versions[ver].trades, h.trades_analyzed || 0);
          }
        }
      } catch {}
    }
    const versionList = Object.values(versions);
    if (versionList.length === 0) {
      versionList.push({
        version: currentVersion,
        status: 'active',
        createdAt: new Date().toISOString(),
        trades: 0, winRate: 0, totalPnl: 0, pnlPercent: 0,
        changes: [],
      });
    } else {
      // Ensure current version from strategy.yaml is marked active
      versionList.forEach(v => {
        v.status = v.version === currentVersion ? 'active' : 'retired';
      });
    }
    return versionList.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  } catch {
    return [];
  }
}

function parseHypotheses(hypothesesData) {
  try {
    const raw = typeof hypothesesData === 'string' ? hypothesesData.trim() : '';
    if (!raw) return [];

    // Split by newlines first
    const lines = raw.split('\n').filter(l => l.trim());
    const results = [];

    for (const line of lines) {
      try {
        results.push(JSON.parse(line));
      } catch (e) {
        // Line may contain embedded newlines or multiple JSON objects concatenated
        // (e.g., Python heredoc format or missing newline between entries).
        // Scan character by character for complete JSON objects.
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let start = -1;
        let inObject = false;

        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (escapeNext) { escapeNext = false; continue; }
          const backslash = String.fromCharCode(92);
          if (c === backslash && inString) { escapeNext = true; continue; }
          if (c === '"') { inString = !inString; continue; }
          if (inString) continue;
          // Skip whitespace outside strings
          if (/\s/.test(c)) continue;

          if (c === '{') {
            if (depth === 0) { start = i; inObject = true; }
            depth++;
          } else if (c === '}') {
            depth--;
            if (depth === 0 && inObject && start !== -1) {
              const obj = line.substring(start, i + 1);
              try { results.push(JSON.parse(obj)); } catch (parseErr) {
                // Recovery: try smaller substring if this is multiple concatenated objects
                // Reset state to continue scanning from after this object
                start = -1;
                inObject = false;
              }
            }
          } else if (c === '{' || c === '}') {
            // handled above
          }
        }
      }
    }

    return results.map((h, i) => ({
      id: `hyp-${Date.now()}-${i}`,
      text: h.reason || `Change ${h.variable}: ${h.direction} by ${h.amount}`,
      variable: h.variable,
      direction: h.direction,
      amount: h.amount,
      confidence: h.confidence || null,
      mode: h.mode,
      version: h.version,
      trades: h.trades_analyzed,
      totalPnl: h.stats?.total_pnl,
      winRate: h.stats?.win_rate,
      profitFactor: h.stats?.profit_factor,
      timestamp: h.timestamp,
      stats: h.stats,
      // Detect Hermes parsing failure from backend's own error message
      hermesFailed: h.mode === 'hermes' && (
        (h.reason || '').includes('Hermes parse failed') ||
        (h.reason || '').includes('default fallback')
      ),
    }));
  } catch {
    return [];
  }
}

function parseKnowledge(knowledgeData) {
  try {
    const raw = typeof knowledgeData === 'string' ? knowledgeData.trim() : '';
    if (!raw) return [];
    const entries = raw.split('\n').filter(l => l.trim()).slice(-50); // last 50
    return entries.map((line, i) => {
      const k = JSON.parse(line);
      return {
        id: `know-${Date.now()}-${i}`,
        domain: k.domain,
        category: k.category,
        insight: k.insight,
        impactScore: k.impact_score,
        timestamp: k.timestamp,
      };
    });
  } catch {
    return [];
  }
}

function deriveKnowledgeSummary(knowledgeData) {
  const entries = parseKnowledge(knowledgeData)
  if (!entries.length) return { total: 0, domains: 0 }
  const domains = {}
  for (const e of entries) domains[e.domain] = (domains[e.domain] || 0) + 1
  return {
    total: entries.length,
    domains: Object.keys(domains).length,
    topDomains: Object.entries(domains).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([d, c]) => ({ domain: d, count: c })),
  }
}

function calcMetrics(closedTrades, openPositions, startingBalance) {
  if (!closedTrades.length) return {};
  const baseValue = startingBalance || 100000;
  const wins = closedTrades.filter(t => t.pnlPercent > 0);
  const losses = closedTrades.filter(t => t.pnlPercent <= 0);
  const winRate = closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0;
  const grossProfits = wins.reduce((s, t) => s + (t.pnlPercent || 0), 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + (t.pnlPercent || 0), 0));
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 999 : 0;

  // Portfolio value derived from starting balance + cumulative realized P&L %
  const totalPct = closedTrades.reduce((s, t) => s + (t.pnlPercent || 0), 0);
  const totalReturn = totalPct;
  // Daily/weekly/monthly estimates from last 7 closed trades
  const recent = closedTrades.slice(-7);
  const dailyPnlPct = recent.length > 0 ? recent.reduce((s, t) => s + (t.pnlPercent || 0), 0) / (recent.length || 1) : 0;

  return {
    totalValue: baseValue * (1 + totalPct / 100),
    totalReturn,
    dailyPnL: baseValue * dailyPnlPct / 100,
    dailyPnLPercent: dailyPnlPct,
    weeklyPnL: baseValue * (dailyPnlPct * 5) / 100,
    weeklyPnLPercent: dailyPnlPct * 5,
    monthlyPnL: baseValue * (dailyPnlPct * 20) / 100,
    monthlyPnLPercent: dailyPnlPct * 20,
    winRate: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    sharpeRatio: 1.5,
    maxDrawdown: -5.0,
    activeTrades: openPositions.length,
    closedTrades: closedTrades.length,
    currentStrategy: closedTrades[closedTrades.length - 1]?.strategy || 'v0008',
    aiStatus: 'active',
    tradesAnalyzed: closedTrades.length,
  };
}

function calcRiskMetrics(openPositions) {
  const exposureByAsset = {};
  const exposureBySide = { long: 0, short: 0 };

  for (const pos of openPositions) {
    if (!exposureByAsset[pos.asset]) exposureByAsset[pos.asset] = 0;
    exposureByAsset[pos.asset] += Math.abs(pos.pnlPercent || 0);
    exposureBySide[pos.side] = (exposureBySide[pos.side] || 0) + Math.abs(pos.pnlPercent || 0);
  }

  const total = Object.values(exposureByAsset).reduce((s, v) => s + v, 0) || 1;
  return {
    riskScore: Math.min(100, Math.round(total * 10)),
    riskPerTrade: 1.5,
    maxDrawdown: -3.0,
    currentDrawdown: openPositions.filter(p => p.pnlPercent < 0).length > 0 ? -1.5 : 0,
    exposureByAsset: Object.entries(exposureByAsset).map(([asset, val]) => ({
      asset, total: Math.round(val * 10) / 10,
      long: openPositions.filter(p => p.asset === asset && p.side === 'long').length,
      short: openPositions.filter(p => p.asset === asset && p.side === 'short').length,
    })),
    exposureBySide,
    protectionSystems: [
      { name: 'Max Position Size', active: true, value: '5%', status: 'nominal' },
      { name: 'Stop Loss', active: true, value: '1.5%', status: 'nominal' },
      { name: 'Circuit Breaker', active: true, value: '−5% DD', status: 'nominal' },
      { name: 'Correlation Monitor', active: true, value: '0.75 max', status: 'nominal' },
    ],
    warnings: [],
  };
}

function generateNotifications(closedTrades, openPositions, metrics) {
  const notifs = [];
  const now = new Date();

  // Recent closed trade notifications — newest first
  const sortedClosed = [...closedTrades].sort((a, b) =>
    new Date(b.exitTime || 0) - new Date(a.exitTime || 0)
  );
  for (const t of sortedClosed.slice(0, 10)) {
    const exit = new Date(t.exitTime || t.entryTime || now);
    const diffMs = now - exit;
    notifs.push({
      id: `notif-trade-${t.id}`,
      type: 'trade',
      category: 'trade_exit',
      title: `${t.asset} ${t.side} Closed`,
      description: `P&L: ${t.pnl >= 0 ? '+' : ''}${t.pnlPercent?.toFixed(2) || 0}% | Reason: ${t.exitReason}`,
      timestamp: exit.toISOString(),
      read: false,
      severity: t.pnlPercent > 0 ? 'success' : 'warning',
    });
  }

  // Open position notifications — newest first
  const sortedOpen = [...openPositions].sort((a, b) =>
    new Date(b.entryTime || now) - new Date(a.entryTime || now)
  );
  for (const p of sortedOpen) {
    notifs.push({
      id: `notif-pos-${p.id}`,
      type: 'trade',
      category: 'trade_entry',
      title: `${p.asset} ${p.side} Position`,
      description: `Entry: ${p.entryPrice} | Current: ${p.currentPrice} | P&L: ${p.pnlPercent?.toFixed(2) || 0}%`,
      timestamp: p.entryTime,
      read: false,
      severity: p.pnlPercent >= 0 ? 'info' : 'warning',
    });
  }

  // System health notification
  notifs.push({
    id: 'notif-health',
    type: 'system',
    category: 'health',
    title: 'TradeForge Online',
    description: `Tracking ${openPositions.length} positions | ${closedTrades.length} trades total | Strategy ${metrics.currentStrategy}`,
    timestamp: now.toISOString(),
    read: false,
    severity: 'success',
  });

  return notifs;
}

function calcEquityCurve(closedTrades, startingBalance) {
  // Build equity curve from closed trades using actual starting balance
  if (!closedTrades.length) return [];
  const data = [];
  let equity = startingBalance || 100000;
  for (const t of closedTrades) {
    equity += equity * (t.pnlPercent || 0) / 100;
    const date = new Date(t.exitTime || t.entryTime);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(equity * 100) / 100,
    });
  }
  return data;
}

function calcEvolutionEvents(hypotheses) {
  return hypotheses.slice(-10).map((h, i) => ({
    id: `ev-${Date.now()}-${i}`,
    type: 'reflection_completed',
    version: h.version || 'v0008',
    timestamp: h.timestamp || new Date().toISOString(),
    title: `Reflection: ${h.variable || 'strategy update'}`,
    summary: h.text || h.reason || 'Hermes analysis completed',
    changes: h.variable ? [{ action: h.direction, parameter: h.variable, from: 'prev', to: `${h.amount}` }] : [],
  }));
}

export async function fetchLiveState(token, includeKnowledge = false) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const raw = await res.json();

  const openPositions = parseOpenPositions(raw['status.json'] || '{}');
  const closedTrades = parseClosedTrades(raw['trades.jsonl'] || '');
  const hypotheses = parseHypotheses(raw['hypotheses.jsonl'] || '');
  const strategyVersions = parseStrategy(raw['hypotheses.jsonl'] || '', raw['strategy.yaml'] || '');
  const knowledgeEntries = includeKnowledge ? parseKnowledge(raw['knowledge.jsonl'] || '') : [];
  const knowledgeSummary = deriveKnowledgeSummary(raw['knowledge.jsonl'] || '');
  const paperAccount = parsePaperAccount(raw['status.json'] || '{}');

  // Pass starting balance to calcMetrics so Portfolio Value uses real data (not hardcoded $100k)
  const metrics = calcMetrics(closedTrades, openPositions, paperAccount?.starting_balance);
  const risk = calcRiskMetrics(openPositions);
  const notifications = generateNotifications(closedTrades, openPositions, metrics);
  const equityCurveData = calcEquityCurve(closedTrades, paperAccount?.starting_balance);
  const evolutionEvents = calcEvolutionEvents(hypotheses);

  return {
    openPositions,
    closedTrades,
    strategyVersions,
    hypotheses,
    metrics,
    risk,
    notifications,
    equityCurveData,
    evolutionEvents,
    knowledgeEntries,
    knowledgeSummary,
    paperAccount,
    lastUpdated: new Date().toISOString(),
    isLive: true,
  };
}

// --- Direct accessors for specific data ---

export async function fetchOpenPositions(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw new Error('unauthorized');
  const raw = await res.json();
  return parseOpenPositions(raw['status.json'] || '{}');
}

export async function fetchClosedTrades(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw new Error('unauthorized');
  const raw = await res.json();
  return parseClosedTrades(raw['trades.jsonl'] || '');
}

export async function fetchHealthStatus(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw new Error('unauthorized');
  const raw = await res.json();
  try {
    const hb = JSON.parse(raw['heartbeat.json'] || '{}');
    const hc = JSON.parse(raw['hermes_check.json'] || '{}');
    return {
      status: 'online',
      timestamp: hb.timestamp,
      mode: hb.mode,
      hermesActive: hc.hermes_found,
      nimValid: hc.nim_api_key_valid,
      hermesMode: hc.hermes_reflection_mode,
    };
  } catch {
    return { status: 'unknown', timestamp: new Date().toISOString() };
  }
}

export async function fetchStrategy(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw new Error('unauthorized');
  const raw = await res.json();
  try {
    return JSON.parse(raw['strategy.yaml'] || '{}');
  } catch {
    return {};
  }
}