import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Edit3,
  X,
  Landmark,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { LoanRecord, Transaction } from '../../types/finance';

interface EditRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  repaymentTx: Transaction | null;
  loan: LoanRecord | null;
  onSuccess?: () => void;
}

export const EditRepaymentModal: React.FC<EditRepaymentModalProps> = ({
  isOpen,
  onClose,
  repaymentTx,
  loan,
  onSuccess,
}) => {
  const { data, lang, t, getBankBalance, getLoanBalance, updateLoanRepayment } = useFinance();

  const [fromBankId, setFromBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && repaymentTx) {
      setFromBankId(repaymentTx.fromBankId || (data.banks[0]?.id ?? ''));
      setAmount(String(repaymentTx.amount || ''));
      setDate(repaymentTx.date || new Date().toISOString().split('T')[0]);
      setInvoiceNo(repaymentTx.voucherNo || '');
      setNote(repaymentTx.note || '');
      setErrorMsg('');
    }
  }, [isOpen, repaymentTx, data.banks]);

  if (!isOpen || !repaymentTx || !loan) return null;

  const selectedBank = data.banks.find((b) => b.id === fromBankId);
  const currentBankBal = selectedBank ? getBankBalance(selectedBank.id) : 0;
  const loanBal = getLoanBalance(loan.id);
  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBankId) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন' : 'Please select bank account');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg(lang === 'bn' ? 'সঠিক পরিশোধের পরিমাণ লিখুন' : 'Please enter valid amount');
      return;
    }

    updateLoanRepayment(repaymentTx.id, {
      fromBankId,
      amount: parsedAmount,
      date,
      invoiceNo: invoiceNo.trim() || undefined,
      note: note.trim() || undefined,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-2xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                {lang === 'bn' ? 'লোন পরিশোধ তথ্য ও ইনভয়েস সংশোধন (Edit)' : 'Edit Loan Repayment Invoice'}
              </h3>
              <p className="text-[11px] text-amber-800">
                {loan.name} · {repaymentTx.voucherNo || 'Voucher'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Source Bank Selection */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'bn' ? 'টাকা পরিশোধের ব্যাংক অ্যাকাউন্ট পরিবর্তন / নির্বাচন *' : 'Repayment Source Bank Account *'}</span>
            </label>
            <select
              value={fromBankId}
              onChange={(e) => setFromBankId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
            >
              {data.banks.map((b) => {
                const bal = getBankBalance(b.id);
                return (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.accountNumber}) — বর্তমান ব্যালেন্স: {bal.toLocaleString('en-US')} ৳
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'bn'
                ? 'ব্যাংক পরিবর্তন বা টাকা সংশোধন করলে পূর্বের ও নতুন উভয় ব্যাংকের ব্যালেন্স স্বয়ংক্রিয়ভাবে সমন্বয় হবে।'
                : 'Editing will automatically re-balance the source bank account.'}
            </p>
          </div>

          {/* 2. Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {lang === 'bn' ? 'সংশোধিত পরিশোধের পরিমাণ (BDT ৳) *' : 'Corrected Amount (BDT) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 font-bold text-slate-400">৳</span>
              </div>
              {repaymentTx.amount !== parsedAmount && (
                <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                  পূর্বের পরিমাণ: {repaymentTx.amount.toLocaleString('en-US')} ৳
                </span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{lang === 'bn' ? 'পরিশোধের তারিখ *' : 'Payment Date *'}</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* 3. Invoice Number */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-indigo-600" />
              <span>{lang === 'bn' ? 'ইনভয়েস / ভাউচার নম্বর' : 'Invoice / Voucher Number'}</span>
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 4. Note */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {lang === 'bn' ? 'নোট বা মন্তব্য' : 'Note / Reference'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সংশোধন সংরক্ষণ করুন' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
