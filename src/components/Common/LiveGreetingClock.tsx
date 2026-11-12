import React, { useState, useEffect } from 'react';
import { Sun, Sunrise, Sunset, Moon, Clock, Play } from 'lucide-react';

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
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Determine Greeting & Icon based on time of day
  // 05:00 - 11:59 -> Good Morning (শুভ সকাল)
  // 12:00 - 15:59 -> Good Noon (শুভ দুপুর)
  // 16:00 - 19:59 -> Good Evening (শুভ সন্ধ্যা)
  // 20:00 - 04:59 -> Good Night (শুভ রাত্রি)
  let greetingEn = 'Good Morning';
  let greetingBn = 'শুভ সকাল';
  let IconComponent = Sunrise;
  let iconColor = 'text-amber-500';
  let badgeBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300';
  let dotColor = 'bg-amber-500';

  if (hours >= 5 && hours < 12) {
    greetingEn = 'Good Morning';
    greetingBn = 'শুভ সকাল';
    IconComponent = Sunrise;
    iconColor = 'text-amber-500';
    badgeBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200';
    dotColor = 'bg-amber-500';
  } else if (hours >= 12 && hours < 16) {
    greetingEn = 'Good Noon';
    greetingBn = 'শুভ দুপুর';
    IconComponent = Sun;
    iconColor = 'text-yellow-500';
    badgeBg = 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200/80 dark:border-yellow-800/60 text-yellow-900 dark:text-yellow-200';
    dotColor = 'bg-yellow-500';
  } else if (hours >= 16 && hours < 20) {
    greetingEn = 'Good Evening';
    greetingBn = 'শুভ সন্ধ্যা';
    IconComponent = Sunset;
    iconColor = 'text-orange-500';
    badgeBg = 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-800/60 text-orange-900 dark:text-orange-200';
    dotColor = 'bg-orange-500';
  } else {
    greetingEn = 'Good Night';
    greetingBn = 'শুভ রাত্রি';
    IconComponent = Moon;
    iconColor = 'text-indigo-400';
    badgeBg = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200';
    dotColor = 'bg-indigo-500';
  }

  // Format 12-hour time
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeFormatted = `${pad(displayHours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;

  // Bengali numerals converter for Bangla mode
  const toBanglaNumerals = (str: string) => {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[0-9]/g, (d) => bnNums[parseInt(d, 10)]);
  };

  const banglaAmpm = hours >= 12 ? (hours < 16 ? 'দুপুর' : hours < 20 ? 'সন্ধ্যা' : 'রাত') : (hours < 6 ? 'রাত' : 'সকাল');
  const banglaTime = `${toBanglaNumerals(`${pad(displayHours)}:${pad(minutes)}:${pad(seconds)}`)} ${banglaAmpm}`;

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border shadow-2xs transition-all ${badgeBg} ${className}`}
      title={lang === 'bn' ? `লাইভ সময় ও গ্রিটিংস: ${greetingBn} (${banglaTime})` : `Live Time & Greeting: ${greetingEn} (${timeFormatted})`}
    >
      {/* Icon with pulsing indicator */}
      <div className="relative flex items-center justify-center shrink-0">
        <IconComponent className={`w-4 h-4 ${iconColor} animate-pulse`} />
        <span
          className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotColor} animate-ping`}
        />
      </div>

      {/* Greeting text */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] sm:text-xs font-bold tracking-tight">
            {lang === 'bn' ? greetingBn : greetingEn}
          </span>
          <span className="text-[9.5px] opacity-70 font-semibold hidden md:inline">
            ({lang === 'bn' ? greetingEn : greetingBn})
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider mt-0.5 opacity-90">
          {lang === 'bn' ? banglaTime : timeFormatted}
        </span>
      </div>

      {/* Optional Replay Welcome Slide Button */}
      {onReplayIntro && (
        <button
          type="button"
          onClick={onReplayIntro}
          className="ml-1 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-all cursor-pointer"
          title={lang === 'bn' ? 'ওয়েলকাম স্লাইড ভিডিও পুনরায় দেখুন' : 'Replay Welcome Intro Slide'}
        >
          <Play className="w-3 h-3 fill-current" />
        </button>
      )}
    </div>
  );
};
