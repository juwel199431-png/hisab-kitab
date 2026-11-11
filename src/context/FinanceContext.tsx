import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  AccountSection,
  AppData,
  BankAccount,
  BossSalaryDeposit,
  Category,
  DpsInsuranceAccount,
  LoanRecord,
  KuwaitPersonalLoan,
  KuwaitReceivableBorrower,
  KuwaitReceivableTransaction,
  KuwaitPayableLender,
  KuwaitPayableTransaction,
  SmartAlert,
  Transaction,
} from '../types/finance';
import { INITIAL_APP_DATA } from '../utils/initialData';
import {
  calculateBankBalance,
  calculateSavingsBalance,
  calculateLoanBalance,
  LANG_STORAGE_KEY,
  loadStoredData,
  saveData,
} from '../utils/storage';
import { formatCurrency, TRANSLATIONS, getNextVoucherNumber } from '../utils/formatters';
import { subscribeToCloudLedger, pushToCloudLedger } from '../firebase';

interface FinanceContextType {
  data: AppData;
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  t: (key: keyof typeof TRANSLATIONS.bn) => string;
  activeSection: AccountSection;
  setActiveSection: (section: AccountSection) => void;

  // Auto-generated Sequential Voucher / Invoice Number
  getNextVoucherNo: () => string;
  
  // Privacy & Dark Theme
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  formatAmount: (amount: number, currency: 'BDT' | 'KWD') => string;

  // Currency Converter & Net Worth
  kwdRate: number;
  setKwdRate: (rate: number) => void;
  isConverterOpen: boolean;
  setIsConverterOpen: (open: boolean) => void;
  getTotalNetWorthBdt: () => number;

  // Smart Due Dates & Alerts with Seen/Unread Tracking
  isAlertsOpen: boolean;
  setIsAlertsOpen: (open: boolean) => void;
  smartAlerts: SmartAlert[];
  totalAlertsCount: number;
  unreadAlertsCount: number;
  markAlertsAsSeen: () => void;
  markSingleAlertAsSeen: (id: string, isOverdue?: boolean) => void;
  isAlertSeen: (id: string, isOverdue?: boolean) => boolean;
  resetAllSeenAlerts: () => void;

  // Modals
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  quickAddDefaultSection?: AccountSection;
  openQuickAddWithSection: (section: AccountSection) => void;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;
  aiAssistantInitialTab: 'voice' | 'receipt' | 'sms' | 'qa' | 'insights';
  openAIAssistantWithTab: (tab: 'voice' | 'receipt' | 'sms' | 'qa' | 'insights') => void;

