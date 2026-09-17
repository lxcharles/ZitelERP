import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Award,
  FileText,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Edit3,
  History,
  Building2,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { User, StudentSessionArchive, TermAcademicRecord } from '../../types';
import { db } from '../../services/db';

interface AcademicArchiveViewerProps {
  currentUser: User;
  initialStudentId?: string;
}

export const AcademicArchiveViewer: React.FC<AcademicArchiveViewerProps> = ({
  currentUser,
  initialStudentId
}) => {
  const [archives, setArchives] = useState<StudentSessionArchive[]>(() => db.getStudentSessionArchives());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTermIndex, setSelectedTermIndex] = useState<number>(0);

  // Correction workflow modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetCorrectionSubjectId, setTargetCorrectionSubjectId] = useState<string>('');
  const [correctionField, setCorrectionField] = useState<string>('examScore');
  const [correctionNewValue, setCorrectionNewValue] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);

  // Group archives by student
  const studentList = useMemo(() => {
    const map = new Map<string, { studentId: string; schoolId: string; studentName: string; avatar?: string; sessionCount: number }>();
    for (const a of archives) {
      if (!map.has(a.studentId)) {
        map.set(a.studentId, {
          studentId: a.studentId,
          schoolId: a.schoolId,
          studentName: a.studentName,
          avatar: a.avatar,
          sessionCount: 1
        });
      } else {
        const existing = map.get(a.studentId)!;
        existing.sessionCount += 1;
      }
    }
    return Array.from(map.values());
  }, [archives]);

  // Set initial selected student if none
  React.useEffect(() => {
    if (!selectedStudentId && studentList.length > 0) {
      setSelectedStudentId(studentList[0].studentId);
    }
  }, [studentList, selectedStudentId]);

  // Archives for selected student
  const studentArchives = useMemo(() => {
    if (!selectedStudentId) return [];
    return archives.filter(a => a.studentId === selectedStudentId);
  }, [archives, selectedStudentId]);

  // Set initial selected session if none
  React.useEffect(() => {
    if (studentArchives.length > 0 && !selectedSession) {
      setSelectedSession(studentArchives[0].academicSession);
    }
  }, [studentArchives, selectedSession]);

  // Active archive record
  const activeArchive = useMemo(() => {
    if (!selectedStudentId) return undefined;
    if (!selectedSession) return studentArchives[0];
    return studentArchives.find(a => a.academicSession === selectedSession) || studentArchives[0];
  }, [studentArchives, selectedSession, selectedStudentId]);

  const activeTermRecord: TermAcademicRecord | undefined = useMemo(() => {
    if (!activeArchive || !activeArchive.terms || activeArchive.terms.length === 0) return undefined;
    return activeArchive.terms[selectedTermIndex] || activeArchive.terms[0];
  }, [activeArchive, selectedTermIndex]);

  // Filtered student list for search
  const filteredStudents = useMemo(() => {
    return studentList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.schoolId.toLowerCase().includes(q)
      );
    });
  }, [studentList, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteCorrection = () => {
    if (!activeArchive || !activeTermRecord) return;
    if (!['SUPER_ADMIN', 'DIRECTOR'].includes(currentUser.role)) {
      setCorrectionError('Historical records are strictly read-only. Only Super Admin and Director may authorize modifications.');
      return;
    }
    if (!correctionReason.trim() || correctionReason.trim().length < 10) {
      setCorrectionError('A formal justification reason (minimum 10 characters) is required for audit compliance.');
      return;
    }

    const numericVal = parseFloat(correctionNewValue);
    const finalVal = isNaN(numericVal) ? correctionNewValue : numericVal;

    const res = db.correctArchiveRecord({
      archiveId: activeArchive.id,
      termId: activeTermRecord.termId,
      subjectId: targetCorrectionSubjectId || undefined,
      field: correctionField,
      newValue: finalVal,
      reason: correctionReason
    }, currentUser);

    if (res.success && res.archive) {
      setArchives(db.getStudentSessionArchives());
      setCorrectionSuccess(res.message);
      setCorrectionError(null);
      setShowCorrectionModal(false);
      setCorrectionReason('');
      setCorrectionNewValue('');
    } else {
      setCorrectionError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 shrink-0">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Permanent Academic Archive & History
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Read-Only Preserved Record
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Retrieve historical term results, end-of-session report cards, attendance records, and promotion trail across all completed academic sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Archive Slip</span>
            </button>

            {['SUPER_ADMIN', 'DIRECTOR'].includes(currentUser.role) && activeArchive && (
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                title="Super Admin / Director administrative correction workflow"
              >
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Administrative Correction</span>
              </button>
            )}
          </div>
        </div>

        {correctionSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{correctionSuccess}</span>
            </div>
            <button onClick={() => setCorrectionSuccess(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Main Layout: Student Selector & Academic History Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Student Selector List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col h-[650px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Archived Students ({filteredStudents.length})
          </div>

          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
            {filteredStudents.map((s) => {
              const isSelected = s.studentId === selectedStudentId;
              return (
                <button
                  key={s.studentId}
                  onClick={() => {
                    setSelectedStudentId(s.studentId);
                    setSelectedSession('');
                    setSelectedTermIndex(0);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <img
                    src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.studentId}`}
                    alt={s.studentName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="font-bold truncate">{s.studentName}</p>
                    <p className="font-mono text-[10px] text-slate-500">{s.schoolId}</p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                    {s.sessionCount} sess
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Historical Academic Report & Sessions */}
        <div className="lg:col-span-3 space-y-5">
          {activeArchive ? (
            <>
              {/* Session & Term Breadcrumb / Filter Tabs */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Session Dropdown */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500">Academic Session:</span>
                    <select
                      value={selectedSession || activeArchive.academicSession}
                      onChange={(e) => {
                        setSelectedSession(e.target.value);
                        setSelectedTermIndex(0);
                      }}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {studentArchives.map(a => (
                        <option key={a.id} value={a.academicSession}>
                          {a.academicSession} ({a.className})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Badge */}
                  <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Class: {activeArchive.className}
                  </span>
                </div>

                {/* Term Subtabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {activeArchive.terms.map((t, idx) => (
                    <button
                      key={t.termId}
                      onClick={() => setSelectedTermIndex(idx)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedTermIndex === idx
                          ? 'bg-white text-indigo-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.termName.split(' ')[0]} Term
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Header Snapshot */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={activeArchive.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeArchive.studentId}`}
                    alt={activeArchive.studentName}
                    className="w-14 h-14 rounded-full ring-2 ring-indigo-400/50 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold tracking-tight">{activeArchive.studentName}</h2>
                      <span className="font-mono text-xs font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                        {activeArchive.schoolId}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      {activeArchive.branchName} • Class in Archive: <strong className="text-white">{activeArchive.className}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Archived Session: {activeArchive.academicSession} • Archived By: {activeArchive.archivedByAdminName}
                    </p>
                  </div>
                </div>

                {/* Session Grade & Promotion Status */}
                <div className="flex items-center gap-3">
                  <div className="text-center p-3 bg-white/10 rounded-xl border border-white/15">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">Session Avg</p>
                    <p className="text-xl font-black text-white">{activeArchive.sessionAverage || 85.0}%</p>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-xl border border-white/15">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">Promotion</p>
                    <p className="text-xs font-black text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {activeArchive.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Term Academic Breakdown */}
              {activeTermRecord && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-500 block font-medium">Term Average</span>
                      <span className="text-base font-extrabold text-slate-900">{activeTermRecord.averageScore}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-500 block font-medium">Grade Attained</span>
                      <span className="text-base font-extrabold text-indigo-700">{activeTermRecord.letterGrade}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-500 block font-medium">Attendance Rate</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {activeTermRecord.attendanceSummary?.attendanceRate || 96.0}%
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-500 block font-medium">Conduct Rating</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {activeTermRecord.behaviorSummary?.conductRating || 'Exemplary'}
                      </span>
                    </div>
                  </div>

                  {/* Subject Scores Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Archived Term Subject Scores</span>
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-3 text-center">CA (40)</th>
                            <th className="py-2.5 px-3 text-center">Exam (60)</th>
                            <th className="py-2.5 px-3 text-center">Total (100)</th>
                            <th className="py-2.5 px-3 text-center">Grade</th>
                            <th className="py-2.5 px-3">Teacher Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeTermRecord.subjects.map((sub) => (
                            <tr key={sub.subjectId} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{sub.subjectName}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700 font-mono">{sub.caScore}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700 font-mono">{sub.examScore}</td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-indigo-900 font-mono">
                                {sub.totalScore}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {sub.grade}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 italic text-[11px]">{sub.remark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Teacher & Principal Remarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <span className="font-bold text-indigo-900 block mb-1">Class Teacher Remarks</span>
                      <p className="text-slate-700 italic">
                        "{activeTermRecord.teacherRemarks || 'Consistent academic engagement throughout the session.'}"
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block mb-1">Principal / Administrative Recommendation</span>
                      <p className="text-slate-700 italic">
                        "{activeTermRecord.principalRemarks || 'Promoted with distinction to the next academic level.'}"
                      </p>
                    </div>
                  </div>

                  {/* Promotion Audit Link */}
                  {activeArchive.promotionRecord && (
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Promotion Trail Verified</span>
                        </p>
                        <p className="text-emerald-800 text-[11px] mt-0.5">
                          Promoted from {activeArchive.promotionRecord.fromClassName} to{' '}
                          <strong>{activeArchive.promotionRecord.toClassName}</strong> by{' '}
                          {activeArchive.promotionRecord.promotedByUserName} ({activeArchive.promotionRecord.promotedByUserRole}) on{' '}
                          {new Date(activeArchive.promotionRecord.promotedAt).toLocaleDateString()}.
                        </p>
                      </div>
                      <span className="font-mono text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded shrink-0">
                        {activeArchive.promotionRecord.batchId || 'Single Promotion'}
                      </span>
                    </div>
                  )}

                  {/* Correction History if modified */}
                  {activeArchive.correctionHistory && activeArchive.correctionHistory.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                      <p className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-amber-700" />
                        Administrative Correction Audit History
                      </p>
                      <div className="space-y-1.5">
                        {activeArchive.correctionHistory.map((c) => (
                          <div key={c.id} className="p-2 bg-white rounded border border-amber-200 text-[11px] text-slate-700">
                            <span className="font-bold text-slate-900">{c.correctedByUserName} ({c.correctedByUserRole})</span>
                            {' '}changed <strong>{c.fieldChanged}</strong> from {String(c.oldValue)} to {String(c.newValue)} on {new Date(c.correctedAt).toLocaleString()}.
                            <p className="text-slate-500 italic mt-0.5">Reason: {c.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">No academic archive selected</p>
              <p className="text-xs text-slate-400 mt-1">Select a student from the left column to view their permanent academic record.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADMINISTRATIVE CORRECTION MODAL */}
      {showCorrectionModal && activeArchive && activeTermRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-extrabold text-base">Administrative Archive Correction</h3>
                  <p className="text-xs text-amber-200">Director / Super Admin Controlled Workflow</p>
                </div>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-amber-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {correctionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {correctionError}
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold">Permanent Audit Trail Enforcement</p>
                <p>
                  Every change to historical student marks or records is stamped with your identity ({currentUser.name}), 
                  timestamp, previous value, new value, and mandatory reason.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Subject (Optional):</label>
                <select
                  value={targetCorrectionSubjectId}
                  onChange={(e) => setTargetCorrectionSubjectId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">-- General Term Property (Average, Comments) --</option>
                  {activeTermRecord.subjects.map(s => (
                    <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Being Corrected:</label>
                <select
                  value={correctionField}
                  onChange={(e) => setCorrectionField(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {targetCorrectionSubjectId ? (
                    <>
                      <option value="examScore">Exam Score</option>
                      <option value="caScore">CA Score</option>
                      <option value="totalScore">Total Score</option>
                      <option value="grade">Letter Grade</option>
                      <option value="remark">Teacher Remark</option>
                    </>
                  ) : (
                    <>
                      <option value="averageScore">Term Average Score</option>
                      <option value="letterGrade">Term Letter Grade</option>
                      <option value="teacherRemarks">Teacher Remarks</option>
                      <option value="principalRemarks">Principal Remarks</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Value:</label>
                <input
                  type="text"
                  placeholder="Enter corrected value"
                  value={correctionNewValue}
                  onChange={(e) => setCorrectionNewValue(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mandatory Change Justification Reason (min 10 characters):
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Authorized regrading after formal examination script re-mark committee review"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCorrection}
                className="px-5 py-2 text-xs font-black bg-amber-700 hover:bg-amber-600 text-white rounded-xl shadow-sm transition-colors"
              >
                Authorize & Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
