import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Building2,
  PiggyBank,
  ShieldCheck,
  Briefcase,
  Wallet,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    data,
    lang,
    isPrivacyMode,
    getBankBalance,
    getSavingsBalance,
    getTotalBdBanksBalance,
    getTotalDpsSavings,
    getTotalInsuranceSavings,
    setActiveSection,
  } = useFinance();

  // BD Banks Data
  const totalBdBanks = getTotalBdBanksBalance();

  // DPS & Insurance Data
  const dpsAccounts = data.savingsAccounts.filter((s) => s.type === 'dps');
  const insuranceAccounts = data.savingsAccounts.filter((s) => s.type === 'insurance');
  const totalDpsBalance = getTotalDpsSavings();
  const totalInsuranceBalance = getTotalInsuranceSavings();

  // Shaker Bhai Salary Cash in Hand Calculation (All-time net fund in KWD)
  const totalBossDeposits = data.bossDeposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);
  const totalBossExpenses = data.transactions
    .filter((tx) => tx.section === 'boss-salary')
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const bossCashInHand = totalBossDeposits - totalBossExpenses;

  // Recent month for boss salary
  const currentMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const currentMonthBossDeposits = data.bossDeposits
    .filter((d) => d.month === currentMonthStr)
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);
  const currentMonthBossExpenses = data.transactions
    .filter((tx) => tx.section === 'boss-salary' && tx.date.startsWith(currentMonthStr))
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const currentMonthCashNet = currentMonthBossDeposits - currentMonthBossExpenses;

  // Custom bank card themes
  const bankCardThemes = [
    {
      gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
      badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      accentColor: 'text-emerald-300',
      iconBg: 'bg-emerald-500/30 text-emerald-100',
    },
    {
      gradient: 'from-blue-600 via-indigo-700 to-slate-900',
      badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      accentColor: 'text-blue-300',
      iconBg: 'bg-blue-500/30 text-blue-100',
    },
    {
      gradient: 'from-amber-600 via-orange-700 to-stone-900',
      badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      accentColor: 'text-amber-300',
      iconBg: 'bg-amber-500/30 text-amber-100',
    },
    {
      gradient: 'from-purple-600 via-violet-700 to-indigo-950',
      badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      accentColor: 'text-purple-300',
      iconBg: 'bg-purple-500/30 text-purple-100',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'এক্সিকিউটিভ ফিন্যান্সিয়াল ওভারভিউ' : 'Executive Financial Overview'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {lang === 'bn' ? 'ব্যক্তিগত অর্থ ও সঞ্চয় ড্যাশবোর্ড' : 'Personal Finance & Savings Dashboard'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? 'আপনার বাংলাদেশ ব্যাংকগুলোর রিয়েল-টাইম কারেন্ট ব্যালেন্স, ডিপিএস ও ইন্স্যুরেন্সের জমার স্থিতি ও কিস্তির পরিমাণ এবং শাকের ভাই বেতন হিসাবের নগদ ক্যাশ ইন হ্যান্ড এক নজরে।'
                : 'Real-time balances of your BD Banks, DPS & Insurance savings with monthly installments, and Shaker Bhai Salary Cash in Hand.'}
            </p>
          </div>

          {/* Quick Summary Pill Highlights */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-3 min-w-[140px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                {lang === 'bn' ? 'মোট বিডি ব্যাংক ব্যালেন্স' : 'Total BD Banks'}
              </span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                {formatCurrency(totalBdBanks, 'BDT', lang, isPrivacyMode)}
              </span>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-3 min-w-[140px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                {lang === 'bn' ? 'বেতন ক্যাশ ইন হ্যান্ড' : 'Boss Fund Cash'}
              </span>
              <span className="font-mono text-lg font-bold text-amber-400">
                {isPrivacyMode ? '•••••• KD' : `${bossCashInHand.toFixed(3)} KD`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: BD BANK ACCOUNTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'বাংলাদেশ ব্যাংক কারেন্ট ব্যালেন্স' : 'Bangladesh Bank Balances'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'প্রতিটি ব্যাংকের রিয়েল-টাইম হিসাবের স্থিতি ও বিবরণ'
                  : 'Current real-time ledger balance for each bank'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveSection('bd-bank')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>{lang === 'bn' ? 'ব্যাংক হিসাব পরিচালনা' : 'Manage Banks'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bank Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.banks.map((bank, index) => {
            const currentBal = getBankBalance(bank.id);
            const theme = bankCardThemes[index % bankCardThemes.length];

            return (
              <div
                key={bank.id}
                className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${theme.gradient} text-white p-5 shadow-lg flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl`}
              >
                {/* Background Card Chip Graphic */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

                {/* Card Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md border border-white/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <span>{lang === 'bn' ? 'সেভিংস অ্যাকাউন্ট' : 'Savings Account'}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-white tracking-wide leading-snug">
                      {bank.name}
                    </h3>
                    <p className="text-xs text-white/90 font-medium flex items-center gap-1">
                      <span>🏛️</span>
                      <span>{lang === 'bn' ? 'শাখা: লোকাল শাখা' : 'Branch: Local Branch'}</span>
                    </p>
                  </div>

                  <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0 shadow-xs`}>
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="mb-4" />

                {/* Card Bottom: Current Balance */}
                <div className="pt-3 border-t border-white/15">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 block mb-0.5">
                    {lang === 'bn' ? 'কারেন্ট ব্যালেন্স (Current Balance)' : 'Current Balance'}
                  </span>
                  <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-white">
                    {formatCurrency(currentBal, 'BDT', lang, isPrivacyMode)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: DPS & INSURANCE ACCOUNTS */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold shadow-2xs">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'ডিপিএস ও ইন্স্যুরেন্স সঞ্চয় স্থিতি' : 'DPS & Insurance Savings'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'কারেন্ট ব্যালেন্স এবং মাসিক কিস্তির পরিমাণ'
                  : 'Current accumulated balance and monthly installment amount'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('bd-bank')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Full Details'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* DPS and Insurance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* DPS Accounts Block - Cute Vibrant Gradients */}
          {dpsAccounts.map((dps, idx) => {
            const currentBal = getSavingsBalance(dps.id);
            // Cute themes for DPS
            const dpsThemes = [
              {
                gradient: 'from-violet-600 via-purple-700 to-indigo-950',
                badge: 'bg-white/20 text-violet-100 border-white/25',
                installmentBg: 'bg-black/25 text-amber-300 border-white/20',
                chipBg: 'bg-white/10 text-white border-white/15',
                circleColor: 'bg-violet-400/20',
              },
              {
                gradient: 'from-fuchsia-600 via-pink-700 to-purple-950',
                badge: 'bg-white/20 text-pink-100 border-white/25',
                installmentBg: 'bg-black/25 text-yellow-300 border-white/20',
                chipBg: 'bg-white/10 text-white border-white/15',
                circleColor: 'bg-pink-400/20',
              },
            ];
            const theme = dpsThemes[idx % dpsThemes.length];

            return (
              <div
                key={dps.id}
                className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${theme.gradient} text-white p-5 shadow-lg flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl`}
              >
                {/* Cute Floating Glass Bubbles */}
                <div className={`absolute -right-6 -bottom-6 w-32 h-32 ${theme.circleColor} rounded-full blur-xl pointer-events-none`} />
                <div className="absolute top-0 right-1/3 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${theme.badge} border backdrop-blur-md`}>
                      <PiggyBank className="w-3.5 h-3.5 text-pink-200" />
                      <span>{lang === 'bn' ? 'ব্যাংক ডিপিএস (DPS)' : 'Bank DPS'}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-white tracking-wide">{dps.name}</h3>
                    <p className="text-xs text-white/80 font-mono">
                      A/C: {dps.accountNumber || 'N/A'}
                    </p>
                  </div>

                  {/* Monthly Installment Pill */}
                  <div className={`${theme.installmentBg} border backdrop-blur-md rounded-xl px-3 py-2 text-right shadow-2xs`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                      {lang === 'bn' ? 'মাসিক কিস্তি' : 'Monthly'}
                    </span>
                    <span className="font-mono text-sm font-black text-amber-300">
                      {formatCurrency(dps.monthlyAmount || 0, 'BDT', lang, isPrivacyMode)}
                    </span>
                  </div>
                </div>

                <div className={`relative z-10 p-3.5 ${theme.chipBg} border backdrop-blur-md rounded-xl flex items-center justify-between`}>
                  <div>
                    <span className="text-[11px] font-semibold text-white/80 block mb-0.5">
                      {lang === 'bn' ? 'কারেন্ট জমার ব্যালেন্স (Current Balance)' : 'Current Balance'}
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono tracking-tight text-white">
                      {formatCurrency(currentBal, 'BDT', lang, isPrivacyMode)}
                    </span>
                  </div>

                  {dps.maturityDate && (
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-white/70 block">
                        {lang === 'bn' ? 'মেয়াদপূর্তি' : 'Maturity'}
                      </span>
                      <span className="text-xs font-bold text-white/95">
                        {formatDate(dps.maturityDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Insurance Accounts Block - Cute Teal & Emerald Gradient */}
          {insuranceAccounts.map((ins, idx) => {
            const currentBal = getSavingsBalance(ins.id);
            const insThemes = [
              {
                gradient: 'from-teal-600 via-cyan-700 to-slate-950',
                badge: 'bg-white/20 text-teal-100 border-white/25',
                installmentBg: 'bg-black/25 text-teal-300 border-white/20',
                chipBg: 'bg-white/10 text-white border-white/15',
                circleColor: 'bg-teal-400/20',
              },
              {
                gradient: 'from-emerald-600 via-teal-700 to-indigo-950',
                badge: 'bg-white/20 text-emerald-100 border-white/25',
                installmentBg: 'bg-black/25 text-emerald-300 border-white/20',
                chipBg: 'bg-white/10 text-white border-white/15',
                circleColor: 'bg-emerald-400/20',
              },
            ];
            const theme = insThemes[idx % insThemes.length];

            return (
              <div
                key={ins.id}
                className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${theme.gradient} text-white p-5 shadow-lg flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl`}
              >
                {/* Cute Floating Glass Bubbles */}
                <div className={`absolute -right-6 -bottom-6 w-32 h-32 ${theme.circleColor} rounded-full blur-xl pointer-events-none`} />
                <div className="absolute top-0 right-1/3 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${theme.badge} border backdrop-blur-md`}>
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
                      <span>{lang === 'bn' ? 'ইন্স্যুরেন্স পলিসি (Insurance)' : 'Insurance Policy'}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-white tracking-wide">{ins.name}</h3>
                    <p className="text-xs text-white/80 font-mono">
                      Policy #: {ins.accountNumber || 'N/A'}
                    </p>
                  </div>

                  {/* Monthly Premium Pill */}
                  <div className={`${theme.installmentBg} border backdrop-blur-md rounded-xl px-3 py-2 text-right shadow-2xs`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                      {lang === 'bn' ? 'মাসিক কিস্তি' : 'Premium'}
                    </span>
                    <span className="font-mono text-sm font-black text-cyan-300">
                      {formatCurrency(ins.monthlyAmount || 0, 'BDT', lang, isPrivacyMode)}
                    </span>
                  </div>
                </div>

                <div className={`relative z-10 p-3.5 ${theme.chipBg} border backdrop-blur-md rounded-xl flex items-center justify-between`}>
                  <div>
                    <span className="text-[11px] font-semibold text-white/80 block mb-0.5">
                      {lang === 'bn' ? 'কারেন্ট জমার ব্যালেন্স (Current Balance)' : 'Current Balance'}
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono tracking-tight text-white">
                      {formatCurrency(currentBal, 'BDT', lang, isPrivacyMode)}
                    </span>
                  </div>

                  {ins.maturityDate && (
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-white/70 block">
                        {lang === 'bn' ? 'মেয়াদপূর্তি' : 'Maturity'}
                      </span>
                      <span className="text-xs font-bold text-white/95">
                        {formatDate(ins.maturityDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DPS & Insurance Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
              {lang === 'bn' ? 'মোট ডিপিএস জমার পরিমাণ:' : 'Total DPS Accumulated:'}
            </span>
            <span className="font-mono text-base font-extrabold text-indigo-700 dark:text-indigo-400">
              {formatCurrency(totalDpsBalance, 'BDT', lang, isPrivacyMode)}
            </span>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              {lang === 'bn' ? 'মোট ইন্স্যুরেন্স জমার পরিমাণ:' : 'Total Insurance Accumulated:'}
            </span>
            <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalInsuranceBalance, 'BDT', lang, isPrivacyMode)}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: SHAKER BHAI SALARY - CASH IN HAND */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'শাকের ভাই এর বেতন হিসাব - ক্যাশ ইন হ্যান্ড' : 'Shaker Bhai Salary - Cash in Hand'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'বসের থেকে প্রাপ্ত বেতন ফান্ড এবং খরচের পর হাতে অবশিষ্ট নগদ টাকা (KWD)'
                  : 'Total Boss Fund received minus expenses = Net Cash in Hand (KWD)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveSection('boss-salary')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>{lang === 'bn' ? 'বেতন ফান্ড বিবরণী' : 'Salary Ledger'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Cash in Hand Showcase Card */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-500 via-orange-600 to-amber-700 text-white p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left High-Impact Cash In Hand Stat */}
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-yellow-200 text-xs font-bold">
                <Wallet className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'হাতে থাকা অবশিষ্ট নগদ ক্যাশ' : 'Net Cash in Hand'}</span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-amber-100 font-semibold block">
                  {lang === 'bn' ? 'বর্তমান ক্যাশ ইন হ্যান্ড (Current Cash in Hand)' : 'Current Cash in Hand'}
                </span>
                <div className="text-3xl md:text-5xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
                  <span>{isPrivacyMode ? '••••••' : bossCashInHand.toFixed(3)}</span>
                  <span className="text-xl md:text-2xl font-bold text-amber-200">KWD</span>
                </div>
              </div>

              <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed max-w-xl">
                {lang === 'bn'
                  ? 'বসের দেওয়া মোট বেতন ও খরচ ফান্ড থেকে দৈনিক সকল খরচের হিসাব বাদ দিয়ে এই নগদ কুয়েতি দিনার বর্তমানে আপনার হাতে অবশিষ্ট রয়েছে।'
                  : 'Total received fund from boss minus all daily expenses equals this net cash remaining in hand.'}
              </p>
            </div>

            {/* Right Sub-metrics Grid */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Total Deposits Received */}
              <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block mb-1">
                  {lang === 'bn' ? 'মোট প্রাপ্ত বেতন ফান্ড' : 'Total Fund Received'}
                </span>
                <span className="font-mono text-xl font-bold text-white block">
                  {isPrivacyMode ? '•••••• KD' : `+${totalBossDeposits.toFixed(3)} KD`}
                </span>
                <span className="text-[10px] text-amber-200/80 mt-1 block">
                  {data.bossDeposits.length} {lang === 'bn' ? 'টি কিস্তি/জমা' : 'deposits'}
                </span>
              </div>

              {/* Total Disbursed Expenses */}
              <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-200 block mb-1">
                  {lang === 'bn' ? 'মোট সম্পন্ন খরচ' : 'Total Spent'}
                </span>
                <span className="font-mono text-xl font-bold text-rose-100 block">
                  {isPrivacyMode ? '•••••• KD' : `-${totalBossExpenses.toFixed(3)} KD`}
                </span>
                <span className="text-[10px] text-rose-200/80 mt-1 block">
                  {lang === 'bn' ? 'দৈনিক খরচের ভাউচারসমূহ' : 'Daily expense vouchers'}
                </span>
              </div>

              {/* Current Month Net */}
              <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block mb-0.5">
                    {lang === 'bn' ? `চলতি মাস (${currentMonthStr}) নেট সারপ্লাস:` : `Current Month Net (${currentMonthStr}):`}
                  </span>
                  <span className="text-xs text-amber-100 font-medium">
                    {lang === 'bn' ? 'জমা ' : 'In: '}{isPrivacyMode ? '•••' : `+${currentMonthBossDeposits.toFixed(3)} KD`} | {lang === 'bn' ? 'খরচ ' : 'Out: '}{isPrivacyMode ? '•••' : `-${currentMonthBossExpenses.toFixed(3)} KD`}
                  </span>
                </div>
                <span className="font-mono text-base font-black text-yellow-300">
                  {isPrivacyMode
                    ? '•••••• KD'
                    : currentMonthCashNet >= 0
                    ? `+${currentMonthCashNet.toFixed(3)} KD`
                    : `${currentMonthCashNet.toFixed(3)} KD`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
