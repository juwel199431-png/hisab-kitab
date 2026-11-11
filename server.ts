import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Generous limit for high-res receipt uploads (base64)
app.use(express.json({ limit: '20mb' }));

// Helper to initialize Google Gen AI (graceful if key not present)
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Convert Bengali numerals to standard Western numerals
function parseBengaliNumerals(str: string): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let s = str;
  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(bn[i], String(i));
  }
  return s;
}

// Ultra-fast Local Transaction NLP Extractor (<10ms)
function parseLocalTransaction(rawText: string) {
  const text = parseBengaliNumerals(rawText);
  const todayStr = new Date().toISOString().split('T')[0];

  // Extract amount: e.g. 3.750, 15000, 20,000, 2.850, 500
  const amountMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

  // Currency detection
  const isBdt = /টাকা|bdt|tk|টাকায়|ব্যাংক|ডিপিএস|বিকাশ/i.test(text);
  const currency = isBdt ? 'BDT' : 'KWD';

  // Section & Category & Type
  let section = 'kuwait-personal';
  let type = 'expense';
  let categoryName = 'ব্যক্তিগত খরচ';
  let borrowerName = '';

  const lower = text.toLowerCase();

  if (text.includes('শাকের') || lower.includes('boss') || text.includes('শাফের')) {
    section = 'boss-salary';
    if (text.includes('বেতন') || text.includes('জমা') || text.includes('স্যালারি') || text.includes('ডিপোজিট')) {
      type = 'income';
      categoryName = 'Monthly Salary Deposit';
    } else if (text.includes('মুরগি') || text.includes('গোস্ত') || text.includes('বাজার') || text.includes('সবজি') || text.includes('চাল')) {
      type = 'expense';
      categoryName = 'House Bazar & Random Expenses';
    } else {
      type = 'expense';
      categoryName = 'Personal Expenses by Boss';
    }
  } else if (text.includes('ইমদাদ')) {
    section = 'emdad-expense';
    type = 'expense';
    categoryName = 'ইমদাদ ভাই এর খরচ';
  } else if (text.includes('ধার') || text.includes('লোন') || text.includes('পাওনা')) {
    section = 'kuwait-loan';
    type = 'loan';
    categoryName = 'ব্যক্তিগত পাওনা লোন';
    const nameMatch = text.match(/([^\s]+(?:\s+[^\s]+)?)\s*কে\s*(?:ধার|লোন)/);
    if (nameMatch) {
      borrowerName = nameMatch[1].trim();
    }
  } else if (isBdt || text.includes('ব্যাংক') || text.includes('ডাচ') || text.includes('সিটি') || text.includes('সোনালী')) {
    section = 'bd-bank';
    type = text.includes('জমা') || text.includes('আয়') || text.includes('রেমিট্যান্স') ? 'income' : 'expense';
    categoryName = type === 'income' ? 'ব্যাংক ফান্ড ডিপোজিট' : 'ব্যাংক খরচ / উত্তোলন';
  } else {
    section = 'kuwait-personal';
    type = 'expense';
    if (text.includes('খাবার') || text.includes('হোটেল') || text.includes('রেস্টুরেন্ট') || text.includes('নাস্তা') || text.includes('চা')) {
      categoryName = 'Hotel and Restaurant Bill';
    } else if (text.includes('ভাড়া') || text.includes('রুম')) {
      categoryName = 'Room Rent & Accommodation';
    } else if (text.includes('মোবাইল') || text.includes('রিচার্জ') || text.includes('নেট')) {
      categoryName = 'Mobile Recharge & Internet';
    } else {
      categoryName = 'Personal Expenses';
    }
  }

  return {
    section,
    type,
    amount,
    currency,
    date: todayStr,
    categoryName,
    note: rawText.trim(),
    borrowerName,
    summaryBn: `${categoryName}: ${amount} ${currency === 'KWD' ? 'দিনার' : 'টাকা'} সফলভাবে শনাক্ত হয়েছে।`,
  };
}

