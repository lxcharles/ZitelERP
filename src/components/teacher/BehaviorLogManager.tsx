import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  Sparkles,
  Eye,
  EyeOff,
  Calendar,
  User as UserIcon,
  Trash2,
  Edit3,
  TrendingUp,
  HeartHandshake,
  Star,
  Users,
  ChevronDown,
  ChevronUp,
  Tag,
  Smile,
  X
} from 'lucide-react';
import { User, Student, Class, BehaviorRecord, BehaviorStatusType, BehaviorCategory } from '../../types';
import { db } from '../../services/db';
import { BehaviorConcernTrendsChart } from '../behavior/BehaviorConcernTrendsChart';

interface BehaviorLogManagerProps {
  currentUser: User;
  activeClass: Class;
  students: Student[];
  onOpenTimelineModal?: (studentId: string) => void;
}

export const BehaviorLogManager: React.FC<BehaviorLogManagerProps> = ({
  currentUser,
  activeClass,
  students,
}) => {
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [showTrendChart, setShowTrendChart] = useState<boolean>(true);

  // Modal State
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BehaviorRecord | null>(null);

  // Form State
  const [formStudentId, setFormStudentId] = useState<string>(students[0]?.id || '');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<string>('Classroom Conduct');
  const [formStatus, setFormStatus] = useState<BehaviorStatusType>('Positive');
  const [formHeadline, setFormHeadline] = useState('');
  const [formObservation, setFormObservation] = useState('');
  const [formDetailedComments, setFormDetailedComments] = useState('');
  const [formActionTaken, setFormActionTaken] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formPoints, setFormPoints] = useState<number>(3);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);

  // Active categories from DB
  const categories: BehaviorCategory[] = db.getBehaviorCategories().filter(c => c.isActive !== false);

  // Fetch live behavior records for this class
  const records = db.getBehaviorRecords({
    classId: activeClass.id,
    user: currentUser,
  });

  const isFormTeacher = activeClass.formTeacherId === currentUser.id;

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (selectedStudentFilter !== 'ALL' && r.studentId !== selectedStudentFilter) return false;
    if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;
    if (selectedCategoryFilter !== 'ALL' && r.category !== selectedCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchObs = r.observation.toLowerCase().includes(q);
      const matchHead = (r.headline || '').toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      if (!matchName && !matchObs && !matchHead && !matchCat) return false;
    }
    return true;
  });

  // Analytics counts
  const positiveCount = records.filter(r => r.status === 'Positive').length;
  const neutralCount = records.filter(r => r.status === 'Neutral').length;
  const concernCount = records.filter(r => r.status === 'Concern').length;
  const incidentCount = records.filter(r => r.status === 'Incident').length;
  const totalPoints = records.reduce((sum, r) => sum + (r.points || 0), 0);

  const handleOpenCreateModal = (studentId?: string) => {
    setEditingRecord(null);
    setFormStudentId(studentId || students[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('Classroom Conduct');
    setFormStatus('Positive');
    setFormHeadline('');
    setFormObservation('');
    setFormDetailedComments('');
    setFormActionTaken('');
    setFormRating(5);
    setFormPoints(3);
    setFormIsPublished(true);
    setShowEntryModal(true);
  };

  const handleOpenEditModal = (rec: BehaviorRecord) => {
    setEditingRecord(rec);
    setFormStudentId(rec.studentId);
    setFormDate(rec.date);
    setFormCategory(rec.category);
    setFormStatus(rec.status);
    setFormHeadline(rec.headline || '');
    setFormObservation(rec.observation);
    setFormDetailedComments(rec.detailedComments || '');
    setFormActionTaken(rec.actionTaken || '');
    setFormRating(rec.rating || 5);
    setFormPoints(rec.points || 0);
    setFormIsPublished(rec.isPublishedToParent !== false);
    setShowEntryModal(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formObservation.trim()) return;

    const student = students.find(s => s.id === formStudentId);
    if (!student) return;

    if (editingRecord) {
      db.updateBehaviorRecord(
        editingRecord.id,
        {
          studentId: student.id,
          studentName: student.fullName,
          classId: activeClass.id,
          className: activeClass.name,
          branchId: activeClass.branchId,
          date: formDate,
          category: formCategory,
          status: formStatus,
          headline: formHeadline.trim() || undefined,
          observation: formObservation.trim(),
          detailedComments: formDetailedComments.trim() || undefined,
          actionTaken: formActionTaken.trim() || undefined,
          rating: formRating,
          points: formPoints,
          isPublishedToParent: formIsPublished,
        },
        currentUser
      );
    } else {
      db.addBehaviorRecord(
        {
          studentId: student.id,
          studentName: student.fullName,
          classId: activeClass.id,
          className: activeClass.name,
          branchId: activeClass.branchId,
          date: formDate,
          category: formCategory,
          status: formStatus,
          headline: formHeadline.trim() || undefined,
          observation: formObservation.trim(),
          detailedComments: formDetailedComments.trim() || undefined,
          actionTaken: formActionTaken.trim() || undefined,
          rating: formRating,
          points: formPoints,
          visibility: formIsPublished ? 'PARENT_VISIBLE' : 'STAFF_ONLY',
          isPublishedToParent: formIsPublished,
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          teacherRole: isFormTeacher ? 'Form Teacher' : 'Subject Teacher',
        },
        currentUser
      );
    }

    setShowEntryModal(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this behavioral log entry?')) {
      db.deleteBehaviorRecord(id, currentUser);
    }
  };

  const getStatusBadge = (status: BehaviorStatusType) => {
    switch (status) {
      case 'Positive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Positive
          </span>
        );
      case 'Neutral':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Neutral
          </span>
        );
      case 'Concern':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Behavioral Concern
          </span>
        );
      case 'Incident':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Incident
          </span>
        );
    }
  };

  // Group records by Date for Timeline
  const groupedDates = filteredRecords.reduce((acc, rec) => {
    const d = rec.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(rec);
    return acc;
  }, {} as Record<string, BehaviorRecord[]>);

  const sortedDates = Object.keys(groupedDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6" id="behavioral-log-manager">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Student Behavioral Log & Timeline</h2>
              <p className="text-xs text-slate-500 font-medium">
                Document meaningful classroom conduct, behavioral observations, and student character progression for {activeClass.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrendChart(!showTrendChart)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              showTrendChart
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            id="btn-toggle-concern-d3-chart"
          >
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span>{showTrendChart ? 'Hide D3 Trends' : 'View Concern Trajectory (D3)'}</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            id="btn-new-behavior-log"
          >
            <Plus className="w-4 h-4" />
            <span>Document Behavioral Entry</span>
          </button>
        </div>
      </div>

      {/* D3 Behavioral Concern Weekly Trajectory & Escalation Triggers Chart */}
      {showTrendChart && (
        <div className="transition-all animate-fadeIn">
          <BehaviorConcernTrendsChart
            currentUser={currentUser}
            classId={activeClass.id}
            onSelectStudent={(studentId) => {
              setSelectedStudentFilter(studentId);
            }}
          />
        </div>
      )}

      {/* Overview Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Observations</span>
            <Tag className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{records.length}</p>
          <span className="text-[10px] text-slate-400 font-medium">In {activeClass.name} class</span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Positive Conduct</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{positiveCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {records.length > 0 ? Math.round((positiveCount / records.length) * 100) : 0}% positive ratio
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Neutral Notes</span>
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{neutralCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Standard behavioral checks</span>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Behavioral Concerns</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{concernCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Needing reinforcement</span>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Disciplinary Incidents</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{incidentCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">
            {incidentCount === 0 ? 'Exemplary cohort safety' : 'Requires intervention'}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search observations, students, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Student Filter */}
          <div>
            <select
              value={selectedStudentFilter}
              onChange={e => setSelectedStudentFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Students ({students.length})</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Conduct Statuses</option>
              <option value="Positive">Positive (Commendation)</option>
              <option value="Neutral">Neutral (General Observation)</option>
              <option value="Concern">Behavioral Concern (Academic / Habit)</option>
              <option value="Incident">Incident (Rule Infraction)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Quick Badges */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of {records.length} total records
          </span>
          {(selectedStudentFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedCategoryFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStudentFilter('ALL');
                setSelectedStatusFilter('ALL');
                setSelectedCategoryFilter('ALL');
                setSearchQuery('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Behavioral Log Timeline Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Chronological Behavioral Timeline</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Newest Entries First</span>
        </div>

        {sortedDates.length === 0 ? (
          <div className="py-12 text-center">
            <Smile className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No behavioral entries match current criteria</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Use the "Document Behavioral Entry" button above to log positive classroom achievements or observations for individual pupils.
            </p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {sortedDates.map(dateKey => {
              const dateObj = new Date(dateKey + 'T00:00:00');
              const formattedDate = isNaN(dateObj.getTime())
                ? dateKey
                : dateObj.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).toUpperCase();

              const dayRecords = groupedDates[dateKey];

              return (
                <div key={dateKey} className="relative pl-9">
                  {/* Timeline Date Marker */}
                  <div className="absolute -left-1 top-0 w-9 h-9 rounded-full bg-indigo-50 border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                    <Calendar className="w-4 h-4 text-indigo-700" />
                  </div>

                  <div className="mb-3">
                    <span className="inline-block text-xs font-black uppercase tracking-wider text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Day's Records */}
                  <div className="space-y-3">
                    {dayRecords.map(rec => {
                      const isExpanded = expandedRecordId === rec.id;
                      const studentObj = students.find(s => s.id === rec.studentId);

                      return (
                        <div
                          key={rec.id}
                          className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all p-4 shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Student & Category */}
                            <div className="flex items-start gap-3">
                              <img
                                src={studentObj?.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                                alt={rec.studentName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-slate-900">{rec.studentName}</h4>
                                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {rec.category}
                                  </span>
                                  {getStatusBadge(rec.status)}
                                </div>

                                {rec.headline && (
                                  <p className="text-xs font-bold text-indigo-950 mt-1">
                                    {rec.headline}
                                  </p>
                                )}

                                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                  "{rec.observation}"
                                </p>
                              </div>
                            </div>

                            {/* Actions & Meta */}
                            <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                              <div className="flex items-center gap-1.5">
                                {rec.points !== undefined && rec.points !== 0 && (
                                  <span
                                    className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                                      rec.points > 0
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {rec.points > 0 ? `+${rec.points}` : rec.points} pts
                                  </span>
                                )}

                                {rec.isPublishedToParent ? (
                                  <span
                                    className="p-1 text-emerald-600 bg-emerald-50 rounded-md"
                                    title="Published to Parent Portal"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span
                                    className="p-1 text-slate-400 bg-slate-100 rounded-md"
                                    title="Staff Only / Private"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditModal(rec)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit observation"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable details if comments or action taken exist */}
                          {(rec.detailedComments || rec.actionTaken) && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100">
                              <button
                                onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    <span>Hide Behavioral Details</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    <span>View Detailed Comments & Action Taken</span>
                                  </>
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                                  {rec.detailedComments && (
                                    <div>
                                      <span className="font-bold text-slate-700 block mb-0.5">
                                        Detailed Teacher Comments:
                                      </span>
                                      <p className="text-slate-600 leading-relaxed">
                                        {rec.detailedComments}
                                      </p>
                                    </div>
                                  )}

                                  {rec.actionTaken && (
                                    <div>
                                      <span className="font-bold text-slate-700 block mb-0.5">
                                        Action / Intervention Taken:
                                      </span>
                                      <p className="text-slate-600 leading-relaxed">
                                        {rec.actionTaken}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                                    <span>Logged by: {rec.teacherName} ({rec.teacherRole || 'Teacher'})</span>
                                    {rec.subjectName && <span>Subject: {rec.subjectName}</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT BEHAVIOR ENTRY MODAL */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingRecord ? 'Edit Behavioral Entry' : 'Create Student Behavioral Entry'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Record structured behavioral observations, conduct feedback, and merit points
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEntryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-5 space-y-4">
              {/* Student & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Student <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formStudentId}
                    onChange={e => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observation Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Behavior Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Conduct Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Positive', 'Neutral', 'Concern', 'Incident'] as BehaviorStatusType[]).map(st => {
                      const isSel = formStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setFormStatus(st);
                            if (st === 'Positive') setFormPoints(3);
                            else if (st === 'Neutral') setFormPoints(0);
                            else if (st === 'Concern') setFormPoints(-1);
                            else if (st === 'Incident') setFormPoints(-3);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border transition-all ${
                            isSel
                              ? st === 'Positive'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : st === 'Neutral'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : st === 'Concern'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Headline / Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brief Headline / Milestone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Active group participation & cooperation"
                  value={formHeadline}
                  onChange={e => setFormHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Primary Observation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observation Narrative <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder='e.g. "Participated actively in group work today and demonstrated strong cooperation with classmates during the fractions geometry exercise."'
                  value={formObservation}
                  onChange={e => setFormObservation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Detailed Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Comments / Behavioral Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add specific context, triggers, student response, or peer dynamics..."
                  value={formDetailedComments}
                  onChange={e => setFormDetailedComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Action Taken */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action / Remediation / Commendation Taken (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commended verbally in class; awarded 5 house points."
                  value={formActionTaken}
                  onChange={e => setFormActionTaken(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Points & Rating & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Merit / Demerit Points
                  </label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={e => setFormPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rating (1 to 5)
                  </label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className={`p-1 rounded ${formRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent Portal Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormIsPublished(!formIsPublished)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formIsPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {formIsPublished ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visible to Parent</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Staff Internal Only</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingRecord ? 'Update Behavioral Entry' : 'Save Behavioral Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
