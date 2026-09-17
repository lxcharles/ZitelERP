import React, { useState } from 'react';
import {
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  ClipboardList,
  Calendar,
  MessageSquare,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Filter,
  Smile,
  Megaphone,
  UserCheck
} from 'lucide-react';
import {
  User,
  ClassRoom,
  Subject,
  Student,
  AttendanceRecord,
  Assessment,
  AssessmentScore,
  Assignment,
  LessonNote,
  LessonPlan,
  ClassAnnouncement,
  BehaviorRecord,
  BehaviorStatusType
} from '../../types';
import { DailyCalendarIntelligenceWidget } from '../common/DailyCalendarIntelligenceWidget';
import { db } from '../../services/db';

interface ClassroomHubProps {
  currentUser: User;
  activeClass: ClassRoom;
  assignedClasses?: ClassRoom[];
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  activeSubject?: Subject;
  teacherSubjects?: Subject[];
  selectedSubjectId?: string;
  onSelectSubject?: (subjectId: string) => void;
  onNavigateTab: (tabId: string) => void;
  onOpenReportCard?: (student: Student) => void;
}

export const ClassroomHub: React.FC<ClassroomHubProps> = ({
  currentUser,
  activeClass,
  assignedClasses = [],
  selectedClassId = '',
  onSelectClass = (_classId: string) => {},
  activeSubject,
  teacherSubjects = [],
  selectedSubjectId = '',
  onSelectSubject = (_subjectId: string) => {},
  onNavigateTab,
  onOpenReportCard,
}) => {
  const isFormTeacher = activeClass?.formTeacherId === currentUser.id;
  const branchName = activeClass?.branchName || 'Zitel Castle (Bungalow)';
  const teacherRoleInfo = db.getTeacherRoleInfo(currentUser.id, activeClass?.id);

  // Announcements state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [annAudience, setAnnAudience] = useState<'ALL' | 'STUDENTS' | 'PARENTS'>('ALL');

  // Behavior state
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [selectedStudentForBehavior, setSelectedStudentForBehavior] = useState<string>('');
  const [behaviorCategory, setBehaviorCategory] = useState<string>('Classroom Conduct');
  const [behaviorStatus, setBehaviorStatus] = useState<BehaviorStatusType>('Positive');
  const [behaviorRating, setBehaviorRating] = useState<number>(5);
  const [behaviorNotes, setBehaviorNotes] = useState('');
  const [behaviorHeadline, setBehaviorHeadline] = useState('');
  const [behaviorPoints, setBehaviorPoints] = useState<number>(3);
  const [behaviorPublishedToParent, setBehaviorPublishedToParent] = useState(true);

  // Fetch relevant live records from DB
  const students = activeClass ? db.getAuthorizedStudentsForTeacher(currentUser.id, activeClass.id) : [];
  const announcements = db.getClassAnnouncements(activeClass?.id);
  const lessonNotes = db.getAuthorizedLessonNotes(currentUser.id, activeClass?.id);
  const lessonPlans = db.getAuthorizedLessonPlans(currentUser.id, activeClass?.id);
  const assessments = db.getAuthorizedAssessments(currentUser.id, activeClass?.id);
  const assignments = db.getAuthorizedAssignments(currentUser.id, activeClass?.id);
  const behaviorRecords = db.getBehaviorRecords().filter(b => {
    return students.some(s => s.id === b.studentId);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = db.getAttendance().filter(a => a.classId === activeClass?.id && a.date === todayStr);

  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = todayAttendance.filter(a => a.status === 'LATE').length;
  const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length;
  const attendanceRate = students.length > 0
    ? Math.round(((presentCount + lateCount) / Math.max(students.length, 1)) * 100)
    : 100;

  // Gender counts
  const boysCount = students.filter(s => s.gender === 'Male').length;
  const girlsCount = students.filter(s => s.gender === 'Female').length;

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    db.createClassAnnouncement(
      {
        classId: activeClass.id,
        className: activeClass.name,
        branchId: activeClass.branchId,
        teacherId: currentUser.id,
        teacherName: currentUser.name + (isFormTeacher ? ' (Form Teacher)' : ''),
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
        targetAudience: annAudience,
        date: todayStr,
      },
      currentUser
    );

    setAnnTitle('');
    setAnnContent('');
    setShowAnnouncementModal(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    db.deleteClassAnnouncement(id, currentUser);
  };

  const handleSaveBehavior = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBehavior || !behaviorNotes.trim()) return;

    const targetStudent = students.find(s => s.id === selectedStudentForBehavior);
    if (!targetStudent) return;

    db.addBehaviorRecord(
      {
        studentId: targetStudent.id,
        studentName: targetStudent.fullName,
        classId: activeClass.id,
        className: activeClass.name,
        branchId: targetStudent.branchId,
        date: todayStr,
        category: behaviorCategory,
        status: behaviorStatus,
        headline: behaviorHeadline.trim() || undefined,
        observation: behaviorNotes.trim(),
        detailedComments: undefined,
        actionTaken: undefined,
        rating: behaviorRating,
        points: behaviorPoints,
        visibility: behaviorPublishedToParent ? 'PARENT_VISIBLE' : 'STAFF_ONLY',
        isPublishedToParent: behaviorPublishedToParent,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherRole: isFormTeacher ? 'Form Teacher' : 'Subject Teacher',
      },
      currentUser
    );

    setSelectedStudentForBehavior('');
    setBehaviorNotes('');
    setBehaviorHeadline('');
    setShowBehaviorModal(false);
  };

  return (
    <div className="space-y-6" id="classroom-hub-container">
      {/* Header & Class Selection Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {teacherRoleInfo.archetype === 'PRIMARY_BASIC_TEACHER'
                  ? 'Primary Class Head Workspace'
                  : isFormTeacher
                  ? 'Form Teacher Workspace'
                  : 'Subject Teacher Workspace'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {branchName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                Academic Session: 2026/2027 • Term 1
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{activeClass?.name || 'Classroom'}</span>
              {teacherRoleInfo.archetype !== 'PRIMARY_BASIC_TEACHER' && activeSubject && (
                <>
                  <span className="text-slate-400 font-normal text-base">|</span>
                  <span className="text-slate-600 font-medium text-base">{activeSubject.name}</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Form Teacher: <strong className="text-slate-800">{activeClass?.formTeacherName || currentUser.name}</strong> • Room: {activeClass?.roomNumber || 'A-102'} • Capacity: {students.length}/{activeClass?.capacity || 30} Pupils
            </p>
          </div>

          {/* Quick Selectors & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 max-w-full">
            {assignedClasses.length > 1 && (
              <div className="min-w-[130px] max-w-full flex-1 sm:flex-initial">
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Switch Class
                </label>
                <select
                  id="classroom-class-select"
                  value={selectedClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="w-full sm:w-auto min-w-[130px] max-w-[220px] truncate bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {assignedClasses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.formTeacherId === currentUser.id ? '★ (Form)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {teacherRoleInfo.archetype !== 'PRIMARY_BASIC_TEACHER' && teacherSubjects.length > 0 && (
              <div className="min-w-[150px] max-w-full flex-1 sm:flex-initial">
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Teaching Subject
                </label>
                <select
                  id="classroom-subject-select"
                  value={selectedSubjectId}
                  onChange={(e) => onSelectSubject(e.target.value)}
                  className="w-full sm:w-auto min-w-[150px] max-w-[240px] truncate bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
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

        {/* Quick Action Navigation Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Class Actions:
          </span>
          <button
            id="quick-action-take-attendance"
            onClick={() => onNavigateTab('attendance')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
          <button
            id="quick-action-new-lesson-note"
            onClick={() => onNavigateTab('lesson_notes')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>+ Add Lesson Note</span>
          </button>
          <button
            id="quick-action-new-lesson-plan"
            onClick={() => onNavigateTab('lesson_planner')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>+ Add Lesson Plan</span>
          </button>
          <button
            id="quick-action-new-assessment"
            onClick={() => onNavigateTab('gradebook')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Record Scores</span>
          </button>
          <button
            id="quick-action-view-timetable"
            onClick={() => onNavigateTab('timetable')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Timetable</span>
          </button>
          <button
            id="quick-action-post-announcement"
            onClick={() => setShowAnnouncementModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Post Class Notice</span>
          </button>
          <button
            id="quick-action-log-behavior"
            onClick={() => setShowBehaviorModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Log Behavior</span>
          </button>
        </div>
      </div>

      {/* Daily Calendar Intelligence: Active Session, Term Countdown & Upcoming Events */}
      <DailyCalendarIntelligenceWidget currentUser={currentUser} />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Enrolled Pupils */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Class Roster</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{students.length}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>👦 {boysCount} Boys</span>
            <span>•</span>
            <span>👧 {girlsCount} Girls</span>
          </div>
        </div>

        {/* Card 2: Today's Attendance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today Attendance</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-slate-900">{attendanceRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">
                {todayAttendance.length > 0 ? `${presentCount + lateCount}/${students.length} Present` : 'Not Taken'}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {todayAttendance.length > 0
              ? `${absentCount} absent • ${lateCount} late`
              : 'Click "Mark Attendance" to log today'}
          </div>
        </div>

        {/* Card 3: Lesson Notes & Coverage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lesson Notes</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{lessonNotes.length}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{lessonPlans.length} Lesson Plans Scheduled</span>
          </div>
        </div>

        {/* Card 4: Continuous Assessments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Assessments & Tasks</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{assessments.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span>{assignments.length} Homework Tasks Active</span>
          </div>
        </div>
      </div>

      {/* Today's Daily Lesson Schedule Glance */}
      {(() => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = new Date().getDay();
        const activeDay = (currentDayIndex === 0 || currentDayIndex === 6) ? 'Monday' : dayNames[currentDayIndex];
        const daySlots = db.getTimetable()
          .filter(t => t.classId === activeClass?.id && t.day === activeDay)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {activeDay}'s Lesson Timetable ({activeClass?.name})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {daySlots.length} Periods Scheduled
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 transition-colors"
              >
                <span>Full Timetable & Grid</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {daySlots.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No timetable periods scheduled for {activeClass?.name} on {activeDay}.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    onClick={() => onNavigateTab('timetable')}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {slot.periodNumber ? `Period ${slot.periodNumber}` : 'Period'}
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-900">
                      {slot.subjectName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span className="truncate">{slot.teacherName}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-1">
                        {slot.roomNumber || slot.room || 'Room 201'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Grid: Class Announcements & Behavioral Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Announcements & Recent Lesson Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Announcements */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Class Notices & Announcements
                </h2>
              </div>
              <button
                id="btn-post-announcement"
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Notice</span>
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs sm:text-sm">No announcements posted for {activeClass?.name} yet.</p>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Post the first class announcement
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ann.priority === 'URGENT' || ann.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-700'
                                : ann.priority === 'NORMAL'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ann.priority}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            Audience: {ann.targetAudience}
                          </span>
                          <span className="text-[11px] text-slate-400">• {ann.date}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">{ann.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                          {ann.content}
                        </p>
                        <div className="mt-2 text-[11px] text-slate-400 font-medium">
                          Posted by: {ann.teacherName}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition-all"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lesson Notes Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Lesson Notes ({activeClass?.name})
                </h2>
              </div>
              <button
                id="btn-view-all-lesson-notes"
                onClick={() => onNavigateTab('lesson_notes')}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Full Lesson Notes Section</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lessonNotes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs sm:text-sm">No lesson notes recorded for this class yet.</p>
                <button
                  onClick={() => onNavigateTab('lesson_notes')}
                  className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Create new lesson note
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lessonNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => onNavigateTab('lesson_notes')}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                          {note.subjectName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Week {note.weekNumber} • {note.term}
                        </span>
                        {note.attachments && note.attachments.length > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            📎 {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900">{note.topic}</h4>
                      {note.subTopic && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{note.subTopic}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500 block">{note.date}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">{note.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Student Behavioral Records & Class Summary */}
        <div className="space-y-6">
          {/* Behavioral Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Behavior & Conduct
                </h2>
              </div>
              <button
                id="btn-log-behavior"
                onClick={() => setShowBehaviorModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Record</span>
              </button>
            </div>

            {behaviorRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Smile className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs sm:text-sm">No behavior records logged yet.</p>
                <button
                  onClick={() => setShowBehaviorModal(true)}
                  className="mt-2 text-xs text-purple-600 font-semibold hover:underline"
                >
                  Log praise or behavioral note
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {behaviorRecords.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{rec.studentName}</span>
                      <span className="text-[11px] text-slate-400">{rec.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold">
                        {rec.category}
                      </span>
                      <span className="text-amber-500 font-bold">
                        {'★'.repeat(rec.rating || 5)}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal">{rec.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Class Roster Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Pupils ({students.length})</h3>
              </div>
              <button
                onClick={() => onNavigateTab('students')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Directory
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {students.map((student) => (
                <div key={student.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px]">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{student.fullName}</div>
                      <div className="text-[10px] text-slate-400">ID: {student.studentId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.gender === 'Male'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {student.gender}
                    </span>
                    {onOpenReportCard && (
                      <button
                        onClick={() => onOpenReportCard(student)}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition-colors"
                        title="View Report Card"
                      >
                        Report Card
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Post New Class Announcement */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Post Class Notice ({activeClass.name})</h3>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Fair Materials Reminder"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Notice</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All (Parents & Students)</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write clear instructions or information for this classroom..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Student Behavior */}
      {showBehaviorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Record Student Conduct ({activeClass.name})</h3>
              </div>
              <button
                onClick={() => setShowBehaviorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBehavior} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pupil *</label>
                <select
                  required
                  value={selectedStudentForBehavior}
                  onChange={(e) => setSelectedStudentForBehavior(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">-- Choose Pupil --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Type</label>
                  <select
                    value={behaviorStatus}
                    onChange={(e) => setBehaviorStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  >
                    <option value="Positive">🌟 Positive Commendation</option>
                    <option value="Neutral">🔹 Neutral Observation</option>
                    <option value="Concern">⚠️ Behavioral Concern</option>
                    <option value="Incident">🚨 Disciplinary Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={behaviorCategory}
                    onChange={(e) => setBehaviorCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {db.getBehaviorCategories().filter(c => c.isActive !== false).map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observation Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Active participation in STEM workshop..."
                  value={behaviorHeadline}
                  onChange={(e) => setBehaviorHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observation & Teacher's Note *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the observed behavior or commendation in detail..."
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Publish to Parent Portal</span>
                  <span className="text-[10px] text-slate-500">Enable parent viewing on their child's timeline</span>
                </div>
                <input
                  type="checkbox"
                  checked={behaviorPublishedToParent}
                  onChange={(e) => setBehaviorPublishedToParent(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBehaviorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
