/**
 * AlphaForge - Quantitative Backtest Engine
 * Mock Data Generation & Chart Visualization Layer
 * Phase 1: UI Shell & Mock Data Layer
 */

// ============================================================================
// MOCK DATA GENERATION LAYER
// ============================================================================

/**
 * Generates mock OHLCV data for backtesting
 * @param {Object} config - Configuration options
 * @param {number} config.count - Number of data points (default: 100)
 * @param {string} config.symbol - Trading pair symbol (default: 'EURUSD')
 * @param {number} config.basePrice - Starting price (default: 1.0850 for EURUSD)
 * @param {number} config.volatility - Daily volatility factor (default: 0.008)
 * @param {string} config.startDate - Start date in YYYY-MM-DD format (default: 2024-01-01)
 * @param {string} config.timeframe - Timeframe for each bar (default: '1H')
 * @returns {Array<Object>} Array of OHLCV objects
 */
function generateMockOHLCV(config = {}) {
  const {
    count = 100,
    symbol = 'EURUSD',
    basePrice = getBasePriceForSymbol(symbol),
    volatility = getVolatilityForSymbol(symbol),
    startDate = '2024-01-01',
    timeframe = '1H'
  } = config;

  const data = [];
  let currentPrice = basePrice;
  const date = new Date(startDate);
  const timeframeMs = getTimeframeMs(timeframe);

  // Seed for reproducibility (simple LCG)
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Box-Muller transform for normal distribution
  const randomNormal = () => {
    const u1 = random();
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  for (let i = 0; i < count; i++) {
    // Generate returns with slight autocorrelation for realism
    const drift = 0.00001; // Slight upward drift
    const shock = randomNormal() * volatility;
    const returnPct = drift + shock;
    
    // Calculate OHLC from return
    const open = currentPrice;
    const close = open * (1 + returnPct);
    
    // High/Low with intrabar volatility
    const intrabarVol = volatility * 0.5;
    const high = Math.max(open, close) * (1 + Math.abs(randomNormal()) * intrabarVol);
    const low = Math.min(open, close) * (1 - Math.abs(randomNormal()) * intrabarVol);
    
    // Volume with some correlation to volatility
    const baseVolume = getBaseVolumeForSymbol(symbol);
    const volume = Math.floor(baseVolume * (0.5 + random() * 1.5) * (1 + Math.abs(returnPct) * 10));

    // Format date based on timeframe
    const timeStr = formatDateForTimeframe(date, timeframe);

    data.push({
      time: timeStr,
      timestamp: date.getTime(),
      open: parseFloat(open.toFixed(getPrecision(symbol))),
      high: parseFloat(high.toFixed(getPrecision(symbol))),
      low: parseFloat(low.toFixed(getPrecision(symbol))),
      close: parseFloat(close.toFixed(getPrecision(symbol))),
      volume: volume
    });

    currentPrice = close;
    date.setTime(date.getTime() + timeframeMs);
  }

  return data;
}

/**
 * Get base price for symbol
 */
function getBasePriceForSymbol(symbol) {
  const prices = {
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'BTCUSD': 43250.00
  };
  return prices[symbol] || 1.0;
}

/**
 * Get volatility for symbol
 */
function getVolatilityForSymbol(symbol) {
  const vols = {
    'EURUSD': 0.0008,   // ~80 pips daily
    'GBPUSD': 0.0010,   // ~100 pips daily
    'BTCUSD': 0.025     // ~2.5% daily
  };
  return vols[symbol] || 0.01;
}

/**
 * Get base volume for symbol
 */
function getBaseVolumeForSymbol(symbol) {
  const vols = {
    'EURUSD': 100000,
    'GBPUSD': 80000,
    'BTCUSD': 500
  };
  return vols[symbol] || 10000;
}

/**
 * Get decimal precision for symbol
 */
function getPrecision(symbol) {
  if (symbol.includes('BTC')) return 2;
  if (symbol.includes('JPY')) return 3;
  return 5;
}

/**
 * Get milliseconds for timeframe
 */
function getTimeframeMs(timeframe) {
  const map = {
    '1M': 60 * 1000,
    '5M': 5 * 60 * 1000,
    '15M': 15 * 60 * 1000,
    '30M': 30 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '1W': 7 * 24 * 60 * 60 * 1000
  };
  return map[timeframe] || map['1H'];
}

/**
 * Format date for timeframe
 */
function formatDateForTimeframe(date, timeframe) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  
  if (timeframe === '1D' || timeframe === '1W') {
    return `${yyyy}-${mm}-${dd}`;
  }
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// ============================================================================
// TECHNICAL INDICATORS (Phase 2)
// ============================================================================

/**
 * Extract close prices from OHLCV data
 * @param {Array<Object>} ohlcvData - Array of OHLCV objects
 * @returns {Array<number>} Array of close prices
 */
function extractClosePrices(ohlcvData) {
  return ohlcvData.map(bar => bar.close);
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array<number>} values - Array of numerical values
 * @param {number} period - SMA period
 * @returns {Array<number|null>} Array of SMA values (null for insufficient data)
 */
function calculateSMA(values, period) {
  const result = new Array(values.length).fill(null);
  if (values.length < period) return result;
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  result[period - 1] = sum / period;
  
  for (let i = period; i < values.length; i++) {
    sum = sum - values[i - period] + values[i];
    result[i] = sum / period;
  }
  
  return result;
}

/**
 * Calculate Standard Deviation
 * @param {Array<number>} values - Array of numerical values
 * @param {number} period - Lookback period
 * @returns {Array<number|null>} Array of standard deviation values
 */
function calculateStdDev(values, period) {
  const result = new Array(values.length).fill(null);
  if (values.length < period) return result;
  
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    result[i] = Math.sqrt(variance);
  }
  
  return result;
}

