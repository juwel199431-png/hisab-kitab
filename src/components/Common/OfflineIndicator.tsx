import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../utils/usePWAInstall';

interface OfflineIndicatorProps {
  lang: 'bn' | 'en';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 dark:bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-fade-in no-print">
      <div className="relative flex items-center justify-center">
        <WifiOff className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white animate-ping" />
      </div>
      <div>
        <span>
          {lang === 'bn'
            ? 'অফলাইন মোড — আপনার সকল হিসাব লোকাল মেমরিতে নিরাপদ রয়েছে।'
            : 'Offline Mode — Your data is fully active and saved locally.'}
        </span>
      </div>
    </div>
  );
};
