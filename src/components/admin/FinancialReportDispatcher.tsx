import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Send,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Filter
} from 'lucide-react';
import { User, DispatchedFinancialReport, FinancialReportType, Invoice } from '../../types';
import { db } from '../../services/db';

interface FinancialReportDispatcherProps {
  currentUser: User;
}

export const FinancialReportDispatcher: React.FC<FinancialReportDispatcherProps> = ({ currentUser }) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';
  const branches = db.getBranches();

  const [reports, setReports] = useState<DispatchedFinancialReport[]>(db.getDispatchedFinancialReports(currentUser));
  const [invoices] = useState<Invoice[]>(db.getInvoices(currentUser));
  const [showModal, setShowModal] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState<DispatchedFinancialReport | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const [reportType, setReportType] = useState<FinancialReportType>('TERMLY_FEE_REPORT');
  const [reportTitle, setReportTitle] = useState('First Term 2025/2026 Comprehensive Fee & Revenue Audit');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [term, setTerm] = useState('First Term');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [notes, setNotes] = useState('Official financial controller summary submitted for executive review by Chief Bursar.');

  const reload = () => {
    setReports(db.getDispatchedFinancialReports(currentUser));
  };

  // Compute live metrics for report generator preview
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchTerm = term === 'ALL' || inv.term === term;
      const matchYear = academicYear === 'ALL' || inv.academicYear === academicYear;
      const matchBranch = branchFilter === 'ALL' || inv.branchId === branchFilter;
      return matchTerm && matchYear && matchBranch;
    });
  }, [invoices, term, academicYear, branchFilter]);

  const totalBilled = filteredInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalCollected = filteredInvoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalPending = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const overdueCount = filteredInvoices.filter(i => i.balance > 0 && new Date(i.dueDate).getTime() < Date.now()).length;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    const created = db.dispatchFinancialReport(
      {
        title: reportTitle.trim(),
        reportType,
        academicYear,
        term,
        branchFilter,
        dispatchedBy: currentUser.name,
        dispatchedByRole: currentUser.customRoleTitle || 'Chief Bursar & Financial Controller',
        recipientRoles: ['SUPER_ADMIN', 'ADMIN'],
        summaryMetrics: {
          totalBilled,
          totalCollected,
          totalPending,
          collectionRate,
          overdueCount,
          studentCount: filteredInvoices.length,
        },
        notes: notes.trim(),
        status: 'DELIVERED',
      },
      currentUser
    );

    setFeedbackMsg(`Successfully dispatched "${created.title}" to School Leadership and Board.`);
    setShowModal(false);
    reload();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Executive Financial Statements & Report Dispatch</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compile and dispatch verified revenue audits, collections reports, and fee performance digests directly to School Leadership.
          </p>
        </div>
        <button
          onClick={() => {
            setReportType('TERMLY_FEE_REPORT');
            setReportTitle(`${term} ${academicYear} Comprehensive Fee & Revenue Audit`);
            setAcademicYear('2025/2026');
            setTerm('First Term');
            setBranchFilter('ALL');
            setNotes('Official financial controller summary submitted for executive review by Chief Bursar.');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap"
        >
          <Send className="w-4 h-4" />
          <span>Compile & Dispatch Report</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Dispatched Reports Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(rep => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-xs flex flex-col justify-between space-y-4 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold uppercase border border-indigo-100">
                  {rep.reportType.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200">
                  {rep.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{rep.title}</h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">{rep.notes}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Invoiced</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {currency}{rep.summaryMetrics.totalBilled.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Collected ({rep.summaryMetrics.collectionRate}%)</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {currency}{rep.summaryMetrics.totalCollected.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Scope: {rep.term} {rep.academicYear}</span>
                <span className="font-semibold text-slate-700">
                  {rep.branchFilter === 'ALL' ? 'All Branches' : rep.branchFilter.replace('branch_', '').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                <span>By: {rep.dispatchedBy}</span>
                <span className="font-mono">{new Date(rep.sentAt).toLocaleDateString()}</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedReportForView(rep)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Executive Summary</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="col-span-3 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No executive financial reports have been compiled or dispatched yet.
          </div>
        )}
      </div>

      {/* Compile & Dispatch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-display">
                Compile & Dispatch Financial Controller Report
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Report Format</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="TERMLY_FEE_REPORT">Termly Comprehensive Fee Report</option>
                    <option value="MONTHLY_FINANCIAL_STATEMENT">Monthly Financial Statement</option>
                    <option value="WEEKLY_FINANCIAL_SUMMARY">Weekly Revenue Digest</option>
                    <option value="DAILY_COLLECTION">Daily Bank Collection Audit</option>
                    <option value="FEE_DEFAULTERS_LIST">Overdue Defaulters Analysis</option>
                    <option value="BRANCH_COMPARISON">Multi-Branch Performance Compare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Branch Filter</label>
                  <select
                    value={branchFilter}
                    onChange={e => setBranchFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ALL">All School Branches (Consolidated)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Term</label>
                  <select
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                    <option value="ALL">Full Academic Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Academic Session</label>
                  <select
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
              </div>

              {/* Real-time Calculated Preview */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Live Snapshot Metrics (Auto-Compiled)
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Invoiced Total</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{currency}{totalBilled.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 font-bold block">Collected ({collectionRate}%)</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">{currency}{totalCollected.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-600 font-bold block">Pending Balance</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">{currency}{totalPending.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Financial Controller Commentary & Executive Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish & Dispatch Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Dispatched Report Modal */}
      {selectedReportForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold uppercase border border-indigo-100">
                  {selectedReportForView.reportType.replace(/_/g, ' ')}
                </span>
                <h3 className="text-base font-black text-slate-900 font-display mt-1">
                  {selectedReportForView.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportForView(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Invoiced Total</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {currency}{selectedReportForView.summaryMetrics.totalBilled.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold block">Collected</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {currency}{selectedReportForView.summaryMetrics.totalCollected.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 font-bold block">Collection Rate</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {selectedReportForView.summaryMetrics.collectionRate}%
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold block">Pending Balances</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">
                    {currency}{selectedReportForView.summaryMetrics.totalPending.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Financial Controller Commentary</h4>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedReportForView.notes}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Dispatched By:</span>
                  <span className="font-bold text-slate-800">{selectedReportForView.dispatchedBy} ({selectedReportForView.dispatchedByRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sent Date & Timestamp:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedReportForView.sentAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReportForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
