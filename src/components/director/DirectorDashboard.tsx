import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  MessageSquare,
  Search,
  Lock,
  Upload,
  Download,
  ShieldCheck,
  TrendingUp,
  Send,
  BellRing,
  Building2,
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  Award,
  Archive,
  History,
  Shield,
  Eye,
  Heart,
  Phone,
  Mail,
  Filter,
  Check,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  User as UserIcon,
  RefreshCw,
  Trash2,
  KeyRound,
  UserPlus,
  X,
  ArrowLeft
} from 'lucide-react';
import {
  User,
  Student,
  ClassRoom,
  Subject,
  FeePayment,
  Invoice,
  Branch,
  CredentialSlip,
  StudentStatusReport,
  WeeklyTeacherReport,
  Parent,
  ClassPerformanceMetrics
} from '../../types';
import { db } from '../../services/db';
import { isDirector, isSuperAdmin } from '../../utils/roles';
import { CredentialSlipModal } from '../common/CredentialSlipModal';
import { ConfirmOfflinePaymentModal } from '../admin/ConfirmOfflinePaymentModal';
import { BulkStudentUploadModal } from '../common/BulkStudentUploadModal';
import { AcademicSubjectManager } from '../common/AcademicSubjectManager';
import { FinancialDashboardTab } from '../admin/FinancialDashboardTab';
import { TeacherStatusModal } from '../admin/TeacherStatusModal';
import { StudentStatusModal } from '../admin/StudentStatusModal';
import { AdminStudentEnrollmentModal } from '../admin/AdminStudentEnrollmentModal';
import { DailyCalendarIntelligenceWidget } from '../common/DailyCalendarIntelligenceWidget';
import { SchoolCalendarManager } from '../calendar/SchoolCalendarManager';
import { StudentPromotionManager } from '../promotion/StudentPromotionManager';
import { AcademicArchiveViewer } from '../archive/AcademicArchiveViewer';
import { FormerStudentsHub } from '../archive/FormerStudentsHub';
import { InstitutionalAuditLog } from '../admin/InstitutionalAuditLog';
import { ReportDetailViewerModal } from '../common/ReportDetailViewerModal';
import { ReportCardModal } from '../common/ReportCardModal';
import { CommunicationHubModal } from '../common/CommunicationHubModal';
import { exportStudentsToCSV, exportFinancialsToCSV, exportAttendanceToCSV } from '../../utils/exportCsv';
import { TermAcademicPerformanceChart } from './TermAcademicPerformanceChart';
import { StaffAttendanceCheckInWidget } from '../common/StaffAttendanceCheckInWidget';
import { StaffAttendanceHRMonitor } from '../admin/StaffAttendanceHRMonitor';
import { TopPerformersCard } from './TopPerformersCard';
import { StaffPerformanceDashboard } from './StaffPerformanceDashboard';
import { ClassEvaluationDashboard } from './ClassEvaluationDashboard';
import { FeesCollectionOverview } from './FeesCollectionOverview';

export const getBranchOperationalStatus = (b: Branch): {
  label: 'Active' | 'Maintenance' | 'Closed';
  badgeClass: string;
  dotClass: string;
} => {
  const raw = ((b as any).operationalStatus || b.status || 'Active').toLowerCase();
  if (raw === 'maintenance') {
    return {
      label: 'Maintenance',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotClass: 'bg-amber-400',
    };
  }
  if (raw === 'closed' || raw === 'inactive') {
    return {
      label: 'Closed',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotClass: 'bg-rose-400',
    };
  }
  return {
    label: 'Active',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
  };
};

