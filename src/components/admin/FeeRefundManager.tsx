import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  Filter,
  DollarSign,
  Building2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { User, FeeRefund, Invoice } from '../../types';
import { db } from '../../services/db';

interface FeeRefundManagerProps {
  currentUser: User;
}

export const FeeRefundManager: React.FC<FeeRefundManagerProps> = ({ currentUser }) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';

  const [refunds, setRefunds] = useState<FeeRefund[]>(db.getFeeRefunds(currentUser));
  const [invoices] = useState<Invoice[]>(db.getInvoices(currentUser));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedRefundForSlip, setSelectedRefundForSlip] = useState<FeeRefund | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(20000);
  const [refundReason, setRefundReason] = useState<string>('Duplicate bank transfer reversal');
  const [reasonCategory, setReasonCategory] = useState<'OVERPAYMENT' | 'WITHDRAWAL' | 'DUPLICATE_PAYMENT' | 'CONCESSION_ADJUSTMENT' | 'OTHER'>('OVERPAYMENT');
  const [bankName, setBankName] = useState<string>('Guaranty Trust Bank');
  const [accountNumber, setAccountNumber] = useState<string>('0123456789');
  const [accountName, setAccountName] = useState<string>('');

  const reload = () => {
    setRefunds(db.getFeeRefunds(currentUser));
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Please select an invoice');
      return;
    }

    const inv = invoices.find(i => i.id === selectedInvoiceId);
    if (!inv) {
      alert('Invalid invoice selected');
      return;
    }

    if (refundAmount <= 0) {
      alert('Please provide a valid refund amount');
      return;
    }

    const result = db.processFeeRefund(
      {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentId: inv.studentId,
        studentName: inv.studentName,
        branchId: inv.branchId,
        amount: refundAmount,
        reason: `${reasonCategory}: ${refundReason.trim()}`,
        status: 'COMPLETED',
        refundDate: new Date().toISOString().split('T')[0],
        authorizedBy: currentUser.name,
        beneficiaryAccount: {
          bankName,
          accountNumber,
          accountName: accountName || inv.parentName || 'Parent / Guardian',
        },
      },
      currentUser
    );

    setFeedbackMsg(`Successfully processed refund of ${currency}${refundAmount.toLocaleString()} for ${inv.studentName}. Reference: ${result.referenceNumber}.`);
    setShowModal(false);
    reload();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const filteredRefunds = refunds.filter(r => {
    const matchSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRefunded = filteredRefunds
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            <span>Fee Refunds & Reversals Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process excess fee refunds, credit reversals, duplicate payment settlements, and authorized withdrawals.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedInvoiceId(invoices[0]?.id || '');
            setRefundAmount(20000);
            setRefundReason('Excess transfer reconciliation');
            setReasonCategory('OVERPAYMENT');
            setBankName('Zenith Bank');
            setAccountNumber('2048918291');
            setAccountName('');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Process Fee Refund</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Disbursed Refunds
            </span>
            <span className="text-lg font-black font-mono text-white">
              {currency}{totalRefunded.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Completed Reversals
            </span>
            <span className="text-lg font-black text-emerald-950 font-mono">
              {filteredRefunds.filter(r => r.status === 'COMPLETED').length} Transactions
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Total Recorded Claims
            </span>
            <span className="text-lg font-black text-indigo-950 font-mono">
              {filteredRefunds.length} Refund Logs
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search refunds by student, ref #, invoice or reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Refund Ref #</th>
              <th className="py-3 px-4">Student & Invoice</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Beneficiary Bank Account</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Authorized By</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Credit Voucher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRefunds.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  {r.referenceNumber}
                </td>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{r.studentName}</p>
                  <span className="text-[11px] font-mono text-slate-500">{r.invoiceNumber}</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-rose-700 text-sm">
                  {currency}{r.amount.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  {r.beneficiaryAccount ? (
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">{r.beneficiaryAccount.bankName}</p>
                      <p className="font-mono text-slate-600 text-[11px]">{r.beneficiaryAccount.accountNumber}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{r.beneficiaryAccount.accountName}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 max-w-xs">
                  <p className="font-medium text-slate-800">{r.reason}</p>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{r.refundDate}</span>
                </td>
                <td className="py-3 px-4 text-slate-800 font-medium">
                  {r.authorizedBy}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedRefundForSlip(r)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer"
                    title="View & Print Official Credit Refund Voucher"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Slip</span>
                  </button>
                </td>
              </tr>
            ))}

            {filteredRefunds.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No refund or reversal records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Process Refund Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-display">
                Process Fee Refund / Reversal
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Invoice & Student *</label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={e => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Select Invoice --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.studentName} ({inv.className}) - Paid: {currency}{inv.paidAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Refund Reason Category</label>
                  <select
                    value={reasonCategory}
                    onChange={e => setReasonCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="OVERPAYMENT">Excess Payment</option>
                    <option value="DUPLICATE_PAYMENT">Duplicate Transfer</option>
                    <option value="WITHDRAWAL">Student Disenrollment</option>
                    <option value="CONCESSION_ADJUSTMENT">Retroactive Concession</option>
                    <option value="OTHER">Other Reversal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Refund Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    required
                    value={refundAmount}
                    onChange={e => setRefundAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason Detail & Approval Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duplicate online gateway transfer confirmed by Zenith Bank"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Parent / Beneficiary Payout Bank Details
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. GTBank / Access"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="10-digit NUBAN"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="Beneficiary Account Name"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100"
                >
                  Authorize & Issue Credit Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Refund Voucher Print Preview Modal */}
      {selectedRefundForSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-display">
                Official Credit Refund Voucher
              </h3>
              <button
                onClick={() => setSelectedRefundForSlip(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <h4 className="font-black text-indigo-950 text-sm tracking-wide">ZITEL CASTLE SCHOOL</h4>
                <p className="text-[10px] text-slate-500 font-medium">Bursary & Financial Accounts Division</p>
                <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px]">
                  REFUND VOUCHER #{selectedRefundForSlip.referenceNumber}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{selectedRefundForSlip.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Ref:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRefundForSlip.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refund Amount:</span>
                  <span className="font-mono font-black text-rose-700 text-base">
                    {currency}{selectedRefundForSlip.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Processed:</span>
                  <span className="font-mono text-slate-700">{selectedRefundForSlip.refundDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized Officer:</span>
                  <span className="font-bold text-slate-800">{selectedRefundForSlip.authorizedBy}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Reason:</span>
                  <p className="font-medium text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                    {selectedRefundForSlip.reason}
                  </p>
                </div>
                {selectedRefundForSlip.beneficiaryAccount && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Beneficiary Bank Details:</span>
                    <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                      <p className="font-bold text-slate-900">{selectedRefundForSlip.beneficiaryAccount.bankName} - {selectedRefundForSlip.beneficiaryAccount.accountNumber}</p>
                      <p className="text-[11px] text-slate-600">{selectedRefundForSlip.beneficiaryAccount.accountName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRefundForSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Credit Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
