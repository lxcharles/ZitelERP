import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  DollarSign,
  User as UserIcon,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Lock,
  X,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { User, Invoice, Student, FeePayment } from '../../types';
import { db, isChiefBursarUser } from '../../services/db';

interface ConfirmOfflinePaymentModalProps {
  currentUser: User;
  initialInvoice?: Invoice | null;
  onClose: () => void;
  onSuccess?: (payment: FeePayment) => void;
}

export const ConfirmOfflinePaymentModal: React.FC<ConfirmOfflinePaymentModalProps> = ({
  currentUser,
  initialInvoice,
  onClose,
  onSuccess,
}) => {
  const profile = db.getSchoolProfile();
  const currency = profile.currencySymbol || '₦';
  const isAuthorized = isChiefBursarUser(currentUser);

  const allInvoices = useMemo(() => db.getInvoices(currentUser), [currentUser]);
  const allStudents = useMemo(() => db.getStudents(), []);
  const allBranches = useMemo(() => db.getBranches(), []);

  // Selection & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    initialInvoice?.id || ''
  );

  // Form State
  const selectedInvoice = useMemo(() => {
    return allInvoices.find(i => i.id === selectedInvoiceId) || null;
  }, [allInvoices, selectedInvoiceId]);

  const selectedStudent = useMemo(() => {
    if (!selectedInvoice) return null;
    return allStudents.find(s => s.id === selectedInvoice.studentId) || null;
  }, [allStudents, selectedInvoice]);

  const [amountPaid, setAmountPaid] = useState<string>(
    initialInvoice ? String(initialInvoice.balance > 0 ? initialInvoice.balance : initialInvoice.totalAmount) : ''
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [bankName, setBankName] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [confirmationNote, setConfirmationNote] = useState<string>('');
  const [independentVerificationChecked, setIndependentVerificationChecked] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState<FeePayment | null>(null);

  // Auto-fill amount when invoice changes if not manually edited
  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setAmountPaid(String(inv.balance > 0 ? inv.balance : inv.totalAmount));
    if (!accountHolderName) {
      setAccountHolderName(inv.parentName || '');
    }
    setErrorMsg(null);
  };

  // Filtered invoices with outstanding balance for search
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allInvoices.filter(inv => {
      if (!q) return true;
      const student = allStudents.find(s => s.id === inv.studentId);
      const studentIdMatch = student?.admissionNumber?.toLowerCase().includes(q) || student?.id?.toLowerCase().includes(q);
      const nameMatch = inv.studentName.toLowerCase().includes(q);
      const classMatch = inv.className.toLowerCase().includes(q);
      const invMatch = inv.invoiceNumber.toLowerCase().includes(q);
      const parentMatch = inv.parentName.toLowerCase().includes(q);
      return studentIdMatch || nameMatch || classMatch || invMatch || parentMatch;
    });
  }, [allInvoices, allStudents, searchQuery]);

  // Handle Submit
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthorized) {
      setErrorMsg('Unauthorized: Only the Chief Bursar has permission to confirm offline payments.');
      return;
    }

    if (!selectedInvoice) {
      setErrorMsg('Please select a student invoice first.');
      return;
    }

    const numAmount = Number(amountPaid);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (!paymentMethod.trim()) {
      setErrorMsg('Please select the offline payment method.');
      return;
    }

    if (!confirmationNote.trim()) {
      setErrorMsg('Audit Compliance: A confirmation note or verification record is mandatory.');
      return;
    }

    if (!independentVerificationChecked) {
      setErrorMsg('Please affirm that this payment was independently verified by the school.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = db.confirmOfflinePayment({
        invoiceId: selectedInvoice.id,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        transactionRef: transactionRef.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountHolderName: accountHolderName.trim() || undefined,
        confirmationNote: confirmationNote.trim(),
        independentVerificationChecked: true,
        actor: currentUser,
      });

      setConfirmedPayment(payment);
      if (onSuccess) onSuccess(payment);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record and confirm offline payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleResetForAnother = () => {
    setConfirmedPayment(null);
    setSelectedInvoiceId('');
    setAmountPaid('');
    setTransactionRef('');
    setBankName('');
    setConfirmationNote('');
    setIndependentVerificationChecked(false);
    setErrorMsg(null);
  };

  const numAmount = Number(amountPaid) || 0;
  const newRemainingBalance = selectedInvoice ? Math.max(0, selectedInvoice.balance - numAmount) : 0;
  const resultingStatus = selectedInvoice
    ? newRemainingBalance === 0
      ? 'PAID'
      : 'PARTIALLY PAID'
    : 'PENDING';

  // Branch Name helper
  const branchObj = selectedInvoice ? allBranches.find(b => b.id === selectedInvoice.branchId) : null;
  const branchName = branchObj?.name || selectedInvoice?.branchName || 'Main Branch';

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
      id="confirm-offline-payment-modal-overlay"
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="confirm-offline-payment-modal"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between relative border-b border-indigo-900/50">
          <div className="space-y-1.5 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chief Bursar Only • Offline Verification</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                No Parent Proof Upload Required
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center space-x-2">
              <span>Confirm Offline School Fee Payment</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Manually record and confirm fee payments made outside the app (Bank Transfer, Direct Deposit, POS, or Cash) after independent treasury verification.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Authorization Check Warning if not authorized */}
          {!isAuthorized && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-200 text-rose-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Access Denied: Chief Bursar Authorization Required</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Only the Chief Bursar and authorized Financial Controllers have permission to manually confirm and mark student fees as paid without parent proof upload.
                  </p>
                </div>
              </div>
              <div className="text-xs text-rose-800 bg-white/70 p-3 rounded-xl border border-rose-200">
                Current User: <strong>{currentUser.name}</strong> ({currentUser.role} - {currentUser.customRoleTitle || 'General Staff'})
              </div>
            </div>
          )}

          {isAuthorized && !confirmedPayment && (
            <form onSubmit={handleConfirmPayment} className="space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-semibold">{errorMsg}</div>
                </div>
              )}

              {/* Step 1: Student & Outstanding Fee Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Select Student & Outstanding Invoice</span>
                  </label>
                  {selectedInvoice && (
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceId('')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Change Selection
                    </button>
                  )}
                </div>

                {!selectedInvoice ? (
                  <div className="space-y-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by Student ID (e.g. ZCS-2024-001), Student Name, or Class (e.g. Basic 3)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all shadow-xs"
                      />
                    </div>

                    {/* Invoices List */}
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
                      {filteredInvoices.map(inv => {
                        const student = allStudents.find(s => s.id === inv.studentId);
                        const isSettled = inv.balance === 0;

                        return (
                          <div
                            key={inv.id}
                            onClick={() => handleSelectInvoice(inv)}
                            className="p-3 hover:bg-indigo-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono text-xs shrink-0 border border-indigo-200">
                                {inv.studentName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center space-x-2">
                                  <span>{inv.studentName}</span>
                                  <span className="font-mono text-[10px] text-slate-500 font-normal">
                                    ({student?.admissionNumber || student?.id || 'ID N/A'})
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                  <span className="font-semibold text-slate-700">{inv.className}</span>
                                  <span>•</span>
                                  <span>{inv.invoiceNumber}</span>
                                  <span>•</span>
                                  <span>{inv.term}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-black font-mono text-slate-900">
                                {currency}{inv.balance.toLocaleString()}
                              </div>
                              <span
                                className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  isSettled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inv.status === 'PARTIAL'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isSettled ? 'Settled' : `${inv.status} Balance`}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredInvoices.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No student invoices found matching "{searchQuery}".
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Selected Student Card Summary */
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] uppercase">
                          Selected Student
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-950">
                          {selectedStudent?.admissionNumber || selectedStudent?.id || 'ID N/A'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">
                        {selectedInvoice.studentName}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Class: <strong>{selectedInvoice.className}</strong> • Branch: <strong>{branchName}</strong> • Parent: <strong>{selectedInvoice.parentName}</strong>
                      </p>
                      <p className="text-[11px] font-mono text-indigo-800">
                        Invoice: <strong>{selectedInvoice.invoiceNumber}</strong> ({selectedInvoice.term} • {selectedInvoice.academicYear})
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-indigo-200 text-right shadow-2xs shrink-0">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Balance</div>
                      <div className="font-mono font-black text-lg text-rose-600">
                        {currency}{selectedInvoice.balance.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Total Invoiced: {currency}{selectedInvoice.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment Details Entry */}
              {selectedInvoice && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-black">2</span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Payment Verification & Transaction Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Amount to Confirm */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Amount Paid ({currency}) *</span>
                        <div className="flex items-center space-x-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setAmountPaid(String(selectedInvoice.balance))}
                            className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold hover:bg-indigo-200 transition-colors"
                          >
                            Full Balance ({currency}{selectedInvoice.balance.toLocaleString()})
                          </button>
                          {selectedInvoice.balance > 10000 && (
                            <button
                              type="button"
                              onClick={() => setAmountPaid(String(Math.round(selectedInvoice.balance / 2)))}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                            >
                              50% ({currency}{Math.round(selectedInvoice.balance / 2).toLocaleString()})
                            </button>
                          )}
                        </div>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                          {currency}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={selectedInvoice.balance > 0 ? selectedInvoice.balance : undefined}
                          value={amountPaid}
                          onChange={e => setAmountPaid(e.target.value)}
                          required
                          placeholder="e.g. 150000"
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="Bank Transfer">Bank Transfer (NIBSS / Instant EFT)</option>
                        <option value="Direct Bank Deposit">Direct Bank Deposit (Bank Teller / Over-the-counter)</option>
                        <option value="POS / Card Terminal">POS / Card Terminal (School Front Desk)</option>
                        <option value="Cash">Cash (Treasury Cash Office)</option>
                        <option value="Cheque">Bank Draft / Cheque</option>
                        <option value="Other Approved Offline Method">Other Approved Offline Method</option>
                      </select>
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Payment Date *</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Transaction Reference / Teller Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Transaction Reference / Teller No.</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={e => setTransactionRef(e.target.value)}
                        placeholder="e.g. TEL-8920194 or NIBSS-90412"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Bank / Treasury Desk Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Receiving Bank / Treasury Account</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. Zenith Bank (1014920492) or Main Cash Desk"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Payer / Account Holder Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Payer / Depositor Name</span>
                        <span className="text-[10px] text-slate-400 font-normal">Defaults to Guardian</span>
                      </label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={e => setAccountHolderName(e.target.value)}
                        placeholder="Name of parent or depositor who executed the transfer"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Audit Confirmation Note (Mandatory) */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Chief Bursar Confirmation Note (Mandatory for Audit Trail) *</span>
                        <span className="text-[10px] text-amber-700 font-bold">Required</span>
                      </label>
                      <textarea
                        rows={2}
                        value={confirmationNote}
                        onChange={e => setConfirmationNote(e.target.value)}
                        required
                        placeholder="e.g. Verified payment against School Zenith Bank corporate statement line #4928 dated Aug 29. Reconciled and approved for official receipt issuance."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Independent Verification Affirmation Checkbox (Mandatory) */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <label className="flex items-start space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={independentVerificationChecked}
                        onChange={e => setIndependentVerificationChecked(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-amber-300"
                        required
                      />
                      <div className="text-xs text-slate-800 leading-relaxed">
                        <strong className="text-amber-950 font-bold block">
                          Affirmation of Independent Financial Verification:
                        </strong>
                        I confirm that this offline payment has been independently verified against the school's bank statement, cash treasury ledger, or official account records, and I authorize recording this transaction and issuing an official school bursary receipt.
                      </div>
                    </label>
                  </div>

                  {/* Step 3: Real-Time Audit Record Preview */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs font-mono shadow-inner border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Audit Record Preview</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        Target Status: {resultingStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 text-[11px] pt-1">
                      <div className="text-slate-400">Student:</div>
                      <div className="font-bold text-white text-right truncate">
                        {selectedInvoice.studentName} ({selectedStudent?.admissionNumber || 'ID'})
                      </div>

                      <div className="text-slate-400">Invoice:</div>
                      <div className="text-right text-slate-200">{selectedInvoice.invoiceNumber}</div>

                      <div className="text-slate-400">Amount to Credit:</div>
                      <div className="font-bold text-emerald-400 text-right">
                        {currency}{numAmount.toLocaleString()}
                      </div>

                      <div className="text-slate-400">New Balance:</div>
                      <div className="text-right text-amber-300">
                        {currency}{newRemainingBalance.toLocaleString()}
                      </div>

                      <div className="text-slate-400">Payment Channel:</div>
                      <div className="text-right text-indigo-300 font-semibold">
                        OFFLINE_MANUAL_BURSAR ({paymentMethod})
                      </div>

                      <div className="text-slate-400">Confirmed By:</div>
                      <div className="text-right text-slate-200">
                        {currentUser.name} ({currentUser.customRoleTitle || 'Chief Bursar'})
                      </div>

                      <div className="text-slate-400">Timestamp:</div>
                      <div className="text-right text-slate-400">
                        {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !independentVerificationChecked || numAmount <= 0 || !confirmationNote.trim()}
                      className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 ${
                        isSubmitting || !independentVerificationChecked || numAmount <= 0 || !confirmationNote.trim()
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30 cursor-pointer'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSubmitting ? 'Verifying & Confirming...' : 'CONFIRM PAYMENT'}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Success View: Generated Official Bursary Receipt */}
          {confirmedPayment && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Success Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-emerald-950">
                      Payment Successfully Confirmed & Reconciled!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Fee status has been updated to <strong>{resultingStatus}</strong>. Official school receipt has been generated and made available to parent.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-black bg-emerald-200 text-emerald-900 px-3 py-1 rounded-lg">
                  {confirmedPayment.receiptNumber}
                </span>
              </div>

              {/* Official Bursary Receipt Printable Card */}
              <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-md space-y-4 print:m-0 print:border-none print:shadow-none">
                {/* School Header */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-900 text-white mb-2 font-black text-xl shadow-xs">
                    ZC
                  </div>
                  <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight font-display">
                    {profile.name || 'ZITEL CASTLE SCHOOL'}
                  </h2>
                  <p className="text-xs font-bold text-slate-700">
                    {branchName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {profile.address || 'Central Branch, Lagos, Nigeria'} • Tel: {profile.phone || '+234 800 000 0000'}
                  </p>
                  <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest">
                    OFFICIAL BURSARY RECEIPT (OFFLINE CONFIRMED)
                  </div>
                </div>

                {/* Receipt Data Grid */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Receipt Number:</span>
                    <span className="font-mono font-black text-indigo-950 text-sm">
                      {confirmedPayment.receiptNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Payment Reference:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {confirmedPayment.paymentReference || confirmedPayment.transactionRef}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Student Name:</span>
                    <strong className="text-slate-900">{confirmedPayment.studentName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Student ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {confirmedPayment.studentCode || 'ZCS-2024-001'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Class:</span>
                    <span className="font-bold text-slate-800">{confirmedPayment.className}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Parent / Guardian:</span>
                    <span className="font-bold text-slate-800">{confirmedPayment.parentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Term & Academic Year:</span>
                    <span className="font-bold text-slate-800">
                      {confirmedPayment.term} ({confirmedPayment.academicYear})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Payment Method:</span>
                    <span className="font-bold text-indigo-900">{confirmedPayment.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Payment Channel:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      OFFLINE DIRECT RECONCILIATION
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Confirmation Note:</span>
                    <span className="text-slate-700 italic text-[11px] max-w-xs text-right">
                      "{confirmedPayment.confirmationNote}"
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 bg-emerald-50/70 p-3 rounded-xl mt-2">
                    <span className="text-emerald-950 font-black text-sm uppercase">Total Amount Paid:</span>
                    <span className="font-mono font-black text-xl text-emerald-700">
                      {currency}{confirmedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Signature & Stamp */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <div>
                    <span className="font-bold text-slate-700 block">Authorized Chief Bursar:</span>
                    <span className="text-slate-900 font-medium">
                      {confirmedPayment.confirmedBy || currentUser.name} ({confirmedPayment.confirmedByRole || 'Chief Bursar & Financial Controller'})
                    </span>
                    <div className="text-[9px] text-emerald-700 font-bold mt-0.5 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified, Reconciled & Digitally Signed</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="w-24 h-12 border-2 border-dashed border-emerald-600 rounded-xl flex flex-col items-center justify-center bg-emerald-50 text-emerald-800 font-black text-[9px] uppercase tracking-wider">
                      <span>BURSARY</span>
                      <span className="text-[8px] text-emerald-600 font-mono">OFFICIAL STAMP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm Another Offline Payment</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Print Official Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
