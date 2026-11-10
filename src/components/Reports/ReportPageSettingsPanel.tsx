import React, { useState } from 'react';
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
  Calendar,
} from 'lucide-react';

export interface ReportPageSettings {
  marginTop: number; // in mm
  marginBottom: number; // in mm
  marginLeft: number; // in mm
  marginRight: number; // in mm
  orientation: 'portrait' | 'landscape';
  scale: number; // in %
  fontSizePt: number; // in pt
  // Column Widths (in %)
  slWidth: number; // in %
  dateWidth: number; // in %
  accountWidth: number; // in %
  remarksWidth: number; // in %
  debitWidth: number; // in %
  creditWidth: number; // in %
  balanceWidth: number; // in %
  // Font styling & customization
  fontFamily: 'system' | 'inter' | 'serif' | 'mono';
  isBold: boolean;
  isItalic: boolean;
  rowPadding: 'compact' | 'normal' | 'relaxed';
  // Letterhead & Background Watermark
  showLetterhead: boolean;
  showWatermark: boolean;
  watermarkOpacity: number; // 0.03, 0.05, 0.08
}

export const DEFAULT_PAGE_SETTINGS: ReportPageSettings = {
  marginTop: 2,
  marginBottom: 2,
  marginLeft: 2,
  marginRight: 2,
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
  watermarkOpacity: 0.15,
};

export const PAGE_SETTINGS_STORAGE_KEY = 'hisab_kitab_report_page_settings_v6';

