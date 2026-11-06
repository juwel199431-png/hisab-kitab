import { AppData, BankAccount, DpsInsuranceAccount, LoanRecord, Transaction } from '../types/finance';
import {
  INITIAL_APP_DATA,
  DEFAULT_KUWAIT_LOANS,
  DEFAULT_KUWAIT_RECEIVABLE_BORROWERS,
  DEFAULT_KUWAIT_RECEIVABLE_TRANSACTIONS,
  DEFAULT_KUWAIT_PAYABLE_LENDERS,
  DEFAULT_KUWAIT_PAYABLE_TRANSACTIONS,
} from './initialData';

export const STORAGE_KEY = 'hisab_kitab_user_data_v1';
export const LANG_STORAGE_KEY = 'hisab_kitab_lang_pref';

export function loadStoredData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(INITIAL_APP_DATA);
      return INITIAL_APP_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.banks) || !Array.isArray(parsed.transactions)) {
      console.warn('Invalid stored data structure, resetting to default');
      return INITIAL_APP_DATA;
    }

    // Auto-migrate DPS-1 to user's updated Mercantile Bank info and totalInstallments
    if (Array.isArray(parsed.savingsAccounts)) {
      let needsSave = false;
      const dps1 = parsed.savingsAccounts.find((s: any) => s.id === 'dps-1');
      if (dps1) {
        if (dps1.institution === 'ইসলামী ব্যাংক বাংলাদেশ' || dps1.accountNumber === 'DPS-2022-0981' || dps1.openingBalance === 60000) {
          dps1.institution = 'মার্কেন্টাইল ব্যাংক লিঃ';
          dps1.accountNumber = 'DPS-6551';
          dps1.openingBalance = 5000;
          dps1.monthlyAmount = 5000;
          needsSave = true;
        }
        if (!dps1.totalInstallments) {
          dps1.totalInstallments = 60;
          needsSave = true;
        }
      }

      const dps2 = parsed.savingsAccounts.find((s: any) => s.id === 'dps-2');
      if (dps2) {
        if (dps2.institution === 'ডাচ্-বাংলা ব্যাংক লিমিটেড' || dps2.accountNumber === 'DPS-DBBL-4432' || dps2.openingBalance === 120000) {
          dps2.name = '৫ বছর মেয়াদী ডিপিএস (DPS-2)';
          dps2.institution = 'মার্কেন্টাইল ব্যাংক লিঃ';
          dps2.accountNumber = 'DPS-5991';
          dps2.openingBalance = 10000;
          dps2.monthlyAmount = 5000;
          needsSave = true;
        }
        if (!dps2.totalInstallments) {
          dps2.totalInstallments = 60;
          needsSave = true;
        }
      }

      const ins1 = parsed.savingsAccounts.find((s: any) => s.id === 'ins-1');
      if (ins1) {
        if (
          ins1.openingBalance === 90000 ||
          ins1.monthlyAmount === 7500 ||
          ins1.maturityDate === '2034-01-15' ||
          ins1.accountNumber === 'POL-9923841' ||
          !ins1.accountNumber ||
          ins1.accountNumber !== 'POL-****3622'
        ) {
          ins1.name = 'মেটলাইফ জীবন বীমা (MetLife Insurance)';
          ins1.institution = 'MetLife Bangladesh';
          ins1.accountNumber = 'POL-****3622';
          ins1.openingBalance = 20978;
          ins1.monthlyAmount = 10489;
          ins1.maturityDate = '2038-06-06';
          needsSave = true;
        }
        if (!ins1.totalInstallments) {
          ins1.totalInstallments = 144;
          needsSave = true;
        }
      }

      parsed.savingsAccounts.forEach((s: any) => {
        if (!s.totalInstallments) {
          s.totalInstallments = s.type === 'dps' ? 60 : 144;
          needsSave = true;
        }
      });

      if (needsSave) {
        saveData(parsed);
      }
    }

    let needsSave = false;

    // Auto-remove all demo transactions for BD bank (tx-bd-*)
    if (Array.isArray(parsed.transactions)) {
      const hadDemo = parsed.transactions.some(
        (t: any) =>
          (typeof t.id === 'string' && t.id.startsWith('tx-bd-')) ||
          (t.targetSavingsId === 'ins-1' && t.amount === 7500)
      );
      if (hadDemo) {
        parsed.transactions = parsed.transactions.filter(
          (t: any) =>
            !(typeof t.id === 'string' && t.id.startsWith('tx-bd-')) &&
            !(t.targetSavingsId === 'ins-1' && t.amount === 7500)
        );
        needsSave = true;
      }

      // Auto-remove demo boss salary transactions (tx-boss-*)
      const hadDemoBossTx = parsed.transactions.some(
        (t: any) => typeof t.id === 'string' && t.id.startsWith('tx-boss-')
      );
      if (hadDemoBossTx) {
        parsed.transactions = parsed.transactions.filter(
          (t: any) => !(typeof t.id === 'string' && t.id.startsWith('tx-boss-'))
        );
        needsSave = true;
      }
    }

    // Auto-remove demo boss deposits (bd-dep-1)
    if (Array.isArray(parsed.bossDeposits)) {
      const hadDemoBossDep = parsed.bossDeposits.some((d: any) => d.id === 'bd-dep-1');
      if (hadDemoBossDep) {
        parsed.bossDeposits = parsed.bossDeposits.filter((d: any) => d.id !== 'bd-dep-1');
        needsSave = true;
      }
    }

    // Auto-remove demo Personal Receivable Loans (kwt-loan-1, kwt-loan-2)
    if (Array.isArray(parsed.kuwaitLoans)) {
      const hadDemoLoans = parsed.kuwaitLoans.some((l: any) => l.id === 'kwt-loan-1' || l.id === 'kwt-loan-2');
      if (hadDemoLoans) {
        parsed.kuwaitLoans = parsed.kuwaitLoans.filter((l: any) => l.id !== 'kwt-loan-1' && l.id !== 'kwt-loan-2');
        needsSave = true;
      }
    } else {
      parsed.kuwaitLoans = [];
      needsSave = true;
    }

    // Clean up any demo entries in kuwaitReceivableBorrowers and kuwaitReceivableTransactions
    if (!Array.isArray(parsed.kuwaitReceivableBorrowers)) {
      parsed.kuwaitReceivableBorrowers = DEFAULT_KUWAIT_RECEIVABLE_BORROWERS;
      needsSave = true;
    } else {
      const hadDemoBor = parsed.kuwaitReceivableBorrowers.some(
        (b: any) => b.id === 'krb-demo-1' || b.id === 'krb-demo-2'
      );
      if (hadDemoBor) {
        parsed.kuwaitReceivableBorrowers = parsed.kuwaitReceivableBorrowers.filter(
          (b: any) => b.id !== 'krb-demo-1' && b.id !== 'krb-demo-2'
        );
        needsSave = true;
      }
    }

    if (!Array.isArray(parsed.kuwaitReceivableTransactions)) {
      parsed.kuwaitReceivableTransactions = DEFAULT_KUWAIT_RECEIVABLE_TRANSACTIONS;
      needsSave = true;
    } else {
      const hadDemoRecTx = parsed.kuwaitReceivableTransactions.some(
        (t: any) => t.id === 'krt-demo-1' || t.id === 'krt-demo-2' || t.id.startsWith('krt-demo-')
      );
      if (hadDemoRecTx) {
        parsed.kuwaitReceivableTransactions = parsed.kuwaitReceivableTransactions.filter(
          (t: any) => t.id !== 'krt-demo-1' && t.id !== 'krt-demo-2' && !t.id.startsWith('krt-demo-')
        );
        needsSave = true;
      }
    }

    // Auto-remove demo Personal Payable Lenders & Transactions (kpl-lender-1, kpl-lender-2, kpt-1..4)
    if (Array.isArray(parsed.kuwaitPayableLenders)) {
      const hadDemoLenders = parsed.kuwaitPayableLenders.some(
        (l: any) => l.id === 'kpl-lender-1' || l.id === 'kpl-lender-2'
      );
      if (hadDemoLenders) {
        parsed.kuwaitPayableLenders = parsed.kuwaitPayableLenders.filter(
          (l: any) => l.id !== 'kpl-lender-1' && l.id !== 'kpl-lender-2'
        );
        needsSave = true;
      }
    } else {
      parsed.kuwaitPayableLenders = DEFAULT_KUWAIT_PAYABLE_LENDERS;
      needsSave = true;
    }

    if (Array.isArray(parsed.kuwaitPayableTransactions)) {
      const demoTxIds = new Set(['kpt-1', 'kpt-2', 'kpt-3', 'kpt-4']);
      const hadDemoPayableTxs = parsed.kuwaitPayableTransactions.some((t: any) => demoTxIds.has(t.id));
      if (hadDemoPayableTxs) {
        parsed.kuwaitPayableTransactions = parsed.kuwaitPayableTransactions.filter((t: any) => !demoTxIds.has(t.id));
        needsSave = true;
      }
    } else {
      parsed.kuwaitPayableTransactions = DEFAULT_KUWAIT_PAYABLE_TRANSACTIONS;
      needsSave = true;
    }

    if (needsSave) {
      saveData(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load stored finance data:', err);
    return INITIAL_APP_DATA;
  }
}

