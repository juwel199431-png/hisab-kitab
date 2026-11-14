import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Coins,
  Plus,
  Printer,
  Download,
  Trash2,
  Calendar,
  Utensils,
  ShoppingCart,
  Wifi,
  Coffee,
  Truck,
  TrendingDown,
  TrendingUp,
  Receipt,
  Wallet,
  ArrowUpRight,
  HandCoins,
  Handshake,
  Edit2,
  Search,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { KuwaitExtraIncomeView } from '../KuwaitExtraIncome/KuwaitExtraIncomeView';
import { KuwaitLoanTracker } from './KuwaitLoanTracker';
import { KuwaitPayableLoanTracker } from './KuwaitPayableLoanTracker';
import { UniversalTransactionEditModal } from '../Common/UniversalTransactionEditModal';

type KuwaitPersonalSubTab = 'daily-expense' | 'extra-income' | 'receivable-loan' | 'payable-loan';

interface KuwaitPersonalViewProps {
  initialTab?: 'daily-expense' | 'extra-income' | 'receivable-loan' | 'payable-loan' | 'loan';
}

export const KuwaitPersonalView: React.FC<KuwaitPersonalViewProps> = ({ initialTab = 'daily-expense' }) => {
  const {
    data,
    lang,
    t,
    deleteTransaction,
    openQuickAddWithSection,
    addTransaction,
    getKuwaitLoanTotals,
    getKuwaitReceivableTotals,
    getKuwaitPayableTotals,
    isPrivacyMode,
    kwdRate,
  } = useFinance();

  // Active Sub-tab inside Kuwait Personal: 'daily-expense', 'extra-income', 'receivable-loan', 'payable-loan'
  const [activeTab, setActiveTab] = useState<KuwaitPersonalSubTab>(() => {
    if (initialTab === 'loan') return 'receivable-loan';
    return (initialTab as KuwaitPersonalSubTab) || 'daily-expense';
  });

  // Sync if initialTab changes
  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'loan') {
        setActiveTab('receivable-loan');
      } else {
        setActiveTab(initialTab as KuwaitPersonalSubTab);
      }
    }
  }, [initialTab]);

  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Month filter for Daily Expenses (defaults to 'all' so all transactions are always visible)
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick In-Page Entry State for Daily Expense
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCatId, setQuickCatId] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Kuwait personal expense categories
  const kwtCategories = useMemo(() => {
    return data.categories.filter((c) => c.section === 'kuwait-personal');
  }, [data.categories]);

  // Set default quick category
  useEffect(() => {
    if (kwtCategories.length > 0 && !quickCatId) {
      setQuickCatId(kwtCategories[0].id);
    }
  }, [kwtCategories, quickCatId]);

  // Filtered Kuwait daily expense transactions
  const kwtTransactions = useMemo(() => {
    return data.transactions
      .filter((tx) => tx.section === 'kuwait-personal')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions]);

  // Available unique months from all Kuwait personal transactions
  const availableMonths = useMemo(() => {
    return Array.from(new Set(kwtTransactions.map((t) => t.date.slice(0, 7))))
      .filter(Boolean)
      .sort()
      .reverse();
  }, [kwtTransactions]);

  // Month filtered transactions for Daily Expense
  const monthTransactions = useMemo(() => {
    return kwtTransactions.filter((tx) => {
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory && tx.categoryNameBn !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(q);
        const catBnMatch = tx.categoryNameBn?.toLowerCase().includes(q);
        const catEnMatch = tx.categoryNameEn?.toLowerCase().includes(q);
        if (!noteMatch && !catBnMatch && !catEnMatch) return false;
      }
      return true;
    });
  }, [kwtTransactions, selectedMonth, selectedCategory, searchQuery]);

  // Expense Statistics
  const totalMonthlyExpense = useMemo(() => {
    return monthTransactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [monthTransactions]);

  const totalAllTimeExpense = useMemo(() => {
    return kwtTransactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [kwtTransactions]);

  // Extra Income Statistics across all time
  const extraIncomeTransactions = useMemo(() => {
    return data.transactions.filter((tx) => tx.section === 'kuwait-extra-income');
  }, [data.transactions]);

  const totalLifetimeExtraIncome = useMemo(() => {
    return extraIncomeTransactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [extraIncomeTransactions]);

  // Net Kuwait Personal Surplus / Balance
  const netPersonalBalance = totalLifetimeExtraIncome - totalAllTimeExpense;

  // Kuwait Personal Receivable Loans totals (new person-wise system)
  const { totalRemaining: receivableTotalRemaining, activeBorrowersCount: receivableActiveCount } = useMemo(() => {
    return getKuwaitReceivableTotals();
  }, [getKuwaitReceivableTotals, data.kuwaitReceivableTransactions, data.kuwaitReceivableBorrowers]);

  // Kuwait Personal Payable Loans totals
  const { totalRemaining: payableTotalRemaining, activeLendersCount: payableActiveCount } = useMemo(() => {
    return getKuwaitPayableTotals();
  }, [getKuwaitPayableTotals, data.kuwaitPayableTransactions, data.kuwaitPayableLenders]);

  // Category breakdown for this month
  const categorySummary = useMemo(() => {
    const summary: Record<string, { nameBn: string; nameEn: string; total: number; count: number }> = {};
    for (const tx of monthTransactions) {
      const catId = tx.categoryId || 'other';
      if (!summary[catId]) {
        summary[catId] = {
          nameBn: tx.categoryNameBn || 'অন্যান্য',
          nameEn: tx.categoryNameEn || 'Other',
          total: 0,
          count: 0,
        };
      }
      summary[catId].total += Number(tx.amount || 0);
      summary[catId].count += 1;
    }
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [monthTransactions]);

  // Quick submit for Daily Expense
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(quickAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    const cat = data.categories.find((c) => c.id === quickCatId);

    addTransaction({
      section: 'kuwait-personal',
      type: 'expense',
      date: quickDate,
      amount: parsed,
      currency: 'KWD',
      categoryId: cat?.id,
      categoryNameBn: cat?.nameBn,
      categoryNameEn: cat?.nameEn,
      note: quickNote.trim() || undefined,
    });

    setQuickAmount('');
    setQuickNote('');
  };

  // Export Daily Expenses CSV
  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category',
      lang === 'bn' ? 'খরচের পরিমাণ (KWD)' : 'Amount (KWD)',
      lang === 'bn' ? 'নোট / বিবরণ' : 'Note',
    ];

    const rows = monthTransactions.map((tx) => [
      tx.date,
      lang === 'bn' ? tx.categoryNameBn || '' : tx.categoryNameEn || tx.categoryNameBn || '',
      tx.amount.toFixed(3),
      tx.note || '',
    ]);

    exportToCSV(`Kuwait-Expenses-${selectedMonth}`, [headers, ...rows]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Official Print Statement Header */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
              {lang === 'bn' ? 'কুয়েত পার্সোনাল হিসাব — আর্থিক খতিয়ান বিবরণী' : 'Kuwait Personal Accounts Statement'}
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              {lang === 'bn'
                ? 'দৈনিক ব্যক্তিগত খরচ, অতিরিক্ত আয় এবং দিনার লোন হিসাব'
                : 'Personal daily expenses, extra side earnings & dinar loans in KWD'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">মুদ্রা: KWD (কুয়েতি দিনার)</p>
            <p className="font-mono">তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>

      {/* 1. Executive Kuwait Account Hero & Unified Financial Summary */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs no-print">
        {/* Top Executive Dark Slate Band */}
        <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-900 to-teal-950 text-white p-5 sm:p-6">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Account Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🇰🇼
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {lang === 'bn' ? 'কুয়েত এর পার্সোনাল হিসাব' : 'Kuwait Personal Account'}
                  </h2>
                  <span className="text-[11px] font-mono font-semibold text-teal-300/90">
                    · KWD Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-300/90 mt-0.5 max-w-2xl">
                  {lang === 'bn'
                    ? 'দৈনিক ব্যক্তিগত খরচ, অতিরিক্ত আয় এবং ব্যক্তিগত দিনার লোনের স্বয়ংক্রিয় সমন্বিত হিসাব বিবরণী'
                    : 'Personal daily expenses, extra side earnings & dinar personal loans tracked independently in KWD'}
                </p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={lang === 'bn' ? 'কুয়েত পার্সোনাল হিসাব প্রিন্ট বা PDF হিসেবে সেভ করুন' : 'Print or Save PDF'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAddWithSection('kuwait-personal')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নতুন খরচ এন্ট্রি' : 'Add Expense'}</span>
              </button>
            </div>
          </div>

          {/* Unified 5-Column Financial Ribbon (Zero Pill Clutter, Tabular Alignment) */}
          <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/10 rounded-xl bg-white/[0.04] border border-white/10">
            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-slate-400 block">
                {lang === 'bn' ? 'মোট অতিরিক্ত আয়' : 'Extra Income'}
              </span>
              <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-emerald-400 mt-0.5 block">
                {isPrivacyMode ? '••••• KD' : `${totalLifetimeExtraIncome.toFixed(3)} KD`}
              </span>
            </div>

            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-slate-400 block">
                {lang === 'bn' ? 'মোট দৈনিক খরচ' : 'Daily Expenses'}
              </span>
              <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-rose-400 mt-0.5 block">
                {isPrivacyMode ? '••••• KD' : `${totalAllTimeExpense.toFixed(3)} KD`}
              </span>
            </div>

            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-slate-400 block">
                {lang === 'bn' ? 'বকেয়া লোন পাওনা' : 'Receivable Due'}
              </span>
              <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-amber-300 mt-0.5 block">
                {isPrivacyMode ? '••••• KD' : `${receivableTotalRemaining.toFixed(3)} KD`}
              </span>
            </div>

            <div className="px-4 py-3">
              <span className="text-[11px] font-medium text-slate-400 block">
                {lang === 'bn' ? 'বকেয়া দেনা (Payable)' : 'Payable Debt'}
              </span>
              <span className="text-base sm:text-lg font-mono tabular-nums font-bold text-rose-300 mt-0.5 block">
                {isPrivacyMode ? '••••• KD' : `${payableTotalRemaining.toFixed(3)} KD`}
              </span>
            </div>

            <div className="px-4 py-3 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-slate-400 block">
                {lang === 'bn' ? 'পার্সোনাল ব্যালেন্স' : 'Net Surplus'}
              </span>
              <span
                className={`text-base sm:text-lg font-mono tabular-nums font-bold mt-0.5 block ${
                  netPersonalBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {isPrivacyMode ? '••••• KD' : `${netPersonalBalance.toFixed(3)} KD`}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Segmented Sub-Tab Navigation Strip */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveTab('daily-expense')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'daily-expense'
                  ? 'bg-white dark:bg-slate-950 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'দৈনিক খরচ' : 'Daily Expenses'}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-70">· {kwtTransactions.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('extra-income')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'extra-income'
                  ? 'bg-white dark:bg-slate-950 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'অতিরিক্ত আয়' : 'Extra Income'}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-70">· {extraIncomeTransactions.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('receivable-loan')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'receivable-loan'
                  ? 'bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ব্যক্তিগত পাওনা লোন' : 'Receivable Loan'}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-75">
                · {isPrivacyMode ? '•••' : `${receivableTotalRemaining.toFixed(1)} KD`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payable-loan')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'payable-loan'
                  ? 'bg-white dark:bg-slate-950 text-rose-700 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ব্যক্তিগত দেনা লোন' : 'Payable Loan'}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-75">
                · {isPrivacyMode ? '•••' : `${payableTotalRemaining.toFixed(1)} KD`}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden xl:block">
            1 KWD ≈ ৳{kwdRate.toFixed(2)}
          </div>
        </div>
      </div>

      {/* VIEW 1: ”দৈনিক খরচ” (Daily Living Expenses) */}
      {activeTab === 'daily-expense' && (
        <div className="space-y-6">
          {/* Printable Report Header (only shows when printing) */}
          <div className="hidden print:block mb-6 p-4 border-b border-slate-300">
            <div className="text-center">
              <h2 className="text-xl font-bold uppercase tracking-wide">Kuwait Personal Expense Statement</h2>
              <p className="text-xs text-slate-600 mt-1">
                {lang === 'bn' ? 'কুয়েত এর পার্সোনাল হিসাব — দৈনিক খরচ বিবরণী' : 'Daily Living Expenses Report'} — {selectedMonth === 'all' ? (lang === 'bn' ? 'সর্বমোট (সকল মাস)' : 'All Time') : formatMonth(selectedMonth, lang)}
              </p>
              <div className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
                <span>Prepared for: Personal / Audit Review</span>
                <span>Currency: Kuwaiti Dinar (KWD / د.ك)</span>
                <span>Total Spent: {formatCurrency(totalMonthlyExpense, 'KWD', lang)}</span>
              </div>
            </div>
          </div>

          {/* 2. Daily Expense Analytical Overview (Single-Elevation Architectural Panel) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden no-print">
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {lang === 'bn' ? 'দৈনিক খরচ হিসাব ও মাসিক বিবরণী' : 'Daily Expense Overview'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'খাবার, বাজার, রুম ভাড়া, যাতায়াত ইত্যাদির নিয়মিত দৈনন্দিন খরচ বিশ্লেষণ'
                      : 'Track meals, groceries, rent, transport and daily personal living costs'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Smart Month Filter Picker */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden text-xs cursor-pointer"
                  >
                    <option value="all">{lang === 'bn' ? 'সকল মাসের খরচ (সর্বমোট)' : 'All Months'}</option>
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {formatMonth(m, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* 3-Column Structured Metric Grid (No Card-Inside-Card Sandwiches) */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800">
              {/* Primary Metric Focal Anchor */}
              <div className="p-5 bg-amber-50/35 dark:bg-amber-950/15">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/90">
                    {selectedMonth === 'all'
                      ? lang === 'bn' ? 'সর্বমোট খরচ (সকল মাস)' : 'Total Expense · All Time'
                      : lang === 'bn' ? `${formatMonth(selectedMonth, lang)} - মোট খরচ` : `Total Expense · ${selectedMonth}`}
                  </span>
                  <span className="text-[11px] font-mono text-amber-800/80 dark:text-amber-400">
                    {monthTransactions.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-2 tracking-tight">
                  {isPrivacyMode ? '•••••• KWD' : formatCurrency(totalMonthlyExpense, 'KWD', lang)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-1">
                  {isPrivacyMode
                    ? '≈ ৳••••••'
                    : `≈ ৳${Math.round(totalMonthlyExpense * kwdRate).toLocaleString('en-US')} BDT`}
                </p>
              </div>

              {/* Metric 2: Daily Average */}
              <div className="p-5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  {lang === 'bn' ? 'দৈনিক গড় খরচ (৩০ দিনের হিসাব)' : 'Daily Average Spent'}
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-2 tracking-tight">
                  {isPrivacyMode
                    ? '•••••• KWD'
                    : formatCurrency(monthTransactions.length > 0 ? totalMonthlyExpense / 30 : 0, 'KWD', lang)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn' ? 'প্রতিদিনের গড় ব্যয়ের হার' : '30-day rolling daily baseline'}
                </p>
              </div>

              {/* Metric 3: Top Expense Sector with share bar */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {lang === 'bn' ? 'প্রধান খরচের খাত' : 'Top Expense Sector'}
                  </span>
                  {categorySummary[0] && totalMonthlyExpense > 0 && (
                    <span className="text-[11px] font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">
                      {((categorySummary[0].total / totalMonthlyExpense) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate mt-2">
                  {categorySummary[0]
                    ? lang === 'bn'
                      ? categorySummary[0].nameBn
                      : categorySummary[0].nameEn
                    : '—'}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                    {categorySummary[0]
                      ? isPrivacyMode
                        ? '•••• KWD'
                        : formatCurrency(categorySummary[0].total, 'KWD', lang)
                      : '0.000 KWD'}
                  </span>
                  {categorySummary[0] && totalMonthlyExpense > 0 && (
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((categorySummary[0].total / totalMonthlyExpense) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Express 1-Click Expense Entry Dock */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs no-print">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {lang === 'bn' ? 'ঝটপট দৈনিক খরচ এন্ট্রি (১-ক্লিক)' : 'Instant 1-Click Expense Entry'}
                </h3>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">· KWD</span>
              </div>

              {/* Clean Segmented Preset Keypad Strip */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0].map((kd) => {
                  const isActivePreset = quickAmount === kd.toFixed(3);
                  return (
                    <button
                      key={kd}
                      type="button"
                      onClick={() => setQuickAmount(kd.toFixed(3))}
                      className={`px-2.5 py-1 text-[11px] font-mono tabular-nums font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        isActivePreset
                          ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      {kd.toFixed(3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              <div className="lg:col-span-3 relative">
                <input
                  type="number"
                  step="0.001"
                  placeholder={lang === 'bn' ? 'দিনার পরিমাণ (যেমন 1.250)' : 'Amount KWD (e.g. 1.250)'}
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="lg:col-span-3">
                <select
                  value={quickCatId}
                  onChange={(e) => setQuickCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  {kwtCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.nameBn : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'বিবরণ (যেমন: দুপুরের খাবার)' : 'Note / Description'}
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="lg:col-span-3 flex gap-2">
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'এন্ট্রি' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 4. Category Breakdown & Ledger Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Category Summary */}
            <div className="lg:col-span-1 space-y-4 no-print">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                    {lang === 'bn' ? 'খাত অনুযায়ী মোট খরচ' : 'Category Breakdown'}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {categorySummary.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {categorySummary.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
                      {lang === 'bn' ? 'এই সময়কালে কোনো খরচ এন্ট্রি করা হয়নি' : 'No expenses recorded'}
                    </p>
                  ) : (
                    categorySummary.map((item, idx) => {
                      const percent = totalMonthlyExpense > 0 ? (item.total / totalMonthlyExpense) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-2">
                              {lang === 'bn' ? item.nameBn : item.nameEn}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white shrink-0">
                              {isPrivacyMode ? '•••• KD' : `${item.total.toFixed(3)} KD`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono tabular-nums text-slate-400 w-9 text-right">
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right: Full Expense Table (Printable) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden print-shadow-none">
              {/* Table Controls (hidden in print) */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'দৈনিক খরচের তালিকা' : 'Daily Expense Ledger'}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {monthTransactions.length} {lang === 'bn' ? 'টি আইটেম' : 'items'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Live Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === 'bn' ? 'খুঁজুন...' : 'Search ledger...'}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 w-36 sm:w-44"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                  >
                    <option value="all">{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
                    {kwtCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bn' ? c.nameBn : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3 px-4 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="py-3 px-4 whitespace-nowrap">{lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}</th>
                      <th className="py-3 px-4 whitespace-nowrap">{lang === 'bn' ? 'বিবরণ / নোট' : 'Note'}</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)'}</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap w-16 no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                    {monthTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 dark:text-slate-500">
                          {lang === 'bn'
                            ? 'কোনো খরচের এন্ট্রি পাওয়া যায়নি। উপরের ফর্ম দিয়ে ঝটপট এন্ট্রি করুন।'
                            : 'No expenses found for the selected filter.'}
                        </td>
                      </tr>
                    ) : (
                      monthTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {formatDate(tx.date, lang)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                            {lang === 'bn' ? tx.categoryNameBn || '—' : tx.categoryNameEn || tx.categoryNameBn || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm">
                            {tx.note || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-amber-400 whitespace-nowrap">
                            {isPrivacyMode ? '••••• KD' : `${tx.amount.toFixed(3)} KD`}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingTxId(tx.id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'bn' ? 'সংশোধন / এডিট করুন' : 'Edit'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(lang === 'bn' ? 'এই খরচের এন্ট্রিটি মুছে ফেলতে চান?' : 'Delete this expense?')) {
                                    deleteTransaction(tx.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Table Footer with Total */}
                  {monthTransactions.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                        <td colSpan={3} className="py-3 px-4 text-right text-xs text-slate-600 dark:text-slate-300">
                          {lang === 'bn' ? 'সর্বমোট খরচ:' : 'Total Filtered Expenses:'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-sm text-amber-700 dark:text-amber-400 font-extrabold">
                          {isPrivacyMode ? '•••••• KD' : `${totalMonthlyExpense.toFixed(3)} KD`}
                        </td>
                        <td className="no-print"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Printable signature for review */}
              <div className="hidden print:flex justify-between items-center px-8 py-10 mt-6 border-t border-slate-300 text-xs">
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-2"></div>
                  <span>Employee Signature / প্রস্তুতকারীর স্বাক্ষর</span>
                </div>
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-2"></div>
                  <span>Approved by Boss / অনুমোদন স্বাক্ষর</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ”অতিরিক্ত আয়” (Extra Side Earnings - Strictly Income & Running Accumulation) */}
      {activeTab === 'extra-income' && (
        <KuwaitExtraIncomeView embedded={true} />
      )}

      {/* VIEW 3: ”Personal Receivable Loan” (Personal Dinar Loans Given & Collection Tracking) */}
      {(activeTab === 'receivable-loan' || (activeTab as string) === 'loan') && (
        <KuwaitLoanTracker />
      )}

      {/* VIEW 4: ”Personal Payable Loan” (Personal Dinar Loans Borrowed & Repayment Tracking) */}
      {activeTab === 'payable-loan' && (
        <KuwaitPayableLoanTracker />
      )}

      {/* Universal Transaction Edit Modal */}
      <UniversalTransactionEditModal
        isOpen={!!editingTxId}
        onClose={() => setEditingTxId(null)}
        target={editingTxId ? { id: editingTxId, sourceType: 'transaction' } : null}
      />
    </div>
  );
};

