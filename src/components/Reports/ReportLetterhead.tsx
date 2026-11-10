import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

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
 * Modern, aesthetic letterhead matching the user's exact specification:
 * - Left: Hisab Kitab [PRO] logo lockup with "• Personal & Work Finance"
 * - Right: Contact & location card with Juwel199431@gmail.com, +96569031679, Fahaheel, Al Ahmedi, Kuwait
 * - Green separator line + report context metadata
 */
export const ReportLetterhead: React.FC<ReportLetterheadProps> = ({
  accountName,
  startDate,
  endDate,
  currency = 'KWD',
  lang = 'bn',
  docRef,
  className = '',
}) => {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const generatedRef = docRef || `HK-${new Date().getFullYear()}-${Math.abs((startDate || '').charCodeAt(0) * 31 + (endDate || '').length * 17) % 9000 + 1000}`;

  return (
    <div className={`w-full pb-2 mb-3 ${className}`}>
      {/* Top Main Letterhead Row (Exact Match to Screenshot) */}
      <div className="flex justify-between items-center gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#064e3b] via-[#044e42] to-[#022c22] p-2 flex items-center justify-center shadow-md border border-emerald-500/30 shrink-0">
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
              <rect x="3" y="6" width="26" height="20" rx="4" stroke="#34d399" strokeWidth="2" fill="#064e3b" />
              <path d="M3 12 H29" stroke="#34d399" strokeWidth="1.5" />
              <rect x="7" y="16" width="10" height="2" rx="1" fill="#a7f3d0" />
              <rect x="7" y="20" width="6" height="2" rx="1" fill="#a7f3d0" />
              <circle cx="22" cy="18" r="3" fill="#fbbf24" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                Hisab Kitab
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Personal &amp; Work Finance</span>
            </div>
          </div>
        </div>

        {/* Right: Contact & Location Info Card */}
        <div className="bg-white/95 rounded-xl border border-slate-200/90 shadow-2xs px-3.5 py-2 text-right space-y-1 shrink-0">
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-medium text-slate-700">
            <span className="text-slate-800">Juwel199431@gmail.com</span>
            <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-slate-900">
            <span>+96569031679</span>
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-600">
            <span>Fahaheel, Al Ahmedi, Kuwait</span>
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* Horizontal Divider Line in vibrant emerald (#10b981) */}
      <div className="h-[2px] w-full bg-emerald-500 mt-3 mb-2 rounded-full" />

      {/* Report Context Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 px-1 pt-0.5">
        <div className="flex items-center gap-2">
          {accountName && (
            <span>
              <span className="text-slate-500 font-normal">{lang === 'bn' ? 'অ্যাকাউন্ট:' : 'Account:'}</span>{' '}
              <strong className="text-slate-900 font-bold">{accountName}</strong>
            </span>
          )}
          {accountName && <span className="text-slate-300">·</span>}
          <span>
            <span className="text-slate-500 font-normal">{lang === 'bn' ? 'সময়কাল:' : 'Period:'}</span>{' '}
            <strong className="text-slate-900 font-mono text-[11px]">
              {startDate ? startDate.replace(/-/g, '/') : '2026/01/01'} to {endDate ? endDate.replace(/-/g, '/') : currentDate}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
          <span>Ref: <strong className="text-emerald-800">{generatedRef}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Base: <strong className="text-slate-900">{currency}</strong></span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">{currentDate} [{currentTime}]</span>
        </div>
      </div>
    </div>
  );
};

interface ReportWatermarkBackgroundProps {
  opacity?: number;
  showWatermark?: boolean;
}

export const ReportWatermarkBackground: React.FC<ReportWatermarkBackgroundProps> = ({
  opacity = 0.08,
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
      {/* 1. Subtle Cyan/Teal Grid Paper Pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: opacity * 0.9 }}
      >
        <defs>
          <pattern
            id="reportGridPattern"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="#0d9488"
              strokeWidth="0.5"
              strokeOpacity="0.45"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#reportGridPattern)" />
      </svg>

      {/* 2. Concentric Radar Rings in Top-Right */}
      <div
        className="absolute top-16 right-24 pointer-events-none"
        style={{ opacity: opacity * 1.5 }}
      >
        <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
          <circle cx="170" cy="170" r="150" stroke="#10b981" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="170" cy="170" r="110" stroke="#10b981" strokeWidth="0.8" />
          <circle cx="170" cy="170" r="70" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3 4" />
          <circle cx="170" cy="170" r="30" stroke="#10b981" strokeWidth="1" />
        </svg>
      </div>

      {/* 3. Rising Financial Wave Curve with Soft Mint Gradient Fill */}
      <div
        className="absolute bottom-0 inset-x-0 h-[65%] pointer-events-none"
        style={{ opacity: opacity * 2.2 }}
      >
        <svg
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveMintGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d="M 0 420 C 180 370, 320 400, 480 390 C 650 380, 780 280, 880 210 C 940 170, 980 200, 1000 230 L 1000 500 L 0 500 Z"
            fill="url(#waveMintGrad)"
          />
          <path
            d="M 0 420 C 180 370, 320 400, 480 390 C 650 380, 780 280, 880 210 C 940 170, 980 200, 1000 230"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeOpacity="0.7"
          />

          <circle cx="370" cy="392" r="4.5" fill="#10b981" />
          <circle cx="750" cy="295" r="4.5" fill="#10b981" />
          <circle cx="880" cy="210" r="5" fill="#059669" />
        </svg>
      </div>
    </div>
  );
};

export const ReportOfficialFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full bg-[#031525] text-white border-t-2 border-emerald-500 px-6 py-3 flex items-center justify-between mt-6 ${className}`}>
      {/* Left: App Branding */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center p-0.5">
          <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
        </div>
        <div>
          <span className="text-xs font-bold text-white block leading-tight">Hisab Kitab</span>
          <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase block mt-0.5">
            SMART FINANCE MANAGEMENT
          </span>
        </div>
      </div>

      {/* Right: Location & Copyright */}
      <div className="text-right">
        <span className="text-xs font-bold text-white block leading-tight">Fahaheel, Al Ahmedi, Kuwait</span>
        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">© 2026 Hisab Kitab.</span>
      </div>
    </div>
  );
};