  // Calculators
  getBankBalance: (bankId: string) => number;
  getSavingsBalance: (savingsId: string) => number;
  getTotalBdBanksBalance: () => number;
  getTotalDpsSavings: () => number;
  getTotalInsuranceSavings: () => number;
  getKuwaitPersonalTotals: (monthFilter?: string) => { totalExpense: number; count: number };
  getBossSalaryTotals: (monthFilter?: string) => {
    totalDeposited: number;
    totalExpenses: number;
    remainingBalance: number;
  };
  getEmdadTotals: () => {
    totalSpent: number;
    totalPaid: number;
    totalUnpaid: number;
    count: number;
  };
  getKuwaitExtraIncomeTotal: (monthFilter?: string) => {
    totalIncome: number;
    count: number;
  };
  getKuwaitLoanTotals: () => {
    totalLoaned: number;
    totalPaid: number;
    totalUnpaid: number;
    unpaidCount: number;
    totalCount: number;
  };
  getLoanBalance: (loanId: string) => {
    basePaid: number;
    repaidFromBanks: number;
    totalPaid: number;
    remaining: number;
    progress: number;
    repaymentsCount: number;
  };
  getLoanRepayments: (loanId?: string) => Transaction[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  togglePaymentStatus: (id: string) => void;
  addBossDeposit: (deposit: Omit<BossSalaryDeposit, 'id' | 'createdAt'>) => void;
  updateBossDeposit: (id: string, updates: Partial<BossSalaryDeposit>) => void;
  deleteBossDeposit: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'isCustom'>) => Category;
  deleteCategory: (id: string) => void;
  addBankAccount: (bank: Omit<BankAccount, 'id' | 'currency'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  addSavingsAccount: (savings: Omit<DpsInsuranceAccount, 'id' | 'currency'>) => void;
  updateSavingsAccount: (id: string, updates: Partial<DpsInsuranceAccount>) => void;
  addLoan: (loan: Omit<LoanRecord, 'id' | 'currency'>) => void;
  updateLoan: (id: string, updates: Partial<LoanRecord>) => void;
  deleteLoan: (id: string) => void;
  // Loan Repayments & Invoices
  addLoanRepayment: (repayment: {
    loanId: string;
    fromBankId: string;
    amount: number;
    date: string;
    invoiceNo?: string;
    note?: string;
  }) => Transaction;
  updateLoanRepayment: (
    txId: string,
    updates: { fromBankId?: string; amount?: number; date?: string; invoiceNo?: string; note?: string }
  ) => void;
  deleteLoanRepayment: (txId: string) => void;
  // Kuwait Personal Loans Given (Legacy & New Person-wise system)
  addKuwaitLoan: (loan: Omit<KuwaitPersonalLoan, 'id' | 'currency' | 'createdAt'>) => void;
  updateKuwaitLoan: (id: string, updates: Partial<KuwaitPersonalLoan>) => void;
  deleteKuwaitLoan: (id: string) => void;
  toggleKuwaitLoanStatus: (id: string) => void;
  // Personal Receivable Loans (ব্যক্তিগত পাওনা / কাউকে লোন দেওয়া ও কিস্তিতে/আংশিক আদায়)
  getKuwaitReceivableTotals: () => {
    totalLent: number;
    totalCollected: number;
    totalRemaining: number;
    activeBorrowersCount: number;
    totalBorrowersCount: number;
    transactionsCount: number;
  };
  getBorrowerBalance: (borrowerId: string) => {
    totalLent: number;
    totalCollected: number;
    remaining: number;
    lendCount: number;
    collectCount: number;
    transactions: KuwaitReceivableTransaction[];
  };
  addKuwaitReceivableBorrower: (borrower: Omit<KuwaitReceivableBorrower, 'id' | 'createdAt'>) => KuwaitReceivableBorrower;
  updateKuwaitReceivableBorrower: (id: string, updates: Partial<KuwaitReceivableBorrower>) => void;
  deleteKuwaitReceivableBorrower: (id: string) => void;
  addKuwaitReceivableTransaction: (tx: Omit<KuwaitReceivableTransaction, 'id' | 'createdAt'>) => KuwaitReceivableTransaction;
  updateKuwaitReceivableTransaction: (id: string, updates: Partial<KuwaitReceivableTransaction>) => void;
  deleteKuwaitReceivableTransaction: (id: string) => void;
  // Kuwait Personal Payable Loans (ব্যক্তিগত দেনা / কারো কাছ থেকে লোন নেওয়া ও পরিশোধ)
  getKuwaitPayableTotals: () => {
    totalBorrowed: number;
    totalRepaid: number;
    totalRemaining: number;
    activeLendersCount: number;
    totalLendersCount: number;
    transactionsCount: number;
  };
  getLenderBalance: (lenderId: string) => {
    totalBorrowed: number;
    totalRepaid: number;
    remaining: number;
    borrowCount: number;
    repayCount: number;
    transactions: KuwaitPayableTransaction[];
  };
  addKuwaitPayableLender: (lender: Omit<KuwaitPayableLender, 'id' | 'createdAt'>) => KuwaitPayableLender;
  updateKuwaitPayableLender: (id: string, updates: Partial<KuwaitPayableLender>) => void;
  deleteKuwaitPayableLender: (id: string) => void;
  addKuwaitPayableTransaction: (tx: Omit<KuwaitPayableTransaction, 'id' | 'createdAt'>) => KuwaitPayableTransaction;
  updateKuwaitPayableTransaction: (id: string, updates: Partial<KuwaitPayableTransaction>) => void;
  deleteKuwaitPayableTransaction: (id: string) => void;
  restoreAllData: (newData: AppData) => void;
  resetToDemoData: () => void;

  // Universal Search
  isUniversalSearchOpen: boolean;
  setIsUniversalSearchOpen: (open: boolean) => void;

  // Advanced Operations
  bulkSettleEmdadExpenses: () => number;
  paySavingsInstallmentFromBank: (params: {
    savingsId: string;
    bankId: string;
    amount: number;
    date: string;
    voucherNo?: string;
    note?: string;
  }) => Transaction;
  transferBankFunds: (params: {
    fromBankId: string;
    toBankId: string;
    amount: number;
    date: string;
    voucherNo?: string;
    note?: string;
  }) => Transaction;

  // Security PIN Lock
  isPinEnabled: boolean;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  setSecurityPin: (newPin: string) => void;
  disableSecurityPin: () => void;
  verifySecurityPin: (enteredPin: string) => boolean;
  lockApp: () => void;

  // Real-time Cloud Synchronization (Mobile <-> Computer)
  isCloudSynced: boolean;
  lastCloudSyncTime: Date | null;
  forcePushToCloud: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadStoredData);
  const [lang, setLangState] = useState<'bn' | 'en'>(() => {
    return (localStorage.getItem(LANG_STORAGE_KEY) as 'bn' | 'en') || 'bn';
  });
  const [activeSection, setActiveSection] = useState<AccountSection>('dashboard');
  
  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultSection, setQuickAddDefaultSection] = useState<AccountSection | undefined>();
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiAssistantInitialTab, setAiAssistantInitialTab] = useState<'voice' | 'receipt' | 'sms' | 'qa' | 'insights'>('voice');

  const openAIAssistantWithTab = (tab: 'voice' | 'receipt' | 'sms' | 'qa' | 'insights') => {
    setAiAssistantInitialTab(tab);
    setIsAIAssistantOpen(true);
  };

  // Privacy & Dark Theme state
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('hisab_kitab_privacy') === 'true';
  });

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('hisab_kitab_privacy', String(next));
      return next;
    });
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hisab_kitab_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('hisab_kitab_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Currency Converter & Rate
  const [kwdRate, setKwdRateState] = useState<number>(() => {
    const saved = localStorage.getItem('hisab_kitab_kwd_rate');
    return saved ? Number(saved) || 405 : 405;
  });

  const setKwdRate = (rate: number) => {
    setKwdRateState(rate);
    localStorage.setItem('hisab_kitab_kwd_rate', String(rate));
  };

  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Seen / Read Tracking for Smart Alerts
  const [seenAlertKeys, setSeenAlertKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hisab_kitab_seen_alerts_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Security PIN Lock
  const PIN_CODE_KEY = 'hisab_kitab_pin_code';
  const PIN_ENABLED_KEY = 'hisab_kitab_pin_enabled';

  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => {
    const enabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';
    const pin = localStorage.getItem(PIN_CODE_KEY);
    return Boolean(enabled && pin);
  });

  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const enabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';
    const pin = localStorage.getItem(PIN_CODE_KEY);
    return Boolean(enabled && pin);
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const setSecurityPin = (newPin: string) => {
    localStorage.setItem(PIN_CODE_KEY, newPin);
    localStorage.setItem(PIN_ENABLED_KEY, 'true');
    setIsPinEnabled(true);
    setIsAppLocked(false);
  };

  const disableSecurityPin = () => {
    localStorage.setItem(PIN_ENABLED_KEY, 'false');
    localStorage.removeItem(PIN_CODE_KEY);
    setIsPinEnabled(false);
    setIsAppLocked(false);
  };

  const verifySecurityPin = (enteredPin: string): boolean => {
    const savedPin = localStorage.getItem(PIN_CODE_KEY);
    if (!savedPin) return true;
    if (enteredPin === savedPin) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (isPinEnabled) {
      setIsAppLocked(true);
    }
  };

  const formatAmount = (amount: number, currency: 'BDT' | 'KWD'): string => {
    return formatCurrency(amount, currency, lang, isPrivacyMode);
  };

  // Real-time Cloud Synchronization (Mobile <-> Computer)
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCloudLedger(
      (cloudData) => {
        setData(cloudData);
        saveData(cloudData);
        setIsCloudSynced(true);
        setLastCloudSyncTime(new Date());
      },
      () => {
        // Cloud document doesn't exist yet: push current local state to initialize cloud
        pushToCloudLedger(data, true);
        setIsCloudSynced(true);
        setLastCloudSyncTime(new Date());
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    saveData(data);
    pushToCloudLedger(data);
  }, [data]);

  const forcePushToCloud = () => {
    pushToCloudLedger(data, true);
    setIsCloudSynced(true);
    setLastCloudSyncTime(new Date());
  };

  const setLang = (newLang: 'bn' | 'en') => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
  };

  const t = (key: keyof typeof TRANSLATIONS.bn): string => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS.bn[key] || String(key);
  };

  const openQuickAddWithSection = (section: AccountSection) => {
    setQuickAddDefaultSection(section);
    setIsQuickAddOpen(true);
  };

  // Calculators
  const getBankBalance = (bankId: string): number => {
    const bank = data.banks.find((b) => b.id === bankId);
    if (!bank) return 0;
    return calculateBankBalance(bank, data.transactions);
  };

  const getSavingsBalance = (savingsId: string): number => {
    const savings = data.savingsAccounts.find((s) => s.id === savingsId);
    if (!savings) return 0;
    return calculateSavingsBalance(savings, data.transactions);
  };

  const getTotalBdBanksBalance = (): number => {
    return data.banks.reduce((acc, bank) => acc + calculateBankBalance(bank, data.transactions), 0);
  };

  const getTotalDpsSavings = (): number => {
    return data.savingsAccounts
      .filter((s) => s.type === 'dps')
      .reduce((acc, dps) => acc + calculateSavingsBalance(dps, data.transactions), 0);
  };

  const getTotalInsuranceSavings = (): number => {
    return data.savingsAccounts
      .filter((s) => s.type === 'insurance')
      .reduce((acc, ins) => acc + calculateSavingsBalance(ins, data.transactions), 0);
  };

  const getKuwaitPersonalTotals = (monthFilter?: string) => {
    const relevant = data.transactions.filter((tx) => {
      if (tx.section !== 'kuwait-personal') return false;
      if (monthFilter && !tx.date.startsWith(monthFilter)) return false;
      return true;
    });

    const totalExpense = relevant.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
    return {
      totalExpense,
      count: relevant.length,
    };
  };

  const getBossSalaryTotals = (monthFilter?: string) => {
    const deposits = data.bossDeposits.filter((d) => {
      if (monthFilter && d.month !== monthFilter) return false;
      return true;
    });

    const totalDeposited = deposits.reduce((acc, d) => acc + Number(d.amount || 0), 0);

    const expenses = data.transactions.filter((tx) => {
      if (tx.section !== 'boss-salary') return false;
      if (monthFilter && !tx.date.startsWith(monthFilter)) return false;
      return true;
    });

    const totalExpenses = expenses.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
    const remainingBalance = totalDeposited - totalExpenses;

    return {
      totalDeposited,
      totalExpenses,
      remainingBalance,
    };
  };

  const getEmdadTotals = () => {
    const emdadExpenses = data.transactions.filter((tx) => tx.section === 'emdad-expense');
    const totalSpent = emdadExpenses.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
    const totalPaid = emdadExpenses
      .filter((tx) => tx.paymentStatus === 'paid')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
    const totalUnpaid = emdadExpenses
      .filter((tx) => tx.paymentStatus !== 'paid')
      .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

    return {
      totalSpent,
      totalPaid,
      totalUnpaid,
      count: emdadExpenses.length,
    };
  };

  const getKuwaitExtraIncomeTotal = (monthFilter?: string) => {
    const extraIncomes = data.transactions.filter((tx) => {
      if (tx.section !== 'kuwait-extra-income') return false;
      if (monthFilter && !tx.date.startsWith(monthFilter)) return false;
      return true;
    });

    const totalIncome = extraIncomes.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

    return {
      totalIncome,
      count: extraIncomes.length,
    };
  };

  const getKuwaitLoanTotals = () => {
    const loans = data.kuwaitLoans || [];
    const totalLoaned = loans.reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const totalPaid = loans
      .filter((l) => l.status === 'paid')
      .reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const totalUnpaid = loans
      .filter((l) => l.status !== 'paid')
      .reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const unpaidCount = loans.filter((l) => l.status !== 'paid').length;

    return {
      totalLoaned,
      totalPaid,
      totalUnpaid,
      unpaidCount,
      totalCount: loans.length,
    };
  };

  const getLoanBalance = (loanId: string) => {
    const loan = data.loans.find((l) => l.id === loanId);
    if (!loan) {
      return { basePaid: 0, repaidFromBanks: 0, totalPaid: 0, remaining: 0, progress: 0, repaymentsCount: 0 };
    }
    return calculateLoanBalance(loan, data.transactions);
  };

  const getLoanRepayments = (loanId?: string) => {
    return data.transactions
      .filter((tx) => {
        if (tx.type !== 'transfer' || tx.transferTargetType !== 'loan') return false;
        if (loanId && tx.targetLoanId !== loanId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Auto-generated Sequential Voucher / Invoice Number
  const getNextVoucherNo = () => {
    return getNextVoucherNumber(
      data.transactions,
      data.bossDeposits,
      data.kuwaitReceivableTransactions,
      data.kuwaitPayableTransactions
    );
  };

  // Transaction Handlers
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const autoVoucher = tx.voucherNo && tx.voucherNo.trim() ? tx.voucherNo.trim() : getNextVoucherNo();
    const newTx: Transaction = {
      ...tx,
      voucherNo: autoVoucher,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)),
    }));
  };

  const deleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    }));
  };

  const togglePaymentStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) => {
        if (tx.id === id) {
          const nextStatus = tx.paymentStatus === 'paid' ? 'unpaid' : 'paid';
          return { ...tx, paymentStatus: nextStatus };
        }
        return tx;
      }),
    }));
  };

  // Boss Deposits Handlers
  const addBossDeposit = (deposit: Omit<BossSalaryDeposit, 'id' | 'createdAt'>) => {
    const autoReceipt = deposit.receiptNumber && deposit.receiptNumber.trim() ? deposit.receiptNumber.trim() : getNextVoucherNo();
    const newDep: BossSalaryDeposit = {
      ...deposit,
      receiptNumber: autoReceipt,
      id: `bdep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      bossDeposits: [newDep, ...prev.bossDeposits],
    }));
  };

  const updateBossDeposit = (id: string, updates: Partial<BossSalaryDeposit>) => {
    setData((prev) => ({
      ...prev,
      bossDeposits: prev.bossDeposits.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  };

  const deleteBossDeposit = (id: string) => {
    setData((prev) => ({
      ...prev,
      bossDeposits: prev.bossDeposits.filter((d) => d.id !== id),
    }));
  };

  // Category Handlers
  const addCategory = (category: Omit<Category, 'id' | 'isCustom'>): Category => {
    const newCat: Category = {
      ...category,
      id: `cat-custom-${Date.now()}`,
      isCustom: true,
    };
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    return newCat;
  };

  const deleteCategory = (id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  // Bank Accounts Handlers
  const addBankAccount = (bank: Omit<BankAccount, 'id' | 'currency'>) => {
    const newBank: BankAccount = {
      ...bank,
      id: `bank-${Date.now()}`,
      currency: 'BDT',
    };
    setData((prev) => ({
      ...prev,
      banks: [...prev.banks, newBank],
    }));
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setData((prev) => ({
      ...prev,
      banks: prev.banks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  // Savings Accounts Handlers
  const addSavingsAccount = (savings: Omit<DpsInsuranceAccount, 'id' | 'currency'>) => {
    const newSavings: DpsInsuranceAccount = {
      ...savings,
      id: `${savings.type}-${Date.now()}`,
      currency: 'BDT',
    };
    setData((prev) => ({
      ...prev,
      savingsAccounts: [...prev.savingsAccounts, newSavings],
    }));
  };

  const updateSavingsAccount = (id: string, updates: Partial<DpsInsuranceAccount>) => {
    setData((prev) => ({
      ...prev,
      savingsAccounts: prev.savingsAccounts.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const addLoan = (loan: Omit<LoanRecord, 'id' | 'currency'>) => {
    const newLoan: LoanRecord = {
      ...loan,
      id: `loan-${Date.now()}`,
      currency: 'BDT',
    };
    setData((prev) => ({
      ...prev,
      loans: [...prev.loans, newLoan],
    }));
  };

  const updateLoan = (id: string, updates: Partial<LoanRecord>) => {
    setData((prev) => ({
      ...prev,
      loans: prev.loans.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const deleteLoan = (id: string) => {
    setData((prev) => ({
      ...prev,
      loans: prev.loans.filter((l) => l.id !== id),
      // Also clean up linked repayment transactions
      transactions: prev.transactions.filter(
        (tx) => !(tx.type === 'transfer' && tx.transferTargetType === 'loan' && tx.targetLoanId === id)
      ),
    }));
  };

  // BD Bank Loan Repayment & Invoice Handlers
  const addLoanRepayment = ({
    loanId,
    fromBankId,
    amount,
    date,
    invoiceNo,
    note,
  }: {
    loanId: string;
    fromBankId: string;
    amount: number;
    date: string;
    invoiceNo?: string;
    note?: string;
  }): Transaction => {
    const loan = data.loans.find((l) => l.id === loanId);
    const bank = data.banks.find((b) => b.id === fromBankId);
    const invNo = invoiceNo?.trim() || getNextVoucherNo();

    const newTx: Transaction = {
      id: `tx-loan-rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      section: 'bd-bank',
      type: 'transfer',
      transferTargetType: 'loan',
      targetLoanId: loanId,
      fromBankId,
      amount,
      currency: 'BDT',
      date,
      voucherNo: invNo,
      categoryNameBn: 'ব্যাংক লোন কিস্তি পরিশোধ',
      categoryNameEn: 'Loan Installment Repayment',
      note: note?.trim() || (loan ? `${loan.name} কিস্তি পরিশোধ (${bank?.name || ''})` : 'লোন কিস্তি পরিশোধ'),
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    return newTx;
  };

  const updateLoanRepayment = (
    txId: string,
    updates: { fromBankId?: string; amount?: number; date?: string; invoiceNo?: string; note?: string }
  ) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            fromBankId: updates.fromBankId !== undefined ? updates.fromBankId : tx.fromBankId,
            amount: updates.amount !== undefined ? updates.amount : tx.amount,
            date: updates.date !== undefined ? updates.date : tx.date,
            voucherNo: updates.invoiceNo !== undefined ? updates.invoiceNo : tx.voucherNo,
            note: updates.note !== undefined ? updates.note : tx.note,
          };
        }
        return tx;
      }),
    }));
  };

  const deleteLoanRepayment = (txId: string) => {
    deleteTransaction(txId);
  };

  // Kuwait Personal Loans Given Handlers
  const addKuwaitLoan = (loan: Omit<KuwaitPersonalLoan, 'id' | 'currency' | 'createdAt'>) => {
    const newLoan: KuwaitPersonalLoan = {
      ...loan,
      id: `kloan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      currency: 'KWD',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      kuwaitLoans: [newLoan, ...(prev.kuwaitLoans || [])],
    }));
  };

  const updateKuwaitLoan = (id: string, updates: Partial<KuwaitPersonalLoan>) => {
    setData((prev) => ({
      ...prev,
      kuwaitLoans: (prev.kuwaitLoans || []).map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const deleteKuwaitLoan = (id: string) => {
    setData((prev) => ({
      ...prev,
      kuwaitLoans: (prev.kuwaitLoans || []).filter((l) => l.id !== id),
    }));
  };

  const toggleKuwaitLoanStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      kuwaitLoans: (prev.kuwaitLoans || []).map((l) => {
        if (l.id === id) {
          const nextStatus = l.status === 'paid' ? 'unpaid' : 'paid';
          return {
            ...l,
            status: nextStatus,
            returnDate: nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return l;
      }),
    }));
  };

  // Personal Receivable Loans Handlers (ব্যক্তিগত পাওনা / লোন প্রদান ও কিস্তিতে আদায়)
  const getKuwaitReceivableTotals = () => {
    const borrowers = data.kuwaitReceivableBorrowers || [];
    const txs = data.kuwaitReceivableTransactions || [];

    const totalLent = txs
      .filter((t) => t.type === 'lend')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalCollected = txs
      .filter((t) => t.type === 'collect')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalRemaining = Math.max(0, totalLent - totalCollected);

    const activeBorrowersCount = borrowers.filter((borrower) => {
      const l = txs
        .filter((t) => t.borrowerId === borrower.id && t.type === 'lend')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const c = txs
        .filter((t) => t.borrowerId === borrower.id && t.type === 'collect')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      return l - c > 0.0001;
    }).length;

    return {
      totalLent,
      totalCollected,
      totalRemaining,
      activeBorrowersCount,
      totalBorrowersCount: borrowers.length,
      transactionsCount: txs.length,
    };
  };

  const getBorrowerBalance = (borrowerId: string) => {
    const txs = (data.kuwaitReceivableTransactions || []).filter((t) => t.borrowerId === borrowerId);
    const totalLent = txs
      .filter((t) => t.type === 'lend')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalCollected = txs
      .filter((t) => t.type === 'collect')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const remaining = Math.max(0, totalLent - totalCollected);
    const lendCount = txs.filter((t) => t.type === 'lend').length;
    const collectCount = txs.filter((t) => t.type === 'collect').length;
    const sortedTxs = txs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalLent,
      totalCollected,
      remaining,
      lendCount,
      collectCount,
      transactions: sortedTxs,
    };
  };

  const addKuwaitReceivableBorrower = (borrower: Omit<KuwaitReceivableBorrower, 'id' | 'createdAt'>): KuwaitReceivableBorrower => {
    const newBorrower: KuwaitReceivableBorrower = {
      ...borrower,
      id: `krb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      kuwaitReceivableBorrowers: [...(prev.kuwaitReceivableBorrowers || []), newBorrower],
    }));
    return newBorrower;
  };

  const updateKuwaitReceivableBorrower = (id: string, updates: Partial<KuwaitReceivableBorrower>) => {
    setData((prev) => ({
      ...prev,
      kuwaitReceivableBorrowers: (prev.kuwaitReceivableBorrowers || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
      kuwaitReceivableTransactions: updates.name
        ? (prev.kuwaitReceivableTransactions || []).map((t) =>
            t.borrowerId === id ? { ...t, borrowerName: updates.name! } : t
          )
        : prev.kuwaitReceivableTransactions,
    }));
  };

  const deleteKuwaitReceivableBorrower = (id: string) => {
    setData((prev) => ({
      ...prev,
      kuwaitReceivableBorrowers: (prev.kuwaitReceivableBorrowers || []).filter((b) => b.id !== id),
      kuwaitReceivableTransactions: (prev.kuwaitReceivableTransactions || []).filter((t) => t.borrowerId !== id),
    }));
  };

  const addKuwaitReceivableTransaction = (tx: Omit<KuwaitReceivableTransaction, 'id' | 'createdAt'>): KuwaitReceivableTransaction => {
    const autoVoucher = tx.voucherNo && tx.voucherNo.trim() ? tx.voucherNo.trim() : getNextVoucherNo();
    const newTx: KuwaitReceivableTransaction = {
      ...tx,
      voucherNo: autoVoucher,
      id: `krt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      currency: 'KWD',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      kuwaitReceivableTransactions: [newTx, ...(prev.kuwaitReceivableTransactions || [])],
    }));
    return newTx;
  };

  const updateKuwaitReceivableTransaction = (id: string, updates: Partial<KuwaitReceivableTransaction>) => {
    setData((prev) => ({
      ...prev,
      kuwaitReceivableTransactions: (prev.kuwaitReceivableTransactions || []).map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  };

  const deleteKuwaitReceivableTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      kuwaitReceivableTransactions: (prev.kuwaitReceivableTransactions || []).filter((t) => t.id !== id),
    }));
  };

  // Kuwait Personal Payable Loans Handlers (ব্যক্তিগত দেনা / লোন গ্রহণ ও পরিশোধ)
  const getKuwaitPayableTotals = () => {
    const txs = data.kuwaitPayableTransactions || [];
    const lenders = data.kuwaitPayableLenders || [];

    const totalBorrowed = txs
      .filter((t) => t.type === 'borrow')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalRepaid = txs
      .filter((t) => t.type === 'repay')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalRemaining = Math.max(0, totalBorrowed - totalRepaid);

    const activeLendersCount = lenders.filter((lender) => {
      const b = txs
        .filter((t) => t.lenderId === lender.id && t.type === 'borrow')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const r = txs
        .filter((t) => t.lenderId === lender.id && t.type === 'repay')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      return b - r > 0.0001;
    }).length;

    return {
      totalBorrowed,
      totalRepaid,
      totalRemaining,
      activeLendersCount,
      totalLendersCount: lenders.length,
      transactionsCount: txs.length,
    };
  };

  const getLenderBalance = (lenderId: string) => {
    const txs = (data.kuwaitPayableTransactions || []).filter((t) => t.lenderId === lenderId);
    const totalBorrowed = txs
      .filter((t) => t.type === 'borrow')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalRepaid = txs
      .filter((t) => t.type === 'repay')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const remaining = Math.max(0, totalBorrowed - totalRepaid);
    const borrowCount = txs.filter((t) => t.type === 'borrow').length;
    const repayCount = txs.filter((t) => t.type === 'repay').length;
    const sortedTxs = txs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalBorrowed,
      totalRepaid,
      remaining,
      borrowCount,
      repayCount,
      transactions: sortedTxs,
    };
  };

  const addKuwaitPayableLender = (lender: Omit<KuwaitPayableLender, 'id' | 'createdAt'>): KuwaitPayableLender => {
    const newLender: KuwaitPayableLender = {
      ...lender,
      id: `kpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      kuwaitPayableLenders: [...(prev.kuwaitPayableLenders || []), newLender],
    }));
    return newLender;
  };

  const updateKuwaitPayableLender = (id: string, updates: Partial<KuwaitPayableLender>) => {
    setData((prev) => ({
      ...prev,
      kuwaitPayableLenders: (prev.kuwaitPayableLenders || []).map((l) => (l.id === id ? { ...l, ...updates } : l)),
      kuwaitPayableTransactions: updates.name
        ? (prev.kuwaitPayableTransactions || []).map((t) =>
            t.lenderId === id ? { ...t, lenderName: updates.name! } : t
          )
        : prev.kuwaitPayableTransactions,
    }));
  };

  const deleteKuwaitPayableLender = (id: string) => {
    setData((prev) => ({
      ...prev,
      kuwaitPayableLenders: (prev.kuwaitPayableLenders || []).filter((l) => l.id !== id),
      kuwaitPayableTransactions: (prev.kuwaitPayableTransactions || []).filter((t) => t.lenderId !== id),
    }));
  };

  const addKuwaitPayableTransaction = (tx: Omit<KuwaitPayableTransaction, 'id' | 'createdAt'>): KuwaitPayableTransaction => {
    const autoVoucher = tx.voucherNo && tx.voucherNo.trim() ? tx.voucherNo.trim() : getNextVoucherNo();
    const newTx: KuwaitPayableTransaction = {
      ...tx,
      voucherNo: autoVoucher,
      id: `kpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      currency: 'KWD',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      kuwaitPayableTransactions: [newTx, ...(prev.kuwaitPayableTransactions || [])],
    }));
    return newTx;
  };

  const updateKuwaitPayableTransaction = (id: string, updates: Partial<KuwaitPayableTransaction>) => {
    setData((prev) => ({
      ...prev,
      kuwaitPayableTransactions: (prev.kuwaitPayableTransactions || []).map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  };

  const deleteKuwaitPayableTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      kuwaitPayableTransactions: (prev.kuwaitPayableTransactions || []).filter((t) => t.id !== id),
    }));
  };

  const restoreAllData = (newData: AppData) => {
    setData(newData);
    saveData(newData);
  };

  const resetToDemoData = () => {
    setData(INITIAL_APP_DATA);
    saveData(INITIAL_APP_DATA);
  };

  // Bulk Settle Emdad Bhai Expenses
  const bulkSettleEmdadExpenses = (): number => {
    let count = 0;
    setData((prev) => {
      const updated = prev.transactions.map((tx) => {
        if (tx.section === 'emdad-expense' && tx.paymentStatus !== 'paid') {
          count++;
          return { ...tx, paymentStatus: 'paid' as const };
        }
        return tx;
      });
      return { ...prev, transactions: updated };
    });
    return count;
  };

  // Pay DPS or Insurance Installment from a BD Bank
  const paySavingsInstallmentFromBank = (params: {
    savingsId: string;
    bankId: string;
    amount: number;
    date: string;
    voucherNo?: string;
    note?: string;
  }): Transaction => {
    const savings = data.savingsAccounts.find((s) => s.id === params.savingsId);
    const bank = data.banks.find((b) => b.id === params.bankId);
    const autoVoucher = params.voucherNo?.trim() || getNextVoucherNo();

    const newTx: Transaction = {
      id: `tx-inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      section: 'bd-bank',
      type: 'transfer',
      transferTargetType: savings?.type || 'dps',
      fromBankId: params.bankId,
      targetSavingsId: params.savingsId,
      amount: params.amount,
      currency: 'BDT',
      date: params.date,
      voucherNo: autoVoucher,
      note: params.note?.trim() || `${savings?.name || 'DPS'} এর কিস্তি জমা (${bank?.name || 'Bank'} থেকে কর্তন)`,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    return newTx;
  };

  // Transfer Funds between two BD Banks
  const transferBankFunds = (params: {
    fromBankId: string;
    toBankId: string;
    amount: number;
    date: string;
    voucherNo?: string;
    note?: string;
  }): Transaction => {
    const fromBank = data.banks.find((b) => b.id === params.fromBankId);
    const toBank = data.banks.find((b) => b.id === params.toBankId);
    const autoVoucher = params.voucherNo?.trim() || getNextVoucherNo();

    const newTx: Transaction = {
      id: `tx-xfer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      section: 'bd-bank',
      type: 'transfer',
      transferTargetType: 'bank',
      fromBankId: params.fromBankId,
      toBankId: params.toBankId,
      amount: params.amount,
      currency: 'BDT',
      date: params.date,
      voucherNo: autoVoucher,
      note: params.note?.trim() || `${fromBank?.name || 'Bank'} থেকে ${toBank?.name || 'Bank'} এ ফান্ড ট্রান্সফার`,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    return newTx;
  };

  const getTotalNetWorthBdt = (): number => {
    const banks = getTotalBdBanksBalance();
    const dps = getTotalDpsSavings();
    const insurance = getTotalInsuranceSavings();
    const boss = getBossSalaryTotals().remainingBalance;
    const receivable = getKuwaitReceivableTotals().totalRemaining;
    const payable = getKuwaitPayableTotals().totalRemaining;

    // Convert Kuwait dinar balances to BDT
    const kuwaitNetKwd = boss + receivable - payable;
    const kuwaitNetBdt = kuwaitNetKwd * kwdRate;

    return Math.round(banks + dps + insurance + kuwaitNetBdt);
  };

  // Smart Due Dates & Alerts (Automated & Intelligent)
  const smartAlerts = useMemo<SmartAlert[]>(() => {
    const alerts: SmartAlert[] = [];
    const today = new Date().toISOString().split('T')[0];
    const currentYearMonth = today.substring(0, 7);

    // 1. Kuwait Receivable Loans Due
    const borrowers = data.kuwaitReceivableBorrowers || [];
    const rxTxs = data.kuwaitReceivableTransactions || [];
    borrowers.forEach((borrower) => {
      const lent = rxTxs
        .filter((t) => t.borrowerId === borrower.id && t.type === 'lend')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const collected = rxTxs
        .filter((t) => t.borrowerId === borrower.id && t.type === 'collect')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const remaining = lent - collected;

      if (remaining > 0.001) {
        const isOverdue = !!borrower.dueDate && borrower.dueDate < today;
        alerts.push({
          id: `alert-recv-${borrower.id}`,
          type: 'receivable_loan',
          titleBn: `${borrower.name} এর কাছে পাওনা লোন`,
          titleEn: `Receivable Loan from ${borrower.name}`,
          descriptionBn: isOverdue
            ? `পরিশোধের নির্ধারিত মেয়াদ উত্তীর্ণ হয়েছে (${borrower.dueDate})। বাকি পাওনা: ${remaining.toFixed(3)} KWD`
            : borrower.dueDate
            ? `পরিশোধের মেয়াদ: ${borrower.dueDate}। বাকি পাওনা: ${remaining.toFixed(3)} KWD`
            : `আংশিক/সম্পূর্ণ পাওনা বাকি আছে। অবশিষ্ট: ${remaining.toFixed(3)} KWD`,
          descriptionEn: `Outstanding loan: ${remaining.toFixed(3)} KWD${borrower.dueDate ? ` (Due: ${borrower.dueDate})` : ''}`,
          amount: remaining,
          currency: 'KWD',
          targetDate: borrower.dueDate,
          isOverdue,
          actionSection: 'kuwait-personal',
        });
      }
    });

    // 2. Unpaid Emdad Bhai Expenses
    const emdadUnpaid = (data.transactions || []).filter(
      (tx) => tx.section === 'emdad-expense' && tx.paymentStatus !== 'paid'
    );
    emdadUnpaid.forEach((tx) => {
      alerts.push({
        id: `alert-emdad-${tx.id}`,
        type: 'emdad_unpaid',
        titleBn: `ইমদাদ ভাই এর অপরিশোধিত খরচ`,
        titleEn: `Unpaid Expense for Emdad Bhai`,
        descriptionBn: `${tx.categoryNameBn || 'খরচ'} - ভাউচার নং: ${tx.voucherNo || 'N/A'}। টাকা পাওয়া বাকি আছে।`,
        descriptionEn: `${tx.categoryNameEn || 'Expense'} - Uncollected payment`,
        amount: Number(tx.amount || 0),
        currency: 'KWD',
        targetDate: tx.date,
        isOverdue: false,
        actionSection: 'emdad-expense',
      });
    });

    // 3. Monthly DPS & Insurance Installment Dues for Current Month
    const savingsAccounts = data.savingsAccounts || [];
    savingsAccounts.forEach((account) => {
      // Check if there is a deposit transaction in current month
      const hasPaidCurrentMonth = (data.transactions || []).some(
        (tx) =>
          tx.date.startsWith(currentYearMonth) &&
          (tx.targetSavingsId === account.id || tx.note?.includes(account.name))
      );

      if (!hasPaidCurrentMonth && account.monthlyAmount > 0) {
        alerts.push({
          id: `alert-savings-${account.id}-${currentYearMonth}`,
          type: 'savings_installment',
          titleBn: `${account.name} - চলতি মাসের কিস্তি`,
          titleEn: `${account.name} - Monthly Installment`,
          descriptionBn: `${account.type === 'dps' ? 'ডিপিএস' : 'ইন্সুরেন্স'} এর চলতি মাসের নির্ধারিত কিস্তি জমা দেওয়ার সময় হয়েছে।`,
          descriptionEn: `Monthly installment of ৳${account.monthlyAmount.toLocaleString()} is due this month.`,
          amount: account.monthlyAmount,
          currency: 'BDT',
          isOverdue: false,
          actionSection: 'savings-portfolio',
        });
      }
    });

    // 4. Kuwait Payable Loans Due (if borrower has specified due date)
    const lenders = data.kuwaitPayableLenders || [];
    const payTxs = data.kuwaitPayableTransactions || [];
    lenders.forEach((lender) => {
      const borrowed = payTxs
        .filter((t) => t.lenderId === lender.id && t.type === 'borrow')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const repaid = payTxs
        .filter((t) => t.lenderId === lender.id && t.type === 'repay')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const remaining = borrowed - repaid;

      if (remaining > 0.001 && lender.dueDate) {
        const isOverdue = lender.dueDate < today;
        alerts.push({
          id: `alert-pay-${lender.id}`,
          type: 'payable_loan',
          titleBn: `${lender.name} এর দেনা পরিশোধের তাগাদা`,
          titleEn: `Payable Loan to ${lender.name}`,
          descriptionBn: isOverdue
            ? `পরিশোধের তারিখ পার হয়ে গেছে (${lender.dueDate})। বাকি দেনা: ${remaining.toFixed(3)} KWD`
            : `পরিশোধের শেষ তারিখ: ${lender.dueDate}। বাকি দেনা: ${remaining.toFixed(3)} KWD`,
          descriptionEn: `Outstanding payable: ${remaining.toFixed(3)} KWD${lender.dueDate ? ` (Due: ${lender.dueDate})` : ''}`,
          amount: remaining,
          currency: 'KWD',
          targetDate: lender.dueDate,
          isOverdue,
          actionSection: 'kuwait-personal',
        });
      }
    });

    // Sort: overdue first, then by targetDate
    return alerts.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return (a.targetDate || '').localeCompare(b.targetDate || '');
    });
  }, [data]);

  // Clear any existing backlogged alerts on first load so user starts with 0 badge (as requested)
  useEffect(() => {
    const alreadyCleared = localStorage.getItem('hisab_kitab_initial_alerts_cleared_v1');
    if (!alreadyCleared && smartAlerts.length > 0) {
      const initialKeys = smartAlerts.map((a) => `${a.id}${a.isOverdue ? '-od' : ''}`);
      setSeenAlertKeys((prev) => {
        const merged = Array.from(new Set([...prev, ...initialKeys]));
        try {
          localStorage.setItem('hisab_kitab_seen_alerts_v2', JSON.stringify(merged));
        } catch (e) {
          console.error('Failed to save initial cleared alerts', e);
        }
        return merged;
      });
      localStorage.setItem('hisab_kitab_initial_alerts_cleared_v1', 'true');
    }
  }, [smartAlerts]);

  const isAlertSeen = useCallback(
    (id: string, isOverdue?: boolean): boolean => {
      const key = `${id}${isOverdue ? '-od' : ''}`;
      return seenAlertKeys.includes(key);
    },
    [seenAlertKeys]
  );

  const unreadAlertsCount = useMemo(() => {
    return smartAlerts.filter((a) => !seenAlertKeys.includes(`${a.id}${a.isOverdue ? '-od' : ''}`)).length;
  }, [smartAlerts, seenAlertKeys]);

  const markAlertsAsSeen = useCallback(() => {
    const currentKeys = smartAlerts.map((a) => `${a.id}${a.isOverdue ? '-od' : ''}`);
    setSeenAlertKeys((prev) => {
      const updated = Array.from(new Set([...prev, ...currentKeys]));
      try {
        localStorage.setItem('hisab_kitab_seen_alerts_v2', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save seen alerts', e);
      }
      return updated;
    });
  }, [smartAlerts]);

  const markSingleAlertAsSeen = useCallback((id: string, isOverdue?: boolean) => {
    const key = `${id}${isOverdue ? '-od' : ''}`;
    setSeenAlertKeys((prev) => {
      if (prev.includes(key)) return prev;
      const updated = [...prev, key];
      try {
        localStorage.setItem('hisab_kitab_seen_alerts_v2', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save seen alerts', e);
      }
      return updated;
    });
  }, []);

  const resetAllSeenAlerts = useCallback(() => {
    setSeenAlertKeys([]);
    try {
      localStorage.removeItem('hisab_kitab_seen_alerts_v2');
    } catch (e) {
      console.error('Failed to reset seen alerts', e);
    }
  }, []);

  const totalAlertsCount = smartAlerts.length;

  return (
    <FinanceContext.Provider
      value={{
        data,
        lang,
        setLang,
        t,
        activeSection,
        setActiveSection,
        getNextVoucherNo,
        isPrivacyMode,
        togglePrivacyMode,
        theme,
        toggleTheme,
        formatAmount,
        kwdRate,
        setKwdRate,
        isConverterOpen,
        setIsConverterOpen,
        getTotalNetWorthBdt,
        isAlertsOpen,
        setIsAlertsOpen,
        smartAlerts,
        totalAlertsCount,
        unreadAlertsCount,
        markAlertsAsSeen,
        markSingleAlertAsSeen,
        isAlertSeen,
        resetAllSeenAlerts,
        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddDefaultSection,
        openQuickAddWithSection,
        isBackupModalOpen,
        setIsBackupModalOpen,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        aiAssistantInitialTab,
        openAIAssistantWithTab,
        getBankBalance,
        getSavingsBalance,
        getTotalBdBanksBalance,
        getTotalDpsSavings,
        getTotalInsuranceSavings,
        getKuwaitPersonalTotals,
        getBossSalaryTotals,
        getEmdadTotals,
        getKuwaitExtraIncomeTotal,
        getKuwaitLoanTotals,
        getLoanBalance,
        getLoanRepayments,
        getKuwaitReceivableTotals,
        getBorrowerBalance,
        getKuwaitPayableTotals,
        getLenderBalance,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        togglePaymentStatus,
        addBossDeposit,
        updateBossDeposit,
        deleteBossDeposit,
        addCategory,
        deleteCategory,
        addBankAccount,
        updateBankAccount,
        addSavingsAccount,
        updateSavingsAccount,
        addLoan,
        updateLoan,
        deleteLoan,
        addLoanRepayment,
        updateLoanRepayment,
        deleteLoanRepayment,
        addKuwaitLoan,
        updateKuwaitLoan,
        deleteKuwaitLoan,
        toggleKuwaitLoanStatus,
        addKuwaitReceivableBorrower,
        updateKuwaitReceivableBorrower,
        deleteKuwaitReceivableBorrower,
        addKuwaitReceivableTransaction,
        updateKuwaitReceivableTransaction,
        deleteKuwaitReceivableTransaction,
        addKuwaitPayableLender,
        updateKuwaitPayableLender,
        deleteKuwaitPayableLender,
        addKuwaitPayableTransaction,
        updateKuwaitPayableTransaction,
        deleteKuwaitPayableTransaction,
        restoreAllData,
        resetToDemoData,
        isUniversalSearchOpen,
        setIsUniversalSearchOpen,
        bulkSettleEmdadExpenses,
        paySavingsInstallmentFromBank,
        transferBankFunds,
        isPinEnabled,
        isAppLocked,
        setIsAppLocked,
        isPinModalOpen,
        setIsPinModalOpen,
        setSecurityPin,
        disableSecurityPin,
        verifySecurityPin,
        lockApp,
        isCloudSynced,
        lastCloudSyncTime,
        forcePushToCloud,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
