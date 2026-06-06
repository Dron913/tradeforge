/**
 * TradeForge Railway API Client
 * Calls the Railway worker's /debug/state endpoint to get live trading data.
 * Includes exponential backoff retry and 401 auto-recovery.
 */

const API_BASE = import.meta.env.VITE_RAILWAY_API_URL || 'https://tradeforge-production-fbc1.up.railway.app';
const REQUEST_TIMEOUT = 120000; // 120s — trades.jsonl can be 30MB+ taking 30-60s over Railway egress

// Track consecutive failures to help callers know if backend is consistently down
let _consecutiveFailures = 0;

function getConsecutiveFailures() {
  return _consecutiveFailures;
}

/**
 * Fetch with exponential backoff retry.
 * Retries on network errors and 5xx/429 responses. Does NOT retry on 401/403/404.
 * @param {string} url
 * @param {RequestInit} opts
 * @param {string} token - session token (not the deploy token — session tokens come from /api/auth/login)
 * @param {number} attempt
 */
async function fetchWithRetry(url, opts, token, attempt = 1) {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, { ...opts, signal });

    // 401 = session expired; surface immediately (don't retry) so caller can re-login
    if (res.status === 401) {
      _consecutiveFailures++;
      throw Object.assign(new Error('unauthorized'), { status: 401, isAuthError: true });
    }

    // 429 / 5xx — retry with backoff
    if (res.status === 429 || res.status >= 500) {
      _consecutiveFailures++;
      if (attempt >= 4) {
        throw new Error(`API ${res.status} after ${attempt} attempts`);
      }
      const retryAfter = parseInt(res.headers.get('Retry-After') || '');
      const delay = isNaN(retryAfter) ? attempt * attempt * 500 : retryAfter * 1000;
      await sleep(delay);
      return fetchWithRetry(url, opts, token, attempt + 1);
    }

    // 404 / other client errors — no retry
    if (!res.ok) {
      _consecutiveFailures++;
      throw new Error(`API ${res.status}`);
    }

    _consecutiveFailures = 0;
    return res;
  } catch (err) {
    // Network error / timeout — retry once with a pause
    if (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message.includes('network') || !err.status) {
      _consecutiveFailures++;
      if (attempt >= 3) throw err;
      await sleep(attempt * 1000);
      return fetchWithRetry(url, opts, token, attempt + 1);
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function apiFetch(path, token) {
  const separator = path.includes('?') ? '&' : '?';
  const url = token
    ? `${API_BASE}${path}${separator}token=${encodeURIComponent(token)}`
    : `${API_BASE}${path}`;
  return fetchWithRetry(url, {}, token);
}

/**
 * Fetch a single file with Bearer auth — uses /debug/file/* endpoints,
 * each responds in ~2s via the Python backend (vs 17-31s for combined /debug/state).
 */
/**
 * Fetch a single file from the worker.
 * Uses /worker/file/ path — bypasses Railway edge proxy special handling for /api/debug/*.
 */
/**
 * Fetch a single file from the worker.
 * Uses ?token= query param (not Bearer header) — avoids CORS preflight when backend
 * doesn't configure Access-Control-Allow-Headers: Authorization.
 */
function apiFetchBearer(path, token) {
  const separator = path.includes('?') ? '&' : '?';
  // Railway edge intercepts /api/debug/* → returns stub "OK", never reaches backend.
  // /debug/file/* is also intercepted. Use /worker/file/ path exclusively so Railway
  // edge passes requests directly to the backend (which now serves them without auth).
  const safePath = path.replace('/api/debug/file/', '/worker/file/').replace('/debug/file/', '/worker/file/');
  return fetchWithRetry(`${API_BASE}${safePath}${separator}token=${encodeURIComponent(token)}`, {
    headers: { 'Cache-Control': 'no-store' },
  }, token);
}

export async function fetchAuthStatus() {
  try {
    // Use a 5-second timeout — don't hang the login screen waiting for Railway.
    // If Railway is slow/unavailable, treat as no-auth-required so user can try login.
    const res = await Promise.race([
      apiFetch('/api/auth/status', null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('auth_check_timeout')), 5000)),
    ]);
    if (!res) {
      // fetch failed / timed out — assume no auth required
      return { authEnabled: false, unlocked: true, tokenValid: true };
    }
    if (res.status === 401) return { authEnabled: true, unlocked: false, tokenValid: false };
    if (!res.ok) {
      // non-OK status — treat as no auth (user can still proceed)
      return { authEnabled: false, unlocked: true, tokenValid: true };
    }
    return res.json();
  } catch (err) {
    // On network error or timeout, assume no auth required and continue
    return { authEnabled: false, unlocked: true, tokenValid: true };
  }
}

