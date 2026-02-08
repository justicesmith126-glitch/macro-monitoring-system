#!/usr/bin/env python3
"""
Macro Monitoring Workbook Generator
Creates the Macro_Monitoring_Workbook.xlsx with all sheets, formulas, and formatting.
Based on "The Price of Time" by Edward Chancellor.
"""

import openpyxl
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from datetime import datetime


def create_workbook():
    wb = openpyxl.Workbook()

    # ── Style Definitions ──────────────────────────────────────────────
    header_font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
    section_font = Font(name="Calibri", size=11, bold=True, color="2F5496")
    section_fill = PatternFill(start_color="D6E4F0", end_color="D6E4F0", fill_type="solid")
    input_fill = PatternFill(start_color="FFFFCC", end_color="FFFFCC", fill_type="solid")  # Yellow
    calc_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")  # Green
    warning_fill = PatternFill(start_color="FCE4EC", end_color="FCE4EC", fill_type="solid")  # Light red
    normal_font = Font(name="Calibri", size=10)
    bold_font = Font(name="Calibri", size=10, bold=True)
    title_font = Font(name="Calibri", size=14, bold=True, color="2F5496")
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    def style_header_row(ws, row, max_col=5):
        for col in range(1, max_col + 1):
            cell = ws.cell(row=row, column=col)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

    def style_section_row(ws, row, max_col=5):
        for col in range(1, max_col + 1):
            cell = ws.cell(row=row, column=col)
            cell.font = section_font
            cell.fill = section_fill
            cell.border = thin_border

    def style_input_cell(ws, row, col):
        cell = ws.cell(row=row, column=col)
        cell.fill = input_fill
        cell.border = thin_border
        cell.font = normal_font
        return cell

    def style_calc_cell(ws, row, col):
        cell = ws.cell(row=row, column=col)
        cell.fill = calc_fill
        cell.border = thin_border
        cell.font = normal_font
        return cell

    def style_cell(ws, row, col):
        cell = ws.cell(row=row, column=col)
        cell.border = thin_border
        cell.font = normal_font
        return cell

    # ══════════════════════════════════════════════════════════════════
    # SHEET 1: DASHBOARD
    # ══════════════════════════════════════════════════════════════════
    ws = wb.active
    ws.title = "Dashboard"
    ws.sheet_properties.tabColor = "2F5496"

    # Column widths
    ws.column_dimensions["A"].width = 35
    ws.column_dimensions["B"].width = 18
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 22
    ws.column_dimensions["E"].width = 30

    # Title
    ws.merge_cells("A1:E1")
    title_cell = ws["A1"]
    title_cell.value = "MACRO ECONOMIC MONITORING DASHBOARD"
    title_cell.font = title_font
    title_cell.alignment = Alignment(horizontal="center")

    # Last Updated
    ws["A2"] = "Last Updated:"
    ws["A2"].font = bold_font
    c = style_input_cell(ws, 2, 2)
    c.value = datetime.now().strftime("%Y-%m-%d")

    # Section headers for row 4
    row = 4
    headers = ["Indicator", "Current Value", "Previous Value", "Signal / Threshold", "Status"]
    for col_idx, h in enumerate(headers, 1):
        ws.cell(row=row, column=col_idx, value=h)
    style_header_row(ws, row)

    # ── Interest Rates Section ─────────────────────────────────────
    row = 5
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="INTEREST RATES & YIELDS")
    style_section_row(ws, row)

    # Data rows: (label, row, FRED code hint, threshold description)
    rate_metrics = [
        ("Fed Funds Rate (%)", 6, "FEDFUNDS", 'IF(B6>5,"Restrictive",IF(B6>2.5,"Neutral","Accommodative"))'),
        ("10-Year Treasury Yield (%)", 7, "DGS10", 'IF(B7>4.5,"High",IF(B7>3,"Normal","Low"))'),
        ("2-Year Treasury Yield (%)", 8, "DGS2", 'IF(B8>4.5,"High",IF(B8>3,"Normal","Low"))'),
        ("Yield Curve 10Y-2Y (bp)", 9, "=((B7-B8)*100)", 'IF(B9<0,"INVERTED - Recession Signal",IF(B9<50,"Flat","Normal"))'),
        ("10-Year TIPS Yield (%)", 10, "DFII10", 'IF(B10>2,"Tight",IF(B10>0,"Moderate","Loose"))'),
        ("10-Year Breakeven Inflation (%)", 11, "T10YIE", 'IF(B11>3,"High Inflation Expected",IF(B11>2,"Normal","Low Inflation Expected"))'),
    ]

    for label, r, code, threshold_formula in rate_metrics:
        style_cell(ws, r, 1).value = label
        style_input_cell(ws, r, 2)  # Current value (user input)
        style_input_cell(ws, r, 3)  # Previous value (user input)
        if code.startswith("="):
            # Calculated field
            ws.cell(row=r, column=2).value = None
            ws.cell(row=r, column=2).fill = calc_fill
            # We'll put a note that this is auto-calculated
            style_cell(ws, r, 4).value = threshold_formula.split(",")[0].replace("IF(B9<0,", "< 0 = Inverted")
        else:
            style_cell(ws, r, 4).value = code
        # Status formula
        style_calc_cell(ws, r, 5).value = f"={threshold_formula}"

    # Auto-calculate yield curve
    ws.cell(row=9, column=2).value = "=((B7-B8)*100)"
    ws.cell(row=9, column=2).fill = calc_fill

    # ── Real Rates Section ─────────────────────────────────────────
    row = 12
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="REAL INTEREST RATES (Key Driver)")
    style_section_row(ws, row)

    real_rate_metrics = [
        ("Real Fed Funds Rate (%)", 13, "=(B6-B18)", 'IF(B13>2,"Very Tight",IF(B13>0,"Tight",IF(B13>-1,"Neutral","Loose")))'),
        ("Real 10Y Rate (TIPS) (%)", 14, "=B10", 'IF(B14>2,"Very Tight",IF(B14>0.5,"Tight",IF(B14>-0.5,"Neutral","Loose")))'),
        ("Real 10Y Rate (Fisher) (%)", 15, "=(B7-B18)", 'IF(B15>2,"Very Tight",IF(B15>0.5,"Tight",IF(B15>-0.5,"Neutral","Loose")))'),
    ]

    for label, r, formula, threshold_formula in real_rate_metrics:
        style_cell(ws, r, 1).value = label
        c = style_calc_cell(ws, r, 2)
        c.value = formula
        style_input_cell(ws, r, 3)
        style_cell(ws, r, 4).value = "Auto-calculated"
        style_calc_cell(ws, r, 5).value = f"={threshold_formula}"

    # ── Inflation Section ──────────────────────────────────────────
    row = 17
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="INFLATION METRICS")
    style_section_row(ws, row)

    inflation_metrics = [
        ("CPI Year-over-Year (%)", 18, "CPIAUCSL", 'IF(B18>5,"Very High",IF(B18>3,"Elevated",IF(B18>2,"Normal","Low")))'),
        ("Core PCE Year-over-Year (%)", 19, "PCEPILFE", 'IF(B19>4,"Very High",IF(B19>2.5,"Above Target",IF(B19>1.5,"At Target","Below Target")))'),
        ("CPI Month-over-Month (%)", 20, "CPIAUCSL_MOM", 'IF(B20>0.4,"Hot",IF(B20>0.2,"Warm","Cool"))'),
        ("5Y5Y Forward Inflation (%)", 21, "T5YIFR", 'IF(B21>3,"Unanchored High",IF(B21>2,"Anchored","Unanchored Low"))'),
    ]

    for label, r, code, threshold_formula in inflation_metrics:
        style_cell(ws, r, 1).value = label
        style_input_cell(ws, r, 2)
        style_input_cell(ws, r, 3)
        style_cell(ws, r, 4).value = code
        style_calc_cell(ws, r, 5).value = f"={threshold_formula}"

    # ── Credit Conditions Section ──────────────────────────────────
    row = 23
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="CREDIT CONDITIONS & SPREADS")
    style_section_row(ws, row)

    credit_metrics = [
        ("HY OAS Spread (bp)", 24, "BAMLH0A0HYM2", 'IF(B24>600,"Stress",IF(B24>400,"Elevated",IF(B24>300,"Normal","Tight")))'),
        ("IG OAS Spread (bp)", 25, "BAMLC0A0CM", 'IF(B25>200,"Stress",IF(B25>130,"Elevated",IF(B25>80,"Normal","Tight")))'),
        ("BBB-AA Spread (bp)", 26, "=(B25-B27)", 'IF(B26>100,"Quality Flight",IF(B26>60,"Elevated","Normal"))'),
        ("AA OAS Spread (bp)", 27, "BAMLC0A3CA", 'IF(B27>100,"Stress",IF(B27>60,"Elevated","Normal"))'),
        ("TED Spread (bp)", 28, "TEDRATE", 'IF(B28>100,"Banking Stress",IF(B28>50,"Elevated","Normal"))'),
    ]

    for label, r, code, threshold_formula in credit_metrics:
        style_cell(ws, r, 1).value = label
        if code.startswith("="):
            c = style_calc_cell(ws, r, 2)
            c.value = code
        else:
            style_input_cell(ws, r, 2)
        style_input_cell(ws, r, 3)
        style_cell(ws, r, 4).value = code if not code.startswith("=") else "Auto-calculated"
        style_calc_cell(ws, r, 5).value = f"={threshold_formula}"

    # ── Labor Market Section ───────────────────────────────────────
    row = 30
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="LABOR MARKET")
    style_section_row(ws, row)

    labor_metrics = [
        ("Unemployment Rate (%)", 31, "UNRATE", 'IF(B31>6,"Recession",IF(B31>5,"Weakening",IF(B31>3.5,"Normal","Tight")))'),
        ("Nonfarm Payrolls (k)", 32, "PAYEMS", 'IF(B32<0,"Contraction",IF(B32<100,"Slowing",IF(B32<250,"Normal","Strong")))'),
        ("Initial Claims (k)", 33, "ICSA", 'IF(B33>300,"Recession Risk",IF(B33>250,"Elevated","Normal"))'),
        ("JOLTS Openings (M)", 34, "JTSJOL", 'IF(B34<7,"Weak",IF(B34<9,"Normal","Very Tight"))'),
    ]

    for label, r, code, threshold_formula in labor_metrics:
        style_cell(ws, r, 1).value = label
        style_input_cell(ws, r, 2)
        style_input_cell(ws, r, 3)
        style_cell(ws, r, 4).value = code
        style_calc_cell(ws, r, 5).value = f"={threshold_formula}"

    # ── Growth & Activity Section ──────────────────────────────────
    row = 36
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="GROWTH & ACTIVITY")
    style_section_row(ws, row)

    growth_metrics = [
        ("GDP Growth QoQ Annualized (%)", 37, "GDP", 'IF(B37<0,"Contraction",IF(B37<1,"Stall Speed",IF(B37<3,"Normal","Strong")))'),
        ("ISM Manufacturing PMI", 38, "MANEMP", 'IF(B38<45,"Deep Contraction",IF(B38<50,"Contraction",IF(B38<55,"Expansion","Strong Expansion")))'),
        ("ISM Services PMI", 39, "NMFCI", 'IF(B39<45,"Deep Contraction",IF(B39<50,"Contraction",IF(B39<55,"Expansion","Strong Expansion")))'),
        ("Leading Economic Index (MoM %)", 40, "LEI", 'IF(B40<-0.5,"Recession Signal",IF(B40<0,"Warning","Expansionary"))'),
    ]

    for label, r, code, threshold_formula in growth_metrics:
        style_cell(ws, r, 1).value = label
        style_input_cell(ws, r, 2)
        style_input_cell(ws, r, 3)
        style_cell(ws, r, 4).value = code
        style_calc_cell(ws, r, 5).value = f"={threshold_formula}"

    # ── Market Indicators Section ──────────────────────────────────
    row = 42
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="MARKET INDICATORS")
    style_section_row(ws, row)

    market_metrics = [
        ("S&P 500 Level", 43, "SP500", 'IF(B43>B44,"Above 200 DMA","Below 200 DMA")'),
        ("S&P 500 200-Day MA", 44, "SP500_200DMA", "Reference"),
        ("VIX", 45, "VIXCLS", 'IF(B45>30,"Fear",IF(B45>20,"Elevated",IF(B45>12,"Normal","Complacent")))'),
    ]

    for label, r, code, threshold_formula in market_metrics:
        style_cell(ws, r, 1).value = label
        style_input_cell(ws, r, 2)
        style_input_cell(ws, r, 3)
        style_cell(ws, r, 4).value = code
        if threshold_formula != "Reference":
            style_calc_cell(ws, r, 5).value = f"={threshold_formula}"
        else:
            style_cell(ws, r, 5).value = "Reference level"

    # ── REGIME DETECTION ───────────────────────────────────────────
    row = 47
    ws.merge_cells(f"A{row}:E{row}")
    ws.cell(row=row, column=1, value="REGIME DETECTION")
    style_section_row(ws, row, 5)
    for col in range(1, 6):
        ws.cell(row=row, column=col).font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
        ws.cell(row=row, column=col).fill = PatternFill(start_color="C00000", end_color="C00000", fill_type="solid")

    # Regime scoring
    row = 48
    style_cell(ws, row, 1).value = "Inflation Score (higher = more inflationary)"
    style_cell(ws, row, 1).font = bold_font
    # Score: count of inflation signals
    formula = '=COUNTIF(B18,">3")+COUNTIF(B19,">2.5")+COUNTIF(B11,">2.5")+COUNTIF(B21,">2.8")'
    style_calc_cell(ws, row, 2).value = formula
    style_cell(ws, row, 4).value = "0-1 = Low, 2 = Moderate, 3-4 = High"

    row = 49
    style_cell(ws, row, 1).value = "Growth Score (higher = stronger growth)"
    style_cell(ws, row, 1).font = bold_font
    formula = '=COUNTIF(B37,">2")+COUNTIF(B38,">50")+COUNTIF(B39,">50")+COUNTIF(B31,"<5")'
    style_calc_cell(ws, row, 2).value = formula
    style_cell(ws, row, 4).value = "0-1 = Weak, 2 = Moderate, 3-4 = Strong"

    row = 50
    style_cell(ws, row, 1).value = "Credit Stress Score (higher = more stress)"
    style_cell(ws, row, 1).font = bold_font
    formula = '=COUNTIF(B24,">500")+COUNTIF(B25,">150")+COUNTIF(B28,">75")+COUNTIF(B45,">25")'
    style_calc_cell(ws, row, 2).value = formula
    style_cell(ws, row, 4).value = "0 = Calm, 1-2 = Elevated, 3-4 = Stress"

    # Current Regime
    row = 52
    ws.merge_cells(f"A{row}:A{row}")
    style_cell(ws, row, 1).value = "CURRENT REGIME"
    style_cell(ws, row, 1).font = Font(name="Calibri", size=12, bold=True, color="C00000")
    regime_formula = (
        '=IF(AND(B48>=3,B49>=2),"STAGFLATION WARNING",'
        'IF(AND(B48>=3,B49<=1),"STAGFLATION",'
        'IF(AND(B48>=2,B49>=3),"INFLATIONARY BOOM",'
        'IF(AND(B48<=1,B49>=3),"GOLDILOCKS",'
        'IF(AND(B48<=1,B49<=1),"DEFLATIONARY BUST",'
        'IF(B49<=1,"SLOWDOWN",'
        'IF(B48>=2,"INFLATION RISING","NORMAL / TRANSITION")))))))'
    )
    c = style_calc_cell(ws, row, 2)
    c.value = regime_formula
    c.font = Font(name="Calibri", size=12, bold=True)
    ws.merge_cells(f"B{row}:C{row}")

    row = 53
    style_cell(ws, row, 1).value = "INVESTMENT IMPLICATION"
    style_cell(ws, row, 1).font = Font(name="Calibri", size=12, bold=True, color="2F5496")
    implication_formula = (
        '=IF(B52="STAGFLATION WARNING","Reduce risk, add commodities & TIPS, short zombies",'
        'IF(B52="STAGFLATION","Max defensive: commodities, TIPS, cash, short zombies",'
        'IF(B52="INFLATIONARY BOOM","Equities + commodities, short duration",'
        'IF(B52="GOLDILOCKS","Risk-on: equities, credit, moderate duration",'
        'IF(B52="DEFLATIONARY BUST","Long duration bonds, reduce equities, defensive sectors",'
        'IF(B52="SLOWDOWN","Add duration, reduce cyclicals, quality focus",'
        'IF(B52="INFLATION RISING","Short duration, add commodities, reduce bonds",'
        '"Monitor closely, maintain balanced positioning")))))))'
    )
    c = style_calc_cell(ws, row, 2)
    c.value = implication_formula
    c.font = Font(name="Calibri", size=10, bold=True)
    ws.merge_cells(f"B{row}:E{row}")

    # Conditional formatting for regime
    red_fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
    orange_fill = PatternFill(start_color="FFA500", end_color="FFA500", fill_type="solid")
    green_fill = PatternFill(start_color="00B050", end_color="00B050", fill_type="solid")
    yellow_fill = PatternFill(start_color="FFFF00", end_color="FFFF00", fill_type="solid")

    ws.conditional_formatting.add(
        "B52:C52",
        FormulaRule(formula=['OR(B52="STAGFLATION",B52="STAGFLATION WARNING")'],
                    fill=red_fill, font=Font(bold=True, color="FFFFFF"))
    )
    ws.conditional_formatting.add(
        "B52:C52",
        FormulaRule(formula=['B52="GOLDILOCKS"'],
                    fill=green_fill, font=Font(bold=True, color="FFFFFF"))
    )

    # ══════════════════════════════════════════════════════════════════
    # SHEET 2: HISTORICAL TRACKING
    # ══════════════════════════════════════════════════════════════════
    ws2 = wb.create_sheet("Historical Tracking")
    ws2.sheet_properties.tabColor = "548235"

    hist_headers = [
        "Date", "Fed Funds", "10Y Yield", "10Y TIPS", "Breakeven",
        "CPI YoY", "Core PCE", "HY Spread", "IG Spread", "Unemployment",
        "NFP (k)", "GDP QoQ", "ISM Mfg", "ISM Svc", "VIX",
        "Yield Curve", "Real Rate", "Regime"
    ]

    for col_idx, h in enumerate(hist_headers, 1):
        ws2.cell(row=1, column=col_idx, value=h)
        ws2.column_dimensions[get_column_letter(col_idx)].width = 14

    style_header_row(ws2, 1, len(hist_headers))

    # Template row (row 2) with formulas referencing Dashboard
    ws2.cell(row=2, column=1, value="=Dashboard!B2")
    refs = [
        "Dashboard!B6", "Dashboard!B7", "Dashboard!B10", "Dashboard!B11",
        "Dashboard!B18", "Dashboard!B19", "Dashboard!B24", "Dashboard!B25",
        "Dashboard!B31", "Dashboard!B32", "Dashboard!B37", "Dashboard!B38",
        "Dashboard!B39", "Dashboard!B45", "Dashboard!B9", "Dashboard!B14",
        "Dashboard!B52"
    ]
    for col_idx, ref in enumerate(refs, 2):
        ws2.cell(row=2, column=col_idx, value=f"={ref}")

    # Add 50 empty tracking rows
    for r in range(3, 53):
        for col_idx in range(1, len(hist_headers) + 1):
            style_cell(ws2, r, col_idx)

    # ══════════════════════════════════════════════════════════════════
    # SHEET 3: ZOMBIE SCREENER
    # ══════════════════════════════════════════════════════════════════
    ws3 = wb.create_sheet("Zombie Screener")
    ws3.sheet_properties.tabColor = "BF0000"

    # Title
    ws3.merge_cells("A1:J1")
    ws3["A1"].value = "ZOMBIE COMPANY SCREENER"
    ws3["A1"].font = title_font

    ws3.merge_cells("A2:J2")
    ws3["A2"].value = "Identify companies that cannot cover interest payments from operating income"
    ws3["A2"].font = Font(name="Calibri", size=10, italic=True)

    zombie_headers = [
        "Company", "Ticker", "Sector", "Interest Coverage\n(EBIT/Interest)",
        "Debt/EBITDA", "Free Cash Flow\n($M)", "Debt Maturity\nWall (Year)",
        "Credit Rating", "CDS Spread\n(bp)", "Zombie Score\n(0-10)"
    ]

    for col_idx, h in enumerate(zombie_headers, 1):
        ws3.cell(row=4, column=col_idx, value=h)
        ws3.column_dimensions[get_column_letter(col_idx)].width = 18

    style_header_row(ws3, 4, len(zombie_headers))

    # Zombie score formula explanation
    row = 5
    for r in range(5, 25):
        for col_idx in range(1, 11):
            style_input_cell(ws3, r, col_idx)
        # Zombie Score formula in column J
        # Score: +3 if coverage<1, +2 if coverage<2, +2 if debt/ebitda>6,
        # +1 if debt/ebitda>4, +2 if FCF<0, +2 if maturity wall within 2 years
        score_formula = (
            f'=IF(D{r}="","",('
            f'IF(D{r}<1,3,IF(D{r}<2,2,0))'
            f'+IF(E{r}>6,2,IF(E{r}>4,1,0))'
            f'+IF(F{r}<0,2,0)'
            f'+IF(AND(G{r}<>"",(G{r}-YEAR(TODAY()))<=2),2,0)'
            f'+IF(OR(H{r}="CCC",H{r}="CC",H{r}="C",H{r}="D"),1,0)))'
        )
        ws3.cell(row=r, column=10).value = score_formula
        ws3.cell(row=r, column=10).fill = calc_fill

    # Conditional formatting for zombie scores
    ws3.conditional_formatting.add(
        "J5:J24",
        CellIsRule(operator="greaterThanOrEqual", formula=["7"],
                   fill=PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid"),
                   font=Font(bold=True, color="FFFFFF"))
    )
    ws3.conditional_formatting.add(
        "J5:J24",
        CellIsRule(operator="between", formula=["4", "6"],
                   fill=PatternFill(start_color="FFA500", end_color="FFA500", fill_type="solid"),
                   font=Font(bold=True))
    )

    # Legend
    row = 26
    ws3.merge_cells(f"A{row}:J{row}")
    ws3.cell(row=row, column=1, value="SCORING GUIDE").font = section_font
    ws3.cell(row=row, column=1).fill = section_fill
    ws3.cell(row=row + 1, column=1, value="7-10: HIGH RISK ZOMBIE - Strong short candidate").font = Font(color="FF0000", bold=True)
    ws3.cell(row=row + 2, column=1, value="4-6: MODERATE RISK - Watch closely, potential candidate").font = Font(color="FF8C00", bold=True)
    ws3.cell(row=row + 3, column=1, value="0-3: LOW RISK - Not a zombie, avoid shorting").font = Font(color="008000", bold=True)
    ws3.cell(row=row + 5, column=1, value="Key Zombie Characteristics:").font = bold_font
    ws3.cell(row=row + 6, column=1, value="  - Interest coverage < 1x for 3+ years")
    ws3.cell(row=row + 7, column=1, value="  - Negative free cash flow")
    ws3.cell(row=row + 8, column=1, value="  - Debt maturity wall within 2 years")
    ws3.cell(row=row + 9, column=1, value="  - Rating CCC or below")
    ws3.cell(row=row + 10, column=1, value="  - Rising CDS spreads")

    # ══════════════════════════════════════════════════════════════════
    # SHEET 4: PORTFOLIO ALLOCATIONS
    # ══════════════════════════════════════════════════════════════════
    ws4 = wb.create_sheet("Portfolio Allocations")
    ws4.sheet_properties.tabColor = "7030A0"

    ws4.merge_cells("A1:H1")
    ws4["A1"].value = "PORTFOLIO ALLOCATION BY REGIME"
    ws4["A1"].font = title_font

    alloc_headers = [
        "Asset Class", "GOLDILOCKS", "INFLATION\nRISING", "STAGFLATION",
        "SLOWDOWN", "DEFLATIONARY\nBUST", "CURRENT\nRECOMMENDED", "YOUR\nALLOCATION"
    ]

    for col_idx, h in enumerate(alloc_headers, 1):
        ws4.cell(row=3, column=col_idx, value=h)
        ws4.column_dimensions[get_column_letter(col_idx)].width = 16

    style_header_row(ws4, 3, len(alloc_headers))

    # Allocation data: (asset, goldilocks, infl_rising, stagflation, slowdown, defl_bust)
    allocations = [
        ("US Equities", 35, 25, 10, 20, 15),
        ("Int'l Equities", 15, 10, 5, 10, 5),
        ("Long-Term Bonds", 15, 5, 5, 25, 35),
        ("TIPS / I-Bonds", 5, 15, 20, 5, 5),
        ("Short-Term Bonds/Cash", 5, 10, 15, 15, 20),
        ("Commodities", 5, 15, 20, 5, 0),
        ("Gold", 5, 10, 15, 10, 10),
        ("Real Estate (REITs)", 10, 5, 0, 5, 5),
        ("Crypto / Alternatives", 5, 5, 0, 0, 0),
        ("Zombie Shorts (via puts)", 0, 0, 10, 5, 5),
    ]

    for idx, (asset, *allocs) in enumerate(allocations):
        r = 4 + idx
        style_cell(ws4, r, 1).value = asset
        style_cell(ws4, r, 1).font = bold_font
        for col_idx, val in enumerate(allocs, 2):
            c = style_cell(ws4, r, col_idx)
            c.value = val / 100
            c.number_format = "0%"

        # Current recommended (lookup based on regime)
        regime_ref = "Dashboard!B52"
        lookup_formula = (
            f'=IF({regime_ref}="GOLDILOCKS",B{r},'
            f'IF({regime_ref}="INFLATION RISING",C{r},'
            f'IF(OR({regime_ref}="STAGFLATION",{regime_ref}="STAGFLATION WARNING"),D{r},'
            f'IF({regime_ref}="SLOWDOWN",E{r},'
            f'IF({regime_ref}="DEFLATIONARY BUST",F{r},'
            f'B{r})))))'
        )
        c = style_calc_cell(ws4, r, 7)
        c.value = lookup_formula
        c.number_format = "0%"

        # Your allocation (user input)
        c = style_input_cell(ws4, r, 8)
        c.number_format = "0%"

    # Totals row
    total_row = 4 + len(allocations)
    style_cell(ws4, total_row, 1).value = "TOTAL"
    style_cell(ws4, total_row, 1).font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    style_cell(ws4, total_row, 1).fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
    for col_idx in range(2, 9):
        c = ws4.cell(row=total_row, column=col_idx)
        c.value = f"=SUM({get_column_letter(col_idx)}4:{get_column_letter(col_idx)}{total_row - 1})"
        c.number_format = "0%"
        c.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        c.fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
        c.border = thin_border

    # Current regime display
    ws4.merge_cells(f"A{total_row + 2}:C{total_row + 2}")
    ws4.cell(row=total_row + 2, column=1, value="Current Detected Regime:").font = bold_font
    ws4.cell(row=total_row + 2, column=4, value="=Dashboard!B52")
    ws4.cell(row=total_row + 2, column=4).font = Font(name="Calibri", size=12, bold=True, color="C00000")

    # ETF suggestions
    etf_start = total_row + 4
    ws4.merge_cells(f"A{etf_start}:H{etf_start}")
    ws4.cell(row=etf_start, column=1, value="SUGGESTED ETFs BY ASSET CLASS")
    style_section_row(ws4, etf_start, 8)

    etfs = [
        ("US Equities", "SPY, VOO, VTI, QQQ"),
        ("Int'l Equities", "VXUS, EFA, VWO, IEMG"),
        ("Long-Term Bonds", "TLT, VGLT, EDV, ZROZ"),
        ("TIPS / I-Bonds", "TIP, SCHP, VTIP, STIP"),
        ("Short-Term Bonds/Cash", "SHV, BIL, SGOV, VMFXX"),
        ("Commodities", "DBC, GSG, PDBC, COMT"),
        ("Gold", "GLD, IAU, GLDM, SGOL"),
        ("Real Estate", "VNQ, SCHH, IYR, XLRE"),
        ("Zombie Shorts", "Use put options on individual names"),
    ]

    for idx, (asset, etf_list) in enumerate(etfs):
        r = etf_start + 1 + idx
        style_cell(ws4, r, 1).value = asset
        style_cell(ws4, r, 1).font = bold_font
        ws4.merge_cells(f"B{r}:H{r}")
        style_cell(ws4, r, 2).value = etf_list

    # ══════════════════════════════════════════════════════════════════
    # SHEET 5: DATA SOURCES
    # ══════════════════════════════════════════════════════════════════
    ws5 = wb.create_sheet("Data Sources")
    ws5.sheet_properties.tabColor = "ED7D31"

    ws5.merge_cells("A1:E1")
    ws5["A1"].value = "DATA SOURCES & FRED SERIES CODES"
    ws5["A1"].font = title_font

    source_headers = ["Indicator", "FRED Code", "URL", "Update Frequency", "Typical Release"]
    for col_idx, h in enumerate(source_headers, 1):
        ws5.cell(row=3, column=col_idx, value=h)
        ws5.column_dimensions[get_column_letter(col_idx)].width = 28

    style_header_row(ws5, 3, len(source_headers))

    sources = [
        ("Fed Funds Rate", "FEDFUNDS", "https://fred.stlouisfed.org/series/FEDFUNDS", "Monthly", "1st business day"),
        ("Fed Funds (Daily)", "DFF", "https://fred.stlouisfed.org/series/DFF", "Daily", "Next business day"),
        ("10-Year Treasury", "DGS10", "https://fred.stlouisfed.org/series/DGS10", "Daily", "Next business day"),
        ("2-Year Treasury", "DGS2", "https://fred.stlouisfed.org/series/DGS2", "Daily", "Next business day"),
        ("10-Year TIPS", "DFII10", "https://fred.stlouisfed.org/series/DFII10", "Daily", "Next business day"),
        ("10Y Breakeven", "T10YIE", "https://fred.stlouisfed.org/series/T10YIE", "Daily", "Next business day"),
        ("5Y5Y Forward", "T5YIFR", "https://fred.stlouisfed.org/series/T5YIFR", "Daily", "Next business day"),
        ("CPI YoY", "CPIAUCSL", "https://fred.stlouisfed.org/series/CPIAUCSL", "Monthly", "~13th of month"),
        ("Core PCE", "PCEPILFE", "https://fred.stlouisfed.org/series/PCEPILFE", "Monthly", "~30th of month"),
        ("HY OAS Spread", "BAMLH0A0HYM2", "https://fred.stlouisfed.org/series/BAMLH0A0HYM2", "Daily", "Next business day"),
        ("IG OAS Spread", "BAMLC0A0CM", "https://fred.stlouisfed.org/series/BAMLC0A0CM", "Daily", "Next business day"),
        ("AA OAS Spread", "BAMLC0A3CA", "https://fred.stlouisfed.org/series/BAMLC0A3CA", "Daily", "Next business day"),
        ("TED Spread", "TEDRATE", "https://fred.stlouisfed.org/series/TEDRATE", "Daily", "Next business day"),
        ("Unemployment", "UNRATE", "https://fred.stlouisfed.org/series/UNRATE", "Monthly", "1st Friday of month"),
        ("Nonfarm Payrolls", "PAYEMS", "https://fred.stlouisfed.org/series/PAYEMS", "Monthly", "1st Friday of month"),
        ("Initial Claims", "ICSA", "https://fred.stlouisfed.org/series/ICSA", "Weekly", "Every Thursday"),
        ("JOLTS Openings", "JTSJOL", "https://fred.stlouisfed.org/series/JTSJOL", "Monthly", "~1 month lag"),
        ("GDP QoQ", "GDP", "https://fred.stlouisfed.org/series/GDP", "Quarterly", "3 estimates/quarter"),
        ("VIX", "VIXCLS", "https://fred.stlouisfed.org/series/VIXCLS", "Daily", "Next business day"),
        ("S&P 500", "SP500", "https://fred.stlouisfed.org/series/SP500", "Daily", "Next business day"),
    ]

    for idx, (indicator, code, url, freq, release) in enumerate(sources):
        r = 4 + idx
        style_cell(ws5, r, 1).value = indicator
        style_cell(ws5, r, 2).value = code
        style_cell(ws5, r, 2).font = Font(name="Consolas", size=10, bold=True)
        style_cell(ws5, r, 3).value = url
        style_cell(ws5, r, 3).font = Font(name="Calibri", size=10, color="0563C1", underline="single")
        style_cell(ws5, r, 4).value = freq
        style_cell(ws5, r, 5).value = release

    # ══════════════════════════════════════════════════════════════════
    # SHEET 6: INSTRUCTIONS
    # ══════════════════════════════════════════════════════════════════
    ws6 = wb.create_sheet("Instructions")
    ws6.sheet_properties.tabColor = "00B0F0"
    ws6.column_dimensions["A"].width = 100

    instructions = [
        ("MACRO MONITORING WORKBOOK - INSTRUCTIONS", title_font),
        ("", normal_font),
        ("OVERVIEW", section_font),
        ("This workbook tracks key macroeconomic indicators to detect regime changes,", normal_font),
        ("assess credit conditions, and guide portfolio allocation decisions.", normal_font),
        ("Based on 'The Price of Time' by Edward Chancellor.", normal_font),
        ("", normal_font),
        ("COLOR CODING", section_font),
        ("  YELLOW cells = Data entry (enter your values here)", normal_font),
        ("  GREEN cells  = Auto-calculated (formulas, do not edit)", normal_font),
        ("  BLUE headers = Section headers", normal_font),
        ("  RED header   = Regime detection area", normal_font),
        ("", normal_font),
        ("HOW TO UPDATE", section_font),
        ("1. Go to the Dashboard sheet", normal_font),
        ("2. Enter current values in the YELLOW cells in Column B", normal_font),
        ("3. Optionally enter previous values in Column C for comparison", normal_font),
        ("4. Status (Column E) updates automatically based on thresholds", normal_font),
        ("5. Regime detection in rows 47-53 updates automatically", normal_font),
        ("6. Check Portfolio Allocations sheet for recommended positioning", normal_font),
        ("", normal_font),
        ("DATA SOURCES", section_font),
        ("Most data comes from FRED (Federal Reserve Economic Data).", normal_font),
        ("See the 'Data Sources' sheet for all FRED series codes and URLs.", normal_font),
        ("Free FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html", normal_font),
        ("", normal_font),
        ("REGIME DEFINITIONS", section_font),
        ("GOLDILOCKS: Low inflation + strong growth (risk-on)", normal_font),
        ("INFLATION RISING: High inflation + strong growth (commodities)", normal_font),
        ("STAGFLATION: High inflation + weak growth (defensive + shorts)", normal_font),
        ("SLOWDOWN: Low inflation + weak growth (duration + quality)", normal_font),
        ("DEFLATIONARY BUST: Very low inflation + contraction (max duration)", normal_font),
        ("", normal_font),
        ("ZOMBIE SCREENER", section_font),
        ("Use the Zombie Screener sheet to evaluate potential short candidates.", normal_font),
        ("Zombie Score of 7+ indicates a high-risk zombie company.", normal_font),
        ("Position sizing: Max 5% of portfolio per zombie short.", normal_font),
        ("Use put options for defined risk (never naked short).", normal_font),
        ("", normal_font),
        ("TIPS", section_font),
        ("- Update at least weekly (Monday mornings recommended)", normal_font),
        ("- Copy data to Historical Tracking sheet monthly", normal_font),
        ("- Wait 2-4 weeks before acting on regime changes", normal_font),
        ("- Cross-reference multiple indicators before trading", normal_font),
        ("- The system is a guide, not a crystal ball", normal_font),
    ]

    for idx, (text, font) in enumerate(instructions):
        ws6.cell(row=idx + 1, column=1, value=text).font = font

    # ── Save ───────────────────────────────────────────────────────
    filename = "Macro_Monitoring_Workbook.xlsx"
    wb.save(filename)
    print(f"Created: {filename}")
    print(f"Sheets: {wb.sheetnames}")
    print("Done! Open the file in Excel to see all formulas and formatting.")


if __name__ == "__main__":
    create_workbook()
