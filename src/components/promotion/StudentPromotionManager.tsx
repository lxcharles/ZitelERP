import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  Users,
  Check,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { User, Student, ClassRoom, StudentPromotionRecord, PromotionStatus, Branch } from '../../types';
import { db } from '../../services/db';

interface StudentPromotionManagerProps {
  currentUser: User;
  initialClassId?: string;
  onViewStudentArchive?: (studentId: string) => void;
}

export const StudentPromotionManager: React.FC<StudentPromotionManagerProps> = ({
  currentUser,
  initialClassId,
  onViewStudentArchive
}) => {
  const [branches] = useState<Branch[]>(db.getBranches());
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    if (currentUser.branchId && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'DIRECTOR') {
      return currentUser.branchId;
    }
    return db.getActiveBranchId() === 'all' ? (branches[0]?.id || 'branch_bungalow') : db.getActiveBranchId();
  });

  const availableClasses = useMemo(() => {
    const cls = db.getClasses().filter(c => !activeBranchId || activeBranchId === 'all' || c.branchId === activeBranchId);
    if (currentUser.role === 'TEACHER') {
      // Filter to classes assigned to teacher
      return cls.filter(c => 
        c.id === currentUser.formClassId ||
        (currentUser.assignedClasses && currentUser.assignedClasses.includes(c.id))
      );
    }
    return cls;
  }, [activeBranchId, currentUser]);

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initialClassId && availableClasses.some(c => c.id === initialClassId)) {
      return initialClassId;
    }
    return availableClasses[0]?.id || '';
  });

  // Keep selectedClassId valid when branch changes
  React.useEffect(() => {
    if (!availableClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(availableClasses[0]?.id || '');
    }
  }, [availableClasses, selectedClassId]);

  const selectedClass = useMemo(() => {
    return availableClasses.find(c => c.id === selectedClassId);
  }, [availableClasses, selectedClassId]);

  // Destination progression calculation
  const defaultProgression = useMemo(() => {
    if (!selectedClass) return null;
    return db.getNextProgressionClass(selectedClass, activeBranchId);
  }, [selectedClass, activeBranchId]);

  const [customDestinationClassId, setCustomDestinationClassId] = useState<string>('');
  const [useCustomDestination, setUseCustomDestination] = useState<boolean>(false);
  const [overrideRemarks, setOverrideRemarks] = useState<string>('');

  // Selected destination class
  const destinationClass = useMemo(() => {
    if (useCustomDestination && customDestinationClassId) {
      if (customDestinationClassId === 'graduated') {
        return {
          id: 'cls_graduated',
          name: 'Graduated / Alumni',
          isGraduation: true
        };
      }
      const matched = db.getClasses().find(c => c.id === customDestinationClassId);
      return matched ? { id: matched.id, name: matched.name, isGraduation: false } : null;
    }

    if (!defaultProgression) return null;
    return {
      id: defaultProgression.nextClassId || 'cls_next',
      name: defaultProgression.nextClassName,
      isGraduation: defaultProgression.isGraduation
    };
  }, [useCustomDestination, customDestinationClassId, defaultProgression]);

  // Window status & override
  const [windowStatus, setWindowStatus] = useState(() => db.isPromotionWindowOpen());
  const [refreshKey, setRefreshKey] = useState(0);

  const termCtx = useMemo(() => db.getTermContext(), [refreshKey]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return db.getStudents().filter(s => s.classId === selectedClassId && s.status !== 'Graduated' && s.status !== 'Transferred' && s.status !== 'Withdrawn');
  }, [selectedClassId, refreshKey]);

  // Student lock & promotion status map
  const studentPromotionStatusMap = useMemo(() => {
    const map = new Map<string, { isLocked: boolean; record?: StudentPromotionRecord }>();
    for (const stu of classStudents) {
      const lockCheck = db.checkStudentPromotionLocked(stu.id, termCtx.activeSession.name);
      map.set(stu.id, lockCheck);
    }
    return map;
  }, [classStudents, termCtx.activeSession.name, refreshKey]);

  // Selection state for selective promotion
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPromotionType, setPendingPromotionType] = useState<'all' | 'selected'>('all');
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<{
    success: boolean;
    message: string;
    totalPromoted: number;
    skippedCount: number;
    errors: string[];
    batchId?: string;
  } | null>(null);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.schoolId && s.schoolId.toLowerCase().includes(q))
      );
    });
  }, [classStudents, searchQuery]);

  // Check user authority
  const permissionCheck = useMemo(() => {
    return db.canUserPromoteStudents(currentUser, selectedClassId, activeBranchId);
  }, [currentUser, selectedClassId, activeBranchId]);

  // Handle select all toggle
  const handleToggleSelectAll = () => {
    const selectableStudents = filteredStudents.filter(
      s => !studentPromotionStatusMap.get(s.id)?.isLocked
    );
    if (selectedStudentIds.length === selectableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(selectableStudents.map(s => s.id));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    if (studentPromotionStatusMap.get(studentId)?.isLocked) return;
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleOpenConfirmModal = (type: 'all' | 'selected') => {
    setPendingPromotionType(type);
    setShowConfirmModal(true);
  };

  const handleExecutePromotion = () => {
    if (!selectedClass || !destinationClass) return;

    setIsPromoting(true);
    const targetStudentIds = pendingPromotionType === 'all'
      ? classStudents
          .filter(s => !studentPromotionStatusMap.get(s.id)?.isLocked)
          .map(s => s.id)
      : selectedStudentIds;

    const promotionStatus: PromotionStatus = destinationClass.isGraduation ? 'Graduated' : 'Promoted';

    const res = db.promoteBatchStudents({
      studentIds: targetStudentIds,
      fromClassId: selectedClass.id,
      fromClassName: selectedClass.name,
      toClassId: destinationClass.id,
      toClassName: destinationClass.name,
      branchId: activeBranchId,
      academicSession: termCtx.activeSession.name,
      term: termCtx.activeTerm.name,
      status: promotionStatus,
      remarks: overrideRemarks.trim() || undefined
    }, currentUser);

    setIsPromoting(false);
    setShowConfirmModal(false);
    setSelectedStudentIds([]);
    setRefreshKey(prev => prev + 1);
    setPromotionResult({
      success: res.success,
      message: res.success 
        ? `Promotion successfully executed for ${res.totalPromoted} student(s) into ${destinationClass.name}.`
        : 'Promotion failed or all selected students were already promoted.',
      totalPromoted: res.totalPromoted,
      skippedCount: res.skippedCount,
      errors: res.errors,
      batchId: res.batchId
    });
  };

  // Toggle override
  const handleToggleWindowOverride = (overrideValue: boolean | null) => {
    db.setPromotionWindowOverride(overrideValue, currentUser);
    setWindowStatus(db.isPromotionWindowOpen());
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Student Academic Promotion & Progression
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {termCtx.activeSession.name} • {termCtx.activeTerm.name}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                Advance eligible students into their next academic tier with permanent session archival, 
                progression mapping, duplicate lock protection, and institutional ID preservation.
              </p>
            </div>
          </div>

          {/* Promotion Window Status Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              windowStatus.isOpen 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {windowStatus.isOpen ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {windowStatus.isOpen ? 'Promotion Window Active' : 'Promotion Window Closed'}
                </p>
                <p className="text-[11px] opacity-80 line-clamp-1">{windowStatus.reason}</p>
              </div>
            </div>

            {/* Admin Override Controls for Super Admin and Directors */}
            {['SUPER_ADMIN', 'DIRECTOR'].includes(currentUser.role) && (
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {windowStatus.isOverride ? (
                  <button
                    onClick={() => handleToggleWindowOverride(null)}
                    className="text-xs font-semibold px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reset to automated school calendar rules"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Calendar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleWindowOverride(!windowStatus.isOpen)}
                    className="text-xs font-semibold px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Force toggle promotion window for administrative execution or audit"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{windowStatus.isOpen ? 'Force Close Window' : 'Open Promotion Window'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Permission Notice if user cannot promote */}
        {!permissionCheck.allowed && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Promotion Authority Notice: </span>
              {permissionCheck.reason || 'You do not have administrative promotion authorization for this classroom.'}
            </div>
          </div>
        )}
      </div>

      {/* Promotion Result Alert */}
      {promotionResult && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm ${
          promotionResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-2.5">
            {promotionResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">{promotionResult.message}</p>
              {promotionResult.batchId && (
                <p className="text-xs font-mono text-emerald-700 mt-0.5">
                  Batch Audit Code: {promotionResult.batchId}
                </p>
              )}
              {promotionResult.errors.length > 0 && (
                <ul className="mt-2 text-xs space-y-1 text-rose-700 list-disc list-inside">
                  {promotionResult.errors.slice(0, 3).map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            onClick={() => setPromotionResult(null)}
            className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Branch, Class, Destination */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Branch Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>School Branch</span>
          </label>
          <select
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
            disabled={currentUser.role === 'TEACHER' || (currentUser.role === 'ADMIN' && currentUser.branchId !== undefined)}
            className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* 2. Source Classroom */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Current Class Being Promoted</span>
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {availableClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 3. Destination Classroom Progression */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Destination Class</span>
            </label>
            {['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(currentUser.role) && (
              <button
                type="button"
                onClick={() => setUseCustomDestination(!useCustomDestination)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {useCustomDestination ? 'Use Standard Progression' : 'Customize Destination'}
              </button>
            )}
          </div>

          {useCustomDestination ? (
            <select
              value={customDestinationClassId}
              onChange={(e) => setCustomDestinationClassId(e.target.value)}
              className="w-full text-sm font-semibold text-indigo-950 bg-indigo-50/50 border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Select Destination Class --</option>
              {db.getClasses().filter(c => !activeBranchId || activeBranchId === 'all' || c.branchId === activeBranchId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="graduated">🎓 Graduated / Alumni</option>
            </select>
          ) : (
            <div className="w-full px-3 py-2 bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-lg flex items-center justify-between text-sm">
              <span className="font-bold flex items-center gap-2">
                {defaultProgression?.isGraduation ? '🎓' : '📚'} {defaultProgression?.nextClassName || 'Select Class'}
              </span>
              {defaultProgression?.isOptionalBasic6 && (
                <span className="text-[10px] bg-indigo-200/80 text-indigo-900 font-bold px-1.5 py-0.5 rounded">
                  Basic 6 Optional (or JSS 1)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progression Banner Explanation */}
      {selectedClass && destinationClass && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-center sm:text-left">
              <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">Progression Flow</span>
              <div className="flex items-center gap-2 text-lg sm:text-xl font-black mt-0.5">
                <span>{selectedClass.name}</span>
                <ArrowRight className="w-5 h-5 text-indigo-400" />
                <span className="text-emerald-400">{destinationClass.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Action Buttons */}
            <button
              onClick={() => handleOpenConfirmModal('selected')}
              disabled={!permissionCheck.allowed || (!windowStatus.isOpen && currentUser.role === 'TEACHER') || selectedStudentIds.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Promote Selected ({selectedStudentIds.length})</span>
            </button>

            <button
              onClick={() => handleOpenConfirmModal('all')}
              disabled={!permissionCheck.allowed || (!windowStatus.isOpen && currentUser.role === 'TEACHER') || classStudents.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Promote All Students ({classStudents.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Students Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Enrolled Students ({filteredStudents.length})
            </h3>
            <p className="text-xs text-slate-500">
              Select specific students or promote the entire class batch at once.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table Content */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No students found in {selectedClass?.name || 'this class'}.</p>
            <p className="text-xs text-slate-400 mt-1">Enroll students into this class or switch classrooms above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudentIds.length > 0 &&
                        selectedStudentIds.length ===
                          filteredStudents.filter(s => !studentPromotionStatusMap.get(s.id)?.isLocked).length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Official School ID</th>
                  <th className="py-3 px-4">Current Class</th>
                  <th className="py-3 px-4">Session Performance</th>
                  <th className="py-3 px-4">Promotion Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const lockState = studentPromotionStatusMap.get(student.id);
                  const isLocked = lockState?.isLocked;
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLocked ? 'bg-slate-50/40' : isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isLocked}
                          onChange={() => handleToggleStudent(student.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                            alt={student.fullName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{student.fullName}</p>
                            <p className="text-[11px] text-slate-500">{student.gender || 'Student'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Institutional ID (NOT Firebase UID) */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {student.schoolId || `ZCS/STU/${student.id.substring(0, 5)}`}
                        </span>
                      </td>

                      {/* Current Class */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {student.className || selectedClass?.name}
                        </span>
                      </td>

                      {/* Session Performance */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `84%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">84.0%</span>
                        </div>
                      </td>

                      {/* Promotion Status / Lock State */}
                      <td className="py-3.5 px-4">
                        {isLocked && lockState?.record ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200" title={`Promoted to ${lockState.record.toClassName} on ${new Date(lockState.record.promotedAt).toLocaleDateString()} by ${lockState.record.promotedByUserName}`}>
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Student Already Promoted</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Pending Promotion
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLocked && lockState?.record ? (
                            <button
                              onClick={() => {
                                if (onViewStudentArchive) {
                                  onViewStudentArchive(student.id);
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                              title="View permanent academic history & archived report card"
                            >
                              View History
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStudentIds([student.id]);
                                handleOpenConfirmModal('selected');
                              }}
                              disabled={!permissionCheck.allowed || (!windowStatus.isOpen && currentUser.role === 'TEACHER')}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Promote
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL (Strict Scope Requirement) */}
      {showConfirmModal && selectedClass && destinationClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-800 rounded-lg border border-indigo-700">
                    <GraduationCap className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      Confirm Academic Promotion
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Zitel Castle School Academic Progression Verification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-indigo-300 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content Verification Screen */}
            <div className="p-5 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Important Academic Archival Policy
                </p>
                <p>
                  Executing promotion will permanently archive the current completed session ({termCtx.activeSession.name})
                  results and advance the students into their destination class. Their permanent School ID will remain unchanged.
                </p>
              </div>

              {/* Promotion Metadata Table */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Academic Session:</span>
                  <span className="font-bold text-slate-800">{termCtx.activeSession.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Current Term:</span>
                  <span className="font-bold text-slate-800">{termCtx.activeTerm.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">School Branch:</span>
                  <span className="font-bold text-slate-800">{branches.find(b => b.id === activeBranchId)?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Current Class:</span>
                  <span className="font-bold text-slate-800">{selectedClass.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Destination Class:</span>
                  <span className="font-bold text-indigo-700">{destinationClass.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Promotion Performed By:</span>
                  <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.role})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Students Being Promoted:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {pendingPromotionType === 'all'
                      ? classStudents.filter(s => !studentPromotionStatusMap.get(s.id)?.isLocked).length
                      : selectedStudentIds.length}{' '}
                    Student(s)
                  </span>
                </div>
              </div>

              {/* Remarks or Custom Reason (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Promotion Remarks / Notes (Recorded in Permanent Audit Trail):
                </label>
                <input
                  type="text"
                  placeholder="e.g. End-of-session standard advancement to next grade level"
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isPromoting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={isPromoting}
                className="px-5 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isPromoting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Promotion & Archiving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm and Execute Promotion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
