import React, { useState, useMemo } from 'react';
import { User, Branch, ClassRoom, Subject, Role } from '../../types';
import { db } from '../../services/db';
import {
  Users,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  BookOpen,
  Edit,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  Briefcase,
  Layers,
  X,
  UserCheck,
  ArrowRightLeft
} from 'lucide-react';
import { ReassignTeacherModal } from './ReassignTeacherModal';

interface StaffRosterTableProps {
  currentUser: User;
  branches: Branch[];
  classes: ClassRoom[];
  subjects: Subject[];
  selectedBranchId?: string;
  className?: string;
}

export const StaffRosterTable: React.FC<StaffRosterTableProps> = ({
  currentUser,
  branches,
  classes,
  subjects,
  selectedBranchId = 'all',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId);
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [reassigningTeacher, setReassigningTeacher] = useState<User | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    branchId: '',
    customRoleTitle: '',
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
    status: 'active' as 'active' | 'suspended' | 'archived',
  });

  // Sync parent branch
  React.useEffect(() => {
    if (selectedBranchId) {
      setBranchFilter(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Load staff members (teachers, admins, directors, bursars)
  const staffMembers = useMemo(() => {
    const allUsers = db.getUsers();
    return allUsers.filter(u =>
      ['TEACHER', 'ADMIN', 'SUPERADMIN', 'DIRECTOR', 'BURSAR'].includes(u.role)
    );
  }, [feedbackMessage]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(member => {
      if (branchFilter !== 'all' && member.branchId !== branchFilter) return false;
      if (roleFilter !== 'ALL' && member.role !== roleFilter) return false;
      if (departmentFilter !== 'ALL') {
        const dept = (member as any).department || member.customRoleTitle || '';
        if (!dept.toLowerCase().includes(departmentFilter.toLowerCase())) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesEmail = member.email.toLowerCase().includes(q);
        const matchesPhone = member.phone?.toLowerCase().includes(q);
        const matchesId = (member.schoolId || member.staffId || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) return false;
      }
      return true;
    });
  }, [staffMembers, branchFilter, roleFilter, departmentFilter, searchQuery]);

  const openEditModal = (staff: User) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      branchId: staff.branchId || 'branch_bungalow',
      customRoleTitle: staff.customRoleTitle || (staff.role === 'TEACHER' ? 'Staff Instructor' : 'Administrator'),
      assignedClasses: staff.assignedClasses || [],
      assignedSubjects: staff.assignedSubjects || [],
      status: staff.status || 'active',
    });
  };

  const handleSaveStaffChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      db.updateUser(
        editingStaff.id,
        {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          branchId: editForm.branchId,
          branchName: branches.find(b => b.id === editForm.branchId)?.name || editingStaff.branchName,
          customRoleTitle: editForm.customRoleTitle,
          assignedClasses: editForm.assignedClasses,
          assignedSubjects: editForm.assignedSubjects,
          status: editForm.status,
        },
        currentUser
      );

      setFeedbackMessage(`Staff record for ${editForm.name} successfully updated!`);
      setEditingStaff(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating staff member');
    }
  };

  const toggleClassAssignment = (classId: string) => {
    setEditForm(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter(id => id !== classId)
        : [...prev.assignedClasses, classId],
    }));
  };

  const toggleSubjectAssignment = (subjectId: string) => {
    setEditForm(prev => ({
      ...prev,
      assignedSubjects: prev.assignedSubjects.includes(subjectId)
        ? prev.assignedSubjects.filter(id => id !== subjectId)
        : [...prev.assignedSubjects, subjectId],
    }));
  };

  return (
    <div
      id="staff-roster-table-container"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Staff Roster & Assignments Directory
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Institutional HR
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Directory of academic and administrative personnel across Bungalow and Ijegun branches
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{filteredStaff.length}</span> staff members
          </div>
          {staffMembers.some(u => u.role === 'TEACHER') && (
            <button
              type="button"
              onClick={() => {
                const firstTeacher = staffMembers.find(u => u.role === 'TEACHER');
                if (firstTeacher) setReassigningTeacher(firstTeacher);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open controlled teacher reassignment flow"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>REASSIGN TEACHER</span>
            </button>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Branch:</span>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Branch Admin</option>
              <option value="SUPERADMIN">Super Admin</option>
              <option value="DIRECTOR">Director</option>
              <option value="BURSAR">Bursar</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Department:</span>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="Primary">Primary Section</option>
              <option value="Secondary">Secondary Section</option>
              <option value="STEM">STEM / Math</option>
              <option value="Sciences">Sciences</option>
              <option value="Executive">Executive Leadership</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Staff Personnel</th>
              <th className="py-3 px-4">Role & Department</th>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Contact Information</th>
              <th className="py-3 px-4">Assigned Classes & Subjects</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStaff.length > 0 ? (
              filteredStaff.map(member => {
                const branchName =
                  branches.find(b => b.id === member.branchId)?.name ||
                  member.branchName ||
                  'Zitel Castle School';

                const assignedClassNames = (member.assignedClasses || [])
                  .map(cid => classes.find(c => c.id === cid)?.name)
                  .filter(Boolean);

                const assignedSubNames = (member.assignedSubjects || [])
                  .map(sid => subjects.find(s => s.id === sid)?.name)
                  .filter(Boolean);

                const isSuspended = member.status === 'suspended';
                const isArchived = member.status === 'archived';

                return (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Personnel Info */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120'}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-100 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {member.name}
                          </div>
                          <div className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            {member.schoolId || member.staffId || 'STAFF-001'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 capitalize">
                          {member.role.toLowerCase()}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {member.customRoleTitle || 'Academic Staff'}
                        </span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {branchName.includes('Ijegun') ? 'Ijegun Branch' : 'Bungalow Branch'}
                      </span>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{member.phone || '+234 800 000 0000'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Assignments */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[200px]">
                        {assignedClassNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClassNames.slice(0, 2).map((cname, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {cname}
                              </span>
                            ))}
                            {assignedClassNames.length > 2 && (
                              <span className="px-1 py-0.5 rounded text-[10px] text-slate-500">
                                +{assignedClassNames.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No classes assigned</span>
                        )}

                        {assignedSubNames.length > 0 && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {assignedSubNames.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isSuspended
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isArchived
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {member.status || 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {member.role === 'TEACHER' && (
                          <button
                            type="button"
                            onClick={() => setReassigningTeacher(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200 cursor-pointer"
                            title="Reassign this teacher to new classes, subjects, or branch"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Reassign</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                          title="Edit staff contact details and assignments"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">No staff found matching current filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Manage Staff Personnel: {editingStaff.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update contact details, institutional branch, and curriculum assignments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffChanges} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Assignment</label>
                  <select
                    value={editForm.branchId}
                    onChange={e => setEditForm(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Custom Role Title / Department</label>
                <input
                  type="text"
                  value={editForm.customRoleTitle}
                  onChange={e => setEditForm(prev => ({ ...prev, customRoleTitle: e.target.value }))}
                  placeholder="e.g. Lead Teacher - Basic 3, Head of Science"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Class & Subject Assignments for Teachers */}
              {editingStaff.role === 'TEACHER' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Classes</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                      {classes
                        .filter(c => c.branchId === editForm.branchId)
                        .map(c => {
                          const isSelected = editForm.assignedClasses.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleClassAssignment(c.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Subjects</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                      {subjects.map(s => {
                        const isSelected = editForm.assignedSubjects.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSubjectAssignment(s.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Account Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Account Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="active">Active (Full operational access)</option>
                  <option value="suspended">Suspended (Access temporarily frozen)</option>
                  <option value="archived">Archived (Separated / Historical record)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* REASSIGN TEACHER MODAL */}
      {reassigningTeacher && (
        <ReassignTeacherModal
          teacher={reassigningTeacher}
          currentUser={currentUser}
          branches={branches}
          classes={classes}
          subjects={subjects}
          onClose={() => setReassigningTeacher(null)}
          onSuccess={updated => {
            setFeedbackMessage(`Teacher ${updated.name} reassigned successfully.`);
            setReassigningTeacher(null);
            setTimeout(() => setFeedbackMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
