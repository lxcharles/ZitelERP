import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  ClassRoom,
  Student,
  DailyDiaryEntry,
  DailyDiaryType,
  DailyDiaryPriority,
  DailyDiaryActionItem,
  TeacherDailyActivityType,
} from '../../types';
import { db } from '../../services/db';
import {
  BookOpen,
  Sparkles,
  Plus,
  Search,
  Calendar,
  Clock,
  Pin,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  Share2,
  Award,
  AlertCircle,
  Printer,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Tag,
  X,
  Star,
  CheckCircle2,
  ListFilter,
  Eye,
  FileText,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Save,
  MessageSquare,
  Activity,
  Layers,
  Check,
  Smile,
  RefreshCw,
} from 'lucide-react';

interface DailyDiaryManagerProps {
  currentUser: User;
  assignedClasses: ClassRoom[];
  selectedClassId: string;
  onSelectClass?: (classId: string) => void;
  students?: Student[];
  onNavigateToTab?: (tab: string) => void;
}

export const DailyDiaryManager: React.FC<DailyDiaryManagerProps> = ({
  currentUser,
  assignedClasses,
  selectedClassId,
  onSelectClass,
  students: propStudents,
  onNavigateToTab,
}) => {
  // Database synchronization tick
  const [dbTick, setDbTick] = useState(0);

  // Active view: default to upgraded automatic activity and reflection system
  const [activeView, setActiveView] = useState<'ACTIVITY_REFLECTION' | 'MILESTONES_EVENTS'>('ACTIVITY_REFLECTION');

  // Active class
  const activeClass = assignedClasses.find(c => c.id === selectedClassId) || assignedClasses[0];
  const students = useMemo(() => {
    if (propStudents && propStudents.length > 0) return propStudents;
    if (!activeClass) return [];
    return db.getAuthorizedStudentsForTeacher(currentUser.id, activeClass.id);
  }, [propStudents, activeClass, currentUser.id]);

  // Date management: default to today's date in local ISO format (or 2026-09-15 if current runtime)
  const systemTodayYmd = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // If today is in 2026, use today, otherwise default to 2026-09-15 for the demo school calendar
    const now = new Date();
    if (now.getFullYear() === 2026) return now.toISOString().split('T')[0];
    return '2026-09-15';
  });

  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // Timeline category filter
  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState<'ALL' | 'INSTRUCTIONAL' | 'ASSESSMENT' | 'COMMUNICATION'>('ALL');

  // Search & Type Filters for manual milestone entries
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | DailyDiaryType | 'PINNED'>('ALL');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for manual milestone entries
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<DailyDiaryType>('QUICK_NOTE');

  // Form Fields for manual milestone entries
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formTime, setFormTime] = useState('09:00 AM');
  const [formPriority, setFormPriority] = useState<DailyDiaryPriority>('MEDIUM');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsShared, setFormIsShared] = useState(false);
  const [formStudentId, setFormStudentId] = useState('');
  const [formMilestoneCategory, setFormMilestoneCategory] = useState<
    'ACADEMIC' | 'BEHAVIORAL' | 'CREATIVE' | 'SOCIAL_EMOTIONAL' | 'LEADERSHIP' | 'SPORTS'
  >('ACADEMIC');
  const [formMoodEmoji, setFormMoodEmoji] = useState('🌟');
  const [formTags, setFormTags] = useState('');
  const [formActionItems, setFormActionItems] = useState<DailyDiaryActionItem[]>([]);
  const [newActionItemText, setNewActionItemText] = useState('');

  // "My Daily Note" state
  const [dailyNoteContent, setDailyNoteContent] = useState('');
  const [dailyNoteMood, setDailyNoteMood] = useState('🌟');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Print/Export Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Teacher's Automatic Daily Work Record for selectedDate
  const dailyWorkRecord = useMemo(() => {
    return db.getTeacherDailyWorkRecord(currentUser.id, selectedDate);
  }, [currentUser.id, selectedDate, dbTick]);

  // Sync "My Daily Note" with current dailyWorkRecord
  useEffect(() => {
    if (dailyWorkRecord.personalNote) {
      setDailyNoteContent(dailyWorkRecord.personalNote.content || '');
      setDailyNoteMood(dailyWorkRecord.personalNote.moodEmoji || '🌟');
    } else {
      setDailyNoteContent('');
      setDailyNoteMood('🌟');
    }
  }, [selectedDate, dailyWorkRecord.personalNote?.id, dailyWorkRecord.personalNote?.updatedAt]);

  // Save "My Daily Note" handler
  const handleSaveDailyNote = () => {
    if (!dailyNoteContent.trim()) {
      showToast('Please type your reflection or note before saving.');
      return;
    }
    setIsSavingNote(true);
    db.saveTeacherDailyNote(
      currentUser.id,
      selectedDate,
      dailyNoteContent.trim(),
      dailyNoteMood,
      ['Reflection', 'DailyDiary'],
      activeClass?.id
    );
    setDbTick(t => t + 1);
    setIsSavingNote(false);
    setNoteSavedFeedback(true);
    showToast('My Daily Note saved and daily progress updated!');
    setTimeout(() => setNoteSavedFeedback(false), 3000);
  };

  // Fetch manual diary entries for active class
  const allEntries = useMemo(() => {
    return db.getDailyDiaryEntries({
      classId: activeClass?.id,
    });
  }, [activeClass?.id, dbTick]);

  // Filtered manual entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (!filterAllDates && entry.date !== selectedDate) {
        return false;
      }
      if (activeTypeFilter === 'PINNED') {
        if (!entry.isPinned) return false;
      } else if (activeTypeFilter !== 'ALL' && entry.type !== activeTypeFilter) {
        return false;
      }
      if (selectedStudentFilter !== 'ALL' && entry.studentId !== selectedStudentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesContent = entry.content.toLowerCase().includes(q);
        const matchesStudent = entry.studentName?.toLowerCase().includes(q) || false;
        const matchesTags = entry.tags?.some(t => t.toLowerCase().includes(q)) || false;
        if (!matchesTitle && !matchesContent && !matchesStudent && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [allEntries, filterAllDates, selectedDate, activeTypeFilter, selectedStudentFilter, searchQuery]);

  // Filtered timeline activities
  const filteredActivities = useMemo(() => {
    if (timelineCategoryFilter === 'ALL') return dailyWorkRecord.activities;
    if (timelineCategoryFilter === 'INSTRUCTIONAL') {
      return dailyWorkRecord.activities.filter(a =>
        ['LESSON_NOTE', 'LESSON_PLAN', 'TOPIC_COMPLETED', 'ATTENDANCE'].includes(a.type)
      );
    }
    if (timelineCategoryFilter === 'ASSESSMENT') {
      return dailyWorkRecord.activities.filter(a =>
        ['ASSIGNMENT', 'ASSESSMENT_SCORES'].includes(a.type)
      );
    }
    if (timelineCategoryFilter === 'COMMUNICATION') {
      return dailyWorkRecord.activities.filter(a =>
        ['PARENT_COMMUNICATION', 'BEHAVIORAL_LOG', 'DAILY_NOTE'].includes(a.type)
      );
    }
    return dailyWorkRecord.activities;
  }, [dailyWorkRecord.activities, timelineCategoryFilter]);

  // Manual milestone statistics
  const manualStats = useMemo(() => {
    const targetSet = filterAllDates ? allEntries : allEntries.filter(e => e.date === selectedDate);
    const events = targetSet.filter(e => e.type === 'CLASSROOM_EVENT').length;
    const milestones = targetSet.filter(e => e.type === 'STUDENT_MILESTONE').length;
    const notes = targetSet.filter(e => e.type === 'QUICK_NOTE').length;
    const pinned = targetSet.filter(e => e.isPinned).length;

    let totalActions = 0;
    let completedActions = 0;
    targetSet.forEach(e => {
      if (e.actionItems) {
        totalActions += e.actionItems.length;
        completedActions += e.actionItems.filter(a => a.completed).length;
      }
    });

    return { events, milestones, notes, pinned, totalActions, completedActions };
  }, [allEntries, filterAllDates, selectedDate]);

  // Date Navigation Helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
    setFilterAllDates(false);
  };

  const handleSetQuickDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setFilterAllDates(false);
  };

  // Open Modal for New Entry
  const handleOpenNewModal = (type: DailyDiaryType) => {
    setEditingEntryId(null);
    setModalType(type);
    setFormDate(selectedDate);
    setFormTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setFormTitle('');
    setFormContent('');
    setFormPriority('MEDIUM');
    setFormIsPinned(false);
    setFormIsShared(type === 'STUDENT_MILESTONE' || type === 'CLASSROOM_EVENT');
    setFormStudentId(students[0]?.id || '');
    setFormMilestoneCategory('ACADEMIC');
    setFormMoodEmoji(type === 'STUDENT_MILESTONE' ? '🌟' : type === 'CLASSROOM_EVENT' ? '🏫' : '📝');
    setFormTags('');
    setFormActionItems([]);
    setNewActionItemText('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (entry: DailyDiaryEntry) => {
    setEditingEntryId(entry.id);
    setModalType(entry.type);
    setFormDate(entry.date);
    setFormTime(entry.time || '09:00 AM');
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormPriority(entry.priority || 'MEDIUM');
    setFormIsPinned(entry.isPinned || false);
    setFormIsShared(entry.isSharedWithParents || false);
    setFormStudentId(entry.studentId || students[0]?.id || '');
    setFormMilestoneCategory(entry.milestoneCategory || 'ACADEMIC');
    setFormMoodEmoji(entry.moodEmoji || '🌟');
    setFormTags(entry.tags?.join(', ') || '');
    setFormActionItems(entry.actionItems ? [...entry.actionItems] : []);
    setNewActionItemText('');
    setIsModalOpen(true);
  };

  // Action Items Management in Modal
  const handleAddActionItem = () => {
    if (!newActionItemText.trim()) return;
    const newItem: DailyDiaryActionItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: newActionItemText.trim(),
      completed: false,
    };
    setFormActionItems(prev => [...prev, newItem]);
    setNewActionItemText('');
  };

  const handleRemoveActionItem = (id: string) => {
    setFormActionItems(prev => prev.filter(i => i.id !== id));
  };

  // Save Manual Entry
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim() || !activeClass) return;

    const selectedStudent = students.find(s => s.id === formStudentId);
    const parsedTags = formTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    const entryData: Omit<DailyDiaryEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      date: formDate,
      time: formTime,
      type: modalType,
      title: formTitle.trim(),
      content: formContent.trim(),
      classId: activeClass.id,
      className: activeClass.name,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      branchId: activeClass.branchId || currentUser.branchId || 'branch_bungalow',
      studentId: modalType === 'STUDENT_MILESTONE' ? selectedStudent?.id : undefined,
      studentName: modalType === 'STUDENT_MILESTONE' ? selectedStudent?.fullName : undefined,
      milestoneCategory: modalType === 'STUDENT_MILESTONE' ? formMilestoneCategory : undefined,
      moodEmoji: formMoodEmoji,
      tags: parsedTags,
      priority: formPriority,
      isPinned: formIsPinned,
      isSharedWithParents: formIsShared,
      actionItems: formActionItems.length > 0 ? formActionItems : undefined,
    };

    if (editingEntryId) {
      db.saveDailyDiaryEntry({ id: editingEntryId, ...entryData });
      showToast('Entry updated successfully');
    } else {
      db.saveDailyDiaryEntry(entryData);
      showToast('New entry recorded in Daily Diary');
    }

    setDbTick(prev => prev + 1);
    setIsModalOpen(false);
  };

  // Delete Manual Entry
  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      db.deleteDailyDiaryEntry(id);
      setDbTick(prev => prev + 1);
      showToast('Entry removed from Daily Diary');
    }
  };

  // Toggle Pinned
  const handleTogglePin = (entry: DailyDiaryEntry) => {
    db.saveDailyDiaryEntry({ ...entry, isPinned: !entry.isPinned });
    setDbTick(prev => prev + 1);
  };

  // Toggle Action Item Checkbox
  const handleToggleActionItem = (entryId: string, actionItemId: string) => {
    db.toggleDiaryActionItem(entryId, actionItemId);
    setDbTick(prev => prev + 1);
  };

  // Helper for activity type rendering
  const getActivityTypeConfig = (type: TeacherDailyActivityType) => {
    switch (type) {
      case 'ATTENDANCE':
        return {
          icon: CheckSquare,
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotBg: 'bg-emerald-600 text-white',
          label: 'Attendance',
        };
      case 'LESSON_NOTE':
        return {
          icon: BookOpen,
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          dotBg: 'bg-blue-600 text-white',
          label: 'Lesson Note',
        };
      case 'LESSON_PLAN':
        return {
          icon: FileText,
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dotBg: 'bg-indigo-600 text-white',
          label: 'Lesson Plan',
        };
      case 'ASSIGNMENT':
        return {
          icon: Award,
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          dotBg: 'bg-purple-600 text-white',
          label: 'Assignment',
        };
      case 'ASSESSMENT_SCORES':
        return {
          icon: Star,
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          dotBg: 'bg-sky-600 text-white',
          label: 'Assessment Scores',
        };
      case 'BEHAVIORAL_LOG':
        return {
          icon: AlertCircle,
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          dotBg: 'bg-amber-500 text-white',
          label: 'Behavioral Observation',
        };
      case 'COMMUNICATION':
        return {
          icon: MessageSquare,
          badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
          dotBg: 'bg-teal-600 text-white',
          label: 'Communication',
        };
      case 'TOPIC_COMPLETION':
        return {
          icon: CheckCircle2,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          dotBg: 'bg-rose-600 text-white',
          label: 'Curriculum Topic',
        };
      case 'DAILY_NOTE':
        return {
          icon: Sparkles,
          badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
          dotBg: 'bg-violet-600 text-white',
          label: 'Daily Reflection',
        };
      default:
        return {
          icon: Activity,
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          dotBg: 'bg-slate-700 text-white',
          label: 'Activity',
        };
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200" id="teacher-daily-diary-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="daily-diary-toast"
          className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-bold border border-slate-700 animate-in slide-in-from-top-4"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Top Header Card with View Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Teacher Daily Diary</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{dailyWorkRecord.teacherName}</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {dailyWorkRecord.formClassName ? `Primary: ${dailyWorkRecord.formClassName}` : activeClass?.name || 'Assigned Classes'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200">
                {dailyWorkRecord.branchName}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Daily Activity & Teacher Reflection
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Your personal daily record answering: <strong className="text-slate-800 font-semibold">«What did I accomplish today on the ZITEL CASTLE SCHOOL system?»</strong> Combining automatic system activity records with your personal reflections.
            </p>
          </div>

          {/* Quick Actions & View Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Mode Selector Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                id="tab-view-activity-reflection"
                type="button"
                onClick={() => setActiveView('ACTIVITY_REFLECTION')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeView === 'ACTIVITY_REFLECTION'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Daily Activity & Note</span>
              </button>
              <button
                id="tab-view-milestones-events"
                type="button"
                onClick={() => setActiveView('MILESTONES_EVENTS')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeView === 'MILESTONES_EVENTS'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Pupil Milestones & Events</span>
              </button>
            </div>

            <button
              id="btn-print-daily-diary"
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>
          </div>
        </div>

        {/* Date Selector Navigation Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-1">Day Selector:</span>
            
            {/* Quick buttons */}
            <button
              id="btn-quick-date-today"
              type="button"
              onClick={() => handleSetQuickDate(systemTodayYmd)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === systemTodayYmd
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              id="btn-quick-date-yesterday"
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                handleSetQuickDate(y.toISOString().split('T')[0]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === (() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  return y.toISOString().split('T')[0];
                })()
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Yesterday
            </button>
            <button
              id="btn-quick-date-school-demo"
              type="button"
              onClick={() => handleSetQuickDate('2026-09-15')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === '2026-09-15'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              15 Sep 2026 (Active)
            </button>

            {/* Date shift controls */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                id="btn-diary-prev-day"
                type="button"
                onClick={() => handleShiftDate(-1)}
                title="Previous Day"
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                id="input-diary-date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 font-bold text-xs text-slate-800 px-2 py-1 focus:outline-hidden cursor-pointer"
              />
              <button
                id="btn-diary-next-day"
                type="button"
                onClick={() => handleShiftDate(1)}
                title="Next Day"
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-slate-900">{dailyWorkRecord.dateFormatted}</span>
            {selectedDate === systemTodayYmd && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Current Date
              </span>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: AUTOMATIC ACTIVITY TIMELINE & TEACHER REFLECTION SYSTEM
          ========================================================================= */}
      {activeView === 'ACTIVITY_REFLECTION' && (
        <div className="space-y-6">
          {/* A. TODAY'S PROGRESS / COMPLETION STATUS CARD */}
          <div
            id="teacher-daily-progress-card"
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    Daily Instructional Duties
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {dailyWorkRecord.completedTasksCount} of {dailyWorkRecord.totalAssignedCount} obligations fulfilled
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {dailyWorkRecord.totalAssignedCount === 0
                    ? 'No Instructional Tasks Scheduled (Weekend)'
                    : `${dailyWorkRecord.completionPercentage}% of today's assigned duties completed`}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    {dailyWorkRecord.totalAssignedCount === 0 ? '—' : `${dailyWorkRecord.completionPercentage}%`}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {dailyWorkRecord.completionPercentage === 100
                      ? 'All Tasks Complete'
                      : dailyWorkRecord.completionPercentage > 0
                      ? 'In Progress'
                      : 'Pending Start'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {dailyWorkRecord.completionPercentage === 100 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            {dailyWorkRecord.totalAssignedCount > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dailyWorkRecord.completionPercentage === 100
                        ? 'bg-emerald-600'
                        : dailyWorkRecord.completionPercentage >= 50
                        ? 'bg-indigo-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${dailyWorkRecord.completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                  <span>Start of Day</span>
                  <span>{dailyWorkRecord.completionStatusText}</span>
                  <span>100% Target</span>
                </div>
              </div>
            )}

            {/* Assigned Tasks Breakdown Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {dailyWorkRecord.assignedTasks.map((task, idx) => (
                <div
                  key={task.taskId || idx}
                  id={`daily-task-status-${task.taskId}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    task.completed
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          task.completed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {task.completed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className="font-bold text-xs text-slate-900">{task.taskName}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        task.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.completed ? 'Done' : 'Pending'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {task.completed
                      ? task.completionDetails || 'Fulfilled today'
                      : 'Not yet recorded for this date'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {task.completed && task.completedAt ? task.completedAt : 'Action Needed'}
                    </span>
                    {task.actionLink && onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => {
                          if (task.actionLink === 'daily_diary') {
                            const el = document.getElementById('section-my-daily-note');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            onNavigateToTab(task.actionLink!);
                          }
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{task.completed ? 'View' : 'Execute'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. TODAY'S ACTIVITY TIMELINE (AUTOMATICALLY COMPILED) */}
          <div
            id="teacher-daily-activity-timeline"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    System Activity Log
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-500">
                    {dailyWorkRecord.activities.length} logged today
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Today's Activity Timeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological record compiled automatically from your instructional delivery, assessments, and communication.
                </p>
              </div>

              {/* Timeline Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {[
                  { id: 'ALL', label: 'All Activities' },
                  { id: 'INSTRUCTIONAL', label: 'Instruction' },
                  { id: 'ASSESSMENT', label: 'Assessments' },
                  { id: 'COMMUNICATION', label: 'Communication' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setTimelineCategoryFilter(filter.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timelineCategoryFilter === filter.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            {filteredActivities.length === 0 ? (
              <div
                id="daily-diary-timeline-empty"
                className="py-14 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                  📜
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <div className="font-bold text-slate-800 text-sm">
                    No activities recorded yet for this date
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    As you mark attendance, submit lesson notes, publish assignments, record scores, or communicate with parents, your accomplishments will appear here automatically.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {onNavigateToTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('attendance')}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Mark Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('lesson_notes')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Draft Lesson Note
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {filteredActivities.map((act) => {
                  const cfg = getActivityTypeConfig(act.type);
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={act.id}
                      id={`activity-item-${act.id}`}
                      className="relative group"
                    >
                      {/* Timeline Dot Node */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center shadow-xs border-2 border-white transition-transform group-hover:scale-110 ${cfg.dotBg}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Content Card */}
                      <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 transition-all space-y-2 hover:shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              {act.timeFormatted}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
                              {cfg.label}
                            </span>
                            {act.className && (
                              <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                {act.className}
                              </span>
                            )}
                            {act.subjectName && (
                              <span className="text-xs font-semibold text-slate-500">
                                • {act.subjectName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {act.status && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                {act.status}
                              </span>
                            )}
                            {act.referenceTab && onNavigateToTab && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (act.referenceTab === 'daily_diary') {
                                    const el = document.getElementById('section-my-daily-note');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                  } else {
                                    onNavigateToTab(act.referenceTab!);
                                  }
                                }}
                                title="Open in Module"
                                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="font-bold text-slate-900 text-sm">
                          {act.title}
                        </div>

                        {act.description && (
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* C. CONCISE SUMMARY AT END OF DAY CARD */}
          <div
            id="teacher-daily-concise-summary"
            className="bg-indigo-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-950 shadow-md space-y-4"
          >
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-800/80 text-indigo-200 border border-indigo-700">
                End-of-Day Pedagogical Synthesis
              </span>
              <span className="text-xs text-indigo-300 font-bold">{dailyWorkRecord.dateFormatted}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white">
              {dailyWorkRecord.conciseSummary.headline}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-800/60 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Work Completed Today</span>
                </div>
                <div className="text-xs text-indigo-100 leading-relaxed space-y-1.5">
                  {dailyWorkRecord.conciseSummary.completedItemsBulletList.length === 0 ? (
                    <span className="text-indigo-300">No completed items logged yet for this date.</span>
                  ) : (
                    dailyWorkRecord.conciseSummary.completedItemsBulletList.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-800/60 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span>Outstanding & Prioritized Follow-Ups</span>
                </div>
                <div className="text-xs text-indigo-100 leading-relaxed space-y-1.5">
                  {dailyWorkRecord.conciseSummary.outstandingItemsBulletList.length === 0 ? (
                    <span className="text-emerald-300 font-semibold">All daily obligations fulfilled!</span>
                  ) : (
                    dailyWorkRecord.conciseSummary.outstandingItemsBulletList.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-300 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* D. "MY DAILY NOTE" (TEACHER-ENTERED REFLECTION) */}
          <div
            id="section-my-daily-note"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    Teacher Reflection
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-500">
                    {dailyWorkRecord.personalNote ? 'Reflected & Recorded' : 'Pending Entry'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  My Daily Note & Reflection
                </h3>
                <p className="text-xs text-slate-500">
                  Reflect on instructional delivery, student milestones, topics needing reinforcement, or goals for tomorrow.
                </p>
              </div>

              {dailyWorkRecord.personalNote?.updatedAt && (
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400">
                    Last Saved: {new Date(dailyWorkRecord.personalNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Mood Selector Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Daily Tone / Pedagogical Mood:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { emoji: '🌟', label: 'Productive' },
                  { emoji: '😊', label: 'Great Engagement' },
                  { emoji: '🎯', label: 'Focused Delivery' },
                  { emoji: '💡', label: 'Inspiring Breakthroughs' },
                  { emoji: '📚', label: 'Content Heavy' },
                  { emoji: '☕', label: 'Reflective & Analytical' },
                ].map(item => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => setDailyNoteMood(item.emoji)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dailyNoteMood === item.emoji
                        ? 'bg-indigo-600 text-white shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Textarea */}
            <div className="space-y-2">
              <label htmlFor="input-teacher-daily-note" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Notes, Observations & Plans for Tomorrow:
              </label>
              <textarea
                id="input-teacher-daily-note"
                rows={4}
                value={dailyNoteContent}
                onChange={e => setDailyNoteContent(e.target.value)}
                placeholder="What went particularly well today? Which concepts required extra explanation? Note any pupil who demonstrated exceptional engagement or who needs remedial attention tomorrow..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed font-normal"
              />
            </div>

            {/* Quick Starters / Suggested Focus Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Quick inserts:</span>
              {[
                'Pupils showed high enthusiasm during collaborative group tasks.',
                'Fractions numerator/denominator concept well grasped; word problems need more review.',
                'Organized paired peer reviews for letter salutations and addresses.',
                'Tobi Adebayo and Zainab Balogun led class problem solving exemplary.',
              ].map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDailyNoteContent(prev => prev ? `${prev} ${starter}` : starter);
                  }}
                  className="text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  + {starter.substring(0, 42)}...
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                {dailyNoteContent.length} characters entered
              </div>
              <div className="flex items-center space-x-3">
                {noteSavedFeedback && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved!</span>
                  </span>
                )}
                <button
                  id="btn-save-teacher-daily-note"
                  type="button"
                  disabled={isSavingNote}
                  onClick={handleSaveDailyNote}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingNote ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Daily Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CLASSROOM MILESTONES & EVENTS (EXISTING RICH FUNCTIONALITY)
          ========================================================================= */}
      {activeView === 'MILESTONES_EVENTS' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                🏫
              </div>
              <div>
                <div className="text-lg font-black text-indigo-950 leading-none">{manualStats.events}</div>
                <div className="text-[11px] font-bold text-indigo-600 mt-1 uppercase tracking-wide">Class Events</div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                🌟
              </div>
              <div>
                <div className="text-lg font-black text-amber-950 leading-none">{manualStats.milestones}</div>
                <div className="text-[11px] font-bold text-amber-700 mt-1 uppercase tracking-wide">Milestones</div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                📝
              </div>
              <div>
                <div className="text-lg font-black text-emerald-950 leading-none">{manualStats.notes}</div>
                <div className="text-[11px] font-bold text-emerald-700 mt-1 uppercase tracking-wide">Quick Notes</div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-none">
                  {manualStats.completedActions}/{manualStats.totalActions}
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Tasks Done</div>
              </div>
            </div>
          </div>

          {/* Creation Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-500">Date Scope:</label>
              <button
                type="button"
                onClick={() => setFilterAllDates(!filterAllDates)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterAllDates
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filterAllDates ? 'Viewing All Dates' : `Only ${selectedDate}`}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-add-classroom-event"
                type="button"
                onClick={() => handleOpenNewModal('CLASSROOM_EVENT')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Event</span>
              </button>

              <button
                id="btn-celebrate-milestone"
                type="button"
                onClick={() => handleOpenNewModal('STUDENT_MILESTONE')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Celebrate Milestone</span>
              </button>

              <button
                id="btn-add-quick-note"
                type="button"
                onClick={() => handleOpenNewModal('QUICK_NOTE')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Note</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
            {/* Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'ALL', label: 'All Logs', icon: BookOpen },
                { id: 'CLASSROOM_EVENT', label: '🏫 Events', icon: Calendar },
                { id: 'STUDENT_MILESTONE', label: '🌟 Milestones', icon: Award },
                { id: 'QUICK_NOTE', label: '📝 Quick Notes', icon: CheckSquare },
                { id: 'PINNED', label: '📌 Pinned', icon: Pin },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  id={`filter-tab-${tab.id.toLowerCase()}`}
                  onClick={() => setActiveTypeFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTypeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Student Filter & Search Box */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  id="filter-diary-student"
                  value={selectedStudentFilter}
                  onChange={e => setSelectedStudentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Students</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="input-diary-search"
                  type="text"
                  placeholder="Search title, student, #tags..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Manual Diary Entry Feed */}
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                📖
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <div className="font-bold text-slate-800 text-base">
                  No classroom entries recorded
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Log key instructional milestones, pupil celebrations, or classroom notes to track pedagogical journey.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenNewModal('CLASSROOM_EVENT')}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Log First Event
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenNewModal('STUDENT_MILESTONE')}
                  className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Celebrate Milestone
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEntries.map(entry => (
                <div
                  key={entry.id}
                  id={`diary-card-${entry.id}`}
                  className={`bg-white rounded-3xl p-5 border transition-all space-y-3 relative hover:shadow-md ${
                    entry.isPinned ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10' : 'border-slate-200/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl shrink-0">{entry.moodEmoji || '📝'}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              entry.type === 'STUDENT_MILESTONE'
                                ? 'bg-amber-100 text-amber-800'
                                : entry.type === 'CLASSROOM_EVENT'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {entry.type.replace('_', ' ')}
                          </span>
                          {entry.milestoneCategory && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {entry.milestoneCategory}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{entry.title}</h4>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(entry)}
                        title={entry.isPinned ? 'Unpin' : 'Pin to top'}
                        className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          entry.isPinned
                            ? 'text-amber-600 bg-amber-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(entry)}
                        title="Edit Entry"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Delete Entry"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pupil tag if milestone */}
                  {entry.studentName && (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-xl w-fit">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pupil: {entry.studentName}</span>
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                    {entry.content}
                  </p>

                  {/* Action items checklist if present */}
                  {entry.actionItems && entry.actionItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Action Items / Follow-ups:
                      </div>
                      <div className="space-y-1">
                        {entry.actionItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleActionItem(entry.id, item.id)}
                            className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer group"
                          >
                            {item.completed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                            )}
                            <span className={item.completed ? 'line-through text-slate-400' : ''}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{entry.date} {entry.time ? `• ${entry.time}` : ''}</span>
                    </div>
                    {entry.isSharedWithParents && (
                      <span className="text-indigo-600 font-bold flex items-center space-x-1">
                        <Share2 className="w-3 h-3" />
                        <span>Shared</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE / EDIT MANUAL ENTRY
          ========================================================================= */}
      {isModalOpen && (
        <div
          id="modal-diary-entry"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">
                  {modalType === 'STUDENT_MILESTONE' ? '🌟' : modalType === 'CLASSROOM_EVENT' ? '🏫' : '📝'}
                </span>
                <h3 className="font-black text-slate-900 text-base">
                  {editingEntryId ? 'Edit Entry' : modalType === 'STUDENT_MILESTONE' ? 'Record Student Milestone' : modalType === 'CLASSROOM_EVENT' ? 'Log Classroom Event' : 'Add Quick Note'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex rounded-2xl bg-slate-100 p-1">
                {(['QUICK_NOTE', 'STUDENT_MILESTONE', 'CLASSROOM_EVENT'] as DailyDiaryType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setModalType(t)}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      modalType === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t === 'QUICK_NOTE' ? 'Quick Note' : t === 'STUDENT_MILESTONE' ? 'Milestone' : 'Event'}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Science Experiment Breakthrough or Outstanding Reading Pace"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Student Picker if Milestone */}
              {modalType === 'STUDENT_MILESTONE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Pupil</label>
                    <select
                      value={formStudentId}
                      onChange={e => setFormStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={formMilestoneCategory}
                      onChange={e => setFormMilestoneCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ACADEMIC">Academic Excellence</option>
                      <option value="BEHAVIORAL">Positive Behavior</option>
                      <option value="CREATIVE">Creative Expression</option>
                      <option value="SOCIAL_EMOTIONAL">Social-Emotional</option>
                      <option value="LEADERSHIP">Leadership & Service</option>
                      <option value="SPORTS">Athletics & Physical</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Content / Observation Details</label>
                <textarea
                  rows={3}
                  required
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="Describe the incident, classroom observation, student accomplishment, or notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Action Items List Builder */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Checklist / Follow-up Action Items</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newActionItemText}
                    onChange={e => setNewActionItemText(e.target.value)}
                    placeholder="Add task (e.g. Follow up with parent, Provide remedial sheet)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddActionItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {formActionItems.length > 0 && (
                  <div className="space-y-1 pt-1 max-h-24 overflow-y-auto">
                    {formActionItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="text-slate-700">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveActionItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {editingEntryId ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT / EXPORT PREVIEW MODAL
          ========================================================================= */}
      {isPrintModalOpen && (
        <div
          id="modal-print-daily-diary"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 print:m-0 print:p-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Daily Activity & Pedagogical Diary Summary</h3>
                <p className="text-xs text-slate-500">Official teacher work verification report for supervisory and academic records.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="space-y-5 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-base font-black text-indigo-900">ZITEL CASTLE SCHOOL</div>
                  <div className="text-[11px] font-bold text-slate-500">Teacher Daily Accomplishment & Pedagogical Record</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{dailyWorkRecord.dateFormatted}</div>
                  <div className="text-[11px] text-slate-500">{dailyWorkRecord.branchName}</div>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Teacher:</span>
                  <span className="font-black text-slate-900">{dailyWorkRecord.teacherName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Class:</span>
                  <span className="font-bold text-slate-800">{dailyWorkRecord.formClassName || 'Primary Section'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Duties Completed:</span>
                  <span className="font-black text-emerald-700">{dailyWorkRecord.completionPercentage}% ({dailyWorkRecord.completedTasksCount}/{dailyWorkRecord.totalAssignedCount})</span>
                </div>
              </div>

              {/* Progress Statement */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="font-black text-slate-900 text-sm">
                  {dailyWorkRecord.conciseSummary.headline}
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  <strong className="text-slate-800">Accomplished:</strong> {dailyWorkRecord.conciseSummary.completedItemsBulletList.length > 0 ? dailyWorkRecord.conciseSummary.completedItemsBulletList.join('; ') : 'None'}
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  <strong className="text-slate-800">Outstanding:</strong> {dailyWorkRecord.conciseSummary.outstandingItemsBulletList.length > 0 ? dailyWorkRecord.conciseSummary.outstandingItemsBulletList.join('; ') : 'None (all duties complete)'}
                </div>
              </div>

              {/* Timeline Table */}
              <div className="space-y-2">
                <div className="font-black text-slate-800 uppercase text-[10px] tracking-wider">
                  Verified Chronological Action Log ({dailyWorkRecord.activities.length} entries):
                </div>
                <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {dailyWorkRecord.activities.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No activity logged for this date.</div>
                  ) : (
                    dailyWorkRecord.activities.map((a) => (
                      <div key={a.id} className="p-2.5 flex items-start justify-between gap-3 text-[11px]">
                        <div className="flex items-start space-x-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {a.timeFormatted}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">[{a.type.replace('_', ' ')}] {a.title}</span>
                            {a.description && <p className="text-slate-500 text-[10px] mt-0.5">{a.description}</p>}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700">{a.status || 'VERIFIED'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reflection Note if present */}
              {dailyWorkRecord.personalNote && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-black text-slate-900 text-xs flex items-center space-x-1.5">
                    <span>{dailyWorkRecord.personalNote.moodEmoji || '📝'}</span>
                    <span>Teacher Reflection & Pedagogical Observations:</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed whitespace-pre-line">
                    {dailyWorkRecord.personalNote.content}
                  </p>
                </div>
              )}

              {/* Sign-off footer */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-[11px]">
                <div className="border-t border-dashed border-slate-400 pt-2 text-slate-600">
                  Teacher Signature: _______________________
                </div>
                <div className="border-t border-dashed border-slate-400 pt-2 text-slate-600 text-right">
                  Head of School / Supervisor Sign-off: _______________________
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
