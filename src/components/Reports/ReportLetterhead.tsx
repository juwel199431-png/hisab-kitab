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
 * Modern, aesthetic letterhead matching user's exact specification:
 * - Left: Hisab Kitab [PRO] logo lockup with "• Personal & Work Finance"
 * - Right: Contact & location card with Mail, Phone, MapPin icons BEFORE each text item
 * - Green separator line rendered via vector SVG (always prints in PDF)
 * - Removed duplicate context strip (Account, Period, Ref) as requested to eliminate clutter
 */
export const ReportLetterhead: React.FC<ReportLetterheadProps> = ({
  className = '',
}) => {
  return (
    <div className={`w-full pb-1 mb-2 ${className}`}>
      {/* Top Main Letterhead Row */}
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Personal &amp; Work Finance</span>
            </div>
          </div>
        </div>

        {/* Right: Contact & Location Info Card (Icons BEFORE text) */}
        <div className="bg-white/95 rounded-xl border border-slate-200/90 shadow-2xs px-3.5 py-2 text-left space-y-1 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-700">
            <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-slate-800">Juwel199431@gmail.com</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>+96569031679</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Fahaheel, Al Ahmedi, Kuwait</span>
          </div>
        </div>
      </div>

      {/* Horizontal Divider Line in vibrant emerald (#10b981) - Vector SVG guarantees print in PDF */}
      <div className="w-full mt-2.5 mb-1">
        <svg
          width="100%"
          height="3"
          viewBox="0 0 1000 3"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <line
            x1="0"
            y1="1.5"
            x2="1000"
            y2="1.5"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

interface ReportWatermarkBackgroundProps {
  opacity?: number;
  showWatermark?: boolean;
}

export const ReportWatermarkBackground: React.FC<ReportWatermarkBackgroundProps> = ({
  opacity = 0.15,
  showWatermark = true,
}) => {
  if (!showWatermark) return null;

  // Use a boosted base opacity so it's vividly visible on paper/PDF
  const effectiveOpacity = Math.max(opacity, 0.12);

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0 report-watermark-layer"
      aria-hidden="true"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        zIndex: 0,
      }}
    >
      {/* 1. Subtle Cyan/Teal Grid Paper Pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          opacity: effectiveOpacity * 1.2,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <defs>
          <pattern
            id="reportGridPatternV2"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#0d9488"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#reportGridPatternV2)" />
      </svg>

      {/* 2. Concentric Radar Rings in Top-Right */}
      <div
        className="absolute top-12 right-20 pointer-events-none"
        style={{
          opacity: effectiveOpacity * 1.8,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
          <circle cx="180" cy="180" r="160" stroke="#10b981" strokeWidth="1.2" strokeDasharray="5 7" />
          <circle cx="180" cy="180" r="120" stroke="#10b981" strokeWidth="1" />
          <circle cx="180" cy="180" r="80" stroke="#10b981" strokeWidth="1" strokeDasharray="4 5" />
          <circle cx="180" cy="180" r="36" stroke="#10b981" strokeWidth="1.2" />
        </svg>
      </div>

      {/* 3. Rising Financial Wave Curve with Soft Mint Gradient Fill */}
      <div
        className="absolute bottom-0 inset-x-0 h-[65%] pointer-events-none"
        style={{
          opacity: effectiveOpacity * 2.5,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <svg
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveMintGradV2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M 0 420 C 180 370, 320 400, 480 390 C 650 380, 780 280, 880 210 C 940 170, 980 200, 1000 230 L 1000 500 L 0 500 Z"
            fill="url(#waveMintGradV2)"
          />
          <path
            d="M 0 420 C 180 370, 320 400, 480 390 C 650 380, 780 280, 880 210 C 940 170, 980 200, 1000 230"
            stroke="#10b981"
            strokeWidth="3"
            strokeOpacity="0.85"
          />

          <circle cx="370" cy="392" r="5" fill="#10b981" />
          <circle cx="750" cy="295" r="5" fill="#10b981" />
          <circle cx="880" cy="210" r="5.5" fill="#059669" />
        </svg>
      </div>
    </div>
  );
};

export const ReportOfficialFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`w-full bg-[#031525] text-white px-5 py-2.5 flex items-center justify-between ${className}`}
      style={{
        backgroundColor: '#031525',
        borderTop: '2.5px solid #10b981',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Left: App Branding */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-emerald-600/40 border border-emerald-400/50 flex items-center justify-center p-0.5">
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
