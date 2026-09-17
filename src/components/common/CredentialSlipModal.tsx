import React, { useState } from 'react';
import {
  ShieldCheck,
  Printer,
  Copy,
  Check,
  Lock,
  Download,
  X,
  School,
  Building2,
  Calendar,
  User as UserIcon,
  Key,
  Info,
  Send,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { CredentialSlip, CredentialDeliveryStatus } from '../../types';
import { db } from '../../services/db';

interface CredentialSlipModalProps {
  credentialSlip: CredentialSlip;
  onClose: () => void;
}

export const CredentialSlipModal: React.FC<CredentialSlipModalProps> = ({
  credentialSlip,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [currentSlip, setCurrentSlip] = useState<CredentialSlip>(credentialSlip);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryFeedback, setDeliveryFeedback] = useState<string | null>(null);
  const schoolProfile = db.getSchoolProfile();

  const handleCopy = () => {
    const text = `ZITEL CASTLE SCHOOL - AUTHORIZED CREDENTIAL SLIP
--------------------------------------------------
Recipient: ${currentSlip.name}
Role: ${currentSlip.roleTitle || currentSlip.role}
Branch: ${currentSlip.branchName}
School ID: ${currentSlip.schoolId}
Temporary Password: ${currentSlip.temporaryPassword}
Verification Status: Institutional Account Verified
Issued By: ${currentSlip.issuedByAdminName || 'Institutional Administration'}
Date: ${new Date(currentSlip.issuedAt).toLocaleString()}
--------------------------------------------------
NOTICE: On initial login, you will be prompted to create your permanent password.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    // Record printed voucher delivery
    db.recordCredentialDelivery({
      recipientUserId: currentSlip.userId,
      recipientName: currentSlip.name,
      recipientRole: currentSlip.role,
      channel: 'PRINT_SLIP',
      destination: 'Physical Printed Voucher Slip',
      status: 'DELIVERED',
      schoolId: currentSlip.schoolId,
      branchId: currentSlip.branchId,
      initiatedByAdminName: currentSlip.issuedByAdminName
    });
    window.print();
  };

  const handleDownload = () => {
    const text = `=====================================================
ZITEL CASTLE SCHOOL - OFFICIAL CREDENTIAL SLIP
=====================================================
Recipient Name:      ${currentSlip.name}
Institutional Role:  ${currentSlip.roleTitle || currentSlip.role}
Assigned Branch:     ${currentSlip.branchName}
Official School ID:  ${currentSlip.schoolId}
Temporary Password:  ${currentSlip.temporaryPassword}
Account Status:      Institutional Profile Active & Secured

Issued By:           ${currentSlip.issuedByAdminName || 'School Administration'}
Issue Timestamp:     ${new Date(currentSlip.issuedAt).toLocaleString()}

INSTRUCTIONS:
1. Navigate to the Zitel Castle School portal.
2. Sign in using your Official School ID and Temporary Password.
3. You will immediately be prompted to create a secure personal password.
=====================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZCS_Credentials_${currentSlip.schoolId.replace(/\//g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRetryDispatch = (channel: 'WHATSAPP' | 'SMS' | 'EMAIL') => {
    setIsDelivering(true);
    setDeliveryFeedback(null);
    try {
      const user = db.getUsers().find(u => u.id === currentSlip.userId);
      const destination =
        channel === 'WHATSAPP'
          ? user?.whatsApp || user?.phone || '+234 800 000 0000'
          : channel === 'SMS'
          ? user?.phone || '+234 800 000 0000'
          : user?.email || 'user@example.com';

      const messagingConfig = db.getMessagingConfig();
      const isConfigured =
        (channel === 'WHATSAPP' && messagingConfig.whatsAppConfigured) ||
        (channel === 'SMS' && messagingConfig.smsConfigured) ||
        (channel === 'EMAIL' && messagingConfig.emailConfigured);

      const status: CredentialDeliveryStatus = isConfigured ? 'DELIVERED' : 'FAILED';
      const errorMessage = isConfigured
        ? undefined
        : `${channel} gateway is not connected. Physical printed voucher slip generated.`;

      const res = db.recordCredentialDelivery({
        recipientUserId: currentSlip.userId,
        recipientName: currentSlip.name,
        recipientRole: currentSlip.role,
        channel,
        destination,
        status,
        errorMessage,
        schoolId: currentSlip.schoolId,
        branchId: currentSlip.branchId,
        initiatedByAdminName: currentSlip.issuedByAdminName
      });

      if (res.status === 'DELIVERED' || res.status === 'Delivered') {
        setCurrentSlip(prev => ({
          ...prev,
          deliveryStatus: 'DELIVERED',
          deliveryChannel: channel,
          deliveryError: undefined
        }));
        setDeliveryFeedback(`Successfully dispatched via ${channel} to ${destination}`);
      } else {
        setCurrentSlip(prev => ({
          ...prev,
          deliveryStatus: 'FAILED',
          deliveryChannel: channel,
          deliveryError: res.errorMessage || errorMessage
        }));
        setDeliveryFeedback(res.errorMessage || errorMessage || `Failed to dispatch via ${channel}. Using printed slip fallback.`);
      }
    } catch (err: any) {
      setDeliveryFeedback(err.message || 'Dispatch error');
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Official Credential Slip</h3>
              <p className="text-xs text-indigo-200">Firebase Authentication & Identity Provisioning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Credential Body */}
        <div className="p-6 space-y-5 print:p-0">
          {/* Delivery Status Banner */}
          {currentSlip.deliveryStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                currentSlip.deliveryStatus === 'DELIVERED'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : currentSlip.deliveryStatus === 'FAILED'
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                {currentSlip.deliveryStatus === 'DELIVERED' ? (
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    Delivery: {currentSlip.deliveryStatus} via {currentSlip.deliveryChannel || 'PHYSICAL SLIP'}
                  </span>
                  {currentSlip.deliveryError && (
                    <p className="text-[11px] text-amber-800 mt-0.5">{currentSlip.deliveryError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {deliveryFeedback && (
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
              {deliveryFeedback}
            </div>
          )}

          {/* School Badge & Header */}
          <div className="text-center border-b border-slate-100 pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-2">
              <School className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wide">
              {schoolProfile.name || 'Zitel Castle School'}
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Authorized Account Access Voucher • {currentSlip.branchName}
            </p>
          </div>

          {/* User Details Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Account Holder:
              </span>
              <span className="font-bold text-slate-900">{currentSlip.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Assigned Branch:
              </span>
              <span className="font-semibold text-slate-800">{currentSlip.branchName}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Assigned Role:
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {currentSlip.roleTitle || currentSlip.role}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Institutional Account:</span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Verified & Active
              </span>
            </div>
          </div>

          {/* Key Credentials Box */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-4 space-y-3 shadow-md">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">
                Official School ID (Username)
              </div>
              <div className="font-mono text-base sm:text-lg font-extrabold text-white tracking-wide bg-slate-800/80 px-3 py-1.5 rounded-lg border border-indigo-500/40 select-all">
                {currentSlip.schoolId}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1 flex items-center justify-between">
                <span>Temporary Access Password</span>
                <span className="text-[10px] text-amber-300 font-normal">Must change on 1st login</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center justify-between select-all">
                <span>{currentSlip.temporaryPassword}</span>
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Digital Gateway Dispatch Trigger */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              Direct Gateway Delivery Dispatch
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isDelivering}
                onClick={() => handleRetryDispatch('WHATSAPP')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Send WhatsApp</span>
              </button>
              <button
                type="button"
                disabled={isDelivering}
                onClick={() => handleRetryDispatch('SMS')}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Send SMS</span>
              </button>
              <button
                type="button"
                disabled={isDelivering}
                onClick={() => handleRetryDispatch('EMAIL')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Send Email</span>
              </button>
            </div>
          </div>

          {/* Security Instruction Note */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Administrative Handover:</strong> Hand this slip or transmit its contents securely to the authorized user. If no messaging integration gateway is activated, delivery records will log as "Failed / Fallback to Slip" without misrepresenting false delivery.
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(currentSlip.issuedAt).toLocaleDateString()}
            </span>
            <span>Issued by: <strong>{currentSlip.issuedByAdminName || 'Super Admin'}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Slip' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Slip</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
