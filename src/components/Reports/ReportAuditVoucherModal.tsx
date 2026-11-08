import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  Layers,
  Tag,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  HandCoins,
  ShieldCheck,
  Building,
  Edit2,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

export interface AuditReportRow {
  id: string;
  sourceType: 'transaction' | 'boss-deposit' | 'kuwait-loan' | 'kuwait-payable' | 'kuwait-receivable';
  date: string;
  section: string;
  sectionNameBn: string;
  sectionNameEn: string;
  type: 'income' | 'expense' | 'transfer' | 'loan';
  categoryNameBn: string;
  categoryNameEn: string;
  amount: number;
  currency: 'BDT' | 'KWD';
  note?: string;
  status?: 'paid' | 'unpaid';
  borrowerId?: string;
  borrowerName?: string;
  bankName?: string;
  voucherNo?: string;
}

interface ReportAuditVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: AuditReportRow | null;
  lang: 'bn' | 'en';
  onEdit?: (row: AuditReportRow) => void;
}

export const ReportAuditVoucherModal: React.FC<ReportAuditVoucherModalProps> = ({
  isOpen,
  onClose,
  row,
  lang,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !row) return null;

  const isIncome = row.type === 'income';
  const isExpense = row.type === 'expense';
  const isLoan = row.type === 'loan';
  const isTransfer = row.type === 'transfer';

  const handlePrint = () => {
    window.print();
  };

  const getVoucherText = () => {
    const formattedAmount =
      row.currency === 'KWD'
        ? `${row.amount.toFixed(3)} KWD`
        : `৳ ${row.amount.toLocaleString('en-US')}`;
    const headName = lang === 'bn' ? row.sectionNameBn : row.sectionNameEn;
    const catName = lang === 'bn' ? row.categoryNameBn : row.categoryNameEn;
    const typeLabel = isIncome
      ? 'আয় / প্রাপ্তি'
      : isExpense
      ? 'ব্যয় / খরচ'
      : isLoan
      ? 'দিনার লোন'
      : 'ট্রান্সফার';

    return (
      `🧾 *হিসাব কিতাব - ডিজিটাল রসিদ ও ভাউচার*\n` +
      `--------------------------------\n` +
      `📅 তারিখ: ${formatDate(row.date, lang)}\n` +
      `🏷️ হেড: ${headName}\n` +
      `📂 খাত/ক্যাটাগরি: ${catName}\n` +
      `💰 পরিমাণ: ${formattedAmount} (${typeLabel})\n` +
      (row.voucherNo ? `🔢 ভাউচার নং: ${row.voucherNo}\n` : '') +
      (row.borrowerName ? `👤 গ্রহীতা: ${row.borrowerName}\n` : '') +
      (row.bankName ? `🏦 সংশ্লিষ্ট ব্যাংক: ${row.bankName}\n` : '') +
      (row.status ? `📌 স্ট্যাটাস: ${row.status === 'paid' ? 'পরিশোধিত (Paid)' : 'বাকি (Unpaid)'}\n` : '') +
      (row.note ? `📝 নোট: ${row.note}\n` : '') +
      `--------------------------------\n` +
      `✅ হিসাব কিতাব অ্যাপ থেকে স্বয়ংক্রিয়ভাবে জেনারেট করা।`
    );
  };

  const handleWhatsAppShare = () => {
    const text = getVoucherText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopySlip = async () => {
    const text = getVoucherText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Action Header */}
        <div className="px-5 py-3 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between no-print gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 hidden sm:inline">
              {lang === 'bn' ? 'লেনদেন অডিট স্লিপ' : 'Audit Slip'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'হোয়াটসঅ্যাপে রসিদ শেয়ার করুন' : 'Share on WhatsApp'}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'WhatsApp' : 'WhatsApp'}</span>
            </button>

            {/* Copy Slip Button */}
            <button
              type="button"
              onClick={handleCopySlip}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-300 hover:text-white bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'রসিদ কপি করুন' : 'Copy Voucher'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি স্লিপ' : 'Copy')}</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(row);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-200 hover:text-white bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 rounded-lg transition-colors cursor-pointer"
                title={lang === 'bn' ? 'সংশোধন ও এডিট করুন' : 'Edit'}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white overflow-y-auto">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'bn' ? 'ব্যক্তিগত ও ব্যবসায়িক হিসাব বিবরণী' : 'Finance Ledger Audit'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'স্মার্ট ফাইন্যান্স ট্র্যাকার ভাউচার' : 'Smart Finance Tracker Voucher'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-600 block">
                {formatDate(row.date, lang)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {row.id.substring(0, 12)}
              </span>
            </div>
          </div>

          {/* Amount Showcase Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isIncome
                ? 'bg-emerald-50/70 border-emerald-200'
                : isExpense
                ? 'bg-rose-50/70 border-rose-200'
                : isLoan
                ? 'bg-indigo-50/70 border-indigo-200'
                : 'bg-blue-50/70 border-blue-200'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-600 block">
                {lang === 'bn' ? 'লেনদেনের পরিমাণ' : 'Transaction Amount'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {isIncome
                  ? lang === 'bn' ? 'তহবিলে প্রাপ্তি / জমা' : 'Inflow / Deposit'
                  : isExpense
                  ? lang === 'bn' ? 'ব্যয় / খরচ' : 'Expense / Outflow'
                  : isLoan
                  ? lang === 'bn' ? 'দিনার লোন প্রদান' : 'Loan Given'
                  : lang === 'bn' ? 'অ্যাকাউন্ট ট্রান্সফার' : 'Fund Transfer'}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-bold font-mono ${
                  isIncome
                    ? 'text-emerald-700'
                    : isExpense
                    ? 'text-rose-700'
                    : isLoan
                    ? 'text-indigo-800'
                    : 'text-blue-700'
                }`}
              >
                {isIncome ? '+' : isExpense ? '-' : ''}
                {row.currency === 'KWD'
                  ? `${row.amount.toFixed(3)} KD`
                  : `${row.amount.toLocaleString('en-US')} ৳`}
              </span>
            </div>
          </div>

          {/* Key Metadata Table */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'bn' ? 'অ্যাকাউন্ট / হেড:' : 'Account / Head:'}</span>
              <span className="font-bold text-slate-900">
                {lang === 'bn' ? row.sectionNameBn : row.sectionNameEn}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{lang === 'bn' ? 'খাত / ক্যাটাগরি:' : 'Category:'}</span>
              <span className="font-semibold text-slate-900">
                {lang === 'bn' ? row.categoryNameBn : row.categoryNameEn}
              </span>
            </div>

            {row.bankName && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'সংশ্লিষ্ট ব্যাংক:' : 'Bank:'}</span>
                <span className="font-medium text-slate-800">{row.bankName}</span>
              </div>
            )}

            {row.borrowerName && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'গ্রহীতার নাম (লোন):' : 'Borrower:'}</span>
                <span className="font-bold text-indigo-900">{row.borrowerName}</span>
              </div>
            )}

            {row.status && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'পরিশোধ স্ট্যাটাস:' : 'Payment Status:'}</span>
                <span
                  className={`font-bold inline-flex items-center gap-1 ${
                    row.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {row.status === 'paid' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'পরিশোধিত / আদায় সম্পন্ন (Paid)' : 'Paid'}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'বাকি / অপরিশোধিত (Unpaid)' : 'Unpaid'}</span>
                    </>
                  )}
                </span>
              </div>
            )}

            {row.voucherNo && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'ভাউচার / ইনভয়েস নং:' : 'Voucher No:'}</span>
                <span className="font-mono font-bold text-indigo-700">{row.voucherNo}</span>
              </div>
            )}

            {row.note && (
              <div className="py-2">
                <span className="text-slate-500 block mb-1">{lang === 'bn' ? 'মন্তব্য / নোট:' : 'Note:'}</span>
                <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 text-xs border border-slate-200">
                  {row.note}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
            {lang === 'bn'
              ? 'এই তথ্যটি সরাসরি আপনার সিস্টেমে সংরক্ষিত ডাটাবেজ থেকে তৈরি করা হয়েছে।'
              : 'Automatically generated from system audit logs.'}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print gap-2">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(row);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সংশোধন করুন' : 'Edit Record'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-lg"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
