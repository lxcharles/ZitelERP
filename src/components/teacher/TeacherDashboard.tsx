import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  ClipboardList,
  Sparkles,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Printer,
  ChevronRight,
  Eye,
  Bot,
  Brain,
  MessageSquare,
  AlertCircle,
  Download,
  Calendar,
  ShieldCheck,
  FileText,
  TrendingUp
} from 'lucide-react';
import {
  User,
  Student,
  AttendanceStatus,
  Assessment,
  AssessmentScore,
  Assignment,
  LessonPlan,
  Quiz
} from '../../types';
import { db } from '../../services/db';
import { aiService } from '../../services/aiService';
import { ReportCardModal } from '../common/ReportCardModal';
import { AttendanceForecasting } from './AttendanceForecasting';
import { TeacherAIChatWidget } from './TeacherAIChatWidget';
import { ClassroomHub } from './ClassroomHub';
import { LessonNotesManager } from './LessonNotesManager';
import { LessonPlannerManager } from './LessonPlannerManager';
import { BehaviorLogManager } from './BehaviorLogManager';
import { StudentStatusReportManager } from './StudentStatusReportManager';
import { WeeklyTeacherReportManager } from './WeeklyTeacherReportManager';
import { StudentPerformanceAnalytics } from './StudentPerformanceAnalytics';
import { AssessmentWeightingManager } from './AssessmentWeightingManager';
import { CommunicationHubModal } from '../common/CommunicationHubModal';
import { exportAttendanceToCSV, exportGradebookToCSV } from '../../utils/exportCsv';

