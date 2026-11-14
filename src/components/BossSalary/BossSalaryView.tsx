import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Briefcase,
  Plus,
  Printer,
  Download,
  Trash2,
  Calendar,
  FileText,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Receipt,
  X,
  CreditCard,
  Edit2,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import {
  UniversalTransactionEditModal,
  UniversalEditTarget,
} from '../Common/UniversalTransactionEditModal';
import { WhatsAppImageShareModal } from '../Common/WhatsAppImageShareModal';
import { VoucherData, getWhatsAppUrl } from '../../utils/voucherImageGenerator';

export const BossSalaryView: React.FC = () => {
  const {
    data,
    lang,
    t,
    getNextVoucherNo,
    deleteTransaction,
    deleteBossDeposit,
    addBossDeposit,
    addTransaction,
    addCategory,
    openQuickAddWithSection,
  } = useFinance();

  // Selected Month default (defaults to 'all' so entries are never hidden)
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Available unique months from all Boss Salary deposits and transactions
  const availableBossMonths = useMemo(() => {
    const months = new Set<string>();
    data.bossDeposits.forEach((d) => {
      if (d.month) months.add(d.month);
    });
    data.transactions
      .filter((t) => t.section === 'boss-salary')
      .forEach((t) => {
        if (t.date) months.add(t.date.slice(0, 7));
      });
    return Array.from(months).sort().reverse();
  }, [data.bossDeposits, data.transactions]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDepositModal, setShowAddDepositModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [isStatementSlipOpen, setIsStatementSlipOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UniversalEditTarget | null>(null);
  const [shareVoucher, setShareVoucher] = useState<VoucherData | null>(null);

  // New Deposit State
  const [depAmount, setDepAmount] = useState('');
  const [depDate, setDepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [depMonth, setDepMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [depVoucher, setDepVoucher] = useState('');
  const [depNote, setDepNote] = useState('');

  // New Daily Expense State
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expCatId, setExpCatId] = useState('');
  const [expVoucher, setExpVoucher] = useState('');
  const [expNote, setExpNote] = useState('');

  const handleOpenAddExpense = () => {
    setExpVoucher(getNextVoucherNo());
    setShowAddExpenseModal(true);
  };

  const handleOpenAddDeposit = () => {
    setDepVoucher(getNextVoucherNo());
    setShowAddDepositModal(true);
  };

  // Add custom category state inside Add Daily Expense
  const [showNewCategoryBox, setShowNewCategoryBox] = useState(false);
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');

  const handleCreateCustomCategory = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameBn.trim()) return;
    const created = addCategory({
      nameBn: newCatNameBn.trim(),
      nameEn: newCatNameEn.trim() || newCatNameBn.trim(),
      type: 'expense',
      section: 'boss-salary',
      icon: 'tag',
    });
    setExpCatId(created.id);
    setNewCatNameBn('');
    setNewCatNameEn('');
    setShowNewCategoryBox(false);
  };

  // Boss categories
  const bossCategories = useMemo(() => {
    return data.categories.filter((c) => c.section === 'boss-salary');
  }, [data.categories]);

  // Set default expense category
  useState(() => {
    if (bossCategories.length > 0 && !expCatId) {
      setExpCatId(bossCategories[0].id);
    }
  });

  // Deposits for selected month
  const currentMonthDeposits = useMemo(() => {
    return data.bossDeposits.filter((d) => {
      if (selectedMonth !== 'all' && d.month !== selectedMonth) return false;
      return true;
    });
  }, [data.bossDeposits, selectedMonth]);

  const totalDeposited = useMemo(() => {
    return currentMonthDeposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);
  }, [currentMonthDeposits]);

  // Expenses for selected month
  const currentMonthExpenses = useMemo(() => {
    return data.transactions
      .filter((tx) => {
        if (tx.section !== 'boss-salary') return false;
        if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const noteMatch = tx.note?.toLowerCase().includes(q);
          const vchMatch = tx.voucherNo?.toLowerCase().includes(q);
          const catBnMatch = tx.categoryNameBn?.toLowerCase().includes(q);
          const catEnMatch = tx.categoryNameEn?.toLowerCase().includes(q);
          if (!noteMatch && !vchMatch && !catBnMatch && !catEnMatch) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data.transactions, selectedMonth, searchQuery]);

  const totalExpenses = useMemo(() => {
    return currentMonthExpenses.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [currentMonthExpenses]);

  // Accurate Remaining Balance
  const remainingBalance = totalDeposited - totalExpenses;

  // Category expense breakdown for selected month
  const categoryExpenseBreakdown = useMemo(() => {
    const map: Record<string, { id: string; nameBn: string; nameEn: string; total: number }> = {};
    currentMonthExpenses.forEach((tx) => {
      const key = tx.categoryId || 'other';
      if (!map[key]) {
        map[key] = {
          id: key,
          nameBn: tx.categoryNameBn || 'অন্যান্য',
          nameEn: tx.categoryNameEn || 'Other',
          total: 0,
        };
      }
      map[key].total += Number(tx.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [currentMonthExpenses]);

  // WhatsApp Boss Statement Sender (safe anchor click without popup block)
  const handleSendWhatsAppBossStatement = () => {
    const monthName = formatMonth(selectedMonth, lang);
    const lines = categoryExpenseBreakdown
      .map((c) => `• ${lang === 'bn' ? c.nameBn : c.nameEn}: ${c.total.toFixed(3)} KD`)
      .join('\n');
    const message =
      lang === 'bn'
        ? `সালামু আলাইকুম শাকের ভাই।\n${monthName} মাসের খরচের হিসাব বিবরনী:\n\n• মোট জমা প্রাপ্তি: ${totalDeposited.toFixed(3)} KD\n• এ পর্যন্ত মোট খরচ: ${totalExpenses.toFixed(3)} KD\n• বর্তমানে নগদ অবশিষ্ট ব্যালেন্স: ${remainingBalance.toFixed(3)} KD\n\nখাতওয়ারী খরচের তালিকা:\n${lines || 'কোনো খরচ লিপিবদ্ধ হয়নি'}\n\nধন্যবাদ - জুয়েল`
        : `Assalamu Alaikum Shaker Bhai.\nMonthly Expense Statement for ${monthName}:\n\n• Total Received: ${totalDeposited.toFixed(3)} KD\n• Total Expenses: ${totalExpenses.toFixed(3)} KD\n• Net Cash in Hand: ${remainingBalance.toFixed(3)} KD\n\nCategory Breakdown:\n${lines || 'No expenses logged'}\n\nThank you - Juwel`;

    const url = getWhatsAppUrl(undefined, message);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle Add Deposit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(depAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    addBossDeposit({
      month: depMonth,
      depositDate: depDate,
      amount: parsed,
      currency: 'KWD',
      receiptNumber: depVoucher.trim() || undefined,
      note: depNote.trim() || undefined,
    });

    setDepAmount('');
    setDepVoucher('');
    setDepNote('');
    setShowAddDepositModal(false);
  };

  // Handle Add Daily Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(expAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    const cat = data.categories.find((c) => c.id === expCatId);

    addTransaction({
      section: 'boss-salary',
      type: 'expense',
      date: expDate,
      amount: parsed,
      currency: 'KWD',
      categoryId: cat?.id,
      categoryNameBn: cat?.nameBn,
      categoryNameEn: cat?.nameEn,
      voucherNo: expVoucher.trim() || undefined,
      note: expNote.trim() || undefined,
    });

    setExpAmount('');
    setExpVoucher('');
    setExpNote('');
    setShowAddExpenseModal(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'ভাউচার / মেমো #' : 'Voucher #',
      lang === 'bn' ? 'খরচের খাত' : 'Category',
      lang === 'bn' ? 'বিবরণ / মালামাল' : 'Description',
      lang === 'bn' ? 'খরচ (KWD)' : 'Expense (KWD)',
    ];

    const rows = currentMonthExpenses.map((tx) => [
      tx.date,
      tx.voucherNo || '',
      lang === 'bn' ? tx.categoryNameBn || '' : tx.categoryNameEn || tx.categoryNameBn || '',
      tx.note || '',
      tx.amount.toFixed(3),
    ]);

    rows.push([
      'SUMMARY',
      '',
      `Total Received: ${totalDeposited.toFixed(3)} KD`,
      `Total Spent: ${totalExpenses.toFixed(3)} KD`,
      `Remaining Balance: ${remainingBalance.toFixed(3)} KD`,
    ]);

    exportToCSV(`Shaker-Bhai-Salary-Statement-${selectedMonth}`, [headers, ...rows]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Official Print Statement Header (Visible only in print / PDF generation) */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
              Shaker Bhai Salary & Expense Statement
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              শাকের ভাই এর মাসিক বেতন প্রাপ্তি ও খরচ বিবরণী — Month: {formatMonth(selectedMonth, lang)}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">CURRENCY: KWD (Kuwaiti Dinar)</p>
            <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Financial Summary Box for Shaker Bhai */}
        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 border border-slate-300 rounded-lg text-center">
          <div className="border-r border-slate-300">
            <p className="text-xs text-slate-500 font-bold uppercase">Total Fund Received (বেতন জমা)</p>
            <p className="text-lg font-bold font-mono mt-1 text-slate-900">{totalDeposited.toFixed(3)} KD</p>
          </div>
          <div className="border-r border-slate-300">
            <p className="text-xs text-slate-500 font-bold uppercase">Total Spent (মোট খরচ)</p>
            <p className="text-lg font-bold font-mono mt-1 text-slate-900">{totalExpenses.toFixed(3)} KD</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Remaining Balance (অবশিষ্ট ব্যালেন্স)</p>
            <p className="text-lg font-bold font-mono mt-1 text-emerald-800">{remainingBalance.toFixed(3)} KD</p>
          </div>
        </div>
      </div>

      {/* Top Banner & Control Zone */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {lang === 'bn' ? 'শাকের ভাই এর বেতন হিসাব' : 'Shaker Bhai Salary & Expense Ledger'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'শাকের ভাই এর মাসিক বেতন জমা, প্রতিদিনের খরচ এবং অবশিষ্ট ব্যালেন্সের নিখুঁত হিসাব ও প্রিন্ট/পিডিএফ স্টেটমেন্ট'
                : 'Tracks monthly salary received from Shaker Bhai & daily expenses with exact remaining balance'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Smart Month Filter Picker */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="all">{lang === 'bn' ? 'সকল মাসের হিসাব (সর্বমোট)' : 'All Months'}</option>
                {availableBossMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m, lang)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsStatementSlipOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={lang === 'bn' ? 'শাকের ভাইয়ের জন্য মান্থলি স্টেটমেন্ট স্লিপ তৈরি করুন' : 'Boss Monthly Statement Slip'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'বস মান্থলি স্লিপ' : 'Boss Monthly Slip'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsAppBossStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title={lang === 'bn' ? 'পুরো মাসের হিসাব সরাসরি হোয়াটসঅ্যাপে পাঠান' : 'Send Full Statement to WhatsApp'}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title={lang === 'bn' ? 'সরাসরি প্রিন্ট বা PDF ফাইল সেভ করুন' : 'Print or Save PDF'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              onClick={handleOpenAddDeposit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '+ বেতন জমা রেকর্ড' : '+ Add Salary Deposit'}</span>
            </button>

            <button
              onClick={handleOpenAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? '+ দৈনিক খরচ যোগ' : '+ Add Daily Expense'}</span>
            </button>
          </div>
        </div>

        {/* 3 Core Financial Balance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Card 1: Total Salary Deposited */}
          <div className="bg-linear-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-2xl p-4.5 border border-emerald-400/30 shadow-md shadow-emerald-500/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-100 text-[11px] font-bold uppercase tracking-wider">
                <span>{lang === 'bn' ? 'বেতন জমা প্রাপ্তি' : 'Total Salary Deposited'}</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono backdrop-blur-xs">
                  {selectedMonth}
                </span>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {formatCurrency(totalDeposited, 'KWD', lang)}
              </p>
            </div>
            <p className="text-[11px] text-emerald-100/90 mt-2 font-medium">
              {currentMonthDeposits.length > 0
                ? lang === 'bn'
                  ? `✓ মোট ${currentMonthDeposits.length}টি জমা এন্ট্রি লিপিবদ্ধ`
                  : `✓ ${currentMonthDeposits.length} deposit records`
                : lang === 'bn'
                ? 'এই মাসে এখনো বেতন রেকর্ড যোগ হয়নি'
                : 'No deposit added for this month'}
            </p>
          </div>

          {/* Card 2: Total Daily Expenses */}
          <div className="bg-linear-to-br from-rose-600 via-red-600 to-rose-800 text-white rounded-2xl p-4.5 border border-rose-400/30 shadow-md shadow-rose-500/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-rose-100 text-[11px] font-bold uppercase tracking-wider">
                <span>{lang === 'bn' ? 'ফান্ড থেকে মোট খরচ' : 'Total Spent From Fund'}</span>
                <TrendingDown className="w-4 h-4 text-rose-200" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {formatCurrency(totalExpenses, 'KWD', lang)}
              </p>
            </div>
            <p className="text-[11px] text-rose-100/90 mt-2 font-medium">
              {lang === 'bn'
                ? `⚡ মোট ${currentMonthExpenses.length}টি খরচের ভাউচার`
                : `⚡ ${currentMonthExpenses.length} expense vouchers logged`}
            </p>
          </div>

          {/* Card 3: Exact Remaining Balance */}
          <div
            className={`rounded-2xl p-4.5 border shadow-md flex flex-col justify-between text-white ${
              remainingBalance >= 0
                ? 'bg-linear-to-br from-indigo-600 via-blue-600 to-indigo-800 border-indigo-400/30 shadow-indigo-500/15'
                : 'bg-linear-to-br from-amber-600 via-orange-600 to-red-700 border-amber-400/30 shadow-orange-500/15'
            }`}
          >
            <div>
              <div className="flex items-center justify-between opacity-90 text-[11px] font-bold uppercase tracking-wider">
                <span>{lang === 'bn' ? 'অবশিষ্ট ব্যালেন্স (হাতে ক্যাশ)' : 'Remaining Cash Balance'}</span>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {formatCurrency(remainingBalance, 'KWD', lang)}
              </p>
            </div>
            <p className="text-[11px] text-white/90 mt-2 font-medium">
              {remainingBalance >= 0
                ? lang === 'bn'
                  ? '💼 বেতন ফান্ড থেকে খরচ বাদ দিয়ে অবশিষ্ট'
                  : '💼 Fund remaining in hand'
                : lang === 'bn'
                ? '⚠️ সতর্কতা: বেতনের চেয়ে বেশি খরচ হয়েছে!'
                : '⚠️ Warning: Deficit balance'}
            </p>
          </div>
        </div>

        {/* Visual Category Expense Breakdown */}
        {categoryExpenseBreakdown.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                {lang === 'bn' ? 'খাতওয়ারী খরচের বিশ্লেষণ (Category Breakdown)' : 'Monthly Expense Breakdown by Category'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {categoryExpenseBreakdown.length} {lang === 'bn' ? 'টি খাত' : 'categories'}
              </span>
            </div>

            {/* Segmented bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mb-3">
              {categoryExpenseBreakdown.map((cat, idx) => {
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];
                const color = colors[idx % colors.length];
                const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                return (
                  <div
                    key={cat.id}
                    className={`h-full ${color}`}
                    style={{ width: `${pct}%` }}
                    title={`${lang === 'bn' ? cat.nameBn : cat.nameEn}: ${cat.total.toFixed(3)} KD (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Chips list */}
            <div className="flex flex-wrap gap-2">
              {categoryExpenseBreakdown.map((cat, idx) => {
                const colors = ['text-indigo-700 bg-indigo-50 border-indigo-200', 'text-emerald-700 bg-emerald-50 border-emerald-200', 'text-amber-700 bg-amber-50 border-amber-200', 'text-rose-700 bg-rose-50 border-rose-200', 'text-cyan-700 bg-cyan-50 border-cyan-200', 'text-purple-700 bg-purple-50 border-purple-200'];
                const color = colors[idx % colors.length];
                const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                return (
                  <div
                    key={cat.id}
                    className={`px-2.5 py-1 rounded-md text-[11px] border font-medium flex items-center gap-1.5 ${color}`}
                  >
                    <span>{lang === 'bn' ? cat.nameBn : cat.nameEn}</span>
                    <span className="font-mono font-bold">{cat.total.toFixed(3)} KD</span>
                    <span className="text-[9px] opacity-75 font-mono">({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Deposits List (Accordion or Subcard) */}
      {currentMonthDeposits.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs no-print">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'এই মাসের বেতন জমার রেকর্ড' : 'Salary Deposit Entries'}</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-800">
              {formatCurrency(totalDeposited, 'KWD', lang)}
            </span>
          </div>

          <div className="space-y-1.5">
            {currentMonthDeposits.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600">{formatDate(dep.depositDate, lang)}</span>
                  <span className="text-slate-900 font-medium">{dep.note || 'মাসিক বেতন জমা'}</span>
                  {dep.receiptNumber && (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-200/70 px-1 rounded">
                      #{dep.receiptNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-emerald-800 mr-1">{dep.amount.toFixed(3)} KD</span>
                  <button
                    type="button"
                    onClick={() =>
                      setShareVoucher({
                        id: dep.id,
                        voucherNo: dep.receiptNumber || dep.id.slice(-4),
                        date: dep.depositDate,
                        currency: 'KWD',
                        amount: dep.amount,
                        type: 'income',
                        sectionNameBn: 'শাকের ভাই এর বেতন জমা',
                        sectionNameEn: 'Shaker Bhai Salary Deposit',
                        categoryNameBn: 'মাসিক বেতন ফান্ড',
                        categoryNameEn: 'Monthly Salary Deposit',
                        note: dep.note || 'মাসিক বেতন জমা',
                      })
                    }
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer transition-colors"
                    title={lang === 'bn' ? 'ভাউচার ছবি হোয়াটসঅ্যাপে পাঠান' : 'Send Voucher Image to WhatsApp'}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTarget({ id: dep.id, sourceType: 'boss-deposit' })}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                    title={lang === 'bn' ? 'সংশোধন / এডিট করুন' : 'Edit deposit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(lang === 'bn' ? 'এই বেতন জমার রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this deposit?')) {
                        deleteBossDeposit(dep.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Expenses Ledger & Statement Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden print-shadow-none">
        {/* Table Filter & Control Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'bn' ? 'দৈনিক সাইট ও দাপ্তরিক খরচের বিবরণী' : 'Daily Site & Office Expense Statement'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? `বসের ফান্ড থেকে মোট ${currentMonthExpenses.length}টি খরচ লিপিবদ্ধ করা হয়েছে`
                : `Itemized vouchers list (${currentMonthExpenses.length} entries)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'ভাউচার নং বা নোট খুঁজুন...' : 'Search voucher or note...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* The Expense Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'ভাউচার / মেমো #' : 'Voucher #'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'খরচের খাত' : 'Category'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'বিবরণ / মালামাল ক্রয়ের বিবরণ' : 'Description'}</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)'}</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap w-24 no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {currentMonthExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {lang === 'bn'
                      ? 'এই মাসে এখনো কোন খরচের এন্ট্রি নেই। "+ দৈনিক খরচ যোগ" বাটনে ক্লিক করে যুক্ত করুন।'
                      : 'No expenses recorded for this month.'}
                  </td>
                </tr>
              ) : (
                currentMonthExpenses.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-600">
                      {formatDate(tx.date, lang)}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-700 font-semibold">
                      {tx.voucherNo ? tx.voucherNo : '-'}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-semibold text-slate-900">
                      {lang === 'bn' ? tx.categoryNameBn || '-' : tx.categoryNameEn || tx.categoryNameBn || '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 max-w-sm">
                      {tx.note || '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {tx.amount.toFixed(3)} KD
                    </td>
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setShareVoucher({
                              id: tx.id,
                              voucherNo: tx.voucherNo,
                              date: tx.date,
                              currency: 'KWD',
                              amount: tx.amount,
                              type: 'expense',
                              sectionNameBn: 'শাকের ভাই এর বেতন হিসাব',
                              sectionNameEn: 'Shaker Bhai Salary & Expense',
                              categoryNameBn: tx.categoryNameBn || 'অন্যান্য খরচ',
                              categoryNameEn: tx.categoryNameEn || tx.categoryNameBn || 'Expense',
                              note: tx.note,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                          title={lang === 'bn' ? 'ইনভয়েস / ভাউচার ছবি হোয়াটসঅ্যাপে পাঠান' : 'Send Invoice Image to WhatsApp'}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTarget({ id: tx.id, sourceType: 'transaction' })}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title={lang === 'bn' ? 'সংশোধন / এডিট করুন' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(lang === 'bn' ? 'এই খরচের রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this record?')) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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

            {/* Official Accounting Footer with Running Balance */}
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                <td colSpan={4} className="py-2 px-3.5 text-right uppercase tracking-wider text-xs">
                  {lang === 'bn' ? 'মোট খরচ (Total Expenses):' : 'Total Expenses:'}
                </td>
                <td className="py-2 px-3.5 text-right font-mono tabular-nums text-xs text-rose-700">
                  {totalExpenses.toFixed(3)} KD
                </td>
                <td className="no-print"></td>
              </tr>
              <tr className="bg-emerald-50/70 border-t border-emerald-200 font-bold text-emerald-950">
                <td colSpan={4} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-xs">
                  {lang === 'bn' ? 'বেতন ফান্ড থেকে অবশিষ্ট ব্যালেন্স (Remaining Balance):' : 'Remaining Balance:'}
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-sm font-bold text-emerald-900">
                  {remainingBalance.toFixed(3)} KD
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printable Official Boss Signoff Section */}
        <div className="hidden print:flex justify-between items-center px-10 py-12 mt-8 border-t border-slate-300 text-xs">
          <div className="text-center">
            <div className="w-52 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">{lang === 'bn' ? 'প্রস্তুতকারীর স্বাক্ষর' : 'Prepared By'}</p>
            <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'তারিখ ও মোবাইল' : 'Date & Mobile'}</p>
          </div>

          <div className="text-center">
            <div className="w-52 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">{lang === 'bn' ? 'শাকের ভাই এর অনুমোদন ও স্বাক্ষর' : 'Shaker Bhai Approval Signature'}</p>
            <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'অনুমোদিত ব্যালেন্স নিশ্চিতকরণ' : 'Verified & Approved'}</p>
          </div>
        </div>
      </div>

      {/* Modal: Add Salary Deposit */}
      {showAddDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'শাকের ভাই এর বেতন জমা রেকর্ড' : 'Record Salary Deposit'}</span>
              </h3>
              <button
                onClick={() => setShowAddDepositModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কোন মাসের বেতন?' : 'Month'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  value={depMonth}
                  onChange={(e) => setDepMonth(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'প্রাপ্তির তারিখ' : 'Deposit Date'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={depDate}
                  onChange={(e) => setDepDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'বেতন জমার পরিমাণ (KWD দিনার)' : 'Amount (KWD)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="যেমন: 450.000"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    {lang === 'bn' ? 'রসিদ বা ভাউচার নম্বর' : 'Receipt / Voucher #'}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ⚡ {lang === 'bn' ? 'অটো জেনারেটেড' : 'Auto Generated'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1001"
                  value={depVoucher}
                  onChange={(e) => setDepVoucher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট / বিবরণ' : 'Note'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'বসের নগদ ফান্ড হস্তান্তর' : 'Cash received from boss'}
                  value={depNote}
                  onChange={(e) => setDepNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDepositModal(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'জমা সংরক্ষণ' : 'Save Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Daily Expense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-700" />
                <span>{lang === 'bn' ? 'বসের ফান্ড থেকে খরচ যোগ' : 'Add Expense from Boss Fund'}</span>
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'খরচের পরিমাণ (KWD)' : 'Amount (KWD)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    {lang === 'bn' ? 'খরচের খাত / ক্যাটাগরি' : 'Category'} <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryBox(!showNewCategoryBox)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showNewCategoryBox ? (lang === 'bn' ? 'বন্ধ করুন' : 'Close') : (lang === 'bn' ? '+ নতুন ক্যাটাগরি এড' : '+ Add Category')}</span>
                  </button>
                </div>

                {showNewCategoryBox && (
                  <div className="mb-2.5 p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg space-y-2">
                    <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{lang === 'bn' ? 'নতুন খরচের ক্যাটাগরি তৈরি করুন:' : 'Add new expense category:'}</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ক্যাটাগরির নাম (যেমন: গাড়ি তেল)' : 'Category Name (Bangla)'}
                        value={newCatNameBn}
                        onChange={(e) => setNewCatNameBn(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'ইংরেজি নাম (ঐচ্ছিক)' : 'English Name (Optional)'}
                        value={newCatNameEn}
                        onChange={(e) => setNewCatNameEn(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryBox(false)}
                        className="px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCustomCategory}
                        disabled={!newCatNameBn.trim()}
                        className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'ক্যাটাগরি যুক্ত ও সিলেক্ট' : 'Add & Select'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={expCatId}
                  onChange={(e) => setExpCatId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                >
                  {bossCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.nameBn : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    {lang === 'bn' ? 'ভাউচার / মেমো / ক্যাশ রসিদ নং' : 'Voucher / Bill #'}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ⚡ {lang === 'bn' ? 'অটো জেনারেটেড' : 'Auto Generated'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1001"
                  value={expVoucher}
                  onChange={(e) => setExpVoucher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মালামাল বা কাজের বিস্তারিত বিবরণ' : 'Description'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'সাইটের তার ও বোর্ড ক্রয়' : 'Items purchased...'}
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'খরচ সংরক্ষণ' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Boss Monthly Statement Slip */}
      {isStatementSlipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'bn' ? 'বস মান্থলি স্টেটমেন্ট স্লিপ' : 'Boss Monthly Statement Slip'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {formatMonth(selectedMonth, lang)} • {selectedMonth}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStatementSlipOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              {/* Slip Printable Voucher Card */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    MONTHLY EXPENSE STATEMENT SLIP
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Account: Shaker Bhai (শাকের ভাই বেতন ও খরচ হিসাব)
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
                    <span>Month: {formatMonth(selectedMonth, lang)}</span>
                    <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {/* 3 Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white rounded-lg border border-slate-200">
                  <div className="p-2 border-r border-slate-100">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">বেতন জমা</span>
                    <span className="font-mono text-xs font-bold text-emerald-700 block mt-0.5">
                      {totalDeposited.toFixed(3)} KD
                    </span>
                  </div>
                  <div className="p-2 border-r border-slate-100">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">মোট খরচ</span>
                    <span className="font-mono text-xs font-bold text-rose-700 block mt-0.5">
                      {totalExpenses.toFixed(3)} KD
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">অবশিষ্ট ক্যাশ</span>
                    <span className="font-mono text-xs font-bold text-indigo-700 block mt-0.5">
                      {remainingBalance.toFixed(3)} KD
                    </span>
                  </div>
                </div>

                {/* Category breakdown table */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    {lang === 'bn' ? 'খাত অনুযায়ী খরচের বিবরণী:' : 'Category Expense Breakdown:'}
                  </span>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white text-[11px]">
                    {categoryExpenseBreakdown.length === 0 ? (
                      <div className="p-3 text-center text-slate-400">কোনো খরচ রেকর্ড করা হয়নি</div>
                    ) : (
                      categoryExpenseBreakdown.map((cat) => (
                        <div key={cat.id} className="p-2 flex justify-between items-center">
                          <span className="font-medium text-slate-700">
                            {lang === 'bn' ? cat.nameBn : cat.nameEn}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {cat.total.toFixed(3)} KD
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Slip Signatures Footer */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-600">
                  <div className="pt-2 border-t border-slate-400">
                    <span>হিসাব প্রস্তুতকারী: জুয়েল (Juwel)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-400">
                    <span>গ্রাহক / বস: শাকের ভাই</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleSendWhatsAppBossStatement()}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Share to WhatsApp'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsStatementSlipOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Transaction Edit Modal */}
      <UniversalTransactionEditModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        target={editTarget}
      />

      {/* WhatsApp HD Invoice / Voucher Image Share Modal */}
      <WhatsAppImageShareModal
        isOpen={!!shareVoucher}
        onClose={() => setShareVoucher(null)}
        lang={lang}
        voucherData={shareVoucher}
      />
    </div>
  );
};
