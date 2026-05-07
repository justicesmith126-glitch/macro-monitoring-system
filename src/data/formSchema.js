// CFP Board / Kitces / NAPFA / FPA best-practice intake form schema
// Each section maps to a wizard step; fields drive the rendered UI.

export const STEPS = [
  { id: 'personal',      title: 'Personal Information',        icon: '👤' },
  { id: 'family',        title: 'Family & Household',          icon: '🏠' },
  { id: 'employment',    title: 'Employment & Income',         icon: '💼' },
  { id: 'assets',        title: 'Assets',                      icon: '📈' },
  { id: 'liabilities',   title: 'Liabilities & Debt',          icon: '📋' },
  { id: 'insurance',     title: 'Insurance Coverage',          icon: '🛡️' },
  { id: 'estate',        title: 'Estate Planning',             icon: '📜' },
  { id: 'taxes',         title: 'Tax Situation',               icon: '🧾' },
  { id: 'goals',         title: 'Financial Goals',             icon: '🎯' },
  { id: 'risk',          title: 'Risk Tolerance',              icon: '⚖️' },
  { id: 'priorities',    title: 'Planning Priorities',         icon: '📌' },
  { id: 'documents',     title: 'Documents & Review',          icon: '📁' },
];

export const MARITAL_OPTIONS = [
  'Single',
  'Married',
  'Domestic Partner',
  'Separated',
  'Divorced',
  'Widowed',
];

export const EMPLOYMENT_STATUS = [
  'Employed (W-2)',
  'Self-Employed / Business Owner',
  'Retired',
  'Unemployed',
  'Disability',
  'Student',
  'Part-Time',
];

export const RETIREMENT_PLAN_TYPES = [
  '401(k)',
  '403(b)',
  '457',
  'SIMPLE IRA',
  'SEP IRA',
  'Pension / Defined Benefit',
  'ESOP',
  'None',
];

export const ASSET_ACCOUNT_TYPES = [
  'Traditional IRA',
  'Roth IRA',
  'Rollover IRA',
  '401(k)',
  '403(b)',
  '457',
  'Solo 401(k)',
  'SEP IRA',
  'SIMPLE IRA',
  'Taxable Brokerage',
  '529 Education',
  'UTMA / UGMA',
  'Annuity',
  'Other',
];

export const TAX_BRACKETS = [
  '10% ($0 – $11,600)',
  '12% ($11,601 – $47,150)',
  '22% ($47,151 – $100,525)',
  '24% ($100,526 – $191,950)',
  '32% ($191,951 – $243,725)',
  '35% ($243,726 – $609,350)',
  '37% (Over $609,350)',
  'Not Sure',
];

export const FILING_STATUS = [
  'Single',
  'Married Filing Jointly',
  'Married Filing Separately',
  'Head of Household',
  'Qualifying Surviving Spouse',
];

export const PLANNING_PRIORITY_OPTIONS = [
  'Cash Flow & Budgeting',
  'Debt Reduction',
  'Emergency Fund',
  'Retirement Planning',
  'Investment Management',
  'Tax Planning & Minimization',
  'Education Funding',
  'Insurance & Risk Protection',
  'Estate Planning / Wills / Trusts',
  'Business Planning & Succession',
  'Social Security Optimization',
  'Long-Term Care Planning',
  'Charitable Giving Strategy',
  'Medicare & Healthcare Planning',
];

export const CONTACT_PREFERENCES = [
  'Email',
  'Phone Call',
  'Text Message',
  'Video Call',
  'In-Person',
];

export const MEETING_FREQUENCY = [
  'Monthly',
  'Quarterly',
  'Semi-Annually',
  'Annually',
  'As Needed',
];

