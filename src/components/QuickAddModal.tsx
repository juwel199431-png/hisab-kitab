import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  X,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Coins,
  Briefcase,
  Plus,
  UserCheck,
  Sparkles,
  HandCoins,
} from 'lucide-react';
import { AccountSection, Category, TransactionType } from '../types/finance';

type EntryMode =
  | 'bd-expense'
  | 'bd-income'
  | 'bd-transfer'
  | 'boss-expense'
  | 'boss-deposit'
  | 'emdad-expense'
  | 'kuwait-personal'
  | 'kuwait-extra-income'
  | 'kuwait-loan';

export const QuickAddModal: React.FC = () => {
  const {
    data,
    lang,
    t,
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddDefaultSection,
    activeSection,
    getNextVoucherNo,
    addTransaction,
    addBossDeposit,
    addKuwaitLoan,
  } = useFinance();

  // Determine initial mode based on active section
  const [mode, setMode] = useState<EntryMode>('bd-expense');

  // Form Fields
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [bankId, setBankId] = useState('');
  const [fromBankId, setFromBankId] = useState('');
  const [toBankId, setToBankId] = useState('');
  const [transferTargetType, setTransferTargetType] = useState<'bank' | 'dps' | 'insurance'>('bank');
  const [targetSavingsId, setTargetSavingsId] = useState('');
  const [note, setNote] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [borrowerName, setBorrowerName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Sync mode with section when opened
  useEffect(() => {
    if (isQuickAddOpen) {
      const section = quickAddDefaultSection || activeSection;
      if (section === 'emdad-expense') {
        setMode('emdad-expense');
      } else if (section === 'kuwait-extra-income') {
        setMode('kuwait-extra-income');
      } else if (section === 'kuwait-personal') {
        setMode('kuwait-personal');
      } else if (section === 'boss-salary') {
        setMode('boss-expense');
      } else if (section === 'savings-portfolio') {
        setMode('bd-transfer');
        setTransferTargetType('dps');
      } else {
        setMode('bd-expense');
      }
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setNote('');
      setVoucherNo(getNextVoucherNo());
      setPaymentStatus('unpaid');
      if (data.banks.length > 0) {
        setBankId(data.banks[0].id);
        setFromBankId(data.banks[0].id);
        if (data.banks.length > 1) {
          setToBankId(data.banks[1].id);
        }
      }
      if (data.savingsAccounts.length > 0) {
        setTargetSavingsId(data.savingsAccounts[0].id);
      }
    }
  }, [isQuickAddOpen, quickAddDefaultSection, activeSection, data.banks, data.savingsAccounts]);

  // Set default category on mode change
  useEffect(() => {
    let relevantCategories: Category[] = [];
    if (mode === 'bd-expense') {
      relevantCategories = data.categories.filter((c) => c.section === 'bd-bank' && c.type === 'expense');
    } else if (mode === 'bd-income') {
      relevantCategories = data.categories.filter((c) => c.section === 'bd-bank' && c.type === 'income');
    } else if (mode === 'kuwait-personal') {
      relevantCategories = data.categories.filter((c) => c.section === 'kuwait-personal');
    } else if (mode === 'boss-expense') {
      relevantCategories = data.categories.filter((c) => c.section === 'boss-salary');
    }
    if (relevantCategories.length > 0 && !categoryId) {
      setCategoryId(relevantCategories[0].id);
    }
  }, [mode, data.categories, categoryId]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bn' ? 'সঠিক টাকার পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }

    // 1. Shaker Bhai Salary Deposit
    if (mode === 'boss-deposit') {
      addBossDeposit({
        month,
        depositDate: date,
        amount: parsedAmount,
        currency: 'KWD',
        note: note.trim() || undefined,
        receiptNumber: voucherNo.trim() || undefined,
      });
      setIsQuickAddOpen(false);
      return;
    }

    // 2. Emdad Bhai Expense (NO CATEGORY, Strictly Expense, Paid/Unpaid)
    if (mode === 'emdad-expense') {
      if (!note.trim()) {
        alert(lang === 'bn' ? 'খরচের বিবরণ লিখুন' : 'Please describe the expense');
        return;
      }
      addTransaction({
        section: 'emdad-expense',
        type: 'expense',
        date,
        amount: parsedAmount,
        currency: 'KWD',
        note: note.trim(),
        paymentStatus,
        voucherNo: voucherNo.trim() || undefined,
      });
      setIsQuickAddOpen(false);
      return;
    }

    // 3. Kuwait Extra Income (NO CATEGORY, Strictly Income, Running deposit)
    if (mode === 'kuwait-extra-income') {
      if (!note.trim()) {
        alert(lang === 'bn' ? 'আয়ের উৎস বা বিবরণ লিখুন' : 'Please describe the income source');
        return;
      }
      addTransaction({
        section: 'kuwait-extra-income',
        type: 'income',
        date,
        amount: parsedAmount,
        currency: 'KWD',
        note: note.trim(),
        voucherNo: voucherNo.trim() || undefined,
      });
      setIsQuickAddOpen(false);
      return;
    }

    // 4. Kuwait Personal Loan Given (Strictly Loans, Zero Income)
    if (mode === 'kuwait-loan') {
      if (!borrowerName.trim()) {
        alert(lang === 'bn' ? 'অনুগ্রহ করে ঋণগ্রহীতার নাম লিখুন' : 'Please enter borrower name');
        return;
      }
      addKuwaitLoan({
        borrowerName: borrowerName.trim(),
        amount: parsedAmount,
        date,
        dueDate: dueDate.trim() || undefined,
        status: paymentStatus,
        note: note.trim() || undefined,
      });
      setIsQuickAddOpen(false);
      return;
    }

    // 5. Bangladesh Bank Transfer / DPS / Insurance
    if (mode === 'bd-transfer') {
      if (!fromBankId) {
        alert(lang === 'bn' ? 'কোন ব্যাংক থেকে টাকা কর্তন হবে তা নির্বাচন করুন' : 'Select source bank');
        return;
      }
      if (transferTargetType === 'bank' && fromBankId === toBankId) {
        alert(lang === 'bn' ? 'দুটি ভিন্ন ব্যাংক নির্বাচন করুন' : 'Source and destination banks must be different');
        return;
      }

      const targetDpsOrIns = data.savingsAccounts.find((s) => s.id === targetSavingsId);
      const catNameBn =
        transferTargetType === 'dps'
          ? 'ডিপিএস কিস্তি জমা'
          : transferTargetType === 'insurance'
          ? 'ইন্সুরেন্স প্রিমিয়াম জমা'
          : 'ব্যাংক ফান্ড ট্রান্সফার';
      const catNameEn =
        transferTargetType === 'dps'
          ? 'DPS Deposit'
          : transferTargetType === 'insurance'
          ? 'Insurance Premium'
          : 'Bank Fund Transfer';

      addTransaction({
        section: 'bd-bank',
        type: 'transfer',
        date,
        amount: parsedAmount,
        currency: 'BDT',
        fromBankId,
        toBankId: transferTargetType === 'bank' ? toBankId : undefined,
        transferTargetType,
        targetSavingsId: transferTargetType !== 'bank' ? targetSavingsId : undefined,
        categoryNameBn: catNameBn,
        categoryNameEn: catNameEn,
        voucherNo: voucherNo.trim() || undefined,
        note:
          note.trim() ||
          (transferTargetType !== 'bank' && targetDpsOrIns
            ? `${targetDpsOrIns.name} এ জমা`
            : undefined),
      });

      setIsQuickAddOpen(false);
      return;
    }

    // 5. Standard BD Bank or Kuwait Daily or Shaker Bhai Expense
    const selectedCategory = data.categories.find((c) => c.id === categoryId);
    const section: AccountSection =
      mode === 'kuwait-personal' ? 'kuwait-personal' : mode === 'boss-expense' ? 'boss-salary' : 'bd-bank';
    const type: TransactionType = mode === 'bd-income' ? 'income' : 'expense';
    const currency = section === 'bd-bank' ? 'BDT' : 'KWD';

    addTransaction({
      section,
      type,
      date,
      amount: parsedAmount,
      currency,
      categoryId: selectedCategory?.id,
      categoryNameBn: selectedCategory?.nameBn,
      categoryNameEn: selectedCategory?.nameEn,
      bankId: section === 'bd-bank' ? bankId : undefined,
      voucherNo: voucherNo.trim() || undefined,
      note: note.trim() || undefined,
    });

    setIsQuickAddOpen(false);
  };

  const relevantCategories = data.categories.filter((c) => {
    if (mode === 'bd-expense') return c.section === 'bd-bank' && c.type === 'expense';
    if (mode === 'bd-income') return c.section === 'bd-bank' && c.type === 'income';
    if (mode === 'kuwait-personal') return c.section === 'kuwait-personal';
    if (mode === 'boss-expense') return c.section === 'boss-salary';
    return false;
  });

  const isKwdCurrency =
    mode === 'kuwait-personal' ||
    mode === 'boss-expense' ||
    mode === 'boss-deposit' ||
    mode === 'emdad-expense' ||
    mode === 'kuwait-extra-income' ||
    mode === 'kuwait-loan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'bn' ? 'নতুন লেনদেন এন্ট্রি' : 'Quick Financial Entry'}
            </h2>
          </div>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-4 pt-3 pb-2.5 border-b border-slate-200 bg-white">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {lang === 'bn' ? 'লেনদেনের ধরণ নির্বাচন করুন' : 'Select Entry Type'}
          </p>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {/* BD Expense */}
            <button
              type="button"
              onClick={() => {
                setMode('bd-expense');
                setCategoryId('');
              }}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'bd-expense'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'বিডি খরচ' : 'BD Expense'}</span>
            </button>

            {/* BD Income */}
            <button
              type="button"
              onClick={() => {
                setMode('bd-income');
                setCategoryId('');
              }}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'bd-income'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'বিডি জমা' : 'BD Income'}</span>
            </button>

            {/* BD Transfer */}
            <button
              type="button"
              onClick={() => setMode('bd-transfer')}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'bd-transfer'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'ট্রান্সফার' : 'Transfer'}</span>
            </button>

            {/* Shaker Bhai Expense */}
            <button
              type="button"
              onClick={() => {
                setMode('boss-expense');
                setCategoryId('');
              }}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'boss-expense'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'শাকের ভাই খরচ' : 'Shaker Exp'}</span>
            </button>

            {/* Shaker Bhai Salary Deposit */}
            <button
              type="button"
              onClick={() => setMode('boss-deposit')}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'boss-deposit'
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'বেতন জমা' : 'Salary Dep'}</span>
            </button>

            {/* Emdad Bhai Expense */}
            <button
              type="button"
              onClick={() => setMode('emdad-expense')}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'emdad-expense'
                  ? 'bg-rose-700 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'ইমদাদ ভাই' : 'Emdad Exp'}</span>
            </button>

            {/* Kuwait Daily Personal */}
            <button
              type="button"
              onClick={() => {
                setMode('kuwait-personal');
                setCategoryId('');
              }}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'kuwait-personal'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'দৈনিক খরচ' : 'Daily Exp'}</span>
            </button>

            {/* Kuwait Extra Income */}
            <button
              type="button"
              onClick={() => setMode('kuwait-extra-income')}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'kuwait-extra-income'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'অতিরিক্ত আয়' : 'KW Extra'}</span>
            </button>

            {/* Kuwait Dinar Loan Given */}
            <button
              type="button"
              onClick={() => setMode('kuwait-loan')}
              className={`py-1.5 px-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors text-center ${
                mode === 'kuwait-loan'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[11px]">{lang === 'bn' ? 'দিনার লোন' : 'KW Loan'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Kuwait Quick Amount Chips (if Kuwait personal mode) */}
          {mode === 'kuwait-personal' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {lang === 'bn' ? 'দ্রুত দিনার নির্বাচন করুন (KWD)' : 'Quick Amount Presets (KWD)'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toFixed(3))}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      amount === preset.toFixed(3)
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.toFixed(3)} KD
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isKwdCurrency
                  ? lang === 'bn'
                    ? 'দিনার পরিমাণ (KWD د.ك)'
                    : 'Amount (KWD)'
                  : lang === 'bn'
                  ? 'টাকার পরিমাণ (BDT ৳)'
                  : 'Amount (BDT ৳)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={isKwdCurrency ? '0.001' : '1'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isKwdCurrency ? '0.000' : 'যেমন: 5000'}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {isKwdCurrency ? 'KD' : '৳'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Emdad Bhai Specific: Paid vs Unpaid Toggle */}
          {mode === 'emdad-expense' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
              <label className="block text-xs font-semibold text-amber-900 mb-1.5">
                {lang === 'bn' ? 'ইমদাদ ভাই এর কাছে কালেকশন স্ট্যাটাস' : 'Collection Status'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('unpaid')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                    paymentStatus === 'unpaid'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {lang === 'bn' ? 'কালেকশন বাকি (Unpaid)' : 'Unpaid (Pending)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {lang === 'bn' ? 'কালেকশন সম্পন্ন (Paid)' : 'Paid (Collected)'}
                </button>
              </div>
              <p className="text-[11px] text-amber-800 mt-1.5">
                {lang === 'bn'
                  ? 'উনি টাকা পরিশোধ না করা পর্যন্ত Unpaid থাকবে, টাকা পেলে Paid করে দিবেন।'
                  : 'Mark Unpaid until collection is completed, then toggle to Paid.'}
              </p>
            </div>
          )}

          {/* Kuwait Loan Specific: Borrower Name & Due Date */}
          {mode === 'kuwait-loan' && (
            <div className="space-y-3 p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-indigo-950 mb-1">
                  {lang === 'bn' ? 'ঋণগ্রহীতার নাম *' : 'Borrower Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: রফিক ভাই' : 'e.g. Rafiq Bhai'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-950 mb-1">
                  {lang === 'bn' ? 'সম্ভাব্য ফেরত দেওয়ার তারিখ (ঐচ্ছিক)' : 'Due Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <p className="text-[11px] text-indigo-700 font-medium">
                {lang === 'bn'
                  ? 'লোনটি স্বয়ংক্রিয়ভাবে Unpaid (বাকি) হিসেবে সেভ হবে। পরবর্তীতে টাকা ফেরত পেলে রিপোর্ট থেকে Paid মার্ক করতে পারবেন।'
                  : 'Loan is saved as Unpaid. You can mark it as Paid from the reports ledger upon collection.'}
              </p>
            </div>
          )}

          {/* Bank Account Selection for BD Income / Expense */}
          {(mode === 'bd-expense' || mode === 'bd-income') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'কোন ব্যাংক অ্যাকাউন্ট?' : 'Select BD Bank Account'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {data.banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transfer Specific Options */}
          {mode === 'bd-transfer' && (
            <div className="space-y-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">
                  {lang === 'bn' ? 'টাকা কর্তন হবে (উৎস ব্যাংক)' : 'From Bank'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={fromBankId}
                  onChange={(e) => setFromBankId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {data.banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">
                  {lang === 'bn' ? 'কোথায় স্থানান্তর করবেন?' : 'Transfer Destination'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTransferTargetType('bank')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                      transferTargetType === 'bank'
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'অন্য ব্যাংক' : 'Another Bank'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferTargetType('dps')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                      transferTargetType === 'dps'
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'ডিপিএস সঞ্চয়' : 'DPS Savings'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferTargetType('insurance')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                      transferTargetType === 'insurance'
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'ইন্সুরেন্স' : 'Insurance'}
                  </button>
                </div>

                {transferTargetType === 'bank' && (
                  <select
                    value={toBankId}
                    onChange={(e) => setToBankId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {data.banks
                      .filter((b) => b.id !== fromBankId)
                      .map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                  </select>
                )}

                {transferTargetType !== 'bank' && (
                  <select
                    value={targetSavingsId}
                    onChange={(e) => setTargetSavingsId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {data.savingsAccounts
                      .filter((s) => s.type === transferTargetType)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.institution})
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Category Dropdown (Only for BD Bank, Kuwait Personal, Shaker Bhai Expense) */}
          {mode !== 'bd-transfer' &&
            mode !== 'boss-deposit' &&
            mode !== 'emdad-expense' &&
            mode !== 'kuwait-extra-income' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {relevantCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {lang === 'bn' ? cat.nameBn : cat.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Month for Shaker Bhai Deposit */}
          {mode === 'boss-deposit' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'কোন মাসের বেতন?' : 'Month of Salary'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Voucher / Invoice Serial Number (Auto-generated & sequential) */}
          {mode !== 'kuwait-loan' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {lang === 'bn' ? 'ভাউচার / ইনভয়েস নং' : 'Voucher / Invoice #'}
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ⚡ {lang === 'bn' ? 'অটো জেনারেটেড' : 'Auto Generated'}
                </span>
              </div>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="e.g. 1001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-800"
              />
            </div>
          )}

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {mode === 'emdad-expense'
                ? lang === 'bn'
                  ? 'ইমদাদ ভাই এর খরচের বিস্তারিত বিবরণ'
                  : 'Expense Description'
                : mode === 'kuwait-extra-income'
                ? lang === 'bn'
                  ? 'কাজের বিবরণ বা আয়ের উৎস'
                  : 'Income Source / Work Description'
                : lang === 'bn'
                ? 'বিস্তারিত বিবরণ বা নোট'
                : 'Note / Description'}{' '}
              {(mode === 'emdad-expense' || mode === 'kuwait-extra-income') && (
                <span className="text-rose-500">*</span>
              )}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === 'emdad-expense'
                  ? lang === 'bn'
                    ? 'যেমন: গাড়ির পার্টস ক্রয় / সাইটের মালামাল'
                    : 'e.g., Car parts purchase'
                  : mode === 'kuwait-extra-income'
                  ? lang === 'bn'
                    ? 'যেমন: শুক্রবারের অতিরিক্ত কাজ'
                    : 'e.g., Friday extra work'
                  : lang === 'bn'
                  ? 'প্রয়োজনে বিস্তারিত লিখুন...'
                  : 'Optional description...'
              }
              required={mode === 'emdad-expense' || mode === 'kuwait-extra-income'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
