import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Printer,
  Maximize2,
  FileText,
  Eye,
  Check,
  Sparkles,
  ArrowRight,
  Info,
  Save,
  Bold,
  Italic,
  Type,
  AlignLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { LogoType } from './ReportLogoModal';

export interface ReportPageSettings {
  marginTop: number; // in mm
  marginBottom: number; // in mm
  marginLeft: number; // in mm
  marginRight: number; // in mm
  orientation: 'portrait' | 'landscape';
  scale: number; // in %
  fontSizePt: number; // in pt
  // Column Widths (in %, normalized to 100%)
  slWidth: number;
  dateWidth: number;
  accountWidth: number;
  remarksWidth: number;
  debitWidth: number;
  creditWidth: number;
  balanceWidth: number;
  // Font styling & customization
  fontFamily: 'system' | 'inter' | 'serif' | 'mono';
  isBold: boolean;
  isItalic: boolean;
  rowPadding: 'compact' | 'normal' | 'relaxed';
  // Letterhead & Background Watermark
  showLetterhead: boolean;
  showWatermark: boolean;
  watermarkOpacity: number; // 0.08 (Subtle), 0.16 (Normal), 0.26 (Bold)
  // Logo & Branding Customization
  logoType?: LogoType;
  customLogoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  companyBadge?: string;
}

export const DEFAULT_PAGE_SETTINGS: ReportPageSettings = {
  marginTop: 5,
  marginBottom: 5,
  marginLeft: 5,
  marginRight: 5,
  orientation: 'portrait',
  scale: 100,
  fontSizePt: 9.5,
  slWidth: 4,
  dateWidth: 12,
  accountWidth: 16,
  remarksWidth: 37,
  debitWidth: 10,
  creditWidth: 10,
  balanceWidth: 11,
  fontFamily: 'system',
  isBold: false,
  isItalic: false,
  rowPadding: 'normal',
  showLetterhead: true,
  showWatermark: true,
  watermarkOpacity: 0.16,
  logoType: 'default',
  customLogoUrl: '',
  companyName: 'Hisab Kitab',
  companyTagline: 'Personal & Work Finance',
  companyBadge: 'PRO',
};

export const PAGE_SETTINGS_STORAGE_KEY = 'hisab_kitab_report_page_settings_v7';
export const PAGE_SETTINGS_BY_HEAD_STORAGE_KEY = 'hisab_kitab_report_page_settings_by_head_v1';
export const REPORT_BRANDING_STORAGE_KEY = 'hisab_kitab_report_branding_v1';

const BRANDING_KEYS: (keyof ReportPageSettings)[] = [
  'logoType',
  'customLogoUrl',
  'companyName',
  'companyTagline',
  'companyBadge',
];

const stripBranding = (settings: Partial<ReportPageSettings>): Partial<ReportPageSettings> => {
  const copy: Partial<ReportPageSettings> = { ...settings };
  BRANDING_KEYS.forEach((k) => {
    delete copy[k];
  });
  return copy;
};

export interface ReportBrandingSettings {
  logoType?: LogoType;
  customLogoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  companyBadge?: string;
}

const migrateLegacySettingsIfNeeded = () => {
  try {
    const hasPerHead = localStorage.getItem(PAGE_SETTINGS_BY_HEAD_STORAGE_KEY) !== null;
    const hasBranding = localStorage.getItem(REPORT_BRANDING_STORAGE_KEY) !== null;
    if (hasPerHead && hasBranding) return;

    const legacyRaw = localStorage.getItem(PAGE_SETTINGS_STORAGE_KEY);
    if (!legacyRaw) {
      if (!hasPerHead) {
        localStorage.setItem(PAGE_SETTINGS_BY_HEAD_STORAGE_KEY, JSON.stringify({}));
      }
      return;
    }

    const parsed = JSON.parse(legacyRaw) as Partial<ReportPageSettings>;
    if (!hasBranding) {
      const branding: ReportBrandingSettings = {
        logoType: parsed.logoType || DEFAULT_PAGE_SETTINGS.logoType,
        customLogoUrl: parsed.customLogoUrl || '',
        companyName: parsed.companyName || DEFAULT_PAGE_SETTINGS.companyName,
        companyTagline: parsed.companyTagline || DEFAULT_PAGE_SETTINGS.companyTagline,
        companyBadge: parsed.companyBadge || DEFAULT_PAGE_SETTINGS.companyBadge,
      };
      localStorage.setItem(REPORT_BRANDING_STORAGE_KEY, JSON.stringify(branding));
    }
    if (!hasPerHead) {
      const layoutOnly = stripBranding(parsed);
      const initialMap = Object.keys(layoutOnly).length > 0 ? { all: layoutOnly } : {};
      localStorage.setItem(PAGE_SETTINGS_BY_HEAD_STORAGE_KEY, JSON.stringify(initialMap));
    }
  } catch {
    // ignore migration failure
  }
};

