import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Lock, ShieldCheck, Delete, AlertCircle, RefreshCw, Landmark } from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { lang, verifySecurityPin, disableSecurityPin } = useFinance();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [resetConfirmText, setResetConfirmText] = useState<string>('');

  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setPin('');
    const timer = setTimeout(() => {
      setIsShaking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = useCallback((pinToTest: string) => {
    if (pinToTest.length !== 4) return;
    const ok = verifySecurityPin(pinToTest);
    if (!ok) {
      triggerError(
        lang === 'bn'
          ? 'ভুল পিন কোড! আবার সঠিক পিন দিন।'
          : 'Incorrect PIN! Please try again.'
      );
    }
  }, [verifySecurityPin, lang, triggerError]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 4) {
        // Automatically verify upon 4th digit
        setTimeout(() => {
          handleVerify(nextPin);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter' && pin.length === 4) {
        handleVerify(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, showForgotModal, handleVerify]);

  const handleEmergencyReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText.trim().toUpperCase() === 'RESET' || resetConfirmText.trim() === 'রিসেট') {
      disableSecurityPin();
      setShowForgotModal(false);
      setResetConfirmText('');
    } else {
      alert(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিকভাবে "RESET" লিখুন।'
          : 'Please enter "RESET" exactly to confirm.'
      );
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
              ? 'নিরাপত্তা পিন দিয়ে অ্যাপ আনলক করুন'
              : 'Enter 4-digit PIN to unlock'}
          </span>
        </p>

        {/* 4-Digit Indicator Circles */}
        <div className="flex items-center justify-center gap-4 my-7">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-500 scale-125 shadow-md shadow-emerald-500/50'
                    : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        {errorMsg ? (
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-4 px-3 py-1.5 bg-rose-950/50 border border-rose-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="h-7 mb-4 text-xs text-slate-500">
            {lang === 'bn' ? '৪ ডিজিটের গোপন পিন নম্বর চাপুন' : 'Key in your 4-digit security code'}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-700 active:text-white border border-slate-700/80 text-white font-mono text-2xl font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none"
          >
            {lang === 'bn' ? 'মুছুন' : 'Clear'}
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-700 active:text-white border border-slate-700/80 text-white font-mono text-2xl font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer select-none"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Reset Trigger */}
        <button
          type="button"
          onClick={() => setShowForgotModal(true)}
          className="mt-6 text-xs text-slate-400 hover:text-emerald-400 underline transition-colors cursor-pointer"
        >
          {lang === 'bn' ? 'পিন কোড ভুলে গেছেন?' : 'Forgot Security PIN?'}
        </button>
      </div>

      {/* Emergency PIN Reset Confirmation Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-left shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400 mb-3">
              <RefreshCw className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-base">
                {lang === 'bn' ? 'পিন রিসেট কনফার্মেশন' : 'Emergency PIN Reset'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'পিন ভুলে গেলে আপনার হিসাবের কোনো ডাটা ডিলিট হবে না। শুধুমাত্র পিন সুরক্ষাটি বন্ধ হয়ে যাবে। নিশ্চিত করতে নিচে "RESET" শব্দটি লিখুন:'
                : 'Resetting the PIN will not delete any ledger data. It will only disable the PIN lock. Type "RESET" below to confirm:'}
            </p>

            <form onSubmit={handleEmergencyReset} className="mt-4 space-y-3">
              <input
                type="text"
                autoFocus
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-mono text-center tracking-widest text-sm focus:outline-hidden focus:border-amber-400"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  {lang === 'bn' ? 'লক তুলে নিন' : 'Reset PIN Lock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
