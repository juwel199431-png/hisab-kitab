import React from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  Coins,
  ArrowRight,
  UserCheck,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { SmartAlert } from '../../types/finance';

export const SmartAlertsModal: React.FC = () => {
  const {
    isAlertsOpen,
    setIsAlertsOpen,
    smartAlerts,
    lang,
    isPrivacyMode,
    setActiveSection,
  } = useFinance();

  if (!isAlertsOpen) return null;

  const handleAction = (alert: SmartAlert) => {
    setActiveSection(alert.actionSection);
    setIsAlertsOpen(false);
  };

  const overdueCount = smartAlerts.filter((a) => a.isOverdue).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-amber-600 via-rose-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {lang === 'bn' ? 'স্মার্ট তাগাদা ও অ্যালার্ট নোটিফিকেশন' : 'Smart Due Dates & Reminders'}
              </h2>
              <p className="text-[11px] text-amber-100">
                {lang === 'bn'
                  ? `${smartAlerts.length} টি সক্রিয় তাগাদা${overdueCount > 0 ? ` (${overdueCount} টি মেয়াদোত্তীর্ণ)` : ''}`
                  : `${smartAlerts.length} active alerts${overdueCount > 0 ? ` (${overdueCount} overdue)` : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAlertsOpen(false)}
            className="p-1 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {smartAlerts.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? 'কোনো বকেয়া বা মেয়াদোত্তীর্ণ তাগাদা নেই!' : 'All clear! No pending dues.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'আপনার সকল লোন, ডিপিএস কিস্তি ও বিল বর্তমানে আপডেট রয়েছে।'
                  : 'All your loans, installments, and bills are up to date.'}
              </p>
            </div>
          ) : (
            smartAlerts.map((alert) => {
              const isOverdue = alert.isOverdue;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOverdue
                      ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/60'
                      : alert.type === 'savings_installment'
                      ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                      : alert.type === 'emdad_unpaid'
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isOverdue
                            ? 'bg-rose-600 text-white shadow-xs'
                            : alert.type === 'savings_installment'
                            ? 'bg-purple-600 text-white'
                            : alert.type === 'emdad_unpaid'
                            ? 'bg-amber-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {isOverdue ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : alert.type === 'savings_installment' ? (
                          <PiggyBank className="w-4 h-4" />
                        ) : alert.type === 'emdad_unpaid' ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {lang === 'bn' ? alert.titleBn : alert.titleEn}
                          </h4>
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white rounded">
                              {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {lang === 'bn' ? alert.descriptionBn : alert.descriptionEn}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold font-mono block ${
                          isOverdue
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatCurrency(alert.amount, alert.currency, lang, isPrivacyMode)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {alert.targetDate ? alert.targetDate : lang === 'bn' ? 'চলতি মাস' : 'This Month'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAction(alert)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'বিবরণ দেখুন' : 'View Section'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsAlertsOpen(false)}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
