import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  UserCheck,
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
  DollarSign,
  TrendingDown,
  Edit2,
  MessageCircle,
  CheckCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { UniversalTransactionEditModal } from '../Common/UniversalTransactionEditModal';

export const EmdadBhaiView: React.FC = () => {
  const {
    data,
    lang,
    t,
    addTransaction,
    deleteTransaction,
    togglePaymentStatus,
    bulkSettleEmdadExpenses,
  } = useFinance();

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Quick In-line Entry Form State (NO CATEGORIES as requested!)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');

  // Emdad Bhai Transactions
  const emdadTransactions = useMemo(() => {
    return data.transactions
      .filter((tx) => tx.section === 'emdad-expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions]);

  // Overall Totals
  const totalSpent = useMemo(() => {
    return emdadTransactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [emdadTransactions]);

  const totalPaid = useMemo(() => {
    return emdadTransactions
      .filter((tx) => tx.paymentStatus === 'paid')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [emdadTransactions]);

  const totalUnpaid = useMemo(() => {
    return emdadTransactions
      .filter((tx) => tx.paymentStatus !== 'paid')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [emdadTransactions]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return emdadTransactions.filter((tx) => {
      if (statusFilter === 'unpaid' && tx.paymentStatus === 'paid') return false;
      if (statusFilter === 'paid' && tx.paymentStatus !== 'paid') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(q);
        if (!noteMatch) return false;
      }
      return true;
    });
  }, [emdadTransactions, statusFilter, searchQuery]);

  // Handle Quick Add
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }
    if (!note.trim()) {
      alert(lang === 'bn' ? 'খরচের বিস্তারিত বিবরণ লিখুন' : 'Please describe the expense');
      return;
    }

    addTransaction({
      section: 'emdad-expense',
      type: 'expense', // STRICTLY EXPENSE ONLY
      date,
      amount: parsed,
      currency: 'KWD',
      note: note.trim(),
      paymentStatus,
    });

    setAmount('');
    setNote('');
    setPaymentStatus('unpaid'); // reset to default unpaid
  };

  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'খরচের বিস্তারিত বিবরণ' : 'Description / Note',
      lang === 'bn' ? 'খরচ (KWD)' : 'Amount (KWD)',
      lang === 'bn' ? 'কালেকশন স্ট্যাটাস' : 'Collection Status',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.note || '',
      tx.amount.toFixed(3),
      tx.paymentStatus === 'paid' ? 'Paid (কালেকশন সম্পন্ন)' : 'Unpaid (কালেকশন বাকি)',
    ]);

    rows.push([
      'SUMMARY',
      `Total Spent: ${totalSpent.toFixed(3)} KD`,
      `Total Paid: ${totalPaid.toFixed(3)} KD`,
      `Pending Collection (বকেয়া): ${totalUnpaid.toFixed(3)} KD`,
    ]);

    exportToCSV(`Emdad-Bhai-Expense-Report-${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  const handleBulkSettle = () => {
    if (totalUnpaid <= 0) {
      alert(lang === 'bn' ? 'কোনো বকেয়া খরচ বাকি নেই!' : 'No pending unpaid expenses!');
      return;
    }
    const confirmed = confirm(
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে এমদাদ ভাইয়ের সকল বকেয়া খরচ (মোট ${totalUnpaid.toFixed(3)} KD) এক ক্লিকে পরিশোধিত (Paid) করতে চান?`
        : `Are you sure you want to mark all pending expenses (Total ${totalUnpaid.toFixed(3)} KD) as Paid?`
    );
    if (confirmed) {
      bulkSettleEmdadExpenses();
    }
  };

  const handleSendWhatsAppClaim = () => {
    const unpaidItems = emdadTransactions.filter((tx) => tx.paymentStatus !== 'paid');
    const itemsText = unpaidItems.map((tx) => `• ${tx.date}: ${tx.note} — ${tx.amount.toFixed(3)} KD`).join('\n');
    const message =
      lang === 'bn'
        ? `সালামু আলাইকুম এমদাদ ভাই।\nআপনার জন্য করা খরচের হিসাব বিবরণী:\n• মোট খরচ: ${totalSpent.toFixed(3)} KD\n• এ পর্যন্ত কালেকশন সম্পন্ন: ${totalPaid.toFixed(3)} KD\n• বর্তমানে মোট বকেয়া পাওনা: ${totalUnpaid.toFixed(3)} KD\n\nবকেয়া খরচের তালিকা (${unpaidItems.length}টি):\n${itemsText || 'বর্তমানে কোনো বকেয়া নেই'}\n\nমেহেরবানী করে সুবিধামতো বকেয়া অর্থ পরিশোধ করে দিবেন। ধন্যবাদ - জুয়েল`
        : `Assalamu Alaikum Emdad Bhai.\nExpense & Claim Summary:\n• Total Incurred: ${totalSpent.toFixed(3)} KD\n• Total Settled: ${totalPaid.toFixed(3)} KD\n• Net Pending Due: ${totalUnpaid.toFixed(3)} KD\n\nPending items (${unpaidItems.length}):\n${itemsText || 'All cleared'}\n\nPlease arrange payment at your earliest convenience. Thank you - Juwel`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
              ইমদাদ ভাই এর খরচের হিসাব বিবরণী
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Emdad Bhai Expense Ledger & Payment Collection Statement
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">CURRENCY: KWD (কুয়েতি দিনার)</p>
            <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Print Summary Strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 border border-slate-300 rounded-lg text-center">
          <div className="border-r border-slate-300">
            <p className="text-xs text-slate-500 font-bold uppercase">মোট খরচ (Total Incurred)</p>
            <p className="text-lg font-bold font-mono mt-1 text-slate-900">{totalSpent.toFixed(3)} KD</p>
          </div>
          <div className="border-r border-slate-300">
            <p className="text-xs text-slate-500 font-bold uppercase">কালেকশন সম্পন্ন (Paid)</p>
            <p className="text-lg font-bold font-mono mt-1 text-emerald-700">{totalPaid.toFixed(3)} KD</p>
          </div>
          <div>
            <p className="text-xs text-rose-600 font-bold uppercase">কালেকশন বাকি / পাওনা (Unpaid)</p>
            <p className="text-lg font-bold font-mono mt-1 text-rose-700">{totalUnpaid.toFixed(3)} KD</p>
          </div>
        </div>
      </div>

      {/* Top Banner & Summary Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🤝</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {lang === 'bn' ? 'ইমদাদ ভাই এর হিসাব' : 'Emdad Bhai Expense Ledger'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'ইমদাদ ভাই এর জন্য কুয়েতি দিনারে খরচ এবং উনার কাছ থেকে কালেকশন (Paid/Unpaid) ট্র্যাকিং'
                : 'Tracks expenses in KWD with Paid & Unpaid collection tracking'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkSettle}
              disabled={totalUnpaid <= 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs ${
                totalUnpaid <= 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
              title={lang === 'bn' ? 'সকল বকেয়া একসাথে পরিশোধিত হিসেবে মার্ক করুন' : 'Mark all unpaid as paid'}
            >
              <CheckCheck className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সকল বকেয়া পরিশোধ' : 'Settle All Due'}</span>
            </button>

            <button
              onClick={handleSendWhatsAppClaim}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title={lang === 'bn' ? 'হোয়াটসঅ্যাপে দাবি স্লিপ পাঠান' : 'WhatsApp Claim Slip'}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ দাবি' : 'WhatsApp Claim'}</span>
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
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 3 Status KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Card 1: Unpaid (কালেকশন বাকি) */}
          <div className="bg-linear-to-br from-rose-600 via-orange-600 to-rose-800 text-white rounded-2xl p-4.5 border border-rose-400/30 shadow-md shadow-rose-500/15 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-100 uppercase tracking-wider flex items-center justify-between">
                <span>{lang === 'bn' ? 'উনার কাছে কালেকশন বাকি (Unpaid)' : 'Pending Collection (Unpaid)'}</span>
                <Clock className="w-4 h-4 text-rose-200" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {formatCurrency(totalUnpaid, 'KWD', lang)}
              </p>
            </div>
            <p className="text-[11px] text-rose-100/90 font-medium mt-2">
              {lang === 'bn'
                ? `⚠️ ${emdadTransactions.filter((t) => t.paymentStatus !== 'paid').length}টি খরচের টাকা উনার পরিশোধ বাকি`
                : `⚠️ ${emdadTransactions.filter((t) => t.paymentStatus !== 'paid').length} unpaid entries`}
            </p>
          </div>

          {/* Card 2: Paid (কালেকশন সম্পন্ন) */}
          <div className="bg-linear-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-2xl p-4.5 border border-emerald-400/30 shadow-md shadow-emerald-500/15 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider flex items-center justify-between">
                <span>{lang === 'bn' ? 'কালেকশন সম্পন্ন (Paid)' : 'Collected (Paid)'}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {formatCurrency(totalPaid, 'KWD', lang)}
              </p>
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium mt-2">
              {lang === 'bn' ? '✓ উনার কাছ থেকে টাকা বুঝে নেওয়া হয়েছে' : '✓ Settled & received from Emdad Bhai'}
            </p>
          </div>

          {/* Card 3: Total Expenses */}
          <div className="bg-linear-to-br from-slate-700 via-slate-800 to-indigo-950 text-white rounded-2xl p-4.5 border border-slate-600/30 shadow-md shadow-slate-900/15 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>{lang === 'bn' ? 'সর্বমোট খরচ (Total Spent)' : 'Total Incurred'}</span>
                <TrendingDown className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2 text-white drop-shadow-xs">
                {formatCurrency(totalSpent, 'KWD', lang)}
              </p>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-2">
              {lang === 'bn' ? `⚡ মোট ${emdadTransactions.length}টি খরচের হিসাব` : `⚡ ${emdadTransactions.length} total entries`}
            </p>
          </div>
        </div>
      </div>

      {/* Rapid In-Line Expense Logger (NO CATEGORIES, PROMINENT NOTES BOX) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs no-print">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-rose-600" />
            <span>{lang === 'bn' ? 'ইমদাদ ভাই এর নতুন খরচ এন্ট্রি' : 'Add New Expense for Emdad Bhai'}</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {lang === 'bn' ? 'কারেন্সি: কুয়েতি দিনার (KWD) · কোনো ক্যাটাগরি লাগবে না' : 'Currency: KWD · No category required'}
          </span>
        </div>

        <form onSubmit={handleAddExpense} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'দিনার পরিমাণ (KWD)' : 'Amount (KWD)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="যেমন: 5.250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {lang === 'bn' ? 'খরচের বিস্তারিত বিবরণ (নোট)' : 'Expense Description / Note'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'যেমন: গ্রোসারি বাজার, ট্যাক্সি ভাড়া, ঔষধ ক্রয়...' : 'Detail note of expense...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                {lang === 'bn' ? 'কালেকশন স্ট্যাটাস:' : 'Initial Status:'}
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('unpaid')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    paymentStatus === 'unpaid'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? 'Unpaid (কালেকশন বাকি)' : 'Unpaid (Pending)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? 'Paid (টাকা পেয়েছি)' : 'Paid (Collected)'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              {lang === 'bn' ? '+ খরচ সংরক্ষণ করুন' : '+ Save Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden print-shadow-none">
        {/* Table Filter & Controls */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 mr-2">
              {lang === 'bn' ? 'খরচের তালিকা' : 'Expense Entries'} ({filteredTransactions.length})
            </span>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'সকল' : 'All'}
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'unpaid'
                    ? 'bg-rose-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'কালেকশন বাকি (Unpaid)' : 'Unpaid'}
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid'}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'বিবরণ খুঁজুন...' : 'Search description...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3.5">{lang === 'bn' ? 'খরচের বিস্তারিত বিবরণ (নোট)' : 'Expense Description / Notes'}</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিমাণ (KWD)' : 'Amount (KWD)'}</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap">{lang === 'bn' ? 'কালেকশন স্ট্যাটাস' : 'Status'}</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap w-14 no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    {lang === 'bn'
                      ? 'কোন খরচের এন্ট্রি পাওয়া যায়নি।'
                      : 'No expense records found.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPaid = tx.paymentStatus === 'paid';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-600">
                        {formatDate(tx.date, lang)}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 max-w-md">
                        {tx.note || '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {tx.amount.toFixed(3)} KD
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {/* Interactive 1-click status switcher */}
                        <button
                          onClick={() => togglePaymentStatus(tx.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                          }`}
                          title={
                            lang === 'bn'
                              ? 'ক্লিক করে Paid / Unpaid পরিবর্তন করুন'
                              : 'Click to toggle Paid/Unpaid'
                          }
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid (কালেকশন সম্পন্ন)</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                              <span>Unpaid (কালেকশন বাকি)</span>
                            </>
                          )}
                        </button>
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
                              if (confirm(lang === 'bn' ? 'এই খরচের এন্ট্রিটি মুছে ফেলতে চান?' : 'Delete this record?')) {
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
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {filteredTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td colSpan={2} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-xs">
                    {lang === 'bn' ? 'ফিল্টারকৃত মোট খরচ:' : 'Subtotal Expenses:'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                    {filteredTransactions
                      .reduce((acc, t) => acc + Number(t.amount || 0), 0)
                      .toFixed(3)}{' '}
                    KD
                  </td>
                  <td className="text-center text-[11px] text-slate-500 py-2.5 px-3.5">
                    {lang === 'bn'
                      ? `বকেয়া বাকি: ${totalUnpaid.toFixed(3)} KD`
                      : `Unpaid: ${totalUnpaid.toFixed(3)} KD`}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Print Signatures */}
        <div className="hidden print:flex justify-between items-center px-10 py-12 mt-8 border-t border-slate-300 text-xs">
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">খরচকারীর স্বাক্ষর (Prepared By)</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">ইমদাদ ভাই এর স্বাক্ষর (Emdad Bhai)</p>
            <p className="text-[10px] text-slate-500">হিসাব ও কালেকশন নিশ্চিতকরণ</p>
          </div>
        </div>
      </div>

      {/* Universal Transaction Edit Modal */}
      <UniversalTransactionEditModal
        isOpen={!!editingTxId}
        onClose={() => setEditingTxId(null)}
        target={editingTxId ? { id: editingTxId, sourceType: 'transaction' } : null}
      />
    </div>
  );
};
