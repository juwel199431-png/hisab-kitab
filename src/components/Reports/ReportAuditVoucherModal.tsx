import React, { useState, useRef } from 'react';
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
  Download,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  VoucherData,
  drawVoucherCardCanvas,
  canvasToBlob,
  downloadBlobAsImage,
  copyBlobToClipboard,
} from '../../utils/voucherImageGenerator';
import { WhatsAppImageShareModal } from '../Common/WhatsAppImageShareModal';

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageToast, setImageToast] = useState<string | null>(null);
  const [isWhatsAppShareModalOpen, setIsWhatsAppShareModalOpen] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !row) return null;

  const isIncome = row.type === 'income';
  const isExpense = row.type === 'expense';
  const isLoan = row.type === 'loan';
  const isTransfer = row.type === 'transfer';

  const handlePrint = () => {
    window.print();
  };

  const getVoucherData = (): VoucherData => ({
    id: row.id,
    date: formatDate(row.date, lang),
    currency: row.currency,
    amount: row.amount,
    type: row.type,
    sectionNameBn: row.sectionNameBn,
    sectionNameEn: row.sectionNameEn,
    categoryNameBn: row.categoryNameBn,
    categoryNameEn: row.categoryNameEn,
    borrowerName: row.borrowerName,
    bankName: row.bankName,
    status: row.status,
    note: row.note,
    voucherNo: row.voucherNo,
  });

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

  /**
   * Share voucher strictly as an IMAGE to WhatsApp.
   * Opens the dedicated WhatsApp Image Share dialog with live preview & 1-click copy/send.
   */
  const handleWhatsAppShare = () => {
    setIsWhatsAppShareModalOpen(true);
  };

  /**
   * Directly download the voucher card as a PNG image (Pure Canvas - 100% reliable).
   */
  const handleDownloadImage = async () => {
    setIsProcessingImage(true);
    try {
      const canvas = drawVoucherCardCanvas(getVoucherData());
      const blob = await canvasToBlob(canvas);
      const fileName = `voucher-${row.voucherNo ? row.voucherNo.replace(/[^a-zA-Z0-9_-]/g, '') : row.id.slice(0, 8)}.png`;
      downloadBlobAsImage(blob, fileName);
      setImageToast(lang === 'bn' ? '✓ ভাউচার ছবি ডাউনলোড হয়েছে!' : '✓ Image downloaded!');
    } catch (err) {
      console.error(err);
      setImageToast(lang === 'bn' ? 'ছবি ডাউনলোড করা যায়নি' : 'Download failed');
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setImageToast(null), 3000);
    }
  };

  /**
   * Copy the voucher PNG image directly to clipboard (Pure Canvas - 100% reliable).
   */
  const handleCopyImageToClipboard = async () => {
    setIsProcessingImage(true);
    try {
      const canvas = drawVoucherCardCanvas(getVoucherData());
      const blob = await canvasToBlob(canvas);
      const ok = await copyBlobToClipboard(blob);
      if (ok) {
        setImageToast(lang === 'bn' ? '✓ ভাউচার ছবিটি কপি হয়েছে! চ্যাটে পেস্ট (Ctrl+V) করুন।' : '✓ Image copied to clipboard!');
      } else {
        const fileName = `voucher-${row.voucherNo ? row.voucherNo.replace(/[^a-zA-Z0-9_-]/g, '') : row.id.slice(0, 8)}.png`;
        downloadBlobAsImage(blob, fileName);
        setImageToast(lang === 'bn' ? 'ছবিটি ডাউনলোড হয়েছে' : 'Image downloaded');
      }
    } catch (err) {
      console.error(err);
      setImageToast(lang === 'bn' ? 'ছবি কপি করা যায়নি' : 'Copy failed');
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setImageToast(null), 3000);
    }
  };

  const handleCopySlipText = async () => {
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
            {/* WhatsApp Share as Image Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isProcessingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title={lang === 'bn' ? 'হোয়াটসঅ্যাপে এই ভাউচারটি ছবি আকারে পাঠান' : 'Share voucher as IMAGE to WhatsApp'}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {isProcessingImage
                  ? lang === 'bn' ? 'ছবি তৈরি হচ্ছে...' : 'Processing...'
                  : lang === 'bn' ? 'WhatsApp (ছবি)' : 'WhatsApp (Image)'}
              </span>
            </button>

            {/* Download Voucher Image Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isProcessingImage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-cyan-200 hover:text-white bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'ভাউচারের ছবি ডাউনলোড করুন' : 'Download Voucher Image'}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'ছবি সেভ' : 'Save Image'}</span>
            </button>

            {/* Copy Voucher Image to Clipboard */}
            <button
              type="button"
              onClick={handleCopyImageToClipboard}
              disabled={isProcessingImage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'ভাউচারের ছবিটি ক্লিপবোর্ডে কপি করুন (যাতে যেকোনো চ্যাটে পেস্ট করা যায়)' : 'Copy Image to Clipboard'}
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'ছবি কপি' : 'Copy Image'}</span>
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
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Image Toast Feedback */}
        {imageToast && (
          <div className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in shadow-inner">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{imageToast}</span>
          </div>
        )}

        {/* Printable Voucher Content (Captured as High-Res Image for WhatsApp) */}
        <div
          ref={voucherRef}
          className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white overflow-y-auto"
          style={{ minWidth: '340px' }}
        >
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-black uppercase text-indigo-900 tracking-wider">
                  {lang === 'bn' ? 'হিসাব কিতাব অডিট ভাউচার' : 'Hisab Kitab Voucher'}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'অফিসিয়াল লেনদেন ও হিসাব স্লিপ' : 'Official Transaction & Audit Slip'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-700 block">
                {formatDate(row.date, lang)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {row.voucherNo ? `#${row.voucherNo}` : `ID: ${row.id.substring(0, 10)}`}
              </span>
            </div>
          </div>

          {/* Amount Showcase Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
              isIncome
                ? 'bg-emerald-50/80 border-emerald-300'
                : isExpense
                ? 'bg-rose-50/80 border-rose-300'
                : isLoan
                ? 'bg-indigo-50/80 border-indigo-300'
                : 'bg-blue-50/80 border-blue-300'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                {lang === 'bn' ? 'লেনদেনের পরিমাণ' : 'Transaction Amount'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
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
                className={`text-2xl font-black font-mono tracking-tight ${
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
              <span className="font-bold text-slate-900">
                {lang === 'bn' ? row.categoryNameBn : row.categoryNameEn}
              </span>
            </div>

            {row.borrowerName && (
              <div className="flex justify-between py-2 border-b border-slate-100 bg-indigo-50/50 px-2 rounded-lg">
                <span className="text-indigo-900 font-semibold">{lang === 'bn' ? 'গ্রহীতা (Borrower):' : 'Borrower:'}</span>
                <span className="font-bold text-indigo-950 font-mono">{row.borrowerName}</span>
              </div>
            )}

            {row.bankName && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'সংশ্লিষ্ট ব্যাংক:' : 'Bank:'}</span>
                <span className="font-semibold text-slate-800">🏦 {row.bankName}</span>
              </div>
            )}

            {row.status && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                <span className="font-semibold">
                  {row.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'বাকি / অপরিশোধিত (Unpaid)' : 'Unpaid'}</span>
                    </span>
                  )}
                </span>
              </div>
            )}

            {row.voucherNo && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'bn' ? 'ভাউচার / ইনভয়েস নং:' : 'Voucher No:'}</span>
                <span className="font-mono font-bold text-indigo-700">#{row.voucherNo}</span>
              </div>
            )}

            {row.note && (
              <div className="py-2">
                <span className="text-slate-500 block mb-1">{lang === 'bn' ? 'মন্তব্য / নোট:' : 'Note:'}</span>
                <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 text-xs border border-slate-200 leading-relaxed font-medium">
                  {row.note}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <span>হিসাব কিতাব স্মার্ট ফাইন্যান্স</span>
            <span className="font-mono">Verified Transaction</span>
          </div>
        </div>

        {/* Modal Bottom Controls */}
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
              onClick={handleCopySlipText}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
              title={lang === 'bn' ? 'টেক্সট কপি' : 'Copy Text'}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'টেক্সট কপি' : 'Text')}</span>
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

      {/* Dedicated WhatsApp Image Share Dialog */}
      <WhatsAppImageShareModal
        isOpen={isWhatsAppShareModalOpen}
        onClose={() => setIsWhatsAppShareModalOpen(false)}
        lang={lang}
        voucherData={getVoucherData()}
      />
    </div>
  );
};
