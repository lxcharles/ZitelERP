import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  GraduationCap,
  CalendarDays,
  ChevronRight,
  Filter,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { db } from '../../services/db';
import { User, CalendarEvent, Assessment, Assignment } from '../../types';

export interface DashboardCalendarWidgetProps {
  currentUser: User;
  onOpenFullCalendar?: () => void;
  compact?: boolean;
}

export interface UnifiedCalendarItem {
  id: string;
  itemType: 'EVENT' | 'ASSESSMENT' | 'HOMEWORK';
  title: string;
  date: string;
  time?: string;
  category: string;
  subjectName?: string;
  className?: string;
  teacherName?: string;
  description?: string;
  isToday: boolean;
  relativeLabel: string;
  daysUntil: number;
  googleCalendarUrl?: string;
}

export const DashboardCalendarWidget: React.FC<DashboardCalendarWidgetProps> = ({
  currentUser,
  onOpenFullCalendar,
  compact = false,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'EVENTS' | 'ASSESSMENTS'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const termContext = useMemo(() => db.getTermContext(), []);
  const todayYMD = termContext.todayDate || new Date().toISOString().split('T')[0];
  const branchId = currentUser.branchId || db.getActiveBranchId();

  // Helper for relative labels
  const computeRelative = (dateStr: string) => {
    const todayMs = new Date(todayYMD + 'T00:00:00').getTime();
    const targetMs = new Date(dateStr + 'T00:00:00').getTime();
    const diffDays = Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', days: 0, isToday: true };
    if (diffDays === 1) return { label: 'Tomorrow', days: 1, isToday: false };
    if (diffDays === -1) return { label: 'Yesterday', days: -1, isToday: false };
    if (diffDays > 1 && diffDays <= 7) return { label: `In ${diffDays} days`, days: diffDays, isToday: false };
    if (diffDays > 7) return { label: `In ${Math.ceil(diffDays / 7)} wks`, days: diffDays, isToday: false };
    return { label: `${Math.abs(diffDays)}d ago`, days: diffDays, isToday: false };
  };

  // Aggregated unified feed
  const items = useMemo(() => {
    const unified: UnifiedCalendarItem[] = [];

    // 1. School Events
    const rawEvents = db.getCalendarEvents(branchId, undefined, undefined, termContext.term?.id, currentUser.role);
    rawEvents.forEach(e => {
      if (!e.date) return;
      const rel = computeRelative(e.date);
      unified.push({
        id: `ev_${e.id}`,
        itemType: 'EVENT',
        title: e.title,
        date: e.date,
        time: e.startTime ? `${e.startTime}${e.endTime ? ` - ${e.endTime}` : ''}` : undefined,
        category: e.category || e.type || 'School Event',
        description: e.description,
        isToday: rel.isToday,
        relativeLabel: rel.label,
        daysUntil: rel.days,
        googleCalendarUrl: db.generateGoogleCalendarLink(e),
      });
    });

    // 2. Teacher-set Assessments (Continuous Assessment tests, projects, exams)
    const assessments = db.getAssessments();
    assessments.forEach(a => {
      const date = a.date;
      if (!date) return;

      // Filter by student / parent class if applicable
      if (currentUser.role === 'STUDENT') {
        const student = db.getStudents().find(s => s.id === currentUser.id);
        if (student && a.classId && a.classId !== student.classId) return;
      }

      const rel = computeRelative(date);
      const title = `${a.subjectName}: ${a.title}`;
      const desc = `Class: ${a.className} | Max Score: ${a.maxScore} pts ${a.weightPercent ? `(${a.weightPercent}% weight)` : ''}`;
      
      // Generate Google Calendar Link for assessment deadline
      const calDate = date.replace(/-/g, '');
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${calDate}/${calDate}&details=${encodeURIComponent(desc)}`;

      unified.push({
        id: `asm_${a.id}`,
        itemType: 'ASSESSMENT',
        title: a.title,
        date: date,
        category: a.category || 'Assessment Test',
        subjectName: a.subjectName,
        className: a.className,
        description: desc,
        isToday: rel.isToday,
        relativeLabel: rel.label,
        daysUntil: rel.days,
        googleCalendarUrl: googleUrl,
      });
    });

    // 3. Teacher-set Homework / Tasks with due dates
    const assignments = db.getAssignments();
    assignments.forEach(asg => {
      if (!asg.dueDate) return;

      // Role class relevance filter
      if (currentUser.role === 'STUDENT') {
        const student = db.getStudents().find(s => s.id === currentUser.id);
        if (student && asg.classId && asg.classId !== student.classId) return;
      }

      const rel = computeRelative(asg.dueDate);
      const title = `Deadline: ${asg.subjectName} - ${asg.title}`;
      const desc = `Homework task for ${asg.className} set by ${asg.teacherName}. ${asg.description || ''}`;
      const calDate = asg.dueDate.replace(/-/g, '');
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${calDate}/${calDate}&details=${encodeURIComponent(desc)}`;

      unified.push({
        id: `asg_${asg.id}`,
        itemType: 'HOMEWORK',
        title: asg.title,
        date: asg.dueDate,
        category: 'Homework Deadline',
        subjectName: asg.subjectName,
        className: asg.className,
        teacherName: asg.teacherName,
        description: asg.description,
        isToday: rel.isToday,
        relativeLabel: rel.label,
        daysUntil: rel.days,
        googleCalendarUrl: googleUrl,
      });
    });

    // Sort by date ascending (nearest first)
    return unified.sort((a, b) => a.date.localeCompare(b.date));
  }, [branchId, currentUser, termContext, todayYMD]);

  // Upcoming items from today onwards
  const upcomingItems = useMemo(() => {
    return items.filter(item => item.date >= todayYMD);
  }, [items, todayYMD]);

  // Filtered by Category
  const displayItems = useMemo(() => {
    let list = upcomingItems;
    if (filterType === 'EVENTS') {
      list = list.filter(i => i.itemType === 'EVENT');
    } else if (filterType === 'ASSESSMENTS') {
      list = list.filter(i => i.itemType === 'ASSESSMENT' || i.itemType === 'HOMEWORK');
    }

    if (selectedDate) {
      list = list.filter(i => i.date === selectedDate);
    }

    return list.slice(0, compact ? 4 : 6);
  }, [upcomingItems, filterType, selectedDate, compact]);

  // Count badges
  const eventsCount = useMemo(() => upcomingItems.filter(i => i.itemType === 'EVENT').length, [upcomingItems]);
  const deadlinesCount = useMemo(() => upcomingItems.filter(i => i.itemType === 'ASSESSMENT' || i.itemType === 'HOMEWORK').length, [upcomingItems]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return {
        month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
        day: d.getDate(),
        weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      };
    } catch {
      return { month: 'DATE', day: '--', weekday: '' };
    }
  };

  return (
    <div id="dashboard-calendar-widget" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Widget Header Banner */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  School Schedule & Academic Deadlines
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {termContext.termName || 'Active Term'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Upcoming Events & Assessment Deadlines
              </h3>
            </div>
          </div>

          {onOpenFullCalendar && (
            <button
              onClick={onOpenFullCalendar}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              id="btn-view-full-school-calendar"
            >
              <span>Full Calendar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Aggregation Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Today</span>
            <p className="font-bold text-white mt-0.5 truncate">{termContext.todayFormatted || todayYMD}</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium uppercase">School Events</span>
            <p className="font-bold text-amber-300 mt-0.5">{eventsCount} Scheduled</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Assessment Deadlines</span>
            <p className="font-bold text-rose-300 mt-0.5">{deadlinesCount} Upcoming</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Term Closure</span>
            <p className="font-bold text-indigo-300 mt-0.5">
              {termContext.daysRemaining > 0 ? `${termContext.daysRemaining} days left` : 'Term Concluded'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setFilterType('ALL'); setSelectedDate(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            All Items ({upcomingItems.length})
          </button>

          <button
            onClick={() => { setFilterType('EVENTS'); setSelectedDate(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'EVENTS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>School Events ({eventsCount})</span>
          </button>

          <button
            onClick={() => { setFilterType('ASSESSMENTS'); setSelectedDate(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ASSESSMENTS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Deadlines ({deadlinesCount})</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium shrink-0">
          Showing nearest upcoming
        </span>
      </div>

      {/* Feed List */}
      <div className="p-4 sm:p-6 space-y-2.5">
        {displayItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No scheduled events or deadlines found</p>
            <p className="text-[11px] text-slate-400">
              There are no pending items matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayItems.map(item => {
              const dt = formatDateDisplay(item.date);
              const isDeadline = item.itemType === 'ASSESSMENT' || item.itemType === 'HOMEWORK';

              return (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-3 my-0.5 transition-colors w-full"
                >
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    {/* Date Block */}
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                        item.isToday
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : isDeadline
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wide opacity-90 leading-none">
                        {dt.month}
                      </span>
                      <span className="text-base font-black leading-none mt-0.5">
                        {dt.day}
                      </span>
                      <span className="text-[8px] font-semibold opacity-75 leading-none mt-0.5">
                        {dt.weekday}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {/* Type badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            item.itemType === 'ASSESSMENT'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : item.itemType === 'HOMEWORK'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {item.itemType === 'ASSESSMENT'
                            ? 'Exam / Test'
                            : item.itemType === 'HOMEWORK'
                            ? 'Assignment'
                            : 'School Event'}
                        </span>

                        {/* Relative label */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.isToday
                              ? 'bg-amber-500 text-white animate-pulse'
                              : item.daysUntil <= 2
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.relativeLabel}
                        </span>

                        {item.className && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.className}
                          </span>
                        )}

                        {item.subjectName && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {item.subjectName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                        {item.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.time}</span>
                          </span>
                        )}
                        {item.teacherName && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            <span>Set by: {item.teacherName}</span>
                          </span>
                        )}
                        {item.description && (
                          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Google Calendar Link */}
                  {item.googleCalendarUrl && (
                    <div className="self-end sm:self-center shrink-0">
                      <a
                        href={item.googleCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-semibold transition-colors border border-slate-200"
                        title="Add to Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Google Cal</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
