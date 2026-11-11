import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Sparkles,
  Mic,
  MicOff,
  Upload,
  Camera,
  MessageSquare,
  FileText,
  TrendingUp,
  X,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Coins,
  Send,
  Trash2,
  RefreshCw,
  Building,
  HelpCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'voice' | 'receipt' | 'sms' | 'qa' | 'insights';
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'voice',
}) => {
  const {
    data,
    lang,
    addTransaction,
    addBossDeposit,
    addKuwaitLoan,
    getBorrowerBalance,
    getTotalNetWorthBdt,
    getTotalBdBanksBalance,
    getTotalDpsSavings,
    getKuwaitPersonalTotals,
    getBossSalaryTotals,
    getEmdadTotals,
    getKuwaitLoanTotals,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'voice' | 'receipt' | 'sms' | 'qa' | 'insights'>(initialTab);

  // Tab 1: Voice & Text Entry State
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [parsedVoiceTx, setParsedVoiceTx] = useState<any | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState('');

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  // Tab 2: Receipt OCR State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptMimeType, setReceiptMimeType] = useState('image/jpeg');
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scannedReceiptData, setScannedReceiptData] = useState<any | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 3: SMS Parser State
  const [smsText, setSmsText] = useState('');
  const [isParsingSms, setIsParsingSms] = useState(false);
  const [parsedSmsData, setParsedSmsData] = useState<any | null>(null);
  const [smsError, setSmsError] = useState('');
  const [smsSuccessMsg, setSmsSuccessMsg] = useState('');

  // Tab 4: Ask Your Accounts Q&A State
  const [qaQuestion, setQaQuestion] = useState('');
  const [isAnsweringQa, setIsAnsweringQa] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: lang === 'bn'
        ? 'আসসালামু আলাইকুম! আমি আপনার হিসাব কিতাব এআই সহকারী। আপনার যেকোনো অ্যাকাউন্ট, খরচ, ব্যালেন্স বা পাওনা লোন সম্পর্কে প্রশ্ন করুন—আমি হিসাব বের করে উত্তর দেব।'
        : 'Hello! I am your Hisab Kitab AI Assistant. Ask me any question about your accounts, expenses, balances, or loans.',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [qaError, setQaError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Tab 5: Smart Financial Insights State
  const [insightsText, setInsightsText] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  // Setup Web Speech API for Bengali voice typing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'bn-BD';

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
          if (fullTranscript.trim()) {
            setVoiceInputText(fullTranscript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            setVoiceError(
              lang === 'bn'
                ? '⚠️ মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ব্রাউজারের অ্যাড্রেস বারের তালা/মাইক্রোফোন আইকনে ক্লিক করে "Allow" করুন, অথবা নিচের বক্সে লিখুন।'
                : 'Microphone permission denied. Please allow microphone in browser address bar.'
            );
          } else if (event.error === 'no-speech') {
            setVoiceError(
              lang === 'bn'
                ? 'কোনো কথা শুনতে পাওয়া যায়নি। আবার মাইক্রোফোনে ক্লিক করে স্পষ্টভাবে বলুন।'
                : 'No speech detected. Please click the mic and try again.'
            );
          } else if (event.error === 'network') {
            setVoiceError(
              lang === 'bn'
                ? 'ইন্টারনেট সমস্যা বা ভয়েস সার্ভার সাড়া দিচ্ছে না। অনুগ্রহ করে সরাসরি টাইপ করুন।'
                : 'Network error with speech recognition. Please type below.'
            );
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [lang]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!isOpen) return null;

  // Toggle voice recording with permission prompt
  const handleToggleVoice = async () => {
    setVoiceError('');

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        lang === 'bn'
          ? 'এই ব্রাউজারে স্বয়ংক্রিয় ভয়েস রিকগনিশন সাপোর্ট নেই। অনুগ্রহ করে নিচে টাইপ করুন অথবা নমুনা বাটনে ক্লিক করুন।'
          : 'Speech recognition not supported in this browser. Please type below.'
      );
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Mic permission error:', permErr);
      setVoiceError(
        lang === 'bn'
          ? '⚠️ ব্রাউজার মাইক্রোফোন ব্যবহারের অনুমতি দেয়নি। ব্রাউজারের অ্যাড্রেস বারে ক্লিক করে মাইক্রোফোন "Allow" করুন।'
          : 'Microphone permission denied. Please allow microphone in browser.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } catch (err: any) {
      console.warn('Recognition start error:', err);
      setIsRecording(false);
      setVoiceError(
        lang === 'bn'
          ? 'ভয়েস চালু করতে সমস্যা হয়েছে। দয়া করে আবার ক্লিক করুন বা নিচে টাইপ করুন।'
          : 'Could not start voice recognition. Please try typing.'
      );
    }
  };

  // 1. Submit Voice/Text for AI parsing
  const handleParseVoiceText = async (textToParse = voiceInputText) => {
    if (!textToParse.trim()) {
      setVoiceError(lang === 'bn' ? 'অনুগ্রহ করে কিছু লিখুন বা মুখে বলুন' : 'Please speak or enter text');
      return;
    }

    setIsParsingVoice(true);
    setVoiceError('');
    setVoiceSuccessMsg('');
    setParsedVoiceTx(null);

    try {
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToParse, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse');

      setParsedVoiceTx(data.data);
    } catch (err: any) {
      setVoiceError(err.message || 'Error communicating with AI server');
    } finally {
      setIsParsingVoice(false);
    }
  };

  // Confirm and Save Voice Transaction
  const handleConfirmVoiceTx = () => {
    if (!parsedVoiceTx) return;

    try {
      const { section, type, amount, currency, date, categoryName, note, borrowerName } = parsedVoiceTx;

      // Handle specific section routines
      if (section === 'boss-salary' && type === 'income') {
        addBossDeposit({
          month: date.slice(0, 7),
          depositDate: date,
          amount,
          currency: 'KWD',
          note: note || 'Monthly Salary Deposit via AI',
        });
      } else if (section === 'kuwait-loan' && borrowerName) {
        addKuwaitLoan({
          borrowerName,
          amount,
          date: date || new Date().toISOString().split('T')[0],
          status: 'unpaid',
          note: note || 'Loan via AI Entry',
        });
      } else {
        addTransaction({
          section: (section as any) || 'kuwait-personal',
          type: (type as any) || 'expense',
          amount,
          currency: (currency as any) || 'KWD',
          date: date || new Date().toISOString().split('T')[0],
          categoryNameBn: categoryName || 'সাধারণ খরচ',
          categoryNameEn: categoryName || 'General Expense',
          note: note || '',
        });
      }

      setVoiceSuccessMsg(lang === 'bn' ? 'অভিনন্দন! লেনদেনটি সফলভাবে হিসাবে যুক্ত হয়েছে।' : 'Transaction successfully saved to accounts!');
      setParsedVoiceTx(null);
      setVoiceInputText('');
      setTimeout(() => setVoiceSuccessMsg(''), 4000);
    } catch (err: any) {
      setVoiceError(err.message || 'Failed to save transaction');
    }
  };

  // 2. Receipt Upload Handler
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setReceiptError(lang === 'bn' ? 'শুধুমাত্র ছবি ফাইল নির্বাচন করুন' : 'Please upload an image file');
      return;
    }

    setReceiptMimeType(file.type);
    setReceiptError('');
    setScannedReceiptData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Receipt to AI
  const handleScanReceipt = async () => {
    if (!receiptImage) return;

    setIsScanningReceipt(true);
    setReceiptError('');
    setReceiptSuccessMsg('');

    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: receiptImage,
          mimeType: receiptMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan receipt');

      setScannedReceiptData(data.data);
    } catch (err: any) {
      setReceiptError(err.message || 'Failed to process receipt image');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  // Confirm Scanned Receipt Transaction
  const handleConfirmReceiptTx = () => {
    if (!scannedReceiptData) return;

    try {
      addTransaction({
        section: (scannedReceiptData.suggestedSection as any) || 'kuwait-personal',
        type: 'expense',
        amount: scannedReceiptData.totalAmount || 0,
        currency: (scannedReceiptData.currency as any) || 'KWD',
        date: scannedReceiptData.date || new Date().toISOString().split('T')[0],
        categoryNameBn: scannedReceiptData.suggestedCategory || scannedReceiptData.vendorName || 'বাজার খরচ',
        categoryNameEn: scannedReceiptData.vendorName || 'Receipt Expense',
        note: `${scannedReceiptData.vendorName}: ${scannedReceiptData.note || ''}`,
      });

      setReceiptSuccessMsg(lang === 'bn' ? 'রসিদের খরচ সফলভাবে ভাউচারে যুক্ত হয়েছে!' : 'Receipt expense saved successfully!');
      setScannedReceiptData(null);
      setReceiptImage(null);
      setTimeout(() => setReceiptSuccessMsg(''), 4000);
    } catch (err: any) {
      setReceiptError(err.message || 'Failed to save receipt expense');
    }
  };

  // 3. SMS Parser Handler
  const handleParseSms = async (textToParse = smsText) => {
    if (!textToParse.trim()) {
      setSmsError(lang === 'bn' ? 'এসএমএস টেক্সট পেস্ট করুন' : 'Please paste SMS message');
      return;
    }

    setIsParsingSms(true);
    setSmsError('');
    setSmsSuccessMsg('');
    setParsedSmsData(null);

    try {
      const res = await fetch('/api/ai/parse-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: textToParse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse SMS');

      setParsedSmsData(data.data);
    } catch (err: any) {
      setSmsError(err.message || 'Error parsing message');
    } finally {
      setIsParsingSms(false);
    }
  };

  // Confirm SMS Transaction
  const handleConfirmSmsTx = () => {
    if (!parsedSmsData) return;

    try {
      addTransaction({
        section: (parsedSmsData.section as any) || 'kuwait-personal',
        type: (parsedSmsData.type as any) || 'expense',
        amount: parsedSmsData.amount || 0,
        currency: (parsedSmsData.currency as any) || 'KWD',
        date: parsedSmsData.date || new Date().toISOString().split('T')[0],
        categoryNameBn: parsedSmsData.merchantOrParty || 'ব্যাংক লেনদেন',
        categoryNameEn: parsedSmsData.merchantOrParty || 'Bank Transaction',
        note: `${parsedSmsData.bankOrSender}: ${parsedSmsData.note || ''}`,
      });

      setSmsSuccessMsg(lang === 'bn' ? 'এসএমএস থেকে লেনদেন সফলভাবে যুক্ত হয়েছে!' : 'SMS transaction saved successfully!');
      setParsedSmsData(null);
      setSmsText('');
      setTimeout(() => setSmsSuccessMsg(''), 4000);
    } catch (err: any) {
      setSmsError(err.message || 'Failed to save SMS transaction');
    }
  };

  // 4. Ask Your Accounts Q&A Handler
  const handleSendQa = async (questionText = qaQuestion) => {
    if (!questionText.trim()) return;

    const userMsg = questionText.trim();
    setQaQuestion('');
    setQaError('');

    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg, time: timeNow }]);
    setIsAnsweringQa(true);

    // Prepare real aggregated financial context
    const bossTotals = getBossSalaryTotals();
    const kwtPersonal = getKuwaitPersonalTotals();
    const emdad = getEmdadTotals();
    const loans = getKuwaitLoanTotals();
    const bdBankTotal = getTotalBdBanksBalance();
    const dpsTotal = getTotalDpsSavings();

    const financialContext = {
      overallNetWorthBdt: getTotalNetWorthBdt(),
      bangladeshBanksTotalBdt: bdBankTotal,
      dpsAndInsuranceTotalBdt: dpsTotal,
      bossSalary: {
        totalDepositedKwd: bossTotals.totalDeposited,
        totalExpensesKwd: bossTotals.totalExpenses,
        remainingBalanceKwd: bossTotals.remainingBalance,
      },
      kuwaitPersonalExpensesKwd: kwtPersonal.totalExpense,
      emdadBhaiExpense: {
        totalSpentKwd: emdad.totalSpent,
        totalPaidKwd: emdad.totalPaid,
        totalUnpaidRemainingKwd: emdad.totalUnpaid,
      },
      kuwaitReceivableLoans: {
        totalLentKwd: loans.totalLoaned,
        totalCollectedKwd: loans.totalPaid,
        totalUnpaidDueKwd: loans.totalUnpaid,
        unpaidBorrowersCount: loans.unpaidCount,
      },
      recentTransactionsCount: (data.transactions || []).length,
      sampleRecentTransactions: (data.transactions || []).slice(0, 15).map((t) => ({
        date: t.date,
        section: t.section,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        category: t.categoryNameEn || t.categoryNameBn,
        note: t.note,
      })),
      borrowersList: (data.kuwaitReceivableBorrowers || []).map((b) => {
        const bal = getBorrowerBalance(b.id);
        return {
          name: b.name,
          remainingDue: bal ? bal.remaining : 0,
          currency: 'KWD',
        };
      }),
    };

    try {
      const res = await fetch('/api/ai/ask-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, financialContext }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to get answer');

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: resData.answer || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setQaError(err.message || 'Error communicating with AI');
    } finally {
      setIsAnsweringQa(false);
    }
  };

  // 5. Generate Smart Financial Insights
  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    setInsightsError('');

    const bossTotals = getBossSalaryTotals();
    const kwtPersonal = getKuwaitPersonalTotals();
    const loans = getKuwaitLoanTotals();
    const bdBankTotal = getTotalBdBanksBalance();
    const dpsTotal = getTotalDpsSavings();

    const summaryData = {
      bangladeshBanksBalanceBdt: bdBankTotal,
      dpsSavingsBdt: dpsTotal,
      bossSalaryRemainingKwd: bossTotals.remainingBalance,
      bossSalaryExpensesKwd: bossTotals.totalExpenses,
      kuwaitPersonalLivingExpensesKwd: kwtPersonal.totalExpense,
      personalLoansGivenKwd: loans.totalLoaned,
      personalLoansRemainingDueKwd: loans.totalUnpaid,
      totalTransactionsRecorded: (data.transactions || []).length,
    };

    try {
      const res = await fetch('/api/ai/smart-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryData }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to generate insights');

      setInsightsText(resData.insights || '');
    } catch (err: any) {
      setInsightsError(err.message || 'Error generating insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  {lang === 'bn' ? 'হিসাব কিতাব এআই স্টুডিও' : 'Hisab Kitab AI Smart Studio'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  FREE
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                {lang === 'bn' ? 'ভয়েস এন্ট্রি, রসিদ স্ক্যানার, এসএমএস পার্সার ও স্মার্ট আর্থিক পরামর্শ' : 'Voice Entry, Receipt OCR, SMS Parser & AI Financial Q&A'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'voice', labelBn: '🎙️ ভয়েস ও টেক্সট এন্ট্রি', labelEn: 'Voice & Text Entry', icon: Mic },
            { id: 'receipt', labelBn: '🧾 রসিদ স্ক্যানার (OCR)', labelEn: 'Receipt Scanner', icon: Camera },
            { id: 'sms', labelBn: '💬 এসএমএস ও মেসেজ', labelEn: 'SMS / Msg Parser', icon: FileText },
            { id: 'qa', labelBn: '🤖 হিসাব নিয়ে প্রশ্ন (Q&A)', labelEn: 'Ask Accounts', icon: MessageSquare },
            { id: 'insights', labelBn: '📊 স্মার্ট অডিট ও পরামর্শ', labelEn: 'Smart Insights', icon: TrendingUp },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
          {/* ========================================================================= */}
          {/* TAB 1: Voice & Natural Language Entry                                     */}
          {/* ========================================================================= */}
          {activeTab === 'voice' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-slate-800/60 dark:to-slate-800/30 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'bn' ? 'বাংলায় মুখে বলুন অথবা লিখে এন্ট্রি করুন' : 'Speak in Bengali or Type to Enter'}</span>
                  </span>
                  {isRecording && (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                      {lang === 'bn' ? 'শুনছি... কথা বলুন' : 'Listening... Speak now'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={voiceInputText}
                    onChange={(e) => setVoiceInputText(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'যেমন: আজ শাকের ভাই এর বাজার খরচে ১৫ দিনার দিয়েছি, অথবা সাইফুল ভাই লোন ফেরত দিয়েছেন ৫০ দিনার...'
                        : 'e.g. Paid 15 KD for Shaker Bhai bazar expense today, or collected 50 KD loan from Saiful...'
                    }
                    className="w-full p-3.5 pr-14 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />

                  {/* Mic Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`absolute right-2.5 bottom-3.5 p-2 rounded-xl transition-all cursor-pointer shadow-md ${
                      isRecording
                        ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-bounce'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={isRecording ? 'রেকর্ডিং বন্ধ করুন' : 'মাইক চালু করে বাংলায় বলুন'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick Examples */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'bn' ? 'এক ক্লিকে পরীক্ষামূলক উদাহরণ:' : 'Quick Sample Prompts:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'আজ শাকের ভাইয়ের বাজার খরচে ১৫ দিনার দিয়েছি',
                      'নভেম্বরের বেতন জমা হয়েছে ৬২০ দিনার',
                      'সাইফুল আলম পাওনা লোনের ৫০ দিনার ফেরত দিয়েছেন',
                      'কুয়েত রুমে খাওয়ার খরচ ৩.৫০০ দিনার',
                      'বাংলাদেশে ব্যাংকে পাঠালাম ৩৫ দিনার',
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setVoiceInputText(sample);
                          handleParseVoiceText(sample);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isParsingVoice || !voiceInputText.trim()}
                    onClick={() => handleParseVoiceText()}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isParsingVoice ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{lang === 'bn' ? 'এআই বিশ্লেষণ করছে...' : 'Analyzing with AI...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'স্মার্ট বিশ্লেষণ করুন' : 'Analyze with AI'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {voiceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{voiceError}</span>
                </div>
              )}

              {voiceSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{voiceSuccessMsg}</span>
                </div>
              )}

              {/* Parsed Output Card ready for 1-click confirmation */}
              {parsedVoiceTx && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-500/60 p-4 shadow-lg space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'শনাক্তকৃত লেনদেন বিবরণী' : 'Extracted Transaction Details'}</span>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {parsedVoiceTx.section}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium italic">
                    "{parsedVoiceTx.summaryBn}"
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'ধরণ:' : 'Type:'}</span>
                      <span className="font-bold text-slate-900 dark:text-white capitalize">{parsedVoiceTx.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
                      <span className="font-mono font-black text-sm text-emerald-600">
                        {parsedVoiceTx.amount} {parsedVoiceTx.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{parsedVoiceTx.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'খাত / ক্যাটাগরি:' : 'Category:'}</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{parsedVoiceTx.categoryName}</span>
                    </div>
                  </div>

                  {parsedVoiceTx.note && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 p-2 rounded-lg">
                      <span className="font-bold">{lang === 'bn' ? 'নোট: ' : 'Note: '}</span>
                      <span>{parsedVoiceTx.note}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setParsedVoiceTx(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmVoiceTx}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'হিসাবে সেভ করুন' : 'Confirm & Save'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: Receipt / Cash Memo OCR Scanner                                    */}
          {/* ========================================================================= */}
          {activeTab === 'receipt' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'bn' ? 'বাজার বা ক্যাশ মেমোর ছবি আপলোড করুন' : 'Upload Receipt or Invoice Image'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'bn' ? 'এআই ছবি পড়ে নিজে নিজে মোট টাকার অঙ্ক, তারিখ ও পণ্যের তালিকা বের করে নেবে' : 'AI will automatically detect vendor, date, items, and total amount'}
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleReceiptUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    receiptImage
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {receiptImage ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <img
                        src={receiptImage}
                        alt="Receipt preview"
                        className="w-28 h-28 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white shadow-xs"
                      />
                      <div className="text-left space-y-1">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{lang === 'bn' ? 'রসিদের ছবি সিলেক্ট হয়েছে' : 'Receipt Image Selected'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lang === 'bn' ? 'অন্য ছবি পরিবর্তন করতে এখানে ক্লিক করুন' : 'Click to select a different image'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'bn' ? 'রসিদের ছবি নির্বাচন বা ছবি তুলতে ক্লিক করুন' : 'Click to select or capture receipt photo'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, WebP (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  {receiptImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptImage(null);
                        setScannedReceiptData(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
                    >
                      {lang === 'bn' ? 'ছবি মুছুন' : 'Remove Image'}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!receiptImage || isScanningReceipt}
                    onClick={handleScanReceipt}
                    className="ml-auto px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isScanningReceipt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{lang === 'bn' ? 'ছবি স্ক্যান হচ্ছে...' : 'Scanning with Gemini...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'রসিদ স্ক্যান করুন' : 'Scan with AI'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {receiptError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{receiptError}</span>
                </div>
              )}

              {receiptSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{receiptSuccessMsg}</span>
                </div>
              )}

              {/* Scanned Receipt Result */}
              {scannedReceiptData && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-500/60 p-4 shadow-lg space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>{scannedReceiptData.vendorName || 'Extracted Receipt'}</span>
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {scannedReceiptData.totalAmount} {scannedReceiptData.currency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {scannedReceiptData.summaryBn}
                  </p>

                  {/* Itemized list if available */}
                  {scannedReceiptData.items && scannedReceiptData.items.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-100 dark:bg-slate-900 p-2 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'রসিদের পণ্যের তালিকা:' : 'Purchased Items:'}
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-36 overflow-y-auto">
                        {scannedReceiptData.items.map((item: any, i: number) => (
                          <div key={i} className="p-2 flex justify-between items-center text-slate-800 dark:text-slate-200">
                            <span>{item.name}</span>
                            <span className="font-mono font-semibold">{item.price ? `${item.price} ${scannedReceiptData.currency}` : '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setScannedReceiptData(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReceiptTx}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'ভাউচারে সেভ করুন' : 'Save to Accounts'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: Bank SMS & WhatsApp Message Parser                                 */}
          {/* ========================================================================= */}
          {activeTab === 'sms' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'bn' ? 'ব্যাংক এসএমএস বা হোয়াটসঅ্যাপ মেসেজ পেস্ট করুন' : 'Paste Bank SMS or WhatsApp Message'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'bn' ? 'কুয়েত বা বাংলাদেশের ব্যাংকের এসএমএস পেস্ট করলেই এআই লেনদেন সাজিয়ে দেবে' : 'Paste debit/credit text from Kuwait or Bangladesh banks to auto-generate voucher'}
                  </p>
                </div>

                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'NBK: KD 32.500 has been debited from your account ... at LULU HYPERMARKET on 10/11/2026'
                      : 'Paste SMS text here...'
                  }
                  className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Sample SMS buttons */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'bn' ? 'টেস্ট করার জন্য নমুনা এসএমএস:' : 'Sample SMS:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'NBK: KD 18.250 debited from a/c *1234 at SULTAN CENTER on 10/11/2026',
                      'Islami Bank: Tk 50,000 credited to A/C *7890 by Remittance on 08-NOV-2026',
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSmsText(sample);
                          handleParseSms(sample);
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isParsingSms || !smsText.trim()}
                    onClick={() => handleParseSms()}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isParsingSms ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{lang === 'bn' ? 'মেসেজ বিশ্লেষণ হচ্ছে...' : 'Analyzing SMS...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'লেনদেন শনাক্ত করুন' : 'Parse Transaction'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {smsError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{smsError}</span>
                </div>
              )}

              {smsSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{smsSuccessMsg}</span>
                </div>
              )}

              {parsedSmsData && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-500/60 p-4 shadow-lg space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      🏦 {parsedSmsData.bankOrSender}
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {parsedSmsData.amount} {parsedSmsData.currency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    "{parsedSmsData.summaryBn}"
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">ধরণ:</span>
                      <span className="font-bold capitalize">{parsedSmsData.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">তারিখ:</span>
                      <span className="font-mono font-bold">{parsedSmsData.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">স্থান/পার্টি:</span>
                      <span className="font-bold truncate block">{parsedSmsData.merchantOrParty || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setParsedSmsData(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSmsTx}
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'হিসাবে সেভ করুন' : 'Save to Accounts'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: Ask Your Accounts Q&A Chat                                         */}
          {/* ========================================================================= */}
          {activeTab === 'qa' && (
            <div className="flex flex-col h-[480px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              {/* Chat Messages Log */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200 dark:border-slate-700 whitespace-pre-line'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className={`text-[9.5px] block mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isAnsweringQa && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{lang === 'bn' ? 'আপনার হিসাব বিশ্লেষণ করে উত্তর তৈরি করা হচ্ছে...' : 'Analyzing accounts...'}</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Suggested Questions */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  'শাকের ভাই এর অবশিষ্ট ব্যালেন্স কত?',
                  'সাইফুল আলম ভাইয়ের কাছে কত দিনার পাওনা আছে?',
                  'বাংলাদেশের ব্যাংকগুলোতে মোট কত টাকা জমা আছে?',
                  'আমার সবচেয়ে বেশি খরচ হয়েছে কোন খাতে?',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQa(q)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendQa();
                  }}
                  placeholder={lang === 'bn' ? 'হিসাব সম্পর্কে যেকোনো প্রশ্ন বাংলায় লিখুন...' : 'Ask anything about your finances...'}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={!qaQuestion.trim() || isAnsweringQa}
                  onClick={() => handleSendQa()}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: Smart Financial Health & Spending Insights                         */}
          {/* ========================================================================= */}
          {activeTab === 'insights' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-300" />
                    <span>{lang === 'bn' ? 'স্মার্ট এআই অডিট ও আর্থিক স্বাস্থ্য রিপোর্ট' : 'AI Financial Health & Spending Insights'}</span>
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    {lang === 'bn' ? 'আপনার আয়-ব্যয় ও ঋণের ওপর ভিত্তি করে স্বয়ংক্রিয় অডিট ও পরামর্শ' : 'Comprehensive audit analysis and customized financial advice'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoadingInsights}
                  onClick={handleGenerateInsights}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isLoadingInsights ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>{lang === 'bn' ? 'অডিট হচ্ছে...' : 'Auditing...'}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{lang === 'bn' ? 'রিপোর্ট তৈরি করুন' : 'Generate Report'}</span>
                    </>
                  )}
                </button>
              </div>

              {insightsError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{insightsError}</span>
                </div>
              )}

              {insightsText ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {lang === 'bn' ? 'অফিসিয়াল এআই অডিট মূল্যায়ন' : 'Official AI Financial Evaluation'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {insightsText}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'bn' ? 'আপনার আর্থিক অবস্থা বিশ্লেষণ করতে প্রস্তুত' : 'Ready to Analyze Your Accounts'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {lang === 'bn'
                      ? 'উপরের "রিপোর্ট তৈরি করুন" বাটনে ক্লিক করুন। এআই আপনার সব খতিয়ান, ব্যাংক ব্যালেন্স ও লোন হিসাব স্ক্যান করে বিস্তারিত পরামর্শ তৈরি করবে।'
                      : 'Click "Generate Report" above to get an instant AI evaluation of your spending, loans, and savings.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