// Risk tolerance questionnaire — scored 1–5 per question
// Total max = 75; score bands map to risk profiles
export const RISK_QUESTIONS = [
  {
    id: 'rq1',
    dimension: 'Time Horizon',
    question: 'When do you expect to begin withdrawing from this investment portfolio?',
    options: [
      { label: 'Less than 2 years', score: 1 },
      { label: '2–5 years',         score: 2 },
      { label: '5–10 years',        score: 3 },
      { label: '10–20 years',       score: 4 },
      { label: 'More than 20 years',score: 5 },
    ],
  },
  {
    id: 'rq2',
    dimension: 'Time Horizon',
    question: 'Once you begin withdrawals, for how long do you expect to draw from this portfolio?',
    options: [
      { label: 'Less than 5 years',  score: 1 },
      { label: '5–10 years',         score: 2 },
      { label: '10–20 years',        score: 3 },
      { label: 'More than 20 years', score: 4 },
      { label: 'Indefinitely (leaving a legacy)', score: 5 },
    ],
  },
  {
    id: 'rq3',
    dimension: 'Investment Experience',
    question: 'How would you describe your overall investment experience?',
    options: [
      { label: 'None — this is new to me',          score: 1 },
      { label: 'Minimal — savings accounts and CDs', score: 2 },
      { label: 'Moderate — mutual funds and ETFs',   score: 3 },
      { label: 'Experienced — individual stocks and bonds', score: 4 },
      { label: 'Advanced — options, alternatives, real estate', score: 5 },
    ],
  },
  {
    id: 'rq4',
    dimension: 'Investment Experience',
    question: 'What degree of risk have you taken with your investments in the past?',
    options: [
      { label: 'Very small — always capital preservation',       score: 1 },
      { label: 'Small — mostly low-risk investments',            score: 2 },
      { label: 'Medium — balanced approach',                     score: 3 },
      { label: 'Large — accepted significant risk for growth',   score: 4 },
      { label: 'Very large — maximum growth was the priority',   score: 5 },
    ],
  },
  {
    id: 'rq5',
    dimension: 'Loss Reaction',
    question: 'If your portfolio lost 20% of its value in 3 months, what would you most likely do?',
    options: [
      { label: 'Sell everything to prevent further losses',   score: 1 },
      { label: 'Sell some holdings to reduce my exposure',    score: 2 },
      { label: 'Hold steady and wait for a recovery',         score: 3 },
      { label: 'Do nothing — I planned for this possibility', score: 4 },
      { label: 'Buy more at the lower prices',                score: 5 },
    ],
  },
  {
    id: 'rq6',
    dimension: 'Loss Reaction',
    question: 'What is the maximum one-year loss you could tolerate before you would seriously reconsider your investment strategy?',
    options: [
      { label: 'Any loss at all — I cannot accept negative returns', score: 1 },
      { label: 'Up to –5%',                                          score: 2 },
      { label: 'Up to –15%',                                         score: 3 },
      { label: 'Up to –25%',                                         score: 4 },
      { label: 'More than –25% — I am focused on long-term growth',  score: 5 },
    ],
  },
  {
    id: 'rq7',
    dimension: 'Risk / Return Trade-off',
    question: 'Which hypothetical portfolio would you most likely choose? (shown as average annual return / worst single year)',
    options: [
      { label: 'Portfolio A: +5% avg / –2% worst year (very conservative)', score: 1 },
      { label: 'Portfolio B: +7% avg / –8% worst year (conservative)',      score: 2 },
      { label: 'Portfolio C: +9% avg / –15% worst year (moderate)',         score: 3 },
      { label: 'Portfolio D: +11% avg / –25% worst year (aggressive)',      score: 4 },
      { label: 'Portfolio E: +13% avg / –35% worst year (very aggressive)', score: 5 },
    ],
  },
  {
    id: 'rq8',
    dimension: 'Risk / Return Trade-off',
    question: 'Which statement best describes your attitude toward investment risk and reward?',
    options: [
      { label: 'Capital preservation is my top priority — I cannot lose principal',         score: 1 },
      { label: 'I can tolerate small losses if it means modest gains over time',            score: 2 },
      { label: 'I seek a balance — moderate risk for moderate potential gain',              score: 3 },
      { label: 'I am willing to accept significant short-term losses for higher long-term growth', score: 4 },
      { label: 'Maximum long-term growth is the goal — I can handle high volatility',      score: 5 },
    ],
  },
  {
    id: 'rq9',
    dimension: 'Risk Capacity',
    question: 'What percentage of your total investable assets does this portfolio represent?',
    options: [
      { label: 'More than 75% — this is nearly all my savings', score: 1 },
      { label: '50–75%',                                         score: 2 },
      { label: '25–50%',                                         score: 3 },
      { label: 'Less than 25% — I have many other assets',       score: 4 },
      { label: 'Less than 10%',                                  score: 5 },
    ],
  },
  {
    id: 'rq10',
    dimension: 'Risk Capacity',
    question: 'Outside of this portfolio, do you have an emergency fund covering at least 3–6 months of living expenses?',
    options: [
      { label: 'No — I have no emergency fund',                      score: 1 },
      { label: 'Partial — less than 3 months of expenses',           score: 2 },
      { label: 'Yes — approximately 3–6 months',                     score: 3 },
      { label: 'Yes — more than 6 months',                           score: 4 },
      { label: 'Yes — more than 12 months (very well funded)',       score: 5 },
    ],
  },
  {
    id: 'rq11',
    dimension: 'Risk Capacity',
    question: 'How stable and predictable is your income?',
    options: [
      { label: 'Very unstable — freelance, commissions, or business at risk', score: 1 },
      { label: 'Somewhat variable — bonuses are a significant component',     score: 2 },
      { label: 'Moderately stable — salary with some variable pay',           score: 3 },
      { label: 'Very stable — salaried with strong job security',             score: 4 },
      { label: 'Fixed — pension, Social Security, or other guaranteed income',score: 5 },
    ],
  },
  {
    id: 'rq12',
    dimension: 'Emotional / Behavioral',
    question: 'During a major market decline, how often would you check your portfolio?',
    options: [
      { label: 'Multiple times per day — it would consume my attention', score: 1 },
      { label: 'Daily',                                                   score: 2 },
      { label: 'Weekly',                                                  score: 3 },
      { label: 'Monthly — I try not to overreact',                       score: 4 },
      { label: 'Rarely — I trust the long-term plan',                    score: 5 },
    ],
  },
  {
    id: 'rq13',
    dimension: 'Emotional / Behavioral',
    question: 'If your portfolio dropped 20% in a bear market, how would you feel emotionally?',
    options: [
      { label: 'Highly anxious — I would lose sleep',                    score: 1 },
      { label: 'Worried — it would significantly affect my mood',        score: 2 },
      { label: 'Concerned but manageable — I would stay the course',    score: 3 },
      { label: 'Mildly uneasy — I understand market cycles',            score: 4 },
      { label: 'Calm — market downturns are normal and expected',       score: 5 },
    ],
  },
  {
    id: 'rq14',
    dimension: 'Emotional / Behavioral',
    question: 'Have you ever made an investment decision based on fear or market news (e.g., sold during a crash, chased a hot investment)?',
    options: [
      { label: 'Yes, frequently — emotions often drive my decisions',  score: 1 },
      { label: 'Yes, a few times',                                      score: 2 },
      { label: 'Once or twice',                                         score: 3 },
      { label: 'Rarely — I try to stay disciplined',                   score: 4 },
      { label: 'Never — I follow a consistent strategy',               score: 5 },
    ],
  },
  {
    id: 'rq15',
    dimension: 'Self-Assessment',
    question: 'Overall, how would you describe yourself as an investor?',
    options: [
      { label: 'Very Conservative — protecting what I have is most important',    score: 1 },
      { label: 'Conservative — modest growth with capital preservation',          score: 2 },
      { label: 'Moderate — balanced approach between growth and stability',       score: 3 },
      { label: 'Moderately Aggressive — growth-oriented, tolerates volatility',  score: 4 },
      { label: 'Aggressive — maximum long-term growth, comfortable with swings', score: 5 },
    ],
  },
];