interface TeacherDashboardProps {
  currentUser: User;
  activeTab: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  activeTab,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeTab || 'overview');

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    currentUser.assignedClasses?.[0] || 'cls_p3a'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    currentUser.assignedSubjects?.[0] || 'sub_math'
  );

  // Selected student for report card modal
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // Parent Communication Modal State
  const [showChatModal, setShowChatModal] = useState(false);

  // Attendance state
  const [attendanceSubView, setAttendanceSubView] = useState<'daily' | 'forecasting'>('daily');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceSavedMessage, setAttendanceSavedMessage] = useState(false);

  // Assessment & Scores State
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('asm_math_quiz1');
  const [scoreInputs, setScoreInputs] = useState<Record<string, number>>({});
  const [scoresSavedMessage, setScoresSavedMessage] = useState(false);

  // Student Onboarding State
  const [showOnboardStudentModal, setShowOnboardStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    dateOfBirth: '2017-04-12',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: 'Mother',
    address: 'Oakridge Community, House 4',
  });

  // AI Suite State
  const [aiToolType, setAiToolType] = useState<'lesson' | 'quiz' | 'comment' | 'insights'>('lesson');
  const [aiTopic, setAiTopic] = useState('Fractions and Equivalent Parts');
  const [aiGrade, setAiGrade] = useState('Primary 3');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Homework creation state
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '2026-03-25',
    maxScore: 20,
  });

  // Collections with Strict Subject-Based Access Control
  const classes = db.getTeacherAssignedClasses(currentUser.id);
  const activeClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const teacherSubjects = db.getTeacherAssignedSubjects(currentUser.id, activeClass?.id || selectedClassId);
  const activeSubject = teacherSubjects.find(s => s.id === selectedSubjectId) || teacherSubjects[0];
  const isFormTeacher = activeClass?.formTeacherId === currentUser.id;

  const students = db.getStudents().filter(s => s.classId === (activeClass?.id || selectedClassId));
  const assessments = db.getAuthorizedAssessments(currentUser.id, activeClass?.id || selectedClassId, activeSubject?.id);
  const allScores = db.getAuthorizedAssessmentScores(currentUser.id, activeClass?.id || selectedClassId, activeSubject?.id);
  const assignments = db.getAuthorizedAssignments(currentUser.id, activeClass?.id || selectedClassId, activeSubject?.id);
  const submissions = db.getSubmissions();
  const lessonPlans = db.getAuthorizedLessonPlans(currentUser.id, activeClass?.id || selectedClassId, activeSubject?.id);
  const attendanceRecords = db.getAttendance().filter(a => a.classId === (activeClass?.id || selectedClassId));

  // Initialize attendance for class
  const handleMarkAllAttendance = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(st => {
      updated[st.id] = status;
    });
    setAttendanceStatuses(updated);
  };

  const handleSaveAttendance = () => {
    const records = students.map(st => ({
      studentId: st.id,
      studentName: st.fullName,
      classId: selectedClassId,
      className: activeClass?.name || 'Class',
      date: attendanceDate,
      status: attendanceStatuses[st.id] || 'PRESENT',
      markedByTeacherId: currentUser.id,
      markedByName: currentUser.name,
      markedBy: currentUser.name,
    }));

    db.recordAttendanceBatch(records, currentUser);
    setAttendanceSavedMessage(true);
    setTimeout(() => setAttendanceSavedMessage(false), 3000);
  };

  // Save assessment scores
  const handleSaveScores = () => {
    const targetAssessment = assessments.find(a => a.id === selectedAssessmentId);
    if (!targetAssessment) return;

    const scoresToSave = students.map(st => {
      const val = scoreInputs[st.id] !== undefined ? scoreInputs[st.id] : 18;
      return {
        assessmentId: targetAssessment.id,
        assessmentTitle: targetAssessment.title,
        studentId: st.id,
        studentName: st.fullName,
        classId: targetAssessment.classId,
        subjectId: targetAssessment.subjectId,
        score: val,
        maxScore: targetAssessment.maxScore,
        gradedBy: currentUser.name,
        recordedByTeacherId: currentUser.id,
      };
    });

    db.saveAssessmentScoresBatch(scoresToSave, currentUser);
    setScoresSavedMessage(true);
    setTimeout(() => setScoresSavedMessage(false), 3000);
  };

  // Student Onboarding Submit
  const handleOnboardStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName || !studentForm.parentName || !studentForm.parentEmail) {
      alert('Please enter required details.');
      return;
    }

    // 1. Create or retrieve parent
    const existingParents = db.getParents();
    let parent = existingParents.find(p => p.email.toLowerCase() === studentForm.parentEmail.toLowerCase());
    if (!parent) {
      parent = db.createParent(
        {
          userId: `user_par_${Date.now()}`,
          fullName: studentForm.parentName,
          email: studentForm.parentEmail,
          phone: studentForm.parentPhone || '+1 (555) 345-6789',
          relationship: studentForm.relationship,
          address: studentForm.address,
          linkedStudentIds: [],
        },
        currentUser
      );
    }

    // 2. Create student
    const activeBranch = activeClass?.branchId || currentUser.branchId || db.getActiveBranchId();
    const branchId = activeBranch !== 'all' ? activeBranch : 'branch_bungalow';
    const branchName = activeClass?.branchName || currentUser.branchName || (branchId === 'branch_ijegun' ? 'Zitel Castle School Ijegun' : 'Zitel Castle School Bungalow');

    const newStudent = db.createStudent(
      {
        fullName: studentForm.fullName,
        dateOfBirth: studentForm.dateOfBirth,
        dob: studentForm.dateOfBirth,
        gender: studentForm.gender,
        classId: selectedClassId,
        className: activeClass?.name || 'Basic 3A',
        branchId,
        branchName,
        parentIds: [parent.id],
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120',
        allergies: [],
        emergencyContact: {
          name: studentForm.parentName,
          relationship: studentForm.relationship,
          phone: studentForm.parentPhone || '+234 803 123 4567'
        },
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'Enrolled',
        house: 'Gold House',
      },
      currentUser
    );

    // 3. Link parent to student
    db.linkParentToStudent(parent.id, newStudent.id, currentUser);

    setShowOnboardStudentModal(false);
    setStudentForm({
      fullName: '',
      dateOfBirth: '2017-04-12',
      gender: 'Male',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      relationship: 'Mother',
      address: 'Oakridge Community, House 4',
    });
  };

  // AI Generation Invoker
  const handleInvokeAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      if (aiToolType === 'lesson') {
        const result = await aiService.generateLessonPlan(
          {
            subject: activeSubject?.name || 'Mathematics',
            grade: aiGrade,
            topic: aiTopic,
          },
          currentUser
        );
        setAiResult(result);
      } else if (aiToolType === 'quiz') {
        const result = await aiService.generateQuiz(
          {
            subject: activeSubject?.name || 'Mathematics',
            grade: aiGrade,
            topic: aiTopic,
            questionCount: 4,
            difficulty: 'Standard Primary',
            questionType: 'multiple_choice',
          },
          currentUser
        );
        setAiResult(result);
      } else if (aiToolType === 'comment') {
        const result = await aiService.generateReportComment(
          {
            studentName: students[0]?.fullName || 'Leo Rodriguez',
            term: 'Term 2',
            subjectScores: { [activeSubject?.name || 'Mathematics']: 92 },
            attendanceRate: '98%',
            behaviorNotes: 'Curious, cooperative, very helpful during class discussions',
          },
          currentUser
        );
        setAiResult(result);
      } else if (aiToolType === 'insights') {
        const result = await aiService.generateStudentInsights(
          {
            studentName: students[0]?.fullName || 'Leo Rodriguez',
            performanceData: { [activeSubject?.name || 'Mathematics']: 92 },
            classAverage: { [activeSubject?.name || 'Mathematics']: 82 },
          },
          currentUser
        );
        setAiResult(result);
      }
    } catch (err: any) {
      setAiError(err.message || 'AI request could not be completed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiLessonPlan = () => {
    if (!aiResult) return;
    db.saveLessonPlan(
      {
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        classId: selectedClassId,
        className: activeClass?.name || 'Class',
        subjectId: activeSubject?.id || selectedSubjectId,
        subjectName: activeSubject?.name || 'Mathematics',
        topic: aiResult.topic || aiTopic,
        weekNumber: 7,
        objectives: aiResult.learningObjectives || [],
        materials: aiResult.materialsNeeded || [],
        activities: aiResult.classroomActivities || [],
        status: 'COMPLETED',
        aiGenerated: true,
      },
      currentUser
    );
    alert('Lesson plan saved to your curriculum repository!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Class & Subject Selector */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
              Classroom Dashboard
            </span>
            <span className="text-xs text-slate-400 font-mono">• {currentUser.staffId}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isFormTeacher ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'}`}>
              {isFormTeacher ? 'Form Teacher (Class Head)' : 'Subject Teacher'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 font-display">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-300">
            {isFormTeacher ? (
              <>
                Form Teacher for <span className="font-bold text-emerald-300">{activeClass?.name}</span> ({students.length} Students)
              </>
            ) : (
              <>
                Subject Teacher for <span className="font-bold text-emerald-300">{activeSubject?.name || 'Assigned Subject'}</span> in <span className="font-bold text-indigo-300">{activeClass?.name}</span>
              </>
            )}
          </p>
        </div>

        {/* Dynamic Class & Subject Filter Bar & Chat Action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Parent Chat Hub</span>
          </button>

          <div className="flex items-center space-x-3 bg-white/10 p-2 rounded-xl backdrop-blur-xs border border-white/10">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-300">Class Cohort</label>
              <select
                value={selectedClassId}
                onChange={e => {
                  const newClassId = e.target.value;
                  setSelectedClassId(newClassId);
                  const newSubjects = db.getTeacherAssignedSubjects(currentUser.id, newClassId);
                  if (newSubjects.length > 0) {
                    setSelectedSubjectId(newSubjects[0].id);
                  }
                }}
                className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-300">Assigned Subject</label>
              <select
                value={activeSubject?.id || selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {teacherSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Subject-Based Access Control Advisory */}
      {!isFormTeacher && activeSubject && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-medium">
              <strong className="font-bold">Strict Subject Access Active:</strong> You are authorized as the dedicated Subject Teacher for <span className="font-bold underline">{activeSubject.name}</span> in {activeClass?.name}. Assessment entries, gradebooks, and homework submissions are scoped exclusively to your subject.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded">
            Subject-Enforced
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Classroom', icon: Users },
          { id: 'behavior_log', label: 'Behavioral Log & Timeline', icon: ShieldCheck },
          { id: 'status_reports', label: 'Pupil & Class Status Reports', icon: FileText },
          { id: 'weekly_reports', label: 'Weekly Teacher Report', icon: Calendar },
          { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'gradebook', label: 'Assessments & Scores', icon: Award },
          { id: 'weighting', label: 'Grading & CA Breakdown', icon: Award },
          { id: 'lesson_notes', label: 'Lesson Notes', icon: BookOpen },
          { id: 'lesson_plans', label: 'Lesson Planner', icon: Calendar },
          { id: 'assignments', label: 'Homework & Assignments', icon: ClipboardList },
          { id: 'attendance_forecasting', label: 'Attendance Risk Alert', icon: AlertCircle },
          { id: 'ai_tools', label: 'Pedagogical Assistant', icon: Sparkles },
        ].map(t => {
          const Icon = t.icon;
          const isCurrent = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCurrentTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
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

      {/* Tab 1: Classroom Overview */}
      {currentTab === 'overview' && activeClass && (
        <ClassroomHub
          currentUser={currentUser}
          activeClass={activeClass}
          assignedClasses={classes}
          selectedClassId={selectedClassId}
          onSelectClass={(id) => setSelectedClassId(id)}
          activeSubject={activeSubject}
          teacherSubjects={teacherSubjects}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={(id) => setSelectedSubjectId(id)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          onOpenReportCard={(st) => setSelectedStudentForReport(st)}
        />
      )}

      {/* Tab 2: Attendance */}
      {currentTab === 'attendance' && (
        <div className="space-y-6">
          {/* Subview Selector */}
          <div className="flex items-center space-x-3 bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setAttendanceSubView('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                attendanceSubView === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Roster Marking
            </button>
            <button
              type="button"
              onClick={() => setAttendanceSubView('forecasting')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                attendanceSubView === 'forecasting'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Attendance Risk & Pattern Analysis</span>
            </button>
          </div>

          {attendanceSubView === 'daily' ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Rapid Daily Attendance: {activeClass?.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mark student presence with 1-click bulk actions and per-student status toggles.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                  <button
                    onClick={() => exportAttendanceToCSV(attendanceRecords, students, activeClass?.name || 'Class')}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-2xs flex items-center space-x-1.5"
                    title="Export Attendance Records as CSV"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Attendance</span>
                  </button>
                </div>
              </div>

              {attendanceSavedMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Attendance successfully recorded into school ledger and audit logs!</span>
                </div>
              )}

              {/* Quick Bulk Action Bar */}
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 text-xs">Bulk Mark:</span>
                <button
                  onClick={() => handleMarkAllAttendance('PRESENT')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                >
                  All Present
                </button>
                <button
                  onClick={() => handleMarkAllAttendance('ABSENT')}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold hover:bg-rose-200"
                >
                  All Absent
                </button>
                <button
                  onClick={() => handleMarkAllAttendance('LATE')}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold hover:bg-amber-200"
                >
                  All Late
                </button>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Quick Toggles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map(st => {
                      const currentStatus = attendanceStatuses[st.id] || 'PRESENT';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 flex items-center space-x-3">
                            <img
                              src={st.avatar}
                              alt={st.fullName}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="font-bold text-slate-900">{st.fullName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-600">{st.studentId}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : currentStatus === 'LATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : currentStatus === 'EXCUSED'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {currentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 space-x-1">
                              {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatus[]).map(stt => (
                                <button
                                  key={stt}
                                  onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [st.id]: stt })}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                    currentStatus === stt
                                      ? 'bg-indigo-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:bg-white'
                                  }`}
                                >
                                  {stt[0]}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <AttendanceForecasting
              currentTeacher={currentUser}
              classId={selectedClassId}
              className={activeClass?.name || 'Primary 3A'}
              students={students}
              attendanceRecords={attendanceRecords}
              onLogIntervention={(studentId, note) => {
                db.addAuditLog(
                  currentUser.id,
                  currentUser.name,
                  currentUser.role,
                  'INTERVENTION_LOGGED',
                  'Student',
                  studentId,
                  note
                );
              }}
            />
          )}
        </div>
      )}

      {/* Tab: Attendance Forecasting Dedicated View */}
      {currentTab === 'attendance_forecasting' && (
        <AttendanceForecasting
          currentTeacher={currentUser}
          classId={selectedClassId}
          className={activeClass?.name || 'Primary 3A'}
          students={students}
          attendanceRecords={attendanceRecords}
          onLogIntervention={(studentId, note) => {
            db.addAuditLog(
              currentUser.id,
              currentUser.name,
              currentUser.role,
              'INTERVENTION_LOGGED',
              'Student',
              studentId,
              note
            );
          }}
        />
      )}

      {/* Tab 3: Continuous Assessment & Gradebook */}
      {currentTab === 'gradebook' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Continuous Assessment Gradebook: {activeClass?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Enter continuous assessment marks with automatic grade computation and transcript updating.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedAssessmentId}
                onChange={e => setSelectedAssessmentId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              >
                {assessments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.category || 'Assessment'} - Max {a.maxScore})
                  </option>
                ))}
              </select>
              <button
                onClick={() => exportGradebookToCSV(assessments, allScores, students, teacherSubjects, activeClass?.name || 'Class')}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-2xs flex items-center space-x-1.5"
                title="Export Continuous Assessment and Gradebook as CSV"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleSaveScores}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Save All Scores</span>
              </button>
            </div>
          </div>

          {scoresSavedMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Assessment marks recorded and committed to institutional transcript system!</span>
            </div>
          )}

          {/* Scores Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4 text-center">Score Input (Max: 20)</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(st => {
                  const val = scoreInputs[st.id] !== undefined ? scoreInputs[st.id] : 18;
                  const pct = Math.round((val / 20) * 100);
                  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : 'C';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                        <img src={st.avatar} alt={st.fullName} className="w-7 h-7 rounded-full object-cover" />
                        <span>{st.fullName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{st.studentId}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={val}
                          onChange={e =>
                            setScoreInputs({ ...scoreInputs, [st.id]: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">{pct}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Pedagogical Assistant */}
      {currentTab === 'ai_tools' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Curriculum & Pedagogical Assistant</span>
            </h2>
            <p className="text-xs text-slate-500">
              Assists faculty with curriculum lesson planning, structured quizzes with answer keys, report comments, and student insights.
            </p>
          </div>

          {/* Tool selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'lesson', title: 'Lesson Plan Generator', desc: 'Curriculum outlines & tasks' },
              { id: 'quiz', title: 'Quiz & Test Builder', desc: 'Questions with answer keys' },
              { id: 'comment', title: 'Report Comment Writer', desc: 'Positive, constructive notes' },
              { id: 'insights', title: 'Student Learning Insights', desc: 'Growth recommendations' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setAiToolType(t.id as any);
                  setAiResult(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  aiToolType === t.id
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <p className="font-bold text-xs text-slate-900">{t.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Generator Inputs */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  {teacherSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grade Level</label>
                <select
                  value={aiGrade}
                  onChange={e => setAiGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="Primary 6">Primary 6</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Curriculum Topic / Unit</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. Fractions, Plant Life, Solar System"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleInvokeAI}
              disabled={aiLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>{aiLoading ? 'Drafting Material...' : 'Generate Curriculum Content'}</span>
            </button>
          </div>

          {/* AI Result Container */}
          {aiError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {aiError}
            </div>
          )}

          {aiResult && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {aiResult.title || 'Generated Curriculum Material'}
                  </h3>
                </div>
                {aiToolType === 'lesson' && (
                  <button
                    onClick={handleSaveAiLessonPlan}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-2xs"
                  >
                    Save to My Lesson Plans
                  </button>
                )}
              </div>

              {/* Lesson Plan View */}
              {aiToolType === 'lesson' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-indigo-950 uppercase text-[10px]">Learning Objectives</h4>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-700">
                      {aiResult.learningObjectives?.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-indigo-950 uppercase text-[10px]">Classroom Activity</h4>
                    <p className="mt-1 text-slate-700">{aiResult.classroomActivities?.[0]?.instructions || aiResult.explanation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="font-bold text-[10px] text-indigo-900 block">Differentiation (Support)</span>
                      <span className="text-slate-600">{aiResult.differentiation?.support}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="font-bold text-[10px] text-indigo-900 block">Differentiation (Extension)</span>
                      <span className="text-slate-600">{aiResult.differentiation?.extension}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz View */}
              {aiToolType === 'quiz' && (
                <div className="space-y-3 text-xs">
                  <div className="space-y-2">
                    {aiResult.questions?.map((q: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white border border-indigo-100 space-y-1.5">
                        <p className="font-bold text-slate-900">{q.question}</p>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                          {q.options?.map((opt: string, idx: number) => (
                            <span key={idx} className="p-1 rounded bg-slate-50 border border-slate-100">
                              {opt}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold pt-1">
                          Correct Answer: {q.correctAnswer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment View */}
              {aiToolType === 'comment' && (
                <div className="p-4 rounded-xl bg-white border border-indigo-100 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900">Recommended Report Comment:</h4>
                  <p className="italic text-slate-700 leading-relaxed">"{aiResult.fullComment}"</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => alert('Comment copied to clipboard!')}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[11px]"
                    >
                      Copy Comment
                    </button>
                  </div>
                </div>
              )}

              {/* Insights View */}
              {aiToolType === 'insights' && (
                <div className="space-y-3 text-xs">
                  <p className="font-semibold text-slate-800">{aiResult.summaryNarrative}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="font-bold text-emerald-800 text-[10px] block">Key Strengths</span>
                      <ul className="list-disc list-inside mt-1 text-slate-600">
                        {aiResult.strengths?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="font-bold text-amber-800 text-[10px] block">Pedagogical Recommendations</span>
                      <ul className="list-disc list-inside mt-1 text-slate-600">
                        {aiResult.learningStyleRecommendations?.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Lesson Notes */}
      {currentTab === 'lesson_notes' && (
        <LessonNotesManager
          currentUser={currentUser}
          assignedClasses={classes}
          teacherSubjects={teacherSubjects}
          initialClassId={selectedClassId}
          initialSubjectId={selectedSubjectId}
        />
      )}

      {/* Tab: Lesson Planner */}
      {(currentTab === 'lesson_plans' || currentTab === 'lesson_planner') && (
        <LessonPlannerManager
          currentUser={currentUser}
          assignedClasses={classes}
          teacherSubjects={teacherSubjects}
          initialClassId={selectedClassId}
          initialSubjectId={selectedSubjectId}
        />
      )}

      {/* Tab: Behavioral Log & Timeline */}
      {currentTab === 'behavior_log' && activeClass && (
        <BehaviorLogManager
          currentUser={currentUser}
          activeClass={activeClass}
          students={students}
        />
      )}

      {/* Tab: Pupil & Class Status Reports */}
      {currentTab === 'status_reports' && activeClass && (
        <StudentStatusReportManager
          currentUser={currentUser}
          activeClass={activeClass}
          students={students}
        />
      )}

      {/* Tab: Weekly Teacher Report */}
      {currentTab === 'weekly_reports' && activeClass && (
        <WeeklyTeacherReportManager
          currentUser={currentUser}
          activeClass={activeClass}
        />
      )}

      {/* Tab: Performance Analytics */}
      {currentTab === 'analytics' && activeClass && (
        <StudentPerformanceAnalytics
          currentUser={currentUser}
          activeClass={activeClass}
          students={students}
        />
      )}

      {/* Tab: Grading & CA Breakdown Config */}
      {currentTab === 'weighting' && activeClass && (
        <AssessmentWeightingManager
          currentUser={currentUser}
          activeClass={activeClass}
          activeSubject={activeSubject}
        />
      )}

      {/* Modal: Student Onboarding */}
      {showOnboardStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Onboard Student into {activeClass?.name}</h3>
              </div>
              <button
                onClick={() => setShowOnboardStudentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardStudentSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Rodriguez"
                    value={studentForm.fullName}
                    onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={studentForm.dateOfBirth}
                    onChange={e => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={studentForm.gender}
                    onChange={e => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Linked Parent Information */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Primary Guardian / Parent Linking
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Elena Rodriguez"
                      value={studentForm.parentName}
                      onChange={e => setStudentForm({ ...studentForm, parentName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="parent.email@example.com"
                      value={studentForm.parentEmail}
                      onChange={e => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 345-6789"
                      value={studentForm.parentPhone}
                      onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      placeholder="Mother / Father / Guardian"
                      value={studentForm.relationship}
                      onChange={e => setStudentForm({ ...studentForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOnboardStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {selectedStudentForReport && (
        <ReportCardModal
          student={selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Parent Communication Hub Modal */}
      {showChatModal && (
        <CommunicationHubModal
          currentUser={currentUser}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {/* Floating SchoolOS AI Assistant Widget */}
      <TeacherAIChatWidget currentUser={currentUser} activeClass={activeClass} />
    </div>
  );
};