interface DirectorDashboardProps {
  currentUser: User;
  activeTab: string;
  onSelectTab?: (tab: string) => void;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  currentUser,
  activeTab: initialTab,
  onSelectTab,
}) => {
  // Sync tab with props or local state
  const [currentTab, setCurrentTab] = useState<string>(initialTab || 'overview');
  useEffect(() => {
    if (initialTab) {
      setCurrentTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  // Branch Selection State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => db.getActiveBranchId() || 'all');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const branches = db.getBranches();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setShowBranchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchFilterChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    db.setActiveBranchId(branchId);
  };

  // Listen for database updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setTick(t => t + 1);
      setSelectedBranchId(db.getActiveBranchId() || 'all');
    });
    return unsub;
  }, []);

  // System Entities
  const school = db.getSchoolProfile();
  const currency = school.currencySymbol || '₦';
  const allUsers = db.getUsers();
  const allStudents = db.getStudents();
  const allClasses = db.getClasses();
  const allSubjects = db.getSubjects();
  const allInvoices = db.getInvoices(currentUser);
  const allPayments = db.getPayments(currentUser);
  const allParents = db.getParents();
  const statusReports = db.getStudentStatusReports();
  const weeklyReports = db.getWeeklyTeacherReports();
  const termContext = db.getTermContext();

  // Branch Scoped Data
  const effectiveBranch = selectedBranchId;
  const isAllBranches = effectiveBranch === 'all';

  const students = useMemo(() => {
    if (isAllBranches) return allStudents;
    return allStudents.filter(s => s.branchId === effectiveBranch);
  }, [allStudents, effectiveBranch, isAllBranches]);

  const teachers = useMemo(() => {
    const teachingStaff = allUsers.filter(u => u.role === 'TEACHER');
    if (isAllBranches) return teachingStaff;
    return teachingStaff.filter(u => !u.branchId || u.branchId === effectiveBranch);
  }, [allUsers, effectiveBranch, isAllBranches]);

  const classes = useMemo(() => {
    if (isAllBranches) return allClasses;
    return allClasses.filter(c => c.branchId === effectiveBranch);
  }, [allClasses, effectiveBranch, isAllBranches]);

  const invoices = useMemo(() => {
    if (isAllBranches) return allInvoices;
    return allInvoices.filter(i => i.branchId === effectiveBranch);
  }, [allInvoices, effectiveBranch, isAllBranches]);

  const payments = useMemo(() => {
    if (isAllBranches) return allPayments;
    return allPayments.filter(p => p.branchId === effectiveBranch);
  }, [allPayments, effectiveBranch, isAllBranches]);

  // Financial Metrics
  const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + (i.balance || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Pending items
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'PARTIAL');
  const pendingWeeklyReports = weeklyReports.filter(r => r.status === 'SUBMITTED');

  // Attendance Metrics
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = db.getAttendance({ date: today });
  const relevantAttendance = useMemo(() => {
    if (isAllBranches) return todayAttendance;
    const branchClassIds = new Set(classes.map(c => c.id));
    return todayAttendance.filter(a => branchClassIds.has(a.classId));
  }, [todayAttendance, classes, isAllBranches]);

  const presentCount = relevantAttendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = relevantAttendance.filter(a => a.status === 'LATE').length;
  const absentCount = relevantAttendance.filter(a => a.status === 'ABSENT').length;
  const totalMarked = presentCount + lateCount + absentCount;
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : 96;

  // Class performance & health metrics for Director summary
  const classMetrics = useMemo(() => {
    return classes.map(c => {
      try {
        return db.getClassPerformanceMetrics(c.id);
      } catch (e) {
        return null;
      }
    }).filter(Boolean) as ClassPerformanceMetrics[];
  }, [classes]);

  const avgClassHealthScore = useMemo(() => {
    if (classMetrics.length === 0) return 92;
    const total = classMetrics.reduce((sum, m) => sum + m.overallScore, 0);
    return Math.round(total / classMetrics.length);
  }, [classMetrics]);

  const avgInstitutionalAcademicScore = useMemo(() => {
    if (classMetrics.length === 0) return 86;
    const total = classMetrics.reduce((sum, m) => sum + m.academicAverage, 0);
    return Math.round(total / classMetrics.length);
  }, [classMetrics]);

  // Staff activity & performance indicator for Director summary
  const staffMetrics = useMemo(() => {
    const weeklyReportsList = db.getWeeklyTeacherReports();
    const attendanceRecords = db.getStaffAttendance();
    const assessments = db.getAssessments();
    const assessmentScores = db.getAssessmentScores();

    if (teachers.length === 0) return { avgScore: 94, activeCount: 0 };

    const scores = teachers.map(t => {
      const teacherAttendance = attendanceRecords.filter(a => a.staffId === t.id);
      const onTimeCount = teacherAttendance.filter(a => a.status === 'ON_TIME').length;
      const punctuality = teacherAttendance.length > 0 ? (onTimeCount / teacherAttendance.length) * 100 : 96;

      const teacherReports = weeklyReportsList.filter(r => r.teacherId === t.id);
      const reportScore = teacherReports.length > 0 ? 95 : 85;

      const teacherAssessments = assessments.filter(a => a.createdByTeacherId === t.id);
      const completedAssessments = teacherAssessments.filter(a => assessmentScores.some(s => s.assessmentId === a.id));
      const gradingVel = teacherAssessments.length > 0 ? (completedAssessments.length / teacherAssessments.length) * 100 : 90;

      return Math.round(punctuality * 0.35 + gradingVel * 0.4 + reportScore * 0.25);
    });

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return {
      avgScore: avg,
      activeCount: teachers.filter(t => t.status === 'Active' || !t.status).length
    };
  }, [teachers]);

  const getTabDisplayName = (tab: string): string => {
    const map: Record<string, string> = {
      overview: 'Director Overview',
      fees_overview: 'Fees & Collection Overview',
      staff_performance: 'Staff Performance & Activity',
      class_evaluation: 'Class Performance & Evaluation',
      students: 'Student Directory & Profiles',
      parents: 'Parent Directory',
      admins: 'Branch Administrators',
      teachers: 'Teacher Operations & Staff',
      classes: 'Classes & Sections',
      curriculum: 'Curriculum & Subjects',
      attendance: 'Attendance Oversight',
      academics: 'Academic Performance',
      reports: 'Academic & Weekly Reports',
      calendar: 'Institutional Calendar',
      timetable: 'Timetable Scheduler',
      finance: 'Fees, Invoicing & Bursary Ledger',
      financial_dashboard: 'Financial Analytics',
      promotion: 'Student Promotion Manager',
      archives: 'Academic Archives & Former Students',
      chat: 'ZITEL CHAT ROOM',
      announcements: 'School Broadcasts',
      audit_logs: 'Institutional Audit Log',
      profile: 'Director Profile & Security',
    };
    return map[tab] || tab.replace(/_/g, ' ');
  };

  // Modals & Sub-views
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState<string | undefined>(undefined);
  const [selectedStudentForReportCard, setSelectedStudentForReportCard] = useState<Student | null>(null);
  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState<Student | null>(null);
  const [selectedTeacherForStatus, setSelectedTeacherForStatus] = useState<User | null>(null);
  const [selectedReportIdForViewer, setSelectedReportIdForViewer] = useState<string | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [activeCredentialSlip, setActiveCredentialSlip] = useState<CredentialSlip | null>(null);
  const [showOfflinePaymentModal, setShowOfflinePaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  // Student directory search & filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const parent = allParents.find(p => p.id === s.parentId || (s.parentIds || []).includes(p.id));
      const admissionNo = (s as any).admissionNumber || s.studentId || s.schoolId || '';
      const matchesSearch =
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (parent && parent.fullName.toLowerCase().includes(studentSearch.toLowerCase()));
      const matchesClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
      const matchesStatus = studentStatusFilter === 'ALL' || s.status === studentStatusFilter;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, studentSearch, studentClassFilter, studentStatusFilter, allParents]);

  // Parent search & filter
  const [parentSearch, setParentSearch] = useState('');
  const filteredParents = useMemo(() => {
    return allParents.filter(p => {
      const q = parentSearch.toLowerCase();
      const matchesName = p.fullName?.toLowerCase().includes(q);
      const matchesPhone = p.phone?.toLowerCase().includes(q);
      const matchesEmail = p.email?.toLowerCase().includes(q);
      const matchesId = p.schoolId?.toLowerCase().includes(q);
      return !q || matchesName || matchesPhone || matchesEmail || matchesId;
    });
  }, [allParents, parentSearch]);

  // Teacher search & filter
  const [teacherSearch, setTeacherSearch] = useState('');
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = teacherSearch.toLowerCase();
      const matchesName = t.name.toLowerCase().includes(q);
      const matchesEmail = t.email?.toLowerCase().includes(q);
      const matchesId = t.schoolId?.toLowerCase().includes(q);
      return !q || matchesName || matchesEmail || matchesId;
    });
  }, [teachers, teacherSearch]);

  // Teacher onboarding & management
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    branchId: 'branch_bungalow',
    customRoleTitle: 'Subject & Homeroom Teacher',
    homeroomClassId: '',
  });

  const handleCreateTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) return;

    const nameParts = teacherForm.name.trim().split(' ');
    const firstName = nameParts[0] || 'Teacher';
    const lastName = nameParts.slice(1).join(' ') || 'Staff';
    const targetBranch = teacherForm.branchId || (effectiveBranch !== 'all' ? effectiveBranch : 'branch_bungalow');

    const result = db.adminCreateTeacherAccount(
      {
        firstName,
        lastName,
        gender: teacherForm.gender,
        email: teacherForm.email.trim(),
        phone: teacherForm.phone.trim(),
        branchId: targetBranch,
        customRoleTitle: teacherForm.customRoleTitle,
        formClassId: teacherForm.homeroomClassId || undefined,
      },
      currentUser
    );

    setShowCreateTeacherModal(false);
    setActiveCredentialSlip(result.credentialSlip);
    setTeacherForm({
      name: '',
      email: '',
      phone: '',
      gender: 'Female',
      branchId: 'branch_bungalow',
      customRoleTitle: 'Subject & Homeroom Teacher',
      homeroomClassId: '',
    });
  };

  const handleToggleTeacherStatus = (teacher: User) => {
    const isCurrentlyActive = !teacher.status || teacher.status === 'active';
    const nextStatus = isCurrentlyActive ? 'deactivated' : 'active';
    if (confirm(`Are you sure you want to ${isCurrentlyActive ? 'deactivate' : 'activate'} teaching staff member ${teacher.name}?`)) {
      db.updateTeacherStatus(teacher.id, nextStatus as any, `Status changed to ${nextStatus} by Academic Director`, currentUser);
    }
  };

  const handleDeleteTeacher = (teacher: User) => {
    if (confirm(`Are you sure you want to permanently remove teacher "${teacher.name}" (${teacher.schoolId || teacher.email})? This action cannot be undone.`)) {
      db.deleteUser(teacher.id, currentUser);
    }
  };

  // Branch Administrator management state & handlers
  const [adminSearch, setAdminSearch] = useState('');
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    branchId: 'branch_bungalow',
    customRoleTitle: 'Academic Administrator',
    scope: 'ALL_SCHOOL' as 'ACADEMIC_ONLY' | 'FINANCE_ONLY' | 'ALL_SCHOOL',
    permissions: ['manage_teachers', 'manage_classes', 'manage_students', 'manage_reports'] as string[],
  });

  const admins = useMemo(() => {
    const allAdmins = allUsers.filter(u => u.role === 'ADMIN');
    if (isAllBranches) return allAdmins;
    return allAdmins.filter(u => !u.branchId || u.branchId === effectiveBranch);
  }, [allUsers, effectiveBranch, isAllBranches]);

  const filteredAdmins = useMemo(() => {
    return admins.filter(a => {
      const q = adminSearch.toLowerCase();
      const matchesName = a.name.toLowerCase().includes(q);
      const matchesEmail = a.email?.toLowerCase().includes(q);
      const matchesId = (a.schoolId || a.username || '').toLowerCase().includes(q);
      return !q || matchesName || matchesEmail || matchesId;
    });
  }, [admins, adminSearch]);

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim()) return;

    const nameParts = adminForm.name.trim().split(' ');
    const firstName = nameParts[0] || 'Administrator';
    const lastName = nameParts.slice(1).join(' ') || 'Officer';
    const targetBranch = adminForm.branchId || (effectiveBranch !== 'all' ? effectiveBranch : 'branch_bungalow');

    const result = db.adminCreateAdminAccount(
      {
        firstName,
        lastName,
        email: adminForm.email.trim(),
        phone: adminForm.phone.trim(),
        branchId: targetBranch,
        customRoleTitle: adminForm.customRoleTitle,
        scope: adminForm.scope,
        permissions: adminForm.permissions,
      },
      currentUser
    );

    setShowCreateAdminModal(false);
    setActiveCredentialSlip(result.credentialSlip);
    setAdminForm({
      name: '',
      email: '',
      phone: '',
      branchId: 'branch_bungalow',
      customRoleTitle: 'Academic Administrator',
      scope: 'ALL_SCHOOL',
      permissions: ['manage_teachers', 'manage_classes', 'manage_students', 'manage_reports'],
    });
  };

  const handleToggleAdminStatus = (admin: User) => {
    const nextStatus = admin.status === 'active' ? 'suspended' : 'active';
    if (confirm(`Are you sure you want to ${nextStatus === 'suspended' ? 'deactivate/suspend' : 'activate'} administrator ${admin.name}?`)) {
      db.updateUser(admin.id, { status: nextStatus }, currentUser);
    }
  };

  const handleDeleteAdmin = (admin: User) => {
    if (confirm(`Are you sure you want to permanently remove administrator "${admin.name}" (${admin.schoolId || admin.email})? This action cannot be undone.`)) {
      db.deleteUser(admin.id, currentUser);
    }
  };

  const handleResetAdminCredentials = (admin: User) => {
    if (confirm(`Generate new temporary access credentials for administrator ${admin.name} (${admin.schoolId || admin.username})?`)) {
      const resultSlip = db.adminResetUserPassword(admin.id, currentUser);
      setActiveCredentialSlip(resultSlip);
    }
  };

  // Unread messages count for Director
  const unreadMessagesCount = useMemo(() => {
    const msgs = db.getMessages({ recipientId: currentUser.id });
    return msgs.filter(m => !m.read).length;
  }, [currentUser.id]);

  // Broadcast creation state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'TEACHERS' | 'PARENTS'>('ALL');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    db.addNotification({
      userId: 'all',
      title: `Director's Broadcast: ${broadcastTitle.trim()}`,
      message: broadcastMessage.trim(),
      type: 'ANNOUNCEMENT',
    });

    db.addAuditLog(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      'DIRECTOR_BROADCAST_SENT',
      'Communication',
      broadcastTarget,
      `Target: ${broadcastTarget}, Title: ${broadcastTitle}`
    );

    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  // Password change state for profile tab
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const res = db.changePassword(currentUser.id, '', newPassword);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Director password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password. Please ensure it meets security criteria.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="director-dashboard-root">
      {/* EXECUTIVE DIRECTOR BANNER & COMMAND BAR */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-purple-800/30 relative">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none rounded-2xl overflow-hidden" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg border-2 border-purple-400/30 flex-shrink-0">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  School Director
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ID: {currentUser.schoolId || 'ZCS/DIR/00001'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Institutional Leadership
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                {currentUser.name || 'Dr. Nwankwo Chika'}
              </h1>
              <p className="text-sm text-slate-300 mt-0.5 flex items-center gap-2 truncate">
                <span>Zitel Castle School</span>
                <span>•</span>
                <span>Cross-Branch Oversight (Bungalow & Ijegun)</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Branch Selector Column */}
          <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
            {/* Branch Selector Dropdown Column */}
            <div className="flex flex-col gap-1.5 relative w-full sm:w-auto" ref={branchDropdownRef} id="director-branch-dropdown-column">
              <label
                htmlFor="director-branch-dropdown-btn"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-0.5"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Branch Scope</span>
              </label>

              <button
                type="button"
                id="director-branch-dropdown-btn"
                onClick={() => setShowBranchDropdown(prev => !prev)}
                className="bg-slate-800/90 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2.5 text-xs font-semibold shadow-inner transition-all w-full sm:min-w-[240px] sm:max-w-xs cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={showBranchDropdown}
              >
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  {selectedBranchId === 'all' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="truncate font-bold">All Branches (Consolidated)</span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Active
                      </span>
                    </>
                  ) : (() => {
                    const currentBranch = branches.find(b => b.id === selectedBranchId);
                    const statusInfo = currentBranch ? getBranchOperationalStatus(currentBranch) : null;
                    return (
                      <>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo?.dotClass || 'bg-emerald-400'}`} />
                        <span className="truncate font-bold">{currentBranch?.name || 'Select Branch'}</span>
                        {statusInfo && (
                          <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    showBranchDropdown ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Listbox */}
              {showBranchDropdown && (
                <div
                  id="director-branch-dropdown-menu"
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-full sm:w-80 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  role="listbox"
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                    <span>Branch Oversight Scope</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                      Director Access
                    </span>
                  </div>

                  <div className="py-1">
                    {/* All Branches Option */}
                    <button
                      type="button"
                      onClick={() => {
                        handleBranchFilterChange('all');
                        setShowBranchDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer ${
                        selectedBranchId === 'all'
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border-l-2 border-indigo-400'
                          : 'text-slate-300'
                      }`}
                      role="option"
                      aria-selected={selectedBranchId === 'all'}
                      id="opt-branch-all"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                          ALL
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">All Branches (Consolidated)</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">Institutional Multi-Branch View</div>
                        </div>
                      </div>
                      {selectedBranchId === 'all' && (
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Individual Branches with Color-Coded KPI Badges */}
                    {branches.map(b => {
                      const isSelected = selectedBranchId === b.id;
                      const code = b.name.includes('Ijegun') ? 'IJ' : 'BG';
                      const statusInfo = getBranchOperationalStatus(b);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            handleBranchFilterChange(b.id);
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 text-indigo-300 font-bold border-l-2 border-indigo-400'
                              : 'text-slate-300'
                          }`}
                          role="option"
                          aria-selected={isSelected}
                          id={`opt-branch-${b.id}`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-700">
                              {code}
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate">{b.name}</span>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${statusInfo.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {b.address || 'Active School Branch'}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ZITEL CHAT ROOM Quick Access Button Column */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 invisible select-none pl-0.5 sm:block hidden">
                Actions
              </span>
              <button
                onClick={() => {
                  setChatRecipientId(undefined);
                  setShowChatModal(true);
                }}
                className="relative px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer h-[38px]"
                id="btn-director-zitel-chat"
              >
                <MessageSquare className="w-4 h-4" />
                <span>ZITEL CHAT ROOM</span>
                {unreadMessagesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-extrabold animate-pulse">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Session & Term Intelligence Strip */}
        <div className="mt-6 pt-4 border-t border-indigo-900/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Academic Session</span>
            <span className="text-white font-bold text-sm">
              {termContext.session?.name || '2025/2026 Academic Session'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Current Term</span>
            <span className="text-white font-bold text-sm">
              {termContext.term?.name || 'Second Term (Lent)'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Today's Date</span>
            <span className="text-white font-bold text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Selected View Scope</span>
            <span className="text-indigo-300 font-bold text-sm">
              {selectedBranchId === 'all'
                ? 'Consolidated (Both Branches)'
                : branches.find(b => b.id === selectedBranchId)?.name || 'Specific Branch'}
            </span>
          </div>
        </div>
      </div>

      {/* GLOBAL BACK TO DASHBOARD NAVIGATION BAR (Shown on all detailed sub-views) */}
      {currentTab !== 'overview' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150" id="director-global-back-nav">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
              id="btn-director-back-to-overview"
            >
              <ArrowLeft className="w-4 h-4 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
              <span>← Back</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-slate-400">Director Command</span>
              <span>/</span>
              <span className="font-bold text-slate-800">
                {getTabDisplayName(currentTab)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden md:inline">Filtered Campus:</span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100/80">
              {selectedBranchId === 'all'
                ? 'All Campuses (Consolidated)'
                : branches.find(b => b.id === selectedBranchId)?.name || 'Campus'}
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT VIEWS */}
      {/* 1. OVERVIEW TAB */}
      {currentTab === 'overview' && (
        <div className="space-y-6" id="director-overview-tab">
          {/* Daily Staff Attendance Check-in Widget for Director */}
          <StaffAttendanceCheckInWidget currentUser={currentUser} />

          {/* Executive Compact KPI Summary Cards Grid - 6 Interactive Portals */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. STUDENTS */}
            <div
              onClick={() => handleTabChange('students')}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
              id="card-director-compact-students"
              title="Click to open Student Directory & Profiles"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                    {students.filter(s => s.status === 'Active').length} Active
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    STUDENTS
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mt-0.5">
                    {students.length.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{classes.length} classes</span>
                <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  View
                </span>
              </div>
            </div>

            {/* 2. FEES & COLLECTION */}
            <div
              onClick={() => handleTabChange('fees_overview')}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
              id="card-director-compact-fees"
              title="Click to open Fees & Collection Overview"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80">
                    {collectionRate}%
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    FEES & COLLECTION
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-700 leading-tight mt-0.5 truncate">
                    {currency}{(totalCollected || 0) >= 1000000 ? `${((totalCollected || 0) / 1000000).toFixed(2)}M` : (totalCollected || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate text-rose-600 font-medium">Bal {currency}{(totalOutstanding || 0) >= 1000000 ? `${((totalOutstanding || 0) / 1000000).toFixed(1)}M` : (totalOutstanding || 0).toLocaleString()}</span>
                <span className="text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  View
                </span>
              </div>
            </div>

            {/* 3. STAFF EVALUATION */}
            <div
              onClick={() => handleTabChange('staff_performance')}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
              id="card-director-compact-staff"
              title="Click to open Staff Performance & Activity"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100/80">
                    {staffMetrics.avgScore}% Score
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    STAFF EVALUATION
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mt-0.5">
                    {allUsers.filter(u => u.role !== 'STUDENT' && u.role !== 'PARENT' && u.role !== 'SUPER_ADMIN' && u.role !== 'DIRECTOR').length} <span className="text-xs font-semibold text-slate-500">Staff</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{staffMetrics.activeCount} Active</span>
                <span className="text-[11px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  View
                </span>
              </div>
            </div>

            {/* 4. CLASS EVALUATION */}
            <div
              onClick={() => handleTabChange('class_evaluation')}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
              id="card-director-compact-classes"
              title="Click to open Class Performance & Evaluation"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/80">
                    {avgClassHealthScore}% Health
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    CLASS EVALUATION
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mt-0.5">
                    {classes.length} <span className="text-xs font-semibold text-slate-500">Classes</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">Live Health</span>
                <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  View
                </span>
              </div>
            </div>

            {/* 5. ATTENDANCE */}
            <div
              onClick={() => handleTabChange('attendance')}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
              id="card-director-compact-attendance"
              title="Click to open Attendance Oversight"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors shrink-0">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100/80">
                    Today
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    ATTENDANCE
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mt-0.5">
                    {attendanceRate}%
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{presentCount} pres • {absentCount} abs</span>
                <span className="text-[11px] font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  View
                </span>
              </div>
            </div>

            {/* 6. ACADEMIC PERFORMANCE */}
            <div
              onClick={() => handleTabChange('academics')}
              className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
              id="card-director-compact-academics"
              title="Click to open Academic Performance"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/80">
                    Avg
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
                    ACADEMIC PERFORMANCE
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mt-0.5">
                    {avgInstitutionalAcademicScore}%
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">Across exams</span>
                <span className="text-[11px] font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                  View
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric Bar - Sleek Operations Hub */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              onClick={() => handleTabChange('parents')}
              className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex items-center gap-2 min-w-0 overflow-hidden cursor-pointer group"
              id="card-director-sec-parents"
              title="Click to open Parent Directory"
            >
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Heart className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider truncate leading-tight">
                  Registered Parents
                </span>
                <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5 leading-tight">
                  {allParents.length} <span className="text-[10px] font-normal text-slate-500">Families</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => handleTabChange('teachers')}
              className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition-all flex items-center gap-2 min-w-0 overflow-hidden cursor-pointer group"
              id="card-director-sec-teachers"
              title="Click to open Teacher Operations"
            >
              <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider truncate leading-tight">
                  Teacher Operations
                </span>
                <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5 leading-tight">
                  {teachers.length} <span className="text-[10px] font-normal text-slate-500">Educators</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => handleTabChange('curriculum')}
              className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center gap-2 min-w-0 overflow-hidden cursor-pointer group"
              id="card-director-sec-curriculum"
              title="Click to open Curriculum & Subjects"
            >
              <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider truncate leading-tight">
                  Curriculum Subjects
                </span>
                <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5 leading-tight">
                  {allSubjects.length} <span className="text-[10px] font-normal text-slate-500">Courses</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => handleTabChange('reports')}
              className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all flex items-center gap-2 min-w-0 overflow-hidden cursor-pointer group"
              id="card-director-sec-pending"
              title="Click to open Academic & Weekly Reports"
            >
              <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <AlertCircle className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider truncate leading-tight">
                  Pending Actions
                </span>
                <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5 leading-tight">
                  {pendingInvoices.length + pendingWeeklyReports.length} <span className="text-[10px] font-normal text-slate-500">Items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Calendar Intelligence Widget */}
          <DailyCalendarIntelligenceWidget currentUser={currentUser} />

          {/* Institutional Multi-Branch Comparison Table (Bungalow vs Ijegun) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Institutional Multi-Branch Comparison
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time operational distribution between Zitel Castle School branches
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                2 Fully Accredited Branches
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3.5 px-6">Branch</th>
                    <th className="py-3.5 px-4">Branch Leadership</th>
                    <th className="py-3.5 px-4">Students</th>
                    <th className="py-3.5 px-4">Teachers</th>
                    <th className="py-3.5 px-4">Fee Recovery</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map(b => {
                    const bStudents = allStudents.filter(s => s.branchId === b.id);
                    const bTeachers = allUsers.filter(u => u.role === 'TEACHER' && (!u.branchId || u.branchId === b.id));
                    const bInvoices = allInvoices.filter(i => i.branchId === b.id);
                    const bCollected = bInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
                    const bBilled = bInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
                    const bRate = bBilled > 0 ? Math.round((bCollected / bBilled) * 100) : 0;
                    const isSelected = selectedBranchId === b.id;
                    const statusInfo = getBranchOperationalStatus(b);

                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold">
                              {b.name.includes('Ijegun') ? 'IJ' : 'BG'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{b.name}</span>
                                {isSelected && (
                                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                                    Active Filter
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{b.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {b.headTeacherOrPrincipal || (b.name.includes('Ijegun') ? 'Mr. Chinedu Okafor' : 'Mrs. Folake Adebayo')}
                          </div>
                          <div className="text-[11px] text-slate-500">Branch Administrator</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900">{bStudents.length}</span>
                          <span className="text-xs text-slate-500 ml-1">students</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900">{bTeachers.length}</span>
                          <span className="text-xs text-slate-500 ml-1">staff</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${Math.min(bRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-800">{bRate}%</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {currency}{(bCollected || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleBranchFilterChange(b.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                          >
                            {isSelected ? 'Viewing Branch' : 'Inspect Branch'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Term-over-Term Academic Performance Trend Line Chart (Recharts) */}
          <TermAcademicPerformanceChart
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={handleBranchFilterChange}
          />

          {/* Top Performers Card: Highlighting students with highest GPA, filtered by branch */}
          <TopPerformersCard
            branches={branches}
            selectedBranchId={selectedBranchId}
          />

          {/* Staff Attendance HR Monitoring Dashboard */}
          <StaffAttendanceHRMonitor
            branches={branches}
            selectedBranchId={selectedBranchId}
          />

          {/* Pending Reports & Recent Reports Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Status Reports Review */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    Teacher Weekly Reports
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recent status submissions by teaching staff
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('reports')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {weeklyReports.slice(0, 4).map(report => (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        Week {report.weekNumber} Report - {report.className}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Teacher: {report.teacherName}</span>
                        <span>•</span>
                        <span>Class: {report.className}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReportIdForViewer(report.id)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                ))}
                {weeklyReports.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No weekly teacher reports submitted yet.
                  </div>
                )}
              </div>
            </div>

            {/* Pending Fee Verifications */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Pending Payment Verifications
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Offline and bank transfer payments awaiting sign-off
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('finance')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Open Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {pendingInvoices.slice(0, 4).map(inv => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {inv.studentName} ({inv.className})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Inv #{inv.invoiceNumber}</span>
                        <span>•</span>
                        <span>Balance: {currency}{(inv.balance || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedInvoiceForPayment(inv);
                        setShowOfflinePaymentModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>
                  </div>
                ))}
                {pendingInvoices.length === 0 && (
                  <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                    All student fee invoices are currently up to date!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAFF PERFORMANCE & ACTIVITY TAB */}
      {currentTab === 'staff_performance' && (
        <StaffPerformanceDashboard
          currentUser={currentUser}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onNavigateToTab={handleTabChange}
          onBackToDashboard={() => handleTabChange('overview')}
        />
      )}

      {/* CLASS PERFORMANCE & EVALUATION TAB */}
      {currentTab === 'class_evaluation' && (
        <ClassEvaluationDashboard
          currentUser={currentUser}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onNavigateToTab={handleTabChange}
          onBackToDashboard={() => handleTabChange('overview')}
        />
      )}

      {/* FEES & COLLECTION OVERVIEW TAB */}
      {currentTab === 'fees_overview' && (
        <FeesCollectionOverview
          currentUser={currentUser}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onNavigateToTab={handleTabChange}
          onBackToDashboard={() => handleTabChange('overview')}
        />
      )}

      {/* 2. STUDENT DIRECTORY TAB */}
      {currentTab === 'students' && (
        <div className="space-y-4" id="director-students-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Student Directory & Academic Profiles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredStudents.length} enrolled students across authorized branches
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportStudentsToCSV(filteredStudents)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk CSV Upload</span>
              </button>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll Student</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search by student name, admission number, or parent name..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={studentClassFilter}
                onChange={e => setStudentClassFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={studentStatusFilter}
                onChange={e => setStudentStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Transferred">Transferred</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-4">Admission ID</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Parent / Guardian</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => {
                    const branch = branches.find(b => b.id === student.branchId);
                    const parent = allParents.find(p => p.id === student.parentId || (student.parentIds || []).includes(p.id));
                    const admissionNo = (student as any).admissionNumber || student.studentId || student.schoolId || 'N/A';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                              {student.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {student.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {student.gender || 'Not specified'} • Enrolled: {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'Active'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {admissionNo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                          {student.className}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {branch?.name.includes('Ijegun') ? 'Ijegun Branch' : 'Bungalow Branch'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {parent?.fullName || 'Registered Parent'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {parent?.phone || parent?.email || student.primaryContactPhone || 'Contact on file'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              student.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : student.status === 'Graduated'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {student.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedStudentForReportCard(student)}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Official Report Card"
                            >
                              Report Card
                            </button>
                            <button
                              onClick={() => setSelectedStudentForStatus(student)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Lifecycle & Status Management"
                            >
                              Lifecycle
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        No students matching the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PARENT REGISTRY TAB */}
      {currentTab === 'parents' && (
        <div className="space-y-4" id="director-parents-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                Parent & Guardian Registry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized contact registry — Dr. Nwankwo Chika has unrestricted access to verified parent phone numbers and emails
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={parentSearch}
                onChange={e => setParentSearch(e.target.value)}
                placeholder="Search by parent name, phone, email..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3.5 px-6">Parent / Guardian</th>
                    <th className="py-3.5 px-4">School ID</th>
                    <th className="py-3.5 px-4">Verified Phone</th>
                    <th className="py-3.5 px-4">Verified Email</th>
                    <th className="py-3.5 px-4">Linked Students</th>
                    <th className="py-3.5 px-6 text-right">Zitel Chat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParents.map(parent => {
                    const linkedChildren = allStudents.filter(s =>
                      (parent.linkedStudentIds || []).includes(s.id) ||
                      (parent.studentIds || []).includes(s.id) ||
                      s.parentId === parent.id ||
                      (s.parentIds || []).includes(parent.id)
                    );

                    return (
                      <tr key={parent.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {parent.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {parent.relationship || 'Guardian'} {parent.occupation ? `• ${parent.occupation}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {parent.schoolId || 'PARENT-ID'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{parent.phone || 'Not recorded'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{parent.email || 'Not recorded'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {linkedChildren.map(c => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {c.fullName} ({c.className})
                              </span>
                            ))}
                            {linkedChildren.length === 0 && (
                              <span className="text-xs text-slate-400">No linked student records</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => {
                              setChatRecipientId(parent.id);
                              setShowChatModal(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredParents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No parent records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3.5 BRANCH ADMINISTRATORS TAB */}
      {currentTab === 'admins' && (
        <div className="space-y-4" id="director-admins-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Branch Administrators & Governance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage branch administrative officers, scopes, permissions, and security credentials across campuses
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  placeholder="Search admin name, email, or ID..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Administrator</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-600 font-bold border-b border-slate-200/60 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Administrator</th>
                    <th className="py-3.5 px-4">Branch Campus</th>
                    <th className="py-3.5 px-4">Role Title & Scope</th>
                    <th className="py-3.5 px-4">Permissions</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No administrators found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map(adm => {
                      const branch = branches.find(b => b.id === adm.branchId);
                      const isAct = adm.status === 'active';
                      return (
                        <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center space-x-3">
                              <img
                                src={adm.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120'}
                                alt={adm.name}
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{adm.name}</p>
                                  <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                    {adm.schoolId || adm.username}
                                  </span>
                                </div>
                                <p className="text-slate-500 font-mono text-[11px]">{adm.email}</p>
                                {adm.phone && <p className="text-slate-400 text-[10px]">{adm.phone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {branch ? branch.name : (adm.branchId === 'branch_bungalow' ? 'Bungalow Branch' : 'Ijegun Branch')}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-indigo-950 text-xs">{adm.customRoleTitle || 'Academic Administrator'}</p>
                            <span className="inline-block mt-0.5 text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              Scope: {adm.scope || 'ALL_SCHOOL'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(adm.permissions || []).slice(0, 2).map(p => (
                                <span
                                  key={p}
                                  className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100"
                                >
                                  {p.replace('manage_', '')}
                                </span>
                              ))}
                              {(adm.permissions || []).length > 2 && (
                                <span className="text-[9px] text-slate-400 font-semibold px-1.5 py-0.5">
                                  +{(adm.permissions || []).length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isAct
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  isAct ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {isAct ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {adm.lastLogin ? new Date(adm.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setChatRecipientId(adm.id);
                                  setShowChatModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Message Administrator"
                              >
                                <MessageSquare className="w-4 h-4 text-indigo-600" />
                              </button>
                              <button
                                onClick={() => handleResetAdminCredentials(adm)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Reset Credentials & Issue Slip"
                              >
                                <KeyRound className="w-4 h-4 text-amber-600" />
                              </button>
                              <button
                                onClick={() => handleToggleAdminStatus(adm)}
                                className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
                                  isAct ? 'text-slate-500 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'
                                }`}
                                title={isAct ? 'Deactivate / Suspend Administrator' : 'Reactivate Administrator'}
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(adm)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Permanently Remove Administrator"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TEACHER OPERATIONS TAB */}
      {currentTab === 'teachers' && (
        <div className="space-y-4" id="director-teachers-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Teaching Staff & Teacher Operations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff directory, instructional assignments, status oversight, and staff lifecycle management
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  placeholder="Search teacher by name, staff ID, or email..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setShowCreateTeacherModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Teacher</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3.5 px-6">Teacher Name</th>
                    <th className="py-3.5 px-4">Staff ID</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Assigned Homeroom</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map(teacher => {
                    const branch = branches.find(b => b.id === teacher.branchId);
                    const homeroomClass = allClasses.find(c => c.formTeacherId === teacher.id);
                    const teacherStatus = (teacher.status || 'active').toLowerCase();
                    const isAct = teacherStatus === 'active';
                    const isLeave = teacherStatus === 'on_leave';
                    const isSusp = teacherStatus === 'suspended' || teacherStatus === 'deactivated';

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {teacher.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {teacher.customRoleTitle || 'Subject & Homeroom Teacher'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded w-max">
                          {teacher.schoolId || 'TCH-STAFF'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700 font-medium">
                          {branch?.name.includes('Ijegun') ? 'Ijegun Branch' : 'Bungalow Branch'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                          {homeroomClass ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              {homeroomClass.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">Subject Specialist</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div>{teacher.email}</div>
                          <div className="text-slate-400 text-[11px]">{teacher.phone || 'Phone on file'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              isAct
                                ? 'bg-emerald-100 text-emerald-800'
                                : isLeave
                                ? 'bg-amber-100 text-amber-800'
                                : isSusp
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isAct ? 'bg-emerald-500' : isLeave ? 'bg-amber-500' : isSusp ? 'bg-rose-500' : 'bg-slate-400'
                              }`}
                            />
                            {isAct ? 'Active' : isLeave ? 'On Leave' : isSusp ? 'Deactivated' : 'Archived'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setChatRecipientId(teacher.id);
                                setShowChatModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Message Teacher"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => setSelectedTeacherForStatus(teacher)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Manage Detailed Status & Assignments"
                            >
                              Status
                            </button>
                            <button
                              onClick={() => handleToggleTeacherStatus(teacher)}
                              className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
                                isAct ? 'text-slate-400 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                              title={isAct ? 'Deactivate Teacher' : 'Activate Teacher'}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Permanently Remove Teacher"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. CLASSES & SECTIONS TAB */}
      {currentTab === 'classes' && (
        <div className="space-y-4" id="director-classes-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Classrooms & Sections
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active academic classes across Zitel Castle School branches
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
              {classes.length} Active Classes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => {
              const classStudents = allStudents.filter(s => s.classId === cls.id);
              const branch = branches.find(b => b.id === cls.branchId);
              const formTeacher = allUsers.find(u => u.id === cls.formTeacherId);

              return (
                <div
                  key={cls.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {branch?.name.includes('Ijegun') ? 'Ijegun Branch' : 'Bungalow Branch'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{cls.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Section: {cls.section || 'General'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {classStudents.length}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Form Teacher:</span>
                      <span className="font-bold text-slate-900">{formTeacher?.name || 'Assigned'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Enrolled Pupils:</span>
                      <span className="font-bold text-slate-900">{classStudents.length} pupils</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. CURRICULUM & SUBJECTS TAB */}
      {currentTab === 'curriculum' && (
        <div id="director-curriculum-tab">
          <AcademicSubjectManager currentUser={currentUser} />
        </div>
      )}

      {/* 7. ATTENDANCE OVERSIGHT TAB */}
      {currentTab === 'attendance' && (
        <div className="space-y-4" id="director-attendance-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                Attendance Oversight & Risk Monitoring
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-branch daily attendance telemetry and chronic absence pattern identification
              </p>
            </div>
            <button
              onClick={() =>
                exportAttendanceToCSV(
                  relevantAttendance,
                  students,
                  isAllBranches
                    ? 'All Branches'
                    : branches.find(b => b.id === selectedBranchId)?.name || 'Current Branch'
                )
              }
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Overall Rate
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{attendanceRate}%</span>
              <span className="text-xs text-emerald-600 font-medium">Exceeds standard target (95%)</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Present Today
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">{presentCount}</span>
              <span className="text-xs text-slate-500">Punctual arrivals</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Late Arrivals
              </span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">{lateCount}</span>
              <span className="text-xs text-slate-500">Tardy arrivals</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Absences Logged
              </span>
              <span className="text-2xl font-bold text-rose-600 mt-1 block">{absentCount}</span>
              <span className="text-xs text-slate-500">Unexcused / illness</span>
            </div>
          </div>

          {/* Class Attendance Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Class-by-Class Attendance Metrics</h3>
            <div className="space-y-3">
              {classes.map(c => {
                const cStudents = allStudents.filter(s => s.classId === c.id);
                const cAtt = relevantAttendance.filter(a => a.classId === c.id);
                const cPresent = cAtt.filter(a => a.status === 'PRESENT').length;
                const cTotal = Math.max(cAtt.length, 1);
                const rate = cAtt.length > 0 ? Math.round((cPresent / cTotal) * 100) : 98;

                return (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {cStudents.length} registered students
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. ACADEMIC PERFORMANCE TAB */}
      {currentTab === 'academics' && (
        <div className="space-y-4" id="director-academics-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Academic Performance & Continuous Assessment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Curriculum mastery, assessment scores, and academic standards oversight
            </p>
          </div>

          {/* Term-over-Term Academic Performance Trend Line Chart (Recharts) */}
          <TermAcademicPerformanceChart
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={handleBranchFilterChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Institutional Average Score
              </span>
              <span className="text-3xl font-extrabold text-indigo-600 mt-2 block">84.6%</span>
              <p className="text-xs text-slate-500 mt-1">Across all core curriculum subjects</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Top Performing Branch
              </span>
              <span className="text-xl font-extrabold text-slate-900 mt-2 block">
                Bungalow Branch (86.2%)
              </span>
              <p className="text-xs text-slate-500 mt-1">Followed by Ijegun Branch (83.1%)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Students Needing Focus
              </span>
              <span className="text-3xl font-extrabold text-amber-600 mt-2 block">3 Pupils</span>
              <p className="text-xs text-slate-500 mt-1">Subject remedial sessions scheduled</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. ACADEMIC & WEEKLY REPORTS TAB */}
      {currentTab === 'reports' && (
        <div className="space-y-4" id="director-reports-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Academic Reports & Teacher Weekly Submissions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official student status reports, weekly classroom summaries, and principal approvals
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl">
              {weeklyReports.length + statusReports.length} Submitted Reports
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3.5 px-6">Report Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyReports.map(rep => (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          Week {rep.weekNumber} Report - {rep.className}
                        </div>
                        <div className="text-[11px] text-slate-500">Class: {rep.className}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded">
                          Weekly Summary
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                        {rep.teacherName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {rep.status || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedReportIdForViewer(rep.id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {weeklyReports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No reports on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 10. SCHOOL CALENDAR TAB */}
      {currentTab === 'calendar' && (
        <div id="director-calendar-tab">
          <SchoolCalendarManager currentUser={currentUser} />
        </div>
      )}

      {/* 11. TIMETABLE TAB */}
      {currentTab === 'timetable' && (
        <div className="space-y-4" id="director-timetable-tab">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Institutional Timetable Scheduler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Class periods, teacher schedules, and classroom utilization across branches
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center py-12">
            <Calendar className="w-12 h-12 text-indigo-600 mx-auto mb-3 opacity-70" />
            <h3 className="font-bold text-slate-900 text-base">Standard Academic Schedule Active</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Periods 1 through 8 run from 8:00 AM to 2:30 PM with morning assembly, mid-morning snack, and lunch intervals.
            </p>
          </div>
        </div>
      )}

      {/* 12. FINANCE & INVOICING LEDGER TAB (Now powered by FeesCollectionOverview) */}
      {currentTab === 'finance' && (
        <FeesCollectionOverview
          currentUser={currentUser}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onNavigateToTab={handleTabChange}
          onBackToDashboard={() => handleTabChange('overview')}
        />
      )}

      {/* 13. FINANCIAL ANALYTICS TAB */}
      {currentTab === 'financial_dashboard' && (
        <div id="director-financial-analytics-tab">
          <FinancialDashboardTab currentUser={currentUser} />
        </div>
      )}

      {/* 14. STUDENT PROMOTION TAB */}
      {currentTab === 'promotion' && (
        <div id="director-promotion-tab">
          <StudentPromotionManager currentUser={currentUser} />
        </div>
      )}

      {/* 15. ACADEMIC ARCHIVES TAB */}
      {currentTab === 'archives' && (
        <div className="space-y-6" id="director-archives-tab">
          <AcademicArchiveViewer currentUser={currentUser} />
          <FormerStudentsHub currentUser={currentUser} />
        </div>
      )}

      {/* 16. ZITEL CHAT ROOM TAB */}
      {currentTab === 'chat' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center py-16" id="director-chat-tab">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">ZITEL CHAT ROOM Active</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Direct, real-time messaging with parents, teachers, and school administrators.
          </p>
          <button
            onClick={() => {
              setChatRecipientId(undefined);
              setShowChatModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Zitel Chat Room Console</span>
          </button>
        </div>
      )}

      {/* 17. BROADCASTS & ANNOUNCEMENTS TAB */}
      {currentTab === 'announcements' && (
        <div className="space-y-6" id="director-broadcasts-tab">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-indigo-600" />
              Director's Official School Broadcasts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatch urgent notifications and circulars across branches to parents, teachers, or all staff
            </p>

            {broadcastSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Director broadcast published and logged to audit trail successfully!</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Resumption of Academic Session & Inter-House Sports Notice"
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Audience
                </label>
                <select
                  value={broadcastTarget}
                  onChange={e => setBroadcastTarget(e.target.value as any)}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ALL">All School Community (Parents, Teachers & Administrators)</option>
                  <option value="PARENTS">Parents & Guardians Only</option>
                  <option value="TEACHERS">Teaching Staff & Academic Personnel Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Message Body
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  rows={4}
                  placeholder="Type the official executive directive or announcement here..."
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Executive Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 18. INSTITUTIONAL AUDIT LOG TAB */}
      {currentTab === 'audit_logs' && (
        <div id="director-audit-logs-tab">
          <InstitutionalAuditLog currentUser={currentUser} />
        </div>
      )}

      {/* 19. DIRECTOR PROFILE & SECURITY TAB */}
      {currentTab === 'profile' && (
        <div className="space-y-6" id="director-profile-tab">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                DC
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dr. Nwankwo Chika</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100">
                    School Director
                  </span>
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-100">
                    ID: ZCS/DIR/00001
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-100">
                    Female
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Official Email</span>
                <span className="text-slate-800 font-semibold">{currentUser.email || 'director@zitelcastle.edu.ng'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Verified Telephone</span>
                <span className="text-slate-800 font-semibold">{currentUser.phone || '+234 802 123 4567'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Institutional Scope</span>
                <span className="text-slate-800 font-semibold">Multi-Branch Oversight (Bungalow & Ijegun)</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Account Role Distinction</span>
                <span className="text-slate-800 font-semibold">School Director (Administrative & Academic Head)</span>
              </div>
            </div>
          </div>

          {/* Password Update Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Director Account Security & Credentials
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update password for Dr. Nwankwo Chika ({currentUser.schoolId || 'ZCS/DIR/00001'})
            </p>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold mb-4 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="max-w-md space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Director Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Zitel Chat Room Modal */}
      <CommunicationHubModal
        currentUser={currentUser}
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setChatRecipientId(undefined);
        }}
        initialRecipientId={chatRecipientId}
      />

      {/* 2. Official Student Report Card Modal */}
      {selectedStudentForReportCard && (
        <ReportCardModal
          student={selectedStudentForReportCard}
          onClose={() => setSelectedStudentForReportCard(null)}
        />
      )}

      {/* 3. Student Lifecycle Status Modal */}
      {selectedStudentForStatus && (
        <StudentStatusModal
          student={selectedStudentForStatus}
          currentUser={currentUser}
          onClose={() => setSelectedStudentForStatus(null)}
          onSuccess={() => setSelectedStudentForStatus(null)}
        />
      )}

      {/* 4. Teacher Status Modal */}
      {selectedTeacherForStatus && (
        <TeacherStatusModal
          teacher={selectedTeacherForStatus}
          currentUser={currentUser}
          onClose={() => setSelectedTeacherForStatus(null)}
          onSuccess={() => setSelectedTeacherForStatus(null)}
        />
      )}

      {/* 5. Report Detail Viewer Modal */}
      {selectedReportIdForViewer && (
        <ReportDetailViewerModal
          reportId={selectedReportIdForViewer}
          currentUser={currentUser}
          onClose={() => setSelectedReportIdForViewer(null)}
        />
      )}

      {/* 6. Admin Student Enrollment Modal */}
      {showEnrollModal && (
        <AdminStudentEnrollmentModal
          currentUser={currentUser}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={(student, slip) => {
            setShowEnrollModal(false);
            if (slip) setActiveCredentialSlip(slip);
          }}
        />
      )}

      {/* 7. Bulk Student Upload Modal */}
      {showBulkUploadModal && (
        <BulkStudentUploadModal
          currentUser={currentUser}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => setShowBulkUploadModal(false)}
        />
      )}

      {/* 8. Credential Slip Modal */}
      {activeCredentialSlip && (
        <CredentialSlipModal
          slip={activeCredentialSlip}
          onClose={() => setActiveCredentialSlip(null)}
        />
      )}

      {/* 9. Offline Payment Confirmation Modal */}
      {showOfflinePaymentModal && (
        <ConfirmOfflinePaymentModal
          currentUser={currentUser}
          initialInvoice={selectedInvoiceForPayment}
          onClose={() => {
            setShowOfflinePaymentModal(false);
            setSelectedInvoiceForPayment(null);
          }}
          onSuccess={() => {
            setShowOfflinePaymentModal(false);
            setSelectedInvoiceForPayment(null);
          }}
        />
      )}

      {/* 10. Director Onboard Administrator Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Onboard Branch Administrator</h3>
                  <p className="text-xs text-slate-500">Configure administrative access, branch scope, and credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gabriel Adekunle"
                  value={adminForm.name}
                  onChange={e => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="gabriel.adekunle@zitel.edu.ng"
                    value={adminForm.email}
                    onChange={e => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={adminForm.phone}
                    onChange={e => setAdminForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Campus *</label>
                  <select
                    value={adminForm.branchId}
                    onChange={e => setAdminForm(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custom Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Academic Administrator"
                    value={adminForm.customRoleTitle}
                    onChange={e => setAdminForm(prev => ({ ...prev, customRoleTitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Scope</label>
                <select
                  value={adminForm.scope}
                  onChange={e => setAdminForm(prev => ({ ...prev, scope: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ALL_SCHOOL">Full Branch Operations (All Modules)</option>
                  <option value="ACADEMIC_ONLY">Academic Only (Teaching Staff, Classes, Students, Reports)</option>
                  <option value="FINANCE_ONLY">Finance & Bursary Only (Billing, Invoicing, Payments)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Assigned Privileges & Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {[
                    { id: 'manage_teachers', label: 'Manage Teaching Staff' },
                    { id: 'manage_classes', label: 'Manage Classes' },
                    { id: 'manage_students', label: 'Manage Students' },
                    { id: 'manage_attendance', label: 'Manage Attendance' },
                    { id: 'manage_reports', label: 'Manage Academic Reports' },
                    { id: 'manage_finance', label: 'Manage Fees & Ledger' },
                  ].map(perm => (
                    <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adminForm.permissions.includes(perm.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setAdminForm(prev => ({ ...prev, permissions: [...prev.permissions, perm.id] }));
                          } else {
                            setAdminForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== perm.id) }));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 text-[11px] font-medium">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  A unique school staff ID and secure temporary login voucher will automatically be issued upon submission.
                </p>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Create Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Director Onboard Teacher Modal */}
      {showCreateTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Onboard Teaching Staff Member</h3>
                  <p className="text-xs text-slate-500">Add teacher, designate campus, and issue login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeacherModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacherSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Blessing Okon"
                  value={teacherForm.name}
                  onChange={e => setTeacherForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="blessing.okon@zitel.edu.ng"
                    value={teacherForm.email}
                    onChange={e => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+234 802 987 6543"
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Campus *</label>
                  <select
                    value={teacherForm.branchId}
                    onChange={e => setTeacherForm(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Primary Form Tutor"
                    value={teacherForm.customRoleTitle}
                    onChange={e => setTeacherForm(prev => ({ ...prev, customRoleTitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={teacherForm.gender}
                    onChange={e => setTeacherForm(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Homeroom Class (Optional)</label>
                  <select
                    value={teacherForm.homeroomClassId}
                    onChange={e => setTeacherForm(prev => ({ ...prev, homeroomClassId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">None (Subject Specialist / Floater)</option>
                    {allClasses
                      .filter(c => !teacherForm.branchId || c.branchId === teacherForm.branchId)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.section ? `(${c.section})` : ''} - {c.branchId === 'branch_bungalow' ? 'Bungalow' : 'Ijegun'}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  A formal staff credential slip with unique Staff ID and temporary login pass will be generated immediately for the teacher.
                </p>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Onboard Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
