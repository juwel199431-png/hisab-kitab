import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Coins,
  Landmark,
  TrendingUp,
  Sparkles,
  Calculator,
  Wallet,
  PiggyBank,
  Briefcase,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const CurrencyConverterModal: React.FC = () => {
  const {
    isConverterOpen,
    setIsConverterOpen,
    kwdRate,
    setKwdRate,
    lang,
    isPrivacyMode,
    getTotalBdBanksBalance,
    getTotalDpsSavings,
    getTotalInsuranceSavings,
    getBossSalaryTotals,
    getKuwaitReceivableTotals,
    getKuwaitPayableTotals,
    getTotalNetWorthBdt,
  } = useFinance();

  const [kwdInput, setKwdInput] = useState<string>('100');
  const [bdtInput, setBdtInput] = useState<string>(() => (100 * kwdRate).toFixed(0));
  const [tempRate, setTempRate] = useState<string>(String(kwdRate));
  const [isEditingRate, setIsEditingRate] = useState(false);

  if (!isConverterOpen) return null;

  const handleKwdChange = (val: string) => {
    setKwdInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBdtInput((num * kwdRate).toFixed(2));
    } else {
      setBdtInput('');
    }
  };

  const handleBdtChange = (val: string) => {
    setBdtInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && kwdRate > 0) {
      setKwdInput((num / kwdRate).toFixed(3));
    } else {
      setKwdInput('');
    }
  };

  const handleSaveRate = () => {
    const rate = parseFloat(tempRate);
    if (!isNaN(rate) && rate > 0) {
      setKwdRate(rate);
      setIsEditingRate(false);
      // update bdt conversion
      const num = parseFloat(kwdInput);
      if (!isNaN(num)) {
        setBdtInput((num * rate).toFixed(2));
      }
    }
  };

  // Quick rate presets
  const presets = [400, 405, 408, 410, 415];

  // Net Worth Breakdown
  const bdBanks = getTotalBdBanksBalance();
  const dpsSavings = getTotalDpsSavings();
  const insuranceSavings = getTotalInsuranceSavings();
  const bossRemainingKwd = getBossSalaryTotals().remainingBalance;
  const bossRemainingBdt = bossRemainingKwd * kwdRate;
  const receivableKwd = getKuwaitReceivableTotals().totalRemaining;
  const receivableBdt = receivableKwd * kwdRate;
  const payableKwd = getKuwaitPayableTotals().totalRemaining;
  const payableBdt = payableKwd * kwdRate;
  const totalNetWorthBdt = getTotalNetWorthBdt();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-teal-700 via-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {lang === 'bn' ? 'কারেন্সি কনভার্টার ও নিট সম্পদ ক্যালকুলেটর' : 'KWD ⇄ BDT Live Calculator'}
              </h2>
              <p className="text-[11px] text-emerald-100">
                {lang === 'bn' ? '১ কুয়েতি দিনার = ' + kwdRate + ' টাকা (BDT)' : `1 KWD = ${kwdRate} BDT Rate`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConverterOpen(false)}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Rate Setter Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {lang === 'bn' ? 'দিনার বিনিময় রেট (Exchange Rate)' : 'Exchange Rate (KWD to BDT)'}
              </span>
              {!isEditingRate ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempRate(String(kwdRate));
                    setIsEditingRate(true);
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'রেট পরিবর্তন করুন' : 'Edit Rate'}
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveRate}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
                  >
                    <Check className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'সেভ' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingRate(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>

            {isEditingRate ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">1 KWD =</span>
                  <input
                    type="number"
                    step="0.1"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-32 px-3 py-1.5 text-sm font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="405.00"
                    autoFocus
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">BDT (টাকা)</span>
                </div>
                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">{lang === 'bn' ? 'দ্রুত রেট:' : 'Presets:'}</span>
                  {presets.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTempRate(String(rate))}
                      className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    ৳ {kwdRate.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'প্রতি কুয়েতি দিনার' : 'per Kuwaiti Dinar'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                    {lang === 'bn' ? 'সক্রিয় রেট' : 'Active Rate'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Calculator Conversion Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* KWD Input Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-linear-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 shadow-2xs">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                {lang === 'bn' ? 'কুয়েত দিনার (KWD)' : 'Kuwait Dinar (KWD)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={kwdInput}
                  onChange={(e) => handleKwdChange(e.target.value)}
                  className="w-full px-3 py-2 text-xl font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white pr-14 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  KD
                </span>
              </div>
            </div>

            {/* BDT Output Card */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-linear-to-b from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20 shadow-2xs">
              <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-1.5">
                {lang === 'bn' ? 'বাংলাদেশি টাকা (BDT)' : 'Bangladeshi Taka (BDT)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={bdtInput}
                  onChange={(e) => handleBdtChange(e.target.value)}
                  className="w-full px-3 py-2 text-xl font-bold font-mono rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 pr-12 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  ৳
                </span>
              </div>
            </div>
          </div>

          {/* Grand Net Worth Portfolio Conversion Summary */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden">
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {lang === 'bn' ? 'সমস্ত বাংলাদেশ ও কুয়েত সম্পদের মোট মূল্যায়ন (BDT)' : 'Consolidated Net Worth (BDT)'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'কনভার্ট করা মোট নিট টাকা' : 'All assets converted'}
              </span>
            </div>

            <div className="p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Landmark className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  {lang === 'bn' ? 'বাংলাদেশের ব্যাংকের মোট ব্যালেন্স:' : 'BD Bank Accounts:'}
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(bdBanks, 'BDT', lang, isPrivacyMode)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <PiggyBank className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  {lang === 'bn' ? 'ডিপিএস ও ইন্সুরেন্স মোট সঞ্চয়:' : 'DPS & Insurance Portfolio:'}
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(dpsSavings + insuranceSavings, 'BDT', lang, isPrivacyMode)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {lang === 'bn' ? 'শাকের ভাই বেতন ফান্ড (KD Cash):' : 'Shaker Bhai Cash Remaining:'}
                </span>
                <div className="text-right">
                  <span className="font-bold font-mono text-slate-900 dark:text-white block">
                    {formatCurrency(bossRemainingKwd, 'KWD', lang, isPrivacyMode)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ≈ {formatCurrency(bossRemainingBdt, 'BDT', lang, isPrivacyMode)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Coins className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  {lang === 'bn' ? 'কুয়েত পার্সোনাল পাওনা লোন (বাকি):' : 'Kuwait Receivable Loans:'}
                </span>
                <div className="text-right">
                  <span className="font-bold font-mono text-rose-700 dark:text-rose-400 block">
                    +{formatCurrency(receivableKwd, 'KWD', lang, isPrivacyMode)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ≈ +{formatCurrency(receivableBdt, 'BDT', lang, isPrivacyMode)}
                  </span>
                </div>
              </div>

              {payableKwd > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Coins className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    {lang === 'bn' ? 'কুয়েত পার্সোনাল দেনা লোন (পরিশোধ্য):' : 'Kuwait Payable Loans:'}
                  </span>
                  <div className="text-right">
                    <span className="font-bold font-mono text-indigo-700 dark:text-indigo-400 block">
                      -{formatCurrency(payableKwd, 'KWD', lang, isPrivacyMode)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ≈ -{formatCurrency(payableBdt, 'BDT', lang, isPrivacyMode)}
                    </span>
                  </div>
                </div>
              )}

              {/* Grand Total Row */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {lang === 'bn' ? 'সর্বমোট নিট সম্পদ (Grand Total):' : 'Grand Total Net Worth:'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'বাংলাদেশ + কুয়েত সমমূল্য' : 'BD + Kuwait Equivalent'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalNetWorthBdt, 'BDT', lang, isPrivacyMode)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsConverterOpen(false)}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
