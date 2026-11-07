import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  CreditCard,
  X,
  Landmark,
  Calendar,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoanRecord, Transaction } from '../../types/finance';

interface LoanRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLoan: LoanRecord | null;
  onPaymentSuccess: (tx: Transaction, previousRemaining: number, newRemaining: number) => void;
}

export const LoanRepaymentModal: React.FC<LoanRepaymentModalProps> = ({
  isOpen,
  onClose,
  selectedLoan,
  onPaymentSuccess,
}) => {
  const { data, lang, t, getBankBalance, getLoanBalance, addLoanRepayment, getNextVoucherNo } = useFinance();

  const [fromBankId, setFromBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // When modal opens or selected loan changes
  useEffect(() => {
    if (isOpen && selectedLoan) {
      // Default to first bank
      if (data.banks.length > 0 && !fromBankId) {
        setFromBankId(data.banks[0].id);
      }
      // Auto-populate default installment amount
      setAmount(String(selectedLoan.installmentAmount || ''));
      setDate(new Date().toISOString().split('T')[0]);
      // Auto-generate invoice/voucher serial number
      setInvoiceNo(getNextVoucherNo());
      setNote(`${selectedLoan.name} কিস্তি পরিশোধ`);
      setErrorMsg('');
    }
  }, [isOpen, selectedLoan, data.banks]);

  if (!isOpen || !selectedLoan) return null;

  const selectedBank = data.banks.find((b) => b.id === fromBankId);
  const currentBankBal = selectedBank ? getBankBalance(selectedBank.id) : 0;
  const loanBal = getLoanBalance(selectedLoan.id);
  const parsedAmount = parseFloat(amount) || 0;

  const afterBankBal = currentBankBal - parsedAmount;
  const afterLoanRemaining = Math.max(0, loanBal.remaining - parsedAmount);

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
    if (parsedAmount > currentBankBal) {
      if (
        !confirm(
          lang === 'bn'
            ? `সতর্কতা: নির্বাচিত ব্যাংকে পর্যাপ্ত ব্যালেন্স নেই (বর্তমান: ${currentBankBal.toLocaleString('en-US')} ৳)। তবুও কি পরিশোধ করতে চান?`
            : 'Warning: Bank balance is less than repayment amount. Do you still want to proceed?'
        )
      ) {
        return;
      }
    }

    const previousRemaining = loanBal.remaining;
    const newRemaining = Math.max(0, loanBal.remaining - parsedAmount);

    const newTx = addLoanRepayment({
      loanId: selectedLoan.id,
      fromBankId,
      amount: parsedAmount,
      date,
      invoiceNo: invoiceNo.trim() || undefined,
      note: note.trim() || undefined,
    });

    onPaymentSuccess(newTx, previousRemaining, newRemaining);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                {lang === 'bn' ? 'ব্যাংক লোন কিস্তি পরিশোধ ও ইনভয়েস ভাউচার' : 'Pay Loan Installment & Generate Invoice'}
              </h3>
              <p className="text-[11px] text-rose-700">
                {selectedLoan.name} · {selectedLoan.lender}
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

          {/* 1. Source Bank Selection (৩টি মূল ব্যাংক অ্যাকাউন্ট) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'bn' ? 'কোন ব্যাংক অ্যাকাউন্ট থেকে টাকা পরিশোধ করবেন? *' : 'Pay From Bank Account *'}</span>
            </label>
            <select
              value={fromBankId}
              onChange={(e) => setFromBankId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
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
                ? 'টাকা পরিশোধের সাথে সাথে এই ব্যাংকের ব্যালেন্স থেকে সমপরিমাণ টাকা স্বয়ংক্রিয়ভাবে বিয়োগ হবে।'
                : 'Money will be automatically deducted from this selected bank balance.'}
            </p>
          </div>

          {/* 2. Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {lang === 'bn' ? 'পরিশোধের পরিমাণ (BDT ৳) *' : 'Repayment Amount (BDT) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন: 8500"
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 font-bold text-slate-400">৳</span>
              </div>
              {selectedLoan.installmentAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(selectedLoan.installmentAmount))}
                  className="text-[10px] text-rose-700 hover:underline mt-1 font-semibold"
                >
                  {lang === 'bn'
                    ? `নির্ধারিত কিস্তি বসান (${selectedLoan.installmentAmount.toLocaleString('en-US')} ৳)`
                    : `Use standard installment (${selectedLoan.installmentAmount.toLocaleString('en-US')} ৳)`}
                </button>
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* 3. Invoice Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-indigo-600" />
                <span>{lang === 'bn' ? 'ইনভয়েস / ভাউচার নম্বর' : 'Invoice / Voucher Number'}</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ⚡ {lang === 'bn' ? 'অটো জেনারেটেড' : 'Auto Generated'}
              </span>
            </div>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="e.g. 1001"
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* 4. Note */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {lang === 'bn' ? 'নোট বা মন্তব্য (ঐচ্ছিক)' : 'Note / Reference (Optional)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'bn' ? 'নভেম্বর মাসের কিস্তি পরিশোধ' : 'Monthly installment note'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 5. Live Impact Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              {lang === 'bn' ? 'ব্যালেন্স সমন্বয় পূর্বরূপ (Live Preview):' : 'Live Impact Preview:'}
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Bank Deduction Preview */}
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium">
                  {selectedBank ? selectedBank.name : 'Bank'}
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-600">{currentBankBal.toLocaleString('en-US')} ৳</span>
                  <ArrowRight className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className={`font-bold ${afterBankBal >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {afterBankBal.toLocaleString('en-US')} ৳
                  </span>
                </div>
                <span className="text-[10px] text-rose-600 font-semibold block">
                  -{parsedAmount.toLocaleString('en-US')} ৳ বিয়োগ হবে
                </span>
              </div>

              {/* Loan Remaining Preview */}
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium">
                  {selectedLoan.name} (বকেয়া)
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-600">{loanBal.remaining.toLocaleString('en-US')} ৳</span>
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-800">
                    {afterLoanRemaining.toLocaleString('en-US')} ৳
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  -{parsedAmount.toLocaleString('en-US')} ৳ ঋণ কমবে
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'bn' ? 'পরিশোধ নিশ্চিত ও ইনভয়েস তৈরি করুন' : 'Confirm & Generate Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
