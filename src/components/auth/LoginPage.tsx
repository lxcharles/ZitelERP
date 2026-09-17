import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  KeyRound
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const school = db.getSchoolProfile();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your School ID or registered username.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = db.login(identifier, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed. Please verify your School ID or password.');
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* School Crest / Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-2xl shadow-indigo-500/20 ring-4 ring-white/10 mb-4 transform hover:scale-105 transition-transform duration-200">
            <img
              src={school.logo || 'https://res.cloudinary.com/dehvk3bre/image/upload/v1782745354/20260304_140255_weozqy.png'}
              alt={school.name || 'Zitel Castle School Logo'}
              className="h-14 sm:h-16 w-auto max-w-[220px] object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display uppercase">
            {school.name || 'ZITEL CASTLE SCHOOL'}
          </h1>
          <p className="mt-1 text-xs text-indigo-300 font-medium tracking-wide">
            School Management and Academic Operations System
          </p>

          {/* Institutional Security Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Authentication • Authorized Access Only</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-7 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Official Institutional Sign In</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your official School ID issued by the Administration or registered username.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                School ID / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. ZCS/SA/00001 or ZCS/BUN/TCH/00001"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase transition-all placeholder:normal-case placeholder:font-sans placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <span>{loading ? 'Authenticating...' : 'LOGIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Branch Footnote & Institutional Access Notice */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Multi-Branch Governance: Bungalow & Ijegun Branches</span>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Institutional policy forbids open self-registration. Credentials are provisioned exclusively through authorized branch administration.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
};
