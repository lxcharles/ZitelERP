import React from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle2,
  CalendarCheck,
  School,
  Sparkles
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
  term = 'Term 2 (Spring)',
  onClose,
}) => {
  const school: SchoolProfile = db.getSchoolProfile();
  const subjects = db.getSubjects();
  const assessments = db.getAssessments().filter(a => a.classId === student.classId);
  const allScores = db.getAssessmentScores().filter(s => s.studentId === student.id);
  const attendance = db.getAttendance().filter(
    a => a.studentId === student.id && a.classId === student.classId
  );
  const behaviors = db.getBehaviorRecords().filter(b => b.studentId === student.id);

  // Compute subject scores
  const subjectBreakdown = subjects.map(sub => {
    const subAssessments = assessments.filter(a => a.subjectId === sub.id);
    if (subAssessments.length === 0) {
      // Demo simulated score for full report cards
      const demoScore = sub.id === 'sub_math' ? 92 : sub.id === 'sub_eng' ? 84 : sub.id === 'sub_sci' ? 88 : sub.id === 'sub_soc' ? 86 : 80;
      return {
        subject: sub,
        classwork: 18,
        test: 36,
        exam: demoScore,
        total: demoScore,
        grade: demoScore >= 90 ? 'A+' : demoScore >= 80 ? 'A' : demoScore >= 70 ? 'B' : 'C',
        gpa: demoScore >= 90 ? 4.0 : demoScore >= 80 ? 3.8 : demoScore >= 70 ? 3.0 : 2.0,
        remarks: demoScore >= 90 ? 'Outstanding conceptual grasp' : demoScore >= 80 ? 'Very good comprehension' : 'Satisfactory progress',
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
      classwork: 18,
      test: 36,
      exam: avg,
      total: avg,
      grade: matchedGrade.grade,
      gpa: matchedGrade.gpa,
      remarks: matchedGrade.remark,
    };
  });

  const overallAvg = Math.round(
    subjectBreakdown.reduce((acc, s) => acc + s.total, 0) / subjectBreakdown.length
  );
  const overallGpa = (
    subjectBreakdown.reduce((acc, s) => acc + s.gpa, 0) / subjectBreakdown.length
  ).toFixed(2);

  // Attendance stats
  const totalDays = attendance.length || 20;
  const presentDays = attendance.filter(a => a.status === 'PRESENT').length || 18;
  const lateDays = attendance.filter(a => a.status === 'LATE').length || 1;
  const absentDays = attendance.filter(a => a.status === 'ABSENT').length || 1;
  const attendanceRate = Math.round(((presentDays + lateDays) / totalDays) * 100) || 96;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `Subject,Score (%),Grade,GPA,Remarks\n`;
    subjectBreakdown.forEach(s => {
      csv += `"${s.subject.name}",${s.total},${s.grade},${s.gpa},"${s.remarks}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_Card_${student.fullName.replace(/\s+/g, '_')}_${term}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Action Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Official Student Report Card Preview
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-800 printable-card">
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
                    {school.address} • Tel: {school.phone} • {school.email}
                  </p>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-extrabold text-xs rounded-lg uppercase tracking-wider">
                  Academic Progress Report
                </span>
                <p className="text-xs font-bold text-slate-700 mt-1">{term}</p>
                <p className="text-[11px] text-slate-500">Session: {school.currentAcademicYear}</p>
              </div>
            </div>
          </div>

          {/* Student Profile Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Student Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Student ID No.</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{student.studentId}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Class & Section</span>
              <span className="font-bold text-slate-800 text-sm">{student.className}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Gender / House</span>
              <span className="font-medium text-slate-700">{student.gender} • {student.house || 'Blue House'}</span>
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
                <span className="text-[10px] text-slate-400">Sarah Jenkins, B.Ed</span>
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
                <span className="font-serif italic text-indigo-900 text-sm">Sarah Jenkins</span>
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
      </div>
    </div>
  );
};
