import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Archive,
  UserX,
  CheckCircle2,
  X,
  GraduationCap,
  ArrowRightLeft,
  HeartHandshake
} from 'lucide-react';
import { Student, User } from '../../types';
import { db } from '../../services/db';
import { AdvancedAccountInfoSection } from '../common/AdvancedAccountInfoSection';

interface StudentStatusModalProps {
  student: Student;
  currentUser: User;
  onClose: () => void;
  onSuccess: (updatedStudent: Student) => void;
}

export const StudentStatusModal: React.FC<StudentStatusModalProps> = ({
  student,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const currentStatus = student.status || 'Active';
  const [status, setStatus] = useState<Student['status']>(currentStatus);
  const [reason, setReason] = useState(student.statusReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parentNotice, setParentNotice] = useState<string | null>(null);

  const statusOptions: {
    value: Student['status'];
    label: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      value: 'Active',
      label: 'Active Enrollment',
      description: 'Active in class registers, attendance, exams, and daily school activities.',
      icon: CheckCircle2,
      color: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    },
    {
      value: 'Suspended',
      label: 'Suspended',
      description: 'Temporarily restricts portal login and classroom activity. Academic records preserved.',
      icon: AlertTriangle,
      color: 'border-amber-500 bg-amber-50 text-amber-800',
    },
    {
      value: 'Transferred',
      label: 'Transferred',
      description: 'Transferred to another school. Disables active logins; preserves full transcript & certificates.',
      icon: ArrowRightLeft,
      color: 'border-sky-500 bg-sky-50 text-sky-800',
    },
    {
      value: 'Graduated',
      label: 'Graduated',
      description: 'Completed terminal level at Zitel Castle School. Archive preserved for transcript issuance.',
      icon: GraduationCap,
      color: 'border-purple-500 bg-purple-50 text-purple-800',
    },
    {
      value: 'Withdrawn',
      label: 'Withdrawn',
      description: 'Formally withdrawn by guardian. Login disabled; payment and performance archive preserved.',
      icon: UserX,
      color: 'border-rose-500 bg-rose-50 text-rose-800',
    },
    {
      value: 'Archived',
      label: 'Archived Record',
      description: 'Historical archive for compliance and records lookup.',
      icon: Archive,
      color: 'border-slate-500 bg-slate-50 text-slate-800',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setParentNotice(null);

    try {
      const res = db.updateStudentStatus(student.id, status, reason, currentUser);
      if (res.affectedParentReviewNeeded && res.affectedParentNames.length > 0) {
        setParentNotice(
          `Notice: Parent account (${res.affectedParentNames.join(', ')}) has no remaining active children and is now eligible for lifecycle status review.`
        );
      }
      onSuccess(res.student);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update student lifecycle status.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Student Account & Enrollment Status</h3>
              <p className="text-xs text-slate-300">Manage enrollment lifecycle with historical preservation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {parentNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center space-x-2">
              <HeartHandshake className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{parentNotice}</span>
            </div>
          )}

          {/* Student Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
            <img
              src={student.avatar || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=120'}
              alt={student.fullName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-200"
            />
            <div className="text-xs">
              <h4 className="font-bold text-slate-900 text-sm">{student.fullName}</h4>
              <p className="text-slate-500 font-mono">
                {student.className} • School ID: <span className="font-bold text-indigo-700">{student.schoolId || student.studentId}</span>
              </p>
              <p className="text-slate-400 text-[10px]">Branch: {student.branchName || 'Zitel Castle School'}</p>
            </div>
          </div>

          {/* Advanced Account Information (Super Admin Technical Support Only) */}
          <AdvancedAccountInfoSection
            currentUserRole={currentUser.role}
            targetUser={{
              id: student.id,
              fullName: student.fullName,
              accountType: 'Student',
              schoolId: student.schoolId || student.studentId,
              studentId: student.studentId,
              firebaseUid: student.firebaseUid,
              email: student.email
            }}
          />

          {/* Policy Preservation Notice */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-blue-800">
              <Shield className="w-3.5 h-3.5" />
              <span>Immutable Academic Archive Policy</span>
            </div>
            <p className="text-blue-700 leading-relaxed text-[11px]">
              Updating or deactivating a student account will <strong>NEVER</strong> delete their historical examination results, CA assessments, attendance records, financial invoices, or teacher comments. Historical records remain fully accessible to authorized school administrators.
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Select Lifecycle Status
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
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
                      name="student_status"
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

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Reason / Audit Log Note {status !== 'Active' && status !== 'Enrolled' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Graduated class of 2026, relocation to another state, or administrative suspension..."
              rows={2}
              required={status !== 'Active' && status !== 'Enrolled'}
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
              {isSubmitting ? <span>Saving...</span> : <span>Update Status & Log Audit</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
