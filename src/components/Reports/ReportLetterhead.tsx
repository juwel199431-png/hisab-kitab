import React from 'react';
import { Mail, Phone, MapPin, Camera, UserCheck } from 'lucide-react';
import { renderReportLogoIcon, LogoType } from './ReportLogoModal';

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
  logoType?: LogoType;
  customLogoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  companyBadge?: string;
  userName?: string;
  profileTitle?: string;
  adaptiveDark?: boolean;
  onOpenLogoModal?: () => void;
}

/**
 * Modern, aesthetic letterhead:
 * - Left: Customizable Logo lockup with brand name, badge, profile title, and optional account holder name
 * - Right: Contact & location card with modern colored badges
 * - Vector SVG divider guaranteed to render cleanly in PDF & print
 */
export const ReportLetterhead: React.FC<ReportLetterheadProps> = ({
  className = '',
  lang = 'bn',
  logoType = 'default',
  customLogoUrl,
  companyName = 'Hisab Kitab',
  companyTagline = 'Personal & Work Finance',
  companyBadge = 'PRO',
  userName = '',
  profileTitle = '',
  adaptiveDark = false,
  onOpenLogoModal,
}) => {
  const cleanUserName = userName.trim();
  const cleanProfileTitle = profileTitle.trim();
  const effectiveTagline = cleanProfileTitle || companyTagline || 'Personal & Work Finance';

  return (
    <div className={`w-full pb-1 ${className}`}>
      {/* Top Main Letterhead Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 relative group">
          <div className="relative">
            {renderReportLogoIcon(logoType, customLogoUrl, 'w-12 h-12')}
            {onOpenLogoModal && (
              <button
                type="button"
                onClick={onOpenLogoModal}
                className="no-print absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 p-1 rounded-full shadow-md border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group-hover:scale-110"
                title={lang === 'bn' ? 'লোগো পরিবর্তন করুন' : 'Change Logo'}
              >
                <Camera className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${
                  adaptiveDark ? 'text-slate-900 dark:text-white' : 'text-slate-900'
                }`}
              >
                {companyName || 'Hisab Kitab'}
              </span>
              {(companyBadge || 'PRO') && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  {companyBadge || 'PRO'}
                </span>
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 text-xs font-medium mt-0.5 ${
                adaptiveDark ? 'text-slate-600 dark:text-slate-300' : 'text-slate-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>{effectiveTagline}</span>
            </div>
            {cleanUserName && (
              <div
                className={`flex items-center gap-1.5 text-[11px] font-bold mt-1 ${
                  adaptiveDark ? 'text-emerald-800 dark:text-emerald-300' : 'text-emerald-800'
                }`}
              >
                <UserCheck className="w-3 h-3 shrink-0" />
                <span>
                  {lang === 'bn' ? 'হিসাবধারী:' : 'Account Holder:'} {cleanUserName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Contact & Location Info Card */}
        <div
          className={`rounded-xl border shadow-xs px-3.5 py-2 text-left space-y-1.5 shrink-0 ${
            adaptiveDark
              ? 'bg-white/95 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
              : 'bg-white/95 border-slate-200'
          }`}
          style={{
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          {/* Email row */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#ccfbf1',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <Mail className="w-3 h-3 text-[#0f766e]" />
            </span>
            <span
              className={`font-semibold text-[11.5px] tracking-tight ${
                adaptiveDark ? 'text-[#0f766e] dark:text-teal-300' : 'text-[#0f766e]'
              }`}
            >
              Juwel199431@gmail.com
            </span>
          </div>

          {/* Mobile row */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#d1fae5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <Phone className="w-3 h-3 text-[#065f46]" />
            </span>
            <span
              className={`font-bold text-[12px] tracking-tight ${
                adaptiveDark ? 'text-slate-900 dark:text-white' : 'text-slate-900'
              }`}
            >
              +96569031679
            </span>
          </div>

          {/* Address row */}
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <MapPin className="w-3 h-3 text-[#0369a1]" />
            </span>
            <span
              className={`font-medium tracking-tight ${
                adaptiveDark ? 'text-slate-700 dark:text-slate-300' : 'text-slate-700'
              }`}
            >
              Fahaheel, Al Ahmedi, Kuwait
            </span>
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

/**
 * Crisp vector background matching Screenshot 2026-11-10 141839 exactly:
 * - Subtle teal/cyan grid pattern
 * - Concentric radar rings top-right
 * - Rising financial growth wave curve with mint gradient fill & data nodes at bottom
 */
export const ReportWatermarkBackground: React.FC<ReportWatermarkBackgroundProps> = ({
  opacity = 0.22,
  showWatermark = true,
}) => {
  if (!showWatermark) return null;

  // Use a boosted base opacity so it's vividly visible on paper/PDF
  const effectiveOpacity = Math.max(opacity, 0.18);

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0 report-watermark-layer report-background-image"
      aria-hidden="true"
      style={{
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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
          opacity: effectiveOpacity * 1.3,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <defs>
          <pattern
            id="reportGridPatternV3"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#0d9488"
              strokeWidth="0.8"
              strokeOpacity="0.45"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#reportGridPatternV3)" />
      </svg>

      {/* 2. Concentric Radar Rings in Top-Right */}
      <div
        className="absolute top-10 right-16 pointer-events-none"
        style={{
          opacity: effectiveOpacity * 2.0,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <svg width="380" height="380" viewBox="0 0 380 380" fill="none">
          <circle cx="190" cy="190" r="170" stroke="#10b981" strokeWidth="1.4" strokeDasharray="6 8" />
          <circle cx="190" cy="190" r="125" stroke="#10b981" strokeWidth="1.2" />
          <circle cx="190" cy="190" r="85" stroke="#10b981" strokeWidth="1.2" strokeDasharray="4 6" />
          <circle cx="190" cy="190" r="40" stroke="#10b981" strokeWidth="1.4" />
        </svg>
      </div>

      {/* 3. Rising Financial Wave Curve with Soft Mint Gradient Fill */}
      <div
        className="absolute bottom-0 inset-x-0 h-[68%] pointer-events-none"
        style={{
          opacity: effectiveOpacity * 2.8,
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
            <linearGradient id="waveMintGradV3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          <path
            d="M 0 420 C 180 370, 320 400, 480 390 C 650 380, 780 280, 880 210 C 940 170, 980 200, 1000 230 L 1000 500 L 0 500 Z"
            fill="url(#waveMintGradV3)"
          />
          <path
            d="M 0 420 C 180 370, 320 400, 480 390 C 650 380, 780 280, 880 210 C 940 170, 980 200, 1000 230"
            stroke="#10b981"
            strokeWidth="3.2"
            strokeOpacity="0.9"
          />

          <circle cx="370" cy="392" r="5.5" fill="#10b981" />
          <circle cx="750" cy="295" r="5.5" fill="#10b981" />
          <circle cx="880" cy="210" r="6" fill="#059669" />
        </svg>
      </div>
    </div>
  );
};

export const ReportOfficialFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`w-full bg-[#031525] text-white px-5 py-2.5 flex items-center justify-between break-inside-avoid print-official-footer ${className}`}
      style={{
        backgroundColor: '#031525',
        borderTop: '2.5px solid #10b981',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      {/* Left: App Branding */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center p-0.5"
          style={{
            backgroundColor: 'rgba(5, 150, 105, 0.4)',
            border: '1px solid rgba(52, 211, 153, 0.5)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-xs"
            style={{
              backgroundColor: '#34d399',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        </div>
        <div>
          <span className="text-xs font-bold text-white block leading-tight">Hisab Kitab</span>
          <span
            className="text-[9px] font-black tracking-widest uppercase block mt-0.5"
            style={{
              color: '#34d399',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
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
