import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Plus,
  Coins,
} from 'lucide-react';

const DONUT_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#64748b', // Slate (Others)
];

const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCompactAxis(val: number, currency: 'BDT' | 'KWD'): string {
  if (val === 0) return '0';
  if (currency === 'KWD') {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val % 1 === 0 ? `${val}` : val.toFixed(1);
  }
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return `${Math.round(val)}`;
}

export const DashboardCharts: React.FC = () => {
  const { data, lang, isPrivacyMode, setIsQuickAddOpen } = useFinance();

  // Pick initial currency that has more recent activity (default BDT if banks/tx exist, or KWD)
  const [chartCurrency, setChartCurrency] = useState<'BDT' | 'KWD'>('BDT');
  const [donutPeriod, setDonutPeriod] = useState<'month' | 'all'>('all');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredCatIdx, setHoveredCatIdx] = useState<number | null>(null);

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Build last 6 calendar months series
  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: {
      key: string;
      label: string;
      income: number;
      expense: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = lang === 'bn' ? MONTHS_BN[m] : MONTHS_EN[m];
      months.push({ key, label, income: 0, expense: 0 });
    }

    const monthMap = new Map(months.map((m) => [m.key, m]));

    data.transactions.forEach((tx) => {
      if (tx.currency !== chartCurrency) return;
      const mKey = tx.date ? tx.date.slice(0, 7) : '';
      const entry = monthMap.get(mKey);
      if (!entry) return;
      if (tx.type === 'income') {
        entry.income += Number(tx.amount || 0);
      } else if (tx.type === 'expense') {
        entry.expense += Number(tx.amount || 0);
      }
    });

    if (chartCurrency === 'KWD') {
      data.bossDeposits.forEach((dep) => {
        const mKey = dep.month || (dep.depositDate ? dep.depositDate.slice(0, 7) : '');
        const entry = monthMap.get(mKey);
        if (entry) {
          entry.income += Number(dep.amount || 0);
        }
      });
    }

    return months;
  }, [data.transactions, data.bossDeposits, chartCurrency, lang]);

  const barTotals = useMemo(() => {
    let maxVal = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    monthlySeries.forEach((m) => {
      if (m.income > maxVal) maxVal = m.income;
      if (m.expense > maxVal) maxVal = m.expense;
      totalIncome += m.income;
      totalExpense += m.expense;
    });
    return {
      maxVal: maxVal > 0 ? maxVal * 1.15 : 100,
      hasData: totalIncome > 0 || totalExpense > 0,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  }, [monthlySeries]);

  const activeMonthDetail =
    hoveredMonthIdx !== null ? monthlySeries[hoveredMonthIdx] : null;

  // Build Category-wise Expense Ratio breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; amount: number }>();

    data.transactions.forEach((tx) => {
      if (tx.type !== 'expense' || tx.currency !== chartCurrency) return;
      if (donutPeriod === 'month' && !tx.date.startsWith(currentMonthStr)) return;

      const label =
        (lang === 'bn' ? tx.categoryNameBn : tx.categoryNameEn)?.trim() ||
        (lang === 'bn' ? 'অন্যান্য খরচ' : 'Other Expense');
      const existing = map.get(label);
      const amt = Number(tx.amount || 0);
      if (amt <= 0) return;
      if (existing) {
        existing.amount += amt;
      } else {
        map.set(label, { label, amount: amt });
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    const total = sorted.reduce((acc, item) => acc + item.amount, 0);
    if (total <= 0) return { slices: [], total: 0 };

    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    if (rest.length > 0) {
      const restTotal = rest.reduce((acc, item) => acc + item.amount, 0);
      top.push({
        label: lang === 'bn' ? 'অন্যান্য খাত' : 'Others',
        amount: restTotal,
      });
    }

    let cumulativePct = 0;
    const slices = top.map((item, idx) => {
      const pct = (item.amount / total) * 100;
      const startPct = cumulativePct;
      cumulativePct += pct;
      return {
        ...item,
        pct,
        startPct,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      };
    });

    return { slices, total };
  }, [data.transactions, chartCurrency, donutPeriod, currentMonthStr, lang]);

  const activeSlice =
    hoveredCatIdx !== null && categoryBreakdown.slices[hoveredCatIdx]
      ? categoryBreakdown.slices[hoveredCatIdx]
      : null;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="space-y-3 pt-2">
      {/* Section Header & Currency Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shadow-2xs shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {lang === 'bn'
                ? 'আয়-ব্যয় বিশ্লেষণ ও খরচের অনুপাত'
                : 'Financial Analytics & Expense Ratio'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'বিগত ৬ মাসের মাসভিত্তিক আয় বনাম ব্যয় এবং খাতওয়ারী খরচের চিত্র'
                : '6-month income vs expense trends and category expense breakdown'}
            </p>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <Coins className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 hidden sm:block" />
          {(['BDT', 'KWD'] as const).map((curr) => {
            const active = chartCurrency === curr;
            return (
              <button
                key={curr}
                type="button"
                onClick={() => {
                  setChartCurrency(curr);
                  setHoveredMonthIdx(null);
                  setHoveredCatIdx(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700/70'
                }`}
              >
                {curr === 'BDT' ? (lang === 'bn' ? 'টাকা (BDT ৳)' : 'BDT (৳)') : 'KWD (KD)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CHART 1: Monthly Income vs Expense Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'মাসভিত্তিক আয় বনাম ব্যয়' : 'Monthly Income vs Expense'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activeMonthDetail
                  ? `${activeMonthDetail.label} · ${lang === 'bn' ? 'আয়' : 'In'}: ${formatCurrency(
                      activeMonthDetail.income,
                      chartCurrency,
                      lang,
                      isPrivacyMode
                    )} | ${lang === 'bn' ? 'ব্যয়' : 'Out'}: ${formatCurrency(
                      activeMonthDetail.expense,
                      chartCurrency,
                      lang,
                      isPrivacyMode
                    )}`
                  : lang === 'bn'
                  ? `সর্বশেষ ৬ মাস (${chartCurrency}) • বার-এর উপর হোভার করুন`
                  : `Last 6 months (${chartCurrency}) • Hover bars for details`}
              </p>
            </div>

            {/* Clean Chart Legend */}
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                {lang === 'bn' ? 'আয় / জমা' : 'Income'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                {lang === 'bn' ? 'ব্যয় / খরচ' : 'Expense'}
              </span>
            </div>
          </div>

          {!barTotals.hasData ? (
            <div className="flex-1 min-h-[210px] flex flex-col items-center justify-center text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
              <BarChart3 className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn'
                  ? `এই মুদ্রায় (${chartCurrency}) বিগত ৬ মাসে কোনো আয়/ব্যয়ের ডেটা নেই`
                  : `No ${chartCurrency} income or expense data in the last 6 months`}
              </p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন এন্ট্রি যোগ করুন' : 'Add Entry'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Crisp Responsive SVG Bar Chart */}
              <div className="w-full overflow-hidden">
                <svg
                  viewBox="0 0 520 210"
                  className="w-full h-48 sm:h-52 select-none"
                  role="img"
                  aria-label={lang === 'bn' ? 'মাসভিত্তিক আয় বনাম ব্যয় বার চার্ট' : 'Monthly Income vs Expense Bar Chart'}
                >
                  {/* Y-axis horizontal dashed guidelines (4 levels) */}
                  {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                    const y = 172 - ratio * 145;
                    const labelVal = barTotals.maxVal * ratio;
                    return (
                      <g key={idx}>
                        <line
                          x1="44"
                          y1={y}
                          x2="508"
                          y2={y}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeDasharray={ratio === 0 ? undefined : '3 4'}
                          strokeWidth="1"
                        />
                        <text
                          x="38"
                          y={y + 3.5}
                          textAnchor="end"
                          className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
                        >
                          {isPrivacyMode ? '••' : formatCompactAxis(labelVal, chartCurrency)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Monthly Grouped Bars */}
                  {monthlySeries.map((m, idx) => {
                    const groupX = 56 + idx * 75;
                    const incH = Math.max(m.income > 0 ? 4 : 0, (m.income / barTotals.maxVal) * 145);
                    const expH = Math.max(m.expense > 0 ? 4 : 0, (m.expense / barTotals.maxVal) * 145);
                    const isHovered = hoveredMonthIdx === idx;

                    return (
                      <g
                        key={m.key}
                        onMouseEnter={() => setHoveredMonthIdx(idx)}
                        onMouseLeave={() => setHoveredMonthIdx(null)}
                        onClick={() => setHoveredMonthIdx(isHovered ? null : idx)}
                        className="cursor-pointer"
                      >
                        {/* Subtle hover column highlight */}
                        <rect
                          x={groupX - 6}
                          y={16}
                          width={58}
                          height={162}
                          rx={8}
                          className={`transition-opacity duration-150 ${
                            isHovered
                              ? 'fill-slate-100 dark:fill-slate-800/80 opacity-100'
                              : 'opacity-0'
                          }`}
                        />

                        {/* Income Bar */}
                        <rect
                          x={groupX + 2}
                          y={172 - incH}
                          width={18}
                          height={incH}
                          rx={4}
                          className={`transition-all duration-200 ${
                            isHovered ? 'fill-emerald-400' : 'fill-emerald-500'
                          }`}
                        />

                        {/* Expense Bar */}
                        <rect
                          x={groupX + 24}
                          y={172 - expH}
                          width={18}
                          height={expH}
                          rx={4}
                          className={`transition-all duration-200 ${
                            isHovered ? 'fill-rose-400' : 'fill-rose-500'
                          }`}
                        />

                        {/* Month Label */}
                        <text
                          x={groupX + 22}
                          y={194}
                          textAnchor="middle"
                          className={`text-[11px] font-semibold transition-colors ${
                            isHovered
                              ? 'fill-slate-900 dark:fill-white font-bold'
                              : 'fill-slate-500 dark:fill-slate-400'
                          }`}
                        >
                          {m.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom 3-Metric Compact Strip */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {lang === 'bn' ? 'মোট আয়' : '6M Income'}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm block mt-0.5 truncate">
                    {formatCurrency(barTotals.totalIncome, chartCurrency, lang, isPrivacyMode)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/50">
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {lang === 'bn' ? 'মোট ব্যয়' : '6M Expense'}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-rose-800 dark:text-rose-200 text-xs sm:text-sm block mt-0.5 truncate">
                    {formatCurrency(barTotals.totalExpense, chartCurrency, lang, isPrivacyMode)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                    {lang === 'bn' ? 'নিট সঞ্চয়' : 'Net Savings'}
                  </span>
                  <span
                    className={`font-mono tabular-nums font-bold text-xs sm:text-sm block mt-0.5 truncate ${
                      barTotals.net >= 0
                        ? 'text-slate-900 dark:text-white'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {barTotals.net >= 0 ? '+' : ''}
                    {formatCurrency(barTotals.net, chartCurrency, lang, isPrivacyMode)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Category-wise Expense Ratio Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {lang === 'bn' ? 'খাত অনুযায়ী খরচের অনুপাত' : 'Expense by Category'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? `শীর্ষ খাতসমূহ (${chartCurrency})`
                  : `Top expense categories (${chartCurrency})`}
              </p>
            </div>

            {/* Period Toggle */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              {[
                { id: 'month' as const, bn: 'এই মাস', en: 'Month' },
                { id: 'all' as const, bn: 'সব সময়', en: 'All' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setDonutPeriod(p.id);
                    setHoveredCatIdx(null);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    donutPeriod === p.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {lang === 'bn' ? p.bn : p.en}
                </button>
              ))}
            </div>
          </div>

          {categoryBreakdown.slices.length === 0 ? (
            <div className="flex-1 min-h-[210px] flex flex-col items-center justify-center text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
              <PieChart className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn'
                  ? `নির্বাচিত সময়ে (${chartCurrency}) কোনো খরচ পাওয়া যায়নি`
                  : `No ${chartCurrency} expense entries found for this period`}
              </p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'খরচ যোগ করুন' : 'Add Expense'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 my-auto">
              {/* SVG Donut Ring */}
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90">
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="22"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  {categoryBreakdown.slices.map((slice, idx) => {
                    const segLength = (slice.pct / 100) * circumference;
                    const dashOffset = -((slice.startPct / 100) * circumference);
                    const isHighlighted = hoveredCatIdx === idx;
                    const isDimmed = hoveredCatIdx !== null && hoveredCatIdx !== idx;

                    return (
                      <circle
                        key={slice.label}
                        cx="75"
                        cy="75"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHighlighted ? 26 : 22}
                        strokeDasharray={`${Math.max(0, segLength - 1.5)} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        onMouseEnter={() => setHoveredCatIdx(idx)}
                        onMouseLeave={() => setHoveredCatIdx(null)}
                        onClick={() => setHoveredCatIdx(isHighlighted ? null : idx)}
                        className="cursor-pointer transition-all duration-200"
                        style={{ opacity: isDimmed ? 0.35 : 1 }}
                      />
                    );
                  })}
                </svg>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate max-w-[92px]">
                    {activeSlice
                      ? activeSlice.label
                      : lang === 'bn'
                      ? 'মোট খরচ'
                      : 'Total'}
                  </span>
                  <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {activeSlice
                      ? `${activeSlice.pct.toFixed(1)}%`
                      : formatCompactAxis(categoryBreakdown.total, chartCurrency)}
                  </span>
                  <span className="font-mono tabular-nums text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[95px]">
                    {activeSlice
                      ? formatCurrency(activeSlice.amount, chartCurrency, lang, isPrivacyMode)
                      : chartCurrency}
                  </span>
                </div>
              </div>

              {/* Ranked Category Legend */}
              <div className="w-full flex-1 space-y-2 min-w-0">
                {categoryBreakdown.slices.map((slice, idx) => {
                  const isHighlighted = hoveredCatIdx === idx;
                  return (
                    <button
                      key={slice.label}
                      type="button"
                      onMouseEnter={() => setHoveredCatIdx(idx)}
                      onMouseLeave={() => setHoveredCatIdx(null)}
                      onClick={() => setHoveredCatIdx(isHighlighted ? null : idx)}
                      className={`w-full text-left p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {slice.label}
                          </span>
                        </span>
                        <span className="font-mono tabular-nums text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {slice.pct.toFixed(0)}% ·{' '}
                          {formatCurrency(slice.amount, chartCurrency, lang, isPrivacyMode)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(4, slice.pct)}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
