import React, { useState } from 'react';
import {
  Receipt,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  ShieldCheck,
  Send,
  Printer,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
  RefreshCw,
  FileCheck,
  XCircle,
  CreditCard,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { Student, User, Invoice, FeePayment, Branch } from '../../types';
import { db } from '../../services/db';

interface ParentFeePaymentManagerProps {
  student: Student;
  currentUser: User;
}

export const ParentFeePaymentManager: React.FC<ParentFeePaymentManagerProps> = ({
  student,
  currentUser,
}) => {
  const profile = db.getSchoolProfile();
  const branches = db.getBranches();
  const currency = profile.currencySymbol || '₦';

  const studentBranch = branches.find(b => b.id === student.branchId) || branches[0];
  const branchName = studentBranch?.name || 'Zitel Castle School (Bungalow Branch)';

  // Bank Configuration: Branch-specific first, falling back to School Profile
  const bankConfig = studentBranch?.bankDetails || profile.bankDetails || {
    bankName: studentBranch?.id === 'branch_ijegun' ? 'Guaranty Trust Bank (GTBank) Plc' : 'Zenith Bank Plc',
    accountName: `Zitel Castle School (${studentBranch?.name?.includes('Ijegun') ? 'Ijegun Branch' : 'Bungalow Branch'})`,
    accountNumber: studentBranch?.id === 'branch_ijegun' ? '0238194721' : '1014582910',
    sortCode: studentBranch?.id === 'branch_ijegun' ? '058152062' : '057150013',
    paymentInstructions: 'Make transfer using the unique payment reference as narration/remarks.',
  };

  // Invoices & Payments for this student (RBAC aware)
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    db.getInvoices(currentUser).filter(i => i.studentId === student.id)
  );
  const [payments, setPayments] = useState<FeePayment[]>(() =>
    db.getPayments(currentUser).filter(p => p.studentId === student.id)
  );

  // Modal / View States
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInstructionInvoice, setPaymentInstructionInvoice] = useState<Invoice | null>(null);
  const [confirmationInvoice, setConfirmationInvoice] = useState<Invoice | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);

  // Form State for Payment Confirmation
  const [confirmPaymentRef, setConfirmPaymentRef] = useState('');
  const [confirmAmount, setConfirmAmount] = useState<number>(0);
  const [confirmDate, setConfirmDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [confirmMethod, setConfirmMethod] = useState<string>('Bank Transfer');
  const [confirmTxnRef, setConfirmTxnRef] = useState<string>('');
  const [confirmBankName, setConfirmBankName] = useState<string>(bankConfig.bankName);
  const [confirmAccountHolder, setConfirmAccountHolder] = useState<string>(currentUser.name);
  const [confirmProofFileName, setConfirmProofFileName] = useState<string>('');
  const [confirmProofUrl, setConfirmProofUrl] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshData = () => {
    setInvoices(db.getInvoices(currentUser).filter(i => i.studentId === student.id));
    setPayments(db.getPayments(currentUser).filter(p => p.studentId === student.id));
  };

  // Helper to generate a unique payment reference for an invoice
  const getUniquePaymentRef = (inv: Invoice) => {
    const studentCode = student.admissionNumber
      ? student.admissionNumber.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase()
      : student.id.replace('stu_', '').slice(0, 4).toUpperCase();
    const invNum = inv.invoiceNumber.replace(/[^0-9]/g, '').slice(-4) || '2041';
    return `ZCS-${studentCode}-${invNum}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Step 32: Open Payment Instruction Screen
  const handleOpenPaymentInstruction = (inv: Invoice) => {
    setViewingInvoice(null);
    setPaymentInstructionInvoice(inv);
  };

  // Step 34: Proceed from Instruction Screen to Confirmation Form
  const handleProceedToConfirmation = (inv: Invoice, overrideRef?: string, overrideAmount?: number) => {
    const ref = overrideRef || getUniquePaymentRef(inv);
    setConfirmPaymentRef(ref);
    setConfirmAmount(overrideAmount !== undefined ? overrideAmount : (inv.balance || inv.totalAmount));
    setConfirmDate(new Date().toISOString().split('T')[0]);
    setConfirmMethod('Bank Transfer');
    setConfirmTxnRef(`TRF-${Math.floor(100000000 + Math.random() * 900000000)}`);
    setConfirmBankName(bankConfig.bankName);
    setConfirmAccountHolder(currentUser.name);
    setConfirmProofFileName('');
    setConfirmProofUrl('');
    setFormError('');
    setSubmissionSuccess(false);

    setPaymentInstructionInvoice(null);
    setConfirmationInvoice(inv);
  };

  // Handle Resubmission for a rejected payment
  const handleResubmitProof = (pay: FeePayment) => {
    const inv = invoices.find(i => i.id === pay.invoiceId) || {
      id: pay.invoiceId,
      invoiceNumber: pay.invoiceNumber,
      studentId: student.id,
      studentName: student.fullName,
      className: student.className,
      branchId: student.branchId,
      branchName,
      parentId: currentUser.id,
      parentName: currentUser.name,
      term: pay.term || 'First Term',
      academicYear: pay.academicYear || '2025/2026',
      items: [{ title: 'Tuition and Resource Fee', amount: pay.amount }],
      totalAmount: pay.amount,
      paidAmount: 0,
      balance: pay.amount,
      status: 'UNPAID',
      dueDate: '2026-09-15',
      createdAt: new Date().toISOString(),
    };

    handleProceedToConfirmation(inv, pay.paymentReference || pay.transactionRef, pay.amount);
  };

  // Handle file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfirmProofFileName(file.name);
      const url = URL.createObjectURL(file);
      setConfirmProofUrl(url);
    }
  };

  // Quick preset sample receipt for easy demonstration
  const handleSelectSampleReceipt = (type: 'zenith' | 'gtbank' | 'teller') => {
    if (type === 'zenith') {
      setConfirmProofFileName('zenith_mobile_transfer_receipt.jpg');
      setConfirmProofUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
      setConfirmTxnRef(`ZENITH-NIP-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setConfirmBankName('Zenith Bank PLC');
    } else if (type === 'gtbank') {
      setConfirmProofFileName('gtworld_transfer_confirmation.png');
      setConfirmProofUrl('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80');
      setConfirmTxnRef(`GTB-TRF-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setConfirmBankName('Guaranty Trust Bank (GTBank)');
    } else {
      setConfirmProofFileName('bank_deposit_teller_stamped.pdf');
      setConfirmProofUrl('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80');
      setConfirmTxnRef(`TELLER-091823-${Math.floor(1000 + Math.random() * 9000)}`);
      setConfirmBankName('First Bank of Nigeria');
    }
  };

  // Submit payment confirmation (Req 34 & 35)
  const handleSubmitConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationInvoice) return;

    if (confirmAmount <= 0) {
      setFormError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (!confirmPaymentRef.trim()) {
      setFormError('Payment reference is required.');
      return;
    }

    try {
      db.submitManualPaymentProof({
        invoiceId: confirmationInvoice.id,
        amount: confirmAmount,
        paymentMethod: confirmMethod,
        transactionRef: confirmTxnRef || `REF-${Date.now().toString().slice(-6)}`,
        paymentReference: confirmPaymentRef.trim(),
        paymentDate: confirmDate,
        bankName: confirmBankName,
        accountHolderName: confirmAccountHolder,
        proofUrl: confirmProofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        proofFileName: confirmProofFileName || 'payment_transfer_receipt.jpg',
        parentUser: currentUser,
      });

      refreshData();
      setSubmissionSuccess(true);
      setTimeout(() => {
        setConfirmationInvoice(null);
        setSubmissionSuccess(false);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit payment confirmation.');
    }
  };

  // Trigger print
  const handlePrintDocument = () => {
    window.print();
  };

  // Financial summary
  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);

  // Check for upcoming or overdue invoices
  const hasOverdue = invoices.some(i => i.status === 'OVERDUE' || (i.balance > 0 && new Date(i.dueDate).getTime() < Date.now()));
  const dueSoonInvoice = invoices.find(i => i.balance > 0 && new Date(i.dueDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6" id="parent-fee-portal">
      {/* Urgent Warning Banner if Overdue or Due Soon */}
      {(hasOverdue || dueSoonInvoice) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <h4 className="font-black text-amber-900 text-sm">
              {hasOverdue ? 'Urgent: Term Fee Payment Overdue' : 'Fee Payment Deadline Approaching'}
            </h4>
            <p className="text-amber-800 font-medium">
              Please ensure outstanding termly tuition and academic levies for{' '}
              <strong>{student.fullName}</strong> are settled. Prompt payment ensures uninterrupted student portal access and terminal assessment recording.
            </p>
          </div>
        </div>
      )}

      {/* Header Summary & Student Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Zitel Castle School Bursary & Accounts</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Fee Invoicing & Payment Portal
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Student: <strong className="text-slate-800">{student.fullName}</strong> • ID:{' '}
            <span className="font-mono text-indigo-700 font-bold">{student.schoolId || student.admissionNumber || student.studentId}</span> • Class:{' '}
            <strong className="text-slate-800">{student.className}</strong> • Branch: {branchName}
          </p>
        </div>

        {/* Financial Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 min-w-[130px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Billed</span>
            <strong className="text-lg font-black text-slate-900 font-mono">
              {currency}{totalBilled.toLocaleString()}
            </strong>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 min-w-[130px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Amount Paid</span>
            <strong className="text-lg font-black text-emerald-700 font-mono">
              {currency}{totalPaid.toLocaleString()}
            </strong>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 min-w-[130px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Outstanding Balance</span>
            <strong className="text-lg font-black text-amber-800 font-mono">
              {currency}{totalOutstanding.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* School Bank Account Information Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-800/40">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Official School Bank Payment Account</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Bank Name</span>
              <span className="font-bold text-white">{bankConfig.bankName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Name</span>
              <span className="font-bold text-white">{bankConfig.accountName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Number</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-amber-300 font-black text-sm tracking-wider">
                  {bankConfig.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankConfig.accountNumber, 'acct_no')}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all text-[11px] flex items-center space-x-1"
                  title="Copy account number"
                >
                  {copiedKey === 'acct_no' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'acct_no' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: INVOICES & LEVIES LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Fee Invoices & Termly Levies
            </h3>
            <p className="text-xs text-slate-500">
              Select an invoice to download the official assessment sheet or click PAY to initiate payment.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {invoices.map(inv => {
            const isPaid = inv.status === 'PAID' || inv.balance === 0;
            const isPartial = inv.status === 'PARTIAL';
            const isOverdue = inv.status === 'OVERDUE' || (!isPaid && new Date(inv.dueDate).getTime() < Date.now());
            const uniqueRef = getUniquePaymentRef(inv);

            return (
              <div
                key={inv.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white shadow-2xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {inv.invoiceNumber}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Ref: {uniqueRef}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPartial
                          ? 'bg-amber-100 text-amber-800'
                          : isOverdue
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isPaid ? 'PAID' : isPartial ? 'PARTIALLY PAID' : isOverdue ? 'OVERDUE' : 'UNPAID'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {inv.items?.map(it => it.title || (it as any).description).join(' • ') || 'Termly Tuition and Resource Package'}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Academic Year: <strong className="text-slate-700 font-bold">{inv.academicYear || '2025/2026'}</strong></span>
                    <span>Term: <strong className="text-slate-700 font-bold">{inv.term || 'First Term'}</strong></span>
                    <span>Due Date: <strong className="text-slate-700 font-bold">{inv.dueDate}</strong></span>
                  </div>

                  {/* Itemized Fee Breakdown with Paid/Partial/Pending Status Tags */}
                  {inv.items && inv.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        <span>Fee Item Breakdown & Status</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {inv.items.map((item, idx) => {
                          const itemAmt = Number(item.amount) || 0;
                          const itemPaid = Number(item.paidAmount) || 0;
                          const itemBal = Math.max(0, itemAmt - itemPaid);
                          const itemSt = item.status || (itemPaid >= itemAmt ? 'Paid' : itemPaid > 0 ? 'Partial' : 'Pending');

                          return (
                            <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                              <div className="truncate mr-2">
                                <span className="font-semibold text-slate-800 block truncate">{item.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Billed: {currency}{itemAmt.toLocaleString()} • Bal: <strong className={itemBal > 0 ? 'text-amber-700' : 'text-slate-500'}>{currency}{itemBal.toLocaleString()}</strong>
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                                  itemSt === 'Paid' || itemSt === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : itemSt === 'Partial' || itemSt === 'PARTIAL'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-200 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {itemSt}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount breakdown and action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right font-mono text-xs space-y-0.5">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Total Billed: {currency}{(inv.totalAmount || 0).toLocaleString()}</div>
                    <div className="text-emerald-600 font-bold">Paid: {currency}{(inv.paidAmount || 0).toLocaleString()}</div>
                    <div className="text-slate-900 font-black text-sm">
                      Balance: {currency}{(inv.balance || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Requirement 31: DOWNLOAD FEE INVOICE */}
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(inv)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download Invoice</span>
                    </button>

                    {/* Requirement 32: PAY Button */}
                    {inv.balance > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentInstruction(inv)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center space-x-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>PAY</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fully Paid</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {invoices.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
              No fee invoices issued for this student yet.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: PAYMENT HISTORY TABLE (Requirement 40) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Payment History & Receipts
            </h3>
            <p className="text-xs text-slate-500">
              Complete chronological ledger of bank transfers, online payments, bursary audit statuses, and official receipts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Description / Reference</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Receipt / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(pay => {
                const isVerified = pay.status === 'VERIFIED' || (!pay.status && pay.receiptNumber);
                const isPending = pay.status === 'PENDING_VERIFICATION';
                const isRejected = pay.status === 'REJECTED';

                return (
                  <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {new Date(pay.paidAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {pay.invoiceNumber || 'Term Tuition'}
                      </div>
                      <div className="font-mono text-[10px] text-indigo-700">
                        Ref: {pay.paymentReference || pay.transactionRef}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                      {currency}{pay.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div>{pay.paymentMethod}</div>
                      {pay.bankName && <div className="text-[10px] text-slate-400">{pay.bankName}</div>}
                      {pay.isOfflineConfirmed && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                          Direct Bursar Confirmation
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>
                          {isVerified ? 'Paid & Verified' : isPending ? 'Pending Verification' : 'Payment Rejected'}
                        </span>
                      </span>
                      {isRejected && pay.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5 max-w-xs">
                          Reason: {pay.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isVerified ? (
                        /* Requirement 39: DOWNLOAD RECEIPT */
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(pay)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all inline-flex items-center space-x-1.5 border border-indigo-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Download Receipt</span>
                        </button>
                      ) : isRejected ? (
                        /* Requirement 38: Allow resubmission */
                        <button
                          type="button"
                          onClick={() => handleResubmitProof(pay)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all inline-flex items-center space-x-1.5 border border-rose-200"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resubmit Proof</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Bursar auditing...
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No payment history recorded yet for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DOWNLOADABLE FEE INVOICE (Requirement 31)                        */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
            {/* Modal Actions Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Official Fee Assessment & Invoice
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 text-slate-800" id="printable-invoice">
              {/* School Header */}
              <div className="text-center pb-5 border-b-2 border-slate-800 space-y-1">
                <div className="flex items-center justify-center space-x-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white font-black flex items-center justify-center text-xl shadow-md">
                    ZCS
                  </div>
                </div>
                <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                  {profile.name || 'ZITEL CASTLE SCHOOL'}
                </h1>
                <p className="text-xs font-semibold text-slate-600 italic">
                  "{profile.motto || 'Wisdom, Moral Integrity & Academic Distinction'}"
                </p>
                <p className="text-[11px] text-slate-500">
                  {branchName} • {studentBranch?.address || profile.address} • Tel: {studentBranch?.phone || profile.phone}
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest">
                  FEE ASSESSMENT INVOICE
                </div>
              </div>

              {/* Student & Invoice Meta Information */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Student Full Name</span>
                    <strong className="text-slate-900 text-sm">{student.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Student ID / Reg No.</span>
                    <span className="font-mono font-bold text-indigo-900">{student.schoolId || student.admissionNumber || student.studentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Class & Section</span>
                    <span className="font-bold text-slate-800">{student.className}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Parent / Guardian</span>
                    <span className="font-bold text-slate-800">{viewingInvoice.parentName || currentUser.name}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right sm:text-left">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice Number</span>
                    <span className="font-mono font-black text-slate-900">{viewingInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Academic Session & Term</span>
                    <span className="font-bold text-slate-800">{viewingInvoice.term} ({viewingInvoice.academicYear})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Due Date</span>
                    <strong className="text-rose-700 font-bold">{viewingInvoice.dueDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Unique Payment Reference</span>
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {getUniquePaymentRef(viewingInvoice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Fee Breakdown */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  Fee Schedule & Breakdown
                </h4>
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Billed ({currency})</th>
                      <th className="py-2.5 px-3 text-right">Paid ({currency})</th>
                      <th className="py-2.5 px-3 text-right">Balance ({currency})</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingInvoice.items?.map((item, idx) => {
                      const itemAmt = Number(item.amount) || 0;
                      const itemPaid = Number(item.paidAmount) || 0;
                      const itemBal = Math.max(0, itemAmt - itemPaid);
                      const itemSt = item.status || (itemPaid >= itemAmt ? 'Paid' : itemPaid > 0 ? 'Partial' : 'Pending');

                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {item.title || (item as any).description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {currency}{itemAmt.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            {currency}{itemPaid.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                            {currency}{itemBal.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
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
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-slate-600">Total Billed:</td>
                      <td colSpan={2} className="py-2 px-3 text-right font-mono text-slate-900 font-black">
                        {currency}{(viewingInvoice.totalAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-emerald-700">Total Paid to Date:</td>
                      <td colSpan={2} className="py-2 px-3 text-right font-mono text-emerald-700">
                        {currency}{(viewingInvoice.paidAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="text-sm bg-indigo-50/50">
                      <td colSpan={3} className="py-3 px-3 font-black text-slate-950">Net Outstanding Balance:</td>
                      <td colSpan={2} className="py-3 px-3 text-right font-mono font-black text-indigo-950 text-base">
                        {currency}{(viewingInvoice.balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* School Bank & Payment Instructions */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Official School Payment Instructions</span>
                </h5>
                <p className="text-[11px] text-slate-600">
                  Please make payment to the authorized school bank account below. Ensure you include the unique payment reference in the transfer remarks/narration.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 font-sans uppercase font-bold block">Bank</span>
                    <span className="font-bold text-slate-900">{bankConfig.bankName}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 font-sans uppercase font-bold block">Account Name</span>
                    <span className="font-bold text-slate-900">{bankConfig.accountName}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 font-sans uppercase font-bold block">Account Number</span>
                    <span className="font-black text-indigo-900">{bankConfig.accountNumber}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                This is a computer-generated fee invoice issued by Zitel Castle School Bursary.
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60"
              >
                Close
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Print</span>
                </button>
                {viewingInvoice.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenPaymentInstruction(viewingInvoice)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5"
                  >
                    <span>Proceed to Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PAYMENT INSTRUCTION SCREEN (Requirements 32 & 33)                */}
      {/* ========================================================================= */}
      {paymentInstructionInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 my-6">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                  Zitel Castle School Payment Portal
                </span>
                <h3 className="text-lg font-black mt-0.5">MAKE PAYMENT NOW</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentInstructionInvoice(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Instruction Body */}
            <div className="p-6 space-y-5 text-slate-800">
              {/* Payment Summary Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 space-y-3">
                <div className="flex items-baseline justify-between border-b border-indigo-100/80 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due:</span>
                  <span className="text-2xl font-black text-indigo-950 font-mono">
                    {currency}{(paymentInstructionInvoice.balance || paymentInstructionInvoice.totalAmount).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Student:</span>
                    <strong className="text-slate-900">{student.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Class:</span>
                    <span className="font-bold text-slate-800">{student.className}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Term & Session:</span>
                    <span className="font-bold text-slate-800">{paymentInstructionInvoice.term}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice No:</span>
                    <span className="font-mono text-slate-700 font-bold">{paymentInstructionInvoice.invoiceNumber}</span>
                  </div>
                </div>
              </div>

              {/* Unique Payment Reference Box */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Payment Reference (Unique to this invoice):
                </span>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200">
                  <span className="font-mono font-black text-indigo-950 text-base tracking-wider">
                    {getUniquePaymentRef(paymentInstructionInvoice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getUniquePaymentRef(paymentInstructionInvoice), 'pay_ref')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center space-x-1"
                  >
                    {copiedKey === 'pay_ref' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pay_ref' ? 'Copied' : 'Copy Ref'}</span>
                  </button>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">School Account Name:</span>
                  <strong className="text-slate-900">{bankConfig.accountName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Bank:</span>
                  <strong className="text-slate-900">{bankConfig.bankName}</strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Account Number:</span>
                  <div className="flex items-center space-x-2">
                    <strong className="font-mono text-base font-black text-indigo-900">{bankConfig.accountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankConfig.accountNumber, 'acct_num_modal')}
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold"
                    >
                      {copiedKey === 'acct_num_modal' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Prominent Instruction Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-2 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-950">Make the payment using the reference above.</p>
                  <p className="text-[11px] text-blue-800">
                    Important: The system does <strong>NOT automatically mark the invoice as paid</strong> upon bank transfer. You must click the confirmation button below and upload your receipt.
                  </p>
                </div>
              </div>

              {/* Requirement 33: Explicit Confirmation Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentInstructionInvoice(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedToConfirmation(paymentInstructionInvoice)}
                  className="w-full flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-100 flex items-center justify-center space-x-2 text-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I HAVE MADE PAYMENT — CONFIRM PAYMENT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PAYMENT CONFIRMATION FORM & PROOF UPLOAD (Req 34 & 35)           */}
      {/* ========================================================================= */}
      {confirmationInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 my-6">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                  Bursary Verification Submission
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Payment & Upload Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmationInvoice(null)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitConfirmation} className="p-6 space-y-4">
              {/* Payment Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Reference *
                </label>
                <input
                  type="text"
                  required
                  value={confirmPaymentRef}
                  onChange={e => setConfirmPaymentRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black font-mono text-indigo-900 bg-indigo-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Unique reference generated for this payment request
                </span>
              </div>

              {/* Amount Paid & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount Paid ({currency}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={confirmationInvoice.balance || confirmationInvoice.totalAmount}
                    required
                    value={confirmAmount}
                    onChange={e => setConfirmAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Invoice Balance: {currency}{(confirmationInvoice.balance || confirmationInvoice.totalAmount).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Payment *
                  </label>
                  <input
                    type="date"
                    required
                    value={confirmDate}
                    onChange={e => setConfirmDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Payment Method & Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={confirmMethod}
                    onChange={e => setConfirmMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (Mobile App / USSD)</option>
                    <option value="Direct Bank Deposit">Direct Bank Deposit / Teller</option>
                    <option value="Online Card Payment">Online Card Payment</option>
                    <option value="POS Terminal">POS Terminal</option>
                    <option value="Cheque">Bank Draft / Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Optional Txn / Session Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 000013260826"
                    value={confirmTxnRef}
                    onChange={e => setConfirmTxnRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Account Holder / Depositor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Depositor / Payer Account Name
                </label>
                <input
                  type="text"
                  required
                  value={confirmAccountHolder}
                  onChange={e => setConfirmAccountHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              {/* Requirement 35: Upload Proof of Payment (Image / JPG / PNG / PDF) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Upload Proof of Payment (Image, JPG, PNG, PDF) *
                </label>

                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl cursor-pointer transition-all text-center">
                  <UploadCloud className="w-6 h-6 text-indigo-500 mb-1" />
                  <span className="text-xs font-bold text-indigo-950">
                    {confirmProofFileName || 'Click or drag receipt / debit alert screenshot'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Accepts JPG, PNG, PDF receipts up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Quick Sample Selector for Instant Verification Testing */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Or select pre-formatted test receipt:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectSampleReceipt('zenith')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      + Zenith App Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleReceipt('gtbank')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      + GTBank NIP Teller
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleReceipt('teller')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      + Bank Deposit Slip PDF
                    </button>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {submissionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Payment submitted for verification. Status: PENDING VERIFICATION</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmationInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionSuccess}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Submit for Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL PAYMENT RECEIPT (Requirement 39)                        */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 my-6">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Official School Receipt
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-8 space-y-5 text-slate-800 relative overflow-hidden" id="printable-receipt">
              {/* Watermark Seal */}
              <div className="absolute right-4 bottom-12 opacity-5 pointer-events-none font-black text-8xl text-indigo-900 select-none">
                PAID
              </div>

              {/* School Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white font-black flex items-center justify-center mx-auto text-xl shadow-md mb-1">
                  ZCS
                </div>
                <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  {profile.name || 'ZITEL CASTLE SCHOOL'}
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  {branchName}
                </p>
                <p className="text-[10px] text-slate-500">
                  {profile.address} • Tel: {profile.phone}
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest">
                  OFFICIAL BURSARY RECEIPT
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Receipt Number:</span>
                  <span className="font-mono font-black text-indigo-950 text-sm">
                    {viewingReceipt.receiptNumber || 'ZCS-RCP-2026-1044'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Reference:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {viewingReceipt.paymentReference || viewingReceipt.transactionRef}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <strong className="text-slate-900">{student.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student ID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {student.schoolId || student.admissionNumber || student.studentId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Class:</span>
                  <span className="font-bold text-slate-800">{student.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Parent / Guardian:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.parentName || currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Academic Session & Term:</span>
                  <span className="font-bold text-slate-800">
                    {viewingReceipt.term || 'First Term'} ({viewingReceipt.academicYear || '2025/2026'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Date:</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {new Date(viewingReceipt.paidAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span className="font-bold text-slate-800">{viewingReceipt.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200 bg-emerald-50/50 p-2.5 rounded-xl mt-2">
                  <span className="text-emerald-950 font-black text-sm uppercase">Total Amount Paid:</span>
                  <span className="font-mono font-black text-lg text-emerald-700">
                    {currency}{(viewingReceipt.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Authorized Approval Stamp */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div>
                  <span className="font-bold text-slate-700 block">Authorized Bursar Approval:</span>
                  <span>{viewingReceipt.verifiedBy || viewingReceipt.receivedBy || 'Mrs. Victoria Hawthorne (Bursar)'}</span>
                  <div className="text-[9px] text-emerald-700 font-bold mt-0.5 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Reconciled & Digitally Signed</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-20 h-10 border border-dashed border-emerald-600 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-800 font-black text-[9px] uppercase tracking-wider">
                    OFFICIAL STAMP
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrintDocument}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD RECEIPT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
