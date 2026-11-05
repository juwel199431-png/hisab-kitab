import { AppData } from '../types/finance';
import { exportToCSV } from './storage';

export function exportMasterFinancialReport(data: AppData, lang: 'bn' | 'en' = 'bn'): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const headers = [
    lang === 'bn' ? 'তারিখ' : 'Date',
    lang === 'bn' ? 'অ্যাকাউন্ট হেড' : 'Account Head',
    lang === 'bn' ? 'লেনদেনের ধরন' : 'Type',
    lang === 'bn' ? 'পরিমাণ' : 'Amount',
    lang === 'bn' ? 'কারেন্সি' : 'Currency',
    lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category',
    lang === 'bn' ? 'সংশ্লিষ্ট ব্যাংক / ব্যক্তি' : 'Bank / Person',
    lang === 'bn' ? 'ভাউচার / চেক #' : 'Voucher / Cheque #',
    lang === 'bn' ? 'পরিশোধ স্ট্যাটাস' : 'Payment Status',
    lang === 'bn' ? 'নোট ও বিবরণ' : 'Description / Note',
  ];

  const rows: (string | number)[][] = [];

  // 1. Regular Transactions (BD Bank, Boss Salary, Emdad Bhai, Kuwait Personal, Extra Income)
  (data.transactions || []).forEach((tx) => {
    const headName =
      tx.section === 'bd-bank'
        ? lang === 'bn' ? 'বাংলাদেশের ব্যাংক' : 'BD Bank'
        : tx.section === 'boss-salary'
        ? lang === 'bn' ? 'শাকের ভাই বেতন' : 'Boss Salary'
        : tx.section === 'emdad-expense'
        ? lang === 'bn' ? 'ইমদাদ ভাই এর হিসাব' : 'Emdad Bhai'
        : tx.section === 'kuwait-personal'
        ? lang === 'bn' ? 'কুয়েত পার্সোনাল' : 'Kuwait Personal'
        : lang === 'bn' ? 'কুয়েত অতিরিক্ত আয়' : 'Kuwait Extra Income';

    const typeName =
      tx.type === 'income'
        ? lang === 'bn' ? 'আয় / জমা' : 'Income'
        : tx.type === 'expense'
        ? lang === 'bn' ? 'ব্যয় / খরচ' : 'Expense'
        : lang === 'bn' ? 'ট্রান্সফার' : 'Transfer';

    const bank = tx.bankId ? data.banks.find((b) => b.id === tx.bankId)?.name || '' : '';
    const category = lang === 'bn' ? tx.categoryNameBn || '' : tx.categoryNameEn || tx.categoryNameBn || '';

    rows.push([
      tx.date,
      headName,
      typeName,
      tx.amount,
      tx.currency,
      category,
      bank,
      tx.voucherNo || '',
      tx.paymentStatus ? (tx.paymentStatus === 'paid' ? 'Paid' : 'Unpaid') : '',
      tx.note || '',
    ]);
  });

  // 2. Boss Salary Deposits
  (data.bossDeposits || []).forEach((dep) => {
    rows.push([
      dep.depositDate,
      lang === 'bn' ? 'শাকের ভাই বেতন ফান্ড' : 'Boss Salary Deposit',
      lang === 'bn' ? 'তহবিল প্রাপ্তি (জমা)' : 'Deposit',
      dep.amount,
      'KWD',
      lang === 'bn' ? `বেতন কিস্তি (${dep.month})` : `Salary Deposit (${dep.month})`,
      'Shaker Bhai',
      dep.receiptNumber || '',
      'Received',
      dep.note || '',
    ]);
  });

  // 3. Kuwait Receivable Loans
  (data.kuwaitReceivableTransactions || []).forEach((tx) => {
    rows.push([
      tx.date,
      lang === 'bn' ? 'কুয়েত পার্সোনাল পাওনা লোন' : 'Kuwait Receivable Loan',
      tx.type === 'lend'
        ? lang === 'bn' ? 'লোন প্রদান' : 'Lend'
        : lang === 'bn' ? 'লোন আদায়' : 'Collect',
      tx.amount,
      'KWD',
      lang === 'bn' ? 'ব্যক্তিগত পাওনা' : 'Personal Loan',
      tx.borrowerName,
      tx.voucherNo || '',
      tx.type === 'collect' ? 'Collected' : 'Outstanding',
      tx.note || '',
    ]);
  });

  // 4. Kuwait Payable Loans
  (data.kuwaitPayableTransactions || []).forEach((tx) => {
    rows.push([
      tx.date,
      lang === 'bn' ? 'কুয়েত পার্সোনাল দেনা লোন' : 'Kuwait Payable Loan',
      tx.type === 'borrow'
        ? lang === 'bn' ? 'লোন গ্রহণ' : 'Borrow'
        : lang === 'bn' ? 'লোন পরিশোধ' : 'Repay',
      tx.amount,
      'KWD',
      lang === 'bn' ? 'ব্যক্তিগত দেনা' : 'Personal Payable',
      tx.lenderName,
      tx.voucherNo || '',
      tx.type === 'repay' ? 'Repaid' : 'Payable',
      tx.note || '',
    ]);
  });

  // Sort rows by date descending
  rows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));

  const filename = `Hisab-Kitab-Master-Ledger-${dateStr}`;
  exportToCSV(filename, [headers, ...rows]);
}
