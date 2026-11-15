import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  Cloud,
  LogOut,
  LogIn,
  Shield,
} from 'lucide-react';
import { AUTHORIZED_OWNER_EMAIL } from '../../firebase';

export const SecurityPinModal: React.FC = () => {
  const {
    lang,
    isPinModalOpen,
    setIsPinModalOpen,
    isPinEnabled,
    pinLength,
    pinLockoutRemainingSec,
    setSecurityPin,
    disableSecurityPin,
    verifySecurityPin,
    lockApp,
    cloudUser,
    isCloudOwnerVerified,
    cloudSyncError,
    signInToCloud,
    signOutFromCloud,
  } = useFinance();

  const [mode, setMode] = useState<'view' | 'set' | 'change' | 'disable'>('view');
  const [selectedLength, setSelectedLength] = useState<4 | 6>(pinLength);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);

  if (!isPinModalOpen) return null;

  const resetForm = () => {
    setMode('view');
    setSelectedLength(pinLength);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorText('');
    setIsBusy(false);
  };

  const handleClose = () => {
    setIsPinModalOpen(false);
    resetForm();
    setSuccessToast('');
  };

  const handleCloudAuthAction = async () => {
    setErrorText('');
    setIsBusy(true);
    try {
      if (isCloudOwnerVerified) {
        await signOutFromCloud();
        setSuccessToast(
          lang === 'bn' ? 'ক্লাউড অ্যাকাউন্ট থেকে সাইন-আউট হয়েছে।' : 'Signed out from Cloud.'
        );
      } else {
        await signInToCloud();
        setSuccessToast(
          lang === 'bn'
            ? 'সফল! আপনার ক্লাউড লেজার সম্পূর্ণ সুরক্ষিতভাবে সংযুক্ত হয়েছে।'
            : 'Verified! Cloud Ledger sync is now active.'
        );
      }
      setTimeout(() => setSuccessToast(''), 2500);
    } catch (err: any) {
      setErrorText(err?.message || 'অথেনটিকেশন সম্পন্ন করা যায়নি।');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (pinLockoutRemainingSec > 0) {
      setErrorText(
        lang === 'bn'
          ? `নিরাপত্তার জন্য ${pinLockoutRemainingSec} সেকেন্ড অপেক্ষা করুন।`
          : `Wait ${pinLockoutRemainingSec}s before trying again.`
      );
      return;
    }

    setIsBusy(true);
    try {
      // Require current PIN before changing existing PIN
      if (mode === 'change') {
        if (currentPin.length !== pinLength) {
          setErrorText(
            lang === 'bn'
              ? `আগে বর্তমান ${pinLength} ডিজিটের পিন লিখুন।`
              : `Enter your current ${pinLength}-digit PIN first.`
          );
          return;
        }
        const check = await verifySecurityPin(currentPin);
        if (!check.ok) {
          setErrorText(
            check.lockedRemainingSec > 0
              ? lang === 'bn'
                ? `ভুল পিন! ${check.lockedRemainingSec} সেকেন্ডের জন্য লকড।`
                : `Locked for ${check.lockedRemainingSec}s.`
              : lang === 'bn'
              ? `বর্তমান পিন ভুল! আরও ${check.remainingBeforeLock} বার চেষ্টা বাকি।`
              : `Current PIN incorrect! ${check.remainingBeforeLock} tries left.`
          );
          return;
        }
      }

      const pinRegex = selectedLength === 6 ? /^\d{6}$/ : /^\d{4}$/;
      if (newPin.length !== selectedLength || !pinRegex.test(newPin)) {
        setErrorText(
          lang === 'bn'
            ? `নতুন পিন অবশ্যই ${selectedLength} ডিজিটের সংখ্যা হতে হবে।`
            : `New PIN must be exactly ${selectedLength} digits.`
        );
        return;
      }

      if (newPin !== confirmPin) {
        setErrorText(lang === 'bn' ? 'দুই ঘরের পিন নম্বর মেলেনি!' : 'PIN numbers do not match!');
        return;
      }

      await setSecurityPin(newPin);
      setSuccessToast(
        lang === 'bn'
          ? 'সিকিউরিটি পিন SHA-256 হ্যাশ দিয়ে সংরক্ষিত হয়েছে!'
          : 'Security PIN encrypted and saved!'
      );
      setTimeout(() => {
        setSuccessToast('');
        resetForm();
      }, 1500);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisablePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (pinLockoutRemainingSec > 0) {
      setErrorText(
        lang === 'bn'
          ? `অপেক্ষা করুন (${pinLockoutRemainingSec} সেকেন্ড বাকি)।`
          : `Wait ${pinLockoutRemainingSec}s.`
      );
      return;
    }

    if (currentPin.length !== pinLength) {
      setErrorText(
        lang === 'bn'
          ? `পিন বন্ধ করতে বর্তমান ${pinLength} ডিজিটের পিন দিন।`
          : `Enter your current ${pinLength}-digit PIN to disable.`
      );
      return;
    }

    setIsBusy(true);
    try {
      const check = await verifySecurityPin(currentPin);
      if (!check.ok) {
        setErrorText(
          check.lockedRemainingSec > 0
            ? lang === 'bn'
              ? `ভুল পিন! ${check.lockedRemainingSec} সেকেন্ড লকড।`
              : `Locked for ${check.lockedRemainingSec}s.`
            : lang === 'bn'
            ? `পিন মেলেনি! (${check.remainingBeforeLock} চেষ্টা বাকি)`
            : `Incorrect PIN! (${check.remainingBeforeLock} tries left)`
        );
        return;
      }

      disableSecurityPin();
      setSuccessToast(
        lang === 'bn' ? 'পিন সুরক্ষা নিরাপদে বন্ধ করা হয়েছে।' : 'PIN protection disabled.'
      );
      setTimeout(() => {
        setSuccessToast('');
        resetForm();
      }, 1200);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transition-colors max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সিকিউরিটি ও ক্লাউড সুরক্ষা কেন্দ্র' : 'Security & Cloud Center'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'হিসাব সুরক্ষা, পিন লক ও মালিকানা যাচাই'
                  : 'Owner Auth, Salted PIN Lock & Data Shields'}
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {successToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {(errorText || cloudSyncError) && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorText || cloudSyncError}</span>
            </div>
          )}

          {/* View Mode: Cloud Lock + PIN Lock + Active Shields */}
          {mode === 'view' && (
            <div className="space-y-4">
              {/* 1. Google Owner Cloud Authentication Card */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isCloudOwnerVerified
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isCloudOwnerVerified
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {isCloudOwnerVerified
                          ? lang === 'bn'
                            ? 'ক্লাউড সিঙ্ক সুরক্ষিত ও সক্রিয়'
                            : 'Cloud Sync Verified & Active'
                          : lang === 'bn'
                          ? 'ক্লাউড সিঙ্ক লক করা আছে'
                          : 'Cloud Sync Locked (Sign-In Required)'}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5 leading-snug">
                        {isCloudOwnerVerified
                          ? `${cloudUser?.email} (${lang === 'bn' ? 'মালিক যাচাইকৃত' : 'Verified Owner'})`
                          : lang === 'bn'
                          ? `হ্যাকিং প্রতিরোধে ক্লাউড ডাটাবেস শুধু ${AUTHORIZED_OWNER_EMAIL} এর জন্য লক করা আছে।`
                          : `Firestore is locked exclusively to ${AUTHORIZED_OWNER_EMAIL}.`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleCloudAuthAction}
                  className={`mt-3 w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCloudOwnerVerified
                      ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {isCloudOwnerVerified ? (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ক্লাউড থেকে সাইন-আউট করুন' : 'Sign Out Cloud'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>
                        {isBusy
                          ? lang === 'bn'
                            ? 'সাইন-ইন হচ্ছে...'
                            : 'Signing in...'
                          : lang === 'bn'
                          ? 'Google দিয়ে ক্লাউড আনলক করুন'
                          : 'Sign In with Google to Sync'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. App PIN Lock Card */}
              <div
                className={`p-4 rounded-xl border ${
                  isPinEnabled
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
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
                          ? `অ্যাপ পিন লক সক্রিয় (${pinLength} ডিজিট • PBKDF2 হ্যাশড)`
                          : `PIN Lock Active (${pinLength}-digit • PBKDF2 Hashed)`
                        : lang === 'bn'
                        ? 'অ্যাপ পিন লক বন্ধ রয়েছে'
                        : 'PIN Lock is Inactive'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {isPinEnabled
                        ? lang === 'bn'
                          ? '৫ বার ভুল পিন দিলে স্বয়ংক্রিয়ভাবে ৩০ সেকেন্ডের জন্য লক হবে'
                          : 'Auto-locks 30s after 5 incorrect attempts'
                        : lang === 'bn'
                        ? 'হিসাব নিরাপদ রাখতে ৪ বা ৬ ডিজিটের গোপন পিন সেট করুন'
                        : 'Protect access with a 4 or 6-digit security PIN'}
                    </span>
                  </div>
                </div>

                {isPinEnabled ? (
                  <div className="space-y-2 pt-3 mt-3 border-t border-emerald-200/70 dark:border-emerald-800/60">
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

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setMode('change');
                          setSelectedLength(pinLength);
                          setCurrentPin('');
                          setNewPin('');
                          setConfirmPin('');
                          setErrorText('');
                        }}
                        className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'পিন পরিবর্তন' : 'Change PIN'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setMode('disable');
                          setCurrentPin('');
                          setErrorText('');
                        }}
                        className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'লক বন্ধ করুন' : 'Disable PIN'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMode('set');
                      setSelectedLength(4);
                      setNewPin('');
                      setConfirmPin('');
                      setErrorText('');
                    }}
                    className="mt-3 w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'নতুন পিন সেট করুন (৪ / ৬ ডিজিট)' : 'Set Security PIN'}</span>
                  </button>
                )}
              </div>

              {/* 3. Active Security & Anti-Crash Audit Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'bn' ? 'সক্রিয় সুরক্ষা স্তরসমূহ' : 'Active Security Shields'}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'Firestore ফায়ারওয়াল: শুধু ভেরিফায়েড মালিক প্রবেশযোগ্য'
                        : 'Firestore Rules: Verified owner lock active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'ক্রাশ প্রোটেকশন (ErrorBoundary) ও ডাটা স্যানিটাইজার'
                        : 'Crash ErrorBoundary & Corrupt-Data Rescue'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'AES-GCM-256 পাসওয়ার্ড লকড ব্যাকআপ (ব্যাকআপ মেনুতে)'
                        : 'AES-GCM-256 Encrypted Backup Export'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Set / Change PIN Form */}
          {(mode === 'set' || mode === 'change') && (
            <form onSubmit={handleSetPinSubmit} className="space-y-4">
              {mode === 'change' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'bn'
                      ? `বর্তমান ${pinLength} ডিজিটের পিন দিন`
                      : `Enter Current ${pinLength}-digit PIN`}
                  </label>
                  <input
                    type="password"
                    maxLength={pinLength}
                    autoFocus
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                    placeholder={pinLength === 6 ? '••••••' : '••••'}
                    className="w-full text-center tracking-[0.45em] text-xl font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Choose PIN Length: 4 or 6 digits */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'পিন সাইজ নির্বাচন করুন' : 'Select PIN Length'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([4, 6] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => {
                        setSelectedLength(len);
                        setNewPin('');
                        setConfirmPin('');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedLength === len
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lang === 'bn'
                        ? `${len} ডিজিট ${len === 6 ? '(অধিক সুরক্ষিত)' : ''}`
                        : `${len} Digits`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn'
                    ? `নতুন ${selectedLength} ডিজিটের পিন নম্বর দিন`
                    : `Enter New ${selectedLength}-digit PIN`}
                </label>
                <input
                  type="password"
                  maxLength={selectedLength}
                  autoFocus={mode === 'set'}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, selectedLength))}
                  placeholder={selectedLength === 6 ? '••••••' : '••••'}
                  className="w-full text-center tracking-[0.45em] text-xl font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn'
                    ? `কনফার্ম করতে ${selectedLength} ডিজিট পুনরায় লিখুন`
                    : `Confirm ${selectedLength}-digit PIN`}
                </label>
                <input
                  type="password"
                  maxLength={selectedLength}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, selectedLength))}
                  placeholder={selectedLength === 6 ? '••••••' : '••••'}
                  className="w-full text-center tracking-[0.45em] text-xl font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={
                    isBusy ||
                    newPin.length !== selectedLength ||
                    confirmPin.length !== selectedLength ||
                    (mode === 'change' && currentPin.length !== pinLength)
                  }
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isBusy
                    ? lang === 'bn'
                      ? 'এনক্রিপ্ট হচ্ছে...'
                      : 'Encrypting...'
                    : lang === 'bn'
                    ? 'সংরক্ষণ করুন'
                    : 'Save PIN'}
                </button>
              </div>
            </form>
          )}

          {/* Disable PIN Form (Requires current PIN verification) */}
          {mode === 'disable' && (
            <form onSubmit={handleDisablePinSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
                {lang === 'bn'
                  ? `পিন লক বন্ধ করতে আপনার বর্তমান ${pinLength} ডিজিটের পিন নম্বর দিয়ে নিশ্চিত করুন।`
                  : `Verify your current ${pinLength}-digit PIN to turn off PIN protection.`}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'বর্তমান পিন নম্বর' : 'Current PIN'}
                </label>
                <input
                  type="password"
                  maxLength={pinLength}
                  autoFocus
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder={pinLength === 6 ? '••••••' : '••••'}
                  className="w-full text-center tracking-[0.45em] text-xl font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isBusy || currentPin.length !== pinLength}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isBusy
                    ? lang === 'bn'
                      ? 'যাচাই চলছে...'
                      : 'Verifying...'
                    : lang === 'bn'
                    ? 'নিশ্চিতভাবে বন্ধ করুন'
                    : 'Confirm Disable'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
