import React, { useState, useEffect } from 'react';
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
  Settings,
  ShieldCheck,
  TrendingUp,
  Send,
  BellRing,
  Check,
  Building2,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  User,
  ClassRoom,
  Subject,
  FeePayment,
  TimetableSlot,
  Invoice,
  Branch
} from '../../types';
import { db } from '../../services/db';
import { BulkStudentUploadModal } from '../common/BulkStudentUploadModal';
import { AcademicSubjectManager } from '../common/AcademicSubjectManager';
import { BehaviorCategorySettings } from './BehaviorCategorySettings';
import { WeeklyTeacherReportManager } from '../teacher/WeeklyTeacherReportManager';
import { FinancialDashboardTab } from './FinancialDashboardTab';
import { ActiveTermFinancialSummaryCard } from './ActiveTermFinancialSummaryCard';
import { ChiefBursarFinanceDashboard } from './ChiefBursarFinanceDashboard';
import { exportStudentsToCSV, exportFinancialsToCSV } from '../../utils/exportCsv';

interface AdminDashboardProps {
  currentUser: User;
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  activeTab,
}) => {
  // Check if current user is Chief Finance or Bursar
  const isChiefFinanceOrBursar =
    currentUser.scope === 'FINANCE_ONLY' ||
    Boolean(currentUser.customRoleTitle?.toLowerCase().includes('bursar')) ||
    Boolean(currentUser.customRoleTitle?.toLowerCase().includes('finance')) ||
    currentUser.username === 'bursar.central';

  const [currentTab, setCurrentTab] = useState<
    | 'overview'
    | 'teachers'
    | 'classes'
    | 'curriculum'
    | 'timetable'
    | 'financial_dashboard'
    | 'finance'
    | 'broadcast'
    | 'behavior_categories'
    | 'weekly_reports'
  >((activeTab as any) || (isChiefFinanceOrBursar ? 'financial_dashboard' : 'overview'));

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab as any);
    }
  }, [activeTab]);

  // Modals
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showBulkStudentUploadModal, setShowBulkStudentUploadModal] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<Invoice | null>(null);
  const [selectedPaymentForReview, setSelectedPaymentForReview] = useState<FeePayment | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Automated Payment Reminder State
  const [showBulkRemindersModal, setShowBulkRemindersModal] = useState(false);
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<Invoice | null>(null);
  const [reminderCustomNote, setReminderCustomNote] = useState('');
  const [reminderFeedbackMsg, setReminderFeedbackMsg] = useState<string | null>(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  // State for forms
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    assignedClasses: ['cls_p3a'],
    assignedSubjects: ['sub_math', 'sub_sci'],
    qualifications: 'B.Ed in Primary Education',
  });

  const [classForm, setClassForm] = useState({
    name: 'Primary 4A',
    gradeLevel: 4,
    section: 'A',
    roomNumber: 'Room 204',
    capacity: 25,
    formTeacherId: 'user_teacher_sarah',
    formTeacherName: 'Sarah Jenkins',
    academicYear: '2025/2026',
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    category: 'Core' as 'Core' | 'Elective' | 'Activity',
    gradeLevels: [1, 2, 3, 4, 5, 6],
    description: '',
  });

  const [timetableForm, setTimetableForm] = useState({
    classId: 'cls_p3a',
    className: 'Primary 3A',
    subjectId: 'sub_math',
    subjectName: 'Mathematics',
    teacherId: 'user_teacher_sarah',
    teacherName: 'Sarah Jenkins',
    day: 'Monday' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday',
    startTime: '09:00',
    endTime: '09:45',
    roomNumber: 'Room 103',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'CARD' as FeePayment['paymentMethod'],
  });

  const [broadcastMessage, setBroadcastMessage] = useState({
    title: '',
    content: '',
    audience: 'ALL' as 'ALL' | 'TEACHERS' | 'PARENTS',
  });

  const [timetableConflict, setTimetableConflict] = useState<string | null>(null);

  // Fetch Database Collections
  const allUsers = db.getUsers();
  const teachers = allUsers.filter(u => u.role === 'TEACHER');
  const classes = db.getClasses();
  const subjects = db.getSubjects();
  const timetable = db.getTimetable();
  const invoices = db.getInvoices(currentUser);
  const payments = db.getPayments(currentUser);
  const students = db.getStudents();
  const feeStructures = db.getFeeStructures();
  const branches = db.getBranches();
  const currency = db.getSchoolProfile().currencySymbol || '₦';

  // Branch Financial Distribution (Bungalow vs Ijegun)
  const branchFinancialData = branches.map(b => {
    const bInvoices = invoices.filter(inv => inv.branchId === b.id);
    const paid = bInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const outstanding = bInvoices.reduce((acc, i) => acc + i.balance, 0);
    const billed = bInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const rate = billed > 0 ? Math.round((paid / billed) * 100) : 0;
    const cleanName = b.name.includes('Bungalow') ? 'Bungalow Campus' : b.name.includes('Ijegun') ? 'Ijegun Campus' : b.name;
    return {
      id: b.id,
      name: cleanName,
      shortName: b.code || (b.name.includes('Bungalow') ? 'Bungalow' : 'Ijegun'),
      paid,
      outstanding,
      billed,
      rate,
    };
  });

  // Monthly collection trend for current academic term
  const monthlyTrendData = [
    { month: 'Jun', collections: 4200000, target: 4000000, cumulative: 4200000 },
    { month: 'Jul', collections: 7850000, target: 7500000, cumulative: 12050000 },
    { month: 'Aug', collections: 12900000, target: 12000000, cumulative: 24950000 },
    { month: 'Sep', collections: 19400000, target: 18500000, cumulative: 44350000 },
    { month: 'Oct', collections: 8650000, target: 8000000, cumulative: 53000000 },
    { month: 'Nov', collections: 4120000, target: 4500000, cumulative: 57120000 },
  ];

  // 7+ Days overdue invoices calculation
  const today = new Date();
  const overdue7DaysInvoices = invoices.filter(inv => {
    if (inv.balance <= 0 || inv.status === 'PAID') return false;
    const dueDate = new Date(inv.dueDate);
    const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  });
  const totalOverdue7Days = overdue7DaysInvoices.reduce((acc, i) => acc + i.balance, 0);
  const pendingPayments = payments.filter(p => p.status === 'PENDING_VERIFICATION');

  const handleSendBulkReminders = () => {
    setIsSendingReminders(true);
    try {
      const res = db.sendBulkOverduePaymentReminders(currentUser, 7);
      setReminderFeedbackMsg(
        `Dispatched automated push notifications & internal messages to ${res.totalSent} parent(s) with 7+ day overdue invoices (Total Overdue: ${currency}${res.totalOverdueAmount.toLocaleString()}).`
      );
      setTimeout(() => setReminderFeedbackMsg(null), 7000);
      setShowBulkRemindersModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch automated reminders.');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleSendSingleReminder = (inv: Invoice) => {
    try {
      db.sendPaymentReminder(inv.id, currentUser, reminderCustomNote);
      setReminderFeedbackMsg(
        `Dispatched official payment reminder to ${inv.parentName} for ${inv.studentName} (${inv.invoiceNumber}).`
      );
      setTimeout(() => setReminderFeedbackMsg(null), 5000);
      setSelectedInvoiceForReminder(null);
      setReminderCustomNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to send reminder.');
    }
  };

  // Create Teacher
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name || !teacherForm.email || !teacherForm.username) {
      alert('Please fill all required fields');
      return;
    }

    const staffId = `TCH-2026-${String(teachers.length + 1).padStart(3, '0')}`;
    db.createUser(
      {
        name: teacherForm.name,
        email: teacherForm.email,
        username: teacherForm.username,
        role: 'TEACHER',
        status: 'active',
        staffId,
        phone: teacherForm.phone,
        assignedClasses: teacherForm.assignedClasses,
        assignedSubjects: teacherForm.assignedSubjects,
        qualifications: teacherForm.qualifications,
        permissions: [],
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      },
      currentUser
    );

    setShowCreateTeacherModal(false);
    setTeacherForm({
      name: '',
      email: '',
      username: '',
      phone: '',
      assignedClasses: ['cls_p3a'],
      assignedSubjects: ['sub_math'],
      qualifications: 'B.Ed in Primary Education',
    });
  };

  // Create Class
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === classForm.formTeacherId);
    const activeBranch = db.getActiveBranchId();
    const branchId = currentUser.branchId || (activeBranch !== 'all' ? activeBranch : 'branch_bungalow');
    const branchName = currentUser.branchName || (branchId === 'branch_ijegun' ? 'Zitel Castle School Ijegun' : 'Zitel Castle School Bungalow');
    const sectionType = classForm.gradeLevel <= 6 ? 'PRIMARY' : classForm.gradeLevel <= 9 ? 'JUNIOR_SECONDARY' : 'SENIOR_SECONDARY';

    db.createClass(
      {
        name: classForm.name,
        gradeLevel: classForm.gradeLevel,
        section: classForm.section,
        sectionType,
        branchId,
        branchName,
        roomNumber: classForm.roomNumber,
        capacity: classForm.capacity,
        formTeacherId: classForm.formTeacherId,
        formTeacherName: teacher ? teacher.name : 'Unassigned',
        academicYear: classForm.academicYear,
      },
      currentUser
    );
    setShowCreateClassModal(false);
  };

  // Create Subject
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    db.createSubject(
      {
        name: subjectForm.name,
        code: subjectForm.code.toUpperCase(),
        category: subjectForm.category,
        gradeLevels: subjectForm.gradeLevels,
        description: subjectForm.description,
        icon: 'BookOpen',
      },
      currentUser
    );
    setShowCreateSubjectModal(false);
    setSubjectForm({
      name: '',
      code: '',
      category: 'Core',
      gradeLevels: [1, 2, 3, 4, 5, 6],
      description: '',
    });
  };

  // Add Timetable Slot with conflict validation
  const handleAddTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setTimetableConflict(null);

    const cls = classes.find(c => c.id === timetableForm.classId);
    const sub = subjects.find(s => s.id === timetableForm.subjectId);
    const tch = teachers.find(t => t.id === timetableForm.teacherId);

    const result = db.addTimetableSlot(
      {
        classId: timetableForm.classId,
        className: cls?.name || 'Class',
        subjectId: timetableForm.subjectId,
        subjectName: sub?.name || 'Subject',
        teacherId: timetableForm.teacherId,
        teacherName: tch?.name || 'Teacher',
        day: timetableForm.day,
        startTime: timetableForm.startTime,
        endTime: timetableForm.endTime,
        room: timetableForm.roomNumber,
        roomNumber: timetableForm.roomNumber,
      },
      currentUser
    );

    if (result.conflict) {
      setTimetableConflict(result.conflict);
    } else {
      setShowAddTimetableModal(false);
    }
  };

  // Record Fee Payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRecordPaymentModal || paymentForm.amount <= 0) return;

    db.recordPayment(
      showRecordPaymentModal.id,
      Number(paymentForm.amount),
      paymentForm.paymentMethod,
      currentUser
    );

    setShowRecordPaymentModal(null);
    setPaymentForm({ amount: 0, paymentMethod: 'CARD' });
  };

  // Send School Broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.title || !broadcastMessage.content) return;

    // Distribute notification
    db.addNotification({
      userId: 'user_parent_elena',
      title: `[ANNOUNCEMENT] ${broadcastMessage.title}`,
      message: broadcastMessage.content,
      type: 'SYSTEM',
    });

    db.addAuditLog(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      'BROADCAST_SENT',
      'Settings',
      undefined,
      `Broadcast message sent to ${broadcastMessage.audience}: "${broadcastMessage.title}"`
    );

    alert('Broadcast announcement successfully dispatched across school channels.');
    setBroadcastMessage({ title: '', content: '', audience: 'ALL' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Administrator Console
            </span>
            <span className="text-xs text-slate-400 font-mono">• Delegated School Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 font-display">
            {currentUser.customRoleTitle || 'Academic & Operational Management'}
          </h1>
          <p className="text-xs text-slate-300">
            Scope: <span className="font-semibold text-indigo-300">{currentUser.scope || 'ALL_SCHOOL'}</span>
          </p>
        </div>

        {/* Informational badge */}
        <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-xs text-slate-200 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            Role Enforcement: Only Super Admin can create/manage Admin accounts.
          </span>
        </div>
      </div>

      {/* Requirement 44: Admin Dashboard Payment Alert */}
      {pendingPayments.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                  Payment Verification Alert
                </span>
                <span className="text-xs font-bold text-slate-800">New payment(s) awaiting verification</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                <strong className="text-amber-800">{pendingPayments.length} parent bank transfer proof(s)</strong> submitted and waiting for Bursary review and credit settlement.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCurrentTab('finance');
                if (pendingPayments[0]) {
                  setSelectedPaymentForReview(pendingPayments[0]);
                  setReviewRemarks('');
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Review & Verify Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Automated Reminder Feedback Toast Banner */}
      {reminderFeedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reminderFeedbackMsg}</span>
          </div>
          <button
            onClick={() => setReminderFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(isChiefFinanceOrBursar
          ? [
              { id: 'overview', label: 'Bursary Executive Overview', icon: BarChart3 },
              { id: 'financial_dashboard', label: 'Multi-Branch Analytics', icon: TrendingUp },
              { id: 'finance', label: 'Fee Invoicing & Accounts', icon: DollarSign },
              { id: 'broadcast', label: 'Financial Notices & Broadcasts', icon: MessageSquare },
            ]
          : [
              { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'financial_dashboard', label: 'Financial Dashboard', icon: BarChart3 },
              { id: 'finance', label: 'Fee Management & Invoicing', icon: DollarSign },
              { id: 'teachers', label: 'Faculty & Teachers', icon: GraduationCap },
              { id: 'classes', label: 'Classes & Cohorts', icon: Layers },
              { id: 'weekly_reports', label: 'Weekly Teacher Reports', icon: ShieldCheck },
              { id: 'behavior_categories', label: 'Behavior Categories', icon: Settings },
              { id: 'curriculum', label: 'Curriculum & Subjects', icon: BookOpen },
              { id: 'timetable', label: 'Timetable Scheduling', icon: Calendar },
              { id: 'broadcast', label: 'School Broadcasts', icon: MessageSquare },
            ]
        ).map(t => {
          const Icon = t.icon;
          const isCurrent = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCurrentTab(t.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview (Default Landing View) */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {isChiefFinanceOrBursar ? (
            <ChiefBursarFinanceDashboard
              currentUser={currentUser}
              onRecordPayment={(inv) => {
                setShowRecordPaymentModal(inv);
                setPaymentForm({ amount: inv.balance, paymentMethod: 'CARD' });
              }}
              onTriggerReminder={(inv) => {
                setSelectedInvoiceForReminder(inv);
                setReminderCustomNote('');
              }}
              onIssueInvoice={() => setShowCreateInvoiceModal(true)}
            />
          ) : (
            <>
              {/* Operational KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Enrolled Students</span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{students.length}</p>
                  <span className="text-[11px] text-slate-500 mt-1 block">Active across campuses</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Cohorts</span>
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{classes.length}</p>
                  <span className="text-[11px] text-slate-500 mt-1 block">Primary & Secondary</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Teaching Faculty</span>
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">{teachers.length}</p>
                  <span className="text-[11px] text-slate-500 mt-1 block">Subject & Form Teachers</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-700 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Term Collection</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    {invoices.reduce((a, b) => a + b.totalAmount, 0) > 0
                      ? `${Math.round((invoices.reduce((a, b) => a + b.paidAmount, 0) / invoices.reduce((a, b) => a + b.totalAmount, 0)) * 100)}%`
                      : '0%'}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                    {currency}{invoices.reduce((a, b) => a + b.paidAmount, 0).toLocaleString()} Collected
                  </span>
                </div>
              </div>

              {/* Requirement: Financial Summary card using Recharts plotting 'Total Paid' vs 'Outstanding' balances aggregated by branch for the currently active academic term */}
              <ActiveTermFinancialSummaryCard
                currentUser={currentUser}
                onNavigateToFinance={() => setCurrentTab('financial_dashboard')}
                onNavigateToLedger={() => setCurrentTab('finance')}
              />

              {/* Operational Quick Actions & Faculty Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Assigned Faculty & Active Cohorts</h3>
                      <p className="text-xs text-slate-500">Quick oversight of class rooms and form teachers.</p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('teachers')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>View Full Roster</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {classes.slice(0, 4).map(c => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                          <span className="text-[11px] text-slate-500">Form: {c.formTeacherName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                          {c.roomNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                      Quick Actions
                    </span>
                    <h3 className="text-base font-bold mt-2">Administrative Shortcuts</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Directly execute frequent operational workflows.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setShowCreateTeacherModal(true)}
                      className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Onboard New Teacher</span>
                      <Plus className="w-4 h-4 text-indigo-300" />
                    </button>
                    <button
                      onClick={() => setShowCreateClassModal(true)}
                      className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Create Class Cohort</span>
                      <Plus className="w-4 h-4 text-indigo-300" />
                    </button>
                    <button
                      onClick={() => setCurrentTab('financial_dashboard')}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Open Financial Dashboard</span>
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Teachers */}
      {currentTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Faculty Roster & Class Assignments</h2>
              <p className="text-xs text-slate-500">Onboard faculty members and assign primary classes and teaching subjects.</p>
            </div>
            <button
              onClick={() => setShowCreateTeacherModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Teacher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(tch => (
              <div
                key={tch.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={tch.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'}
                      alt={tch.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-100"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{tch.name}</h3>
                      <span className="font-mono text-[11px] text-slate-400 block">{tch.staffId}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {tch.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Assigned Classes:</span>
                    <span className="font-semibold text-slate-900">
                      {tch.assignedClasses?.map(c => classes.find(cl => cl.id === c)?.name).join(', ') || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subjects:</span>
                    <span className="font-semibold text-indigo-700">
                      {tch.assignedSubjects?.map(s => subjects.find(sub => sub.id === s)?.name).join(', ') || 'All'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Qualifications:</span>
                    <span className="italic text-slate-700 truncate max-w-[140px]">
                      {tch.qualifications?.[0] || 'B.Ed'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{tch.email}</span>
                  <span className="font-mono">{tch.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Classes */}
      {currentTab === 'classes' && (
        <div className="space-y-4">
          {bulkSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
              <button
                onClick={() => setBulkSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Class Cohorts & Sections (Primary 1 to 6)</h2>
              <p className="text-xs text-slate-500">Configure classroom capacities, form teachers, and enrollment limits.</p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => exportStudentsToCSV(students, classes)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Download Student Roster CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Students</span>
              </button>
              <button
                onClick={() => setShowBulkStudentUploadModal(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs cursor-pointer"
                title="Bulk Intake Students via CSV / JSON"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Enrollment</span>
              </button>
              <button
                onClick={() => setShowCreateClassModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Class</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cl => (
              <div key={cl.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      P{cl.gradeLevel}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{cl.name}</h3>
                      <p className="text-xs text-slate-500">{cl.roomNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {cl.enrolledCount} / {cl.capacity} Enrolled
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="text-slate-400">Form Teacher:</span>{' '}
                    <span className="font-semibold text-slate-800">{cl.formTeacherName}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Academic Year:</span> {cl.academicYear}
                  </p>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cl.enrolledCount / cl.capacity) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span>Capacity: {cl.capacity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Curriculum & Subjects */}
      {currentTab === 'curriculum' && (
        <AcademicSubjectManager currentUser={currentUser} />
      )}

      {/* Tab: Timetable */}
      {currentTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">School Timetable Scheduler & Conflict Detector</h2>
              <p className="text-xs text-slate-500">Automated clash detection prevents teacher overlapping and room collisions.</p>
            </div>
            <button
              onClick={() => {
                setShowAddTimetableModal(true);
                setTimetableConflict(null);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
              const daySlots = timetable.filter(t => t.day === day);
              return (
                <div key={day} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{day}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{daySlots.length} Scheduled Periods</span>
                  </div>
                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{slot.subjectName}</span>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {slot.startTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">{slot.className} • {slot.roomNumber}</p>
                        <p className="text-[10px] text-slate-400 italic">{slot.teacherName}</p>
                      </div>
                    ))}
                    {daySlots.length === 0 && (
                      <p className="text-center py-6 text-slate-300 text-xs italic">No classes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Financial Dashboard (Recharts collected vs pending, branch performance, ledger) */}
      {currentTab === 'financial_dashboard' && (
        <FinancialDashboardTab
          currentUser={currentUser}
          onRecordPayment={(inv) => {
            setShowRecordPaymentModal(inv);
            setPaymentForm({ amount: inv.balance, paymentMethod: 'CARD' });
          }}
          onTriggerReminder={(inv) => {
            setSelectedInvoiceForReminder(inv);
            setReminderCustomNote('');
          }}
        />
      )}

      {/* Tab: Finance & Invoices */}
      {currentTab === 'finance' && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {currency}{invoices.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {invoices.length} billing accounts across campuses
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-600 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Collected Revenue</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {currency}{invoices.reduce((a, b) => a + b.paidAmount, 0).toLocaleString()}
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold mt-1">
                <span>
                  {invoices.reduce((a, b) => a + b.totalAmount, 0) > 0
                    ? `${Math.round((invoices.reduce((a, b) => a + b.paidAmount, 0) / invoices.reduce((a, b) => a + b.totalAmount, 0)) * 100)}% term collection rate`
                    : '0%'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-600 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Outstanding Balance</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-700">
                {currency}{invoices.reduce((a, b) => a + b.balance, 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                {invoices.filter(i => i.balance > 0).length} accounts pending full settlement
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-rose-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">7+ Days Past Due</span>
                  <BellRing className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-black text-rose-700">
                  {currency}{totalOverdue7Days.toLocaleString()}
                </p>
                <span className="text-[11px] text-rose-600 font-bold block mt-0.5">
                  {overdue7DaysInvoices.length} Overdue Invoices
                </span>
              </div>
              <button
                disabled={overdue7DaysInvoices.length === 0}
                onClick={() => setShowBulkRemindersModal(true)}
                className={`mt-2.5 w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  overdue7DaysInvoices.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send 7-Day Reminders</span>
              </button>
            </div>
          </div>

          {/* Financial Analytics Visualization Grid: Bar Chart (Bungalow vs Ijegun) + Monthly Trend Line */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Campus Fee Comparison Bar Chart */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Campus Fee Distribution (Bungalow vs. Ijegun)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total fees paid versus outstanding balances across Zitel Castle School campuses.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="flex items-center space-x-1 font-semibold text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                      <span>Paid</span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-rose-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                      <span>Outstanding</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={branchFinancialData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '10px 14px',
                        }}
                        formatter={(value: any, name: any) => [
                          `₦${Number(value).toLocaleString()}`,
                          name === 'paid' ? 'Total Fees Paid' : 'Outstanding Balance',
                        ]}
                        labelStyle={{ color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}
                      />
                      <Bar
                        dataKey="paid"
                        name="paid"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar
                        dataKey="outstanding"
                        name="outstanding"
                        fill="#f43f5e"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Campus Comparison Summary Pills */}
              <div className="grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-slate-100">
                {branchFinancialData.map(b => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{b.name}</span>
                      <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                        {b.rate}% Collected
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Paid: <strong className="text-emerald-700">₦{b.paid.toLocaleString()}</strong></span>
                      <span>Bal: <strong className="text-rose-600">₦{b.outstanding.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Fee Collection Trend Line */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Monthly Collection Trend</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Term collection progression & monthly remittance velocity.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                    Current Term
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyTrendData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '10px 14px',
                        }}
                        formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Monthly Collection']}
                        labelStyle={{ color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="collections"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#collectionGradient)"
                        dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#4338ca', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs mt-2">
                <span className="text-indigo-950 font-bold">Term Cumulative Total</span>
                <span className="font-mono font-black text-indigo-700 text-sm">
                  {currency}{monthlyTrendData[monthlyTrendData.length - 1].cumulative.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Invoices Ledger Table */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Fee Invoices & Payment Ledger</h3>
                <span className="text-xs text-slate-400 font-mono">{invoices.length} Invoices On Record</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBulkRemindersModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Trigger automated payment reminders to parents with overdue fees"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-600" />
                  <span>Automated 7-Day Reminders ({overdue7DaysInvoices.length})</span>
                </button>
                <button
                  onClick={() => exportFinancialsToCSV(invoices)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Download Financial Ledger as CSV"
                >
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Student & Class</th>
                    <th className="py-3 px-4">Campus Branch</th>
                    <th className="py-3 px-4">Term</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => {
                    const dueDateObj = new Date(inv.dueDate);
                    const diffDays = Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
                    const is7DaysOverdue = inv.balance > 0 && inv.status !== 'PAID' && diffDays >= 7;

                    const branch = branches.find(b => b.id === inv.branchId);

                    return (
                      <tr key={inv.id} className={`hover:bg-slate-50/50 ${is7DaysOverdue ? 'bg-rose-50/20' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div>{inv.invoiceNumber}</div>
                          {is7DaysOverdue && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                              {diffDays}d Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{inv.studentName}</p>
                          <span className="text-[11px] text-slate-500">{inv.className}</span>
                          {inv.items && inv.items.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {inv.items.map((it, idx) => {
                                const st = it.status || (it.paidAmount >= it.amount ? 'Paid' : (it.paidAmount || 0) > 0 ? 'Partial' : 'Pending');
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                      st === 'Paid' || st === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : st === 'Partial' || st === 'PARTIAL'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                    title={`${it.title}: Billed ₦${it.amount.toLocaleString()}, Paid ₦${(it.paidAmount || 0).toLocaleString()}`}
                                  >
                                    {it.title}: {st}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {branch?.name.includes('Ijegun') ? 'Ijegun Campus' : 'Bungalow Campus'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{inv.term}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{currency}{inv.totalAmount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">{currency}{inv.paidAmount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-amber-600">{currency}{inv.balance.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {inv.balance > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedInvoiceForReminder(inv);
                                  setReminderCustomNote('');
                                }}
                                title="Dispatch automated payment reminder to parent"
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] transition-colors flex items-center space-x-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Remind</span>
                              </button>
                            )}
                            {inv.balance > 0 ? (
                              <button
                                onClick={() => {
                                  setShowRecordPaymentModal(inv);
                                  setPaymentForm({ amount: inv.balance, paymentMethod: 'CARD' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors"
                              >
                                Record Pay
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Settled</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Manual Payment Proofs Verification */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Parent Bank Transfer & Manual Payment Verifications</span>
                  {payments.filter(p => p.status === 'PENDING_VERIFICATION').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold animate-pulse">
                      {payments.filter(p => p.status === 'PENDING_VERIFICATION').length} Pending
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Review submitted bank transfer receipts and payment proofs uploaded by parents before credit settlement.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student & Invoice</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method / Bank</th>
                    <th className="py-3 px-4">Reference / Payer</th>
                    <th className="py-3 px-4">Proof File</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{p.studentName}</p>
                        <span className="text-[11px] font-mono text-slate-500">{p.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {currency}{p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{p.paymentMethod}</div>
                        {p.bankName && <div className="text-[10px] text-slate-400">{p.bankName}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <p className="font-mono text-[11px]">{p.transactionRef}</p>
                        <span className="text-[10px] text-slate-500">{p.accountHolderName || 'Guardian'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {p.proofUrl ? (
                          <a
                            href={p.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-bold underline"
                          >
                            <span>View Proof</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">Manual / POS</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'PENDING_VERIFICATION'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.status || 'VERIFIED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'PENDING_VERIFICATION' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPaymentForReview(p);
                                setReviewRemarks('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Review & Verify
                            </button>
                          </div>
                        ) : p.status === 'VERIFIED' ? (
                          <span className="text-emerald-600 font-bold text-[11px] inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{p.receiptNumber || 'Verified'}</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px]">
                            Rejected ({p.adminRemarks || 'Invalid proof'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Broadcast */}
      {currentTab === 'broadcast' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs max-w-2xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Broadcast Institutional Announcement</h2>
            <p className="text-xs text-slate-500">Send high-priority notifications to teachers, parents, and students.</p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={broadcastMessage.audience}
                onChange={e => setBroadcastMessage({ ...broadcastMessage, audience: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              >
                <option value="ALL">All School (Teachers, Parents & Staff)</option>
                <option value="TEACHERS">Faculty & Teachers Only</option>
                <option value="PARENTS">Parents & Guardians Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Primary Sports Day Schedule Announced"
                value={broadcastMessage.title}
                onChange={e => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                required
                rows={4}
                placeholder="Type your official announcement..."
                value={broadcastMessage.content}
                onChange={e => setBroadcastMessage({ ...broadcastMessage, content: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              Dispatch Broadcast Announcement
            </button>
          </form>
        </div>
      )}

      {/* Tab: Behavior Categories Configuration */}
      {currentTab === 'behavior_categories' && (
        <BehaviorCategorySettings currentUser={currentUser} />
      )}

      {/* Tab: Weekly Teacher Reports Review */}
      {currentTab === 'weekly_reports' && (
        <WeeklyTeacherReportManager
          currentUser={currentUser}
          activeClass={classes[0]}
        />
      )}

      {/* Modal: Onboard Teacher */}
      {showCreateTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Onboard Faculty Member</h3>
              </div>
              <button
                onClick={() => setShowCreateTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert Clark, M.Ed"
                    value={teacherForm.name}
                    onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="teacher.name@oakridge.edu"
                    value={teacherForm.email}
                    onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. teacher.robert"
                    value={teacherForm.username}
                    onChange={e => setTeacherForm({ ...teacherForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Ed in Elementary Education, Early Childhood Specialist"
                    value={teacherForm.qualifications}
                    onChange={e => setTeacherForm({ ...teacherForm, qualifications: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  Onboard Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Timetable Slot */}
      {showAddTimetableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Schedule Timetable Period</h3>
              </div>
              <button
                onClick={() => setShowAddTimetableModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTimetableSlot} className="p-6 space-y-4">
              {timetableConflict && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{timetableConflict}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Cohort</label>
                  <select
                    value={timetableForm.classId}
                    onChange={e => setTimetableForm({ ...timetableForm, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={timetableForm.subjectId}
                    onChange={e => setTimetableForm({ ...timetableForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Teacher</label>
                  <select
                    value={timetableForm.teacherId}
                    onChange={e => setTimetableForm({ ...timetableForm, teacherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={timetableForm.day}
                    onChange={e => setTimetableForm({ ...timetableForm, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={timetableForm.startTime}
                    onChange={e => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={timetableForm.endTime}
                    onChange={e => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTimetableModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  Verify & Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Fee Payment */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Record Payment Receipt</h3>
              </div>
              <button
                onClick={() => setShowRecordPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p>
                  <span className="text-slate-400">Student:</span>{' '}
                  <span className="font-bold text-slate-900">{showRecordPaymentModal.studentName}</span>
                </p>
                <p>
                  <span className="text-slate-400">Invoice Number:</span>{' '}
                  <span className="font-mono font-bold text-indigo-700">{showRecordPaymentModal.invoiceNumber}</span>
                </p>
                <p>
                  <span className="text-slate-400">Current Outstanding Balance:</span>{' '}
                  <span className="font-bold text-amber-600">₦{showRecordPaymentModal.balance.toLocaleString()}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₦ NAIRA)</label>
                <input
                  type="number"
                  min={1}
                  max={showRecordPaymentModal.balance}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                  <option value="CASH">Cash / Teller</option>
                  <option value="CHECK">Certified Bank Check</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Issue Official Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Student Upload Modal */}
      {showBulkStudentUploadModal && (
        <BulkStudentUploadModal
          currentUser={currentUser}
          onClose={() => setShowBulkStudentUploadModal(false)}
          onSuccess={(count) => {
            setBulkSuccessMsg(`Enrolled ${count} new students into school classes.`);
          }}
        />
      )}

      {/* Review Manual Payment Proof Modal (Requirements 36, 37, 38) */}
      {selectedPaymentForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Verify Parent Payment Proof</h3>
              </div>
              <button
                onClick={() => setSelectedPaymentForReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Student</span>
                  <strong className="text-slate-900 font-bold">{selectedPaymentForReview.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Parent / Payer</span>
                  <strong className="text-slate-900 font-bold">{selectedPaymentForReview.parentName || selectedPaymentForReview.accountHolderName || 'Parent / Guardian'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Branch</span>
                  <span className="text-slate-700">{selectedPaymentForReview.branchName || 'Zitel Castle School'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedPaymentForReview.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Claimed Amount</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">₦{selectedPaymentForReview.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Reference</span>
                  <span className="font-mono font-black text-indigo-900">{selectedPaymentForReview.paymentReference || selectedPaymentForReview.transactionRef}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Method & Bank</span>
                  <span className="text-slate-800">{selectedPaymentForReview.paymentMethod} • {selectedPaymentForReview.bankName || 'Direct Transfer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Submission Date</span>
                  <span className="text-slate-700">{new Date(selectedPaymentForReview.paidAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Proof Preview */}
              {selectedPaymentForReview.proofUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Uploaded Payment Proof / Receipt</label>
                    <a
                      href={selectedPaymentForReview.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold underline"
                    >
                      Open Full Size
                    </a>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 p-2 flex justify-center">
                    <img
                      src={selectedPaymentForReview.proofUrl}
                      alt="Proof of payment"
                      className="max-h-56 object-contain rounded-lg shadow-xs"
                    />
                  </div>
                  {selectedPaymentForReview.proofFileName && (
                    <p className="text-[11px] text-slate-500 italic text-center">
                      File: {selectedPaymentForReview.proofFileName}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Reason Quick Presets if Rejecting */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Bursar / Admin Verification Notes & Audit Remarks
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="Verification remarks or reason for rejection (e.g. Bank statement confirmed / Incorrect amount / Invalid teller receipt)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block w-full">
                    Quick Rejection Reasons:
                  </span>
                  {[
                    'Incorrect amount',
                    'Invalid receipt',
                    'Payment not found on bank statement',
                    'Wrong payment reference',
                    'Duplicate submission',
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setReviewRemarks(reason)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const reason = reviewRemarks.trim() || 'Bank transfer transaction could not be reconciled with school account statement.';
                    db.verifyManualPayment(
                      selectedPaymentForReview.id,
                      'REJECT',
                      reason,
                      currentUser,
                      reason
                    );
                    setSelectedPaymentForReview(null);
                    setReviewRemarks('');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all text-center"
                >
                  Reject Proof & Notify Parent
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentForReview(null);
                      setReviewRemarks('');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      db.verifyManualPayment(
                        selectedPaymentForReview.id,
                        'APPROVE',
                        reviewRemarks.trim() || 'Bank transfer verified and approved against bank statement.',
                        currentUser
                      );
                      setSelectedPaymentForReview(null);
                      setReviewRemarks('');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Payment & Issue Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirement: Automated 7-Day Overdue Payment Reminders Modal */}
      {showBulkRemindersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Automated Payment Reminders (7+ Days Overdue)</h3>
                  <p className="text-xs text-rose-200">
                    Dispatches push notifications & internal messages to parent inboxes with branch payment instructions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkRemindersModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Automated Notification Summary</span>
                </div>
                <p>
                  Found <strong className="font-bold">{overdue7DaysInvoices.length} overdue invoices</strong> past the 7-day grace threshold, totaling <strong className="font-bold">{currency}{totalOverdue7Days.toLocaleString()}</strong> in outstanding tuition and fees.
                </p>
                <p className="text-[11px] text-amber-800">
                  Each parent will receive a detailed notification with their child's outstanding balance, invoice number, and campus-specific bank account details (Bungalow or Ijegun).
                </p>
              </div>

              {/* Overdue Accounts Preview List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Invoices & Parents ({overdue7DaysInvoices.length})
                </span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/50">
                  {overdue7DaysInvoices.map(inv => {
                    const branch = branches.find(b => b.id === inv.branchId);
                    return (
                      <div key={inv.id} className="p-3 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{inv.studentName} ({inv.className})</p>
                          <p className="text-[11px] text-slate-500">
                            Parent: <span className="font-semibold text-slate-700">{inv.parentName}</span> • Inv: <span className="font-mono text-indigo-600">{inv.invoiceNumber}</span>
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Campus: {branch?.name.includes('Ijegun') ? 'Ijegun Campus' : 'Bungalow Campus'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-rose-600 block">{currency}{inv.balance.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Due: {inv.dueDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notification Content Preview */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Message Template Preview</span>
                <p className="font-medium text-slate-700 italic">
                  "Dear [Parent], this is an official reminder from Zitel Castle School regarding an outstanding balance of [₦Amount] for [Student] ([Class]). Please make payment to the campus bank account details and submit proof via your parent portal."
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowBulkRemindersModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingReminders || overdue7DaysInvoices.length === 0}
                onClick={handleSendBulkReminders}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingReminders ? 'Dispatching Notifications...' : `Dispatch Reminders to ${overdue7DaysInvoices.length} Parent(s)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Invoice Payment Reminder Modal */}
      {selectedInvoiceForReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Send Payment Reminder</h3>
                  <p className="text-xs text-amber-100">{selectedInvoiceForReminder.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceForReminder(null)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Student & Class:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForReminder.studentName} ({selectedInvoiceForReminder.className})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Parent / Guardian:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForReminder.parentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-black text-rose-600 text-sm">{currency}{selectedInvoiceForReminder.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-mono text-slate-700">{selectedInvoiceForReminder.dueDate}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Administrative Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reminderCustomNote}
                  onChange={e => setReminderCustomNote(e.target.value)}
                  placeholder="e.g. Please note that term exams begin next week, and full fee clearance is required for student hall admission."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                This will automatically send a high-priority push notification and internal system message to the parent with specific bank details for their registered campus.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForReminder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendSingleReminder(selectedInvoiceForReminder)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Reminder Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
