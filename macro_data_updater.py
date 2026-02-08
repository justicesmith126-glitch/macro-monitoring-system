#!/usr/bin/env python3
"""
Macro Data Updater - Automated FRED API Data Fetcher & Excel Updater
====================================================================
Fetches macroeconomic data from the FRED API and updates the
Macro_Monitoring_Workbook.xlsx automatically.

Based on "The Price of Time" by Edward Chancellor.

Usage:
    python macro_data_updater.py                  # Full update
    python macro_data_updater.py --dry-run        # Preview without writing
    python macro_data_updater.py --series DGS10   # Update single series
    python macro_data_updater.py --dashboard      # Also update HTML dashboard
"""

import os
import sys
import json
import time
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not found. Install with: pip install requests")
    sys.exit(1)

try:
    import openpyxl
except ImportError:
    print("ERROR: 'openpyxl' library not found. Install with: pip install openpyxl")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════

SCRIPT_DIR = Path(__file__).parent.resolve()
CONFIG_FILE = SCRIPT_DIR / "config.env"
WORKBOOK_FILE = SCRIPT_DIR / "Macro_Monitoring_Workbook.xlsx"
LOG_FILE = SCRIPT_DIR / "update_log.txt"
DASHBOARD_FILE = SCRIPT_DIR / "macro_dashboard.html"
CACHE_FILE = SCRIPT_DIR / ".fred_cache.json"

FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

# Rate limiting: FRED allows 120 requests per minute
RATE_LIMIT_DELAY = 0.6  # seconds between requests (safe margin)
MAX_RETRIES = 3
RETRY_BACKOFF = 2  # exponential backoff multiplier

# ── FRED Series → Excel Cell Mapping ──────────────────────────────
# Maps FRED series IDs to their Dashboard sheet cell locations.
# Format: "FRED_CODE": {"cell": "B<row>", "name": "<display name>", "transform": <func or None>}

SERIES_MAPPING = {
    # Interest Rates & Yields
    "DFF": {
        "cell": "B6",
        "name": "Fed Funds Rate (Daily)",
        "transform": None,
    },
    "FEDFUNDS": {
        "cell": "B6",
        "name": "Fed Funds Rate (Monthly)",
        "transform": None,
        "fallback_for": "DFF",
    },
    "DGS10": {
        "cell": "B7",
        "name": "10-Year Treasury Yield",
        "transform": None,
    },
    "DGS2": {
        "cell": "B8",
        "name": "2-Year Treasury Yield",
        "transform": None,
    },
    # Row 9 (Yield Curve) is auto-calculated: =((B7-B8)*100)
    "DFII10": {
        "cell": "B10",
        "name": "10-Year TIPS Yield",
        "transform": None,
    },
    "T10YIE": {
        "cell": "B11",
        "name": "10-Year Breakeven Inflation",
        "transform": None,
    },
    # Real rates (rows 13-15) are auto-calculated

    # Inflation Metrics
    "CPIAUCSL": {
        "cell": "B18",
        "name": "CPI Year-over-Year",
        "transform": "yoy_pct_change",
    },
    "PCEPILFE": {
        "cell": "B19",
        "name": "Core PCE Year-over-Year",
        "transform": "yoy_pct_change",
    },
    "CPIAUCSL_MOM": {
        "cell": "B20",
        "name": "CPI Month-over-Month",
        "source_series": "CPIAUCSL",
        "transform": "mom_pct_change",
    },
    "T5YIFR": {
        "cell": "B21",
        "name": "5Y5Y Forward Inflation",
        "transform": None,
    },

    # Credit Conditions & Spreads
    "BAMLH0A0HYM2": {
        "cell": "B24",
        "name": "HY OAS Spread",
        "transform": "basis_points",
    },
    "BAMLC0A0CM": {
        "cell": "B25",
        "name": "IG OAS Spread",
        "transform": "basis_points",
    },
    # Row 26 (BBB-AA) is auto-calculated
    "BAMLC0A3CA": {
        "cell": "B27",
        "name": "AA OAS Spread",
        "transform": "basis_points",
    },
    "TEDRATE": {
        "cell": "B28",
        "name": "TED Spread",
        "transform": "basis_points",
    },

    # Labor Market
    "UNRATE": {
        "cell": "B31",
        "name": "Unemployment Rate",
        "transform": None,
    },
    "PAYEMS": {
        "cell": "B32",
        "name": "Nonfarm Payrolls (change, k)",
        "transform": "mom_change_thousands",
    },
    "ICSA": {
        "cell": "B33",
        "name": "Initial Jobless Claims (k)",
        "transform": "divide_1000",
    },
    "JTSJOL": {
        "cell": "B34",
        "name": "JOLTS Job Openings (M)",
        "transform": "divide_1000",
    },

    # Growth & Activity
    "GDP": {
        "cell": "B37",
        "name": "GDP Growth QoQ Annualized",
        "transform": "gdp_qoq_annualized",
    },
    # ISM PMI not directly on FRED; placeholders for manual entry
    # VIX and S&P 500
    "VIXCLS": {
        "cell": "B45",
        "name": "VIX",
        "transform": None,
    },
    "SP500": {
        "cell": "B43",
        "name": "S&P 500",
        "transform": None,
    },
}

