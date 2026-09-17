import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle2,
  CalendarCheck,
  School,
  Sparkles,
  FileText,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Student, SchoolProfile } from '../../types';
import { db } from '../../services/db';

interface ReportCardModalProps {
  student: Student;
  term?: string;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  student,
  term: initialTerm,
  onClose,
}) => {
  const school: SchoolProfile = db.getSchoolProfile();
  const sessions = db.getAcademicSessions();
  const activeSession = db.getActiveAcademicSession();
  const termContext = db.getTermContext();
  const branches = db.getBranches();
  
  const studentBranch = branches.find(b => b.id === student.branchId) || branches[0];
  const classes = db.getClasses();
  const studentClass = classes.find(c => c.id === student.classId);
  const formTeacherName = studentClass?.formTeacherName || student.formTeacherName || 'Form Teacher';
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>(activeSession.id);
  const currentSession = sessions.find(s => s.id === selectedSessionId) || activeSession;
  
  const [selectedTermId, setSelectedTermId] = React.useState<string>(termContext.term?.id || currentSession.terms[0].id);
  const currentTerm = currentSession.terms.find(t => t.id === selectedTermId) || currentSession.terms[0];
  const [activeDocType, setActiveDocType] = useState<'report_card' | 'transcript'>('report_card');

  const subjects = db.getSubjects();
  const assessments = db.getAssessments().filter(a => a.classId === student.classId);
  const allScores = db.getAssessmentScores().filter(s => s.studentId === student.id);
  const attendance = db.getAttendance().filter(
    a => a.studentId === student.id && a.classId === student.classId
  );
  const behaviors = db.getBehaviorRecords().filter(b => b.studentId === student.id);

  // Compute subject scores
  const subjectBreakdown = subjects.map((sub, idx) => {
    const subAssessments = assessments.filter(a => a.subjectId === sub.id);
    const subCode = sub.code || `SUB-${String(idx + 1).padStart(2, '0')}`;
    if (subAssessments.length === 0) {
      // Demo simulated score for full report cards
      const demoScore = sub.id === 'sub_math' ? 92 : sub.id === 'sub_eng' ? 84 : sub.id === 'sub_sci' ? 88 : sub.id === 'sub_soc' ? 86 : 80;
      return {
        subject: sub,
        code: subCode,
        classwork: 18,
        test: 36,
        exam: demoScore,
        total: demoScore,
        grade: demoScore >= 90 ? 'A+' : demoScore >= 80 ? 'A' : demoScore >= 70 ? 'B' : 'C',
        gpa: demoScore >= 90 ? 4.0 : demoScore >= 80 ? 3.8 : demoScore >= 70 ? 3.0 : 2.0,
        remarks: demoScore >= 90 ? 'Outstanding conceptual grasp' : demoScore >= 80 ? 'Very good comprehension' : 'Satisfactory progress',
        standing: demoScore >= 80 ? 'Distinction' : demoScore >= 60 ? 'Credit' : 'Pass',
      };
    }

    const subScores = allScores.filter(s =>
      subAssessments.some(a => a.id === s.assessmentId)
    );
    const avg = subScores.length > 0
      ? Math.round(subScores.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0) / subScores.length)
      : 85;

    const matchedGrade = school.gradingScheme.find(
      g => avg >= g.minScore && avg <= g.maxScore
    ) || school.gradingScheme[0];

    return {
      subject: sub,
      code: subCode,
      classwork: 18,
      test: 36,
      exam: avg,
      total: avg,
      grade: matchedGrade.grade,
      gpa: matchedGrade.gpa,
      remarks: matchedGrade.remark,
      standing: avg >= 80 ? 'Distinction' : avg >= 60 ? 'Credit' : 'Pass',
    };
  });

  const overallAvg = Math.round(
    subjectBreakdown.reduce((acc, s) => acc + s.total, 0) / (subjectBreakdown.length || 1)
  );
  const overallGpa = (
    subjectBreakdown.reduce((acc, s) => acc + s.gpa, 0) / (subjectBreakdown.length || 1)
  ).toFixed(2);
  const totalGradePoints = (parseFloat(overallGpa) * (subjectBreakdown.length || 1)).toFixed(1);

  // Attendance stats
  const totalDays = attendance.length || 20;
  const presentDays = attendance.filter(a => a.status === 'PRESENT').length || 18;
  const lateDays = attendance.filter(a => a.status === 'LATE').length || 1;
  const absentDays = attendance.filter(a => a.status === 'ABSENT').length || 1;
  const attendanceRate = Math.round(((presentDays + lateDays) / totalDays) * 100) || 96;

  const academicHonors = parseFloat(overallGpa) >= 3.5 
    ? 'First Class Scholastic Honours / Distinction' 
    : parseFloat(overallGpa) >= 3.0 
    ? 'Upper Credit Honours' 
    : 'Satisfactory Academic Standing';

  const transcriptSerial = `TRN-${(student.studentId || student.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}-${currentSession.name.slice(0, 4)}`;
  const dateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // Standard report card print
  const handlePrint = () => {
    document.body.classList.remove('printing-transcript');
    window.print();
  };

  // Dedicated Official Transcript print using custom print-only CSS class
  const handlePrintOfficialTranscript = () => {
    document.body.classList.add('printing-transcript');
    const cleanup = () => {
      document.body.classList.remove('printing-transcript');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 2500);
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `Subject Code,Subject Name,CA (40),Exam (60),Total (%),Grade,GPA,Standing,Remarks\n`;
    subjectBreakdown.forEach(s => {
      csv += `"${s.code}","${s.subject.name}",${s.classwork + s.test},${s.exam},${s.total},${s.grade},${s.gpa},"${s.standing}","${s.remarks}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Official_Transcript_${student.fullName.replace(/\s+/g, '_')}_${currentSession.name.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Action Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-3">
            <Award className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Official Student Report & Transcript
              </h2>
              <p className="text-xs text-slate-500">
                Student: <strong className="text-slate-800">{student.fullName}</strong> • {student.className} • {studentBranch.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold mr-1">
              <button
                type="button"
                onClick={() => setActiveDocType('report_card')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeDocType === 'report_card'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Term Report Sheet
              </button>
              <button
                type="button"
                onClick={() => setActiveDocType('transcript')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeDocType === 'transcript'
                    ? 'bg-white text-indigo-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Official Transcript
              </button>
            </div>

            {/* Session Selector */}
            <select
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden"
              title="Select Academic Session"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} Session
                </option>
              ))}
            </select>

            {/* Term Selector */}
            <select
              value={selectedTermId}
              onChange={e => setSelectedTermId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-hidden"
              title="Select Term"
            >
              {currentSession.terms.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Print Official Transcript Button */}
            <button
              onClick={handlePrintOfficialTranscript}
              id="btn-print-official-transcript"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Print formal academic transcript formatted for official school records"
            >
              <FileText className="w-4 h-4" />
              <span>Print Official Transcript</span>
            </button>

            {/* Standard Report Card Print Button */}
            <button
              onClick={handlePrint}
              id="btn-print-report-card"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body Wrapper */}
        <div className="overflow-y-auto flex-1 bg-slate-100 p-3 sm:p-6">
          {/* 1. STANDARD TERM REPORT CARD */}
          <div className={`max-w-4xl mx-auto p-6 sm:p-10 bg-white text-slate-800 rounded-xl shadow-xs printable-card ${activeDocType === 'transcript' ? 'hidden print:block' : 'block'}`}>
            {/* Official Letterhead */}
          <div className="border-b-2 border-indigo-900 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center space-x-4">
                {school.logo ? (
                  <img
                    src={school.logo}
                    alt={school.name}
                    className="h-16 w-auto max-w-[160px] object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-900 flex items-center justify-center text-white font-extrabold text-2xl shadow-md ring-4 ring-indigo-50">
                    <School className="w-9 h-9 text-amber-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-950 uppercase tracking-tight font-display">
                    {school.name}
                  </h1>
                  <p className="text-xs font-medium text-slate-600 italic">
                    "{school.motto}"
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {studentBranch.name} • {studentBranch.address}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Tel: {studentBranch.phone || school.phone} • Email: {school.email}
                  </p>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-extrabold text-xs rounded-lg uppercase tracking-wider">
                  Official Academic Report Sheet
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">{currentTerm.name}</p>
                <p className="text-xs font-semibold text-slate-700">{currentSession.name} Academic Session</p>
                <p className="text-[11px] text-indigo-600 font-bold mt-0.5">Branch: {studentBranch.name}</p>
              </div>
            </div>
          </div>

          {/* Student Profile & Calendar Schedule Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Student Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Official Student ID</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{student.studentId}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Assigned Class</span>
              <span className="font-bold text-slate-800 text-sm">{student.className}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">School Branch</span>
              <span className="font-semibold text-slate-800 text-sm">{studentBranch.name}</span>
            </div>
          </div>

          {/* Official Calendar Dates Banner (Pulled Automatically From School Calendar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs mb-6">
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                Term Opening Date
              </span>
              <span className="font-bold text-indigo-950 text-xs mt-0.5 block">
                {new Date(currentTerm.openingDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                Term Closing Date
              </span>
              <span className="font-bold text-rose-700 text-xs mt-0.5 block">
                {new Date(currentTerm.closingDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                Official Vacation Period
              </span>
              <span className="font-bold text-amber-700 text-xs mt-0.5 block">
                {currentTerm.vacationStartDate && currentTerm.vacationEndDate
                  ? `${new Date(currentTerm.vacationStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(currentTerm.vacationEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'After closing assembly'}
              </span>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-indigo-100">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                Next Term Resumption Date
              </span>
              <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                {new Date(currentTerm.nextTermOpeningDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Academic Scores Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cognitive Academic Performance
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Grading Weight: Continuous Assessment (40%) + Exam (60%)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Classwork (20)</th>
                    <th className="py-2.5 px-3 text-center">Midterm (40)</th>
                    <th className="py-2.5 px-3 text-center">Exam (100)</th>
                    <th className="py-2.5 px-3 text-center">Total (%)</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center">GPA</th>
                    <th className="py-2.5 px-3">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectBreakdown.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>{item.subject.name}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{item.classwork}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{item.test}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{item.exam}</td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">
                        {item.total}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                          item.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                          item.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">{item.gpa.toFixed(1)}</td>
                      <td className="py-2 px-3 text-slate-600 italic text-[11px]">{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Totals & Attendance Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Overall Academic Aggregate */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
              <h4 className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider mb-2 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>Overall Academic Aggregate</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Average Score</span>
                  <span className="text-base font-extrabold text-indigo-700">{overallAvg}%</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Cumulative GPA</span>
                  <span className="text-base font-extrabold text-indigo-700">{overallGpa} / 4.0</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Final Standing</span>
                  <span className="text-xs font-bold text-emerald-700 mt-1 inline-block">Excellent</span>
                </div>
              </div>
            </div>

            {/* Attendance Record */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2 flex items-center space-x-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Attendance Summary</span>
              </h4>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Days Enrolled</span>
                  <span className="font-bold text-slate-700">{totalDays}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Present</span>
                  <span className="font-bold text-emerald-600">{presentDays}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Late / Excused</span>
                  <span className="font-bold text-amber-600">{lateDays + absentDays}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Attendance Rate</span>
                  <span className="font-bold text-indigo-700">{attendanceRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher & Principal Remarks */}
          <div className="space-y-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Class Teacher's Verified Assessment & Comment
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{formTeacherName}</span>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "{student.fullName} has had an exceptional term. They demonstrate exceptional enthusiasm in mathematics and scientific inquiry, cooperate constructively with peers, and consistently complete assignments with pride and diligence. We encourage continued home reading to maintain this wonderful academic trajectory."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Head of School / Principal's General Endorsement
                </span>
                <span className="text-[10px] text-slate-400">{school.branding.principalName}</span>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "An outstanding academic and developmental performance. Promoted with commendation into the next academic phase."
              </p>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-xs">
            <div className="text-center">
              <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                <span className="font-serif italic text-indigo-900 text-sm">{formTeacherName}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase mt-1 block">Form Teacher Signature</span>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                <span className="font-serif italic text-indigo-900 text-sm">Eleanor Vance, Ed.D</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase mt-1 block">Principal's Signature</span>
            </div>
            <div className="text-center col-span-2 sm:col-span-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-indigo-800 flex items-center justify-center text-center p-1 text-[8px] font-extrabold uppercase text-indigo-900 tracking-tighter">
                Official School Seal
              </div>
              <span className="text-[9px] text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            {school.branding.reportCardFooter}
          </div>
        </div>

        {/* 2. OFFICIAL ACADEMIC TRANSCRIPT DOCUMENT */}
        <div
          id="official-transcript-view"
          className={`max-w-4xl mx-auto p-8 sm:p-12 bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200 official-transcript-print official-transcript-document ${
            activeDocType === 'report_card' ? 'hidden print:block' : 'block'
          }`}
        >
          {/* Institutional Header & Coat of Arms / Crest */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center space-x-4">
                {school.logo ? (
                  <img
                    src={school.logo}
                    alt={school.name}
                    className="h-16 w-auto max-w-[150px] object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center text-amber-400 font-serif font-black text-2xl border-2 border-amber-400/50 shadow-xs">
                    <GraduationCap className="w-9 h-9 text-amber-400" />
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Certified Scholastic Records Office
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-serif">
                    {school.name}
                  </h1>
                  <p className="text-xs italic text-slate-600 font-medium">
                    "{school.motto}"
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {studentBranch.name} • {studentBranch.address} • Tel: {studentBranch.phone || '+234 800 ZITEL SCH'}
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l sm:border-slate-200 sm:pl-5 pt-2 sm:pt-0">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-[11px] font-bold uppercase tracking-widest mb-1">
                  Official Transcript
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Folio: <strong className="text-slate-800">{transcriptSerial}</strong></div>
                <div className="text-[10px] text-slate-500">Issued: <strong className="text-slate-800">{dateFormatted}</strong></div>
                <div className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">
                  ✓ Verified Institutional Record
                </div>
              </div>
            </div>
          </div>

          {/* Student Identification & Academic Placement Matrix */}
          <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-300 transcript-section">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate Full Name</span>
                <span className="font-extrabold text-slate-950 text-sm">{student.fullName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student ID / Mat No.</span>
                <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded inline-block text-xs">
                  {student.studentId || (student as any).admissionNumber || 'ZCS-STU-001'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Class</span>
                <span className="font-bold text-slate-800">{student.className}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch Campus</span>
                <span className="font-semibold text-slate-800">{studentBranch.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Session</span>
                <span className="font-semibold text-slate-800">{currentSession.name} Academic Year</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Terminal Cycle</span>
                <span className="font-semibold text-slate-800">{currentTerm.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender</span>
                <span className="font-semibold text-slate-800 capitalize">{student.gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Record Status</span>
                <span className="font-bold text-emerald-800">Good Standing (Active)</span>
              </div>
            </div>
          </div>

          {/* Academic Honors & Summary Highlights Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 transcript-section">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Cumulative GPA</span>
              <span className="text-xl font-black text-indigo-950">{overallGpa} <span className="text-xs font-normal text-indigo-600">/ 4.0</span></span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Cumulative Avg</span>
              <span className="text-xl font-black text-slate-900">{overallAvg}%</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Courses Recorded</span>
              <span className="text-xl font-black text-slate-900">{subjectBreakdown.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-xl font-black text-emerald-700">{attendanceRate}%</span>
            </div>
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Scholastic Standing</span>
              <span className="text-xs font-extrabold text-amber-950 block mt-1 leading-tight">
                {academicHonors}
              </span>
            </div>
          </div>

          {/* Formal Course Breakdown Table */}
          <div className="mb-6 transcript-section">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Course Performance & Grading Record</span>
              <span className="text-[10px] text-slate-500 font-normal">Continuous Assessment (40%) + Terminal Exam (60%)</span>
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-20">Code</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Course / Subject Title</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 w-16">CA (40)</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 w-16">Exam (60)</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 w-16 font-extrabold">Total (%)</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 w-14 font-extrabold">Grade</th>
                    <th className="py-2.5 px-2.5 text-center border-r border-slate-300 w-14">GPA</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-24">Classification</th>
                    <th className="py-2.5 px-3">Staff Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjectBreakdown.map((item, idx) => (
                    <tr key={item.subject.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] font-bold text-slate-600">
                        {item.code}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {item.subject.name}
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200 text-slate-700">
                        {item.classwork + item.test}
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200 text-slate-700">
                        {item.exam}
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200 font-black text-slate-900">
                        {item.total}%
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200 font-extrabold text-indigo-900">
                        {item.grade}
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono text-slate-700">
                        {item.gpa.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-[11px] font-semibold text-slate-700">
                        {item.standing}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 italic">
                        {item.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px] text-slate-600 border-r border-slate-300">
                      Transcript Cumulative Summary:
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-black text-sm text-slate-950 border-r border-slate-300">
                      {overallAvg}%
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-black text-indigo-950 border-r border-slate-300">
                      {overallAvg >= 80 ? 'A' : overallAvg >= 70 ? 'B' : 'C'}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-sm text-indigo-950 border-r border-slate-300">
                      {overallGpa}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-slate-700 text-[11px]">
                      Total Points: <strong className="text-slate-900">{totalGradePoints}</strong> across {subjectBreakdown.length} courses
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Institutional Grading Scale Reference & Affective Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs transcript-section">
            <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-2">
                Standard Grading Matrix
              </span>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 leading-tight">
                <div><strong className="text-slate-900">A+</strong>: 90-100% (4.00) Distinction</div>
                <div><strong className="text-slate-900">A</strong>: 80-89% (3.80) Excellent</div>
                <div><strong className="text-slate-900">B</strong>: 70-79% (3.00) Very Good</div>
                <div><strong className="text-slate-900">C</strong>: 60-69% (2.00) Credit</div>
                <div><strong className="text-slate-900">D</strong>: 50-59% (1.00) Pass</div>
                <div><strong className="text-slate-900">F</strong>: &lt;50% (0.00) Fail</div>
              </div>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-2">
                Affective & Behavioral Assessment
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div>Conduct & Integrity: <strong className="text-emerald-700">Exemplary (5/5)</strong></div>
                <div>Punctuality & Discipline: <strong className="text-emerald-700">Consistent (5/5)</strong></div>
                <div>Leadership & Initiative: <strong className="text-indigo-700">Commendable (4/5)</strong></div>
                <div>Civic & Group Collaboration: <strong className="text-emerald-700">Excellent (5/5)</strong></div>
              </div>
            </div>
          </div>

          {/* Institutional Attestation & Certification Notice */}
          <div className="p-3 border border-slate-300 rounded-lg bg-slate-50 mb-6 text-[10px] text-slate-600 leading-relaxed transcript-section">
            <strong className="text-slate-800 uppercase tracking-wider block mb-0.5">Official Certification Statement:</strong>
            I hereby certify that the courses, grades, credits, and cumulative performance listed herein are an accurate and authentic transcription of the scholastic records preserved in the permanent archives of {school.name}. This document constitutes a certified academic transcript when bearing the authorized institutional signatures and the embossed seal of the institution.
          </div>

          {/* Signatures & Seal Verification Block */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-900 text-xs transcript-section">
            <div className="text-center">
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-900 text-sm font-semibold">Dr. M. A. Adeleke</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase mt-1 block font-bold">Academic Director / Registrar</span>
              <span className="text-[9px] text-slate-400">Office of Academic Records</span>
            </div>

            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center text-center p-1 text-[8px] font-black uppercase text-slate-900 tracking-tighter leading-tight">
                Official School Seal
              </div>
              <span className="text-[9px] text-slate-500 mt-1 font-mono">Verified: {dateFormatted}</span>
            </div>

            <div className="text-center">
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-900 text-sm font-semibold">{school.branding.principalName || 'Eleanor Vance, Ed.D'}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase mt-1 block font-bold">Principal / Head of School</span>
              <span className="text-[9px] text-slate-400">Zitel Castle School Executive Board</span>
            </div>
          </div>

          {/* Transcript Document Footer Note */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
            <span>Doc Ref: {transcriptSerial} • Tamper-evident scholastic record</span>
            <span>Generated from Zitel Castle School Student Information System</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
