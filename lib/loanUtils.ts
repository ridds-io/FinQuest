// ─── Loan City — Logic & Data Layer ─────────────────────────────────────────
// All pure functions. No React/Phaser imports.

// ── EMI Formula ──────────────────────────────────────────────────────────────
// EMI = P × r × (1+r)^n / ((1+r)^n − 1)
// P = principal, r = monthly rate (annual_rate / 12 / 100), n = months
export function calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (annualRatePct === 0) return Math.round(principal / tenureMonths);
  const r = annualRatePct / 12 / 100;
  const n = tenureMonths;
  const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

export function totalInterestPaid(emi: number, tenureMonths: number, principal: number): number {
  return Math.max(0, emi * tenureMonths - principal);
}

// ── Affordability ─────────────────────────────────────────────────────────────
// Rule: EMI should not exceed 40% of monthly income (standard 'EMI/NMI ratio')
export function isAffordable(monthlyIncome: number, emi: number): boolean {
  return emi / monthlyIncome <= 0.40;
}

export function emiToIncomeRatio(monthlyIncome: number, emi: number): number {
  return Math.round((emi / monthlyIncome) * 100);
}

// ── Debt Classification ───────────────────────────────────────────────────────
export type DebtType = 'productive' | 'wasteful' | 'neutral';

export interface DebtClassification {
  type: DebtType;
  emoji: string;
  label: string;
  explanation: string;
}

export function classifyDebt(type: DebtType): DebtClassification {
  switch (type) {
    case 'productive':
      return {
        type,
        emoji: '📈',
        label: 'Productive Debt',
        explanation: 'This loan builds future value — education, home, or business loans that increase your earning power or net worth.',
      };
    case 'wasteful':
      return {
        type,
        emoji: '📉',
        label: 'Wasteful Debt',
        explanation: 'This loan funds consumption with no lasting value — electronics, vacations, or luxury items you can\'t afford.',
      };
    case 'neutral':
      return {
        type,
        emoji: '⚖️',
        label: 'Neutral Debt',
        explanation: 'Depends on your situation. Could be managed carefully or avoided depending on your income and financial goals.',
      };
  }
}

// ── Scenario Types ────────────────────────────────────────────────────────────
export type LoanDecision = 'take' | 'reject';

export interface LoanScenario {
  id: string;
  title: string;
  context: string;
  amount: number;
  annualRatePct: number;
  tenureMonths: number;
  purpose: string;
  purposeEmoji: string;
  correctDecision: LoanDecision;
  debtType: DebtType;
  feedback: {
    correct: string;
    wrong: string;
    pennyTip: string;
  };
  xp: { correct: number; wrong: number };
}

export interface EMIScenario {
  id: string;
  context: string;
  amount: number;
  annualRatePct: number;
  tenureMonths: number;
  monthlyIncome: number;
  purpose: string;
  purposeEmoji: string;
  feedback: {
    affordable: string;
    notAffordable: string;
    pennyTip: string;
  };
}

export interface DebtScenario {
  id: string;
  title: string;
  context: string;
  loanType: string;
  amount: number;
  purpose: string;
  purposeEmoji: string;
  correctType: DebtType;
  explanation: string;
  pennyTip: string;
  xp: { correct: number; wrong: number };
}

