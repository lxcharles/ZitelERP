import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User as UserIcon,
  Users,
  MapPin,
  Award,
  CheckCircle2,
  Search,
  Filter,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Sun,
  AlertCircle,
  Coffee,
  Utensils,
  Bell,
  FileText,
  X,
  GraduationCap,
  Download,
  Info,
  ChevronDown
} from 'lucide-react';
import { User, TimetableSlot, ClassRoom, Subject, Assignment } from '../../types';
import { db } from '../../services/db';

export interface TimetableProps {
  currentUser: User;
  classId?: string;
  className?: string;
  viewMode?: 'student' | 'teacher' | 'auto';
  onNavigateToTab?: (tabId: string, context?: any) => void;
  compact?: boolean;
}

type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
const DAYS_OF_WEEK: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Subject theme color map
const SUBJECT_THEMES: Record<string, { bg: string; text: string; border: string; badge: string; icon: string }> = {
  'Mathematics': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', icon: '📐' },
  'English Studies': { bg: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800', icon: '📚' },
  'Basic Science & Technology': { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', icon: '🔬' },
  'Basic Science': { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', icon: '🔬' },
  'Computer Studies & Coding': { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800', icon: '💻' },
  'Computer Studies': { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800', icon: '💻' },
  'Social Studies': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', icon: '🌍' },
  'Civic Education': { bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800', icon: '🏛️' },
  'Physical & Health Education': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', icon: '🏃' },
  'Creative & Cultural Arts': { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-800', icon: '🎨' },
  'French Language': { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800', icon: '🥖' },
  'Christian Religious Studies': { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', icon: '📖' },
  'Agricultural Science': { bg: 'bg-lime-50', text: 'text-lime-900', border: 'border-lime-200', badge: 'bg-lime-100 text-lime-800', icon: '🌱' },
  'Robotics & Maker Club': { bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800', icon: '🤖' },
  'Quantitative Reasoning': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', icon: '🔢' },
  'Verbal Reasoning': { bg: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800', icon: '🔤' },
  'Library Reading & Literacy Club': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', icon: '📖' },
  'Music & Choral Performance': { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800', icon: '🎵' },
  'Home Economics': { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', icon: '🍳' },
  'Handwriting & Cursive Penmanship': { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800', icon: '✍️' },
  'Moral Instruction & Ethics': { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', icon: '🕊️' },
  'Inter-House Sports & Team Games': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', icon: '⚽' },
  'General Knowledge & Current Affairs': { bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800', icon: '🌐' },
  'Class Assembly & Golden Star Awards': { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', icon: '⭐' },
};

function getSubjectTheme(subjectName: string) {
  if (SUBJECT_THEMES[subjectName]) {
    return SUBJECT_THEMES[subjectName];
  }
  // Match substrings
  for (const [key, theme] of Object.entries(SUBJECT_THEMES)) {
    if (subjectName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subjectName.toLowerCase())) {
      return theme;
    }
  }
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-800',
    icon: '📘',
  };
}

// Fixed school routine intervals
interface RoutineInterval {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'ASSEMBLY' | 'RECESS' | 'LUNCH' | 'DISMISSAL';
  roomNumber: string;
  description: string;
  icon: string;
}

const SCHOOL_ROUTINES: RoutineInterval[] = [
  {
    id: 'routine_assembly',
    name: 'Morning Devotion & Assembly',
    startTime: '07:45',
    endTime: '08:15',
    type: 'ASSEMBLY',
    roomNumber: 'Main Assembly Quadrangle',
    description: 'National Anthem, School Pledge, Morning Devotion & Inspection',
    icon: '🔔',
  },
  {
    id: 'routine_break',
    name: 'Mid-Morning Snack & Recess',
    startTime: '10:30',
    endTime: '11:00',
    type: 'RECESS',
    roomNumber: 'Cafeteria & Primary Playground',
    description: 'Nutritional snack interval, supervised play & social recreation',
    icon: '🥪',
  },
  {
    id: 'routine_lunch',
    name: 'Lunch & Mid-Day Recreation',
    startTime: '13:15',
    endTime: '13:50',
    type: 'LUNCH',
    roomNumber: 'Dining Hall & Sports Quad',
    description: 'Warm lunch meal, hydration break, and quiet reading prep',
    icon: '🍱',
  },
  {
    id: 'routine_dismissal',
    name: 'School Dismissal & Bus Departures',
    startTime: '14:30',
    endTime: '14:45',
    type: 'DISMISSAL',
    roomNumber: 'Pick-up Gate & Transit Bay',
    description: 'Orderly boarding, after-school club handovers & pick-ups',
    icon: '🚌',
  }
];

export const Timetable: React.FC<TimetableProps> = ({
  currentUser,
  classId: propClassId,
  className: propClassName,
  viewMode: propViewMode,
  onNavigateToTab,
  compact = false,
}) => {
  // Determine user perspective: teacher, student, or admin
  const isTeacher = propViewMode === 'teacher' || (propViewMode !== 'student' && currentUser.role === 'TEACHER');
  const isStudent = propViewMode === 'student' || (propViewMode !== 'teacher' && currentUser.role === 'STUDENT');

  // All database context
  const rawTimetable = db.getTimetable();
  const classes = db.getClasses();
  const subjects = db.getSubjects();
  const assignments = db.getAssignments();
  const allUsers = db.getUsers();

  // Active day selection: default to current real-world weekday if Mon-Fri, else Monday
  const getInitialDay = (): WeekDay => {
    const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon, 5 is Fri, 6 is Sat
    const map: Record<number, WeekDay> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
    return map[dayIndex] || 'Monday';
  };

  const [selectedDay, setSelectedDay] = useState<WeekDay>(getInitialDay);
  const [viewStyle, setViewStyle] = useState<'daily' | 'matrix'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<TimetableSlot | null>(null);

  // Teacher specific view controls: "My Teaching Slots" vs "Class Schedule"
  const [teacherViewScope, setTeacherViewScope] = useState<'my_schedule' | 'class_schedule'>(
    isTeacher ? 'my_schedule' : 'class_schedule'
  );

  // Student class resolution
  const studentProfile = isStudent ? db.getStudents().find(s => s.id === currentUser.id) : null;
  const resolvedClassId = propClassId || (studentProfile?.classId || (currentUser.assignedClasses?.[0] || 'cls_basic3a_bgl'));
  const [selectedClassId, setSelectedClassId] = useState<string>(resolvedClassId);

  useEffect(() => {
    if (propClassId) {
      setSelectedClassId(propClassId);
    }
  }, [propClassId]);

  const activeClass = classes.find(c => c.id === selectedClassId) || {
    id: selectedClassId,
    name: propClassName || 'Basic 3A',
    levelName: 'Basic 3',
  };

  // Real-time clock to evaluate "Live Now" status
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Today's real day name
  const todayDayName = useMemo(() => {
    const map: Record<number, WeekDay> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
    return map[new Date().getDay()] || null;
  }, []);

  // Filter slots based on user perspective
  const filteredSlots = useMemo(() => {
    return rawTimetable.filter(slot => {
      // 1. Role Scope Filter
      if (isTeacher && teacherViewScope === 'my_schedule') {
        // Teacher viewing their own allocated periods
        if (slot.teacherId !== currentUser.id && !slot.teacherName.toLowerCase().includes(currentUser.name.toLowerCase())) {
          return false;
        }
      } else {
        // Viewing specific class timetable
        if (selectedClassId && slot.classId !== selectedClassId) {
          return false;
        }
      }

      // 2. Subject Filter
      if (selectedSubjectFilter !== 'ALL' && slot.subjectName !== selectedSubjectFilter) {
        return false;
      }

      // 3. Search Query (matches subject, teacher, room, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = slot.subjectName.toLowerCase().includes(q);
        const matchesTeacher = slot.teacherName.toLowerCase().includes(q);
        const matchesRoom = (slot.roomNumber || slot.room || '').toLowerCase().includes(q);
        const matchesClass = slot.className.toLowerCase().includes(q);
        const matchesNotes = (slot.notes || '').toLowerCase().includes(q);
        if (!matchesSubject && !matchesTeacher && !matchesRoom && !matchesClass && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [rawTimetable, isTeacher, teacherViewScope, currentUser, selectedClassId, selectedSubjectFilter, searchQuery]);

  // Slots for the selected day, sorted chronologically
  const daySlots = useMemo(() => {
    return filteredSlots
      .filter(s => s.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredSlots, selectedDay]);

  // Unique subjects available for filter dropdown
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    filteredSlots.forEach(s => set.add(s.subjectName));
    return Array.from(set).sort();
  }, [filteredSlots]);

  // Status helper: check if period is current, upcoming, or passed
  const getSlotStatus = (slot: TimetableSlot) => {
    if (selectedDay !== todayDayName) {
      return { isCurrent: false, isPast: false, isUpcoming: true };
    }
    const current = currentTimeStr;
    const isCurrent = current >= slot.startTime && current <= slot.endTime;
    const isPast = current > slot.endTime;
    const isUpcoming = current < slot.startTime;
    return { isCurrent, isPast, isUpcoming };
  };

  // Find currently active slot today (if any)
  const currentlyActiveSlot = useMemo(() => {
    if (!todayDayName) return null;
    return filteredSlots.find(slot => {
      if (slot.day !== todayDayName) return false;
      return currentTimeStr >= slot.startTime && currentTimeStr <= slot.endTime;
    });
  }, [filteredSlots, todayDayName, currentTimeStr]);

  // Find next upcoming slot today (if any)
  const nextUpcomingSlot = useMemo(() => {
    if (!todayDayName) return null;
    const upcoming = filteredSlots
      .filter(slot => slot.day === todayDayName && slot.startTime > currentTimeStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return upcoming[0] || null;
  }, [filteredSlots, todayDayName, currentTimeStr]);

  // Combined daily schedule items (lessons + standard intervals)
  type TimelineItem =
    | { kind: 'lesson'; slot: TimetableSlot; startTime: string; endTime: string }
    | { kind: 'routine'; interval: RoutineInterval; startTime: string; endTime: string };

  const combinedDailyTimeline = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add lessons
    daySlots.forEach(slot => {
      items.push({
        kind: 'lesson',
        slot,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    });

    // Add routines
    SCHOOL_ROUTINES.forEach(interval => {
      items.push({
        kind: 'routine',
        interval,
        startTime: interval.startTime,
        endTime: interval.endTime,
      });
    });

    // Sort all chronologically by startTime
    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [daySlots]);

  // Quick action: print schedule
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="timetable-component-root">
      {/* 1. HEADER & CONTROL BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Academic Timetable & Daily Schedule
                </h1>
                {isTeacher && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                    Teacher Mode
                  </span>
                )}
                {isStudent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider">
                    Pupil Schedule
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isTeacher && teacherViewScope === 'my_schedule'
                  ? `Teaching schedule for ${currentUser.name} across designated classes`
                  : `Structured daily lesson routine & teacher distribution for ${activeClass.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live Clock Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>{currentTimeStr}</span>
            {todayDayName && (
              <span className="text-[10px] font-sans font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                Today: {todayDayName}
              </span>
            )}
          </div>

          {/* View Mode Toggle: Daily vs Matrix */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewStyle('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewStyle === 'daily'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Timeline
            </button>
            <button
              onClick={() => setViewStyle('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewStyle === 'matrix'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Grid
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            title="Print or export schedule"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Schedule</span>
          </button>
        </div>
      </div>

      {/* 2. TODAY'S LIVE INTELLIGENCE BANNER */}
      {(currentlyActiveSlot || nextUpcomingSlot) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-sm border border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              {currentlyActiveSlot ? (
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                      LIVE LESSON IN PROGRESS
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                    <span>{currentlyActiveSlot.subjectName}</span>
                    <span className="text-xs font-normal text-indigo-200">
                      ({currentlyActiveSlot.startTime} – {currentlyActiveSlot.endTime})
                    </span>
                  </div>
                  <div className="text-xs text-indigo-200 flex items-center space-x-2">
                    <span>{currentlyActiveSlot.className}</span>
                    <span>•</span>
                    <span>Teacher: {currentlyActiveSlot.teacherName}</span>
                    <span>•</span>
                    <span>{currentlyActiveSlot.roomNumber || currentlyActiveSlot.room || 'Room 201'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300">
                    NEXT UP ON SCHEDULE
                  </span>
                  <div className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                    <span>{nextUpcomingSlot?.subjectName}</span>
                    <span className="text-xs font-normal text-indigo-200">
                      at {nextUpcomingSlot?.startTime} ({nextUpcomingSlot?.startTime} – {nextUpcomingSlot?.endTime})
                    </span>
                  </div>
                  <div className="text-xs text-indigo-200 flex items-center space-x-2">
                    <span>{nextUpcomingSlot?.className}</span>
                    <span>•</span>
                    <span>Teacher: {nextUpcomingSlot?.teacherName}</span>
                    <span>•</span>
                    <span>{nextUpcomingSlot?.roomNumber || nextUpcomingSlot?.room || 'Room 201'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banner Quick Link */}
          {isTeacher && onNavigateToTab && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateToTab('attendance')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => onNavigateToTab('lesson_notes')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
              >
                Lesson Notes
              </button>
            </div>
          )}

          {isStudent && onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('my_homework')}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center"
            >
              View Homework Tasks →
            </button>
          )}
        </div>
      )}

      {/* 3. CONTEXT & FILTER BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Day Selector Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {DAYS_OF_WEEK.map(day => {
              const isSelected = selectedDay === day;
              const isToday = day === todayDayName;
              const count = filteredSlots.filter(s => s.day === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Today" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Teacher Scope Switcher (My Teaching vs Class) */}
          {isTeacher && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setTeacherViewScope('my_schedule')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    teacherViewScope === 'my_schedule'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Teaching Periods
                </button>
                <button
                  onClick={() => setTeacherViewScope('class_schedule')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    teacherViewScope === 'class_schedule'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Class Timetable
                </button>
              </div>

              {teacherViewScope === 'class_schedule' && (
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Non-teacher Class Selector if multiple classes */}
          {!isTeacher && !isStudent && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-500">Class:</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search & Subject Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search subject, teacher, room..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter Subject:</span>
            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Subjects ({availableSubjects.length})</option>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. DAILY SUMMARY STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Day Schedule
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-1.5">
            <span>{selectedDay}</span>
            {selectedDay === todayDayName && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                Today
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">{daySlots.length} Lesson Periods Scheduled</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            School Day Span
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900">
            08:15 – 14:30
          </div>
          <p className="text-[11px] text-slate-500">6.25 Total Hours (Inc. Breaks)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Intervals & Breaks
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900">
            2 Breaks + Devotion
          </div>
          <p className="text-[11px] text-slate-500">Recess (10:30) & Lunch (13:15)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isTeacher ? 'Assigned Class' : 'Target Classroom'}
          </span>
          <div className="text-base sm:text-lg font-black text-indigo-700 truncate">
            {isTeacher && teacherViewScope === 'my_schedule' ? 'Multi-Class View' : activeClass.name}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {isStudent ? 'Leo Rodriguez-Balogun' : (isTeacher ? currentUser.name : 'All Students')}
          </p>
        </div>
      </div>

      {/* 5. VIEW MODE: DAILY TIMELINE */}
      {viewStyle === 'daily' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{selectedDay}'s Daily Lesson Sequence</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Sorted chronologically by period start time
            </span>
          </div>

          {combinedDailyTimeline.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No periods found for {selectedDay}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No lesson slots match your current filter criteria. Try clearing search or choosing another day.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubjectFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {combinedDailyTimeline.map(item => {
                // Routine item (Assembly, Recess, Lunch)
                if (item.kind === 'routine') {
                  const routine = item.interval;
                  return (
                    <div
                      key={routine.id}
                      className="p-3.5 rounded-2xl bg-slate-100/70 border border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-600 transition-all hover:bg-slate-100"
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className="text-2xl">{routine.icon}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">
                              {routine.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {routine.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{routine.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs shrink-0 self-start sm:self-center">
                        <div className="flex items-center space-x-1.5 font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{routine.startTime} – {routine.endTime}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{routine.roomNumber}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Lesson item
                const slot = item.slot;
                const theme = getSubjectTheme(slot.subjectName);
                const status = getSlotStatus(slot);

                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlotForModal(slot)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md relative ${
                      theme.bg
                    } ${
                      status.isCurrent
                        ? 'border-emerald-500 ring-2 ring-emerald-400/40 shadow-sm'
                        : theme.border
                    }`}
                  >
                    {/* Live Indicator Pill */}
                    {status.isCurrent && (
                      <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>Current Period (Live Now)</span>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Time & Period Indicator */}
                      <div className="flex items-start sm:items-center space-x-3.5 shrink-0">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-center min-w-[70px]">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            {slot.periodNumber ? `Period ${slot.periodNumber}` : 'Period'}
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-black text-slate-900 block leading-tight">
                            {slot.startTime}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            to {slot.endTime}
                          </span>
                        </div>

                        {/* Subject Details */}
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xl" title={slot.subjectName}>
                              {theme.icon}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                              {slot.subjectName}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                              {slot.type || 'CORE'}
                            </span>
                            {slot.className && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {slot.className}
                              </span>
                            )}
                          </div>
                          {slot.notes && (
                            <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                              <span className="font-semibold text-slate-700">Topic:</span> {slot.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Teacher, Room & Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                        {/* Teacher Info Card */}
                        <div className="flex items-center space-x-2.5 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {slot.teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-slate-400 block leading-none">
                              Teacher
                            </span>
                            <span className="text-xs font-bold text-slate-800 block">
                              {slot.teacherName}
                            </span>
                          </div>
                        </div>

                        {/* Room Badge */}
                        <div className="flex items-center space-x-1.5 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-700 shadow-2xs">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{slot.roomNumber || slot.room || 'Room 201'}</span>
                        </div>

                        {/* Quick Action Button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedSlotForModal(slot);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. VIEW MODE: WEEKLY MATRIX GRID */}
      {viewStyle === 'matrix' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Full Weekly Timetable Matrix</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Monday through Friday scheduled periods
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="p-3.5 w-24">Time / Period</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className={`p-3.5 ${day === todayDayName ? 'bg-indigo-50/70 text-indigo-900' : ''}`}>
                      <div className="flex items-center space-x-1.5">
                        <span>{day}</span>
                        {day === todayDayName && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Today" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* We map through the 7 primary period time windows */}
                {[
                  { periodNum: 1, startTime: '08:15', endTime: '09:00' },
                  { periodNum: 2, startTime: '09:00', endTime: '09:45' },
                  { periodNum: 3, startTime: '09:45', endTime: '10:30' },
                  { periodNum: 4, startTime: '11:00', endTime: '11:45' },
                  { periodNum: 5, startTime: '11:45', endTime: '12:30' },
                  { periodNum: 6, startTime: '12:30', endTime: '13:15' },
                  { periodNum: 7, startTime: '13:50', endTime: '14:30' },
                ].map((periodDef, idx) => {
                  return (
                    <React.Fragment key={periodDef.periodNum}>
                      {/* Mid-morning Break banner after Period 3 */}
                      {idx === 3 && (
                        <tr className="bg-amber-50/60 border-y border-amber-200/80 text-[11px] font-bold text-amber-900">
                          <td className="p-2.5 font-mono text-amber-700 bg-amber-100/50">10:30 – 11:00</td>
                          <td colSpan={5} className="p-2.5 text-center">
                            🥪 Mid-Morning Snack & Recess (30 Minutes) • Supervised Recreation
                          </td>
                        </tr>
                      )}

                      {/* Lunch Break banner after Period 6 */}
                      {idx === 6 && (
                        <tr className="bg-emerald-50/60 border-y border-emerald-200/80 text-[11px] font-bold text-emerald-900">
                          <td className="p-2.5 font-mono text-emerald-700 bg-emerald-100/50">13:15 – 13:50</td>
                          <td colSpan={5} className="p-2.5 text-center">
                            🍱 Lunch & Afternoon Recreation (35 Minutes) • Dining Hall & Sports Quad
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Time Period Column */}
                        <td className="p-3 font-mono text-slate-700 bg-slate-50/40 border-r border-slate-100 align-top">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Period {periodDef.periodNum}
                          </span>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {periodDef.startTime}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {periodDef.endTime}
                          </span>
                        </td>

                        {/* 5 Day Cells */}
                        {DAYS_OF_WEEK.map(day => {
                          const slot = filteredSlots.find(
                            s => s.day === day && (s.periodNumber === periodDef.periodNum || s.startTime === periodDef.startTime)
                          );

                          if (!slot) {
                            return (
                              <td key={day} className="p-2 border-r border-slate-100 align-top text-slate-400">
                                <div className="p-2.5 rounded-xl border border-dashed border-slate-200 text-center text-[11px]">
                                  Free / Prep
                                </div>
                              </td>
                            );
                          }

                          const theme = getSubjectTheme(slot.subjectName);
                          const status = getSlotStatus(slot);

                          return (
                            <td
                              key={day}
                              onClick={() => setSelectedSlotForModal(slot)}
                              className={`p-2 border-r border-slate-100 align-top cursor-pointer ${
                                day === todayDayName ? 'bg-indigo-50/30' : ''
                              }`}
                            >
                              <div
                                className={`p-2.5 rounded-xl border transition-all hover:scale-[1.02] shadow-2xs space-y-1 ${
                                  theme.bg
                                } ${
                                  status.isCurrent
                                    ? 'border-emerald-500 ring-2 ring-emerald-400/40'
                                    : theme.border
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {slot.subjectName}
                                  </span>
                                  <span className="text-xs">{theme.icon}</span>
                                </div>
                                <p className="text-[10px] text-slate-600 truncate">
                                  {slot.teacherName}
                                </p>
                                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 border-t border-slate-200/50">
                                  <span className="font-mono">{slot.roomNumber || slot.room || 'Room 201'}</span>
                                  {status.isCurrent && (
                                    <span className="text-emerald-700 font-bold">LIVE</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. DETAILED PERIOD MODAL */}
      {selectedSlotForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                  {getSubjectTheme(selectedSlotForModal.subjectName).icon}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedSlotForModal.subjectName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {selectedSlotForModal.day}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedSlotForModal.className} • Period {selectedSlotForModal.periodNumber || 1}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlotForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Lesson Specifications */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Lesson Time
                  </span>
                  <span className="text-sm font-mono font-bold text-indigo-900 block">
                    {selectedSlotForModal.startTime} – {selectedSlotForModal.endTime}
                  </span>
                  <span className="text-[10px] text-slate-500">45 Minutes Duration</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Room / Laboratory
                  </span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {selectedSlotForModal.roomNumber || selectedSlotForModal.room || 'Room 201'}
                  </span>
                  <span className="text-[10px] text-slate-500">Bungalow Campus</span>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {selectedSlotForModal.teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Instructor & Specialization
                    </span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {selectedSlotForModal.teacherName}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-900">
                  Certified Faculty
                </span>
              </div>

              {/* Topic Notes */}
              {selectedSlotForModal.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Syllabus Topic & Objectives
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {selectedSlotForModal.notes}
                  </p>
                </div>
              )}

              {/* Active Homework for this Subject */}
              {(() => {
                const subjectAssignments = assignments.filter(
                  a => a.subjectName === selectedSlotForModal.subjectName && a.classId === selectedSlotForModal.classId
                );
                return (
                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Active Homework & Mission</span>
                      </span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {subjectAssignments.length} Assigned
                      </span>
                    </div>
                    {subjectAssignments.length > 0 ? (
                      <div className="space-y-1.5">
                        {subjectAssignments.slice(0, 2).map(asg => (
                          <div key={asg.id} className="text-xs text-slate-700 flex items-center justify-between">
                            <span className="font-semibold text-slate-900 truncate">• {asg.title}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">Due: {asg.dueDate}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        No pending homework submissions for this subject today.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Materials Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Required Student Materials
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    📖 Subject Notebook
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    ✏️ Pencil Case & Ruler
                  </span>
                  {selectedSlotForModal.type === 'LAB' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      🥼 Lab Coat Required
                    </span>
                  )}
                  {selectedSlotForModal.type === 'ACTIVITY' && (
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
                      👟 PE Sports Kit
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              {isTeacher && onNavigateToTab && (
                <>
                  <button
                    onClick={() => {
                      setSelectedSlotForModal(null);
                      onNavigateToTab('attendance');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Take Attendance
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSlotForModal(null);
                      onNavigateToTab('lesson_notes');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Open Lesson Notes
                  </button>
                </>
              )}

              {isStudent && onNavigateToTab && (
                <button
                  onClick={() => {
                    setSelectedSlotForModal(null);
                    onNavigateToTab('my_homework');
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  View Homework Tasks
                </button>
              )}

              <button
                onClick={() => setSelectedSlotForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
