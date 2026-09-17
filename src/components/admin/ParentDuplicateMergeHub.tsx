import React, { useState } from 'react';
import {
  Users,
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  FileText,
  UserCheck,
  UserX,
  RefreshCw,
  Info,
  HeartHandshake,
  GraduationCap,
  History,
  Archive
} from 'lucide-react';
import { User, ParentDuplicateReport, ParentLifecycleItem, AccountStatus } from '../../types';
import { db } from '../../services/db';
import { AdvancedAccountInfoSection } from '../common/AdvancedAccountInfoSection';

interface ParentDuplicateMergeHubProps {
  currentUser: User;
}

export const ParentDuplicateMergeHub: React.FC<ParentDuplicateMergeHubProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'candidates' | 'reports' | 'directory' | 'lifecycle'>('candidates');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Merge Dialog State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [primaryParent, setPrimaryParent] = useState<User | null>(null);
  const [duplicateParent, setDuplicateParent] = useState<User | null>(null);
  const [mergeReason, setMergeReason] = useState('Duplicate account created during student enrollment.');
  const [preferredName, setPreferredName] = useState('');
  const [preferredEmail, setPreferredEmail] = useState('');
  const [preferredPhone, setPreferredPhone] = useState('');
  const [preferredAddress, setPreferredAddress] = useState('');

  // Parent Lifecycle Status Dialog State
  const [selectedParentForStatus, setSelectedParentForStatus] = useState<ParentLifecycleItem | null>(null);
  const [newParentStatus, setNewParentStatus] = useState<AccountStatus>('inactive');
  const [parentStatusReason, setParentStatusReason] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<'all' | 'review_needed' | 'active' | 'inactive'>('all');

  // Toast / Feedback State
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data fetching
  const duplicateClusters = db.findPotentialDuplicateParentClusters();
  const duplicateReports = db.getParentDuplicateReports();
  const allParents = db.getUsers().filter(u => u.role === 'PARENT');
  const students = db.getStudents();
  const lifecycleList = db.getParentLifecycleList();

  const reviewNeededCount = lifecycleList.filter(l => l.isEligibleForInactiveReview).length;

  const filteredLifecycleList = lifecycleList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      item.parent.fullName.toLowerCase().includes(q) ||
      item.parent.email.toLowerCase().includes(q) ||
      item.parent.phone.includes(q) ||
      (item.parent.schoolId && item.parent.schoolId.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (lifecycleFilter === 'review_needed') return item.isEligibleForInactiveReview;
    if (lifecycleFilter === 'active') return item.status === 'active' || item.activeChildrenCount > 0;
    if (lifecycleFilter === 'inactive') return item.status === 'inactive' || item.status === 'archived' || item.status === 'deactivated';
    return true;
  });

  // Search filtered parents
  const filteredParents = allParents.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  });

  const handleOpenMergeDialog = (parentA: User | any, parentB: User | any) => {
    setPrimaryParent(parentA);
    setDuplicateParent(parentB);
    setPreferredName(parentA.fullName || parentA.name || '');
    setPreferredEmail(parentA.email || '');
    setPreferredPhone(parentA.phone || parentB.phone || '');
    setPreferredAddress(parentA.address || parentB.address || '');
    setMergeReason('Administrative merge of duplicate parent profiles.');
    setShowMergeModal(true);
  };

  const handleSwapPrimaryDuplicate = () => {
    if (!primaryParent || !duplicateParent) return;
    const oldPri = primaryParent;
    const oldDup = duplicateParent;
    setPrimaryParent(oldDup);
    setDuplicateParent(oldPri);
    setPreferredName(oldDup.name || (oldDup as any).fullName || '');
    setPreferredEmail(oldDup.email || '');
    setPreferredPhone(oldDup.phone || oldPri.phone || '');
  };

  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryParent || !duplicateParent) return;

    try {
      const res = db.adminMergeParentAccounts(
        primaryParent.id,
        duplicateParent.id,
        {
          resolveName: 'PRIMARY',
          resolveEmail: 'PRIMARY',
          resolvePhone: 'PRIMARY',
          resolveAddress: 'PRIMARY',
          customNotes: mergeReason,
        },
        currentUser
      );

      setFeedbackMsg({
        type: 'success',
        text: `Successfully merged accounts! ${res.mergedCount} student records united under master profile (${res.primaryParent.fullName}).`,
      });
      setShowMergeModal(false);
      setRefreshKey(k => k + 1);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to merge parent accounts.',
      });
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const pendingReportsCount = duplicateReports.filter(r => r.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-500 hover:text-slate-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Policy Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-[10px] uppercase font-bold text-indigo-300">
              Admin-Only Identity Safeguard
            </span>
          </div>
          <h2 className="text-xl font-black">Parent Duplicate Resolution & Merge Hub</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Detect identical parent profiles, combine multi-child student records under a single master profile, and preserve complete historical audit logs.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs text-center">
            <p className="text-[10px] uppercase font-bold text-slate-300">Duplicate Clusters</p>
            <p className="text-xl font-black text-amber-300">{duplicateClusters.length}</p>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs text-center">
            <p className="text-[10px] uppercase font-bold text-slate-300">Pending Reports</p>
            <p className="text-xl font-black text-rose-300">{pendingReportsCount}</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('candidates')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'candidates'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Potential Duplicate Clusters ({duplicateClusters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Duplicate Reports Inbox ({duplicateReports.length})</span>
          {pendingReportsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Parent Profiles ({allParents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lifecycle')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'lifecycle'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Account Lifecycle & Inactive Review ({lifecycleList.length})</span>
          {reviewNeededCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
              {reviewNeededCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Potential Duplicate Clusters */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-4">
          {duplicateClusters.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Duplicate Parent Clusters Detected</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All registered parents have distinct phone numbers, email addresses, and verified identity records.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">
                  The system detected <strong>{duplicateClusters.length} cluster(s)</strong> of parent accounts sharing identical phone numbers or emails. Review each cluster below to merge duplicates safely.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {duplicateClusters.map(cluster => (
                  <div
                    key={cluster.clusterId}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase font-mono">
                          {cluster.matchType} MATCH
                        </span>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          Key: {cluster.matchValue}
                        </span>
                      </div>
                      {cluster.parents.length >= 2 && (
                        <button
                          onClick={() => handleOpenMergeDialog(cluster.parents[0], cluster.parents[1])}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>Compare & Merge Cluster</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cluster.parents.map((p, idx) => {
                        const linkedStudents = students.filter(
                          s => s.parentIds?.includes(p.id) || s.parentId === p.id || p.linkedStudentIds?.includes(s.id)
                        );
                        return (
                          <div
                            key={p.id}
                            className={`p-4 rounded-2xl border ${
                              idx === 0 ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                                  {(p.fullName || p.name || 'P').charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-xs">{p.fullName || p.name}</h4>
                                  <p className="text-[11px] text-slate-500 font-mono">{p.email}</p>
                                  <p className="text-[11px] text-slate-600 font-semibold">{p.phone || 'No phone'}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                                {idx === 0 ? 'Candidate Master' : 'Duplicate'}
                              </span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px]">
                              <span className="font-bold text-slate-600">Enrolled Children ({linkedStudents.length}):</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {linkedStudents.length > 0 ? (
                                  linkedStudents.map(st => (
                                    <span
                                      key={st.id}
                                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-800 text-[10px]"
                                    >
                                      {st.fullName} ({st.className})
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">No linked pupils</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Duplicate Reports Inbox */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              This inbox records merge requests submitted by parents or teachers noticing duplicate profiles.
            </span>
          </div>

          <div className="space-y-3">
            {duplicateReports.map(report => {
              const reporter = allParents.find(p => p.id === report.reportedByUserId || p.id === report.reportedByParentId);
              const isPending = report.status === 'PENDING_REVIEW';

              return (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          report.status === 'PENDING_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : report.status === 'MERGED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="font-bold text-slate-900">
                        {report.reportedParentName || report.duplicateName || 'Parent Account'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono text-[11px]">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-slate-700">
                      <strong>Reason / Notes:</strong> {report.reason || report.notes}
                    </p>

                    <div className="flex items-center space-x-4 text-slate-500 text-[11px]">
                      <span>Matched Phone: <strong className="text-slate-700">{report.matchedPhone || report.duplicatePhone || 'N/A'}</strong></span>
                      <span>Matched Email: <strong className="text-slate-700">{report.matchedEmail || report.duplicateEmail || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isPending && (
                      <button
                        onClick={() => {
                          const targetPhone = report.matchedPhone || report.duplicatePhone;
                          const targetEmail = report.matchedEmail || report.duplicateEmail;
                          const matchedParents = allParents.filter(
                            p => (targetPhone && p.phone === targetPhone) || (targetEmail && p.email === targetEmail)
                          );
                          if (matchedParents.length >= 2) {
                            handleOpenMergeDialog(matchedParents[0], matchedParents[1]);
                          } else if (matchedParents.length === 1 && reporter) {
                            handleOpenMergeDialog(matchedParents[0], reporter);
                          } else if (allParents.length >= 2) {
                            handleOpenMergeDialog(allParents[0], allParents[1]);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Launch Merge Tool</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Parent Directory & Manual Merge */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search parents by name, email, or phone..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <p className="text-xs font-bold text-slate-500">
              Showing {filteredParents.length} Parent Profiles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParents.map(parent => {
              const linkedStudents = students.filter(
                s => s.parentIds?.includes(parent.id) || s.parentId === parent.id || parent.linkedStudentIds?.includes(s.id)
              );
              const isMerged = parent.status === 'merged';

              return (
                <div
                  key={parent.id}
                  className={`p-4 rounded-2xl border shadow-xs space-y-3 flex flex-col justify-between ${
                    isMerged ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                          {parent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-900">{parent.name}</h4>
                            <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {parent.schoolId || parent.username}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{parent.email}</p>
                          <p className="text-[11px] text-slate-600 font-semibold">{parent.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isMerged
                            ? 'bg-slate-200 text-slate-700'
                            : parent.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {parent.status || 'active'}
                      </span>
                    </div>

                    {/* Advanced Account Info for Super Admin */}
                    <AdvancedAccountInfoSection
                      currentUserRole={currentUser.role}
                      targetUser={{
                        id: parent.id,
                        fullName: parent.name,
                        accountType: 'Parent',
                        schoolId: parent.schoolId || parent.username,
                        firebaseUid: parent.firebaseUid,
                        email: parent.email
                      }}
                      compact
                    />

                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="font-bold text-slate-600">Children ({linkedStudents.length}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {linkedStudents.map(st => (
                          <span
                            key={st.id}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 font-medium text-[10px]"
                          >
                            {st.fullName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!isMerged && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const otherParents = allParents.filter(p => p.id !== parent.id && p.status !== 'merged');
                          if (otherParents.length > 0) {
                            handleOpenMergeDialog(parent, otherParents[0]);
                          }
                        }}
                        className="w-full py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Merge With Another Account</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Account Lifecycle & Inactive Review */}
      {activeSubTab === 'lifecycle' && (
        <div className="space-y-4">
          {/* Policy Information Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-indigo-900">
              <HeartHandshake className="w-4 h-4 text-indigo-700" />
              <span>Parent Account Lifecycle & Historical Integrity Policy (Rule 74)</span>
            </div>
            <p className="text-indigo-800 leading-relaxed text-[11px]">
              A Parent account remains <strong>Active</strong> as long as the parent has at least one actively enrolled student. When all children have graduated, transferred, or withdrawn, the parent account is eligible for review and transition to <strong>Inactive/Archived</strong> status. Even after deactivation, all communication logs, payment receipts, and links to student records are <strong>permanently preserved</strong>.
            </p>
          </div>

          {/* Filter Pills & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Accounts', count: lifecycleList.length },
                { id: 'review_needed', label: 'Review Needed (All Kids Inactive)', count: reviewNeededCount, highlight: true },
                { id: 'active', label: 'Active Guardians', count: lifecycleList.filter(l => l.activeChildrenCount > 0).length },
                { id: 'inactive', label: 'Inactive / Archived', count: lifecycleList.filter(l => l.status === 'inactive' || l.status === 'archived').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLifecycleFilter(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    lifecycleFilter === tab.id
                      ? tab.highlight
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    lifecycleFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative shrink-0 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search parent name, ID, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* List of Parents with Lifecycle Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLifecycleList.map(item => {
              const p = item.parent;
              const hasActiveKids = item.activeChildrenCount > 0;
              const isReviewEligible = item.isEligibleForInactiveReview;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-3xl border transition-all space-y-3 ${
                    isReviewEligible
                      ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-400/50'
                      : 'border-slate-200 bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                        alt={p.fullName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-xs text-slate-900">{p.fullName}</h4>
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {p.schoolId || 'ZCS/PAR'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{p.phone} • {p.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'inactive'
                            ? 'bg-slate-200 text-slate-800'
                            : item.status === 'archived'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                      {isReviewEligible && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                          Review Inactivity
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Children Roster & Status */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Linked Children ({item.children.length})</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        {item.activeChildrenCount} Active • {item.inactiveChildrenCount} Inactive/Graduated
                      </span>
                    </div>

                    <div className="space-y-1">
                      {item.children.map(child => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-white border border-slate-200/70"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 text-[11px]">{child.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({child.className})</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              child.status === 'Active' || child.status === 'Enrolled' || child.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : child.status === 'Graduated'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : child.status === 'Transferred'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {child.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <History className="w-3 h-3 text-slate-400" />
                      <span>Historical fees & logs preserved</span>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedParentForStatus(item);
                        setNewParentStatus(isReviewEligible ? 'inactive' : item.status === 'active' ? 'inactive' : 'active');
                        setParentStatusReason(
                          isReviewEligible
                            ? 'All linked students have graduated or transferred.'
                            : ''
                        );
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Update Lifecycle Status</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PARENT LIFECYCLE STATUS MODAL */}
      {selectedParentForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Parent Lifecycle Status</h3>
                  <p className="text-xs text-slate-300">Set active or inactive state with audit logging</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedParentForStatus(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                try {
                  db.updateParentLifecycleStatus(
                    selectedParentForStatus.parent.id,
                    newParentStatus,
                    parentStatusReason,
                    currentUser
                  );
                  setFeedbackMsg({
                    type: 'success',
                    text: `Updated status for ${selectedParentForStatus.parent.fullName} to "${newParentStatus}".`,
                  });
                  setSelectedParentForStatus(null);
                } catch (err: any) {
                  setFeedbackMsg({
                    type: 'error',
                    text: err.message || 'Failed to update parent status.',
                  });
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">{selectedParentForStatus.parent.fullName}</p>
                <p className="text-slate-500 font-mono">
                  {selectedParentForStatus.parent.schoolId || 'ZCS/PAR'} • {selectedParentForStatus.parent.phone}
                </p>
                <p className="text-slate-600 text-[11px]">
                  Active Children: <strong>{selectedParentForStatus.activeChildrenCount}</strong> | Inactive/Graduated: <strong>{selectedParentForStatus.inactiveChildrenCount}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'inactive', 'archived'] as AccountStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewParentStatus(st)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        newParentStatus === st
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Reason / Note *
                </label>
                <textarea
                  value={parentStatusReason}
                  onChange={e => setParentStatusReason(e.target.value)}
                  placeholder="e.g., All children graduated class of 2026, or reactivated for new sibling enrollment..."
                  rows={2}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-700 shrink-0" />
                <span>All historical payment receipts, statements, and student relations are preserved.</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedParentForStatus(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                >
                  Save Status & Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE DIALOG MODAL */}
      {showMergeModal && primaryParent && duplicateParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
                  <GitMerge className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Merge Duplicate Parent Accounts</h3>
                  <p className="text-xs text-slate-300">Combine student relationships and archive duplicate profile</p>
                </div>
              </div>
              <button
                onClick={() => setShowMergeModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Merge Body */}
            <form onSubmit={handleExecuteMerge} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Policy Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-blue-700" />
                  <span>Administrative Merge Authority</span>
                </div>
                <p className="text-blue-700 leading-relaxed text-[11px]">
                  All student records belonging to the duplicate account will be safely re-linked to the master account. The duplicate profile will be marked as <strong>'merged'</strong> and deactivated from independent logins, preserving full audit history.
                </p>
              </div>

              {/* Side by Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {/* Primary Master Card */}
                <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                      Primary Master Profile (To Keep)
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 text-sm">{primaryParent.name}</p>
                    <p className="text-slate-600 font-mono">{primaryParent.email}</p>
                    <p className="text-slate-700 font-semibold">{primaryParent.phone || 'No phone'}</p>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold">Current Children:</span>{' '}
                    {primaryParent.childrenIds?.length || 0} pupil(s)
                  </div>
                </div>

                {/* Secondary Duplicate Card */}
                <div className="p-4 rounded-2xl border-2 border-rose-400 bg-rose-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase">
                      Duplicate Profile (To Merge & Archive)
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 text-sm">{duplicateParent.name}</p>
                    <p className="text-slate-600 font-mono">{duplicateParent.email}</p>
                    <p className="text-slate-700 font-semibold">{duplicateParent.phone || 'No phone'}</p>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold">Current Children:</span>{' '}
                    {duplicateParent.childrenIds?.length || 0} pupil(s)
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapPrimaryDuplicate}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Swap Primary & Duplicate Roles</span>
                </button>
              </div>

              {/* Resolved Master Details */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-700">
                  Resolved Master Profile Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Final Full Name</label>
                    <input
                      type="text"
                      value={preferredName}
                      onChange={e => setPreferredName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Final Primary Phone</label>
                    <input
                      type="tel"
                      value={preferredPhone}
                      onChange={e => setPreferredPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Final Login Email</label>
                  <input
                    type="email"
                    value={preferredEmail}
                    onChange={e => setPreferredEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Audit Reason</label>
                  <input
                    type="text"
                    value={mergeReason}
                    onChange={e => setMergeReason(e.target.value)}
                    placeholder="Reason for merge..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>Execute Permanent Merge & Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
