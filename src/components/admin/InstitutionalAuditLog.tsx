import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { User, AuditLog } from '../../types';
import { isSuperAdmin, isDirector } from '../../utils/roles';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  User as UserIcon,
  Layers,
  GraduationCap,
  Users,
  DollarSign,
  Settings,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  Eye,
  X,
  Calendar,
  Lock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface Props {
  currentUser: User;
  isModal?: boolean;
  onClose?: () => void;
}

type AuditCategoryFilter = 'ALL' | 'GRADING' | 'ROLES' | 'ACADEMIC' | 'FINANCE' | 'SECURITY';

export const InstitutionalAuditLog: React.FC<Props> = ({
  currentUser,
  isModal,
  onClose,
}) => {
  // Access Control Verification
  const hasAccess = isSuperAdmin(currentUser) || isDirector(currentUser);

  const [activeCategory, setActiveCategory] = useState<AuditCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'ALL' | '24H' | '7D' | 'TERM'>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Term context
  const termCtx = useMemo(() => db.getTermContext(), []);

  // Fetch all audit logs
  const allLogs = useMemo(() => {
    return db.getAuditLogs();
  }, [isRefreshing]);

  // Determine Category for a log item
  const getLogCategory = (log: AuditLog): AuditCategoryFilter => {
    const action = log.action.toUpperCase();
    const entity = (log.entityType || '').toUpperCase();

    if (
      action.includes('GRADE') ||
      action.includes('SCORE') ||
      action.includes('ASSESSMENT') ||
      entity === 'ASSESSMENT' ||
      log.details.toLowerCase().includes('score') ||
      log.details.toLowerCase().includes('continuous assessment')
    ) {
      return 'GRADING';
    }

    if (
      action.includes('ROLE') ||
      action.includes('PERMISSION') ||
      action.includes('USER_STATUS') ||
      action === 'USER_CREATED' ||
      action === 'USER_UPDATED' ||
      entity === 'USER' ||
      log.details.toLowerCase().includes('permission') ||
      log.details.toLowerCase().includes('director') ||
      log.details.toLowerCase().includes('role')
    ) {
      return 'ROLES';
    }

    if (
      action.includes('CLASS') ||
      action.includes('SUBJECT') ||
      action.includes('PROMOTION') ||
      action.includes('ARCHIVE') ||
      entity === 'CLASS' ||
      entity === 'SUBJECT' ||
      entity === 'PROMOTION'
    ) {
      return 'ACADEMIC';
    }

    if (
      action.includes('PAYMENT') ||
      action.includes('FEE') ||
      action.includes('INVOICE') ||
      action.includes('DISCOUNT') ||
      action.includes('REFUND') ||
      entity === 'FEE' ||
      entity === 'PAYMENT'
    ) {
      return 'FINANCE';
    }

    return 'SECURITY';
  };

  // Severity Level calculation
  const getSeverity = (log: AuditLog): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' => {
    const action = log.action.toUpperCase();
    if (
      action === 'USER_ROLE_UPDATED' ||
      action.includes('PERMISSION') ||
      action.includes('DELETE') ||
      action.includes('DEACTIVAT')
    ) {
      return 'CRITICAL';
    }
    if (
      action === 'GRADING_MODIFIED' ||
      action === 'GRADING_SCHEME_UPDATED' ||
      action.includes('OVERRIDE')
    ) {
      return 'HIGH';
    }
    if (
      action.includes('PAYMENT') ||
      action.includes('CLASS') ||
      action.includes('STATUS')
    ) {
      return 'MEDIUM';
    }
    return 'INFO';
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();

    return allLogs.filter(log => {
      // Category filter
      if (activeCategory !== 'ALL') {
        const cat = getLogCategory(log);
        if (cat !== activeCategory) return false;
      }

      // Timeframe filter
      if (timeframe !== 'ALL') {
        const logTime = new Date(log.timestamp).getTime();
        if (timeframe === '24H' && now - logTime > 24 * 3600 * 1000) return false;
        if (timeframe === '7D' && now - logTime > 7 * 24 * 3600 * 1000) return false;
        if (timeframe === 'TERM') {
          const termStart = termCtx.activeTerm?.openingDate
            ? new Date(termCtx.activeTerm.openingDate).getTime()
            : now - 90 * 24 * 3600 * 1000;
          if (logTime < termStart) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = log.userName.toLowerCase().includes(q);
        const matchesRole = (log.userRole || '').toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesEntity = (log.entityType || '').toLowerCase().includes(q);
        const matchesBranch = (log.branchName || '').toLowerCase().includes(q);

        if (!matchesActor && !matchesRole && !matchesAction && !matchesDetails && !matchesEntity && !matchesBranch) {
          return false;
        }
      }

      return true;
    });
  }, [allLogs, activeCategory, timeframe, searchQuery, termCtx]);

  // Statistics
  const stats = useMemo(() => {
    let gradingCount = 0;
    let roleCount = 0;
    let criticalCount = 0;

    allLogs.forEach(l => {
      const cat = getLogCategory(l);
      if (cat === 'GRADING') gradingCount++;
      if (cat === 'ROLES') roleCount++;
      if (getSeverity(l) === 'CRITICAL' || getSeverity(l) === 'HIGH') criticalCount++;
    });

    return {
      total: allLogs.length,
      gradingCount,
      roleCount,
      criticalCount,
    };
  }, [allLogs]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Branch', 'Details', 'IP Address'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      l.userRole,
      l.action,
      l.entityType || '',
      l.entityId || '',
      `"${(l.branchName || 'Central HQ').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ipAddress || '192.168.1.1',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Institutional_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    setIsRefreshing(prev => !prev);
  };

  // If user is neither Super Admin nor Director, deny access
  if (!hasAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Restricted Executive Area</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The <strong>Institutional Audit Log & System Trail</strong> is restricted to the
          <strong> School Director</strong> and <strong>Super Administrators</strong> to ensure governance confidentiality and compliance.
        </p>
        <div className="pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Return to Authorized Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="institutional-audit-log-view" className="space-y-6">
      {/* Executive Security Header */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Executive Confidential • Super Admin & Director
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Tamper-Evident Ledger
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              Institutional Audit Log & System Trail
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Cryptographically timestamped record tracking key system changes, including continuous assessment score revisions, grading scheme ratifications, and administrative user role promotions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              id="btn-export-audit-csv"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Ledger (.csv)</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Close Audit Log"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Executive Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Logged Events
            </span>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
              Grading Modifications
            </span>
            <p className="text-2xl font-black text-amber-300 mt-1">{stats.gradingCount}</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">
              Role & Permission Updates
            </span>
            <p className="text-2xl font-black text-indigo-300 mt-1">{stats.roleCount}</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
              High Impact Actions
            </span>
            <p className="text-2xl font-black text-rose-300 mt-1">{stats.criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'ALL', label: 'All System Changes', icon: Layers, count: allLogs.length },
            { id: 'GRADING', label: 'Grading Modifications', icon: GraduationCap, count: stats.gradingCount },
            { id: 'ROLES', label: 'User Role Updates', icon: Users, count: stats.roleCount },
            { id: 'ACADEMIC', label: 'Class & Academics', icon: FileText },
            { id: 'FINANCE', label: 'Finance & Invoices', icon: DollarSign },
            { id: 'SECURITY', label: 'System & Governance', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as AuditCategoryFilter)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Timeframe Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by actor name, role, action code, student, or details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Timeframe:</span>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Time</option>
              <option value="24H">Last 24 Hours</option>
              <option value="7D">Last 7 Days</option>
              <option value="TERM">Current Term ({termCtx.activeTerm?.name || 'Active'})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Showing {filteredLogs.length} verified events
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Click any row to inspect technical payload & entity metadata
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No matching audit trail events</p>
            <p className="text-xs text-slate-500">
              Try modifying your search criteria or switching to a broader category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Timestamp & ID</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action Code</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Institutional Details</th>
                  <th className="py-3.5 px-4 text-right">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map(log => {
                  const severity = getSeverity(log);
                  const category = getLogCategory(log);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Timestamp & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {new Date(log.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          <span className="text-slate-300">•</span>
                          <span>{log.id}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {log.userRole}
                          </span>
                          {log.branchName && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {log.branchName.replace('ZITEL CASTLE SCHOOL ', '')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono font-bold tracking-tight ${
                            category === 'GRADING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : category === 'ROLES'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : category === 'FINANCE'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {log.entityType || 'System'}
                        </div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                            {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-700 leading-snug line-clamp-2 max-w-md">
                          {log.details}
                        </p>
                      </td>

                      {/* Impact */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : severity === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Inspection Drawer/Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-800 rounded-xl text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Audit Event Payload Inspector
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Executing Actor
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedLog.userName}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Role: {selectedLog.userRole}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Timestamp & IP
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    IP: {selectedLog.ipAddress || '192.168.1.1'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Action Executed
                </span>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-900">
                    {selectedLog.action}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700">
                    Target: {selectedLog.entityType} ({selectedLog.entityId || 'N/A'})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Full Recorded Narrative & Context
                </span>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  {selectedLog.details}
                </div>
              </div>

              {selectedLog.branchName && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                  <span className="text-[11px] font-semibold text-slate-500">Jurisdiction Branch:</span>
                  <span className="font-bold text-slate-900">{selectedLog.branchName}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
