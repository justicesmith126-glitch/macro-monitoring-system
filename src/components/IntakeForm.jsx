import React, { useState, useCallback } from 'react';
import {
  STEPS, MARITAL_OPTIONS, EMPLOYMENT_STATUS, RETIREMENT_PLAN_TYPES,
  ASSET_ACCOUNT_TYPES, TAX_BRACKETS, FILING_STATUS,
  PLANNING_PRIORITY_OPTIONS, CONTACT_PREFERENCES, MEETING_FREQUENCY,
  RISK_QUESTIONS, scoreRiskTolerance, getRiskProfile,
} from '../data/formSchema';
import { DOCUMENT_CHECKLIST } from '../data/onboardingPhases';

const EMPTY_FORM = {
  // Personal
  firstName: '', lastName: '', preferredName: '', dob: '', ssn_note: '',
  address: '', city: '', state: '', zip: '',
  phone: '', mobile: '', email: '',
  contactPref: '', bestTime: '',
  citizenship: 'U.S. Citizen', maritalStatus: '', marriageDate: '',
  referralSource: '',
  // Co-client
  hasCoClient: 'no',
  co_firstName: '', co_lastName: '', co_dob: '', co_email: '', co_phone: '',
  co_citizenship: 'U.S. Citizen',
  // Family
  numDependents: '0',
  dependents: [],
  hasSpecialNeedsDep: 'no', supportingParents: 'no',
  divorceProceeding: 'no',
  alimonyPaid: '', alimonyReceived: '', childSupportPaid: '', childSupportReceived: '',
  attorney_name: '', attorney_phone: '',
  cpa_name: '', cpa_phone: '',
  insurance_agent: '',
  // Employment
  employmentStatus: '', employer: '', jobTitle: '', yearsWithEmployer: '',
  baseSalary: '', bonus: '', bonusType: 'discretionary', commissions: '', selfEmployIncome: '',
  co_employmentStatus: '', co_employer: '', co_jobTitle: '', co_baseSalary: '',
  rentalIncome: '', dividendInterest: '', pensionIncome: '', ssIncome: '',
  annuityIncome: '', otherIncome: '', otherIncomeDesc: '',
  retirementPlanType: '', employeeContribPct: '', employerMatch: '',
  hasStockOptions: 'no', stockDetails: '',
  hasHSA: 'no', hsaContrib: '',
  empLifeInsurance: '', empDisabilityInsurance: '',
  // Assets
  checkingBalance: '', savingsBalance: '', mmBalance: '', cdBalance: '',
  emergencyFundMonths: '',
  investAccounts: [{ type: '', institution: '', value: '', taxable: true }],
  retireAccounts: [{ type: '', institution: '', balance: '', beneficiary: '' }],
  primaryHomeValue: '', primaryHomePurchasePrice: '', primaryHomePurchaseDate: '',
  hasInvestmentProperty: 'no', investPropValue: '', investPropRent: '', investPropMortgage: '',
  hasVacationHome: 'no', vacationHomeValue: '',
  ownsBusiness: 'no', businessType: '', businessValue: '', exitStrategy: '',
  hasBuySell: 'no',
  vehicles: '', collectibles: '', lifeInsCV: '',
  has529: 'no', savings529Balance: '', savings529Beneficiary: '',
  hasCrypto: 'no', cryptoValue: '',
  expectedInheritance: '', expectedInheritanceTimeline: '',
  // Liabilities
  mortgage_lender: '', mortgage_balance: '', mortgage_payment: '',
  mortgage_rate: '', mortgage_type: 'fixed', mortgage_term: '',
  hasHELOC: 'no', helocBalance: '', helocRate: '',
  carLoan_balance: '', carLoan_rate: '', carLoan_payment: '',
  studentLoan_balance: '', studentLoan_rate: '', studentLoan_type: 'federal',
  creditCard_balance: '', creditCard_rate: '',
  otherDebt: '', otherDebtDesc: '',
  grossMonthlyIncome: '', netMonthlyIncome: '',
  fixedMonthlyExpenses: '', variableMonthlyExpenses: '',
  monthlySavings: '',
  // Insurance
  hasTermLife: 'no', termLifeFaceValue: '', termLifePremium: '', termLifeBeneficiary: '',
  hasPermLife: 'no', permLifeType: '', permLifeFaceValue: '', permLifeCV: '',
  hasDisability: 'no', disBenefitAmount: '', disBenefitPeriod: '', disElimPeriod: '', disOccDef: 'own-occupation',
  hasLTC: 'no', ltcDailyBenefit: '', ltcBenefitPeriod: '',
  healthInsCarrier: '', healthInsType: '', healthDeductible: '',
  hasUmbrella: 'no', umbrellaAmount: '',
  homeInsCarrier: '', homeInsCoverage: '',
  // Estate
  hasWill: 'no', willDate: '', willAttorney: '',
  hasRevTrust: 'no', revTrustDate: '',
  hasDurablePOA: 'no', durablePOAName: '',
  hasHealthcarePOA: 'no', healthcarePOAName: '',
  hasAdvDirective: 'no',
  hasIrrevTrust: 'no', irrevTrustType: '',
  beneficiariesCurrent: 'yes',
  estateValue: '', estateIsHighPriority: 'no',
  // Taxes
  filingStatus: '', residenceState: '', taxBracket: '',
  owesBackTaxes: 'no', incomeChangeExpected: 'no',
  subjectToAMT: 'no', hasCapGains: 'no', hasNOL: 'no',
  charitableContribs: 'no', charitableType: '',
  hasK1: 'no', hasDoneRothConv: 'no',
  // Goals
  retireAge: '', co_retireAge: '',
  partTimeInRetirement: 'no', partTimeIncome: '', partTimeYears: '',
  retirementMonthlyIncome: '', retirementLocation: '', retirementLifestyle: '',
  retirementHealthcareConcern: 'no', wantsToLeaveAssets: 'no',
  savingForEducation: 'no', educationDetails: '',
  planningHomePurchase: 'no', homePurchaseTimeline: '', homePurchaseCost: '',
  bigOneTimeExpenses: '',
  debtPayoffGoal: 'no', debtPayoffTarget: '',
  hasEmergencyFund: 'no',
  legacyImportant: 'no', legacyAmount: '',
  charitableGoal: 'no',
  otherGoals: '',
  biggestConcern: '',
  financialSuccess: '',
  // Risk (answers keyed by question id)
  riskAnswers: {},
  // Priorities
  planningPriorities: [],
  previousAdvisor: 'no', previousAdvisorDetails: '',
  whySeeking: '',
  involvementLevel: 'moderately',
  meetingFrequency: '',
  meetingFormat: 'video',
  reportPref: 'email',
  esgPreferences: '',
  decisionMakers: '',
  specialCircumstances: '',
  // Documents
  docChecked: {},
  additionalNotes: '',
};

function Field({ label, id, required, error, children }) {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}{required && <span className="required">*</span>}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function Input({ id, type = 'text', value, onChange, placeholder, error, ...rest }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(id, e.target.value)}
      placeholder={placeholder}
      className={error ? 'error' : ''}
      {...rest}
    />
  );
}

