import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Edit2,
  Calendar,
  Check,
  AlertCircle,
  Building2,
  Receipt,
  FileText,
  User,
  DollarSign,
  Tag,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, BossSalaryDeposit, KuwaitPersonalLoan, KuwaitPayableTransaction } from '../../types/finance';

export interface UniversalEditTarget {
  id: string;
  sourceType: 'transaction' | 'boss-deposit' | 'kuwait-loan' | 'kuwait-payable' | 'kuwait-receivable';
}

interface UniversalTransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: UniversalEditTarget | null;
}

export const UniversalTransactionEditModal: React.FC<UniversalTransactionEditModalProps> = ({
  isOpen,
  onClose,
  target,
}) => {
  const {
    data,
    lang,
    updateTransaction,
    updateBossDeposit,
    updateKuwaitLoan,
    updateKuwaitPayableTransaction,
    updateKuwaitReceivableTransaction,
  } = useFinance();

  // Find the exact item from store based on target
  const txItem = target?.sourceType === 'transaction' ? data.transactions.find((t) => t.id === target.id) : null;
  const depItem = target?.sourceType === 'boss-deposit' ? data.bossDeposits.find((d) => d.id === target.id) : null;
  const loanItem = target?.sourceType === 'kuwait-loan' ? (data.kuwaitLoans || []).find((l) => l.id === target.id) : null;
  const payableItem = target?.sourceType === 'kuwait-payable' ? (data.kuwaitPayableTransactions || []).find((p) => p.id === target.id) : null;
  const receivableItem = target?.sourceType === 'kuwait-receivable' ? (data.kuwaitReceivableTransactions || []).find((p) => p.id === target.id) : null;

  // Form states
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [bankId, setBankId] = useState('');
  const [fromBankId, setFromBankId] = useState('');
  const [toBankId, setToBankId] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [note, setNote] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');

  // Boss deposit specific
  const [month, setMonth] = useState('');

  // Kuwait loan specific
  const [borrowerName, setBorrowerName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loanStatus, setLoanStatus] = useState<'paid' | 'unpaid'>('unpaid');

  // Kuwait payable specific
  const [payableType, setPayableType] = useState<'borrow' | 'repay'>('borrow');

  // Kuwait receivable specific
  const [receivableType, setReceivableType] = useState<'lend' | 'collect'>('lend');

  // Error validation
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever target/item changes
  useEffect(() => {
    if (!isOpen || !target) {
      setError(null);
      return;
    }

    if (target.sourceType === 'transaction' && txItem) {
      setDate(txItem.date || '');
      setAmount(txItem.amount ? String(txItem.amount) : '');
      setType(txItem.type);
      setCategoryId(txItem.categoryId || '');
      setCustomCategory(txItem.categoryNameBn || txItem.categoryNameEn || '');
      setBankId(txItem.bankId || txItem.fromBankId || '');
      setFromBankId(txItem.fromBankId || '');
      setToBankId(txItem.toBankId || '');
      setVoucherNo(txItem.voucherNo || '');
      setNote(txItem.note || '');
      setPaymentStatus(txItem.paymentStatus || 'unpaid');
    } else if (target.sourceType === 'boss-deposit' && depItem) {
      setDate(depItem.depositDate || '');
      setAmount(depItem.amount ? String(depItem.amount) : '');
      setMonth(depItem.month || '');
      setVoucherNo(depItem.receiptNumber || '');
      setNote(depItem.note || '');
    } else if (target.sourceType === 'kuwait-loan' && loanItem) {
      setBorrowerName(loanItem.borrowerName || '');
      setDate(loanItem.date || '');
      setAmount(loanItem.amount ? String(loanItem.amount) : '');
      setDueDate(loanItem.dueDate || '');
      setReturnDate(loanItem.returnDate || '');
      setLoanStatus(loanItem.status || 'unpaid');
      setNote(loanItem.note || '');
    } else if (target.sourceType === 'kuwait-payable' && payableItem) {
      setDate(payableItem.date || '');
      setAmount(payableItem.amount ? String(payableItem.amount) : '');
      setPayableType(payableItem.type || 'borrow');
      setVoucherNo(payableItem.voucherNo || '');
      setNote(payableItem.note || '');
    } else if (target.sourceType === 'kuwait-receivable' && receivableItem) {
      setDate(receivableItem.date || '');
      setAmount(receivableItem.amount ? String(receivableItem.amount) : '');
      setReceivableType(receivableItem.type || 'lend');
      setVoucherNo(receivableItem.voucherNo || '');
      setNote(receivableItem.note || '');
    }
    setError(null);
  }, [isOpen, target, txItem, depItem, loanItem, payableItem, receivableItem]);

  if (!isOpen || !target) return null;

  // Filter categories matching section
  const availableCategories = data.categories.filter((c) => {
    if (!txItem) return true;
    if (c.section === 'all') return true;
    return c.section === txItem.section;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন (০ এর বেশি হতে হবে)' : 'Enter a valid amount greater than 0');
      return;
    }

    if (!date.trim()) {
      setError(lang === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Select a date');
      return;
    }

    if (target.sourceType === 'transaction') {
      if (!txItem) return;

      let catBn = customCategory.trim();
      let catEn = customCategory.trim();
      const matchedCat = data.categories.find((c) => c.id === categoryId);
      if (matchedCat) {
        catBn = matchedCat.nameBn;
        catEn = matchedCat.nameEn;
      }

      updateTransaction(target.id, {
        date,
        amount: parsedAmount,
        type,
        categoryId: categoryId || undefined,
        categoryNameBn: catBn || txItem.categoryNameBn,
        categoryNameEn: catEn || txItem.categoryNameEn,
        bankId: txItem.section === 'bd-bank' ? (bankId || undefined) : txItem.bankId,
        fromBankId: txItem.type === 'transfer' ? (fromBankId || bankId || txItem.fromBankId) : undefined,
        toBankId: txItem.type === 'transfer' ? (toBankId || txItem.toBankId) : undefined,
        voucherNo: voucherNo.trim() || undefined,
        note: note.trim() || undefined,
        paymentStatus: txItem.section === 'emdad-expense' ? paymentStatus : txItem.paymentStatus,
      });

      onClose();
    } else if (target.sourceType === 'boss-deposit') {
      if (!depItem) return;

      const inferredMonth = month.trim() || date.substring(0, 7);
      updateBossDeposit(target.id, {
        depositDate: date,
        month: inferredMonth,
        amount: parsedAmount,
        receiptNumber: voucherNo.trim() || undefined,
        note: note.trim() || undefined,
      });

      onClose();
    } else if (target.sourceType === 'kuwait-loan') {
      if (!loanItem) return;

      if (!borrowerName.trim()) {
        setError(lang === 'bn' ? 'ধার নেওয়া ব্যক্তির নাম লিখুন' : 'Enter borrower name');
        return;
      }

      updateKuwaitLoan(target.id, {
        borrowerName: borrowerName.trim(),
        amount: parsedAmount,
        date,
        dueDate: dueDate.trim() || undefined,
        returnDate: loanStatus === 'paid' ? (returnDate.trim() || new Date().toISOString().split('T')[0]) : undefined,
        status: loanStatus,
        note: note.trim() || undefined,
      });

      onClose();
    } else if (target.sourceType === 'kuwait-payable') {
      if (!payableItem) return;

      updateKuwaitPayableTransaction(target.id, {
        date,
        amount: parsedAmount,
        type: payableType,
        voucherNo: voucherNo.trim() || undefined,
        note: note.trim() || undefined,
      });

      onClose();
    } else if (target.sourceType === 'kuwait-receivable') {
      if (!receivableItem) return;

      updateKuwaitReceivableTransaction(target.id, {
        date,
        amount: parsedAmount,
        type: receivableType,
        voucherNo: voucherNo.trim() || undefined,
        note: note.trim() || undefined,
      });

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {target.sourceType === 'kuwait-receivable'
                    ? lang === 'bn'
                      ? 'ব্যক্তিগত পাওনা লোন লেনদেন এডিট'
                      : 'Edit Receivable Loan Transaction'
                    : target.sourceType === 'kuwait-payable'
                    ? lang === 'bn'
                      ? 'ব্যক্তিগত দেনা লোন লেনদেন এডিট'
                      : 'Edit Payable Loan Transaction'
                    : target.sourceType === 'kuwait-loan'
                    ? lang === 'bn'
                      ? 'Personal Receivable Loan এডিট'
                      : 'Edit Receivable Loan Record'
                    : target.sourceType === 'boss-deposit'
                    ? lang === 'bn'
                      ? 'বেতন ফান্ড জমা এডিট'
                      : 'Edit Salary Deposit'
                    : lang === 'bn'
                    ? 'লেনদেন রেকর্ড এডিট ও সংশোধন'
                    : 'Edit Transaction Ledger'}
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                {lang === 'bn'
                  ? 'যেকোন ভুল তথ্য সরাসরি সংশোধন করে আপডেট করুন'
                  : 'Modify and update transaction details instantly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Transaction specific fields */}
          {target.sourceType === 'transaction' && txItem && (
            <>
              {/* Account / Head Indicator Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">
                  {lang === 'bn' ? 'অ্যাকাউন্ট / হেড:' : 'Account / Head:'}
                </span>
                <span className="font-bold text-indigo-700 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded-md">
                  {txItem.section === 'bd-bank'
                    ? lang === 'bn'
                      ? 'বাংলাদেশের ব্যাংক'
                      : 'BD Banking'
                    : txItem.section === 'boss-salary'
                    ? lang === 'bn'
                      ? 'শাকের ভাই খরচ'
                      : 'Shaker Bhai Expenses'
                    : txItem.section === 'emdad-expense'
                    ? lang === 'bn'
                      ? 'ইমদাদ ভাই এর হিসাব'
                      : 'Emdad Bhai Expenses'
                    : txItem.section === 'kuwait-personal'
                    ? lang === 'bn'
                      ? 'কুয়েত পার্সোনাল খরচ'
                      : 'Kuwait Daily Expense'
                    : lang === 'bn'
                    ? 'কুয়েত অতিরিক্ত আয়'
                    : 'Kuwait Extra Income'}
                </span>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিমাণ *' : 'Amount *'} ({txItem.currency})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={txItem.currency === 'KWD' ? '0.001' : '1'}
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Type Selection if BD Bank */}
              {txItem.section === 'bd-bank' && txItem.type !== 'transfer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        type === 'income'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {lang === 'bn' ? '+ আয় / জমা (Deposit)' : '+ Income / Deposit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        type === 'expense'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {lang === 'bn' ? '- খরচ / উত্তোলন (Withdraw)' : '- Expense / Withdraw'}
                    </button>
                  </div>
                </div>
              )}

              {/* Bank selector for BD Bank */}
              {txItem.section === 'bd-bank' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'ব্যাংক অ্যাকাউন্ট' : 'Bank Account'}
                  </label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">{lang === 'bn' ? '-- ব্যাংক নির্বাচন করুন --' : '-- Select Bank --'}</option>
                    {data.banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transfer Target Notice */}
              {txItem.type === 'transfer' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {txItem.transferTargetType === 'loan'
                        ? lang === 'bn'
                          ? 'ব্যাংক লোন কিস্তি পরিশোধ ট্রান্সফার'
                          : 'Loan Installment Repayment Transfer'
                        : lang === 'bn'
                        ? 'সঞ্চয় / ডিপিএস ট্রান্সফার'
                        : 'Savings / DPS Transfer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {lang === 'bn'
                      ? 'পরিমাণ পরিবর্তন করলে সরাসরি ব্যাংক ব্যালেন্স এবং সংশ্লিষ্ট লোন/সঞ্চয় ব্যালেন্স সমন্বয় হবে।'
                      : 'Updating the amount will sync both the bank balance and corresponding loan/savings balance.'}
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                {availableCategories.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        const sel = availableCategories.find((c) => c.id === e.target.value);
                        if (sel) {
                          setCustomCategory(sel.nameBn);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">{lang === 'bn' ? '-- ক্যাটাগরি তালিকা --' : '-- Select Category --'}</option>
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn} {c.nameEn ? `(${c.nameEn})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder={lang === 'bn' ? 'অথবা ক্যাটাগরির নাম লিখুন' : 'Or enter category label'}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder={lang === 'bn' ? 'ক্যাটাগরির বিবরণ' : 'Category description'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                )}
              </div>

              {/* Voucher / Receipt No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / ইনভয়েস / রশিদ নং (ঐচ্ছিক)' : 'Voucher / Invoice / Slip No (Optional)'}
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: INV-9823 বা VCH-001' : 'e.g. INV-9823'}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Emdad Bhai Payment Status */}
              {txItem.section === 'emdad-expense' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিশোধের অবস্থা (ইমদাদ ভাই কালেকশন)' : 'Payment Status'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('unpaid')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        paymentStatus === 'unpaid'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'বাকি / Unpaid' : 'Unpaid'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('paid')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        paymentStatus === 'paid'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'পরিশোধিত / Paid' : 'Paid'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'লেনদেনের বিস্তারিত বিবরণ...' : 'Detailed description...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </>
          )}

          {/* 2. Boss Salary Deposit specific fields */}
          {target.sourceType === 'boss-deposit' && depItem && (
            <>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <span className="font-bold">
                  {lang === 'bn' ? 'শাকের ভাই বেতন ফান্ড জমা' : 'Shaker Bhai Salary Fund Deposit'}
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {lang === 'bn'
                    ? 'বসের থেকে পাওয়া বেতন ও অতিরিক্ত খরচের তহবিল জমা'
                    : 'Salary and budget fund received from Boss in KWD'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'জমার তারিখ *' : 'Deposit Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'জমার পরিমাণ (KWD) *' : 'Amount (KWD) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'কোন মাসের বেতন (YYYY-MM)' : 'Salary Month (YYYY-MM)'}
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'রশিদ / রেফারেন্স নং' : 'Receipt / Ref No'}
                  </label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: SLR-2026-10' : 'e.g. SLR-2026-10'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'বেতন বা বিশেষ ফান্ড সংক্রান্ত নোট...' : 'Notes regarding deposit...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </>
          )}

          {/* 3. Kuwait Personal Loan specific fields */}
          {target.sourceType === 'kuwait-loan' && loanItem && (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold">
                  {lang === 'bn' ? 'কুয়েত পার্সোনাল লোন ট্র্যাকার' : 'Kuwait Personal Loan Tracker'}
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {lang === 'bn'
                    ? 'কাওকে দিনার ধার দেওয়ার হিসাব। এতে কোন আয় যোগ হয় না। পরিশোধ পেলে Paid মার্ক করুন।'
                    : 'Personal dinar loan given. No income is credited. Mark as Paid upon return.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'লোন গ্রহীতার নাম *' : 'Borrower Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'লোনের পরিমাণ (KWD) *' : 'Amount (KWD) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'লোন দেওয়ার তারিখ *' : 'Loan Given Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'সম্ভাব্য ফেরত তারিখ' : 'Due Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Loan Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লোন পরিশোধের অবস্থা' : 'Loan Repayment Status'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanStatus('unpaid')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      loanStatus === 'unpaid'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বাকি (Unpaid)' : 'Unpaid (Due)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanStatus('paid');
                      if (!returnDate) {
                        setReturnDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      loanStatus === 'paid'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid (Returned)'}</span>
                  </button>
                </div>
              </div>

              {loanStatus === 'paid' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'টাকা ফেরত পাওয়ার প্রকৃত তারিখ' : 'Actual Return Date'}
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'ফোন নম্বর, যোগাযোগের ঠিকানা বা কারণ...' : 'Phone, contact, purpose...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </>
          )}

          {/* 4. Personal Payable Loan specific fields */}
          {target.sourceType === 'kuwait-payable' && payableItem && (
            <>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    {lang === 'bn' ? 'ব্যক্তিগত দেনা লোন (Personal Payable Loan)' : 'Personal Payable Loan'}
                  </span>
                  <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                    {payableItem.lenderName}
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 mt-1">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত প্রয়োজনে দিনার ধার নেওয়ার হিসাব। লোন পরিশোধ করলে স্বয়ংক্রিয়ভাবে উক্ত ব্যক্তির দেনা থেকে বিয়োগ হবে।'
                    : 'Personal KWD loan borrowed. Repayment automatically subtracts from their debt balance.'}
                </p>
              </div>

              {/* Type Switcher: Borrow vs Repay */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লেনদেনের ধরন *' : 'Transaction Type *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayableType('borrow')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      payableType === 'borrow'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang === 'bn' ? '+ ধার নেওয়া (Borrow)' : '+ Borrow Loan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayableType('repay')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      payableType === 'repay'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang === 'bn' ? '- ঋণ পরিশোধ (Repay)' : '- Repay Loan'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিমাণ (KWD / দিনার) *' : 'Amount (KWD) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / রেফারেন্স নং' : 'Voucher / Ref No'}
                </label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: VCH-101' : 'e.g. VCH-101'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'ধার নেওয়ার বা পরিশোধের বিস্তারিত বিবরণ...' : 'Transaction notes...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </>
          )}

          {/* Kuwait Personal Receivable Loan Transaction Form */}
          {target.sourceType === 'kuwait-receivable' && receivableItem && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>{lang === 'bn' ? 'গ্রহীতার নাম (Borrower)' : 'Borrower'}:</span>
                  <span className="font-mono text-sm px-2 py-0.5 bg-white border border-blue-200 rounded-md text-blue-700">
                    {receivableItem.borrowerName}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 mt-1">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত পাওনা লোন। ঋণগ্রহীতা আংশিক বা সম্পূর্ণ ফেরত দিলে লোন আদায় (Collect) হিসেবে রেকর্ড করুন, যা উক্ত ব্যক্তির বকেয়া থেকে বাদ যাবে।'
                    : 'Personal KWD loan receivable. When borrower repays (full or partial), record as Collect to reduce their balance.'}
                </p>
              </div>

              {/* Type Switcher: Lend vs Collect */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লেনদেনের ধরন *' : 'Transaction Type *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceivableType('lend')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      receivableType === 'lend'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang === 'bn' ? '+ লোন প্রদান (Lend)' : '+ Lend Loan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceivableType('collect')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      receivableType === 'collect'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang === 'bn' ? '✓ লোন আদায় / ফেরত (Collect)' : '✓ Collect / Repay'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিমাণ (KWD / দিনার) *' : 'Amount (KWD) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / রেফারেন্স নং' : 'Voucher / Ref No'}
                </label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: R-101' : 'e.g. R-101'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'ধার দেওয়া বা ফেরত পাওয়ার বিবরণ...' : 'Transaction notes...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
