import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';

interface FirstTimePasswordModalProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
  onCancel?: () => void;
}

export const FirstTimePasswordModal: React.FC<FirstTimePasswordModalProps> = ({
  user,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumberOrSymbol && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please ensure your password satisfies all security requirements.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = db.changePassword(user.id, user.temporaryPassword || '', newPassword);
      if (res.success) {
        const refreshedUser = db.getCurrentUser();
        if (refreshedUser) {
          onPasswordChanged(refreshedUser);
        } else {
          onPasswordChanged({ ...user, mustChangePassword: false, isTemporaryPassword: false, temporaryPassword: undefined });
        }
      } else {
        setError(res.error || 'Failed to update credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-amber-300" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight font-display">
            Set Your Permanent Password
          </h3>
          <p className="text-xs text-indigo-200 mt-1 max-w-xs mx-auto">
            You are logging in with a temporary access token for School ID <span className="font-mono font-bold text-white">{user.schoolId || user.username}</span>.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Permanent Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter strong password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Realtime Password Strength Criteria */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-600">Password Security Requirements:</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>1 uppercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasLowercase ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>1 lowercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumberOrSymbol ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>1 number or symbol</span>
              </div>
            </div>

            {confirmPassword.length > 0 && (
              <div className={`flex items-center gap-1.5 text-[11px] pt-1 border-t border-slate-200 ${passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-medium'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-500' : 'text-rose-400'}`} />
                <span>{passwordsMatch ? 'Passwords match perfectly' : 'Passwords do not match'}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
              isFormValid && !loading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-indigo-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Securing Account...' : 'Activate Permanent Credentials'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