// ── Scenario Data — Loan Decision Game ───────────────────────────────────────
export const LOAN_SCENARIOS: LoanScenario[] = [
  {
    id: 'ls1',
    title: 'Student Education Loan',
    context: 'You got into a top engineering college. Your family can cover ₹2L but fees are ₹8L. A bank offers an education loan.',
    amount: 600000,
    annualRatePct: 8.5,
    tenureMonths: 84, // 7 years
    purpose: 'B.Tech degree at NIT Trichy',
    purposeEmoji: '🎓',
    correctDecision: 'take',
    debtType: 'productive',
    feedback: {
      correct: 'Smart move! Education loans at 8.5% for a premier institution are classic "good debt". An engineering degree will likely give you 10x returns on this investment over your career.',
      wrong: 'This loan was worth taking! Education from a top institution is one of the best investments you can make. Missing this opportunity could cost you far more in the long run.',
      pennyTip: 'Education loans for premier institutions are productive debt — the expected salary increase far outweighs the interest paid! 🎓',
    },
    xp: { correct: 100, wrong: 20 },
  },
  {
    id: 'ls2',
    title: 'Latest Smartphone Loan',
    context: 'Your phone works fine. But the new iPhone 16 Pro is out. You see an offer: 0% EMI for 12 months. Sounds tempting!',
    amount: 80000,
    annualRatePct: 0,
    tenureMonths: 12,
    purpose: 'iPhone 16 Pro (lifestyle upgrade)',
    purposeEmoji: '📱',
    correctDecision: 'reject',
    debtType: 'wasteful',
    feedback: {
      correct: 'Excellent judgment! Even "0% EMI" schemes are often structured into the product price. You\'re borrowing for a depreciating asset — your phone loses 30% value instantly.',
      wrong: 'Be careful! "0% EMI" isn\'t always free. The cost is often hidden in the product price. Borrowing for gadgets you don\'t need is wasteful debt.',
      pennyTip: 'Borrowing for a gadget upgrade is wasteful debt. Your phone depreciates the moment you buy it — never finance a depreciating asset if avoidable! 📉',
    },
    xp: { correct: 100, wrong: 20 },
  },
  {
    id: 'ls3',
    title: 'Business Expansion Loan',
    context: 'Your food stall is profitable (₹25K/month net). You want to open a second outlet. Rent + setup = ₹2L. A MUDRA loan is available at 10%.',
    amount: 200000,
    annualRatePct: 10,
    tenureMonths: 36,
    purpose: 'Expand food business to second outlet',
    purposeEmoji: '🍱',
    correctDecision: 'take',
    debtType: 'productive',
    feedback: {
      correct: 'Brilliant entrepreneur mindset! Using debt to expand a profitable business is textbook productive debt. If the second outlet earns even ₹15K/month, your EMI is easily covered.',
      wrong: 'This was actually a good loan to take! A profitable business expansion funded by a low-interest government loan (MUDRA) is smart leverage. The loan pays for itself.',
      pennyTip: 'Borrowing to grow a profitable business is using debt as a tool. If the business income > EMI, you\'re building wealth! 💰',
    },
    xp: { correct: 100, wrong: 20 },
  },
  {
    id: 'ls4',
    title: 'Vacation Loan',
    context: 'You\'ve always wanted to go to Europe. A travel company offers a vacation loan — ₹1.5L for 18 months at 18% p.a. YOLO, right?',
    amount: 150000,
    annualRatePct: 18,
    tenureMonths: 18,
    purpose: 'Euro trip (Paris, Rome, Amsterdam)',
    purposeEmoji: '✈️',
    correctDecision: 'reject',
    debtType: 'wasteful',
    feedback: {
      correct: 'Great discipline! Vacation loans at 18% p.a. are among the worst financial decisions. You\'d pay back ~₹1.75L for a ₹1.5L trip. Save up first — a dream trip is better without debt guilt.',
      wrong: 'Ouch! 18% interest on a vacation means you\'re paying ₹25K+ extra just for the trip — and memories don\'t generate income to repay the loan. Always save for lifestyle expenses!',
      pennyTip: 'Never borrow at high interest for something that produces no income. If you can\'t afford a vacation today, save for 6 months — it\'ll taste much sweeter! 🌍',
    },
    xp: { correct: 100, wrong: 20 },
  },
  {
    id: 'ls5',
    title: 'Home Loan (First Home)',
    context: 'You\'ve been renting at ₹12K/month. You found a flat for ₹40L. Home loan at 8.75% for 20 years. EMI ≈ ₹35K on ₹1L income.',
    amount: 4000000,
    annualRatePct: 8.75,
    tenureMonths: 240,
    purpose: 'First home purchase in your city',
    purposeEmoji: '🏠',
    correctDecision: 'reject',
    debtType: 'neutral',
    feedback: {
      correct: 'Smart! While home loans are generally good debt, an EMI of ₹35K on ₹1L income is 35% — borderline affordable. And this is a 20-year commitment. Better to wait until income is higher or down payment is larger.',
      wrong: 'While home loans can be good debt, this EMI at 35% of income over 20 years is a major commitment. You\'d pay ₹44L in interest alone! Consider a smaller flat or waiting till your income grows.',
      pennyTip: 'Home loans are usually productive — but only if EMI is comfortable. Rule: EMI should not exceed 30-40% of income, and always have 6 months EMI as emergency savings! 🏠',
    },
    xp: { correct: 100, wrong: 20 },
  },
  {
    id: 'ls6',
    title: 'Medical Emergency Loan',
    context: 'Your parent needs urgent surgery. Hospital bill = ₹3L. You have ₹1L savings. A personal loan at 14% for 24 months can bridge the gap.',
    amount: 200000,
    annualRatePct: 14,
    tenureMonths: 24,
    purpose: 'Critical medical surgery for parent',
    purposeEmoji: '🏥',
    correctDecision: 'take',
    debtType: 'neutral',
    feedback: {
      correct: 'Right decision. Medical emergencies justify loans — this is a necessity, not a luxury. Focus on finding the lowest interest option and repay aggressively after the emergency.',
      wrong: 'Medical emergencies sometimes require loans. This is a necessary expense. 14% p.a. for 2 years on ₹2L is manageable — health always comes first, and you can repay with discipline.',
      pennyTip: 'This is why emergency funds and health insurance matter so much! They prevent you from taking high-interest loans during crises. Always build that safety net first. 🏥',
    },
    xp: { correct: 100, wrong: 20 },
  },
];

