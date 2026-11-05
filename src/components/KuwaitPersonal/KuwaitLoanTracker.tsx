import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  HandCoins,
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
import { KuwaitReceivableBorrower, KuwaitReceivableTransaction } from '../../types/finance';

export const KuwaitLoanTracker: React.FC = () => {
  const {
    data,
    lang,
    t,
    getKuwaitReceivableTotals,
    getBorrowerBalance,
    addKuwaitReceivableBorrower,
    updateKuwaitReceivableBorrower,
    deleteKuwaitReceivableBorrower,
    addKuwaitReceivableTransaction,
    updateKuwaitReceivableTransaction,
    deleteKuwaitReceivableTransaction,
  } = useFinance();

  // Filters & Search
  const [selectedBorrowerFilter, setSelectedBorrowerFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lend' | 'collect'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  // Expanded Statement for Person Card
  const [expandedBorrowerId, setExpandedBorrowerId] = useState<string | null>(null);

  // Edit State
  const [editingTx, setEditingTx] = useState<KuwaitReceivableTransaction | null>(null);
  const [editingBorrower, setEditingBorrower] = useState<KuwaitReceivableBorrower | null>(null);

  // Form State: New Lend
  const [lendBorrowerMode, setLendBorrowerMode] = useState<'existing' | 'new'>('existing');
  const [lendBorrowerId, setLendBorrowerId] = useState('');
  const [newBorrowerName, setNewBorrowerName] = useState('');
  const [newBorrowerPhone, setNewBorrowerPhone] = useState('');
  const [newBorrowerDueDate, setNewBorrowerDueDate] = useState('');
  const [lendAmount, setLendAmount] = useState('');
  const [lendDate, setLendDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lendVoucher, setLendVoucher] = useState('');
  const [lendNote, setLendNote] = useState('');

  // Form State: Collect / Return
  const [collectBorrowerId, setCollectBorrowerId] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDate, setCollectDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [collectVoucher, setCollectVoucher] = useState('');
  const [collectNote, setCollectNote] = useState('');

  // Overall KPI Statistics
  const {
    totalLent,
    totalCollected,
    totalRemaining,
    activeBorrowersCount,
    totalBorrowersCount,
    transactionsCount,
  } = useMemo(() => {
    return getKuwaitReceivableTotals();
  }, [getKuwaitReceivableTotals, data.kuwaitReceivableTransactions, data.kuwaitReceivableBorrowers]);

  const borrowers = useMemo(() => {
    return (data.kuwaitReceivableBorrowers || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [data.kuwaitReceivableBorrowers]);

  const transactions = useMemo(() => {
    return (data.kuwaitReceivableTransactions || [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.kuwaitReceivableTransactions]);

  // Filtered transactions for the ledger table
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedBorrowerFilter !== 'all' && tx.borrowerId !== selectedBorrowerFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = tx.borrowerName.toLowerCase().includes(q);
        const noteMatch = tx.note?.toLowerCase().includes(q);
        const voucherMatch = tx.voucherNo?.toLowerCase().includes(q);
        if (!nameMatch && !noteMatch && !voucherMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedBorrowerFilter, typeFilter, searchQuery]);

  // Handle open lend modal
  const handleOpenLend = (borrowerId?: string) => {
    if (borrowerId) {
      setLendBorrowerMode('existing');
      setLendBorrowerId(borrowerId);
    } else if (borrowers.length > 0) {
      setLendBorrowerMode('existing');
      setLendBorrowerId(borrowers[0].id);
    } else {
      setLendBorrowerMode('new');
      setLendBorrowerId('');
    }
    setLendAmount('');
    setLendDate(new Date().toISOString().split('T')[0]);
    setLendVoucher(`LND-${Date.now().toString().slice(-4)}`);
    setLendNote('');
    setIsLendModalOpen(true);
  };

  // Handle open collect modal
  const handleOpenCollect = (borrowerId?: string) => {
    if (borrowerId) {
      setCollectBorrowerId(borrowerId);
    } else if (borrowers.length > 0) {
      setCollectBorrowerId(borrowers[0].id);
    } else {
      alert(lang === 'bn' ? 'প্রথমে কাউকে লোন প্রদান এন্ট্রি করুন!' : 'No borrowers found. Please record a loan first.');
      return;
    }
    setCollectAmount('');
    setCollectDate(new Date().toISOString().split('T')[0]);
    setCollectVoucher(`COL-${Date.now().toString().slice(-4)}`);
    setCollectNote('');
    setIsCollectModalOpen(true);
  };

  // Submit New Lend
  const handleLendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(lendAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ দিন' : 'Enter valid amount');
      return;
    }

    let targetBorrowerId = lendBorrowerId;
    let targetBorrowerName = '';

    if (lendBorrowerMode === 'new') {
      if (!newBorrowerName.trim()) {
        alert(lang === 'bn' ? 'গ্রহীতার নাম লিখুন' : 'Enter borrower name');
        return;
      }
      const created = addKuwaitReceivableBorrower({
        name: newBorrowerName.trim(),
        phone: newBorrowerPhone.trim() || undefined,
        dueDate: newBorrowerDueDate.trim() || undefined,
      });
      targetBorrowerId = created.id;
      targetBorrowerName = created.name;
    } else {
      const found = borrowers.find((b) => b.id === targetBorrowerId);
      if (!found) {
        alert(lang === 'bn' ? 'গ্রহীতা নির্বাচন করুন' : 'Select a borrower');
        return;
      }
      targetBorrowerName = found.name;
    }

    addKuwaitReceivableTransaction({
      borrowerId: targetBorrowerId,
      borrowerName: targetBorrowerName,
      type: 'lend',
      amount: parsedAmount,
      currency: 'KWD',
      date: lendDate,
      voucherNo: lendVoucher.trim() || undefined,
      note: lendNote.trim() || undefined,
    });

    setIsLendModalOpen(false);
    setNewBorrowerName('');
    setNewBorrowerPhone('');
    setNewBorrowerDueDate('');
    setLendAmount('');
    setLendNote('');
  };

  // Submit Collect / Return
  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(collectAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ দিন' : 'Enter valid amount');
      return;
    }

    const found = borrowers.find((b) => b.id === collectBorrowerId);
    if (!found) {
      alert(lang === 'bn' ? 'গ্রহীতা নির্বাচন করুন' : 'Select a borrower');
      return;
    }

    const currentBal = getBorrowerBalance(found.id);
    if (parsedAmount > currentBal.remaining + 0.001) {
      const confirmOver = confirm(
        lang === 'bn'
          ? `সতর্কতা: অবশিষ্ট পাওনা ছিল ${currentBal.remaining.toFixed(3)} KD, কিন্তু আপনি ${parsedAmount.toFixed(3)} KD আদায় করছেন। চালিয়ে যেতে চান?`
          : `Notice: Current balance is ${currentBal.remaining.toFixed(3)} KD, but you entered ${parsedAmount.toFixed(3)} KD. Continue?`
      );
      if (!confirmOver) return;
    }

    addKuwaitReceivableTransaction({
      borrowerId: found.id,
      borrowerName: found.name,
      type: 'collect',
      amount: parsedAmount,
      currency: 'KWD',
      date: collectDate,
      voucherNo: collectVoucher.trim() || undefined,
      note: collectNote.trim() || undefined,
    });

    setIsCollectModalOpen(false);
    setCollectAmount('');
    setCollectNote('');
  };

  // WhatsApp Reminder Handler
  const handleSendWhatsAppReminder = (borrower: KuwaitReceivableBorrower) => {
    const bal = getBorrowerBalance(borrower.id);
    const dueInfo = borrower.dueDate
      ? lang === 'bn'
        ? `\nনির্ধারিত পরিশোধ তারিখ: ${borrower.dueDate}`
        : `\nTarget Due Date: ${borrower.dueDate}`
      : '';
    const message =
      lang === 'bn'
        ? `সালামু আলাইকুম ভাই ${borrower.name}।\nকুয়েত পার্সোনাল লোন হিসাব বিবরণী:\n• মোট লোন গ্রহণ: ${bal.totalLent.toFixed(3)} KD\n• এ পর্যন্ত ফেরত আদায়: ${bal.totalCollected.toFixed(3)} KD\n• বর্তমানে অবশিষ্ট পাওনা: ${bal.remaining.toFixed(3)} KD${dueInfo}\n\nমেহেরবানী করে দ্রুত পাওনা অর্থ পরিশোধ করবেন। জাযাকাল্লাহু খাইরান!`
        : `Assalamu Alaikum brother ${borrower.name}.\nPersonal Loan Statement Reminder:\n• Total Loan: ${bal.totalLent.toFixed(3)} KD\n• Total Repaid: ${bal.totalCollected.toFixed(3)} KD\n• Remaining Due: ${bal.remaining.toFixed(3)} KD${dueInfo}\n\nPlease arrange repayment at your earliest convenience. Thank you!`;

    const cleanPhone = borrower.phone ? borrower.phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Submit Edit Transaction
  const handleEditTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const parsedAmount = parseFloat(String(editingTx.amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ দিন' : 'Enter valid amount');
      return;
    }

    updateKuwaitReceivableTransaction(editingTx.id, {
      amount: parsedAmount,
      date: editingTx.date,
      type: editingTx.type,
      voucherNo: editingTx.voucherNo?.trim() || undefined,
      note: editingTx.note?.trim() || undefined,
    });

    setEditingTx(null);
  };

  // Submit Edit Borrower
  const handleEditBorrowerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBorrower) return;

    if (!editingBorrower.name.trim()) {
      alert(lang === 'bn' ? 'নাম লিখুন' : 'Enter name');
      return;
    }

    updateKuwaitReceivableBorrower(editingBorrower.id, {
      name: editingBorrower.name.trim(),
      phone: editingBorrower.phone?.trim() || undefined,
      dueDate: editingBorrower.dueDate?.trim() || undefined,
      notes: editingBorrower.notes?.trim() || undefined,
    });

    setEditingBorrower(null);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'গ্রহীতার অ্যাকাউন্ট' : 'Borrower Account',
      lang === 'bn' ? 'লেনদেনের ধরন' : 'Type',
      lang === 'bn' ? 'ভাউচার / স্লিপ নং' : 'Voucher No',
      lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)',
      lang === 'bn' ? 'নোট ও বিবরণ' : 'Notes',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.borrowerName,
      tx.type === 'lend'
        ? lang === 'bn'
          ? 'লোন প্রদান (Lend)'
          : 'Lend'
        : lang === 'bn'
        ? 'ফেরত আদায় (Collect)'
        : 'Collect',
      tx.voucherNo || '',
      tx.amount.toFixed(3),
      tx.note || '',
    ]);

    exportToCSV(`Kuwait_Personal_Receivable_Loan_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 p-4 border-b border-slate-300">
        <div className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Kuwait Personal Receivable Loan Ledger (ব্যক্তিগত পাওনা লোন হিসাব)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            কাউকে দিনার লোন প্রদান এবং আংশিক/সম্পূর্ণ টাকা ফেরত আদায়ের হিসাব বিবরনী
          </p>
          <div className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
            <span>Prepared: Juwel</span>
            <span>Currency: Kuwaiti Dinar (KWD / د.ك)</span>
            <span>Total Remaining Due: {totalRemaining.toFixed(3)} KD</span>
          </div>
        </div>
      </div>

      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'Personal Receivable Loan (ব্যক্তিগত পাওনা লোন)' : 'Personal Receivable Loan Tracker'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  KWD Currency
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn'
                  ? 'কাউকে ব্যক্তিগত প্রয়োজনে দিনার লোন দেওয়া এবং আংশিক বা কিস্তিতে ফেরত আদায়ের ব্যক্তিভিত্তিক নিখুঁত খতিয়ান'
                  : 'Track dinar loans given to individuals with partial/full collection and running balance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenLend()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '+ লোন প্রদান এন্ট্রি' : '+ Give Loan'}</span>
            </button>

            <button
              onClick={() => handleOpenCollect()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '✓ টাকা ফেরত গ্রহণ' : '✓ Collect / Repay'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title={lang === 'bn' ? 'প্রিন্ট অথবা PDF সেভ করুন' : 'Print / PDF'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="CSV Download"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          {/* Card 1: Total Lent */}
          <div className="bg-linear-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white rounded-2xl p-4 border border-indigo-400/30 shadow-md shadow-indigo-500/15 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider block">
                {lang === 'bn' ? 'মোট লোন প্রদান (Total Lent)' : 'Total Lent'}
              </span>
              <span className="font-mono text-xl font-bold text-white mt-1.5 block drop-shadow-xs">
                {totalLent.toFixed(3)} KD
              </span>
            </div>
            <span className="text-[10px] text-indigo-100/90 font-medium mt-2 block">
              {lang === 'bn' ? '💼 সর্বমোট ধার দেওয়া অর্থ' : '💼 Total money loaned out'}
            </span>
          </div>

          {/* Card 2: Total Collected */}
          <div className="bg-linear-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-2xl p-4 border border-emerald-400/30 shadow-md shadow-emerald-500/15 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
                {lang === 'bn' ? 'মোট ফেরত আদায় (Collected)' : 'Total Collected'}
              </span>
              <span className="font-mono text-xl font-bold text-white mt-1.5 block drop-shadow-xs">
                {totalCollected.toFixed(3)} KD
              </span>
            </div>
            <span className="text-[10px] text-emerald-100/90 font-medium mt-2 block">
              {totalLent > 0
                ? `✓ ${((totalCollected / totalLent) * 100).toFixed(0)}% ${lang === 'bn' ? 'আদায় সম্পন্ন' : 'recovered'}`
                : '—'}
            </span>
          </div>

          {/* Card 3: Remaining Due */}
          <div className="bg-linear-to-br from-amber-500 via-orange-600 to-red-600 text-white rounded-2xl p-4 border border-amber-400/30 shadow-md shadow-orange-500/15 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">
                  {lang === 'bn' ? 'বর্তমান মোট পাওনা (Remaining Due)' : 'Remaining Due'}
                </span>
                {totalRemaining > 0 && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <span className="font-mono text-xl font-bold text-white mt-1.5 block drop-shadow-xs">
                {totalRemaining.toFixed(3)} KD
              </span>
            </div>
            <span className="text-[10px] text-amber-100/90 font-medium mt-2 block">
              ⚡ {activeBorrowersCount} {lang === 'bn' ? 'জনের কাছে পাওনা বাকি' : 'active due borrowers'}
            </span>
          </div>

          {/* Card 4: Accounts Count */}
          <div className="bg-linear-to-br from-purple-600 via-violet-600 to-indigo-900 text-white rounded-2xl p-4 border border-purple-400/30 shadow-md shadow-purple-500/15 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-100 uppercase tracking-wider block">
                {lang === 'bn' ? 'গ্রহীতা অ্যাকাউন্ট সংখ্যা' : 'Borrower Accounts'}
              </span>
              <span className="font-mono text-xl font-bold text-white mt-1.5 block drop-shadow-xs">
                {totalBorrowersCount} {lang === 'bn' ? 'জন' : 'people'}
              </span>
            </div>
            <span className="text-[10px] text-purple-100/90 font-medium mt-2 block">
              👥 {transactionsCount} {lang === 'bn' ? 'টি মোট লেনদেন' : 'total transactions'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Individual Borrower Accounts Grid (ব্যক্তি অনুযায়ী আলাদা অ্যাকাউন্ট) */}
      <div className="space-y-3.5 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'bn' ? 'ব্যক্তিভিত্তিক পাওনা লোন অ্যাকাউন্ট' : 'Borrower Accounts Ledger'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'প্রতিটি ব্যক্তির নামে আলাদা কার্ড। টাকা ফেরত পেলে "ফেরত গ্রহণ" বাটনে ক্লিক করুন, সরাসরি ব্যালেন্স থেকে বিয়োগ হবে।'
                : 'Each person has their own card. Repayments directly subtract from their remaining balance.'}
            </p>
          </div>
        </div>

        {borrowers.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-600">
              {lang === 'bn' ? 'কোন ঋণগ্রহীতার অ্যাকাউন্ট নেই' : 'No borrower accounts yet'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'bn'
                ? 'কাউকে লোন দিতে উপরের "+ লোন প্রদান এন্ট্রি" বাটনে ক্লিক করুন।'
                : 'Click "+ Give Loan" above to add your first loan record.'}
            </p>
            <button
              onClick={() => handleOpenLend()}
              className="mt-3 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
            >
              {lang === 'bn' ? '+ প্রথম লোন এন্ট্রি করুন' : '+ Add First Loan'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {borrowers.map((borrower) => {
              const bal = getBorrowerBalance(borrower.id);
              const isCleared = bal.remaining <= 0.0001;
              const recoveryPercent = bal.totalLent > 0 ? (bal.totalCollected / bal.totalLent) * 100 : 0;
              const isExpanded = expandedBorrowerId === borrower.id;

              return (
                <div
                  key={borrower.id}
                  className={`bg-white rounded-xl border transition-all shadow-xs ${
                    isCleared ? 'border-emerald-200' : 'border-amber-300/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isCleared
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {borrower.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {borrower.name}
                          </h4>
                          {borrower.phone && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{borrower.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          isCleared
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isCleared
                          ? lang === 'bn' ? 'পরিশোধিত / হিসাব ক্লিয়ার' : 'Cleared'
                          : lang === 'bn' ? 'পাওনা বাকি' : 'Due'}
                      </span>
                    </div>

                    {borrower.notes && (
                      <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-1.5 rounded border border-slate-100 italic">
                        {borrower.notes}
                      </p>
                    )}

                    {borrower.dueDate && (
                      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-slate-50 border border-slate-200">
                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-[10px] font-medium text-slate-600">
                          {lang === 'bn' ? 'পরিশোধের তারিখ:' : 'Target Due:'} <span className="font-mono font-bold text-slate-800">{borrower.dueDate}</span>
                        </span>
                        {!isCleared && new Date(borrower.dueDate) < new Date(new Date().toISOString().split('T')[0]) && (
                          <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                            {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Financial Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'মোট লোন প্রদান:' : 'Total Lent:'}</span>
                      <span className="font-mono font-bold text-indigo-900">
                        {bal.totalLent.toFixed(3)} KD
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-500">{lang === 'bn' ? 'ফেরত আদায় (Collected):' : 'Collected:'}</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +{bal.totalCollected.toFixed(3)} KD
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{lang === 'bn' ? 'আদায়ের অগ্রগতি' : 'Recovery progress'}</span>
                        <span className="font-mono font-bold text-slate-600">{recoveryPercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCleared ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, recoveryPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Net Remaining Balance Banner */}
                    <div
                      className={`p-2.5 rounded-lg flex items-center justify-between text-xs ${
                        isCleared
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-50 text-amber-950 border border-amber-200'
                      }`}
                    >
                      <span className="font-bold">
                        {lang === 'bn' ? 'অবশিষ্ট পাওনা:' : 'Remaining Due:'}
                      </span>
                      <span className="font-mono text-sm font-bold">
                        {bal.remaining.toFixed(3)} KD
                      </span>
                    </div>

                    {/* Quick Action Buttons on Card */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleOpenCollect(borrower.id)}
                        disabled={isCleared}
                        className={`py-1.5 px-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          isCleared
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer'
                        }`}
                        title={lang === 'bn' ? 'টাকা ফেরত পেলে এন্ট্রি করুন' : 'Record collection'}
                      >
                        <Check className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'ফেরত গ্রহণ' : 'Collect'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenLend(borrower.id)}
                        className="py-1.5 px-1.5 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title={lang === 'bn' ? 'আরও লোন প্রদান করুন' : 'Lend more'}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'লোন প্রদান' : 'Lend'}</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppReminder(borrower)}
                        className="py-1.5 px-1.5 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title={lang === 'bn' ? 'হোয়াটসঅ্যাপে স্টেটমেন্ট রিমাইন্ডার পাঠান' : 'WhatsApp Statement Reminder'}
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>{lang === 'bn' ? 'রিমাইন্ডার' : 'WhatsApp'}</span>
                      </button>
                    </div>

                    {/* Expand/Collapse Statement Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <button
                        onClick={() => setExpandedBorrowerId(isExpanded ? null : borrower.id)}
                        className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1"
                      >
                        <span>
                          {isExpanded
                            ? lang === 'bn' ? 'লেজার বন্ধ করুন' : 'Hide Statement'
                            : lang === 'bn' ? `বিবরণী দেখুন (${bal.transactions.length})` : `Statement (${bal.transactions.length})`}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <button
                          onClick={() => setEditingBorrower(borrower)}
                          className="hover:text-indigo-600 p-0.5"
                          title={lang === 'bn' ? 'তথ্য এডিট' : 'Edit Borrower'}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(lang === 'bn' ? `"${borrower.name}" এর অ্যাকাউন্ট ও সকল লেনদেন মুছে ফেলবেন?` : `Delete "${borrower.name}" and all records?`)) {
                              deleteKuwaitReceivableBorrower(borrower.id);
                            }
                          }}
                          className="hover:text-rose-600 p-0.5"
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Individual Account Statement Ledger */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          {lang === 'bn' ? `${borrower.name} এর লেনদেন ইতিহাস:` : `${borrower.name}'s History:`}
                        </span>
                        {bal.transactions.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            {lang === 'bn' ? 'কোন লেনদেন নেই' : 'No transactions recorded'}
                          </p>
                        ) : (
                          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 pr-1">
                            {bal.transactions.map((tx) => (
                              <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                        tx.type === 'lend'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {tx.type === 'lend' ? (lang === 'bn' ? 'প্রদান' : 'Lend') : (lang === 'bn' ? 'ফেরত' : 'Collect')}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500">{tx.date}</span>
                                    {tx.voucherNo && (
                                      <span className="text-[9px] text-indigo-600 font-mono">#{tx.voucherNo}</span>
                                    )}
                                  </div>
                                  {tx.note && <p className="text-[11px] text-slate-600 mt-0.5">{tx.note}</p>}
                                </div>

                                <div className="text-right shrink-0">
                                  <span
                                    className={`font-mono font-bold block ${
                                      tx.type === 'lend' ? 'text-indigo-900' : 'text-emerald-700'
                                    }`}
                                  >
                                    {tx.type === 'lend' ? '+' : '-'}{tx.amount.toFixed(3)} KD
                                  </span>
                                  <div className="flex items-center justify-end gap-1 mt-0.5">
                                    <button
                                      onClick={() => setEditingTx(tx)}
                                      className="text-slate-400 hover:text-indigo-600 p-0.5"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(lang === 'bn' ? 'এই লেনদেনটি মুছে ফেলতে চান?' : 'Delete transaction?')) {
                                          deleteKuwaitReceivableTransaction(tx.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-0.5"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Complete Audit Ledger Table with Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden no-print">
        {/* Table Filters & Search */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {lang === 'bn' ? 'পাওনা লোন অডিট খতিয়ান ও হিসাব লেনদেন' : 'Receivable Loans Audit Ledger'}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Borrower */}
            <select
              value={selectedBorrowerFilter}
              onChange={(e) => setSelectedBorrowerFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="all">{lang === 'bn' ? 'সকল গ্রহীতা (All)' : 'All Borrowers'}</option>
              {borrowers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="all">{lang === 'bn' ? 'সকল ধরন' : 'All Types'}</option>
              <option value="lend">{lang === 'bn' ? 'লোন প্রদান (Lend)' : 'Lend'}</option>
              <option value="collect">{lang === 'bn' ? 'ফেরত আদায় (Collect)' : 'Collect'}</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'খুঁজুন...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'গ্রহীতার নাম' : 'Borrower'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'ধরন' : 'Type'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'ভাউচার / স্লিপ' : 'Voucher'}</th>
                <th className="py-2.5 px-3.5">{lang === 'bn' ? 'নোট ও বিবরণ' : 'Note'}</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount'}</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <p className="font-semibold">{lang === 'bn' ? 'কোন লেনদেনের তথ্য পাওয়া যায়নি' : 'No transactions found'}</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-600">
                      {formatDate(tx.date, lang)}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-bold text-slate-900">
                      {tx.borrowerName}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'lend'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {tx.type === 'lend'
                          ? lang === 'bn' ? '+ লোন প্রদান' : '+ Lend'
                          : lang === 'bn' ? '- ফেরত আদায়' : '- Collect'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {tx.voucherNo ? `#${tx.voucherNo}` : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">
                      {tx.note || '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                      <span className={tx.type === 'lend' ? 'text-indigo-900' : 'text-emerald-700'}>
                        {tx.type === 'lend' ? '+' : '-'}{tx.amount.toFixed(3)} KD
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title={lang === 'bn' ? 'সংশোধন / এডিট' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(lang === 'bn' ? 'এই রেকর্ডটি মুছে ফেলতে চান?' : 'Delete record?')) {
                              deleteKuwaitReceivableTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
            {/* Table Footer */}
            {filteredTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800 text-[11px]">
                  <td colSpan={5} className="py-2 px-3.5 text-right uppercase">
                    {lang === 'bn' ? 'মোট ফিল্টারকৃত অবশিষ্ট পাওনা:' : 'Filtered Remaining Due:'}
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono text-amber-950 font-bold">
                    {totalRemaining.toFixed(3)} KD
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: Give Loan (+ লোন প্রদান) */}
      {isLendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-indigo-700" />
                <span>{lang === 'bn' ? '+ কাওকে দিনার লোন প্রদান এন্ট্রি' : '+ Give Dinar Loan'}</span>
              </h3>
              <button onClick={() => setIsLendModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLendSubmit} className="p-5 space-y-3.5 text-xs">
              {/* Borrower Mode: Existing vs New */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লোন গ্রহীতা' : 'Borrower'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setLendBorrowerMode('existing')}
                    disabled={borrowers.length === 0}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                      lendBorrowerMode === 'existing'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lang === 'bn' ? 'পূর্বের গ্রহীতা' : 'Existing Borrower'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLendBorrowerMode('new')}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                      lendBorrowerMode === 'new'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lang === 'bn' ? '+ নতুন গ্রহীতা' : '+ New Borrower'}
                  </button>
                </div>

                {lendBorrowerMode === 'existing' && (
                  <select
                    value={lendBorrowerId}
                    onChange={(e) => setLendBorrowerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                  >
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.phone ? `(${b.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {lendBorrowerMode === 'new' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'গ্রহীতার পুরো নাম (যেমন: রফিক ভাই / মামুন)' : 'Borrower Name'}
                      value={newBorrowerName}
                      onChange={(e) => setNewBorrowerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Phone (Optional)'}
                      value={newBorrowerPhone}
                      onChange={(e) => setNewBorrowerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                    />
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        {lang === 'bn' ? 'সম্ভাব্য ফেরত/পরিশোধের তারিখ (ঐচ্ছিক)' : 'Target Due Date (Optional)'}
                      </label>
                      <input
                        type="date"
                        value={newBorrowerDueDate}
                        onChange={(e) => setNewBorrowerDueDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'লোনের পরিমাণ (KWD)' : 'Amount (KWD)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={lendAmount}
                    onChange={(e) => setLendAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'লোন দেওয়ার তারিখ' : 'Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={lendDate}
                    onChange={(e) => setLendDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Voucher No */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / স্লিপ নম্বর' : 'Voucher #'}
                </label>
                <input
                  type="text"
                  placeholder="LND-1001"
                  value={lendVoucher}
                  onChange={(e) => setLendVoucher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'bn' ? 'ধার দেওয়ার কারণ বা ফেরত দেওয়ার সম্ভাব্য সময়...' : 'Reason or due details...'}
                  value={lendNote}
                  onChange={(e) => setLendNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLendModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'লোন সংরক্ষণ' : 'Save Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Collect / Return (✓ টাকা ফেরত গ্রহণ) */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? '✓ লোন ফেরত / টাকা আদায় এন্ট্রি' : 'Record Loan Collection'}</span>
              </h3>
              <button onClick={() => setIsCollectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="p-5 space-y-3.5 text-xs">
              {/* Select Borrower */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কার কাছ থেকে টাকা ফেরত নিচ্ছেন?' : 'Borrower Returning Money'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={collectBorrowerId}
                  onChange={(e) => setCollectBorrowerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                >
                  {borrowers.map((b) => {
                    const bal = getBorrowerBalance(b.id);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} — [অবশিষ্ট পাওনা: {bal.remaining.toFixed(3)} KD]
                      </option>
                    );
                  })}
                </select>

                {collectBorrowerId && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] flex justify-between items-center">
                    <span>{lang === 'bn' ? 'উক্ত ব্যক্তির বর্তমান বাকি পাওনা:' : 'Current Remaining Due:'}</span>
                    <span className="font-mono font-bold text-amber-950">
                      {getBorrowerBalance(collectBorrowerId).remaining.toFixed(3)} KD
                    </span>
                  </div>
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'আদায়কৃত পরিমাণ (KWD)' : 'Collected Amount (KWD)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'ফেরত পাওয়ার তারিখ' : 'Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Voucher No */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / মানি রসিদ নম্বর' : 'Receipt / Voucher #'}
                </label>
                <input
                  type="text"
                  placeholder="COL-1001"
                  value={collectVoucher}
                  onChange={(e) => setCollectVoucher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট ও বিবরণ' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'bn' ? 'আংশিক বা সম্পূর্ণ ফেরত পাওয়া গেলো...' : 'Partial or full return...'}
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-800 text-[11px]">
                <p>
                  {lang === 'bn'
                    ? 'টাকা সেভ করার সাথে সাথে উক্ত ব্যক্তির পাওনা ব্যালেন্স থেকে স্বয়ংক্রিয়ভাবে মাইনাস হয়ে যাবে।'
                    : 'The entered amount will be deducted directly from this borrower\'s remaining due balance.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'আদায় সংরক্ষণ (মাইনাস করুন)' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Single Transaction */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'bn' ? 'লেনদেন রেকর্ড এডিট' : 'Edit Transaction'}</span>
              </h3>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditTxSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'গ্রহীতা' : 'Borrower'}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingTx.borrowerName}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ধরন' : 'Type'}
                </label>
                <select
                  value={editingTx.type}
                  onChange={(e) => setEditingTx({ ...editingTx, type: e.target.value as 'lend' | 'collect' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold"
                >
                  <option value="lend">{lang === 'bn' ? '+ লোন প্রদান (Lend)' : '+ Lend'}</option>
                  <option value="collect">{lang === 'bn' ? '- ফেরত আদায় (Collect)' : '- Collect'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={editingTx.date}
                    onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ভাউচার / রসিদ #' : 'Voucher #'}
                </label>
                <input
                  type="text"
                  value={editingTx.voucherNo || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, voucherNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট' : 'Note'}
                </label>
                <textarea
                  rows={2}
                  value={editingTx.note || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'আপডেট করুন' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Borrower Details */}
      {editingBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'bn' ? 'গ্রহীতার তথ্য পরিবর্তন' : 'Edit Borrower'}</span>
              </h3>
              <button onClick={() => setEditingBorrower(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditBorrowerSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'গ্রহীতার নাম' : 'Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBorrower.name}
                  onChange={(e) => setEditingBorrower({ ...editingBorrower, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={editingBorrower.phone || ''}
                  onChange={(e) => setEditingBorrower({ ...editingBorrower, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'সম্ভাব্য ফেরত/পরিশোধের তারিখ' : 'Target Due Date'}
                </label>
                <input
                  type="date"
                  value={editingBorrower.dueDate || ''}
                  onChange={(e) => setEditingBorrower({ ...editingBorrower, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editingBorrower.notes || ''}
                  onChange={(e) => setEditingBorrower({ ...editingBorrower, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBorrower(null)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
