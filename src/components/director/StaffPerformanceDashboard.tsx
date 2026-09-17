import React, { useState, useMemo } from 'react';
import { User, Branch, ClassRoom, Subject, WeeklyTeacherReport, StaffAttendanceRecord } from '../../types';
import { db } from '../../services/db';
import { StaffAttendanceHRMonitor } from '../admin/StaffAttendanceHRMonitor';
import { TeacherStatusModal } from '../admin/TeacherStatusModal';
import {
  TrendingUp,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  Building2,
  FileSpreadsheet,
  Download,
  Eye,
  MessageSquare,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  X,
  Printer,
  ShieldCheck,
  Check,
  ArrowLeft
} from 'lucide-react';

interface StaffPerformanceDashboardProps {
  currentUser: User;
  branches: Branch[];
  selectedBranchId?: string;
  onNavigateToTab?: (tab: string) => void;
  onBackToDashboard?: () => void;
}

export const StaffPerformanceDashboard: React.FC<StaffPerformanceDashboardProps> = ({
  currentUser,
  branches,
  selectedBranchId = 'all',
  onNavigateToTab,
  onBackToDashboard,
}) => {
  // View mode switcher: 'matrix' | 'weekly_reports' | 'attendance'
  const [activeSubView, setActiveSubView] = useState<'matrix' | 'weekly_reports' | 'attendance'>('matrix');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId);
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [inspectingTeacher, setInspectingTeacher] = useState<User | null>(null);
  const [managingStatusTeacher, setManagingStatusTeacher] = useState<User | null>(null);
  const [viewingReport, setViewingReport] = useState<WeeklyTeacherReport | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Sync parent branch
  React.useEffect(() => {
    if (selectedBranchId) {
      setBranchFilter(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Load live data from database
  const allUsers = db.getUsers();
  const allClasses = db.getClasses();
  const allSubjects = db.getSubjects();
  const allAssignments = db.getClassSubjectAssignments();
  const weeklyReports = db.getWeeklyTeacherReports();
  const attendanceRecords = db.getStaffAttendance();
  const assessments = db.getAssessments();
  const assessmentScores = db.getAssessmentScores();

  // All teachers
  const allTeachers = useMemo(() => {
    return allUsers.filter(u => u.role === 'TEACHER');
  }, [allUsers]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return allTeachers.filter(t => {
      if (branchFilter !== 'all' && t.branchId && t.branchId !== branchFilter) return false;
      if (statusFilter !== 'ALL') {
        const teacherStatus = t.status || 'active';
        if (teacherStatus !== statusFilter) return false;
      }
      if (deptFilter !== 'ALL') {
        const isPrimary = (t.customRoleTitle || '').toLowerCase().includes('primary') ||
          (t.customRoleTitle || '').toLowerCase().includes('basic') ||
          allAssignments.some(a => a.teacherId === t.id && (a.className || '').toLowerCase().includes('basic'));
        if (deptFilter === 'PRIMARY' && !isPrimary) return false;
        if (deptFilter === 'SECONDARY' && isPrimary) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchEmail = t.email.toLowerCase().includes(q);
        const matchId = (t.schoolId || '').toLowerCase().includes(q);
        const matchRole = (t.customRoleTitle || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId && !matchRole) return false;
      }
      return true;
    });
  }, [allTeachers, branchFilter, statusFilter, deptFilter, searchQuery, allAssignments]);

  // Performance metrics computed per teacher
  const teacherPerformanceMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return filteredTeachers.map(teacher => {
      // Branch name
      const branchObj = branches.find(b => b.id === teacher.branchId);
      const branchName = branchObj ? branchObj.name : 'All Campuses';

      // Assigned classes & subjects
      const assignments = allAssignments.filter(a => a.teacherId === teacher.id);
      const formClass = allClasses.find(c => c.formTeacherId === teacher.id);
      const assignedClassCount = new Set(assignments.map(a => a.classId)).size + (formClass ? 1 : 0);
      const assignedSubjectCount = new Set(assignments.map(a => a.subjectId)).size;

      // Attendance / Punctuality
      const teacherAttendance = attendanceRecords.filter(a => a.staffId === teacher.id);
      const todayRecord = teacherAttendance.find(a => a.date === today);
      const onTimeCount = teacherAttendance.filter(a => a.status === 'ON_TIME').length;
      const punctualityRate = teacherAttendance.length > 0
        ? Math.round((onTimeCount / teacherAttendance.length) * 100)
        : 95;

      // Weekly Reports submitted
      const teacherReports = weeklyReports.filter(r => r.teacherId === teacher.id);
      const latestReport = teacherReports.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0] || null;

      // Assessment Completion
      const teacherAssessments = assessments.filter(a =>
        a.createdByTeacherId === teacher.id ||
        assignments.some(asg => asg.subjectId === a.subjectId && asg.classId === a.classId)
      );
      const completedAssessments = teacherAssessments.filter(a => {
        const scores = assessmentScores.filter(s => s.assessmentId === a.id);
        return scores.length > 0;
      });
      const gradingCompletionRate = teacherAssessments.length > 0
        ? Math.round((completedAssessments.length / teacherAssessments.length) * 100)
        : 90;

      // Calculate composite score (0-100)
      const reportScore = teacherReports.length > 0 ? 95 : 75;
      const compositeScore = Math.round((punctualityRate * 0.35) + (gradingCompletionRate * 0.4) + (reportScore * 0.25));

      let healthRating: 'EXEMPLARY' | 'ON_TRACK' | 'ATTENTION_NEEDED' = 'ON_TRACK';
      if (compositeScore >= 90) healthRating = 'EXEMPLARY';
      else if (compositeScore < 75 || (teacher.status && teacher.status !== 'active')) healthRating = 'ATTENTION_NEEDED';

      return {
        teacher,
        branchName,
        formClass,
        assignedClassCount,
        assignedSubjectCount,
        todayRecord,
        punctualityRate,
        teacherReportsCount: teacherReports.length,
        latestReport,
        gradingCompletionRate,
        compositeScore,
        healthRating,
      };
    });
  }, [filteredTeachers, branches, allAssignments, allClasses, attendanceRecords, weeklyReports, assessments, assessmentScores]);

  // High level aggregated statistics
  const summaryStats = useMemo(() => {
    const totalCount = filteredTeachers.length;
    const activeCount = filteredTeachers.filter(t => !t.status || t.status === 'active').length;
    const totalWeeklySubmissions = weeklyReports.filter(r => {
      if (branchFilter !== 'all' && r.branchId !== branchFilter) return false;
      return true;
    }).length;

    const avgPunctuality = teacherPerformanceMetrics.length > 0
      ? Math.round(teacherPerformanceMetrics.reduce((acc, m) => acc + m.punctualityRate, 0) / teacherPerformanceMetrics.length)
      : 96;

    const avgGradingVelocity = teacherPerformanceMetrics.length > 0
      ? Math.round(teacherPerformanceMetrics.reduce((acc, m) => acc + m.gradingCompletionRate, 0) / teacherPerformanceMetrics.length)
      : 92;

    const exemplaryCount = teacherPerformanceMetrics.filter(m => m.healthRating === 'EXEMPLARY').length;

    return {
      totalCount,
      activeCount,
      totalWeeklySubmissions,
      avgPunctuality,
      avgGradingVelocity,
      exemplaryCount,
    };
  }, [filteredTeachers, weeklyReports, branchFilter, teacherPerformanceMetrics]);

  // Review weekly report action
  const handleAcknowledgeReport = (report: WeeklyTeacherReport) => {
    // In db, update weekly report
    try {
      db.updateWeeklyTeacherReport(
        report.id,
        {
          status: 'REVIEWED',
          recipientAdminId: currentUser.id,
          recipientAdminName: currentUser.name,
        },
        currentUser
      );

      // Notify teacher in Zitel Chat / Notifications
      db.addNotification({
        userId: report.teacherId,
        title: 'Weekly Status Report Endorsed',
        message: `Director of Academic Excellence (${currentUser.name}) reviewed and endorsed your Week ${report.weekNumber} report: "${reviewNote || 'Approved without queries.'}"`,
        type: 'ACADEMIC',
      });

      setActionSuccessMessage(`Report for ${report.className} endorsed and archived successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setViewingReport(null);
      setReviewNote('');
    } catch (err: any) {
      alert(err.message || 'Error endorsing report.');
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="director-staff-performance-dashboard">
      {/* TOP NAVIGATION BAR & BREADCRUMB */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (inspectingTeacher) {
                setInspectingTeacher(null);
              } else if (managingStatusTeacher) {
                setManagingStatusTeacher(null);
              } else if (viewingReport) {
                setViewingReport(null);
              } else if (activeSubView !== 'matrix') {
                setActiveSubView('matrix');
              } else if (onBackToDashboard) {
                onBackToDashboard();
              } else if (onNavigateToTab) {
                onNavigateToTab('overview');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer group"
            id="btn-back-to-dashboard-from-staff"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Back</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-400">Director Command</span>
            <span>/</span>
            <span className="font-bold text-slate-800">Staff Performance & Activity</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Campus: <strong className="text-slate-800">{branchFilter === 'all' ? 'All Campuses (Consolidated)' : branches.find(b => b.id === branchFilter)?.name || 'Campus'}</strong>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER & EXECUTIVE TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Staff Performance & Academic Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Director oversight of instructional compliance, weekly report submissions, assessment velocity, and HR punctuality.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-view switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveSubView('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubView === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Performance Matrix
            </button>
            <button
              onClick={() => setActiveSubView('weekly_reports')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'weekly_reports'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Weekly Reports</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800">
                {weeklyReports.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubView('attendance')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'attendance'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>HR Clock-In Logs</span>
            </button>
          </div>

          <button
            onClick={handlePrintSummary}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Print or Export Performance Ledger"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Ledger</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Teaching Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {summaryStats.activeCount} Active
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Teaching Personnel
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {summaryStats.totalCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Homeroom heads & subject specialists
            </p>
          </div>
        </div>

        {/* Punctuality Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              High Compliance
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Staff Punctuality Rate
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {summaryStats.avgPunctuality}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              On-time morning arrival baseline
            </p>
          </div>
        </div>

        {/* Weekly Reports Submissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Submitted
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Weekly Reports Filed
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {summaryStats.totalWeeklySubmissions}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Termly pedagogical reports recorded
            </p>
          </div>
        </div>

        {/* Assessment Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Active Term
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Grading Entry Velocity
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {summaryStats.avgGradingVelocity}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Continuous assessment & exam entries
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR FOR MATRIX & REPORTS */}
      {activeSubView !== 'attendance' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, staff ID, subject..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Branches (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Academic Tiers</option>
              <option value="PRIMARY">Primary / Basic School</option>
              <option value="SECONDARY">Secondary / College</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="active">Active Staff Only</option>
              <option value="suspended">Suspended Staff</option>
              <option value="deactivated">Deactivated Staff</option>
            </select>
          </div>

          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredTeachers.length}</strong> educators
          </div>
        </div>
      )}

      {/* 1. SUBVIEW: PERFORMANCE MATRIX */}
      {activeSubView === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-6">Educator & Staff ID</th>
                  <th className="py-3.5 px-4">Campus & Role</th>
                  <th className="py-3.5 px-4">Allocations</th>
                  <th className="py-3.5 px-4">Punctuality</th>
                  <th className="py-3.5 px-4">Reports Filed</th>
                  <th className="py-3.5 px-4">Grading Velocity</th>
                  <th className="py-3.5 px-4">Health Index</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherPerformanceMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      No teaching staff matching the current branch or query filters.
                    </td>
                  </tr>
                ) : (
                  teacherPerformanceMetrics.map(item => {
                    const { teacher } = item;
                    const isSuspended = teacher.status === 'suspended' || teacher.status === 'deactivated';

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Educator & Staff ID */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                              {teacher.avatar ? (
                                <img
                                  src={teacher.avatar}
                                  alt={teacher.name}
                                  className="w-full h-full rounded-xl object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                teacher.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{teacher.name}</span>
                                {isSuspended && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    {teacher.status?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {teacher.schoolId || teacher.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Campus & Role */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.branchName.replace('ZITEL CASTLE SCHOOL ', '')}
                          </div>
                          <div className="text-[11px] text-indigo-600 font-medium mt-0.5 truncate max-w-[150px]">
                            {teacher.customRoleTitle || 'Academic Educator'}
                          </div>
                        </td>

                        {/* Allocations */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {item.formClass ? (
                              <span className="text-indigo-700 font-bold">
                                Homeroom: {item.formClass.name}
                              </span>
                            ) : (
                              <span>Subject Specialist</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.assignedSubjectCount} subjects across {item.assignedClassCount} classes
                          </div>
                        </td>

                        {/* Punctuality */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  item.punctualityRate >= 90
                                    ? 'bg-emerald-500'
                                    : item.punctualityRate >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(item.punctualityRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-800">{item.punctualityRate}%</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {item.todayRecord ? (
                              <span className="text-emerald-700 font-bold">Clocked in: {item.todayRecord.timeIn}</span>
                            ) : (
                              <span className="text-slate-400">No clock-in recorded</span>
                            )}
                          </div>
                        </td>

                        {/* Reports Filed */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 text-xs">{item.teacherReportsCount}</span>
                          <span className="text-xs text-slate-500 ml-1">weekly reports</span>
                          {item.latestReport && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Latest: Wk {item.latestReport.weekNumber} ({item.latestReport.status})
                            </div>
                          )}
                        </td>

                        {/* Grading Velocity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${Math.min(item.gradingCompletionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-800">{item.gradingCompletionRate}%</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            CA & Terminal Exam Scores
                          </div>
                        </td>

                        {/* Health Index */}
                        <td className="py-3.5 px-4">
                          {item.healthRating === 'EXEMPLARY' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Sparkles className="w-3 h-3 mr-1 text-emerald-500" />
                              Exemplary
                            </span>
                          ) : item.healthRating === 'ON_TRACK' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Check className="w-3 h-3 mr-1 text-indigo-500" />
                              On Track
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                              Needs Review
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setInspectingTeacher(teacher)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Inspect Teacher Dossier & Academic History"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setManagingStatusTeacher(teacher)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Update Status / Manage Reassignment"
                            >
                              <ShieldCheck className="w-4 h-4" />
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
      )}

      {/* 2. SUBVIEW: WEEKLY STATUS REPORTS FEED */}
      {activeSubView === 'weekly_reports' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-800">Submitted Weekly Class & Staff Status Reports</span>
            </div>
            <span className="text-slate-500">
              Total Recorded: <strong className="text-slate-800">{weeklyReports.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyReports.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No weekly teacher reports submitted yet.
              </div>
            ) : (
              weeklyReports.map(report => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Week {report.weekNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{report.className}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-2">{report.teacherName}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {report.branchName} • Term: {report.term} ({report.academicYear})
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          report.status === 'REVIEWED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">Academic Progress:</span>
                        <p className="text-slate-600 text-[11px] line-clamp-2">
                          {report.academicProgress || 'Curriculum schemes followed per schedule.'}
                        </p>
                      </div>

                      {report.issuesRequiringAdminAttention && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Attention Required: </span>
                            <span>{report.issuesRequiringAdminAttention}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      Submitted: {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <button
                      onClick={() => setViewingReport(report)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Review Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. SUBVIEW: HR CLOCK-IN & ATTENDANCE LOGS */}
      {activeSubView === 'attendance' && (
        <div className="space-y-4">
          <StaffAttendanceHRMonitor
            branches={branches}
            selectedBranchId={branchFilter}
          />
        </div>
      )}

      {/* MODAL: INSPECT TEACHER DOSSIER */}
      {inspectingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{inspectingTeacher.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{inspectingTeacher.schoolId || inspectingTeacher.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Campus</span>
                  <span className="font-bold text-slate-800">
                    {branches.find(b => b.id === inspectingTeacher.branchId)?.name || 'All Campuses'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Status</span>
                  <span className="font-bold text-emerald-600 capitalize">
                    {inspectingTeacher.status || 'Active'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone</span>
                  <span className="font-bold text-slate-800">{inspectingTeacher.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Designation</span>
                  <span className="font-bold text-slate-800">{inspectingTeacher.customRoleTitle || 'Educator'}</span>
                </div>
              </div>

              {/* Teaching allocations */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Classroom & Subject Allocations</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">Class</th>
                        <th className="p-2.5">Subject</th>
                        <th className="p-2.5">Periods/Wk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allAssignments.filter(a => a.teacherId === inspectingTeacher.id).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">
                            No direct teaching assignments currently attached.
                          </td>
                        </tr>
                      ) : (
                        allAssignments
                          .filter(a => a.teacherId === inspectingTeacher.id)
                          .map(a => (
                            <tr key={a.id}>
                              <td className="p-2.5 font-bold text-slate-800">{a.className}</td>
                              <td className="p-2.5 text-indigo-700">{a.subjectName}</td>
                              <td className="p-2.5 text-slate-600">
                                {a.teacherType === 'FORM_TEACHER' ? 'Form / Homeroom' : 'Subject Specialist'}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick actions for Director */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingTeacher(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>← Back to Staff Performance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingTeacher(null);
                      if (onBackToDashboard) {
                        onBackToDashboard();
                      } else if (onNavigateToTab) {
                        onNavigateToTab('overview');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors cursor-pointer"
                  >
                    Dashboard
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManagingStatusTeacher(inspectingTeacher);
                      setInspectingTeacher(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                  >
                    Manage Status & Reassignments
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectingTeacher(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW & ENDORSE WEEKLY REPORT */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Week {viewingReport.weekNumber} Status Report: {viewingReport.className}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submitted by {viewingReport.teacherName} • {viewingReport.branchName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs max-h-[65vh] overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Curriculum & Class Activities:</span>
                <p className="text-slate-600 leading-relaxed">{viewingReport.classActivities || 'Completed planned weekly curriculum syllabus.'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Academic Progress & Mastery:</span>
                <p className="text-slate-600 leading-relaxed">{viewingReport.academicProgress || 'Good class retention across foundational subjects.'}</p>
              </div>

              {viewingReport.issuesRequiringAdminAttention && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Administrative Attention Flagged:
                  </span>
                  <p className="leading-relaxed">{viewingReport.issuesRequiringAdminAttention}</p>
                </div>
              )}

              {viewingReport.teacherRecommendations && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-950">
                  <span className="font-bold block mb-1">Teacher's Recommendations:</span>
                  <p className="leading-relaxed">{viewingReport.teacherRecommendations}</p>
                </div>
              )}

              {/* Endorsement section */}
              <div className="pt-2">
                <label className="block font-bold text-slate-800 mb-1">Director Executive Endorsement & Feedback Note</label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="e.g. Reviewed and approved. Keep up the high standard of phonics instruction."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to Staff Performance</span>
              </button>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleAcknowledgeReport(viewingReport)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Endorse & Acknowledge Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEACHER STATUS & REASSIGNMENT */}
      {managingStatusTeacher && (
        <TeacherStatusModal
          teacher={managingStatusTeacher}
          currentUser={currentUser}
          onClose={() => setManagingStatusTeacher(null)}
          onSuccess={() => {
            setManagingStatusTeacher(null);
            setActionSuccessMessage('Teaching staff status updated successfully.');
            setTimeout(() => setActionSuccessMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
