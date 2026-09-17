import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  Check,
  FileCheck,
  ClipboardList,
  Award,
  Plus,
  Search,
  Filter,
  Info,
  ChevronRight,
  X,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import {
  User,
  ClassRoom,
  Subject,
  CurriculumTopic,
  TopicEvidence,
  TopicStatus
} from '../../types';
import { db } from '../../services/db';
import { isDirector, isSuperAdmin } from '../../utils/roles';

interface TopicCompletionManagerProps {
  currentUser: User;
  assignedClasses?: ClassRoom[];
  teacherSubjects?: Subject[];
  initialClassId?: string;
  initialSubjectId?: string;
}

export const TopicCompletionManager: React.FC<TopicCompletionManagerProps> = ({
  currentUser,
  assignedClasses = [],
  teacherSubjects = [],
  initialClassId,
  initialSubjectId,
}) => {
  const isDirectorOrSuperAdmin = isDirector(currentUser) || isSuperAdmin(currentUser);

  // Available classes & subjects
  const availableClasses = useMemo(() => {
    if (isDirectorOrSuperAdmin) {
      return db.getClasses();
    }
    return assignedClasses.length > 0 ? assignedClasses : db.getTeacherAssignedClasses(currentUser.id);
  }, [assignedClasses, currentUser.id, isDirectorOrSuperAdmin]);

  const availableSubjects = useMemo(() => {
    if (isDirectorOrSuperAdmin) {
      return db.getSubjects();
    }
    return teacherSubjects.length > 0 ? teacherSubjects : db.getTeacherAssignedSubjects(currentUser.id);
  }, [teacherSubjects, currentUser.id, isDirectorOrSuperAdmin]);

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (availableClasses[0]?.id || '')
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || (availableSubjects[0]?.id || '')
  );
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 2');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [completingTopic, setCompletingTopic] = useState<CurriculumTopic | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [evidenceReview, setEvidenceReview] = useState<TopicEvidence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Topic Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTopicData, setNewTopicData] = useState({
    title: '',
    subTopic: '',
    weekNumber: 4,
    term: 'Term 2',
    learningObjectives: '1. Understand core concepts.\n2. Solve practical classroom exercises.',
    estimatedPeriods: 3,
  });

  // Load Curriculum Topics for selected Class, Subject & Term
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const topics = useMemo(() => {
    if (!selectedClassId || !selectedSubjectId) return [];
    return db.getCurriculumTopics({
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      term: selectedTerm,
    });
  }, [selectedClassId, selectedSubjectId, selectedTerm, refreshTrigger]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesSub = t.subTopic?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub) return false;
      }
      return true;
    });
  }, [topics, statusFilter, searchQuery]);

  // Progress metrics
  const progressStats = useMemo(() => {
    const total = topics.length;
    if (total === 0) return { total: 0, completed: 0, inProgress: 0, pending: 0, percent: 0 };

    const completed = topics.filter(t => t.status === 'COMPLETED').length;
    const inProgress = topics.filter(t => t.status === 'IN_PROGRESS').length;
    const pending = topics.filter(t => t.status === 'PENDING' || t.status === 'UPCOMING').length;
    const percent = Math.round((completed / total) * 100);

    return { total, completed, inProgress, pending, percent };
  }, [topics]);

  // Selected Class & Subject Objects
  const activeClass = useMemo(() => {
    return availableClasses.find(c => c.id === selectedClassId);
  }, [availableClasses, selectedClassId]);

  const activeSubject = useMemo(() => {
    return availableSubjects.find(s => s.id === selectedSubjectId);
  }, [availableSubjects, selectedSubjectId]);

  // Open Verify & Complete Modal
  const handleOpenCompleteModal = (topic: CurriculumTopic) => {
    const evidence = db.evaluateTopicEvidence(topic.id);
    setEvidenceReview(evidence);
    setCompletingTopic(topic);
    setCompletionNotes('');
    setCompletionDate(new Date().toISOString().split('T')[0]);
  };

  // Submit Completion
  const handleConfirmCompletion = () => {
    if (!completingTopic) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const result = db.markTopicCompleted(
        completingTopic.id,
        currentUser,
        completionNotes.trim() || 'Verified topic delivery with academic evidence and classroom exercises.'
      );

      setFeedbackMsg({ type: 'success', text: result.message });
      setCompletingTopic(null);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to mark topic as completed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create New Topic
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId) {
      setFeedbackMsg({ type: 'error', text: 'Please select a class and subject first.' });
      return;
    }

    try {
      const objectives = newTopicData.learningObjectives
        .split('\n')
        .map(o => o.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean);

      db.addCurriculumTopic({
        classId: selectedClassId,
        className: activeClass?.name || '',
        subjectId: selectedSubjectId,
        subjectName: activeSubject?.name || '',
        branchId: currentUser.branchId || '',
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        academicSession: '2025/2026',
        term: newTopicData.term,
        weekNumber: Number(newTopicData.weekNumber),
        topicTitle: newTopicData.title.trim(),
        title: newTopicData.title.trim(),
        subTopic: newTopicData.subTopic.trim() || undefined,
        learningObjectives: objectives.length > 0 ? objectives : ['Master curriculum concepts'],
        status: 'PENDING',
        hasAssignmentRequired: true,
        hasAssessmentAttached: true,
        estimatedPeriods: Number(newTopicData.estimatedPeriods) || 2,
      }, currentUser);

      setShowAddModal(false);
      setNewTopicData({
        title: '',
        subTopic: '',
        weekNumber: 4,
        term: selectedTerm,
        learningObjectives: '1. Understand core concepts.\n2. Solve practical classroom exercises.',
        estimatedPeriods: 3,
      });
      setRefreshTrigger(prev => prev + 1);
      setFeedbackMsg({ type: 'success', text: 'New curriculum topic added to syllabus.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save topic.' });
    }
  };

  return (
    <div className="space-y-6" id="topic-completion-manager-view">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-teal-800/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Evidence-Based Curriculum Completion
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Academic Delivery
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              CURRICULUM TOPIC COMPLETION
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Verify syllabus pace and mark completed topics backed by verified lesson notes,
              homework assignments, and continuous assessment tests.
            </p>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Syllabus Topic</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* FILTER CONTROLS & SELECTION STRIP */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Class Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Class</span>
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {availableClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Subject</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Academic Term</span>
            </label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Term 1">First Term (Michaelmas)</option>
              <option value="Term 2">Second Term (Lent)</option>
              <option value="Term 3">Third Term (Trinity)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Topic Status</span>
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending / Upcoming</option>
            </select>
          </div>
        </div>

        {/* PROGRESS METER */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">
                Syllabus Progress for {activeSubject?.name || 'Subject'} ({activeClass?.name || 'Class'})
              </span>
              <span className="text-teal-700 font-extrabold text-sm">
                {progressStats.percent}% ({progressStats.completed} / {progressStats.total} Topics)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${progressStats.percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {progressStats.completed} Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {progressStats.inProgress} In-Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {progressStats.pending} Pending
            </span>
          </div>
        </div>
      </div>

      {/* TOPICS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Curriculum Topics Ledger ({filteredTopics.length} topics)
            </h3>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic or sub-topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {filteredTopics.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTopics.map(topic => {
              const isCompleted = topic.status === 'COMPLETED';
              const isInProgress = topic.status === 'IN_PROGRESS';

              return (
                <div
                  key={topic.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                        WEEK {topic.weekNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{topic.title}</h4>
                      {topic.subTopic && (
                        <span className="text-xs text-slate-500 font-medium">
                          — {topic.subTopic}
                        </span>
                      )}
                    </div>

                    {/* Objectives */}
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Objectives: </span>
                      {topic.learningObjectives.join('; ')}
                    </div>

                    {/* Evidence & Completion Meta */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Completed on {topic.completedDate || 'Recorded'}</span>
                        {topic.evidenceSummary && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-500">"{topic.evidenceSummary}"</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isInProgress
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isInProgress
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {topic.status}
                    </span>

                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(topic)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Mark Completed</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(topic)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                        title="View verification evidence"
                      >
                        <span>Inspect Evidence</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-xs">No Topics Found for Selected Criteria</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Add topics using the "Add Syllabus Topic" button above.
            </p>
          </div>
        )}
      </div>

      {/* VERIFY & COMPLETE MODAL */}
      {completingTopic && evidenceReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-teal-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Academic Evidence Verification
                  </h3>
                  <p className="text-xs text-teal-200">
                    Week {completingTopic.weekNumber}: {completingTopic.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletingTopic(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evidence Checklist Body */}
            <div className="p-6 space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Curriculum Topic
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {completingTopic.title}
                </div>
                {completingTopic.subTopic && (
                  <div className="text-xs text-slate-600">
                    Sub-topic: {completingTopic.subTopic}
                  </div>
                )}
              </div>

              {/* Verified Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Academic Evidence Requirements
                  </label>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      evidenceReview.isEligibleForCompletion
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    Eligible for Completion: {evidenceReview.isEligibleForCompletion ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* 1. Lesson Plan */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      evidenceReview.lessonPlanStatus === 'Attached'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {evidenceReview.lessonPlanStatus === 'Attached' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Lesson Plan</span>
                        <span className="text-[11px] text-slate-500">
                          {evidenceReview.lessonPlanStatus === 'Attached'
                            ? 'Submitted or approved in academic archive'
                            : 'Required lesson plan not found for this topic'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                        evidenceReview.lessonPlanStatus === 'Attached'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Lesson Plan: {evidenceReview.lessonPlanStatus || (evidenceReview.hasLessonPlan ? 'Attached' : 'Missing')}
                    </span>
                  </div>

                  {/* 2. Lesson Note */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      evidenceReview.lessonNoteStatus === 'Attached'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {evidenceReview.lessonNoteStatus === 'Attached' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Lesson Note</span>
                        <span className="text-[11px] text-slate-500">
                          {evidenceReview.lessonNoteStatus === 'Attached'
                            ? 'Provided and structured for classroom delivery'
                            : 'Lesson note is required before completing topic'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                        evidenceReview.lessonNoteStatus === 'Attached'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Lesson Note: {evidenceReview.lessonNoteStatus || (evidenceReview.hasLessonNote ? 'Attached' : 'Missing')}
                    </span>
                  </div>

                  {/* 3. Assignment */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      evidenceReview.assignmentStatus === 'Issued'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {evidenceReview.assignmentStatus === 'Issued' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Homework / Assignment</span>
                        <span className="text-[11px] text-slate-500">
                          {evidenceReview.assignmentStatus === 'Issued'
                            ? 'Assignment issued to students with recorded submissions'
                            : 'Missing assignment publication or student engagement'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                        evidenceReview.assignmentStatus === 'Issued'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Assignment: {evidenceReview.assignmentStatus || (evidenceReview.assignmentCompleted ? 'Issued' : 'Missing')}
                    </span>
                  </div>

                  {/* 4. Assessment */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      evidenceReview.assessmentStatus === 'Recorded' || evidenceReview.assessmentStatus === 'N/A'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {evidenceReview.assessmentStatus === 'Recorded' || evidenceReview.assessmentStatus === 'N/A' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block">Continuous Assessment / Test</span>
                        <span className="text-[11px] text-slate-500">
                          {evidenceReview.assessmentStatus === 'Recorded'
                            ? 'CA test scores registered in school assessment engine'
                            : evidenceReview.assessmentStatus === 'N/A'
                            ? 'No test attached to this topic (N/A does not block completion)'
                            : 'Assessment test results pending in gradebook'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                        evidenceReview.assessmentStatus === 'Recorded'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : evidenceReview.assessmentStatus === 'N/A'
                          ? 'bg-slate-200 text-slate-700 font-bold'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Assessment: {evidenceReview.assessmentStatus || 'Recorded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guidance for Missing Items */}
              {evidenceReview.missingComponents && evidenceReview.missingComponents.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Prerequisites Incomplete — System Guidance</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    To officially mark this topic as completed, the following academic delivery components must be fulfilled:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-rose-800 font-semibold space-y-0.5 mt-1">
                    {evidenceReview.missingComponents.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Completion Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teacher Completion Remarks & Student Mastery
                </label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="e.g., Successfully delivered with 85% student mastery on paired exercises. Homework submitted..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>

              {/* Eligibility Callout */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-900 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Marking this topic as completed feeds directly into institutional Class Evaluation
                  indexes and updates director-level syllabus coverage monitoring.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompletingTopic(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !evidenceReview.isEligibleForCompletion}
                  onClick={handleConfirmCompletion}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying...' : 'Confirm Topic Completed'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD TOPIC MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-teal-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Add New Curriculum Topic
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topic Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Photosynthesis and Plant Nutrition"
                  value={newTopicData.title}
                  onChange={e => setNewTopicData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sub-Topic (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chlorophyll Function & Light Stage"
                  value={newTopicData.subTopic}
                  onChange={e => setNewTopicData(prev => ({ ...prev, subTopic: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newTopicData.weekNumber}
                    onChange={e => setNewTopicData(prev => ({ ...prev, weekNumber: Number(e.target.value) }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Periods
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTopicData.estimatedPeriods}
                    onChange={e => setNewTopicData(prev => ({ ...prev, estimatedPeriods: Number(e.target.value) }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Learning Objectives (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newTopicData.learningObjectives}
                  onChange={e => setNewTopicData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
