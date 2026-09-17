import React, { useState, useMemo } from 'react';
import {
  Shield,
  ArrowRight,
  History,
  Calendar,
  Layers,
  BookOpen,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  Sparkles,
  Info,
  Clock,
  ChevronRight
} from 'lucide-react';
import { User, Branch, ClassRoom, Subject, TeacherReassignmentLog } from '../../types';
import { db } from '../../services/db';
import { isDirector, isSuperAdmin } from '../../utils/roles';

interface ReassignTeacherModalProps {
  teacher: User;
  currentUser: User;
  branches: Branch[];
  classes: ClassRoom[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: (updatedTeacher: User) => void;
}

export const ReassignTeacherModal: React.FC<ReassignTeacherModalProps> = ({
  teacher,
  currentUser,
  branches,
  classes,
  subjects,
  onClose,
  onSuccess,
}) => {
  const isDirectorOrSuperAdmin = isDirector(currentUser) || isSuperAdmin(currentUser);
  const isBranchAdmin = currentUser.role === 'ADMIN';

  // Active view tab: 'reassign' or 'history'
  const [activeTab, setActiveTab] = useState<'reassign' | 'history'>('reassign');

  // Reassignment Form State
  const [targetBranchId, setTargetBranchId] = useState<string>(
    isBranchAdmin && !isDirectorOrSuperAdmin
      ? currentUser.branchId || teacher.branchId || 'branch_bungalow'
      : teacher.branchId || 'branch_bungalow'
  );

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    teacher.assignedClasses || []
  );

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    teacher.assignedSubjects || []
  );

  const [isFormTeacher, setIsFormTeacher] = useState<boolean>(
    Boolean(teacher.formClassId)
  );

  const [formClassId, setFormClassId] = useState<string>(
    teacher.formClassId || (teacher.assignedClasses && teacher.assignedClasses[0]) || ''
  );

  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [reason, setReason] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Available classes for target branch
  const branchClasses = useMemo(() => {
    return classes.filter(c => c.branchId === targetBranchId);
  }, [classes, targetBranchId]);

  // Current teaching assignments for display
  const currentBranchName = useMemo(() => {
    return branches.find(b => b.id === teacher.branchId)?.name || teacher.branchName || 'Bungalow Campus';
  }, [branches, teacher]);

  const targetBranchName = useMemo(() => {
    return branches.find(b => b.id === targetBranchId)?.name || 'Bungalow Campus';
  }, [branches, targetBranchId]);

  const currentClassNames = useMemo(() => {
    return (teacher.assignedClasses || [])
      .map(id => classes.find(c => c.id === id)?.name)
      .filter(Boolean);
  }, [classes, teacher]);

  const currentSubjectNames = useMemo(() => {
    return (teacher.assignedSubjects || [])
      .map(id => subjects.find(s => s.id === id)?.name)
      .filter(Boolean);
  }, [subjects, teacher]);

  const targetClassNames = useMemo(() => {
    return selectedClassIds
      .map(id => classes.find(c => c.id === id)?.name)
      .filter(Boolean);
  }, [classes, selectedClassIds]);

  const targetSubjectNames = useMemo(() => {
    return selectedSubjectIds
      .map(id => subjects.find(s => s.id === id)?.name)
      .filter(Boolean);
  }, [subjects, selectedSubjectIds]);

  // Reassignment logs for this teacher
  const reassignmentLogs = useMemo(() => {
    return db.getTeacherReassignmentLogs({ teacherId: teacher.id });
  }, [teacher.id, successMsg]);

  // Handle class toggle
  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev => {
      const next = prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId];

      if (!next.includes(formClassId) && isFormTeacher) {
        setFormClassId(next[0] || '');
      }
      return next;
    });
  };

  // Handle subject toggle
  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Validation before confirmation
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedClassIds.length === 0) {
      setErrorMsg('Please select at least one target class.');
      return;
    }

    if (selectedSubjectIds.length === 0) {
      setErrorMsg('Please select at least one target subject.');
      return;
    }

    if (isFormTeacher && !formClassId) {
      setErrorMsg('Please select which class this teacher will serve as Form Teacher for.');
      return;
    }

    if (!effectiveDate) {
      setErrorMsg('Effective date is required.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute Reassignment
  const handleExecuteReassignment = () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = db.reassignTeacherActiveAssignment(
        {
          teacherId: teacher.id,
          newBranchId: targetBranchId,
          newClassIds: selectedClassIds,
          newSubjectIds: selectedSubjectIds,
          isFormTeacher,
          formClassId: isFormTeacher ? formClassId : undefined,
          effectiveDate,
          reason: reason.trim() || 'Official academic term reallocation',
        },
        currentUser
      );

      setSuccessMsg(result.message);
      setShowConfirmModal(false);

      // Fetch updated teacher record
      const updatedTeacher = db.getUsers().find(u => u.id === teacher.id);
      if (updatedTeacher) {
        setTimeout(() => {
          onSuccess(updatedTeacher);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reassign teacher. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">REASSIGN TEACHER</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Controlled Flow
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Authorized teacher class, subject, and campus reallocation with immutable historical audit retention.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('reassign')}
            className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reassign'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Reassignment Setup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Reassignment History</span>
            {reassignmentLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                {reassignmentLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* NOTIFICATIONS / FEEDBACK */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Reassignment Blocked</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Reassignment Complete</p>
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        {/* TAB 1: REASSIGNMENT FORM */}
        {activeTab === 'reassign' && (
          <form onSubmit={handleProceedToConfirm} className="p-6 space-y-6">
            {/* TEACHER PROFILE OVERVIEW */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={teacher.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120'}
                  alt={teacher.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-200 shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{teacher.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      {teacher.schoolId || teacher.staffId || 'TEACHER'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{teacher.email}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{currentBranchName}</span>
                  </div>
                </div>
              </div>

              {/* Current Assignments pill list */}
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Active Teaching Load
                </span>
                <div className="flex flex-wrap sm:justify-end gap-1">
                  {currentClassNames.length > 0 ? (
                    currentClassNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 shadow-2xs"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No class allocated</span>
                  )}
                </div>
                {teacher.formClassName && (
                  <span className="text-[10px] font-semibold text-purple-700 mt-1 block">
                    Form Teacher: {teacher.formClassName}
                  </span>
                )}
              </div>
            </div>

            {/* SELECTION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* TARGET CAMPUS / BRANCH */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Target Campus / Branch</span>
                  {isBranchAdmin && !isDirectorOrSuperAdmin && (
                    <span className="text-[10px] text-amber-600 font-normal ml-auto">
                      (Locked to your assigned branch)
                    </span>
                  )}
                </label>
                <select
                  value={targetBranchId}
                  disabled={isBranchAdmin && !isDirectorOrSuperAdmin}
                  onChange={e => {
                    setTargetBranchId(e.target.value);
                    setSelectedClassIds([]);
                    setFormClassId('');
                  }}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cross-branch reassignments are authorized for Director and Super Admin.
                </p>
              </div>

              {/* EFFECTIVE DATE PICKER */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Effective Date</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs font-medium"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Active teaching schedule commences from this date.
                </p>
              </div>
            </div>

            {/* CLASS SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Select Target Class(es)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedClassIds.length} class(es) selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                {branchClasses.map(cls => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cls.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUBJECT ALLOCATION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Assign Subject(s)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedSubjectIds.length} subject(s) selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                {subjects.map(sub => {
                  const isSelected = selectedSubjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM TEACHER TOGGLE & SELECTION */}
            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-900">Form Teacher Allocation</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFormTeacher}
                    onChange={e => {
                      setIsFormTeacher(e.target.checked);
                      if (e.target.checked && selectedClassIds.length > 0) {
                        setFormClassId(selectedClassIds[0]);
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-purple-800">Designate as Form Teacher</span>
                </label>
              </div>

              {isFormTeacher && (
                <div className="pt-2 border-t border-purple-200 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-medium text-purple-900">Select Form Class:</span>
                  <select
                    value={formClassId}
                    onChange={e => setFormClassId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold text-purple-900"
                  >
                    <option value="">-- Choose Class --</option>
                    {selectedClassIds.map(cid => {
                      const cls = classes.find(c => c.id === cid);
                      return (
                        <option key={cid} value={cid}>
                          {cls?.name || cid}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* ADMINISTRATIVE REASON */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Administrative Reassignment Reason / Notes (Audit Record)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Sessional teacher redeployment, academic realignment, covering primary class..."
                rows={2}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs resize-none"
              />
            </div>

            {/* IMMUTABLE HISTORICAL PRESERVATION NOTICE */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-900 leading-relaxed">
                <span className="font-bold">Historical Record Protection Policy: </span>
                Reassigning this teacher only alters their current active teaching portfolio. All past lesson notes,
                lesson plans, attendance logs, assessment submissions, and student evaluation reports from previous
                terms remain permanently linked to their historical classes.
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Review & Reassign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REASSIGNMENT HISTORY */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 max-h-[550px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audit History for {teacher.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Every assignment transition is stamped with author, date, and previous class records.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {reassignmentLogs.length} Recorded Movement(s)
              </span>
            </div>

            {reassignmentLogs.length > 0 ? (
              <div className="space-y-3">
                {reassignmentLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 shadow-2xs transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-900">
                          Effective Date: {log.effectiveDate}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Logged on {new Date(log.createdAt).toLocaleDateString()} by {log.reassignedByUserName} ({log.reassignedByUserRole})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Previous State */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Previous Active Assignment
                        </span>
                        <div className="font-semibold text-slate-800">
                          {log.previousBranchName}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          <span className="font-medium text-slate-500">Classes: </span>
                          {log.previousClassNames.join(', ') || 'None'}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          <span className="font-medium text-slate-500">Subjects: </span>
                          {log.previousSubjectNames.join(', ') || 'None'}
                        </div>
                        {log.previousFormClassName && (
                          <div className="text-[10px] text-purple-700 mt-1 font-semibold">
                            Form Class: {log.previousFormClassName}
                          </div>
                        )}
                      </div>

                      {/* New State */}
                      <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                        <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">
                          Reassigned Assignment
                        </span>
                        <div className="font-semibold text-indigo-900">
                          {log.newBranchName}
                        </div>
                        <div className="text-[11px] text-indigo-900 mt-1">
                          <span className="font-medium text-indigo-700">Classes: </span>
                          {log.newClassNames.join(', ') || 'None'}
                        </div>
                        <div className="text-[11px] text-indigo-900">
                          <span className="font-medium text-indigo-700">Subjects: </span>
                          {log.newSubjectNames.join(', ') || 'None'}
                        </div>
                        {log.newFormClassName && (
                          <div className="text-[10px] text-purple-800 mt-1 font-semibold">
                            Form Class: {log.newFormClassName}
                          </div>
                        )}
                      </div>
                    </div>

                    {log.reason && (
                      <div className="text-[11px] text-slate-600 italic bg-slate-50/80 p-2 rounded border border-slate-100">
                        "{log.reason}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-xs">No Reassignment History Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This teacher has maintained their initial class allocation.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION MODAL POPUP */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Teacher Reassignment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Please verify the reassignment details before applying changes.
                  </p>
                </div>
              </div>

              {/* Comparison Summary */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-3 bg-slate-50/70 flex justify-between font-medium">
                  <span className="text-slate-500">Teacher:</span>
                  <span className="font-bold text-slate-900">{teacher.name}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Target Campus:</span>
                  <span className="font-bold text-slate-900">{targetBranchName}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">New Class(es):</span>
                  <span className="font-bold text-indigo-700">{targetClassNames.join(', ')}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">New Subject(s):</span>
                  <span className="font-bold text-teal-700">{targetSubjectNames.join(', ')}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Form Teacher:</span>
                  <span className="font-bold text-purple-700">
                    {isFormTeacher
                      ? classes.find(c => c.id === formClassId)?.name || 'Yes'
                      : 'None'}
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Effective Date:</span>
                  <span className="font-bold text-slate-900">{effectiveDate}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800 leading-normal">
                <span className="font-bold">Notice: </span>
                Active class visibility in the teacher's dashboard will shift to {targetClassNames.join(', ')}. All prior term archives and student scores are permanently preserved.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteReassignment}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Applying...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Reassign</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
