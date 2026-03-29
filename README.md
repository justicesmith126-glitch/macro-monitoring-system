# Macro Economic Monitoring System

Automated macro monitoring system with regime detection, zombie company screener, and portfolio allocation guidance. Based on *"The Price of Time"* by Edward Chancellor.

## Overview

This system tracks key macroeconomic indicators to answer three critical questions:

1. **What regime are we in?** (Goldilocks, Inflation Rising, Stagflation, Slowdown, Deflationary Bust)
2. **Should I extend or reduce duration?** (Based on real interest rates)
3. **Are zombie companies in trouble?** (Credit stress and default risk)

## Files

| File | Description |
|------|-------------|
| `macro_data_updater.py` | **Main script** - Fetches FRED API data and updates the Excel workbook |
| `Macro_Monitoring_Workbook.xlsx` | Excel workbook with formulas, regime detection, and tracking |
| `macro_dashboard.html` | Interactive HTML dashboard (works offline in any browser) |
| `create_excel.py` | Script to regenerate/customize the Excel workbook |
| `config.env` | Configuration file (add your FRED API key here) |
| `requirements.txt` | Python package dependencies |
| `run_updater.bat` | Windows double-click launcher |
| `update_log.txt` | Log file for all update activity |
| `HOW_TO_USE_API_UPDATER.txt` | Detailed guide for the Python updater |
| `QUICK_REFERENCE.txt` | Printable reference card with all thresholds |

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Get a FRED API key (free)

Register at: https://fred.stlouisfed.org/docs/api/api_key.html

### 3. Configure

Edit `config.env` and replace `your_fred_api_key_here` with your actual API key:

```
FRED_API_KEY=abcdef1234567890abcdef1234567890
```

### 4. Run

```bash
# Full update
python macro_data_updater.py

# Preview without writing
python macro_data_updater.py --dry-run

# Update specific series only
python macro_data_updater.py --series DGS10 DGS2 VIXCLS

# Also update the HTML dashboard
python macro_data_updater.py --dashboard
```

On Windows, double-click `run_updater.bat`.

## What Gets Updated

The updater fetches 19 FRED series and writes to the Dashboard sheet:

| Cell | Indicator | FRED Series | Transform |
|------|-----------|-------------|-----------|
| B6 | Fed Funds Rate | DFF | Direct |
| B7 | 10-Year Treasury | DGS10 | Direct |
| B8 | 2-Year Treasury | DGS2 | Direct |
| B10 | 10-Year TIPS | DFII10 | Direct |
| B11 | Breakeven Inflation | T10YIE | Direct |
| B18 | CPI YoY | CPIAUCSL | YoY % change |
| B19 | Core PCE YoY | PCEPILFE | YoY % change |
| B21 | 5Y5Y Forward | T5YIFR | Direct |
| B24 | HY Spread | BAMLH0A0HYM2 | To basis points |
| B25 | IG Spread | BAMLC0A0CM | To basis points |
| B27 | AA Spread | BAMLC0A3CA | To basis points |
| B28 | TED Spread | TEDRATE | To basis points |
| B31 | Unemployment | UNRATE | Direct |
| B32 | Nonfarm Payrolls | PAYEMS | MoM change |
| B33 | Initial Claims | ICSA | /1000 |
| B34 | JOLTS Openings | JTSJOL | /1000 |
| B37 | GDP Growth | GDP | QoQ annualized |
| B43 | S&P 500 | SP500 | Direct |
| B45 | VIX | VIXCLS | Direct |

Auto-calculated cells (B9, B13-B15, B26, rows 48-53) are not overwritten.

## Regime Detection

The system scores inflation (0-4) and growth (0-4) to detect the current regime:

| Regime | Inflation | Growth | Action |
|--------|-----------|--------|--------|
| Goldilocks | Low (0-1) | Strong (3-4) | Risk-on: equities, credit |
| Inflationary Boom | High (2+) | Strong (3+) | Equities + commodities |
| Stagflation | High (3+) | Weak (0-1) | Defensive: TIPS, gold, shorts |
| Slowdown | Low | Weak (0-1) | Duration + quality |
| Deflationary Bust | Very Low | Very Weak | Max duration bonds |

## Excel Workbook Sheets

1. **Dashboard** - Main data entry and regime detection (rows 47-53)
2. **Historical Tracking** - Time series of all metrics
3. **Zombie Screener** - Score companies 0-10 for short candidacy
4. **Portfolio Allocations** - Recommended splits by regime with ETF suggestions
5. **Data Sources** - All FRED codes, URLs, and update schedules
6. **Instructions** - How to use the workbook

## Features

- **API rate limiting**: 0.6s delay between requests (FRED allows 120/min)
- **Retry logic**: 3 retries with exponential backoff on failures
- **Caching**: 1-hour TTL cache prevents redundant API calls
- **Previous value tracking**: Current values auto-shift to "Previous" column
- **Regime detection**: Formula-driven in Excel, JavaScript-driven in HTML
- **Zombie scoring**: 0-10 score based on coverage, leverage, FCF, maturity wall
- **Conditional formatting**: Color-coded status for every metric

## Scheduling

**Windows Task Scheduler**: Weekly on Monday 9 AM, run `python macro_data_updater.py`

**Linux/Mac cron**:
```
0 9 * * 1 cd /path/to/macro-monitoring-system && python3 macro_data_updater.py >> cron_log.txt 2>&1
```

## Documentation

- `HOW_TO_USE_API_UPDATER.txt` - Full guide for the Python updater
- `QUICK_REFERENCE.txt` - Printable card with all thresholds and rules
- Excel "Instructions" sheet - Workbook-specific help

---

Created February 2026 | Based on *"The Price of Time"* by Edward Chancellor
