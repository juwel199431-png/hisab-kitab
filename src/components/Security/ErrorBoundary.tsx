import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Download, RotateCcw } from 'lucide-react';
import { STORAGE_KEY, getAutoSnapshots, saveData } from '../../utils/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  restoredMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    restoredMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected UI error',
      restoredMessage: '',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Hisab Kitab ErrorBoundary caught error:', error, errorInfo);
  }

  private handleSafeReload = () => {
    window.location.reload();
  };

  private handleEmergencyBackup = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '{}';
      const dateStr = new Date().toISOString().split('T')[0];
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hisab-Kitab-Emergency-Backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.setState({
        restoredMessage: 'জরুরি ব্যাকআপ ডাউনলোড হয়েছে! আপনার ডাটা সম্পূর্ণ নিরাপদ আছে।',
      });
    } catch {
      this.setState({
        restoredMessage: 'ডাউনলোড করা যায়নি, অনুগ্রহ করে নিরাপদ রিলোড ব্যবহার করুন।',
      });
    }
  };

  private handleRestoreLatestSnapshot = () => {
    try {
      const snapshots = getAutoSnapshots();
      if (snapshots.length > 0 && snapshots[0].data) {
        saveData(snapshots[0].data);
        window.location.reload();
      } else {
        this.setState({
          restoredMessage: 'কোনো পূর্ববর্তী অটো-স্ন্যাপশট পাওয়া যায়নি।',
        });
      }
    } catch {
      this.setState({
        restoredMessage: 'স্ন্যাপশট রিস্টোর করতে সমস্যা হয়েছে।',
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      const snapshots = getAutoSnapshots();
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-extrabold text-white">
                অ্যাপটি নিরাপদ মোডে থামানো হয়েছে
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                একটি অস্থায়ী ত্রুটির কারণে স্ক্রিন ক্র্যাশ হওয়া থেকে রক্ষা করা হয়েছে। আপনার কোনো হিসাব বা ডাটা নষ্ট হয়নি।
              </p>
            </div>

            {this.state.restoredMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                {this.state.restoredMessage}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleSafeReload}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>অ্যাপ পুনরায় চালু করুন (Safe Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyBackup}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>জরুরি ব্যাকআপ ডাউনলোড (.json)</span>
              </button>

              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={this.handleRestoreLatestSnapshot}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/70 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>সর্বশেষ অটো-স্ন্যাপশট রিস্টোর ({snapshots[0].dateStr})</span>
                </button>
              )}
            </div>

            {this.state.errorMessage && (
              <details className="text-left bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
                <summary className="cursor-pointer font-semibold text-slate-300">
                  টেকনিক্যাল তথ্য দেখুন
                </summary>
                <p className="mt-2 font-mono break-all text-rose-300">{this.state.errorMessage}</p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
