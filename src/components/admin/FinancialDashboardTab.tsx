import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CreditCard,
  Send,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { User, Invoice, FeePayment, Branch, InvoiceFeeItem } from '../../types';
import { db } from '../../services/db';
import { exportFinancialsToCSV } from '../../utils/exportCsv';

interface FinancialDashboardTabProps {
  currentUser: User;
  onRecordPayment?: (invoice: Invoice) => void;
  onTriggerReminder?: (invoice: Invoice) => void;
}

export const FinancialDashboardTab: React.FC<FinancialDashboardTabProps> = ({
  currentUser,
  onRecordPayment,
  onTriggerReminder,
}) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';
  const allBranches = db.getBranches();

  // Role-Based Access Control: Branch admin is scoped
  const isBranchAdmin =
    (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'BRANCH_ADMIN') &&
    Boolean(currentUser.branchId) &&
    currentUser.scope !== 'ALL_SCHOOL' &&
    currentUser.scope !== 'FINANCE_ONLY';

  const userAssignedBranch = allBranches.find(b => b.id === currentUser.branchId);

  // Available branches for current user
  const accessibleBranches = isBranchAdmin && userAssignedBranch
    ? [userAssignedBranch]
    : allBranches;

  // Filter States
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2025/2026');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isBranchAdmin && currentUser.branchId ? currentUser.branchId : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE'>('ALL');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Load Invoices & Payments with RBAC
  const rawInvoices = db.getInvoices(currentUser);
  const rawPayments = db.getPayments(currentUser);

  // Filter Invoices by Term, Year, and Branch
  const currentTermInvoices = useMemo(() => {
    return rawInvoices.filter(inv => {
      const matchTerm = selectedTerm === 'ALL' || inv.term === selectedTerm;
      const matchYear = selectedAcademicYear === 'ALL' || inv.academicYear === selectedAcademicYear;
      const matchBranch = selectedBranchId === 'ALL' || inv.branchId === selectedBranchId;
      return matchTerm && matchYear && matchBranch;
    });
  }, [rawInvoices, selectedTerm, selectedAcademicYear, selectedBranchId]);

  // Overall Financial Aggregates for current selection
  const totalBilled = useMemo(() => {
    return currentTermInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [currentTermInvoices]);

  const totalCollected = useMemo(() => {
    return currentTermInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  }, [currentTermInvoices]);

  const totalPending = useMemo(() => {
    return Math.max(0, totalBilled - totalCollected);
  }, [totalBilled, totalCollected]);

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Status Counts
  const countPaid = currentTermInvoices.filter(i => i.status === 'PAID' || i.balance === 0).length;
  const countPartial = currentTermInvoices.filter(i => i.status === 'PARTIAL').length;
  const countPending = currentTermInvoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE' || (i.paidAmount === 0 && i.balance > 0)).length;
  const countOverdue = currentTermInvoices.filter(i => i.status === 'OVERDUE' || (i.balance > 0 && new Date(i.dueDate).getTime() < Date.now())).length;

  // 1. Branch Summary Data for Recharts Bar Chart (Collected vs Pending across branches)
  const branchChartData = useMemo(() => {
    return accessibleBranches.map(branch => {
      const branchInvs = rawInvoices.filter(inv => {
        const matchBranch = inv.branchId === branch.id;
        const matchTerm = selectedTerm === 'ALL' || inv.term === selectedTerm;
        const matchYear = selectedAcademicYear === 'ALL' || inv.academicYear === selectedAcademicYear;
        return matchBranch && matchTerm && matchYear;
      });

      const billed = branchInvs.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
      const collected = branchInvs.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
      const pending = Math.max(0, billed - collected);
      const rate = billed > 0 ? Math.round((collected / billed) * 100) : 0;
      const cleanName = branch.name.includes('Bungalow')
        ? 'Bungalow Campus'
        : branch.name.includes('Ijegun')
        ? 'Ijegun Campus'
        : branch.name;

      const shortName = branch.name.includes('Bungalow')
        ? 'Bungalow'
        : branch.name.includes('Ijegun')
        ? 'Ijegun'
        : branch.code || branch.name;

      return {
        branchId: branch.id,
        name: cleanName,
        shortName,
        collected,
        pending,
        billed,
        rate,
        studentCount: branchInvs.length,
      };
    });
  }, [accessibleBranches, rawInvoices, selectedTerm, selectedAcademicYear]);

  // 2. Fee Item Category Breakdown Data for Recharts
  const categoryChartData = useMemo(() => {
    const catMap: Record<string, { name: string; billed: number; collected: number; pending: number }> = {};

    currentTermInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        let cat = 'Other Fees';
        const titleLower = item.title.toLowerCase();
        if (titleLower.includes('tuition')) cat = 'Tuition Fees';
        else if (titleLower.includes('stem') || titleLower.includes('robotics') || titleLower.includes('science') || titleLower.includes('lab')) cat = 'STEM & Lab Levies';
        else if (titleLower.includes('pta') || titleLower.includes('sports')) cat = 'PTA & Sports';
        else if (titleLower.includes('book') || titleLower.includes('kit') || titleLower.includes('activity')) cat = 'Books & Kits';
        else if (titleLower.includes('ict') || titleLower.includes('library') || titleLower.includes('tech')) cat = 'ICT & Workshops';

        if (!catMap[cat]) {
          catMap[cat] = { name: cat, billed: 0, collected: 0, pending: 0 };
        }
        const itemAmount = Number(item.amount) || 0;
        const itemPaid = Number(item.paidAmount) || 0;
        const itemBal = Math.max(0, itemAmount - itemPaid);

        catMap[cat].billed += itemAmount;
        catMap[cat].collected += itemPaid;
        catMap[cat].pending += itemBal;
      });
    });

    return Object.values(catMap).sort((a, b) => b.billed - a.billed);
  }, [currentTermInvoices]);

  // Filtered Student Invoices for the Ledger view
  const filteredLedgerInvoices = useMemo(() => {
    return currentTermInvoices.filter(inv => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.studentName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.className.toLowerCase().includes(q) ||
        inv.parentName.toLowerCase().includes(q);

      // Status
      let matchStatus = true;
      if (statusFilter === 'PAID') {
        matchStatus = inv.status === 'PAID' || inv.balance === 0;
      } else if (statusFilter === 'PARTIAL') {
        matchStatus = inv.status === 'PARTIAL' && inv.balance > 0;
      } else if (statusFilter === 'PENDING') {
        matchStatus = (inv.status === 'UNPAID' || inv.status === 'OVERDUE') && inv.paidAmount === 0;
      } else if (statusFilter === 'OVERDUE') {
        matchStatus = inv.status === 'OVERDUE' || (inv.balance > 0 && new Date(inv.dueDate).getTime() < Date.now());
      }

      return matchSearch && matchStatus;
    });
  }, [currentTermInvoices, searchQuery, statusFilter]);

  const toggleExpandInvoice = (invId: string) => {
    setExpandedInvoiceId(prev => (prev === invId ? null : invId));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="admin-financial-dashboard">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-indigo-900/50">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Multi-Branch Financial Analytics</span>
            </span>
            {isBranchAdmin && userAssignedBranch && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Restricted to: {userAssignedBranch.name}</span>
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Session {selectedAcademicYear} • {selectedTerm}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Institutional Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time analytics for collected vs pending fees, multi-campus billing ledgers, partial payment breakdowns, and automated parental settlement tracking.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportFinancialsToCSV(currentTermInvoices)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 shadow-xs flex items-center space-x-2 cursor-pointer"
            title="Download CSV report of current financial dataset"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/50 flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Term Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Term:</span>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
              <option value="ALL">All Terms</option>
            </select>
          </div>

          {/* Academic Session */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Session:</span>
            <select
              value={selectedAcademicYear}
              onChange={e => setSelectedAcademicYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="ALL">All Sessions</option>
            </select>
          </div>

          {/* Campus Branch Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Campus Branch:</span>
            <select
              value={selectedBranchId}
              disabled={isBranchAdmin}
              onChange={e => setSelectedBranchId(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                isBranchAdmin
                  ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {!isBranchAdmin && <option value="ALL">All Campus Branches (All-School)</option>}
              {accessibleBranches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name.includes('Bungalow') ? 'Bungalow Campus' : b.name.includes('Ijegun') ? 'Ijegun Campus' : b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Filter Indicator */}
        <div className="text-xs text-slate-500 flex items-center space-x-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Showing <strong>{currentTermInvoices.length}</strong> student invoice records</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed Fees</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {currency}{totalBilled.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {currentTermInvoices.length} student ledger accounts
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Fees Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {currency}{totalCollected.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {collectionRate}% Realized
              </span>
              <span className="text-[11px] text-slate-400">Target: 95%</span>
            </div>
          </div>
        </div>

        {/* Total Pending / Outstanding */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Pending Fees</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {currency}{totalPending.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {100 - collectionRate}% Outstanding
              </span>
              {countOverdue > 0 && (
                <span className="text-[10px] font-bold text-rose-600">
                  ({countOverdue} Overdue)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoices Status Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settlement Ratio</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fully Paid:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{countPaid}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-bold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Partial Payments:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{countPartial}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-700 font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pending / Unpaid:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{countPending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PRIMARY RECHARTS SUMMARY CHART */}
      {/* Collected versus Pending Fees for Current Term Across Branches */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100 mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Multi-Branch Comparison</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 font-display">
              Collected vs. Pending Fees by Campus Branch ({selectedTerm})
            </h2>
            <p className="text-xs text-slate-500">
              Comparative visualization of revenue collection performance and pending outstanding balances across all school campuses.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span className="text-slate-700 font-bold">Collected Fees</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500"></span>
              <span className="text-slate-700 font-bold">Pending Balance</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={branchChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barGap={12}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${currency}${(value / 1000).toLocaleString()}k`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[220px]">
                        <h4 className="font-bold text-sm text-indigo-300 border-b border-slate-700 pb-1">
                          {data.name}
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Billed:</span>
                            <span className="font-mono font-bold text-white">
                              {currency}{data.billed.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-400 font-bold">
                            <span>Collected:</span>
                            <span className="font-mono">
                              {currency}{data.collected.toLocaleString()} ({data.rate}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-amber-400 font-bold">
                            <span>Pending Balance:</span>
                            <span className="font-mono">
                              {currency}{data.pending.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                            <span>Active Invoices:</span>
                            <span className="font-mono text-white">{data.studentCount} Students</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px' }}
                formatter={(value) => (
                  <span className="text-xs font-bold text-slate-700">
                    {value === 'collected' ? 'Collected Fees' : 'Pending Fees'}
                  </span>
                )}
              />
              <Bar
                dataKey="collected"
                name="collected"
                fill="#10B981"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="pending"
                name="pending"
                fill="#F59E0B"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Summary Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {branchChartData.map(b => (
            <div
              key={b.branchId}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">{b.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  {b.rate}% Collected
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${b.rate}%` }}
                    title={`Collected: ${b.rate}%`}
                  ></div>
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${100 - b.rate}%` }}
                    title={`Pending: ${100 - b.rate}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Collected: {currency}{b.collected.toLocaleString()}</span>
                  <span>Pending: {currency}{b.pending.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoiced</span>
                  <span className="font-mono font-bold text-slate-800">{currency}{b.billed.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Collected</span>
                  <span className="font-mono font-bold text-emerald-700">{currency}{b.collected.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 uppercase font-bold block">Pending</span>
                  <span className="font-mono font-bold text-amber-700">{currency}{b.pending.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: FEE CATEGORY BREAKDOWN (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 font-display">
                Fee Category Breakdown (Tuition vs Levies)
              </h3>
              <p className="text-xs text-slate-500">
                Collection and pending distribution by fee item category for the selected period.
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${currency}${(val / 1000).toLocaleString()}k`}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                  width={110}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  formatter={(value: any) => [`${currency}${Number(value).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="collected" name="Collected" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" stackId="a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights & Action Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 font-display">
              Bursary Insights & Actions
            </h3>
            <p className="text-xs text-slate-500">
              Immediate recommendations based on current ledger balance and collection velocity.
            </p>

            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start space-x-3 text-xs">
                <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-950 font-bold block">Partial Payments Active</strong>
                  <span className="text-indigo-800">
                    {countPartial} students have active installment plans with remaining balances tracked item-by-item.
                  </span>
                </div>
              </div>

              {countOverdue > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-950 font-bold block">Overdue Invoices Alert</strong>
                    <span className="text-rose-800">
                      {countOverdue} accounts past due date. Use the Remind button below to trigger automated reminders.
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start space-x-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 font-bold block">Settlement Tracking</strong>
                  <span className="text-emerald-800">
                    {countPaid} student accounts are 100% cleared for full terminal assessments and report cards.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => exportFinancialsToCSV(currentTermInvoices)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Full Invoicing Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: STUDENT FINANCIAL LEDGER WITH PARTIAL PAYMENTS & FEE ITEM BREAKDOWN */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 font-display">
              Student Fee Ledger & Item Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Track remaining balances and item-level 'Paid / Partial / Pending' status tags for each student's fee invoice.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, invoice #, class..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'PAID' ? 'Paid' : st === 'PARTIAL' ? 'Partial' : 'Pending'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student & Class</th>
                <th className="py-3 px-4">Campus Branch</th>
                <th className="py-3 px-4">Total Billed</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Item Breakdown / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedgerInvoices.map(inv => {
                const isExpanded = expandedInvoiceId === inv.id;
                const isPaid = inv.status === 'PAID' || inv.balance === 0;
                const isPartial = inv.status === 'PARTIAL';
                const isOverdue = inv.status === 'OVERDUE' || (!isPaid && new Date(inv.dueDate).getTime() < Date.now());

                const branch = allBranches.find(b => b.id === inv.branchId);
                const branchLabel = branch?.name.includes('Ijegun')
                  ? 'Ijegun Campus'
                  : 'Bungalow Campus';

                return (
                  <React.Fragment key={inv.id}>
                    <tr className={`hover:bg-slate-50/60 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div>{inv.invoiceNumber}</div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Due: {inv.dueDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {inv.className} • Parent: <span className="text-slate-700">{inv.parentName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {branchLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {currency}{inv.totalAmount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {currency}{inv.paidAmount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                        <span className={inv.balance > 0 ? 'text-amber-700' : 'text-slate-400'}>
                          {currency}{inv.balance.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : isOverdue ? 'OVERDUE' : 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleExpandInvoice(inv.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center space-x-1 shadow-2xs"
                          >
                            <span>Fee Items ({inv.items?.length || 0})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {inv.balance > 0 && onRecordPayment && (
                            <button
                              type="button"
                              onClick={() => onRecordPayment(inv)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center space-x-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Sub-Row: Itemized Fee Breakdown with 'Paid / Partial / Pending' Status Tags */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={8} className="p-4">
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Itemized Fee Schedule for {inv.studentName} ({inv.invoiceNumber})</span>
                              </h4>
                              <span className="text-xs text-slate-500 font-mono">
                                Total Paid: <strong className="text-emerald-600">{currency}{inv.paidAmount.toLocaleString()}</strong> of {currency}{inv.totalAmount.toLocaleString()}
                              </span>
                            </div>

                            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                              <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                                <tr>
                                  <th className="py-2.5 px-3">Fee Item Title</th>
                                  <th className="py-2.5 px-3">Billed Amount</th>
                                  <th className="py-2.5 px-3">Paid Amount</th>
                                  <th className="py-2.5 px-3">Remaining Balance</th>
                                  <th className="py-2.5 px-3 text-right">Item Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(inv.items || []).map((item, idx) => {
                                  const itemAmt = Number(item.amount) || 0;
                                  const itemPaid = Number(item.paidAmount) || 0;
                                  const itemBal = Math.max(0, itemAmt - itemPaid);
                                  const itemSt = item.status || (itemPaid >= itemAmt ? 'Paid' : itemPaid > 0 ? 'Partial' : 'Pending');

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                                        {item.title}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                        {currency}{itemAmt.toLocaleString()}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                                        {currency}{itemPaid.toLocaleString()}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">
                                        {currency}{itemBal.toLocaleString()}
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                            itemSt === 'Paid' || itemSt === 'PAID'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : itemSt === 'Partial' || itemSt === 'PARTIAL'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {itemSt}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredLedgerInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No student invoice records matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
