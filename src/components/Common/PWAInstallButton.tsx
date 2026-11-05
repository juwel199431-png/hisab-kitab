import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../utils/usePWAInstall';

interface PWAInstallButtonProps {
  lang: 'bn' | 'en';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside standalone PWA, suppress
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-xs hover:shadow-sm transition-all border border-emerald-500/40 cursor-pointer whitespace-nowrap animate-pulse hover:animate-none"
        title={lang === 'bn' ? 'অ্যাপ হিসেবে ইন্সটল করুন (অফলাইন সুবিধা)' : 'Install app locally'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lang === 'bn' ? 'অ্যাপ ইন্সটল' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-700 whitespace-nowrap cursor-pointer"
          title={lang === 'bn' ? 'আইফোনে ইন্সটল করুন' : 'Install on iPhone'}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'bn' ? 'মোবাইলে যোগ করুন' : 'Add to iPhone'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 no-print">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                    HK
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'আইফোনে অ্যাপ ইন্সটল গাইড' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                      {lang === 'bn' ? '১. শেয়ার বাটনে ট্যাপ করুন' : '1. Tap Share in Safari'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn'
                        ? 'সাফারি ব্রাউজারের নিচে শেয়ার (Share) আইকনে চাপ দিন।'
                        : 'Tap the Share icon at the bottom of Safari.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                      {lang === 'bn' ? '২. "Add to Home Screen" দিন' : '2. Add to Home Screen'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn'
                        ? 'নিচে স্ক্রল করে "Add to Home Screen" অপশন সিলেক্ট করুন।'
                        : 'Scroll down and select "Add to Home Screen".'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? 'এরপর মোবাইল হোমস্ক্রিন থেকে সরাসরি অ্যাপের মতো ব্যবহার করতে পারবেন।'
                      : 'You can then launch it fullscreen directly from your home screen!'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                {lang === 'bn' ? 'বুঝেছি / সম্পন্ন' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop quick install hint / manual guide
  return (
    <button
      onClick={() => {
        alert(
          lang === 'bn'
            ? 'ব্রাউজারের অ্যাড্রেস বারের ডান পাশে থাকা "Install" আইকনে ক্লিক করে অথবা মেনু থেকে "Install Hisab Kitab" দিন।'
            : 'Click the Install icon in your browser URL bar or select "Install App" from browser menu.'
        );
      }}
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap cursor-pointer"
      title={lang === 'bn' ? 'কম্পিউটার বা মোবাইলে ইনস্টল করুন' : 'Install to desktop/home screen'}
    >
      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
    </button>
  );
};