# Series that are fetched from FRED (excludes computed/derived entries)
FETCH_SERIES = [
    "DFF", "DGS10", "DGS2", "DFII10", "T10YIE", "T5YIFR",
    "CPIAUCSL", "PCEPILFE",
    "BAMLH0A0HYM2", "BAMLC0A0CM", "BAMLC0A3CA", "TEDRATE",
    "UNRATE", "PAYEMS", "ICSA", "JTSJOL",
    "GDP",
    "VIXCLS", "SP500",
]


# ══════════════════════════════════════════════════════════════════════
# LOGGING SETUP
# ══════════════════════════════════════════════════════════════════════

def setup_logging():
    """Configure logging to both file and console."""
    logger = logging.getLogger("MacroUpdater")
    logger.setLevel(logging.DEBUG)

    # File handler
    fh = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    ))

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter("%(levelname)-8s | %(message)s"))

    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger


log = setup_logging()


# ══════════════════════════════════════════════════════════════════════
# CONFIG LOADING
# ══════════════════════════════════════════════════════════════════════

def load_config():
    """Load configuration from config.env file."""
    config = {}
    if not CONFIG_FILE.exists():
        log.error(f"Config file not found: {CONFIG_FILE}")
        log.error("Copy config.env.template to config.env and add your FRED API key.")
        log.error("Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html")
        sys.exit(1)

    with open(CONFIG_FILE, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                config[key.strip()] = value.strip().strip('"').strip("'")

    if not config.get("FRED_API_KEY") or config["FRED_API_KEY"] == "your_fred_api_key_here":
        log.error("FRED_API_KEY not set in config.env")
        log.error("Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html")
        sys.exit(1)

    return config


# ══════════════════════════════════════════════════════════════════════
# FRED API CLIENT
# ══════════════════════════════════════════════════════════════════════

class FREDClient:
    """FRED API client with rate limiting, caching, and retry logic."""

    def __init__(self, api_key, cache_ttl_hours=1):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "MacroMonitor/1.0"})
        self.last_request_time = 0
        self.request_count = 0
        self.cache_ttl = timedelta(hours=cache_ttl_hours)
        self.cache = self._load_cache()

    def _load_cache(self):
        """Load cached API responses from disk."""
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r") as f:
                    cache = json.load(f)
                # Prune expired entries
                now = datetime.now().isoformat()
                return {k: v for k, v in cache.items()
                        if v.get("expires", "") > now}
            except (json.JSONDecodeError, KeyError):
                return {}
        return {}

    def _save_cache(self):
        """Persist cache to disk."""
        try:
            with open(CACHE_FILE, "w") as f:
                json.dump(self.cache, f, indent=2)
        except OSError as e:
            log.warning(f"Could not save cache: {e}")

    def _rate_limit(self):
        """Enforce rate limiting between API calls."""
        elapsed = time.time() - self.last_request_time
        if elapsed < RATE_LIMIT_DELAY:
            sleep_time = RATE_LIMIT_DELAY - elapsed
            time.sleep(sleep_time)
        self.last_request_time = time.time()
        self.request_count += 1

    def fetch_series(self, series_id, observation_start=None, limit=15):
        """
        Fetch the latest observations for a FRED series.

        Args:
            series_id: FRED series ID (e.g., "DGS10")
            observation_start: Start date string (YYYY-MM-DD)
            limit: Max number of observations to return

        Returns:
            List of {"date": str, "value": str} dicts, newest first.
            Returns empty list on failure.
        """
        # Check cache first
        cache_key = f"{series_id}:{limit}"
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if cached.get("expires", "") > datetime.now().isoformat():
                log.debug(f"Cache hit for {series_id}")
                return cached["data"]

        if observation_start is None:
            observation_start = (datetime.now() - timedelta(days=400)).strftime("%Y-%m-%d")

        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": limit,
            "observation_start": observation_start,
        }

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                self._rate_limit()
                log.debug(f"Fetching {series_id} (attempt {attempt}/{MAX_RETRIES})")

                response = self.session.get(FRED_BASE_URL, params=params, timeout=30)

                if response.status_code == 429:
                    # Rate limited - back off aggressively
                    wait_time = RETRY_BACKOFF ** attempt * 5
                    log.warning(f"Rate limited on {series_id}. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                if response.status_code == 400:
                    error_msg = response.json().get("error_message", "Bad request")
                    log.error(f"Bad request for {series_id}: {error_msg}")
                    return []

                response.raise_for_status()
                data = response.json()

                observations = data.get("observations", [])
                # Filter out missing values
                valid_obs = [
                    obs for obs in observations
                    if obs.get("value") not in (".", "", None)
                ]

                if not valid_obs:
                    log.warning(f"No valid observations for {series_id}")
                    return []

                # Cache the result
                self.cache[cache_key] = {
                    "data": valid_obs,
                    "expires": (datetime.now() + self.cache_ttl).isoformat(),
                    "fetched": datetime.now().isoformat(),
                }
                self._save_cache()

                log.debug(f"Got {len(valid_obs)} observations for {series_id}")
                return valid_obs

            except requests.exceptions.Timeout:
                log.warning(f"Timeout fetching {series_id} (attempt {attempt})")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF ** attempt)

            except requests.exceptions.ConnectionError:
                log.warning(f"Connection error for {series_id} (attempt {attempt})")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF ** attempt)

            except requests.exceptions.RequestException as e:
                log.error(f"Request error for {series_id}: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF ** attempt)

        log.error(f"Failed to fetch {series_id} after {MAX_RETRIES} attempts")
        return []


# ══════════════════════════════════════════════════════════════════════
# DATA TRANSFORMS
# ══════════════════════════════════════════════════════════════════════

def get_latest_value(observations):
    """Extract the latest numeric value from observations."""
    if not observations:
        return None
    try:
        return float(observations[0]["value"])
    except (ValueError, IndexError, KeyError):
        return None


def compute_yoy_pct_change(observations):
    """Compute year-over-year percent change from a level series."""
    if len(observations) < 2:
        return None

    try:
        latest = float(observations[0]["value"])
        latest_date = datetime.strptime(observations[0]["date"], "%Y-%m-%d")

        # Find observation closest to 12 months ago
        target_date = latest_date - timedelta(days=365)
        best_match = None
        best_diff = timedelta(days=999)

        for obs in observations:
            obs_date = datetime.strptime(obs["date"], "%Y-%m-%d")
            diff = abs(obs_date - target_date)
            if diff < best_diff:
                best_diff = diff
                best_match = obs

        if best_match and best_diff < timedelta(days=45):
            year_ago = float(best_match["value"])
            if year_ago != 0:
                return ((latest - year_ago) / year_ago) * 100
    except (ValueError, KeyError):
        pass
    return None


def compute_mom_pct_change(observations):
    """Compute month-over-month percent change."""
    if len(observations) < 2:
        return None
    try:
        latest = float(observations[0]["value"])
        previous = float(observations[1]["value"])
        if previous != 0:
            return ((latest - previous) / previous) * 100
    except (ValueError, IndexError, KeyError):
        pass
    return None


def compute_mom_change_thousands(observations):
    """Compute month-over-month change in thousands (for payrolls)."""
    if len(observations) < 2:
        return None
    try:
        latest = float(observations[0]["value"])
        previous = float(observations[1]["value"])
        return latest - previous  # Already in thousands
    except (ValueError, IndexError, KeyError):
        pass
    return None


def compute_gdp_qoq_annualized(observations):
    """
    GDP from FRED (GDP series) is in billions of dollars.
    Compute QoQ annualized growth rate.
    """
    if len(observations) < 2:
        return None
    try:
        latest = float(observations[0]["value"])
        previous = float(observations[1]["value"])
        if previous != 0:
            qoq = (latest - previous) / previous
            annualized = ((1 + qoq) ** 4 - 1) * 100
            return round(annualized, 1)
    except (ValueError, IndexError, KeyError):
        pass
    return None


def divide_by_1000(observations):
    """Convert units (e.g., thousands to millions, or raw to thousands)."""
    val = get_latest_value(observations)
    if val is not None:
        return val / 1000
    return None


def to_basis_points(observations):
    """
    FRED credit spread series are typically in percentage points.
    Convert to basis points (* 100).
    """
    val = get_latest_value(observations)
    if val is not None:
        return val * 100
    return None


TRANSFORM_FUNCTIONS = {
    None: get_latest_value,
    "yoy_pct_change": compute_yoy_pct_change,
    "mom_pct_change": compute_mom_pct_change,
    "mom_change_thousands": compute_mom_change_thousands,
    "gdp_qoq_annualized": compute_gdp_qoq_annualized,
    "divide_1000": divide_by_1000,
    "basis_points": to_basis_points,
}


# ══════════════════════════════════════════════════════════════════════
# EXCEL UPDATER
# ══════════════════════════════════════════════════════════════════════

class ExcelUpdater:
    """Updates the Macro Monitoring Excel workbook with fetched data."""

    def __init__(self, workbook_path):
        self.workbook_path = Path(workbook_path)
        if not self.workbook_path.exists():
            raise FileNotFoundError(f"Workbook not found: {self.workbook_path}")
        self.wb = openpyxl.load_workbook(str(self.workbook_path))
        self.dashboard = self.wb["Dashboard"]
        self.updates = []

    def get_current_value(self, cell_ref):
        """Read the current value in a cell."""
        return self.dashboard[cell_ref].value

    def update_cell(self, cell_ref, value, series_name=""):
        """
        Update a cell in the Dashboard sheet.
        Moves the current value to the 'Previous' column (C) first.
        """
        if value is None:
            log.warning(f"Skipping {series_name} ({cell_ref}): no value available")
            return False

        # Round appropriately
        if isinstance(value, float):
            if abs(value) >= 100:
                value = round(value, 1)
            else:
                value = round(value, 2)

        # Get current value and move to Previous column
        row = cell_ref[1:]  # Extract row number
        current = self.dashboard[cell_ref].value

        # Only update Previous if current has a real value (not a formula)
        if current is not None and not str(current).startswith("="):
            prev_cell = f"C{row}"
            self.dashboard[prev_cell] = current
            log.debug(f"Moved {cell_ref} value {current} to {prev_cell}")

        self.dashboard[cell_ref] = value
        self.updates.append({
            "cell": cell_ref,
            "series": series_name,
            "old_value": current,
            "new_value": value,
        })
        log.info(f"Updated {cell_ref} ({series_name}): {current} -> {value}")
        return True

    def update_timestamp(self):
        """Set the 'Last Updated' cell to now."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        self.dashboard["B2"] = now
        log.info(f"Timestamp updated: {now}")

    def save(self):
        """Save the workbook."""
        try:
            self.wb.save(str(self.workbook_path))
            log.info(f"Workbook saved: {self.workbook_path}")
            return True
        except PermissionError:
            log.error(
                f"Cannot save {self.workbook_path} - file may be open in Excel. "
                "Close Excel and retry."
            )
            return False
        except OSError as e:
            log.error(f"Error saving workbook: {e}")
            return False

    def get_summary(self):
        """Return a summary of all updates made."""
        return self.updates


# ══════════════════════════════════════════════════════════════════════
# HTML DASHBOARD UPDATER
# ══════════════════════════════════════════════════════════════════════

def update_html_dashboard(data_dict):
    """
    Update the marketData object in the HTML dashboard file.
    This is optional and only runs if the HTML file exists and --dashboard is set.
    """
    if not DASHBOARD_FILE.exists():
        log.info("HTML dashboard not found, skipping HTML update.")
        return False

    try:
        content = DASHBOARD_FILE.read_text(encoding="utf-8")

        # Build replacement marketData object
        market_data = {
            "fedFundsRate": data_dict.get("DFF", data_dict.get("FEDFUNDS", "N/A")),
            "treasury10Y": data_dict.get("DGS10", "N/A"),
            "treasury2Y": data_dict.get("DGS2", "N/A"),
            "tips10Y": data_dict.get("DFII10", "N/A"),
            "breakeven10Y": data_dict.get("T10YIE", "N/A"),
            "cpiYoY": data_dict.get("CPIAUCSL", "N/A"),
            "corePCE": data_dict.get("PCEPILFE", "N/A"),
            "forward5Y5Y": data_dict.get("T5YIFR", "N/A"),
            "hySpread": data_dict.get("BAMLH0A0HYM2", "N/A"),
            "igSpread": data_dict.get("BAMLC0A0CM", "N/A"),
            "unemployment": data_dict.get("UNRATE", "N/A"),
            "nfp": data_dict.get("PAYEMS", "N/A"),
            "initialClaims": data_dict.get("ICSA", "N/A"),
            "gdpGrowth": data_dict.get("GDP", "N/A"),
            "vix": data_dict.get("VIXCLS", "N/A"),
            "sp500": data_dict.get("SP500", "N/A"),
            "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        }

        # Replace the marketData object in the HTML
        import re
        pattern = r"(const\s+marketData\s*=\s*)\{[^}]+\}"
        replacement = f"\\1{json.dumps(market_data, indent=8)}"
        new_content = re.sub(pattern, replacement, content, count=1)

        if new_content != content:
            DASHBOARD_FILE.write_text(new_content, encoding="utf-8")
            log.info("HTML dashboard updated successfully.")
            return True
        else:
            log.info("HTML dashboard: no marketData pattern found to update.")
            return False

    except Exception as e:
        log.error(f"Error updating HTML dashboard: {e}")
        return False


# ══════════════════════════════════════════════════════════════════════
# LOG REPORT
# ══════════════════════════════════════════════════════════════════════

def write_log_report(updates, errors, elapsed):
    """Append a human-readable summary to the log file."""
    separator = "=" * 72
    report_lines = [
        "",
        separator,
        f"  UPDATE REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        separator,
        f"  Duration: {elapsed:.1f} seconds",
        f"  Successful updates: {len(updates)}",
        f"  Errors/skipped: {errors}",
        separator,
    ]

    if updates:
        report_lines.append("  UPDATED VALUES:")
        report_lines.append(f"  {'Cell':<8} {'Series':<20} {'Old':>12} {'New':>12}")
        report_lines.append("  " + "-" * 56)
        for u in updates:
            old = u['old_value'] if u['old_value'] is not None else "N/A"
            report_lines.append(
                f"  {u['cell']:<8} {u['series']:<20} {str(old):>12} {str(u['new_value']):>12}"
            )

    report_lines.append(separator)
    report_lines.append("")

    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write("\n".join(report_lines) + "\n")
    except OSError as e:
        log.warning(f"Could not write log report: {e}")


# ══════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ══════════════════════════════════════════════════════════════════════

def parse_args():
    parser = argparse.ArgumentParser(
        description="Macro Data Updater - Fetch FRED data and update Excel workbook"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Fetch data and show what would be updated, without writing to Excel"
    )
    parser.add_argument(
        "--series", nargs="+",
        help="Only update specific FRED series (e.g., --series DGS10 DGS2)"
    )
    parser.add_argument(
        "--dashboard", action="store_true",
        help="Also update the HTML dashboard file with fetched data"
    )
    parser.add_argument(
        "--no-cache", action="store_true",
        help="Bypass cache and fetch fresh data from FRED"
    )
    parser.add_argument(
        "--workbook", type=str, default=None,
        help="Path to Excel workbook (default: Macro_Monitoring_Workbook.xlsx)"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Enable verbose/debug output"
    )
    return parser.parse_args()


def main():
    start_time = time.time()
    args = parse_args()

    if args.verbose:
        logging.getLogger("MacroUpdater").setLevel(logging.DEBUG)
        for handler in logging.getLogger("MacroUpdater").handlers:
            if isinstance(handler, logging.StreamHandler) and handler.stream == sys.stdout:
                handler.setLevel(logging.DEBUG)

    log.info("=" * 60)
    log.info("MACRO DATA UPDATER - Starting")
    log.info("=" * 60)

    # Load configuration
    config = load_config()
    api_key = config["FRED_API_KEY"]
    cache_ttl = float(config.get("CACHE_TTL_HOURS", "1"))

    # Initialize FRED client
    client = FREDClient(api_key, cache_ttl_hours=cache_ttl)

    if args.no_cache:
        client.cache = {}
        log.info("Cache bypassed - fetching fresh data")

    # Determine which series to fetch
    if args.series:
        series_to_fetch = [s.upper() for s in args.series if s.upper() in FETCH_SERIES]
        if not series_to_fetch:
            log.error(f"None of the specified series are valid: {args.series}")
            log.error(f"Valid series: {', '.join(FETCH_SERIES)}")
            sys.exit(1)
    else:
        series_to_fetch = FETCH_SERIES

    log.info(f"Fetching {len(series_to_fetch)} series from FRED...")

    # ── Fetch all data ─────────────────────────────────────────────
    raw_data = {}  # series_id -> observations list
    fetch_errors = 0

    for series_id in series_to_fetch:
        observations = client.fetch_series(series_id)
        if observations:
            raw_data[series_id] = observations
            log.info(
                f"  OK  {series_id:<16} latest: {observations[0]['value']:<12} "
                f"date: {observations[0]['date']}"
            )
        else:
            fetch_errors += 1
            log.warning(f"  FAIL {series_id:<16} no data returned")

    log.info(f"Fetched {len(raw_data)}/{len(series_to_fetch)} series successfully")

    if not raw_data:
        log.error("No data fetched. Check your API key and network connection.")
        sys.exit(1)

    # ── Transform data ─────────────────────────────────────────────
    transformed = {}  # series_key -> transformed value
    for series_key, mapping in SERIES_MAPPING.items():
        # Skip fallback entries unless primary failed
        if "fallback_for" in mapping:
            primary = mapping["fallback_for"]
            if primary in raw_data:
                continue

        # Determine source data
        source_series = mapping.get("source_series", series_key)
        if source_series not in raw_data:
            continue

        observations = raw_data[source_series]
        transform_name = mapping.get("transform")
        transform_fn = TRANSFORM_FUNCTIONS.get(transform_name, get_latest_value)

        value = transform_fn(observations)
        if value is not None:
            transformed[series_key] = value
            log.debug(f"Transformed {series_key}: {value} (via {transform_name})")

    log.info(f"Transformed {len(transformed)} values")

    # ── Dry run mode ───────────────────────────────────────────────
    if args.dry_run:
        log.info("")
        log.info("DRY RUN - No changes written to Excel")
        log.info("-" * 50)
        log.info(f"{'Series':<18} {'Cell':<8} {'Value':>12}")
        log.info("-" * 50)
        for series_key, value in sorted(transformed.items()):
            mapping = SERIES_MAPPING[series_key]
            log.info(f"{series_key:<18} {mapping['cell']:<8} {value:>12.2f}")
        log.info("-" * 50)
        elapsed = time.time() - start_time
        log.info(f"Completed in {elapsed:.1f}s")
        return

    # ── Update Excel workbook ──────────────────────────────────────
    workbook_path = args.workbook or str(WORKBOOK_FILE)
    try:
        excel = ExcelUpdater(workbook_path)
    except FileNotFoundError:
        log.error(f"Workbook not found: {workbook_path}")
        log.error("Run create_excel.py first to generate the workbook.")
        sys.exit(1)

    update_errors = 0
    for series_key, value in transformed.items():
        mapping = SERIES_MAPPING[series_key]
        cell = mapping["cell"]
        name = mapping["name"]
        if not excel.update_cell(cell, value, series_name=name):
            update_errors += 1

    excel.update_timestamp()

    if excel.save():
        log.info("Excel workbook updated successfully!")
    else:
        log.error("Failed to save workbook. Changes were not persisted.")
        sys.exit(1)

    # ── Optionally update HTML dashboard ───────────────────────────
    if args.dashboard:
        update_html_dashboard(transformed)

    # ── Summary report ─────────────────────────────────────────────
    elapsed = time.time() - start_time
    updates = excel.get_summary()
    total_errors = fetch_errors + update_errors

    write_log_report(updates, total_errors, elapsed)

    log.info("")
    log.info("=" * 60)
    log.info(f"COMPLETE: {len(updates)} cells updated, {total_errors} errors")
    log.info(f"Duration: {elapsed:.1f} seconds")
    log.info(f"API calls: {client.request_count}")
    log.info("=" * 60)

    if total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
