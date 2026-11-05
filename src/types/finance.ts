export type AccountSection =
  | 'dashboard'
  | 'bd-bank'
  | 'kuwait-personal'
  | 'boss-salary'
  | 'emdad-expense'
  | 'kuwait-extra-income'
  | 'savings-portfolio'
  | 'reports';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  branch?: string;
  openingBalance: number;
  currency: 'BDT';
  color?: string;
}

export interface DpsInsuranceAccount {
  id: string;
  type: 'dps' | 'insurance';
  name: string;
  institution: string;
  accountNumber: string;
  openingBalance: number;
  monthlyAmount: number;
  currency: 'BDT';
  totalInstallments?: number;
  maturityDate?: string;
  notes?: string;
}

export interface Category {
  id: string;
  nameBn: string;
  nameEn: string;
  type: 'income' | 'expense';
  section: 'bd-bank' | 'kuwait-personal' | 'boss-salary' | 'all';
  icon?: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  section: 'bd-bank' | 'kuwait-personal' | 'boss-salary' | 'emdad-expense' | 'kuwait-extra-income';
  type: TransactionType;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: 'BDT' | 'KWD';
  categoryId?: string;
  categoryNameBn?: string;
  categoryNameEn?: string;
  bankId?: string; // which bank account in BD
  // For transfers
  fromBankId?: string;
  toBankId?: string;
  transferTargetType?: 'bank' | 'dps' | 'insurance' | 'loan';
  targetSavingsId?: string; // ID of DPS or Insurance
  targetLoanId?: string; // ID of BD Bank Loan
  // Additional info
  note?: string;
  voucherNo?: string; // for vouchers
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'unpaid'; // For Emdad Bhai expense collection tracking
  createdAt: string;
}

export interface BossSalaryDeposit {
  id: string;
  month: string; // YYYY-MM
  depositDate: string;
  amount: number;
  currency: 'KWD';
  note?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface LoanRecord {
  id: string;
  name: string;
  lender: string;
  totalAmount: number;
  installmentAmount: number;
  paidAmount: number;
  currency: 'BDT';
  startDate: string;
  note?: string;
}

// Personal Receivable Loan (কাওকে দিনার লোন দেওয়ার হিসাব)
export interface KuwaitPersonalLoan {
  id: string;
  borrowerName: string; // ধার নেওয়া ব্যক্তির নাম
  amount: number; // ঋণের পরিমাণ (দিনার / KWD)
  currency: 'KWD';
  date: string; // লোন দেওয়ার তারিখ (YYYY-MM-DD)
  dueDate?: string; // ফেরত দেওয়ার সম্ভাব্য তারিখ
  returnDate?: string; // ফেরত পাওয়ার প্রকৃত তারিখ
  status: 'unpaid' | 'paid'; // 'unpaid' (বাকি) | 'paid' (পরিশোধিত)
  note?: string; // বিবরণ ও নোট
  createdAt: string;
}

// Personal Receivable Loan - Borrower Account (যার কাছে আমি দিনার পাই)
export interface KuwaitReceivableBorrower {
  id: string;
  name: string; // ধার গ্রহীতার নাম
  phone?: string;
  dueDate?: string; // টাকা ফেরত দেওয়ার সম্ভাব্য তারিখ
  notes?: string;
  createdAt: string;
}

// Personal Receivable Loan - Transactions (ধার দেওয়া ও আংশিক/সম্পূর্ণ আদায় করার লেনদেন)
export interface KuwaitReceivableTransaction {
  id: string;
  borrowerId: string; // কোন গ্রহীতার অ্যাকাউন্ট
  borrowerName: string; // গ্রহীতার নাম
  type: 'lend' | 'collect'; // 'lend' (লোন প্রদান) | 'collect' (লোন আদায় / ফেরত পাওয়া - মাইনাস)
  amount: number; // দিনার পরিমাণ (KWD)
  currency: 'KWD';
  date: string; // YYYY-MM-DD
  voucherNo?: string;
  note?: string;
  createdAt: string;
}

// Personal Payable Loan - Lender Account (যার কাছ থেকে লোন নেওয়া হয়েছে)
export interface KuwaitPayableLender {
  id: string;
  name: string; // ঋণদাতার নাম (যেমন: রফিক ভাই, মামুন ভাই)
  phone?: string;
  dueDate?: string; // লোন পরিশোধের শেষ তারিখ
  notes?: string;
  createdAt: string;
}

// Personal Payable Loan - Transactions (ধার নেওয়া ও পরিশোধ করার লেনদেন)
export interface KuwaitPayableTransaction {
  id: string;
  lenderId: string; // কোন ঋণদাতার অ্যাকাউন্ট
  lenderName: string; // ঋণদাতার নাম
  type: 'borrow' | 'repay'; // 'borrow' (লোন গ্রহণ) | 'repay' (লোন পরিশোধ / মাইনাস)
  amount: number; // দিনার পরিমাণ (KWD)
  currency: 'KWD';
  date: string; // YYYY-MM-DD
  voucherNo?: string;
  note?: string;
  createdAt: string;
}

export interface AppData {
  version: number;
  lastUpdated: string;
  banks: BankAccount[];
  savingsAccounts: DpsInsuranceAccount[];
  loans: LoanRecord[];
  kuwaitLoans?: KuwaitPersonalLoan[]; // Legacy Personal Receivable Loans
  kuwaitReceivableBorrowers?: KuwaitReceivableBorrower[]; // Personal Receivable Borrowers (ব্যক্তিগত পাওনা অ্যাকাউন্ট)
  kuwaitReceivableTransactions?: KuwaitReceivableTransaction[]; // Personal Receivable Transactions (ধার দেওয়া ও আদায়)
  kuwaitPayableLenders?: KuwaitPayableLender[]; // Personal Payable Lenders (ব্যক্তিগত দেনা অ্যাকাউন্ট)
  kuwaitPayableTransactions?: KuwaitPayableTransaction[]; // Personal Payable Transactions (ধার নেওয়া ও পরিশোধ)
  categories: Category[];
  transactions: Transaction[];
  bossDeposits: BossSalaryDeposit[];
}

export interface SmartAlert {
  id: string;
  type: 'receivable_loan' | 'payable_loan' | 'savings_installment' | 'emdad_unpaid';
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  amount: number;
  currency: 'BDT' | 'KWD';
  targetDate?: string;
  isOverdue: boolean;
  actionSection: AccountSection;
}

