/**
 * CryptoPriceService — live Binance price feed.
 * Fetches prices for Hermes-traded assets every second via the public Binance API.
 * No auth required. Response is <1KB and resolves in <500ms.
 */

const BINANCE_API = 'https://api.binance.com/api/v3';
const ASSETS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT'];

// Cache the last known prices across calls (bridges the gap between polls)
let _cachedPrices = {};

export function getCachedPrices() {
  return { ..._cachedPrices };
}

/**
 * Fetch live prices for all Hermes assets.
 * Returns a map: { BTC: { price, change24h, changePercent, high24h, low24h, volume, timestamp }, ... }
 */
export async function fetchLivePrices() {
  try {
    const symbols = encodeURIComponent(JSON.stringify(ASSETS));
    const res = await fetch(`${BINANCE_API}/ticker/24hr?symbols=${symbols}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      // On error, return cached prices (stale is better than empty)
      return _cachedPrices;
    }

    const data = await res.json(); // Array of ticker objects

    const prices = {};
    for (const t of data) {
      // Map symbol to asset name (e.g. "BTCUSDT" -> "BTC")
      const asset = t.symbol.replace('USDT', '');
      const price = parseFloat(t.lastPrice);
      const change = parseFloat(t.priceChange);
      const changePct = parseFloat(t.priceChangePercent);
      const high = parseFloat(t.highPrice);
      const low = parseFloat(t.lowPrice);
      const volume = parseFloat(t.quoteVolume);

      prices[asset] = {
        price,
        change24h: change,
        changePercent: changePct,
        high24h: high,
        low24h: low,
        volume24h: volume,
        timestamp: Date.now(),
        formatted: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}`,
        changeFormatted: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
      };
    }

    _cachedPrices = prices;
    return prices;
  } catch (err) {
    // Network / timeout error — return cached (stale is fine for display)
    return _cachedPrices;
  }
}

/**
 * Fetch a single-asset live price (for specific position display).
 * Uses single-symbol endpoint — slightly faster than multi-symbol.
 */
export async function fetchPrice(symbol) {
  try {
    const res = await fetch(`${BINANCE_API}/ticker/price?symbol=${symbol}USDT`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data.price);
  } catch {
    // Fall back to cached
    return _cachedPrices[symbol]?.price || null;
  }
}