// ── Scenario Data — EMI Affordability Game ───────────────────────────────────
export const EMI_SCENARIOS: EMIScenario[] = [
  {
    id: 'em1',
    context: 'Fresh graduate, first job. Wants a two-wheeler to commute to work.',
    amount: 80000,
    annualRatePct: 12,
    tenureMonths: 24,
    monthlyIncome: 22000,
    purpose: 'Honda Activa for daily commute',
    purposeEmoji: '🛵',
    feedback: {
      affordable: 'Correct! The EMI is ~38% of income — just within the 40% threshold. It\'s tight but manageable if other expenses are controlled.',
      notAffordable: 'Actually this is borderline affordable (~38% ratio). While tight, a commuting vehicle can help you earn better by reaching work reliably. Manageable with discipline.',
      pennyTip: 'A vehicle loan for work is borderline productive. The test: does the vehicle help you earn more or save commute costs that exceed the EMI? 🛵',
    },
  },
  {
    id: 'em2',
    context: 'College student, part-time income. Wants to buy a gaming laptop on EMI.',
    amount: 120000,
    annualRatePct: 15,
    tenureMonths: 12,
    monthlyIncome: 8000,
    purpose: 'Gaming laptop (Asus ROG)',
    purposeEmoji: '💻',
    feedback: {
      affordable: 'Wrong call! This EMI would be ~133% of your income — completely unaffordable. You\'d exhaust your entire salary and more just on EMI!',
      notAffordable: 'Absolutely right! EMI of ~₹10,800 on an ₹8,000 income means you literally cannot afford the repayment. This would trap you in debt immediately.',
      pennyTip: 'Always run the numbers before signing up for EMI. If EMI > 40% of income, it\'s a red flag. Here it\'s over 100% — that\'s a debt trap! 🚨',
    },
  },
  {
    id: 'em3',
    context: 'Mid-level professional, stable job. Considering a personal loan for home renovation.',
    amount: 500000,
    annualRatePct: 11,
    tenureMonths: 60,
    monthlyIncome: 65000,
    purpose: 'Home renovation (owned flat)',
    purposeEmoji: '🔨',
    feedback: {
      affordable: 'Spot on! EMI ~₹10,900 is only 17% of income. Very affordable, and home renovation can increase property value.',
      notAffordable: 'Actually this is very affordable! EMI at 17% of ₹65K income leaves plenty of room for savings and other expenses. Renovation can also increase asset value.',
      pennyTip: 'A home renovation loan at 17% income ratio is quite healthy. The sweet spot is 20-30% — you still have buffer for savings and emergencies! 🏡',
    },
  },
  {
    id: 'em4',
    context: 'Freelancer with variable income of ₹30-50K/month. Wants a car loan.',
    amount: 700000,
    annualRatePct: 9,
    tenureMonths: 60,
    monthlyIncome: 40000,
    purpose: 'Maruti Swift for personal use',
    purposeEmoji: '🚗',
    feedback: {
      affordable: 'Risky! EMI ~₹14,500 is 36% of your stated income, but as a freelancer your income can drop to ₹30K — making EMI 48% in bad months. Very risky!',
      notAffordable: 'Good thinking! While the average income makes it 36%, freelance income is variable. In lean months your EMI could be near 50%+. Better to wait for stable income or a smaller car.',
      pennyTip: 'For variable income earners, keep EMI much lower than 40% — say 20-25% — to weather low-income months without defaulting! ⚠️',
    },
  },
  {
    id: 'em5',
    context: 'Young IT professional, no dependents. Plans to take a study loan (MBA abroad).',
    amount: 2500000,
    annualRatePct: 10,
    tenureMonths: 120,
    monthlyIncome: 75000,
    purpose: 'MBA at a top US university',
    purposeEmoji: '🎓',
    feedback: {
      affordable: 'Correct! EMI ~₹33K is 44% of current income — slightly over the threshold. But post-MBA income typically jumps to ₹1.5-3L/month, making this future-affordable.',
      notAffordable: 'Understandable but reconsider! For education loans, the 40% rule applies to *future* income, not current. Post-MBA salaries are 3-5x current. This is a calculated investment.',
      pennyTip: 'Education loans are special — evaluate affordability based on post-graduation income, not current. This is why education is called an investment! 💡',
    },
  },
];