const SNAPSHOTS_KEY = 'hisab_kitab_snapshots_history';

export interface StorageSnapshot {
  timestamp: string;
  dateStr: string;
  data: AppData;
  txCount: number;
}

export function getAutoSnapshots(): StorageSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAutoSnapshot(data: AppData): void {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = getAutoSnapshots();
    const last = existing[0];
    const now = Date.now();
    const shouldSave = !last || now - new Date(last.timestamp).getTime() > 2 * 60 * 60 * 1000;

    if (shouldSave) {
      const newSnap: StorageSnapshot = {
        timestamp: new Date().toISOString(),
        dateStr: todayStr,
        data,
        txCount: data.transactions?.length || 0,
      };
      const updated = [newSnap, ...existing.filter((s) => s.dateStr !== todayStr || s.txCount !== newSnap.txCount)].slice(0, 10);
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('Auto snapshot save error:', err);
  }
}

export function saveData(data: AppData): void {
  try {
    const updated = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    saveAutoSnapshot(updated);
  } catch (err) {
    console.error('Failed to save finance data to localStorage:', err);
  }
}

/**
 * Downloads a complete JSON backup file that the user can store in Google Drive, iCloud, or PC.
 */
export function exportBackupFile(data: AppData): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Hisab-Kitab-Backup-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded JSON backup file.
 */
