import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  MessageSquare,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Building2,
  Trash2,
  Edit3,
  X,
  Sparkles,
  Award,
  Users
} from 'lucide-react';
import { User, Class, WeeklyTeacherReport, WeeklyReportStatus } from '../../types';
import { db } from '../../services/db';

interface WeeklyTeacherReportManagerProps {
  currentUser: User;
  activeClass: Class;
}

export const WeeklyTeacherReportManager: React.FC<WeeklyTeacherReportManagerProps> = ({
  currentUser,
  activeClass,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [activeReportForView, setActiveReportForView] = useState<WeeklyTeacherReport | null>(null);

  // Editor Modal State
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Form State
  const [formWeekNumber, setFormWeekNumber] = useState<number>(7);
  const [formTerm, setFormTerm] = useState<string>('First Term');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2025/2026');
  const [formStartDate, setFormStartDate] = useState<string>(
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formEndDate, setFormEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formRecipientRole, setFormRecipientRole] = useState<'BRANCH_ADMIN' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN'>('BRANCH_ADMIN');
  const [formRecipientAdminId, setFormRecipientAdminId] = useState<string>('');
  
  // Section Fields
  const [formClassActivities, setFormClassActivities] = useState<string>('');
  const [formAcademicProgress, setFormAcademicProgress] = useState<string>('');
  const [formAttendanceRate, setFormAttendanceRate] = useState<number>(96);
  const [formAttendanceNotes, setFormAttendanceNotes] = useState<string>('');
  const [formBehavioralObservations, setFormBehavioralObservations] = useState<string>('');
  const [formSignificantEvents, setFormSignificantEvents] = useState<string>('');
  const [formStudentConcerns, setFormStudentConcerns] = useState<string>('');
  const [formStudentAchievements, setFormStudentAchievements] = useState<string>('');
  const [formGeneralClassProgress, setFormGeneralClassProgress] = useState<string>('');
  const [formIssuesRequiringAdmin, setFormIssuesRequiringAdmin] = useState<string>('');
  const [formTeacherRecommendations, setFormTeacherRecommendations] = useState<string>('');

  // Admin Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [adminFeedbackText, setAdminFeedbackText] = useState('');
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'RETURNED' | 'REVIEWED'>('APPROVED');

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Get available Admin recipients
  const admins = db.getUsers().filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  const branchAdmins = admins.filter(a => a.branchId === activeClass.branchId || a.role === 'SUPER_ADMIN');

  // Fetch reports for this class or user
  const reports = db.getWeeklyTeacherReports({
    classId: activeClass.id,
    user: currentUser,
  });

  const filteredReports = reports.filter(r => {
    if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;
    return true;
  });

  const handleOpenDraftGenerator = () => {
    setEditingReportId(null);
    const draft = db.generateWeeklyReportDraft(activeClass.id, formWeekNumber, formTerm, currentUser);

    setFormWeekNumber(draft.weekNumber);
    setFormTerm(draft.term);
    setFormAcademicYear(draft.academicYear);
    setFormStartDate(draft.startDate);
    setFormEndDate(draft.endDate);
    setFormRecipientRole(draft.recipientRole || 'BRANCH_ADMIN');
    setFormRecipientAdminId(draft.recipientAdminId || branchAdmins[0]?.id || '');
    setFormClassActivities(draft.classActivities);
    setFormAcademicProgress(draft.academicProgress);
    setFormAttendanceRate(draft.attendanceMetrics.averageRate);
    setFormAttendanceNotes(draft.attendanceMetrics.notes);
    setFormBehavioralObservations(draft.behavioralObservations);
    setFormSignificantEvents(draft.significantEvents);
    setFormStudentConcerns(draft.studentConcerns);
    setFormStudentAchievements(draft.studentAchievements);
    setFormGeneralClassProgress(draft.generalClassProgress);
    setFormIssuesRequiringAdmin(draft.issuesRequiringAdminAttention);
    setFormTeacherRecommendations(draft.teacherRecommendations);

    setShowEditorModal(true);
  };

  const handleOpenEditReport = (r: WeeklyTeacherReport) => {
    setEditingReportId(r.id);
    setFormWeekNumber(r.weekNumber);
    setFormTerm(r.term);
    setFormAcademicYear(r.academicYear);
    setFormStartDate(r.startDate);
    setFormEndDate(r.endDate);
    setFormRecipientRole(r.recipientRole || 'BRANCH_ADMIN');
    setFormRecipientAdminId(r.recipientAdminId || '');
    setFormClassActivities(r.classActivities);
    setFormAcademicProgress(r.academicProgress);
    setFormAttendanceRate(r.attendanceMetrics.averageRate);
    setFormAttendanceNotes(r.attendanceMetrics.notes);
    setFormBehavioralObservations(r.behavioralObservations);
    setFormSignificantEvents(r.significantEvents);
    setFormStudentConcerns(r.studentConcerns);
    setFormStudentAchievements(r.studentAchievements);
    setFormGeneralClassProgress(r.generalClassProgress);
    setFormIssuesRequiringAdmin(r.issuesRequiringAdminAttention);
    setFormTeacherRecommendations(r.teacherRecommendations);

    setShowEditorModal(true);
  };

  const handleSaveReport = (isSubmit: boolean) => {
    const selectedAdmin = admins.find(a => a.id === formRecipientAdminId) || branchAdmins[0];

    const payload = {
      weekNumber: formWeekNumber,
      term: formTerm,
      academicYear: formAcademicYear,
      startDate: formStartDate,
      endDate: formEndDate,
      classId: activeClass.id,
      className: activeClass.name,
      branchId: activeClass.branchId,
      branchName: activeClass.branchName,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      recipientRole: formRecipientRole,
      recipientAdminId: selectedAdmin?.id,
      recipientAdminName: selectedAdmin?.name || 'Branch Administrator',
      classActivities: formClassActivities.trim(),
      academicProgress: formAcademicProgress.trim(),
      attendanceMetrics: {
        totalDays: 5,
        presentCount: 120,
        averageRate: formAttendanceRate,
        notes: formAttendanceNotes.trim(),
      },
      behavioralObservations: formBehavioralObservations.trim(),
      significantEvents: formSignificantEvents.trim(),
      studentConcerns: formStudentConcerns.trim(),
      studentAchievements: formStudentAchievements.trim(),
      generalClassProgress: formGeneralClassProgress.trim(),
      issuesRequiringAdminAttention: formIssuesRequiringAdmin.trim(),
      teacherRecommendations: formTeacherRecommendations.trim(),
      status: (isSubmit ? 'SUBMITTED' : 'DRAFT') as WeeklyReportStatus,
      submittedAt: isSubmit ? new Date().toISOString() : undefined,
    };

    if (editingReportId) {
      const updated = db.updateWeeklyTeacherReport(editingReportId, payload, currentUser);
      setActiveReportForView(updated);
    } else {
      const created = db.createWeeklyTeacherReport(payload, currentUser);
      setActiveReportForView(created);
    }

    setShowEditorModal(false);
  };

  const handleSubmitExistingDraft = (id: string) => {
    const submitted = db.submitWeeklyTeacherReport(id, currentUser);
    setActiveReportForView(submitted);
  };

  const handleAdminReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportForView) return;

    const reviewed = db.reviewWeeklyTeacherReport(
      activeReportForView.id,
      reviewAction,
      adminFeedbackText.trim() || 'Reviewed and recorded by administration.',
      currentUser
    );
    setActiveReportForView(reviewed);
    setShowReviewModal(false);
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this weekly report?')) {
      db.deleteWeeklyTeacherReport(id, currentUser);
      if (activeReportForView?.id === id) setActiveReportForView(null);
    }
  };

  const getStatusBadge = (status: WeeklyReportStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Draft
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            Submitted
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            Reviewed
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            Returned for Revision
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="weekly-teacher-report-manager">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Form Teacher Weekly Status Report</h2>
              <p className="text-xs text-slate-500 font-medium">
                Prepare and submit structured end-of-week pastoral, academic, and operational summaries for {activeClass.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDraftGenerator}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            id="btn-new-weekly-report"
          >
            <Plus className="w-4 h-4" />
            <span>Prepare Weekly Report</span>
          </button>
        </div>
      </div>

      {/* Main Layout: History & Status Filter (Left) & Live Report Document (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filter & List */}
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Filter By Status</h3>
              <span className="text-[10px] text-slate-400 font-medium">{reports.length} Total</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
              {[
                { id: 'ALL', label: 'All Reports' },
                { id: 'DRAFT', label: 'Drafts' },
                { id: 'SUBMITTED', label: 'Submitted' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'RETURNED', label: 'Returned' },
              ].map(st => {
                const isSel = selectedStatusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={`py-1.5 px-2.5 rounded-xl border text-center transition-all ${
                      isSel
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report History List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Weekly Archives
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Newest First</span>
            </div>

            {filteredReports.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No weekly reports matching filter.
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredReports.map(r => {
                  const isSelected = activeReportForView?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveReportForView(r)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              Week {r.weekNumber} Report
                            </span>
                            {getStatusBadge(r.status)}
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium mt-1">
                            {r.term} • {r.startDate} to {r.endDate}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Recipient: {r.recipientAdminName || 'Branch Administrator'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {(r.status === 'DRAFT' || r.status === 'RETURNED' || isAdmin) && (
                            <button
                              onClick={() => handleOpenEditReport(r)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Edit Report"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2 spans): Formal Document Preview Sheet */}
        <div className="lg:col-span-2">
          {activeReportForView ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">
                    Week {activeReportForView.weekNumber} Form Teacher Report
                  </span>
                  {getStatusBadge(activeReportForView.status)}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeReportForView.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSubmitExistingDraft(activeReportForView.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit to Administrator</span>
                    </button>
                  )}

                  {isAdmin && activeReportForView.status === 'SUBMITTED' && (
                    <button
                      onClick={() => {
                        setAdminFeedbackText('');
                        setReviewAction('APPROVED');
                        setShowReviewModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review & Approve</span>
                    </button>
                  )}

                  {(activeReportForView.status === 'DRAFT' || activeReportForView.status === 'RETURNED' || isAdmin) && (
                    <button
                      onClick={() => handleOpenEditReport(activeReportForView)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Admin Feedback Box if Returned or Reviewed */}
              {activeReportForView.adminFeedback && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    activeReportForView.status === 'APPROVED'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : activeReportForView.status === 'RETURNED'
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      Administrator Feedback ({activeReportForView.reviewedByAdminName || 'Branch Admin'}):
                    </span>
                  </div>
                  <p className="leading-relaxed pl-6">{activeReportForView.adminFeedback}</p>
                </div>
              )}

              {/* School Header Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <h1 className="text-xl font-black tracking-wide text-slate-900 uppercase">
                  ZITEL CASTLE SCHOOL
                </h1>
                <p className="text-xs font-bold text-indigo-700 tracking-wider uppercase">
                  {activeReportForView.branchName || 'BUNGALOW BRANCH'} • WEEKLY FORM TEACHER RECORD
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  WEEK {activeReportForView.weekNumber} • {activeReportForView.term.toUpperCase()} ({activeReportForView.academicYear})
                </p>
              </div>

              {/* Class & Submission Info Header */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Class</span>
                  <strong className="text-slate-900 font-bold text-sm">{activeReportForView.className}</strong>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Reporting Form Teacher</span>
                  <strong className="text-slate-800 font-bold">{activeReportForView.teacherName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Recipient Administrator</span>
                  <strong className="text-slate-800 font-bold">
                    {activeReportForView.recipientAdminName || 'Branch Administrator'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Report Period</span>
                  <strong className="text-slate-800 font-bold">
                    {activeReportForView.startDate} to {activeReportForView.endDate}
                  </strong>
                </div>
              </div>

              {/* Key Highlights Section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                    Weekly Attendance Average
                  </span>
                  <p className="text-2xl font-black text-blue-900 mt-0.5">
                    {activeReportForView.attendanceMetrics.averageRate}%
                  </p>
                  <span className="text-[10px] text-blue-700 font-medium">
                    {activeReportForView.attendanceMetrics.notes || 'Full attendance maintained'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    Workflow Status
                  </span>
                  <p className="text-lg font-black text-emerald-900 mt-1">
                    {activeReportForView.status}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {activeReportForView.submittedAt
                      ? `Submitted on ${new Date(activeReportForView.submittedAt).toLocaleDateString()}`
                      : 'Draft Stage'}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Sections */}
              <div className="space-y-4 text-xs text-slate-800">
                {/* Class Activities */}
                <div className="space-y-1">
                  <h3 className="font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Class Activities & Syllabus Coverage</span>
                  </h3>
                  <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.classActivities}
                  </p>
                </div>

                {/* Academic Progress */}
                <div className="space-y-1">
                  <h3 className="font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Academic Progress & Continuous Assessment</span>
                  </h3>
                  <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.academicProgress}
                  </p>
                </div>

                {/* Behavioral Observations */}
                <div className="space-y-1">
                  <h3 className="font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>3. Behavioral & Pastoral Observations</span>
                  </h3>
                  <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.behavioralObservations}
                  </p>
                </div>

                {/* Significant Events */}
                {activeReportForView.significantEvents && (
                  <div className="space-y-1">
                    <h3 className="font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>4. Significant Events & Extracurriculars</span>
                    </h3>
                    <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {activeReportForView.significantEvents}
                    </p>
                  </div>
                )}

                {/* Concerns & Achievements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                    <h3 className="font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Student Concerns</span>
                    </h3>
                    <p className="text-amber-950 leading-relaxed">
                      {activeReportForView.studentConcerns || 'No critical student concerns.'}
                    </p>
                  </div>

                  <div className="space-y-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                    <h3 className="font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Student Achievements & Merits</span>
                    </h3>
                    <p className="text-emerald-950 leading-relaxed">
                      {activeReportForView.studentAchievements || 'Commendable general effort.'}
                    </p>
                  </div>
                </div>

                {/* General Progress & Admin Issues */}
                <div className="space-y-1">
                  <h3 className="font-black uppercase tracking-wider text-slate-900">
                    5. General Class Progress Summary
                  </h3>
                  <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.generalClassProgress}
                  </p>
                </div>

                {activeReportForView.issuesRequiringAdminAttention && (
                  <div className="space-y-1 bg-rose-50/40 p-3 rounded-xl border border-rose-200">
                    <h3 className="font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>6. Issues Requiring Administrative Attention</span>
                    </h3>
                    <p className="text-rose-950 leading-relaxed">
                      {activeReportForView.issuesRequiringAdminAttention}
                    </p>
                  </div>
                )}

                <div className="space-y-1 bg-indigo-50/40 p-3 rounded-xl border border-indigo-200">
                  <h3 className="font-black uppercase tracking-wider text-indigo-900">
                    7. Teacher Recommendations
                  </h3>
                  <p className="text-indigo-950 leading-relaxed">
                    {activeReportForView.teacherRecommendations}
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-8 text-center">
                    <span className="font-serif italic text-slate-700 text-sm">
                      {activeReportForView.teacherName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block text-center mt-1">
                    Form Teacher Signature & Date
                  </span>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-8 text-center">
                    <span className="font-serif italic text-slate-700 text-sm">
                      {activeReportForView.reviewedByAdminName || activeReportForView.recipientAdminName || 'Branch Administrator'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block text-center mt-1">
                    Administrator Review Signature
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Weekly Report Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select a previous weekly report from the list on the left, or click "Prepare Weekly Report" to draft an end-of-week summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WEEKLY REPORT PREPARATION / EDIT MODAL */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingReportId ? 'Edit Weekly Status Report' : 'Prepare Form Teacher Weekly Report'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Compile weekly syllabus progress, pastoral records, attendance, and administrative requests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Meta Row: Week, Term, Dates, Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Week Number</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formWeekNumber}
                    onChange={e => setFormWeekNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Term</label>
                  <select
                    value={formTerm}
                    onChange={e => setFormTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Recipient Selector (Item 18 Requirement) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organizational Recipient Level
                  </label>
                  <select
                    value={formRecipientRole}
                    onChange={e => setFormRecipientRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="BRANCH_ADMIN">Branch Administrator (Branch Lead)</option>
                    <option value="SCHOOL_ADMIN">School Head / Academic Director</option>
                    <option value="SUPER_ADMIN">Executive Board / Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Admin Officer
                  </label>
                  <select
                    value={formRecipientAdminId}
                    onChange={e => setFormRecipientAdminId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  >
                    {branchAdmins.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role} • {a.branchName || 'Institution'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Activities & Academic Progress */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Class Activities & Syllabus Coverage
                </label>
                <textarea
                  rows={2}
                  value={formClassActivities}
                  onChange={e => setFormClassActivities(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Academic Progress & Assessments Completed
                </label>
                <textarea
                  rows={2}
                  value={formAcademicProgress}
                  onChange={e => setFormAcademicProgress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Attendance Rate & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attendance Average (%)
                  </label>
                  <input
                    type="number"
                    value={formAttendanceRate}
                    onChange={e => setFormAttendanceRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attendance & Punctuality Notes
                  </label>
                  <input
                    type="text"
                    value={formAttendanceNotes}
                    onChange={e => setFormAttendanceNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Behavioral Observations & Significant Events */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Behavioral Observations & Classroom Culture
                </label>
                <textarea
                  rows={2}
                  value={formBehavioralObservations}
                  onChange={e => setFormBehavioralObservations(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Significant Events / Activities
                </label>
                <input
                  type="text"
                  value={formSignificantEvents}
                  onChange={e => setFormSignificantEvents(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Concerns & Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    Student Concerns / Behavioral Concerns
                  </label>
                  <textarea
                    rows={2}
                    value={formStudentConcerns}
                    onChange={e => setFormStudentConcerns(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Student Achievements & Star Commendations
                  </label>
                  <textarea
                    rows={2}
                    value={formStudentAchievements}
                    onChange={e => setFormStudentAchievements(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* General Progress & Admin Attention */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  5. General Class Progress
                </label>
                <textarea
                  rows={2}
                  value={formGeneralClassProgress}
                  onChange={e => setFormGeneralClassProgress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">
                  6. Issues Requiring Administrative Attention (Facilities, Supplies, Escalations)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Science lab equipment replenishment needed; replacement whiteboard markers."
                  value={formIssuesRequiringAdmin}
                  onChange={e => setFormIssuesRequiringAdmin(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-800 mb-1">
                  7. Teacher Recommendations
                </label>
                <textarea
                  rows={2}
                  value={formTeacherRecommendations}
                  onChange={e => setFormTeacherRecommendations(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-xl font-medium"
                />
              </div>

              {/* Action Buttons: Save as Draft vs. Submit directly */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveReport(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveReport(true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REVIEW & FEEDBACK MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Administrator Report Review</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Review Week {activeReportForView?.weekNumber} submission from {activeReportForView?.teacherName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminReview} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision Outcome</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'APPROVED', label: 'Approve Report' },
                    { id: 'REVIEWED', label: 'Mark Reviewed' },
                    { id: 'RETURNED', label: 'Return for Edits' },
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setReviewAction(act.id as any)}
                      className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition-all ${
                        reviewAction === act.id
                          ? act.id === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : act.id === 'REVIEWED'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Comments & Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide praise, directive notes, or resource allocation updates..."
                  value={adminFeedbackText}
                  onChange={e => setAdminFeedbackText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl"
                >
                  Save Review Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