// ── Scenario Data — Debt Classification Game ─────────────────────────────────
export const DEBT_SCENARIOS: DebtScenario[] = [
  {
    id: 'dc1',
    title: 'Skill Upgrade Loan',
    context: 'Rohan took a ₹50,000 loan to complete a data science bootcamp. After the course, his salary jumped from ₹25K to ₹60K/month.',
    loanType: 'Personal loan for online course',
    amount: 50000,
    purpose: 'Online Data Science Bootcamp',
    purposeEmoji: '🖥️',
    correctType: 'productive',
    explanation: 'This loan directly increased earning capacity. Rohan paid ~₹55K total but gained ₹35K/month extra salary. Payback period: under 2 months!',
    pennyTip: 'Any loan that increases your income potential by more than the interest cost is productive debt! Skills are permanent assets. 💡',
    xp: { correct: 100, wrong: 25 },
  },
  {
    id: 'dc2',
    title: 'Designer Sneakers Loan',
    context: 'Priya used a credit card EMI to buy ₹15,000 Jordans at 24% p.a. interest. The sneakers lost value after one month of use.',
    loanType: 'Credit card EMI',
    amount: 15000,
    purpose: 'Limited edition designer sneakers',
    purposeEmoji: '👟',
    correctType: 'wasteful',
    explanation: 'Borrowing for fashion that depreciates instantly at 24% interest is textbook wasteful debt. The sneakers created no future value or income.',
    pennyTip: 'Depreciating assets + high interest = financial drain. If you can\'t afford it with savings, it\'s a luxury, not a necessity! 📉',
    xp: { correct: 100, wrong: 25 },
  },
  {
    id: 'dc3',
    title: 'Agricultural Equipment Loan',
    context: 'A farmer took a ₹2L Kisan Credit Card loan at 7% to buy a tractor. His crop output tripled, earning ₹8L more that season.',
    loanType: 'Kisan Credit Card',
    amount: 200000,
    purpose: 'Tractor for farm productivity',
    purposeEmoji: '🚜',
    correctType: 'productive',
    explanation: 'Classic productive loan — invested in capital that multiplied income 4x. At 7% interest, this is excellent leverage.',
    pennyTip: 'Loans that multiply output (a tractor, a machine, a tool) are productive debt. They pay for themselves many times over! 📈',
    xp: { correct: 100, wrong: 25 },
  },
  {
    id: 'dc4',
    title: 'Birthday Party Loan',
    context: 'Sam took a personal loan at 18% to throw a lavish birthday party worth ₹80,000. The memories were great, the debt was not.',
    loanType: 'Personal loan (instant)',
    amount: 80000,
    purpose: 'Lavish birthday party',
    purposeEmoji: '🎉',
    correctType: 'wasteful',
    explanation: 'Financing a celebration with high-interest debt is wasteful. The money is spent, but the loan remains. Social pressure should never drive financial decisions.',
    pennyTip: 'No party or event is worth high-interest debt. Celebrate within your means — keep it simple and debt-free! 🎂',
    xp: { correct: 100, wrong: 25 },
  },
  {
    id: 'dc5',
    title: 'Rental Property Loan',
    context: 'An investor took a ₹30L home loan at 9% to buy a flat. Monthly rental income = ₹18,000. EMI = ₹27,000. Net cost: ₹9K/month.',
    loanType: 'Home loan (investment property)',
    amount: 3000000,
    purpose: 'Buy flat to generate rental income',
    purposeEmoji: '🏢',
    correctType: 'productive',
    explanation: 'The rental income partially covers the EMI, and property appreciates over time. The asset grows while generating regular cash flow.',
    pennyTip: 'Buying an asset that generates income (rental income, dividends) using a loan is smart leverage — the asset pays for itself! 🏢',
    xp: { correct: 100, wrong: 25 },
  },
  {
    id: 'dc6',
    title: 'Wedding Loan',
    context: 'A couple took ₹5L in personal loans at 16% for a grand wedding. The average Indian wedding loan takes 3-4 years to repay.',
    loanType: 'Personal loan',
    amount: 500000,
    purpose: 'Grand wedding celebration',
    purposeEmoji: '💍',
    correctType: 'wasteful',
    explanation: 'A wedding is a one-day event. Starting married life with ₹5L at 16% interest creates years of financial stress. A simpler wedding would\'ve been wiser.',
    pennyTip: 'Don\'t start married life in debt for a single day\'s event. A meaningful wedding doesn\'t need to be expensive! 💍',
    xp: { correct: 100, wrong: 25 },
  },
];
