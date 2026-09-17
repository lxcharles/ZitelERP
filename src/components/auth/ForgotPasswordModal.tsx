import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  X,
  School,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { db } from '../../services/db';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<{
    submitted: boolean;
    message: string;
    maskedEmail?: string;
    maskedPhone?: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    const res = db.requestPasswordReset(identifier);
    setResult({
      submitted: true,
      message: res.message,
      maskedEmail: res.maskedEmail,
      maskedPhone: res.maskedPhone
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Credentials Recovery</h3>
              <p className="text-xs text-indigo-200">Zitel Castle School Access Assistance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!result?.submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Enter your official <strong>School ID</strong> (e.g. <span className="font-mono font-bold text-indigo-600">ZCS/BUN/TCH/00001</span> or <span className="font-mono font-bold text-indigo-600">ZCS/PAR/00001</span>) or institutional email.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School ID or Institutional Email
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. ZCS/BUN/TCH/00001 or name@zitelcastle.edu.ng"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase"
                />
              </div>

              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 flex items-start gap-2.5 text-[11px] text-indigo-900">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Because accounts are authorized exclusively through branch administration, staff and student password resets can also be re-issued instantly by your Branch Administrator.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Request Verification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Recovery Instructions Initiated</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {result.message}
              </p>

              {result.maskedEmail && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" /> Registered Email:
                    </span>
                    <span className="font-mono font-bold">{result.maskedEmail}</span>
                  </div>
                  {result.maskedPhone && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" /> Registered Phone:
                      </span>
                      <span className="font-mono font-bold">{result.maskedPhone}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
