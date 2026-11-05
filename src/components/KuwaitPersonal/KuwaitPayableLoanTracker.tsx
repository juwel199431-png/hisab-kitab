import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Handshake,
  Plus,
  Printer,
  Download,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Edit2,
  X,
  User,
  ShieldCheck,
  Check,
  RotateCcw,
  Receipt,
  MinusCircle,
  PlusCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { KuwaitPayableLender, KuwaitPayableTransaction } from '../../types/finance';

export const KuwaitPayableLoanTracker: React.FC = () => {
  const {
    data,
    lang,
    t,
    getKuwaitPayableTotals,
    getLenderBalance,
    addKuwaitPayableLender,
    updateKuwaitPayableLender,
    deleteKuwaitPayableLender,
    addKuwaitPayableTransaction,
    updateKuwaitPayableTransaction,
    deleteKuwaitPayableTransaction,
  } = useFinance();

  // Filters & Search
  const [selectedLenderFilter, setSelectedLenderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'borrow' | 'repay'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [prefilledLenderId, setPrefilledLenderId] = useState<string | null>(null);

  // Expanded Statement for Person Card
  const [expandedLenderId, setExpandedLenderId] = useState<string | null>(null);

  // Edit State
  const [editingTx, setEditingTx] = useState<KuwaitPayableTransaction | null>(null);
  const [editingLender, setEditingLender] = useState<KuwaitPayableLender | null>(null);

  // Form State: New Borrow
  const [borrowLenderMode, setBorrowLenderMode] = useState<'existing' | 'new'>('existing');
  const [borrowLenderId, setBorrowLenderId] = useState('');
  const [newLenderName, setNewLenderName] = useState('');
  const [newLenderPhone, setNewLenderPhone] = useState('');
  const [newLenderDueDate, setNewLenderDueDate] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDate, setBorrowDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [borrowVoucher, setBorrowVoucher] = useState('');
  const [borrowNote, setBorrowNote] = useState('');

  // Form State: Repay
  const [repayLenderId, setRepayLenderId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [repayVoucher, setRepayVoucher] = useState('');
  const [repayNote, setRepayNote] = useState('');

  // Overall KPI Statistics
  const {
    totalBorrowed,
    totalRepaid,
    totalRemaining,
    activeLendersCount,
    totalLendersCount,
    transactionsCount,
  } = useMemo(() => {
    return getKuwaitPayableTotals();
  }, [getKuwaitPayableTotals, data.kuwaitPayableTransactions, data.kuwaitPayableLenders]);

  const lenders = useMemo(() => {
    return (data.kuwaitPayableLenders || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [data.kuwaitPayableLenders]);

  const transactions = useMemo(() => {
    return (data.kuwaitPayableTransactions || [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.kuwaitPayableTransactions]);

  // Filtered transactions for the ledger table
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedLenderFilter !== 'all' && tx.lenderId !== selectedLenderFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = tx.lenderName.toLowerCase().includes(q);
        const noteMatch = tx.note?.toLowerCase().includes(q);
        const voucherMatch = tx.voucherNo?.toLowerCase().includes(q);
        if (!nameMatch && !noteMatch && !voucherMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedLenderFilter, typeFilter, searchQuery]);

  // Handle open borrow modal
  const handleOpenBorrow = (lenderId?: string) => {
    if (lenderId) {
      setBorrowLenderMode('existing');
      setBorrowLenderId(lenderId);
    } else if (lenders.length > 0) {
      setBorrowLenderMode('existing');
      setBorrowLenderId(lenders[0].id);
    } else {
      setBorrowLenderMode('new');
      setBorrowLenderId('');
    }
    setBorrowAmount('');
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setBorrowVoucher(`BRW-${Date.now().toString().slice(-4)}`);
    setBorrowNote('');
    setIsBorrowModalOpen(true);
  };

  // Handle open repay modal
  const handleOpenRepay = (lenderId?: string) => {
    const targetId = lenderId || (lenders.length > 0 ? lenders[0].id : '');
    setRepayLenderId(targetId);
    setRepayAmount('');
    setRepayDate(new Date().toISOString().split('T')[0]);
    setRepayVoucher(`RPY-${Date.now().toString().slice(-4)}`);
    setRepayNote('');
    setIsRepayModalOpen(true);
  };

  // Submit Borrow
  const handleSubmitBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(borrowAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ লিখুন' : 'Please enter valid amount');
      return;
    }

    let targetLenderId = borrowLenderId;
    let targetLenderName = '';

    if (borrowLenderMode === 'new') {
      if (!newLenderName.trim()) {
        alert(lang === 'bn' ? 'অনুগ্রহ করে ঋণদাতার নাম লিখুন' : 'Please enter lender name');
        return;
      }
      const newLender = addKuwaitPayableLender({
        name: newLenderName.trim(),
        phone: newLenderPhone.trim() || undefined,
        dueDate: newLenderDueDate.trim() || undefined,
        notes: borrowNote.trim() || undefined,
      });
      targetLenderId = newLender.id;
      targetLenderName = newLender.name;
    } else {
      const existing = lenders.find((l) => l.id === borrowLenderId);
      if (!existing) {
        alert(lang === 'bn' ? 'ঋণদাতার অ্যাকাউন্ট নির্বাচন করুন' : 'Please select a lender account');
        return;
      }
      targetLenderName = existing.name;
    }

    addKuwaitPayableTransaction({
      lenderId: targetLenderId,
      lenderName: targetLenderName,
      type: 'borrow',
      amount: parsedAmount,
      currency: 'KWD',
      date: borrowDate,
      voucherNo: borrowVoucher.trim() || undefined,
      note: borrowNote.trim() || undefined,
    });

    setIsBorrowModalOpen(false);
    setNewLenderName('');
    setNewLenderPhone('');
    setNewLenderDueDate('');
    setBorrowAmount('');
    setBorrowNote('');
  };

  // Submit Repay
  const handleSubmitRepay = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(repayAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ লিখুন' : 'Please enter valid amount');
      return;
    }

    const lender = lenders.find((l) => l.id === repayLenderId);
    if (!lender) {
      alert(lang === 'bn' ? 'ঋণদাতার অ্যাকাউন্ট নির্বাচন করুন' : 'Please select lender');
      return;
    }

    addKuwaitPayableTransaction({
      lenderId: lender.id,
      lenderName: lender.name,
      type: 'repay',
      amount: parsedAmount,
      currency: 'KWD',
      date: repayDate,
      voucherNo: repayVoucher.trim() || undefined,
      note: repayNote.trim() || undefined,
    });

    setIsRepayModalOpen(false);
  };

  // WhatsApp Statement Update Helper
  const handleSendWhatsAppUpdate = (lender: KuwaitPayableLender) => {
    const bal = getLenderBalance(lender.id);
    const dueInfo = lender.dueDate
      ? lang === 'bn'
        ? `\nনির্ধারিত পরিশোধের সম্ভাব্য তারিখ: ${lender.dueDate}`
        : `\nTarget Repayment Date: ${lender.dueDate}`
      : '';
    const message =
      lang === 'bn'
        ? `সালামু আলাইকুম ভাই ${lender.name}।\nআপনার থেকে নেওয়া পার্সোনাল লোন সংক্রান্ত তথ্য:\n• মোট গৃহীত লোন: ${bal.totalBorrowed.toFixed(3)} KD\n• এ পর্যন্ত পরিশোধিত: ${bal.totalRepaid.toFixed(3)} KD\n• বর্তমান অবশিষ্ট দেনা: ${bal.remaining.toFixed(3)} KD${dueInfo}\n\nইনশাআল্লাহ দ্রুতই অবশিষ্ট দেনা পরিশোধ করা হবে। জাযাকাল্লাহু খাইরান!`
        : `Assalamu Alaikum brother ${lender.name}.\nPersonal Loan Statement Update:\n• Total Borrowed: ${bal.totalBorrowed.toFixed(3)} KD\n• Total Repaid: ${bal.totalRepaid.toFixed(3)} KD\n• Net Remaining Debt: ${bal.remaining.toFixed(3)} KD${dueInfo}\n\nInshaAllah I will repay the remaining balance soon. Thank you!`;

    const cleanPhone = lender.phone ? lender.phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Handle Save Edit Transaction
  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    if (isNaN(editingTx.amount) || editingTx.amount <= 0) {
      alert(lang === 'bn' ? 'সঠিক পরিমাণ দিন' : 'Enter valid amount');
      return;
    }

    updateKuwaitPayableTransaction(editingTx.id, {
      amount: editingTx.amount,
      date: editingTx.date,
      type: editingTx.type,
      voucherNo: editingTx.voucherNo?.trim() || undefined,
      note: editingTx.note?.trim() || undefined,
    });

    setEditingTx(null);
  };

  // Handle Save Edit Lender
  const handleSaveEditLender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLender) return;

    if (!editingLender.name.trim()) {
      alert(lang === 'bn' ? 'ঋণদাতার নাম দিন' : 'Enter lender name');
      return;
    }

    updateKuwaitPayableLender(editingLender.id, {
      name: editingLender.name.trim(),
      phone: editingLender.phone?.trim() || undefined,
      dueDate: editingLender.dueDate?.trim() || undefined,
      notes: editingLender.notes?.trim() || undefined,
    });

    setEditingLender(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'ঋণদাতার অ্যাকাউন্ট' : 'Lender Account',
      lang === 'bn' ? 'লেনদেনের ধরন' : 'Type',
      lang === 'bn' ? 'ভাউচার / স্লিপ নং' : 'Voucher No',
      lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)',
      lang === 'bn' ? 'নোট ও বিবরণ' : 'Notes',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.lenderName,
      tx.type === 'borrow'
        ? lang === 'bn'
          ? 'লোন গ্রহণ (Borrow)'
          : 'Borrow'
        : lang === 'bn'
        ? 'লোন পরিশোধ (Repay)'
        : 'Repay',
      tx.voucherNo || '',
      tx.amount.toFixed(3),
      tx.note || '',
    ]);

    exportToCSV(`Kuwait_Personal_Payable_Loan_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 p-4 border-b border-slate-300">
        <div className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Kuwait Personal Payable Loan Ledger (ব্যক্তিগত দেনা লোন হিসাব)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            কারো কাছ থেকে ব্যক্তিগত প্রয়োজনে কুয়েতি দিনার লোন গ্রহণ ও পরিশোধের পূর্ণাঙ্গ ব্যক্তিভিত্তিক খতিয়ান
          </p>
          <div className="mt-3 flex justify-between text-xs text-slate-700">
            <span>মুদ্রা: কুয়েতি দিনার (KWD)</span>
            <span>তারিখ: {new Date().toLocaleDateString('en-GB')}</span>
            <span>
              বর্তমান মোট বকেয়া দেনা: <strong>{totalRemaining.toFixed(3)} KD</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Control Banner & Quick Stats */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                <Handshake className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'Personal Payable Loan (ব্যক্তিগত দেনা লোন)' : 'Personal Payable Loan Ledger'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত প্রয়োজনে কারো কাছ থেকে দিনার লোন নিলে এন্ট্রি রাখুন। টাকা পরিশোধ করলে তাদের অ্যাকাউন্ট থেকে মাইনাস হবে।'
                    : 'Track dinar borrowed from others. Repayments automatically deduct from individual lender accounts.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenBorrow()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '+ নতুন লোন গ্রহণ (Borrow)' : '+ Record Borrowed Loan'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenRepay()}
              disabled={lenders.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors shadow-2xs ${
                lenders.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লোন পরিশোধ (Repay)' : 'Repay Loan'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Clear Notice Rule */}
        <div className="mt-3 px-3.5 py-2 bg-rose-50/70 border border-rose-200/80 rounded-lg flex items-center gap-2 text-xs text-rose-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'ব্যক্তিভিত্তিক হিসাব: যাদের কাছ থেকে লোন নেওয়া হবে তাদের নামে আলাদা আলাদা স্বয়ংক্রিয় অ্যাকাউন্ট তৈরি হবে। টাকা পরিশোধ করার সাথে সাথে সংশ্লিষ্ট ব্যক্তির ব্যালেন্স থেকে বিয়োগ (মাইনাস) হবে।'
              : 'Individual Accounts: Separate accounts are maintained per lender. Repayments directly subtract from their remaining payable balance.'}
          </span>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {/* Card 1: Total Borrowed */}
          <div className="bg-linear-to-br from-rose-600 via-pink-600 to-rose-800 text-white rounded-2xl p-4.5 border border-rose-400/30 shadow-md shadow-rose-500/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider">
                  {lang === 'bn' ? 'সর্বমোট লোন গ্রহণ (Borrowed)' : 'Total Borrowed'}
                </span>
                <ArrowDownLeft className="w-4 h-4 text-rose-200" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {totalBorrowed.toFixed(3)} <span className="text-sm font-semibold text-rose-200">KD</span>
              </p>
            </div>
            <p className="text-[11px] text-rose-100/90 font-medium mt-2">
              {lang === 'bn' ? `👥 মোট ${totalLendersCount} জনের কাছ থেকে গ্রহণ` : `👥 From ${totalLendersCount} lenders`}
            </p>
          </div>

          {/* Card 2: Total Repaid */}
          <div className="bg-linear-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-2xl p-4.5 border border-emerald-400/30 shadow-md shadow-emerald-500/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                  {lang === 'bn' ? 'মোট লোন পরিশোধ (Repaid)' : 'Total Repaid'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {totalRepaid.toFixed(3)} <span className="text-sm font-semibold text-emerald-200">KD</span>
              </p>
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium mt-2">
              {lang === 'bn' ? '✓ সম্পূর্ণ ও আংশিক ফেরত দেওয়া হয়েছে' : '✓ Successfully repaid to lenders'}
            </p>
          </div>

          {/* Card 3: Current Outstanding Payable Debt */}
          <div className="bg-linear-to-br from-amber-500 via-orange-600 to-red-600 text-white rounded-2xl p-4.5 border border-amber-400/30 shadow-md shadow-orange-500/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">
                  {lang === 'bn' ? 'বর্তমান বাকি দেনা (Remaining Debt)' : 'Current Payable Debt'}
                </span>
                <Clock className="w-4 h-4 text-amber-200" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {totalRemaining.toFixed(3)} <span className="text-sm font-semibold text-amber-200">KD</span>
              </p>
            </div>
            <p className="text-[11px] text-amber-100/90 font-medium mt-2">
              {lang === 'bn'
                ? `⚡ ${activeLendersCount} জনের বকেয়া ঋণ পরিশোধ বাকি`
                : `⚡ ${activeLendersCount} lenders pending final clearance`}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: আলাদা আলাদা ব্যক্তিভিত্তিক অ্যাকাউন্ট (Lender Individual Account Cards Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between no-print">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-rose-600" />
              <span>
                {lang === 'bn'
                  ? 'যাদের কাছ থেকে লোন নেওয়া হয়েছে (ব্যক্তিভিত্তিক আলাদা অ্যাকাউন্ট)'
                  : 'Individual Payable Loan Accounts (Per Person)'}
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'প্রতিটি ব্যক্তির অ্যাকাউন্টে মোট নেওয়া, পরিশোধ এবং বর্তমান বাকি দেনার হিসাব স্বয়ংক্রিয়ভাবে আপডেট হয়'
                : 'Tracks total borrowed, repaid, and outstanding payable balance for each individual person'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
            {lang === 'bn' ? `মোট ${lenders.length}টি অ্যাকাউন্ট` : `${lenders.length} Accounts`}
          </span>
        </div>

        {lenders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300 text-slate-500">
            <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              {lang === 'bn' ? 'কোন ব্যক্তির লোন অ্যাকাউন্ট খোলা হয়নি' : 'No payable loan accounts yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn'
                ? 'কারো কাছ থেকে ব্যক্তিগত লোন নিলে উপরের "+ নতুন লোন গ্রহণ" বাটনে ক্লিক করে এন্ট্রি দিন'
                : 'Click "+ Record Borrowed Loan" above to add your first payable loan account.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lenders.map((lender) => {
              const balance = getLenderBalance(lender.id);
              const isCleared = balance.remaining <= 0.0001;
              const progress =
                balance.totalBorrowed > 0
                  ? Math.min(100, Math.round((balance.totalRepaid / balance.totalBorrowed) * 100))
                  : 100;
              const isExpanded = expandedLenderId === lender.id;

              return (
                <div
                  key={lender.id}
                  className={`bg-white rounded-xl border transition-all shadow-2xs overflow-hidden flex flex-col justify-between ${
                    isCleared ? 'border-emerald-200' : 'border-rose-200 ring-1 ring-rose-100'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Card Header: Person Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCleared
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {lender.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-sm truncate" title={lender.name}>
                            {lender.name}
                          </h5>
                          {lender.phone ? (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lender.phone}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              {lang === 'bn' ? 'ব্যক্তিগত ঋণদাতা' : 'Personal Lender'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isCleared
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isCleared
                          ? lang === 'bn'
                            ? 'পরিশোধিত (Paid)'
                            : 'Cleared'
                          : lang === 'bn'
                          ? 'দেনা বাকি (Due)'
                          : 'Due'}
                      </span>
                    </div>

                    {/* Balance Metrics */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>{lang === 'bn' ? 'মোট গ্রহণ (Borrowed):' : 'Total Borrowed:'}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {balance.totalBorrowed.toFixed(3)} KD
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>{lang === 'bn' ? 'পরিশোধিত (Repaid):' : 'Repaid (-):'}</span>
                        <span className="font-mono font-bold">
                          {balance.totalRepaid.toFixed(3)} KD
                        </span>
                      </div>
                      <div className="pt-1 border-t border-slate-200 flex justify-between items-center font-bold">
                        <span className={isCleared ? 'text-slate-600' : 'text-rose-700'}>
                          {lang === 'bn' ? 'বর্তমান বাকি দেনা:' : 'Net Remaining Debt:'}
                        </span>
                        <span
                          className={`font-mono text-sm tabular-nums ${
                            isCleared ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {balance.remaining.toFixed(3)} KD
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>{lang === 'bn' ? 'পরিশোধের অগ্রগতি' : 'Repayment Progress'}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isCleared ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    {lender.dueDate && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-600">
                          {lang === 'bn' ? 'পরিশোধের তারিখ:' : 'Target Due:'} <span className="font-mono font-bold text-slate-800">{lender.dueDate}</span>
                        </span>
                        {!isCleared && new Date(lender.dueDate) < new Date(new Date().toISOString().split('T')[0]) && (
                          <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                            {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs no-print">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!isCleared && (
                        <button
                          type="button"
                          onClick={() => handleOpenRepay(lender.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-2xs transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                          title={lang === 'bn' ? 'লোন পরিশোধ করুন' : 'Repay this loan'}
                        >
                          <MinusCircle className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'পরিশোধ' : 'Repay'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenBorrow(lender.id)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-md transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                        title={lang === 'bn' ? 'এই ব্যক্তির থেকে আরো লোন গ্রহণ' : 'Borrow more'}
                      >
                        <Plus className="w-3 h-3 text-rose-600" />
                        <span>{lang === 'bn' ? '+ লোন' : '+ Borrow'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppUpdate(lender)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-md transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                        title={lang === 'bn' ? 'হোয়াটসঅ্যাপে স্টেটমেন্ট আপডেট পাঠান' : 'Send WhatsApp Update'}
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedLenderId(isExpanded ? null : lender.id)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
                        title={lang === 'bn' ? 'বিস্তারিত লেনদেন দেখুন' : 'View statement'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingLender(lender)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title={lang === 'bn' ? 'অ্যাকাউন্ট তথ্য এডিট' : 'Edit lender'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              lang === 'bn'
                                ? `"${lender.name}" এর অ্যাকাউন্ট ও সংশ্লিষ্ট সকল লেনদেন মুছে ফেলতে চান?`
                                : `Delete lender account "${lender.name}" and all associated records?`
                            )
                          ) {
                            deleteKuwaitPayableLender(lender.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Statement Ledger for This Person */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-100/70 border-t border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span>{lang === 'bn' ? 'হিসাব বিবরণী খতিয়ান:' : 'Account Statement:'}</span>
                        <span className="text-[10px] text-slate-400">
                          {balance.transactions.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                        </span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {balance.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-bold ${
                                    tx.type === 'borrow' ? 'text-rose-700' : 'text-emerald-700'
                                  }`}
                                >
                                  {tx.type === 'borrow' ? '+ গ্রহণ' : '- পরিশোধ'}
                                </span>
                                <span className="text-slate-500 font-mono">{formatDate(tx.date, lang)}</span>
                                {tx.voucherNo && (
                                  <span className="font-mono text-slate-400">#{tx.voucherNo}</span>
                                )}
                              </div>
                              {tx.note && <p className="text-slate-600 truncate mt-0.5">{tx.note}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`font-mono font-bold ${
                                  tx.type === 'borrow' ? 'text-rose-700' : 'text-emerald-700'
                                }`}
                              >
                                {tx.type === 'borrow' ? '+' : '-'} {tx.amount.toFixed(3)} KD
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingTx(tx)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600"
                                title="এডিট"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete record?')) {
                                    deleteKuwaitPayableTransaction(tx.id);
                                  }
                                }}
                                className="p-0.5 text-slate-400 hover:text-rose-600"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: Complete Payable Loans Transactions Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>{lang === 'bn' ? 'দেনা ও পরিশোধের পূর্ণাঙ্গ খতিয়ান' : 'Payable Loans Audit Ledger'}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? `ফিল্টারকৃত মোট ${filteredTransactions.length}টি লেনদেন প্রদর্শিত হচ্ছে`
                : `Showing ${filteredTransactions.length} transaction entries`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Lender */}
            <select
              value={selectedLenderFilter}
              onChange={(e) => setSelectedLenderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">{lang === 'bn' ? 'সকল ঋণদাতা (All Lenders)' : 'All Lenders'}</option>
              {lenders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">{lang === 'bn' ? 'সকল ধরন (All Types)' : 'All Types'}</option>
              <option value="borrow">{lang === 'bn' ? 'শুধুমাত্র লোন গ্রহণ' : 'Borrow Only'}</option>
              <option value="repay">{lang === 'bn' ? 'শুধুমাত্র লোন পরিশোধ' : 'Repay Only'}</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'নাম, ভাউচার বা নোট...' : 'Search...'}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'ঋণদাতার নাম / অ্যাকাউন্ট' : 'Lender Account'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'লেনদেনের ধরন' : 'Type'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'ভাউচার / স্লিপ' : 'Voucher No'}</th>
                <th className="py-2.5 px-3.5">{lang === 'bn' ? 'নোট ও বিবরণ' : 'Note'}</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount'}</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {lang === 'bn' ? 'কোন লেনদেনের রেকর্ড পাওয়া যায়নি' : 'No transaction records found'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isBorrow = tx.type === 'borrow';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-600">
                        {formatDate(tx.date, lang)}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-bold text-slate-900">
                        {tx.lenderName}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {isBorrow ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'লোন গ্রহণ (দেনা বৃদ্ধি)' : 'Borrow (+)'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'লোন পরিশোধ (মাইনাস)' : 'Repay (-)'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-500">
                        {tx.voucherNo || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 max-w-xs truncate text-slate-600" title={tx.note || ''}>
                        {tx.note || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                        <span className={isBorrow ? 'text-rose-700' : 'text-emerald-700'}>
                          {isBorrow ? '+' : '-'} {tx.amount.toFixed(3)} KD
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTx(tx)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title={lang === 'bn' ? 'সংশোধন / এডিট' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(lang === 'bn' ? 'এই লেনদেনটি মুছে ফেলতে চান?' : 'Delete this record?')) {
                                deleteKuwaitPayableTransaction(tx.id);
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
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {filteredTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td colSpan={5} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-xs">
                    {lang === 'bn' ? 'ফিল্টারকৃত ব্যালেন্স সারাংশ:' : 'Filtered Summary:'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-sm font-bold text-rose-900">
                    {totalRemaining.toFixed(3)} KD
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: Record New Borrowed Loan (নতুন লোন গ্রহণ) */}
      {isBorrowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'bn' ? 'নতুন লোন গ্রহণ এন্ট্রি (Borrow Loan)' : 'Record Borrowed Loan'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {lang === 'bn' ? 'কারো কাছ থেকে ধার নিলে এন্ট্রি করুন' : 'Record dinar borrowed from someone'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBorrowModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBorrow} className="p-6 space-y-3.5">
              {/* Lender Selection Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ঋণদাতার অ্যাকাউন্ট নির্বাচন *' : 'Select Lender *'}
                </label>
                {lenders.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBorrowLenderMode('existing')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        borrowLenderMode === 'existing'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lang === 'bn' ? 'পূর্বের অ্যাকাউন্ট' : 'Existing Lender'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBorrowLenderMode('new')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        borrowLenderMode === 'new'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lang === 'bn' ? '+ নতুন ব্যক্তি' : '+ New Person'}
                    </button>
                  </div>
                )}

                {borrowLenderMode === 'existing' && lenders.length > 0 ? (
                  <select
                    required
                    value={borrowLenderId}
                    onChange={(e) => setBorrowLenderId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    {lenders.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.phone ? `(${l.phone})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={newLenderName}
                      onChange={(e) => setNewLenderName(e.target.value)}
                      placeholder={lang === 'bn' ? 'ঋণদাতার নাম (যেমন: রফিক ভাই, করিম ভাই)' : 'Lender full name'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                    <input
                      type="text"
                      value={newLenderPhone}
                      onChange={(e) => setNewLenderPhone(e.target.value)}
                      placeholder={lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Phone number (optional)'}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        {lang === 'bn' ? 'সম্ভাব্য পরিশোধের তারিখ (ঐচ্ছিক)' : 'Target Repayment Date (Optional)'}
                      </label>
                      <input
                        type="date"
                        value={newLenderDueDate}
                        onChange={(e) => setNewLenderDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিমাণ (KWD) *' : 'Amount (KWD) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'গ্রহণের তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              {/* Voucher / Receipt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / স্লিপ নং (ঐচ্ছিক)' : 'Voucher No (Optional)'}
                </label>
                <input
                  type="text"
                  value={borrowVoucher}
                  onChange={(e) => setBorrowVoucher(e.target.value)}
                  placeholder="BRW-001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ (লোন নেওয়ার কারণ)' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={borrowNote}
                  onChange={(e) => setBorrowNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'জরুরি পারিবারিক প্রয়োজনে নেওয়া হয়েছিল...' : 'Purpose of borrowing...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBorrowModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
                >
                  {lang === 'bn' ? 'লোন সেভ করুন' : 'Save Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Repay Loan (টাকা পরিশোধ - মাইনাস) */}
      {isRepayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <MinusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'bn' ? 'লোন পরিশোধ এন্ট্রি (Repay Loan)' : 'Repay Loan'}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    {lang === 'bn'
                      ? 'টাকা পরিশোধের সাথে সাথে সংশ্লিষ্ট ব্যক্তির অ্যাকাউন্ট থেকে মাইনাস হবে'
                      : 'Repayment will be subtracted from this lender balance'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRepayModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRepay} className="p-6 space-y-3.5">
              {/* Select Lender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কাকে লোন পরিশোধ করছেন? *' : 'Repaying to Which Lender? *'}
                </label>
                <select
                  required
                  value={repayLenderId}
                  onChange={(e) => setRepayLenderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {lenders.map((l) => {
                    const b = getLenderBalance(l.id);
                    return (
                      <option key={l.id} value={l.id}>
                        {l.name} (বাকি দেনা: {b.remaining.toFixed(3)} KD)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Show selected lender's current due */}
              {repayLenderId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex justify-between items-center">
                  <span>{lang === 'bn' ? 'বর্তমান বকেয়া দেনা:' : 'Current Due Balance:'}</span>
                  <span className="font-mono font-bold text-sm">
                    {getLenderBalance(repayLenderId).remaining.toFixed(3)} KD
                  </span>
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিশোধের পরিমাণ (KWD) *' : 'Repay Amount (KWD) *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="0.000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-mono font-bold text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিশোধের তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={repayDate}
                    onChange={(e) => setRepayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Voucher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / ইনভয়েস নং' : 'Voucher / Invoice No'}
                </label>
                <input
                  type="text"
                  value={repayVoucher}
                  onChange={(e) => setRepayVoucher(e.target.value)}
                  placeholder="RPY-001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Note & Details'}
                </label>
                <textarea
                  rows={2}
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'মাসিক বেতন পেয়ে নগদ পরিশোধ করা হলো...' : 'Repayment notes...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                >
                  {lang === 'bn' ? 'পরিশোধ নিশ্চিত করুন' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Transaction */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h4 className="text-sm font-bold">
                {lang === 'bn' ? 'লেনদেন এডিট ও সংশোধন' : 'Edit Payable Transaction'}
              </h4>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditTx} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লেনদেনের ধরন' : 'Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type: 'borrow' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border ${
                      editingTx.type === 'borrow'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    + লোন গ্রহণ (Borrow)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, type: 'repay' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border ${
                      editingTx.type === 'repay'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    - লোন পরিশোধ (Repay)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিমাণ (KWD) *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editingTx.date}
                    onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার নং' : 'Voucher No'}
                </label>
                <input
                  type="text"
                  value={editingTx.voucherNo || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, voucherNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট' : 'Note'}
                </label>
                <textarea
                  rows={2}
                  value={editingTx.note || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Lender Info */}
      {editingLender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h4 className="text-sm font-bold">
                {lang === 'bn' ? 'ঋণদাতার অ্যাকাউন্ট এডিট' : 'Edit Lender Profile'}
              </h4>
              <button onClick={() => setEditingLender(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditLender} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ঋণদাতার নাম *' : 'Lender Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingLender.name}
                  onChange={(e) => setEditingLender({ ...editingLender, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={editingLender.phone || ''}
                  onChange={(e) => setEditingLender({ ...editingLender, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'সম্ভাব্য পরিশোধের তারিখ' : 'Target Repayment Date'}
                </label>
                <input
                  type="date"
                  value={editingLender.dueDate || ''}
                  onChange={(e) => setEditingLender({ ...editingLender, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editingLender.notes || ''}
                  onChange={(e) => setEditingLender({ ...editingLender, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLender(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg"
                >
                  {lang === 'bn' ? 'আপডেট করুন' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
