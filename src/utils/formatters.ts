export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
}

export function formatNumber(num: number | string, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'bn') {
    return toBengaliNumber(num);
  }
  return String(num);
}

export function formatCurrency(
  amount: number,
  currency: 'BDT' | 'KWD',
  lang: 'bn' | 'en' = 'bn',
  isMasked: boolean = false
): string {
  if (isMasked) {
    if (currency === 'BDT') {
      return '৳ ••••••';
    }
    return lang === 'bn' ? '•••••• দিনার' : '•••••• KWD';
  }

  const num = Number(amount) || 0;

  if (currency === 'BDT') {
    // Bangladesh format: ৳ 1,50,000.00
    const formatted = new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);

    return formatted;
  }

  // Kuwaiti Dinar format: typically 3 decimal places (fils) e.g., 450.000 KWD
  const formattedNum = num.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return lang === 'bn' ? `${formattedNum} দিনার (KWD)` : `${formattedNum} KWD`;
}

export function formatDate(dateString: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatMonth(yearMonth: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
  });
}

export const TRANSLATIONS = {
  bn: {
    appName: 'হিসাব কিতাব',
    appTagline: 'দৈনন্দিন আয়-ব্যয়, ব্যাংক, ডিপিএস এবং কুয়েত খরচের স্মার্ট ম্যানেজার',
    // Nav Tabs
    tabBdBanks: 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী',
    tabBossSalary: 'শাকের ভাই এর বেতন হিসাব',
    tabEmdadExpense: 'ইমদাদ ভাই এর হিসাব',
    tabKuwaitPersonal: 'কুয়েত দৈনিক খরচ',
    tabKuwaitExtraIncome: 'কুয়েত এর অতিরিক্ত আয়',
    tabSavings: 'ডিপিএস ও ইন্সুরেন্স',
    tabReports: 'মাসিক রিপোর্ট ও এনালিটিক্স',
    
    // Actions
    quickAdd: 'দ্রুত এন্ট্রি করুন',
    backupRestore: 'ড্রাইভ / ক্লাউড ব্যাকআপ',
    exportPdf: 'পিডিএফ / প্রিন্ট রিপোর্ট',
    exportExcel: 'এক্সেলে ডাউনলোড (CSV)',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছে ফেলুন',
    edit: 'সম্পাদনা',
    transfer: 'টাকা ট্রান্সফার',
    filter: 'ফিল্টার',
    allCategories: 'সকল ক্যাটাগরি',
    allBanks: 'সকল ব্যাংক',
    searchPlaceholder: 'খুঁজুন (নোট, ক্যাটাগরি, ভাউচার)...',
    reset: 'রিসেট',
    manageCategories: 'ক্যাটাগরি ম্যানেজমেন্ট',
    openingBalance: 'ওপেনিং ব্যালেন্স',
    currentBalance: 'বর্তমান ব্যালেন্স',
    totalIncome: 'মোট জমা / আয়',
    totalExpense: 'মোট খরচ / ব্যয়',
    remainingBalance: 'অবশিষ্ট ব্যালেন্স',
    totalSavings: 'মোট সঞ্চয় ও জমা',

    // BD Banks
    bdAccountsTitle: 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী',
    addBank: 'নতুন ব্যাংক যোগ করুন',
    transferTitle: 'এক ব্যাংক থেকে অন্য ব্যাংক / ডিপিএস / ইন্সুরেন্সে ট্রান্সফার',
    fromBank: 'কোন ব্যাংক থেকে কর্তন হবে',
    toDestination: 'কোথায় জমা হবে',
    toBank: 'অন্য ব্যাংক অ্যাকাউন্টে',
    toDps: 'ডিপিএস সেভিংসে',
    toInsurance: 'ইন্সুরেন্স সেভিংসে',
    amount: 'টাকার পরিমাণ',
    date: 'তারিখ',
    category: 'খাত / ক্যাটাগরি',
    note: 'বিবরণ / নোট',
    transactionsHistory: 'লেনদেনের বিস্তারিত বিবরণী',
    income: 'জমা / আয় (+)',
    expense: 'খরচ / ব্যয় (-)',
    bankTransfer: 'ফান্ড ট্রান্সফার (⇄)',
    
    // Kuwait Personal
    kwtPersonalTitle: 'কুয়েত দৈনন্দিন ব্যক্তিগত খরচ',
    kwtSubtitle: 'এখানে শুধুমাত্র আপনার প্রতিদিনের নিজস্ব খরচের হিসাব থাকবে (কোন ইনকাম অপশন নেই)',
    quickAmount: 'দ্রুত দিনার অ্যামাউন্ট',
    
    // Shaker Bhai (Boss Salary)
    bossTitle: 'শাকের ভাই এর মাসিক বেতন ও সাইট খরচ হিসাব',
    bossSubtitle: 'মাসিক বেতনের ফান্ড প্রাপ্তি এবং প্রতিদিনের খরচ শেষে অবশিষ্ট ব্যালেন্সের নিখুঁত হিসাব ও প্রিন্ট রিপোর্ট',
    addDeposit: 'নতুন মাসের বেতন জমা রেকর্ড',
    depositAmount: 'বেতন জমা পরিমাণ (KWD)',
    month: 'কোন মাসের জন্য',
    receiptVoucher: 'রসিদ / ভাউচার নং',
    statementForBoss: 'শাকের ভাই এর জন্য অনুমোদিত খরচের স্টেটমেন্ট',
    printReportTitle: 'শাকের ভাই এর হিসাব বিবরণী (Print / PDF Statement)',
    bossSignature: 'শাকের ভাই এর স্বাক্ষর (Shaker Bhai Signature)',
    submitterSignature: 'প্রস্তুতকারীর স্বাক্ষর',
  },
  en: {
    appName: 'Hisab Kitab',
    appTagline: 'Daily Finance, Bangladesh Banks, DPS, and Kuwait Expense Ledger',
    // Nav Tabs
    tabBdBanks: 'Bangladesh Banks & Savings',
    tabBossSalary: 'Shaker Bhai Salary',
    tabEmdadExpense: 'Emdad Bhai Expense',
    tabKuwaitPersonal: 'Kuwait Daily Expense',
    tabKuwaitExtraIncome: 'Kuwait Extra Income',
    tabSavings: 'DPS & Insurance',
    tabReports: 'Monthly Reports & Analytics',
    
    // Actions
    quickAdd: 'Quick Entry',
    backupRestore: 'Drive / Cloud Backup',
    exportPdf: 'PDF / Print Report',
    exportExcel: 'Download CSV (Excel)',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    transfer: 'Transfer Funds',
    filter: 'Filter',
    allCategories: 'All Categories',
    allBanks: 'All Banks',
    searchPlaceholder: 'Search (notes, category, voucher)...',
    reset: 'Reset',
    manageCategories: 'Manage Categories',
    openingBalance: 'Opening Balance',
    currentBalance: 'Current Balance',
    totalIncome: 'Total Income / Deposit',
    totalExpense: 'Total Expenses',
    remainingBalance: 'Remaining Balance',
    totalSavings: 'Total Accumulated Savings',

    // BD Banks
    bdAccountsTitle: 'Bangladesh Bank Accounts',
    addBank: 'Add Bank Account',
    transferTitle: 'Bank to Bank / DPS / Insurance Transfer',
    fromBank: 'Transfer From (Bank)',
    toDestination: 'Transfer Destination',
    toBank: 'To Another Bank',
    toDps: 'To DPS Savings',
    toInsurance: 'To Insurance Policy',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    note: 'Note / Description',
    transactionsHistory: 'Transaction History & Statement',
    income: 'Income / Deposit (+)',
    expense: 'Expense (-)',
    bankTransfer: 'Transfer (⇄)',
    
    // Kuwait Personal
    kwtPersonalTitle: 'Kuwait Personal Daily Expenses',
    kwtSubtitle: 'Tracks daily living costs in Kuwaiti Dinar (Expense only, no income)',
    quickAmount: 'Quick Dinar Presets',
    
    // Boss Salary
    bossTitle: 'Boss Salary Fund & Daily Expenses',
    bossSubtitle: 'Monthly salary deposits & accurate daily deductions with one-click print/PDF statement',
    addDeposit: 'Record New Salary Deposit',
    depositAmount: 'Salary Received (KWD)',
    month: 'Month',
    receiptVoucher: 'Receipt / Voucher #',
    statementForBoss: 'Official Expense Statement for Boss',
    printReportTitle: 'Expense Statement for Boss (Print / PDF)',
    bossSignature: 'Boss Approval Signature',
    submitterSignature: 'Prepared By (Signature)',
  },
};
