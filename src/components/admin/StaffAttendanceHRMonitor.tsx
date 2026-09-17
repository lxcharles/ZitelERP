import React, { useState, useMemo } from 'react';
import { StaffAttendanceRecord, Branch, User } from '../../types';
import { db } from '../../services/db';
import {
  Clock,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Search,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';

interface StaffAttendanceHRMonitorProps {
  branches: Branch[];
  selectedBranchId?: string;
  className?: string;
}

export const StaffAttendanceHRMonitor: React.FC<StaffAttendanceHRMonitorProps> = ({
  branches,
  selectedBranchId = 'all',
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync if parent branch filter changes
  React.useEffect(() => {
    if (selectedBranchId) {
      setBranchFilter(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Load records from DB
  const rawRecords = useMemo(() => {
    return db.getStaffAttendance();
  }, []);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return rawRecords.filter(rec => {
      if (rec.date !== selectedDate) return false;
      if (branchFilter !== 'all' && rec.branchId !== branchFilter) return false;
      if (roleFilter !== 'ALL' && rec.staffRole !== roleFilter) return false;
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.staffName.toLowerCase().includes(q);
        const matchEmail = rec.staffEmail?.toLowerCase().includes(q);
        const matchDept = rec.department?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept) return false;
      }
      return true;
    });
  }, [rawRecords, selectedDate, branchFilter, roleFilter, statusFilter, searchQuery]);

  // Total active staff from db
  const allUsers = useMemo(() => db.getUsers(), []);
  const eligibleStaff = useMemo(() => {
    return allUsers.filter(u => {
      const isStaffRole = ['TEACHER', 'ADMIN', 'SUPERADMIN', 'DIRECTOR', 'BURSAR'].includes(u.role);
      const matchesBranch = branchFilter === 'all' || u.branchId === branchFilter;
      return isStaffRole && matchesBranch;
    });
  }, [allUsers, branchFilter]);

  // Metrics
  const totalClockedIn = filteredRecords.length;
  const onTimeCount = filteredRecords.filter(r => r.status === 'ON_TIME').length;
  const lateCount = filteredRecords.filter(r => r.status === 'LATE').length;
  const punctualityRate = totalClockedIn > 0 ? Math.round((onTimeCount / totalClockedIn) * 100) : 100;

  // Export Daily Log to CSV
  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Staff Name',
      'Email',
      'Role',
      'Department / Title',
      'Branch',
      'Date',
      'Clock In Time',
      'Clock Out Time',
      'Punctuality Status',
      'Notes'
    ];

    const rows = filteredRecords.map(r => [
      r.id,
      `"${r.staffName.replace(/"/g, '""')}"`,
      r.staffEmail || 'N/A',
      r.staffRole,
      `"${(r.department || 'Staff').replace(/"/g, '""')}"`,
      `"${(r.branchName || 'Zitel Castle School').replace(/"/g, '""')}"`,
      r.date,
      r.timeIn,
      r.timeOut || 'Pending',
      r.status === 'ON_TIME' ? 'Punctual' : 'Late',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Zitel_Castle_Staff_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="staff-attendance-hr-monitor"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header with Title & Action */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Staff Digital Attendance & HR Log
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Live Audit
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily clock-in verification, punctuality monitoring, and HR summary reports across branches
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
          title="Download daily attendance register as CSV"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export HR Summary (CSV)</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="bg-slate-50/70 border-b border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Total Clocked In
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900">{totalClockedIn}</span>
            <span className="text-xs font-semibold text-slate-500">of {eligibleStaff.length} staff</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
            Selected date: {selectedDate}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            On-Time Punctuality
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-emerald-600">{onTimeCount}</span>
            <span className="text-xs font-semibold text-emerald-700">({punctualityRate}%)</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
            Arrived before 8:00 AM
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Late Clock-Ins
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-amber-600">{lateCount}</span>
            <span className="text-xs font-semibold text-amber-700">Flagged</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
            Arrived after 8:00 AM threshold
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Institutional Standard
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-indigo-600">8:00 AM</span>
            <span className="text-xs font-semibold text-slate-500">Cut-off</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
            Official ZCS Staff Check-in Policy
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
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
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Staff</option>
              <option value="TEACHER">Teachers</option>
              <option value="ADMIN">Admins</option>
              <option value="DIRECTOR">Directors</option>
              <option value="BURSAR">Bursars</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Punctuality</option>
              <option value="ON_TIME">Punctual (On-Time)</option>
              <option value="LATE">Late Arrivals</option>
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff name or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Daily Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Staff Member</th>
              <th className="py-3 px-4">Role & Department</th>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Clock-In Time</th>
              <th className="py-3 px-4">Clock-Out Time</th>
              <th className="py-3 px-4">Punctuality</th>
              <th className="py-3 px-4">Notes / Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => {
                const isOnTime = record.status === 'ON_TIME';
                const branchName =
                  branches.find(b => b.id === record.branchId)?.name ||
                  record.branchName ||
                  'Zitel Castle School';

                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        <div className="font-bold text-slate-900">{record.staffName}</div>
                        {record.staffEmail && (
                          <div className="text-[11px] text-slate-400 font-normal">{record.staffEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 capitalize">
                          {record.staffRole.toLowerCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {record.department || 'Academic Staff'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Building2 className="w-2.5 h-2.5 text-slate-500" />
                        {branchName.includes('Ijegun') ? 'Ijegun Branch' : 'Bungalow Branch'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {record.timeIn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {record.timeOut ? (
                        <span className="text-slate-800 font-semibold">{record.timeOut}</span>
                      ) : (
                        <span className="text-slate-400 italic">On-duty</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOnTime
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isOnTime ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Punctual
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Late Arrival
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {record.notes || <span className="text-slate-300 italic">Standard check-in</span>}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Clock className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">
                      No staff attendance records matching your criteria.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust date or branch filters to review past or active daily registers.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