/**
 * Calculate RSI (Relative Strength Index) using Wilder's Smoothing Method
 * @param {Array<number>} closePrices - Array of close prices
 * @param {number} period - RSI period (default: 14)
 * @returns {Array<number|null>} Array of RSI values aligned with input (null for insufficient data)
 */
function calculateRSI(closePrices, period = 14) {
  const result = new Array(closePrices.length).fill(null);
  
  if (closePrices.length < period + 1) {
    console.warn(`RSI: Insufficient data. Need at least ${period + 1} prices, got ${closePrices.length}`);
    return result;
  }
  
  // Calculate price changes
  const changes = new Array(closePrices.length).fill(0);
  for (let i = 1; i < closePrices.length; i++) {
    changes[i] = closePrices[i] - closePrices[i - 1];
  }
  
  // Separate gains and losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
  
  // Initial average gain/loss (simple average for first period)
  let avgGain = gains.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  
  // First RSI value at index = period
  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - (100 / (1 + rs));
  }
  
  // Wilder's Smoothing for subsequent values
  // avgGain = (prevAvgGain * (period - 1) + currentGain) / period
  // avgLoss = (prevAvgLoss * (period - 1) + currentLoss) / period
  for (let i = period + 1; i < closePrices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - (100 / (1 + rs));
    }
  }
  
  return result;
}

/**
 * Calculate Bollinger Bands
 * @param {Array<number>} closePrices - Array of close prices
 * @param {number} period - SMA period (default: 20)
 * @param {number} multiplier - Standard deviation multiplier (default: 2)
 * @returns {Array<Object|null>} Array of { upper, middle, lower } bands
 */
function calculateBollingerBands(closePrices, period = 20, multiplier = 2) {
  const result = new Array(closePrices.length).fill(null);
  
  if (closePrices.length < period) {
    console.warn(`Bollinger Bands: Insufficient data. Need at least ${period} prices, got ${closePrices.length}`);
    return result;
  }
  
  const sma = calculateSMA(closePrices, period);
  const stdDev = calculateStdDev(closePrices, period);
  
  for (let i = period - 1; i < closePrices.length; i++) {
    const middle = sma[i];
    const bandWidth = stdDev[i] * multiplier;
    
    result[i] = {
      upper: middle + bandWidth,
      middle: middle,
      lower: middle - bandWidth
    };
  }
  
  return result;
}

/**
 * Run integration test on indicators
 * @param {Array<Object>} ohlcvData - Mock OHLCV data
 */
