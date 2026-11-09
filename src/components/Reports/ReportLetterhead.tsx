import React from 'react';
import { ShieldCheck, Award, Calendar, FileText } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface ReportLetterheadProps {
  title?: string;
  subtitle?: string;
  accountName?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  lang?: 'bn' | 'en';
  docRef?: string;
  className?: string;
}

/**
 * Modern, aesthetic, official letterhead for Financial Reports, Sub Ledgers, and Audits.
 * Suitable for both on-screen display and PDF/Print generation.
 */
export const ReportLetterhead: React.FC<ReportLetterheadProps> = ({
  title,
  subtitle,
  accountName,
  startDate,
  endDate,
  currency = 'KWD',
  lang = 'bn',
  docRef,
  className = '',
}) => {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const generatedRef = docRef || `HK-${new Date().getFullYear()}-${Math.abs((startDate || '').charCodeAt(0) * 31 + (endDate || '').length * 17) % 9000 + 1000}`;

  return (
    <div className={`w-full pb-3 mb-3 border-b-2 border-slate-800 ${className}`}>
      {/* Top Main Letterhead Row */}
      <div className="flex justify-between items-start gap-4">
        {/* Left: Modern Logo & Company Branding */}
        <div className="flex items-start gap-3.5">
          {/* Aesthetic Dual-Tone Monogram Logo */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 p-0.5 shadow-md flex items-center justify-center border border-indigo-400/40">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
              >
                {/* Outer Hexagon Shield */}
                <polygon
                  points="24,3 43,13 43,35 24,45 5,35 5,13"
                  fill="url(#shieldGrad)"
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                />
                {/* Inner Balance & Ledger Lines */}
                <path
                  d="M24 10 V38 M14 18 H34 M11 26 L17 18 L23 26 Z M25 26 L31 18 L37 26 Z"
                  stroke="#E0E7FF"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24" cy="18" r="2.5" fill="#10B981" />
                <defs>
                  <linearGradient id="shieldGrad" x1="5" y1="3" x2="43" y2="45" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1E1B4B" />
                    <stop offset="0.5" stopColor="#0F172A" />
                    <stop offset="1" stopColor="#1E293B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Small Gold Verified Star */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-xs">
              <span className="text-[8px] text-white font-black">★</span>
            </div>
          </div>

          {/* Brand & System Names */}
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-sans">
                {lang === 'bn' ? 'হিসাব কিতাব' : 'HISAB KITAB'}
              </h1>
              <span className="text-[11px] font-bold font-mono tracking-widest text-indigo-700 uppercase">
                Finance & Audit System
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-700 leading-snug mt-0.5">
              {title || (lang === 'bn' ? 'অফিসিয়াল আর্থিক অডিট ও সমন্বিত খতিয়ান বিবরণী' : 'Official Financial Statement & Audit Ledger')}
            </p>

            <p className="text-[10px] text-slate-500 leading-normal">
              {subtitle || (lang === 'bn' ? 'ব্যক্তিগত ও কর্মক্ষেত্রের নির্ভুল সমন্বিত হিসাব সংরক্ষণ শাখা' : 'Integrated Personal & Corporate Accounts Registry')}
            </p>
          </div>
        </div>

        {/* Right: Official Verification & Document Reference Block */}
        <div className="text-right shrink-0">
          {/* Official Stamp Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Audited Document</span>
          </div>

          <div className="text-[10.5px] font-mono text-slate-700 space-y-0.5">
            <div>
              <span className="text-slate-400 font-sans">রেফারেন্স নং:</span>{' '}
              <strong className="text-indigo-950 font-bold">{generatedRef}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-sans">ইস্যুর তারিখ:</span>{' '}
              <span className="text-slate-900 font-semibold">{currentDate} [{currentTime}]</span>
            </div>
            <div>
              <span className="text-slate-400 font-sans">কারেন্সি বেস:</span>{' '}
              <strong className="text-emerald-700 font-bold">{currency === 'KWD' ? 'KWD (কুয়েতি দিনার)' : 'BDT (বাংলাদেশী টাকা)'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Tri-Color Accent Ribbon */}
      <div className="mt-2.5 h-1 w-full rounded-full bg-linear-to-r from-slate-900 via-indigo-600 via-emerald-500 to-amber-500" />

      {/* Sub-Header Context Strip (Account Name, Date Range) */}
      {(accountName || startDate || endDate) && (
        <div className="mt-1.5 pt-1 flex flex-wrap items-center justify-between text-[11px] text-slate-700">
          <div className="flex items-center gap-2">
            {accountName && (
              <span className="font-semibold text-slate-900">
                <span className="text-slate-500 font-normal">{lang === 'bn' ? 'অ্যাকাউন্ট / হেড:' : 'Account:'}</span>{' '}
                <span className="font-bold text-indigo-900">{accountName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10.5px] text-slate-600">
            <span>
              <span className="text-slate-500 font-sans">{lang === 'bn' ? 'হিসাব সময়কাল:' : 'Period:'}</span>{' '}
              <strong className="text-slate-900">{startDate ? startDate.replace(/-/g, '/') : '2026/01/01'} to {endDate ? endDate.replace(/-/g, '/') : currentDate}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface ReportWatermarkBackgroundProps {
  text?: string;
  opacity?: number;
  showWatermark?: boolean;
}

/**
 * Modern aesthetic financial security watermark and background guilloche emblem.
 * Displays subtly on-screen and prints cleanly behind the financial statement table.
 */
export const ReportWatermarkBackground: React.FC<ReportWatermarkBackgroundProps> = ({
  text = 'HISAB KITAB OFFICIAL FINANCIAL RECORD • VERIFIED & AUDITED',
  opacity = 0.045,
  showWatermark = true,
}) => {
  if (!showWatermark) return null;

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0 report-watermark-layer"
      aria-hidden="true"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* 1. Large Central Circular Security Emblem (Guilloche Style) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-[500px] h-[500px] text-slate-900 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Guilloche Rings */}
          <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="300" cy="300" r="268" stroke="currentColor" strokeWidth="1" />
          <circle cx="300" cy="300" r="220" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="208" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx="300" cy="300" r="140" stroke="currentColor" strokeWidth="2" />
          <circle cx="300" cy="300" r="130" stroke="currentColor" strokeWidth="1" />

          {/* Curved Circular Text Path */}
          <path
            id="watermarkTextPath"
            d="M 120,300 A 180,180 0 1,1 480,300 A 180,180 0 1,1 120,300"
            fill="none"
          />
          <text fontSize="14" fontWeight="bold" letterSpacing="3.5" fill="currentColor">
            <textPath href="#watermarkTextPath" startOffset="0%">
              ★ HISAB KITAB OFFICIAL FINANCIAL RECORD ★ VERIFIED & AUDITED STATEMENT ★
            </textPath>
          </text>

          {/* Inner Heraldic Shield & Scales Emblem */}
          <g transform="translate(240, 240)">
            <polygon
              points="60,10 108,35 108,85 60,110 12,85 12,35"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M60 25 V95 M35 45 H85 M28 65 L43 45 L58 65 Z M62 65 L77 45 L92 65 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="60" cy="45" r="4" fill="currentColor" />
          </g>

          {/* Geometric Starburst Radial Rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="300"
              y1="300"
              x2={300 + 260 * Math.cos((deg * Math.PI) / 180)}
              y2={300 + 260 * Math.sin((deg * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 6"
            />
          ))}
        </svg>
      </div>

      {/* 2. Four-Corner Security Ornamental Filigree Brackets */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-slate-400" style={{ opacity: opacity * 2.5 }} />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-slate-400" style={{ opacity: opacity * 2.5 }} />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-slate-400" style={{ opacity: opacity * 2.5 }} />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-slate-400" style={{ opacity: opacity * 2.5 }} />

      {/* 3. Subtle Micro-text Security Border along edges */}
      <div
        className="absolute bottom-1 inset-x-8 text-center text-[7.5px] font-mono tracking-widest text-slate-400 uppercase"
        style={{ opacity: opacity * 3 }}
      >
        — HISAB KITAB FINANCIAL SYSTEM • AUTHENTIC AUDITED DOCUMENT • TAMPER PROTECTED —
      </div>
    </div>
  );
};
