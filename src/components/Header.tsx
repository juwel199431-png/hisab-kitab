import React from 'react';
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
} from 'lucide-react';
import { AccountSection } from '../types/finance';

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
    smartAlerts,
    setIsUniversalSearchOpen,
    isPinEnabled,
    setIsPinModalOpen,
    lockApp,
  } = useFinance();

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

  const hasOverdueAlerts = smartAlerts.some((a) => a.isOverdue);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 no-print shadow-xs transition-colors duration-200">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 h-16">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {lang === 'bn' ? 'হিসাব কিতাব' : 'Hisab Kitab'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {lang === 'bn' ? 'বাংলাদেশ ও কুয়েত ফাইনান্স ম্যানেজার' : 'Personal & Work Ledger'}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                  isActive
                    ? `bg-linear-to-r ${item.activeGradient} scale-[1.03]`
                    : `${item.idleBg} ${item.idleText} ${item.idleBorder} shadow-2xs hover:scale-[1.01]`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconIdle}`} />
                <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Privacy Masking Toggle */}
          <button
            onClick={togglePrivacyMode}
            className={`p-2 rounded-lg transition-all border cursor-pointer ${
              isPrivacyMode
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700 shadow-inner'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={
              lang === 'bn'
                ? isPrivacyMode
                  ? 'টাকার ব্যালেন্স প্রকাশ করুন (প্রাইভেসি বন্ধ)'
                  : 'টাকার ব্যালেন্স লুকান (প্রাইভেসি মোড চালু)'
                : isPrivacyMode
                ? 'Show monetary amounts'
                : 'Hide monetary amounts (Privacy Mode)'
            }
          >
            {isPrivacyMode ? (
              <EyeOff className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {/* Security PIN Lock & Setup Button */}
          <button
            onClick={() => setIsPinModalOpen(true)}
            className={`p-2 rounded-lg transition-all border cursor-pointer relative ${
              isPinEnabled
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-2xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={
              isPinEnabled
                ? lang === 'bn'
                  ? 'নিরাপত্তা পিন লক সক্রিয় (ক্লিক করে অ্যাপ লক করুন বা পিন পরিবর্তন করুন)'
                  : 'PIN Lock Active (Click to lock or manage PIN)'
                : lang === 'bn'
                ? 'নিরাপত্তা পিন কোড সেট করুন'
                : 'Setup Security PIN'
            }
          >
            {isPinEnabled ? (
              <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {!isPinEnabled && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* OLED Dark / Light Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-amber-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={
              lang === 'bn'
                ? theme === 'dark'
                  ? 'লাইট মোড চালু করুন'
                  : 'ডার্ক মোড চালু করুন'
                : theme === 'dark'
                ? 'Switch to Light Mode'
                : 'Switch to Dark Mode'
            }
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Smart Alerts Bell Badge */}
          <button
            onClick={() => setIsAlertsOpen(true)}
            className="relative p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={lang === 'bn' ? 'স্মার্ট তাগাদা ও অ্যালার্ট' : 'Smart Reminders & Due Dates'}
          >
            <Bell className="w-4 h-4" />
            {totalAlertsCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-black rounded-full text-white shadow-xs ${
                  hasOverdueAlerts
                    ? 'bg-rose-600 animate-pulse'
                    : 'bg-amber-500'
                }`}
              >
                {totalAlertsCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap"
            title="ভাষা পরিবর্তন / Switch Language"
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{lang === 'bn' ? 'ENG' : 'বাংলা'}</span>
          </button>

          {/* Cloud & Drive Backup Button */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs whitespace-nowrap cursor-pointer"
            title="গুগল ড্রাইভ ও ব্যাকআপ"
          >
            <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'ব্যাকআপ' : 'Backup'}</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Horizontal Navigation Strip */}
      <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 px-2.5 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all border cursor-pointer ${
                isActive
                  ? `bg-linear-to-r ${item.activeGradient} scale-[1.03]`
                  : `${item.idleBg} ${item.idleText} ${item.idleBorder} shadow-2xs hover:scale-[1.01]`
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconIdle}`} />
              <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

