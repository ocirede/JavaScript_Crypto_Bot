# JavaScript Crypto Bot

<p>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="50" />
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="50" />

</p>
## 🚀 Overview
This is an automated **JavaScript Crypto Trading Bot** designed to analyze market trends, execute trades, and optimize profit strategies. The bot integrates various indicators such as **MACD, EMA, Bollinger Bands, VWAP, ATR, and ADX** to enhance decision-making.

## ✨ Features
- 📈 **Real-time market analysis** using ccxt
- 🔄 **Supports multiple timeframes** with custom strategies
- 📊 **Technical indicators:** MACD, EMA, Bollinger Bands, VWAP, ATR, ADX
- 🔍 **Trend analysis** using best-fit lines and support/resistance levels
- 📡 **Machine learning-based pattern detection** for reversals (WIP)
- ✅ **Custom risk management rules**
- 📂 **Saves historical OHLCV data** for analysis

## 📦 Installation

### Prerequisites
Make sure you have **Node.js** installed on your system.

1. Clone the repository:
   ```sh
   git clone https://github.com/ocirede/JavaScript_Crypto_Bot.git
   cd JavaScript_Crypto_Bot
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables (create a `.env` file):
   ```env
   BINGX_API_KEY=your_api_key
   BINGX_SECRET_KEY=your_secret_key
   ```
   ⚠️ **Do NOT share your API keys!**

## 🚀 Usage
Start the bot with:
```sh
node bot.js
```

### Available Scripts
- `npm start` - Starts the bot
- `npm run backtest` - Runs backtesting on historical data
- `npm run analyze` - Generates trading analysis

## ⚙️ Configuration
Modify **config.json** to customize trading strategies, indicators, and risk management settings.
```json
{
  "timeframe": "1h",
  "strategy": "macd_vwap",
  "indicators": {
    "ema_period": 55,
    "bollinger_bands": 14
  },
  "risk_management": {
    "max_drawdown": 5,
    "stop_loss": 2
  }
}
```

## 📊 Supported Indicators
- **MACD** (Moving Average Convergence Divergence)
- **EMA** (Exponential Moving Average)
- **VWAP** (Volume-Weighted Average Price)
- **Bollinger Bands**
- **ATR** (Average True Range)
- **ADX** (Average Directional Index)

## 🔥 Upcoming Features
- 📡 **Integration with TradingView for alerts**
- 🤖 **Machine learning-based pattern recognition**
- 📉 **Multiple exchange support (Coinbase, Kraken, etc.)**
- 🐍 **Planned Python translation for improved performance and flexibility**

## 📜 License
This project is **private**. If you'd like to contribute or use the bot, please contact me.

---
👨‍💻 Developed by **Federico Diaferia** 