export async function parseBackupFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.banks || !parsed.transactions || !parsed.categories) {
          throw new Error('ফাইলটিতে হিসাব কিতাবের সঠিক ডাটা পাওয়া যায়নি (Invalid schema)');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে'));
    reader.readAsText(file);
  });
}

/**
 * Exports tabular data as a downloadable CSV file
 */
export function exportToCSV(filename: string, rows: (string | number)[][]): void {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel Bengali character rendering
    rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Calculates current balance for a Bangladesh Bank
 */
export function calculateBankBalance(bank: BankAccount, transactions: AppData['transactions']): number {
  let balance = Number(bank.openingBalance) || 0;

  for (const tx of transactions) {
    if (tx.section !== 'bd-bank') continue;

    const amount = Number(tx.amount) || 0;

    if (tx.type === 'income' && tx.bankId === bank.id) {
      balance += amount;
    } else if (tx.type === 'expense' && tx.bankId === bank.id) {
      balance -= amount;
    } else if (tx.type === 'transfer') {
      if (tx.fromBankId === bank.id) {
        // Outgoing transfer from this bank (to another bank, or to DPS, or to Insurance)
        balance -= amount;
      }
      if (tx.toBankId === bank.id) {
        // Incoming transfer to this bank from another bank
        balance += amount;
      }
    }
  }

  return balance;
}

/**
 * Calculates total accumulated savings for a DPS or Insurance account
 */
export function calculateSavingsBalance(savings: DpsInsuranceAccount, transactions: AppData['transactions']): number {
  let total = Number(savings.openingBalance) || 0;

  for (const tx of transactions) {
    if (
      tx.type === 'transfer' &&
      tx.targetSavingsId === savings.id
    ) {
      total += Number(tx.amount) || 0;
    }
  }

  return total;
}

/**
 * Calculates current status and remaining balance for a BD Bank Loan
 */
export function calculateLoanBalance(loan: LoanRecord, transactions: Transaction[]): {
  basePaid: number;
  repaidFromBanks: number;
  totalPaid: number;
  remaining: number;
  progress: number;
  repaymentsCount: number;
} {
  const repayments = transactions.filter(
    (tx) => tx.type === 'transfer' && tx.transferTargetType === 'loan' && tx.targetLoanId === loan.id
  );
  const repaidFromBanks = repayments.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalPaid = Number(loan.paidAmount || 0) + repaidFromBanks;
  const remaining = Math.max(0, Number(loan.totalAmount || 0) - totalPaid);
  const progress = loan.totalAmount > 0 ? (totalPaid / loan.totalAmount) * 100 : 0;

  return {
    basePaid: Number(loan.paidAmount || 0),
    repaidFromBanks,
    totalPaid,
    remaining,
    progress,
    repaymentsCount: repayments.length,
  };
}