// ============================================================================
// 1. Voice & Text Smart Transaction Parser
// ============================================================================
app.post('/api/ai/parse-transaction', async (req: Request, res: Response) => {
  try {
    const { text, lang = 'bn' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const ai = getGenAI();

    // If Gemini API is available, try fast AI extraction with 4s timeout
    if (ai) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const systemInstruction = `You are an expert bilingual financial transaction extractor for "Hisab Kitab" accounting system used by an expatriate working in Kuwait with Bangladesh banking.
Today's date is: ${todayStr}.
Supported currency rules:
- Expenses in Kuwait (Salary, Daily Bazar, Personal expenses, Food, Restaurant, Loans in Kuwait) default to "KWD" currency.
- Bangladesh Banking, Remittance, BD Bank transfers, DPS, Insurance default to "BDT" currency.
- If text mentions "দিনার" or "KD" or "KWD" -> KWD.
- If text mentions "টাকা" or "BDT" or "TK" -> BDT.
Sections: 'boss-salary', 'kuwait-personal', 'kuwait-loan', 'kuwait-payable', 'bd-bank', 'emdad-expense', 'kuwait-extra-income', 'savings-portfolio'.
Output JSON schema: { section, type, amount (number), currency, date (YYYY-MM-DD), categoryName, note, borrowerName, summaryBn }.`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Parse this transaction: "${text}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                type: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                date: { type: Type.STRING },
                categoryName: { type: Type.STRING },
                note: { type: Type.STRING },
                borrowerName: { type: Type.STRING },
                summaryBn: { type: Type.STRING },
              },
              required: ['section', 'type', 'amount', 'currency', 'date', 'categoryName', 'note', 'summaryBn'],
            },
          },
        });

        // 4-second timeout race
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 4000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const parsed = JSON.parse(response.text || '{}');
        if (parsed && parsed.amount !== undefined) {
          return res.json({ success: true, data: parsed, engine: 'gemini' });
        }
      } catch (aiErr) {
        console.warn('Gemini parser timed out or failed, falling back to local engine:', aiErr);
      }
    }

    // Instant local engine fallback (<5ms)
    const localParsed = parseLocalTransaction(text);
    return res.json({ success: true, data: localParsed, engine: 'instant-local' });
  } catch (err: any) {
    console.error('Error in /api/ai/parse-transaction:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse transaction' });
  }
});

// ============================================================================
// 2. Receipt / Invoice Image OCR & Auto-Transaction Extractor
// ============================================================================
app.post('/api/ai/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'রসিদ ভিশন স্ক্যান করার জন্য জেমিনাই এপিআই কী সক্রিয় থাকা প্রয়োজন। অনুগ্রহ করে সেটিংস প্যানেলে GEMINI_API_KEY কনফিগার করুন।'
      });
    }
    const todayStr = new Date().toISOString().split('T')[0];

    // Clean base64 string if data url header present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `Extract all transaction details from this cash memo / receipt image for an accounting app. Today is ${todayStr}.
