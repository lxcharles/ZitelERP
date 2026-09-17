import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Award,
  Heart,
  DollarSign
} from 'lucide-react';
import { User, FeeDiscount, Invoice } from '../../types';
import { db } from '../../services/db';

interface FeeDiscountManagerProps {
  currentUser: User;
}

export const FeeDiscountManager: React.FC<FeeDiscountManagerProps> = ({ currentUser }) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';

  const [discounts, setDiscounts] = useState<FeeDiscount[]>(db.getFeeDiscounts(currentUser));
  const [invoices] = useState<Invoice[]>(db.getInvoices(currentUser));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [discountCategory, setDiscountCategory] = useState<FeeDiscount['category']>('SIBLING');
  const [discountAmount, setDiscountAmount] = useState<number>(15000);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const reload = () => {
    setDiscounts(db.getFeeDiscounts(currentUser));
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
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

    const calculatedAmt = discountAmount > 0
      ? discountAmount
      : (inv.totalAmount * (discountPercent || 0)) / 100;

    if (calculatedAmt <= 0) {
      alert('Please provide a valid discount amount or percentage');
      return;
    }

    db.applyFeeDiscount(
      {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentId: inv.studentId,
        studentName: inv.studentName,
        branchId: inv.branchId,
        category: discountCategory,
        amount: calculatedAmt,
        percentage: discountPercent || undefined,
        reason: reason.trim() || `${discountCategory} concession applied`,
        authorizedBy: currentUser.name,
        status: 'APPROVED',
        notes: notes.trim() || undefined,
      },
      currentUser
    );

    setFeedbackMsg(`Successfully authorized ${discountCategory} discount of ${currency}${calculatedAmt.toLocaleString()} for ${inv.studentName}.`);
    setShowModal(false);
    reload();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleStatusChange = (discountId: string, status: FeeDiscount['status']) => {
    db.updateFeeDiscountStatus(discountId, status, currentUser);
    setFeedbackMsg(`Discount status updated to ${status}.`);
    reload();
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const filteredDiscounts = discounts.filter(d => {
    const matchSearch =
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  const totalDiscountValue = filteredDiscounts
    .filter(d => d.status === 'APPROVED')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Authorized Fee Discounts & Concessions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage sibling rebates, academic merit scholarships, staff concessions, and authorized bursary fee reductions.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedInvoiceId(invoices[0]?.id || '');
            setDiscountCategory('SIBLING');
            setDiscountAmount(15000);
            setDiscountPercent(0);
            setReason('Second sibling enrolled at Zitel Castle School');
            setNotes('');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Authorize Discount</span>
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

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Total Authorized Concessions
            </span>
            <span className="text-lg font-black text-indigo-950 font-mono">
              {currency}{totalDiscountValue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Benefiting Students
            </span>
            <span className="text-lg font-black text-emerald-950 font-mono">
              {new Set(filteredDiscounts.map(d => d.studentId)).size} Scholars
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Active Concession Records
            </span>
            <span className="text-lg font-black text-amber-950 font-mono">
              {filteredDiscounts.length} Invoices Adjusted
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
            placeholder="Search discounts by student, invoice or reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Discount Types</option>
            <option value="SIBLING">Sibling Discount</option>
            <option value="SCHOLARSHIP">Academic Scholarship</option>
            <option value="STAFF_CHILD">Staff Concession</option>
            <option value="HARDSHIP">Hardship Waiver</option>
            <option value="SPECIAL_WAIVER">Special Waiver</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table of Discounts */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Student & Invoice</th>
              <th className="py-3 px-4">Discount Category</th>
              <th className="py-3 px-4">Concession Amount</th>
              <th className="py-3 px-4">Reason & Justification</th>
              <th className="py-3 px-4">Authorized By</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDiscounts.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{d.studentName}</p>
                  <span className="text-[11px] font-mono text-slate-500">{d.invoiceNumber}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase border border-indigo-100">
                    {d.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    -{currency}{d.amount.toLocaleString()}
                  </span>
                  {d.percentage && (
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ({d.percentage}% Off)
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 max-w-xs">
                  <p className="font-medium text-slate-800">{d.reason}</p>
                  {d.notes && <p className="text-[10px] text-slate-400 mt-0.5">{d.notes}</p>}
                </td>
                <td className="py-3 px-4">
                  <span className="text-slate-800 font-medium">{d.authorizedBy}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {new Date(d.authorizedAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      d.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : d.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {d.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleStatusChange(d.id, 'APPROVED')}
                        className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        title="Approve Discount"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(d.id, 'REJECTED')}
                        className="p-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        title="Reject Discount"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {d.status === 'APPROVED' && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredDiscounts.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No discount or concession records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Authorize Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-display">
                Authorize Fee Concession / Discount
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-4 text-xs">
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
                      {inv.invoiceNumber} - {inv.studentName} ({inv.className}) - Billed: {currency}{inv.totalAmount.toLocaleString()} - Bal: {currency}{inv.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Type</label>
                  <select
                    value={discountCategory}
                    onChange={e => setDiscountCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="SIBLING">Sibling Discount (10-15%)</option>
                    <option value="SCHOLARSHIP">Academic Merit Scholarship</option>
                    <option value="STAFF_CHILD">Staff Child Concession</option>
                    <option value="HARDSHIP">Hardship Grant / Concession</option>
                    <option value="EARLY_BIRD">Early Settlement Rebate</option>
                    <option value="SPECIAL_WAIVER">Special Board Waiver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Deduction Amount ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason / Board Resolution Ref *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Child Enrollment concession approved by School Board"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Bursary Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional verification details or approval document reference..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100"
                >
                  Apply & Credit Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
