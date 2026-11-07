import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  PiggyBank,
  ShieldCheck,
  ArrowRightLeft,
  Plus,
  Landmark,
  CreditCard,
  Edit2,
  Check,
  X,
  FileText,
  Calendar,
  TrendingUp,
  Trash2,
  CheckCircle2,
  Receipt,
  Eye,
  Printer,
} from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { DpsInsuranceAccount, LoanRecord, Transaction } from '../../types/finance';
import { LoanRepaymentModal } from './LoanRepaymentModal';
import { LoanInvoiceModal } from './LoanInvoiceModal';
import { EditRepaymentModal } from './EditRepaymentModal';

export const SavingsPortfolioView: React.FC = () => {
  const {
    data,
    lang,
    t,
    getNextVoucherNo,
    getSavingsBalance,
    getTotalDpsSavings,
    getTotalInsuranceSavings,
    getTotalBdBanksBalance,
    getBankBalance,
    getLoanBalance,
    getLoanRepayments,
    deleteLoanRepayment,
    addSavingsAccount,
    updateSavingsAccount,
    addLoan,
    updateLoan,
    deleteLoan,
    openQuickAddWithSection,
    paySavingsInstallmentFromBank,
  } = useFinance();

  // Quick Installment from Bank Modal
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [instSavingsId, setInstSavingsId] = useState('');
  const [instBankId, setInstBankId] = useState('');
  const [instAmount, setInstAmount] = useState('');
  const [instDate, setInstDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [instVoucher, setInstVoucher] = useState('');
  const [instNote, setInstNote] = useState('');

  // Add account modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'dps' | 'insurance'>('dps');
  const [newName, setNewName] = useState('');
  const [newInst, setNewInst] = useState('');
  const [newAccNo, setNewAccNo] = useState('');
  const [newOpeningBal, setNewOpeningBal] = useState('');
  const [newMonthlyAmt, setNewMonthlyAmt] = useState('');
  const [newTotalInstallments, setNewTotalInstallments] = useState('60');
  const [newMaturity, setNewMaturity] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit account state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInst, setEditInst] = useState('');
  const [editAccNo, setEditAccNo] = useState('');
  const [editOpeningBal, setEditOpeningBal] = useState('');
  const [editMonthlyAmt, setEditMonthlyAmt] = useState('');
  const [editTotalInstallments, setEditTotalInstallments] = useState('');
  const [editMaturity, setEditMaturity] = useState('');

  // Loan state
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editLoanName, setEditLoanName] = useState('');
  const [editLoanLender, setEditLoanLender] = useState('');
  const [editLoanTotal, setEditLoanTotal] = useState('');
  const [editLoanPaid, setEditLoanPaid] = useState('');
  const [editLoanInstallment, setEditLoanInstallment] = useState('');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanLender, setNewLoanLender] = useState('');
  const [newLoanTotal, setNewLoanTotal] = useState('');
  const [newLoanInstallment, setNewLoanInstallment] = useState('');
  const [newLoanPaid, setNewLoanPaid] = useState('');
  const [newLoanNote, setNewLoanNote] = useState('');

  // Loan Repayment & Invoice States
  const [selectedRepayLoan, setSelectedRepayLoan] = useState<LoanRecord | null>(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedInvoiceTx, setSelectedInvoiceTx] = useState<Transaction | null>(null);
  const [selectedInvoiceLoan, setSelectedInvoiceLoan] = useState<LoanRecord | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedEditTx, setSelectedEditTx] = useState<Transaction | null>(null);
  const [selectedEditLoan, setSelectedEditLoan] = useState<LoanRecord | null>(null);
  const [showEditRepayModal, setShowEditRepayModal] = useState(false);

  const totalDps = useMemo(() => getTotalDpsSavings(), [data.savingsAccounts, data.transactions]);
  const totalInsurance = useMemo(() => getTotalInsuranceSavings(), [data.savingsAccounts, data.transactions]);
  const totalBanks = useMemo(() => getTotalBdBanksBalance(), [data.banks, data.transactions]);
  const grandTotal = totalBanks + totalDps + totalInsurance;

  // Loan Repayments Transactions
  const loanRepayments = useMemo(() => {
    return data.transactions
      .filter((tx) => tx.type === 'transfer' && tx.transferTargetType === 'loan')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions]);

  const totalDpsInstallments = useMemo(() => {
    return data.savingsAccounts
      .filter((s) => s.type === 'dps' && s.monthlyAmount > 0)
      .reduce((sum, dps) => sum + Math.floor(getSavingsBalance(dps.id) / dps.monthlyAmount), 0);
  }, [data.savingsAccounts, data.transactions]);

  const totalDpsTargetInstallments = useMemo(() => {
    return data.savingsAccounts
      .filter((s) => s.type === 'dps')
      .reduce((sum, dps) => sum + (dps.totalInstallments || 60), 0);
  }, [data.savingsAccounts]);

  const totalInsuranceInstallments = useMemo(() => {
    return data.savingsAccounts
      .filter((s) => s.type === 'insurance' && s.monthlyAmount > 0)
      .reduce((sum, ins) => sum + Math.floor(getSavingsBalance(ins.id) / ins.monthlyAmount), 0);
  }, [data.savingsAccounts, data.transactions]);

  const totalInsuranceTargetInstallments = useMemo(() => {
    return data.savingsAccounts
      .filter((s) => s.type === 'insurance')
      .reduce((sum, ins) => sum + (ins.totalInstallments || 144), 0);
  }, [data.savingsAccounts]);

  // Filter savings deposit transactions
  const savingsTransactions = useMemo(() => {
    return data.transactions.filter(
      (tx) => tx.type === 'transfer' && (tx.transferTargetType === 'dps' || tx.transferTargetType === 'insurance')
    );
  }, [data.transactions]);

  // Handle Add Savings Account
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addSavingsAccount({
      type: newType,
      name: newName.trim(),
      institution: newInst.trim() || 'Bank',
      accountNumber: newAccNo.trim() || 'N/A',
      openingBalance: parseFloat(newOpeningBal) || 0,
      monthlyAmount: parseFloat(newMonthlyAmt) || 0,
      totalInstallments: parseInt(newTotalInstallments) || (newType === 'dps' ? 60 : 144),
      maturityDate: newMaturity || undefined,
      notes: newNotes.trim() || undefined,
    });

    setNewName('');
    setNewInst('');
    setNewAccNo('');
    setNewOpeningBal('');
    setNewMonthlyAmt('');
    setNewTotalInstallments('60');
    setNewMaturity('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const startEdit = (acc: DpsInsuranceAccount) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditInst(acc.institution);
    setEditAccNo(acc.accountNumber);
    setEditOpeningBal(String(acc.openingBalance));
    setEditMonthlyAmt(String(acc.monthlyAmount));
    setEditTotalInstallments(String(acc.totalInstallments || (acc.type === 'dps' ? 60 : 144)));
    setEditMaturity(acc.maturityDate || '');
  };

  const saveEdit = (id: string) => {
    const acc = data.savingsAccounts.find((s) => s.id === id);
    updateSavingsAccount(id, {
      name: editName.trim() || acc?.name,
      institution: editInst.trim() || acc?.institution,
      accountNumber: editAccNo.trim() || acc?.accountNumber,
      openingBalance: parseFloat(editOpeningBal) || 0,
      monthlyAmount: parseFloat(editMonthlyAmt) || 0,
      totalInstallments: parseInt(editTotalInstallments) || (acc?.type === 'dps' ? 60 : 144),
      maturityDate: editMaturity.trim() || undefined,
    });
    setEditingId(null);
  };

  const startEditLoan = (loan: LoanRecord) => {
    setEditingLoanId(loan.id);
    setEditLoanName(loan.name);
    setEditLoanLender(loan.lender);
    setEditLoanTotal(String(loan.totalAmount));
    setEditLoanPaid(String(loan.paidAmount));
    setEditLoanInstallment(String(loan.installmentAmount));
  };

  const saveEditLoan = (id: string) => {
    updateLoan(id, {
      name: editLoanName.trim(),
      lender: editLoanLender.trim(),
      totalAmount: parseFloat(editLoanTotal) || 0,
      paidAmount: parseFloat(editLoanPaid) || 0,
      installmentAmount: parseFloat(editLoanInstallment) || 0,
    });
    setEditingLoanId(null);
  };

  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanName.trim()) return;
    addLoan({
      name: newLoanName.trim(),
      lender: newLoanLender.trim() || 'Bank',
      totalAmount: parseFloat(newLoanTotal) || 0,
      installmentAmount: parseFloat(newLoanInstallment) || 0,
      paidAmount: parseFloat(newLoanPaid) || 0,
      startDate: new Date().toISOString().split('T')[0],
      note: newLoanNote.trim() || undefined,
    });
    setNewLoanName('');
    setNewLoanLender('');
    setNewLoanTotal('');
    setNewLoanInstallment('');
    setNewLoanPaid('');
    setNewLoanNote('');
    setShowAddLoanModal(false);
  };

  const handleOpenQuickInstallment = (account?: DpsInsuranceAccount) => {
    const targetAcc = account || data.savingsAccounts[0];
    if (!targetAcc) {
      alert(lang === 'bn' ? 'কোনো ডিপিএস বা ইন্সুরেন্স অ্যাকাউন্ট নেই!' : 'No savings account available!');
      return;
    }
    if (data.banks.length === 0) {
      alert(lang === 'bn' ? 'কিস্তি পরিশোধের জন্য কোনো ব্যাংক অ্যাকাউন্ট যোগ করা নেই!' : 'No bank accounts available!');
      return;
    }
    setInstSavingsId(targetAcc.id);
    setInstBankId(data.banks[0]?.id || '');
    setInstAmount(String(targetAcc.monthlyAmount || ''));
    setInstDate(new Date().toISOString().split('T')[0]);
    setInstVoucher(getNextVoucherNo());
    setInstNote(lang === 'bn' ? `${targetAcc.name} কিস্তি পরিশোধ` : `Monthly installment for ${targetAcc.name}`);
    setIsInstallmentModalOpen(true);
  };

  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(instAmount);
    if (isNaN(parsed) || parsed <= 0) {
      alert(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter valid amount');
      return;
    }
    if (!instSavingsId || !instBankId) {
      alert(lang === 'bn' ? 'ব্যাংক এবং সঞ্চয় অ্যাকাউন্ট নির্বাচন করুন' : 'Select both bank and savings accounts');
      return;
    }
    const bankBal = getBankBalance(instBankId);
    if (bankBal < parsed) {
      const cont = confirm(
        lang === 'bn'
          ? `সতর্কতা: নির্বাচিত ব্যাংকে বর্তমান ব্যালেন্স ৳${bankBal.toLocaleString('bn-BD')}, যা কিস্তির পরিমাণ ৳${parsed.toLocaleString('bn-BD')} এর চেয়ে কম। চালিয়ে যেতে চান?`
          : `Warning: Selected bank has balance ৳${bankBal.toLocaleString()}, less than installment amount. Proceed?`
      );
      if (!cont) return;
    }

    paySavingsInstallmentFromBank({
      savingsId: instSavingsId,
      bankId: instBankId,
      amount: parsed,
      date: instDate,
      voucherNo: instVoucher.trim() || undefined,
      note: instNote.trim() || undefined,
    });

    setIsInstallmentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Official Print Statement Header */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
              {lang === 'bn' ? 'ডিপিএস, ইন্সুরেন্স ও ব্যাংক লোন পোর্টফোলিও বিবরণী' : 'Savings & Loans Portfolio Statement'}
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              {lang === 'bn' ? 'সঞ্চিত তহবিল ও লোন পরিশোধের সার্বিক অডিট রিপোর্ট' : 'Official Portfolio Audit & Statement'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">মুদ্রা: BDT (বাংলাদেশি টাকা ৳)</p>
            <p className="font-mono">তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>

      {/* Top Banner & Grand Net Worth */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {lang === 'bn' ? 'ডিপিএস ও ইন্সুরেন্স সঞ্চয় পোর্টফোলিও' : 'DPS & Insurance Savings Portfolio'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'ব্যাংক থেকে প্রতি মাসে ট্রান্সফারকৃত ডিপিএস ও ইন্সুরেন্সের সঞ্চিত টাকার নিখুঁত হিসাব'
                : 'Tracks accumulated savings transferred from banks into multiple DPS and Insurance schemes'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title={lang === 'bn' ? 'পোর্টফোলিও স্টেটমেন্ট প্রিন্ট বা PDF তৈরি করুন' : 'Print or Save PDF Statement'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF স্টেটমেন্ট' : 'Print / PDF'}</span>
            </button>

            <button
              onClick={() => handleOpenQuickInstallment()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={lang === 'bn' ? 'ব্যাংক ব্যালেন্স থেকে ডিপিএস বা ইন্সুরেন্স কিস্তি জমা দিন' : 'Pay Installment from BD Bank'}
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'bn' ? 'ব্যাংক থেকে কিস্তি দিন' : 'Pay Installment'}</span>
            </button>

            <button
              onClick={() => openQuickAddWithSection('savings-portfolio')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ব্যাংক থেকে সঞ্চয়ে ট্রান্সফার' : 'Transfer to Savings'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? '+ নতুন ডিপিএস / ইন্সুরেন্স' : '+ New DPS / Insurance'}</span>
            </button>
          </div>
        </div>

        {/* Global Asset Statistics with Advanced Colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="bg-linear-to-br from-indigo-50 via-purple-50/70 to-indigo-100/50 rounded-xl p-4 border border-indigo-200 shadow-2xs hover:shadow-xs transition-shadow">
            <p className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'bn' ? 'মোট ডিপিএস সঞ্চয়' : 'Total DPS Savings'}</span>
              </span>
              <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded font-mono font-bold">DPS</span>
            </p>
            <p className="text-2xl font-black text-indigo-950 font-mono tabular-nums mt-1.5">
              {formatCurrency(totalDps, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-indigo-700 mt-1 font-medium">
              {data.savingsAccounts.filter((s) => s.type === 'dps').length} {lang === 'bn' ? 'টি একাউন্ট' : 'accounts'} · {lang === 'bn' ? 'কিস্তি:' : 'Paid:'} {formatNumber(totalDpsInstallments, lang)}/{formatNumber(totalDpsTargetInstallments, lang)}
            </p>
          </div>

          <div className="bg-linear-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 rounded-xl p-4 border border-emerald-200 shadow-2xs hover:shadow-xs transition-shadow">
            <p className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'bn' ? 'মোট ইন্সুরেন্স জমা' : 'Total Insurance'}</span>
              </span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">INS</span>
            </p>
            <p className="text-2xl font-black text-emerald-950 font-mono tabular-nums mt-1.5">
              {formatCurrency(totalInsurance, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">
              {data.savingsAccounts.filter((s) => s.type === 'insurance').length} {lang === 'bn' ? 'টি পলিসি' : 'policies'} · {lang === 'bn' ? 'কিস্তি:' : 'Paid:'} {formatNumber(totalInsuranceInstallments, lang)}/{formatNumber(totalInsuranceTargetInstallments, lang)}
            </p>
          </div>

          <div className="bg-linear-to-br from-cyan-50 via-blue-50/70 to-cyan-100/50 rounded-xl p-4 border border-cyan-200 shadow-2xs hover:shadow-xs transition-shadow">
            <p className="text-[11px] font-bold text-cyan-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-cyan-700" />
                <span>{lang === 'bn' ? '৩টি ব্যাংক ব্যালেন্স' : 'Liquid Bank Balance'}</span>
              </span>
              <span className="text-[10px] bg-cyan-200/80 text-cyan-900 px-1.5 py-0.2 rounded font-mono font-bold">BANKS</span>
            </p>
            <p className="text-2xl font-black text-cyan-950 font-mono tabular-nums mt-1.5">
              {formatCurrency(totalBanks, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-cyan-700 mt-1 font-medium">
              {lang === 'bn' ? 'চলতি ব্যাংক অ্যাকাউন্টে জমা' : 'Available in banks'}
            </p>
          </div>

          <div className="bg-linear-to-br from-amber-50 via-orange-50/70 to-yellow-100/50 rounded-xl p-4 border border-amber-200 shadow-2xs hover:shadow-xs transition-shadow">
            <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'bn' ? 'সর্বমোট সম্পদ (Net Savings)' : 'Total Net Savings'}</span>
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-mono font-bold">TOTAL</span>
            </p>
            <p className="text-2xl font-black text-amber-950 font-mono tabular-nums mt-1.5">
              {formatCurrency(grandTotal, 'BDT', lang)}
            </p>
            <p className="text-[11px] text-amber-800 mt-1 font-medium">
              {lang === 'bn' ? 'ব্যাংক + ডিপিএস + ইন্সুরেন্স' : 'Banks + DPS + Insurance'}
            </p>
          </div>
        </div>
      </div>

      {/* DPS Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-blue-600" />
            <span>{lang === 'bn' ? 'ব্যাংক ডিপিএস হিসাবসমূহ (Bank DPS Schemes)' : 'Bank DPS Accounts'}</span>
          </h3>
          <span className="text-xs text-slate-500">
            {lang === 'bn' ? 'প্রতি মাসের কিস্তি ব্যাংক থেকে ডেবিট হয়' : 'Monthly savings transfers'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.savingsAccounts
            .filter((s) => s.type === 'dps')
            .map((dps) => {
              const currentTotal = getSavingsBalance(dps.id);
              const isEditing = editingId === dps.id;
              const transfersIn = currentTotal - dps.openingBalance;
              const totalInstallments = dps.totalInstallments || 60;
              const monthlyAmt = dps.monthlyAmount || 5000;
              const paidInstallments = monthlyAmt > 0 ? Math.floor(currentTotal / monthlyAmt) : 0;
              const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
              const totalTargetAmount = totalInstallments * monthlyAmt;
              const remainingTargetAmount = remainingInstallments * monthlyAmt;
              const progressPct = totalInstallments > 0 ? Math.min(100, Math.round((paidInstallments / totalInstallments) * 100)) : 0;
              const installmentRemainder = monthlyAmt > 0 ? currentTotal % monthlyAmt : 0;

              return (
                <div
                  key={dps.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                      <div className="flex-1 mr-2">
                        {isEditing ? (
                          <div className="space-y-1 mb-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="text-xs font-bold border rounded px-1.5 py-0.5 w-full"
                              placeholder="ডিপিএস এর নাম"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editInst}
                                onChange={(e) => setEditInst(e.target.value)}
                                className="text-[11px] border rounded px-1.5 py-0.5 flex-1"
                                placeholder="ব্যাংক / প্রতিষ্ঠান"
                              />
                              <input
                                type="text"
                                value={editAccNo}
                                onChange={(e) => setEditAccNo(e.target.value)}
                                className="text-[11px] border rounded px-1.5 py-0.5 flex-1 font-mono"
                                placeholder="অ্যাকাউন্ট নং"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{dps.name}</h4>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200/80">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                <span>{formatNumber(paidInstallments, lang)}/{formatNumber(totalInstallments, lang)} {lang === 'bn' ? 'কিস্তি' : 'Inst.'}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {dps.institution} · <span className="font-mono">{dps.accountNumber}</span>
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(dps.id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(dps)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3-Pill Installment Breakdown: টোটাল কয়টা জমা করতে হবে, কয়টা করছি, কয়টা বাকি */}
                    <div className="grid grid-cols-3 gap-2 my-2.5 p-2 bg-blue-50/70 border border-blue-200/80 rounded-lg">
                      <div className="text-center p-1.5 bg-white rounded-md border border-blue-100 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {lang === 'bn' ? 'মোট কিস্তি' : 'Total'}
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-800 block">
                          {formatNumber(totalInstallments, lang)} {lang === 'bn' ? 'টি' : ''}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {lang === 'bn' ? 'টার্গেট' : 'Target'}
                        </span>
                      </div>

                      <div className="text-center p-1.5 bg-white rounded-md border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-800 block">
                          {lang === 'bn' ? 'জমা করেছি' : 'Paid'}
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-700 block">
                          {formatNumber(paidInstallments, lang)} {lang === 'bn' ? 'টি' : ''}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">
                          {progressPct}% {lang === 'bn' ? 'সম্পন্ন' : 'done'}
                        </span>
                      </div>

                      <div className="text-center p-1.5 bg-white rounded-md border border-amber-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-amber-900 block">
                          {lang === 'bn' ? 'আরো বাকি' : 'Remaining'}
                        </span>
                        <span className="text-sm font-bold font-mono text-amber-700 block">
                          {formatNumber(remainingInstallments, lang)} {lang === 'bn' ? 'টি' : ''}
                        </span>
                        <span className="text-[9px] text-amber-600 block">
                          {lang === 'bn' ? 'বাকি কিস্তি' : 'left'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>
                          {lang === 'bn' ? 'কিস্তি পরিশোধের অগ্রগতি:' : 'Installment Progress:'}{' '}
                          <strong className="text-blue-900 font-mono">{formatNumber(paidInstallments, lang)} / {formatNumber(totalInstallments, lang)}</strong>
                        </span>
                        <span className="font-mono font-bold text-blue-700">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                        />
                      </div>
                    </div>

                    <div className="py-1 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{lang === 'bn' ? 'ওপেনিং ব্যালেন্স:' : 'Opening Balance:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editOpeningBal}
                            onChange={(e) => setEditOpeningBal(e.target.value)}
                            className="w-24 border rounded text-right px-1 font-mono"
                          />
                        ) : (
                          <span className="font-mono tabular-nums text-slate-700">
                            {formatCurrency(dps.openingBalance, 'BDT', lang)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">{lang === 'bn' ? 'মাসিক কিস্তির লক্ষ্যমাত্রা:' : 'Monthly Target:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editMonthlyAmt}
                            onChange={(e) => setEditMonthlyAmt(e.target.value)}
                            className="w-24 border rounded text-right px-1 font-mono"
                          />
                        ) : (
                          <span className="font-mono tabular-nums font-semibold text-slate-800">
                            {formatCurrency(dps.monthlyAmount, 'BDT', lang)} / মাস
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-blue-700">{lang === 'bn' ? 'ব্যাংক থেকে জমা হয়েছে:' : 'Transfers from Banks:'}</span>
                        <span className="font-mono tabular-nums font-bold text-blue-700">
                          {transfersIn > 0 ? `+${formatCurrency(transfersIn, 'BDT', lang)}` : formatCurrency(0, 'BDT', lang)}
                        </span>
                      </div>

                      {isEditing && (
                        <div className="flex justify-between items-center bg-blue-50/50 p-1 rounded">
                          <span className="text-blue-900 font-semibold">{lang === 'bn' ? 'মোট কিস্তির সংখ্যা:' : 'Total Installments:'}</span>
                          <input
                            type="number"
                            value={editTotalInstallments}
                            onChange={(e) => setEditTotalInstallments(e.target.value)}
                            className="w-20 border rounded text-right px-1 font-mono text-xs"
                            placeholder="60"
                          />
                        </div>
                      )}

                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">
                          {lang === 'bn' ? `মোট সঞ্চয় লক্ষ্যমাত্রা (${formatNumber(totalInstallments, lang)} কিস্তি):` : `Total Target (${totalInstallments} inst):`}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          {formatCurrency(totalTargetAmount, 'BDT', lang)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">
                          {lang === 'bn' ? `অবশিষ্ট জমা লক্ষ্যমাত্রা (${formatNumber(remainingInstallments, lang)} কিস্তি):` : `Remaining Target (${remainingInstallments} inst):`}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-amber-800">
                          {formatCurrency(remainingTargetAmount, 'BDT', lang)}
                        </span>
                      </div>

                      {installmentRemainder > 0 && (
                        <div className="text-[11px] text-blue-600 font-medium">
                          {lang === 'bn' ? `অতিরিক্ত জমা: +${formatCurrency(installmentRemainder, 'BDT', lang)}` : `Extra balance: +${formatCurrency(installmentRemainder, 'BDT', lang)}`}
                        </div>
                      )}

                      {dps.notes && <p className="text-[11px] text-slate-400 pt-0.5 italic">{dps.notes}</p>}

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                        <span>{lang === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ:' : 'Maturity:'}</span>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editMaturity}
                            onChange={(e) => setEditMaturity(e.target.value)}
                            className="border rounded px-1.5 py-0.5 text-xs text-slate-700"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {dps.maturityDate ? formatDate(dps.maturityDate, lang) : (lang === 'bn' ? 'নির্ধারিত নেই' : 'N/A')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 bg-blue-50/60 p-2.5 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">
                        {lang === 'bn' ? 'ডিপিএসে মোট সঞ্চয় জমা:' : 'Total DPS Accumulated:'}
                      </span>
                      <span className="font-mono tabular-nums text-base font-bold text-blue-950">
                        {formatCurrency(currentTotal, 'BDT', lang)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-blue-200/60 text-blue-900">
                      <span className="font-medium text-blue-800">
                        {lang === 'bn' ? 'কিস্তি জমার অগ্রগতি:' : 'Installment Breakdown:'}
                      </span>
                      <span className="font-bold font-mono text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                        {formatNumber(paidInstallments, lang)} / {formatNumber(totalInstallments, lang)} {lang === 'bn' ? 'টি জমা' : 'paid'} · {formatNumber(remainingInstallments, lang)} {lang === 'bn' ? 'টি বাকি' : 'left'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickInstallment(dps)}
                      className="w-full mt-2 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ব্যাংক থেকে কিস্তি জমা দিন' : 'Pay Installment from Bank'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Insurance Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'bn' ? 'ইন্সুরেন্স হিসাব বিবরণী (Insurance Policies)' : 'Insurance Policies'}</span>
          </h3>
          <span className="text-xs text-slate-500">
            {lang === 'bn' ? 'জীবন বীমা ও সঞ্চয় স্কিম' : 'Life insurance & protection'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.savingsAccounts
            .filter((s) => s.type === 'insurance')
            .map((ins) => {
              const currentTotal = getSavingsBalance(ins.id);
              const isEditing = editingId === ins.id;
              const transfersIn = currentTotal - ins.openingBalance;
              const totalInstallments = ins.totalInstallments || 144;
              const monthlyAmt = ins.monthlyAmount || 10489;
              const paidInstallments = monthlyAmt > 0 ? Math.floor(currentTotal / monthlyAmt) : 0;
              const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
              const totalTargetAmount = totalInstallments * monthlyAmt;
              const remainingTargetAmount = remainingInstallments * monthlyAmt;
              const progressPct = totalInstallments > 0 ? Math.min(100, Math.round((paidInstallments / totalInstallments) * 100)) : 0;
              const installmentRemainder = monthlyAmt > 0 ? currentTotal % monthlyAmt : 0;

              return (
                <div
                  key={ins.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                      <div className="flex-1 mr-2">
                        {isEditing ? (
                          <div className="space-y-1 mb-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="text-xs font-bold border rounded px-1.5 py-0.5 w-full"
                              placeholder="বীমার নাম"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editInst}
                                onChange={(e) => setEditInst(e.target.value)}
                                className="text-[11px] border rounded px-1.5 py-0.5 flex-1"
                                placeholder="বীমা কোম্পানি"
                              />
                              <input
                                type="text"
                                value={editAccNo}
                                onChange={(e) => setEditAccNo(e.target.value)}
                                className="text-[11px] border rounded px-1.5 py-0.5 flex-1 font-mono"
                                placeholder="পলিসি নং"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{ins.name}</h4>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{formatNumber(paidInstallments, lang)}/{formatNumber(totalInstallments, lang)} {lang === 'bn' ? 'কিস্তি' : 'Inst.'}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {ins.institution} · পলিসি নং: <span className="font-mono">{ins.accountNumber}</span>
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(ins.id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(ins)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3-Pill Installment Breakdown: টোটাল কয়টা জমা করতে হবে, কয়টা করছি, কয়টা বাকি */}
                    <div className="grid grid-cols-3 gap-2 my-2.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg">
                      <div className="text-center p-1.5 bg-white rounded-md border border-emerald-100 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {lang === 'bn' ? 'মোট কিস্তি' : 'Total'}
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-800 block">
                          {formatNumber(totalInstallments, lang)} {lang === 'bn' ? 'টি' : ''}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {lang === 'bn' ? 'টার্গেট' : 'Target'}
                        </span>
                      </div>

                      <div className="text-center p-1.5 bg-white rounded-md border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-800 block">
                          {lang === 'bn' ? 'জমা করেছি' : 'Paid'}
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-700 block">
                          {formatNumber(paidInstallments, lang)} {lang === 'bn' ? 'টি' : ''}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">
                          {progressPct}% {lang === 'bn' ? 'সম্পন্ন' : 'done'}
                        </span>
                      </div>

                      <div className="text-center p-1.5 bg-white rounded-md border border-amber-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-amber-900 block">
                          {lang === 'bn' ? 'আরো বাকি' : 'Remaining'}
                        </span>
                        <span className="text-sm font-bold font-mono text-amber-700 block">
                          {formatNumber(remainingInstallments, lang)} {lang === 'bn' ? 'টি' : ''}
                        </span>
                        <span className="text-[9px] text-amber-600 block">
                          {lang === 'bn' ? 'বাকি কিস্তি' : 'left'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>
                          {lang === 'bn' ? 'প্রিমিয়াম জমার অগ্রগতি:' : 'Premium Progress:'}{' '}
                          <strong className="text-emerald-900 font-mono">{formatNumber(paidInstallments, lang)} / {formatNumber(totalInstallments, lang)}</strong>
                        </span>
                        <span className="font-mono font-bold text-emerald-700">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                        />
                      </div>
                    </div>

                    <div className="py-1 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{lang === 'bn' ? 'ওপেনিং ব্যালেন্স:' : 'Opening Balance:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editOpeningBal}
                            onChange={(e) => setEditOpeningBal(e.target.value)}
                            className="w-24 border rounded text-right px-1 font-mono"
                          />
                        ) : (
                          <span className="font-mono tabular-nums text-slate-700">
                            {formatCurrency(ins.openingBalance, 'BDT', lang)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">{lang === 'bn' ? 'প্রিমিয়াম লক্ষ্যমাত্রা:' : 'Premium:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editMonthlyAmt}
                            onChange={(e) => setEditMonthlyAmt(e.target.value)}
                            className="w-24 border rounded text-right px-1 font-mono"
                          />
                        ) : (
                          <span className="font-mono tabular-nums font-semibold text-slate-800">
                            {formatCurrency(ins.monthlyAmount, 'BDT', lang)} / কিস্তি
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-emerald-700">{lang === 'bn' ? 'ব্যাংক থেকে প্রিমিয়াম জমা:' : 'Transfers from Banks:'}</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-700">
                          {transfersIn > 0 ? `+${formatCurrency(transfersIn, 'BDT', lang)}` : formatCurrency(0, 'BDT', lang)}
                        </span>
                      </div>

                      {isEditing && (
                        <div className="flex justify-between items-center bg-emerald-50/50 p-1 rounded">
                          <span className="text-emerald-900 font-semibold">{lang === 'bn' ? 'মোট কিস্তির সংখ্যা:' : 'Total Installments:'}</span>
                          <input
                            type="number"
                            value={editTotalInstallments}
                            onChange={(e) => setEditTotalInstallments(e.target.value)}
                            className="w-20 border rounded text-right px-1 font-mono text-xs"
                            placeholder="144"
                          />
                        </div>
                      )}

                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">
                          {lang === 'bn' ? `মোট প্রিমিয়াম টার্গেট (${formatNumber(totalInstallments, lang)} কিস্তি):` : `Total Target (${totalInstallments} inst):`}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          {formatCurrency(totalTargetAmount, 'BDT', lang)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">
                          {lang === 'bn' ? `অবশিষ্ট জমা লক্ষ্যমাত্রা (${formatNumber(remainingInstallments, lang)} কিস্তি):` : `Remaining Target (${remainingInstallments} inst):`}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-amber-800">
                          {formatCurrency(remainingTargetAmount, 'BDT', lang)}
                        </span>
                      </div>

                      {installmentRemainder > 0 && (
                        <div className="text-[11px] text-emerald-600 font-medium">
                          {lang === 'bn' ? `অতিরিক্ত জমা: +${formatCurrency(installmentRemainder, 'BDT', lang)}` : `Extra balance: +${formatCurrency(installmentRemainder, 'BDT', lang)}`}
                        </div>
                      )}

                      {ins.notes && <p className="text-[11px] text-slate-400 pt-0.5 italic">{ins.notes}</p>}

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                        <span>{lang === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ:' : 'Maturity:'}</span>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editMaturity}
                            onChange={(e) => setEditMaturity(e.target.value)}
                            className="border rounded px-1.5 py-0.5 text-xs text-slate-700"
                          />
                        ) : (
                          <span className="font-medium text-slate-700">
                            {ins.maturityDate ? formatDate(ins.maturityDate, lang) : (lang === 'bn' ? 'নির্ধারিত নেই' : 'N/A')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 bg-emerald-50/60 p-2.5 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950">
                        {lang === 'bn' ? 'ইন্সুরেন্সে মোট সঞ্চিত তহবিল:' : 'Total Insurance Accumulated:'}
                      </span>
                      <span className="font-mono tabular-nums text-base font-bold text-emerald-950">
                        {formatCurrency(currentTotal, 'BDT', lang)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-emerald-200/60 text-emerald-900">
                      <span className="font-medium text-emerald-800">
                        {lang === 'bn' ? 'প্রিমিয়াম জমার অগ্রগতি:' : 'Premium Breakdown:'}
                      </span>
                      <span className="font-bold font-mono text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                        {formatNumber(paidInstallments, lang)} / {formatNumber(totalInstallments, lang)} {lang === 'bn' ? 'টি জমা' : 'paid'} · {formatNumber(remainingInstallments, lang)} {lang === 'bn' ? 'টি বাকি' : 'left'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickInstallment(ins)}
                      className="w-full mt-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ব্যাংক থেকে প্রিমিয়াম জমা দিন' : 'Pay Premium from Bank'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Loans Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-600" />
            <span>{lang === 'bn' ? 'ব্যাংক লোন ও কিস্তি হিসাব (Loan Tracking)' : 'Loan & Liability Records'}</span>
          </h3>
          <button
            onClick={() => setShowAddLoanModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '+ নতুন লোন যোগ' : '+ Add Loan'}</span>
          </button>
        </div>

        {data.loans.length === 0 ? (
          <div className="bg-white rounded-xl p-6 border border-slate-200 text-center text-slate-400 text-xs">
            {lang === 'bn'
              ? 'বর্তমানে কোনো লোনের হিসাব নেই। প্রয়োজন হলে "+ নতুন লোন যোগ" বাটনে ক্লিক করে যুক্ত করুন।'
              : 'No loans currently tracked. Click "+ Add Loan" to add one.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.loans.map((loan) => {
              const isEditing = editingLoanId === loan.id;
              const loanBal = getLoanBalance(loan.id);
              const remaining = loanBal.remaining;
              const progress = loanBal.progress;

              return (
                <div key={loan.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                      <div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editLoanName}
                              onChange={(e) => setEditLoanName(e.target.value)}
                              placeholder="লোনের নাম"
                              className="text-xs font-bold border border-slate-300 rounded px-1.5 py-0.5 w-full"
                            />
                            <input
                              type="text"
                              value={editLoanLender}
                              onChange={(e) => setEditLoanLender(e.target.value)}
                              placeholder="ব্যাংক বা প্রতিষ্ঠান"
                              className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 w-full"
                            />
                          </div>
                        ) : (
                          <>
                            <h4 className="text-sm font-bold text-slate-900">{loan.name}</h4>
                            <p className="text-xs text-slate-500">{loan.lender}</p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditLoan(loan.id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                              title="সংরক্ষণ"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingLoanId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="বাতিল"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditLoan(loan)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              title="লোন হিসাব সম্পাদনা"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(lang === 'bn' ? 'এই লোনের রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this loan record?')) {
                                  deleteLoan(loan.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="py-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{lang === 'bn' ? 'মোট ঋণের পরিমাণ:' : 'Total Loan:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editLoanTotal}
                            onChange={(e) => setEditLoanTotal(e.target.value)}
                            className="w-28 text-right font-mono text-xs border border-slate-300 rounded px-1.5 py-0.5"
                          />
                        ) : (
                          <span className="font-mono font-bold">{formatCurrency(loan.totalAmount, 'BDT', lang)}</span>
                        )}
                      </div>

                      {loanBal.repaidFromBanks > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-700 font-medium">
                            {lang === 'bn' ? 'ব্যাংক থেকে পরিশোধিত:' : 'Repaid From Banks:'}
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
                            +{formatCurrency(loanBal.repaidFromBanks, 'BDT', lang)}{' '}
                            <span className="text-[10px] font-normal">
                              ({formatNumber(loanBal.repaymentsCount, lang)} {lang === 'bn' ? 'কিস্তি' : 'inst'})
                            </span>
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-semibold">{lang === 'bn' ? 'সর্বমোট পরিশোধিত:' : 'Total Paid So Far:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editLoanPaid}
                            onChange={(e) => setEditLoanPaid(e.target.value)}
                            className="w-28 text-right font-mono text-xs border border-slate-300 rounded px-1.5 py-0.5"
                          />
                        ) : (
                          <span className="font-mono font-bold text-emerald-800">
                            {formatCurrency(loanBal.totalPaid, 'BDT', lang)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{lang === 'bn' ? 'মাসিক কিস্তির পরিমাণ:' : 'Installment:'}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editLoanInstallment}
                            onChange={(e) => setEditLoanInstallment(e.target.value)}
                            className="w-28 text-right font-mono text-xs border border-slate-300 rounded px-1.5 py-0.5"
                          />
                        ) : (
                          <span className="font-mono font-semibold text-rose-700">
                            {formatCurrency(loan.installmentAmount, 'BDT', lang)} / কিস্তি
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-rose-700 font-bold">{lang === 'bn' ? 'অবশিষ্ট বকেয়া ঋণ:' : 'Remaining Debt:'}</span>
                        <span className="font-mono font-bold text-rose-700 text-sm">
                          {formatCurrency(remaining, 'BDT', lang)}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{lang === 'bn' ? 'পরিশোধের অগ্রগতি' : 'Repayment Progress'}</span>
                          <span className="font-bold text-emerald-700">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {loan.note && <p className="text-[11px] text-slate-400 italic mb-2">{loan.note}</p>}
                  </div>

                  {/* Repayment Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRepayLoan(loan);
                      setShowRepayModal(true);
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'কিস্তি পরিশোধ ও ইনভয়েস তৈরি' : 'Pay Installment & Generate Invoice'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Loan Repayments Invoices & Ledger Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden mt-4">
          <div className="p-3.5 border-b border-slate-200 bg-rose-50/60 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {lang === 'bn' ? 'ব্যাংক লোন কিস্তি পরিশোধ ও ইনভয়েস খতিয়ান' : 'Loan Repayment Invoices & Ledger'}
              </h4>
            </div>
            <span className="text-xs text-rose-800 font-semibold">
              {loanRepayments.length} {lang === 'bn' ? 'টি পরিশোধ ভাউচার' : 'vouchers'}
            </span>
          </div>

          {loanRepayments.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              {lang === 'bn'
                ? 'এখনও কোনো ব্যাংক লোন কিস্তি পরিশোধ করা হয়নি। কিস্তি পরিশোধ করতে উপরের লোন কার্ড থেকে "কিস্তি পরিশোধ ও ইনভয়েস তৈরি" বাটনে ক্লিক করুন।'
                : 'No loan repayments made yet. Click "Pay Installment & Generate Invoice" on any loan card to make a payment.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'ইনভয়েস / ভাউচার' : 'Voucher No'}</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'কোন লোনে পরিশোধ' : 'Loan Account'}</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'উৎস ব্যাংক (কর্তন)' : 'Paid From Bank'}</th>
                    <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Amount (BDT)'}</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'নোট / বিবরণ' : 'Note'}</th>
                    <th className="py-2.5 px-3.5 text-center whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loanRepayments.map((tx) => {
                    const targetLoan = data.loans.find((l) => l.id === tx.targetLoanId);
                    const sourceBank = data.banks.find((b) => b.id === tx.fromBankId);

                    return (
                      <tr key={tx.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {tx.voucherNo || '—'}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                          {formatDate(tx.date, lang)}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {targetLoan?.name || 'Loan'}
                          {targetLoan?.lender && (
                            <span className="block text-[10px] text-slate-400 font-normal">{targetLoan.lender}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700">
                          <span className="font-medium">{sourceBank?.name || 'Bank'}</span>
                          {sourceBank?.accountNumber && (
                            <span className="block text-[10px] text-slate-400 font-mono">{sourceBank.accountNumber}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          {formatCurrency(tx.amount, 'BDT', lang)}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 max-w-xs truncate">
                          {tx.note || '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceTx(tx);
                                setSelectedInvoiceLoan(targetLoan || null);
                                setShowInvoiceModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer"
                              title={lang === 'bn' ? 'ইনভয়েস দেখুন ও প্রিন্ট করুন' : 'View & Print Invoice'}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'ভাউচার' : 'Invoice'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEditTx(tx);
                                setSelectedEditLoan(targetLoan || null);
                                setShowEditRepayModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
                              title={lang === 'bn' ? 'সংশোধন করুন' : 'Edit Repayment'}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    lang === 'bn'
                                      ? `এই লোন পরিশোধের রেকর্ড (${formatCurrency(tx.amount, 'BDT', lang)}) মুছে ফেলতে চান? এতে ব্যাংক ও লোনের ব্যালেন্স পুনরায় সমন্বয় হয়ে যাবে।`
                                      : 'Delete this repayment voucher? Bank and loan balances will be re-adjusted.'
                                  )
                                ) {
                                  deleteLoanRepayment(tx.id);
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
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Savings Transfers History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {lang === 'bn' ? 'ব্যাংক থেকে ডিপিএস ও ইন্সুরেন্সে টাকা জমার স্টেটমেন্ট' : 'Savings Transfers Ledger'}
          </h4>
          <span className="text-xs text-slate-500">
            {savingsTransactions.length} {lang === 'bn' ? 'টি লেনদেন' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'কোন ব্যাংক থেকে কর্তন' : 'From Bank'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'কোন সঞ্চয়ে জমা' : 'Target Savings'}</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">{lang === 'bn' ? 'বিবরণ' : 'Note'}</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">{lang === 'bn' ? 'জমা পরিমাণ' : 'Amount (BDT)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {savingsTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    {lang === 'bn'
                      ? 'এখনো ব্যাংক থেকে ডিপিএস বা ইন্সুরেন্সে ট্রান্সফারের এন্ট্রি নেই।'
                      : 'No savings transfers recorded yet.'}
                  </td>
                </tr>
              ) : (
                savingsTransactions.map((tx) => {
                  const fromBank = data.banks.find((b) => b.id === tx.fromBankId)?.name || 'Bank';
                  const targetSavings = data.savingsAccounts.find((s) => s.id === tx.targetSavingsId)?.name || 'Savings';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3.5 whitespace-nowrap font-medium text-slate-600">
                        {formatDate(tx.date, lang)}
                      </td>
                      <td className="py-2 px-3.5 text-slate-700 font-medium">{fromBank}</td>
                      <td className="py-2 px-3.5 text-blue-900 font-bold">{targetSavings}</td>
                      <td className="py-2 px-3.5 text-slate-500">{tx.note || '-'}</td>
                      <td className="py-2 px-3.5 text-right font-mono tabular-nums font-bold text-emerald-800 whitespace-nowrap">
                        +{formatCurrency(tx.amount, 'BDT', lang)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New DPS / Insurance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'bn' ? 'নতুন সঞ্চয় হিসাব যুক্ত করুন' : 'Add New Savings Account'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'হিসাবের ধরণ' : 'Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('dps');
                      if (newTotalInstallments === '144') setNewTotalInstallments('60');
                    }}
                    className={`py-1.5 px-3 rounded-md font-bold border transition-colors ${
                      newType === 'dps'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    ব্যাংক ডিপিএস (DPS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('insurance');
                      if (newTotalInstallments === '60') setNewTotalInstallments('144');
                    }}
                    className={`py-1.5 px-3 rounded-md font-bold border transition-colors ${
                      newType === 'insurance'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    ইন্সুরেন্স (Insurance)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'হিসাবের নাম' : 'Scheme Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ৫ বছর মেয়াদী বিশেষ ডিপিএস"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'ব্যাংক বা প্রতিষ্ঠান' : 'Institution'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মার্কেন্টাইল ব্যাংক"
                    value={newInst}
                    onChange={(e) => setNewInst(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'অ্যাকাউন্ট / পলিসি নং' : 'Account / Policy #'}
                  </label>
                  <input
                    type="text"
                    placeholder="DPS-1234"
                    value={newAccNo}
                    onChange={(e) => setNewAccNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'ওপেনিং ব্যালেন্স' : 'Opening Bal'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newOpeningBal}
                    onChange={(e) => setNewOpeningBal(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'মাসিক কিস্তি' : 'Monthly Amt'}
                  </label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={newMonthlyAmt}
                    onChange={(e) => setNewMonthlyAmt(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'মোট কিস্তির সংখ্যা' : 'Total Inst.'}
                  </label>
                  <input
                    type="number"
                    placeholder={newType === 'dps' ? '60' : '144'}
                    value={newTotalInstallments}
                    onChange={(e) => setNewTotalInstallments(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মেয়াদ শেষের তারিখ (ঐচ্ছিক)' : 'Maturity Date'}
                </label>
                <input
                  type="date"
                  value={newMaturity}
                  onChange={(e) => setNewMaturity(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Loan Modal */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-rose-600" />
                <span>{lang === 'bn' ? 'নতুন ব্যাংক লোন যোগ করুন' : 'Add New Loan Record'}</span>
              </h3>
              <button onClick={() => setShowAddLoanModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLoanSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লোনের বিবরণ / নাম' : 'Loan Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: পার্সোনাল লোন / গৃহ ঋণ"
                  value={newLoanName}
                  onChange={(e) => setNewLoanName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ব্যাংক বা ঋণদানকারী প্রতিষ্ঠান' : 'Lender / Bank'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ব্র্যাক ব্যাংক লিমিটেড"
                  value={newLoanLender}
                  onChange={(e) => setNewLoanLender(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'মোট ঋণের পরিমাণ (BDT)' : 'Total Loan (BDT)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="200000"
                    value={newLoanTotal}
                    onChange={(e) => setNewLoanTotal(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'মাসিক কিস্তি (BDT)' : 'Installment'}
                  </label>
                  <input
                    type="number"
                    placeholder="8500"
                    value={newLoanInstallment}
                    onChange={(e) => setNewLoanInstallment(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ইতিমধ্যে পরিশোধিত কিস্তির মোট টাকা (BDT)' : 'Already Paid Amount'}
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newLoanPaid}
                  onChange={(e) => setNewLoanPaid(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট বা মন্তব্য' : 'Note'}
                </label>
                <input
                  type="text"
                  placeholder="মাসিক কিস্তি ব্যাংক থেকে অটো-ডেবিট"
                  value={newLoanNote}
                  onChange={(e) => setNewLoanNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLoanModal(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-md"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-md shadow-xs"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Repayment Modal */}
      <LoanRepaymentModal
        isOpen={showRepayModal}
        onClose={() => setShowRepayModal(false)}
        selectedLoan={selectedRepayLoan}
        onPaymentSuccess={(tx) => {
          setSelectedInvoiceTx(tx);
          setSelectedInvoiceLoan(selectedRepayLoan);
          setShowInvoiceModal(true);
        }}
      />

      {/* Loan Repayment Invoice / Voucher View Modal */}
      <LoanInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        repaymentTx={selectedInvoiceTx}
        loan={selectedInvoiceLoan}
        onEdit={(tx) => {
          setShowInvoiceModal(false);
          setSelectedEditTx(tx);
          setSelectedEditLoan(selectedInvoiceLoan);
          setShowEditRepayModal(true);
        }}
      />

      {/* Edit Loan Repayment Modal */}
      <EditRepaymentModal
        isOpen={showEditRepayModal}
        onClose={() => setShowEditRepayModal(false)}
        repaymentTx={selectedEditTx}
        loan={selectedEditLoan}
      />

      {/* Quick Installment from Bank Modal */}
      {isInstallmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'bn' ? 'ব্যাংক থেকে কিস্তি পরিশোধ' : 'Pay Monthly Installment from Bank'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'ব্যাংক থেকে টাকা কেটে সরাসরি ডিপিএস/ইন্সুরেন্সে জমা' : 'Auto-deduct from BD bank and deposit to savings'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInstallmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInstallmentSubmit} className="p-5 space-y-3.5 text-xs">
              {/* Select Bank */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'যে ব্যাংক থেকে টাকা কাটা হবে' : 'Deduct from BD Bank Account'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={instBankId}
                  onChange={(e) => setInstBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  required
                >
                  {data.banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (বর্তমান ব্যালেন্স: ৳{getBankBalance(b.id).toLocaleString('bn-BD')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Savings Account */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ডিপিএস / ইন্সুরেন্স অ্যাকাউন্ট' : 'Target Savings Account'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={instSavingsId}
                  onChange={(e) => {
                    const accId = e.target.value;
                    setInstSavingsId(accId);
                    const found = data.savingsAccounts.find((s) => s.id === accId);
                    if (found) {
                      setInstAmount(String(found.monthlyAmount || ''));
                      setInstNote(lang === 'bn' ? `${found.name} কিস্তি পরিশোধ` : `Monthly installment for ${found.name}`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  required
                >
                  {data.savingsAccounts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.type === 'dps' ? '🏦 ডিপিএস:' : '🛡️ ইন্সুরেন্স:'} {s.name} (মাসিক কিস্তি: ৳{(s.monthlyAmount || 0).toLocaleString('bn-BD')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'কিস্তির পরিমাণ (BDT ৳)' : 'Amount (BDT ৳)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={instAmount}
                    onChange={(e) => setInstAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={instDate}
                    onChange={(e) => setInstDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Voucher / Txn Ref */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    {lang === 'bn' ? 'ভাউচার / রেফারেন্স নং' : 'Voucher / Ref #'}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ⚡ {lang === 'bn' ? 'অটো জেনারেটেড' : 'Auto Generated'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1001"
                  value={instVoucher}
                  onChange={(e) => setInstVoucher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট বা বিবরণ' : 'Note / Description'}
                </label>
                <input
                  type="text"
                  value={instNote}
                  onChange={(e) => setInstNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInstallmentModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'কিস্তি জমা নিশ্চিত করুন' : 'Confirm Deposit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