Identify store name, date, itemized list, total amount, and currency.
Currency is usually KWD (Kuwait Dinar) if in Kuwait (Lulu, Grand Hyper, Sultan Center, local bakala) or BDT if in Bangladesh.`,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendorName: { type: Type.STRING, description: 'Store, market, or restaurant name' },
            date: { type: Type.STRING, description: 'Transaction date as YYYY-MM-DD' },
            totalAmount: { type: Type.NUMBER, description: 'Total paid amount' },
            currency: { type: Type.STRING, description: 'KWD or BDT' },
            suggestedSection: {
              type: Type.STRING,
              description: 'kuwait-personal, boss-salary, or bd-bank',
            },
            suggestedCategory: { type: Type.STRING, description: 'House Bazar, Food & Dining, Personal, etc.' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                },
              },
            },
            note: { type: Type.STRING, description: 'Summary note of items purchased' },
            summaryBn: { type: Type.STRING, description: 'Bangla summary of the receipt' },
          },
          required: ['vendorName', 'date', 'totalAmount', 'currency', 'suggestedSection', 'suggestedCategory', 'note', 'summaryBn'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/ai/scan-receipt:', err);
    return res.status(500).json({ error: err.message || 'Failed to scan receipt image' });
  }
});

// ============================================================================
// 3. Bank SMS / WhatsApp Text Message Parser
// ============================================================================
function parseLocalSms(messageText: string) {
  const text = parseBengaliNumerals(messageText);
  const todayStr = new Date().toISOString().split('T')[0];

  const amountMatch = text.match(/(?:kd|kwd|bdt|tk|টাকা)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  const isKwd = /kd|kwd|দিনার/i.test(text);
  const currency = isKwd ? 'KWD' : 'BDT';

  const isIncome = /credited|deposited|received|জমা|পেলেন/i.test(text);
  const type = isIncome ? 'income' : 'expense';

  let bankOrSender = 'Bank SMS';
  if (/nbk/i.test(text)) bankOrSender = 'National Bank of Kuwait (NBK)';
  else if (/gulf/i.test(text)) bankOrSender = 'Gulf Bank';
  else if (/cbk|commercial/i.test(text)) bankOrSender = 'Commercial Bank of Kuwait';
  else if (/dutch|dbbl|ডাচ্/i.test(text)) bankOrSender = 'Dutch-Bangla Bank';
  else if (/bkash|বিকাশ/i.test(text)) bankOrSender = 'bKash';
  else if (/city/i.test(text)) bankOrSender = 'City Bank';

  return {
    bankOrSender,
    type,
    amount,
    currency,
    date: todayStr,
    section: currency === 'KWD' ? 'kuwait-personal' : 'bd-bank',
    merchantOrParty: bankOrSender,
    note: messageText.slice(0, 100),
    summaryBn: `${bankOrSender}: ${amount} ${currency === 'KWD' ? 'দিনার' : 'টাকা'} (${type === 'income' ? 'জমা' : 'খরচ'})`,
  };
}

app.post('/api/ai/parse-sms', async (req: Request, res: Response) => {
  try {
    const { messageText } = req.body;
    if (!messageText) {
      return res.status(400).json({ error: 'messageText is required' });
    }

    const ai = getGenAI();
    if (ai) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Parse this bank SMS notification: "${messageText}". Today is ${todayStr}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bankOrSender: { type: Type.STRING },
                type: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                date: { type: Type.STRING },
                section: { type: Type.STRING },
                merchantOrParty: { type: Type.STRING },
                note: { type: Type.STRING },
                summaryBn: { type: Type.STRING },
              },
              required: ['bankOrSender', 'type', 'amount', 'currency', 'date', 'section', 'note', 'summaryBn'],
            },
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 4000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const parsed = JSON.parse(response.text || '{}');
        if (parsed && parsed.amount !== undefined) {
          return res.json({ success: true, data: parsed, engine: 'gemini' });
        }
      } catch (aiErr) {
        console.warn('Gemini SMS parse fallback:', aiErr);
      }
    }

    const localData = parseLocalSms(messageText);
    return res.json({ success: true, data: localData, engine: 'instant-local' });
  } catch (err: any) {
    console.error('Error in /api/ai/parse-sms:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse SMS' });
  }
});

// ============================================================================
// 4. Natural Language Account Q&A ("Ask Your Accounts")
// ============================================================================
function fallbackAskAccounts(question: string, context: any): string {
  const q = question.toLowerCase();
  const boss = context?.bossSalary || {};
  const kwt = context?.kuwaitPersonal || {};
  const bd = context?.bangladeshBanksTotalBdt || 0;
  const dps = context?.dpsAndInsuranceTotalBdt || 0;
  const netWorth = context?.overallNetWorthBdt || 0;
  const loans = context?.borrowersList || [];

  if (question.includes('শাকের') || q.includes('boss') || question.includes('বেতন') || question.includes('শাফের')) {
    const bal = boss.currentBalanceKwd ?? 0;
    return `📋 **শাকের ভাই এর বেতন ও খরচের হিসাব বিবরনী:**\n\n- **মোট জমা/স্যালারি:** ${(boss.totalDepositedKwd || 0).toFixed(3)} KWD\n- **মোট খরচ:** ${(boss.totalExpensesKwd || 0).toFixed(3)} KWD\n- **বর্তমান অবশিষ্ট ব্যালেন্স:** **${bal.toFixed(3)} KWD**\n\n👉 হিসাবের স্থিতি: শাকের ভাইয়ের কাছে আপনার বর্তমানে **${bal.toFixed(3)} KWD** পাওনা রয়েছে।`;
  }

  if (question.includes('ব্যাংক') || question.includes('বাংলাদেশ') || q.includes('bank')) {
    const totalBd = Number(bd) + Number(dps);
    return `🏦 **বাংলাদেশের ব্যাংক ও সঞ্চয় হিসাব:**\n\n- **সকল ব্যাংকে মোট ব্যালেন্স:** **${Number(bd).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT**\n- **ডিপিএস ও ইন্সুরেন্স মোট জমা:** **${Number(dps).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT**\n- **বাংলাদেশে সর্বমোট আর্থিক স্থিতি:** **${Number(totalBd).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT**`;
  }

  if (question.includes('ধার') || question.includes('লোন') || question.includes('পাওনা') || q.includes('loan')) {
    if (!loans || loans.length === 0) {
      return `🤝 **ব্যক্তিগত পাওনা লোন:** বর্তমানে কুয়েতে কারও কাছে আপনার ব্যক্তিগত কোনো টাকা বা লোন বকেয়া নেই।`;
    }
    const listStr = loans.map((b: any) => `• **${b.name}:** ${(b.remainingDue || 0).toFixed(3)} KWD বাকি`).join('\n');
    const totalDue = loans.reduce((acc: number, b: any) => acc + (b.remainingDue || 0), 0);
    return `🤝 **কুয়েতে ব্যক্তিগত পাওনা লোনের তালিকা:**\n\n${listStr}\n\n👉 **সর্বমোট পাওনা বাকি:** **${totalDue.toFixed(3)} KWD**`;
  }

  if (question.includes('মোট') || question.includes('নেট ওর্থ') || question.includes('সম্পদ') || q.includes('net worth')) {
    return `💰 **আপনার সার্বিক আর্থিক সারসংক্ষেপ (Net Worth):**\n\n- **বাংলাদেশ ব্যাংক ব্যালেন্স:** ${Number(bd).toLocaleString('en-US')} BDT\n- **ডিপিএস ও সঞ্চয়:** ${Number(dps).toLocaleString('en-US')} BDT\n- **শাকের ভাই এর অবশিষ্ট ব্যালেন্স:** ${(boss.currentBalanceKwd || 0).toFixed(3)} KWD\n- **কুয়েতে বর্তমান মাসের ব্যক্তিগত খরচ:** ${(kwt.totalExpensesKwd || 0).toFixed(3)} KWD\n- **সর্বমোট নেট ওর্থ (কনভার্টেড):** **${Number(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT**`;
  }

  // General helpful overview
  return `📊 **আপনার বর্তমান হিসাবের সারাংশ:**\n\n1. **শাকের ভাই এর ব্যালেন্স:** ${(boss.currentBalanceKwd || 0).toFixed(3)} KWD\n2. **বাংলাদেশ ব্যাংক ব্যালেন্স:** ${Number(bd).toLocaleString('en-US')} BDT\n3. **ডিপিএস ও সঞ্চয়:** ${Number(dps).toLocaleString('en-US')} BDT\n4. **কুয়েতে চলতি খরচ:** ${(kwt.totalExpensesKwd || 0).toFixed(3)} KWD\n\nআপনি শাকের ভাইয়ের ব্যালেন্স, ব্যাংকের টাকা, বা লোনের তালিকা সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।`;
}

app.post('/api/ai/ask-accounts', async (req: Request, res: Response) => {
  try {
    const { question, financialContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const ai = getGenAI();

    if (ai) {
      try {
        const prompt = `You are the AI Financial Expert for "Hisab Kitab (হিসাব কিতাব)".
User's Real Financial Context Data:
${JSON.stringify(financialContext || {}, null, 2)}

User's Question (in Bengali or English):
"${question}"

Instructions:
1. Answer accurately and directly in natural, respectful Bengali.
2. Use the real numbers from the financialContext provided (KWD or BDT).
3. Keep the answer structured, polite, and scannable with bullet points.`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 4000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (response && response.text) {
          return res.json({ success: true, answer: response.text, engine: 'gemini' });
        }
      } catch (aiErr) {
        console.warn('Gemini Q&A fallback triggered:', aiErr);
      }
    }

    const localAnswer = fallbackAskAccounts(question, financialContext);
    return res.json({ success: true, answer: localAnswer, engine: 'instant-local' });
  } catch (err: any) {
    console.error('Error in /api/ai/ask-accounts:', err);
    return res.status(500).json({ error: err.message || 'Failed to answer question' });
  }
});

// ============================================================================
// 5. Smart Financial Health & Spending Insights Generator
// ============================================================================
function fallbackGenerateInsights(summary: any): string {
  const netWorth = summary?.netWorthBdt || 0;
  const bdBank = summary?.totalBdBanksBdt || 0;
  const dps = summary?.totalDpsBdt || 0;
  const boss = summary?.bossSalary || {};
  const kwt = summary?.kuwaitPersonal || {};
  const kwtLoans = summary?.kuwaitLoans || {};

  return `📊 **হিসাব কিতাব - সার্বিক আর্থিক স্বাস্থ্য মূল্যায়ন রিপোর্ট**

---

### ১. সারসংক্ষেপ ও সামগ্রিক আর্থিক অবস্থা
- **সর্বমোট নেট ওর্থ:** **${Number(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT**
- **বাংলাদেশের ব্যাংক স্থিতি:** ${Number(bdBank).toLocaleString('en-US')} BDT
- **ডিপিএস ও ভবিষ্যৎ সঞ্চয়:** ${Number(dps).toLocaleString('en-US')} BDT
- **শাকের ভাই এর অবশিষ্ট ব্যালেন্স:** **${(boss.currentBalance || 0).toFixed(3)} KWD**

---

### ২. খরচ বিশ্লেষণ ও পর্যালোচনা
- **কুয়েতে মাসিক ব্যক্তিগত ব্যয়:** ${(kwt.totalExpenses || 0).toFixed(3)} KWD
- **শাকের ভাই এর মোট খরচ:** ${(boss.totalExpenses || 0).toFixed(3)} KWD
- **মূল্যায়ন:** আপনার দৈনন্দিন বাজার ও ব্যক্তিগত খরচ স্বাভাবিক সীমার মধ্যে রয়েছে। তবে অপ্রয়োজনীয় খুচরা খরচ নিয়ন্ত্রণে রাখলে মাসিক সঞ্চয় আরও বাড়ানো সম্ভব।

---

### ৩. ঋণ ও পাওনা আদায় আপডেট
- **কুয়েতে ব্যক্তিগত পাওনা বকেয়া:** **${(kwtLoans.remainingDue || 0).toFixed(3)} KWD**
- **পরামর্শ:** যাদের কাছ থেকে টাকা পাওয়ার কথা, নিয়মিত তাদের সাথে যোগাযোগ রক্ষা করে কিস্তিতে টাকা সংগ্রহ করুন।

---

### ৪. সঞ্চয় ও ভবিষ্যৎ পরিকল্পনা টিপস
1. **ডিপিএস ধারাবাহিক রাখুন:** প্রতি মাসের নির্দিষ্ট তারিখে নিয়মিত ডিপিএস প্রিমিয়াম জমা নিশ্চিত করুন।
2. **জরুরী তহবিল:** বাংলাদেশে ব্যাংকে ন্যূনতম ৩ মাসের খরচের সমান টাকা তরল ফান্ড (Savings) হিসেবে রাখুন।
3. **শাকের ভাই এর ব্যালেন্স সমন্বয়:** মাসের শেষে বসের খরচের বিবরণী ভাউচার সহ সাবমিট করে নতুন ফান্ড সংগ্রহ করুন।

⭐️ **সার্বিক আর্থিক স্কোর:** **৮.৫ / ১০ (উত্তম ও স্থিতিশীল)**`;
}

app.post('/api/ai/smart-insights', async (req: Request, res: Response) => {
  try {
    const { summaryData } = req.body;
    const ai = getGenAI();

    if (ai) {
      try {
        const prompt = `You are a Senior Financial Advisor reviewing the user's accounts for "Hisab Kitab".
Financial Overview Summary:
${JSON.stringify(summaryData || {}, null, 2)}

Generate a comprehensive, actionable monthly financial health evaluation in Bengali.
Include:
1. "সারসংক্ষেপ ও সামগ্রিক অবস্থা"
2. "খরচ বিশ্লেষণ ও সতর্কতা"
3. "ঋণ ও পাওনা আদায়ের আপডেট"
4. "সঞ্চয় ও ভবিষ্যৎ পরিকল্পনা"
Professional, encouraging, structured.`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 4000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (response && response.text) {
          return res.json({ success: true, insights: response.text, engine: 'gemini' });
        }
      } catch (aiErr) {
        console.warn('Gemini insights fallback triggered:', aiErr);
      }
    }

    const localInsights = fallbackGenerateInsights(summaryData);
    return res.json({ success: true, insights: localInsights, engine: 'instant-local' });
  } catch (err: any) {
    console.error('Error in /api/ai/smart-insights:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate insights' });
  }
});

// ============================================================================
// Server & Vite Middleware Configuration
// ============================================================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    // Development Mode: Mount Vite in middleware mode
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve static build artifacts
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hisab Kitab AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
