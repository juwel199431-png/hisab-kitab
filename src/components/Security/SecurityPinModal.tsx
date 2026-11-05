import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ShieldCheck, ShieldAlert, Lock, KeyRound, CheckCircle2 } from 'lucide-react';

export const SecurityPinModal: React.FC = () => {
  const {
    lang,
    isPinModalOpen,
    setIsPinModalOpen,
    isPinEnabled,
    setSecurityPin,
    disableSecurityPin,
    lockApp,
  } = useFinance();

  const [mode, setMode] = useState<'view' | 'set' | 'change' | 'disable'>('view');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  if (!isPinModalOpen) return null;

  const handleClose = () => {
    setIsPinModalOpen(false);
    setMode('view');
    setNewPin('');
    setConfirmPin('');
    setErrorText('');
    setSuccessToast('');
  };

  const handleSetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorText(lang === 'bn' ? 'পিন অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে।' : 'PIN must be exactly 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorText(lang === 'bn' ? 'দুই ঘরের পিন নম্বর মেলেনি!' : 'PIN numbers do not match!');
      return;
    }

    setSecurityPin(newPin);
    setSuccessToast(
      lang === 'bn'
        ? 'সিকিউরিটি পিন সফলভাবে সংরক্ষিত হয়েছে!'
        : 'Security PIN set successfully!'
    );
    setTimeout(() => {
      setSuccessToast('');
      setMode('view');
      setNewPin('');
      setConfirmPin('');
    }, 1500);
  };

  const handleDisablePin = () => {
    const ok = confirm(
      lang === 'bn'
        ? 'আপনি কি নিশ্চিত যে পিন সুরক্ষা নিষ্ক্রিয় করতে চান?'
        : 'Are you sure you want to disable PIN protection?'
    );
    if (!ok) return;

    disableSecurityPin();
    setSuccessToast(
      lang === 'bn'
        ? 'পিন সুরক্ষা বন্ধ করা হয়েছে।'
        : 'PIN protection disabled.'
    );
    setTimeout(() => {
      setSuccessToast('');
      setMode('view');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সিকিউরিটি পিন লক সেটিংস' : 'App Security PIN Protection'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'আপনার ব্যক্তিগত হিসাবের গোপনীয়তা নিশ্চিত করুন' : 'Ensure personal finance privacy'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5">
          {successToast && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {errorText && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorText}</span>
            </div>
          )}

          {/* View Mode: Shows Status and Options */}
          {mode === 'view' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isPinEnabled
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isPinEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {isPinEnabled
                        ? lang === 'bn'
                          ? 'পিন লক বর্তমানে সক্রিয় রয়েছে'
                          : 'PIN Lock is Active'
                        : lang === 'bn'
                        ? 'পিন লক বর্তমানে বন্ধ রয়েছে'
                        : 'PIN Lock is Inactive'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {isPinEnabled
                        ? lang === 'bn'
                          ? 'অ্যাপ খুললে বা স্ক্রিন লক করলে ৪ ডিজিটের পিন চাওয়া হবে'
                          : 'PIN is required to open the application'
                        : lang === 'bn'
                        ? 'কোনো পাসওয়ার্ড ছাড়াই সরাসরি হিসাব দেখা যাচ্ছে'
                        : 'No password is required to view ledger'}
                    </span>
                  </div>
                </div>
              </div>

              {isPinEnabled ? (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      handleClose();
                      lockApp();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'bn' ? 'এখনই অ্যাপ লক করুন' : 'Lock App Right Now'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMode('change');
                        setNewPin('');
                        setConfirmPin('');
                        setErrorText('');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'পিন পরিবর্তন' : 'Change PIN'}</span>
                    </button>

                    <button
                      onClick={handleDisablePin}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'লক বন্ধ করুন' : 'Disable PIN'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setMode('set');
                      setNewPin('');
                      setConfirmPin('');
                      setErrorText('');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'নতুন ৪ ডিজিটের পিন সেট করুন' : 'Set 4-Digit Security PIN'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Set / Change PIN Form */}
          {(mode === 'set' || mode === 'change') && (
            <form onSubmit={handleSetPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {mode === 'set'
                    ? lang === 'bn'
                      ? 'নতুন ৪ ডিজিটের পিন নম্বর দিন'
                      : 'Enter New 4-digit PIN'
                    : lang === 'bn'
                    ? 'নতুন ৪ ডিজিটের পিন নম্বর দিন'
                    : 'Enter New 4-digit PIN'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'কনফার্ম করতে পিনটি পুনরায় লিখুন' : 'Confirm 4-digit PIN'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={newPin.length !== 4 || confirmPin.length !== 4}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save PIN'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
