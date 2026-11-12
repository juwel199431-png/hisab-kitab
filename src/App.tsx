/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { BangladeshBankingView } from './components/BangladeshBanking/BangladeshBankingView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { KuwaitPersonalView } from './components/KuwaitPersonal/KuwaitPersonalView';
import { BossSalaryView } from './components/BossSalary/BossSalaryView';
import { EmdadBhaiView } from './components/EmdadBhai/EmdadBhaiView';
import { KuwaitExtraIncomeView } from './components/KuwaitExtraIncome/KuwaitExtraIncomeView';
import { SavingsPortfolioView } from './components/SavingsPortfolio/SavingsPortfolioView';
import { ReportsView } from './components/Reports/ReportsView';
import { QuickAddModal } from './components/QuickAddModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { CurrencyConverterModal } from './components/Common/CurrencyConverterModal';
import { SmartAlertsModal } from './components/Common/SmartAlertsModal';
import { OfflineIndicator } from './components/Common/OfflineIndicator';
import { UniversalSearchModal } from './components/Common/UniversalSearchModal';
import { PinLockScreen } from './components/Security/PinLockScreen';
import { SecurityPinModal } from './components/Security/SecurityPinModal';
import { AIAssistantModal } from './components/AI/AIAssistantModal';
import { WelcomeIntroScreen } from './components/Common/WelcomeIntroScreen';
import { Plus, Tags, CloudUpload, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeSection,
    lang,
    setIsQuickAddOpen,
    setIsCategoryModalOpen,
    setIsBackupModalOpen,
    isUniversalSearchOpen,
    setIsUniversalSearchOpen,
    isPinEnabled,
    isAppLocked,
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    aiAssistantInitialTab,
    openAIAssistantWithTab,
    isWelcomeIntroOpen,
    setIsWelcomeIntroOpen,
  } = useFinance();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Security Fullscreen PIN Lock */}
      {isPinEnabled && isAppLocked && <PinLockScreen />}

      {/* Top Bar Navigation */}
      <Header />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20">
        {activeSection === 'dashboard' && <DashboardView />}
        {activeSection === 'bd-bank' && <BangladeshBankingView />}
        {activeSection === 'boss-salary' && <BossSalaryView />}
        {activeSection === 'emdad-expense' && <EmdadBhaiView />}
        {activeSection === 'kuwait-personal' && <KuwaitPersonalView />}
        {activeSection === 'kuwait-extra-income' && <KuwaitPersonalView initialTab="extra-income" />}
        {activeSection === 'savings-portfolio' && <SavingsPortfolioView />}
        {activeSection === 'reports' && <ReportsView />}
      </main>

      {/* Floating Action Buttons for Rapid Mobile/Desktop Entry */}
      <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2.5 no-print">
        {/* AI Assistant Floating Button */}
        <button
          onClick={() => openAIAssistantWithTab('voice')}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white shadow-lg shadow-purple-900/25 border border-indigo-400/40 transition-all hover:scale-105 font-bold text-xs cursor-pointer group"
          title={lang === 'bn' ? 'এআই স্মার্ট সহকারী (ভয়েস, রসিদ স্ক্যান, এসএমএস ও চ্যাট)' : 'AI Smart Assistant'}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">{lang === 'bn' ? 'AI সহকারী' : 'AI Assistant'}</span>
        </button>

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-md border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          title={lang === 'bn' ? 'ক্যাটাগরি ম্যানেজমেন্ট' : 'Manage Categories'}
        >
          <Tags className="w-4 h-4 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg transition-all hover:scale-105 font-bold text-xs cursor-pointer"
          title={lang === 'bn' ? 'দ্রুত লেনদেন এন্ট্রি' : 'Quick Financial Entry'}
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">{lang === 'bn' ? 'নতুন এন্ট্রি' : 'Quick Add'}</span>
        </button>
      </div>

      {/* Modals & Offline Toast */}
      <QuickAddModal />
      <BackupRestoreModal />
      <CategoryManagerModal />
      <CurrencyConverterModal />
      <SmartAlertsModal />
      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
      />
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        initialTab={aiAssistantInitialTab}
      />
      <SecurityPinModal />
      <OfflineIndicator lang={lang} />
      <WelcomeIntroScreen
        isOpen={isWelcomeIntroOpen}
        onClose={() => setIsWelcomeIntroOpen(false)}
        lang={lang}
      />

      {/* Quiet Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto text-xs text-slate-500 dark:text-slate-400 no-print transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-emerald-500/30 overflow-hidden bg-white dark:bg-slate-800 p-0.5 shrink-0 shadow-2xs">
              <img
                src="/assets/aistudio/Hisabify_Personal_Finance_Logo_dcec8d4f.png"
                alt="Hisabify Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {lang === 'bn' ? 'হিসাব কিতাব - ব্যক্তিগত ও কর্মক্ষেত্রের নির্ভুল হিসাবরক্ষক' : 'Hisab Kitab Finance Manager'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {lang === 'bn'
                  ? 'অফলাইন ও স্বয়ংক্রিয় লোকাল সেভ। ডাটা স্থায়ীভাবে সুরক্ষিত রাখতে ড্রাইভ ব্যাকআপ নিন।'
                  : 'Offline-first personal financial manager with cloud backup.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'ক্যাটাগরি কাস্টমাইজ' : 'Custom Categories'}
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'bn' ? 'ড্রাইভ ব্যাকআপ' : 'Drive Backup'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
