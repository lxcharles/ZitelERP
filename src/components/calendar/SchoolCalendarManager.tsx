import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Users,
  Shield,
  FileText,
  History,
  Sparkles,
  ArrowRight,
  Info,
  CalendarCheck,
  Check,
  X,
  Printer,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { db } from '../../services/db';
import {
  User,
  CalendarEvent,
  AcademicSession,
  AcademicTermConfig,
  CalendarEventCategory,
  CalendarAudience,
  AcademicTermType
} from '../../types';
import { isSuperAdmin, isDirector } from '../../utils/roles';

interface SchoolCalendarManagerProps {
  currentUser: User;
  onNavigateToTab?: (tab: string) => void;
}

export const SchoolCalendarManager: React.FC<SchoolCalendarManagerProps> = ({
  currentUser,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'TERMS' | 'UPLOAD' | 'GOOGLE_SYNC' | 'AUDIT'>('CALENDAR');
  const [viewMode, setViewMode] = useState<'MONTH' | 'AGENDA'>('MONTH');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-02T00:00:00'));
  
  // Filters
  const [selectedTermId, setSelectedTermId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showTermEditModal, setShowTermEditModal] = useState<boolean>(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTermConfig | null>(null);
  const [showTransitionModal, setShowTransitionModal] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishNotes, setPublishNotes] = useState<string>('Updated official term calendar schedule.');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string | null>(null);

  // Upload/Extractor State
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [extractedEvents, setExtractedEvents] = useState<Array<Omit<CalendarEvent, 'id'>>>([]);
  const [extractedTermDates, setExtractedTermDates] = useState<{
    firstTermOpening: string;
    firstTermClosing: string;
    secondTermOpening: string;
    secondTermClosing: string;
    thirdTermOpening: string;
    thirdTermClosing: string;
  }>({
    firstTermOpening: '2026-09-14',
    firstTermClosing: '2026-12-18',
    secondTermOpening: '2027-01-11',
    secondTermClosing: '2027-04-09',
    thirdTermOpening: '2027-04-26',
    thirdTermClosing: '2027-07-23',
  });

  // Permissions
  const canManage = isSuperAdmin(currentUser) || isDirector(currentUser) || currentUser.role === 'ADMIN';
  const isSuper = isSuperAdmin(currentUser);

  // Data
  const sessions = db.getAcademicSessions();
  const activeSession = db.getActiveAcademicSession();
  const activeTerm = db.getActiveTerm();
  const termContext = db.getTermContext(currentDate.toISOString().split('T')[0]);
  const branches = db.getBranches();
  const allEvents = db.getCalendarEvents(
    selectedBranchId !== 'all' ? selectedBranchId : undefined,
    undefined,
    selectedCategory !== 'all' ? (selectedCategory as CalendarEventCategory) : undefined,
    selectedTermId !== 'all' ? selectedTermId : undefined,
    selectedAudience !== 'all' ? selectedAudience : undefined
  );
  const auditLogs = db.getAuditLogs().filter(
    l => l.resourceType === 'AcademicSession' || l.resourceType === 'AcademicTerm' || l.resourceType === 'CalendarEvent'
  );
  const googleSync = db.getGoogleCalendarSync();

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Filtered events by search
  const filteredEvents = allEvents.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.termName && e.termName.toLowerCase().includes(q))
    );
  });

  // Calendar Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const getEventsForDay = (date: Date) => {
    const ymd = date.toISOString().split('T')[0];
    return filteredEvents.filter(e => {
      if (e.date === ymd) return true;
      if (e.endDate && ymd >= e.date && ymd <= e.endDate) return true;
      return false;
    });
  };

  const getCategoryBadgeClass = (category?: string, type?: string) => {
    const key = category || type || '';
    switch (key) {
      case 'EXAMINATION':
      case 'MIDTERM_TEST':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'HOLIDAY':
      case 'MIDTERM_BREAK':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'TERM_DATES':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'STAFF_MEETING':
      case 'PTA_MEETING':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'SPORTS':
      case 'EXCURSION':
      case 'CULTURAL':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'RESULT_RELEASE':
      case 'RESULT_COMPILATION':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  const handleExportICS = () => {
    const icsContent = db.generateICSData(filteredEvents);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Zitel_Castle_School_Calendar_${activeSession.name.replace('/', '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Official School Calendar downloaded as .ICS file for Google/Apple/Outlook integration.');
  };

  const handleSaveTermConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;
    try {
      db.updateTermConfig(
        activeSession.id,
        editingTerm.id,
        {
          openingDate: editingTerm.openingDate,
          closingDate: editingTerm.closingDate,
          nextTermOpeningDate: editingTerm.nextTermOpeningDate,
          notes: editingTerm.notes,
        },
        currentUser,
        'Updated official term schedule via School Calendar Manager'
      );
      showToast(`Successfully updated ${editingTerm.name} dates. Dates automatically propagated school-wide.`);
      setShowTermEditModal(false);
      setEditingTerm(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update term', 'error');
    }
  };

  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as CalendarEventCategory;
    const date = formData.get('date') as string;
    const endDate = formData.get('endDate') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const description = formData.get('description') as string;
    const branchIdVal = formData.get('branchId') as string;
    const priority = formData.get('priority') as 'low' | 'medium' | 'high';
    const audienceVals = formData.getAll('audience') as CalendarAudience[];

    if (!title || !date || !category) {
      showToast('Please fill all required event fields', 'error');
      return;
    }

    try {
      if (editingEvent) {
        db.updateCalendarEvent(
          editingEvent.id,
          {
            title,
            category,
            type: category,
            date,
            endDate: endDate || undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            description,
            branchId: branchIdVal === 'all' ? undefined : branchIdVal,
            branchName: branchIdVal === 'all' ? undefined : branches.find(b => b.id === branchIdVal)?.name,
            isSchoolWide: branchIdVal === 'all',
            priority,
            audience: audienceVals.length > 0 ? audienceVals : ['ALL'],
          },
          currentUser,
          'Updated via Calendar Manager'
        );
        showToast(`Calendar event "${title}" updated successfully.`);
      } else {
        db.createCalendarEvent(
          {
            title,
            category,
            type: category,
            date,
            endDate: endDate || undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            description,
            branchId: branchIdVal === 'all' ? undefined : branchIdVal,
            branchName: branchIdVal === 'all' ? undefined : branches.find(b => b.id === branchIdVal)?.name,
            isSchoolWide: branchIdVal === 'all',
            priority,
            audience: audienceVals.length > 0 ? audienceVals : ['ALL'],
            sessionId: activeSession.id,
            sessionName: activeSession.name,
            termId: activeTerm.id,
            termName: activeTerm.name,
            isOfficial: canManage,
          },
          currentUser
        );
        showToast(`New calendar event "${title}" created.`);
      }
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (err: any) {
      showToast(err.message || 'Error saving event', 'error');
    }
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the school calendar?`)) return;
    db.deleteCalendarEvent(id, currentUser, 'Removed by administrator');
    showToast(`Event "${title}" deleted from calendar.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setIsProcessingUpload(true);

    // Simulate intelligent date & schedule extraction parser
    setTimeout(() => {
      const mockParsedEvents: Array<Omit<CalendarEvent, 'id'>> = [
        {
          title: 'Staff Professional Development Workshop',
          description: 'Pre-session pedagogy and digital assessment training for all educators.',
          date: '2026-09-08',
          startTime: '09:00',
          endTime: '15:00',
          category: 'STAFF_MEETING',
          type: 'STAFF_MEETING',
          audience: ['TEACHER', 'ADMIN'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'Orientation for New Intakes & Parents',
          description: 'Welcome ceremony and orientation for new students across Bungalow & Ijegun branches.',
          date: '2026-09-11',
          startTime: '10:00',
          endTime: '13:00',
          category: 'PTA_MEETING',
          type: 'PTA_MEETING',
          audience: ['PARENT', 'STUDENT', 'ALL'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'First Term Continuous Assessment (CA 1)',
          description: 'First formal midterm testing period across all subjects and arms.',
          date: '2026-10-19',
          endDate: '2026-10-23',
          category: 'MIDTERM_TEST',
          type: 'MIDTERM_TEST',
          audience: ['ALL'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'Independence Day National Holiday',
          description: 'Official public holiday in commemoration of Nigerian Independence.',
          date: '2026-10-01',
          category: 'HOLIDAY',
          type: 'HOLIDAY',
          audience: ['ALL'],
          isSchoolWide: true,
          priority: 'medium',
        },
        {
          title: 'First Term Midterm Break & Parent Consultation',
          description: 'School mid-term recess for students and open-day parent consultation.',
          date: '2026-10-28',
          endDate: '2026-10-30',
          category: 'MIDTERM_BREAK',
          type: 'MIDTERM_BREAK',
          audience: ['ALL'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'Inter-House Sports Tournament (Heat 1)',
          description: 'Annual inter-house athletic trials and competitions.',
          date: '2026-11-13',
          startTime: '08:30',
          endTime: '14:00',
          category: 'SPORTS',
          type: 'SPORTS',
          audience: ['ALL'],
          isSchoolWide: true,
          priority: 'medium',
        },
        {
          title: 'First Term Revision Week & Exam Preparation',
          description: 'Intensive curriculum revision before terminal examinations.',
          date: '2026-11-23',
          endDate: '2026-11-27',
          category: 'ACADEMIC',
          type: 'ACADEMIC',
          audience: ['TEACHER', 'STUDENT'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'First Term Terminal Examinations',
          description: 'Official first term end-of-term examinations.',
          date: '2026-11-30',
          endDate: '2026-12-09',
          category: 'EXAMINATION',
          type: 'EXAMINATION',
          audience: ['ALL'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'Result Compilation & Broad Sheet Vetting',
          description: 'Teaching staff grading, remark compilation, and academic board verification.',
          date: '2026-12-10',
          endDate: '2026-12-15',
          category: 'RESULT_COMPILATION',
          type: 'RESULT_COMPILATION',
          audience: ['TEACHER', 'ADMIN'],
          isSchoolWide: true,
          priority: 'high',
        },
        {
          title: 'Christmas Carol, Prize Giving & Report Release',
          description: 'End of year festival, presentation of merit awards and report card release.',
          date: '2026-12-18',
          startTime: '10:00',
          endTime: '16:00',
          category: 'RESULT_RELEASE',
          type: 'RESULT_RELEASE',
          audience: ['ALL'],
          isSchoolWide: true,
          priority: 'high',
        },
      ];

      setExtractedEvents(mockParsedEvents);
      setIsProcessingUpload(false);
      showToast(`Processed "${file.name}": Extracted ${mockParsedEvents.length} official events and term schedule for review.`);
    }, 1200);
  };

  const handleConfirmImport = () => {
    try {
      const termUpdates: Array<{ termType: AcademicTermType; openingDate: string; closingDate: string }> = [
        { termType: 'FIRST_TERM', openingDate: extractedTermDates.firstTermOpening, closingDate: extractedTermDates.firstTermClosing },
        { termType: 'SECOND_TERM', openingDate: extractedTermDates.secondTermOpening, closingDate: extractedTermDates.secondTermClosing },
        { termType: 'THIRD_TERM', openingDate: extractedTermDates.thirdTermOpening, closingDate: extractedTermDates.thirdTermClosing },
      ];

      db.importCalendar(activeSession.id, extractedEvents, termUpdates, currentUser);
      showToast(`Successfully published ${extractedEvents.length} calendar events and synchronized term dates.`);
      setActiveTab('CALENDAR');
      setExtractedEvents([]);
      setUploadedFileName('');
    } catch (err: any) {
      showToast(err.message || 'Error confirming import', 'error');
    }
  };

  const handlePublishCalendar = () => {
    try {
      db.publishCalendar(activeSession.id, publishNotes, currentUser);
      showToast(`Official school calendar for ${activeSession.name} published. Revision recorded in audit log.`);
      setShowPublishModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish calendar', 'error');
    }
  };

  const handleAdvanceTerm = () => {
    try {
      const res = db.transitionToNextTerm(currentUser);
      if (res.success) {
        showToast(res.message);
        setShowTransitionModal(false);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Transition failed', 'error');
    }
  };

  const handleAdvanceSession = () => {
    try {
      const res = db.transitionToNextSession(currentUser);
      if (res.success) {
        showToast(res.message);
        setShowTransitionModal(false);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Session advance failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 duration-200 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-900 text-white border border-emerald-700'
              : 'bg-rose-900 text-white border border-rose-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Central Source of Truth Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Official School Source of Truth
              </span>
              {activeSession.publishedCalendar && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Published (Rev. {activeSession.revisionNumber || 1})</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              School Calendar & Three-Term Academic Sessions
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Configured schedule for <strong>{activeSession.name} Academic Session</strong>. Dates set here automatically synchronize across student report cards, daily dashboards, and teacher rosters.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canManage && (
              <button
                id="btn-add-calendar-event"
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            )}

            <button
              onClick={handleExportICS}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-xs transition-all border border-white/10 cursor-pointer"
              title="Download RFC 5545 .ICS calendar file for Google, Apple, or Outlook"
            >
              <Download className="w-4 h-4" />
              <span>Export .ICS</span>
            </button>

            {canManage && (
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Official Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Three Terms Summary Cards Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-white/10">
          {activeSession.terms.map((term, idx) => {
            const isTermActive = term.id === activeTerm.id;
            return (
              <div
                key={term.id}
                className={`rounded-2xl p-4 transition-all relative ${
                  isTermActive
                    ? 'bg-white/15 border-2 border-amber-400/80 shadow-lg'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center font-bold text-xs text-amber-300">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-white">{term.name}</h3>
                  </div>
                  {isTermActive ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                      Current Term
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {term.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-300 mt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opening Date:</span>
                    <span className="font-semibold text-white">
                      {new Date(term.openingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Closing Date:</span>
                    <span className="font-semibold text-rose-300">
                      {new Date(term.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Term Opens:</span>
                    <span className="font-semibold text-emerald-300">
                      {new Date(term.nextTermOpeningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingTerm(term);
                        setShowTermEditModal(true);
                      }}
                      className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Term Dates</span>
                    </button>

                    {!isTermActive && (
                      <button
                        onClick={() => {
                          db.setActiveTerm(activeSession.id, term.id, currentUser, true);
                          showToast(`Set active term to ${term.name}.`);
                        }}
                        className="text-[11px] font-bold text-amber-300 hover:text-amber-200"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'CALENDAR'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar Schedule</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('TERMS')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'TERMS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Three-Term Sessions</span>
            </div>
          </button>

          {canManage && (
            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'UPLOAD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Upload className="w-4 h-4" />
                <span>Upload & Import</span>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab('GOOGLE_SYNC')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'GOOGLE_SYNC'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>Google Calendar</span>
            </div>
          </button>

          {isSuper && (
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <History className="w-4 h-4" />
                <span>Calendar Audit Trail</span>
              </div>
            </button>
          )}
        </div>

        {/* Calendar View Toggle (Month vs Agenda) */}
        {activeTab === 'CALENDAR' && (
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'MONTH' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('AGENDA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'AGENDA' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda / List
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CALENDAR VIEW */}
      {/* ======================================================== */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events, exams, tests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Term Filter */}
              <select
                value={selectedTermId}
                onChange={e => setSelectedTermId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Terms ({activeSession.name})</option>
                {activeSession.terms.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="EXAMINATION">Examinations</option>
                <option value="MIDTERM_TEST">Midterm Tests (CA)</option>
                <option value="HOLIDAY">Public Holidays</option>
                <option value="MIDTERM_BREAK">Midterm Break</option>
                <option value="TERM_DATES">Term Resumption & Closure</option>
                <option value="PTA_MEETING">PTA & Parent Meetings</option>
                <option value="STAFF_MEETING">Staff & Departmental Meetings</option>
                <option value="SPORTS">Sports & Athletics</option>
                <option value="EXCURSION">Excursions & Field Trips</option>
                <option value="CULTURAL">Cultural & Valedictory</option>
                <option value="RESULT_RELEASE">Result Release Dates</option>
                <option value="RESULT_COMPILATION">Result Compilation</option>
              </select>

              {/* Branch Filter */}
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">All School Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Nav Controls */}
            {viewMode === 'MONTH' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 min-w-[130px] text-center">
                  {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={resetToToday}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Today
                </button>
              </div>
            )}
          </div>

          {/* MONTH GRID VIEW */}
          {viewMode === 'MONTH' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[640px]">
                    {/* Day of Week Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-600 py-2.5">
                      <span className="text-rose-600">Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span className="text-indigo-600">Sat</span>
                    </div>

                    {/* Grid Cells */}
                    <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
                      {calendarDays.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="min-h-[105px] bg-slate-50/40 p-2"></div>;
                        }

                        const ymd = day.toISOString().split('T')[0];
                        const dayEvents = getEventsForDay(day);
                        const isToday = ymd === new Date().toISOString().split('T')[0];
                        const isSelected = selectedDailyDate === ymd;
                        const isSunday = day.getDay() === 0;

                        return (
                          <div
                            key={ymd}
                            onClick={() => setSelectedDailyDate(prev => prev === ymd ? null : ymd)}
                            className={`min-h-[105px] p-2 transition-all relative group cursor-pointer hover:bg-slate-50/80 ${
                              isSelected
                                ? 'bg-indigo-50/70 ring-2 ring-indigo-500 ring-inset z-10'
                                : isToday
                                ? 'bg-indigo-50/30'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-700 text-white shadow-xs'
                                    : isToday
                                    ? 'bg-indigo-600 text-white'
                                    : isSunday
                                    ? 'text-rose-600'
                                    : 'text-slate-800'
                                }`}
                              >
                                {day.getDate()}
                              </span>

                              {canManage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(null);
                                    setShowEventModal(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded transition-opacity"
                                  title="Add event on this date"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Day Event Badges - Compact and margin-safe */}
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map(ev => (
                                <div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDailyDate(ymd);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border transition-all ${getCategoryBadgeClass(
                                    ev.category,
                                    ev.type
                                  )}`}
                                  title={`${ev.title} (${ev.category || ev.type})`}
                                >
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <span className="text-[9px] font-bold text-indigo-600 block pl-0.5">
                                  +{dayEvents.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Day Schedule Inspector - Arranged cleanly to avoid being cutoff by margin */}
              {selectedDailyDate && (
                <div className="bg-white rounded-2xl border border-indigo-200/80 shadow-sm p-4 sm:p-5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Daily Schedule: {new Date(selectedDailyDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {getEventsForDay(new Date(selectedDailyDate + 'T00:00:00')).length} item(s) scheduled
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(null);
                            setShowEventModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Daily Event</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedDailyDate(null)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    {getEventsForDay(new Date(selectedDailyDate + 'T00:00:00')).length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No official events or examinations scheduled for this day.
                      </div>
                    ) : (
                      getEventsForDay(new Date(selectedDailyDate + 'T00:00:00')).map(ev => (
                        <div
                          key={ev.id}
                          className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(ev.category, ev.type)}`}>
                                {ev.category || ev.type}
                              </span>
                              {ev.branchName && (
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {ev.branchName}
                                </span>
                              )}
                              {ev.isOfficial && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Official
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-slate-900">{ev.title}</h5>
                            {ev.description && (
                              <p className="text-[11px] text-slate-500 break-words">{ev.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                              {ev.startTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}</span>
                                </span>
                              )}
                              <span>Audience: {ev.audience?.join(', ') || 'All'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <a
                              href={db.generateGoogleCalendarLink(ev)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Google Cal</span>
                            </a>
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEvent(ev);
                                    setShowEventModal(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Edit Event"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev.id, ev.title)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Event"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AGENDA LIST VIEW */}
          {viewMode === 'AGENDA' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No events found matching your filter criteria.
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase text-indigo-500">
                          {new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {new Date(event.date + 'T00:00:00').getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(event.category, event.type)}`}>
                            {event.category || event.type}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {event.termName || 'Term Event'}
                          </span>
                          {event.branchName && (
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {event.branchName}
                            </span>
                          )}
                          {event.isOfficial && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Official
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                          {event.startTime && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{event.startTime} - {event.endTime || 'Close'}</span>
                            </span>
                          )}
                          {event.endDate && event.endDate !== event.date && (
                            <span>Until {new Date(event.endDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          )}
                          <span>Audience: {event.audience?.join(', ') || 'All'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <a
                        href={db.generateGoogleCalendarLink(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                        title="Add to Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Google Cal</span>
                      </a>

                      {canManage && (
                        <>
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setShowEventModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit Event"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.title)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: THREE-TERM SESSIONS & DATES */}
      {/* ======================================================== */}
      {activeTab === 'TERMS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Three-Term Academic Architecture
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent structure: First Term (Sept–Dec), Second Term (Jan–Apr), Third Term (Apr–Jul). Dates are dynamic and fully customizable per session.
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => setShowTransitionModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  <span>Session / Term Transition Wizard</span>
                </button>
              )}
            </div>

            {/* Terms Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Term</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Term Opening Date</th>
                    <th className="py-3 px-4">Term Closure Date</th>
                    <th className="py-3 px-4">Next Term Opening</th>
                    <th className="py-3 px-4">Total Weeks</th>
                    {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeSession.terms.map(t => {
                    const isTermActive = t.id === activeTerm.id;
                    return (
                      <tr key={t.id} className={isTermActive ? 'bg-indigo-50/40 font-bold' : 'hover:bg-slate-50/60'}>
                        <td className="py-3.5 px-4 text-slate-900 font-bold">
                          <div className="flex items-center space-x-2">
                            <span>{t.name}</span>
                            {isTermActive && (
                              <span className="px-2 py-0.5 rounded text-[9px] bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {new Date(t.openingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">
                          {new Date(t.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                          {new Date(t.nextTermOpeningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4">{t.totalWeeks || 13} weeks</td>
                        {canManage && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingTerm(t);
                                setShowTermEditModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-colors"
                            >
                              Edit Dates
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: UPLOAD & IMPORT */}
      {/* ======================================================== */}
      {activeTab === 'UPLOAD' && canManage && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-slate-900">
                School Calendar Document Upload & Intelligent Extractor
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your official school calendar file (PDF, Word, Excel, CSV, or Image). The system processes the document, identifies term dates, exams, holidays, and meetings, and lets you review before publishing.
              </p>
            </div>

            {/* Upload Box */}
            <div className="mt-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-2xl p-8 text-center transition-colors">
              <input
                type="file"
                id="calendar-file-upload"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                className="hidden"
              />
              <label htmlFor="calendar-file-upload" className="cursor-pointer block">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click to browse or drag and drop school calendar file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, DOCX, XLSX, CSV, PNG, JPG (Max 25MB)
                </p>
              </label>

              {isProcessingUpload && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-indigo-600 font-bold text-xs animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing document structure and extracting academic dates...</span>
                </div>
              )}
            </div>

            {/* Extracted Data Review Section */}
            {extractedEvents.length > 0 && (
              <div className="mt-8 space-y-6 animate-in fade-in duration-300">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">Review Extracted Schedule Before Publishing</p>
                    <p className="mt-0.5">
                      Verify the extracted dates below. You retain total authority over the final calendar. Click "Publish Calendar" once satisfied.
                    </p>
                  </div>
                </div>

                {/* Term Dates Review */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Extracted Three-Term Dates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-xs text-indigo-900 mb-2">First Term</p>
                      <label className="text-[10px] text-slate-400 block">Opening Date</label>
                      <input
                        type="date"
                        value={extractedTermDates.firstTermOpening}
                        onChange={e => setExtractedTermDates({ ...extractedTermDates, firstTermOpening: e.target.value })}
                        className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg mb-2"
                      />
                      <label className="text-[10px] text-slate-400 block">Closure Date</label>
                      <input
                        type="date"
                        value={extractedTermDates.firstTermClosing}
                        onChange={e => setExtractedTermDates({ ...extractedTermDates, firstTermClosing: e.target.value })}
                        className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-xs text-indigo-900 mb-2">Second Term</p>
                      <label className="text-[10px] text-slate-400 block">Opening Date</label>
                      <input
                        type="date"
                        value={extractedTermDates.secondTermOpening}
                        onChange={e => setExtractedTermDates({ ...extractedTermDates, secondTermOpening: e.target.value })}
                        className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg mb-2"
                      />
                      <label className="text-[10px] text-slate-400 block">Closure Date</label>
                      <input
                        type="date"
                        value={extractedTermDates.secondTermClosing}
                        onChange={e => setExtractedTermDates({ ...extractedTermDates, secondTermClosing: e.target.value })}
                        className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-xs text-indigo-900 mb-2">Third Term</p>
                      <label className="text-[10px] text-slate-400 block">Opening Date</label>
                      <input
                        type="date"
                        value={extractedTermDates.thirdTermOpening}
                        onChange={e => setExtractedTermDates({ ...extractedTermDates, thirdTermOpening: e.target.value })}
                        className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg mb-2"
                      />
                      <label className="text-[10px] text-slate-400 block">Closure Date</label>
                      <input
                        type="date"
                        value={extractedTermDates.thirdTermClosing}
                        onChange={e => setExtractedTermDates({ ...extractedTermDates, thirdTermClosing: e.target.value })}
                        className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Events Review Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Extracted Events ({extractedEvents.length})
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {extractedEvents.map((ev, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{ev.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(ev.category, ev.type)}`}>
                              {ev.category}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{ev.description}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                          {ev.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setExtractedEvents([]);
                      setUploadedFileName('');
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Import Extracted Calendar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: GOOGLE CALENDAR SYNC */}
      {/* ======================================================== */}
      {activeTab === 'GOOGLE_SYNC' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <RefreshCw className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Google Calendar Synchronization
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Synchronize your official school calendar into Google Calendar, Android, iOS, or Microsoft Outlook.
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              googleSync.isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {googleSync.isConnected ? 'Connected & Authorized' : 'Ready to Connect'}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Sync Configurations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={googleSync.syncExams}
                    onChange={e => db.updateGoogleCalendarSync({ syncExams: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>School Examinations & Midterm Tests</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={googleSync.syncHolidays}
                    onChange={e => db.updateGoogleCalendarSync({ syncHolidays: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Public Holidays & Midterm Breaks</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={googleSync.syncStaffMeetings}
                    onChange={e => db.updateGoogleCalendarSync({ syncStaffMeetings: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Staff & Academic Meetings</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={googleSync.syncPTAMeetings}
                    onChange={e => db.updateGoogleCalendarSync({ syncPTAMeetings: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>PTA & Parent-Teacher Conferences</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  db.updateGoogleCalendarSync({ isConnected: true, lastSyncedAt: new Date().toISOString() });
                  showToast('Google Calendar connected. Eligible school events synchronized.');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Authorize & Sync to Google Calendar</span>
              </button>

              <button
                onClick={handleExportICS}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Universal .ICS File</span>
              </button>
            </div>

            {googleSync.lastSyncedAt && (
              <p className="text-[11px] text-slate-400">
                Last synchronized: {new Date(googleSync.lastSyncedAt).toLocaleString('en-GB')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: AUDIT TRAIL */}
      {/* ======================================================== */}
      {activeTab === 'AUDIT' && isSuper && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Calendar Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Cryptographic log of all session, term, and calendar event modifications.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {auditLogs.length} audit records
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No calendar modifications recorded yet.
              </div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {log.userRole}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{log.action}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CALENDAR EVENT */}
      {/* ======================================================== */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingEvent ? 'Edit Official Calendar Event' : 'Schedule New School Event'}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingEvent?.title || ''}
                  required
                  placeholder="e.g. First Term Terminal Examinations"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Category *</label>
                  <select
                    name="category"
                    defaultValue={editingEvent?.category || 'ACADEMIC'}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="ACADEMIC">Academic / Instruction</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="MIDTERM_TEST">Midterm Test (CA)</option>
                    <option value="HOLIDAY">Public Holiday</option>
                    <option value="MIDTERM_BREAK">Midterm Break</option>
                    <option value="TERM_DATES">Term Resumption / Closure</option>
                    <option value="PTA_MEETING">PTA Meeting</option>
                    <option value="STAFF_MEETING">Staff / Academic Meeting</option>
                    <option value="SPORTS">Sports & Athletics</option>
                    <option value="EXCURSION">Excursion / Field Trip</option>
                    <option value="CULTURAL">Cultural / Graduation</option>
                    <option value="RESULT_RELEASE">Result Release Date</option>
                    <option value="RESULT_COMPILATION">Result Compilation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch</label>
                  <select
                    name="branchId"
                    defaultValue={editingEvent?.branchId || 'all'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="all">All School Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingEvent?.date || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editingEvent?.endDate || ''}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={editingEvent?.startTime || '08:00'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={editingEvent?.endTime || '15:00'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                <div className="flex flex-wrap gap-3">
                  {['ALL', 'TEACHER', 'PARENT', 'STUDENT', 'ADMIN'].map(aud => (
                    <label key={aud} className="flex items-center space-x-1.5 text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        name="audience"
                        value={aud}
                        defaultChecked={
                          editingEvent?.audience
                            ? editingEvent.audience.includes(aud as any)
                            : aud === 'ALL'
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{aud}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Details</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingEvent?.description || ''}
                  placeholder="Additional event details, dress code, instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  {editingEvent ? 'Save Changes' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT TERM DATES */}
      {/* ======================================================== */}
      {showTermEditModal && editingTerm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Term Schedule: {editingTerm.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeSession.name} Academic Session
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTermEditModal(false);
                  setEditingTerm(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Term Opening Date *</label>
                <input
                  type="date"
                  value={editingTerm.openingDate}
                  onChange={e => setEditingTerm({ ...editingTerm, openingDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Term Closing/Closure Date *</label>
                <input
                  type="date"
                  value={editingTerm.closingDate}
                  onChange={e => setEditingTerm({ ...editingTerm, closingDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Term Opening Date *</label>
                <input
                  type="date"
                  value={editingTerm.nextTermOpeningDate}
                  onChange={e => setEditingTerm({ ...editingTerm, nextTermOpeningDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={editingTerm.notes || ''}
                  onChange={e => setEditingTerm({ ...editingTerm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Propagation Notice:</strong> Changing these dates will immediately update all report cards, term countdown badges, and calendar events across the entire school.
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowTermEditModal(false);
                    setEditingTerm(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Save & Propagate Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PUBLISH OFFICIAL CALENDAR */}
      {/* ======================================================== */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Publish Official Academic Calendar
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This will mark the current calendar for {activeSession.name} as the school's active official schedule and increment the revision version.
            </p>

            <label className="block font-bold text-xs text-slate-700 mb-1">Revision / Publication Notes</label>
            <textarea
              rows={3}
              value={publishNotes}
              onChange={e => setPublishNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishCalendar}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                Publish Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TRANSITION SESSION / TERM WIZARD */}
      {/* ======================================================== */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Academic Session & Term Transition Wizard
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Safely advance terms or roll over into a new academic session. All past student report cards and grading records are permanently retained in the historical archive.
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <h4 className="font-bold text-xs text-indigo-900 mb-1">Option 1: Advance to Next Term</h4>
                <p className="text-[11px] text-slate-600 mb-3">
                  Transitions active term within the current {activeSession.name} session.
                </p>
                <button
                  onClick={handleAdvanceTerm}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  Advance to Next Term
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white">
                <h4 className="font-bold text-xs text-amber-300 mb-1">Option 2: Advance to Next Academic Year</h4>
                <p className="text-[11px] text-slate-300 mb-3">
                  Creates next session (e.g. 2027/2028), archives {activeSession.name}, and initializes three new terms.
                </p>
                <button
                  onClick={handleAdvanceSession}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs"
                >
                  Advance to Next Academic Session
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowTransitionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Wizard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
