import express, { Request, Response } from 'express';
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

// Helper to initialize Google Gen AI
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure it in Secrets.');
  }
  return new GoogleGenAI({ apiKey });
};

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
    const todayStr = new Date().toISOString().split('T')[0];

    const systemInstruction = `You are an expert bilingual financial transaction extractor for "Hisab Kitab" accounting system used by an expatriate working in Kuwait with Bangladesh banking.
Today's date is: ${todayStr}.
Supported currency rules:
- Expenses in Kuwait (Salary, Daily Bazar, Personal expenses, Food, Restaurant, Loans in Kuwait) default to "KWD" currency.
- Bangladesh Banking, Remittance, BD Bank transfers, DPS, Insurance default to "BDT" currency.
- If the text mentions "দিনার" or "KD" or "KWD" -> currency is KWD.
- If the text mentions "টাকা" or "BDT" or "TK" -> currency is BDT.

Supported sections:
1. 'boss-salary': Expenses or salary related to Boss / Shaker Bhai (শাকের ভাই), e.g. Monthly salary deposit (আয়/জমা), House bazar & random expenses, Personal expenses by boss, TT to Bangladesh, etc.
2. 'kuwait-personal': User's own daily personal living expenses in Kuwait (খাবার, রুম ভাড়া, মোবাইল রিচার্জ, ইত্যাদি).
3. 'kuwait-loan': Personal loans given to individuals in Kuwait (পাওনা লোন), e.g. সাইফুল আলম, লিমন মাতুব্বর.
4. 'kuwait-payable': Money borrowed from someone (দেনা লোন).
5. 'bd-bank': Bangladesh bank account income/expense or remittance deposit.
6. 'emdad-expense': Expenses related to Emdad Bhai (ইমদাদ ভাই).
7. 'kuwait-extra-income': Extra part-time or freelance income in Kuwait.
8. 'savings-portfolio': DPS, Insurance, Savings accounts in Bangladesh.

Determine:
- section
- type: 'income' | 'expense' | 'loan' | 'transfer'
- amount: positive numeric value (e.g. 15.000 or 5000)
- currency: 'KWD' | 'BDT'
- date: formatted as YYYY-MM-DD (resolve relative words like 'আজ' -> ${todayStr}, 'গতকাল' -> yesterday)
- categoryName: short clean category name (in English/Bengali)
- note: concise description of the transaction
- borrowerName: name of borrower/lender if applicable, otherwise empty string
- summaryBn: 1-sentence friendly confirmation in Bengali`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Parse this user voice/text description into a structured transaction: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            section: {
              type: Type.STRING,
              description: 'Target section: boss-salary, kuwait-personal, kuwait-loan, kuwait-payable, bd-bank, emdad-expense, kuwait-extra-income, savings-portfolio',
            },
            type: {
              type: Type.STRING,
              description: 'income, expense, loan, or transfer',
            },
            amount: {
              type: Type.NUMBER,
              description: 'Numeric positive amount',
            },
            currency: {
              type: Type.STRING,
              description: 'KWD or BDT',
            },
            date: {
              type: Type.STRING,
              description: 'YYYY-MM-DD date',
            },
            categoryName: {
              type: Type.STRING,
              description: 'Category name',
            },
            note: {
              type: Type.STRING,
              description: 'Detailed note',
            },
            borrowerName: {
              type: Type.STRING,
              description: 'Name of person if loan',
            },
            summaryBn: {
              type: Type.STRING,
              description: 'Clear summary in Bengali',
            },
          },
          required: ['section', 'type', 'amount', 'currency', 'date', 'categoryName', 'note', 'summaryBn'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
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
app.post('/api/ai/parse-sms', async (req: Request, res: Response) => {
  try {
    const { messageText } = req.body;
    if (!messageText) {
      return res.status(400).json({ error: 'messageText is required' });
    }

    const ai = getGenAI();
    const todayStr = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Parse this bank SMS notification or WhatsApp message into transaction fields: "${messageText}". Today is ${todayStr}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankOrSender: { type: Type.STRING, description: 'Bank or sender name (NBK, CBK, Islami Bank, bKash, etc.)' },
            type: { type: Type.STRING, description: 'income or expense' },
            amount: { type: Type.NUMBER, description: 'Transaction amount' },
            currency: { type: Type.STRING, description: 'KWD or BDT' },
            date: { type: Type.STRING, description: 'YYYY-MM-DD' },
            section: { type: Type.STRING, description: 'bd-bank, kuwait-personal, boss-salary, etc.' },
            merchantOrParty: { type: Type.STRING, description: 'Where money was spent or who sent it' },
            note: { type: Type.STRING, description: 'Transaction description' },
            summaryBn: { type: Type.STRING, description: 'Friendly Bengali summary' },
          },
          required: ['bankOrSender', 'type', 'amount', 'currency', 'date', 'section', 'note', 'summaryBn'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/ai/parse-sms:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse SMS' });
  }
});

// ============================================================================
// 4. Natural Language Account Q&A ("Ask Your Accounts")
// ============================================================================
app.post('/api/ai/ask-accounts', async (req: Request, res: Response) => {
  try {
    const { question, financialContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const ai = getGenAI();

    const prompt = `You are the AI Financial Expert for "Hisab Kitab (হিসাব কিতাব)".
User's Real Financial Context Data:
${JSON.stringify(financialContext || {}, null, 2)}

User's Question (in Bengali or English):
"${question}"

Instructions:
1. Answer accurately and directly in natural, respectful Bengali.
2. Use the real numbers from the financialContext provided (KWD or BDT).
3. If calculation is involved, show the exact arithmetic clearly (e.g. মোট জমা - মোট খরচ = অবশিষ্ট).
4. Keep the answer structured, polite, and scannable with bullet points if helpful.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ success: true, answer: response.text });
  } catch (err: any) {
    console.error('Error in /api/ai/ask-accounts:', err);
    return res.status(500).json({ error: err.message || 'Failed to answer question' });
  }
});

// ============================================================================
// 5. Smart Financial Health & Spending Insights Generator
// ============================================================================
app.post('/api/ai/smart-insights', async (req: Request, res: Response) => {
  try {
    const { summaryData } = req.body;
    const ai = getGenAI();

    const prompt = `You are a Senior Financial Advisor reviewing the user's accounts for "Hisab Kitab".
Financial Overview Summary:
${JSON.stringify(summaryData || {}, null, 2)}

Generate a comprehensive, actionable monthly financial health evaluation in Bengali.
Include:
1. "সারসংক্ষেপ ও সামগ্রিক অবস্থা" (Overview of total net worth, savings, cashflow in KWD and BDT)
2. "খরচ বিশ্লেষণ ও সতর্কতা" (Top spending categories, budget warnings, or overspending notices)
3. "ঋণ ও পাওনা আদায়ের আপডেট" (Status of Kuwait personal loans, who owes money, overdue warnings)
4. "সঞ্চয় ও ভবিষ্যৎ পরিকল্পনা" (Tips to increase savings in Bangladesh banks and DPS/Insurance)
Keep the tone professional, encouraging, and clear.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ success: true, insights: response.text });
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
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
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
