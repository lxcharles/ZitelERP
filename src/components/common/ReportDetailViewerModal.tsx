import React from 'react';
import {
  FileText,
  Printer,
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  GraduationCap,
  Clock,
  Award,
  BookOpen
} from 'lucide-react';
import { User as UserType, StudentStatusReport, WeeklyTeacherReport } from '../../types';
import { db } from '../../services/db';

interface ReportDetailViewerModalProps {
  reportId: string;
  reportType?: string;
  studentId?: string;
  currentUser: UserType;
  onClose: () => void;
}

export const ReportDetailViewerModal: React.FC<ReportDetailViewerModalProps> = ({
  reportId,
  studentId,
  currentUser,
  onClose,
}) => {
  const school = db.getSchoolProfile();

  // Retrieve matching report from either status reports or weekly teacher reports
  const statusReport: StudentStatusReport | undefined = db.getStudentStatusReport(reportId);
  const weeklyReport: WeeklyTeacherReport | undefined = db.getWeeklyTeacherReport(reportId);

  // Security & Permission Enforcement
  let isAuthorized = false;
  let unauthorizedReason = '';

  if (statusReport) {
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DIRECTOR') {
      isAuthorized = true;
    } else if (currentUser.role === 'ADMIN') {
      isAuthorized = !currentUser.branchId || currentUser.branchId === statusReport.branchId;
      if (!isAuthorized) unauthorizedReason = 'This report belongs to another branch outside your administrative scope.';
    } else if (currentUser.role === 'TEACHER') {
      isAuthorized = statusReport.teacherId === currentUser.id || db.isTeacherAuthorizedForClass(currentUser.id, statusReport.classId);
      if (!isAuthorized) unauthorizedReason = 'You are not assigned to this class or student.';
    } else if (currentUser.role === 'PARENT') {
      const parentObj = db.getParents().find(p => p.email === currentUser.email || p.userId === currentUser.id || p.fullName === currentUser.name);
      const linkedIds = parentObj?.linkedStudentIds || currentUser.childrenIds || [];
      isAuthorized = Boolean(statusReport.studentId && linkedIds.includes(statusReport.studentId));
      if (!isAuthorized) unauthorizedReason = 'Parents may only view official academic reports belonging to their enrolled children.';
    }
  } else if (weeklyReport) {
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'DIRECTOR') {
      isAuthorized = true;
    } else if (currentUser.role === 'ADMIN') {
      isAuthorized = !currentUser.branchId || currentUser.branchId === weeklyReport.branchId || weeklyReport.recipientAdminId === currentUser.id;
      if (!isAuthorized) unauthorizedReason = 'This weekly teacher report belongs to another school branch.';
    } else if (currentUser.role === 'TEACHER') {
      isAuthorized = weeklyReport.teacherId === currentUser.id;
      if (!isAuthorized) unauthorizedReason = 'You are only authorized to view weekly reports submitted by your account.';
    } else if (currentUser.role === 'PARENT') {
      isAuthorized = false;
      unauthorizedReason = 'Weekly teacher status reports are administrative records reserved for school leadership.';
    }
  } else {
    // If not found by direct ID, check if studentId was provided
    if (studentId) {
      const reports = db.getStudentStatusReports({ studentId });
      if (reports.length > 0) {
        // Fallback to latest
        return (
          <ReportDetailViewerModal
            reportId={reports[0].id}
            currentUser={currentUser}
            onClose={onClose}
          />
        );
      }
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Modal Top Action Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                <span>Official Institutional Report Document</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Verified Record
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                School-monitored document linked directly from ZITEL CHAT ROOM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthorized && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Print Document"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Document</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all font-bold cursor-pointer"
              title="Close Report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          {!isAuthorized ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900">Access Restricted</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {unauthorizedReason || 'You do not hold the required authorization credentials to inspect this school document.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Return to Chat
                </button>
              </div>
            </div>
          ) : statusReport ? (
            /* Student Status Report Render */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Document Letterhead */}
              <div className="text-center border-b border-slate-100 pb-6">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-black text-lg">
                    Z
                  </div>
                  <div className="text-left">
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {school.name}
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500">
                      {statusReport.branchName || 'Accredited Academic Institution'}
                    </p>
                  </div>
                </div>
                <div className="inline-block bg-indigo-50 border border-indigo-200 px-4 py-1 rounded-full mt-2">
                  <span className="text-xs font-black text-indigo-900 tracking-wide uppercase">
                    {statusReport.reportType === 'INDIVIDUAL' ? 'Student Academic & Progress Report' : 'Class Progress Assessment'}
                  </span>
                </div>
              </div>

              {/* Student Meta Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student Name</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">
                    {statusReport.studentName || 'Class Cohort'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class & Arm</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                    {statusReport.className}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Term & Session</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                    {statusReport.term} ({statusReport.academicYear})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Teacher</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 block mt-0.5">
                    {statusReport.teacherName}
                  </span>
                </div>
              </div>

              {/* Core Analytics Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-900 block">Overall Academic Average</span>
                    <span className="text-2xl font-black text-indigo-700 mt-1 block">
                      {statusReport.academicSummary.overallAverage}%
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600">
                      Grade: {statusReport.academicSummary.letterGrade || (statusReport.academicSummary.overallAverage >= 80 ? 'A (Distinction)' : 'B (Credit)')}
                    </span>
                  </div>
                  <GraduationCap className="w-8 h-8 text-indigo-400 opacity-60" />
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 block">Attendance Rate</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1 block">
                      {statusReport.attendanceSummary.attendanceRate}%
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {statusReport.attendanceSummary.punctualityRating || 'Punctual & Consistent'}
                    </span>
                  </div>
                  <Clock className="w-8 h-8 text-emerald-400 opacity-60" />
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-purple-900 block">Behavior & Conduct</span>
                    <span className="text-2xl font-black text-purple-700 mt-1 block">
                      {statusReport.behaviorSummary.conductRating || 'Exemplary'}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600">
                      {statusReport.behaviorSummary.positiveCount} Positive Commendations
                    </span>
                  </div>
                  <Award className="w-8 h-8 text-purple-400 opacity-60" />
                </div>
              </div>

              {/* Qualitative Observations */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Academic Progress & Strengths</span>
                  </h4>
                  <ul className="text-xs text-slate-700 list-disc list-inside space-y-1 pt-1 font-medium">
                    {statusReport.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Focus Areas & Recommendations</span>
                  </h4>
                  <p className="text-xs text-slate-700 pt-1 leading-relaxed font-medium">
                    {statusReport.recommendations || statusReport.generalProgress || 'Continue current study schedule and active participation.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Teacher's Formal Observation
                  </h4>
                  <p className="text-xs text-slate-700 pt-1 leading-relaxed italic font-serif">
                    "{statusReport.teacherObservations || statusReport.participationNotes}"
                  </p>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <p className="font-bold text-slate-800">{statusReport.teacherName}</p>
                  <p className="text-[10px]">Form / Subject Teacher</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{new Date(statusReport.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Verified School Transcript</p>
                </div>
              </div>
            </div>
          ) : weeklyReport ? (
            /* Weekly Teacher Report Render */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Document Letterhead */}
              <div className="text-center border-b border-slate-100 pb-6">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-black text-lg">
                    Z
                  </div>
                  <div className="text-left">
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {school.name}
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500">
                      {weeklyReport.branchName || 'ZITEL CASTLE SCHOOL'}
                    </p>
                  </div>
                </div>
                <div className="inline-block bg-indigo-50 border border-indigo-200 px-4 py-1 rounded-full mt-2">
                  <span className="text-xs font-black text-indigo-900 tracking-wide uppercase">
                    Weekly Staff & Class Status Report — Week {weeklyReport.weekNumber}
                  </span>
                </div>
              </div>

              {/* Meta Card */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">
                    {weeklyReport.className}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evaluation Period</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                    {weeklyReport.startDate} – {weeklyReport.endDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Instructor</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 block mt-0.5">
                    {weeklyReport.teacherName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submission Status</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 block mt-0.5">
                    {weeklyReport.status}
                  </span>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Curriculum & Class Activities Covered
                  </h4>
                  <p className="text-xs text-slate-700 pt-1 leading-relaxed font-medium">
                    {weeklyReport.classActivities}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Academic Pacing & Assessment Results
                  </h4>
                  <p className="text-xs text-slate-700 pt-1 leading-relaxed font-medium">
                    {weeklyReport.academicProgress}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Attendance & Punctuality Summary
                    </h4>
                    <p className="text-xs text-slate-700 pt-1 leading-relaxed">
                      Rate: <span className="font-bold text-indigo-700">{weeklyReport.attendanceMetrics.averageRate}%</span> ({weeklyReport.attendanceMetrics.presentCount} attends / {weeklyReport.attendanceMetrics.totalDays} sessions)
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      {weeklyReport.attendanceMetrics.notes}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Behavioral Highlights & Notable Events
                    </h4>
                    <p className="text-xs text-slate-700 pt-1 leading-relaxed">
                      {weeklyReport.behavioralObservations}
                    </p>
                  </div>
                </div>

                {weeklyReport.issuesRequiringAdminAttention && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Items Requiring Administrative Attention</span>
                    </h4>
                    <p className="text-xs text-amber-900 pt-1 leading-relaxed font-medium">
                      {weeklyReport.issuesRequiringAdminAttention}
                    </p>
                  </div>
                )}

                {weeklyReport.adminFeedback && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Administrative Review & Directives</span>
                    </h4>
                    <p className="text-xs text-indigo-900 pt-1 leading-relaxed font-medium">
                      {weeklyReport.adminFeedback}
                    </p>
                    <p className="text-[10px] text-indigo-600 font-bold mt-1">
                      Reviewed by {weeklyReport.reviewedByAdminName || 'School Administration'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Report not found or has been archived.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
