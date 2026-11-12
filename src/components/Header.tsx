import React, { useState } from 'react';
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
  Sparkles,
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
    isCloudSynced,
    forcePushToCloud,
    openAIAssistantWithTab,
    setIsWelcomeIntroOpen,
  } = useFinance();

  const [justSynced, setJustSynced] = useState(false);

  const handleSyncClick = () => {
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
      idleBg: 'bg-indigo-50/70 hover:bg-indigo-100/90',
      idleText: 'text-indigo-950',
      idleBorder: 'border-indigo-200/90 hover:border-indigo-300',
      iconIdle: 'text-indigo-600',
    },
    {
      id: 'bd-bank',
      labelBn: 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী',
      labelEn: 'BD Bank Accounts',
      icon: Landmark,
      activeGradient: 'from-teal-600 via-emerald-600 to-teal-800 text-white shadow-md shadow-emerald-500/25 border-teal-400/40',
      idleBg: 'bg-teal-50/70 hover:bg-teal-100/90',
      idleText: 'text-teal-950',
      idleBorder: 'border-teal-200/90 hover:border-teal-300',
      iconIdle: 'text-teal-600',
    },
    {
      id: 'boss-salary',
      labelBn: 'শাকের ভাই এর বেতন হিসাব',
      labelEn: 'Shaker Bhai Salary',
      icon: Briefcase,
      activeGradient: 'from-amber-500 via-orange-500 to-amber-700 text-white shadow-md shadow-amber-500/25 border-amber-400/40',
      idleBg: 'bg-amber-50/70 hover:bg-amber-100/90',
      idleText: 'text-amber-950',
      idleBorder: 'border-amber-200/90 hover:border-amber-300',
      iconIdle: 'text-amber-600',
    },
    {
      id: 'emdad-expense',
      labelBn: 'ইমদাদ ভাই এর হিসাব',
      labelEn: 'Emdad Bhai Expenses',
      icon: UserCheck,
      activeGradient: 'from-orange-500 via-rose-500 to-red-600 text-white shadow-md shadow-orange-500/25 border-orange-400/40',
      idleBg: 'bg-orange-50/70 hover:bg-orange-100/90',
      idleText: 'text-orange-950',
      idleBorder: 'border-orange-200/90 hover:border-orange-300',
      iconIdle: 'text-orange-600',
    },
    {
      id: 'kuwait-personal',
      labelBn: 'কুয়েত এর পার্সোনাল হিসাব',
      labelEn: 'Kuwait Personal',
      icon: Coins,
      activeGradient: 'from-rose-500 via-pink-600 to-rose-700 text-white shadow-md shadow-rose-500/25 border-rose-400/40',
      idleBg: 'bg-rose-50/70 hover:bg-rose-100/90',
      idleText: 'text-rose-950',
      idleBorder: 'border-rose-200/90 hover:border-rose-300',
      iconIdle: 'text-rose-600',
    },
    {
      id: 'savings-portfolio',
      labelBn: 'ডিপিএস ও ইন্সুরেন্স',
      labelEn: 'DPS & Savings',
      icon: PiggyBank,
      activeGradient: 'from-purple-600 via-fuchsia-600 to-indigo-800 text-white shadow-md shadow-purple-500/25 border-purple-400/40',
      idleBg: 'bg-purple-50/70 hover:bg-purple-100/90',
      idleText: 'text-purple-950',
      idleBorder: 'border-purple-200/90 hover:border-purple-300',
      iconIdle: 'text-purple-600',
    },
    {
      id: 'reports',
      labelBn: 'মাসিক রিপোর্ট',
      labelEn: 'Reports',
      icon: BarChart3,
      activeGradient: 'from-cyan-600 via-blue-600 to-indigo-800 text-white shadow-md shadow-cyan-500/25 border-cyan-400/40',
      idleBg: 'bg-cyan-50/70 hover:bg-cyan-100/90',
      idleText: 'text-cyan-950',
      idleBorder: 'border-cyan-200/90 hover:border-cyan-300',
      iconIdle: 'text-cyan-600',
    },
  ];

  const hasUnreadOverdueAlerts = smartAlerts.some((a) => a.isOverdue && !isAlertSeen(a.id, true));

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print shadow-xs transition-colors duration-200">
      {/* Tier 1: Modern Brand Identity & Control Center */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Modern Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-11 h-11 rounded-xl shadow-md border border-emerald-500/30 overflow-hidden shrink-0 bg-white dark:bg-slate-800 p-0.5">
            <img
              src="/assets/aistudio/Hisabify_Personal_Finance_Logo_dcec8d4f.png"
              alt="Hisabify Official Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                {lang === 'bn' ? 'হিসাব কিতাব' : 'Hisab Kitab'}
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 tracking-wider uppercase">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'বাংলাদেশ ও কুয়েত ফাইনান্স ম্যানেজার' : 'Personal & Work Finance'}</span>
            </p>
          </div>
        </div>

        {/* Live Timing & Time-Based Greeting in Top Corner */}
        <div className="hidden lg:flex items-center justify-center">
          <LiveGreetingClock
            lang={lang}
            onReplayIntro={() => setIsWelcomeIntroOpen(true)}
          />
        </div>

        {/* Right Side: Clean, Structured & De-cluttered Control Center */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile/Tablet Compact Greeting Clock */}
          <div className="lg:hidden flex items-center">
            <LiveGreetingClock
              lang={lang}
              onReplayIntro={() => setIsWelcomeIntroOpen(true)}
              className="scale-90"
            />
          </div>
          {/* AI Smart Assistant Trigger Button */}
          <button
            onClick={() => openAIAssistantWithTab('voice')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border shadow-xs whitespace-nowrap cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white border-indigo-300/40 hover:scale-[1.03] hover:shadow-indigo-500/25 active:scale-95"
            title={lang === 'bn' ? 'এআই স্মার্ট সহকারী (ভয়েস এন্ট্রি, রসিদ স্ক্যান, এসএমএস ও হিসাব পরামর্শ)' : 'AI Smart Assistant (Voice entry, receipt scanner, SMS & insights)'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{lang === 'bn' ? 'AI সহকারী' : 'AI Assistant'}</span>
          </button>

          {/* 1. Live Real-time Cloud Sync Indicator */}
          <button
            onClick={handleSyncClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border shadow-2xs whitespace-nowrap cursor-pointer ${
              justSynced
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/30 scale-105'
                : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border-emerald-300 dark:border-emerald-700 hover:scale-[1.02]'
            }`}
            title={lang === 'bn' ? 'রিয়েল-টাইম ক্লাউড সিঙ্ক সক্রিয় (ক্লিক করে এখনই ম্যানুয়াল সিঙ্ক করুন)' : 'Real-time Cloud Sync Active (Click to sync now)'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold">{justSynced ? (lang === 'bn' ? 'সিঙ্ক হয়েছে!' : 'Synced!') : (lang === 'bn' ? 'সিঙ্কড' : 'Synced')}</span>
          </button>

          {/* 2. Unified Preferences Control Pill (Privacy, PIN, Dark Mode) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            {/* Privacy Mask Toggle */}
            <button
              onClick={togglePrivacyMode}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isPrivacyMode
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
              title={
                isPrivacyMode
                  ? lang === 'bn' ? 'টাকার ব্যালেন্স প্রকাশ করুন (প্রাইভেসি বন্ধ)' : 'Show balances'
                  : lang === 'bn' ? 'টাকার ব্যালেন্স লুকান (প্রাইভেসি চালু)' : 'Hide balances'
              }
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Security PIN Lock */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
                isPinEnabled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
              }`}
              title={
                isPinEnabled
                  ? lang === 'bn' ? 'নিরাপত্তা পিন সক্রিয় (ক্লিক করে অ্যাপ লক করুন)' : 'PIN Lock Active'
                  : lang === 'bn' ? 'নিরাপত্তা পিন কোড সেট করুন' : 'Setup PIN Lock'
              }
            >
              {isPinEnabled ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {!isPinEnabled && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Dark / Light Mode */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-600 dark:text-amber-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title={
                theme === 'dark'
                  ? lang === 'bn' ? 'লাইট মোড চালু করুন' : 'Switch to Light Mode'
                  : lang === 'bn' ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode'
              }
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* 3. Smart Alerts Bell */}
          <button
            onClick={() => {
              markAlertsAsSeen();
              setIsAlertsOpen(true);
            }}
            className="relative p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={
              lang === 'bn'
                ? unreadAlertsCount > 0
                  ? `${unreadAlertsCount} টি নতুন আনরীড নোটিফিকেশন`
                  : 'স্মার্ট তাগাদা ও অ্যালার্ট'
                : 'Smart Alerts'
            }
          >
            <Bell className={`w-4 h-4 ${unreadAlertsCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} />
            {unreadAlertsCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-black rounded-full text-white shadow-xs ${
                  hasUnreadOverdueAlerts ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
                }`}
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* 4. Language Switcher */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Switch Language"
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{lang === 'bn' ? 'ENG' : 'বাংলা'}</span>
          </button>

          {/* 5. Cloud Backup Button */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-xl transition-colors border border-emerald-300 dark:border-emerald-700 shadow-2xs whitespace-nowrap cursor-pointer"
            title={lang === 'bn' ? 'গুগল ড্রাইভ ও ব্যাকআপ' : 'Backup & Restore'}
          >
            <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{lang === 'bn' ? 'ব্যাকআপ' : 'Backup'}</span>
          </button>
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

