import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Lock, Delete, AlertCircle, RefreshCw, Landmark, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AUTHORIZED_OWNER_EMAIL } from '../../firebase';

export const PinLockScreen: React.FC = () => {
  const {
    lang,
    pinLength,
    pinLockoutRemainingSec,
    verifySecurityPin,
    disableSecurityPin,
    signInToCloud,
    isCloudOwnerVerified,
  } = useFinance();

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const isLockedOut = pinLockoutRemainingSec > 0;

  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setPin('');
    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  }, []);

  const handleVerify = useCallback(
    async (pinToTest: string) => {
      if (pinToTest.length !== pinLength || isVerifying || isLockedOut) return;
      setIsVerifying(true);
      try {
        const result = await verifySecurityPin(pinToTest);
        if (!result.ok) {
          if (result.lockedRemainingSec > 0) {
            triggerError(
              lang === 'bn'
                ? `অনেকবার ভুল চেষ্টা! নিরাপত্তার জন্য ${result.lockedRemainingSec} সেকেন্ড লক করা হয়েছে।`
                : `Too many failed attempts! Locked for ${result.lockedRemainingSec}s.`
            );
          } else {
            triggerError(
              lang === 'bn'
                ? `ভুল পিন কোড! আরও ${result.remainingBeforeLock} বার ভুল করলে ৩০ সেকেন্ড লক হবে।`
                : `Incorrect PIN! ${result.remainingBeforeLock} tries remaining before lockout.`
            );
          }
        }
      } finally {
        setIsVerifying(false);
      }
    },
    [verifySecurityPin, pinLength, isVerifying, isLockedOut, lang, triggerError]
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (isLockedOut || isVerifying) return;
      setPin((prev) => {
        if (prev.length >= pinLength) return prev;
        const nextPin = prev + digit;
        setErrorMsg('');
        if (nextPin.length === pinLength) {
          setTimeout(() => {
            handleVerify(nextPin);
          }, 80);
        }
        return nextPin;
      });
    },
    [isLockedOut, isVerifying, pinLength, handleVerify]
  );

  const handleBackspace = useCallback(() => {
    if (isLockedOut || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, [isLockedOut, isVerifying]);

  const handleClear = useCallback(() => {
    if (isLockedOut || isVerifying) return;
    setPin('');
    setErrorMsg('');
  }, [isLockedOut, isVerifying]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal || isLockedOut) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter' && pin.length === pinLength) {
        handleVerify(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, pinLength, showForgotModal, isLockedOut, handleDigitPress, handleBackspace, handleClear, handleVerify]);

  const handleVerifiedGoogleReset = async () => {
    setRecoveryError('');
    if (isCloudOwnerVerified) {
      disableSecurityPin();
      setShowForgotModal(false);
      return;
    }

    setIsRecovering(true);
    try {
      await signInToCloud();
      disableSecurityPin();
      setShowForgotModal(false);
    } catch (err: any) {
      setRecoveryError(
        err?.message ||
          (lang === 'bn'
            ? 'গুগল ভেরিফিকেশন সম্পন্ন হয়নি। দয়া করে অনুমোদিত ইমেইল দিয়ে চেষ্টা করুন।'
            : 'Google verification failed. Please sign in with the owner email.')
      );
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 select-none">
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* App Icon & Header */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
          <Landmark className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          {lang === 'bn' ? 'হিসাব কিতাব' : 'Hisab Kitab'}
        </h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {lang === 'bn'
              ? `${pinLength} ডিজিটের নিরাপত্তা পিন দিয়ে আনলক করুন`
              : `Enter ${pinLength}-digit PIN to unlock`}
          </span>
        </p>

        {/* Dynamic 4 or 6-Digit Indicator Circles */}
        <div className="flex items-center justify-center gap-3.5 my-7">
          {Array.from({ length: pinLength }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isLockedOut
                    ? 'bg-rose-950 border-2 border-rose-700'
                    : isFilled
                    ? 'bg-emerald-500 scale-125 shadow-md shadow-emerald-500/50'
                    : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Lockout / Error Feedback */}
        {isLockedOut ? (
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-4 px-3.5 py-2 bg-amber-950/60 border border-amber-700/60 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {lang === 'bn'
                ? `সাময়িকভাবে লকড: ${pinLockoutRemainingSec} সেকেন্ড অপেক্ষা করুন`
                : `Temporarily locked: Wait ${pinLockoutRemainingSec}s`}
            </span>
          </div>
        ) : errorMsg ? (
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-4 px-3 py-1.5 bg-rose-950/50 border border-rose-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="h-7 mb-4 text-xs text-slate-500">
            {isVerifying
              ? lang === 'bn'
                ? 'যাচাই করা হচ্ছে...'
                : 'Verifying...'
              : lang === 'bn'
              ? `${pinLength} ডিজিটের গোপন পিন নম্বর চাপুন`
              : `Key in your ${pinLength}-digit security code`}
          </div>
        )}

        {/* Numeric Keypad */}
        <div
          className={`grid grid-cols-3 gap-3 w-full max-w-[280px] transition-opacity ${
            isLockedOut ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isLockedOut || isVerifying}
              onClick={() => handleDigitPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-700 active:text-white border border-slate-700/80 text-white font-mono text-2xl font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer select-none disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            disabled={isLockedOut || isVerifying}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none"
          >
            {lang === 'bn' ? 'মুছুন' : 'Clear'}
          </button>

          <button
            type="button"
            disabled={isLockedOut || isVerifying}
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-700 active:text-white border border-slate-700/80 text-white font-mono text-2xl font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            disabled={isLockedOut || isVerifying}
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer select-none"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Verified Owner Recovery Trigger */}
        <button
          type="button"
          onClick={() => {
            setRecoveryError('');
            setShowForgotModal(true);
          }}
          className="mt-6 text-xs text-slate-400 hover:text-emerald-400 underline transition-colors cursor-pointer"
        >
          {lang === 'bn' ? 'পিন কোড ভুলে গেছেন?' : 'Forgot Security PIN?'}
        </button>
      </div>

      {/* Verified Google Owner PIN Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-left shadow-2xl">
            <div className="flex items-center gap-2.5 text-emerald-400 mb-3">
              <RefreshCw className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-base">
                {lang === 'bn' ? 'ভেরিফায়েড অ্যাকাউন্ট রিকভারি' : 'Verified Owner PIN Recovery'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? `নিরাপত্তার স্বার্থে এখন কেবলমাত্র আপনার অনুমোদিত Google অ্যাকাউন্ট (${AUTHORIZED_OWNER_EMAIL}) দিয়ে ভেরিফাই করেই ভুলে যাওয়া পিন রিসেট করা যাবে। আপনার কোনো হিসাব ডিলিট হবে না।`
                : `For stronger anti-bypass protection, PIN recovery requires verifying ownership via ${AUTHORIZED_OWNER_EMAIL}. None of your ledger data will be lost.`}
            </p>

            {isCloudOwnerVerified && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'আপনার Google অ্যাকাউন্ট ভেরিফায়েড আছে'
                    : 'Owner Google account verified'}
                </span>
              </div>
            )}

            {recoveryError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/70 flex items-start gap-2 text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{recoveryError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-5">
              <button
                type="button"
                disabled={isRecovering}
                onClick={() => setShowForgotModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isRecovering}
                onClick={handleVerifiedGoogleReset}
                className="flex-[1.5] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                {isRecovering
                  ? lang === 'bn'
                    ? 'যাচাই চলছে...'
                    : 'Verifying...'
                  : isCloudOwnerVerified
                  ? lang === 'bn'
                    ? 'পিন লক আনলক করুন'
                    : 'Unlock & Disable PIN'
                  : lang === 'bn'
                  ? 'Google দিয়ে রিসেট করুন'
                  : 'Verify with Google'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
