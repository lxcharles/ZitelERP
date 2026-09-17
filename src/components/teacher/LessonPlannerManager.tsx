import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Copy,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Paperclip,
  Upload,
  BookOpen,
  CalendarDays,
  ListFilter,
  X,
  Sparkles
} from 'lucide-react';
import {
  User,
  ClassRoom,
  Subject,
  LessonPlan,
  LessonPlanAttachment
} from '../../types';
import { db } from '../../services/db';

interface LessonPlannerManagerProps {
  currentUser: User;
  assignedClasses?: ClassRoom[];
  teacherSubjects?: Subject[];
  initialClassId?: string;
  initialSubjectId?: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'list';

export const LessonPlannerManager: React.FC<LessonPlannerManagerProps> = ({
  currentUser,
  assignedClasses = [],
  teacherSubjects = [],
  initialClassId,
  initialSubjectId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialClassId || 'all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(initialSubjectId || 'all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Lesson Plans List from DB
  const [plans, setPlans] = useState<LessonPlan[]>(() => {
    return db.getAuthorizedLessonPlans(currentUser.id);
  });

  // Modal States
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    classId: initialClassId || (assignedClasses[0]?.id || 'cls_basic3a_bgl'),
    subjectId: initialSubjectId || (teacherSubjects[0]?.id || 'sub_math_pri'),
    topic: '',
    subTopic: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    duration: '45 mins',
    weekNumber: 3,
    term: 'Term 1',
    objectivesText: '1. \n2. \n3. ',
    teachingActivities: 'Direct instruction with whiteboard modeling and small group guidance.',
    studentActivities: 'Active participation, solving paired exercises, workbook practice.',
    learningResourcesText: 'Textbook, whiteboard markers, charts, manipulative tiles',
    assessmentMethod: 'Chalkboard drill and workbook exercise check.',
    homework: 'Page 45, Exercise 4B, Questions 1–10.',
    teacherNotes: 'Prepare visual aids prior to start of class.',
    status: 'PLANNED' as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    attachments: [] as LessonPlanAttachment[],
  });

  // Attachment upload state
  const [attName, setAttName] = useState('');
  const [attType, setAttType] = useState<'pdf' | 'image' | 'doc'>('pdf');
  const [attUrl, setAttUrl] = useState('');

  const refreshPlans = () => {
    setPlans(db.getAuthorizedLessonPlans(currentUser.id));
  };

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    if (selectedClassFilter !== 'all' && p.classId !== selectedClassFilter) return false;
    if (selectedSubjectFilter !== 'all' && p.subjectId !== selectedSubjectFilter) return false;
    if (selectedStatusFilter !== 'all' && p.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.topic.toLowerCase().includes(q) ||
        (p.subTopic && p.subTopic.toLowerCase().includes(q)) ||
        p.subjectName.toLowerCase().includes(q) ||
        p.className.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingPlanId(null);
    setFormData({
      classId: selectedClassFilter !== 'all' ? selectedClassFilter : (assignedClasses[0]?.id || 'cls_basic3a_bgl'),
      subjectId: selectedSubjectFilter !== 'all' ? selectedSubjectFilter : (teacherSubjects[0]?.id || 'sub_math_pri'),
      topic: '',
      subTopic: '',
      date: new Date().toISOString().split('T')[0],
      time: '08:30',
      duration: '45 mins',
      weekNumber: 3,
      term: 'Term 1',
      objectivesText: '1. Identify core concept\n2. Solve 3 practical examples\n3. Demonstrate understanding',
      teachingActivities: 'Direct instruction with whiteboard modeling and small group guidance.',
      studentActivities: 'Active participation, solving paired exercises, workbook practice.',
      learningResourcesText: 'Textbook, whiteboard markers, charts',
      assessmentMethod: 'Chalkboard drill and workbook exercise check.',
      homework: 'Complete designated workbook exercise questions.',
      teacherNotes: '',
      status: 'PLANNED',
      attachments: [],
    });
    setShowEditorModal(true);
  };