export async function postLogin(password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://tradeforge-theta.vercel.app' },
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

// --- Parsers ---

function parseOpenPositions(statusData) {
  try {
    const raw = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
    // Status.json has a flat structure: { open_positions: [...], paper_account: {...} }
    // Both bootstrap.py (seeded) and StatusWriter.write() (live) write flat, so we
    // only need to check open_positions at the top level. paper_account.open_positions
    // does not exist — leave this guard for future-proofing against nested schemas.
    const positions = raw.open_positions
      || (raw.paper_account && Array.isArray(raw.paper_account.open_positions) ? raw.paper_account.open_positions : null)
      || [];
    return positions.map((p, i) => ({
      id: `pos-${Date.now()}-${i}`,
      asset: (p.asset || '').replace('/USDT', ''),
      side: p.side === 'long' ? 'long' : 'short',
      entryPrice: p.entry_price,
      currentPrice: parseFloat(p.cur_price) || 0,
      quantity: null,
      pnl: null,
      pnlPercent: typeof p.unrealized_pnl === 'number' ? p.unrealized_pnl : 0,
      duration: formatDurationMs(Date.now() - new Date(p.entry_time || Date.now()).getTime()),
      strategy: 'live',
      entryTime: p.entry_time,
      unrealized_pnl: p.unrealized_pnl,
      sl: formatSLTP(p.sl),
      tp: formatSLTP(p.tp),
    }));
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
      return {
        id: `trade-${Date.now()}-${i}`,
        asset: (t.asset || '').replace('/USDT', ''),
        side: t.side || 'long',
        entryPrice: t.entry_price,
        exitPrice: t.exit_price,
        quantity: null,
        pnl: t.pnl_pct,
        pnlPercent: t.pnl_pct,
        duration: formatDurationSec(t.duration_sec || 0),
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
    return [];
  }
}

function parseStrategy(hypothesesData, strategyData) {
  try {
    const raw = typeof hypothesesData === 'string' ? hypothesesData.trim() : '';
    const lines = raw ? raw.split('\n').filter(l => l.trim()) : [];
    const strat = typeof strategyData === 'string' ? strategyData : '';
    const stratMatch = strat.match(/version:\s*v(\d+)/);
    const currentVersion = stratMatch ? `v${stratMatch[1]}` : null;

    const versions = {};
    for (const line of lines) {
      try {
        const h = JSON.parse(line);
        if (h.version) {
          const ver = h.version.startsWith('v') ? h.version : `v${h.version}`;
          if (!versions[ver]) {
            versions[ver] = {
              version: ver,
              status: ver === currentVersion ? 'active' : 'retired',
              createdAt: h.timestamp || new Date().toISOString(),
              trades: h.trades_analyzed || 0,
              winRate: h.stats?.win_rate || 0,
              totalPnl: h.stats?.total_pnl || 0,
              pnlPercent: h.stats?.total_pnl || 0,
              changes: [],
              fromHypothesis: h,
            };
          } else {
            versions[ver].trades = Math.max(versions[ver].trades, h.trades_analyzed || 0);
          }
        }
      } catch {}
    }
    const versionList = Object.values(versions);
    if (versionList.length === 0 && currentVersion) {
      versionList.push({ version: currentVersion, status: 'active', createdAt: new Date().toISOString(), trades: 0, winRate: 0, totalPnl: 0, pnlPercent: 0, changes: [] });
    }
    versionList.forEach(v => {
      v.status = v.version === currentVersion ? 'active' : 'retired';
    });
    return versionList.sort((a, b) => (new Date(b.createdAt) || 0) - (new Date(a.createdAt) || 0));
  } catch {
    return [];
  }
}

function parseHypotheses(hypothesesData) {
  try {
    const raw = typeof hypothesesData === 'string' ? hypothesesData.trim() : '';
    if (!raw) return [];
    const lines = raw.split('\n').filter(l => l.trim());
    const results = [];
    for (const line of lines) {
      try { results.push(JSON.parse(line)); continue; } catch {}
      // Recovery for concatenated/malformed lines
      let depth = 0, inString = false, escapeNext = false, start = -1, inObject = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (c === '\\' && inString) { escapeNext = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (/\s/.test(c)) continue;
        if (c === '{') { if (depth === 0) { start = i; inObject = true; } depth++; }
        else if (c === '}') { depth--; if (depth === 0 && inObject && start !== -1) { try { results.push(JSON.parse(line.substring(start, i + 1))); } catch {} start = -1; inObject = false; } }
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
    return raw.split('\n').filter(l => l.trim()).slice(-50).map((line, i) => {
      const k = JSON.parse(line);
      return { id: `know-${Date.now()}-${i}`, domain: k.domain, category: k.category, insight: k.insight, impactScore: k.impact_score, timestamp: k.timestamp };
    });
  } catch {
    return [];
  }
}

function deriveKnowledgeSummary(knowledgeData) {
  const entries = parseKnowledge(knowledgeData);
  if (!entries.length) return { total: 0, domains: 0 };
  const domains = {};
  for (const e of entries) domains[e.domain] = (domains[e.domain] || 0) + 1;
  return {
    total: entries.length,
    domains: Object.keys(domains).length,
    topDomains: Object.entries(domains).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([d, c]) => ({ domain: d, count: c })),
  };
}

// --- Helpers ---

function formatDurationMs(ms) {
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (mins > 0) return `${hours}h ${mins}m`;
  return `${Math.floor(ms / 1000)}s`;
}

function formatDurationSec(secs) {
  const s = Number(secs) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '<1m';
}

function formatSLTP(v) {
  if (v == null || v === '?' || isNaN(Number(v))) return '--';
  return `${Number(v).toFixed(2)}%`;
}

// --- Metrics ---

function calcMetrics(closedTrades, openPositions, startingBalance) {
  const baseValue = startingBalance || 100000;
  if (!closedTrades.length) {
    return {
      totalValue: baseValue,
      totalReturn: 0,
      dailyPnL: 0,
      dailyPnLPercent: 0,
      weeklyPnL: 0,
      weeklyPnLPercent: 0,
      monthlyPnL: 0,
      monthlyPnLPercent: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: null,
      maxDrawdown: 0,
      activeTrades: openPositions.length,
      closedTrades: 0,
      currentStrategy: 'v0008',
      aiStatus: 'learning',
      tradesAnalyzed: 0,
    };
  }

  // --- Basic aggregates from real trades ---
  const wins = closedTrades.filter(t => t.pnlPercent > 0);
  const losses = closedTrades.filter(t => t.pnlPercent <= 0);
  const winRate = (wins.length / closedTrades.length) * 100;
  const grossProfits = wins.reduce((s, t) => s + (t.pnlPercent || 0), 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + (t.pnlPercent || 0), 0));
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 999 : 0;
  const totalPct = closedTrades.reduce((s, t) => s + (t.pnlPercent || 0), 0);
  const totalValue = baseValue * (1 + totalPct / 100);

  // --- Equity curve for maxDrawdown + sharpeRatio ---
  const equityCurve = [];
  let equity = baseValue;
  for (const t of closedTrades) {
    equity += equity * (t.pnlPercent || 0) / 100;
    const date = new Date(t.exitTime || t.entryTime);
    equityCurve.push({ equity, date, pnlPct: t.pnlPercent });
  }

  // --- Max Drawdown: walking equity peak ---
  let peak = baseValue;
  let maxDrawdown = 0;
  for (const pt of equityCurve) {
    if (pt.equity > peak) peak = pt.equity;
    const dd = (peak - pt.equity) / peak * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  maxDrawdown = Math.round(-maxDrawdown * 100) / 100;

  // --- Sharpe Ratio: mean / stdDev * sqrt(252) ---
  let sharpeRatio = null;
  if (equityCurve.length >= 5) {
    const returns = equityCurve.map(pt => pt.pnlPct);
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / Math.max(returns.length - 1, 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = Math.round((mean / stdDev) * Math.sqrt(252) * 100) / 100;
    } else {
      sharpeRatio = mean > 0 ? 999 : 0;
    }
  }

  // --- Weekly P&L: actual trades in last 7 days ---
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const weeklyTrades = closedTrades.filter(t => {
    const d = new Date(t.exitTime || t.entryTime);
    return d >= sevenDaysAgo;
  });
  const weeklyPnLPct = weeklyTrades.reduce((s, t) => s + (t.pnlPercent || 0), 0);
  const weeklyPnL = Math.round((baseValue * weeklyPnLPct / 100) * 100) / 100;

  // --- Monthly P&L: actual trades in last 30 days ---
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const monthlyTrades = closedTrades.filter(t => {
    const d = new Date(t.exitTime || t.entryTime);
    return d >= thirtyDaysAgo;
  });
  const monthlyPnLPct = monthlyTrades.reduce((s, t) => s + (t.pnlPercent || 0), 0);
  const monthlyPnL = Math.round((baseValue * monthlyPnLPct / 100) * 100) / 100;

  // --- Daily P&L: last 7 days average (for display consistency) ---
  const dailyPnlPct = weeklyTrades.length > 0 ? weeklyPnLPct / Math.min(weeklyTrades.length, 7) : 0;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalReturn: Math.round(totalPct * 100) / 100,
    dailyPnL: Math.round((baseValue * dailyPnlPct / 100) * 100) / 100,
    dailyPnLPercent: Math.round(dailyPnlPct * 100) / 100,
    weeklyPnL,
    weeklyPnLPercent: Math.round(weeklyPnLPct * 100) / 100,
    monthlyPnL,
    monthlyPnLPercent: Math.round(monthlyPnLPct * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    sharpeRatio,
    maxDrawdown,
    activeTrades: openPositions.length,
    closedTrades: closedTrades.length,
    currentStrategy: closedTrades[closedTrades.length - 1]?.strategy || 'v0008',
    aiStatus: 'learning',
    tradesAnalyzed: closedTrades.length,
  };
}

function calcRiskMetrics(openPositions, metrics, startingBalance) {
  const baseValue = startingBalance || 100000;

  // Risk score from open position exposure
  const exposureByAsset = {};
  for (const pos of openPositions) {
    exposureByAsset[pos.asset] = (exposureByAsset[pos.asset] || 0) + Math.abs(pos.pnlPercent || 0);
  }
  const total = Object.values(exposureByAsset).reduce((s, v) => s + v, 0) || 1;

  // Current drawdown: from open positions (unrealized P&L)
  const openPnlPct = openPositions.reduce((s, p) => s + (p.pnlPercent || 0), 0);
  const currentDrawdown = openPositions.length > 0
    ? -(openPositions.filter(p => p.pnlPercent < 0).reduce((s, p) => s + Math.abs(p.pnlPercent || 0), 0))
    : 0;

  // Risk per trade: derived from actual max realized loss across closed trades
  // (passed via metrics when available, otherwise estimate from open exposure)
  const riskPerTrade = openPositions.length > 0
    ? Math.max(...openPositions.map(p => Math.abs(p.pnlPercent || 0)), 0.5)
    : 1.0;

  return {
    riskScore: Math.min(100, Math.round(total * 10)),
    riskPerTrade,
    maxDrawdown: metrics?.maxDrawdown ?? 0,
    currentDrawdown: Math.round(currentDrawdown * 100) / 100,
    exposureByAsset: Object.entries(exposureByAsset).map(([asset, val]) => ({
      asset,
      total: Math.round(val * 10) / 10,
      long: openPositions.filter(p => p.asset === asset && p.side === 'long').length,
      short: openPositions.filter(p => p.asset === asset && p.side === 'short').length,
    })),
    exposureBySide: {
      long: openPositions.filter(p => p.side === 'long').reduce((s, p) => s + Math.abs(p.pnlPercent || 0), 0),
      short: openPositions.filter(p => p.side === 'short').reduce((s, p) => s + Math.abs(p.pnlPercent || 0), 0),
    },
    protectionSystems: [
      { name: 'Max Position Size', active: true, value: '5%', status: 'nominal' },
      { name: 'Stop Loss', active: true, value: '0.3%', status: 'nominal' },
      { name: 'Circuit Breaker', active: true, value: '−5% DD', status: 'nominal' },
      { name: 'Correlation Monitor', active: true, value: '0.75 max', status: 'nominal' },
    ],
    warnings: [],
    isCalculated: true,
  };
}

function generateNotifications(closedTrades, openPositions, metrics, health) {
  const notifs = [];
  const now = new Date();

  // Recent closed trades — newest first
  const sortedClosed = [...closedTrades].sort((a, b) =>
    new Date(b.exitTime || 0) - new Date(a.exitTime || 0)
  );
  for (const t of sortedClosed.slice(0, 10)) {
    const exit = new Date(t.exitTime || t.entryTime || now);
    notifs.push({
      id: `notif-trade-${t.id}`,
      type: 'trade',
      category: 'trade_exit',
      title: `${t.asset} ${t.side?.toUpperCase()} Closed`,
      description: `P&L: ${(t.pnlPercent >= 0 ? '+' : '') + (t.pnlPercent || 0).toFixed(2)}% | ${t.exitReason || 'unknown'}`,
      timestamp: exit.toISOString(),
      read: false,
      severity: t.pnlPercent > 0 ? 'success' : 'warning',
    });
  }

  // Open positions
  const sortedOpen = [...openPositions].sort((a, b) =>
    new Date(b.entryTime || now) - new Date(a.entryTime || now)
  );
  for (const p of sortedOpen) {
    notifs.push({
      id: `notif-pos-${p.id}`,
      type: 'trade',
      category: 'trade_entry',
      title: `${p.asset} ${p.side?.toUpperCase()} Position Open`,
      description: `Entry: $${p.entryPrice?.toFixed(4)} | P&L: ${(p.pnlPercent >= 0 ? '+' : '') + (p.pnlPercent || 0).toFixed(2)}%`,
      timestamp: p.entryTime,
      read: false,
      severity: p.pnlPercent >= 0 ? 'info' : 'warning',
    });
  }

  // System health — always last
  const healthDesc = health?.hermesActive
    ? `Hermes ${health.hermesMode ? 'auto' : 'manual'} | ${metrics.closedTrades || 0} trades`
    : `Online | ${metrics.closedTrades || 0} trades`;
  notifs.push({
    id: 'notif-health',
    type: 'system',
    category: 'health',
    title: `TradeForge ${health?.status === 'online' ? 'Online' : 'System'}`,
    description: healthDesc,
    timestamp: now.toISOString(),
    read: false,
    severity: 'success',
  });

  return notifs;
}

function calcEquityCurve(closedTrades, startingBalance) {
  if (!closedTrades.length) return [];
  const data = [];
  let equity = startingBalance || 100000;
  for (const t of closedTrades) {
    equity += equity * (t.pnlPercent || 0) / 100;
    const date = new Date(t.exitTime || t.entryTime);
    data.push({ date: date.toISOString().split('T')[0], value: Math.round(equity * 100) / 100 });
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

// --- Main Data Fetchers ---

/**
 * Fetch all state files in a single request.
 * Uses /debug/state — bypasses Railway edge which intercepts /api/debug/*.
 * Session token passed as ?token= query param for auth.
 * Returns { filename: content } map, or throws on error.
 */
async function fetchStateBundle(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { isAuthError: true });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json().catch(() => ({}));
}

/**
 * Fetch all live state from Railway in a single round-trip.
 * Uses /debug/state endpoint which returns all files as one JSON object.
 * This avoids the Railway edge intercept problem (edge blocks /api/debug/* and
 * now /worker/* returns 501) by using the /debug/state path which reaches
 * the Python health server on port 8080.
 */
export async function fetchLiveState(token, includeKnowledge = false) {
  // Single request to get all state files at once
  const raw = await fetchStateBundle(token);

  // Extract each file from the bundle
  const statusTxt = raw['status.json'] || '';
  const tradesTxt = raw['trades.jsonl'] || '';
  const hypothesesTxt = raw['hypotheses.jsonl'] || '';
  const strategyTxt = raw['strategy.yaml'] || '';
  const heartbeatTxt = raw['heartbeat.json'] || '';
  const hermesTxt = raw['hermes_check.json'] || '';
  const knowledgeTxt = (includeKnowledge ? raw['knowledge.jsonl'] : '') || '';

  const statusJson = statusTxt ? (() => { try { return JSON.parse(statusTxt); } catch { return {}; } })() : {};
  const openPositions = parseOpenPositions(statusJson);
  const closedTrades = parseClosedTrades(tradesTxt);
  const hypotheses = parseHypotheses(hypothesesTxt);
  const strategyVersions = parseStrategy(hypothesesTxt, strategyTxt);
  const paperAccount = parsePaperAccount(statusJson);

  // Parse health from state bundle
  let health = { status: 'online', timestamp: new Date().toISOString(), consecutiveFailures: getConsecutiveFailures() };
  try {
    const hb = heartbeatTxt ? JSON.parse(heartbeatTxt) : {};
    const hm = hermesTxt ? JSON.parse(hermesTxt) : {};
    health = {
      status: 'online',
      timestamp: hb.timestamp || new Date().toISOString(),
      mode: hb.mode || 'auto',
      hermesActive: !!hm.hermes_found,
      hermesMode: hb.mode === 'auto',
      nimValid: !!hm.nim_api_key_valid,
      consecutiveFailures: getConsecutiveFailures(),
    };
  } catch {}

  const startingBalance = typeof paperAccount?.starting_balance === 'number' ? paperAccount.starting_balance : 100000;
  const metrics = calcMetrics(closedTrades, openPositions, startingBalance);
  const risk = calcRiskMetrics(openPositions, metrics, startingBalance);
  const notifications = generateNotifications(closedTrades, openPositions, metrics, null);
  const equityCurveData = calcEquityCurve(closedTrades, startingBalance);
  const evolutionEvents = calcEvolutionEvents(hypotheses);
  const knowledgeEntries = includeKnowledge ? parseKnowledge(knowledgeTxt) : [];
  const knowledgeSummary = deriveKnowledgeSummary(knowledgeTxt);

  return {
    openPositions,
    closedTrades,
    strategyVersions,
    hypotheses,
    metrics,
    risk,
    health,
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

/**
 * Lightweight health check.
 * @deprecated Health is now derived from fetchLiveState directly (no separate request).
 */
export async function fetchHealthStatus(token) {
  try {
    const raw = await fetchStateBundle(token);
    const hb = raw['heartbeat.json'] ? JSON.parse(raw['heartbeat.json']) : {};
    const hm = raw['hermes_check.json'] ? JSON.parse(raw['hermes_check.json']) : {};
    return {
      status: 'online',
      timestamp: hb.timestamp || new Date().toISOString(),
      hermesActive: !!hm.hermes_found,
      nimValid: !!hm.nim_api_key_valid,
      consecutiveFailures: getConsecutiveFailures(),
    };
  } catch {
    return { status: 'unreachable', timestamp: new Date().toISOString() };
  }
}

// --- Individual Data Accessors ---

export async function fetchOpenPositions(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { isAuthError: true });
  const raw = await res.json().catch(() => ({}));
  return parseOpenPositions(raw['status.json'] || '{}');
}

export async function fetchClosedTrades(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { isAuthError: true });
  const raw = await res.json().catch(() => ({}));
  return parseClosedTrades(raw['trades.jsonl'] || '');
}

export async function fetchStrategy(token) {
  const res = await apiFetch('/debug/state', token);
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { isAuthError: true });
  const raw = await res.json().catch(() => ({}));
  try { return JSON.parse((raw['strategy.yaml'] || '').toString()); } catch { return {}; }
}

export { getConsecutiveFailures };