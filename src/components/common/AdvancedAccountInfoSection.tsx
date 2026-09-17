import React, { useState } from 'react';
import { ShieldAlert, Key, Copy, Check, Eye, EyeOff, Terminal, Info } from 'lucide-react';
import { UserRole } from '../../types';

interface AdvancedAccountInfoSectionProps {
  currentUserRole?: UserRole;
  targetUser: {
    id: string;
    name?: string;
    fullName?: string;
    role?: string;
    accountType?: string;
    schoolId?: string;
    studentId?: string;
    staffId?: string;
    firebaseUid?: string;
    email?: string;
    username?: string;
    createdAt?: string;
  };
  compact?: boolean;
}

export const AdvancedAccountInfoSection: React.FC<AdvancedAccountInfoSectionProps> = ({
  currentUserRole,
  targetUser,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUid, setShowUid] = useState(false);
  const [copied, setCopied] = useState(false);

  // STRICT REQUIREMENT: Only authorized Super Admins may see the internal ID section
  if (currentUserRole !== 'SUPER_ADMIN') {
    return null;
  }

  const effectiveUid = targetUser.firebaseUid || targetUser.id;
  const effectiveSchoolId = targetUser.schoolId || targetUser.staffId || targetUser.studentId || targetUser.username || 'Unassigned';
  const displayName = targetUser.fullName || targetUser.name || 'Account Holder';

  const handleCopyUid = () => {
    if (effectiveUid) {
      navigator.clipboard.writeText(effectiveUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-100 hover:bg-slate-200/80 transition-colors text-left font-bold text-slate-700 cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-bold text-slate-800">
            Advanced Account Information
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
            Super Admin Only
          </span>
        </div>
        <span className="text-slate-400 text-xs">
          {isOpen ? '▲ Hide' : '▼ View Internal Diagnostics'}
        </span>
      </button>

      {isOpen && (
        <div className="p-3.5 space-y-3 bg-white border-t border-slate-200 animate-in fade-in duration-100">
          <div className="flex items-start space-x-2 p-2 bg-purple-50/70 border border-purple-100 rounded-lg text-[11px] text-purple-900">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Technical Support Diagnostic:</strong> Firebase UIDs are strictly retained for cryptographic session authorization. All human-facing interfaces, transcripts, and ID cards display only the institutional <strong>School ID</strong>.
            </p>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100 gap-1">
              <span className="text-slate-500 font-medium">Public School ID:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {effectiveSchoolId}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100 gap-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-600" />
                <span>Internal Firebase Auth UID:</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 select-all">
                  {showUid ? effectiveUid : (effectiveUid.length > 8 ? `${effectiveUid.substring(0, 6)}••••••••${effectiveUid.slice(-4)}` : '••••••••••••')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowUid(!showUid)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                  title={showUid ? 'Mask UID' : 'Reveal UID'}
                >
                  {showUid ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  title="Copy Firebase UID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100 gap-1">
              <span className="text-slate-500 font-medium">Internal Record Key:</span>
              <span className="font-mono text-slate-600 text-[10px]">
                {targetUser.id}
              </span>
            </div>

            {targetUser.email && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <span className="text-slate-500 font-medium">Authentication Email:</span>
                <span className="text-slate-700 font-mono text-[10px]">
                  {targetUser.email}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
