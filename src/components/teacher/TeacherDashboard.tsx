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
  TrendingUp,
  Mail,
  Check,
  CheckCheck,
  AlertTriangle,
  GraduationCap,
  Layers,
  FileCheck,
  Archive,
  BookMarked
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
import { ClassroomHub } from './ClassroomHub';
import { DailyDiaryManager } from './DailyDiaryManager';
import { LessonNotesManager } from './LessonNotesManager';
import { LessonPlannerManager } from './LessonPlannerManager';
import { TopicCompletionManager } from './TopicCompletionManager';
import { BehaviorLogManager } from './BehaviorLogManager';
import { StudentStatusReportManager } from './StudentStatusReportManager';
import { WeeklyTeacherReportManager } from './WeeklyTeacherReportManager';
import { StudentPerformanceAnalytics } from './StudentPerformanceAnalytics';
import { AssessmentWeightingManager } from './AssessmentWeightingManager';
import { SchoolCalendarManager } from '../calendar/SchoolCalendarManager';
import { CommunicationHubModal } from '../common/CommunicationHubModal';
import { StudentPromotionManager } from '../promotion/StudentPromotionManager';
import { AcademicArchiveViewer } from '../archive/AcademicArchiveViewer';
import { exportAttendanceToCSV, exportGradebookToCSV } from '../../utils/exportCsv';
import { StaffAttendanceCheckInWidget } from '../common/StaffAttendanceCheckInWidget';
import { Timetable } from '../common/Timetable';

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
    currentUser.assignedClasses?.[0] || 'cls_basic3a_bgl'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    currentUser.assignedSubjects?.[0] || 'sub_math'
  );

  // Selected student for report card modal
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // Parent Communication Modal State
  const [showChatModal, setShowChatModal] = useState(false);

  // Secondary Form Teacher: Submissions Tracker Sub-view
  const [formTeacherGradebookView, setFormTeacherGradebookView] = useState<'submissions' | 'my_subject'>('submissions');

  // Score Reminder Modal State
  const [reminderModal, setReminderModal] = useState<{
    open: boolean;
    teacherId: string;
    teacherName: string;
    subjectId: string;
    subjectName: string;
    customMessage: string;
  } | null>(null);
  const [reminderSuccessToast, setReminderSuccessToast] = useState<string | null>(null);

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
  const teacherRoleInfo = db.getTeacherRoleInfo(currentUser.id, selectedClassId);
  const classes = db.getTeacherAssignedClasses(currentUser.id);
  const activeClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const teacherSubjects = db.getTeacherAssignedSubjects(currentUser.id, activeClass?.id || selectedClassId);
  const activeSubject = teacherSubjects.find(s => s.id === selectedSubjectId) || teacherSubjects[0];
  const isFormTeacher = activeClass?.formTeacherId === currentUser.id;

  const viewableSubjects = db.getTeacherViewableSubjects(currentUser.id, activeClass?.id || selectedClassId);
  const specialistCheck = db.isSubjectManagedBySpecialist(activeClass?.id || selectedClassId, activeSubject?.id, currentUser.id);
  const submissionsSummary = db.getClassSubjectSubmissionsSummary(activeClass?.id || selectedClassId);

  const students = db.getAuthorizedStudentsForTeacher(currentUser.id, activeClass?.id || selectedClassId);
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

  // Open Score Reminder Modal for a Subject
  const handleOpenReminderModal = (subItem: any) => {
    const defaultMsg = `Dear ${subItem.teacherName}, this is a reminder from ${currentUser.name} (Form Teacher, ${activeClass?.name}) regarding outstanding continuous assessment / exam scores for ${subItem.subjectName}. Please complete and submit your score records so class report sheets can be compiled. Thank you!`;
    setReminderModal({
      open: true,
      teacherId: subItem.teacherId,
      teacherName: subItem.teacherName,
      subjectId: subItem.subjectId,
      subjectName: subItem.subjectName,
      customMessage: defaultMsg,
    });
  };

  const handleSendReminderConfirm = () => {
    if (!reminderModal) return;
    try {
      db.sendSubjectScoreReminder(
        currentUser,
        reminderModal.teacherId,
        selectedClassId,
        reminderModal.subjectId,
        reminderModal.customMessage
      );

      setReminderSuccessToast(`Reminder successfully dispatched to ${reminderModal.teacherName} for ${reminderModal.subjectName}!`);
      setReminderModal(null);
      setTimeout(() => setReminderSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Could not send reminder');
    }
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
        className: activeClass?.name || 'Basic 3',
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
      {/* Top Banner with Role-Specific Class & Subject Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
              {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER'
                ? 'Primary / Basic School Hub'
                : teacherRoleInfo.archetype === 'PRIMARY_SPECIALIST_TEACHER'
                ? 'Primary Specialist Hub'
                : teacherRoleInfo.archetype === 'SECONDARY_FORM_TEACHER' || teacherRoleInfo.archetype === 'SECONDARY_FORM_AND_SUBJECT'
                ? 'Secondary Form Master Hub'
                : 'Secondary Subject Specialist Hub'}
            </span>
            <span className="text-xs text-slate-400 font-mono">• {currentUser.staffId}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER'
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                : teacherRoleInfo.archetype === 'PRIMARY_SPECIALIST_TEACHER'
                ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
                : teacherRoleInfo.archetype === 'SECONDARY_FORM_TEACHER' || teacherRoleInfo.archetype === 'SECONDARY_FORM_AND_SUBJECT'
                ? 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                : 'bg-blue-500/30 text-blue-200 border-blue-400/40'
            }`}>
              {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER'
                ? 'Basic Class Teacher (Full Class Leadership)'
                : teacherRoleInfo.archetype === 'PRIMARY_SPECIALIST_TEACHER'
                ? 'Specialist Teacher'
                : teacherRoleInfo.archetype === 'SECONDARY_FORM_TEACHER'
                ? 'Form Master (Administration & Report Compilation)'
                : teacherRoleInfo.archetype === 'SECONDARY_FORM_AND_SUBJECT'
                ? 'Form Master & Subject Instructor'
                : 'Subject Specialist'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black mt-1 font-display">
            Welcome, {currentUser.name}
          </h1>

          <p className="text-xs text-slate-300 mt-0.5">
            {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER' ? (
              <>
                Form Teacher for <span className="font-bold text-emerald-300">{activeClass?.name}</span> ({students.length} Pupils) • Complete Classroom Management (Attendance, Core Subjects, Behavior & Records)
              </>
            ) : teacherRoleInfo.archetype === 'SECONDARY_FORM_TEACHER' ? (
              <>
                Form Teacher for <span className="font-bold text-amber-300">{activeClass?.name}</span> ({students.length} Students) • Class Administration & Departmental Subject Submissions
              </>
            ) : teacherRoleInfo.archetype === 'SECONDARY_FORM_AND_SUBJECT' ? (
              <>
                Form Teacher for <span className="font-bold text-amber-300">{activeClass?.name}</span> & Subject Instructor for <span className="font-bold text-indigo-300">{activeSubject?.name}</span>
              </>
            ) : teacherRoleInfo.archetype === 'PRIMARY_SPECIALIST_TEACHER' ? (
              <>
                Specialist Subject Teacher for <span className="font-bold text-purple-300">{activeSubject?.name || 'Assigned Subject'}</span> across Primary Classes
              </>
            ) : (
              <>
                Subject Teacher for <span className="font-bold text-blue-300">{activeSubject?.name || 'Assigned Subject'}</span> in <span className="font-bold text-indigo-300">{activeClass?.name}</span>
              </>
            )}
          </p>
        </div>

        {/* Dynamic Class & Subject Filter Bar & Chat Action */}
        <div className="flex flex-wrap items-center gap-2.5 max-w-full">
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
            title="Open ZITEL CHAT ROOM"
          >
            <MessageSquare className="w-4 h-4" />
            <span>ZITEL CHAT ROOM</span>
          </button>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white/10 p-1.5 sm:p-2 rounded-xl backdrop-blur-xs border border-white/10 max-w-full">
            {/* Class Selector (or single class badge if only 1 assigned) */}
            {classes.length > 1 ? (
              <div className="min-w-[120px] max-w-full flex-1 sm:flex-initial">
                <label className="block text-[10px] uppercase font-bold text-slate-300 mb-0.5">Class</label>
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
                  className="w-full sm:w-auto min-w-[120px] max-w-[180px] truncate bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.formTeacherId === currentUser.id ? '★ (Form)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-bold text-white flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Class: {activeClass?.name}</span>
              </div>
            )}

            {/* Subject Selector: Rendered ONLY for Subject Specialists, Primary Specialists, or Secondary Form Teachers teaching a subject */}
            {teacherRoleInfo.archetype !== 'PRIMARY_BASIC_TEACHER' && teacherRoleInfo.archetype !== 'SECONDARY_FORM_TEACHER' && teacherSubjects.length > 0 && (
              <div className="min-w-[140px] max-w-full flex-1 sm:flex-initial">
                <label className="block text-[10px] uppercase font-bold text-slate-300 mb-0.5">
                  {teacherRoleInfo.archetype === 'PRIMARY_SPECIALIST_TEACHER' ? 'Specialist Subject' : 'Teaching Subject'}
                </label>
                <select
                  value={activeSubject?.id || selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full sm:w-auto min-w-[140px] max-w-[200px] truncate bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {teacherSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Digital Staff Attendance Clock-In Widget */}
      <StaffAttendanceCheckInWidget currentUser={currentUser} />

      {/* Reminder Success Notification Toast */}
      {reminderSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center space-x-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-bold">{reminderSuccessToast}</div>
        </div>
      )}

      {/* Teacher Account Status Restricted Alert Banner */}
      {currentUser.status && currentUser.status !== 'active' && (
        <div className={`p-4 rounded-2xl border flex items-start space-x-3 shadow-xs animate-in fade-in ${
          currentUser.status === 'suspended'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : currentUser.status === 'archived'
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
            currentUser.status === 'suspended' ? 'text-amber-600' : currentUser.status === 'archived' ? 'text-slate-600' : 'text-rose-600'
          }`} />
          <div className="text-xs">
            <h4 className="font-bold text-sm uppercase tracking-wide">
              Teacher Account Status: {currentUser.status.toUpperCase()} (Read-Only Mode)
            </h4>
            <p className="mt-1 leading-relaxed">
              Your teaching staff account is currently in <strong>{currentUser.status}</strong> status. In accordance with institutional policy, all your previous academic assessments, gradebooks, attendance logs, lesson notes, and reports are fully preserved. New score entries, attendance submissions, and note creations are restricted.
            </p>
            {currentUser.statusReason && (
              <p className="mt-1.5 font-medium opacity-90">
                <span className="font-bold">Administrative Note:</span> {currentUser.statusReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Primary Basic Class Teacher Info Banner */}
      {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <span className="font-medium">
              <strong className="font-bold">Primary Classroom Head Active:</strong> You manage <strong>{activeClass?.name}</strong> holistically. You have full oversight over all core subjects, attendance, lesson notes, and behavioral records without being forced to filter by subject first.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded shrink-0">
            Classroom-First
          </span>
        </div>
      )}

      {/* Secondary Subject-Based Access Control Advisory */}
      {teacherRoleInfo.archetype === 'SECONDARY_SUBJECT_TEACHER' && activeSubject && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-medium">
              <strong className="font-bold">Secondary Subject Specialist Active:</strong> You are authorized as the dedicated Subject Teacher for <span className="font-bold underline">{activeSubject.name}</span> in {activeClass?.name}. Assessment entries, gradebooks, and homework assignments are scoped strictly to your subject.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded shrink-0">
            Subject-Enforced
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Classroom', icon: Users },
          { id: 'timetable', label: 'Timetable & Schedule', icon: Clock },
          { id: 'daily_diary', label: 'Daily Diary', icon: BookMarked },
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
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'promotion', label: 'Student Promotion', icon: GraduationCap },
          { id: 'archives', label: 'Academic Archives', icon: Archive },
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

      {/* Tab: School Calendar */}
      {currentTab === 'calendar' && (
        <SchoolCalendarManager currentUser={currentUser} />
      )}

      {/* Tab: Timetable & Schedule */}
      {currentTab === 'timetable' && (
        <Timetable
          currentUser={currentUser}
          classId={selectedClassId}
          className={activeClass?.name}
          viewMode="teacher"
          onNavigateToTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Tab: Daily Diary */}
      {currentTab === 'daily_diary' && (
        <DailyDiaryManager
          currentUser={currentUser}
          assignedClasses={classes}
          selectedClassId={selectedClassId}
          onSelectClass={(id) => setSelectedClassId(id)}
          students={students}
          onNavigateToTab={(tab) => setCurrentTab(tab as any)}
        />
      )}

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
              className={activeClass?.name || 'Basic 3'}
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
          className={activeClass?.name || 'Basic 3'}
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
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* SECONDARY FORM TEACHER: DUAL WORKFLOW PANEL (SUBMISSION TRACKER + COMPILATION) */}
          {/* ========================================================================= */}
          {(teacherRoleInfo.archetype === 'SECONDARY_FORM_TEACHER' || teacherRoleInfo.archetype === 'SECONDARY_FORM_AND_SUBJECT') && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              {/* Form Master Header & View Switcher */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                      Secondary Form Master View
                    </span>
                    <span className="text-xs text-slate-500 font-bold">• {activeClass?.name}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">
                    Subject Score Submissions & Report Sheet Compilation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Monitor Continuous Assessment & Examination submissions across all departmental subjects, dispatch automated score reminders to subject teachers, and compile official end-of-term student transcripts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setFormTeacherGradebookView('submissions')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        formTeacherGradebookView === 'submissions'
                          ? 'bg-white text-indigo-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Class Submissions Tracker
                    </button>
                    {teacherRoleInfo.archetype === 'SECONDARY_FORM_AND_SUBJECT' && (
                      <button
                        onClick={() => setFormTeacherGradebookView('my_subject')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          formTeacherGradebookView === 'my_subject'
                            ? 'bg-white text-indigo-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Grade My Subject ({activeSubject?.name || 'Subject'})
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedStudentForReport(students[0] || null)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Compile & Print Report Cards</span>
                  </button>
                </div>
              </div>

              {/* Submissions Tracker Sub-view */}
              {formTeacherGradebookView === 'submissions' && (
                <div className="space-y-6">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Subjects</span>
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{submissionsSummary.length}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Curriculum Subjects in {activeClass?.name}</div>
                    </div>

                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between text-emerald-800 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-emerald-950">
                        {submissionsSummary.filter(s => s.status === 'COMPLETED').length}
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-1">100% of student marks entered</div>
                    </div>

                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between text-amber-800 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-2xl font-black text-amber-950">
                        {submissionsSummary.filter(s => s.status === 'IN_PROGRESS').length}
                      </div>
                      <div className="text-[11px] text-amber-700 mt-1">Partial scores logged</div>
                    </div>

                    <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
                      <div className="flex items-center justify-between text-rose-800 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Pending / Overdue</span>
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="text-2xl font-black text-rose-950">
                        {submissionsSummary.filter(s => s.status === 'PENDING').length}
                      </div>
                      <div className="text-[11px] text-rose-700 mt-1">Awaiting teacher entries</div>
                    </div>
                  </div>

                  {/* Submission Breakdown Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Subject & Code</th>
                          <th className="py-3 px-4">Subject Teacher</th>
                          <th className="py-3 px-4">Teacher Role</th>
                          <th className="py-3 px-4 text-center">Score Progress</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Form Master Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {submissionsSummary.map((item) => {
                          const percentage = item.totalStudents > 0 ? Math.round((item.scoredCount / item.totalStudents) * 100) : 0;
                          return (
                            <tr key={item.subjectId} className="hover:bg-slate-50/60">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{item.subjectName}</div>
                                <span className="font-mono text-[10px] text-slate-500">{item.subjectCode}</span>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-800">
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span>{item.teacherName}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {item.teacherType.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-mono font-bold text-slate-800">
                                    {item.scoredCount} / {item.totalStudents} pupils ({percentage}%)
                                  </span>
                                  <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        item.status === 'COMPLETED'
                                          ? 'bg-emerald-500'
                                          : item.status === 'IN_PROGRESS'
                                          ? 'bg-amber-500'
                                          : 'bg-rose-400'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.status === 'IN_PROGRESS'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {item.status === 'COMPLETED' ? 'COMPLETED' : item.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'PENDING'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {item.status !== 'COMPLETED' ? (
                                  <button
                                    onClick={() => handleOpenReminderModal(item)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <Send className="w-3 h-3 text-amber-600" />
                                    <span>Send Reminder</span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-bold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Student Report Cards Quick Launch Roster */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-amber-300">
                          Class Transcript & Report Card Compilation
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Select any enrolled student in {activeClass?.name} to preview, compile, or print their official full-subject report card.
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                        {students.length} Enrolled Candidates
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                      {students.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStudentForReport(st)}
                          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2.5">
                            <img src={st.avatar} alt={st.fullName} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/30" />
                            <div>
                              <div className="font-bold text-xs text-white">{st.fullName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{st.studentId}</div>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-amber-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STANDARD OR SUBJECT-SPECIFIC GRADEBOOK (BASIC TEACHER OR SUBJECT SPECIALIST) */}
          {/* ========================================================================= */}
          {(teacherRoleInfo.archetype !== 'SECONDARY_FORM_TEACHER' || formTeacherGradebookView === 'my_subject') && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Continuous Assessment Gradebook: {activeClass?.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER'
                      ? `Select subject to record continuous assessment scores for ${activeClass?.name}. Specialist subjects are read-only.`
                      : `Enter continuous assessment marks for ${activeSubject?.name || 'Subject'} with automatic grade computation.`}
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-full">
                  {/* Subject selector for Primary Basic Teachers to switch subjects within the class */}
                  {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER' && (
                    <div className="min-w-[130px] max-w-full">
                      <select
                        value={selectedSubjectId}
                        onChange={e => setSelectedSubjectId(e.target.value)}
                        className="w-full sm:w-auto max-w-[200px] truncate px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 bg-indigo-50/50"
                      >
                        {viewableSubjects.map(s => {
                          const isSpecialist = db.isSubjectManagedBySpecialist(activeClass?.id || selectedClassId, s.id, currentUser.id).isSpecialistManaged;
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} {isSpecialist ? '★ (Specialist)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <select
                    value={selectedAssessmentId}
                    onChange={e => setSelectedAssessmentId(e.target.value)}
                    className="w-full sm:w-auto max-w-[240px] truncate px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
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
                    disabled={specialistCheck.isSpecialistManaged}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Save All Scores</span>
                  </button>
                </div>
              </div>

              {/* Specialist Managed Read-Only Notice */}
              {specialistCheck.isSpecialistManaged && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse shrink-0" />
                    <span className="font-medium">
                      <strong className="font-bold">Specialist Subject Domain:</strong> This subject is managed by designated Specialist Teacher <strong className="underline">{specialistCheck.specialistName}</strong>. You can view student scores here for class oversight, but grade modifications are reserved for the specialist.
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded shrink-0">
                    Read-Only for Class Head
                  </span>
                </div>
              )}

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
                              disabled={specialistCheck.isSpecialistManaged}
                              value={val}
                              onChange={e =>
                                setScoreInputs({ ...scoreInputs, [st.id]: Number(e.target.value) })
                              }
                              className={`w-20 px-2 py-1 text-center font-mono font-bold rounded-lg border text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                                specialistCheck.isSpecialistManaged
                                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                  : 'border-slate-300 bg-white text-slate-900'
                              }`}
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
              Assists teaching staff with curriculum lesson planning, structured quizzes with answer keys, report comments, and student insights.
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

      {/* Tab: Topic Completion & Syllabus Coverage */}
      {(currentTab === 'topic_completion' || currentTab === 'curriculum_topics') && (
        <TopicCompletionManager
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

      {/* Tab: Student Promotion */}
      {currentTab === 'promotion' && (
        <StudentPromotionManager
          currentUser={currentUser}
          initialClassId={selectedClassId}
          onViewStudentArchive={() => setCurrentTab('archives')}
        />
      )}

      {/* Tab: Permanent Academic Archives */}
      {currentTab === 'archives' && (
        <AcademicArchiveViewer currentUser={currentUser} />
      )}

      {/* Modal: Form Teacher Score Reminder to Subject Teacher */}
      {reminderModal && reminderModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Dispatch Score Submission Reminder
                  </h3>
                  <p className="text-xs text-slate-500">Official Form Master Academic Notification</p>
                </div>
              </div>
              <button
                onClick={() => setReminderModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Recipient Staff</span>
                  <strong className="text-slate-900 font-semibold">{reminderModal.teacherName}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Class & Subject</span>
                  <strong className="text-indigo-900 font-semibold">{activeClass?.name} • {reminderModal.subjectName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reminder Message / Note:
                </label>
                <textarea
                  rows={4}
                  value={reminderModal.customMessage}
                  onChange={(e) => setReminderModal({ ...reminderModal, customMessage: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReminderModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminderConfirm}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Official Reminder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
};