export const loadSavedPageSettings = (): ReportPageSettings => {
  try {
    const saved = localStorage.getItem(PAGE_SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PAGE_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PAGE_SETTINGS;
};

export const savePageSettingsToStorage = (settings: ReportPageSettings): boolean => {
  try {
    localStorage.setItem(PAGE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Failed to save page settings to localStorage:', err);
    return false;
  }
};

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
}

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
}) => {
  const [saveToast, setSaveToast] = useState(false);

  const handleExplicitSave = () => {
    savePageSettingsToStorage(settings);
    if (onSave) onSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Preset handlers
  const applyPresetZeroMargin = () => {
    onChange({
      marginTop: 2,
      marginBottom: 2,
      marginLeft: 2,
      marginRight: 2,
      slWidth: 4,
      dateWidth: 12,
      accountWidth: 16,
      remarksWidth: 45,
      debitWidth: 7.5,
      creditWidth: 7.5,
      balanceWidth: 9,
      scale: 100,
      fontSizePt: 9.5,
      orientation: 'portrait',
      fontFamily: 'system',
      isBold: false,
      isItalic: false,
      rowPadding: 'normal',
    });
  };

  const applyPresetLandscape = () => {
    onChange({
      orientation: 'landscape',
      marginTop: 3,
      marginBottom: 3,
      marginLeft: 3,
      marginRight: 3,
      slWidth: 3.5,
      dateWidth: 11,
      accountWidth: 15,
      remarksWidth: 50,
      debitWidth: 7,
      creditWidth: 7,
      balanceWidth: 8,
      scale: 100,
      fontSizePt: 9.5,
      fontFamily: 'system',
      rowPadding: 'normal',
    });
  };

  const applyPresetStandardA4 = () => {
    onChange({
      orientation: 'portrait',
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      slWidth: 4.5,
      dateWidth: 13,
      accountWidth: 17,
      remarksWidth: 40,
      debitWidth: 8,
      creditWidth: 8,
      balanceWidth: 9.5,
      scale: 96,
      fontSizePt: 9.5,
      rowPadding: 'normal',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden no-print transition-all">
      {/* Top Banner / Trigger Bar */}
      <div className="px-5 py-3.5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center border border-indigo-400/30 text-indigo-300">
            <SlidersHorizontal className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-bold tracking-tight text-white">
                {lang === 'bn' ? 'রিপোর্ট পেইজের মাপ, মার্জিন ও ফন্ট কন্ট্রোল' : 'Report Page Dimensions, Margins & Typography'}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {lang === 'bn' ? 'ম্যানুয়াল কন্ট্রোল' : 'Customizable'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{lang === 'bn' ? `মার্জিন: উপরে ${settings.marginTop}mm | নিচে ${settings.marginBottom}mm | বামে ${settings.marginLeft}mm | ডানে ${settings.marginRight}mm` : `Margins: ${settings.marginTop}mm / ${settings.marginLeft}mm`}</span>
              <span>·</span>
              <span>{lang === 'bn' ? `তারিখ: ${settings.dateWidth}% | রিমার্কস: ${settings.remarksWidth}% | ফন্ট: ${settings.fontSizePt}pt ${settings.isBold ? '(Bold)' : ''}` : `Date: ${settings.dateWidth}% | Remarks: ${settings.remarksWidth}%`}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Save Settings Button */}
          <button
            type="button"
            onClick={handleExplicitSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
              saveToast || isSaved
                ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/60'
            }`}
            title={lang === 'bn' ? 'আপনার সকল কাস্টম মাপ ও মার্জিন ব্রাউজারে স্থায়ীভাবে সেভ করুন' : 'Save all custom dimensions and margins'}
          >
            {saveToast ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveToast ? (lang === 'bn' ? 'সেভ হয়েছে!' : 'Saved!') : (lang === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Settings')}</span>
          </button>

          {/* Live Preview Toggle Button */}
          <button
            type="button"
            onClick={onToggleLivePreview}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isLivePreview
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
            title={lang === 'bn' ? 'স্ক্রিনে কাগজের লাইভ পেজ প্রিভিউ অন/অফ করুন' : 'Toggle Live Paper Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isLivePreview ? (lang === 'bn' ? 'লাইভ প্রিভিউ চলছে' : 'Live Preview Active') : (lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview')}</span>
          </button>

          {/* Toggle Panel Button */}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <span>{isOpen ? (lang === 'bn' ? 'প্যানেল গুটিয়ে নিন' : 'Collapse Panel') : (lang === 'bn' ? 'পেইজ ও ফন্ট পরিবর্তন' : 'Adjust Settings')}</span>
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Adjuster Controls */}
      {isOpen && (
        <div className="p-5 md:p-6 bg-slate-50 border-t border-slate-200/80 space-y-5 animate-in fade-in duration-150">
          {/* Quick Presets Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'দ্রুত প্রিসেট নির্বাচন:' : 'Quick Presets:'}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={applyPresetZeroMargin}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors cursor-pointer"
              >
                {lang === 'bn' ? '📐 ফুল পেজ (২ মিমি জিরো মার্জিন)' : 'Full Page (2mm Margins)'}
              </button>

              <button
                type="button"
                onClick={applyPresetLandscape}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
              >
                {lang === 'bn' ? '📑 ল্যান্ডস্কেপ চওড়া খতিয়ান (Wide Ledger)' : 'Landscape Ledger (Wide)'}
              </button>

              <button
                type="button"
                onClick={applyPresetStandardA4}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
              >
                {lang === 'bn' ? '📄 স্ট্যান্ডার্ড অফিসিয়াল (৮ মিমি)' : 'Standard Office (8mm)'}
              </button>

              <button
                type="button"
                onClick={handleExplicitSave}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সেভ করুন' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset to default settings"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* Grid of Sliders and Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box 1: 4-Way Page Margins */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📐</span>
                  <span>{lang === 'bn' ? 'চারপাশের মার্জিন (মিমি)' : 'Page Margins (mm)'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">0 - 30 mm</span>
              </div>

              {/* Top Margin */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'উপরে (Top):' : 'Top:'}</span>
                  <span className="font-mono text-indigo-600 font-bold">{settings.marginTop} mm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={settings.marginTop}
                  onChange={(e) => onChange({ marginTop: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Bottom Margin */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'নিচে (Bottom):' : 'Bottom:'}</span>
                  <span className="font-mono text-indigo-600 font-bold">{settings.marginBottom} mm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={settings.marginBottom}
                  onChange={(e) => onChange({ marginBottom: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Left Margin */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'বামে (Left):' : 'Left:'}</span>
                  <span className="font-mono text-indigo-600 font-bold">{settings.marginLeft} mm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={settings.marginLeft}
                  onChange={(e) => onChange({ marginLeft: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Right Margin */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'ডানে (Right):' : 'Right:'}</span>
                  <span className="font-mono text-indigo-600 font-bold">{settings.marginRight} mm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={settings.marginRight}
                  onChange={(e) => onChange({ marginRight: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Box 2: Column Width Controls (Now includes Date, Remarks, Account, Debit/Credit) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📊</span>
                  <span>{lang === 'bn' ? 'কলামের প্রস্থ অনুপাত' : 'Column Width Ratios'}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-black">১০০% এডজাস্টেবল</span>
              </div>

              {/* Date Column Width (Requested by User) */}
              <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span className="text-indigo-950 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-600" />
                    <span>{lang === 'bn' ? 'তারিখ (Date) কলাম:' : 'Date Column Width:'}</span>
                  </span>
                  <span className="font-mono text-indigo-700 font-black text-xs">{settings.dateWidth}%</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={22}
                  step={0.5}
                  value={settings.dateWidth}
                  onChange={(e) => onChange({ dateWidth: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[9.5px] text-indigo-600 block mt-0.5 font-medium">
                  {lang === 'bn' ? 'তারিখের মাপ বাড়িয়ে বা কমিয়ে সুবিধামত রাখুন' : 'Slide to expand date column'}
                </span>
              </div>

              {/* Remarks Width */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span className="text-slate-800 font-bold">{lang === 'bn' ? 'মন্তব্য (Remarks) কলাম:' : 'Remarks Width:'}</span>
                  <span className="font-mono text-indigo-600 font-black text-xs">{settings.remarksWidth}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={1}
                  value={settings.remarksWidth}
                  onChange={(e) => onChange({ remarksWidth: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Account Width */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'অ্যাকাউন্ট (Account):' : 'Account:'}</span>
                  <span className="font-mono text-slate-700 font-bold">{settings.accountWidth}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={28}
                  step={0.5}
                  value={settings.accountWidth}
                  onChange={(e) => onChange({ accountWidth: Number(e.target.value) })}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Debit & Credit Width */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'ডেবিট ও ক্রেডিট কলাম:' : 'Debit & Credit:'}</span>
                  <span className="font-mono text-slate-700 font-bold">প্রতিটি {settings.debitWidth}%</span>
                </div>
                <input
                  type="range"
                  min={5.5}
                  max={14}
                  step={0.5}
                  value={settings.debitWidth}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChange({ debitWidth: val, creditWidth: val });
                  }}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Box 3: Typography, Bold, Italic & Row Height (Requested by User) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>✍️</span>
                  <span>{lang === 'bn' ? 'ফন্ট স্টাইল ও রো-এর উচ্চতা' : 'Font Style & Rows'}</span>
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">{settings.fontSizePt}pt</span>
              </div>

              {/* Font Size Slider */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'ফন্ট সাইজ (Font Size):' : 'Font Size:'}</span>
                  <span className="font-mono text-indigo-600 font-bold">{settings.fontSizePt} pt</span>
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
              </div>

              {/* Bold & Italic Toggles */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লেখা বোল্ড / ইটালিক করুন:' : 'Bold & Italic:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ isBold: !settings.isBold })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.isBold
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                    <span>{settings.isBold ? (lang === 'bn' ? 'বোল্ড (চালু)' : 'Bold On') : (lang === 'bn' ? 'বোল্ড (বন্ধ)' : 'Normal')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange({ isItalic: !settings.isItalic })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold italic flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.isItalic
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                    <span>{settings.isItalic ? (lang === 'bn' ? 'ইটালিক (চালু)' : 'Italic On') : (lang === 'bn' ? 'ইটালিক (বন্ধ)' : 'Regular')}</span>
                  </button>
                </div>
              </div>

              {/* Font Family Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ফন্ট নির্বাচন:' : 'Font Family:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'system', label: lang === 'bn' ? 'ডিফল্ট' : 'Modern' },
                    { id: 'mono', label: lang === 'bn' ? 'মনোস্পেস' : 'Mono' },
                    { id: 'serif', label: lang === 'bn' ? 'সেরিফ' : 'Serif' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onChange({ fontFamily: f.id as any })}
                      className={`py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        settings.fontFamily === f.id
                          ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row Padding (Compact, Normal, Relaxed) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'রো-এর স্পেসিং / উচ্চতা:' : 'Row Spacing:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'compact', label: lang === 'bn' ? 'ঘন' : 'Compact' },
                    { id: 'normal', label: lang === 'bn' ? 'স্বাভাবিক' : 'Normal' },
                    { id: 'relaxed', label: lang === 'bn' ? 'ফাঁকা' : 'Relaxed' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onChange({ rowPadding: r.id as any })}
                      className={`py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        settings.rowPadding === r.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 4: Orientation & Zoom Scaling */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📑</span>
                  <span>{lang === 'bn' ? 'কাগজের দিক ও জুম স্কেল' : 'Orientation & Scale'}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onChange({ orientation: 'portrait' })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.orientation === 'portrait'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-4 h-6 border-2 border-current mx-auto rounded-xs mb-1" />
                  <span className="text-xs block font-bold">{lang === 'bn' ? 'লম্বালম্বি' : 'Portrait'}</span>
                  <span className="text-[10px] text-slate-400 block">A4 Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ orientation: 'landscape' })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.orientation === 'landscape'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-6 h-4 border-2 border-current mx-auto rounded-xs mb-1.5" />
                  <span className="text-xs block font-bold">{lang === 'bn' ? 'আড়াআড়ি / চওড়া' : 'Landscape'}</span>
                  <span className="text-[10px] text-slate-400 block">Wide Ledger</span>
                </button>
              </div>

              {/* Table Scale Slider */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'টেবিল স্কেল / জুম:' : 'Table Scale / Zoom:'}</span>
                  <span className="font-mono text-indigo-600 font-bold">{settings.scale}%</span>
                </div>
                <input
                  type="range"
                  min={75}
                  max={120}
                  step={1}
                  value={settings.scale}
                  onChange={(e) => onChange({ scale: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>75%</span>
                  <span>100%</span>
                  <span>120%</span>
                </div>
              </div>

              {/* Save Confirmation Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExplicitSave}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'এই মাপ ও মার্জিন সেভ করুন' : 'Save Dimensions & Margins'}</span>
                </button>
              </div>
            </div>

            {/* Box 5: Letterhead & Aesthetic Background Watermark (Requested by User) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 md:col-span-2 lg:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {lang === 'bn' ? 'অফিসিয়াল লেটারহেড ও ব্যাকগ্রাউন্ড সিকিউরিটি ডিজাইন' : 'Official Letterhead & Aesthetic Background Design'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'প্রিন্ট বা পিডিএফ করার সময় পেজের শীর্ষে আকর্ষণীয় লেটারহেড ও ব্যাকগ্রাউন্ডে ওয়াটারমার্ক শো করবে' : 'Shows official logo letterhead on top and security watermark in background'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {lang === 'bn' ? 'প্রিন্ট ও PDF রেডি' : 'Print / PDF Ready'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Letterhead Toggle */}
                <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {lang === 'bn' ? 'লেটারহেড (শীর্ষ ব্যানার):' : 'Letterhead (Header):'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'লোগো ও অফিসিয়াল নাম' : 'Logo & Official Title'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange({ showLetterhead: !settings.showLetterhead })}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      settings.showLetterhead
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-300'
                    }`}
                  >
                    {settings.showLetterhead ? (lang === 'bn' ? 'চালু (On)' : 'On') : (lang === 'bn' ? 'বন্ধ (Off)' : 'Off')}
                  </button>
                </div>

                {/* 2. Watermark Toggle */}
                <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {lang === 'bn' ? 'ব্যাকগ্রাউন্ড ওয়াটারমার্ক:' : 'Security Watermark:'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'সিকিউরিটি সিল ও প্যাটার্ন' : 'Guilloche Seal Pattern'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange({ showWatermark: !settings.showWatermark })}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      settings.showWatermark
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-300'
                    }`}
                  >
                    {settings.showWatermark ? (lang === 'bn' ? 'চালু (On)' : 'On') : (lang === 'bn' ? 'বন্ধ (Off)' : 'Off')}
                  </button>
                </div>

                {/* 3. Watermark Opacity Intensity */}
                <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {lang === 'bn' ? 'ওয়াটারমার্কের গভীরতা:' : 'Watermark Intensity:'}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold">
                      {settings.watermarkOpacity === 0.03 ? (lang === 'bn' ? 'হালকা (Subtle)' : 'Subtle') : settings.watermarkOpacity === 0.08 ? (lang === 'bn' ? 'স্পষ্ট (Bold)' : 'Bold') : (lang === 'bn' ? 'স্বাভাবিক (Normal)' : 'Normal')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 0.03, label: lang === 'bn' ? 'হালকা' : 'Subtle' },
                      { val: 0.05, label: lang === 'bn' ? 'স্বাভাবিক' : 'Normal' },
                      { val: 0.08, label: lang === 'bn' ? 'স্পষ্ট' : 'Bold' },
                    ].map((op) => (
                      <button
                        key={op.val}
                        type="button"
                        onClick={() => onChange({ watermarkOpacity: op.val })}
                        className={`py-1 text-[11px] font-medium rounded-md border transition-all cursor-pointer ${
                          settings.watermarkOpacity === op.val
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
