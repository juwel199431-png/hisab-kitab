import React, { useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  CloudUpload,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  KeyRound,
} from 'lucide-react';
import {
  exportBackupFile,
  exportEncryptedBackupFile,
  inspectBackupFile,
  unlockEncryptedBackup,
  getAutoSnapshots,
} from '../utils/storage';
import { EncryptedBackupEnvelope } from '../utils/securityCrypto';

export const BackupRestoreModal: React.FC = () => {
  const { data, lang, isBackupModalOpen, setIsBackupModalOpen, restoreAllData, resetToDemoData } =
    useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Encrypted backup export controls
  const [encryptBackup, setEncryptBackup] = useState(true);
  const [exportPass, setExportPass] = useState('');
  const [exportPassConfirm, setExportPassConfirm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Encrypted backup restore unlock prompt
  const [pendingEnvelope, setPendingEnvelope] = useState<EncryptedBackupEnvelope | null>(null);
  const [unlockPass, setUnlockPass] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Inline confirmation states (no native window.confirm)
  const [confirmSnapshotIdx, setConfirmSnapshotIdx] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const snapshots = getAutoSnapshots();

  if (!isBackupModalOpen) return null;

  const handleClose = () => {
    setPendingEnvelope(null);
    setUnlockPass('');
    setConfirmSnapshotIdx(null);
    setConfirmReset(false);
    setErrorMsg('');
    setIsBackupModalOpen(false);
  };

  const handleDownloadBackup = async () => {
    setErrorMsg('');
    if (encryptBackup) {
      if (exportPass.length < 4) {
        setErrorMsg(
          lang === 'bn'
            ? 'এনক্রিপ্টেড ব্যাকআপের জন্য কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড লিখুন।'
            : 'Enter at least 4 characters for encrypted backup password.'
        );
        return;
      }
      if (exportPass !== exportPassConfirm) {
        setErrorMsg(
          lang === 'bn'
            ? 'দুই ঘরের পাসওয়ার্ড মেলেনি! সঠিকভাবে আবার লিখুন।'
            : 'Backup passwords do not match.'
        );
        return;
      }

      setIsExporting(true);
      try {
        await exportEncryptedBackupFile(data, exportPass);
        setExportPass('');
        setExportPassConfirm('');
        setSuccessMsg(
          lang === 'bn'
            ? 'AES-256 এনক্রিপ্টেড ব্যাকআপ ডাউনলোড হয়েছে! পাসওয়ার্ড ছাড়া কেউ এটি খুলতে পারবে না।'
            : 'AES-256 encrypted backup downloaded! Keep your password safe.'
        );
        setTimeout(() => setSuccessMsg(''), 4500);
      } catch (err: any) {
        setErrorMsg(err?.message || 'এনক্রিপ্টেড ব্যাকআপ তৈরি করতে সমস্যা হয়েছে।');
      } finally {
        setIsExporting(false);
      }
      return;
    }

    try {
      exportBackupFile(data);
      setSuccessMsg(
        lang === 'bn'
          ? 'ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে! এটি গুগল ড্রাইভ অথবা আইক্লাউডে সেভ করে রাখুন।'
          : 'Backup file downloaded successfully! Save it to Google Drive or iCloud.'
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setErrorMsg(lang === 'bn' ? 'ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to export backup file.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setPendingEnvelope(null);

    try {
      const result = await inspectBackupFile(file);
      if (result.encrypted) {
        setPendingEnvelope(result.envelope);
        setUnlockPass('');
      } else {
        restoreAllData(result.data);
        setSuccessMsg(
          lang === 'bn'
            ? 'অভিনন্দন! আপনার ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে।'
            : 'Success! Your financial data has been fully restored.'
        );
        setTimeout(() => {
          setSuccessMsg('');
          handleClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (lang === 'bn' ? 'সঠিক ব্যাকআপ ফাইল নির্বাচন করুন' : 'Invalid backup file selected')
      );
      setTimeout(() => setErrorMsg(''), 4500);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUnlockRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEnvelope) return;
    setErrorMsg('');
    setIsUnlocking(true);
    try {
      const decrypted = await unlockEncryptedBackup(pendingEnvelope, unlockPass);
      restoreAllData(decrypted);
      setPendingEnvelope(null);
      setUnlockPass('');
      setSuccessMsg(
        lang === 'bn'
          ? 'পাসওয়ার্ড যাচাই সফল! এনক্রিপ্টেড ব্যাকআপ রিস্টোর হয়েছে।'
          : 'Decrypted & restored successfully!'
      );
      setTimeout(() => {
        setSuccessMsg('');
        handleClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'ভুল পাসওয়ার্ড!');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'এনক্রিপ্টেড ব্যাকআপ ও রিস্টোর' : 'Encrypted Backup & Restore'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Notification Alerts */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Encrypted File Password Prompt when uploading an encrypted backup */}
          {pendingEnvelope && (
            <form
              onSubmit={handleUnlockRestore}
              className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-3"
            >
              <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {lang === 'bn'
                    ? 'এনক্রিপ্টেড ব্যাকআপ আনলক করুন (AES-256)'
                    : 'Unlock Encrypted Backup (AES-256)'}
                </span>
              </div>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                {lang === 'bn'
                  ? 'এই ফাইলটি পাসওয়ার্ড দিয়ে লক করা। ডাটা ফিরিয়ে আনতে ব্যাকআপ তৈরির সময় দেওয়া পাসওয়ার্ড লিখুন:'
                  : 'Enter the passphrase you used when exporting this encrypted backup:'}
              </p>
              <input
                type="password"
                autoFocus
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                placeholder={lang === 'bn' ? 'ব্যাকআপ পাসওয়ার্ড লিখুন' : 'Enter backup passphrase'}
                className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-indigo-600"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingEnvelope(null);
                    setUnlockPass('');
                  }}
                  className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUnlocking || !unlockPass}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {isUnlocking
                    ? lang === 'bn'
                      ? 'ডিক্রিপ্ট হচ্ছে...'
                      : 'Decrypting...'
                    : lang === 'bn'
                    ? 'আনলক ও রিস্টোর করুন'
                    : 'Decrypt & Restore'}
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Secure Storage Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>
                {lang === 'bn' ? 'সুরক্ষিত ব্যাকআপ ও স্বয়ংক্রিয় সেইফটি শট' : 'Protected Backup & Auto-Snapshots'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'রিস্টোর বা রিসেট করার আগে আপনার বর্তমান ডাটার একটি স্ন্যাপশট স্বয়ংক্রিয়ভাবে সেভ থাকে, তাই ভুলেও কোনো হিসাব হারাবে না।'
                : 'A safety snapshot is automatically saved before any restore or reset so no data is ever lost.'}
            </p>
          </div>

          {/* Two Primary Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download Backup */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 mb-2">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {lang === 'bn' ? '১. ব্যাকআপ ফাইল তৈরি' : '1. Download Backup'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  {lang === 'bn'
                    ? 'সকল হিসাবের নিরাপদ .json ফাইল তৈরি করে ড্রাইভে সেভ করুন।'
                    : 'Download protected JSON backup to keep in cloud storage.'}
                </p>

                {/* Encryption Toggle */}
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={encryptBackup}
                    onChange={(e) => setEncryptBackup(e.target.checked)}
                    className="accent-emerald-700 w-3.5 h-3.5"
                  />
                  <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'bn' ? 'AES-256 পাসওয়ার্ড লক' : 'AES-256 Password Lock'}
                  </span>
                </label>

                {encryptBackup && (
                  <div className="mt-2 space-y-1.5">
                    <input
                      type="password"
                      value={exportPass}
                      onChange={(e) => setExportPass(e.target.value)}
                      placeholder={lang === 'bn' ? 'পাসওয়ার্ড দিন (কমপক্ষে ৪ অক্ষর)' : 'Set password (min 4 chars)'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                    />
                    <input
                      type="password"
                      value={exportPassConfirm}
                      onChange={(e) => setExportPassConfirm(e.target.value)}
                      placeholder={lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm password'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleDownloadBackup}
                disabled={isExporting}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {encryptBackup ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>
                  {isExporting
                    ? lang === 'bn'
                      ? 'এনক্রিপ্ট হচ্ছে...'
                      : 'Encrypting...'
                    : encryptBackup
                    ? lang === 'bn'
                      ? 'এনক্রিপ্টেড ডাউনলোড'
                      : 'Export Encrypted'
                    : lang === 'bn'
                    ? 'সাধারণ ফাইল ডাউনলোড'
                    : 'Export Plain JSON'}
                </span>
              </button>
            </div>

            {/* Restore Backup */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/70 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-800 dark:text-blue-300 mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {lang === 'bn' ? '২. ব্যাকআপ রিস্টোর' : '2. Restore Backup'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {lang === 'bn'
                    ? 'সাধারণ বা AES-256 এনক্রিপ্টেড যেকোনো ব্যাকআপ ফাইল আপলোড করে সাথে সাথে হিসাব ফিরিয়ে আনুন।'
                    : 'Upload either plain or AES-256 encrypted backup files to restore accounts.'}
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ফাইল আপলোড করুন' : 'Import File'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Auto Snapshots Recovery */}
          {snapshots.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ হিস্ট্রি' : 'Automatic Snapshots'}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                  {lang === 'bn' ? 'লোকাল মেমরি' : 'Local Storage'}
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {snapshots.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{s.dateStr}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                        ({s.txCount} {lang === 'bn' ? 'টি লেনদেন' : 'txs'})
                      </span>
                    </div>

                    {confirmSnapshotIdx === idx ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            restoreAllData(s.data);
                            setConfirmSnapshotIdx(null);
                            setSuccessMsg(
                              lang === 'bn' ? 'সফলভাবে রিস্টোর হয়েছে!' : 'Restored successfully!'
                            );
                            setTimeout(() => setSuccessMsg(''), 3000);
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          {lang === 'bn' ? 'নিশ্চিত' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmSnapshotIdx(null)}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          {lang === 'bn' ? 'না' : 'No'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmSnapshotIdx(idx)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      >
                        {lang === 'bn' ? 'রিস্টোর' : 'Restore'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Demo Data Button with Inline Two-Step Confirmation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 text-[11px]">
            <span className="text-slate-400">
              {lang === 'bn' ? 'অটো-সেভ ও সেইফটি স্ন্যাপশট সক্রিয়' : 'Auto-save & snapshots active'}
            </span>

            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">
                  {lang === 'bn' ? 'নিশ্চিত রিসেট?' : 'Confirm reset?'}
                </span>
                <button
                  onClick={() => {
                    resetToDemoData();
                    setConfirmReset(false);
                    handleClose();
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-slate-500 hover:text-rose-600 underline font-medium cursor-pointer"
              >
                {lang === 'bn' ? 'নমুনা ডাটায় রিসেট করুন' : 'Reset to Demo Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
