import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Shield,
  Layers,
  Award,
  TrendingUp,
  Briefcase,
  Camera,
} from 'lucide-react';

export type LogoType =
  | 'default'
  | 'gold-shield'
  | 'fintech-cube'
  | 'wings'
  | 'monogram'
  | 'growth-chart'
  | 'custom';

export interface LogoSettings {
  logoType: LogoType;
  customLogoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  companyBadge?: string;
}

interface ReportLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
  currentSettings: LogoSettings;
  onSave: (newSettings: LogoSettings) => void;
}

/**
 * Pure SVG preset logo renderer used in both modal and letterhead
 */
export const renderReportLogoIcon = (
  logoType: LogoType = 'default',
  customLogoUrl?: string,
  sizeClass = 'w-12 h-12'
) => {
  if ((logoType === 'custom' || !logoType) && customLogoUrl) {
    return (
      <div
        className={`${sizeClass} rounded-xl p-1 flex items-center justify-center shadow-md shrink-0 bg-white border border-slate-200 overflow-hidden`}
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <img
          src={customLogoUrl}
          alt="Custom Report Logo"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  switch (logoType) {
    case 'gold-shield':
      return (
        <div
          className={`${sizeClass} rounded-xl p-2 flex items-center justify-center shadow-md shrink-0`}
          style={{
            background: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #291002 100%)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <path
              d="M16 3L6 7V15C6 21.5 10.3 27.5 16 29C21.7 27.5 26 21.5 26 15V7L16 3Z"
              fill="#78350f"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            <path
              d="M11 15.5L14.5 19L21 12.5"
              stroke="#fef08a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'fintech-cube':
      return (
        <div
          className={`${sizeClass} rounded-xl p-2 flex items-center justify-center shadow-md shrink-0`}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0369a1 100%)',
            border: '1px solid rgba(6, 182, 212, 0.45)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            {/* 3D Isometric Cube */}
            <path d="M16 4L27 10.5V21.5L16 28L5 21.5V10.5L16 4Z" stroke="#38bdf8" strokeWidth="1.8" />
            <path d="M16 4V16M16 16L27 10.5M16 16L5 10.5" stroke="#38bdf8" strokeWidth="1.6" />
            <path d="M16 16V28" stroke="#38bdf8" strokeWidth="1.6" />
            <circle cx="16" cy="16" r="2.5" fill="#38bdf8" />
            <circle cx="27" cy="10.5" r="1.8" fill="#a5f3fc" />
            <circle cx="5" cy="10.5" r="1.8" fill="#a5f3fc" />
            <circle cx="16" cy="4" r="1.8" fill="#a5f3fc" />
          </svg>
        </div>
      );

    case 'wings':
      return (
        <div
          className={`${sizeClass} rounded-xl p-2 flex items-center justify-center shadow-md shrink-0`}
          style={{
            background: 'linear-gradient(135deg, #042f2e 0%, #134e4a 60%, #064e3b 100%)',
            border: '1px solid rgba(45, 212, 191, 0.5)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <path
              d="M4 22C7 16 11 12 16 12C21 12 25 16 28 22"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M7 25C9.5 20 12.5 17 16 17C19.5 17 22.5 20 25 25"
              stroke="#99f6e4"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M16 7V17M16 7L12 11M16 7L20 11"
              stroke="#fbbf24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'monogram':
      return (
        <div
          className={`${sizeClass} rounded-xl p-2 flex items-center justify-center shadow-md shrink-0`}
          style={{
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e293b 100%)',
            border: '1.5px solid #10b981',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <div className="flex items-baseline font-black tracking-tighter text-white font-mono text-base">
            <span className="text-[#34d399]">H</span>
            <span className="text-white">K</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] ml-0.5" />
          </div>
        </div>
      );

    case 'growth-chart':
      return (
        <div
          className={`${sizeClass} rounded-xl p-2 flex items-center justify-center shadow-md shrink-0`}
          style={{
            background: 'linear-gradient(135deg, #044e42 0%, #083344 60%, #022c22 100%)',
            border: '1px solid rgba(52, 211, 153, 0.5)',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <rect x="6" y="18" width="4" height="9" rx="1.5" fill="#34d399" />
            <rect x="14" y="12" width="4" height="15" rx="1.5" fill="#10b981" />
            <rect x="22" y="7" width="4" height="20" rx="1.5" fill="#059669" />
            <path
              d="M6 15L14 9L22 5"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="5" r="2" fill="#f59e0b" />
          </svg>
        </div>
      );

    case 'default':
    default:
      return (
        <div
          className={`${sizeClass} rounded-xl p-0.5 flex items-center justify-center shadow-md shrink-0 bg-white border border-emerald-500/30 overflow-hidden`}
          style={{
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <img
            src="/assets/aistudio/Hisabify_Personal_Finance_Logo_dcec8d4f.png"
            alt="Official Hisabify Report Logo"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
      );
  }
};

const PRESET_OPTIONS: { id: LogoType; nameBn: string; nameEn: string; descBn: string; descEn: string; icon: any }[] = [
  {
    id: 'default',
    nameBn: 'অফিসিয়াল লোগো (Hisabify Official)',
    nameEn: 'Official Brand Logo',
    descBn: 'আপনার প্রদত্ত মূল আকর্ষণীয় অফিসিয়াল ব্র্যান্ড লোগো',
    descEn: 'Official uploaded brand logo (Hisabify)',
    icon: Sparkles,
  },
  {
    id: 'gold-shield',
    nameBn: 'গোল্ডেন ট্রাস্ট শিল্ড (Golden Trust Shield)',
    nameEn: 'Golden Trust Shield',
    descBn: 'আভিজাত্যপূর্ণ সোনালী নিরাপত্তা শিল্ড ও ভেরিফাইড ব্যাজ',
    descEn: 'Prestige golden security shield with verified checkmark',
    icon: Shield,
  },
  {
    id: 'fintech-cube',
    nameBn: 'আইসোমেট্রিক ফিনটেক কিউব (Fintech Cube)',
    nameEn: 'Fintech 3D Cube',
    descBn: 'আধুনিক টেকনোলজি ও ব্লকচেইন আর্থিক নেটওয়ার্ক',
    descEn: 'Modern tech isometric cube with financial nodes',
    icon: Layers,
  },
  {
    id: 'wings',
    nameBn: 'রয়্যাল উইংস ও গ্রোথ (Prestige Wings)',
    nameEn: 'Prestige Wings',
    descBn: 'উর্ধ্বমুখী আর্থিক সমৃদ্ধি ও সম্মানজনক পাখা',
    descEn: 'Ascending momentum wings with upward growth arrow',
    icon: Award,
  },
  {
    id: 'monogram',
    nameBn: 'মিনিমালিস্ট HK মনোগ্রাম (HK Monogram)',
    nameEn: 'Executive HK Monogram',
    descBn: 'কর্পোরেট মিনিমালিস্ট টাইপোগ্রাফিক মনোগ্রাম',
    descEn: 'Clean, modern typography monogram for executive branding',
    icon: Sparkles,
  },
  {
    id: 'growth-chart',
    nameBn: 'ডাইনামিক গ্রোথ অ্যানালিটিক্স (Growth Wave)',
    nameEn: 'Growth Chart & Analytics',
    descBn: 'মুনাফা ও আর্থিক প্রবৃদ্ধির বার চার্ট এবং ট্রেন্ড',
    descEn: 'Profit and economic growth chart with analytics trend',
    icon: TrendingUp,
  },
];

export const ReportLogoModal: React.FC<ReportLogoModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentSettings,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<LogoType>(currentSettings.logoType || 'default');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(currentSettings.customLogoUrl || '');
  const [companyName, setCompanyName] = useState<string>(currentSettings.companyName || 'Hisab Kitab');
  const [companyTagline, setCompanyTagline] = useState<string>(currentSettings.companyTagline || 'Personal & Work Finance');
  const [companyBadge, setCompanyBadge] = useState<string>(currentSettings.companyBadge || 'PRO');
  const [uploadError, setUploadError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(lang === 'bn' ? 'অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন (PNG, JPG, SVG, WebP)' : 'Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError(lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৪ মেগাবাইট (4MB) হতে পারবে' : 'Image size must be less than 4MB');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogoUrl(result);
        setSelectedType('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    setCustomLogoUrl('');
    if (selectedType === 'custom') {
      setSelectedType('default');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    setSelectedType('default');
    setCustomLogoUrl('');
    setCompanyName('Hisab Kitab');
    setCompanyTagline('Personal & Work Finance');
    setCompanyBadge('PRO');
    setUploadError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      logoType: selectedType,
      customLogoUrl: selectedType === 'custom' ? customLogoUrl : (customLogoUrl || ''),
      companyName: companyName.trim() || 'Hisab Kitab',
      companyTagline: companyTagline.trim() || 'Personal & Work Finance',
      companyBadge: companyBadge.trim() || 'PRO',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {lang === 'bn' ? 'রিপোর্টের লোগো ও ব্র্যান্ডিং পরিবর্তন' : 'Change Report Logo & Branding'}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === 'bn' ? 'নিজের লোগো আপলোড করুন অথবা রেডিমেড ডিজাইন থেকে পছন্দ করুন' : 'Upload custom logo or choose from premium presets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Live Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              {lang === 'bn' ? 'লাইভ প্রিভিউ (লেটারহেডে যেভাবে দেখাবে)' : 'Live Letterhead Preview'}
            </span>
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              {renderReportLogoIcon(selectedType, customLogoUrl, 'w-12 h-12')}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900 tracking-tight font-sans">
                    {companyName || 'Hisab Kitab'}
                  </span>
                  {companyBadge && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      {companyBadge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>{companyTagline || 'Personal & Work Finance'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 1: Upload Custom Logo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'bn' ? '১. নিজের ডিভাইস থেকে লোগো আপলোড করুন' : '1. Upload Custom Image/Logo'}</span>
              </label>
              {customLogoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCustomLogo}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
                >
                  {lang === 'bn' ? 'আপলোডকৃত ছবি মুছুন' : 'Remove Uploaded Image'}
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              id="report-custom-logo-input"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                selectedType === 'custom' && customLogoUrl
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              }`}
            >
              {customLogoUrl ? (
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={customLogoUrl}
                    alt="Preview"
                    className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      {lang === 'bn' ? 'কাস্টম লোগো আপলোড সম্পন্ন হয়েছে' : 'Custom Logo Uploaded'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lang === 'bn' ? 'অন্য ছবি আপলোড করতে এখানে ক্লিক করুন' : 'Click to replace with a different image'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {lang === 'bn' ? 'লোগো বা ছবি নির্বাচন করতে ক্লিক করুন' : 'Click to select logo file'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PNG, JPG, SVG, WebP (Max 4MB)
                  </p>
                </div>
              )}
            </div>
            {uploadError && <p className="text-xs text-rose-600 font-medium">{uploadError}</p>}
          </div>

          {/* Option 2: Choose from Preset Logos */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? '২. অথবা আকর্ষণীয় প্রিমিয়াম ডিজাইন থেকে পছন্দ করুন' : '2. Or Choose From Designed Presets'}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_OPTIONS.map((preset) => {
                const isSelected = selectedType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedType(preset.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    {renderReportLogoIcon(preset.id, undefined, 'w-11 h-11')}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {lang === 'bn' ? preset.nameBn : preset.nameEn}
                      </p>
                      <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {lang === 'bn' ? preset.descBn : preset.descEn}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option 3: Brand Text Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              {lang === 'bn' ? '৩. নাম ও ট্যাগলাইন কাস্টমাইজেশন (ঐচ্ছিক)' : '3. Brand Name & Tagline Customization'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {lang === 'bn' ? 'কোম্পানি / ব্র্যান্ডের নাম' : 'Brand Name'}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Hisab Kitab"
                  className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {lang === 'bn' ? 'ব্যাজ (Badge)' : 'Badge Text'}
                </label>
                <input
                  type="text"
                  value={companyBadge}
                  onChange={(e) => setCompanyBadge(e.target.value)}
                  placeholder="PRO"
                  className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {lang === 'bn' ? 'ট্যাগলাইন / উপ-শিরোনাম' : 'Tagline / Subtitle'}
                </label>
                <input
                  type="text"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  placeholder="Personal & Work Finance"
                  className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset to Default'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লোগো সংরক্ষণ করুন' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
