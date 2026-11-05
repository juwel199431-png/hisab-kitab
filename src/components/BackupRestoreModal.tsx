import React, { useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  CloudUpload,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  RefreshCw,
  FolderLock,
  Smartphone,
  Shield,
} from 'lucide-react';
import { exportBackupFile, parseBackupFile } from '../utils/storage';

export const BackupRestoreModal: React.FC = () => {
  const { data, lang, t, isBackupModalOpen, setIsBackupModalOpen, restoreAllData, resetToDemoData } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isBackupModalOpen) return null;

  const handleDownloadBackup = () => {
    try {
      exportBackupFile(data);
      setSuccessMsg(
        lang === 'bn'
          ? 'ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে! এটি গুগল ড্রাইভ অথবা আইক্লাউডে সেভ করে রাখুন।'
          : 'Backup file downloaded successfully! Save it to Google Drive or iCloud.'
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(lang === 'bn' ? 'ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to export backup file.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await parseBackupFile(file);
      restoreAllData(restored);
      setSuccessMsg(
        lang === 'bn'
          ? 'অভিনন্দন! আপনার ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে।'
          : 'Success! Your financial data has been fully restored.'
      );
      setTimeout(() => {
        setSuccessMsg('');
        setIsBackupModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (lang === 'bn' ? 'সঠিক ব্যাকআপ ফাইল নির্বাচন করুন' : 'Invalid backup file selected')
      );
      setTimeout(() => setErrorMsg(''), 4000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetDemo = () => {
    if (
      confirm(
        lang === 'bn'
          ? 'আপনি কি নিশ্চিত যে প্রাথমিক নমুনা ডাটায় রিসেট করতে চান?'
          : 'Are you sure you want to reset to initial setup?'
      )
    ) {
      resetToDemoData();
      setIsBackupModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'bn' ? 'গুগল ড্রাইভ ও আইক্লাউড ব্যাকআপ' : 'Google Drive & Cloud Backup'}
            </h2>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Notification Alerts */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy & Secure Storage Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'bn' ? 'নিরাপদ ও স্থায়ী ডেটা সংরক্ষণ' : 'Secure & Permanent Data Storage'}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার সকল ব্যাংক ও খরচের হিসাব সম্পূর্ণ নিরাপদে আপনার এই ডিভাইসে সংরক্ষিত থাকে। কোন মাসিক সাবস্ক্রিপশন বা চার্জ নেই। ফোন বা কম্পিউটার পরিবর্তনের সময় যাতে ডাটা না হারায়, তাই ফাইলটি ডাউনলোড করে আপনার গুগল ড্রাইভ অথবা ক্লাউডে সেভ করে রাখুন।'
                : 'All your finances are stored permanently and securely in local device memory. Download a backup copy anytime to store in your personal Google Drive or cloud storage.'}
            </p>
          </div>

          {/* Two Primary Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Download Backup */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 mb-2">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {lang === 'bn' ? '১. ব্যাকআপ ফাইল তৈরি' : '1. Download Backup'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  {lang === 'bn'
                    ? 'সকল হিসাবের একটি .json ফাইল ডাউনলোড হবে যা ড্রাইভে সেভ রাখতে পারবেন।'
                    : 'Download full JSON database snapshot to keep in cloud storage.'}
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফাইল ডাউনলোড করুন' : 'Export File'}</span>
              </button>
            </div>

            {/* Restore Backup */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800 mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">
                  {lang === 'bn' ? '২. ব্যাকআপ রিস্টোর' : '2. Restore Backup'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  {lang === 'bn'
                    ? 'ড্রাইভ বা ফোন থেকে পূর্বের ব্যাকআপ ফাইল আপলোড করে হিসাব ফিরিয়ে আনুন।'
                    : 'Upload previously saved backup file to restore accounts.'}
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
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ফাইল আপলোড করুন' : 'Import File'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Guide on Google Drive & iCloud */}
          <div className="pt-2 border-t border-slate-100">
            <p className="font-bold text-slate-800 mb-2">
              {lang === 'bn' ? 'সহজ গাইড: গুগল ড্রাইভ / আইক্লাউডে সেভ করার নিয়ম' : 'Quick Guide: How to save to Cloud'}
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4">
              <li>
                {lang === 'bn'
                  ? 'উপরে "ফাইল ডাউনলোড করুন" বাটনে ক্লিক করলে Hisab-Kitab-Backup.json নামে ফাইল ডাউনলোড হবে।'
                  : 'Click "Export File" to download your Hisab-Kitab-Backup.json file.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'এরপর আপনার ফোনের Files অ্যাপে যান অথবা Google Drive অ্যাপে ফাইলটি আপলোড করে রাখুন।'
                  : 'Upload this file to your Google Drive or iCloud Files app.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'পরবর্তীতে নতুন মোবাইলে বা ব্রাউজারে এই অ্যাপ খুলে "ফাইল আপলোড করুন" দিলেই সব হিসাব চলে আসবে।'
                  : 'To restore on any device, simply click "Import File" and pick the saved backup.'}
              </li>
            </ul>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-400">
              {lang === 'bn' ? 'বর্তমান সংস্করণ: v1.0 (অটো-সেভ সক্রিয়)' : 'Version 1.0 (Auto-save active)'}
            </span>
            <button
              onClick={handleResetDemo}
              className="text-slate-500 hover:text-rose-600 underline font-medium"
            >
              {lang === 'bn' ? 'নমুনা ডাটায় রিসেট করুন' : 'Reset to Demo Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