function Select({ id, value, onChange, options, placeholder = 'Select…', error }) {
  return (
    <select id={id} value={value} onChange={e => onChange(id, e.target.value)} className={error ? 'error' : ''}>
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function YesNo({ id, value, onChange, label }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div className="radio-group horizontal">
        {['yes', 'no'].map(v => (
          <label key={v} className="radio-option">
            <input type="radio" name={id} value={v} checked={value === v} onChange={() => onChange(id, v)} />
            {v === 'yes' ? 'Yes' : 'No'}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Step components ──────────────────────────────────────────────────────────

function StepPersonal({ data, onChange, errors }) {
  return (
    <>
      <div className="form-section-title">👤 Your Information</div>
      <div className="form-grid">
        <Field label="First Name" id="firstName" required error={errors.firstName}>
          <Input id="firstName" value={data.firstName} onChange={onChange} placeholder="Jane" error={errors.firstName} />
        </Field>
        <Field label="Last Name" id="lastName" required error={errors.lastName}>
          <Input id="lastName" value={data.lastName} onChange={onChange} placeholder="Smith" error={errors.lastName} />
        </Field>
        <Field label="Preferred Name" id="preferredName">
          <Input id="preferredName" value={data.preferredName} onChange={onChange} placeholder="Optional nickname" />
        </Field>
        <Field label="Date of Birth" id="dob" required error={errors.dob}>
          <Input id="dob" type="date" value={data.dob} onChange={onChange} error={errors.dob} />
        </Field>
        <Field label="Primary Email" id="email" required error={errors.email}>
          <Input id="email" type="email" value={data.email} onChange={onChange} placeholder="jane@example.com" error={errors.email} />
        </Field>
        <Field label="Mobile Phone" id="mobile" required error={errors.mobile}>
          <Input id="mobile" type="tel" value={data.mobile} onChange={onChange} placeholder="(555) 000-0000" error={errors.mobile} />
        </Field>
        <Field label="Home Phone" id="phone">
          <Input id="phone" type="tel" value={data.phone} onChange={onChange} placeholder="Optional" />
        </Field>
        <Field label="Preferred Contact Method" id="contactPref">
          <Select id="contactPref" value={data.contactPref} onChange={onChange} options={CONTACT_PREFERENCES} />
        </Field>
        <Field label="Best Time to Reach You" id="bestTime">
          <Select id="bestTime" value={data.bestTime} onChange={onChange}
            options={['Morning (8am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–8pm)', 'Anytime']} />
        </Field>
        <Field label="Marital Status" id="maritalStatus" required error={errors.maritalStatus}>
          <Select id="maritalStatus" value={data.maritalStatus} onChange={onChange} options={MARITAL_OPTIONS} error={errors.maritalStatus} />
        </Field>
        {['Married', 'Domestic Partner'].includes(data.maritalStatus) && (
          <Field label="Date of Marriage / Partnership" id="marriageDate">
            <Input id="marriageDate" type="date" value={data.marriageDate} onChange={onChange} />
          </Field>
        )}
        <Field label="U.S. Citizenship Status" id="citizenship">
          <Select id="citizenship" value={data.citizenship} onChange={onChange}
            options={['U.S. Citizen', 'U.S. Permanent Resident (Green Card)', 'Non-Resident Alien', 'Other Visa Status']} />
        </Field>
      </div>

      <div className="form-grid mt-4">
        <Field label="Home Address" id="address" required error={errors.address}>
          <Input id="address" value={data.address} onChange={onChange} placeholder="123 Main St" error={errors.address} />
        </Field>
        <Field label="City" id="city" required error={errors.city}>
          <Input id="city" value={data.city} onChange={onChange} placeholder="City" error={errors.city} />
        </Field>
        <Field label="State" id="state" required error={errors.state}>
          <Input id="state" value={data.state} onChange={onChange} placeholder="State" error={errors.state} />
        </Field>
        <Field label="ZIP Code" id="zip" required error={errors.zip}>
          <Input id="zip" value={data.zip} onChange={onChange} placeholder="00000" error={errors.zip} />
        </Field>
      </div>

      <div className="mt-6">
        <div className="form-section-title">How did you hear about us?</div>
        <div className="form-grid">
          <Field label="Referral Source" id="referralSource">
            <Select id="referralSource" value={data.referralSource} onChange={onChange}
              options={['Client Referral', 'Professional Referral (CPA/Attorney)', 'Online Search', 'Social Media', 'Seminar / Event', 'Other']} />
          </Field>
        </div>
      </div>

      <div className="mt-6">
        <div className="form-section-title">
          Co-Client / Spouse / Partner
          <div className="radio-group horizontal" style={{ marginLeft: 'auto', fontSize: '13px' }}>
            {['yes', 'no'].map(v => (
              <label key={v} className="radio-option" style={{ fontWeight: 400 }}>
                <input type="radio" name="hasCoClient" value={v} checked={data.hasCoClient === v}
                  onChange={() => onChange('hasCoClient', v)} />
                {v === 'yes' ? 'Include co-client' : 'Just me'}
              </label>
            ))}
          </div>
        </div>
        {data.hasCoClient === 'yes' && (
          <div className="form-grid">
            <Field label="Co-Client First Name" id="co_firstName" required>
              <Input id="co_firstName" value={data.co_firstName} onChange={onChange} />
            </Field>
            <Field label="Co-Client Last Name" id="co_lastName" required>
              <Input id="co_lastName" value={data.co_lastName} onChange={onChange} />
            </Field>
            <Field label="Date of Birth" id="co_dob" required>
              <Input id="co_dob" type="date" value={data.co_dob} onChange={onChange} />
            </Field>
            <Field label="Email" id="co_email">
              <Input id="co_email" type="email" value={data.co_email} onChange={onChange} />
            </Field>
            <Field label="Mobile Phone" id="co_phone">
              <Input id="co_phone" type="tel" value={data.co_phone} onChange={onChange} />
            </Field>
            <Field label="Citizenship Status" id="co_citizenship">
              <Select id="co_citizenship" value={data.co_citizenship} onChange={onChange}
                options={['U.S. Citizen', 'U.S. Permanent Resident (Green Card)', 'Non-Resident Alien', 'Other Visa Status']} />
            </Field>
          </div>
        )}
      </div>

      <div className="info-box mt-4">
        🔒 Your Social Security Number will be collected separately through our secure portal before your first meeting. It will never be transmitted through this form.
      </div>
    </>
  );
}

function StepFamily({ data, onChange }) {
  const numDeps = parseInt(data.numDependents || 0);

  function updateDependent(index, field, value) {
    const updated = [...(data.dependents || [])];
    if (!updated[index]) updated[index] = {};
    updated[index] = { ...updated[index], [field]: value };
    onChange('dependents', updated);
  }

  return (
    <>
      <div className="form-section-title">🏠 Family & Household</div>
      <div className="form-grid">
        <Field label="Number of Dependents" id="numDependents">
          <Select id="numDependents" value={data.numDependents} onChange={onChange}
            options={['0','1','2','3','4','5','6+']} placeholder="Select…" />
        </Field>
      </div>

      {numDeps > 0 && (
        <div className="mt-4">
          <div className="text-sm text-muted" style={{ marginBottom: 12 }}>Please provide details for each dependent:</div>
          {Array.from({ length: Math.min(numDeps, 6) }).map((_, i) => (
            <div key={i} className="form-grid" style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ gridColumn: 'span 2', fontWeight: 600, fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Dependent {i + 1}</div>
              <Field label="Name" id={`dep_name_${i}`}>
                <Input id={`dep_name_${i}`} value={data.dependents?.[i]?.name || ''} onChange={(_, v) => updateDependent(i, 'name', v)} />
              </Field>
              <Field label="Relationship" id={`dep_rel_${i}`}>
                <Select id={`dep_rel_${i}`} value={data.dependents?.[i]?.relationship || ''} onChange={(_, v) => updateDependent(i, 'relationship', v)}
                  options={['Child', 'Grandchild', 'Parent', 'Sibling', 'Other']} />
              </Field>
              <Field label="Date of Birth" id={`dep_dob_${i}`}>
                <Input id={`dep_dob_${i}`} type="date" value={data.dependents?.[i]?.dob || ''} onChange={(_, v) => updateDependent(i, 'dob', v)} />
              </Field>
              <Field label="Lives in household?" id={`dep_live_${i}`}>
                <Select id={`dep_live_${i}`} value={data.dependents?.[i]?.livesIn || ''} onChange={(_, v) => updateDependent(i, 'livesIn', v)}
                  options={['Yes', 'No']} />
              </Field>
            </div>
          ))}
          <YesNo id="hasSpecialNeedsDep" value={data.hasSpecialNeedsDep} onChange={onChange}
            label="Do any dependents have special needs requiring long-term financial support?" />
        </div>
      )}

      <hr className="divider" />
      <YesNo id="supportingParents" value={data.supportingParents} onChange={onChange}
        label="Do you anticipate financially supporting aging parents?" />
      <div className="mt-4" />
      <YesNo id="divorceProceeding" value={data.divorceProceeding} onChange={onChange}
        label="Are you currently involved in a divorce proceeding?" />

      {(data.divorceProceeding === 'yes' || data.maritalStatus === 'Divorced' || data.maritalStatus === 'Separated') && (
        <div className="form-grid mt-4">
          <Field label="Alimony Paid (annual)" id="alimonyPaid">
            <Input id="alimonyPaid" type="number" value={data.alimonyPaid} onChange={onChange} placeholder="$0" />
          </Field>
          <Field label="Alimony Received (annual)" id="alimonyReceived">
            <Input id="alimonyReceived" type="number" value={data.alimonyReceived} onChange={onChange} placeholder="$0" />
          </Field>
          <Field label="Child Support Paid (annual)" id="childSupportPaid">
            <Input id="childSupportPaid" type="number" value={data.childSupportPaid} onChange={onChange} placeholder="$0" />
          </Field>
          <Field label="Child Support Received (annual)" id="childSupportReceived">
            <Input id="childSupportReceived" type="number" value={data.childSupportReceived} onChange={onChange} placeholder="$0" />
          </Field>
        </div>
      )}

      <hr className="divider" />
      <div className="form-section-title">Other Professional Advisors</div>
      <div className="form-grid">
        <Field label="Attorney Name" id="attorney_name">
          <Input id="attorney_name" value={data.attorney_name} onChange={onChange} placeholder="Name / Firm" />
        </Field>
        <Field label="Attorney Phone" id="attorney_phone">
          <Input id="attorney_phone" type="tel" value={data.attorney_phone} onChange={onChange} />
        </Field>
        <Field label="CPA / Tax Preparer Name" id="cpa_name">
          <Input id="cpa_name" value={data.cpa_name} onChange={onChange} placeholder="Name / Firm" />
        </Field>
        <Field label="CPA Phone" id="cpa_phone">
          <Input id="cpa_phone" type="tel" value={data.cpa_phone} onChange={onChange} />
        </Field>
        <Field label="Insurance Agent" id="insurance_agent">
          <Input id="insurance_agent" value={data.insurance_agent} onChange={onChange} placeholder="Name / Agency" />
        </Field>
      </div>
    </>
  );
}

function StepEmployment({ data, onChange }) {
  const selfEmployed = data.employmentStatus === 'Self-Employed / Business Owner';
  const isRetired = data.employmentStatus === 'Retired';

  return (
    <>
      <div className="form-section-title">💼 Client Employment</div>
      <div className="form-grid">
        <Field label="Employment Status" id="employmentStatus" required>
          <Select id="employmentStatus" value={data.employmentStatus} onChange={onChange} options={EMPLOYMENT_STATUS} />
        </Field>
        {!isRetired && (
          <>
            <Field label="Employer Name" id="employer">
              <Input id="employer" value={data.employer} onChange={onChange} />
            </Field>
            <Field label="Job Title" id="jobTitle">
              <Input id="jobTitle" value={data.jobTitle} onChange={onChange} />
            </Field>
            <Field label="Years with Current Employer" id="yearsWithEmployer">
              <Input id="yearsWithEmployer" type="number" value={data.yearsWithEmployer} onChange={onChange} placeholder="e.g. 5" />
            </Field>
            <Field label="Annual Base Salary / Wages (gross)" id="baseSalary">
              <Input id="baseSalary" type="number" value={data.baseSalary} onChange={onChange} placeholder="$" />
            </Field>
            <Field label="Annual Bonus (estimated)" id="bonus">
              <Input id="bonus" type="number" value={data.bonus} onChange={onChange} placeholder="$0" />
            </Field>
            {selfEmployed && (
              <Field label="Net Self-Employment Income" id="selfEmployIncome">
                <Input id="selfEmployIncome" type="number" value={data.selfEmployIncome} onChange={onChange} placeholder="$" />
              </Field>
            )}
          </>
        )}
      </div>

      {data.hasCoClient === 'yes' && (
        <>
          <hr className="divider" />
          <div className="form-section-title">💼 Co-Client Employment</div>
          <div className="form-grid">
            <Field label="Employment Status" id="co_employmentStatus">
              <Select id="co_employmentStatus" value={data.co_employmentStatus} onChange={onChange} options={EMPLOYMENT_STATUS} />
            </Field>
            <Field label="Employer Name" id="co_employer">
              <Input id="co_employer" value={data.co_employer} onChange={onChange} />
            </Field>
            <Field label="Job Title" id="co_jobTitle">
              <Input id="co_jobTitle" value={data.co_jobTitle} onChange={onChange} />
            </Field>
            <Field label="Annual Base Salary (gross)" id="co_baseSalary">
              <Input id="co_baseSalary" type="number" value={data.co_baseSalary} onChange={onChange} placeholder="$" />
            </Field>
          </div>
        </>
      )}

      <hr className="divider" />
      <div className="form-section-title">Other Income Sources</div>
      <div className="form-grid">
        <Field label="Rental Income (gross annual)" id="rentalIncome">
          <Input id="rentalIncome" type="number" value={data.rentalIncome} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Dividend & Interest Income (estimated)" id="dividendInterest">
          <Input id="dividendInterest" type="number" value={data.dividendInterest} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Pension Income (gross annual)" id="pensionIncome">
          <Input id="pensionIncome" type="number" value={data.pensionIncome} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Social Security Income (current or expected)" id="ssIncome">
          <Input id="ssIncome" type="number" value={data.ssIncome} onChange={onChange} placeholder="$0 annual" />
        </Field>
        <Field label="Annuity Income (annual)" id="annuityIncome">
          <Input id="annuityIncome" type="number" value={data.annuityIncome} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Other Income (describe below)" id="otherIncome">
          <Input id="otherIncome" type="number" value={data.otherIncome} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Other Income Description" id="otherIncomeDesc" >
          <Input id="otherIncomeDesc" value={data.otherIncomeDesc} onChange={onChange} placeholder="Trust distributions, disability, etc." />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">Employee Benefits</div>
      <div className="form-grid">
        <Field label="Employer Retirement Plan Type" id="retirementPlanType">
          <Select id="retirementPlanType" value={data.retirementPlanType} onChange={onChange} options={RETIREMENT_PLAN_TYPES} />
        </Field>
        <Field label="Employee Contribution (%)" id="employeeContribPct">
          <Input id="employeeContribPct" type="number" value={data.employeeContribPct} onChange={onChange} placeholder="e.g. 6" />
        </Field>
        <Field label="Employer Match (% of salary)" id="employerMatch">
          <Input id="employerMatch" type="number" value={data.employerMatch} onChange={onChange} placeholder="e.g. 3" />
        </Field>
        <Field label="Employer Life Insurance (face value)" id="empLifeInsurance">
          <Input id="empLifeInsurance" type="number" value={data.empLifeInsurance} onChange={onChange} placeholder="$0" />
        </Field>
      </div>
      <div className="mt-4">
        <YesNo id="hasStockOptions" value={data.hasStockOptions} onChange={onChange}
          label="Do you have stock options, RSUs, or equity compensation?" />
        {data.hasStockOptions === 'yes' && (
          <div className="mt-4 form-grid full">
            <Field label="Equity Compensation Details" id="stockDetails">
              <textarea id="stockDetails" value={data.stockDetails} onChange={e => onChange('stockDetails', e.target.value)}
                placeholder="Type (RSU/ISO/NSO), grant dates, strike prices, vesting schedule…" />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="hasHSA" value={data.hasHSA} onChange={onChange}
          label="Do you have an HSA or FSA?" />
        {data.hasHSA === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Annual HSA/FSA Contribution" id="hsaContrib">
              <Input id="hsaContrib" type="number" value={data.hsaContrib} onChange={onChange} placeholder="$" />
            </Field>
          </div>
        )}
      </div>

      <hr className="divider" />
      <div className="form-section-title">Monthly Cash Flow Snapshot</div>
      <div className="form-grid">
        <Field label="Gross Monthly Income (all sources)" id="grossMonthlyIncome">
          <Input id="grossMonthlyIncome" type="number" value={data.grossMonthlyIncome} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Net Monthly Take-Home Pay" id="netMonthlyIncome">
          <Input id="netMonthlyIncome" type="number" value={data.netMonthlyIncome} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Fixed Monthly Expenses (rent/mortgage, insurance, debt)" id="fixedMonthlyExpenses">
          <Input id="fixedMonthlyExpenses" type="number" value={data.fixedMonthlyExpenses} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Variable Monthly Expenses (food, transport, lifestyle)" id="variableMonthlyExpenses">
          <Input id="variableMonthlyExpenses" type="number" value={data.variableMonthlyExpenses} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Monthly Savings / Investments" id="monthlySavings">
          <Input id="monthlySavings" type="number" value={data.monthlySavings} onChange={onChange} placeholder="$" />
        </Field>
      </div>
    </>
  );
}

function StepAssets({ data, onChange }) {
  return (
    <>
      <div className="form-section-title">💵 Cash & Cash Equivalents</div>
      <div className="form-grid">
        <Field label="Checking Account(s) — Total Balance" id="checkingBalance">
          <Input id="checkingBalance" type="number" value={data.checkingBalance} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Savings Account(s) — Total Balance" id="savingsBalance">
          <Input id="savingsBalance" type="number" value={data.savingsBalance} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Money Market Accounts — Total Balance" id="mmBalance">
          <Input id="mmBalance" type="number" value={data.mmBalance} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="CDs — Total Balance" id="cdBalance">
          <Input id="cdBalance" type="number" value={data.cdBalance} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Emergency Fund (months of expenses)" id="emergencyFundMonths">
          <Select id="emergencyFundMonths" value={data.emergencyFundMonths} onChange={onChange}
            options={['None', 'Less than 1 month', '1–2 months', '3–5 months', '6–11 months', '12+ months']} />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">📈 Investment & Retirement Accounts</div>
      <div className="info-box">List your most significant accounts. You can add more detail during our meeting or via your account statements.</div>

      {[0, 1, 2].map(i => (
        <div key={i} className="form-grid" style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '14px', marginBottom: 10 }}>
          <div style={{ gridColumn: 'span 2', fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>Account {i + 1}</div>
          <Field label="Account Type" id={`acct_type_${i}`}>
            <Select id={`acct_type_${i}`} value={data[`acct_type_${i}`] || ''} onChange={onChange} options={ASSET_ACCOUNT_TYPES} />
          </Field>
          <Field label="Institution / Custodian" id={`acct_inst_${i}`}>
            <Input id={`acct_inst_${i}`} value={data[`acct_inst_${i}`] || ''} onChange={onChange} placeholder="Fidelity, Vanguard, etc." />
          </Field>
          <Field label="Approximate Balance" id={`acct_bal_${i}`}>
            <Input id={`acct_bal_${i}`} type="number" value={data[`acct_bal_${i}`] || ''} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Primary Beneficiary" id={`acct_bene_${i}`}>
            <Input id={`acct_bene_${i}`} value={data[`acct_bene_${i}`] || ''} onChange={onChange} placeholder="Name (or N/A)" />
          </Field>
        </div>
      ))}

      <hr className="divider" />
      <div className="form-section-title">🏡 Real Estate</div>
      <div className="form-grid">
        <Field label="Primary Residence — Estimated Value" id="primaryHomeValue">
          <Input id="primaryHomeValue" type="number" value={data.primaryHomeValue} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Purchase Price" id="primaryHomePurchasePrice">
          <Input id="primaryHomePurchasePrice" type="number" value={data.primaryHomePurchasePrice} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Purchase Date" id="primaryHomePurchaseDate">
          <Input id="primaryHomePurchaseDate" type="date" value={data.primaryHomePurchaseDate} onChange={onChange} />
        </Field>
      </div>
      <div className="mt-4">
        <YesNo id="hasInvestmentProperty" value={data.hasInvestmentProperty} onChange={onChange}
          label="Do you own investment or rental property?" />
        {data.hasInvestmentProperty === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Investment Property Estimated Value" id="investPropValue">
              <Input id="investPropValue" type="number" value={data.investPropValue} onChange={onChange} placeholder="$" />
            </Field>
            <Field label="Monthly Rental Income" id="investPropRent">
              <Input id="investPropRent" type="number" value={data.investPropRent} onChange={onChange} placeholder="$" />
            </Field>
            <Field label="Mortgage Balance (if any)" id="investPropMortgage">
              <Input id="investPropMortgage" type="number" value={data.investPropMortgage} onChange={onChange} placeholder="$0" />
            </Field>
          </div>
        )}
      </div>

      <hr className="divider" />
      <div className="form-section-title">🏢 Business Interests</div>
      <YesNo id="ownsBusiness" value={data.ownsBusiness} onChange={onChange} label="Do you own a business (fully or partially)?" />
      {data.ownsBusiness === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Business Type" id="businessType">
            <Select id="businessType" value={data.businessType} onChange={onChange}
              options={['Sole Proprietorship', 'LLC', 'S-Corp', 'C-Corp', 'Partnership']} />
          </Field>
          <Field label="Estimated Business Value" id="businessValue">
            <Input id="businessValue" type="number" value={data.businessValue} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Exit Strategy" id="exitStrategy">
            <Select id="exitStrategy" value={data.exitStrategy} onChange={onChange}
              options={['Sell to Third Party', 'Pass to Heirs', 'ESOP', 'Management Buyout', 'Wind Down', 'Not Yet Determined']} />
          </Field>
          <Field label="Buy-Sell Agreement in Place?" id="hasBuySell">
            <Select id="hasBuySell" value={data.hasBuySell} onChange={onChange} options={['yes', 'no', 'in progress']} />
          </Field>
        </div>
      )}

      <hr className="divider" />
      <div className="form-section-title">Other Assets</div>
      <div className="form-grid">
        <Field label="Vehicles — Total Estimated Value" id="vehicles">
          <Input id="vehicles" type="number" value={data.vehicles} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Collectibles / Art / Jewelry (est.)" id="collectibles">
          <Input id="collectibles" type="number" value={data.collectibles} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Life Insurance Cash Value (total)" id="lifeInsCV">
          <Input id="lifeInsCV" type="number" value={data.lifeInsCV} onChange={onChange} placeholder="$0" />
        </Field>
      </div>
      <div className="mt-4">
        <YesNo id="has529" value={data.has529} onChange={onChange} label="Do you have 529 or other education savings accounts?" />
        {data.has529 === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="529 Balance" id="savings529Balance">
              <Input id="savings529Balance" type="number" value={data.savings529Balance} onChange={onChange} placeholder="$" />
            </Field>
            <Field label="Beneficiary Name" id="savings529Beneficiary">
              <Input id="savings529Beneficiary" value={data.savings529Beneficiary} onChange={onChange} />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="hasCrypto" value={data.hasCrypto} onChange={onChange} label="Do you hold cryptocurrency?" />
        {data.hasCrypto === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Approximate Crypto Value" id="cryptoValue">
              <Input id="cryptoValue" type="number" value={data.cryptoValue} onChange={onChange} placeholder="$" />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <Field label="Are you expecting an inheritance? (approximate amount and timeline)" id="expectedInheritance">
          <Input id="expectedInheritance" value={data.expectedInheritance} onChange={onChange} placeholder="Optional — e.g., $250k within 5 years" />
        </Field>
      </div>
    </>
  );
}

function StepLiabilities({ data, onChange }) {
  return (
    <>
      <div className="form-section-title">🏠 Mortgage</div>
      <div className="form-grid">
        <Field label="Lender" id="mortgage_lender">
          <Input id="mortgage_lender" value={data.mortgage_lender} onChange={onChange} placeholder="Bank / Servicer name" />
        </Field>
        <Field label="Current Balance" id="mortgage_balance">
          <Input id="mortgage_balance" type="number" value={data.mortgage_balance} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Monthly Payment (P&I)" id="mortgage_payment">
          <Input id="mortgage_payment" type="number" value={data.mortgage_payment} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Interest Rate (%)" id="mortgage_rate">
          <Input id="mortgage_rate" type="number" value={data.mortgage_rate} onChange={onChange} placeholder="e.g. 6.5" />
        </Field>
        <Field label="Loan Type" id="mortgage_type">
          <Select id="mortgage_type" value={data.mortgage_type} onChange={onChange} options={['Fixed', 'ARM', 'Interest-Only']} />
        </Field>
        <Field label="Remaining Term (years)" id="mortgage_term">
          <Input id="mortgage_term" type="number" value={data.mortgage_term} onChange={onChange} placeholder="e.g. 27" />
        </Field>
      </div>
      <div className="mt-4">
        <YesNo id="hasHELOC" value={data.hasHELOC} onChange={onChange} label="Do you have a HELOC or home equity loan?" />
        {data.hasHELOC === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="HELOC Balance" id="helocBalance">
              <Input id="helocBalance" type="number" value={data.helocBalance} onChange={onChange} placeholder="$" />
            </Field>
            <Field label="HELOC Rate (%)" id="helocRate">
              <Input id="helocRate" type="number" value={data.helocRate} onChange={onChange} placeholder="%" />
            </Field>
          </div>
        )}
      </div>

      <hr className="divider" />
      <div className="form-section-title">🚗 Vehicle Loans</div>
      <div className="form-grid">
        <Field label="Total Vehicle Loan Balance" id="carLoan_balance">
          <Input id="carLoan_balance" type="number" value={data.carLoan_balance} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Monthly Payment" id="carLoan_payment">
          <Input id="carLoan_payment" type="number" value={data.carLoan_payment} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Interest Rate (%)" id="carLoan_rate">
          <Input id="carLoan_rate" type="number" value={data.carLoan_rate} onChange={onChange} placeholder="%" />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">🎓 Student Loans</div>
      <div className="form-grid">
        <Field label="Total Student Loan Balance" id="studentLoan_balance">
          <Input id="studentLoan_balance" type="number" value={data.studentLoan_balance} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Monthly Payment" id="studentLoan_payment">
          <Input id="studentLoan_payment" type="number" value={data.studentLoan_payment || ''} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Interest Rate (%)" id="studentLoan_rate">
          <Input id="studentLoan_rate" type="number" value={data.studentLoan_rate} onChange={onChange} placeholder="%" />
        </Field>
        <Field label="Loan Type" id="studentLoan_type">
          <Select id="studentLoan_type" value={data.studentLoan_type} onChange={onChange}
            options={['Federal', 'Private', 'Mixed']} />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">💳 Credit Card Debt</div>
      <div className="form-grid">
        <Field label="Total Credit Card Balance" id="creditCard_balance">
          <Input id="creditCard_balance" type="number" value={data.creditCard_balance} onChange={onChange} placeholder="$0" />
        </Field>
        <Field label="Average Interest Rate (%)" id="creditCard_rate">
          <Input id="creditCard_rate" type="number" value={data.creditCard_rate} onChange={onChange} placeholder="%" />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">Other Debt</div>
      <div className="form-grid full">
        <Field label="Other debt (personal loans, IRS installment, co-signed, business loans)" id="otherDebt">
          <textarea id="otherDebt" value={data.otherDebt} onChange={e => onChange('otherDebt', e.target.value)}
            placeholder="Describe type, balance, and monthly payment for each…" />
        </Field>
      </div>
    </>
  );
}

function StepInsurance({ data, onChange }) {
  return (
    <>
      <div className="form-section-title">🛡️ Life Insurance</div>
      <YesNo id="hasTermLife" value={data.hasTermLife} onChange={onChange} label="Do you have term life insurance?" />
      {data.hasTermLife === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Face Value (Death Benefit)" id="termLifeFaceValue">
            <Input id="termLifeFaceValue" type="number" value={data.termLifeFaceValue} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Annual Premium" id="termLifePremium">
            <Input id="termLifePremium" type="number" value={data.termLifePremium} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Primary Beneficiary" id="termLifeBeneficiary">
            <Input id="termLifeBeneficiary" value={data.termLifeBeneficiary} onChange={onChange} />
          </Field>
        </div>
      )}
      <div className="mt-4" />
      <YesNo id="hasPermLife" value={data.hasPermLife} onChange={onChange}
        label="Do you have permanent life insurance (whole, universal, variable)?" />
      {data.hasPermLife === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Policy Type" id="permLifeType">
            <Select id="permLifeType" value={data.permLifeType} onChange={onChange}
              options={['Whole Life', 'Universal Life', 'Variable Universal Life', 'Indexed Universal Life']} />
          </Field>
          <Field label="Face Value (Death Benefit)" id="permLifeFaceValue">
            <Input id="permLifeFaceValue" type="number" value={data.permLifeFaceValue} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Cash Value" id="permLifeCV">
            <Input id="permLifeCV" type="number" value={data.permLifeCV} onChange={onChange} placeholder="$" />
          </Field>
        </div>
      )}

      <hr className="divider" />
      <div className="form-section-title">🏥 Disability Insurance</div>
      <YesNo id="hasDisability" value={data.hasDisability} onChange={onChange}
        label="Do you have disability insurance (employer-provided or individual)?" />
      {data.hasDisability === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Monthly Benefit Amount" id="disBenefitAmount">
            <Input id="disBenefitAmount" type="number" value={data.disBenefitAmount} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Benefit Period" id="disBenefitPeriod">
            <Select id="disBenefitPeriod" value={data.disBenefitPeriod} onChange={onChange}
              options={['2 years', '5 years', 'To Age 65', 'To Age 67', 'Lifetime']} />
          </Field>
          <Field label="Elimination Period" id="disElimPeriod">
            <Select id="disElimPeriod" value={data.disElimPeriod} onChange={onChange}
              options={['30 days', '60 days', '90 days', '180 days', '1 year']} />
          </Field>
          <Field label="Definition of Disability" id="disOccDef">
            <Select id="disOccDef" value={data.disOccDef} onChange={onChange}
              options={['Own-Occupation', 'Any-Occupation', 'Modified Own-Occupation']} />
          </Field>
        </div>
      )}

      <hr className="divider" />
      <div className="form-section-title">Long-Term Care Insurance</div>
      <YesNo id="hasLTC" value={data.hasLTC} onChange={onChange} label="Do you have long-term care insurance?" />
      {data.hasLTC === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Daily / Monthly Benefit" id="ltcDailyBenefit">
            <Input id="ltcDailyBenefit" type="number" value={data.ltcDailyBenefit} onChange={onChange} placeholder="$" />
          </Field>
          <Field label="Benefit Period" id="ltcBenefitPeriod">
            <Select id="ltcBenefitPeriod" value={data.ltcBenefitPeriod} onChange={onChange}
              options={['2 years', '3 years', '5 years', 'Lifetime']} />
          </Field>
        </div>
      )}

      <hr className="divider" />
      <div className="form-section-title">Health & Property Insurance</div>
      <div className="form-grid">
        <Field label="Health Insurance Carrier" id="healthInsCarrier">
          <Input id="healthInsCarrier" value={data.healthInsCarrier} onChange={onChange} placeholder="Carrier name" />
        </Field>
        <Field label="Health Insurance Type" id="healthInsType">
          <Select id="healthInsType" value={data.healthInsType} onChange={onChange}
            options={['Employer-Sponsored', 'Marketplace / ACA', 'Medicare', 'Medicaid', 'COBRA', 'Individual / Private']} />
        </Field>
        <Field label="Annual Deductible" id="healthDeductible">
          <Input id="healthDeductible" type="number" value={data.healthDeductible} onChange={onChange} placeholder="$" />
        </Field>
      </div>
      <div className="mt-4">
        <YesNo id="hasUmbrella" value={data.hasUmbrella} onChange={onChange} label="Do you have an umbrella liability policy?" />
        {data.hasUmbrella === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Umbrella Coverage Amount" id="umbrellaAmount">
              <Input id="umbrellaAmount" type="number" value={data.umbrellaAmount} onChange={onChange} placeholder="e.g. 1000000" />
            </Field>
          </div>
        )}
      </div>
      <div className="form-grid mt-4">
        <Field label="Homeowners Insurance Carrier" id="homeInsCarrier">
          <Input id="homeInsCarrier" value={data.homeInsCarrier} onChange={onChange} placeholder="Carrier name" />
        </Field>
        <Field label="Dwelling Coverage Amount" id="homeInsCoverage">
          <Input id="homeInsCoverage" type="number" value={data.homeInsCoverage} onChange={onChange} placeholder="$" />
        </Field>
      </div>
    </>
  );
}

function StepEstate({ data, onChange }) {
  return (
    <>
      <div className="info-box">
        These questions help identify gaps in your estate plan. This information is confidential and used solely for planning purposes.
      </div>
      <div className="form-section-title">📜 Estate Planning Documents</div>
      <div className="form-grid full" style={{ gap: 12 }}>
        <YesNo id="hasWill" value={data.hasWill} onChange={onChange} label="Do you have a will?" />
        {data.hasWill === 'yes' && (
          <div className="form-grid">
            <Field label="Date Executed" id="willDate">
              <Input id="willDate" type="date" value={data.willDate} onChange={onChange} />
            </Field>
            <Field label="Drafting Attorney" id="willAttorney">
              <Input id="willAttorney" value={data.willAttorney} onChange={onChange} />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="hasRevTrust" value={data.hasRevTrust} onChange={onChange} label="Do you have a revocable living trust?" />
        {data.hasRevTrust === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Date Executed" id="revTrustDate">
              <Input id="revTrustDate" type="date" value={data.revTrustDate} onChange={onChange} />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="hasDurablePOA" value={data.hasDurablePOA} onChange={onChange} label="Do you have a durable power of attorney for finances?" />
        {data.hasDurablePOA === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="POA Designee Name" id="durablePOAName">
              <Input id="durablePOAName" value={data.durablePOAName} onChange={onChange} />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="hasHealthcarePOA" value={data.hasHealthcarePOA} onChange={onChange} label="Do you have a healthcare power of attorney / healthcare proxy?" />
        {data.hasHealthcarePOA === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Healthcare POA Designee" id="healthcarePOAName">
              <Input id="healthcarePOAName" value={data.healthcarePOAName} onChange={onChange} />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="hasAdvDirective" value={data.hasAdvDirective} onChange={onChange} label="Do you have an advance directive / living will?" />
        <div className="mt-4" />
        <YesNo id="hasIrrevTrust" value={data.hasIrrevTrust} onChange={onChange} label="Do you have any irrevocable trusts?" />
        {data.hasIrrevTrust === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Trust Type" id="irrevTrustType">
              <Select id="irrevTrustType" value={data.irrevTrustType} onChange={onChange}
                options={['Irrevocable Life Insurance Trust (ILIT)', 'Charitable Remainder Trust', 'Special Needs Trust', 'Asset Protection Trust', 'GRAT / SLAT / IDGT', 'Other']} />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <Field label="Are beneficiary designations on all retirement accounts and life insurance up to date?" id="beneficiariesCurrent">
          <Select id="beneficiariesCurrent" value={data.beneficiariesCurrent} onChange={onChange}
            options={['Yes, all are current', 'Some may be outdated', 'No / Not sure']} placeholder="Select…" />
        </Field>
        <div className="mt-4" />
        <Field label="Estimated gross estate value (approximate)" id="estateValue">
          <Select id="estateValue" value={data.estateValue} onChange={onChange}
            options={['Under $1M', '$1M – $3M', '$3M – $5M', '$5M – $10M', '$10M – $20M', 'Over $20M']} />
        </Field>
        <div className="mt-4" />
        <YesNo id="estateIsHighPriority" value={data.estateIsHighPriority} onChange={onChange}
          label="Is estate planning a high priority for you right now?" />
      </div>
    </>
  );
}

function StepTaxes({ data, onChange }) {
  return (
    <>
      <div className="form-section-title">🧾 Tax Situation</div>
      <div className="form-grid">
        <Field label="Federal Filing Status" id="filingStatus" required>
          <Select id="filingStatus" value={data.filingStatus} onChange={onChange} options={FILING_STATUS} />
        </Field>
        <Field label="State of Primary Residence" id="residenceState">
          <Input id="residenceState" value={data.residenceState} onChange={onChange} placeholder="e.g. California" />
        </Field>
        <Field label="Estimated Current Federal Tax Bracket" id="taxBracket">
          <Select id="taxBracket" value={data.taxBracket} onChange={onChange} options={TAX_BRACKETS} />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">Tax Profile Questions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <YesNo id="owesBackTaxes" value={data.owesBackTaxes} onChange={onChange}
          label="Do you owe back taxes or have an IRS payment installment agreement?" />
        <YesNo id="incomeChangeExpected" value={data.incomeChangeExpected} onChange={onChange}
          label="Do you expect a significant income change this year (job change, retirement, sale of asset)?" />
        <YesNo id="subjectToAMT" value={data.subjectToAMT} onChange={onChange}
          label="Have you ever been subject to the Alternative Minimum Tax (AMT)?" />
        <YesNo id="hasCapGains" value={data.hasCapGains} onChange={onChange}
          label="Do you have significant unrealized capital gains (or losses) in taxable accounts?" />
        <YesNo id="hasNOL" value={data.hasNOL} onChange={onChange}
          label="Do you have net operating loss (NOL) carryforwards?" />
        <YesNo id="charitableContribs" value={data.charitableContribs} onChange={onChange}
          label="Do you make regular charitable contributions?" />
        {data.charitableContribs === 'yes' && (
          <div className="form-grid">
            <Field label="Charitable Giving Method" id="charitableType">
              <Select id="charitableType" value={data.charitableType} onChange={onChange}
                options={['Cash / Check', 'Donor-Advised Fund (DAF)', 'Appreciated Securities', 'Qualified Charitable Distribution (QCD)', 'Combination']} />
            </Field>
          </div>
        )}
        <YesNo id="hasK1" value={data.hasK1} onChange={onChange}
          label="Do you receive K-1 income from a partnership, S-corp, or trust?" />
        <YesNo id="hasDoneRothConv" value={data.hasDoneRothConv} onChange={onChange}
          label="Have you done Roth IRA conversions in prior years?" />
      </div>
    </>
  );
}

function StepGoals({ data, onChange }) {
  return (
    <>
      <div className="form-section-title">🎯 Retirement Goals</div>
      <div className="form-grid">
        <Field label="Target Retirement Age (Client)" id="retireAge">
          <Input id="retireAge" type="number" value={data.retireAge} onChange={onChange} placeholder="e.g. 62" />
        </Field>
        {data.hasCoClient === 'yes' && (
          <Field label="Target Retirement Age (Co-Client)" id="co_retireAge">
            <Input id="co_retireAge" type="number" value={data.co_retireAge} onChange={onChange} placeholder="e.g. 60" />
          </Field>
        )}
        <Field label="Monthly Income Needed in Retirement (today's dollars)" id="retirementMonthlyIncome">
          <Input id="retirementMonthlyIncome" type="number" value={data.retirementMonthlyIncome} onChange={onChange} placeholder="$" />
        </Field>
        <Field label="Where do you plan to live in retirement?" id="retirementLocation">
          <Select id="retirementLocation" value={data.retirementLocation} onChange={onChange}
            options={['Current home / area', 'Downsize locally', 'Different state (lower cost)', 'Abroad', 'Not yet decided']} />
        </Field>
      </div>
      <div className="mt-4">
        <YesNo id="partTimeInRetirement" value={data.partTimeInRetirement} onChange={onChange}
          label="Do you plan to work part-time in retirement?" />
        {data.partTimeInRetirement === 'yes' && (
          <div className="form-grid mt-4">
            <Field label="Estimated Part-Time Annual Income" id="partTimeIncome">
              <Input id="partTimeIncome" type="number" value={data.partTimeIncome} onChange={onChange} placeholder="$" />
            </Field>
            <Field label="For How Many Years?" id="partTimeYears">
              <Input id="partTimeYears" type="number" value={data.partTimeYears} onChange={onChange} placeholder="e.g. 5" />
            </Field>
          </div>
        )}
        <div className="mt-4" />
        <YesNo id="retirementHealthcareConcern" value={data.retirementHealthcareConcern} onChange={onChange}
          label="Are you significantly concerned about healthcare costs in retirement?" />
        <div className="mt-4" />
        <YesNo id="wantsToLeaveAssets" value={data.wantsToLeaveAssets} onChange={onChange}
          label="Is leaving assets to heirs or charity important to you?" />
      </div>

      <hr className="divider" />
      <div className="form-section-title">Education Funding</div>
      <YesNo id="savingForEducation" value={data.savingForEducation} onChange={onChange}
        label="Are you saving for a child's or grandchild's education?" />
      {data.savingForEducation === 'yes' && (
        <div className="form-grid full mt-4">
          <Field label="Education Funding Details" id="educationDetails">
            <textarea id="educationDetails" value={data.educationDetails}
              onChange={e => onChange('educationDetails', e.target.value)}
              placeholder="For each child: name, age, target school type (public/private/in-state), start year, how much you want to fund (100% / partial)…" />
          </Field>
        </div>
      )}

      <hr className="divider" />
      <div className="form-section-title">Major Purchases & Life Events (Next 5–10 Years)</div>
      <YesNo id="planningHomePurchase" value={data.planningHomePurchase} onChange={onChange}
        label="Are you planning a home purchase, major renovation, or second home?" />
      {data.planningHomePurchase === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Timeline" id="homePurchaseTimeline">
            <Select id="homePurchaseTimeline" value={data.homePurchaseTimeline} onChange={onChange}
              options={['Within 1 year', '1–3 years', '3–5 years', '5–10 years']} />
          </Field>
          <Field label="Estimated Cost" id="homePurchaseCost">
            <Input id="homePurchaseCost" type="number" value={data.homePurchaseCost} onChange={onChange} placeholder="$" />
          </Field>
        </div>
      )}
      <div className="form-grid full mt-4">
        <Field label="Other anticipated major expenses (wedding, business purchase, vehicle, gifting, other)" id="bigOneTimeExpenses">
          <textarea id="bigOneTimeExpenses" value={data.bigOneTimeExpenses}
            onChange={e => onChange('bigOneTimeExpenses', e.target.value)}
            placeholder="Describe the item, estimated cost, and timeline…" />
        </Field>
      </div>

      <hr className="divider" />
      <div className="form-section-title">Debt & Legacy Goals</div>
      <YesNo id="debtPayoffGoal" value={data.debtPayoffGoal} onChange={onChange}
        label="Do you have a specific goal to pay off particular debt?" />
      {data.debtPayoffGoal === 'yes' && (
        <div className="form-grid full mt-4">
          <Field label="Which debt and by when?" id="debtPayoffTarget">
            <Input id="debtPayoffTarget" value={data.debtPayoffTarget} onChange={onChange} placeholder="e.g. Mortgage by age 60" />
          </Field>
        </div>
      )}
      <div className="mt-4" />
      <YesNo id="legacyImportant" value={data.legacyImportant} onChange={onChange}
        label="Is leaving a financial legacy to heirs important to you?" />
      {data.legacyImportant === 'yes' && (
        <div className="form-grid mt-4">
          <Field label="Approximate Legacy Goal (today's dollars)" id="legacyAmount">
            <Input id="legacyAmount" type="number" value={data.legacyAmount} onChange={onChange} placeholder="$" />
          </Field>
        </div>
      )}
      <div className="mt-4" />
      <YesNo id="charitableGoal" value={data.charitableGoal} onChange={onChange}
        label="Do you have charitable giving or philanthropic goals?" />

      <hr className="divider" />
      <div className="form-section-title">Your Priorities in Your Own Words</div>
      <div className="form-grid full" style={{ gap: 16 }}>
        <Field label="What is your single biggest financial concern today?" id="biggestConcern" required>
          <textarea id="biggestConcern" value={data.biggestConcern}
            onChange={e => onChange('biggestConcern', e.target.value)}
            placeholder="Be as specific or as general as you'd like — there are no wrong answers." />
        </Field>
        <Field label="What does 'financial success' mean to you personally?" id="financialSuccess">
          <textarea id="financialSuccess" value={data.financialSuccess}
            onChange={e => onChange('financialSuccess', e.target.value)}
            placeholder="Describe in your own words what a successful financial outcome looks like for your life…" />
        </Field>
        <Field label="Any other financial goals or circumstances not yet captured?" id="otherGoals">
          <textarea id="otherGoals" value={data.otherGoals}
            onChange={e => onChange('otherGoals', e.target.value)}
            placeholder="Optional" />
        </Field>
      </div>
    </>
  );
}

function StepRisk({ data, onChange }) {
  const riskAnswers = data.riskAnswers || {};
  const answeredCount = Object.keys(riskAnswers).length;
  const score = scoreRiskTolerance(riskAnswers);
  const profile = getRiskProfile(score);
  const allAnswered = answeredCount === RISK_QUESTIONS.length;

  const dimensions = [...new Set(RISK_QUESTIONS.map(q => q.dimension))];

  return (
    <>
      <div className="info-box">
        This questionnaire measures three dimensions of your risk profile: <strong>risk willingness</strong> (emotional comfort), <strong>risk capacity</strong> (financial ability), and <strong>behavioral tendencies</strong>. Your advisor will discuss all results with you — scores inform but never automatically dictate your investment strategy.
      </div>

      <div className="progress-bar-wrap" style={{ marginBottom: 4 }}>
        <div className="progress-bar-fill" style={{ width: `${(answeredCount / RISK_QUESTIONS.length) * 100}%` }} />
      </div>
      <div className="step-indicator">{answeredCount} of {RISK_QUESTIONS.length} questions answered</div>

      {dimensions.map(dim => (
        <div key={dim}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, marginTop: 8 }}>{dim}</div>
          {RISK_QUESTIONS.filter(q => q.dimension === dim).map(q => (
            <div key={q.id} className="risk-question-card">
              <span className="dimension-badge">{dim}</span>
              <div className="question-text">{q.question}</div>
              {q.options.map(opt => (
                <label key={opt.score} className={`risk-option ${riskAnswers[q.id] == opt.score ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.score}
                    checked={riskAnswers[q.id] == opt.score}
                    onChange={() => {
                      const updated = { ...riskAnswers, [q.id]: opt.score };
                      onChange('riskAnswers', updated);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      ))}

      {allAnswered && (
        <div className="risk-result" style={{ borderColor: profile.color, background: profile.color + '12' }}>
          <div style={{ color: profile.color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Your Preliminary Risk Profile
          </div>
          <h3 style={{ color: profile.color }}>{profile.label}</h3>
          <p>{profile.description}</p>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--gray-700)' }}>Suggested Starting Allocation</div>
          <div className="allocation-bars">
            {[
              { label: 'Equities', pct: profile.allocation.equities, color: profile.color },
              { label: 'Fixed Income', pct: profile.allocation.fixedIncome, color: '#94a3b8' },
              { label: 'Cash', pct: profile.allocation.cash, color: '#cbd5e1' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="alloc-row">
                <span className="alloc-label">{label}</span>
                <div className="alloc-bar-wrap">
                  <div className="alloc-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="alloc-pct">{pct}%</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14, fontSize: 12, color: 'var(--gray-500)' }}>
            This is a starting-point illustration only. Your advisor will review these results with you in detail and customize your investment policy based on the full planning picture.
          </p>
        </div>
      )}
    </>
  );
}

function StepPriorities({ data, onChange }) {
  const selected = data.planningPriorities || [];
  function togglePriority(item) {
    const updated = selected.includes(item)
      ? selected.filter(i => i !== item)
      : [...selected, item];
    onChange('planningPriorities', updated);
  }

  return (
    <>
      <div className="form-section-title">📌 Planning Priorities</div>
      <div className="text-sm text-muted" style={{ marginBottom: 16 }}>
        Select your top planning priorities (choose as many as apply — we'll rank them together at your first meeting):
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {PLANNING_PRIORITY_OPTIONS.map(item => (
          <label key={item} className={`checkbox-option ${selected.includes(item) ? 'selected' : ''}`}
            style={{ padding: '10px 14px', border: `1.5px solid ${selected.includes(item) ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 8, cursor: 'pointer', background: selected.includes(item) ? 'var(--primary-light)' : '#fff', transition: 'all .15s' }}>
            <input type="checkbox" checked={selected.includes(item)} onChange={() => togglePriority(item)} />
            <span style={{ fontSize: 13 }}>{item}</span>
          </label>
        ))}
      </div>

      <hr className="divider" />
      <div className="form-section-title">Advisor Relationship Preferences</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <YesNo id="previousAdvisor" value={data.previousAdvisor} onChange={onChange}
          label="Have you worked with a financial advisor before?" />
        {data.previousAdvisor === 'yes' && (
          <div className="form-grid full">
            <Field label="What worked well, and what prompted the change?" id="previousAdvisorDetails">
              <textarea id="previousAdvisorDetails" value={data.previousAdvisorDetails}
                onChange={e => onChange('previousAdvisorDetails', e.target.value)}
                placeholder="Optional but helpful for understanding your expectations…" />
            </Field>
          </div>
        )}

        <Field label="What prompted you to seek financial planning services now?" id="whySeeking">
          <textarea id="whySeeking" value={data.whySeeking}
            onChange={e => onChange('whySeeking', e.target.value)}
            placeholder="Life event, referral, specific concern, general planning desire…" style={{ minHeight: 60 }} />
        </Field>

        <div className="form-group">
          <label>How involved do you want to be in investment decisions?</label>
          <div className="radio-group">
            {[
              { v: 'very', l: 'Very involved — I want to approve every significant change' },
              { v: 'moderately', l: 'Moderately involved — discuss major changes with me' },
              { v: 'delegator', l: 'Delegator — I trust your expertise; keep me informed' },
            ].map(({ v, l }) => (
              <label key={v} className="radio-option">
                <input type="radio" name="involvementLevel" value={v} checked={data.involvementLevel === v}
                  onChange={() => onChange('involvementLevel', v)} />
                {l}
              </label>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <Field label="Preferred Meeting Frequency" id="meetingFrequency">
            <Select id="meetingFrequency" value={data.meetingFrequency} onChange={onChange} options={MEETING_FREQUENCY} />
          </Field>
          <Field label="Preferred Meeting Format" id="meetingFormat">
            <Select id="meetingFormat" value={data.meetingFormat} onChange={onChange}
              options={['In-Person', 'Video Call (Zoom / Teams)', 'Phone']} />
          </Field>
          <Field label="Preferred Report / Update Delivery" id="reportPref">
            <Select id="reportPref" value={data.reportPref} onChange={onChange}
              options={['Email', 'Online Client Portal', 'Paper Mail', 'Phone Call Recap']} />
          </Field>
        </div>

        <Field label="ESG / Ethical Investment Preferences" id="esgPreferences">
          <Input id="esgPreferences" value={data.esgPreferences} onChange={onChange}
            placeholder="Any exclusions (tobacco, weapons, fossil fuels) or ESG priorities? Leave blank if none." />
        </Field>

        <Field label="Is anyone else involved in your financial decisions?" id="decisionMakers">
          <Input id="decisionMakers" value={data.decisionMakers} onChange={onChange}
            placeholder="Business partner, adult child, trustee, other? Leave blank if not applicable." />
        </Field>

        <Field label="Any personal circumstances or health situations that may affect your planning?" id="specialCircumstances">
          <textarea id="specialCircumstances" value={data.specialCircumstances}
            onChange={e => onChange('specialCircumstances', e.target.value)}
            placeholder="Completely optional and strictly confidential. This helps us plan sensitively and comprehensively." style={{ minHeight: 60 }} />
        </Field>
      </div>
    </>
  );
}

function StepDocuments({ data, onChange }) {
  const docChecked = data.docChecked || {};
  const requiredDocs = DOCUMENT_CHECKLIST.filter(d => d.priority === 'Required');
  const checkedRequired = requiredDocs.filter(d => docChecked[d.id]).length;

  function toggleDoc(id) {
    onChange('docChecked', { ...docChecked, [id]: !docChecked[id] });
  }

  return (
    <>
      <div className="info-box">
        Please indicate which documents you have available. You will be able to upload them through our secure client portal — your advisor will send a link after you submit this form. Bringing these to your first meeting works too.
      </div>
      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
        {checkedRequired} of {requiredDocs.length} required documents ready
      </div>
      <div className="doc-checklist">
        {DOCUMENT_CHECKLIST.map(doc => (
          <label key={doc.id} className={`doc-item ${docChecked[doc.id] ? 'checked' : ''}`}>
            <input type="checkbox" checked={!!docChecked[doc.id]} onChange={() => toggleDoc(doc.id)} />
            <span className="doc-label">{doc.label}</span>
            <span className={`priority-badge priority-${doc.priority.replace(/ /g, '.')}`}>{doc.priority}</span>
          </label>
        ))}
      </div>

      <hr className="divider" />
      <div className="form-section-title">Additional Notes</div>
      <div className="form-grid full">
        <Field label="Anything else you'd like your advisor to know before your first meeting?" id="additionalNotes">
          <textarea id="additionalNotes" value={data.additionalNotes}
            onChange={e => onChange('additionalNotes', e.target.value)}
            placeholder="Questions, concerns, context, or anything on your mind…"
            style={{ minHeight: 100 }} />
        </Field>
      </div>
    </>
  );
}

// ── Submission Confirmation ───────────────────────────────────────────────────

function SubmitConfirmation({ data, onReset }) {
  const riskScore = scoreRiskTolerance(data.riskAnswers || {});
  const profile = getRiskProfile(riskScore);
  return (
    <div className="confirmation-box">
      <div className="check-icon">✅</div>
      <h2>Thank You, {data.firstName || 'Client'}!</h2>
      <p>Your financial planning intake form has been submitted. Your advisor will review it within 24–48 hours and reach out to schedule your Discovery Meeting.</p>

      {Object.keys(data.riskAnswers || {}).length === RISK_QUESTIONS.length && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 6 }}>Preliminary Risk Profile</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: profile.color }}>{profile.label}</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Your advisor will discuss this in detail at your first meeting.</div>
        </div>
      )}

      <div className="next-steps-list">
        <h4>What happens next:</h4>
        <ol>
          <li>📧 Confirmation email with secure document portal link</li>
          <li>👋 Personalized welcome message from your advisor (within 24 hrs)</li>
          <li>📋 Welcome Packet with engagement agreement and disclosures</li>
          <li>📅 Discovery Meeting scheduled within 7–14 days</li>
          <li>📊 Comprehensive financial plan delivered within 45 days</li>
        </ol>
      </div>

      <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={onReset}>
        Start a New Intake Form
      </button>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(stepId, data) {
  const errors = {};
  if (stepId === 'personal') {
    if (!data.firstName?.trim()) errors.firstName = 'Required';
    if (!data.lastName?.trim()) errors.lastName = 'Required';
    if (!data.dob) errors.dob = 'Required';
    if (!data.email?.trim()) errors.email = 'Required';
    if (!data.mobile?.trim()) errors.mobile = 'Required';
    if (!data.maritalStatus) errors.maritalStatus = 'Required';
    if (!data.address?.trim()) errors.address = 'Required';
    if (!data.city?.trim()) errors.city = 'Required';
    if (!data.state?.trim()) errors.state = 'Required';
    if (!data.zip?.trim()) errors.zip = 'Required';
  }
  if (stepId === 'goals') {
    if (!data.biggestConcern?.trim()) errors.biggestConcern = 'Please share your biggest financial concern';
  }
  return errors;
}

// ── Main IntakeForm Component ─────────────────────────────────────────────────

export default function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = STEPS.length;
  const step = STEPS[currentStep];

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  function goTo(index) {
    const stepErrors = validateStep(step.id, formData);
    if (Object.keys(stepErrors).length > 0 && index > currentStep) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(index);
    setVisitedSteps(prev => new Set([...prev, index]));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNext() { goTo(currentStep + 1); }
  function handlePrev() { goTo(currentStep - 1); }

  function handleSubmit() {
    const stepErrors = validateStep(step.id, formData);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    console.log('Intake form submitted:', formData);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) {
    return (
      <div className="card">
        <SubmitConfirmation data={formData} onReset={() => { setFormData(EMPTY_FORM); setCurrentStep(0); setSubmitted(false); setVisitedSteps(new Set([0])); }} />
      </div>
    );
  }

  const stepProps = { data: formData, onChange: handleChange, errors };
  const stepComponents = {
    personal:   <StepPersonal {...stepProps} />,
    family:     <StepFamily {...stepProps} />,
    employment: <StepEmployment {...stepProps} />,
    assets:     <StepAssets {...stepProps} />,
    liabilities:<StepLiabilities {...stepProps} />,
    insurance:  <StepInsurance {...stepProps} />,
    estate:     <StepEstate {...stepProps} />,
    taxes:      <StepTaxes {...stepProps} />,
    goals:      <StepGoals {...stepProps} />,
    risk:       <StepRisk {...stepProps} />,
    priorities: <StepPriorities {...stepProps} />,
    documents:  <StepDocuments {...stepProps} />,
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>{step.icon} {step.title}</h2>
        <p>Step {currentStep + 1} of {totalSteps} — {Math.round(((currentStep + 1) / totalSteps) * 100)}% complete</p>
      </div>

      <div style={{ padding: '16px 24px 0', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 16, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`step-dot ${i === currentStep ? 'active' : ''} ${visitedSteps.has(i) && i !== currentStep ? 'done' : ''}`}
              onClick={() => visitedSteps.has(i) && goTo(i)}
              title={s.title}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        {stepComponents[step.id]}

        <div className="btn-actions">
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentStep === 0}>
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{step.title}</span>
            {currentStep < totalSteps - 1
              ? <button className="btn btn-primary" onClick={handleNext}>Continue →</button>
              : <button className="btn btn-success" onClick={handleSubmit}>Submit Form ✓</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
