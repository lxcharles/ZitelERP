import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Download,
  Filter,
  Layers,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { User, Invoice, Branch } from '../../types';
import { db } from '../../services/db';
import { exportFinancialsToCSV } from '../../utils/exportCsv';

interface ActiveTermFinancialSummaryCardProps {
  currentUser: User;
  onNavigateToFinance?: () => void;
  onNavigateToLedger?: (branchId?: string) => void;
  className?: string;
}

export const ActiveTermFinancialSummaryCard: React.FC<ActiveTermFinancialSummaryCardProps> = ({
  currentUser,
  onNavigateToFinance,
  onNavigateToLedger,
  className = '',
}) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';
  const allBranches = db.getBranches();

  // Role-Based Access Control
  const isBranchAdmin =
    (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'BRANCH_ADMIN') &&
    Boolean(currentUser.branchId) &&
    currentUser.scope !== 'ALL_SCHOOL' &&
    currentUser.scope !== 'FINANCE_ONLY';

  const userAssignedBranch = allBranches.find(b => b.id === currentUser.branchId);
  const accessibleBranches = isBranchAdmin && userAssignedBranch
    ? [userAssignedBranch]
    : allBranches;

  // Active Term & Session detection from School Profile
  const defaultActiveTerm = profile.currentTerm?.includes('First')
    ? 'First Term'
    : profile.currentTerm?.includes('Second')
    ? 'Second Term'
    : profile.currentTerm?.includes('Third')
    ? 'Third Term'
    : 'First Term';

  const defaultActiveYear = profile.currentAcademicYear || '2025/2026';

  const [selectedTerm, setSelectedTerm] = useState<string>(defaultActiveTerm);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(defaultActiveYear);

  // Invoices filtered by user access
  const allInvoices = db.getInvoices(currentUser);

  // Filter invoices strictly for the selected active term and academic session
  const activeTermInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchTerm = selectedTerm === 'ALL' || inv.term === selectedTerm || inv.term?.includes(selectedTerm);
      const matchYear = selectedAcademicYear === 'ALL' || inv.academicYear === selectedAcademicYear;
      return matchTerm && matchYear;
    });
  }, [allInvoices, selectedTerm, selectedAcademicYear]);

  // Aggregate stats across branches for the active term
  const branchAggregates = useMemo(() => {
    return accessibleBranches.map(branch => {
      const branchInvs = activeTermInvoices.filter(inv => inv.branchId === branch.id);
      const billed = branchInvs.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
      const paid = branchInvs.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
      const outstanding = Math.max(0, billed - paid);
      const rate = billed > 0 ? Math.round((paid / billed) * 100) : 0;

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
        paid,
        outstanding,
        billed,
        rate,
        invoiceCount: branchInvs.length,
        settledCount: branchInvs.filter(i => i.status === 'PAID' || i.balance === 0).length,
      };
    });
  }, [accessibleBranches, activeTermInvoices]);

  // Overall totals for the active term
  const termTotalBilled = useMemo(
    () => branchAggregates.reduce((acc, b) => acc + b.billed, 0),
    [branchAggregates]
  );
  const termTotalPaid = useMemo(
    () => branchAggregates.reduce((acc, b) => acc + b.paid, 0),
    [branchAggregates]
  );
  const termTotalOutstanding = useMemo(
    () => branchAggregates.reduce((acc, b) => acc + b.outstanding, 0),
    [branchAggregates]
  );
  const termCollectionRate =
    termTotalBilled > 0 ? Math.round((termTotalPaid / termTotalBilled) * 100) : 0;

  const handleExportCSV = () => {
    exportFinancialsToCSV(activeTermInvoices);
  };

  return (
    <div
      id="active-term-financial-summary-card"
      className={`p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider flex items-center space-x-1">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Financial Summary</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active Academic Term: {selectedTerm}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              Session {selectedAcademicYear}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display flex items-center space-x-2">
            <span>Total Paid vs. Outstanding Balances</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-by-campus comparative collection performance and receivables for {selectedTerm}.
          </p>
        </div>

        {/* Controls & Quick Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Select Term"
            >
              <option value="First Term">First Term (Harmattan)</option>
              <option value="Second Term">Second Term (Lent)</option>
              <option value="Third Term">Third Term (Trinity)</option>
              <option value="ALL">All Terms (Full Session)</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors"
              title="Export Active Term CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {onNavigateToFinance && (
            <button
              onClick={onNavigateToFinance}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>Finance Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip for Active Term */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Billed</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            {currency}{termTotalBilled.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {activeTermInvoices.length} total enrolled invoices
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Paid</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-800 font-mono">
            {currency}{termTotalPaid.toLocaleString()}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-bold mt-0.5">
            <span>{termCollectionRate}% Collection Rate</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Outstanding</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-700 font-mono">
            {currency}{termTotalOutstanding.toLocaleString()}
          </p>
          <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">
            {activeTermInvoices.filter(i => i.balance > 0).length} accounts pending
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Recovery Ratio</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <p className="text-xl font-black text-indigo-900 font-mono">
                {termCollectionRate}%
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">of term billed</span>
            </div>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, termCollectionRate))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart: Total Paid vs Outstanding Aggregated by Branch */}
      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Campus Comparison: {selectedTerm} Collections vs. Outstanding
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-emerald-800">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-2xs"></span>
              <span>Total Paid ({currency})</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-700">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block shadow-2xs"></span>
              <span>Outstanding Balances ({currency})</span>
            </span>
          </div>
        </div>

        {/* Recharts Chart Viewport */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={branchAggregates}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              barGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#334155', fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${currency}${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '14px',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '12px 16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(value: any, name: any) => [
                  `${currency}${Number(value).toLocaleString()}`,
                  name === 'paid' ? 'Total Fees Paid' : 'Outstanding Balance',
                ]}
                labelStyle={{ color: '#94a3b8', fontWeight: 800, marginBottom: '6px' }}
              />
              <Bar
                dataKey="paid"
                name="paid"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                maxBarSize={55}
              />
              <Bar
                dataKey="outstanding"
                name="outstanding"
                fill="#f43f5e"
                radius={[8, 8, 0, 0]}
                maxBarSize={55}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Per-Branch Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 pt-4 border-t border-slate-200">
          {branchAggregates.map(branch => (
            <div
              key={branch.branchId}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {branch.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      branch.rate >= 70
                        ? 'bg-emerald-100 text-emerald-800'
                        : branch.rate >= 50
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {branch.rate}% Collected
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-2.5 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Billed</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {currency}{branch.billed.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/80">
                    <span className="text-[10px] text-emerald-700 font-semibold block">Total Paid</span>
                    <span className="text-xs font-bold text-emerald-800 font-mono">
                      {currency}{branch.paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50/80">
                    <span className="text-[10px] text-rose-700 font-semibold block">Outstanding</span>
                    <span className="text-xs font-bold text-rose-700 font-mono">
                      {currency}{branch.outstanding.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  <strong>{branch.settledCount}</strong> of <strong>{branch.invoiceCount}</strong> accounts settled
                </span>
                {onNavigateToLedger && (
                  <button
                    onClick={() => onNavigateToLedger(branch.branchId)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <span>View Accounts</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
