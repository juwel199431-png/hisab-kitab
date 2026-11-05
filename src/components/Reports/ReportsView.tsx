import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  Landmark,
  Coins,
  Filter,
  RotateCcw,
  Search,
  HandCoins,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Layers,
  Tag,
  Check,
  Eye,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  ArrowUpDown,
  Building,
  Edit2,
  Briefcase,
  UserCheck,
  PiggyBank,
  CreditCard,
  Sparkles,
  Wallet,
  Receipt,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { ReportAuditVoucherModal, AuditReportRow } from './ReportAuditVoucherModal';
import {
  UniversalTransactionEditModal,
  UniversalEditTarget,
} from '../Common/UniversalTransactionEditModal';

type AccountFilter =
  | 'all'
  | 'bd-bank'
  | 'boss-salary'
  | 'emdad-expense'
  | 'kuwait-personal'
  | 'kuwait-extra-income'
  | 'kuwait-loan'
  | 'kuwait-payable'
  | 'savings-portfolio';

type TypeFilter = 'all' | 'income' | 'expense' | 'transfer' | 'loan';
type StatusFilter = 'all' | 'unpaid' | 'paid';
type ReportTab = 'all' | 'overview' | 'unpaid';
type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

export const ReportsView: React.FC = () => {
  const {
    data,
    lang,
    t,
    getTotalBdBanksBalance,
    getTotalDpsSavings,
    getTotalInsuranceSavings,
    getKuwaitReceivableTotals,
    getKuwaitPayableTotals,
    getBossSalaryTotals,
    getEmdadTotals,
    getKuwaitPersonalTotals,
    getKuwaitExtraIncomeTotal,
    toggleKuwaitLoanStatus,
    togglePaymentStatus,
  } = useFinance();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<ReportTab>('all');

  // Filter States
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting States
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Voucher Detail Modal
  const [selectedAuditRow, setSelectedAuditRow] = useState<AuditReportRow | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Universal Transaction Edit Modal State
  const [editTarget, setEditTarget] = useState<UniversalEditTarget | null>(null);

  // Date Range Presets
  const [datePreset, setDatePreset] = useState<'all' | 'this-month' | 'last-month' | 'last-30' | 'custom'>('this-month');
  
  // Custom Date Range State
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Handle Preset Changes
  const handlePresetChange = (preset: 'all' | 'this-month' | 'last-month' | 'last-30' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'this-month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setStartDate(`${year}-${month}-01`);
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last-month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonthDate.getFullYear();
      const month = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, lastMonthDate.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last-30') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setAccountFilter('all');
    setCategoryFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    handlePresetChange('all');
    setCurrentPage(1);
  };

  // Build Unified Row Dataset
  const unifiedData = useMemo<AuditReportRow[]>(() => {
    const rows: AuditReportRow[] = [];

    // 1. Regular Transactions
    data.transactions.forEach((tx) => {
      let secNameBn = '';
      let secNameEn = '';

      if (tx.section === 'bd-bank') {
        secNameBn = 'বাংলাদেশের ব্যাংক';
        secNameEn = 'BD Banking';
      } else if (tx.section === 'boss-salary') {
        secNameBn = 'শাকের ভাই খরচ';
        secNameEn = 'Shaker Bhai Expenses';
      } else if (tx.section === 'emdad-expense') {
        secNameBn = 'ইমদাদ ভাই এর হিসাব';
        secNameEn = 'Emdad Bhai Expenses';
      } else if (tx.section === 'kuwait-personal') {
        secNameBn = 'কুয়েত দৈনিক খরচ';
        secNameEn = 'Kuwait Daily Expenses';
      } else if (tx.section === 'kuwait-extra-income') {
        secNameBn = 'কুয়েত অতিরিক্ত আয়';
        secNameEn = 'Kuwait Extra Income';
      }

      let catBn = tx.categoryNameBn || '';
      let catEn = tx.categoryNameEn || tx.categoryNameBn || '';
      if (!catBn) {
        if (tx.section === 'emdad-expense') catBn = 'ইমদাদ ভাই খরচ';
        else if (tx.section === 'kuwait-extra-income') catBn = 'অতিরিক্ত আয়';
        else if (tx.type === 'transfer') catBn = 'তহবিল ট্রান্সফার';
        else catBn = 'সাধারণ লেনদেন';
      }

      const bank = data.banks.find((b) => b.id === (tx.bankId || tx.fromBankId));

      rows.push({
        id: tx.id,
        sourceType: 'transaction',
        date: tx.date,
        section: tx.section,
        sectionNameBn: secNameBn,
        sectionNameEn: secNameEn,
        type: tx.type,
        categoryNameBn: catBn,
        categoryNameEn: catEn,
        amount: Number(tx.amount || 0),
        currency: tx.currency,
        note: tx.note,
        status: tx.paymentStatus,
        bankName: bank?.name,
        voucherNo: tx.voucherNo,
      });
    });

    // 2. Boss Salary Deposits
    data.bossDeposits.forEach((dep) => {
      rows.push({
        id: dep.id,
        sourceType: 'boss-deposit',
        date: dep.depositDate,
        section: 'boss-salary',
        sectionNameBn: 'শাকের ভাই বেতন ফান্ড',
        sectionNameEn: 'Shaker Bhai Salary Deposit',
        type: 'income',
        categoryNameBn: 'মাসিক বেতন প্রাপ্তি',
        categoryNameEn: 'Monthly Salary Deposit',
        amount: Number(dep.amount || 0),
        currency: dep.currency,
        note: dep.note || (dep.receiptNumber ? `রসিদ নং: ${dep.receiptNumber}` : undefined),
        voucherNo: dep.receiptNumber,
      });
    });

    // 3. Personal Receivable Loans (কাওকে লোন দেওয়া ও আদায়)
    (data.kuwaitLoans || []).forEach((loan) => {
      rows.push({
        id: loan.id,
        sourceType: 'kuwait-loan',
        date: loan.date,
        section: 'kuwait-loan',
        sectionNameBn: 'Personal Receivable Loan (ব্যক্তিগত পাওনা লোন)',
        sectionNameEn: 'Personal Receivable Loan',
        type: 'loan',
        categoryNameBn: `লোন প্রদান: ${loan.borrowerName}`,
        categoryNameEn: `Loan: ${loan.borrowerName}`,
        amount: Number(loan.amount || 0),
        currency: loan.currency,
        note: loan.note ? `${loan.note}${loan.dueDate ? ` (ফেরত: ${loan.dueDate})` : ''}` : loan.dueDate ? `ফেরত দেওয়ার তারিখ: ${loan.dueDate}` : undefined,
        status: loan.status,
        borrowerName: loan.borrowerName,
      });
    });

    // 4. Personal Payable Loans (কারোর থেকে ধার নেওয়া ও পরিশোধ)
    (data.kuwaitPayableTransactions || []).forEach((tx) => {
      rows.push({
        id: tx.id,
        sourceType: 'kuwait-payable',
        date: tx.date,
        section: 'kuwait-payable',
        sectionNameBn: 'Personal Payable Loan (ব্যক্তিগত দেনা লোন)',
        sectionNameEn: 'Personal Payable Loan',
        type: tx.type === 'borrow' ? 'income' : 'expense',
        categoryNameBn: `${tx.type === 'borrow' ? 'লোন গ্রহণ' : 'লোন পরিশোধ'}: ${tx.lenderName}`,
        categoryNameEn: `${tx.type === 'borrow' ? 'Borrow Loan' : 'Repay Loan'}: ${tx.lenderName}`,
        amount: Number(tx.amount || 0),
        currency: tx.currency,
        note: tx.note,
        voucherNo: tx.voucherNo,
        borrowerName: tx.lenderName,
      });
    });

    // 5. Personal Receivable Loan Transactions (কাওকে দিনার লোন দেওয়া ও কিস্তি/আংশিক আদায়)
    (data.kuwaitReceivableTransactions || []).forEach((tx) => {
      rows.push({
        id: tx.id,
        sourceType: 'kuwait-receivable',
        date: tx.date,
        section: 'kuwait-loan',
        sectionNameBn: 'Personal Receivable Loan (ব্যক্তিগত পাওনা লোন)',
        sectionNameEn: 'Personal Receivable Loan',
        type: tx.type === 'lend' ? 'loan' : 'income',
        categoryNameBn: `${tx.type === 'lend' ? 'লোন প্রদান' : 'লোন আদায় / ফেরত'}: ${tx.borrowerName}`,
        categoryNameEn: `${tx.type === 'lend' ? 'Lend Loan' : 'Collect Loan'}: ${tx.borrowerName}`,
        amount: Number(tx.amount || 0),
        currency: tx.currency,
        note: tx.note,
        voucherNo: tx.voucherNo,
        borrowerName: tx.borrowerName,
      });
    });

    return rows;
  }, [data.transactions, data.bossDeposits, data.kuwaitLoans, data.kuwaitPayableTransactions, data.kuwaitReceivableTransactions, data.banks]);

  // Categories available for current selection
  const availableCategories = useMemo(() => {
    const catMap = new Map<string, { id: string; nameBn: string; nameEn: string }>();

    data.categories.forEach((c) => {
      if (accountFilter === 'all') {
        catMap.set(c.id, { id: c.id, nameBn: c.nameBn, nameEn: c.nameEn });
      } else if (accountFilter === 'bd-bank' && c.section === 'bd-bank') {
        catMap.set(c.id, { id: c.id, nameBn: c.nameBn, nameEn: c.nameEn });
      } else if (accountFilter === 'boss-salary' && c.section === 'boss-salary') {
        catMap.set(c.id, { id: c.id, nameBn: c.nameBn, nameEn: c.nameEn });
      } else if (accountFilter === 'kuwait-personal' && c.section === 'kuwait-personal') {
        catMap.set(c.id, { id: c.id, nameBn: c.nameBn, nameEn: c.nameEn });
      }
    });

    return Array.from(catMap.values());
  }, [data.categories, accountFilter]);

  // Filtered Rows matching all chosen criteria
  const filteredRows = useMemo(() => {
    let rows = unifiedData.filter((row) => {
      // Tab filter
      if (activeTab === 'unpaid') {
        if (row.status !== 'unpaid') return false;
      }

      // 1. Account Filter
      if (accountFilter !== 'all') {
        if (accountFilter === 'savings-portfolio') {
          if (row.type !== 'transfer') return false;
        } else if (row.section !== accountFilter) {
          return false;
        }
      }

      // 2. Date Filter
      if (startDate && row.date < startDate) return false;
      if (endDate && row.date > endDate) return false;

      // 3. Category Filter
      if (categoryFilter !== 'all') {
        const cat = data.categories.find((c) => c.id === categoryFilter);
        if (cat) {
          if (row.categoryNameBn !== cat.nameBn && row.categoryNameEn !== cat.nameEn) {
            return false;
          }
        }
      }

      // 4. Type Filter
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;

      // 5. Status Filter
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catMatch =
          row.categoryNameBn.toLowerCase().includes(q) ||
          row.categoryNameEn.toLowerCase().includes(q);
        const noteMatch = row.note?.toLowerCase().includes(q);
        const secMatch =
          row.sectionNameBn.toLowerCase().includes(q) ||
          row.sectionNameEn.toLowerCase().includes(q);
        const borrowerMatch = row.borrowerName?.toLowerCase().includes(q);
        const bankMatch = row.bankName?.toLowerCase().includes(q);
        const voucherMatch = row.voucherNo?.toLowerCase().includes(q);

        if (!catMatch && !noteMatch && !secMatch && !borrowerMatch && !bankMatch && !voucherMatch) {
          return false;
        }
      }

      return true;
    });

    // Sort Rows
    rows.sort((a, b) => {
      if (sortField === 'date') {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return sortOrder === 'desc' ? diff : -diff;
      } else if (sortField === 'amount') {
        const diff = b.amount - a.amount;
        return sortOrder === 'desc' ? diff : -diff;
      } else if (sortField === 'category') {
        const diff = a.categoryNameBn.localeCompare(b.categoryNameBn);
        return sortOrder === 'asc' ? diff : -diff;
      }
      return 0;
    });

    return rows;
  }, [
    unifiedData,
    activeTab,
    accountFilter,
    startDate,
    endDate,
    categoryFilter,
    typeFilter,
    statusFilter,
    searchQuery,
    sortField,
    sortOrder,
    data.categories,
  ]);

  // Aggregate Totals by Currency
  const totals = useMemo(() => {
    let bdtIncome = 0;
    let bdtExpense = 0;
    let bdtTransfer = 0;

    let kwdIncome = 0;
    let kwdExpense = 0;
    let kwdLoanTotal = 0;
    let kwdLoanPaid = 0;
    let kwdLoanUnpaid = 0;
    let pendingBillsCount = 0;

    filteredRows.forEach((row) => {
      if (row.status === 'unpaid') pendingBillsCount++;

      if (row.currency === 'BDT') {
        if (row.type === 'income') bdtIncome += row.amount;
        else if (row.type === 'expense') bdtExpense += row.amount;
        else if (row.type === 'transfer') bdtTransfer += row.amount;
      } else if (row.currency === 'KWD') {
        if (row.type === 'income') kwdIncome += row.amount;
        else if (row.type === 'expense') kwdExpense += row.amount;
        else if (row.type === 'loan') {
          kwdLoanTotal += row.amount;
          if (row.status === 'paid') kwdLoanPaid += row.amount;
          else kwdLoanUnpaid += row.amount;
        }
      }
    });

    return {
      bdtIncome,
      bdtExpense,
      bdtTransfer,
      bdtNet: bdtIncome - bdtExpense,
      kwdIncome,
      kwdExpense,
      kwdNet: kwdIncome - kwdExpense,
      kwdLoanTotal,
      kwdLoanPaid,
      kwdLoanUnpaid,
      pendingBillsCount,
      count: filteredRows.length,
    };
  }, [filteredRows]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { nameBn: string; nameEn: string; total: number; currency: 'BDT' | 'KWD'; type: string; count: number }> = {};

    filteredRows.forEach((row) => {
      if (row.type === 'transfer') return;
      const key = `${row.currency}-${row.type}-${row.categoryNameBn}`;
      if (!map[key]) {
        map[key] = {
          nameBn: row.categoryNameBn,
          nameEn: row.categoryNameEn,
          total: 0,
          currency: row.currency,
          type: row.type,
          count: 0,
        };
      }
      map[key].total += row.amount;
      map[key].count += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (accountFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    if (datePreset !== 'all') count++;
    return count;
  }, [accountFilter, categoryFilter, typeFilter, statusFilter, searchQuery, datePreset]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleExportFullCSV = () => {
    const headers = [
      lang === 'bn' ? 'তারিখ' : 'Date',
      lang === 'bn' ? 'অ্যাকাউন্ট / হেড' : 'Account/Head',
      lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category',
      lang === 'bn' ? 'ধরণ' : 'Type',
      lang === 'bn' ? 'মুদ্রা' : 'Currency',
      lang === 'bn' ? 'পরিমাণ' : 'Amount',
      lang === 'bn' ? 'অবস্থা' : 'Status',
      lang === 'bn' ? 'নোট / বিবরণ' : 'Note/Details',
      lang === 'bn' ? 'ভাউচার নং' : 'Voucher No',
    ];

    const rows = filteredRows.map((r) => [
      r.date,
      lang === 'bn' ? r.sectionNameBn : r.sectionNameEn,
      lang === 'bn' ? r.categoryNameBn : r.categoryNameEn,
      r.type,
      r.currency,
      r.amount.toFixed(r.currency === 'KWD' ? 3 : 2),
      r.status ? (r.status === 'paid' ? 'Paid' : 'Unpaid') : '',
      r.note || '',
      r.voucherNo || '',
    ]);

    const filename = `Financial-Report-${startDate || 'all'}-to-${endDate || 'now'}`;
    exportToCSV(filename, [headers, ...rows]);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Head-specific summary calculations for cute executive cards
  const bossTotals = getBossSalaryTotals();
  const recTotals = getKuwaitReceivableTotals();
  const payTotals = getKuwaitPayableTotals();
  const emdadTotals = getEmdadTotals();
  const kwtPersonalTotals = getKuwaitPersonalTotals();
  const kwtExtraTotals = getKuwaitExtraIncomeTotal();
  const totalBdBanksBal = getTotalBdBanksBalance();
  const totalDpsBal = getTotalDpsSavings();
  const totalInsBal = getTotalInsuranceSavings();

  const getHeadBadgeConfig = (section: string) => {
    switch (section) {
      case 'bd-bank':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          icon: Landmark,
        };
      case 'boss-salary':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          icon: Briefcase,
        };
      case 'kuwait-personal':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-200',
          icon: Wallet,
        };
      case 'kuwait-loan':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: HandCoins,
        };
      case 'kuwait-payable':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-800',
          border: 'border-purple-200',
          icon: CreditCard,
        };
      case 'emdad-expense':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-900',
          border: 'border-orange-200',
          icon: UserCheck,
        };
      case 'kuwait-extra-income':
        return {
          bg: 'bg-cyan-50',
          text: 'text-cyan-900',
          border: 'border-cyan-200',
          icon: TrendingUp,
        };
      case 'savings-portfolio':
        return {
          bg: 'bg-violet-50',
          text: 'text-violet-900',
          border: 'border-violet-200',
          icon: PiggyBank,
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-800',
          border: 'border-slate-200',
          icon: Layers,
        };
    }
  };

  const HEAD_SCOPE_LIST = [
    {
      id: 'all' as AccountFilter,
      labelBn: 'সকল হেড (All)',
      labelEn: 'All Accounts',
      icon: Sparkles,
      activeGradient: 'from-slate-900 via-indigo-950 to-slate-900 shadow-indigo-900/30',
      idleBg: 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-slate-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-slate-200 text-slate-700',
      count: unifiedData.length,
    },
    {
      id: 'bd-bank' as AccountFilter,
      labelBn: 'বাংলাদেশ ব্যাংকিং',
      labelEn: 'BD Banking',
      icon: Landmark,
      activeGradient: 'from-emerald-600 via-teal-700 to-emerald-800 shadow-emerald-600/30',
      idleBg: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-emerald-200/70 text-emerald-900',
      count: unifiedData.filter((r) => r.section === 'bd-bank').length,
    },
    {
      id: 'boss-salary' as AccountFilter,
      labelBn: 'শাকের ভাই এর বেতন ও খরচ',
      labelEn: 'Shaker Bhai Salary',
      icon: Briefcase,
      activeGradient: 'from-amber-500 via-orange-600 to-amber-700 shadow-amber-500/30',
      idleBg: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-amber-200/70 text-amber-950',
      count: unifiedData.filter((r) => r.section === 'boss-salary').length,
    },
    {
      id: 'kuwait-personal' as AccountFilter,
      labelBn: 'কুয়েত পার্সোনাল — দৈনিক খরচ',
      labelEn: 'Kuwait Daily Living',
      icon: Wallet,
      activeGradient: 'from-rose-500 via-pink-600 to-rose-700 shadow-rose-500/30',
      idleBg: 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-rose-200/70 text-rose-950',
      count: unifiedData.filter((r) => r.section === 'kuwait-personal').length,
    },
    {
      id: 'kuwait-loan' as AccountFilter,
      labelBn: 'Personal Receivable Loan (পাওনা)',
      labelEn: 'Receivable Loan',
      icon: HandCoins,
      activeGradient: 'from-blue-600 via-indigo-700 to-blue-800 shadow-blue-600/30',
      idleBg: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-blue-200/70 text-blue-950',
      count: unifiedData.filter((r) => r.section === 'kuwait-loan').length,
    },
    {
      id: 'kuwait-payable' as AccountFilter,
      labelBn: 'Personal Payable Loan (দেনা)',
      labelEn: 'Payable Loan',
      icon: CreditCard,
      activeGradient: 'from-purple-600 via-pink-600 to-purple-800 shadow-purple-600/30',
      idleBg: 'bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-purple-200/70 text-purple-950',
      count: unifiedData.filter((r) => r.section === 'kuwait-payable').length,
    },
    {
      id: 'emdad-expense' as AccountFilter,
      labelBn: 'ইমদাদ ভাই এর হিসাব',
      labelEn: 'Emdad Bhai',
      icon: UserCheck,
      activeGradient: 'from-orange-500 via-amber-600 to-orange-700 shadow-orange-500/30',
      idleBg: 'bg-orange-50 text-orange-900 hover:bg-orange-100 border-orange-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-orange-200/70 text-orange-950',
      count: unifiedData.filter((r) => r.section === 'emdad-expense').length,
    },
    {
      id: 'kuwait-extra-income' as AccountFilter,
      labelBn: 'কুয়েত অতিরিক্ত আয়',
      labelEn: 'Extra Income',
      icon: TrendingUp,
      activeGradient: 'from-cyan-600 via-sky-700 to-blue-800 shadow-cyan-600/30',
      idleBg: 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100 border-cyan-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-cyan-200/70 text-cyan-950',
      count: unifiedData.filter((r) => r.section === 'kuwait-extra-income').length,
    },
    {
      id: 'savings-portfolio' as AccountFilter,
      labelBn: 'ডিপিএস ও ইন্সুরেন্স',
      labelEn: 'DPS & Insurance',
      icon: PiggyBank,
      activeGradient: 'from-violet-600 via-purple-700 to-indigo-900 shadow-violet-600/30',
      idleBg: 'bg-violet-50 text-violet-800 hover:bg-violet-100 border-violet-200',
      badgeActive: 'bg-white/20 text-white',
      badgeIdle: 'bg-violet-200/70 text-violet-950',
      count: (data.savingsAccounts || []).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === 'bn' ? 'আর্থিক রিপোর্ট ও অডিট অ্যানালিটিক্স' : 'Financial Reports & Audit Analytics'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>
                {startDate && endDate
                  ? `${formatDate(startDate, lang)} — ${formatDate(endDate, lang)}`
                  : lang === 'bn' ? 'সম্পূর্ণ সময়কাল' : 'All Time'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700">
                {filteredRows.length} {lang === 'bn' ? 'টি লেনদেন খতিয়ান' : 'ledger records'}
              </span>
              {activeFiltersCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-600 font-medium">
                    {activeFiltersCount} {lang === 'bn' ? 'টি ফিল্টার সক্রিয়' : 'filters active'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
              title={lang === 'bn' ? 'সরাসরি প্রিন্ট বা PDF সেভ করুন' : 'Print or Save as PDF'}
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / Save PDF'}</span>
            </button>

            <button
              onClick={handleExportFullCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'এক্সেল ডাউনলোড' : 'Export CSV'}</span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
                title={lang === 'bn' ? 'সকল ফিল্টার রিসেট' : 'Reset filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'সব রিপোর্ট ও খতিয়ান' : 'All Ledger Records'}
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'সার্বিক বিশ্লেষণ (Analytics)' : 'Visual Analytics'}
            </button>
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unpaid'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{lang === 'bn' ? 'বকেয়া ও লোন পর্যবেক্ষণ' : 'Unpaid & Loans'}</span>
              {totals.pendingBillsCount > 0 && (
                <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded-full font-bold">
                  {totals.pendingBillsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={lang === 'bn' ? 'খাত, নোট, ভাউচার দিয়ে খুঁজুন...' : 'Search records...'}
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Structured Filter Panel (Clean, Uncluttered, Functional) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 no-print">
        {/* Account Scope Segmented Pills */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            {lang === 'bn' ? 'অ্যাকাউন্ট / হেড নির্বাচন (Account Scope)' : 'Account Scope'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {HEAD_SCOPE_LIST.map((acc) => {
              const isActive = accountFilter === acc.id;
              const Icon = acc.icon;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setAccountFilter(acc.id);
                    setCategoryFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    isActive
                      ? `bg-linear-to-r ${acc.activeGradient} border-transparent scale-[1.02]`
                      : `${acc.idleBg} hover:scale-[1.01]`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                  <span>{lang === 'bn' ? acc.labelBn : acc.labelEn}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                      isActive ? acc.badgeActive : acc.badgeIdle
                    }`}
                  >
                    {acc.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Presets and Custom Range */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'bn' ? 'সময়কাল:' : 'Period:'}</span>
            </span>
            {[
              { id: 'this-month', labelBn: 'চলতি মাস', labelEn: 'This Month' },
              { id: 'last-month', labelBn: 'গত মাস', labelEn: 'Last Month' },
              { id: 'last-30', labelBn: 'শেষ ৩০ দিন', labelEn: 'Last 30 Days' },
              { id: 'all', labelBn: 'সম্পূর্ণ সময়', labelEn: 'All Time' },
              { id: 'custom', labelBn: 'নির্দিষ্ট তারিখ (Custom)', labelEn: 'Custom Range' },
            ].map((p) => {
              const isSelected = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {lang === 'bn' ? p.labelBn : p.labelEn}
                </button>
              );
            })}
          </div>

          {/* Random Date Pickers: অমুক তারিখ থেকে তমুক তারিখ */}
          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-indigo-900">
                  {lang === 'bn' ? 'শুরু:' : 'From:'}
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs border border-indigo-200 rounded-lg bg-white font-medium text-slate-800"
                />
              </div>
              <span className="text-indigo-400 font-bold">—</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-indigo-900">
                  {lang === 'bn' ? 'শেষ:' : 'To:'}
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs border border-indigo-200 rounded-lg bg-white font-medium text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Secondary Detailed Filters (Collapsible / Clean Bar) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ক্যাটাগরি, ধরণ ও স্ট্যাটাস ফিল্টার' : 'Detailed Field Filters'}</span>
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {activeFiltersCount > 0 && (
              <span className="text-[11px] text-slate-500 font-medium">
                {lang === 'bn' ? `মোট ${filteredRows.length}টি রেকর্ড পাওয়া গেছে` : `${filteredRows.length} records found`}
              </span>
            )}
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-2 border-t border-slate-100">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">{lang === 'bn' ? 'সকল খাত (All)' : 'All Categories'}</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.nameBn : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'লেনদেনের ধরণ' : 'Transaction Type'}
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as TypeFilter);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">{lang === 'bn' ? 'সকল ধরণ (All)' : 'All Types'}</option>
                  <option value="income">{lang === 'bn' ? 'আয় / জমা' : 'Income'}</option>
                  <option value="expense">{lang === 'bn' ? 'ব্যয় / খরচ' : 'Expense'}</option>
                  <option value="transfer">{lang === 'bn' ? 'ফান্ড ট্রান্সফার' : 'Transfer'}</option>
                  <option value="loan">{lang === 'bn' ? 'দিনার লোন প্রদান' : 'Loan Given'}</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'পরিশোধ স্ট্যাটাস' : 'Payment Status'}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">{lang === 'bn' ? 'সকল স্ট্যাটাস (All)' : 'All Status'}</option>
                  <option value="unpaid">{lang === 'bn' ? 'বাকি / অপরিশোধিত (Unpaid)' : 'Unpaid'}</option>
                  <option value="paid">{lang === 'bn' ? 'পরিশোধিত / আদায় সম্পন্ন (Paid)' : 'Paid'}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Dedicated Cute & Colorful Head Showcase Banner */}
      {accountFilter === 'bd-bank' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 via-teal-700 to-emerald-900 text-white p-5 md:p-6 shadow-lg border border-emerald-500/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <Landmark className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'বাংলাদেশ ব্যাংকিং হেড খতিয়ান' : 'BD Banking Head Ledger'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'বাংলাদেশি ব্যাংকসমূহের আয়-ব্যয় ও স্থিতি' : 'Bangladesh Bank Inflow & Outflow'}
              </h2>
              <p className="text-xs text-emerald-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'ইসলামী ব্যাংক, ডাচ্-বাংলা ব্যাংক ও ব্র্যাক ব্যাংকের মোট রেমিট্যান্স জমা, পরিবারের খরচ উত্তোলন ও বর্তমান নেট ব্যালেন্স।'
                  : 'Total remittance inflow, family expense withdrawals, and total current balance.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  {lang === 'bn' ? 'মোট ব্যাংক জমা' : 'Total Inflow'}
                </span>
                <span className="font-mono text-base font-black text-emerald-300">
                  +{totals.bdtIncome.toLocaleString('en-US')} ৳
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-200 block">
                  {lang === 'bn' ? 'মোট ব্যাংক খরচ' : 'Total Outflow'}
                </span>
                <span className="font-mono text-base font-black text-rose-300">
                  -{totals.bdtExpense.toLocaleString('en-US')} ৳
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/90 block">
                  {lang === 'bn' ? 'বর্তমান মোট ব্যালেন্স' : 'Current Net Balance'}
                </span>
                <span className="font-mono text-lg font-black text-white">
                  {formatCurrency(totalBdBanksBal, 'BDT')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'boss-salary' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-500 via-orange-600 to-amber-700 text-white p-5 md:p-6 shadow-lg border border-amber-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-yellow-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'শাকের ভাই এর বেতন ও খরচ হেড' : 'Shaker Bhai Salary & Expenses'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'বসের বেতন ফান্ড ও সাইট খরচের অডিট' : 'Boss Salary & Expense Audit'}
              </h2>
              <p className="text-xs text-amber-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'বসের থেকে নগদ গৃহীত ফান্ড, সাইটের মালামাল ও দৈনিক খরচের ভাউচার এবং অবশিষ্ট হাতে থাকা নগদ ক্যাশ।'
                  : 'Total received salary fund, daily expenses, and net cash in hand.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">
                  {lang === 'bn' ? 'মোট প্রাপ্ত বেতন' : 'Received Fund'}
                </span>
                <span className="font-mono text-base font-black text-white">
                  +{bossTotals.totalDeposited.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-200 block">
                  {lang === 'bn' ? 'মোট সাইট খরচ' : 'Spent Expenses'}
                </span>
                <span className="font-mono text-base font-black text-rose-200">
                  -{bossTotals.totalExpenses.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-white/25 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-100 block">
                  {lang === 'bn' ? 'নগদ ক্যাশ ইন হ্যান্ড' : 'Cash in Hand'}
                </span>
                <span className="font-mono text-xl font-black text-yellow-300">
                  {bossTotals.remainingBalance.toFixed(3)} KD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'kuwait-personal' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-rose-500 via-pink-600 to-rose-700 text-white p-5 md:p-6 shadow-lg border border-rose-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-pink-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <Wallet className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'কুয়েত পার্সোনাল হেড' : 'Kuwait Living Expenses'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'কুয়েতে দৈনন্দিন ব্যক্তিগত জীবনযাত্রার খরচ' : 'Daily Living Expenses (KWD)'}
              </h2>
              <p className="text-xs text-rose-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'খাবার, মুদি বাজার, মোবাইল রিচার্জ, যাতায়াত ট্যাক্সি ও ব্যক্তিগত খরচের বিস্তারিত তালিকা।'
                  : 'Food, groceries, transport, mobile recharge, and personal expenses in Kuwait.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-200 block">
                  {lang === 'bn' ? 'ফিল্টারকৃত মোট খরচ' : 'Total Spent'}
                </span>
                <span className="font-mono text-xl font-black text-white">
                  -{totals.kwdExpense.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-xl px-4 py-2.5 min-w-[120px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-pink-100 block">
                  {lang === 'bn' ? 'খরচের সংখ্যা' : 'Transactions'}
                </span>
                <span className="font-mono text-lg font-black text-white">
                  {filteredRows.length} {lang === 'bn' ? 'টি' : 'items'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'kuwait-loan' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-700 to-blue-900 text-white p-5 md:p-6 shadow-lg border border-blue-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <HandCoins className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'Personal Receivable Loan হেড' : 'Personal Receivable Loan'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'ব্যক্তিগত পাওনা লোন ও কিস্তি আদায় খতিয়ান' : 'Receivable Loans & Collections'}
              </h2>
              <p className="text-xs text-blue-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'ব্যক্তিগত প্রয়োজনে যাদের দিনার লোন দিয়েছেন, তাদের আংশিক ও মোট ফেরত আদায়ের সম্পূর্ণ স্টেটমেন্ট।'
                  : 'Borrowers you lent KWD to, partial/full repayments, and remaining outstanding amounts.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  {lang === 'bn' ? 'মোট লোন প্রদান' : 'Total Lent'}
                </span>
                <span className="font-mono text-base font-black text-white">
                  {recTotals.totalLent.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  {lang === 'bn' ? 'মোট আদায়কৃত ফেরত' : 'Total Collected'}
                </span>
                <span className="font-mono text-base font-black text-emerald-300">
                  +{recTotals.totalCollected.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-white/25 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-200 block">
                  {lang === 'bn' ? 'অবশিষ্ট বকেয়া পাওনা' : 'Remaining Due'}
                </span>
                <span className="font-mono text-lg font-black text-yellow-300">
                  {recTotals.totalRemaining.toFixed(3)} KD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'kuwait-payable' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-purple-600 via-pink-700 to-indigo-950 text-white p-5 md:p-6 shadow-lg border border-purple-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-purple-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'Personal Payable Loan হেড' : 'Personal Payable Loan'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'ব্যক্তিগত দেনা লোন ও পরিশোধ খতিয়ান' : 'Payable Loans & Repayments'}
              </h2>
              <p className="text-xs text-purple-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'কারোর কাছ থেকে ব্যক্তিগত প্রয়োজনে দিনার ধার নেওয়া এবং পরিশোধের পর অবশিষ্ট দেনার হিসাব।'
                  : 'KWD loans borrowed from lenders, repayments made, and outstanding payable debts.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200 block">
                  {lang === 'bn' ? 'মোট গৃহীত ঋণ' : 'Total Borrowed'}
                </span>
                <span className="font-mono text-base font-black text-white">
                  {payTotals.totalBorrowed.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  {lang === 'bn' ? 'মোট পরিশোধিত' : 'Total Repaid'}
                </span>
                <span className="font-mono text-base font-black text-emerald-300">
                  -{payTotals.totalRepaid.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-white/25 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-pink-200 block">
                  {lang === 'bn' ? 'অবশিষ্ট পরিশোধযোগ্য দেনা' : 'Remaining Debt'}
                </span>
                <span className="font-mono text-lg font-black text-rose-200">
                  {payTotals.totalRemaining.toFixed(3)} KD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'emdad-expense' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-orange-500 via-amber-600 to-orange-700 text-white p-5 md:p-6 shadow-lg border border-orange-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-orange-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-orange-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ইমদাদ ভাই এর হিসাব হেড' : 'Emdad Bhai Ledger'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'ইমদাদ ভাই এর জন্য সম্পন্ন খরচের অডিট' : 'Emdad Bhai Expenses & Dues'}
              </h2>
              <p className="text-xs text-orange-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'ইমদাদ ভাই এর জন্য কেনা মুদি সামগ্রী, চিকিৎসা, ওষুধ ও কাজের খরচের পরিশোধিত ও বাকি হিসাব।'
                  : 'Groceries, medicines, and living expenses for Emdad bhai with paid vs unpaid status.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-200 block">
                  {lang === 'bn' ? 'মোট সম্পন্ন খরচ' : 'Total Spent'}
                </span>
                <span className="font-mono text-base font-black text-white">
                  -{emdadTotals.totalSpent.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                  {lang === 'bn' ? 'পরিশোধিত বিল' : 'Paid Bills'}
                </span>
                <span className="font-mono text-base font-black text-emerald-300">
                  {emdadTotals.totalPaid.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-white/25 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-200 block">
                  {lang === 'bn' ? 'বকেয়া বিল (Unpaid)' : 'Unpaid Bills'}
                </span>
                <span className="font-mono text-lg font-black text-yellow-300">
                  {emdadTotals.totalUnpaid.toFixed(3)} KD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'kuwait-extra-income' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-cyan-600 via-sky-700 to-blue-800 text-white p-5 md:p-6 shadow-lg border border-cyan-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-cyan-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-cyan-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'কুয়েত অতিরিক্ত আয় হেড' : 'Extra Income Stream'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'কুয়েতে ব্যক্তিগত কাজের উপার্জিত অতিরিক্ত আয়' : 'Kuwait Extra Income Stream'}
              </h2>
              <p className="text-xs text-cyan-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'ওভারটাইম, ছুটির দিনের টেকনিক্যাল কাজ ও ব্যক্তিগত সার্ভিস থেকে উপার্জিত দিনার।'
                  : 'Overtime, weekend works, and freelance technical earnings in Kuwait.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-200 block">
                  {lang === 'bn' ? 'মোট অতিরিক্ত আয়' : 'Total Income'}
                </span>
                <span className="font-mono text-xl font-black text-white">
                  +{kwtExtraTotals.totalIncome.toFixed(3)} KD
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-xl px-4 py-2.5 min-w-[120px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-100 block">
                  {lang === 'bn' ? 'কাজের সংখ্যা' : 'Works Count'}
                </span>
                <span className="font-mono text-lg font-black text-white">
                  {kwtExtraTotals.count} {lang === 'bn' ? 'টি' : 'entries'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'savings-portfolio' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-600 via-purple-700 to-indigo-900 text-white p-5 md:p-6 shadow-lg border border-violet-400/30 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-violet-100 text-xs font-bold border border-white/20 backdrop-blur-md">
                <PiggyBank className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ডিপিএস ও ইন্সুরেন্স হেড' : 'DPS & Savings Portfolio'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'ডিপিএস ও লাইফ ইন্স্যুরেন্স সঞ্চয় পোর্টফোলিও' : 'DPS & Life Insurance Portfolio'}
              </h2>
              <p className="text-xs text-violet-100/90 max-w-xl">
                {lang === 'bn'
                  ? 'মার্কেন্টাইল ব্যাংক ডিপিএস ১ ও ২ এবং মেটলাইফ জীবন বীমার সঞ্চিত মোট ব্যালেন্স ও কিস্তির হিসাব।'
                  : 'Total accumulated balance across Mercantile Bank DPS 1 & 2 and MetLife life insurance.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-200 block">
                  {lang === 'bn' ? 'মোট ডিপিএস জমা' : 'Total DPS'}
                </span>
                <span className="font-mono text-base font-black text-white">
                  {formatCurrency(totalDpsBal, 'BDT')}
                </span>
              </div>
              <div className="bg-black/25 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 min-w-[130px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-pink-200 block">
                  {lang === 'bn' ? 'মোট ইন্সুরেন্স জমা' : 'Total Insurance'}
                </span>
                <span className="font-mono text-base font-black text-pink-200">
                  {formatCurrency(totalInsBal, 'BDT')}
                </span>
              </div>
              <div className="bg-white/25 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white block">
                  {lang === 'bn' ? 'সর্বমোট সঞ্চয়' : 'Total Savings'}
                </span>
                <span className="font-mono text-lg font-black text-yellow-300">
                  {formatCurrency(totalDpsBal + totalInsBal, 'BDT')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {accountFilter === 'all' && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 shadow-lg border border-slate-700/60 animate-fade-in no-print">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'সকল আর্থিক হেডের সার্বিক অডিট' : 'Master Multi-Head Audit'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'সমন্বিত লেজার ও ট্রানজেকশন খতিয়ান' : 'Consolidated Ledger Records'}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                {lang === 'bn'
                  ? 'বাংলাদেশ ব্যাংক, শাকের ভাই বেতন ফান্ড, কুয়েত ব্যক্তিগত খরচ, পাওনা ও দেনা লোনের সমন্বিত বিবরণী।'
                  : 'Combined audit view across all accounts, deposits, expenses, and loans.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  {lang === 'bn' ? 'বিডি ব্যাংক নেট' : 'BD Banks Net'}
                </span>
                <span className={`font-mono text-base font-black ${totals.bdtNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totals.bdtNet >= 0 ? '+' : ''}{totals.bdtNet.toLocaleString('en-US')} ৳
                </span>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-2.5 min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  {lang === 'bn' ? 'কুয়েত দিনার নেট' : 'Kuwait Dinar Net'}
                </span>
                <span className={`font-mono text-base font-black ${totals.kwdNet >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totals.kwdNet >= 0 ? '+' : ''}{totals.kwdNet.toFixed(3)} KD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics: Proportional Horizontal Distribution Bar (Only in Overview Mode) */}
      {activeTab === 'overview' && categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs no-print space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'bn' ? 'খাতভিত্তিক ব্যয়ের আনুপাতিক বিশ্লেষণ' : 'Expense & Inflow Distribution'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn'
                  ? 'কোন খাতে কত অর্থ ব্যয় হয়েছে তার পরিষ্কার তালিকা ও শতাংশ'
                  : 'Breakdown of fund flow across distinct financial categories'}
              </p>
            </div>
          </div>

          {/* Proportional Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.slice(0, 9).map((cat, idx) => {
              const maxTotal = categoryBreakdown[0]?.total || 1;
              const barPercent = Math.min(100, Math.max(12, (cat.total / maxTotal) * 100));

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={cat.nameBn}>
                        {lang === 'bn' ? cat.nameBn : cat.nameEn}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className={cat.type === 'income' ? 'text-emerald-700 font-medium' : 'text-slate-600 font-medium'}>
                          {cat.type === 'income' ? (lang === 'bn' ? 'আয়' : 'Inflow') : (lang === 'bn' ? 'ব্যয়' : 'Outflow')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{cat.count}টি এন্ট্রি</span>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold text-xs ${
                        cat.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {cat.currency === 'KWD' ? `${cat.total.toFixed(3)} KD` : `${cat.total.toLocaleString('en-US')} ৳`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cat.type === 'income' ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Detailed Audit Ledger Table (Modern, Anti-Slop, High-Fidelity) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden no-print">
        {/* Table Title and Pagination Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'bn' ? 'ফিল্টারকৃত লেনদেন অডিট খতিয়ান' : 'Filtered Transaction Audit Ledger'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'যেকোনো রো-তে ক্লিক করে বিস্তারিত অডিট স্লিপ দেখতে পারেন'
                : 'Click any row to open the complete audit voucher'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              title={lang === 'bn' ? 'এই ফিল্টার করা খতিয়ানটি সরাসরি প্রিন্ট বা PDF ডাউনলোড করুন' : 'Print or Save PDF'}
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>{lang === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Save PDF'}</span>
            </button>

            <span className="text-xs text-slate-500">
              {lang === 'bn'
                ? `পৃষ্ঠা ${currentPage} / ${totalPages} (${filteredRows.length}টি এন্ট্রি)`
                : `Page ${currentPage} of ${totalPages} (${filteredRows.length} entries)`}
            </span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value={15}>15 {lang === 'bn' ? 'টি' : 'rows'}</option>
              <option value={25}>25 {lang === 'bn' ? 'টি' : 'rows'}</option>
              <option value={50}>50 {lang === 'bn' ? 'টি' : 'rows'}</option>
              <option value={100}>100 {lang === 'bn' ? 'টি' : 'rows'}</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{lang === 'bn' ? 'তারিখ' : 'Date'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'bn' ? 'অ্যাকাউন্ট / হেড' : 'Account/Head'}</th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'bn' ? 'ধরণ' : 'Type'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'নোট / বিবরণ' : 'Note'}</th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3 px-4 text-right no-print whitespace-nowrap">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <Filter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">
                      {lang === 'bn' ? 'নির্বাচিত ফিল্টারে কোনো তথ্য পাওয়া যায়নি' : 'No records match your filters'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'bn' ? 'তারিখের রেঞ্জ অথবা অ্যাকাউন্ট ফিল্টার পরিবর্তন করে দেখুন' : 'Try adjusting your date range or filters'}
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset all filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isIncome = row.type === 'income';
                  const isExpense = row.type === 'expense';
                  const isLoan = row.type === 'loan';
                  const isTransfer = row.type === 'transfer';

                  return (
                    <tr
                      key={`${row.sourceType}-${row.id}`}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedAuditRow(row);
                        setIsVoucherModalOpen(true);
                      }}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {formatDate(row.date, lang)}
                      </td>

                      {/* Account / Head with Cute Pastel Pill */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const badge = getHeadBadgeConfig(row.section);
                          const BadgeIcon = badge.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${badge.bg} ${badge.text} ${badge.border}`}>
                              <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{lang === 'bn' ? row.sectionNameBn : row.sectionNameEn}</span>
                            </span>
                          );
                        })()}
                        {row.bankName && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            🏦 {row.bankName}
                          </span>
                        )}
                        {row.voucherNo && (
                          <span className="text-[10px] text-indigo-700 font-mono font-medium block">
                            #{row.voucherNo}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {lang === 'bn' ? row.categoryNameBn : row.categoryNameEn}
                        </span>
                        {row.borrowerName && (
                          <span className="text-[10px] text-indigo-700 font-semibold inline-block mt-0.5 px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 rounded-md">
                            {lang === 'bn' ? 'ব্যক্তি:' : 'Person:'} {row.borrowerName}
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {isIncome && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'bn' ? 'আয় / জমা' : 'Income'}</span>
                            </span>
                          )}
                          {isExpense && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                              <span>{lang === 'bn' ? 'ব্যয় / খরচ' : 'Expense'}</span>
                            </span>
                          )}
                          {isLoan && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <HandCoins className="w-3 h-3 text-indigo-600" />
                              <span>{lang === 'bn' ? 'দিনার লোন' : 'Loan'}</span>
                            </span>
                          )}
                          {isTransfer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                              <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                              <span>{lang === 'bn' ? 'ট্রান্সফার' : 'Transfer'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 max-w-xs text-slate-500 truncate" title={row.note}>
                        {row.note || <span className="text-slate-300 italic">—</span>}
                      </td>

                      {/* Amount with Cute Pill Highlight */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums font-bold text-sm">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono border shadow-2xs ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isExpense
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : isLoan
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {row.currency === 'KWD'
                            ? `${row.amount.toFixed(3)} KD`
                            : `${row.amount.toLocaleString('en-US')} ৳`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {row.status ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            {row.status === 'paid' ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                <span className="text-emerald-800">{lang === 'bn' ? 'Paid' : 'Paid'}</span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                                <span className="text-amber-800">{lang === 'bn' ? 'Unpaid' : 'Unpaid'}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap no-print"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Paid / Unpaid for Kuwait loans */}
                          {row.sourceType === 'kuwait-loan' && (
                            <button
                              type="button"
                              onClick={() => toggleKuwaitLoanStatus(row.id)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                row.status === 'paid'
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                              }`}
                            >
                              {row.status === 'paid'
                                ? lang === 'bn' ? 'Unpaid করুন' : 'Mark Unpaid'
                                : lang === 'bn' ? 'Paid করুন' : 'Mark Paid'}
                            </button>
                          )}

                          {/* Toggle Paid / Unpaid for Emdad expense */}
                          {row.sourceType === 'transaction' && row.section === 'emdad-expense' && (
                            <button
                              type="button"
                              onClick={() => togglePaymentStatus(row.id)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                row.status === 'paid'
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                              }`}
                            >
                              {row.status === 'paid'
                                ? lang === 'bn' ? 'Unpaid করুন' : 'Mark Unpaid'
                                : lang === 'bn' ? 'Paid করুন' : 'Mark Paid'}
                            </button>
                          )}

                          {/* View Audit Slip Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuditRow(row);
                              setIsVoucherModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title={lang === 'bn' ? 'অডিট স্লিপ দেখুন ও প্রিন্ট করুন' : 'View slip'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Transaction Button */}
                          <button
                            type="button"
                            onClick={() => setEditTarget({ id: row.id, sourceType: row.sourceType })}
                            className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title={lang === 'bn' ? 'সংশোধন / এডিট করুন' : 'Edit transaction'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between no-print">
            <span className="text-xs text-slate-500">
              {lang === 'bn'
                ? `দেখানো হচ্ছে: ${(currentPage - 1) * pageSize + 1} থেকে ${Math.min(currentPage * pageSize, filteredRows.length)} (মোট ${filteredRows.length}টি)`
                : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredRows.length)} of ${filteredRows.length}`}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                {lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
              </button>
              <span className="px-2 text-xs font-mono font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                {lang === 'bn' ? 'পরবর্তী' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Official Printable Document (Exclusively rendered during Print / PDF generation) */}
      <div className="hidden print:block space-y-6 text-slate-900 bg-white p-2">
        {/* Official Header & Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-lg">
                ৳
              </div>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                  {lang === 'bn' ? 'হিসাব কিতাব — অফিসিয়াল লেনদেন অডিট ও খতিয়ান রিপোর্ট' : 'Financial Statement & Audit Ledger Report'}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {lang === 'bn' ? 'ব্যক্তিগত ও কর্মক্ষেত্রের সম্পূর্ণ সমন্বিত হিসাব বিবরণী' : 'Official Financial & Audit Ledger Statement'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-700">
              <span><strong>{lang === 'bn' ? 'অ্যাকাউন্ট / হেড:' : 'Account:'}</strong> {accountFilter === 'all' ? (lang === 'bn' ? 'সকল হেড (All)' : 'All Accounts') : accountFilter}</span>
              <span aria-hidden="true">·</span>
              <span><strong>{lang === 'bn' ? 'সময়কাল:' : 'Period:'}</strong> {startDate && endDate ? `${formatDate(startDate, lang)} — ${formatDate(endDate, lang)}` : (lang === 'bn' ? 'সম্পূর্ণ সময়কাল' : 'All Time')}</span>
              <span aria-hidden="true">·</span>
              <span><strong>{lang === 'bn' ? 'মোট লেনদেন সংখ্যা:' : 'Total Records:'}</strong> {filteredRows.length} {lang === 'bn' ? 'টি' : ''}</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-700">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold uppercase tracking-wider text-[10px] mb-1">
              Verified Audit Statement
            </span>
            <p className="font-mono text-[11px]">প্রিন্ট তারিখ: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="font-mono text-[10px] text-slate-500">সময়: {new Date().toLocaleTimeString('en-US')}</p>
          </div>
        </div>

        {/* Printable Summary Totals Bar */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase block">
              {lang === 'bn' ? 'মোট প্রাপ্তি / জমা (Inflow)' : 'Total Inflow'}
            </span>
            <span className="font-mono font-bold text-sm text-emerald-800 mt-0.5 block">
              {totals.bdtIncome > 0 ? `+${totals.bdtIncome.toLocaleString('en-US')} ৳ ` : ''}
              {totals.kwdIncome > 0 ? `+${totals.kwdIncome.toFixed(3)} KD` : ''}
              {totals.bdtIncome === 0 && totals.kwdIncome === 0 ? '0.00' : ''}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase block">
              {lang === 'bn' ? 'মোট খরচ / ব্যয় (Outflow)' : 'Total Outflow'}
            </span>
            <span className="font-mono font-bold text-sm text-rose-800 mt-0.5 block">
              {totals.bdtExpense > 0 ? `-${totals.bdtExpense.toLocaleString('en-US')} ৳ ` : ''}
              {totals.kwdExpense > 0 ? `-${totals.kwdExpense.toFixed(3)} KD` : ''}
              {totals.bdtExpense === 0 && totals.kwdExpense === 0 ? '0.00' : ''}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase block">
              {lang === 'bn' ? 'নিট উদ্বৃত্ত / সঞ্চয় (Net)' : 'Net Balance'}
            </span>
            <span className="font-mono font-bold text-sm text-slate-900 mt-0.5 block">
              {totals.bdtNet !== 0 ? `${totals.bdtNet >= 0 ? '+' : ''}${totals.bdtNet.toLocaleString('en-US')} ৳ ` : ''}
              {totals.kwdNet !== 0 ? `${totals.kwdNet >= 0 ? '+' : ''}${totals.kwdNet.toFixed(3)} KD` : ''}
              {totals.bdtNet === 0 && totals.kwdNet === 0 ? '0.00' : ''}
            </span>
          </div>
        </div>

        {/* Complete Unpaginated Table for Print (ALL filteredRows) */}
        <div className="overflow-hidden border border-slate-300 rounded">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2 px-2.5 border-r border-slate-300 text-center w-10">SL</th>
                <th className="py-2 px-2.5 border-r border-slate-300 whitespace-nowrap">তারিখ</th>
                <th className="py-2 px-2.5 border-r border-slate-300">অ্যাকাউন্ট / হেড</th>
                <th className="py-2 px-2.5 border-r border-slate-300">খাত / বিবরণ</th>
                <th className="py-2 px-2.5 border-r border-slate-300 whitespace-nowrap">ধরণ</th>
                <th className="py-2 px-2.5 border-r border-slate-300 text-right whitespace-nowrap">পরিমাণ</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRows.map((row, idx) => (
                <tr key={`print-row-${row.id}-${idx}`} className="break-inside-avoid">
                  <td className="py-1.5 px-2.5 font-mono text-slate-500 border-r border-slate-200 text-center">{idx + 1}</td>
                  <td className="py-1.5 px-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">{row.date}</td>
                  <td className="py-1.5 px-2.5 font-semibold text-slate-900 border-r border-slate-200">
                    {lang === 'bn' ? row.sectionNameBn : row.sectionNameEn}
                    {row.bankName && <span className="block text-[9px] text-slate-500 font-normal">{row.bankName}</span>}
                    {row.voucherNo && <span className="block text-[9px] text-indigo-700 font-mono">#{row.voucherNo}</span>}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200">
                    <span className="font-bold text-slate-900">{lang === 'bn' ? row.categoryNameBn : row.categoryNameEn}</span>
                    {row.borrowerName && <span className="block text-[10px] text-indigo-800">গ্রহীতা: {row.borrowerName}</span>}
                    {row.note && <span className="block text-[10px] text-slate-500 italic">{row.note}</span>}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold uppercase text-[10px] whitespace-nowrap">
                    {row.type === 'income' ? 'আয় / জমা' : row.type === 'expense' ? 'ব্যয় / খরচ' : row.type === 'loan' ? 'দিনার লোন' : 'ট্রান্সফার'}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                    {row.type === 'income' ? '+' : row.type === 'expense' ? '-' : ''}
                    {row.currency === 'KWD' ? `${row.amount.toFixed(3)} KD` : `${row.amount.toLocaleString('en-US')} ৳`}
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-bold text-[10px] whitespace-nowrap">
                    {row.status ? (
                      <span className={row.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}>
                        {row.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Signatures & Verification */}
        <div className="pt-8 flex justify-between items-center text-xs text-slate-600 break-inside-avoid">
          <div className="text-center">
            <div className="border-t border-slate-400 w-44 pt-1 font-semibold">হিসাব প্রস্তুতকারকের স্বাক্ষর</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 w-44 pt-1 font-semibold">অনুমোদনকারী / পরিচালক</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* 7. Transaction Audit Voucher Slip Modal */}
      <ReportAuditVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        row={selectedAuditRow}
        lang={lang}
        onEdit={(r) => setEditTarget({ id: r.id, sourceType: r.sourceType })}
      />

      {/* 8. Universal Transaction Edit Modal */}
      <UniversalTransactionEditModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        target={editTarget}
      />
    </div>
  );
};
