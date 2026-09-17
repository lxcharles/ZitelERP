import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Edit2,
  Lock,
  Sparkles,
  TrendingUp,
  Award,
  DollarSign,
  CalendarCheck,
  Layers,
  History,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  Eye,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  BookOpen,
  Building2,
  GraduationCap,
  Archive,
  Terminal
} from 'lucide-react';
import { User, AdminPermission, PermissionScope, SchoolProfile, AIGovernanceConfig, CredentialSlip } from '../../types';
import { db } from '../../services/db';
import { CredentialSlipModal } from '../common/CredentialSlipModal';
import { BulkStudentUploadModal } from '../common/BulkStudentUploadModal';
import { AcademicSubjectManager } from '../common/AcademicSubjectManager';
import { FinancialMetricCard } from '../common/FinancialMetricCard';
import { DailyCalendarIntelligenceWidget } from '../common/DailyCalendarIntelligenceWidget';
import { SchoolCalendarManager } from '../calendar/SchoolCalendarManager';
import { StudentPromotionManager } from '../promotion/StudentPromotionManager';
import { AcademicArchiveViewer } from '../archive/AcademicArchiveViewer';
import { FormerStudentsHub } from '../archive/FormerStudentsHub';
import { AdvancedAccountInfoSection } from '../common/AdvancedAccountInfoSection';
import { exportStudentsToCSV, exportAttendanceToCSV, exportFinancialsToCSV } from '../../utils/exportCsv';
import { InstitutionalAuditLog } from '../admin/InstitutionalAuditLog';

