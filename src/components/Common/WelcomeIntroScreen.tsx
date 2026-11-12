import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Volume2, VolumeX, Play, Pause, X, Heart } from 'lucide-react';

interface WelcomeIntroScreenProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'bn' | 'en';
}

export const WelcomeIntroScreen: React.FC<WelcomeIntroScreenProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
}) => {
  const [progress, setProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0); // 0: Salam, 1: Welcome, 2: Wishing well
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const audioPlayedRef = useRef(false);

  const TOTAL_DURATION_MS = 5500; // 5.5 seconds total cinematic intro

  // Web Audio API gentle harmonic startup chime
  const playPeacefulChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      // Peaceful warm major pentatonic chime (C5, E5, G5, B5, C6)
      const frequencies = [523.25, 659.25, 783.99, 987.77, 1046.5];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.14 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 1.5);
      });
    } catch {
      // Audio playback restrictions fallback
    }
  };

  // Trigger sound on initial open
  useEffect(() => {
    if (isOpen && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      const timer = setTimeout(() => {
        playPeacefulChime();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      audioPlayedRef.current = false;
      setProgress(0);
      setCurrentSlide(0);
      setIsExiting(false);
    }
  }, [isOpen]);

  // Main animation timer and progress bar
  useEffect(() => {
    if (!isOpen || isPaused || isExiting) return;

    const intervalMs = 40;
    const step = (intervalMs / TOTAL_DURATION_MS) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          handleComplete();
          return 100;
        }
        // Sequence phases:
        // 0% - 33%: Slide 0 (আসসালামু আলাইকুম)
        // 34% - 68%: Slide 1 (স্বাগতম হিসাব কিতাব অ্যাপে)
        // 69% - 100%: Slide 2 (আপনার দিনটি ভালো কাটুক)
        if (next < 34) {
          setCurrentSlide(0);
        } else if (next < 68) {
          setCurrentSlide(1);
        } else {
          setCurrentSlide(2);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isExiting]);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl transition-all duration-700 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Aurora Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        
        {/* Subtle geometric grid backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Top Video Header Controls */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-white/70 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
            {lang === 'bn' ? 'ওয়েলকাম প্রিমিয়াম স্লাইড' : 'Welcome Presentation'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title={isPaused ? (lang === 'bn' ? 'প্লে করুন' : 'Play') : (lang === 'bn' ? 'পজ করুন' : 'Pause')}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (!nextMuted) playPeacefulChime();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title={isMuted ? (lang === 'bn' ? 'সাউন্ড অন করুন' : 'Unmute') : (lang === 'bn' ? 'মিউট করুন' : 'Mute')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleComplete}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Cinematic Video Container */}
      <div className="relative z-10 max-w-lg w-full mx-4 text-center px-4 py-8">
        {/* Floating Official App Logo */}
        <div className="relative mx-auto w-24 h-24 mb-6 transition-all duration-700">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 blur-xl opacity-60 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400/50 shadow-2xl p-1 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/aistudio/Hisabify_Personal_Finance_Logo_dcec8d4f.png"
              alt="Hisabify Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Phase 1: আসসালামু আলাইকুম */}
        {currentSlide === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-widest uppercase">
              <span>﷽</span>
              <span>•</span>
              <span>শান্তি ও কল্যাণ বর্ষিত হোক</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-emerald-300 tracking-tight">
              {lang === 'bn' ? 'আসসালামু আলাইকুম' : 'Assalamu Alaikum'}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-sm mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'আল্লাহর রহমত ও বরকত আপনার সার্বিক জীবনে বিরাজ করুক।'
                : 'May peace, mercy, and blessings be upon you.'}
            </p>
          </div>
        )}

        {/* Phase 2: স্বাগতম হিসাব কিতাব অ্যাপে */}
        {currentSlide === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>{lang === 'bn' ? 'আপনার ব্যক্তিগত ফিন্যান্সিয়াল সহকারী' : 'Personal Finance Manager'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-indigo-300 tracking-tight">
              {lang === 'bn' ? 'স্বাগতম হিসাব কিতাব অ্যাপে' : 'Welcome to Hisab Kitab'}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'বাংলাদেশ ও কুয়েত পার্সোনাল এবং কর্মক্ষেত্রের নির্ভুল আর্থিক হিসাবরক্ষক।'
                : 'Your dedicated financial ledger for Bangladesh & Kuwait personal finance.'}
            </p>
          </div>
        )}

        {/* Phase 3: আপনার দিনটি ভালো কাটুক। */}
        {currentSlide === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
              <span>{lang === 'bn' ? 'শুভকামনা ও দোয়া' : 'Warm Wishes'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-rose-300 tracking-tight">
              {lang === 'bn' ? 'আপনার দিনটি ভালো কাটুক।' : 'Have a Wonderful Day!'}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-sm mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'হিসাব কিতাব প্রস্তুত। আপনার আর্থিক ভবিষ্যৎ হোক নিরাপদ ও সমৃদ্ধ।'
                : 'Everything is ready for your productive and successful day.'}
            </p>
          </div>
        )}

        {/* Enter Dashboard Button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleComplete}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'সরাসরি অ্যাপে প্রবেশ করুন' : 'Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <span className="text-[11px] text-slate-400">
            {lang === 'bn' ? 'স্বয়ংক্রিয়ভাবে প্রবেশ করতে অপেক্ষা করুন' : 'Auto-entering in a few seconds...'}
          </span>
        </div>
      </div>

      {/* Bottom Video Progress Timeline Bar */}
      <div className="absolute bottom-6 left-8 right-8 z-20">
        <div className="max-w-md mx-auto space-y-2">
          {/* 3 Step Indicator Tabs */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
            <span
              className={`transition-colors duration-300 ${
                currentSlide === 0 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              ১. আসসালামু আলাইকুম
            </span>
            <span
              className={`transition-colors duration-300 ${
                currentSlide === 1 ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              ২. স্বাগতম
            </span>
            <span
              className={`transition-colors duration-300 ${
                currentSlide === 2 ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              ৩. শুভকামনা
            </span>
          </div>

          {/* Smooth Linear Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-amber-400 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
