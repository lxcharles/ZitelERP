import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Send,
  Sparkles,
  X,
  FileText,
  Building2,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { User, ClassRoom, Student, CredentialSlip } from '../../types';
import { db } from '../../services/db';
import { isSuperAdmin, isDirector } from '../../utils/roles';

interface AdminStudentEnrollmentModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (slip: CredentialSlip) => void;
}

export const AdminStudentEnrollmentModal: React.FC<AdminStudentEnrollmentModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
}) => {
  const classes = db.getClasses();
  const branches = db.getBranches();
  const activeBranch = db.getActiveBranchId();

  // Mode: 'new_parent' | 'existing_parent'
  const [parentMode, setParentMode] = useState<'new_parent' | 'existing_parent'>('new_parent');

  // Student details
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('2018-05-14');
  const [classId, setClassId] = useState(classes[0]?.id || 'cls_p3a');
  const [branchId, setBranchId] = useState(
    currentUser.branchId || (activeBranch !== 'all' ? activeBranch : 'branch_bungalow')
  );
  const [address, setAddress] = useState('12 Admiralty Way, Lekki Phase 1, Lagos');

  // Parent search for existing
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedExistingParent, setSelectedExistingParent] = useState<User | null>(null);

  // New parent form
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Mother');
  const [parentOccupation, setParentOccupation] = useState('');

  // Duplicate Parent Warning check
  const [duplicateWarning, setDuplicateWarning] = useState<User | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search existing parents
  useEffect(() => {
    if (parentMode === 'existing_parent' && parentSearchQuery.trim().length >= 2) {
      const results = db.searchParents(parentSearchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [parentSearchQuery, parentMode]);

  // Live duplicate detection when entering new parent details
  useEffect(() => {
    if (parentMode === 'new_parent') {
      if (parentPhone.trim().length >= 6 || parentEmail.trim().length >= 4) {
        const query = parentPhone.trim() || parentEmail.trim();
        const found = db.searchParents(query);
        if (found.length > 0) {
          setDuplicateWarning(found[0]);
        } else {
          setDuplicateWarning(null);
        }
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [parentPhone, parentEmail, parentMode]);

  const handleSelectExistingParent = (parent: User) => {
    setSelectedExistingParent(parent);
    setDuplicateWarning(null);
  };

  const handleLinkFoundParent = (parent: User) => {
    setParentMode('existing_parent');
    setSelectedExistingParent(parent);
    setDuplicateWarning(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Please enter the student’s first and last name.');
      }

      if (parentMode === 'existing_parent' && !selectedExistingParent) {
        throw new Error('Please search and select an existing registered parent.');
      }

      if (parentMode === 'new_parent') {
        if (!parentFirstName.trim() || !parentLastName.trim()) {
          throw new Error('Please enter the parent’s first and last name.');
        }
        if (!parentEmail.trim() && !parentPhone.trim()) {
          throw new Error('Please provide at least a parent phone number or email address.');
        }
      }

      const selectedClass = classes.find(c => c.id === classId);
      const selectedBranch = branches.find(b => b.id === branchId);

      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

      const res = db.adminCreateStudentAccount(
        {
          studentData: {
            fullName,
            gender,
            dob: dateOfBirth,
            branchId,
            classId,
            address,
          },
          parentMode: parentMode === 'existing_parent' ? 'EXISTING' : 'NEW',
          existingParentId: selectedExistingParent?.id,
          newParentData: parentMode === 'new_parent' ? {
            fullName: `${parentFirstName} ${parentLastName}`.trim(),
            relationship: parentRelationship,
            phone: parentPhone.trim(),
            email: parentEmail.trim(),
            address,
            occupation: parentOccupation.trim(),
          } : undefined,
        },
        currentUser
      );

      onSuccess(res.credentialSlip);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enroll student.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Student Enrollment & Parent Onboarding</h3>
              <p className="text-xs text-slate-300">Register pupil, link parent account, and generate official credentials</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Student Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-sm text-slate-900">Student Profile & Academic Placement</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g., Tariq"
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value)}
                  placeholder="e.g., Kwame"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last / Surname *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g., Vance"
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School Branch *</label>
                {isSuperAdmin(currentUser) || isDirector(currentUser) ? (
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={currentUser.branchName || branches.find(b => b.id === branchId)?.name || 'Assigned Branch'}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-semibold cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Residential Address"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Parent Account & Relationship */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-sm text-slate-900">Parent / Guardian Account Linking</h4>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setParentMode('new_parent')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    parentMode === 'new_parent'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create New Parent
                </button>
                <button
                  type="button"
                  onClick={() => setParentMode('existing_parent')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    parentMode === 'existing_parent'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Search Existing Parent
                </button>
              </div>
            </div>

            {/* Existing Parent Search Mode */}
            {parentMode === 'existing_parent' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Search Registered Parent (by Name, Phone, or Email)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={parentSearchQuery}
                      onChange={e => setParentSearchQuery(e.target.value)}
                      placeholder="Type parent name, phone number, or email..."
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Search Results List */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Matching Parents ({searchResults.length})
                    </p>
                    {searchResults.map(p => {
                      const isSelected = selectedExistingParent?.id === p.id;
                      const childrenCount = p.childrenIds?.length || 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectExistingParent(p)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'bg-white border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                                <span>{p.name}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {p.phone || 'No phone'} • {p.email} • <span className="font-semibold text-indigo-600">{childrenCount} existing child(ren)</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Parent Confirmation Card */}
                {selectedExistingParent && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 text-xs text-emerald-900">
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">Linked to Existing Parent: {selectedExistingParent.name}</p>
                        <p className="text-[11px] text-emerald-700">
                          {selectedExistingParent.email} • {selectedExistingParent.phone}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedExistingParent(null)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Create New Parent Mode */}
            {parentMode === 'new_parent' && (
              <div className="space-y-3">
                {/* Live Duplicate Warning Banner */}
                {duplicateWarning && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start justify-between space-x-3 animate-in fade-in">
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold">Existing Parent Detected in System</h5>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          A parent with matching contact details already exists: <strong>{duplicateWarning.name}</strong> ({duplicateWarning.phone || duplicateWarning.email}).
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          To prevent creating an accidental duplicate account, you can link this new student directly to their existing parent profile.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLinkFoundParent(duplicateWarning)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs"
                    >
                      Link to {duplicateWarning.name.split(' ')[0]}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent First Name *</label>
                    <input
                      type="text"
                      value={parentFirstName}
                      onChange={e => setParentFirstName(e.target.value)}
                      placeholder="e.g., Elena"
                      required={parentMode === 'new_parent'}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Last / Surname *</label>
                    <input
                      type="text"
                      value={parentLastName}
                      onChange={e => setParentLastName(e.target.value)}
                      placeholder="e.g., Vance"
                      required={parentMode === 'new_parent'}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Phone Number *</label>
                    <input
                      type="tel"
                      value={parentPhone}
                      onChange={e => setParentPhone(e.target.value)}
                      placeholder="e.g., +234 803 123 4567"
                      required={parentMode === 'new_parent'}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email Address</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={e => setParentEmail(e.target.value)}
                      placeholder="e.g., elena.vance@example.com"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={parentRelationship}
                      onChange={e => setParentRelationship(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Uncle / Aunt">Uncle / Aunt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Occupation / Workplace (Optional)</label>
                  <input
                    type="text"
                    value={parentOccupation}
                    onChange={e => setParentOccupation(e.target.value)}
                    placeholder="e.g., Senior Financial Analyst at KPMG"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Credential Slip Auto-Generation Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold">Instant Credential Slip & Account Provisioning</p>
              <p className="text-[11px] text-indigo-700">
                Upon enrollment, the system will immediately issue unique login credentials and a printable / downloadable Official Credential Slip for the family.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Enrolling & Generating Slip...' : 'Complete Enrollment & Generate Slip'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