interface SuperAdminDashboardProps {
  currentUser: User;
  activeTab: string;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  activeTab,
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'admins' | 'academics' | 'promotion' | 'archives' | 'former_students' | 'ai' | 'audit' | 'branding' | 'privacy'>(
    (activeTab as any) === 'academics' ? 'academics' : (activeTab as any) || 'overview'
  );
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<User | null>(null);
  const [selectedAdminForInfo, setSelectedAdminForInfo] = useState<User | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<User | null>(null);
  const [activeCredentialSlip, setActiveCredentialSlip] = useState<CredentialSlip | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Form state for creating/editing Admin
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    username: '',
    customRoleTitle: 'Academic Administrator',
    scope: 'ACADEMIC_ONLY' as PermissionScope,
    phone: '',
    permissions: [
      'manage_teachers',
      'manage_classes',
      'manage_subjects',
      'manage_students',
      'manage_reports',
      'access_ai_tools'
    ] as AdminPermission[],
  });

  const school = db.getSchoolProfile();
  const allUsers = db.getUsers();
  const admins = allUsers.filter(u => u.role === 'ADMIN');
  const teachers = allUsers.filter(u => u.role === 'TEACHER');
  const students = db.getStudents();
  const parents = db.getParents();
  const classes = db.getClasses();
  const attendance = db.getAttendance();
  const invoices = db.getInvoices(currentUser);
  const auditLogs = db.getAuditLogs();
  const aiGov = db.getAIGovernance();
  const branchEnrollmentStats = db.getBranchEnrollmentStats();

  // Metrics
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balance, 0);
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const avgAttendance = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : 96;

  const ALL_PERMISSIONS: { id: AdminPermission; label: string; desc: string }[] = [
    { id: 'manage_teachers', label: 'Manage Teaching Staff & Teachers', desc: 'Onboard, assign classes/subjects, view teacher activity' },
    { id: 'manage_classes', label: 'Manage Classes & Sections', desc: 'Configure classes, form teachers, and capacities' },
    { id: 'manage_subjects', label: 'Manage Subjects & Codes', desc: 'Define academic subjects and curriculum criteria' },
    { id: 'manage_students', label: 'Manage Student Directory', desc: 'View, edit, and oversee student records' },
    { id: 'manage_parents', label: 'Manage Parent Registry', desc: 'Manage parent/guardian profiles and child links' },
    { id: 'manage_curriculum', label: 'Curriculum & Units', desc: 'Track syllabus topics and term milestones' },
    { id: 'manage_timetable', label: 'Timetable Scheduling', desc: 'Build daily/weekly period matrices & resolve clashes' },
    { id: 'manage_fees', label: 'Fee Management & Invoicing', desc: 'Set class fees, record payments, and audit receipts' },
    { id: 'manage_reports', label: 'Academic Reporting', desc: 'Generate school-wide transcripts and grade analytics' },
    { id: 'broadcast_announcements', label: 'Broadcast Announcements', desc: 'Send school notices to teachers and parents' },
    { id: 'access_ai_tools', label: 'Access AI Suite', desc: 'Utilize AI assistants for curriculum and reporting' },
    { id: 'view_audit_logs', label: 'View System Audit Logs', desc: 'Inspect administrative event trails' },
  ];

  const handleTogglePermission = (perm: AdminPermission) => {
    if (adminForm.permissions.includes(perm)) {
      setAdminForm({
        ...adminForm,
        permissions: adminForm.permissions.filter(p => p !== perm),
      });
    } else {
      setAdminForm({
        ...adminForm,
        permissions: [...adminForm.permissions, perm],
      });
    }
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email) {
      alert('Please fill all required fields');
      return;
    }

    const activeBranch = db.getActiveBranchId();
    const branchId = activeBranch !== 'all' ? activeBranch : 'branch_bungalow';
    const branchName = branchId === 'branch_ijegun' ? 'Zitel Castle School Ijegun' : 'Zitel Castle School Bungalow';

    const nameParts = adminForm.name.trim().split(' ');
    const firstName = nameParts[0] || 'Administrator';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const result = db.adminCreateAdminAccount(
      {
        firstName,
        lastName,
        email: adminForm.email,
        phone: adminForm.phone,
        branchId,
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
      username: '',
      customRoleTitle: 'Academic Administrator',
      scope: 'ACADEMIC_ONLY',
      phone: '',
      permissions: ['manage_teachers', 'manage_classes', 'manage_students', 'manage_reports'],
    });
  };

  const handleResetAdminCredentials = (admin: User) => {
    if (confirm(`Generate new temporary access credentials for administrator ${admin.name} (${admin.schoolId})?`)) {
      const resultSlip = db.adminResetUserPassword(admin.id, currentUser);
      setActiveCredentialSlip(resultSlip);
    }
  };

  const handleUpdateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminForEdit) return;

    db.updateUser(
      selectedAdminForEdit.id,
      {
        name: adminForm.name,
        email: adminForm.email,
        customRoleTitle: adminForm.customRoleTitle,
        scope: adminForm.scope,
        permissions: adminForm.permissions,
        phone: adminForm.phone,
      },
      currentUser
    );

    setSelectedAdminForEdit(null);
  };

  const handleToggleAdminStatus = (admin: User) => {
    const nextStatus = admin.status === 'active' ? 'suspended' : 'active';
    db.updateUser(admin.id, { status: nextStatus }, currentUser);
  };

  const handleDeleteAdmin = (admin: User) => {
    if (confirm(`Are you sure you want to remove ${admin.name} from the system?`)) {
      db.deleteUser(admin.id, currentUser);
    }
  };

  if (activeTab === 'calendar') {
    return <SchoolCalendarManager currentUser={currentUser} />;
  }

  if (activeTab === 'audit_logs') {
    return <InstitutionalAuditLog currentUser={currentUser} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase tracking-wider">
              Super Admin
            </span>
            <span className="text-xs text-slate-400 font-mono">• Master Authorization & Platform Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 font-display tracking-tight">
            Welcome, {currentUser.name || 'Alex'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Role: <strong className="text-purple-300">Super Admin</strong> • Platform administrator in charge of Zitel Castle School system.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition-all cursor-pointer"
            title="Bulk Onboard Students via CSV / JSON"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Student Upload</span>
          </button>
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => exportStudentsToCSV(students, classes)}
              className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center space-x-1"
              title="Download Students CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Students</span>
            </button>
            <button
              onClick={() => exportFinancialsToCSV(invoices)}
              className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center space-x-1"
              title="Download Financials CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Ledger</span>
            </button>
          </div>
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Admin</span>
          </button>
        </div>
      </div>

      {importNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricCard
          id="sa-card-admins"
          title="Administrators"
          value={admins.length}
          icon={ShieldCheck}
          variant="purple"
          isMono={false}
          badge={{ text: 'Active', variant: 'emerald' }}
          subtext="Delegated scope authorities"
        />

        <FinancialMetricCard
          id="sa-card-teachers"
          title="Teaching Staff & Teachers"
          value={teachers.length}
          icon={Users}
          variant="emerald"
          isMono={false}
          badge={{ text: `${classes.length} Classes`, variant: 'slate' }}
          subtext={`${students.length} enrolled students`}
        />

        <FinancialMetricCard
          id="sa-card-fees"
          title="Fee Collection"
          value={`₦${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="blue"
          isMono={true}
          badge={{ text: 'Collected', variant: 'emerald' }}
          secondaryBadge={{ text: `₦${totalOutstanding.toLocaleString()} Pending`, variant: 'amber' }}
          subtext="All branch billing accounts"
        />

        <FinancialMetricCard
          id="sa-card-ai"
          title="AI Requests Used"
          value={aiGov.totalRequestsUsed}
          icon={Sparkles}
          variant="indigo"
          isMono={false}
          badge={{ text: `/ ${aiGov.monthlyLimit} budget`, variant: 'slate' }}
          subtext="All AI policies active"
          subtextColor="text-emerald-600"
        />
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Summary', icon: TrendingUp },
          { id: 'admins', label: 'Admin Accounts & RBAC', icon: ShieldCheck },
          { id: 'academics', label: 'Academic & Subject Config', icon: BookOpen },
          { id: 'promotion', label: 'Promotion System', icon: Sparkles },
          { id: 'archives', label: 'Academic Archives', icon: Archive },
          { id: 'former_students', label: 'Former Students', icon: Users },
          { id: 'ai', label: 'AI Governance Suite', icon: Sparkles },
          { id: 'audit', label: 'System Audit Trail', icon: History },
          { id: 'privacy', label: 'Contact Privacy & Requests', icon: Lock },
          { id: 'branding', label: 'School Settings & Branding', icon: Sliders },
        ].map(t => {
          const Icon = t.icon;
          const isCurrent = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab: Academics & Subject Catalogue */}
      {subTab === 'academics' && (
        <AcademicSubjectManager currentUser={currentUser} />
      )}

      {/* Sub-Tab: Student Promotion System */}
      {subTab === 'promotion' && (
        <StudentPromotionManager
          currentUser={currentUser}
          onViewStudentArchive={() => setSubTab('archives')}
        />
      )}

      {/* Sub-Tab: Academic Archives & Correction */}
      {subTab === 'archives' && (
        <AcademicArchiveViewer currentUser={currentUser} />
      )}

      {/* Sub-Tab: Former Students Repository */}
      {subTab === 'former_students' && (
        <FormerStudentsHub
          currentUser={currentUser}
          onOpenStudentArchive={() => setSubTab('archives')}
        />
      )}

      {/* Sub-Tab 1: Overview */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Calendar Intelligence: Active Session, Term Countdown & Upcoming Events */}
          <DailyCalendarIntelligenceWidget currentUser={currentUser} />

          {/* Branch Enrollment Statistics (Bungalow vs Ijegun) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Branch Enrollment Analytics</span>
                </h3>
                <p className="text-xs text-slate-500">Live operational breakdown between Zitel Castle School branches</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                {branchEnrollmentStats.length} Branches Operating
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchEnrollmentStats.map(stat => (
                <div
                  key={stat.branch.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{stat.branch.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{stat.branch.address}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                      {stat.branch.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">{stat.totalStudents}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Teaching Staff</p>
                      <p className="text-base font-black text-indigo-700 mt-0.5">{stat.totalTeachers}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Classrooms</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">{stat.totalClasses}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Branch Capacity Utilization</span>
                      <span>{stat.utilizationRate}% ({stat.totalStudents}/{stat.totalCapacity})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stat.utilizationRate > 85 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${stat.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Audit Events */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Institutional Activity Logs</h3>
                  <p className="text-xs text-slate-500">Live operational trail across all authorized tiers</p>
                </div>
                <button
                  onClick={() => setSubTab('audit')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  View All →
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {auditLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="py-3 flex items-start space-x-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {log.userRole[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">
                          {log.userName}{' '}
                          <span className="font-normal text-slate-500">({log.userRole})</span>
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.details}</p>
                      <span className="inline-block mt-1 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Action: {log.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Admin Health & AI Status */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Hierarchy & Rule Enforcement</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                    <span className="font-bold text-purple-950">SUPER ADMIN TIER</span>
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                      Master Authority
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                    <span className="font-bold text-indigo-950">ADMIN CREATION RULE</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Enforced (Super Admin Only)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-emerald-950">TEACHER ONBOARDING</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Admin Permitted
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                    <span className="font-bold text-sky-950">STUDENT & PARENT ONBOARDING</span>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                      Assigned Teachers
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Class Enrollment Breakdown</h3>
                <div className="space-y-2">
                  {classes.map(cl => (
                    <div key={cl.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cl.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${(cl.enrolledCount / cl.capacity) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono font-medium text-slate-500">
                          {cl.enrolledCount}/{cl.capacity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Admins & RBAC */}
      {subTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrator Roster & Granular Permissions</h2>
              <p className="text-xs text-slate-500">Only Super Admin can create, modify, suspend, or scope administrator accounts.</p>
            </div>
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Administrator</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Role Title & Scope</th>
                    <th className="py-3 px-4">Assigned Permissions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map(adm => (
                    <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={adm.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120'}
                            alt={adm.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">{adm.name}</p>
                              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {adm.schoolId || adm.username}
                              </span>
                            </div>
                            <p className="text-slate-500 font-mono text-[11px]">{adm.email}</p>
                            {adm.branchName && (
                              <p className="text-slate-400 text-[10px]">{adm.branchName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-indigo-900">{adm.customRoleTitle || 'Administrator'}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Scope: {adm.scope || 'ALL_SCHOOL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(adm.permissions || []).slice(0, 3).map(p => (
                            <span
                              key={p}
                              className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100"
                            >
                              {p.replace('manage_', '')}
                            </span>
                          ))}
                          {(adm.permissions || []).length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5">
                              +{(adm.permissions || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            adm.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              adm.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {adm.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {adm.lastLogin
                          ? new Date(adm.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedAdminForInfo(adm)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                            title="Technical Support & Advanced Account Info (Super Admin)"
                          >
                            <Terminal className="w-4 h-4 text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleResetAdminCredentials(adm)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                            title="Reset Credentials & Issue Voucher"
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAdminForEdit(adm);
                              setAdminForm({
                                name: adm.name,
                                email: adm.email,
                                username: adm.username,
                                customRoleTitle: adm.customRoleTitle || 'Administrator',
                                scope: adm.scope || 'ALL_SCHOOL',
                                phone: adm.phone || '',
                                permissions: adm.permissions,
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                            title="Edit Permissions"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAdminStatus(adm)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                            title={adm.status === 'active' ? 'Suspend Admin' : 'Activate Admin'}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(adm)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: AI Governance Center */}
      {subTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>Institutional AI Governance & Safety Control</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable, disable, or restrict AI-assisted educational workflows by module and role.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-700">Master AI Switch:</span>
                <button
                  onClick={() => {
                    db.updateAIGovernance({ isAIEnabled: !aiGov.isAIEnabled }, currentUser);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    aiGov.isAIEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      aiGov.isAIEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Feature switches grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              {[
                {
                  key: 'lessonGenerator',
                  title: 'AI Lesson Note Generator',
                  desc: 'Assists teachers with curriculum lesson outlines, classroom activities, and differentiated tasks.',
                },
                {
                  key: 'quizGenerator',
                  title: 'AI Quiz & Test Generator',
                  desc: 'Generates structured multiple-choice, true/false, and short answer questions with answer keys.',
                },
                {
                  key: 'reportCommentGenerator',
                  title: 'AI Report Comment Writer',
                  desc: 'Drafts encouraging, personalized end-of-term comments based on verified academic records.',
                },
                {
                  key: 'studentInsights',
                  title: 'AI Student Insights Analyzer',
                  desc: 'Summarizes individual learning momentum and suggests pedagogical reinforcement areas.',
                },
                {
                  key: 'parentInsights',
                  title: 'AI Parent Growth Narratives',
                  desc: 'Provides jargon-free, encouraging progress summaries and home enrichment activities.',
                },
              ].map(f => {
                const isEnabled = (aiGov.enabledFeatures as any)[f.key];
                return (
                  <div
                    key={f.key}
                    className={`p-4 rounded-xl border transition-all ${
                      isEnabled ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-slate-900">{f.title}</h4>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={e => {
                          db.updateAIGovernance(
                            {
                              enabledFeatures: {
                                ...aiGov.enabledFeatures,
                                [f.key]: e.target.checked,
                              },
                            },
                            currentUser
                          );
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Audit Logs */}
      {subTab === 'audit' && (
        <InstitutionalAuditLog currentUser={currentUser} />
      )}

      {/* Sub-Tab 5: Settings & Branding */}
      {subTab === 'branding' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">School Identity & Academic Settings</h2>
            <p className="text-xs text-slate-500">Configure school information, grading scales, and report card branding.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">School Name</label>
              <input
                type="text"
                value={school.name}
                onChange={e => db.updateSchoolProfile({ name: e.target.value }, currentUser)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motto</label>
              <input
                type="text"
                value={school.motto}
                onChange={e => db.updateSchoolProfile({ motto: e.target.value }, currentUser)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Academic Term</label>
              <input
                type="text"
                value={school.currentTerm}
                onChange={e => db.updateSchoolProfile({ currentTerm: e.target.value }, currentUser)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Principal Name</label>
              <input
                type="text"
                value={school.branding.principalName}
                onChange={e =>
                  db.updateSchoolProfile(
                    { branding: { ...school.branding, principalName: e.target.value } },
                    currentUser
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab: Contact Privacy & Access Requests */}
      {subTab === 'privacy' && (
        <div className="space-y-6">
          {/* Institutional Policy Header */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Institutional PII Privacy & Contact Governance</h2>
                <p className="text-xs text-indigo-200">
                  Strict Confidentiality Architecture — Bungalow & Ijegun Branches
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In strict accordance with Zitel Castle School security policies, personal identifiable information (PII) including phone numbers and personal emails is masked across all portals. Full contact unmasking is reserved strictly for <strong>Super Admin (Alex)</strong> and <strong>School Director (Dr. Nwankwo Chika)</strong>. Other institutional roles must submit formal justification requests reviewed here.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-indigo-200">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">Super Admin: Alex</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">School Director: Dr. Nwankwo Chika</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">scrypt-Hashed Credentials</span>
            </div>
          </div>

          {/* Contact Requests Manager */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Contact Information Requests</h3>
                <p className="text-xs text-slate-500">Review, approve, or decline contact access authorizations.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {db.getContactRequests().length} Total Recorded Requests
              </span>
            </div>

            {db.getContactRequests().length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Pending Contact Requests</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All member contact numbers and personal emails remain fully protected and masked across the system.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {db.getContactRequests().map(req => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  return (
                    <div key={req.id} className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{req.requesterName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {req.requesterRole}
                            </span>
                            <span className="text-slate-400 text-xs">requested contact info for</span>
                            <span className="font-bold text-indigo-700 text-xs sm:text-sm">{req.targetUserName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {req.targetUserRole}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <strong>Official Justification:</strong> {req.reason}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {req.status === 'declined' && <XCircle className="w-3.5 h-3.5" />}
                            {isPending && <AlertTriangle className="w-3.5 h-3.5" />}
                            <span className="uppercase">{req.status}</span>
                          </span>
                        </div>
                      </div>

                      {isPending && (
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input
                            type="text"
                            placeholder="Optional administrative review notes..."
                            value={reviewNotes[req.id] || ''}
                            onChange={e => setReviewNotes({ ...reviewNotes, [req.id]: e.target.value })}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                db.reviewContactRequest(req.id, currentUser.id, currentUser.name, currentUser.role, true, reviewNotes[req.id]);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Access</span>
                            </button>
                            <button
                              onClick={() => {
                                db.reviewContactRequest(req.id, currentUser.id, currentUser.name, currentUser.role, false, reviewNotes[req.id]);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {!isPending && req.reviewedByUserName && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                          <span>Reviewed by {req.reviewedByUserName} ({new Date(req.reviewedAt || '').toLocaleDateString()})</span>
                          {req.reviewNotes && <span>• Note: {req.reviewNotes}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Administrator */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Administrator Account</h3>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jonathan Rivers"
                    value={adminForm.name}
                    onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin.name@oakridge.edu"
                    value={adminForm.email}
                    onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin.jonathan"
                    value={adminForm.username}
                    onChange={e => setAdminForm({ ...adminForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Admissions Administrator"
                    value={adminForm.customRoleTitle}
                    onChange={e => setAdminForm({ ...adminForm, customRoleTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Scope</label>
                  <select
                    value={adminForm.scope}
                    onChange={e => setAdminForm({ ...adminForm, scope: e.target.value as PermissionScope })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL_SCHOOL">All School Operations</option>
                    <option value="ACADEMIC_ONLY">Academic & Curriculum Only</option>
                    <option value="FINANCE_ONLY">Finance & Fees Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={adminForm.phone}
                    onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Granular Permission Toggles */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Granular Permission Matrix
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {ALL_PERMISSIONS.map(p => {
                    const isChecked = adminForm.permissions.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`p-2.5 rounded-lg border flex items-start space-x-2.5 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(p.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-900">{p.label}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{p.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Create Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Administrator */}
      {selectedAdminForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Administrator: {selectedAdminForEdit.name}</h3>
              </div>
              <button
                onClick={() => setSelectedAdminForEdit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAdminSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Advanced Account Info for Super Admin */}
              <AdvancedAccountInfoSection
                currentUserRole={currentUser.role}
                targetUser={selectedAdminForEdit}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={adminForm.name}
                    onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Role Title</label>
                  <input
                    type="text"
                    value={adminForm.customRoleTitle}
                    onChange={e => setAdminForm({ ...adminForm, customRoleTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Scope</label>
                  <select
                    value={adminForm.scope}
                    onChange={e => setAdminForm({ ...adminForm, scope: e.target.value as PermissionScope })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL_SCHOOL">All School Operations</option>
                    <option value="ACADEMIC_ONLY">Academic & Curriculum Only</option>
                    <option value="FINANCE_ONLY">Finance & Fees Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Update Granular Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {ALL_PERMISSIONS.map(p => {
                    const isChecked = adminForm.permissions.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`p-2.5 rounded-lg border flex items-start space-x-2.5 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(p.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-900">{p.label}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{p.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedAdminForEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Advanced Technical Support Info */}
      {selectedAdminForInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Advanced Account Diagnostics</h3>
              </div>
              <button
                onClick={() => setSelectedAdminForInfo(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={selectedAdminForInfo.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120'}
                  alt={selectedAdminForInfo.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-100"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedAdminForInfo.name}</h4>
                  <p className="text-xs text-slate-500">{selectedAdminForInfo.customRoleTitle || 'Administrator'}</p>
                  <p className="text-[11px] font-mono text-indigo-700 font-semibold mt-0.5">
                    School ID: {selectedAdminForInfo.schoolId || selectedAdminForInfo.username}
                  </p>
                </div>
              </div>

              <AdvancedAccountInfoSection
                currentUserRole={currentUser.role}
                targetUser={selectedAdminForInfo}
              />

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAdminForInfo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Close Diagnostic View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Student Upload Modal */}
      {showBulkUploadModal && (
        <BulkStudentUploadModal
          currentUser={currentUser}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={(count) => {
            setImportNotification(`Successfully enrolled ${count} students into classes!`);
          }}
        />
      )}

      {/* Credential Slip Voucher Modal */}
      {activeCredentialSlip && (
        <CredentialSlipModal
          credentialSlip={activeCredentialSlip}
          onClose={() => setActiveCredentialSlip(null)}
        />
      )}
    </div>
  );
};
