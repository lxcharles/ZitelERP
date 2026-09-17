import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Users,
  ChevronRight,
  CreditCard,
  FileText,
  X,
  Share2,
  Check,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { User, Branch, Invoice, FeePayment, Student } from '../../types';
import { db } from '../../services/db';
import { exportFinancialsToCSV } from '../../utils/exportCsv';

interface FeesCollectionOverviewProps {
  currentUser: User;
  branches: Branch[];
  selectedBranchId?: string;
  onNavigateToTab?: (tab: string) => void;
  onBackToDashboard?: () => void;
}

export const FeesCollectionOverview: React.FC<FeesCollectionOverviewProps> = ({
  currentUser,
  branches,
  selectedBranchId = 'all',
  onNavigateToTab,
  onBackToDashboard,
}) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';

  // Filters
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [termFilter, setTermFilter] = useState<string>('ALL');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'OUTSTANDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected invoice/student for detailed drill-down modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Sync parent branch update
  React.useEffect(() => {
    if (selectedBranchId) {
      setBranchFilter(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Load live data from database
  const allInvoices = db.getInvoices(currentUser);
  const allPayments = db.getPayments(currentUser);
  const allClasses = db.getClasses();
  const allStudents = db.getStudents();

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      // Branch filter
      if (branchFilter !== 'all' && inv.branchId && inv.branchId !== branchFilter) {
        return false;
      }

      // Class filter
      if (classFilter !== 'ALL') {
        const cls = allClasses.find(c => c.id === classFilter);
        if (cls && inv.className !== cls.name) {
          return false;
        }
      }

      // Term filter
      if (termFilter !== 'ALL' && inv.term && !inv.term.toLowerCase().includes(termFilter.toLowerCase())) {
        return false;
      }

      // Session filter
      if (sessionFilter !== 'ALL' && inv.academicYear && !inv.academicYear.includes(sessionFilter)) {
        return false;
      }

      // Fee category filter
      if (categoryFilter !== 'ALL') {
        const hasCategory = inv.items && inv.items.some(it => 
          it.title?.toLowerCase().includes(categoryFilter.toLowerCase()) || 
          it.category?.toLowerCase().includes(categoryFilter.toLowerCase())
        );
        if (!hasCategory) return false;
      }

      // Status filter
      const isPaid = (inv.balance || 0) <= 0 || inv.status === 'PAID' || inv.status === 'Paid';
      const isPartial = !isPaid && (inv.paidAmount || 0) > 0;
      const isOutstanding = !isPaid && (inv.paidAmount || 0) === 0;

      if (statusFilter === 'PAID' && !isPaid) return false;
      if (statusFilter === 'PARTIAL' && !isPartial) return false;
      if (statusFilter === 'OUTSTANDING' && (isPaid || !isOutstanding)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = (inv.studentName || '').toLowerCase().includes(q);
        const matchInvoiceNum = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const matchParent = (inv.parentName || '').toLowerCase().includes(q);
        const matchClass = (inv.className || '').toLowerCase().includes(q);
        if (!matchStudent && !matchInvoiceNum && !matchParent && !matchClass) {
          return false;
        }
      }

      return true;
    });
  }, [allInvoices, branchFilter, classFilter, termFilter, sessionFilter, categoryFilter, statusFilter, searchQuery, allClasses]);

  // Aggregate Metrics for Active Scope
  const scopeInvoices = useMemo(() => {
    if (branchFilter === 'all') return allInvoices;
    return allInvoices.filter(i => i.branchId === branchFilter);
  }, [allInvoices, branchFilter]);

  const summary = useMemo(() => {
    const totalExpected = scopeInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalCollected = scopeInvoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const totalOutstanding = scopeInvoices.reduce((acc, i) => acc + (i.balance || 0), 0);
    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    let fullyPaidCount = 0;
    let partialCount = 0;
    let owingCount = 0;

    scopeInvoices.forEach(inv => {
      const isPaid = (inv.balance || 0) <= 0 || inv.status === 'PAID' || inv.status === 'Paid';
      if (isPaid) {
        fullyPaidCount++;
      } else if ((inv.paidAmount || 0) > 0) {
        partialCount++;
      } else {
        owingCount++;
      }
    });

    const pendingPaymentsCount = allPayments.filter(p => {
      if (branchFilter !== 'all' && p.branchId !== branchFilter) return false;
      return p.status === 'PENDING_VERIFICATION';
    }).length;

    return {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionPercentage,
      fullyPaidCount,
      partialCount,
      owingCount,
      pendingPaymentsCount,
      totalInvoices: scopeInvoices.length,
    };
  }, [scopeInvoices, allPayments, branchFilter]);

  // Handle Receipt Print
  const handlePrintReceipt = (inv: Invoice) => {
    window.print();
  };

  return (
    <div className="space-y-5" id="director-fees-collection-overview">
      {/* TOP NAVIGATION BAR & BREADCRUMB */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (selectedInvoice) {
                setSelectedInvoice(null);
              } else if (statusFilter !== 'ALL') {
                setStatusFilter('ALL');
              } else if (onBackToDashboard) {
                onBackToDashboard();
              } else if (onNavigateToTab) {
                onNavigateToTab('overview');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer group"
            id="btn-back-to-dashboard-from-fees"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Back</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-400">Director Command</span>
            <span>/</span>
            <span className="font-bold text-slate-800">Fees & Collection Overview</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Branch filter pill */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 border-none outline-hidden cursor-pointer"
            >
              <option value="all">All Campuses (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => exportFinancialsToCSV(filteredInvoices)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-sm border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Institutional Financial Oversight
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              FEES & COLLECTION OVERVIEW
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Complete fee recovery index, tuition clearance tracking, settled accounts, and student debtor ledgers across Zitel Castle School campuses.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">
              Overall Fee Recovery Rate
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {summary.collectionPercentage}%
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {summary.fullyPaidCount} of {summary.totalInvoices} Accounts Settled
            </div>
          </div>
        </div>
      </div>

      {/* COLLECTION SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Expected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Expected Revenue
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {currency}{(summary.totalExpected || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Across {summary.totalInvoices} active invoices
          </p>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Collected Revenue
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              {summary.collectionPercentage}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
            {currency}{(summary.totalCollected || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">
            Verified institutional receipts
          </p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Outstanding Balance
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
              {100 - summary.collectionPercentage}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 mt-1">
            {currency}{(summary.totalOutstanding || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">
            Tuition & levy debt to recover
          </p>
        </div>

        {/* Settlement Distribution */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Student Payment Status
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {summary.fullyPaidCount} Paid
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {summary.partialCount} Partial
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {summary.owingCount} Owing
            </span>
          </div>
          {summary.pendingPaymentsCount > 0 && (
            <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {summary.pendingPaymentsCount} pending confirmation
            </p>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Invoices ({scopeInvoices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Fully Settled ({summary.fullyPaidCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PARTIAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'PARTIAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Partially Paid ({summary.partialCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OUTSTANDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'OUTSTANDING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Outstanding / Owing ({summary.owingCount})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="text-slate-900 font-bold">{filteredInvoices.length}</span> records
          </div>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student, parent, or invoice #..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-indigo-500 transition-colors"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-indigo-500"
            >
              <option value="ALL">All Classrooms</option>
              {allClasses
                .filter(c => branchFilter === 'all' || c.branchId === branchFilter)
                .map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Term Filter */}
          <div>
            <select
              value={termFilter}
              onChange={e => setTermFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-indigo-500"
            >
              <option value="ALL">All Academic Terms</option>
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>

          {/* Fee Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-indigo-500"
            >
              <option value="ALL">All Fee Types</option>
              <option value="Tuition">Tuition Fees</option>
              <option value="Development">Development Levy</option>
              <option value="Books">Books & Learning</option>
              <option value="Uniform">Uniform & Sports</option>
              <option value="Medical">Medical / Health</option>
            </select>
          </div>
        </div>
      </div>

      {/* WHO HAS PAID / WHO OWES LEDGER TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Fee Clearance & Debtors Ledger
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Click any row to inspect complete payment breakdown and receipt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class & Campus</th>
                <th className="py-3 px-4">Parent / Contact</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => {
                  const isPaid = (inv.balance || 0) <= 0 || inv.status === 'PAID' || inv.status === 'Paid';
                  const isPartial = !isPaid && (inv.paidAmount || 0) > 0;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Invoice # */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-indigo-600">
                        {inv.invoiceNumber}
                      </td>

                      {/* Student */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600">
                          {inv.studentName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {inv.studentId}
                        </div>
                      </td>

                      {/* Class & Campus */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inv.className}</div>
                        <div className="text-[10px] text-slate-400">
                          {inv.branchName || 'Consolidated'}
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{inv.parentName || 'Parent / Guardian'}</div>
                        <div className="text-[10px] text-slate-400">Term: {inv.term}</div>
                      </td>

                      {/* Expected */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {currency}{(inv.totalAmount || 0).toLocaleString()}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {currency}{(inv.paidAmount || 0).toLocaleString()}
                      </td>

                      {/* Outstanding */}
                      <td className="py-3 px-4 text-right font-black">
                        {(inv.balance || 0) > 0 ? (
                          <span className="text-rose-600">
                            {currency}{(inv.balance || 0).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₦0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            Owing
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-xs">No Fee Records Match Filters</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try selecting another status tab, branch, or classroom.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT PAYMENT DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Navigation & Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-800/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Return to Fees Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      STUDENT PAYMENT DETAILS & CLEARANCE
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                      {selectedInvoice.invoiceNumber}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {selectedInvoice.studentName} • {selectedInvoice.className} ({selectedInvoice.branchName || 'Zitel Castle School'})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Top Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Expected</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {currency}{(selectedInvoice.totalAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Amount Paid</span>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    {currency}{(selectedInvoice.paidAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-600 uppercase block">Outstanding</span>
                  <div className="text-base font-black text-rose-700 mt-0.5">
                    {currency}{(selectedInvoice.balance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">Clearance Status</span>
                  <div className="mt-1">
                    {(selectedInvoice.balance || 0) <= 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Fully Settled
                      </span>
                    ) : (selectedInvoice.paidAmount || 0) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Partially Settled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Unpaid Debt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Student & Parent Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Student & Family Dossier
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Student Name:</span>
                    <strong className="text-slate-800">{selectedInvoice.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">School ID:</span>
                    <strong className="text-slate-800 font-mono">{selectedInvoice.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Class & Branch:</span>
                    <strong className="text-slate-800">{selectedInvoice.className} • {selectedInvoice.branchName || 'ZCS Campus'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Parent / Sponsor:</span>
                    <strong className="text-slate-800">{selectedInvoice.parentName || 'Parent / Guardian'}</strong>
                  </div>
                </div>
              </div>

              {/* Fee Items Breakdown */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                    Invoiced Fee Items Breakdown
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Item Description</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-800">{item.title}</td>
                            <td className="py-2 px-3 text-slate-500">{item.category || 'General'}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {currency}{(item.amount || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Transaction History */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Recorded Payment Transactions
                </h4>
                {allPayments.filter(p => p.invoiceId === selectedInvoice.id).length > 0 ? (
                  <div className="space-y-2">
                    {allPayments
                      .filter(p => p.invoiceId === selectedInvoice.id)
                      .map(pay => (
                        <div
                          key={pay.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {currency}{(pay.amount || 0).toLocaleString()} via {pay.paymentMethod || 'Payment'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Ref: {pay.transactionRef || pay.paymentReference || 'N/A'} • Paid on:{' '}
                              {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : 'Recent'}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                    No confirmed electronic or cash payment transactions logged for this invoice yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer with Back Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Fees Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    if (onBackToDashboard) {
                      onBackToDashboard();
                    } else if (onNavigateToTab) {
                      onNavigateToTab('overview');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Dashboard Overview</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handlePrintReceipt(selectedInvoice)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Clearance Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
