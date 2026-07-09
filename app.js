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
// BACKTEST ENGINE (Phase 2 placeholder - mock implementation)
// ============================================================================

/**
 * Mock backtest engine - Phase 1 placeholder
 * Returns mock results for UI demonstration
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
  const ctx = document.getElementById('equityChart').getContext('2d');
  
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
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: '#00d4aa',
          pointBorderColor: '#0a0e14',
          pointBorderWidth: 2
        },
        {
          label: 'Drawdown',
          data: [],
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
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
                return `${label}: ${value.toFixed(2)}%`;
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
              return value.toFixed(1) + '%';
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
}

function updateChart(data, chartType = 'equity') {
  if (!equityChart) return;
  
  currentChartType = chartType;
  const { equityCurve, metrics } = data;
  
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
    return { x: new Date(point.time.replace(' ', 'T')), y: -dd }; // Negative for inverted display
  });
  
  equityChart.data.datasets[0].data = equityData;
  equityChart.data.datasets[1].data = drawdownData;
  
  // Toggle visibility based on chart type
  equityChart.data.datasets[0].hidden = chartType === 'drawdown';
  equityChart.data.datasets[1].hidden = chartType !== 'drawdown';
  equityChart.options.scales.y1.display = chartType === 'drawdown';
  
  // Update colors for drawdown
  if (chartType === 'drawdown') {
    equityChart.data.datasets[1].borderColor = '#f87171';
    equityChart.data.datasets[1].backgroundColor = 'rgba(248, 113, 113, 0.15)';
  }
  
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
  
  // Initialize chart
  initializeChart();
  
  // Bind UI events
  bindEvents();
  
  // Update UI with defaults
  updateMetricsDisplay(null);
  updateTradeLog([]);
  
  showToast('AlphaForge initialized. Mock data generated (100 bars).', 'info');
}

function bindEvents() {
  // Form submission
  document.getElementById('configForm').addEventListener('submit', handleBacktestRun);
  
  // Asset change -> regenerate mock data
  document.getElementById('assetSelect').addEventListener('change', (e) => {
    currentConfig.asset = e.target.value;
    mockData = generateMockOHLCV({ count: 100, symbol: currentConfig.asset });
    showToast(`Mock data regenerated for ${currentConfig.asset}`, 'info');
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
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Run mock backtest
  backtestResults = runMockBacktest(currentConfig, mockData);
  
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
    tbody.innerHTML = '<tr class="hover:bg-neutral-900/50"><td colspan="7" class="py-8 text-center text-neutral-600">Run a backtest to see trade history</td></tr>';
    return;
  }
  
  tbody.innerHTML = trades.map((trade, i) => `
    <tr class="hover:bg-neutral-900/50 border-t border-neutral-800">
      <td class="py-3 px-2 font-mono text-neutral-500">${trade.id}</td>
      <td class="py-3 px-2 font-mono text-xs">${trade.time}</td>
      <td class="py-3 px-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trade.side === 'long' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}">
          ${trade.side === 'long' ? '↑ Long' : '↓ Short'}
        </span>
      </td>
      <td class="py-3 px-2 font-mono text-sm">${trade.entry.toFixed(trade.entry > 100 ? 2 : 5)}</td>
      <td class="py-3 px-2 font-mono text-sm">${trade.exit.toFixed(trade.exit > 100 ? 2 : 5)}</td>
      <td class="py-3 px-2 font-mono text-sm ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}">
        ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
      </td>
      <td class="py-3 px-2 font-mono text-sm ${trade.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}">
        ${trade.returnPct >= 0 ? '+' : ''}${trade.returnPct.toFixed(2)}%
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
  init
};