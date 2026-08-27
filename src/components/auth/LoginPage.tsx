import React, { useState } from 'react';
import {
  School,
  ShieldCheck,
  GraduationCap,
  Heart,
  Smile,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { db } from '../../services/db';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('superadmin@oakridge.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const school = db.getSchoolProfile();
  const allUsers = db.getUsers();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = db.login(emailOrUsername);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      db.setCurrentUser(user.id);
      db.addAuditLog(user.id, user.name, user.role, 'LOGIN', 'User', user.id, `1-Click demo authentication`);
      onLoginSuccess(user);
    }
  };

  const quickRoles = [
    {
      id: 'user_superadmin_01',
      title: 'Super Admin',
      name: 'Dr. Eleanor Vance',
      role: 'SUPER_ADMIN',
      desc: 'Master institutional oversight, RBAC governance, branch & policy controls',
      icon: ShieldCheck,
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'user_admin_marcus',
      title: 'Academic Administrator',
      name: 'Marcus Sterling',
      role: 'ADMIN',
      desc: 'Onboard faculty, manage classes, timetable & curriculum',
      icon: Shield,
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      id: 'user_admin_clara',
      title: 'Finance Administrator',
      name: 'Clara Oswald',
      role: 'ADMIN',
      desc: 'Fee structures, invoices, payment receipts & ledger',
      icon: Shield,
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'user_teacher_sarah',
      title: 'Class Teacher',
      name: 'Sarah Jenkins',
      role: 'TEACHER',
      desc: 'Classroom management, attendance, gradebook, lesson notes & planner',
      icon: GraduationCap,
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'user_parent_elena',
      title: 'Parent / Guardian',
      name: 'Elena Rodriguez',
      role: 'PARENT',
      desc: 'Multi-child switcher, growth charts, grades & fees',
      icon: Heart,
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'user_student_leo',
      title: 'Primary Student',
      name: 'Leo Rodriguez',
      role: 'STUDENT',
      desc: 'Homework, timetable, reward stars & practice quizzes',
      icon: Smile,
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/20 ring-4 ring-white/10 mb-4">
          <School className="w-9 h-9" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
          {school.name}
        </h2>
        <p className="mt-1 text-xs text-indigo-200 font-medium">
          Primary School Enterprise Operating System & Academic Terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left: 1-Click Role Exploration */}
        <div className="lg:col-span-7 bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Instant 1-Click Role Sandbox</span>
              </h3>
              <p className="text-xs text-slate-400">Select any authorized account to explore full workflows:</p>
            </div>
            <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700/50">
              5 Authorized Tiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickRoles.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleQuickLogin(item.id)}
                  className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-700/90 border border-slate-700 hover:border-indigo-500 text-left transition-all duration-150 flex flex-col justify-between group shadow-xs cursor-pointer"
                >
                  <div className="flex items-start justify-between w-full mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-white group-hover:text-indigo-300">
                        {item.name}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${item.badge}`}>
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Traditional Credentials Form */}
        <div className="lg:col-span-5 bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Standard Sign In</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter username or institutional email to access your personal dashboard.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 mb-4 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email or Username</label>
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Authenticate Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-400">
              Session Protected by Role-Based Access Controls (RBAC)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
