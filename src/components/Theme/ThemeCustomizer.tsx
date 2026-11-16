import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  BRAND_COLOR_PRESETS,
  FONT_PRESETS,
  resolvePalette,
} from '../../utils/themeEngine';
import {
  X,
  Palette,
  Sun,
  Moon,
  Type,
  Check,
  RotateCcw,
  Sparkles,
  UserCircle2,
} from 'lucide-react';

export const ThemeCustomizer: React.FC = () => {
  const {
    lang,
    isThemeModalOpen,
    setIsThemeModalOpen,
    themePrefs,
    updateThemePrefs,
    resetThemePrefs,
  } = useFinance();

  if (!isThemeModalOpen) return null;

  const activePalette = resolvePalette(themePrefs);
  const activeFont =
    FONT_PRESETS.find((f) => f.id === themePrefs.fontId) || FONT_PRESETS[0];

  const previewName = themePrefs.userName?.trim();
  const previewTitle = themePrefs.profileTitle?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: activePalette['700'] }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? 'প্রোফাইল, থিম, কালার ও ফন্ট কাস্টমাইজার'
                  : 'Profile, Theme Color & Font Studio'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার নাম, প্রোফাইল টাইটেল, ব্র্যান্ড কালার, ফন্ট ও মোড সাজান'
                  : 'Customize display name, profile title, colors, fonts & theme mode'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Live Appearance Preview Card */}
          <div
            className="p-4 rounded-xl border transition-all"
            style={{
              backgroundColor:
                themePrefs.mode === 'dark' ? '#0f172a' : activePalette['50'],
              borderColor:
                themePrefs.mode === 'dark' ? '#334155' : activePalette['200'],
              fontFamily: activeFont.cssStack,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5"
                  style={{
                    backgroundColor:
                      themePrefs.mode === 'dark'
                        ? activePalette['900']
                        : activePalette['100'],
                    color:
                      themePrefs.mode === 'dark'
                        ? activePalette['200']
                        : activePalette['800'],
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  {lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview'}
                </span>
                <p
                  className="text-sm font-bold truncate"
                  style={{
                    color: themePrefs.mode === 'dark' ? '#f8fafc' : '#0f172a',
                  }}
                >
                  {previewName
                    ? lang === 'bn'
                      ? `শুভ সকাল, ${previewName} • হিসাব কিতাব`
                      : `Good Morning, ${previewName} • Hisab Kitab`
                    : lang === 'bn'
                    ? 'হিসাব কিতাব • দৈনন্দিন আয় ও ব্যয়ের নির্ভুল হিসাব'
                    : 'Hisab Kitab • Personal & Business Ledger'}
                </p>
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{
                    color: themePrefs.mode === 'dark' ? '#94a3b8' : '#475569',
                  }}
                >
                  {previewTitle
                    ? `${previewTitle} • ${lang === 'bn' ? activeFont.nameBn : activeFont.nameEn}`
                    : lang === 'bn'
                    ? `ফন্ট: ${activeFont.nameBn} • মোট ব্যালেন্স: ৳ ১,২৫,৪০০`
                    : `Font: ${activeFont.nameEn} • Balance: 125,400 BDT`}
                </p>
              </div>

              <span
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs shrink-0"
                style={{ backgroundColor: activePalette['700'] }}
              >
                {lang === 'bn' ? 'প্রাইমারি' : 'Action'}
              </span>
            </div>
          </div>

          {/* 0. User Name & Profile Title */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <UserCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {lang === 'bn'
                  ? '১. প্রোফাইল ও পরিচিতি (গ্রিটিংস ও রিপোর্ট হেডারে দেখাবে)'
                  : '1. User Name & Profile Title (Shown in Greetings & Report Header)'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম (Display Name)' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={themePrefs.userName}
                  onChange={(e) => updateThemePrefs({ userName: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: মোঃ জুয়েল রানা' : 'e.g., Juwel Rana'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'প্রোফাইল / পদবি টাইটেল (Profile Title)' : 'Profile / Business Title'}
                </label>
                <input
                  type="text"
                  value={themePrefs.profileTitle}
                  onChange={(e) => updateThemePrefs({ profileTitle: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: ব্যক্তিগত ও কর্মক্ষেত্র হিসাব' : 'e.g., Personal & Work Finance'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* 2. Light / Dark Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              {lang === 'bn' ? '২. অ্যাপের মোড (Light / Dark)' : '2. Appearance Mode'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateThemePrefs({ mode: 'light' })}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  themePrefs.mode === 'light'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block">
                    {lang === 'bn' ? 'লাইট মোড' : 'Light Mode'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {lang === 'bn' ? 'উজ্জ্বল ও পরিষ্কার' : 'Bright & Crisp'}
                  </span>
                </div>
                {themePrefs.mode === 'light' && (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => updateThemePrefs({ mode: 'dark' })}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  themePrefs.mode === 'dark'
                    ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/25 text-white'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block">
                    {lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {lang === 'bn' ? 'রাতের চোখের আরাম' : 'Easy on Eyes'}
                  </span>
                </div>
                {themePrefs.mode === 'dark' && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Primary Brand Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {lang === 'bn'
                  ? '৩. প্রাইমারি ব্র্যান্ড কালার'
                  : '3. Primary Brand Color'}
              </label>
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {activePalette['700']}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BRAND_COLOR_PRESETS.map((preset) => {
                const isSelected = themePrefs.brandColorId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateThemePrefs({ brandColorId: preset.id })}
                    className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-white shadow-inner"
                      style={{ backgroundColor: preset.swatchHex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {lang === 'bn' ? preset.nameBn.split(' ')[0] : preset.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div
              className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                themePrefs.brandColorId === 'custom'
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  aria-label="Custom brand color picker"
                  value={themePrefs.customBrandHex}
                  onChange={(e) =>
                    updateThemePrefs({
                      brandColorId: 'custom',
                      customBrandHex: e.target.value,
                    })
                  }
                  className="w-9 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 bg-transparent p-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'bn'
                      ? 'কাস্টম রঙ বেছে নিন'
                      : 'Pick Any Custom Brand Color'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'কালার বক্সে ক্লিক করে পছন্দের যেকোনো রঙ দিন'
                      : 'Click the color swatch to pick any hex shade'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                {themePrefs.customBrandHex}
              </span>
            </div>
          </div>

          {/* 4. Font Family Picker */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {lang === 'bn'
                  ? '৪. ফন্ট ফ্যামিলি (বাংলা ও ইংরেজি)'
                  : '4. App Font Family'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FONT_PRESETS.map((font) => {
                const isSelected = themePrefs.fontId === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => updateThemePrefs({ fontId: font.id })}
                    style={{ fontFamily: font.cssStack }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {lang === 'bn' ? font.nameBn : font.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {lang === 'bn' ? font.categoryBn : font.categoryEn}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">
                        {lang === 'bn' ? font.sampleBn : font.sampleEn}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={resetThemePrefs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset Default'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsThemeModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {lang === 'bn' ? 'সেভ ও সম্পন্ন করুন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
