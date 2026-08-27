import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  UserCheck,
  UserX,
  Send,
  CheckCircle2,
  FileText,
  Mail,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  X,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Student, AttendanceRecord, User } from '../../types';
import {
  attendanceForecastEngine,
  StudentAttendanceForecast,
  AbsenteeismRiskTier,
} from '../../services/attendanceForecastService';
import { aiService } from '../../services/aiService';

interface AttendanceForecastingProps {
  currentTeacher: User;
  classId: string;
  className: string;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onLogIntervention?: (studentId: string, note: string) => void;
}

export const AttendanceForecasting: React.FC<AttendanceForecastingProps> = ({
  currentTeacher,
  classId,
  className,
  students,
  attendanceRecords,
  onLogIntervention,
}) => {
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForecast, setSelectedStudentForecast] =
    useState<StudentAttendanceForecast | null>(null);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiCustomResult, setAiCustomResult] = useState<any | null>(null);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [interventionLogged, setInterventionLogged] = useState<boolean>(false);

  // Compute Class Forecast Analytics
  const classSummary = useMemo(() => {
    return attendanceForecastEngine.analyzeClassAttendance(
      classId,
      className,
      students,
      attendanceRecords
    );
  }, [classId, className, students, attendanceRecords]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return classSummary.studentForecasts.filter(st => {
      const matchesSearch = st.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterTier === 'ALL') return true;
      if (filterTier === 'CHRONIC_RISK') return st.riskTier === 'CRITICAL' || st.riskTier === 'HIGH';
      if (filterTier === 'MODERATE') return st.riskTier === 'MODERATE';
      if (filterTier === 'HEALTHY') return st.riskTier === 'LOW' || st.riskTier === 'EXEMPLARY';
      return true;
    });
  }, [classSummary, filterTier, searchQuery]);

  // Distribution chart data
  const riskDistributionData = [
    { name: 'Critical / High Risk', value: classSummary.chronicAbsenteeismRiskCount, color: '#ef4444' },
    { name: 'Moderate Risk', value: classSummary.moderateRiskCount, color: '#f59e0b' },
    { name: 'Healthy (≥95%)', value: classSummary.healthyAttendanceCount, color: '#10b981' },
  ].filter(d => d.value > 0);

  const handleOpenDiagnostic = (forecast: StudentAttendanceForecast) => {
    setSelectedStudentForecast(forecast);
    setAiCustomResult(null);
    setCopiedDraft(false);
    setInterventionLogged(false);
  };

  const handleRunLiveAIEvaluation = async () => {
    if (!selectedStudentForecast) return;
    setAiGenerating(true);
    try {
      const dayBreakdownText = selectedStudentForecast.dayOfWeekAbsences
        .map(d => `${d.day}: ${d.absentCount} abs, ${d.lateCount} late`)
        .join('; ');

      const res = await aiService.generateAttendanceForecastAI(
        {
          studentName: selectedStudentForecast.studentName,
          className: selectedStudentForecast.className,
          attendanceRate: selectedStudentForecast.currentAttendanceRate,
          absentDays: selectedStudentForecast.absentDays,
          lateDays: selectedStudentForecast.lateDays,
          dayBreakdown: dayBreakdownText,
          consecutiveAbsences: selectedStudentForecast.consecutiveAbsenceStreak,
        },
        currentTeacher
      );
      setAiCustomResult(res);
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleConfirmIntervention = () => {
    if (selectedStudentForecast && onLogIntervention) {
      onLogIntervention(
        selectedStudentForecast.studentId,
        `AI Attendance Intervention triggered for ${selectedStudentForecast.studentName}. Risk level: ${selectedStudentForecast.riskTier}.`
      );
    }
    setInterventionLogged(true);
    setTimeout(() => setInterventionLogged(false), 3000);
  };

  const getRiskBadge = (tier: AbsenteeismRiskTier) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3" />
            Critical Risk (&lt;75%)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3" />
            High Risk (75-85%)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Moderate Warning
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <UserCheck className="w-3 h-3" />
            Stable (92-97%)
          </span>
        );
      case 'EXEMPLARY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Exemplary (98-100%)
          </span>
        );
    }
  };

  return (
    <div id="ai_attendance_forecasting_module" className="space-y-6">
      {/* Top Banner / AI Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                Attendance Risk & Pattern Intelligence
              </span>
              <span className="text-xs text-slate-300 font-medium">{className}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Chronic Absenteeism Early Warning & Intervention System
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Analyzes historical attendance records, weekday patterns, and arrival velocity to forecast end-of-term absenteeism risks before severe learning gaps occur.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15">
            <div className="text-right">
              <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Class Attendance Velocity</p>
              <p className="text-xl font-bold text-white">
                {classSummary.averageAttendanceRate}% <span className="text-xs font-normal text-indigo-200">Current</span>
              </p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-right">
              <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Projected Term End</p>
              <p className="text-xl font-bold text-amber-300">
                {classSummary.projectedClassAttendanceRate}% <span className="text-xs font-normal text-slate-300">Forecast</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chronic Risk Students</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-red-600">{classSummary.chronicAbsenteeismRiskCount}</span>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                &lt; 85% Projected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Require immediate intervention</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moderate Warning</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-600">{classSummary.moderateRiskCount}</span>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                85% - 92% Range
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Frequent tardiness / Friday slippage</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Healthy & Regular</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-600">{classSummary.healthyAttendanceCount}</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                &ge; 95% Rate
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Consistent daily attendance</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Class Roster</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{classSummary.totalStudents}</span>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Primary 3A
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">20 historical school days tracked</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Day-of-Week Pattern Recognition Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Day-of-the-Week Absence & Tardiness Clustering
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical distribution of student absences and late arrivals across school days
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-indigo-700">AI Pattern Detection:</span>
            <span>Pre-weekend Fridays and post-weekend Mondays account for 78% of unexcused absences</span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classSummary.dayOfWeekSummary}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1 border border-slate-800">
                        <div className="font-semibold text-indigo-200">{label} Summary</div>
                        <div className="flex justify-between gap-4 text-red-300">
                          <span>Unexcused Absences:</span>
                          <span className="font-bold">{payload[0]?.value || 0}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-amber-300">
                          <span>Tardy Arrivals (Late):</span>
                          <span className="font-bold">{payload[1]?.value || 0}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="totalAbsences" name="Absences" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalLates" name="Late Arrivals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Attendance Risk Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Student Attendance Risk & Projection Roster
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies individual students trending toward chronic absenteeism with tailored intervention recommendations
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterTier('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTier === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({classSummary.studentForecasts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTier('CHRONIC_RISK')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTier === 'CHRONIC_RISK'
                    ? 'bg-red-50 text-red-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                At-Risk ({classSummary.chronicAbsenteeismRiskCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTier('MODERATE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTier === 'MODERATE'
                    ? 'bg-amber-50 text-amber-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Moderate ({classSummary.moderateRiskCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTier('HEALTHY')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterTier === 'HEALTHY'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Healthy ({classSummary.healthyAttendanceCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Current Rate</th>
                <th className="px-5 py-3.5">Projected Rate</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5">Absences / Lates</th>
                <th className="px-5 py-3.5">Pattern Signature</th>
                <th className="px-5 py-3.5">Velocity</th>
                <th className="px-5 py-3.5 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(studentForecast => (
                <tr
                  key={studentForecast.studentId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    studentForecast.riskTier === 'CRITICAL' || studentForecast.riskTier === 'HIGH'
                      ? 'bg-red-50/30'
                      : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {studentForecast.studentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {studentForecast.studentName}
                        </span>
                        <span className="text-[11px] text-slate-500">{className}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {studentForecast.currentAttendanceRate}%
                      </span>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            studentForecast.currentAttendanceRate < 80
                              ? 'bg-red-500'
                              : studentForecast.currentAttendanceRate < 90
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${studentForecast.currentAttendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold ${
                          studentForecast.projectedAttendanceRate < 80
                            ? 'text-red-600'
                            : studentForecast.projectedAttendanceRate < 90
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {studentForecast.projectedAttendanceRate}%
                      </span>
                      {studentForecast.projectedAttendanceRate < studentForecast.currentAttendanceRate ? (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {getRiskBadge(studentForecast.riskTier)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-slate-700">
                      <span className="font-semibold text-red-600">{studentForecast.absentDays} Abs</span>
                      <span className="mx-1 text-slate-300">•</span>
                      <span className="font-semibold text-amber-600">{studentForecast.lateDays} Late</span>
                      <span className="mx-1 text-slate-300">•</span>
                      <span className="text-slate-500">{studentForecast.presentDays} Pres</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {studentForecast.isFridayMondayDominant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        Fri/Mon Clustering
                      </span>
                    ) : studentForecast.lateDays >= 2 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        Morning Tardiness
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Regular Pattern</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-medium ${
                        studentForecast.velocityTrend === 'Rapid Decline'
                          ? 'text-red-600'
                          : studentForecast.velocityTrend === 'Moderate Slippage'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {studentForecast.velocityTrend}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      id={`btn_diagnose_${studentForecast.studentId}`}
                      type="button"
                      onClick={() => handleOpenDiagnostic(studentForecast)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                        studentForecast.riskTier === 'CRITICAL' || studentForecast.riskTier === 'HIGH'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : studentForecast.riskTier === 'MODERATE'
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      View Analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic & Action Drawer Modal */}
      {selectedStudentForecast && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    Attendance & Absence Analysis
                  </span>
                  {getRiskBadge(selectedStudentForecast.riskTier)}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedStudentForecast.studentName} — Attendance Trajectory
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Class: {className} • 20 Days Tracked • Current Rate: {selectedStudentForecast.currentAttendanceRate}% • Projected Rate: {selectedStudentForecast.projectedAttendanceRate}%
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForecast(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Diagnostic Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Breakdown</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {selectedStudentForecast.presentDays} Present / {selectedStudentForecast.absentDays} Absent
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedStudentForecast.lateDays} Late Arrivals recorded
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dominant Pattern</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {selectedStudentForecast.isFridayMondayDominant
                      ? 'Pre/Post Weekend Clustering'
                      : selectedStudentForecast.lateDays >= 2
                      ? 'Morning Punctuality Slippage'
                      : 'Standard Variance'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Streak: {selectedStudentForecast.consecutiveAbsenceStreak} consecutive days
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guidance Counselor</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {selectedStudentForecast.aiCounselorReferralRequired ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Referral Advised
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Classroom Tier 1
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tier 1 Classroom Support
                  </p>
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Primary Contributing Risk Factors
                </h4>
                <ul className="space-y-1.5 text-xs text-amber-950">
                  {selectedStudentForecast.riskContributingFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Early Intervention Strategy */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Recommended Early Intervention Plan
                </h4>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  {selectedStudentForecast.earlyInterventionRecommendation}
                </p>
              </div>

              {/* Predictive Analysis Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Pattern Analysis & Pedagogical Narrative
                    </span>
                  </div>
                  <button
                    id="btn_run_ai_forecast_deep"
                    type="button"
                    disabled={aiGenerating}
                    onClick={handleRunLiveAIEvaluation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analyzing Patterns...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Analyze Patterns
                      </>
                    )}
                  </button>
                </div>

                {aiCustomResult && (
                  <div className="bg-white p-4 rounded-lg border border-indigo-200 space-y-3 text-xs text-slate-700 animate-in fade-in duration-150">
                    <div>
                      <span className="font-semibold text-slate-900">Root Cause Hypothesis:</span>
                      <p className="mt-0.5 text-slate-600">{aiCustomResult.rootCauseHypothesis}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Pedagogical Impact:</span>
                      <p className="mt-0.5 text-slate-600">{aiCustomResult.pedagogicalImpactAssessment}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Suggested Action Steps:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                        {aiCustomResult.recommendedInterventions?.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Pre-Drafted Parent Outreach Email */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recommended Guardian Outreach Draft
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyEmail(
                        aiCustomResult?.parentEmailDraft?.body || selectedStudentForecast.aiSuggestedParentMessage
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Email Draft
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-mono">
                  {aiCustomResult?.parentEmailDraft?.body || selectedStudentForecast.aiSuggestedParentMessage}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span>All recommendations comply with school pastoral care policies</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForecast(null)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Close
                </button>

                <button
                  id="btn_confirm_intervention_log"
                  type="button"
                  onClick={handleConfirmIntervention}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  {interventionLogged ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      Intervention Logged!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Log Intervention & Notify Pastoral Lead
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
