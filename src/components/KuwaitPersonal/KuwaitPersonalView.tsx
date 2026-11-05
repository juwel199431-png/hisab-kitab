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
  Sparkles,
  TrendingDown,
  TrendingUp,
  Receipt,
  Wallet,
  ArrowUpRight,
  HandCoins,
  Handshake,
  Edit2,
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

  // Current Month default for Daily Expenses
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

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

      {/* Top Banner & Kuwait Personal Account Navigation */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        {/* Main Title Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🇰🇼</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {lang === 'bn' ? 'কুয়েত এর পার্সোনাল হিসাব' : 'Kuwait Personal Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'bn'
                    ? 'দৈনিক ব্যক্তিগত খরচ, অতিরিক্ত আয় এবং ব্যক্তিগত দিনার লোনের আলাদা আলাদা স্বয়ংক্রিয় হিসাব বিবরনী (মুদ্রা: কুয়েতি দিনার / KWD)'
                    : 'Personal daily expenses, extra side earnings & dinar personal loans tracked independently in KWD'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
              <span className="text-slate-500">{lang === 'bn' ? 'মোট অতিরিক্ত আয়:' : 'Extra Income:'}</span>
              <span className="font-mono font-bold text-teal-800">
                {totalLifetimeExtraIncome.toFixed(3)} KD
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
              <span className="text-slate-500">{lang === 'bn' ? 'মোট দৈনিক খরচ:' : 'Daily Expenses:'}</span>
              <span className="font-mono font-bold text-rose-700">
                {totalAllTimeExpense.toFixed(3)} KD
              </span>
            </div>

            {receivableTotalRemaining > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-medium">
                <span className="text-amber-800">{lang === 'bn' ? 'বকেয়া লোন পাওনা:' : 'Receivable Due:'}</span>
                <span className="font-mono font-bold text-amber-900">
                  {receivableTotalRemaining.toFixed(3)} KD
                </span>
              </div>
            )}

            {payableTotalRemaining > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-300 rounded-lg text-xs font-medium">
                <span className="text-rose-800">{lang === 'bn' ? 'বকেয়া দেনা (Payable):' : 'Payable Debt:'}</span>
                <span className="font-mono font-bold text-rose-900">
                  {payableTotalRemaining.toFixed(3)} KD
                </span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold ${
                netPersonalBalance >= 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <span>{lang === 'bn' ? 'পার্সোনাল ব্যালেন্স:' : 'Net Surplus:'}</span>
              <span className="font-mono">{netPersonalBalance.toFixed(3)} KD</span>
            </div>
          </div>
        </div>

        {/* The Distinct Sub-Heads / Tabs: ”দৈনিক খরচ”, ”অতিরিক্ত আয়”, ”Personal Receivable Loan”, & ”Personal Payable Loan” */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <button
            onClick={() => setActiveTab('daily-expense')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'daily-expense'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{lang === 'bn' ? 'দৈনিক খরচ' : 'Daily Expenses'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'daily-expense' ? 'bg-amber-700/80 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {kwtTransactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('extra-income')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'extra-income'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'bn' ? 'অতিরিক্ত আয়' : 'Extra Income'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'extra-income' ? 'bg-teal-800/80 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {extraIncomeTransactions.length}
            </span>
          </button>

          {/* Personal Receivable Loan (Previously Loan Account) */}
          <button
            onClick={() => setActiveTab('receivable-loan')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'receivable-loan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>Personal Receivable Loan</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'receivable-loan'
                  ? 'bg-indigo-700/80 text-white'
                  : receivableTotalRemaining > 0
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {receivableTotalRemaining > 0 ? `${receivableTotalRemaining.toFixed(1)} KD` : '0 KD'}
            </span>
          </button>

          {/* Personal Payable Loan */}
          <button
            onClick={() => setActiveTab('payable-loan')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'payable-loan'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Handshake className="w-4 h-4" />
            <span>Personal Payable Loan</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'payable-loan'
                  ? 'bg-rose-700/80 text-white'
                  : payableTotalRemaining > 0
                  ? 'bg-rose-100 text-rose-800 font-bold'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {payableTotalRemaining > 0 ? `${payableTotalRemaining.toFixed(1)} KD` : '0 KD'}
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="sm:ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title={lang === 'bn' ? 'কুয়েত পার্সোনাল হিসাব প্রিন্ট বা PDF হিসেবে সেভ করুন' : 'Print or Save PDF'}
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>{lang === 'bn' ? 'প্রিন্ট / PDF রিপোর্ট' : 'Print / PDF'}</span>
          </button>
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
                {lang === 'bn' ? 'কুয়েত এর পার্সোনাল হিসাব — দৈনিক খরচ বিবরণী' : 'Daily Living Expenses Report'} — {formatMonth(selectedMonth, lang)}
              </p>
              <div className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
                <span>Prepared for: Juwel / Boss Review</span>
                <span>Currency: Kuwaiti Dinar (KWD / د.ك)</span>
                <span>Total Spent: {formatCurrency(totalMonthlyExpense, 'KWD', lang)}</span>
              </div>
            </div>
          </div>

          {/* Daily Expense Controls & Monthly KPIs */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'bn' ? 'দৈনিক খরচ হিসাব ও মাসিক বিবরণী' : 'Daily Expense Overview'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'bn'
                    ? 'খাবার, বাজার, রুম ভাড়া, যাতায়াত ইত্যাদির নিয়মিত দৈনন্দিন খরচ'
                    : 'Track meals, groceries, rent, transport and daily personal living costs'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Month Filter Picker */}
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs"
                  />
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>{lang === 'bn' ? 'প্রিন্ট / PDF রিপোর্ট' : 'Print / PDF Report'}</span>
                </button>

                <button
                  onClick={() => openQuickAddWithSection('kuwait-personal')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নতুন খরচ এন্ট্রি' : 'Add Expense'}</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-amber-50/60 rounded-lg p-3.5 border border-amber-200/80">
                <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  {lang === 'bn' ? `${formatMonth(selectedMonth, lang)} - মোট খরচ` : `Total Expense (${selectedMonth})`}
                </p>
                <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums mt-1">
                  {formatCurrency(totalMonthlyExpense, 'KWD', lang)}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {lang === 'bn' ? `মোট ${monthTransactions.length}টি খরচ লিপিবদ্ধ` : `${monthTransactions.length} items logged`}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === 'bn' ? 'দৈনিক গড় খরচ' : 'Daily Average Spent'}
                </p>
                <p className="text-xl font-bold text-slate-800 font-mono tabular-nums mt-1">
                  {formatCurrency(monthTransactions.length > 0 ? totalMonthlyExpense / 30 : 0, 'KWD', lang)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'bn' ? 'প্রতিদিন আনুমানিক খরচ' : 'Average per day (30d base)'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === 'bn' ? 'প্রধান খরচের খাত' : 'Top Expense Sector'}
                </p>
                <p className="text-base font-bold text-slate-800 truncate mt-1">
                  {categorySummary[0]
                    ? lang === 'bn'
                      ? categorySummary[0].nameBn
                      : categorySummary[0].nameEn
                    : '-'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {categorySummary[0] ? formatCurrency(categorySummary[0].total, 'KWD', lang) : ''}
                </p>
              </div>
            </div>
          </div>

          {/* In-Line Rapid Expense Entry Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs no-print">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'bn' ? 'ঝটপট দৈনিক খরচ এন্ট্রি (১-ক্লিক)' : 'Instant 1-Click Expense Entry'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'মুদ্রা: কুয়েতি দিনার (KWD)' : 'Currency: KWD'}
              </span>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-3">
              {/* Quick preset chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px] mr-1">{lang === 'bn' ? 'কুইক অ্যামাউন্ট:' : 'Presets:'}</span>
                {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0].map((kd) => (
                  <button
                    key={kd}
                    type="button"
                    onClick={() => setQuickAmount(kd.toFixed(3))}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      quickAmount === kd.toFixed(3)
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {kd.toFixed(3)} KD
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <input
                    type="number"
                    step="0.001"
                    placeholder={lang === 'bn' ? 'দিনার পরিমাণ (যেমন 1.250)' : 'Amount KWD (e.g. 1.250)'}
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <select
                    value={quickCatId}
                    onChange={(e) => setQuickCatId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    {kwtCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bn' ? c.nameBn : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'বিবরণ (যেমন: দুপুরের খাবার)' : 'Note / Description'}
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors whitespace-nowrap"
                  >
                    {lang === 'bn' ? 'এন্ট্রি করুন' : 'Add'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Category Breakdown & Ledger Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Category Summary Cards */}
            <div className="lg:col-span-1 space-y-4 no-print">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  {lang === 'bn' ? 'খাত অনুযায়ী মোট খরচ' : 'Monthly Category Breakdown'}
                </h3>
                <div className="space-y-2.5">
                  {categorySummary.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      {lang === 'bn' ? 'এই মাসে এখনো কোন খরচ এন্ট্রি করা হয়নি' : 'No expenses recorded this month'}
                    </p>
                  ) : (
                    categorySummary.map((item, idx) => {
                      const percent = totalMonthlyExpense > 0 ? (item.total / totalMonthlyExpense) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate pr-2">
                              {lang === 'bn' ? item.nameBn : item.nameEn}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-slate-900 shrink-0">
                              {formatCurrency(item.total, 'KWD', lang)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right: Full Expense Table (Printable) */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden print-shadow-none">
              {/* Table Controls (hidden in print) */}
              <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {lang === 'bn' ? 'দৈনিক খরচের তালিকা' : 'Daily Expense Ledger'}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({monthTransactions.length} {lang === 'bn' ? 'টি আইটেম' : 'items'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    <option value="all">{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
                    {kwtCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bn' ? c.nameBn : c.nameEn}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'বিবরণ / নোট' : 'Note'}</th>
                      <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)'}</th>
                      <th className="py-2.5 px-3.5 text-center whitespace-nowrap w-14 no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {monthTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">
                          {lang === 'bn'
                            ? 'এই মাসে এখনো কোন খরচের এন্ট্রি নেই। উপরের ফর্ম দিয়ে ঝটপট এন্ট্রি করুন।'
                            : 'No expenses recorded for this month.'}
                        </td>
                      </tr>
                    ) : (
                      monthTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-600">
                            {formatDate(tx.date, lang)}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-semibold text-slate-900">
                            {lang === 'bn' ? tx.categoryNameBn || '-' : tx.categoryNameEn || tx.categoryNameBn || '-'}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 max-w-sm">
                            {tx.note || '-'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-bold text-amber-900 whitespace-nowrap">
                            {tx.amount.toFixed(3)} KD
                          </td>
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap no-print">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingTxId(tx.id)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title={lang === 'bn' ? 'সংশোধন / এডিট করুন' : 'Edit'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(lang === 'bn' ? 'এই খরচের এন্ট্রিটি মুছে ফেলতে চান?' : 'Delete this expense?')) {
                                    deleteTransaction(tx.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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
                      <tr className="bg-amber-50/70 border-t-2 border-slate-300 font-bold text-slate-900">
                        <td colSpan={3} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-xs">
                          {lang === 'bn' ? 'সর্বমোট মাসিক খরচ:' : 'Total Monthly Expenses:'}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-sm text-amber-950 font-bold">
                          {totalMonthlyExpense.toFixed(3)} KD
                        </td>
                        <td className="no-print"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Printable signature for Boss review */}
              <div className="hidden print:flex justify-between items-center px-8 py-10 mt-6 border-t border-slate-300 text-xs">
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-2"></div>
                  <span>Employee Signature / প্রস্তুতকারীর স্বাক্ষর</span>
                </div>
                <div className="text-center">
                  <div className="w-48 border-b border-slate-400 mb-2"></div>
                  <span>Approved by Boss / বসের অনুমোদন স্বাক্ষর</span>
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

