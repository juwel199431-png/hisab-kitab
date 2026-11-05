import React, { useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Printer,
  Edit2,
  CheckCircle2,
  Landmark,
  CreditCard,
  Calendar,
  Receipt,
  Building,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoanRecord, Transaction } from '../../types/finance';

interface LoanInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  repaymentTx: Transaction | null;
  loan: LoanRecord | null;
  onEdit: (tx: Transaction) => void;
}

export const LoanInvoiceModal: React.FC<LoanInvoiceModalProps> = ({
  isOpen,
  onClose,
  repaymentTx,
  loan,
  onEdit,
}) => {
  const { data, lang, getBankBalance, getLoanBalance } = useFinance();
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !repaymentTx || !loan) return null;

  const sourceBank = data.banks.find((b) => b.id === repaymentTx.fromBankId);
  const loanBal = getLoanBalance(loan.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden my-6">
        {/* Action Header / Top bar (Hidden on Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {lang === 'bn' ? 'অফিসিয়াল লোন পরিশোধ ভাউচার' : 'Official Loan Repayment Invoice'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(repaymentTx)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-lg transition-colors cursor-pointer"
              title={lang === 'bn' ? 'তথ্য সংশোধন করুন' : 'Edit Repayment'}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ভাউচার এডিট' : 'Edit Voucher'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white">
          {/* Invoice Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  ৳
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {lang === 'bn' ? 'স্মার্ট ফাইন্যান্স ট্র্যাকার' : 'Smart Finance Tracker'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'bn' ? 'লোন ও ব্যাংক লেনদেন ব্যবস্থাপনা রশিদ' : 'Loan & Bank Transaction Voucher'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'পরিশোধিত / PAID' : 'PAID INVOICE'}
              </span>
              <p className="font-mono text-xs font-bold text-slate-700">
                ভাউচার নং: <span className="text-indigo-700">{repaymentTx.voucherNo || 'N/A'}</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">
                তারিখ: {formatDate(repaymentTx.date)}
              </p>
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Source Bank Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'পরিশোধের ব্যাংক অ্যাকাউন্ট (Source)' : 'Payment Source Bank'}</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {sourceBank ? sourceBank.name : 'Unknown Bank'}
                </p>
                <p className="text-xs text-slate-600 font-mono">
                  হিসাব নম্বর: {sourceBank ? sourceBank.accountNumber : '—'}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  ✓ এই ব্যাংক অ্যাকাউন্ট থেকে অর্থ বিয়োগ করা হয়েছে
                </p>
              </div>
            </div>

            {/* Right: Loan Account Info */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-rose-600" />
                <span>{lang === 'bn' ? 'লোন অ্যাকাউন্ট বিবরণ (Target Loan)' : 'Target Loan Details'}</span>
              </div>
              <div>
                <p className="font-bold text-rose-950 text-sm">{loan.name}</p>
                <p className="text-xs text-rose-800">
                  ঋণদাতা প্রতিষ্ঠান: <span className="font-semibold">{loan.lender}</span>
                </p>
                <p className="text-xs text-rose-700 font-mono">
                  মূল লোন পরিমাণ: {formatCurrency(loan.totalAmount, 'BDT')}
                </p>
              </div>
            </div>
          </div>

          {/* Repayment Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 uppercase tracking-wider">
              {lang === 'bn' ? 'পরিশোধ ও আর্থিক সমন্বয় হিসাব' : 'Payment & Ledger Breakdown'}
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">{lang === 'bn' ? 'বিবরণ' : 'Description'}</th>
                  <th className="px-4 py-2.5 text-right">{lang === 'bn' ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">
                      {lang === 'bn' ? 'লোন কিস্তি পরিশোধ (Loan Repayment)' : 'Loan Installment Payment'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      উৎস: {sourceBank?.name || 'Bank'} ➔ গন্তব্য: {loan.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-base text-rose-600">
                    {formatCurrency(repaymentTx.amount, 'BDT')}
                  </td>
                </tr>

                {repaymentTx.note && (
                  <tr className="bg-slate-50/50">
                    <td className="px-4 py-2.5 text-slate-600 text-[11px]" colSpan={2}>
                      <span className="font-semibold">{lang === 'bn' ? 'মন্তব্য/নোট: ' : 'Note: '}</span>
                      {repaymentTx.note}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Current Status Highlights */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] text-emerald-800 font-medium block">
                  {lang === 'bn' ? 'মোট লোন মূলধন' : 'Total Loan Principal'}
                </span>
                <span className="text-sm font-bold font-mono text-emerald-950">
                  {formatCurrency(loan.totalAmount, 'BDT')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 font-medium block">
                  {lang === 'bn' ? 'আজ পর্যন্ত মোট পরিশোধ' : 'Total Repaid Till Date'}
                </span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {formatCurrency(loanBal.totalPaid, 'BDT')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-rose-800 font-medium block">
                  {lang === 'bn' ? 'বর্তমান অবশিষ্ট ঋণ' : 'Current Remaining Debt'}
                </span>
                <span className="text-sm font-bold font-mono text-rose-700">
                  {formatCurrency(loanBal.remaining, 'BDT')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note & Authorized stamp */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'সরাসরি ব্যাংক অ্যাকাউন্ট থেকে সমন্বয়কৃত ও সুরক্ষিত লেনদেন' : 'Directly synchronized with Bank Account'}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                মুদ্রণের সময়: {new Date().toLocaleString('en-US')}
              </p>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
              <div className="inline-block border-b border-slate-400 pb-1 px-4 mb-1">
                <span className="font-serif italic font-semibold text-slate-700">Verified System Ledger</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                {lang === 'bn' ? 'অনুমোদিত ভাউচার' : 'Authorized Voucher'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'কোনো ভুল হলে "ভাউচার এডিট" বাটনে ক্লিক করে সংশোধন করতে পারবেন।' : 'Click "Edit Voucher" to correct any mistakes.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