function runIndicatorIntegrationTest(ohlcvData) {
  console.group('%c AlphaForge Phase 2 - Indicator Integration Test ', 'background: #00d4aa; color: #0a0e14; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  
  const closePrices = extractClosePrices(ohlcvData);
  console.log(`Data points: ${closePrices.length}`);
  console.log(`Price range: ${Math.min(...closePrices).toFixed(5)} - ${Math.max(...closePrices).toFixed(5)}`);
  
  // Test RSI
  console.group('%c RSI (14-period, Wilder\'s Smoothing)', 'color: #00b8d4; font-weight: 600;');
  const rsi = calculateRSI(closePrices, 14);
  const validRSI = rsi.filter(v => v !== null);
  console.log(`Calculated values: ${validRSI.length} / ${closePrices.length}`);
  console.log(`RSI range: ${Math.min(...validRSI).toFixed(2)} - ${Math.max(...validRSI).toFixed(2)}`);
  
  console.log('\nLast 5 RSI values:');
  for (let i = Math.max(0, closePrices.length - 5); i < closePrices.length; i++) {
    const time = ohlcvData[i].time;
    const price = closePrices[i].toFixed(5);
    const rsiVal = rsi[i] !== null ? rsi[i].toFixed(2) : 'N/A';
    const signal = rsi[i] !== null ? (rsi[i] < 30 ? '🟢 OVERSOLD' : rsi[i] > 70 ? '🔴 OVERBOUGHT' : '⚪ NEUTRAL') : '';
    console.log(`  ${time} | Close: ${price} | RSI: ${rsiVal} ${signal}`);
  }
  console.groupEnd();
  
  // Test Bollinger Bands
  console.group('%c Bollinger Bands (20-period, 2σ)', 'color: #fbbf24; font-weight: 600;');
  const bb = calculateBollingerBands(closePrices, 20, 2);
  const validBB = bb.filter(v => v !== null);
  console.log(`Calculated values: ${validBB.length} / ${closePrices.length}`);
  
  console.log('\nLast 5 Bollinger Band values:');
  for (let i = Math.max(0, closePrices.length - 5); i < closePrices.length; i++) {
    const time = ohlcvData[i].time;
    const price = closePrices[i].toFixed(5);
    if (bb[i]) {
      const { upper, middle, lower } = bb[i];
      const position = ((price - lower) / (upper - lower) * 100).toFixed(1);
      const signal = price <= lower ? '🟢 AT LOWER BAND' : price >= upper ? '🔴 AT UPPER BAND' : '⚪ MIDDLE';
      console.log(`  ${time} | Close: ${price} | BB: [${lower.toFixed(5)}, ${middle.toFixed(5)}, ${upper.toFixed(5)}] | %B: ${position}% ${signal}`);
    } else {
      console.log(`  ${time} | Close: ${price} | BB: N/A (insufficient data)`);
    }
  }
  console.groupEnd();
  
  // Summary
  console.group('%c Summary', 'color: #00d4aa; font-weight: 600;');
  const lastRSI = rsi[rsi.length - 1];
  const lastBB = bb[bb.length - 1];
  console.log(`Latest RSI (14): ${lastRSI !== null ? lastRSI.toFixed(2) : 'N/A'} ${lastRSI !== null ? (lastRSI < 30 ? '(Oversold)' : lastRSI > 70 ? '(Overbought)' : '(Neutral)') : ''}`);
  if (lastBB) {
    const lastPrice = closePrices[closePrices.length - 1];
    console.log(`Latest BB: Upper=${lastBB.upper.toFixed(5)}, Middle=${lastBB.middle.toFixed(5)}, Lower=${lastBB.lower.toFixed(5)}`);
    console.log(`Price vs Bands: ${lastPrice <= lastBB.lower ? 'At/Below Lower' : lastPrice >= lastBB.upper ? 'At/Above Upper' : 'Within Bands'}`);
}
console.groupEnd();
console.groupEnd();

return { rsi, bb };
}

// ============================================================================
// BACKTEST ENGINE (Phase 3 - Real Simulation Engine)
// ============================================================================

/**
 * Run the actual backtest simulation using real indicator data
 * @param {Object} config - Backtest configuration
 * @param {Array<Object>} ohlcvData - Historical OHLCV data
 * @param {Array<number|null>} rsiData - RSI values aligned with data
 * @param {Array<Object|null>} bbData - Bollinger Bands aligned with data
 * @returns {Object} Backtest results with trades, equity curve, and metrics
 */
function runBacktest(config, ohlcvData, rsiData, bbData) {
  const { capital, stopLossPct, takeProfitPct } = config;
  
  // Trade state management
  let currentCapital = capital;
  let peakCapital = capital;
  let maxDrawdown = 0;
  const openTrades = [];
  const closedTrades = [];
  const equityCurve = [{ time: ohlcvData[0].time, equity: capital }];
  
  // Position sizing: fixed fractional (10% of capital per trade)
  const positionSizeFraction = 0.1;
  
  console.group('%c AlphaForge Phase 3 - Backtest Execution ', 'background: #fbbf24; color: #0a0e14; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.log(`Starting Capital: $${capital.toLocaleString()}`);
  console.log(`Risk Parameters: SL=${stopLossPct}%, TP=${takeProfitPct}%`);
  console.log(`Data Points: ${ohlcvData.length}`);
  console.log('---');
  
  // Main execution loop - iterate through each bar sequentially
  for (let i = 0; i < ohlcvData.length; i++) {
    const bar = ohlcvData[i];
    const rsi = rsiData[i];
    const bb = bbData[i];
    const currentPrice = bar.close;
    
    // Update equity curve for this bar (mark-to-market for open positions)
    let unrealizedPnL = 0;
    for (const trade of openTrades) {
      if (trade.side === 'long') {
        unrealizedPnL += (currentPrice - trade.entryPrice) * trade.positionSize;
      } else {
        unrealizedPnL += (trade.entryPrice - currentPrice) * trade.positionSize;
      }
    }
    const currentEquity = currentCapital + unrealizedPnL;
    equityCurve.push({ time: bar.time, equity: currentEquity });
    
    // Update peak and drawdown
    peakCapital = Math.max(peakCapital, currentEquity);
    const drawdown = peakCapital > 0 ? ((peakCapital - currentEquity) / peakCapital) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    
    // --- EXIT LOGIC: Check open trades for SL/TP hits ---
    // Iterate backwards to safely splice the array
    for (let t = openTrades.length - 1; t >= 0; t--) {
      const trade = openTrades[t];
      let exitPrice = null;
      let exitReason = '';
      
      if (trade.side === 'long') {
        // Check Stop Loss
        if (currentPrice <= trade.stopLossPrice) {
          exitPrice = trade.stopLossPrice;
          exitReason = 'STOP_LOSS';
        }
        // Check Take Profit
        else if (currentPrice >= trade.takeProfitPrice) {
          exitPrice = trade.takeProfitPrice;
          exitReason = 'TAKE_PROFIT';
        }
      } else { // short
        // Check Stop Loss
        if (currentPrice >= trade.stopLossPrice) {
          exitPrice = trade.stopLossPrice;
          exitReason = 'STOP_LOSS';
        }
        // Check Take Profit
        else if (currentPrice <= trade.takeProfitPrice) {
          exitPrice = trade.takeProfitPrice;
          exitReason = 'TAKE_PROFIT';
        }
      }
      
      // Close trade if exit condition met
      if (exitPrice !== null) {
        const pnl = trade.side === 'long' 
          ? (exitPrice - trade.entryPrice) * trade.positionSize
          : (trade.entryPrice - exitPrice) * trade.positionSize;
        
        const returnPct = (pnl / (trade.entryPrice * trade.positionSize)) * 100;
        
        currentCapital += pnl;
        
        const closedTrade = {
          id: closedTrades.length + 1,
          entryTime: trade.entryTime,
          exitTime: bar.time,
          side: trade.side,
          entryPrice: trade.entryPrice,
          exitPrice: exitPrice,
          positionSize: trade.positionSize,
          pnl: pnl,
          returnPct: returnPct,
          exitReason: exitReason,
          barsHeld: i - trade.entryIndex
        };
        
        closedTrades.push(closedTrade);
        openTrades.splice(t, 1);
        
        console.log(`%c EXIT ${trade.side.toUpperCase()} #${closedTrade.id}`, 
          exitReason === 'TAKE_PROFIT' ? 'color: #00d4aa; font-weight: bold;' : 'color: #f87171; font-weight: bold;',
          `| Entry: ${trade.entryPrice.toFixed(5)} | Exit: ${exitPrice.toFixed(5)} | P&L: $${pnl.toFixed(2)} (${returnPct.toFixed(2)}%) | Reason: ${exitReason} | Bars Held: ${closedTrade.barsHeld}`
        );
      }
    }
    
    // --- ENTRY LOGIC: Only enter if no open positions (no pyramiding) ---
    if (openTrades.length === 0 && rsi !== null && bb !== null) {
      const lowerBand = bb.lower;
      const upperBand = bb.upper;
      let entrySignal = null;
      
      // Long Entry: RSI < 30 AND Close <= Lower Bollinger Band
      if (rsi < 30 && currentPrice <= lowerBand) {
        entrySignal = 'long';
      }
      // Short Entry: RSI > 70 AND Close >= Upper Bollinger Band
      else if (rsi > 70 && currentPrice >= upperBand) {
        entrySignal = 'short';
      }
      
      if (entrySignal) {
        const entryPrice = currentPrice;
        const positionValue = currentCapital * positionSizeFraction;
        const positionSize = positionValue / entryPrice;
        
        // Calculate SL/TP prices
        const slDistance = entryPrice * (stopLossPct / 100);
        const tpDistance = entryPrice * (takeProfitPct / 100);
        
        let stopLossPrice, takeProfitPrice;
        if (entrySignal === 'long') {
          stopLossPrice = entryPrice - slDistance;
          takeProfitPrice = entryPrice + tpDistance;
        } else {
          stopLossPrice = entryPrice + slDistance;
          takeProfitPrice = entryPrice - tpDistance;
        }
        
        const newTrade = {
          entryIndex: i,
          entryTime: bar.time,
          side: entrySignal,
          entryPrice: entryPrice,
          positionSize: positionSize,
          stopLossPrice: stopLossPrice,
          takeProfitPrice: takeProfitPrice
        };
        
        openTrades.push(newTrade);
        
        console.log(`%c ENTRY ${entrySignal.toUpperCase()} #${closedTrades.length + openTrades.length}`, 'color: #00b8d4; font-weight: bold;',
          `| Time: ${bar.time} | Price: ${entryPrice.toFixed(5)} | RSI: ${rsi.toFixed(2)} | BB: [${lowerBand.toFixed(5)}, ${bb.middle.toFixed(5)}, ${upperBand.toFixed(5)}] | Size: ${positionSize.toFixed(4)} | SL: ${stopLossPrice.toFixed(5)} | TP: ${takeProfitPrice.toFixed(5)}`
        );
      }
    }
  }
  
  // Close any remaining open trades at the last bar's close price
  const lastPrice = ohlcvData[ohlcvData.length - 1].close;
  const lastTime = ohlcvData[ohlcvData.length - 1].time;
  
  for (const trade of openTrades) {
    const pnl = trade.side === 'long' 
      ? (lastPrice - trade.entryPrice) * trade.positionSize
      : (trade.entryPrice - lastPrice) * trade.positionSize;
    
    const returnPct = (pnl / (trade.entryPrice * trade.positionSize)) * 100;
    currentCapital += pnl;
    
    closedTrades.push({
      id: closedTrades.length + 1,
      entryTime: trade.entryTime,
      exitTime: lastTime,
      side: trade.side,
      entryPrice: trade.entryPrice,
      exitPrice: lastPrice,
      positionSize: trade.positionSize,
      pnl: pnl,
      returnPct: returnPct,
      exitReason: 'END_OF_DATA',
      barsHeld: ohlcvData.length - 1 - trade.entryIndex
    });
    
    console.log(`%c EXIT ${trade.side.toUpperCase()} #${closedTrades.length} (End of Data)`, 'color: #94a3b8; font-weight: bold;',
      `| Entry: ${trade.entryPrice.toFixed(5)} | Exit: ${lastPrice.toFixed(5)} | P&L: $${pnl.toFixed(2)} (${returnPct.toFixed(2)}%)`
    );
  }
  openTrades.length = 0;
  
  // --- FINAL METRICS CALCULATION ---
  const netProfit = currentCapital - capital;
  const netProfitPct = (netProfit / capital) * 100;
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter(t => t.pnl > 0).length;
  const losses = closedTrades.filter(t => t.pnl <= 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  
  // Profit Factor
  const grossProfit = closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(closedTrades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  
  // Sharpe Ratio (simplified, using bar-to-bar returns from equity curve)
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const ret = (equityCurve[i].equity - equityCurve[i-1].equity) / equityCurve[i-1].equity;
    returns.push(ret);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const stdReturn = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length || 1));
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252 * 24) : 0; // Annualized for 1H data
  
  // Average win/loss
  const avgWin = wins > 0 ? closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(closedTrades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) / losses) : 0;
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  // Max consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0, currentConsecWins = 0, currentConsecLosses = 0;
  for (const trade of closedTrades) {
    if (trade.pnl > 0) {
      currentConsecWins++;
      currentConsecLosses = 0;
      maxConsecWins = Math.max(maxConsecWins, currentConsecWins);
    } else {
      currentConsecLosses++;
      currentConsecWins = 0;
      maxConsecLosses = Math.max(maxConsecLosses, currentConsecLosses);
    }
  }
  
  const results = {
    config,
    trades: closedTrades,
    equityCurve: equityCurve,
    metrics: {
      netProfit,
      netProfitPct,
      totalTrades,
      wins,
      losses,
      winRate,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
      avgWin,
      avgLoss,
      riskRewardRatio,
      maxConsecWins,
      maxConsecLosses,
      finalCapital: currentCapital
    }
  };
  
  // --- CONSOLE SUMMARY OUTPUT ---
  console.group('%c BACKTEST SUMMARY ', 'background: #00d4aa; color: #0a0e14; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.log(`Final Capital: $${currentCapital.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`Net Profit: $${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${netProfitPct.toFixed(2)}%)`);
  console.log(`Total Trades: ${totalTrades} | Wins: ${wins} | Losses: ${losses} | Win Rate: ${winRate.toFixed(1)}%`);
  console.log(`Max Drawdown: ${maxDrawdown.toFixed(2)}%`);
  console.log(`Sharpe Ratio: ${sharpeRatio.toFixed(2)}`);
  console.log(`Profit Factor: ${profitFactor.toFixed(2)}`);
  console.log(`Avg Win: $${avgWin.toFixed(2)} | Avg Loss: $${avgLoss.toFixed(2)} | R:R Ratio: ${riskRewardRatio.toFixed(2)}`);
  console.log(`Max Consecutive Wins: ${maxConsecWins} | Max Consecutive Losses: ${maxConsecLosses}`);
  console.groupEnd();
  
  // Trade table
  console.group('%c CLOSED TRADES LOG ', 'background: #00b8d4; color: #0a0e14; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.table(closedTrades.map(t => ({
    '#': t.id,
    'Type': t.side.toUpperCase(),
    'Entry Time': t.entryTime,
    'Exit Time': t.exitTime,
    'Entry Price': t.entryPrice.toFixed(5),
    'Exit Price': t.exitPrice.toFixed(5),
    'P&L ($)': t.pnl.toFixed(2),
    'Return (%)': t.returnPct.toFixed(2),
    'Reason': t.exitReason,
    'Bars Held': t.barsHeld
  })));
  console.groupEnd();
  
  console.groupEnd(); // End main backtest group
  
  return results;
}

