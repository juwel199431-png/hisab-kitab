import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Landmark,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Plus,
  Filter,
  Download,
  Trash2,
  Calendar,
  Search,
  PiggyBank,
  Edit2,
  Check,
  X,
  CreditCard,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { BankAccount, Transaction } from '../../types/finance';
import { UniversalTransactionEditModal } from '../Common/UniversalTransactionEditModal';

export const BangladeshBankingView: React.FC = () => {
  const {
    data,
    lang,
    t,
    getNextVoucherNo,
    getBankBalance,
    getTotalBdBanksBalance,
    deleteTransaction,
    openQuickAddWithSection,
    addBankAccount,
    updateBankAccount,
    transferBankFunds,
  } = useFinance();

  // Filters
  const [selectedBankId, setSelectedBankId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromBankId, setTransferFromBankId] = useState('');
  const [transferToBankId, setTransferToBankId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transferVoucher, setTransferVoucher] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [confirmLowBalanceTransfer, setConfirmLowBalanceTransfer] = useState(false);

  // Transaction edit & delete modal state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Bank edit state
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccNo, setEditBankAccNo] = useState('');
  const [editBankBranch, setEditBankBranch] = useState('');
  const [editBankOpeningBal, setEditBankOpeningBal] = useState('');

  // Add Bank state
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccNo, setNewBankAccNo] = useState('');
  const [newBankBranch, setNewBankBranch] = useState('');
  const [newBankOpeningBal, setNewBankOpeningBal] = useState('');

  const bdTransactions = useMemo(() => {
    return data.transactions.filter((tx) => tx.section === 'bd-bank');
  }, [data.transactions]);

  // Overall Statistics
  const totalBalance = useMemo(() => getTotalBdBanksBalance(), [data.transactions, data.banks]);

  const totalIncome = useMemo(() => {
    return bdTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [bdTransactions]);

  const totalExpense = useMemo(() => {
    return bdTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [bdTransactions]);

  const totalTransferredToSavings = useMemo(() => {
    return bdTransactions
      .filter((tx) => tx.type === 'transfer' && tx.transferTargetType !== 'bank')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [bdTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return bdTransactions.filter((tx) => {
      // Bank filter
      if (selectedBankId !== 'all') {
        const matchesBank =
          tx.bankId === selectedBankId ||
          tx.fromBankId === selectedBankId ||
          tx.toBankId === selectedBankId;
        if (!matchesBank) return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        if (tx.type !== selectedType) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (tx.categoryId !== selectedCategory && tx.categoryNameBn !== selectedCategory) {
          return false;
        }
      }

      // Date range filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(query);
        const catBnMatch = tx.categoryNameBn?.toLowerCase().includes(query);
        const catEnMatch = tx.categoryNameEn?.toLowerCase().includes(query);
        if (!noteMatch && !catBnMatch && !catEnMatch) return false;
      }

      return true;
    });
  }, [bdTransactions, selectedBankId, selectedType, selectedCategory, startDate, endDate, searchQuery]);

  // Handle Bank Editing
  const startEditingBank = (bank: BankAccount) => {
    setEditingBankId(bank.id);
    setEditBankName(bank.name);
    setEditBankAccNo(bank.accountNumber);
    setEditBankBranch(bank.branch || '');
    setEditBankOpeningBal(String(bank.openingBalance));
  };

  const saveBankEdit = (id: string) => {
    updateBankAccount(id, {
      name: editBankName.trim(),
      accountNumber: editBankAccNo.trim(),
      branch: editBankBranch.trim() || undefined,
      openingBalance: parseFloat(editBankOpeningBal) || 0,
    });
    setEditingBankId(null);
  };

  const handleAddNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;
    addBankAccount({
      name: newBankName.trim(),
      accountNumber: newBankAccNo.trim() || 'N/A',
      branch: newBankBranch.trim() || undefined,
      openingBalance: parseFloat(newBankOpeningBal) || 0,
      color: 'slate',
    });
    setNewBankName('');
    setNewBankAccNo('');
    setNewBankBranch('');
    setNewBankOpeningBal('');
    setIsAddingBank(false);
  };

  const handleOpenTransfer = () => {
    setTransferError(null);
    setConfirmLowBalanceTransfer(false);
    setTransferFromBankId(data.banks[0]?.id || '');
    setTransferToBankId(data.banks[1]?.id || data.banks[0]?.id || '');
    setTransferVoucher(getNextVoucherNo());
    setIsTransferModalOpen(true);
  };

  const executeTransfer = (parsed: number) => {
    transferBankFunds({
      fromBankId: transferFromBankId,
      toBankId: transferToBankId,
      amount: parsed,
      date: transferDate,
      voucherNo: transferVoucher.trim() || undefined,
      note: transferNote.trim() || undefined,
    });

    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferVoucher('');
    setTransferNote('');
    setTransferError(null);
    setConfirmLowBalanceTransfer(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (data.banks.length < 2) {
      setTransferError(
        lang === 'bn'
          ? 'ফান্ড ট্রান্সফারের জন্য কমপক্ষে ২টি ব্যাংক অ্যাকাউন্ট থাকতে হবে।'
          : 'At least 2 bank accounts required for transfer.'
      );
      return;
    }

    const parsed = parseFloat(transferAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setTransferError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter valid amount');
      return;
    }
    if (!transferFromBankId || !transferToBankId) {
      setTransferError(lang === 'bn' ? 'উৎস ও গন্তব্য ব্যাংক সিলেক্ট করুন' : 'Select both source and destination banks');
      return;
    }
    if (transferFromBankId === transferToBankId) {
      setTransferError(
        lang === 'bn' ? 'একই ব্যাংকে ট্রান্সফার করা যাবে না, ভিন্ন ব্যাংক নির্বাচন করুন' : 'Source and destination banks must be different'
      );
      return;
    }

    const fromBal = getBankBalance(transferFromBankId);
    if (fromBal < parsed && !confirmLowBalanceTransfer) {
      setConfirmLowBalanceTransfer(true);
      return;
    }

    executeTransfer(parsed);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'ধরণ' : 'Type',
      lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category',
      lang === 'bn' ? 'টাকার পরিমাণ (BDT)' : 'Amount (BDT)',
      lang === 'bn' ? 'ব্যাংক হিসাব' : 'Bank',
      lang === 'bn' ? 'নোট / বিবরণ' : 'Note',
    ];

    const rows = filteredTransactions.map((tx) => {
      let typeLabel: string = tx.type;
      if (tx.type === 'income') typeLabel = lang === 'bn' ? 'জমা / আয়' : 'Income';
      else if (tx.type === 'expense') typeLabel = lang === 'bn' ? 'খরচ / ব্যয়' : 'Expense';
      else if (tx.type === 'transfer') typeLabel = lang === 'bn' ? 'ফান্ড ট্রান্সফার' : 'Transfer';

      let bankInfo = '';
      if (tx.type === 'transfer') {
        const fromB = data.banks.find((b) => b.id === tx.fromBankId)?.name || 'Bank';
        const toB =
          tx.transferTargetType === 'bank'
            ? data.banks.find((b) => b.id === tx.toBankId)?.name || 'Bank'
            : data.savingsAccounts.find((s) => s.id === tx.targetSavingsId)?.name || 'Savings';
        bankInfo = `${fromB} -> ${toB}`;
      } else {
        bankInfo = data.banks.find((b) => b.id === tx.bankId)?.name || 'Bank';
      }

      return [
        tx.date,
        typeLabel,
        lang === 'bn' ? tx.categoryNameBn || '' : tx.categoryNameEn || tx.categoryNameBn || '',
        tx.amount,
        bankInfo,
        tx.note || '',
      ];
    });

    exportToCSV(`BD-Banks-Report-${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Official Print Statement Header */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
              {lang === 'bn' ? 'বাংলাদেশ ব্যাংকিং হিসাব ও লেনদেন বিবরণী' : 'Bangladesh Bank Accounts Statement'}
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              {lang === 'bn' ? 'সকল ব্যাংক অ্যাকাউন্টের অফিশিয়াল অডিট ও লেনদেন স্টেটমেন্ট' : 'Official Banking Audit & Transaction Statement'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">মুদ্রা: BDT (বাংলাদেশি টাকা ৳)</p>
            <p className="font-mono">তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>

      {/* Top Banner & KPI Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs no-print transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {lang === 'bn' ? 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী' : 'Bangladesh Bank Accounts Statement'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'সকল ব্যাংক অ্যাকাউন্ট, ক্যাটাগরি অনুযায়ী আয়-ব্যয় এবং ডিপিএস/ইন্সুরেন্স ফান্ড ট্রান্সফার'
                : 'Bank accounts with category-wise inflows, outflows, and savings transfers'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="১০০% বিনামূল্যে সরাসরি প্রিন্ট বা PDF হিসেবে সেভ করুন"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF স্টেটমেন্ট' : 'Print / PDF'}</span>
            </button>
            <button
              onClick={() => openQuickAddWithSection('bd-bank')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}</span>
            </button>
            <button
              onClick={handleOpenTransfer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={lang === 'bn' ? 'এক ব্যাংক থেকে অন্য ব্যাংকে টাকা স্থানান্তর' : 'Bank-to-Bank Transfer'}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" />
              <span>{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</span>
            </button>
            <button
              onClick={() => setIsAddingBank(!isAddingBank)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>{lang === 'bn' ? '+ ব্যাংক যোগ' : '+ Add Bank'}</span>
            </button>
          </div>
        </div>

        {/* Global KPIs with Advanced Modern Colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5">
          <div className="bg-linear-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/70 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'bn' ? 'সর্বমোট ব্যাংক ব্যালেন্স' : 'Total Bank Balance'}</span>
              <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white font-mono tabular-nums mt-1.5">
              {formatCurrency(totalBalance, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
              {lang === 'bn' ? `${data.banks.length}টি ব্যাংকে মোট জমা স্থিতি` : `Across ${data.banks.length} bank accounts`}
            </p>
          </div>

          <div className="bg-linear-to-br from-blue-50 via-indigo-50/70 to-blue-100/50 dark:from-blue-950/60 dark:via-slate-900 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800/70 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <p className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'bn' ? 'মোট জমা ও ইনফ্লো' : 'Total Inflow'}</span>
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-blue-950 dark:text-white font-mono tabular-nums mt-1.5">
              {formatCurrency(totalIncome, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium mt-1">
              {lang === 'bn' ? 'রেমিট্যান্স ও অন্যান্য মোট জমা' : 'Remittance & all deposits'}
            </p>
          </div>

          <div className="bg-linear-to-br from-rose-50 via-pink-50/70 to-rose-100/50 dark:from-rose-950/60 dark:via-slate-900 dark:to-rose-950/30 rounded-xl p-4 border border-rose-200 dark:border-rose-800/70 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <p className="text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'bn' ? 'মোট সরাসরি খরচ' : 'Total Outflow'}</span>
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-950 dark:text-white font-mono tabular-nums mt-1.5">
              {formatCurrency(totalExpense, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium mt-1">
              {lang === 'bn' ? 'পারিবারিক ও দৈনন্দিন খরচ' : 'Direct expenses paid'}
            </p>
          </div>

          <div className="bg-linear-to-br from-purple-50 via-fuchsia-50/70 to-indigo-100/50 dark:from-purple-950/60 dark:via-slate-900 dark:to-indigo-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/70 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
            <p className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'bn' ? 'ডিপিএস/ইন্সুরেন্স সঞ্চয়' : 'Sent to Savings'}</span>
              <PiggyBank className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white font-mono tabular-nums mt-1.5">
              {formatCurrency(totalTransferredToSavings, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium mt-1">
              {lang === 'bn' ? 'ব্যাংক থেকে সঞ্চয়ে ট্রান্সফার' : 'Bank to DPS/Insurance'}
            </p>
          </div>
        </div>
      </div>

      {/* Add Bank Form Drawer (if triggered) */}
      {isAddingBank && (
        <form
          onSubmit={handleAddNewBank}
          className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
              {lang === 'bn' ? 'নতুন ব্যাংক অ্যাকাউন্ট তথ্য' : 'New Bank Account Details'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingBank(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'}
              </label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="যেমন: সোনালী ব্যাংক লিমিটেড"
                required
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
              </label>
              <input
                type="text"
                value={newBankAccNo}
                onChange={(e) => setNewBankAccNo(e.target.value)}
                placeholder="2050-XXXX-XXXX"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'শাখা / বিবরণ' : 'Branch / Note'}
              </label>
              <input
                type="text"
                value={newBankBranch}
                onChange={(e) => setNewBankBranch(e.target.value)}
                placeholder="রেমিট্যান্স শাখা"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ওপেনিং ব্যালেন্স (BDT)' : 'Opening Balance (BDT)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newBankOpeningBal}
                  onChange={(e) => setNewBankOpeningBal(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md whitespace-nowrap cursor-pointer"
                >
                  {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Individual Bank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.banks.map((bank, index) => {
          const currentBal = getBankBalance(bank.id);
          const isEditing = editingBankId === bank.id;

          // Inflows and Outflows for this bank
          const bankInflows = bdTransactions
            .filter((tx) => (tx.type === 'income' && tx.bankId === bank.id) || (tx.type === 'transfer' && tx.toBankId === bank.id))
            .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

          const bankOutflows = bdTransactions
            .filter((tx) => (tx.type === 'expense' && tx.bankId === bank.id) || (tx.type === 'transfer' && tx.fromBankId === bank.id))
            .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

          return (
            <div
              key={bank.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editBankName}
                          onChange={(e) => setEditBankName(e.target.value)}
                          className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 w-full"
                        />
                      ) : (
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{bank.name}</h3>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {lang === 'bn' ? 'সেভিংস অ্যাকাউন্ট' : 'Savings A/C'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {lang === 'bn' ? 'শাখা: লোকাল শাখা' : 'Branch: Local'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveBankEdit(bank.id)}
                          className="p-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded cursor-pointer"
                          title="সংরক্ষণ"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingBankId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                          title="বাতিল"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditingBank(bank)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                        title={lang === 'bn' ? 'তথ্য ও ওপেনিং ব্যালেন্স পরিবর্তন' : 'Edit bank details'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Balances */}
                <div className="pt-3 pb-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{lang === 'bn' ? 'ওপেনিং ব্যালেন্স:' : 'Opening Bal:'}</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editBankOpeningBal}
                        onChange={(e) => setEditBankOpeningBal(e.target.value)}
                        className="w-24 text-right font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-1"
                      />
                    ) : (
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                        {formatCurrency(bank.openingBalance, 'BDT', lang)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700 dark:text-emerald-400">{lang === 'bn' ? 'মোট জমা / ইনফ্লো:' : 'Total Inflow:'}</span>
                    <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                      +{formatCurrency(bankInflows, 'BDT', lang)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-rose-700 dark:text-rose-400">{lang === 'bn' ? 'মোট খরচ ও ট্রান্সফার:' : 'Total Outflow:'}</span>
                    <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                      -{formatCurrency(bankOutflows, 'BDT', lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Net Balance */}
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60 p-2.5 rounded-lg">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{lang === 'bn' ? 'বর্তমান ব্যালেন্স:' : 'Current Bal:'}</span>
                <span
                  className={`font-mono tabular-nums text-base font-bold ${
                    currentBal >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(currentBal, 'BDT', lang)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions Ledger & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
        {/* Ledger Header & Filter Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী (লেনদেন খতিয়ান)' : 'Bangladesh Bank Statement Ledger'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? `মোট ${filteredTransactions.length}টি এন্ট্রি প্রদর্শিত হচ্ছে`
                  : `Showing ${filteredTransactions.length} transactions`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-2xs cursor-pointer"
                title={lang === 'bn' ? 'ব্যাংক স্টেটমেন্ট প্রিন্ট বা PDF হিসেবে সেভ করুন' : 'Print or Save PDF'}
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>{lang === 'bn' ? 'এক্সেল ডাউনলোড (CSV)' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Bank Filter */}
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="all">{lang === 'bn' ? 'সকল ব্যাংক' : 'All Banks'}</option>
              {data.banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="all">{lang === 'bn' ? 'সকল ধরণ' : 'All Types'}</option>
              <option value="income">{lang === 'bn' ? 'শুধুমাত্র জমা / আয়' : 'Inflow (Income)'}</option>
              <option value="expense">{lang === 'bn' ? 'শুধুমাত্র খরচ / ব্যয়' : 'Outflow (Expense)'}</option>
              <option value="transfer">{lang === 'bn' ? 'শুধুমাত্র ট্রান্সফার' : 'Transfers'}</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="all">{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              {data.categories
                .filter((c) => c.section === 'bd-bank')
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {lang === 'bn' ? cat.nameBn : cat.nameEn}
                  </option>
                ))}
            </select>

            {/* Clear Filters Button */}
            {(selectedBankId !== 'all' ||
              selectedCategory !== 'all' ||
              selectedType !== 'all' ||
              searchQuery ||
              startDate ||
              endDate) && (
              <button
                onClick={() => {
                  setSelectedBankId('all');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setSearchQuery('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md border border-rose-200 dark:border-rose-800 font-medium transition-colors cursor-pointer"
              >
                {lang === 'bn' ? 'ফিল্টার মুছুন' : 'Reset Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <th className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap">{lang === 'bn' ? 'ধরণ' : 'Type'}</th>
                <th className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap">{lang === 'bn' ? 'ব্যাংক হিসাব' : 'Bank'}</th>
                <th className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap">{lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}</th>
                <th className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap">{lang === 'bn' ? 'নোট / বিবরণ' : 'Note'}</th>
                <th className="py-2.5 px-2.5 xl:px-3 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}</th>
                <th className="py-2.5 px-2.5 xl:px-3 text-center whitespace-nowrap sticky right-0 z-10 bg-slate-100 dark:bg-slate-800 border-l border-slate-200/80 dark:border-slate-700/80 shadow-[-4px_0_8px_-4px_rgba(15,23,42,0.08)] no-print">
                  {lang === 'bn' ? 'অ্যাকশন' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    {lang === 'bn'
                      ? 'কোন লেনদেন পাওয়া যায়নি। উপরে "+ নতুন লেনদেন" বাটনে ক্লিক করে যুক্ত করুন।'
                      : 'No transactions found matching your filters.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  let bankDisplay = '-';
                  if (tx.type === 'transfer') {
                    const fromB = data.banks.find((b) => b.id === tx.fromBankId)?.name || 'Bank';
                    const toB =
                      tx.transferTargetType === 'bank'
                        ? data.banks.find((b) => b.id === tx.toBankId)?.name || 'Bank'
                        : tx.transferTargetType === 'loan'
                        ? data.loans.find((l) => l.id === tx.targetLoanId)?.name || (lang === 'bn' ? 'ব্যাংক লোন' : 'Bank Loan')
                        : data.savingsAccounts.find((s) => s.id === tx.targetSavingsId)?.name || 'Savings';
                    bankDisplay = `${fromB} ➔ ${toB}`;
                  } else {
                    bankDisplay = data.banks.find((b) => b.id === tx.bankId)?.name || '-';
                  }

                  return (
                    <tr key={tx.id} className="group hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {formatDate(tx.date, lang)}
                      </td>
                      <td className="py-2.5 px-2.5 xl:px-3 whitespace-nowrap">
                        {tx.type === 'income' && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 shrink-0" />
                            <span>{lang === 'bn' ? 'জমা' : 'Income'}</span>
                          </span>
                        )}
                        {tx.type === 'expense' && (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 shrink-0" />
                            <span>{lang === 'bn' ? 'খরচ' : 'Expense'}</span>
                          </span>
                        )}
                        {tx.type === 'transfer' && (
                          <span className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3 shrink-0" />
                            <span>{lang === 'bn' ? 'ট্রান্সফার' : 'Transfer'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 xl:px-3 text-slate-700 dark:text-slate-300 font-medium max-w-[165px] xl:max-w-[205px] truncate" title={bankDisplay}>
                        {bankDisplay}
                      </td>
                      <td className="py-2.5 px-2.5 xl:px-3 font-medium text-slate-900 dark:text-white max-w-[140px] xl:max-w-[175px] truncate" title={lang === 'bn' ? tx.categoryNameBn || tx.categoryNameEn || '-' : tx.categoryNameEn || tx.categoryNameBn || '-'}>
                        {lang === 'bn'
                          ? tx.categoryNameBn || tx.categoryNameEn || '-'
                          : tx.categoryNameEn || tx.categoryNameBn || '-'}
                      </td>
                      <td className="py-2.5 px-2.5 xl:px-3 text-slate-600 dark:text-slate-400 max-w-[175px] xl:max-w-[230px]">
                        <div className="truncate" title={tx.note || ''}>
                          {tx.note || '-'}
                        </div>
                        {tx.voucherNo && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                            {lang === 'bn' ? 'চেক/আইডি:' : 'Ref:'} {tx.voucherNo}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 xl:px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                        <span
                          className={
                            tx.type === 'income'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : tx.type === 'expense'
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}{' '}
                          {formatCurrency(tx.amount, 'BDT', lang)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 xl:px-3 text-center whitespace-nowrap sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 border-l border-slate-100 dark:border-slate-800 shadow-[-4px_0_8px_-4px_rgba(15,23,42,0.06)] transition-colors no-print">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTxId(tx.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 border border-indigo-200/80 dark:border-indigo-800/70 rounded-md transition-colors cursor-pointer"
                            title={lang === 'bn' ? 'লেনদেন এডিট / সংশোধন করুন' : 'Edit Transaction'}
                            aria-label={lang === 'bn' ? 'এডিট' : 'Edit'}
                          >
                            <Edit2 className="w-3 h-3 shrink-0" />
                            <span className="hidden xl:inline">{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTx(tx)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 border border-rose-200/80 dark:border-rose-800/70 rounded-md transition-colors cursor-pointer"
                            title={lang === 'bn' ? 'লেনদেন মুছে ফেলুন' : 'Delete Transaction'}
                            aria-label={lang === 'bn' ? 'ডিলিট' : 'Delete'}
                          >
                            <Trash2 className="w-3 h-3 shrink-0" />
                            <span className="hidden xl:inline">{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Bank-to-Bank Fund Transfer */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ব্যাংক টু ব্যাংক ফান্ড ট্রান্সফার' : 'Bank to Bank Fund Transfer'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn' ? 'এক ব্যাংক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে টাকা স্থানান্তর' : 'Move money between your BD bank accounts'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-5 space-y-3.5 text-xs">
              {transferError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 font-medium">
                  {transferError}
                </div>
              )}

              {confirmLowBalanceTransfer && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? `সতর্কতা: প্রেরক ব্যাংকে বর্তমান ব্যালেন্স ৳${getBankBalance(transferFromBankId).toLocaleString('bn-BD')}, যা ট্রান্সফার পরিমাণের চেয়ে কম।`
                        : `Warning: Sender bank balance (${formatCurrency(getBankBalance(transferFromBankId), 'BDT', lang)}) is less than transfer amount.`}
                    </span>
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmLowBalanceTransfer(false)}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                    >
                      {lang === 'bn' ? 'ফিরে যান' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                    >
                      {lang === 'bn' ? 'তবুও ট্রান্সফার করুন' : 'Proceed Anyway'}
                    </button>
                  </div>
                </div>
              )}

              {/* From Bank */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'প্রেরক ব্যাংক (From Bank)' : 'From Bank Account'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={transferFromBankId}
                  onChange={(e) => {
                    setTransferFromBankId(e.target.value);
                    setConfirmLowBalanceTransfer(false);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  required
                >
                  {data.banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (বর্তমান স্থিতি: ৳{getBankBalance(b.id).toLocaleString('bn-BD')})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Bank */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'প্রাপক ব্যাংক (To Bank)' : 'To Bank Account'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={transferToBankId}
                  onChange={(e) => setTransferToBankId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  required
                >
                  {data.banks.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === transferFromBankId}>
                      {b.name} (বর্তমান স্থিতি: ৳{getBankBalance(b.id).toLocaleString('bn-BD')}) {b.id === transferFromBankId ? '(প্রেরক)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ট্রান্সফার পরিমাণ (BDT ৳)' : 'Amount (BDT ৳)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => {
                      setTransferAmount(e.target.value);
                      setConfirmLowBalanceTransfer(false);
                    }}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Cheque / Txn Ref */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'ভাউচার / রেফারেন্স / চেক নং' : 'Voucher / Ref / Cheque #'}
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    ⚡ {lang === 'bn' ? 'অটো জেনারেটেড' : 'Auto Generated'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1001"
                  value={transferVoucher}
                  onChange={(e) => setTransferVoucher(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিবরণ বা নোট' : 'Note / Purpose'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ব্যাংক টু ব্যাংক ব্যালেন্স ট্রান্সফার' : 'Transfer note...'}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: In-App Delete Transaction Confirmation */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/80 dark:bg-rose-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'লেনদেন মুছে ফেলার নিশ্চিতকরণ' : 'Delete Transaction'}
                  </h3>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                    {lang === 'bn' ? 'এই লেনদেনটি স্থায়ীভাবে মুছে যাবে' : 'This action cannot be undone'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'তারিখ:' : 'Date:'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatDate(deletingTx.date, lang)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'ক্যাটাগরি / বিবরণ:' : 'Category / Note:'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[220px]">
                    {lang === 'bn'
                      ? deletingTx.categoryNameBn || deletingTx.note || '-'
                      : deletingTx.categoryNameEn || deletingTx.note || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'পরিমাণ:' : 'Amount:'}
                  </span>
                  <span
                    className={`font-mono font-black text-sm ${
                      deletingTx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : deletingTx.type === 'expense'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {formatCurrency(deletingTx.amount, 'BDT', lang)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'মুছে ফেললে সংশ্লিষ্ট ব্যাংক অ্যাকাউন্ট (এবং ট্রান্সফার হলে প্রাপক ব্যাংক / ডিপিএস / লোন) এর ব্যালেন্স স্বয়ংক্রিয়ভাবে সমন্বয় হয়ে যাবে।'
                  : 'Deleting this entry will automatically recalculate affected bank, savings, or loan balances.'}
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingTx(null)}
                  className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                >
                  {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTransaction(deletingTx.id);
                    setDeletingTx(null);
                  }}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
