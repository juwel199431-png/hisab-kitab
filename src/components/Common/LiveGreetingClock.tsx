import React, { useState, useEffect } from 'react';
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';

interface LiveGreetingClockProps {
  lang?: 'bn' | 'en';
  onReplayIntro?: () => void;
  className?: string;
}

export const LiveGreetingClock: React.FC<LiveGreetingClockProps> = ({
  lang = 'bn',
  onReplayIntro,
  className = '',
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();

  let greetingEn = 'Good Morning';
  let greetingBn = 'শুভ সকাল';
  let IconComponent = Sunrise;
  let iconColor = 'text-amber-500';

  if (hours >= 5 && hours < 12) {
    greetingEn = 'Good Morning';
    greetingBn = 'শুভ সকাল';
    IconComponent = Sunrise;
    iconColor = 'text-amber-500';
  } else if (hours >= 12 && hours < 16) {
    greetingEn = 'Good Noon';
    greetingBn = 'শুভ দুপুর';
    IconComponent = Sun;
    iconColor = 'text-amber-500';
  } else if (hours >= 16 && hours < 20) {
    greetingEn = 'Good Evening';
    greetingBn = 'শুভ সন্ধ্যা';
    IconComponent = Sunset;
    iconColor = 'text-orange-500';
  } else {
    greetingEn = 'Good Night';
    greetingBn = 'শুভ রাত্রি';
    IconComponent = Moon;
    iconColor = 'text-indigo-400';
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeFormatted = `${displayHours}:${pad(minutes)} ${ampm}`;

  const toBanglaNumerals = (str: string) => {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[0-9]/g, (d) => bnNums[parseInt(d, 10)]);
  };

  const banglaTime = `${toBanglaNumerals(`${displayHours}:${pad(minutes)}`)} ${ampm}`;

  return (
    <button
      type="button"
      onClick={onReplayIntro}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/75 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer select-none ${className}`}
      title={lang === 'bn' ? 'ওয়েলকাম স্লাইড দেখুন' : 'View Welcome Intro'}
    >
      <IconComponent className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
      <span className="font-semibold text-slate-700 dark:text-slate-200">
        {lang === 'bn' ? greetingBn : greetingEn}
      </span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {lang === 'bn' ? banglaTime : timeFormatted}
      </span>
    </button>
  );
};