export const loadReportBrandingFromStorage = (): ReportBrandingSettings => {
  migrateLegacySettingsIfNeeded();
  try {
    const raw = localStorage.getItem(REPORT_BRANDING_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ReportBrandingSettings;
    }
  } catch {
    // fallback
  }
  return {
    logoType: DEFAULT_PAGE_SETTINGS.logoType,
    customLogoUrl: DEFAULT_PAGE_SETTINGS.customLogoUrl,
    companyName: DEFAULT_PAGE_SETTINGS.companyName,
    companyTagline: DEFAULT_PAGE_SETTINGS.companyTagline,
    companyBadge: DEFAULT_PAGE_SETTINGS.companyBadge,
  };
};

export const saveReportBrandingToStorage = (branding: ReportBrandingSettings): boolean => {
  try {
    localStorage.setItem(REPORT_BRANDING_STORAGE_KEY, JSON.stringify(branding));
    return true;
  } catch (err) {
    console.error('Failed to save report branding to localStorage:', err);
    return false;
  }
};

export const getSavedHeadSettingsMap = (): Record<string, Partial<ReportPageSettings>> => {
  migrateLegacySettingsIfNeeded();
  try {
    const raw = localStorage.getItem(PAGE_SETTINGS_BY_HEAD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, Partial<ReportPageSettings>>;
      }
    }
  } catch {
    // fallback
  }
  return {};
};

export const getCustomizedHeadIds = (): string[] => {
  const map = getSavedHeadSettingsMap();
  return Object.keys(map).filter((k) => map[k] && Object.keys(map[k]).length > 0);
};

export const loadSavedPageSettingsForHead = (headId: string = 'all'): ReportPageSettings => {
  const branding = loadReportBrandingFromStorage();
  const map = getSavedHeadSettingsMap();
  const headLayout = map[headId] ? stripBranding(map[headId]) : {};
  return {
    ...DEFAULT_PAGE_SETTINGS,
    ...branding,
    ...headLayout,
  };
};

