import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  User as UserIcon,
  Users,
  Star,
  Sparkles,
  TrendingUp,
  Clock,
  Trash2,
  Edit3,
  ChevronRight,
  X,
  BookOpen,
  Send,
  Download
} from 'lucide-react';
import { User, Student, Class, StudentStatusReport } from '../../types';
import { db } from '../../services/db';

interface StudentStatusReportManagerProps {
  currentUser: User;
  activeClass: Class;
  students: Student[];
}

export const StudentStatusReportManager: React.FC<StudentStatusReportManagerProps> = ({
  currentUser,
  activeClass,
  students,
}) => {
  const [reportType, setReportType] = useState<'INDIVIDUAL' | 'CLASS'>('INDIVIDUAL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term');
  const [activeReportForView, setActiveReportForView] = useState<StudentStatusReport | null>(null);

  // Editor Modal State
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Editable Form Fields
  const [formReportType, setFormReportType] = useState<'INDIVIDUAL' | 'CLASS'>('INDIVIDUAL');
  const [formStudentId, setFormStudentId] = useState<string>(students[0]?.id || '');
  const [formTerm, setFormTerm] = useState<string>('First Term');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2025/2026');
  const [formOverallAverage, setFormOverallAverage] = useState<number>(85);
  const [formAttendanceRate, setFormAttendanceRate] = useState<number>(96);
  const [formConductRating, setFormConductRating] = useState<string>('Exemplary');
  const [formParticipationNotes, setFormParticipationNotes] = useState<string>('');
  const [formStrengthsText, setFormStrengthsText] = useState<string>('');
  const [formImprovementText, setFormImprovementText] = useState<string>('');
  const [formTeacherObservations, setFormTeacherObservations] = useState<string>('');
  const [formGeneralProgress, setFormGeneralProgress] = useState<string>('');
  const [formRecommendations, setFormRecommendations] = useState<string>('');
  const [formImportantIncidents, setFormImportantIncidents] = useState<string>('');

  // Fetch live reports
  const reports = db.getStudentStatusReports({
    classId: activeClass.id,
  });

  const handleGenerateDraft = (type: 'INDIVIDUAL' | 'CLASS', studentId?: string) => {
    setEditingReportId(null);
    setFormReportType(type);
    setFormTerm(selectedTerm);
    setFormAcademicYear('2025/2026');

    if (type === 'INDIVIDUAL') {
      const targetId = studentId || selectedStudentId || students[0]?.id;
      setFormStudentId(targetId);
      const draft = db.generateStudentStatusReportDraft(targetId, selectedTerm, currentUser);
      setFormOverallAverage(draft.academicSummary.overallAverage);
      setFormAttendanceRate(draft.attendanceSummary.attendanceRate);
      setFormConductRating(draft.behaviorSummary.conductRating);
      setFormParticipationNotes(draft.participationNotes);
      setFormStrengthsText(draft.strengths.join('\n'));
      setFormImprovementText(draft.areasForImprovement.join('\n'));
      setFormTeacherObservations(draft.teacherObservations);
      setFormGeneralProgress(draft.generalProgress);
      setFormRecommendations(draft.recommendations);
      setFormImportantIncidents(draft.importantIncidents || '');
    } else {
      const draft = db.generateClassStatusReportDraft(activeClass.id, selectedTerm, currentUser);
      setFormOverallAverage(draft.academicSummary.overallAverage);
      setFormAttendanceRate(draft.attendanceSummary.attendanceRate);
      setFormConductRating(draft.behaviorSummary.conductRating);
      setFormParticipationNotes(draft.participationNotes);
      setFormStrengthsText(draft.strengths.join('\n'));
      setFormImprovementText(draft.areasForImprovement.join('\n'));
      setFormTeacherObservations(draft.teacherObservations);
      setFormGeneralProgress(draft.generalProgress);
      setFormRecommendations(draft.recommendations);
      setFormImportantIncidents(draft.importantIncidents || '');
    }

    setShowEditorModal(true);
  };

  const handleOpenEditReport = (r: StudentStatusReport) => {
    setEditingReportId(r.id);
    setFormReportType(r.reportType);
    setFormStudentId(r.studentId || '');
    setFormTerm(r.term);
    setFormAcademicYear(r.academicYear);
    setFormOverallAverage(r.academicSummary.overallAverage);
    setFormAttendanceRate(r.attendanceSummary.attendanceRate);
    setFormConductRating(r.behaviorSummary.conductRating);
    setFormParticipationNotes(r.participationNotes);
    setFormStrengthsText(r.strengths.join('\n'));
    setFormImprovementText(r.areasForImprovement.join('\n'));
    setFormTeacherObservations(r.teacherObservations);
    setFormGeneralProgress(r.generalProgress);
    setFormRecommendations(r.recommendations);
    setFormImportantIncidents(r.importantIncidents || '');
    setShowEditorModal(true);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    const strengthsArray = formStrengthsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const improvementArray = formImprovementText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (formReportType === 'INDIVIDUAL') {
      const student = students.find(s => s.id === formStudentId);
      if (!student) return;

      const reportPayload = {
        reportType: 'INDIVIDUAL' as const,
        studentId: student.id,
        studentName: student.fullName,
        studentAvatar: student.avatar,
        studentAdmissionNo: student.studentId,
        classId: activeClass.id,
        className: activeClass.name,
        branchId: activeClass.branchId,
        branchName: activeClass.branchName,
        academicYear: formAcademicYear,
        term: formTerm,
        date: new Date().toISOString().split('T')[0],
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        academicSummary: {
          overallAverage: formOverallAverage,
          topSubjects: ['Mathematics', 'English Studies', 'Basic Science'],
          strugglingSubjects: [],
          assessmentCount: 6,
          letterGrade: formOverallAverage >= 80 ? 'A' : formOverallAverage >= 70 ? 'B' : 'C',
        },
        attendanceSummary: {
          attendanceRate: formAttendanceRate,
          presentDays: 24,
          absentDays: 0,
          lateDays: 1,
          punctualityRating: formAttendanceRate >= 95 ? 'Excellent' : 'Good',
        },
        behaviorSummary: {
          positiveCount: 6,
          concernCount: 1,
          incidentCount: 0,
          conductRating: formConductRating,
        },
        participationNotes: formParticipationNotes.trim(),
        strengths: strengthsArray.length > 0 ? strengthsArray : ['Dedicated class participation'],
        areasForImprovement: improvementArray.length > 0 ? improvementArray : ['Continue regular home study'],
        teacherObservations: formTeacherObservations.trim(),
        generalProgress: formGeneralProgress.trim(),
        recommendations: formRecommendations.trim(),
        importantIncidents: formImportantIncidents.trim() || undefined,
      };

      if (editingReportId) {
        const updated = db.updateStudentStatusReport(editingReportId, reportPayload, currentUser);
        setActiveReportForView(updated);
      } else {
        const created = db.createStudentStatusReport(reportPayload, currentUser);
        setActiveReportForView(created);
      }
    } else {
      const reportPayload = {
        reportType: 'CLASS' as const,
        classId: activeClass.id,
        className: activeClass.name,
        branchId: activeClass.branchId,
        branchName: activeClass.branchName,
        academicYear: formAcademicYear,
        term: formTerm,
        date: new Date().toISOString().split('T')[0],
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        academicSummary: {
          overallAverage: formOverallAverage,
          topSubjects: ['Mathematics (86%)', 'English Studies (84%)', 'Basic Science (88%)'],
          strugglingSubjects: [],
          assessmentCount: 28,
          letterGrade: formOverallAverage >= 80 ? 'A' : 'B',
        },
        attendanceSummary: {
          attendanceRate: formAttendanceRate,
          presentDays: 120,
          absentDays: 4,
          lateDays: 2,
          punctualityRating: 'High Class Punctuality',
        },
        behaviorSummary: {
          positiveCount: 22,
          concernCount: 3,
          incidentCount: 1,
          conductRating: formConductRating,
        },
        participationNotes: formParticipationNotes.trim(),
        strengths: strengthsArray.length > 0 ? strengthsArray : ['Strong cohort synergy and attendance'],
        areasForImprovement: improvementArray.length > 0 ? improvementArray : ['Targeted phonics coaching'],
        teacherObservations: formTeacherObservations.trim(),
        generalProgress: formGeneralProgress.trim(),
        recommendations: formRecommendations.trim(),
        importantIncidents: formImportantIncidents.trim() || undefined,
      };

      if (editingReportId) {
        const updated = db.updateStudentStatusReport(editingReportId, reportPayload, currentUser);
        setActiveReportForView(updated);
      } else {
        const created = db.createStudentStatusReport(reportPayload, currentUser);
        setActiveReportForView(created);
      }
    }

    setShowEditorModal(false);
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Delete this status report?')) {
      db.deleteStudentStatusReport(id, currentUser);
      if (activeReportForView?.id === id) setActiveReportForView(null);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="student-status-report-manager">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Student & Class Status Reports</h2>
              <p className="text-xs text-slate-500 font-medium">
                Generate holistic academic progress, attendance profiles, behavioral summaries, and recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateDraft('INDIVIDUAL')}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            id="btn-gen-student-status-report"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Student Report</span>
          </button>

          <button
            onClick={() => handleGenerateDraft('CLASS')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            id="btn-gen-class-status-report"
          >
            <Users className="w-4 h-4" />
            <span>Generate Class Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Report History List (Left) & Live Report Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report List & Quick Generator */}
        <div className="space-y-4">
          {/* Quick Launch Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Quick Generator</h3>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Pupil</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Evaluation Term</label>
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="First Term">First Term (2025/2026)</option>
                <option value="Second Term">Second Term (2025/2026)</option>
                <option value="Third Term">Third Term (2025/2026)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleGenerateDraft('INDIVIDUAL', selectedStudentId)}
                className="py-2 px-3 text-center text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all"
              >
                Draft Individual
              </button>
              <button
                onClick={() => handleGenerateDraft('CLASS')}
                className="py-2 px-3 text-center text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all"
              >
                Draft Class
              </button>
            </div>
          </div>

          {/* Generated Reports Archive List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Generated Reports ({reports.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Click to preview</span>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No status reports generated yet for {activeClass.name}.
              </p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {reports.map(r => {
                  const isSelected = activeReportForView?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setActiveReportForView(r)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                r.reportType === 'INDIVIDUAL'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {r.reportType}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{r.term}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">
                            {r.reportType === 'INDIVIDUAL' ? r.studentName : `${r.className} Class`}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Avg: {r.academicSummary.overallAverage}% • Att: {r.attendanceSummary.attendanceRate}% • {r.date}
                          </p>
                        </div>

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEditReport(r)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Edit Report"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
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
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                    {activeReportForView.reportType === 'INDIVIDUAL' ? 'Student Status Report' : 'Class Status Report'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{activeReportForView.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditReport(activeReportForView)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>

                  <button
                    onClick={handlePrintReport}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* School Header Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <h1 className="text-xl font-black tracking-wide text-slate-900 uppercase">
                  ZITEL CASTLE SCHOOL
                </h1>
                <p className="text-xs font-bold text-indigo-700 tracking-wider uppercase">
                  {activeReportForView.branchName || 'BUNGALOW BRANCH'} • PRIMARY & SECONDARY ACADEMY
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  OFFICIAL PROGRESS, CONDUCT & STATUS REPORT • {activeReportForView.term.toUpperCase()} ({activeReportForView.academicYear})
                </p>
              </div>

              {/* Student / Class Info Header */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Subject Target</span>
                  <strong className="text-slate-900 font-bold text-sm">
                    {activeReportForView.reportType === 'INDIVIDUAL'
                      ? activeReportForView.studentName
                      : `${activeReportForView.className} Entire Class`}
                  </strong>
                  {activeReportForView.studentAdmissionNo && (
                    <span className="text-[10px] text-slate-500 font-mono block">
                      ID: {activeReportForView.studentAdmissionNo}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Class / Grade</span>
                  <strong className="text-slate-800 font-bold">{activeReportForView.className}</strong>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Form Teacher</span>
                  <strong className="text-slate-800 font-bold">{activeReportForView.teacherName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Date of Issue</span>
                  <strong className="text-slate-800 font-bold">{activeReportForView.date}</strong>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Academic Progress</span>
                  <p className="text-2xl font-black text-blue-900 mt-0.5">
                    {activeReportForView.academicSummary.overallAverage}%
                  </p>
                  <span className="text-[10px] font-bold text-blue-700">
                    Grade {activeReportForView.academicSummary.letterGrade || 'A'} Standard
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Attendance Rate</span>
                  <p className="text-2xl font-black text-emerald-900 mt-0.5">
                    {activeReportForView.attendanceSummary.attendanceRate}%
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {activeReportForView.attendanceSummary.punctualityRating}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Conduct & Behavior</span>
                  <p className="text-lg font-black text-indigo-900 mt-1">
                    {activeReportForView.behaviorSummary.conductRating}
                  </p>
                  <span className="text-[10px] font-bold text-indigo-700">
                    {activeReportForView.behaviorSummary.positiveCount} Positive Commendations
                  </span>
                </div>
              </div>

              {/* Participation & Classroom Engagement */}
              {activeReportForView.participationNotes && (
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>Classroom Participation & Peer Engagement</span>
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.participationNotes}
                  </p>
                </div>
              )}

              {/* Strengths & Improvement Areas (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Identified Strengths & Talents</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeReportForView.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Areas Requiring Focus & Growth</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeReportForView.areasForImprovement.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Teacher Observations & General Progress */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Form Teacher's Detailed Observations
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.teacherObservations}
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    General Progress Evaluation
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {activeReportForView.generalProgress}
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                    Actionable Recommendations for Home & School
                  </h3>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                    {activeReportForView.recommendations}
                  </p>
                </div>

                {activeReportForView.importantIncidents && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Behavioral & Disciplinary Incidents Note</span>
                    </h3>
                    <p className="text-xs text-rose-950 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                      {activeReportForView.importantIncidents}
                    </p>
                  </div>
                )}
              </div>

              {/* Formal Sign-off Section */}
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
                    <span className="font-serif italic text-slate-400 text-xs">
                      [Official Seal / Principal's Stamp]
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block text-center mt-1">
                    Head of School / Branch Administrator Approval
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Report Selected for Preview</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select an existing status report from the left column, or click "Generate Student Report" above to compile an official assessment and behavioral evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STATUS REPORT GENERATOR / EDITOR MODAL */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingReportId ? 'Edit Status Report' : `Generate ${formReportType} Status Report`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Review and refine auto-compiled progress indicators and recommendations
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

            <form onSubmit={handleSaveReport} className="mt-5 space-y-4">
              {/* Type, Student, Term */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Report Scope</label>
                  <select
                    value={formReportType}
                    onChange={e => setFormReportType(e.target.value as 'INDIVIDUAL' | 'CLASS')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="INDIVIDUAL">Individual Student</option>
                    <option value="CLASS">Entire Class</option>
                  </select>
                </div>

                {formReportType === 'INDIVIDUAL' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                    <select
                      value={formStudentId}
                      onChange={e => setFormStudentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                    <input
                      type="text"
                      disabled
                      value={activeClass.name}
                      className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-xl font-bold text-slate-700"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Term</label>
                  <select
                    value={formTerm}
                    onChange={e => setFormTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>

              {/* Metrics Row: Overall Average, Attendance %, Conduct Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overall Average (%)</label>
                  <input
                    type="number"
                    value={formOverallAverage}
                    onChange={e => setFormOverallAverage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Rate (%)</label>
                  <input
                    type="number"
                    value={formAttendanceRate}
                    onChange={e => setFormAttendanceRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conduct & Behavior Rating</label>
                  <select
                    value={formConductRating}
                    onChange={e => setFormConductRating(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Exemplary">Exemplary Conduct</option>
                    <option value="Commendable">Commendable & Respectful</option>
                    <option value="Satisfactory">Satisfactory Standard</option>
                    <option value="Requires Guidance">Requires Guidance</option>
                  </select>
                </div>
              </div>

              {/* Participation Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Participation & Engagement Narrative
                </label>
                <textarea
                  rows={2}
                  value={formParticipationNotes}
                  onChange={e => setFormParticipationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Strengths & Improvement (2 textareas, line-separated) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Key Strengths (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter strength 1&#10;Enter strength 2"
                    value={formStrengthsText}
                    onChange={e => setFormStrengthsText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    Areas for Improvement (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter improvement area 1&#10;Enter improvement area 2"
                    value={formImprovementText}
                    onChange={e => setFormImprovementText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Teacher Observations */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Form Teacher's Detailed Observations
                </label>
                <textarea
                  rows={2}
                  value={formTeacherObservations}
                  onChange={e => setFormTeacherObservations(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* General Progress & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    General Progress Summary
                  </label>
                  <textarea
                    rows={2}
                    value={formGeneralProgress}
                    onChange={e => setFormGeneralProgress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teacher Recommendations for Parents
                  </label>
                  <textarea
                    rows={2}
                    value={formRecommendations}
                    onChange={e => setFormRecommendations(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Important Incidents */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Important Behavioral / Conduct Incidents (Optional)
                </label>
                <input
                  type="text"
                  placeholder="None recorded or specify incident details..."
                  value={formImportantIncidents}
                  onChange={e => setFormImportantIncidents(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save & Generate Official Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