  const handleOpenEditModal = (plan: LessonPlan) => {
    setEditingPlanId(plan.id);
    setFormData({
      classId: plan.classId,
      subjectId: plan.subjectId,
      topic: plan.topic,
      subTopic: plan.subTopic || '',
      date: plan.date || new Date().toISOString().split('T')[0],
      time: plan.time || '08:30',
      duration: plan.duration || '45 mins',
      weekNumber: plan.weekNumber || 3,
      term: plan.term || 'Term 1',
      objectivesText: Array.isArray(plan.objectives) ? plan.objectives.join('\n') : String(plan.objectives || ''),
      teachingActivities: plan.teachingActivities || '',
      studentActivities: plan.studentActivities || '',
      learningResourcesText: Array.isArray(plan.learningResources)
        ? plan.learningResources.join('\n')
        : typeof plan.learningResources === 'string'
        ? plan.learningResources
        : (plan.materials || []).join('\n'),
      assessmentMethod: plan.assessmentMethod || '',
      homework: plan.homework || '',
      teacherNotes: plan.teacherNotes || '',
      status: (plan.status as any) || 'PLANNED',
      attachments: plan.attachments || [],
    });
    setShowEditorModal(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) return;

    const targetClass = assignedClasses.find(c => c.id === formData.classId) || assignedClasses[0];
    const targetSubject = teacherSubjects.find(s => s.id === formData.subjectId) || teacherSubjects[0];

    const objectives = formData.objectivesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const learningResources = formData.learningResourcesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (editingPlanId) {
      db.updateLessonPlan(
        editingPlanId,
        {
          classId: targetClass.id,
          className: targetClass.name,
          branchId: targetClass.branchId,
          branchName: targetClass.branchName,
          subjectId: targetSubject.id,
          subjectName: targetSubject.name,
          topic: formData.topic.trim(),
          subTopic: formData.subTopic.trim(),
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          weekNumber: Number(formData.weekNumber),
          term: formData.term,
          objectives,
          teachingActivities: formData.teachingActivities,
          studentActivities: formData.studentActivities,
          learningResources,
          assessmentMethod: formData.assessmentMethod,
          homework: formData.homework,
          teacherNotes: formData.teacherNotes,
          status: formData.status as any,
          attachments: formData.attachments,
        },
        currentUser
      );
    } else {
      db.createLessonPlan(
        {
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          classId: targetClass.id,
          className: targetClass.name,
          branchId: targetClass.branchId,
          branchName: targetClass.branchName,
          subjectId: targetSubject.id,
          subjectName: targetSubject.name,
          topic: formData.topic.trim(),
          subTopic: formData.subTopic.trim(),
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          weekNumber: Number(formData.weekNumber),
          term: formData.term,
          objectives,
          teachingActivities: formData.teachingActivities,
          studentActivities: formData.studentActivities,
          learningResources,
          assessmentMethod: formData.assessmentMethod,
          homework: formData.homework,
          teacherNotes: formData.teacherNotes,
          status: formData.status as any,
          attachments: formData.attachments,
          aiGenerated: false,
        },
        currentUser
      );
    }

    refreshPlans();
    setShowEditorModal(false);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled lesson plan?')) {
      db.deleteLessonPlan(id, currentUser);
      refreshPlans();
      if (viewingPlan?.id === id) setViewingPlan(null);
    }
  };

  const handleDuplicatePlan = (id: string) => {
    db.duplicateLessonPlan(id, currentUser);
    refreshPlans();
  };

  const handleToggleStatus = (plan: LessonPlan) => {
    const nextStatus: Record<string, string> = {
      PLANNED: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'PLANNED',
      CANCELLED: 'PLANNED',
    };
    const newStatus = (nextStatus[plan.status] || 'PLANNED') as any;
    db.updateLessonPlan(plan.id, { status: newStatus }, currentUser);
    refreshPlans();
  };

  const handleAddAttachment = () => {
    if (!attName.trim()) return;

    const newAtt: LessonPlanAttachment = {
      id: `lpa_${Date.now()}`,
      name: attName.trim(),
      type: attType,
      url: attUrl.trim() || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
      size: '680 KB',
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAtt],
    }));

    setAttName('');
    setAttUrl('');
  };

  const handleRemoveAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id),
    }));
  };

  return (
    <div className="space-y-6" id="lesson-planner-manager">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Instructional Scheduling
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {plans.length} Lesson Plans Scheduled
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Lesson Planner & Curriculum Schedule</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Schedule, track, and align class lessons across terms and weeks with structured objectives, timeline management, and activity roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-add-lesson-plan"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD NEW LESSON PLAN</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher and Filters */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily View</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly View</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Calendar</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="all">All Classes</option>
              {assignedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No Scheduled Lesson Plans</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || selectedClassFilter !== 'all' || selectedStatusFilter !== 'all'
              ? 'No lesson plans match your current filters.'
              : 'You have not scheduled any lesson plans yet. Click below to add one.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Lesson Plan</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Class & Subject</th>
                  <th className="py-3 px-4">Topic & Sub-Topic</th>
                  <th className="py-3 px-4">Week & Term</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{plan.date || 'TBD'}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{plan.time || '08:30'} ({plan.duration || '45m'})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{plan.className}</span>
                      <span className="text-[11px] text-indigo-600 font-medium">{plan.subjectName}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{plan.topic}</div>
                      {plan.subTopic && (
                        <div className="text-[11px] text-slate-500 truncate">{plan.subTopic}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">Week {plan.weekNumber || 3}</span>
                      <span className="text-[11px] text-slate-400 block">{plan.term || 'Term 1'}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          plan.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : plan.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle status"
                      >
                        {plan.status || 'PLANNED'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingPlan(plan)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicatePlan(plan.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DAILY / WEEKLY / MONTHLY CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {plan.subjectName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {plan.className}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      plan.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : plan.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {plan.status || 'PLANNED'}
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{plan.date} at {plan.time || '08:30'} ({plan.duration || '45 mins'})</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {plan.topic}
                </h3>
                {plan.subTopic && (
                  <p className="text-xs font-medium text-blue-600 mt-1 line-clamp-1">
                    {plan.subTopic}
                  </p>
                )}

                {plan.objectives && plan.objectives.length > 0 && (
                  <div className="mt-3 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-1 text-[11px]">
                      Objectives:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 line-clamp-2">
                      {plan.objectives.slice(0, 2).map((obj, i) => (
                        <li key={i} className="line-clamp-1">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Week {plan.weekNumber} • {plan.term || 'Term 1'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingPlan(plan)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 text-xs font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(plan)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicatePlan(plan.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW PLAN MODAL */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lesson Plan Details</h3>
                  <p className="text-xs text-slate-500">
                    {viewingPlan.className} • {viewingPlan.subjectName} • Week {viewingPlan.weekNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const plan = viewingPlan;
                    setViewingPlan(null);
                    handleOpenEditModal(plan);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Plan</span>
                </button>
                <button
                  onClick={() => setViewingPlan(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Date & Time</span>
                  <strong className="text-slate-900">{viewingPlan.date} at {viewingPlan.time || '08:30'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Duration</span>
                  <strong className="text-slate-900">{viewingPlan.duration || '45 mins'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Week & Term</span>
                  <strong className="text-slate-900">Week {viewingPlan.weekNumber} ({viewingPlan.term || 'Term 1'})</strong>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[10px]">Status</span>
                  <span className="font-bold text-blue-700 uppercase">{viewingPlan.status}</span>
                </div>
              </div>

              <div className="space-y-1 pb-3 border-b border-slate-100">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{viewingPlan.topic}</h2>
                {viewingPlan.subTopic && (
                  <p className="text-xs sm:text-sm font-semibold text-blue-700">Sub-Topic: {viewingPlan.subTopic}</p>
                )}
              </div>

              {viewingPlan.objectives && viewingPlan.objectives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Lesson Objectives
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                    {viewingPlan.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingPlan.teachingActivities && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Teacher's Teaching Activities
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line">
                    {viewingPlan.teachingActivities}
                  </p>
                </div>
              )}

              {viewingPlan.studentActivities && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Students' Learning Activities
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line">
                    {viewingPlan.studentActivities}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingPlan.assessmentMethod && (
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <h5 className="text-xs font-bold uppercase text-amber-900 mb-1">Assessment Method</h5>
                    <p className="text-slate-700">{viewingPlan.assessmentMethod}</p>
                  </div>
                )}
                {viewingPlan.homework && (
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/60">
                    <h5 className="text-xs font-bold uppercase text-blue-900 mb-1">Homework Assigned</h5>
                    <p className="text-slate-700">{viewingPlan.homework}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LESSON PLAN MODAL */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingPlanId ? 'Edit Scheduled Lesson Plan' : 'Create New Lesson Plan'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {assignedClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {teacherSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Term</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Term 1">First Term (Term 1)</option>
                    <option value="Term 2">Second Term (Term 2)</option>
                    <option value="Term 3">Third Term (Term 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Week Number</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={formData.weekNumber}
                    onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Multiplication & Division of Fractions"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Cross-cancelling common factors"
                    value={formData.subTopic}
                    onChange={(e) => setFormData({ ...formData, subTopic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objectives (One per line) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Objective one\n2. Objective two"
                  value={formData.objectivesText}
                  onChange={(e) => setFormData({ ...formData, objectivesText: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teaching Activities</label>
                  <textarea
                    rows={2}
                    placeholder="Whiteboard modeling, questions..."
                    value={formData.teachingActivities}
                    onChange={(e) => setFormData({ ...formData, teachingActivities: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Activities</label>
                  <textarea
                    rows={2}
                    placeholder="Group drills, notebook work..."
                    value={formData.studentActivities}
                    onChange={(e) => setFormData({ ...formData, studentActivities: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Method</label>
                  <input
                    type="text"
                    placeholder="Oral questions, 3-item quiz..."
                    value={formData.assessmentMethod}
                    onChange={(e) => setFormData({ ...formData, assessmentMethod: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Homework Assigned</label>
                  <input
                    type="text"
                    placeholder="Workbook Page 45, Questions 1-5"
                    value={formData.homework}
                    onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingPlanId ? 'Update Lesson Plan' : 'Schedule Lesson Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
