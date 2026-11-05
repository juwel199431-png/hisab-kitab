import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  TrendingUp,
  Plus,
  Printer,
  Download,
  Trash2,
  Calendar,
  Search,
  Sparkles,
  Coins,
  FileText,
  BadgeDollarSign,
  ArrowUpRight,
  Edit2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { UniversalTransactionEditModal } from '../Common/UniversalTransactionEditModal';

interface KuwaitExtraIncomeViewProps {
  embedded?: boolean;
}

export const KuwaitExtraIncomeView: React.FC<KuwaitExtraIncomeViewProps> = ({ embedded = false }) => {
  const { data, lang, t, addTransaction, deleteTransaction } = useFinance();

  // Filters & Search
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Quick In-line Entry Form State (STRICTLY INCOME ONLY)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Extract all extra income transactions sorted chronologically (oldest to newest for running total calculation)
  const sortedAscending = useMemo(() => {
    return data.transactions
      .filter((tx) => tx.section === 'kuwait-extra-income')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data.transactions]);

  // Compute running balance for each transaction
  const transactionsWithRunningTotal = useMemo(() => {
    let cumulative = 0;
    return sortedAscending.map((tx) => {
      cumulative += Number(tx.amount || 0);
      return {
        ...tx,
        runningTotal: cumulative,
      };
    });
  }, [sortedAscending]);

  // Total Lifetime Accumulated Income
  const lifetimeTotal = useMemo(() => {
    return sortedAscending.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [sortedAscending]);

  // Current Month Total
  const thisMonthTotal = useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    return sortedAscending
      .filter((tx) => tx.date.startsWith(currentMonthKey))
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [sortedAscending]);

  // Display list (newest first for comfortable UI viewing, while keeping the correct running balance)
  const displayList = useMemo(() => {
    const list = [...transactionsWithRunningTotal].reverse();
    return list.filter((tx) => {
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(q);
        if (!noteMatch) return false;
      }
      return true;
    });
  }, [transactionsWithRunningTotal, selectedMonth, searchQuery]);

  // Selected Filter Period Total
  const selectedPeriodTotal = useMemo(() => {
    return displayList.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  }, [displayList]);

  // Handle Quick Add
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert(lang === 'bn' ? 'সঠিক দিনার পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }
    if (!note.trim()) {
      alert(lang === 'bn' ? 'আয়ের উৎস বা বিবরণ লিখুন' : 'Please describe the income source');
      return;
    }

    addTransaction({
      section: 'kuwait-extra-income',
      type: 'income', // STRICTLY INCOME ONLY
      date,
      amount: parsed,
      currency: 'KWD',
      note: note.trim(),
    });

    setAmount('');
    setNote('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'কাজের বিবরণ / আয়ের উৎস' : 'Description / Source',
      lang === 'bn' ? 'আয়ের পরিমাণ (KWD)' : 'Income Amount (KWD)',
      lang === 'bn' ? 'রানিং মোট জমা (KWD)' : 'Running Total (KWD)',
    ];

    const rows = displayList.map((tx) => [
      tx.date,
      tx.note || '',
      tx.amount.toFixed(3),
      tx.runningTotal.toFixed(3),
    ]);

    rows.push([
      'TOTAL ACCUMULATED',
      '',
      `${selectedPeriodTotal.toFixed(3)} KD`,
      `${lifetimeTotal.toFixed(3)} KD`,
    ]);

    exportToCSV(`Kuwait-Extra-Income-${selectedMonth}`, [headers, ...rows]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Official Print Header */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
              {lang === 'bn' ? 'কুয়েত এর অতিরিক্ত আয় বিবরনী' : 'Kuwait Extra Income Statement'}
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              {lang === 'bn'
                ? `সাইড জব ও অতিরিক্ত আয়ের সঞ্চয় হিসাব — ফিল্টার: ${selectedMonth === 'all' ? 'সর্বমোট' : formatMonth(selectedMonth, lang)}`
                : `Extra earnings & savings ledger — Filter: ${selectedMonth}`}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">CURRENCY: KWD (কুয়েতি দিনার)</p>
            <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Print Summary Box */}
        <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-center">
          <div className="border-r border-emerald-300">
            <p className="text-xs text-emerald-800 font-bold uppercase">
              {lang === 'bn' ? 'ফিল্টারকৃত আয়' : 'Selected Period Income'}
            </p>
            <p className="text-xl font-bold font-mono mt-1 text-emerald-950">
              {selectedPeriodTotal.toFixed(3)} KD
            </p>
          </div>
          <div>
            <p className="text-xs text-emerald-800 font-bold uppercase">
              {lang === 'bn' ? 'সর্বমোট মোট সঞ্চিত জমা (Running Total)' : 'Total Accumulated Extra Income'}
            </p>
            <p className="text-xl font-bold font-mono mt-1 text-emerald-950">
              {lifetimeTotal.toFixed(3)} KD
            </p>
          </div>
        </div>
      </div>

      {/* Control Header & Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {lang === 'bn' ? (embedded ? 'অতিরিক্ত আয় হিসাব ও রানিং মোট জমা' : 'কুয়েত এর অতিরিক্ত আয়') : 'Kuwait Extra Income'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'bn'
                ? 'শুধুমাত্র অতিরিক্ত আয় ও সাইড জবের হিসাব। প্রতি এন্ট্রির পর স্বয়ংক্রিয়ভাবে রানিং মোট জমা যোগ হয়।'
                : 'Ledger strictly for extra earnings & side jobs with automatic running accumulation total.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter Picker */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="all">{lang === 'bn' ? 'সকল মাসের আয়' : 'All Months'}</option>
                {Array.from(new Set(sortedAscending.map((t) => t.date.slice(0, 7))))
                  .sort()
                  .reverse()
                  .map((month) => (
                    <option key={month} value={month}>
                      {formatMonth(month, lang)}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
              title="স্টেটমেন্ট প্রিন্ট বা পিডিএফ সংরক্ষণ"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
              title="এক্সেল বা সিএসভি ডাউনলোড"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'CSV' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* 3 Prominent Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Lifetime Total Accumulated */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-semibold">
                {lang === 'bn' ? 'সর্বমোট অতিরিক্ত আয়' : 'Total Accumulated'}
              </span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-950 mt-1.5">
              {formatCurrency(lifetimeTotal, 'KWD', lang)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{lang === 'bn' ? 'সব মিলিয়ে মোট সঞ্চিত অর্থ' : 'Cumulative earnings'}</span>
            </p>
          </div>

          {/* This Month's Extra Income */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold">
                {lang === 'bn' ? 'চলতি মাসের অতিরিক্ত আয়' : 'This Month'}
              </span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
              {formatCurrency(thisMonthTotal, 'KWD', lang)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'bn' ? 'চলতি ক্যালেন্ডার মাস' : 'Current active month'}
            </p>
          </div>

          {/* Total Entries Count & Average */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold">
                {lang === 'bn' ? 'মোট আয়ের এন্ট্রি' : 'Total Records'}
              </span>
              <BadgeDollarSign className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
              {sortedAscending.length} <span className="text-xs font-normal text-slate-500">{lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'bn'
                ? `গড় আয়: ${sortedAscending.length > 0 ? (lifetimeTotal / sortedAscending.length).toFixed(3) : '0.000'} KD`
                : `Avg per entry: ${sortedAscending.length > 0 ? (lifetimeTotal / sortedAscending.length).toFixed(3) : '0.000'} KD`}
            </p>
          </div>
        </div>
      </div>

      {/* Rapid In-line Entry Form (Strictly Income only, no categories needed) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {lang === 'bn' ? 'নতুন অতিরিক্ত আয় এন্ট্রি করুন' : 'Add New Extra Income'}
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {lang === 'bn' ? 'শুধুমাত্র আয়' : 'Income Only'}
          </span>
        </div>

        <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Date */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'bn' ? 'তারিখ' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Amount */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'bn' ? 'আয়ের পরিমাণ (KWD)' : 'Amount (KWD)'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                KD
              </span>
            </div>
          </div>

          {/* Source / Note */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'bn' ? 'কাজের বিবরণ বা আয়ের উৎস' : 'Work Description / Source'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'যেমন: শুক্রবারের অতিরিক্ত কাজ / সাইড প্রজেক্ট' : 'e.g., Friday extra electrical work'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'যোগ করুন' : 'Add Income'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Income Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Search & Title Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {lang === 'bn' ? 'অতিরিক্ত আয়ের হিসাব খাতা ও রানিং মোট জমা' : 'Extra Income Ledger & Running Total'}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {displayList.length} {lang === 'bn' ? 'টি রেকর্ড' : 'records'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'বিবরণ দিয়ে খুঁজুন...' : 'Search descriptions...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                <th className="py-2.5 px-3.5 w-28">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3.5">{lang === 'bn' ? 'কাজের বিবরণ / উৎস' : 'Description / Source'}</th>
                <th className="py-2.5 px-3.5 text-right w-36">{lang === 'bn' ? 'আয়ের পরিমাণ' : 'Income Amount'}</th>
                <th className="py-2.5 px-3.5 text-right w-44 bg-emerald-50/50 text-emerald-900">
                  {lang === 'bn' ? 'রানিং মোট জমা' : 'Running Total'}
                </th>
                <th className="py-2.5 px-3.5 text-center w-16 no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Coins className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <p className="text-xs font-medium">
                      {lang === 'bn' ? 'কোন অতিরিক্ত আয়ের এন্ট্রি পাওয়া যায়নি' : 'No extra income entries recorded yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayList.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Index */}
                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                      {displayList.length - idx}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 font-medium font-mono text-[11px]">
                      {formatDate(tx.date, lang)}
                    </td>

                    {/* Description Note */}
                    <td className="py-3 px-3.5 text-slate-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>{tx.note || (lang === 'bn' ? 'অতিরিক্ত কাজ' : 'Extra income')}</span>
                      </div>
                    </td>

                    {/* Amount KD */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      +{tx.amount.toFixed(3)} KD
                    </td>

                    {/* Running Accumulated Total KD */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 tabular-nums bg-emerald-50/40">
                      {tx.runningTotal.toFixed(3)} KD
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTxId(tx.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title={lang === 'bn' ? 'সংশোধন / এডিট করুন' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(lang === 'bn' ? 'এই আয়ের এন্ট্রিটি মুছে ফেলতে চান?' : 'Delete this income entry?')) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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

            {/* Accounting Running Total Footer */}
            {displayList.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-xs">
                    {lang === 'bn' ? 'ফিল্টারকৃত মোট আয়:' : 'Filtered Period Total:'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-emerald-800 text-xs">
                    +{selectedPeriodTotal.toFixed(3)} KD
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-slate-900 text-sm bg-emerald-100/60 font-bold">
                    {lifetimeTotal.toFixed(3)} KD
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Print Signature Box */}
        <div className="hidden print:flex justify-between items-center px-10 py-12 mt-8 border-t border-slate-300 text-xs">
          <div className="text-center">
            <div className="w-52 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">{lang === 'bn' ? 'হিসাব প্রস্তুতকারী' : 'Prepared By'}</p>
            <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'তারিখ ও মোবাইল' : 'Date & Contact'}</p>
          </div>

          <div className="text-center">
            <div className="w-52 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-800">{lang === 'bn' ? 'মোট সঞ্চিত স্থিতি নিশ্চিতকরণ' : 'Verified Accumulation'}</p>
            <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'স্বাক্ষর' : 'Signature'}</p>
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
