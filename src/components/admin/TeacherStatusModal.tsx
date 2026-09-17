import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Archive,
  UserX,
  CheckCircle2,
  X,
  BookOpen,
  UserCheck,
  Award
} from 'lucide-react';
import { User, TeacherStatus, ClassSubjectAssignment, ClassRoom } from '../../types';
import { db } from '../../services/db';
import { AdvancedAccountInfoSection } from '../common/AdvancedAccountInfoSection';

interface TeacherStatusModalProps {
  teacher: User;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherStatusModal: React.FC<TeacherStatusModalProps> = ({
  teacher,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const currentStatus: TeacherStatus = (teacher.status as TeacherStatus) || 'active';
  const [status, setStatus] = useState<TeacherStatus>(currentStatus);
  const [reason, setReason] = useState(teacher.statusReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Teaching Allocations
  const [assignments, setAssignments] = useState<ClassSubjectAssignment[]>([]);
  const [formClasses, setFormClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [reassignToTeacherId, setReassignToTeacherId] = useState<string>('');
  const [unassignFormTeacher, setUnassignFormTeacher] = useState<boolean>(true);

  useEffect(() => {
    const allAssignments = db.getClassSubjectAssignments();
    const teacherAssignments = allAssignments.filter(a => a.teacherId === teacher.id);
    setAssignments(teacherAssignments);

    const allClasses = db.getClasses();
    const teacherFormClasses = allClasses.filter(c => c.formTeacherId === teacher.id);
    setFormClasses(teacherFormClasses);

    const allUsers = db.getUsers();
    const activeStaffTeachers = allUsers.filter(
      u => u.role === 'TEACHER' && u.id !== teacher.id && (u.status === 'active' || !u.status)
    );
    setTeachers(activeStaffTeachers);
  }, [teacher.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Update Teacher Status
      db.updateTeacherStatus(teacher.id, status, reason, currentUser);

      // 2. If leaving or inactive and has active allocations, handle reassignment
      if (status !== 'active' && (assignments.length > 0 || formClasses.length > 0)) {
        db.reassignTeacherClassesAndSubjects(
          teacher.id,
          reassignToTeacherId ? reassignToTeacherId : undefined,
          unassignFormTeacher,
          currentUser
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update teacher status.');
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: TeacherStatus; label: string; description: string; icon: any; color: string }[] = [
    {
      value: 'active',
      label: 'Active Staff',
      description: 'Full portal access: mark registers, create assessments, submit lesson plans & generate term reports.',
      icon: CheckCircle2,
      color: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    },
    {
      value: 'suspended',
      label: 'Suspended',
      description: 'Temporarily restricts logins & new academic submissions. All historical records & gradebooks strictly preserved.',
      icon: AlertTriangle,
      color: 'border-amber-500 bg-amber-50 text-amber-800',
    },
    {
      value: 'deactivated',
      label: 'Deactivated',
      description: 'Prevents login and unassigns active duties. Historical assessments remain accredited to this teacher.',
      icon: UserX,
      color: 'border-rose-500 bg-rose-50 text-rose-800',
    },
    {
      value: 'archived',
      label: 'Archived Record',
      description: 'Staff who have formally departed Zitel Castle School. Permanent archive maintained for historical audits.',
      icon: Archive,
      color: 'border-slate-500 bg-slate-50 text-slate-800',
    },
  ];

  const isLeavingOrInactive = status !== 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Teacher Account & Duty Lifecycle</h3>
              <p className="text-xs text-slate-300">Manage status, class handovers & historical preservation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Teacher Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <img
              src={teacher.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'}
              alt={teacher.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-200"
            />
            <div className="text-xs">
              <h4 className="font-bold text-slate-900 text-sm">{teacher.name}</h4>
              <p className="text-slate-500 font-mono">
                {teacher.email} • School ID: <span className="font-bold text-indigo-700">{teacher.schoolId || teacher.staffId || teacher.teacherIdNumber || teacher.username}</span>
              </p>
              <p className="text-indigo-600 font-semibold text-[11px] mt-0.5">
                {assignments.length} Subject Allocation(s) • {formClasses.length} Form Class(es)
              </p>
            </div>
          </div>

          {/* Advanced Account Information (Super Admin Technical Support Only) */}
          <AdvancedAccountInfoSection
            currentUserRole={currentUser.role}
            targetUser={teacher}
          />

          {/* Policy Preservation Notice */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-blue-800">
              <Award className="w-3.5 h-3.5" />
              <span>Historical Contribution Guarantee</span>
            </div>
            <p className="text-blue-700 leading-relaxed text-[11px]">
              Deactivating or archiving this teacher will <strong>NOT</strong> delete their historical contributions. Past examination questions, assessment scores, report cards, and behavioral entries will always display: <em>"Created/Submitted by {teacher.name}"</em>.
            </p>
          </div>

          {/* Status Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Select Account Status
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map(opt => {
                const isSelected = status === opt.value;
                const Icon = opt.icon;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-indigo-500/20`
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teacher_status"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setStatus(opt.value)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-bold text-xs">{opt.label}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 opacity-90 leading-tight">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reassignment & Handover Options for Inactive/Departing Teacher */}
          {isLeavingOrInactive && (assignments.length > 0 || formClasses.length > 0) && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center space-x-2 text-amber-900">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  Active Teaching Handover ({assignments.length} Course Allocations)
                </h4>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1">
                  Reassign Current Classes & Subjects To:
                </label>
                <select
                  value={reassignToTeacherId}
                  onChange={e => setReassignToTeacherId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Leave Unassigned (Admins will assign later) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              {formClasses.length > 0 && (
                <label className="flex items-center space-x-2 text-xs text-amber-950 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unassignFormTeacher}
                    onChange={e => setUnassignFormTeacher(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Reassign / Clear Form Teacher role for {formClasses.map(c => c.name).join(', ')}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Reason / Audit Note {status !== 'active' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Sabbatical leave, relocation, end of term contract, or transfer..."
              rows={2}
              required={status !== 'active'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Updating Status & Handover...</span>
              ) : (
                <span>Save Status & Log Audit</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
