import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── paste your document text here, chunked into ~500 char pieces ──
const DOCUMENTS = [
  {
    content: `Budgeting is a record and estimate of money coming in (income) and going out (expenses) over a specific period. It serves as a personal financial wellness plan, putting you in control of your spending and saving habits to meet your financial goals.`,
    metadata: { module: 'budgeting', topic: 'definition' }
  },
  {
    content: `The 50/30/20 rule: allocate 50% of after-tax income to needs (rent, groceries, transport), 30% to wants (entertainment, eating out, subscriptions), and 20% to savings. For a student earning ₹15,000/month: ₹7,500 needs, ₹4,500 wants, ₹3,000 savings.`,
    metadata: { module: 'budgeting', topic: '50-30-20' }
  },
  {
    content: `Fixed/Non-discretionary expenses are essential needs you have little control over — PG rent (₹8,000–12,000 in Pune), tuition fees, insurance, mobile bill. Variable/Discretionary expenses are wants you can control — chai, eating out, OTT subscriptions, gaming credits.`,
    metadata: { module: 'budgeting', topic: 'expense-types' }
  },
  {
    content: `A daily ₹50 chai habit costs ₹50 × 365 = ₹18,250 per year. A daily ₹20 cutting chai costs ₹7,300/year. Small daily purchases add up to nearly one month of PG rent annually. This is the "latte factor" — identifying and cutting small recurring expenses.`,
    metadata: { module: 'budgeting', topic: 'expense-tracking' }
  },
  {
    content: `Student discounts in India: Spotify Student ₹59/month (vs ₹119 regular). Amazon Prime Student ₹299/6 months. Many software tools offer free student licenses via your college email — Microsoft Office 365, Adobe Creative Cloud, GitHub Pro, Notion. Always check before paying full price.`,
    metadata: { module: 'budgeting', topic: 'student-discounts' }
  },
  {
    content: `UPI payment tips for students: Set a monthly UPI spending limit in your bank app. Enable transaction notifications for every payment. Never accept delayed rent payments without a written deadline — it disrupts your own budget planning. Use GPay or PhonePe cashbacks (1-2%) on utility payments.`,
    metadata: { module: 'budgeting', topic: 'upi' }
  },
  {
    content: `Expense tracking methods: apps like Walnut, Money Manager, or a simple Google Sheets template. Record every UPI transaction immediately. Categorize weekly — food, transport, education, entertainment. A variance is the difference between budgeted and actual spend. Negative variance = overspent.`,
    metadata: { module: 'budgeting', topic: 'tracking-methods' }
  },
  {
    content: `Pay Yourself First strategy: automatically move a fixed amount to savings BEFORE paying any bills or discretionary spending. For Indian students: set up a recurring UPI transfer to a separate savings account on salary/stipend day. Even ₹500/month saved at 7% for 4 years = ₹28,000+.`,
    metadata: { module: 'budgeting', topic: 'savings-strategy' }
  },
  {
    content: `SMART financial goals: Specific, Measurable, Achievable, Realistic, Time-bound. Short-term (under 1 year): build ₹10,000 emergency fund. Medium-term (1-8 years): repay education loan. Long-term (8+ years): buy a house, retirement corpus. Always write down your goals with a rupee amount and deadline.`,
    metadata: { module: 'budgeting', topic: 'goal-setting' }
  },
  {
    content: `Roommate rent splitting in Pune PGs: always agree in writing before moving in. Equal splits avoid resentment. If rooms are unequal, proportional split based on room size is fair. Use NoBroker to find PGs without brokerage fees (saves 1-2 months rent = ₹8,000–24,000). Never verbally agree to delayed payments.`,
    metadata: { module: 'budgeting', topic: 'pg-rent' }
  },
    {
    content: `Budgeting is the process of planning how money will be earned, spent, and saved over a period of time. It helps individuals understand their income, control expenses, and ensure that money is available for both current needs and future goals.`,
    metadata: { module: 'budgeting', topic: 'definition' }
    },

    {
    content: `A simple budget lists two main elements: income and expenses. Income includes money received from allowances, part-time work, scholarships, or family support. Expenses include money spent on necessities like food, travel, study materials, and personal needs.`,
    metadata: { module: 'budgeting', topic: 'budget-components' }
    },

    {
    content: `Budgeting helps individuals avoid overspending and financial stress. By tracking income and expenses regularly, people can ensure they live within their means, save for emergencies, and make better financial decisions.`,
    metadata: { module: 'budgeting', topic: 'importance' }
    },

    {
    content: `One of the easiest budgeting methods is the 50-30-20 rule. It divides your income into three categories so you can balance spending and saving without complex calculations.`,
    metadata: { module: 'budgeting', topic: '50-30-20-overview' }
    },

    {
    content: `The 50/30/20 rule suggests allocating 50% of income to needs, 30% to wants, and 20% to savings. Needs include essential expenses like rent, groceries, transport, and utilities.`,
    metadata: { module: 'budgeting', topic: '50-30-20' }
    },

    {
    content: `In the 50/30/20 budgeting rule, the 30% category represents wants. These include non-essential spending such as movies, eating out, shopping, gaming subscriptions, and entertainment.`,
    metadata: { module: 'budgeting', topic: '50-30-20-wants' }
    },

    {
    content: `The final 20% in the 50/30/20 rule goes toward savings and investments. This portion can be used to build an emergency fund, save for future education, or invest for long-term financial security.`,
    metadata: { module: 'budgeting', topic: '50-30-20-savings' }
    },

    {
    content: `Expense tracking is the process of recording every expense you make. This includes small purchases like snacks, transport fares, and online subscriptions. Tracking expenses helps identify where money is actually being spent.`,
    metadata: { module: 'budgeting', topic: 'expense-tracking' }
    },

    {
    content: `Many people underestimate how much they spend on small daily purchases. Tracking expenses regularly helps reveal spending patterns and allows individuals to adjust their habits to stay within their budget.`,
    metadata: { module: 'budgeting', topic: 'expense-tracking-benefits' }
    },

    {
    content: `Expenses can be categorized into fixed and variable costs. Fixed expenses remain consistent each month, such as rent or tuition. Variable expenses change depending on behavior, like food delivery, shopping, or entertainment.`,
    metadata: { module: 'budgeting', topic: 'expense-types' }
    },

    {
    content: `Students can use simple tools to track expenses such as budgeting apps, spreadsheets, or a notebook. The key is consistency: recording expenses daily or weekly ensures the budget reflects actual spending.`,
    metadata: { module: 'budgeting', topic: 'expense-tracking-tools' }
    },

    {
    content: `Student discounts are special price reductions offered to students on products and services such as travel, software, food outlets, and entertainment. Using these discounts helps reduce overall spending.`,
    metadata: { module: 'budgeting', topic: 'student-discounts' }
    },

    {
    content: `Many companies offer student pricing for digital tools and services like software subscriptions, learning platforms, and productivity apps. Taking advantage of these discounts helps students manage limited budgets.`,
    metadata: { module: 'budgeting', topic: 'student-discounts-digital' }
    },

    {
    content: `Transport systems, cinemas, museums, and food outlets often provide discounted pricing for students with valid identification. These savings can significantly reduce monthly discretionary spending.`,
    metadata: { module: 'budgeting', topic: 'student-discounts-uses' }
    },

    {
    content: `A good student budget should include three habits: planning income, tracking expenses, and setting aside savings. Even small savings each month can build financial discipline and prepare students for larger financial responsibilities.`,
    metadata: { module: 'budgeting', topic: 'budgeting-habits' }
    },

    {
    content: `Budgeting is not about restricting spending completely. Instead, it helps prioritize spending so essential needs are covered, personal enjoyment is possible, and savings goals are still achieved.`,
    metadata: { module: 'budgeting', topic: 'budgeting-mindset' }
    }
];

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  const data = await res.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

async function seed() {
  console.log(`Seeding ${DOCUMENTS.length} documents...`);

  for (const doc of DOCUMENTS) {
    console.log(`Embedding: "${doc.content.substring(0, 60)}..."`);
    const embedding = await getEmbedding(doc.content);

    const { error } = await supabase
      .from('documents')
      .insert({ content: doc.content, embedding, metadata: doc.metadata });

    if (error) console.error('Insert error:', error);
    else console.log('✅ Inserted');

    // small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Done!');
}

seed().catch(console.error);