// ============================================================================
// BACKTEST ENGINE (Phase 1 placeholder - kept for reference)
// ============================================================================

/**
 * Mock backtest engine - Phase 1 placeholder
 * Returns mock results for UI demonstration
 * @deprecated Use runBacktest() for actual simulation
 */
function runMockBacktest(config, ohlcvData) {
  const { capital, stopLossPct, takeProfitPct } = config;
  
  // Simulate some trades based on mock data
  const trades = [];
  let equity = capital;
  let peakEquity = capital;
  let maxDrawdown = 0;
  let wins = 0;
  let losses = 0;
  const equityCurve = [{ time: ohlcvData[0].time, equity: capital }];
  
  // Generate mock trades (every ~10 bars)
  for (let i = 10; i < ohlcvData.length; i += 8 + Math.floor(Math.random() * 6)) {
    const bar = ohlcvData[i];
    const side = Math.random() > 0.5 ? 'long' : 'short';
    const entryPrice = bar.close;
    
    // Simulate outcome based on SL/TP
    const slDistance = entryPrice * (stopLossPct / 100);
    const tpDistance = entryPrice * (takeProfitPct / 100);
    
    // Random outcome weighted by R:R ratio
    const rrRatio = takeProfitPct / stopLossPct;
    const winProb = 1 / (1 + rrRatio) * 0.9; // Slightly worse than breakeven
    const isWin = Math.random() < winProb;
    
    const exitPrice = side === 'long' 
      ? (isWin ? entryPrice + tpDistance : entryPrice - slDistance)
      : (isWin ? entryPrice - tpDistance : entryPrice + slDistance);
    
    const pnl = side === 'long' 
      ? (exitPrice - entryPrice) * (capital / entryPrice) * 0.1 // 10% position size
      : (entryPrice - exitPrice) * (capital / entryPrice) * 0.1;
    
    const returnPct = (pnl / capital) * 100;
    
    equity += pnl;
    peakEquity = Math.max(peakEquity, equity);
    const drawdown = ((peakEquity - equity) / peakEquity) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    
    if (pnl > 0) wins++; else losses++;
    
    trades.push({
      id: trades.length + 1,
      time: bar.time,
      side,
      entry: entryPrice,
      exit: exitPrice,
      pnl: pnl,
      returnPct: returnPct
    });
    
    equityCurve.push({ time: bar.time, equity });
  }
  
  // Fill equity curve for chart
  const fullEquityCurve = ohlcvData.map((bar, i) => {
    const trade = trades.find(t => t.time === bar.time);
    return { time: bar.time, equity: trade ? equityCurve.find(e => e.time === bar.time)?.equity || capital : capital };
  });
  
  const netProfit = equity - capital;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  
  // Mock Sharpe calculation
  const returns = equityCurve.slice(1).map((point, i) => 
    (point.equity - equityCurve[i].equity) / equityCurve[i].equity
  );
  const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const stdReturn = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length || 1));
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252 * 24) : 0; // Annualized for 1H
  
  return {
    config,
    trades,
    equityCurve: fullEquityCurve,
    metrics: {
      netProfit: netProfit,
      netProfitPct: (netProfit / capital) * 100,
      winRate,
      totalTrades,
      wins,
      losses,
      maxDrawdown,
      sharpeRatio: sharpe,
      profitFactor: losses > 0 ? wins / losses : wins > 0 ? 999 : 0
    }
  };
}

