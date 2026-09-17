import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  Sparkles,
  ShieldCheck,
  Sliders,
  History,
  MessageSquare,
  ClipboardList,
  Layers,
  Heart,
  Baby,
  Smile,
  Building2,
  BarChart3,
  Tag,
  RotateCcw,
  Archive,
  TrendingUp,
  CheckCircle2,
  BookMarked
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { db } from '../../services/db';
import { isDirector, isSuperAdmin } from '../../utils/roles';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
}) => {
  // Check for pending verification requests for admin (RBAC aware)
  const pendingPaymentsCount = (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')
    ? db.getPayments(currentUser).filter(p => p.status === 'PENDING_VERIFICATION').length
    : 0;

  // Check for overdue or due fees for parents (RBAC aware)
  const parentHasDueFees = currentUser.role === 'PARENT'
    ? db.getInvoices(currentUser).some(i => i.balance > 0)
    : false;

  const getNavItems = () => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return [
          { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
          { id: 'class_evaluation', label: 'Class Evaluation & Health', icon: BarChart3 },
          { id: 'branches', label: 'Branches & Locations', icon: Building2 },
          { id: 'admins', label: 'Admin Management', icon: ShieldCheck },
          { id: 'teachers', label: 'Teaching Staff & Teachers', icon: GraduationCap },
          { id: 'students', label: 'Student Directory', icon: Users },
          { id: 'parents', label: 'Parent Registry', icon: Heart },
          { id: 'classes', label: 'Classes & Structure', icon: Layers },
          { id: 'academics', label: 'Academic & Curriculum', icon: BookOpen },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'attendance', label: 'School Attendance', icon: CalendarCheck },
          { id: 'reports', label: 'Report Cards & Transcripts', icon: FileSpreadsheet },
          {
            id: 'finance',
            label: 'Fees & Finance Ledger',
            icon: DollarSign,
            badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Pending` : undefined,
          },
          { id: 'ai_center', label: 'AI Governance Center', icon: Sparkles },
          { id: 'audit_logs', label: 'Institutional Audit Log', icon: History },
          { id: 'settings', label: 'School Branding & Config', icon: Sliders },
        ];

      case 'DIRECTOR':
        return [
          { id: 'overview', label: 'Director Overview', icon: LayoutDashboard },
          { id: 'class_evaluation', label: 'Class Evaluation & Health', icon: BarChart3 },
          { id: 'staff_performance', label: 'Staff Performance & Activity', icon: TrendingUp },
          { id: 'admins', label: 'Branch Administrators', icon: ShieldCheck },
          { id: 'teachers', label: 'Teacher Operations', icon: GraduationCap },
          { id: 'students', label: 'Student Directory', icon: Users },
          { id: 'classes', label: 'Classes & Sections', icon: Layers },
          { id: 'curriculum', label: 'Curriculum & Subjects', icon: BookOpen },
          { id: 'attendance', label: 'Attendance Oversight', icon: CalendarCheck },
          { id: 'academics', label: 'Academic Performance', icon: Award },
          { id: 'reports', label: 'Academic & Weekly Reports', icon: FileSpreadsheet },
          { id: 'calendar', label: 'Institutional Calendar', icon: Calendar },
          { id: 'timetable', label: 'Timetable Scheduler', icon: Calendar },
          {
            id: 'finance',
            label: 'Fees & Invoicing Ledger',
            icon: DollarSign,
            badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Pending` : undefined,
          },
          { id: 'financial_dashboard', label: 'Financial Analytics', icon: BarChart3 },
          { id: 'promotion', label: 'Student Promotion', icon: Sparkles },
          { id: 'archives', label: 'Academic Archives', icon: Archive },
          { id: 'chat', label: 'ZITEL CHAT ROOM', icon: MessageSquare },
          { id: 'announcements', label: 'School Broadcasts', icon: MessageSquare },
          { id: 'audit_logs', label: 'Institutional Audit Log', icon: History },
          { id: 'profile', label: 'Director Profile & Security', icon: ShieldCheck },
        ];

      case 'ADMIN': {
        const perms = currentUser.permissions || [];
        const isBursar = currentUser.scope === 'FINANCE_ONLY' || Boolean(currentUser.customRoleTitle?.toLowerCase().includes('bursar'));

        if (isBursar) {
          return [
            { id: 'overview', label: 'Bursary Overview', icon: LayoutDashboard },
            { id: 'financial_dashboard', label: 'Financial Analytics', icon: BarChart3 },
            {
              id: 'finance',
              label: 'Fees & Invoicing Ledger',
              icon: DollarSign,
              badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Pending` : undefined,
            },
            { id: 'fee_categories', label: 'Fee Categories', icon: Tag },
            { id: 'fee_discounts', label: 'Discounts & Concessions', icon: Sparkles },
            { id: 'fee_refunds', label: 'Refunds & Reversals', icon: RotateCcw },
            { id: 'financial_reports', label: 'Executive Reports', icon: FileSpreadsheet },
            { id: 'broadcast', label: 'Financial Notices', icon: MessageSquare },
          ];
        }

        const items: any[] = [{ id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard }];

        if (perms.includes('manage_teachers') || currentUser.scope === 'ALL_SCHOOL') {
          items.push({ id: 'teachers', label: 'Teacher Operations', icon: GraduationCap });
        }
        if (perms.includes('manage_classes') || currentUser.scope === 'ALL_SCHOOL') {
          items.push({ id: 'classes', label: 'Classes & Sections', icon: Layers });
          items.push({ id: 'class_evaluation', label: 'Class Evaluation & Health', icon: BarChart3 });
        }
        if (perms.includes('manage_subjects') || perms.includes('manage_curriculum') || currentUser.scope === 'ACADEMIC_ONLY') {
          items.push({ id: 'curriculum', label: 'Curriculum & Subjects', icon: BookOpen });
        }
        if (perms.includes('manage_students') || currentUser.scope === 'ALL_SCHOOL') {
          items.push({ id: 'students', label: 'Student Directory', icon: Users });
        }
        if (perms.includes('manage_parents') || currentUser.scope === 'ALL_SCHOOL') {
          items.push({ id: 'parents', label: 'Parent Records', icon: Heart });
        }
        items.push({ id: 'calendar', label: 'School Calendar', icon: Calendar });
        if (perms.includes('manage_timetable') || currentUser.scope === 'ACADEMIC_ONLY') {
          items.push({ id: 'timetable', label: 'Timetable Scheduler', icon: Calendar });
        }
        if (perms.includes('manage_fees') || currentUser.scope === 'FINANCE_ONLY' || currentUser.scope === 'ALL_SCHOOL') {
          items.push({
            id: 'financial_dashboard',
            label: 'Financial Dashboard',
            icon: BarChart3,
          });
          items.push({
            id: 'finance',
            label: 'Fees & Invoicing',
            icon: DollarSign,
            badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Pending` : undefined,
          });
        }
        if (perms.includes('manage_reports') || currentUser.scope === 'ALL_SCHOOL') {
          items.push({ id: 'reports', label: 'Academic Reports', icon: FileSpreadsheet });
        }
        if (perms.includes('broadcast_announcements')) {
          items.push({ id: 'announcements', label: 'School Broadcasts', icon: MessageSquare });
        }

        // Hidden 'Audit Log' for Director and Super Admin only
        if (isDirector(currentUser) || isSuperAdmin(currentUser)) {
          items.push({ id: 'audit_logs', label: 'Institutional Audit Log', icon: History });
        }

        return items;
      }

      case 'TEACHER':
        return [
          { id: 'overview', label: 'Classroom', icon: LayoutDashboard },
          { id: 'timetable', label: 'Timetable & Schedule', icon: Calendar },
          { id: 'daily_diary', label: 'Daily Diary', icon: BookMarked },
          { id: 'topic_completion', label: 'Topic Completion & Syllabus', icon: CheckCircle2 },
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

      case 'PARENT':
        return [
          { id: 'overview', label: 'Children Overview', icon: LayoutDashboard },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'growth_analytics', label: 'Academic Growth Charts', icon: Award },
          { id: 'attendance', label: 'Attendance Records', icon: CalendarCheck },
          { id: 'assignments', label: 'Homework & Tasks', icon: ClipboardList },
          { id: 'report_cards', label: 'Official Report Cards', icon: FileSpreadsheet },
          {
            id: 'fees',
            label: 'School Fees & Receipts',
            icon: DollarSign,
            badge: parentHasDueFees ? 'Due' : undefined,
          },
          { id: 'messages', label: 'Teacher Messaging', icon: MessageSquare },
        ];

      case 'STUDENT':
        return [
          { id: 'overview', label: 'My Learning Space', icon: Smile },
          { id: 'calendar', label: 'Events & Deadlines', icon: Calendar },
          { id: 'my_schedule', label: 'Today\'s Timetable', icon: Calendar },
          { id: 'my_homework', label: 'My Homework Tasks', icon: ClipboardList },
          { id: 'my_grades', label: 'My Stars & Badges', icon: Award },
          { id: 'practice_quiz', label: 'Fun Practice Quizzes', icon: Sparkles },
          { id: 'announcements', label: 'Class Messages', icon: MessageSquare },
        ];

      default:
        return [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/80 shrink-0 hidden md:flex md:flex-col min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-md shadow-purple-500/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                    isActive
                      ? 'bg-white text-purple-950 shadow-2xs'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Scope Notice */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs">
          <p className="font-bold text-slate-800">{currentUser.name}</p>
          <p className="text-slate-500 truncate text-[11px] mt-0.5">
            Role: <span className="font-semibold text-indigo-600">{currentUser.role}</span>
          </p>
          {currentUser.scope && (
            <p className="text-[10px] text-slate-400 mt-1">
              Scope: {currentUser.scope}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

