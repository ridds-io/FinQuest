/**
 * FinQuest RAG Seed Script — FREE VERSION
 * Uses HuggingFace Inference API (free) for embeddings
 * Falls back to hardcoded documents if no PDFs found
 *
 * Setup:
 *   1. Get free token at huggingface.co -> Settings -> Access Tokens
 *   2. Add HUGGINGFACE_API_KEY=hf_xxx to .env.local
 *   3. Drop PDFs into scripts/pdfs/ (optional)
 *   4. npm run seed-docs
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const HF_MODEL   = 'sentence-transformers/all-MiniLM-L6-v2';
const EMBED_DIM  = 384;
const CHUNK_SIZE = 500;
const OVERLAP    = 80;
const DELAY_MS   = 600;
const PDF_DIR    = path.resolve(process.cwd(), 'scripts/pdfs');

// ── Hardcoded fallback docs (always seeded) ───────────────────────────────────

const FALLBACK_DOCS = [
  {
    content: `Budgeting is a record and estimate of money coming in (income) and going out (expenses) over a specific period such as a month or year. It serves as a personal financial wellness plan, putting you in control of your spending and saving habits to meet your financial goals.`,
    metadata: { source: 'hardcoded', topic: 'budgeting-definition', module: 'budgeting' }
  },
  {
    content: `Income means money earned from salaries, wages, tips, scholarships, or side-hustles. Budgets should use after-tax net income. Expenses include everything you spend money on. Surplus is when income is higher than expenses. Deficit is when spending exceeds income.`,
    metadata: { source: 'hardcoded', topic: 'budget-terms', module: 'budgeting' }
  },
  {
    content: `The 50/30/20 rule: allocate 50% of income to needs, 30% to wants, and 20% to savings. For a student earning Rs 15,000 per month: Rs 7,500 goes to needs like rent and groceries, Rs 4,500 to wants like entertainment and eating out, and Rs 3,000 to savings and investments.`,
    metadata: { source: 'hardcoded', topic: '50-30-20', module: 'budgeting' }
  },
  {
    content: `Fixed expenses are essential needs you have little control over: PG rent Rs 8,000-12,000 in Pune, tuition fees, insurance, mobile bills. Variable expenses are wants you can control: chai, eating out, OTT subscriptions, gaming credits. Knowing the difference helps you cut the right things.`,
    metadata: { source: 'hardcoded', topic: 'expense-types', module: 'budgeting' }
  },
  {
    content: `A daily Rs 50 chai habit costs Rs 50 x 365 = Rs 18,250 per year. A daily Rs 20 cutting chai costs Rs 7,300 per year. Small daily purchases add up to nearly one month of PG rent annually. This is the latte factor: identifying and eliminating small recurring expenses adds up significantly.`,
    metadata: { source: 'hardcoded', topic: 'latte-factor', module: 'budgeting' }
  },
  {
    content: `Student discounts in India: Spotify Student plan is Rs 59 per month versus Rs 119 for regular. Amazon Prime Student is Rs 299 for 6 months. Many software tools offer free student licenses through your college email including Microsoft Office 365, Adobe Creative Cloud, GitHub Pro, and Notion. Always check for student pricing before paying full price.`,
    metadata: { source: 'hardcoded', topic: 'student-discounts', module: 'budgeting' }
  },
  {
    content: `UPI tips for Indian students: Set a monthly spending limit in your bank app. Enable transaction notifications for every payment. Never accept delayed rent from a roommate without a firm written deadline as it disrupts your budget. Use GPay or PhonePe cashbacks of 1 to 2 percent on utility payments.`,
    metadata: { source: 'hardcoded', topic: 'upi-tips', module: 'budgeting' }
  },
  {
    content: `Expense tracking is recording actual income and spending to compare against your budget. A variance is the difference between budgeted and actual amounts. Negative variance means overspending. Positive variance means you spent less than planned. Tools include Walnut app, Money Manager, or a simple Google Sheets template.`,
    metadata: { source: 'hardcoded', topic: 'expense-tracking', module: 'budgeting' }
  },
  {
    content: `Pay Yourself First: move a fixed amount to savings BEFORE paying bills or spending on wants. For Indian students, set up a recurring UPI transfer to a separate savings account on the day you receive your stipend. Even Rs 500 per month saved at 7 percent interest for 4 years grows to over Rs 28,000.`,
    metadata: { source: 'hardcoded', topic: 'pay-yourself-first', module: 'budgeting' }
  },
  {
    content: `SMART financial goals are Specific, Measurable, Achievable, Realistic, and Time-bound. Short-term under 1 year: build a Rs 10,000 emergency fund. Medium-term 1 to 8 years: repay an education loan. Long-term over 8 years: buy a house or build a retirement corpus. Always write goals with a rupee amount and deadline.`,
    metadata: { source: 'hardcoded', topic: 'smart-goals', module: 'budgeting' }
  },
  {
    content: `Roommate rent splitting in Pune PGs: always agree in writing before moving in. Equal splits avoid resentment. NoBroker helps find PGs without brokerage fees, saving Rs 8,000 to Rs 24,000. Never verbally agree to delayed rent payments as this disrupts your own monthly budget planning.`,
    metadata: { source: 'hardcoded', topic: 'roommate-rent', module: 'budgeting' }
  },
  {
    content: `An emergency fund is money set aside for unexpected expenses like medical bills, phone repairs, or sudden travel. Advisors recommend 3 to 6 months of living expenses. For a student spending Rs 10,000 per month, a starter emergency fund of Rs 10,000 to Rs 20,000 provides a meaningful safety net.`,
    metadata: { source: 'hardcoded', topic: 'emergency-fund', module: 'budgeting' }
  },
  {
    content: `A SIP or Systematic Investment Plan lets you invest a fixed amount in mutual funds every month. Even Rs 500 per month in an index fund averaging 12 percent annual returns grows to approximately Rs 41,000 over 4 years. Starting early matters more than starting with a large amount due to compounding.`,
    metadata: { source: 'hardcoded', topic: 'sip-investing', module: 'investing' }
  },
  {
    content: `Budgeting process: Step 1 set SMART goals. Step 2 gather information by collecting bills and statements. Step 3 allocate funds by assigning amounts to each category so total expenses do not exceed income. Step 4 review and adjust by comparing actual spending to budget regularly using variance reporting.`,
    metadata: { source: 'hardcoded', topic: 'budgeting-process', module: 'budgeting' }
  },
  {
    content: `NoBroker is an Indian real estate platform that connects tenants directly with landlords, eliminating the broker fee which is typically one month of rent. For a PG costing Rs 10,000 per month in Pune, using NoBroker saves Rs 10,000 to Rs 20,000 upfront. This is a significant saving for students.`,
    metadata: { source: 'hardcoded', topic: 'nobroker', module: 'budgeting' }
  },
];

// ── Validate env ──────────────────────────────────────────────────────────────

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
if (!HF_KEY) {
  console.error('\n❌  HUGGINGFACE_API_KEY not set in .env.local');
  console.error('    Get a free token at huggingface.co -> Settings -> Access Tokens\n');
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌  Supabase env vars not set in .env.local\n');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── HuggingFace embedding ─────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_KEY}`,
      },
      body: JSON.stringify({
        inputs: text.replace(/\n/g, ' ').slice(0, 512),
        options: { wait_for_model: true },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace ${res.status}: ${err}`);
  }

  const data = await res.json() as number[] | number[][];
  if (Array.isArray(data[0])) return (data as number[][])[0];
  return data as number[];
}

// ── PDF extraction ────────────────────────────────────────────────────────────

async function extractPDFText(filePath: string): Promise<string> {
  const pdfParseModule = await import('pdf-parse');
  const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
  const buffer   = fs.readFileSync(filePath);
  const data     = await pdfParse(buffer);
  return data.text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// ── Chunking ──────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    if (end < text.length) {
      const b = Math.max(
        text.lastIndexOf('. ', end),
        text.lastIndexOf('? ', end),
        text.lastIndexOf('!\n', end),
        text.lastIndexOf('\n\n', end),
      );
      if (b > start + CHUNK_SIZE * 0.5) end = b + 1;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 60) chunks.push(chunk);
    start = end - OVERLAP;
  }
  return chunks;
}

function inferTopic(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('50/30/20') || t.includes('50-30-20'))        return '50-30-20';
  if (t.includes('student discount') || t.includes('spotify')) return 'student-discounts';
  if (t.includes('upi') || t.includes('phonepe'))              return 'upi-tips';
  if (t.includes('track') || t.includes('variance'))           return 'expense-tracking';
  if (t.includes('pg') || t.includes('roommate'))              return 'roommate-rent';
  if (t.includes('smart') || t.includes('time-bound'))         return 'smart-goals';
  if (t.includes('sip') || t.includes('mutual fund'))          return 'sip-investing';
  if (t.includes('loan') || t.includes('emi'))                 return 'loans';
  if (t.includes('emergency fund'))                            return 'emergency-fund';
  if (t.includes('saving') || t.includes('pay yourself'))      return 'savings-strategy';
  return 'budgeting';
}

// ── Insert ────────────────────────────────────────────────────────────────────

async function insertChunk(
  content: string,
  embedding: number[],
  metadata: Record<string, unknown>
) {
  const { error } = await supabase
    .from('documents')
    .insert({ content, embedding, metadata });
  if (error) throw new Error(error.message);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 FinQuest RAG Seeder — Free HuggingFace Edition\n');

  let allDocs: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  // 1. Try to load PDFs
  if (fs.existsSync(PDF_DIR)) {
    const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
    if (pdfFiles.length > 0) {
      console.log(`📄 Found ${pdfFiles.length} PDF(s) in scripts/pdfs/`);
      for (const file of pdfFiles) {
        const filePath = path.join(PDF_DIR, file);
        const fileName = path.basename(file, '.pdf');
        console.log(`   Processing: ${file}`);
        try {
          const text   = await extractPDFText(filePath);
          const chunks = chunkText(text);
          console.log(`   -> ${text.length.toLocaleString()} chars, ${chunks.length} chunks`);
          chunks.forEach((content, i) => {
            allDocs.push({
              content,
              metadata: { source: fileName, file, topic: inferTopic(content), module: 'budgeting', chunk_idx: i, type: 'pdf' },
            });
          });
        } catch (err) {
          console.warn(`   Skipped ${file}: ${err}`);
        }
      }
    } else {
      console.log('📂 No PDFs found in scripts/pdfs/ — using hardcoded docs only');
    }
  } else {
    console.log('📂 scripts/pdfs/ not found — using hardcoded docs only');
  }

  // 2. Always add hardcoded fallback
  console.log(`📚 Adding ${FALLBACK_DOCS.length} hardcoded fallback documents`);
  allDocs = [...allDocs, ...FALLBACK_DOCS];

  console.log(`\n📊 Total: ${allDocs.length} documents to embed\n`);

  // 3. Clear existing to avoid duplicates
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('🗑️  Cleared existing documents\n');

  // 4. Embed and insert
  let inserted = 0, failed = 0;

  for (let i = 0; i < allDocs.length; i++) {
    const { content, metadata } = allDocs[i];
    const preview = content.slice(0, 50).replace(/\n/g, ' ');
    process.stdout.write(`[${i + 1}/${allDocs.length}] "${preview}..." `);

    try {
      const embedding = await getEmbedding(content);

      if (embedding.length !== EMBED_DIM) {
        throw new Error(
          `Got ${embedding.length}-dim vector but table expects ${EMBED_DIM}. ` +
          `Run the SQL setup again with vector(${embedding.length}).`
        );
      }

      await insertChunk(content, embedding, metadata);
      console.log('✅');
      inserted++;
    } catch (err) {
      console.log(`❌ ${err}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done!  Inserted: ${inserted}  Failed: ${failed}

Aryan will now answer using your PDF
content + the hardcoded knowledge base
as a fallback. Both live in Supabase.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(err => {
  console.error('\n❌ Fatal:', err);
  process.exit(1);
});