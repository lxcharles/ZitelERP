import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Building2,
  Calendar,
  Filter,
  Layers,
  Award,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Users,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { User, StudentSessionArchive, FormerStudentQueryFilter, Branch } from '../../types';
import { db } from '../../services/db';

interface FormerStudentsHubProps {
  currentUser: User;
  onOpenStudentArchive: (studentId: string) => void;
}

export const FormerStudentsHub: React.FC<FormerStudentsHubProps> = ({
  currentUser,
  onOpenStudentArchive
}) => {
  const [branches] = useState<Branch[]>(db.getBranches());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Graduated' | 'Transferred' | 'Withdrawn'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');

  const allFormerStudents = useMemo(() => {
    return db.getFormerStudents();
  }, []);

  const availableSessions = useMemo(() => {
    const sessions = new Set<string>();
    allFormerStudents.forEach(s => {
      if (s.academicSession) sessions.add(s.academicSession);
    });
    return Array.from(sessions);
  }, [allFormerStudents]);

  const filteredStudents = useMemo(() => {
    return allFormerStudents.filter(s => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (branchFilter !== 'all' && s.branchId !== branchFilter) return false;
      if (sessionFilter !== 'all' && s.academicSession !== sessionFilter) return false;
      
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.schoolId.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        (s.graduationYear && s.graduationYear.includes(q))
      );
    });
  }, [allFormerStudents, statusFilter, branchFilter, sessionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Former Students & Alumni Archive
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {allFormerStudents.length} Records Preserved
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Searchable repository of graduated alumni, transferred pupils, and withdrawn students. 
                Permanent academic records, graduation credentials, and historical report sheets remain permanently accessible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, school ID, year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses (Graduated, Transferred, Withdrawn)</option>
            <option value="Graduated">🎓 Graduated Alumni</option>
            <option value="Transferred">🔄 Transferred Out</option>
            <option value="Withdrawn">📁 Withdrawn</option>
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All School Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Academic Session */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Academic Sessions</option>
            {availableSessions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No former students match the current criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Official School ID</th>
                  <th className="py-3.5 px-4">School Branch</th>
                  <th className="py-3.5 px-4">Final Class Completed</th>
                  <th className="py-3.5 px-4">Session / Year</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Cumulative Avg</th>
                  <th className="py-3.5 px-4 text-right">Academic History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.studentId}`}
                          alt={student.studentName}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{student.studentName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">ID: {student.schoolId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Official Institutional ID */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {student.schoolId}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {student.branchName}
                    </td>

                    {/* Final Class */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {student.className}
                    </td>

                    {/* Session / Graduation Year */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {student.academicSession}
                      {student.graduationYear && (
                        <span className="block text-[10px] text-emerald-700 font-bold">
                          Class of {student.graduationYear}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        student.status === 'Graduated'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : student.status === 'Transferred'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {student.status === 'Graduated' && '🎓'}
                        {student.status}
                      </span>
                    </td>

                    {/* Cumulative Avg */}
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {student.sessionAverage || 85.0}%
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenStudentArchive(student.studentId)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <span>View Archive</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
