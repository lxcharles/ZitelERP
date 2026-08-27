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
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  BellRing,
  Receipt,
  FileText,
  UserCheck
} from 'lucide-react';
import { User, Invoice, FeePayment, Branch, InvoiceFeeItem } from '../../types';
import { db } from '../../services/db';
import { exportFinancialsToCSV } from '../../utils/exportCsv';
import { ActiveTermFinancialSummaryCard } from './ActiveTermFinancialSummaryCard';
import { FinancialDashboardTab } from './FinancialDashboardTab';

interface ChiefBursarFinanceDashboardProps {
  currentUser: User;
  onRecordPayment?: (invoice: Invoice) => void;
  onTriggerReminder?: (invoice: Invoice) => void;
  onIssueInvoice?: () => void;
}

export const ChiefBursarFinanceDashboard: React.FC<ChiefBursarFinanceDashboardProps> = ({
  currentUser,
  onRecordPayment,
  onTriggerReminder,
  onIssueInvoice,
}) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';
  const allBranches = db.getBranches();
  const allParents = db.getParents();

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

  // Active Sub-tab inside the dedicated Bursar workspace
  const [bursarView, setBursarView] = useState<'overview' | 'ledger' | 'verifications' | 'structures' | 'reminders'>('overview');

  // Invoices & Payments with RBAC
  const rawInvoices = db.getInvoices(currentUser);
  const rawPayments = db.getPayments(currentUser);

  // Pending Verifications
  const pendingPayments = rawPayments.filter(p => p.status === 'PENDING_VERIFICATION');

  // 7+ Days overdue invoices
  const today = new Date();
  const overdue7DaysInvoices = rawInvoices.filter(inv => {
    if (inv.balance <= 0 || inv.status === 'PAID') return false;
    const dueDate = new Date(inv.dueDate);
    const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  });
  const totalOverdue7Days = overdue7DaysInvoices.reduce((acc, i) => acc + i.balance, 0);

  // Overall totals across accessible accounts
  const totalInvoicedAll = rawInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const totalCollectedAll = rawInvoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalOutstandingAll = Math.max(0, totalInvoicedAll - totalCollectedAll);
  const overallCollectionRate = totalInvoicedAll > 0 ? Math.round((totalCollectedAll / totalInvoicedAll) * 100) : 0;

  // Modal / Review States
  const [selectedPaymentForReview, setSelectedPaymentForReview] = useState<FeePayment | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<FeePayment['paymentMethod']>('BANK_TRANSFER');
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [isDispatchingReminders, setIsDispatchingReminders] = useState(false);

  // Review approval/rejection handler
  const handleReviewAction = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedPaymentForReview) return;
    try {
      db.verifyManualPayment(
        selectedPaymentForReview.id,
        action,
        reviewRemarks || (action === 'APPROVE' ? 'Payment verified and cleared by Bursary.' : 'Payment proof could not be verified.'),
        currentUser,
        action === 'REJECT' ? (reviewRemarks || 'Could not verify payment on bank ledger') : undefined
      );
      setSelectedPaymentForReview(null);
      setReviewRemarks('');
    } catch (err: any) {
      alert(err.message || 'Failed to process verification.');
    }
  };

  // Direct payment recording handler
  const handleRecordDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRecordPaymentModal || paymentAmount <= 0) return;

    try {
      db.recordPayment(
        showRecordPaymentModal.id,
        Number(paymentAmount),
        paymentMethod,
        currentUser
      );
      setShowRecordPaymentModal(null);
      setPaymentAmount(0);
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    }
  };

  // Bulk reminder dispatcher
  const handleDispatchBulkReminders = () => {
    setIsDispatchingReminders(true);
    try {
      const res = db.sendBulkOverduePaymentReminders(currentUser, 7);
      setReminderToast(
        `Automated reminders successfully dispatched to ${res.totalSent} parents with 7+ day overdue balances (${currency}${res.totalOverdueAmount.toLocaleString()}).`
      );
      setTimeout(() => setReminderToast(null), 6000);
      setShowBulkReminderModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to send bulk reminders.');
    } finally {
      setIsDispatchingReminders(false);
    }
  };

  return (
    <div className="space-y-6" id="chief-bursar-dedicated-workspace">
      {/* Executive Bursary Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-indigo-900/40">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bursary & Financial Controller Workspace</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • Central Financial Governance
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white flex items-center space-x-2">
            <span>{currentUser.customRoleTitle || 'Chief Bursar & Financial Controller'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Institutional revenue management, multi-campus tuition collection ledgers, automated bank transfer reconciliation, and parent payment verification.
          </p>
        </div>

        {/* Executive Action Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onIssueInvoice && (
            <button
              onClick={onIssueInvoice}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoices</span>
            </button>
          )}

          <button
            onClick={() => exportFinancialsToCSV(rawInvoices)}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
            title="Print Financial Statement"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pending Payment Verification Alert Banner */}
      {pendingPayments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                Action Required
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                <strong>{pendingPayments.length} parent payment proof(s)</strong> awaiting Bursar audit & credit verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => setBursarView('verifications')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit Proofs ({pendingPayments.length})</span>
          </button>
        </div>
      )}

      {/* Reminder Toast Banner */}
      {reminderToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Navigation Sub-Tabs for Dedicated Bursar Workspace */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Financial Summary', icon: BarChart3 },
          { id: 'ledger', label: 'Student Accounts & Invoices', icon: DollarSign, badge: rawInvoices.length },
          { id: 'verifications', label: 'Payment Verifications Queue', icon: UserCheck, badge: pendingPayments.length > 0 ? pendingPayments.length : undefined },
          { id: 'reminders', label: 'Overdue & Debt Recovery', icon: BellRing, badge: overdue7DaysInvoices.length > 0 ? overdue7DaysInvoices.length : undefined },
          { id: 'structures', label: 'Fee Structures & Schedules', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          const isCurrent = bursarView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setBursarView(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW: Executive Financial Summary (Includes Active Term Recharts Card + Full Financial Dashboard) */}
      {bursarView === 'overview' && (
        <div className="space-y-6">
          {/* Active Academic Term Financial Summary Card with Recharts Dual Bar Chart */}
          <ActiveTermFinancialSummaryCard
            currentUser={currentUser}
            onNavigateToFinance={() => setBursarView('ledger')}
            onNavigateToLedger={() => setBursarView('ledger')}
          />

          {/* Full Financial Dashboard Component (Branch Comparisons, Monthly Collection Trend, Category Breakdowns) */}
          <FinancialDashboardTab
            currentUser={currentUser}
            onRecordPayment={(inv) => {
              setShowRecordPaymentModal(inv);
              setPaymentAmount(inv.balance);
            }}
            onTriggerReminder={(inv) => {
              if (onTriggerReminder) onTriggerReminder(inv);
            }}
          />
        </div>
      )}

      {/* VIEW: Student Accounts & Invoices Ledger */}
      {bursarView === 'ledger' && (
        <div className="space-y-4">
          <FinancialDashboardTab
            currentUser={currentUser}
            onRecordPayment={(inv) => {
              setShowRecordPaymentModal(inv);
              setPaymentAmount(inv.balance);
            }}
            onTriggerReminder={(inv) => {
              if (onTriggerReminder) onTriggerReminder(inv);
            }}
          />
        </div>
      )}

      {/* VIEW: Payment Verifications Queue */}
      {bursarView === 'verifications' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Bank Payment Audit & Verification Queue</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit and verify electronic bank transfers and proof documents submitted by parents.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900">
                {pendingPayments.length} Pending Verifications
              </span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All payments have been audited and cleared</p>
                <p className="text-xs text-slate-500 mt-1">No pending bank transfer submissions awaiting verification.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPayments.map(payment => {
                  const inv = rawInvoices.find(i => i.id === payment.invoiceId);
                  return (
                    <div
                      key={payment.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Ref: {payment.paymentReference || payment.transactionRef || 'N/A'}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base mt-0.5">{payment.studentName}</h4>
                            <span className="text-xs text-slate-600 font-semibold">{inv?.className}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            PENDING AUDIT
                          </span>
                        </div>

                        <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Amount Claimed:</span>
                            <span className="font-bold text-emerald-700 font-mono text-sm">
                              {currency}{payment.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Method:</span>
                            <span className="font-semibold text-slate-800">{payment.paymentMethod}</span>
                          </div>
                          {payment.bankName && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Bank & Sender:</span>
                              <span className="font-semibold text-slate-800">
                                {payment.bankName} {payment.accountHolderName ? `(${payment.accountHolderName})` : ''}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Date Logged:</span>
                            <span className="text-slate-700">{payment.paidAt ? payment.paidAt.split('T')[0] : 'N/A'}</span>
                          </div>
                        </div>

                        {payment.proofUrl && (
                          <div className="mt-3">
                            <a
                              href={payment.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Uploaded Bank Transfer Receipt</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPaymentForReview(payment);
                            setReviewRemarks('Payment confirmed against school bank statement.');
                          }}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Issue Receipt</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPaymentForReview(payment);
                            setReviewRemarks('Transfer transaction could not be located on school bank ledger.');
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: Overdue Tracking & Debt Recovery */}
      {bursarView === 'reminders' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <BellRing className="w-5 h-5 text-rose-600" />
                  <span>Overdue Receivables & Parental Debt Recovery</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accounts with unpaid fee balances past due date. Trigger single or bulk automated SMS & push reminders.
                </p>
              </div>

              <button
                disabled={overdue7DaysInvoices.length === 0}
                onClick={() => setShowBulkReminderModal(true)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 ${
                  overdue7DaysInvoices.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send 7-Day Bulk Reminders ({overdue7DaysInvoices.length})</span>
              </button>
            </div>

            {/* Overdue table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student & Class</th>
                    <th className="py-3 px-4">Parent Details</th>
                    <th className="py-3 px-4">Total Billed</th>
                    <th className="py-3 px-4">Paid to Date</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdue7DaysInvoices.map(inv => {
                    const parentObj = allParents.find(p => p.id === inv.parentId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{inv.studentName}</p>
                          <span className="text-[11px] text-slate-500">{inv.className}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <p className="font-semibold">{inv.parentName}</p>
                          <span className="text-[10px] text-slate-500">{parentObj?.phone || parentObj?.email || 'Guardian'}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {currency}{inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {currency}{inv.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-rose-700">
                          {currency}{inv.balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-rose-600 font-semibold">
                          {inv.dueDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (onTriggerReminder) onTriggerReminder(inv);
                            }}
                            className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 cursor-pointer"
                          >
                            Send Reminder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Fee Structures & Schedules */}
      {bursarView === 'structures' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Fee Schedules & Structures</h3>
              <p className="text-xs text-slate-500">Standardized class billing breakdown including tuition, development levies, uniforms, and books.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.getFeeStructures().map(fs => (
              <div key={fs.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{fs.name}</h4>
                    <span className="text-xs text-slate-500">{fs.className} • {fs.term}</span>
                  </div>
                  <span className="font-mono font-black text-indigo-900 text-sm">
                    {currency}{fs.amount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Due Date: {fs.dueDate}</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${fs.mandatory ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                    {fs.mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Direct Payment Recording */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Fee Payment</h3>
            <p className="text-xs text-slate-500">
              Student: <strong>{showRecordPaymentModal.studentName}</strong> • Balance: <strong>{currency}{showRecordPaymentModal.balance.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleRecordDirectPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Credit ({currency})</label>
                <input
                  type="number"
                  min="100"
                  max={showRecordPaymentModal.balance}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="CARD">Debit / Credit Card (POS/Online)</option>
                  <option value="CASH">Cash Deposit at Bursary</option>
                  <option value="CHEQUE">Bank Draft / Cheque</option>
                </select>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Verification Review */}
      {selectedPaymentForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Audit Proof of Payment</h3>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><strong>Student:</strong> {selectedPaymentForReview.studentName}</p>
              <p><strong>Amount:</strong> {currency}{selectedPaymentForReview.amount.toLocaleString()}</p>
              <p><strong>Ref:</strong> {selectedPaymentForReview.paymentReference || selectedPaymentForReview.transactionRef}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bursary Audit Remarks</label>
              <textarea
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Enter audit statement or verification details..."
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentForReview(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('REJECT')}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Reject Proof
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('APPROVE')}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Approve & Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk 7-Day Reminders */}
      {showBulkReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-rose-600" />
              <span>Confirm 7-Day Overdue Reminders</span>
            </h3>
            <p className="text-xs text-slate-600">
              You are about to dispatch automated push notifications and email reminders to{' '}
              <strong className="text-slate-900">{overdue7DaysInvoices.length} parent(s)</strong> with invoices past due by 7 or more days.
            </p>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
              Total Overdue Sum: {currency}{totalOverdue7Days.toLocaleString()}
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowBulkReminderModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDispatchingReminders}
                onClick={handleDispatchBulkReminders}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {isDispatchingReminders ? 'Sending...' : 'Dispatch Reminders Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
