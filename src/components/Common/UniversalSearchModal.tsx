import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  ArrowRight,
  Landmark,
  PiggyBank,
  Briefcase,
  Coins,
  UserCheck,
  Calendar,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AccountSection } from '../../types/finance';

interface SearchResultItem {
  id: string;
  section: AccountSection;
  sectionLabelBn: string;
  sectionLabelEn: string;
  title: string;
  subtitle: string;
  amount?: number;
  currency?: 'BDT' | 'KWD';
  date?: string;
  type?: string;
  icon: React.ElementType;
  badgeColor: string;
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ isOpen, onClose }) => {
  const { data, lang, isPrivacyMode, setActiveSection } = useFinance();
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: SearchResultItem[] = [];

    // 1. Transactions search
    (data.transactions || []).forEach((tx) => {
      const noteMatch = tx.note?.toLowerCase().includes(q);
      const voucherMatch = tx.voucherNo?.toLowerCase().includes(q);
      const catBnMatch = tx.categoryNameBn?.toLowerCase().includes(q);
      const catEnMatch = tx.categoryNameEn?.toLowerCase().includes(q);
      const amountMatch = String(tx.amount).includes(q);
      const dateMatch = tx.date.includes(q);

      if (noteMatch || voucherMatch || catBnMatch || catEnMatch || amountMatch || dateMatch) {
        let secLabelBn = 'বাংলাদেশের ব্যাংক';
        let secLabelEn = 'BD Bank';
        let icon = Landmark;
        let badgeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300';

        if (tx.section === 'boss-salary') {
          secLabelBn = 'শাকের ভাই বেতন';
          secLabelEn = 'Boss Salary';
          icon = Briefcase;
          badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        } else if (tx.section === 'emdad-expense') {
          secLabelBn = 'ইমদাদ ভাই এর হিসাব';
          secLabelEn = 'Emdad Bhai';
          icon = UserCheck;
          badgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
        } else if (tx.section === 'kuwait-personal') {
          secLabelBn = 'কুয়েত পার্সোনাল';
          secLabelEn = 'Kuwait Personal';
          icon = Coins;
          badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
        } else if (tx.section === 'kuwait-extra-income') {
          secLabelBn = 'কুয়েত অতিরিক্ত আয়';
          secLabelEn = 'Kuwait Extra Income';
          icon = Coins;
          badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        }

        const catName = lang === 'bn' ? tx.categoryNameBn || 'সাধারণ লেনদেন' : tx.categoryNameEn || tx.categoryNameBn || 'Transaction';

        list.push({
          id: `tx-${tx.id}`,
          section: tx.section,
          sectionLabelBn: secLabelBn,
          sectionLabelEn: secLabelEn,
          title: catName,
          subtitle: `${tx.note || ''} ${tx.voucherNo ? `(ভাউচার: ${tx.voucherNo})` : ''}`.trim(),
          amount: tx.amount,
          currency: tx.currency,
          date: tx.date,
          type: tx.type,
          icon,
          badgeColor,
        });
      }
    });

    // 2. Boss Deposits search
    (data.bossDeposits || []).forEach((dep) => {
      const monthMatch = dep.month.includes(q);
      const noteMatch = dep.note?.toLowerCase().includes(q);
      const receiptMatch = dep.receiptNumber?.toLowerCase().includes(q);
      const amountMatch = String(dep.amount).includes(q);
      const dateMatch = dep.depositDate.includes(q);

      if (monthMatch || noteMatch || receiptMatch || amountMatch || dateMatch) {
        list.push({
          id: `dep-${dep.id}`,
          section: 'boss-salary',
          sectionLabelBn: 'শাকের ভাই বেতন ফান্ড',
          sectionLabelEn: 'Boss Salary Deposit',
          title: lang === 'bn' ? `বেতন কিস্তি (${dep.month})` : `Salary Deposit (${dep.month})`,
          subtitle: `${dep.note || ''} ${dep.receiptNumber ? `(রসিদ: ${dep.receiptNumber})` : ''}`.trim(),
          amount: dep.amount,
          currency: 'KWD',
          date: dep.depositDate,
          type: 'income',
          icon: Briefcase,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        });
      }
    });

    // 3. Kuwait Receivable Borrowers & Transactions
    (data.kuwaitReceivableBorrowers || []).forEach((bor) => {
      if (bor.name.toLowerCase().includes(q) || bor.phone?.toLowerCase().includes(q) || bor.notes?.toLowerCase().includes(q)) {
        list.push({
          id: `bor-${bor.id}`,
          section: 'kuwait-personal',
          sectionLabelBn: 'কুয়েত পার্সোনাল পাওনা',
          sectionLabelEn: 'Kuwait Receivable Borrower',
          title: bor.name,
          subtitle: `${lang === 'bn' ? 'ধার গ্রহীতা' : 'Borrower'} ${bor.phone ? `(${bor.phone})` : ''}`,
          icon: Coins,
          badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
        });
      }
    });

    // 4. Kuwait Payable Lenders
    (data.kuwaitPayableLenders || []).forEach((len) => {
      if (len.name.toLowerCase().includes(q) || len.phone?.toLowerCase().includes(q) || len.notes?.toLowerCase().includes(q)) {
        list.push({
          id: `len-${len.id}`,
          section: 'kuwait-personal',
          sectionLabelBn: 'কুয়েত পার্সোনাল দেনা',
          sectionLabelEn: 'Kuwait Payable Lender',
          title: len.name,
          subtitle: `${lang === 'bn' ? 'ঋণদাতা' : 'Lender'} ${len.phone ? `(${len.phone})` : ''}`,
          icon: Coins,
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
        });
      }
    });

    // 5. BD Banks search
    (data.banks || []).forEach((bank) => {
      if (bank.name.toLowerCase().includes(q) || bank.accountNumber.toLowerCase().includes(q) || bank.branch?.toLowerCase().includes(q)) {
        list.push({
          id: `bank-${bank.id}`,
          section: 'bd-bank',
          sectionLabelBn: 'বাংলাদেশের ব্যাংক',
          sectionLabelEn: 'BD Bank Account',
          title: bank.name,
          subtitle: `A/C: ${bank.accountNumber} ${bank.branch ? `(${bank.branch})` : ''}`,
          icon: Landmark,
          badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        });
      }
    });

    // 6. DPS & Insurance search
    (data.savingsAccounts || []).forEach((acc) => {
      if (acc.name.toLowerCase().includes(q) || acc.accountNumber.toLowerCase().includes(q) || acc.institution?.toLowerCase().includes(q)) {
        list.push({
          id: `acc-${acc.id}`,
          section: 'savings-portfolio',
          sectionLabelBn: acc.type === 'dps' ? 'ডিপিএস একাউন্ট' : 'ইন্সুরেন্স পলিসি',
          sectionLabelEn: acc.type === 'dps' ? 'DPS Account' : 'Insurance Policy',
          title: acc.name,
          subtitle: `A/C: ${acc.accountNumber} (${acc.institution})`,
          amount: acc.monthlyAmount,
          currency: 'BDT',
          icon: PiggyBank,
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        });
      }
    });

    return list.slice(0, 20); // Top 20 results for fast response
  }, [query, data, lang]);

  const handleSelect = (item: SearchResultItem) => {
    setActiveSection(item.section);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs no-print animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-950">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'যেকোনো ভাউচার নং, ব্যক্তির নাম, ব্যাংক, পরিমাণ বা বিবরণ দিয়ে সার্চ করুন...'
                : 'Search by voucher#, person name, bank, amount, or notes...'
            }
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden font-medium"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-600 dark:text-slate-400">
                {lang === 'bn' ? 'স্মার্ট ও দ্রুত অনুসন্ধান' : 'Omni Smart Search'}
              </p>
              <p className="text-[11px] mt-1 text-slate-400">
                {lang === 'bn'
                  ? 'ভাউচার নাম্বার, নোটের বিবরণ, শাকের ভাই, ইমদাদ ভাই বা ব্যাংকের নাম লিখুন।'
                  : 'Type any keyword, voucher number, person name, or note.'}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <p className="font-semibold text-slate-600 dark:text-slate-400">
                {lang === 'bn' ? 'কোন তথ্য পাওয়া যায়নি' : 'No records found'}
              </p>
              <p className="text-[11px] mt-1 text-slate-400">
                "{query}" {lang === 'bn' ? 'এর সাথে মিলে এমন কোনো লেনদেন বা অ্যাকাউন্ট নেই।' : 'does not match any record.'}
              </p>
            </div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.badgeColor}`}>
                          {lang === 'bn' ? item.sectionLabelBn : item.sectionLabelEn}
                        </span>
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    {item.amount !== undefined && item.currency && (
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, item.currency, lang, isPrivacyMode)}
                      </span>
                    )}
                    {item.date && (
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {formatDate(item.date, lang)}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {lang === 'bn'
              ? 'ক্লিক করলে সরাসরি সেই হেড বা অ্যাকাউন্টে নিয়ে যাবে'
              : 'Click any result to jump directly to that section'}
          </span>
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
