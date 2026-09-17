import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  FileSpreadsheet,
  Sliders,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Clock,
  CalendarCheck,
  Award,
  ClipboardList,
  Calendar,
  Smile,
  Sparkles,
  Layers,
  BookOpen,
  X,
  ChevronUp,
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { isDirector, isSuperAdmin } from '../../utils/roles';

interface FloatingBottomNavProps {
  currentUser: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Unread messages count for badges
  const unreadMessagesCount = React.useMemo(() => {
    try {
      const msgs = db.getMessages({ recipientId: currentUser.id });
      return msgs.filter(m => !m.read).length;
    } catch {
      return 0;
    }
  }, [currentUser.id]);

  // Pending payments count for admin/director
  const pendingPaymentsCount = React.useMemo(() => {
    try {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DIRECTOR') {
        return db.getPayments(currentUser).filter(p => p.status === 'PENDING_VERIFICATION').length;
      }
      return 0;
    } catch {
      return 0;
    }
  }, [currentUser]);

  // Primary destinations per role
  const getPrimaryNavItems = () => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return [
          { id: 'overview', label: 'Executive', icon: LayoutDashboard },
          { id: 'branches', label: 'Branches', icon: Building2 },
          { id: 'finance', label: 'Finance', icon: DollarSign, badge: pendingPaymentsCount },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
          { id: 'settings', label: 'Settings', icon: Sliders },
        ];

      case 'DIRECTOR':
        return [
          { id: 'overview', label: 'Home', icon: LayoutDashboard },
          { 
            id: 'class_evaluation', 
            label: 'School', 
            icon: BarChart3,
            matchTabs: ['class_evaluation', 'staff_performance', 'students', 'classes', 'academics', 'attendance'] 
          },
          { id: 'finance', label: 'Finance', icon: DollarSign, badge: pendingPaymentsCount, matchTabs: ['finance', 'financial_dashboard'] },
          { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadMessagesCount },
          { id: 'profile', label: 'Profile', icon: ShieldCheck },
        ];

      case 'ADMIN': {
        const isBursar = currentUser.scope === 'FINANCE_ONLY' || Boolean(currentUser.customRoleTitle?.toLowerCase().includes('bursar'));
        if (isBursar) {
          return [
            { id: 'overview', label: 'Bursary', icon: LayoutDashboard },
            { id: 'finance', label: 'Invoices', icon: DollarSign, badge: pendingPaymentsCount },
            { id: 'financial_dashboard', label: 'Analytics', icon: BarChart3 },
            { id: 'announcements', label: 'Broadcasts', icon: MessageSquare },
            { id: 'profile', label: 'Profile', icon: ShieldCheck },
          ];
        }
        return [
          { id: 'overview', label: 'Home', icon: LayoutDashboard },
          { id: 'students', label: 'Directory', icon: Users, matchTabs: ['students', 'classes', 'teachers'] },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'announcements', label: 'Broadcasts', icon: MessageSquare },
          { id: 'profile', label: 'Profile', icon: ShieldCheck },
        ];
      }

      case 'TEACHER':
        return [
          { id: 'overview', label: 'Classroom', icon: LayoutDashboard },
          { id: 'timetable', label: 'Timetable', icon: Clock },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'gradebook', label: 'Scores', icon: Award, matchTabs: ['gradebook', 'assignments', 'weighting', 'lesson_notes'] },
          { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
        ];

      case 'PARENT':
        return [
          { id: 'overview', label: 'Children', icon: LayoutDashboard },
          { id: 'growth_analytics', label: 'Academics', icon: Award, matchTabs: ['growth_analytics', 'report_cards', 'attendance'] },
          { id: 'fees', label: 'Fees', icon: DollarSign },
          { id: 'messages', label: 'Teacher Chat', icon: MessageSquare, badge: unreadMessagesCount },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
        ];

      case 'STUDENT':
        return [
          { id: 'overview', label: 'My Space', icon: Smile },
          { id: 'my_schedule', label: 'Timetable', icon: Calendar },
          { id: 'my_homework', label: 'Homework', icon: ClipboardList },
          { id: 'my_grades', label: 'Grades', icon: Award },
          { id: 'practice_quiz', label: 'Quiz', icon: Sparkles },
        ];

      default:
        return [{ id: 'overview', label: 'Home', icon: LayoutDashboard }];
    }
  };

  // Secondary destinations for "More" modal (to guarantee 100% feature reachability on mobile)
  const getAllRoleTabs = () => {
    switch (currentUser.role) {
      case 'DIRECTOR':
        return [
          { id: 'overview', label: 'Director Overview', icon: LayoutDashboard },
          { id: 'class_evaluation', label: 'Class Evaluation & Health', icon: BarChart3 },
          { id: 'staff_performance', label: 'Staff Performance & Activity', icon: GraduationCap },
          { id: 'admins', label: 'Branch Administrators', icon: ShieldCheck },
          { id: 'teachers', label: 'Teacher Operations', icon: GraduationCap },
          { id: 'students', label: 'Student Directory', icon: Users },
          { id: 'classes', label: 'Classes & Sections', icon: Layers },
          { id: 'curriculum', label: 'Curriculum & Subjects', icon: BookOpen },
          { id: 'attendance', label: 'Attendance Oversight', icon: CalendarCheck },
          { id: 'academics', label: 'Academic Performance', icon: Award },
          { id: 'reports', label: 'Academic & Weekly Reports', icon: FileSpreadsheet },
          { id: 'calendar', label: 'Institutional Calendar', icon: Calendar },
          { id: 'timetable', label: 'Timetable Scheduler', icon: Clock },
          { id: 'finance', label: 'Fees & Invoicing Ledger', icon: DollarSign },
          { id: 'financial_dashboard', label: 'Financial Analytics', icon: BarChart3 },
          { id: 'promotion', label: 'Student Promotion', icon: Sparkles },
          { id: 'archives', label: 'Academic Archives', icon: BookOpen },
          { id: 'chat', label: 'ZITEL CHAT ROOM', icon: MessageSquare },
          { id: 'announcements', label: 'School Broadcasts', icon: MessageSquare },
          { id: 'audit_logs', label: 'Institutional Audit Log', icon: ShieldCheck },
          { id: 'profile', label: 'Director Profile & Security', icon: ShieldCheck },
        ];
      case 'SUPER_ADMIN':
        return [
          { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
          { id: 'class_evaluation', label: 'Class Evaluation & Health', icon: BarChart3 },
          { id: 'branches', label: 'Branches & Locations', icon: Building2 },
          { id: 'admins', label: 'Admin Management', icon: ShieldCheck },
          { id: 'teachers', label: 'Teaching Staff & Teachers', icon: GraduationCap },
          { id: 'students', label: 'Student Directory', icon: Users },
          { id: 'classes', label: 'Classes & Structure', icon: Layers },
          { id: 'academics', label: 'Academic & Curriculum', icon: BookOpen },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'attendance', label: 'School Attendance', icon: CalendarCheck },
          { id: 'reports', label: 'Report Cards & Transcripts', icon: FileSpreadsheet },
          { id: 'finance', label: 'Fees & Finance Ledger', icon: DollarSign },
          { id: 'ai_center', label: 'AI Governance Center', icon: Sparkles },
          { id: 'audit_logs', label: 'Institutional Audit Log', icon: ShieldCheck },
          { id: 'settings', label: 'School Branding & Config', icon: Sliders },
        ];
      case 'TEACHER':
        return [
          { id: 'overview', label: 'Classroom', icon: LayoutDashboard },
          { id: 'timetable', label: 'Timetable & Schedule', icon: Clock },
          { id: 'daily_diary', label: 'Daily Diary', icon: BookOpen },
          { id: 'topic_completion', label: 'Topic Completion & Syllabus', icon: Award },
          { id: 'lesson_notes', label: 'Lesson Notes', icon: BookOpen },
          { id: 'lesson_planner', label: 'Lesson Planner', icon: Calendar },
          { id: 'attendance', label: 'Attendance Register', icon: CalendarCheck },
          { id: 'gradebook', label: 'Continuous Assessments', icon: Award },
          { id: 'assignments', label: 'Homework & Tasks', icon: ClipboardList },
          { id: 'students', label: 'Student Directory', icon: Users },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'messages', label: 'Parent Messages', icon: MessageSquare },
          { id: 'report_cards', label: 'Report Cards', icon: FileSpreadsheet },
        ];
      default:
        return [];
    }
  };

  const primaryItems = getPrimaryNavItems();
  const allTabs = getAllRoleTabs();

  // Check if an item is currently active
  const isItemActive = (item: any) => {
    if (activeTab === item.id) return true;
    if (item.matchTabs && item.matchTabs.includes(activeTab)) return true;
    return false;
  };

  return (
    <>
      {/* Floating Pill Navigation Bar */}
      <nav
        id="zitel-floating-bottom-nav"
        aria-label="Floating Navigation Bar"
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-1.5rem)] sm:w-auto px-2 sm:px-2.5 py-1.5 sm:py-2 bg-slate-950/90 text-white backdrop-blur-2xl border border-white/15 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.45)] flex items-center justify-between sm:justify-center gap-1 sm:gap-2 no-print select-none transition-all duration-300"
      >
        {primaryItems.map(item => {
          const Icon = item.icon;
          const active = isItemActive(item);

          if (active) {
            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className="bg-white text-slate-950 shadow-md font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap transition-all duration-300 ease-out transform scale-100 cursor-pointer shrink-0"
              >
                <Icon className="w-4 h-4 text-slate-950 shrink-0" />
                <span className="tracking-tight">{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center justify-center relative cursor-pointer active:scale-95 shrink-0"
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              {Boolean(item.badge && item.badge > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 border border-slate-950" />
              )}
            </button>
          );
        })}

        {/* More Modules Trigger (Desktop & Mobile accessible drawer) */}
        {allTabs.length > 5 && (
          <button
            id="bottom-nav-more-modules"
            onClick={() => setShowMoreMenu(prev => !prev)}
            className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${
              showMoreMenu
                ? 'bg-purple-600/30 text-purple-300 border border-purple-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="All System Modules"
            aria-label="All System Modules"
          >
            <ChevronUp className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${showMoreMenu ? 'rotate-180 text-purple-300' : ''}`} />
          </button>
        )}
      </nav>

      {/* Quick All-Modules Drawer Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-end justify-center p-3 sm:p-6 no-print animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">All Modules & Sections</h3>
                  <p className="text-[11px] text-slate-500">Fast navigation for {currentUser.name} ({currentUser.role})</p>
                </div>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allTabs.map(t => {
                const Icon = t.icon;
                const isCurrent = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTab(t.id);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center space-x-2.5 p-3 rounded-2xl text-left text-xs font-semibold transition-all border ${
                      isCurrent
                        ? 'bg-purple-50 text-purple-950 border-purple-200 shadow-2xs font-bold'
                        : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 border-slate-200/60 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
