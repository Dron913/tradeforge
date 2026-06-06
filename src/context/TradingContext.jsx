/**
 * TradingContext — provides live TradeForge data to all pages.
 * Polls Railway backend every 30s. Handles session-based auth.
 *
 * Connectivity approach:
 * 1. fetchAuthStatus() — ~1-2s, determines if auth is needed and confirms backend is reachable
 * 2. fetchLiveState() — ~15-25s for 35MB response, fetches all trading data
 * 3. On error: either "Backend offline" (network) or "Session expired" (401)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchLiveState,
  fetchAuthStatus,
  postLogin,
  postLogout,
  getConsecutiveFailures,
} from '../services/railwayApi';
import { fetchLivePrices } from '../services/cryptoPriceService';

const TradingContext = createContext(null);
const SESSION_KEY = 'tf_auth_token';
const POLL_INTERVAL = 30000; // 30s — poll after initial load

export function TradingProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [health, setHealth] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(SESSION_KEY) || null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [livePrices, setLivePrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);

  // Ref to always hold current token — avoids stale closures in the polling load function
  const tokenRef = useRef(authToken);
  // Ref for authRequired — avoids stale closure in load callback
  const authRequiredRef = useRef(authRequired);

  useEffect(() => {
    tokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    authRequiredRef.current = authRequired;
  }, [authRequired]);

  // Live crypto price updates — runs every 1s, independent of Railway auth/data
  useEffect(() => {
    const tick = () => {
      fetchLivePrices().then(prices => {
        setLivePrices(prices);
        setPricesLoading(false);
      });
    };
    tick(); // immediate first load
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    const token = tokenRef.current;
    if (authRequiredRef.current && !token) return; // Can't load without token

    // Show loading state while fetching full data (takes 15-25s for 35MB)
    setLoading(true);
    setError(null);

    try {
      const live = await fetchLiveState(token);

      setData(live);
      setHealth(live.health);
      setConnected(true);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      if (e.isAuthError) {
        // Session expired — clear token and prompt re-auth
        sessionStorage.removeItem(SESSION_KEY);
        setAuthToken(null);
        setAuthRequired(true);
        setError('Session expired. Please log in again.');
      } else {
        setError(e.message || 'Failed to connect to TradeForge');
      }
      setConnected(false);
    } finally {
      setLoading(false); // Always clear loading — no stuck states
    }
  }, []); // Stable — token via tokenRef, authRequired via authRequiredRef

  // On mount: check auth status (also a quick connectivity check)
  // This resolves in ~1-2s. If it fails, we know immediately the backend is offline.
  useEffect(() => {
    const init = async () => {
      try {
        const status = await fetchAuthStatus(null);
        setAuthRequired(status?.authEnabled || false);
        setAuthChecked(true);

        if (status?.authEnabled && !sessionStorage.getItem(SESSION_KEY)) {
          // Auth required but no token — show login page (NOT "backend offline")
          setLoading(false);
          return;
        }

        // Backend confirmed reachable — proceed to load full data
        load();
      } catch {
        // Network error → backend is unreachable
        setAuthRequired(false);
        setAuthChecked(true);
        setError('Backend offline — Railway may be restarting. Retrying in 30s...');
        setConnected(false);
        setLoading(false);

        // Auto-refresh after 30s if backend was unreachable
        const id = setTimeout(load, 30000);
        return () => clearTimeout(id);
      }
    };
    init();
  }, [load]); // load is stable — this runs once on mount

  // Polling after initial load (token via tokenRef — auto-updates after login/logout)
  useEffect(() => {
    if (!authChecked) return;
    if (authRequired && !authToken) return;

    const id = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [authChecked, authRequired, tokenRef, load]); // tokenRef changes trigger load on login/logout

  const login = useCallback(async (password) => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const { token } = await postLogin(password);
      sessionStorage.setItem(SESSION_KEY, token);
      setAuthToken(token);

      // After login: re-check auth (in case it was disabled but now requires),
      // then load state with fresh token
      load();
    } catch (e) {
      setLoginError(e.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }, [load]);

  const logout = useCallback(async () => {
    try { await postLogout(); } catch {}
    sessionStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setData(null);
    setConnected(false);
    const status = await fetchAuthStatus(null);
    setAuthRequired(status?.authEnabled || false);
  }, []);

  const value = {
    data,
    loading,
    error,
    connected,
    health,
    lastUpdated,
    authToken,
    authRequired,
    authChecked,
    loginError,
    loggingIn,
    login,
    logout,
    consecutiveFailures: getConsecutiveFailures(),
    livePrices,
    pricesLoading,
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used within TradingProvider');
  return ctx;
}

export function useMetrics() {
  const { data } = useTrading();
  return data?.metrics || {};
}

export function useOpenPositions() {
  const { data } = useTrading();
  return data?.openPositions || [];
}

export function useClosedTrades() {
  const { data } = useTrading();
  return data?.closedTrades || [];
}

export function useRisk() {
  const { data } = useTrading();
  return data?.risk || {};
}

export function useHypotheses() {
  const { data } = useTrading();
  return data?.hypotheses || [];
}

export function useStrategyVersions() {
  const { data } = useTrading();
  return data?.strategyVersions || [];
}

export function useNotifications() {
  const { data } = useTrading();
  return data?.notifications || [];
}

export function useEquityCurve() {
  const { data } = useTrading();
  return data?.equityCurveData || [];
}

export function usePaperAccount() {
  const { data } = useTrading();
  return data?.paperAccount || null;
}

export function useKnowledge() {
  const { data } = useTrading();
  return {
    entries: data?.knowledgeEntries || [],
    summary: data?.knowledgeSummary || { total: 0, domains: 0, topDomains: [] },
  };
}

export function useHealth() {
  const { health, connected, loading, error } = useTrading();
  return { health, connected, loading, error };
}

export function useAuth() {
  const { authToken, authRequired, authChecked, loggingIn, loginError, login, logout } = useTrading();
  return { authToken, authRequired, authChecked, loggingIn, loginError, login, logout };
}

export function useLivePrices() {
  const { livePrices, pricesLoading } = useTrading();
  return { prices: livePrices, loading: pricesLoading };
}