export const RISK_PROFILES = [
  {
    min: 15, max: 27,
    label: 'Conservative',
    color: '#3b82f6',
    description: 'You prioritize capital preservation over growth. A portfolio with ~20–30% equities and 70–80% fixed income is typically appropriate.',
    allocation: { equities: 25, fixedIncome: 65, cash: 10 },
  },
  {
    min: 28, max: 39,
    label: 'Moderately Conservative',
    color: '#10b981',
    description: 'You accept modest risk for steady, moderate growth. A 40/60 equity/fixed-income split is a common starting point.',
    allocation: { equities: 40, fixedIncome: 55, cash: 5 },
  },
  {
    min: 40, max: 52,
    label: 'Moderate',
    color: '#f59e0b',
    description: 'You seek a balance between growth and stability. A 60/40 portfolio is a classic fit for your profile.',
    allocation: { equities: 60, fixedIncome: 37, cash: 3 },
  },
  {
    min: 53, max: 64,
    label: 'Moderately Aggressive',
    color: '#f97316',
    description: 'You are growth-oriented and can tolerate meaningful short-term volatility. An 80/20 equity-heavy allocation may suit you.',
    allocation: { equities: 80, fixedIncome: 18, cash: 2 },
  },
  {
    min: 65, max: 75,
    label: 'Aggressive',
    color: '#ef4444',
    description: 'Long-term maximum growth is your priority. A 90–100% equity portfolio with high volatility tolerance is appropriate.',
    allocation: { equities: 92, fixedIncome: 7, cash: 1 },
  },
];

export function scoreRiskTolerance(answers) {
  let total = 0;
  RISK_QUESTIONS.forEach(q => {
    const val = answers[q.id];
    if (val !== undefined) total += Number(val);
  });
  return total;
}

export function getRiskProfile(score) {
  return RISK_PROFILES.find(p => score >= p.min && score <= p.max) || RISK_PROFILES[2];
}