export const savePageSettingsForHead = (headId: string, settings: ReportPageSettings): boolean => {
  try {
    const map = getSavedHeadSettingsMap();
    map[headId] = stripBranding(settings);
    localStorage.setItem(PAGE_SETTINGS_BY_HEAD_STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch (err) {
    console.error(`Failed to save page settings for head "${headId}":`, err);
    return false;
  }
};

export const resetPageSettingsForHead = (headId: string): ReportPageSettings => {
  try {
    const map = getSavedHeadSettingsMap();
    delete map[headId];
    localStorage.setItem(PAGE_SETTINGS_BY_HEAD_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error(`Failed to reset page settings for head "${headId}":`, err);
  }
  const branding = loadReportBrandingFromStorage();
  return {
    ...DEFAULT_PAGE_SETTINGS,
    ...branding,
  };
};

export const loadSavedPageSettings = (): ReportPageSettings => loadSavedPageSettingsForHead('all');

export const savePageSettingsToStorage = (settings: ReportPageSettings, headId: string = 'all'): boolean =>
  savePageSettingsForHead(headId, settings);

/**
 * Guarantees column percentages always add up cleanly to 100% without hidden drift.
 */
export const computeNormalizedColWidths = (s: ReportPageSettings) => {
  const rawSl = Math.max(3, s.slWidth || 4);
  const rawDate = Math.max(7, s.dateWidth || 12);
  const rawAccount = Math.max(10, s.accountWidth || 16);
  const rawDebit = Math.max(5, s.debitWidth || 10);
  const rawCredit = Math.max(5, s.creditWidth || 10);
  const rawBalance = Math.max(7, s.balanceWidth || 11);
  const rawRemarks = Math.max(16, s.remarksWidth || 37);

  const sum = rawSl + rawDate + rawAccount + rawDebit + rawCredit + rawBalance + rawRemarks;
  const factor = 100 / sum;

  const sl = Number((rawSl * factor).toFixed(1));
  const date = Number((rawDate * factor).toFixed(1));
  const account = Number((rawAccount * factor).toFixed(1));
  const debit = Number((rawDebit * factor).toFixed(1));
  const credit = Number((rawCredit * factor).toFixed(1));
  const balance = Number((rawBalance * factor).toFixed(1));
  const remarks = Number(Math.max(15, 100 - (sl + date + account + debit + credit + balance)).toFixed(1));

  return { sl, date, account, debit, credit, balance, remarks };
};

export interface HeadScopeMeta {
  id: string;
  label: string;
}

interface ReportPageSettingsPanelProps {
  settings: ReportPageSettings;
  onChange: (updates: Partial<ReportPageSettings>) => void;
  onReset: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  isLivePreview: boolean;
  onToggleLivePreview: () => void;
  onPrint: () => void;
  lang: 'bn' | 'en';
  onOpenLogoModal?: () => void;
  activeHeadId: string;
  activeHeadLabel: string;
  hasCustomHeadSettings: boolean;
  customizedHeads?: HeadScopeMeta[];
  onCopyFromHead?: (sourceHeadId: string) => void;
  pageCount?: number;
  recordCount?: number;
}

type StudioTab = 'page' | 'table' | 'branding';

export const ReportPageSettingsPanel: React.FC<ReportPageSettingsPanelProps> = ({
  settings,
  onChange,
  onReset,
  onSave,
  isSaved = false,
  isOpen,
  onToggle,
  isLivePreview,
  onToggleLivePreview,
  onPrint,
  lang,
  onOpenLogoModal,
  activeHeadId,
  activeHeadLabel,
  hasCustomHeadSettings,
  customizedHeads = [],
  onCopyFromHead,
  pageCount,
  recordCount,
}) => {
  const [saveToast, setSaveToast] = useState(false);
  const [activeTab, setActiveTab] = useState<StudioTab>('page');
  const [uniformMargins, setUniformMargins] = useState<boolean>(() =>
    settings.marginTop === settings.marginBottom &&
    settings.marginLeft === settings.marginRight &&
    settings.marginTop === settings.marginLeft
  );

  const normalizedCols = useMemo(() => computeNormalizedColWidths(settings), [settings]);
  const otherCustomizedHeads = customizedHeads.filter((h) => h.id !== activeHeadId);

  const handleExplicitSave = () => {
    savePageSettingsForHead(activeHeadId, settings);
    if (onSave) onSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  const clampMargin = (val: number) => Math.max(0, Math.min(25, Math.round(val)));

  const handleUniformMarginChange = (val: number) => {
    const clean = clampMargin(val);
    onChange({
      marginTop: clean,
      marginBottom: clean,
      marginLeft: clean,
      marginRight: clean,
    });
  };

  // Balanced column update helper so total always stays 100% cleanly
  const updateBalancedColumn = (
    key: 'dateWidth' | 'accountWidth' | 'debitWidth' | 'remarksWidth',
    value: number
  ) => {
    const sl = settings.slWidth || 4;
    const balance = settings.balanceWidth || 11;

    if (key === 'remarksWidth') {
      const targetRemarks = Math.max(20, Math.min(54, value));
      const fixedSum = sl + settings.dateWidth + settings.debitWidth + settings.creditWidth + balance;
      const maxAvailable = 100 - fixedSum - 10; // leave at least 10% for account
      const clampedRemarks = Math.min(targetRemarks, Math.max(20, maxAvailable));
      const nextAccount = Number(Math.max(10, 100 - fixedSum - clampedRemarks).toFixed(1));
      onChange({ remarksWidth: clampedRemarks, accountWidth: nextAccount });
      return;
    }

    if (key === 'debitWidth') {
      const targetDebit = Math.max(6, Math.min(14, value));
      const fixedOther = sl + settings.dateWidth + settings.accountWidth + balance;
      const nextRemarks = Number(Math.max(18, 100 - fixedOther - targetDebit * 2).toFixed(1));
      onChange({ debitWidth: targetDebit, creditWidth: targetDebit, remarksWidth: nextRemarks });
      return;
    }

    if (key === 'dateWidth') {
      const targetDate = Math.max(8, Math.min(22, value));
      const fixedOther = sl + settings.accountWidth + settings.debitWidth + settings.creditWidth + balance;
      const nextRemarks = Number(Math.max(18, 100 - fixedOther - targetDate).toFixed(1));
      onChange({ dateWidth: targetDate, remarksWidth: nextRemarks });
      return;
    }

    if (key === 'accountWidth') {
      const targetAcc = Math.max(10, Math.min(28, value));
      const fixedOther = sl + settings.dateWidth + settings.debitWidth + settings.creditWidth + balance;
      const nextRemarks = Number(Math.max(18, 100 - fixedOther - targetAcc).toFixed(1));
      onChange({ accountWidth: targetAcc, remarksWidth: nextRemarks });
    }
  };

  // Presets
  const applyPresetCompact = () => {
    setUniformMargins(true);
    onChange({
      marginTop: 2,
      marginBottom: 2,
      marginLeft: 2,
      marginRight: 2,
      orientation: 'portrait',
      scale: 100,
      fontSizePt: 9,
      rowPadding: 'compact',
      slWidth: 4,
      dateWidth: 11,
      accountWidth: 16,
      debitWidth: 9,
      creditWidth: 9,
      balanceWidth: 11,
      remarksWidth: 40,
      fontFamily: 'system',
      isBold: false,
      isItalic: false,
    });
  };

  const applyPresetStandard = () => {
    setUniformMargins(true);
    onChange({
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      orientation: 'portrait',
      scale: 100,
      fontSizePt: 9.5,
      rowPadding: 'normal',
      slWidth: 4,
      dateWidth: 12,
      accountWidth: 16,
      debitWidth: 10,
      creditWidth: 10,
      balanceWidth: 11,
      remarksWidth: 37,
      fontFamily: 'system',
      isBold: false,
      isItalic: false,
    });
  };

  const applyPresetLandscape = () => {
    setUniformMargins(true);
    onChange({
      marginTop: 4,
      marginBottom: 4,
      marginLeft: 4,
      marginRight: 4,
      orientation: 'landscape',
      scale: 100,
      fontSizePt: 9.5,
      rowPadding: 'normal',
      slWidth: 3.5,
      dateWidth: 10.5,
      accountWidth: 15,
      debitWidth: 8.5,
      creditWidth: 8.5,
      balanceWidth: 10,
      remarksWidth: 44,
      fontFamily: 'system',
      isBold: false,
      isItalic: false,
    });
  };

  const avgMargin = Math.round(
    (settings.marginTop + settings.marginBottom + settings.marginLeft + settings.marginRight) / 4
  );
  const areAllMarginsEqual =
    settings.marginTop === settings.marginBottom &&
    settings.marginLeft === settings.marginRight &&
    settings.marginTop === settings.marginLeft;

  // Percentage insets for the mini A4 visual diagram (A4 width 210/297)
  const paperW = settings.orientation === 'portrait' ? 210 : 297;
  const paperH = settings.orientation === 'portrait' ? 297 : 210;
  const topPct = Math.min(20, (settings.marginTop / paperH) * 100);
  const bottomPct = Math.min(20, (settings.marginBottom / paperH) * 100);
  const leftPct = Math.min(20, (settings.marginLeft / paperW) * 100);
  const rightPct = Math.min(20, (settings.marginRight / paperW) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden no-print transition-all">
      {/* Compact Header Strip */}
      <div className="px-4 sm:px-5 py-3.5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/25 flex items-center justify-center border border-indigo-400/35 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                {lang === 'bn' ? 'প্রিন্ট ও PDF পেইজ স্টুডিও' : 'Print & PDF Page Studio'}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 truncate max-w-[200px]">
                {lang === 'bn' ? `হেড: ${activeHeadLabel}` : `Head: ${activeHeadLabel}`}
              </span>
              {hasCustomHeadSettings ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {lang === 'bn' ? 'আলাদা সেভড' : 'Custom Saved'}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300 border border-white/15">
                  {lang === 'bn' ? 'ডিফল্ট' : 'Default'}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-300/85 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                {settings.orientation === 'portrait'
                  ? lang === 'bn' ? 'A4 লম্বালম্বি' : 'A4 Portrait'
                  : lang === 'bn' ? 'A4 আড়াআড়ি' : 'A4 Landscape'}
              </span>
              <span className="text-slate-500">•</span>
              <span>
                {areAllMarginsEqual
                  ? lang === 'bn' ? `মার্জিন: ${settings.marginTop}mm` : `Margin: ${settings.marginTop}mm`
                  : lang === 'bn'
                  ? `মার্জিন: ${settings.marginTop}/${settings.marginBottom}/${settings.marginLeft}/${settings.marginRight}mm`
                  : `Margins: ${settings.marginTop}/${settings.marginBottom}/${settings.marginLeft}/${settings.marginRight}mm`}
              </span>
              <span className="text-slate-500">•</span>
              <span>
                {settings.fontSizePt}pt{settings.isBold ? ' Bold' : ''} · {settings.scale}%
              </span>
              {typeof pageCount === 'number' && pageCount > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-300 font-semibold">
                    {lang === 'bn' ? `মোট ${pageCount} পাতা` : `${pageCount} Pages`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExplicitSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              saveToast || isSaved
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/60'
            }`}
            title={lang === 'bn' ? `"${activeHeadLabel}" এর জন্য সেভ করুন` : `Save for "${activeHeadLabel}"`}
          >
            {saveToast ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveToast ? (lang === 'bn' ? 'সেভ হয়েছে!' : 'Saved!') : (lang === 'bn' ? 'সেভ' : 'Save')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLivePreview}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isLivePreview
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isLivePreview ? (lang === 'bn' ? 'প্রিভিউ বন্ধ' : 'Hide Preview') : (lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview')}</span>
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <span>{isOpen ? (lang === 'bn' ? 'গুটিয়ে নিন' : 'Close') : (lang === 'bn' ? 'কাস্টমাইজ করুন' : 'Customize')}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Studio Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {/* Per-Head Scope Bar + Copy/Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/35 border border-indigo-200/70 dark:border-indigo-800/50 text-xs">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                {lang === 'bn' ? (
                  <>
                    শুধুমাত্র <strong className="font-black">{activeHeadLabel}</strong> হেডের জন্য প্রযোজ্য — সব পরিবর্তন সরাসরি লাইভ ও PDF-এ কাজ করবে।
                  </>
                ) : (
                  <>
                    Scoped exclusively to <strong className="font-black">{activeHeadLabel}</strong> — changes apply accurately 1:1 to preview and PDF.
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onCopyFromHead && otherCustomizedHeads.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) onCopyFromHead(e.target.value);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:outline-hidden cursor-pointer"
                  >
                    <option value="">{lang === 'bn' ? 'অন্য হেড থেকে কপি করুন...' : 'Copy from head...'}</option>
                    {otherCustomizedHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={onReset}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* 2-Column Studio Grid: Controls (Left 8) + Live Visual Paper Diagram (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT: Clean 3-Tab Studio Controls */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-2xs">
              {/* Tab Navigation */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                {[
                  {
                    id: 'page' as StudioTab,
                    icon: Maximize2,
                    labelBn: 'পেইজ ও মার্জিন',
                    labelEn: 'Page & Margins',
                  },
                  {
                    id: 'table' as StudioTab,
                    icon: Type,
                    labelBn: 'ফন্ট ও টেবিল',
                    labelEn: 'Font & Table',
                  },
                  {
                    id: 'branding' as StudioTab,
                    icon: ShieldCheck,
                    labelBn: 'লেটারহেড ও লোগো',
                    labelEn: 'Header & Logo',
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: PAGE, PRESETS & MARGINS */}
              {activeTab === 'page' && (
                <div className="space-y-4">
                  {/* 1-Click Smart Presets */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'bn' ? '১-ক্লিক স্মার্ট প্রিসেট' : '1-Click Smart Presets'}</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={applyPresetCompact}
                        className="p-2.5 rounded-xl border text-left transition-all cursor-pointer bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800/60"
                      >
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                          {lang === 'bn' ? 'কমপ্যাক্ট ফিট (২ মিমি)' : 'Compact Fit (2mm)'}
                        </span>
                        <span className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 block mt-0.5">
                          {lang === 'bn' ? '১ পাতায় সর্বোচ্চ ডাটা ধরবে' : 'Maximum rows per page'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={applyPresetStandard}
                        className="p-2.5 rounded-xl border text-left transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {lang === 'bn' ? 'স্ট্যান্ডার্ড A4 (৮ মিমি)' : 'Official Standard (8mm)'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {lang === 'bn' ? 'ক্লাসিক অফিসিয়াল মার্জিন' : 'Balanced print margin'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={applyPresetLandscape}
                        className="p-2.5 rounded-xl border text-left transition-all cursor-pointer bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-100/80 dark:hover:bg-teal-900/40 border-teal-200 dark:border-teal-800/60"
                      >
                        <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">
                          {lang === 'bn' ? 'চওড়া ল্যান্ডস্কেপ' : 'Wide Landscape'}
                        </span>
                        <span className="text-[10px] text-teal-700/80 dark:text-teal-300/80 block mt-0.5">
                          {lang === 'bn' ? 'বড় বিবরণ ও অনেক কলামের জন্য' : 'Ideal for wide remarks'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Orientation + Content Scale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Orientation */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {lang === 'bn' ? 'কাগজের দিক (Orientation)' : 'Paper Orientation'}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onChange({ orientation: 'portrait' })}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            settings.orientation === 'portrait'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="w-2.5 h-3.5 border-[1.5px] border-current rounded-[2px]" />
                          <span>{lang === 'bn' ? 'লম্বালম্বি' : 'Portrait'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange({ orientation: 'landscape' })}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            settings.orientation === 'landscape'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="w-3.5 h-2.5 border-[1.5px] border-current rounded-[2px]" />
                          <span>{lang === 'bn' ? 'আড়াআড়ি' : 'Landscape'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Scale / Zoom */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {lang === 'bn' ? 'পেইজ জুম / স্কেল' : 'Content Scale'}
                        </span>
                        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {settings.scale}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={70}
                        max={120}
                        step={1}
                        value={settings.scale}
                        onChange={(e) => onChange({ scale: Number(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-1">
                        {[85, 95, 100, 110].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => onChange({ scale: val })}
                            className={`flex-1 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                              settings.scale === val
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Smart Margin Controls */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{lang === 'bn' ? 'কাগজের মার্জিন (০ – ২৫ মিমি)' : 'Page Margins (0 – 25 mm)'}</span>
                      </span>

                      <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setUniformMargins(true);
                            handleUniformMarginChange(avgMargin);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            uniformMargins
                              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {lang === 'bn' ? 'সব পাশ একসাথে' : 'Uniform'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUniformMargins(false)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            !uniformMargins
                              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {lang === 'bn' ? '৪ পাশ আলাদা' : '4-Side Custom'}
                        </button>
                      </div>
                    </div>

                    {uniformMargins ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleUniformMarginChange(avgMargin - 1)}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            aria-label="Decrease Margin"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1">
                            <input
                              type="range"
                              min={0}
                              max={25}
                              step={1}
                              value={avgMargin}
                              onChange={(e) => handleUniformMarginChange(Number(e.target.value))}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUniformMarginChange(avgMargin + 1)}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            aria-label="Increase Margin"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-14 text-right font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {avgMargin} mm
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[0, 2, 5, 8, 12, 16].map((mm) => (
                            <button
                              key={mm}
                              type="button"
                              onClick={() => handleUniformMarginChange(mm)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                                areAllMarginsEqual && settings.marginTop === mm
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {mm}mm
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'marginTop' as const, labelBn: 'উপরে (Top)', labelEn: 'Top' },
                          { key: 'marginBottom' as const, labelBn: 'নিচে (Bottom)', labelEn: 'Bottom' },
                          { key: 'marginLeft' as const, labelBn: 'বামে (Left)', labelEn: 'Left' },
                          { key: 'marginRight' as const, labelBn: 'ডানে (Right)', labelEn: 'Right' },
                        ].map((m) => (
                          <div key={m.key} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {lang === 'bn' ? m.labelBn : m.labelEn}
                              </span>
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {settings[m.key]} mm
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onChange({ [m.key]: clampMargin(settings[m.key] - 1) })}
                                className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={25}
                                step={1}
                                value={settings[m.key]}
                                onChange={(e) => onChange({ [m.key]: clampMargin(Number(e.target.value)) })}
                                className="flex-1 accent-indigo-600 cursor-pointer"
                              />
                              <button
                                type="button"
                                onClick={() => onChange({ [m.key]: clampMargin(settings[m.key] + 1) })}
                                className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY, ROW DENSITY & COLUMN WIDTHS */}
              {activeTab === 'table' && (
                <div className="space-y-4">
                  {/* Font Size + Row Density */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {lang === 'bn' ? 'লেখার সাইজ (Font Size)' : 'Font Size'}
                        </span>
                        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {settings.fontSizePt} pt
                        </span>
                      </div>
                      <input
                        type="range"
                        min={7.5}
                        max={14}
                        step={0.5}
                        value={settings.fontSizePt}
                        onChange={(e) => onChange({ fontSizePt: Number(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { pt: 8.5, label: '8.5pt' },
                          { pt: 9.5, label: '9.5pt' },
                          { pt: 11, label: '11pt' },
                          { pt: 12.5, label: '12.5pt' },
                        ].map((chip) => (
                          <button
                            key={chip.pt}
                            type="button"
                            onClick={() => onChange({ fontSizePt: chip.pt })}
                            className={`py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                              settings.fontSizePt === chip.pt
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {lang === 'bn' ? 'রো-এর উচ্চতা / ফাঁকা জায়গা' : 'Row Density / Spacing'}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'compact' as const, bn: 'ঘন', en: 'Compact' },
                          { id: 'normal' as const, bn: 'স্বাভাবিক', en: 'Normal' },
                          { id: 'relaxed' as const, bn: 'আরামদায়ক', en: 'Relaxed' },
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onChange({ rowPadding: r.id })}
                            className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              settings.rowPadding === r.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {lang === 'bn' ? r.bn : r.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Font Family + Bold/Italic */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
                        {lang === 'bn' ? 'ফন্ট:' : 'Font:'}
                      </span>
                      {[
                        { id: 'system' as const, bn: 'আধুনিক', en: 'Modern' },
                        { id: 'mono' as const, bn: 'মনোস্পেস', en: 'Mono' },
                        { id: 'serif' as const, bn: 'অফিসিয়াল (Serif)', en: 'Serif' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onChange({ fontFamily: f.id })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            settings.fontFamily === f.id
                              ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {lang === 'bn' ? f.bn : f.en}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onChange({ isBold: !settings.isBold })}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          settings.isBold
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'বোল্ড' : 'Bold'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange({ isItalic: !settings.isItalic })}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold italic inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          settings.isItalic
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'ইটালিক' : 'Italic'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Auto-Balanced Column Width Ratios */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <AlignLeft className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'bn' ? 'টেবিলের কলাম প্রস্থ (স্বয়ংক্রিয় ১০০% ব্যালেন্সড)' : 'Table Column Widths (Auto-Balanced 100%)'}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Total 100%
                      </span>
                    </div>

                    {/* Mini Visual Column Proportion Bar */}
                    <div className="h-2.5 w-full rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700 text-[0px]">
                      <div style={{ width: `${normalizedCols.sl}%` }} className="bg-slate-400" title="SL" />
                      <div style={{ width: `${normalizedCols.date}%` }} className="bg-indigo-500" title="Date" />
                      <div style={{ width: `${normalizedCols.account}%` }} className="bg-amber-500" title="Account" />
                      <div style={{ width: `${normalizedCols.debit + normalizedCols.credit}%` }} className="bg-rose-500" title="Debit/Credit" />
                      <div style={{ width: `${normalizedCols.balance}%` }} className="bg-teal-500" title="Balance" />
                      <div style={{ width: `${normalizedCols.remarks}%` }} className="bg-emerald-500" title="Remarks" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>{lang === 'bn' ? 'তারিখ (Date):' : 'Date:'}</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{normalizedCols.date}%</span>
                        </div>
                        <input
                          type="range"
                          min={8}
                          max={22}
                          step={0.5}
                          value={settings.dateWidth}
                          onChange={(e) => updateBalancedColumn('dateWidth', Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>{lang === 'bn' ? 'বিবরণ / মন্তব্য (Remarks):' : 'Remarks / Details:'}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{normalizedCols.remarks}%</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={54}
                          step={1}
                          value={settings.remarksWidth}
                          onChange={(e) => updateBalancedColumn('remarksWidth', Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>{lang === 'bn' ? 'অ্যাকাউন্ট / খাত (Account):' : 'Account:'}</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{normalizedCols.account}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={28}
                          step={0.5}
                          value={settings.accountWidth}
                          onChange={(e) => updateBalancedColumn('accountWidth', Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>{lang === 'bn' ? 'টাকা / পরিমাণ (Amount):' : 'Debit / Amount:'}</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{normalizedCols.debit}%</span>
                        </div>
                        <input
                          type="range"
                          min={6}
                          max={14}
                          step={0.5}
                          value={settings.debitWidth}
                          onChange={(e) => updateBalancedColumn('debitWidth', Number(e.target.value))}
                          className="w-full accent-rose-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LETTERHEAD, WATERMARK & BRANDING */}
              {activeTab === 'branding' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Letterhead Toggle */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {lang === 'bn' ? 'অফিসিয়াল লেটারহেড' : 'Official Letterhead'}
                        </span>
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          {lang === 'bn' ? 'উপরে লোগো ও নিচে ফুটার বার' : 'Top banner & bottom footer'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange({ showLetterhead: !settings.showLetterhead })}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          settings.showLetterhead
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {settings.showLetterhead ? (lang === 'bn' ? 'চালু' : 'ON') : (lang === 'bn' ? 'বন্ধ' : 'OFF')}
                      </button>
                    </div>

                    {/* Watermark Toggle */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {lang === 'bn' ? 'ব্যাকগ্রাউন্ড ওয়াটারমার্ক' : 'Security Watermark'}
                        </span>
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          {lang === 'bn' ? 'কাগজের ব্যাকগ্রাউন্ড সিল' : 'Background security pattern'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange({ showWatermark: !settings.showWatermark })}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          settings.showWatermark
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {settings.showWatermark ? (lang === 'bn' ? 'চালু' : 'ON') : (lang === 'bn' ? 'বন্ধ' : 'OFF')}
                      </button>
                    </div>
                  </div>

                  {/* Watermark Intensity */}
                  {settings.showWatermark && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {lang === 'bn' ? 'ওয়াটারমার্কের গাঢ়ত্ব (Opacity):' : 'Watermark Intensity:'}
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 0.08, bn: 'হালকা (Subtle)', en: 'Subtle' },
                          { val: 0.16, bn: 'স্বাভাবিক (Normal)', en: 'Normal' },
                          { val: 0.26, bn: 'স্পষ্ট (Bold)', en: 'Bold' },
                        ].map((op) => {
                          const isMatch = Math.abs((settings.watermarkOpacity || 0.16) - op.val) < 0.03;
                          return (
                            <button
                              key={op.val}
                              type="button"
                              onClick={() => onChange({ watermarkOpacity: op.val })}
                              className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isMatch
                                  ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {lang === 'bn' ? op.bn : op.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Logo & Branding Card */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {settings.companyName || 'Hisab Kitab'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {settings.companyTagline || 'Personal & Work Finance'}
                        </span>
                      </div>
                    </div>

                    {onOpenLogoModal && (
                      <button
                        type="button"
                        onClick={onOpenLogoModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'লোগো ও নাম পরিবর্তন' : 'Edit Logo & Brand'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Real-time Mini A4 Paper Diagram */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col items-center justify-between gap-3 shadow-2xs">
              <div className="w-full flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{lang === 'bn' ? 'মিনি পেজ প্রিভিউ' : 'Live Paper Diagram'}</span>
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {settings.orientation === 'portrait' ? '210×297mm' : '297×210mm'}
                </span>
              </div>

              {/* Dynamic Paper Wireframe */}
              <div className="w-full flex items-center justify-center py-2 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div
                  className="bg-white shadow-md border border-slate-300 relative overflow-hidden transition-all duration-200 flex flex-col"
                  style={{
                    width: settings.orientation === 'portrait' ? '132px' : '188px',
                    height: settings.orientation === 'portrait' ? '186px' : '132px',
                    paddingTop: `${topPct}%`,
                    paddingBottom: `${bottomPct}%`,
                    paddingLeft: `${leftPct}%`,
                    paddingRight: `${rightPct}%`,
                  }}
                >
                  {/* Dashed margin outline guide */}
                  <div className="w-full h-full border border-dashed border-indigo-300/80 flex flex-col justify-between p-1.5 relative bg-white">
                    {settings.showWatermark && (
                      <div
                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                        style={{ opacity: Math.max(0.08, Math.min(0.45, settings.watermarkOpacity * 1.6)) }}
                      >
                        <div className="w-16 h-16 rounded-full border-2 border-emerald-400/70" />
                      </div>
                    )}

                    {/* Mini Letterhead */}
                    {settings.showLetterhead && (
                      <div className="relative z-10 shrink-0 pb-1 border-b border-emerald-500/80 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                          <div className="space-y-0.5">
                            <div className="w-10 h-1 bg-slate-800 rounded-full" />
                            <div className="w-7 h-0.5 bg-slate-400 rounded-full" />
                          </div>
                        </div>
                        <div className="w-7 h-2.5 rounded-xs bg-slate-100 border border-slate-300" />
                      </div>
                    )}

                    {/* Mini Scaled Table Wireframe */}
                    <div
                      className="relative z-10 flex-1 overflow-hidden pt-1 flex flex-col gap-0.5 origin-top-left"
                      style={{
                        transform: `scale(${Math.min(1.05, Math.max(0.7, settings.scale / 100))})`,
                        width: `${100 / Math.min(1.05, Math.max(0.7, settings.scale / 100))}%`,
                      }}
                    >
                      <div className="h-2 w-full bg-[#2B6B88] rounded-[1px]" />
                      {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div
                          key={row}
                          className="w-full border-b border-slate-200 flex items-center gap-0.5"
                          style={{
                            height:
                              settings.rowPadding === 'compact'
                                ? '5px'
                                : settings.rowPadding === 'relaxed'
                                ? '10px'
                                : '7px',
                          }}
                        >
                          <div style={{ width: `${normalizedCols.sl}%` }} className="h-1 bg-slate-300 rounded-full" />
                          <div style={{ width: `${normalizedCols.date}%` }} className="h-1 bg-indigo-300 rounded-full" />
                          <div style={{ width: `${normalizedCols.account}%` }} className="h-1 bg-slate-500 rounded-full" />
                          <div style={{ width: `${normalizedCols.debit}%` }} className="h-1 bg-slate-400 rounded-full" />
                          <div style={{ width: `${normalizedCols.remarks}%` }} className="h-1 bg-slate-300 rounded-full" />
                        </div>
                      ))}
                    </div>

                    {/* Mini Footer */}
                    {settings.showLetterhead && (
                      <div className="relative z-10 shrink-0 h-2 w-full bg-[#031525] border-t border-emerald-500 mt-auto rounded-[1px]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Summary & Primary Triggers */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>
                      {typeof recordCount === 'number'
                        ? lang === 'bn' ? `${recordCount}টি এন্ট্রি` : `${recordCount} records`
                        : activeHeadLabel}
                    </span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {typeof pageCount === 'number'
                      ? lang === 'bn' ? `মোট ${pageCount} পাতা` : `${pageCount} pages`
                      : 'A4 Ready'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onToggleLivePreview}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isLivePreview
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'পূর্ণ প্রিভিউ' : 'Full Preview'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExplicitSave}
                    className="py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {saveToast ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saveToast ? (lang === 'bn' ? 'সেভড!' : 'Saved!') : (lang === 'bn' ? 'সেটিংস সেভ' : 'Save Head')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
