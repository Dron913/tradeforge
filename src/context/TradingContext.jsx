/**
 * TradingContext — provides live TradeForge data to all pages.
 * Polls Railway backend every 30s. Handles session-based auth.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchLiveState,
  fetchHealthStatus,
  fetchAuthStatus,
  postLogin,
  postLogout,
} from '../services/railwayApi';

const TradingContext = createContext(null);
const SESSION_KEY = 'tf_auth_token';

export function TradingProvider({ children }) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    connected: false,
    health: null,
    lastUpdated: null,
    // Auth state
    authToken: sessionStorage.getItem(SESSION_KEY) || null,
    authRequired: false,
    authChecked: false,
    loginError: null,
    loggingIn: false,
  });

  const load = useCallback(async () => {
    const { authToken, authRequired } = state;
    if (authRequired && !authToken) return; // Can't load without token
    try {
      const [live, health] = await Promise.all([
        fetchLiveState(authToken),
        fetchHealthStatus(authToken),
      ]);
      setState(s => ({
        ...s,
        data: live,
        health,
        error: null,
        connected: true,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (e) {
      setState(s => ({
        ...s,
        error: e.message,
        connected: false,
        loading: s.authToken ? s.loading : false,
      }));
    }
  }, [state.authToken, state.authRequired]);

  // On mount: check auth status, then load data
  useEffect(() => {
    const init = async () => {
      try {
        const status = await fetchAuthStatus(null);
        setState(s => ({
          ...s,
          authRequired: status.authEnabled || false,
          authChecked: true,
        }));
        // Only load if auth not required (or token already in session)
        if (!status.authEnabled || sessionStorage.getItem(SESSION_KEY)) {
          // token will be read from state after this update
          load();
        } else {
          // Auth is required, don't try to fetch without token
          setState(s => ({ ...s, loading: false }));
        }
      } catch {
        // Network error — assume no auth required
        setState(s => ({ ...s, authRequired: false, authChecked: true }));
        load();
      }
    };
    init();
  }, []); // eslint-disable-line

  // Polling with token dependency
  useEffect(() => {
    if (!state.authChecked) return;
    if (state.authRequired && !state.authToken) return;

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [state.authToken, state.authRequired, state.authChecked, load]);

  // Login handler
  const login = useCallback(async (password) => {
    setState(s => ({ ...s, loggingIn: true, loginError: null }));
    try {
      const { token } = await postLogin(password);
      sessionStorage.setItem(SESSION_KEY, token);
      setState(s => ({
        ...s,
        authToken: token,
        loggingIn: false,
        loginError: null,
      }));
      // Now load data with token
      if (state.authRequired) load();
    } catch (e) {
      setState(s => ({ ...s, loggingIn: false, loginError: e.message }));
    }
  }, [state.authRequired, load]);

  // Logout handler
  const logout = useCallback(async () => {
    try { await postLogout(); } catch {}
    sessionStorage.removeItem(SESSION_KEY);
    setState(s => ({
      ...s,
      authToken: null,
      data: null,
      connected: false,
    }));
    // Check again after logout in case user re-locks
    const status = await fetchAuthStatus(null);
    setState(s => ({
      ...s,
      authRequired: status.authEnabled || false,
    }));
  }, []);

  return (
    <TradingContext.Provider value={{ ...state, login, logout }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used within TradingProvider');
  return ctx;
}

// Convenience hooks for specific data slices
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