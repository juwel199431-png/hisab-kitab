import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  CloudUpload,
  Landmark,
  Coins,
  Briefcase,
  PiggyBank,
  BarChart3,
  Globe2,
  UserCheck,
  LayoutDashboard,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Bell,
  Lock,
  ShieldCheck,
  Palette,
  SlidersHorizontal,
  Play,
} from 'lucide-react';
import { AccountSection } from '../types/finance';
import { LiveGreetingClock } from './Common/LiveGreetingClock';

export const Header: React.FC = () => {
  const {
    data,
    lang,
    setLang,
    t,
    activeSection,
    setActiveSection,
    setIsQuickAddOpen,
    setIsBackupModalOpen,
    setIsCategoryModalOpen,
    isPrivacyMode,
    togglePrivacyMode,
    theme,
    toggleTheme,
    setIsConverterOpen,
    setIsAlertsOpen,
    totalAlertsCount,
    unreadAlertsCount,
    markAlertsAsSeen,
    isAlertSeen,
    smartAlerts,
    setIsUniversalSearchOpen,
    isPinEnabled,
    setIsPinModalOpen,
    lockApp,
    isCloudOwnerVerified,
    isCloudAuthLoading,
    cloudSyncError,
    isCloudSynced,
    forcePushToCloud,
    setIsWelcomeIntroOpen,
    setIsThemeModalOpen,
    themePrefs,
  } = useFinance();

  const [justSynced, setJustSynced] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isMenuOpen]);

  const handleSyncClick = () => {
    if (!isCloudOwnerVerified) {
      setIsPinModalOpen(true);
      return;
    }
    forcePushToCloud();
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2000);
  };

  const navItems: {
    id: AccountSection;
    labelBn: string;
    labelEn: string;
    icon: React.ElementType;
    activeGradient: string;
    idleBg: string;
    idleText: string;
    idleBorder: string;
    iconIdle: string;
  }[] = [
    {
      id: 'dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      activeGradient: 'from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25 border-indigo-400/40',
      idleBg: 'bg-indigo-50/70 hover:bg-indigo-100/90 dark:bg-slate-800/80 dark:hover:bg-indigo-950/60',
      idleText: 'text-indigo-950 dark:text-indigo-200',
      idleBorder: 'border-indigo-200/90 hover:border-indigo-300 dark:border-slate-700/80 dark:hover:border-indigo-700',
      iconIdle: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'bd-bank',
      labelBn: 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী',
      labelEn: 'BD Bank Accounts',
      icon: Landmark,
      activeGradient: 'from-teal-600 via-emerald-600 to-teal-800 text-white shadow-md shadow-emerald-500/25 border-teal-400/40',
      idleBg: 'bg-teal-50/70 hover:bg-teal-100/90 dark:bg-slate-800/80 dark:hover:bg-teal-950/60',
      idleText: 'text-teal-950 dark:text-teal-200',
      idleBorder: 'border-teal-200/90 hover:border-teal-300 dark:border-slate-700/80 dark:hover:border-teal-700',
      iconIdle: 'text-teal-600 dark:text-teal-400',
    },
    {
      id: 'boss-salary',
      labelBn: 'শাকের ভাই এর বেতন হিসাব',
      labelEn: 'Shaker Bhai Salary',
      icon: Briefcase,
      activeGradient: 'from-amber-500 via-orange-500 to-amber-700 text-white shadow-md shadow-amber-500/25 border-amber-400/40',
      idleBg: 'bg-amber-50/70 hover:bg-amber-100/90 dark:bg-slate-800/80 dark:hover:bg-amber-950/50',
      idleText: 'text-amber-950 dark:text-amber-200',
      idleBorder: 'border-amber-200/90 hover:border-amber-300 dark:border-slate-700/80 dark:hover:border-amber-700',
      iconIdle: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'emdad-expense',
      labelBn: 'ইমদাদ ভাই এর হিসাব',
      labelEn: 'Emdad Bhai Expenses',
      icon: UserCheck,
      activeGradient: 'from-orange-500 via-rose-500 to-red-600 text-white shadow-md shadow-orange-500/25 border-orange-400/40',
      idleBg: 'bg-orange-50/70 hover:bg-orange-100/90 dark:bg-slate-800/80 dark:hover:bg-orange-950/50',
      idleText: 'text-orange-950 dark:text-orange-200',
      idleBorder: 'border-orange-200/90 hover:border-orange-300 dark:border-slate-700/80 dark:hover:border-orange-700',
      iconIdle: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'kuwait-personal',
      labelBn: 'কুয়েত এর পার্সোনাল হিসাব',
      labelEn: 'Kuwait Personal',
      icon: Coins,
      activeGradient: 'from-rose-500 via-pink-600 to-rose-700 text-white shadow-md shadow-rose-500/25 border-rose-400/40',
      idleBg: 'bg-rose-50/70 hover:bg-rose-100/90 dark:bg-slate-800/80 dark:hover:bg-rose-950/50',
      idleText: 'text-rose-950 dark:text-rose-200',
      idleBorder: 'border-rose-200/90 hover:border-rose-300 dark:border-slate-700/80 dark:hover:border-rose-700',
      iconIdle: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'savings-portfolio',
      labelBn: 'ডিপিএস ও ইন্সুরেন্স',
      labelEn: 'DPS & Savings',
      icon: PiggyBank,
      activeGradient: 'from-purple-600 via-fuchsia-600 to-indigo-800 text-white shadow-md shadow-purple-500/25 border-purple-400/40',
      idleBg: 'bg-purple-50/70 hover:bg-purple-100/90 dark:bg-slate-800/80 dark:hover:bg-purple-950/50',
      idleText: 'text-purple-950 dark:text-purple-200',
      idleBorder: 'border-purple-200/90 hover:border-purple-300 dark:border-slate-700/80 dark:hover:border-purple-700',
      iconIdle: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'reports',
      labelBn: 'মাসিক রিপোর্ট',
      labelEn: 'Reports',
      icon: BarChart3,
      activeGradient: 'from-cyan-600 via-blue-600 to-indigo-800 text-white shadow-md shadow-cyan-500/25 border-cyan-400/40',
      idleBg: 'bg-cyan-50/70 hover:bg-cyan-100/90 dark:bg-slate-800/80 dark:hover:bg-cyan-950/50',
      idleText: 'text-cyan-950 dark:text-cyan-200',
      idleBorder: 'border-cyan-200/90 hover:border-cyan-300 dark:border-slate-700/80 dark:hover:border-cyan-700',
      iconIdle: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  const hasUnreadOverdueAlerts = smartAlerts.some((a) => a.isOverdue && !isAlertSeen(a.id, true));

  const customSubtitle = themePrefs.profileTitle?.trim();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print shadow-xs transition-colors duration-200">
      {/* Tier 1: Modern Brand Identity & Control Center */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Modern Brand Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-xl shadow-md border border-emerald-500/30 overflow-hidden shrink-0 bg-white dark:bg-slate-800 p-0.5">
            <img
              src="/assets/aistudio/Hisabify_Personal_Finance_Logo_dcec8d4f.png"
              alt="Hisabify Official Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                {lang === 'bn' ? 'হিসাব কিতাব' : 'Hisab Kitab'}
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 tracking-wider uppercase shrink-0">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5 max-w-[200px] sm:max-w-xs">
              {customSubtitle || (lang === 'bn' ? 'বাংলাদেশ ও কুয়েত ফাইনান্স ম্যানেজার' : 'Personal & Work Finance')}
            </p>
          </div>
        </div>

        {/* Center: Minimal Live Greeting Pill (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-center">
          <LiveGreetingClock
            lang={lang}
            userName={themePrefs.userName}
            profileTitle={themePrefs.profileTitle}
            onReplayIntro={() => setIsWelcomeIntroOpen(true)}
          />
        </div>

        {/* Right Side: Minimal, Sleek 2-Element Control Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Quiet Live Sync Pill */}
          <button
            onClick={handleSyncClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-full transition-all border whitespace-nowrap cursor-pointer ${
              isCloudAuthLoading
                ? 'text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                : !isCloudOwnerVerified
                ? 'text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/50 hover:bg-amber-100/80 border-amber-200/80 dark:border-amber-800/70'
                : cloudSyncError
                ? 'text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/70'
                : justSynced
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700/80'
            }`}
            title={
              !isCloudOwnerVerified
                ? lang === 'bn'
                  ? 'ক্লাউড সিঙ্ক করতে Google অ্যাকাউন্টে সাইন-ইন করুন'
                  : 'Sign in with Google to sync'
                : cloudSyncError
                ? cloudSyncError
                : lang === 'bn'
                ? 'ক্লাউড সিঙ্ক সক্রিয় (ক্লিক করে সিঙ্ক করুন)'
                : 'Cloud Sync Active (Click to sync)'
            }
          >
            {isCloudAuthLoading ? (
              <span>{lang === 'bn' ? '...' : '...'}</span>
            ) : !isCloudOwnerVerified ? (
              <>
                <Lock className="w-3 h-3 shrink-0" />
                <span>{lang === 'bn' ? 'সাইন-ইন' : 'Login'}</span>
              </>
            ) : (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    justSynced
                      ? 'bg-white'
                      : cloudSyncError
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {justSynced
                    ? lang === 'bn'
                      ? 'সিঙ্কড!'
                      : 'Synced!'
                    : cloudSyncError
                    ? lang === 'bn'
                      ? 'ত্রুটি'
                      : 'Err'
                    : lang === 'bn'
                    ? 'সিঙ্কড'
                    : 'Synced'}
                </span>
              </>
            )}
          </button>

          {/* 2. Unified Minimal Action Pill (Privacy, Alerts, Backup, More Menu) */}
          <div className="relative" ref={menuRef}>
            <div className="flex items-center gap-0.5 bg-slate-100/85 dark:bg-slate-800/85 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/70">
              {/* Privacy Toggle */}
              <button
                onClick={togglePrivacyMode}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isPrivacyMode
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
                title={
                  isPrivacyMode
                    ? lang === 'bn' ? 'ব্যালেন্স দেখুন' : 'Show balances'
                    : lang === 'bn' ? 'ব্যালেন্স লুকান' : 'Hide balances'
                }
              >
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              {/* Alerts Bell */}
              <button
                onClick={() => {
                  markAlertsAsSeen();
                  setIsAlertsOpen(true);
                }}
                className="relative p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                title={lang === 'bn' ? 'স্মার্ট অ্যালার্ট' : 'Smart Alerts'}
              >
                <Bell className={`w-3.5 h-3.5 ${unreadAlertsCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                {unreadAlertsCount > 0 && (
                  <span
                    className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                      hasUnreadOverdueAlerts ? 'bg-rose-600' : 'bg-amber-500'
                    }`}
                  />
                )}
              </button>

              {/* Cloud Backup */}
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                title={lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর' : 'Backup & Restore'}
              >
                <CloudUpload className="w-3.5 h-3.5" />
              </button>

              {/* Sleek Settings & Customization Popover Trigger */}
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`relative p-1.5 rounded-full transition-all cursor-pointer ${
                  isMenuOpen
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
                title={lang === 'bn' ? 'সেটিংস ও ডিজাইন' : 'Settings & Appearance'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {!isPinEnabled && !isMenuOpen && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>
            </div>

            {/* Minimal Floating Settings & Appearance Dropdown */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700/80 p-1.5 z-50 animate-fade-in">
                {/* Theme & Font Studio */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsThemeModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'bn' ? 'প্রোফাইল, থিম ও ফন্ট' : 'Profile, Theme & Font'}</span>
                  </span>
                </button>

                {/* Dark / Light Mode Quick Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>
                      {theme === 'dark'
                        ? lang === 'bn'
                          ? 'লাইট মোড চালু করুন'
                          : 'Switch to Light Mode'
                        : lang === 'bn'
                        ? 'ডার্ক মোড চালু করুন'
                        : 'Switch to Dark Mode'}
                    </span>
                  </span>
                </button>

                {/* Security & Cloud Lock */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsPinModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    {isPinEnabled ? (
                      <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{lang === 'bn' ? 'সিকিউরিটি ও পিন লক' : 'Security & PIN Lock'}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isPinEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isPinEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Language Switcher */}
                <button
                  onClick={() => {
                    setLang(lang === 'bn' ? 'en' : 'bn');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Globe2 className="w-4 h-4 text-slate-500" />
                    <span>{lang === 'bn' ? 'ভাষা পরিবর্তন' : 'Language'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'বাংলা → ENG' : 'ENG → বাংলা'}
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Replay Welcome Intro */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsWelcomeIntroOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ওয়েলকাম স্লাইড দেখুন' : 'Replay Welcome Intro'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier 2: Dedicated Full-Width Account Heads Navigation Strip */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/90 py-2 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold rounded-xl whitespace-nowrap shrink-0 transition-all border cursor-pointer select-none ${
                    isActive
                      ? `bg-linear-to-r ${item.activeGradient} shadow-md scale-[1.02]`
                      : `${item.idleBg} ${item.idleText} ${item.idleBorder} shadow-2xs hover:scale-[1.01]`
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.iconIdle}`} />
                  <span className="tracking-tight">{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