// ============================================================================
// CHART VISUALIZATION LAYER
// ============================================================================

let equityChart = null;
let currentChartType = 'equity';

function initializeChart() {
  const canvas = document.getElementById('equityChart');
  const ctx = canvas.getContext('2d');
  
  // Create gradients after canvas has size
  function createGradients() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 212, 170, 0.02)');
    
    const ddGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    ddGradient.addColorStop(0, 'rgba(248, 113, 113, 0.25)');
    ddGradient.addColorStop(1, 'rgba(248, 113, 113, 0.02)');
    
    return { gradient, ddGradient };
  }
  
  const { gradient, ddGradient } = createGradients();
  
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size = 11;
  
  equityChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Equity Curve',
          data: [],
          borderColor: '#00d4aa',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00d4aa',
          pointBorderColor: '#0a0e14',
          pointBorderWidth: 2,
          pointHitRadius: 10
        },
        {
          label: 'Drawdown',
          data: [],
          borderColor: '#f87171',
          backgroundColor: ddGradient,
          borderWidth: 1.5,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          hidden: true,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1a222e',
          titleColor: '#e8ebf0',
          bodyColor: '#94a3b8',
          borderColor: '#2d3a4f',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Space Grotesk', sans-serif", size: 12, weight: '600' },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label === 'Equity Curve') {
                return `${label}: $${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
              }
              if (label === 'Drawdown') {
                return `${label}: ${Math.abs(value).toFixed(2)}%`;
              }
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              hour: 'MMM dd HH:mm',
              day: 'MMM dd'
            }
          },
          grid: {
            color: '#1e2a3a',
            drawBorder: false
          },
          ticks: {
            maxTicksLimit: 8,
            color: '#5a6a85'
          }
        },
        y: {
          type: 'linear',
          position: 'right',
          grid: {
            color: '#1e2a3a',
            drawBorder: false
          },
          ticks: {
            color: '#5a6a85',
            callback: function(value) {
              return '$' + value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
            }
          }
        },
        y1: {
          type: 'linear',
          position: 'left',
          display: false,
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: function(value) {
              return Math.abs(value).toFixed(1) + '%';
            }
          }
        }
      },
      animation: {
        duration: 750,
        easing: 'easeOutQuart'
      }
    }
  });
  
  // Recreate gradients on resize
  const resizeObserver = new ResizeObserver(() => {
    if (equityChart) {
      const { gradient, ddGradient } = createGradients();
      equityChart.data.datasets[0].backgroundColor = gradient;
      equityChart.data.datasets[1].backgroundColor = ddGradient;
      equityChart.update('none');
    }
  });
  resizeObserver.observe(canvas);
}

function updateChart(data, chartType = 'equity') {
  if (!equityChart) return;
  
  currentChartType = chartType;
  const { equityCurve, metrics } = data;
  
  // Recreate gradients (canvas size may have changed)
  const ctx = equityChart.ctx;
  const chartHeight = ctx.canvas.height;
  
  const equityGradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
  equityGradient.addColorStop(0, 'rgba(0, 212, 170, 0.25)');
  equityGradient.addColorStop(1, 'rgba(0, 212, 170, 0.02)');
  
  const ddGradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
  ddGradient.addColorStop(0, 'rgba(248, 113, 113, 0.25)');
  ddGradient.addColorStop(1, 'rgba(248, 113, 113, 0.02)');
  
  // Prepare equity data
  const equityData = equityCurve.map(point => ({
    x: new Date(point.time.replace(' ', 'T')),
    y: point.equity
  }));
  
  // Prepare drawdown data
  let peak = equityCurve[0]?.equity || 0;
  const drawdownData = equityCurve.map(point => {
    peak = Math.max(peak, point.equity);
    const dd = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
    return { x: new Date(point.time.replace(' ', 'T')), y: -dd };
  });
  
  equityChart.data.datasets[0].data = equityData;
  equityChart.data.datasets[0].backgroundColor = equityGradient;
  equityChart.data.datasets[1].data = drawdownData;
  equityChart.data.datasets[1].backgroundColor = ddGradient;
  
  // Toggle visibility based on chart type
  equityChart.data.datasets[0].hidden = chartType === 'drawdown';
  equityChart.data.datasets[1].hidden = chartType !== 'drawdown';
  equityChart.options.scales.y1.display = chartType === 'drawdown';
  
  equityChart.update('active');
  
  // Hide empty state
  document.getElementById('chartEmptyState').classList.add('hidden');
  document.getElementById('equityChart').classList.remove('hidden');
}

function showChartLoading(show) {
  document.getElementById('chartLoading').classList.toggle('hidden', !show);
  document.getElementById('equityChart').classList.toggle('hidden', show);
}

function exportChartAsPNG() {
  if (!equityChart) return;
  const link = document.createElement('a');
  link.download = `alphaforge-equity-${new Date().toISOString().split('T')[0]}.png`;
  link.href = equityChart.toBase64Image('image/png', 1.0);
  link.click();
  showToast('Chart exported as PNG', 'success');
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

let currentConfig = {
  asset: 'EURUSD',
  strategy: 'rsi_bb',
  capital: 10000,
  stopLossPct: 2.0,
  takeProfitPct: 4.0
};

let mockData = null;
let backtestResults = null;

function init() {
  // Generate initial mock data
  mockData = generateMockOHLCV({ count: 100, symbol: currentConfig.asset });
  
  // Run Phase 2 Indicator Integration Test
  runIndicatorIntegrationTest(mockData);
  
  // Initialize chart
  initializeChart();
  
  // Bind UI events
  bindEvents();
  
  // Update UI with defaults
  updateMetricsDisplay(null);
  updateTradeLog([]);
  
  showToast('AlphaForge initialized. Mock data generated (100 bars). Indicators tested.', 'success');
}

function bindEvents() {
  // Form submission
  document.getElementById('configForm').addEventListener('submit', handleBacktestRun);
  
  // Asset change -> regenerate mock data
  document.getElementById('assetSelect').addEventListener('change', (e) => {
    currentConfig.asset = e.target.value;
    mockData = generateMockOHLCV({ count: 100, symbol: currentConfig.asset });
    runIndicatorIntegrationTest(mockData);
    showToast(`Mock data regenerated for ${currentConfig.asset}. Indicators recalculated.`, 'info');
  });
  
  // Strategy change
  document.getElementById('strategySelect').addEventListener('change', (e) => {
    currentConfig.strategy = e.target.value;
  });
  
  // Capital input
  document.getElementById('capitalInput').addEventListener('change', (e) => {
    currentConfig.capital = parseFloat(e.target.value) || 10000;
  });
  
  // Risk inputs
  document.getElementById('stopLossInput').addEventListener('change', (e) => {
    currentConfig.stopLossPct = parseFloat(e.target.value) || 2.0;
  });
  document.getElementById('takeProfitInput').addEventListener('change', (e) => {
    currentConfig.takeProfitPct = parseFloat(e.target.value) || 4.0;
  });
  
  // Reset config
  document.getElementById('resetConfig').addEventListener('click', resetConfig);
  
  // Chart type change
  document.getElementById('chartType').addEventListener('change', (e) => {
    if (backtestResults) {
      updateChart(backtestResults, e.target.value);
    }
  });
  
  // Export chart
  document.getElementById('exportChart').addEventListener('click', exportChartAsPNG);
  
  // Run from chart empty state
  document.getElementById('runFromChart').addEventListener('click', handleBacktestRun);
  
  // Toggle trade log
  document.getElementById('toggleTradeLog').addEventListener('click', toggleTradeLog);
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

async function handleBacktestRun(e) {
  e.preventDefault();
  
  const runBtn = document.getElementById('runBacktest');
  const originalText = runBtn.innerHTML;
  
  // Show loading state
  runBtn.disabled = true;
  runBtn.innerHTML = `
    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Running...
  `;
  showChartLoading(true);
  
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate indicators fresh
  const closePrices = mockData.map(bar => bar.close);
  const rsiData = calculateRSI(closePrices, 14);
  const bbData = calculateBollingerBands(closePrices, 20, 2);
  
  // Run REAL backtest engine (Phase 3)
  backtestResults = runBacktest(currentConfig, mockData, rsiData, bbData);
  
  // Update UI
  updateMetricsDisplay(backtestResults.metrics);
  updateChart(backtestResults, currentChartType);
  updateTradeLog(backtestResults.trades);
  
  // Reset button
  runBtn.disabled = false;
  runBtn.innerHTML = originalText;
  showChartLoading(false);
  
  showToast(`Backtest complete: ${backtestResults.metrics.totalTrades} trades, ${backtestResults.metrics.netProfitPct.toFixed(2)}% return`, 'success');
}

function resetConfig() {
  currentConfig = {
    asset: 'EURUSD',
    strategy: 'rsi_bb',
    capital: 10000,
    stopLossPct: 2.0,
    takeProfitPct: 4.0
  };
  
  document.getElementById('assetSelect').value = currentConfig.asset;
  document.getElementById('strategySelect').value = currentConfig.strategy;
  document.getElementById('capitalInput').value = currentConfig.capital;
  document.getElementById('stopLossInput').value = currentConfig.stopLossPct;
  document.getElementById('takeProfitInput').value = currentConfig.takeProfitPct;
  
  // Regenerate mock data for default asset
  mockData = generateMockOHLCV({ count: 100, symbol: currentConfig.asset });
  
  // Reset results
  backtestResults = null;
  updateMetricsDisplay(null);
  updateChart({ equityCurve: [{ time: mockData[0].time, equity: currentConfig.capital }], metrics: {} }, 'equity');
  updateTradeLog([]);
  document.getElementById('chartEmptyState').classList.remove('hidden');
  document.getElementById('equityChart').classList.add('hidden');
  
  showToast('Configuration reset to defaults', 'info');
}

function updateMetricsDisplay(metrics) {
  const elements = {
    netProfit: document.getElementById('metricNetProfit'),
    netProfitPct: document.getElementById('netProfitPct'),
    winRate: document.getElementById('metricWinRate'),
    maxDD: document.getElementById('metricMaxDD'),
    sharpe: document.getElementById('metricSharpe')
  };
  
  if (!metrics) {
    // Show skeleton/loading state
    Object.values(elements).forEach(el => {
      if (el) el.classList.add('skeleton');
    });
    elements.netProfitPct.textContent = '';
    document.querySelector('#metricsGrid article:nth-child(2) p').textContent = '— / — trades';
    return;
  }
  
  // Remove skeleton
  Object.values(elements).forEach(el => {
    if (el) el.classList.remove('skeleton');
  });
  
  // Net Profit
  const profitColor = metrics.netProfit >= 0 ? '#00d4aa' : '#f87171';
  elements.netProfit.textContent = `$${metrics.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  elements.netProfit.style.color = profitColor;
  elements.netProfitPct.textContent = `${metrics.netProfitPct >= 0 ? '+' : ''}${metrics.netProfitPct.toFixed(2)}%`;
  elements.netProfitPct.style.color = profitColor;
  
  // Win Rate
  elements.winRate.textContent = `${metrics.winRate.toFixed(1)}%`;
  elements.winRate.style.color = metrics.winRate >= 50 ? '#00d4aa' : '#f87171';
  document.querySelector('#metricsGrid article:nth-child(2) p').textContent = `${metrics.wins} / ${metrics.totalTrades} trades`;
  
  // Max Drawdown
  elements.maxDD.textContent = `${metrics.maxDrawdown.toFixed(2)}%`;
  elements.maxDD.style.color = metrics.maxDrawdown > 15 ? '#f87171' : metrics.maxDrawdown > 8 ? '#fbbf24' : '#00d4aa';
  
  // Sharpe
  elements.sharpe.textContent = metrics.sharpeRatio.toFixed(2);
  elements.sharpe.style.color = metrics.sharpeRatio > 1.5 ? '#00d4aa' : metrics.sharpeRatio > 0.5 ? '#fbbf24' : '#f87171';
}

function updateTradeLog(trades) {
  const tbody = document.getElementById('tradeLogBody');
  
  if (!trades || trades.length === 0) {
    tbody.innerHTML = '<tr class="hover:bg-neutral-900/50"><td colspan="5" class="py-8 text-center text-neutral-600">Run a backtest to see trade history</td></tr>';
    return;
  }
  
  tbody.innerHTML = trades.map((trade) => `
    <tr class="hover:bg-neutral-900/50 border-t border-neutral-800">
      <td class="py-3 px-2 font-mono text-neutral-500">${trade.id}</td>
      <td class="py-3 px-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trade.side === 'long' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}">
          ${trade.side === 'long' ? '↑ Long' : '↓ Short'}
        </span>
      </td>
      <td class="py-3 px-2 font-mono text-sm">${trade.entryPrice.toFixed(trade.entryPrice > 100 ? 2 : 5)}</td>
      <td class="py-3 px-2 font-mono text-sm">${trade.exitPrice.toFixed(trade.exitPrice > 100 ? 2 : 5)}</td>
      <td class="py-3 px-2 font-mono text-sm ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}">
        ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
      </td>
    </tr>
  `).join('');
}

function toggleTradeLog() {
  const content = document.getElementById('tradeLogContent');
  const icon = document.getElementById('tradeLogIcon');
  const isExpanded = !content.classList.contains('hidden');
  
  content.classList.toggle('hidden');
  icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
  document.getElementById('toggleTradeLog').setAttribute('aria-expanded', !isExpanded);
}

function toggleTheme() {
  // Theme toggle placeholder for future dark/light mode
  showToast('Theme toggle - coming in Phase 2', 'info');
}

function showChartLoading(show) {
  document.getElementById('chartLoading').classList.toggle('hidden', !show);
  if (show) {
    document.getElementById('equityChart').classList.add('hidden');
    document.getElementById('chartEmptyState').classList.add('hidden');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  
  const styles = {
    info: 'bg-blue-500/90 border-blue-400',
    success: 'bg-emerald-500/90 border-emerald-400',
    error: 'bg-red-500/90 border-red-400',
    warning: 'bg-amber-500/90 border-amber-400'
  };
  
  const icons = {
    info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
    warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
  };
  
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg border ${styles[type]} text-white text-sm font-medium shadow-lg animate-slide-in`;
  toast.innerHTML = `${icons[type]}<span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slide-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Add slide-out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slide-out {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  .animate-slide-in { animation: slide-in 0.3s ease forwards; }
`;
document.head.appendChild(style);

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================

document.addEventListener('DOMContentLoaded', init);

// Export for potential module usage
window.AlphaForge = {
  generateMockOHLCV,
  runMockBacktest,
  runBacktest,
  calculateRSI,
  calculateBollingerBands,
  calculateSMA,
  calculateStdDev,
  extractClosePrices,
  runIndicatorIntegrationTest,
  init
};