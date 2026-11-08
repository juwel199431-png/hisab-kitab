import React from 'react';
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
} from 'lucide-react';

export interface ReportPageSettings {
  marginTop: number; // in mm
  marginBottom: number; // in mm
  marginLeft: number; // in mm
  marginRight: number; // in mm
  orientation: 'portrait' | 'landscape';
  scale: number; // in %
  fontSizePt: number; // in pt
  remarksWidth: number; // in %
  debitWidth: number; // in %
  creditWidth: number; // in %
  balanceWidth: number; // in %
  accountWidth: number; // in %
}

export const DEFAULT_PAGE_SETTINGS: ReportPageSettings = {
  marginTop: 2,
  marginBottom: 2,
  marginLeft: 2,
  marginRight: 2,
  orientation: 'portrait',
  scale: 100,
  fontSizePt: 9.5,
  remarksWidth: 46,
  debitWidth: 8,
  creditWidth: 8,
  balanceWidth: 9,
  accountWidth: 15,
};

export const PAGE_SETTINGS_STORAGE_KEY = 'hisab_kitab_report_page_settings_v3';

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

interface ReportPageSettingsPanelProps {
  settings: ReportPageSettings;
  onChange: (updates: Partial<ReportPageSettings>) => void;
  onReset: () => void;
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
  isOpen,
  onToggle,
  isLivePreview,
  onToggleLivePreview,
  onPrint,
  lang,
}) => {
  // Preset handlers
  const applyPresetZeroMargin = () => {
    onChange({
      marginTop: 2,
      marginBottom: 2,
      marginLeft: 2,
      marginRight: 2,
      remarksWidth: 48,
      debitWidth: 7.5,
      creditWidth: 7.5,
      balanceWidth: 9,
      accountWidth: 14,
      scale: 100,
      fontSizePt: 9.5,
      orientation: 'portrait',
    });
  };

  const applyPresetLandscape = () => {
    onChange({
      orientation: 'landscape',
      marginTop: 3,
      marginBottom: 3,
      marginLeft: 3,
      marginRight: 3,
      remarksWidth: 52,
      debitWidth: 7,
      creditWidth: 7,
      balanceWidth: 8,
      accountWidth: 14,
      scale: 100,
      fontSizePt: 9.5,
    });
  };

  const applyPresetStandardA4 = () => {
    onChange({
      orientation: 'portrait',
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      remarksWidth: 42,
      debitWidth: 8.5,
      creditWidth: 8.5,
      balanceWidth: 10,
      accountWidth: 15,
      scale: 96,
      fontSizePt: 9.5,
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
                {lang === 'bn' ? 'রিপোর্ট পেইজের মাপ ও মার্জিন কন্ট্রোল প্যানেল' : 'Report Page Dimensions & Margins Studio'}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {lang === 'bn' ? 'ম্যানুয়াল কন্ট্রোল' : 'Customizable'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{lang === 'bn' ? `মার্জিন: উপরে ${settings.marginTop}mm | নিচে ${settings.marginBottom}mm | বামে ${settings.marginLeft}mm | ডানে ${settings.marginRight}mm` : `Margins: ${settings.marginTop}mm / ${settings.marginLeft}mm`}</span>
              <span>·</span>
              <span>{lang === 'bn' ? `রিমার্কস: ${settings.remarksWidth}% | ওরিয়েন্টেশন: ${settings.orientation === 'portrait' ? 'লম্বালম্বি' : 'আড়াআড়ি'}` : `Remarks: ${settings.remarksWidth}%`}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <span>{isLivePreview ? (lang === 'bn' ? 'লাইভ পেজ প্রিভিউ চলছে' : 'Live Preview Active') : (lang === 'bn' ? 'লাইভ প্রিভিউ দেখুন' : 'Live Preview')}</span>
          </button>

          {/* Toggle Panel Button */}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <span>{isOpen ? (lang === 'bn' ? 'প্যানেল গুটিয়ে নিন' : 'Collapse Panel') : (lang === 'bn' ? 'পেইজের মাপ পরিবর্তন করুন' : 'Adjust Dimensions')}</span>
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all cursor-pointer"
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

            {/* Box 2: Column Width Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📊</span>
                  <span>{lang === 'bn' ? 'কলামের প্রস্থ অনুপাত' : 'Column Width Ratios'}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-black">১০০% লকড</span>
              </div>

              {/* Remarks Width */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span className="text-indigo-900 font-bold">{lang === 'bn' ? 'মন্তব্য (Remarks) কলাম:' : 'Remarks Width:'}</span>
                  <span className="font-mono text-indigo-600 font-black text-xs">{settings.remarksWidth}%</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={60}
                  step={1}
                  value={settings.remarksWidth}
                  onChange={(e) => onChange({ remarksWidth: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {lang === 'bn' ? 'স্লাইড করে রিমার্কস কলাম যত খুশি বড় করুন' : 'Increase to give Remarks more room'}
                </span>
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
                  max={24}
                  step={0.5}
                  value={settings.accountWidth}
                  onChange={(e) => onChange({ accountWidth: Number(e.target.value) })}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Debit & Credit Width */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{lang === 'bn' ? 'ডেবিট ও ক্রেডিট (সংকুচিত):' : 'Debit & Credit:'}</span>
                  <span className="font-mono text-slate-700 font-bold">প্রতিটি {settings.debitWidth}%</span>
                </div>
                <input
                  type="range"
                  min={6}
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

            {/* Box 3: Orientation & Paper Size */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📑</span>
                  <span>{lang === 'bn' ? 'কাগজের দিক ও ওরিয়েন্টেশন' : 'Orientation'}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onChange({ orientation: 'portrait' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.orientation === 'portrait'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-5 h-7 border-2 border-current mx-auto rounded-xs mb-1.5" />
                  <span className="text-xs block font-bold">{lang === 'bn' ? 'লম্বালম্বি' : 'Portrait'}</span>
                  <span className="text-[10px] text-slate-400 block">A4 Portrait</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ orientation: 'landscape' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.orientation === 'landscape'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-7 h-5 border-2 border-current mx-auto rounded-xs mb-2.5" />
                  <span className="text-xs block font-bold">{lang === 'bn' ? 'আড়াআড়ি / চওড়া' : 'Landscape'}</span>
                  <span className="text-[10px] text-slate-400 block">Wide Ledger</span>
                </button>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5 mt-2">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {lang === 'bn'
                    ? 'টিপস: সাব লেজারের মতো অনেক কলামবিশিষ্ট রিপোর্টের জন্য "আড়াআড়ি / চওড়া" মোড সবচেয়ে বেশি সুন্দর দেখায়।'
                    : 'Tip: For wide ledgers with many columns, Landscape mode provides maximum space.'}
                </span>
              </div>
            </div>

            {/* Box 4: Zoom Scaling & Typography */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🔍</span>
                  <span>{lang === 'bn' ? 'টেবিল স্কেলিং ও ফন্ট সাইজ' : 'Scale & Font'}</span>
                </span>
              </div>

              {/* Table Scale Slider */}
              <div>
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
                  <span>75% (ছোট)</span>
                  <span>100% (স্বাভাবিক)</span>
                  <span>120% (বড়)</span>
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  {lang === 'bn' ? 'ফন্টের আকার (Font Size):' : 'Font Size:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: lang === 'bn' ? 'চিকন' : 'Compact', pt: 8.5 },
                    { label: lang === 'bn' ? 'সাধারণ' : 'Normal', pt: 9.5 },
                    { label: lang === 'bn' ? 'বড়' : 'Large', pt: 11 },
                  ].map((f) => (
                    <button
                      key={f.pt}
                      type="button"
                      onClick={() => onChange({ fontSizePt: f.pt })}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        settings.fontSizePt === f.pt
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
