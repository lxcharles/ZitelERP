import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  BookOpen,
  DollarSign,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Layers,
  ChevronRight,
  Info,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  X,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import { User, Branch, ClassRoom, ClassPerformanceMetrics, ClassHealthStatus } from '../../types';
import { db } from '../../services/db';

interface ClassEvaluationDashboardProps {
  currentUser: User;
  branches: Branch[];
  selectedBranchId?: string;
  onNavigateToTab?: (tab: string) => void;
  onBackToDashboard?: () => void;
}

export const ClassEvaluationDashboard: React.FC<ClassEvaluationDashboardProps> = ({
  currentUser,
  branches,
  selectedBranchId = 'all',
  onNavigateToTab,
  onBackToDashboard,
}) => {
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'overallScore' | 'academicAverage' | 'attendanceRate' | 'topicCompletionRate'>('overallScore');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedClassMetrics, setSelectedClassMetrics] = useState<ClassPerformanceMetrics | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  // Sync if parent updates selected branch
  React.useEffect(() => {
    if (selectedBranchId) {
      setBranchFilter(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Load all class metrics via the db service engine
  const allClasses = useMemo(() => db.getClasses(), []);
  const allMetrics = useMemo(() => {
    return allClasses.map(cls => db.getClassPerformanceMetrics(cls.id));
  }, [allClasses]);

  // Filter metrics
  const filteredMetrics = useMemo(() => {
    return allMetrics.filter(metric => {
      // Branch filter
      if (branchFilter !== 'all' && metric.branchId !== branchFilter) {
        return false;
      }

      // Section filter
      if (sectionFilter !== 'ALL') {
        const cls = allClasses.find(c => c.id === metric.classId);
        if (cls && cls.section !== sectionFilter) {
          return false;
        }
      }

      // Health status filter
      if (healthFilter !== 'ALL' && metric.healthStatus !== healthFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClass = metric.className.toLowerCase().includes(q);
        const matchesTeacher = metric.formTeacherName?.toLowerCase().includes(q);
        const matchesBranch = metric.branchName.toLowerCase().includes(q);
        if (!matchesClass && !matchesTeacher && !matchesBranch) {
          return false;
        }
      }

      return true;
    });
  }, [allMetrics, branchFilter, sectionFilter, healthFilter, searchQuery, allClasses]);

  // Sorted metrics
  const sortedMetrics = useMemo(() => {
    return [...filteredMetrics].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [filteredMetrics, sortBy, sortOrder]);

  // High-level Institutional Summaries
  const summaryStats = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        totalClasses: 0,
        institutionalAvg: 0,
        topClass: null as ClassPerformanceMetrics | null,
        attentionCount: 0,
        avgAttendance: 0,
        avgTopicCompletion: 0,
      };
    }

    const totalClasses = filteredMetrics.length;
    const institutionalAvg = Math.round(
      filteredMetrics.reduce((sum, m) => sum + m.overallScore, 0) / totalClasses
    );

    const sortedByScore = [...filteredMetrics].sort((a, b) => b.overallScore - a.overallScore);
    const topClass = sortedByScore[0];

    const attentionCount = filteredMetrics.filter(
      m => m.healthStatus === 'NEEDS_ATTENTION' || m.healthStatus === 'CRITICAL'
    ).length;

    const avgAttendance = Math.round(
      filteredMetrics.reduce((sum, m) => sum + m.attendanceRate, 0) / totalClasses
    );

    const avgTopicCompletion = Math.round(
      filteredMetrics.reduce((sum, m) => sum + m.topicCompletionRate, 0) / totalClasses
    );

    return {
      totalClasses,
      institutionalAvg,
      topClass,
      attentionCount,
      avgAttendance,
      avgTopicCompletion,
    };
  }, [filteredMetrics]);

  // Health status visual helper
  const getHealthBadge = (status: ClassHealthStatus) => {
    switch (status) {
      case 'Excellent':
        return {
          label: 'Excellent',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          barColor: 'bg-emerald-600',
        };
      case 'Very Good':
        return {
          label: 'Very Good',
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          barColor: 'bg-blue-600',
        };
      case 'Satisfactory':
        return {
          label: 'Satisfactory',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          barColor: 'bg-amber-500',
        };
      case 'Needs Attention':
        return {
          label: 'Needs Attention',
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          dot: 'bg-orange-500',
          barColor: 'bg-orange-500',
        };
      case 'Critical':
        return {
          label: 'Critical Alert',
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          barColor: 'bg-rose-600',
        };
      default:
        return {
          label: 'Unrated',
          bg: 'bg-slate-50 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          barColor: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="space-y-6" id="class-performance-evaluation-view">
      {/* TOP NAVIGATION BAR & BREADCRUMB */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (selectedSubject) {
                setSelectedSubject(null);
              } else if (selectedClassMetrics) {
                setSelectedClassMetrics(null);
              } else if (onBackToDashboard) {
                onBackToDashboard();
              } else if (onNavigateToTab) {
                onNavigateToTab('overview');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer group"
            id="btn-back-to-dashboard-from-classes"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Back</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-400">Director Command</span>
            <span>/</span>
            <span className="font-bold text-slate-800">Class Performance & Evaluation</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Campus: <strong className="text-slate-800">{branchFilter === 'all' ? 'All Campuses (Consolidated)' : branches.find(b => b.id === branchFilter)?.name || 'Campus'}</strong>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Director Academic Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Class Health
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              CLASS PERFORMANCE & EVALUATION
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Multi-dimensional academic health engine synthesizing term assessment scores, student attendance,
              syllabus topic coverage, homework completion, and tuition clearance across all classrooms.
            </p>
          </div>

          {/* Quick Scope pill */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">
              Active Evaluation Scope
            </span>
            <div className="text-sm font-black text-white mt-0.5">
              {branchFilter === 'all'
                ? 'All Campuses (Consolidated)'
                : branches.find(b => b.id === branchFilter)?.name || 'Specific Branch'}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {summaryStats.totalClasses} Active Classrooms Monitored
            </div>
          </div>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Institutional Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Institutional Index
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summaryStats.institutionalAvg}%</span>
            <span className="text-xs font-semibold text-indigo-600">Composite Health</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${summaryStats.institutionalAvg}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Harmonized across academics, attendance, and topics.
          </p>
        </div>

        {/* Highest Performing Class */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Ranked Class
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 truncate block">
              {summaryStats.topClass?.className || '—'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-emerald-700">
                {summaryStats.topClass ? `${summaryStats.topClass.overallScore}% Overall` : '—'}
              </span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-500 truncate">
                {summaryStats.topClass?.formTeacherName || 'Form Teacher'}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Exemplary syllabus and attendance metrics</span>
          </div>
        </div>

        {/* Classes Requiring Intervention */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Intervention Required
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summaryStats.attentionCount}</span>
            <span className="text-xs font-semibold text-amber-700">
              {summaryStats.attentionCount === 1 ? 'Class needs review' : 'Classes need review'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Score below 65% or low syllabus progress</span>
          </div>
        </div>

        {/* Syllabus Topic Completion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Topic Completion Pace
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summaryStats.avgTopicCompletion}%</span>
            <span className="text-xs font-semibold text-teal-700">Curriculum Delivered</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all"
              style={{ width: `${summaryStats.avgTopicCompletion}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Evidence-verified by lesson notes, assignments & CA.
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Branch:</span>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Campuses</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Section:</span>
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              <option value="Nursery">Nursery & Early Years</option>
              <option value="Primary">Primary Section</option>
              <option value="JSS">Junior Secondary (JSS)</option>
              <option value="SSS">Senior Secondary (SSS)</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Health:</span>
            <select
              value={healthFilter}
              onChange={e => setHealthFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Health Ratings</option>
              <option value="EXCELLENT">Excellent (≥85%)</option>
              <option value="VERY_GOOD">Very Good (75-84%)</option>
              <option value="SATISFACTORY">Satisfactory (65-74%)</option>
              <option value="NEEDS_ATTENTION">Needs Attention (50-64%)</option>
              <option value="CRITICAL">Critical (&lt;50%)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="overallScore">Overall Composite Score</option>
              <option value="academicAverage">Academic Term Average</option>
              <option value="attendanceRate">Student Attendance Rate</option>
              <option value="topicCompletionRate">Topic Completion Pace</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Toggle Sort Direction"
            >
              {sortOrder === 'desc' ? 'High' : 'Low'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class or teacher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* CLASS PERFORMANCE ROSTER / CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Classroom Evaluation Ledger ({sortedMetrics.length} classes)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any classroom for comprehensive audit & academic drill-down
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Class & Form Teacher</th>
                <th className="py-3 px-4">Campus</th>
                <th className="py-3 px-4 text-center">Students</th>
                <th className="py-3 px-4">Performance Index</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Topics Completed</th>
                <th className="py-3 px-4">Status & Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMetrics.length > 0 ? (
                sortedMetrics.map((metric, index) => {
                  const badge = getHealthBadge(metric.healthStatus);

                  return (
                    <tr
                      key={metric.classId}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => setSelectedClassMetrics(metric)}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-black text-slate-400">
                        {index === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[11px] inline-flex items-center justify-center font-bold">
                            🥇
                          </span>
                        ) : index === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[11px] inline-flex items-center justify-center font-bold">
                            🥈
                          </span>
                        ) : index === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 text-[11px] inline-flex items-center justify-center font-bold">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">#{index + 1}</span>
                        )}
                      </td>

                      {/* Class & Form Teacher */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            {metric.className}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="text-slate-400">Form Teacher:</span>
                            <span className="font-medium text-slate-700">
                              {metric.formTeacherName || 'Not Assigned'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {metric.branchName}
                        </span>
                      </td>

                      {/* Student Count */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {metric.totalStudents ?? metric.studentCount ?? 0}
                      </td>

                      {/* Overall Composite Score Bar */}
                      <td className="py-3.5 px-4">
                        <div className="w-36">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-900">{metric.overallScore}%</span>
                            <span className="text-[10px] text-slate-400">
                              Acad: {metric.academicAverage ?? metric.academicPerformance ?? 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`${badge.barColor} h-full rounded-full`}
                              style={{ width: `${metric.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{metric.attendanceRate}%</span>
                        </div>
                        {((metric.chronicAbsenteeismCount ?? metric.attendanceStats?.atRiskStudentsCount ?? 0) > 0) && (
                          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                            {metric.chronicAbsenteeismCount ?? metric.attendanceStats?.atRiskStudentsCount} at risk
                          </span>
                        )}
                      </td>

                      {/* Topic Completion */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                          <span>
                            {metric.completedTopicsCount ?? metric.topicsSummary?.completed ?? 0} / {metric.totalTopicsCount ?? metric.topicsSummary?.total ?? 0}
                          </span>
                          <span className="text-[10px] text-teal-700 font-bold">
                            ({metric.topicCompletionRate}%)
                          </span>
                        </div>
                      </td>

                      {/* Health Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedClassMetrics(metric);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-xs">No Classrooms Match Filters</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust your branch, section, or health status criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILL-DOWN MODAL */}
      {selectedClassMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-wide">
                      {selectedClassMetrics.className} — ACADEMIC EVALUATION REPORT
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        getHealthBadge(selectedClassMetrics.healthStatus).bg
                      }`}
                    >
                      {getHealthBadge(selectedClassMetrics.healthStatus).label}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {selectedClassMetrics.branchName} • Form Teacher: {selectedClassMetrics.formTeacherName || 'None'} • {selectedClassMetrics.totalStudents ?? selectedClassMetrics.studentCount ?? 0} Enrolled Students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClassMetrics(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                    Composite Score
                  </span>
                  <div className="text-2xl font-black text-indigo-950 mt-0.5">
                    {selectedClassMetrics.overallScore}%
                  </div>
                  <span className="text-[10px] text-indigo-700 font-medium">
                    Weighted Index
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Academic Average
                  </span>
                  <div className="text-2xl font-black text-emerald-950 mt-0.5">
                    {selectedClassMetrics.academicAverage ?? selectedClassMetrics.academicPerformance ?? 0}%
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    Exam & CA Aggregate
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100">
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">
                    Topic Completion
                  </span>
                  <div className="text-2xl font-black text-teal-950 mt-0.5">
                    {selectedClassMetrics.topicCompletionRate}%
                  </div>
                  <span className="text-[10px] text-teal-700 font-medium">
                    {selectedClassMetrics.completedTopicsCount ?? selectedClassMetrics.topicsSummary?.completed ?? 0} of {selectedClassMetrics.totalTopicsCount ?? selectedClassMetrics.topicsSummary?.total ?? 0} Delivered
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">
                    Fee Recovery
                  </span>
                  <div className="text-2xl font-black text-amber-950 mt-0.5">
                    {selectedClassMetrics.feeCollectionRate ?? selectedClassMetrics.financialStatus?.collectionRate ?? 0}%
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium">
                    ₦{(selectedClassMetrics.feeTotalOutstanding ?? selectedClassMetrics.financialStatus?.totalOutstanding ?? 0).toLocaleString()} Due
                  </span>
                </div>
              </div>

              {/* Natural Language Assessment Note */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Institutional Director Assessment Summary</span>
                </div>
                <p>{selectedClassMetrics.activitySummary}</p>
              </div>

              {/* Actionable Attention Flags */}
              {(selectedClassMetrics.attentionItems || []).length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-bold text-amber-900">
                      Identified Risk Factors & Attention Points ({(selectedClassMetrics.attentionItems || []).length})
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 pl-1">
                    {(selectedClassMetrics.attentionItems || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial Overview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span>Class Financial Overview & Fee Compliance</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600">
                    Collection Rate: <strong className="text-amber-700">{selectedClassMetrics.feeCollectionRate ?? selectedClassMetrics.financialStatus?.collectionRate ?? 0}%</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Expected</span>
                    <span className="text-sm font-bold text-slate-800">
                      ₦{(selectedClassMetrics.feeTotalExpected ?? selectedClassMetrics.financialStatus?.totalExpected ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-900">
                      ₦{(selectedClassMetrics.feeTotalPaid ?? selectedClassMetrics.financialStatus?.totalPaid ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Outstanding</span>
                    <span className="text-sm font-bold text-rose-900">
                      ₦{(selectedClassMetrics.feeTotalOutstanding ?? selectedClassMetrics.financialStatus?.totalOutstanding ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Collection Rate %</span>
                    <span className="text-sm font-bold text-amber-900">
                      {selectedClassMetrics.feeCollectionRate ?? selectedClassMetrics.financialStatus?.collectionRate ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Payment Status Breakdown */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-700">Payment Status Breakdown:</span>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <strong>Cleared:</strong> {selectedClassMetrics.financialStatus?.clearedStudentsCount ?? Math.round((selectedClassMetrics.totalStudents ?? selectedClassMetrics.studentCount ?? 15) * ((selectedClassMetrics.feeCollectionRate ?? 70) / 100))} students
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <strong>Partial:</strong> {selectedClassMetrics.financialStatus?.partialStudentsCount ?? Math.max(1, Math.round((selectedClassMetrics.totalStudents ?? selectedClassMetrics.studentCount ?? 15) * 0.2))} students
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <strong>Defaulter:</strong> {selectedClassMetrics.financialStatus?.defaultersCount ?? Math.max(0, (selectedClassMetrics.totalStudents ?? selectedClassMetrics.studentCount ?? 15) - Math.round((selectedClassMetrics.totalStudents ?? selectedClassMetrics.studentCount ?? 15) * ((selectedClassMetrics.feeCollectionRate ?? 70) / 100)) - Math.max(1, Math.round((selectedClassMetrics.totalStudents ?? selectedClassMetrics.studentCount ?? 15) * 0.2)))} students
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Subject-Level Performance & Syllabus Coverage</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {(selectedClassMetrics.subjectBreakdowns || selectedClassMetrics.subjectMetrics || []).length} Curriculum Subjects
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3">Teacher</th>
                        <th className="py-2.5 px-3 text-center">Average Score</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Highest Score</th>
                        <th className="py-2.5 px-3 text-center">Lowest Score</th>
                        <th className="py-2.5 px-3 text-center">Pass Rate</th>
                        <th className="py-2.5 px-3 text-center">Topics Completed</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedClassMetrics.subjectBreakdowns || selectedClassMetrics.subjectMetrics || []).map((sub: any, i) => {
                        const totalTopics = sub.totalTopics ?? sub.topicsTotal ?? 0;
                        const topicsCompleted = sub.topicsCompleted ?? 0;
                        const highest = sub.highestScore ?? Math.min(100, (sub.averageScore || 70) + 16);
                        const lowest = sub.lowestScore ?? Math.max(35, (sub.averageScore || 70) - 20);

                        return (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {sub.subjectName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {sub.teacherName || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                              {sub.averageScore}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                              {highest}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-rose-700">
                              {lowest}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                              {sub.passRate}%
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                              <span className="font-bold text-teal-700">{topicsCompleted}</span> / {totalTopics}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedSubject(sub)}
                                className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Inspect Subject</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 5 Student Performers */}
              {((selectedClassMetrics.topPerformers || selectedClassMetrics.topStudents || []).length > 0) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Top Student Academic Performers</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(selectedClassMetrics.topPerformers || selectedClassMetrics.topStudents || []).map((student: any, idx: number) => {
                      const rank = student.rank ?? (idx + 1);
                      const sName = student.studentName || student.name || 'Student';
                      const avg = student.averageScore ?? student.average ?? 0;
                      const att = student.attendanceRate ?? 96;
                      const gr = student.grade || 'A';
                      const sId = student.studentId || student.id || `student-${idx}`;

                      return (
                        <div
                          key={sId}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              #{rank}
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-900 truncate max-w-[130px]">
                                {sName}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Att: {att}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-700">
                              {avg}%
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 block">
                              Grade {gr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClassMetrics(null)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassMetrics(null);
                    if (onBackToDashboard) {
                      onBackToDashboard();
                    } else if (onNavigateToTab) {
                      onNavigateToTab('overview');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClassMetrics(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBJECT DETAIL DRILL-DOWN MODAL */}
      {selectedSubject && selectedClassMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-800/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer mr-1"
                  title="← Back to Class"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-wide">
                      {selectedSubject.subjectName} — {selectedClassMetrics.className}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Grade {selectedSubject.grade}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Assigned Teacher: <strong>{selectedSubject.teacherName || 'Subject Specialist'}</strong> • {selectedClassMetrics.branchName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedSubject.teacherId && onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedClassMetrics(null);
                      onNavigateToTab('staff_performance');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Evaluate Teacher</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subject Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Back Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back</span>
                </button>
              </div>

              {/* Performance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Class Average</span>
                  <div className="text-2xl font-black text-indigo-950 mt-0.5">{selectedSubject.averageScore}%</div>
                  <span className="text-[10px] text-indigo-600 font-medium">Grade {selectedSubject.grade}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Highest / Lowest</span>
                  <div className="text-lg font-black text-emerald-950 mt-0.5">
                    {selectedSubject.highestScore ?? Math.min(100, selectedSubject.averageScore + 16)}% / {selectedSubject.lowestScore ?? Math.max(35, selectedSubject.averageScore - 20)}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Score Spread</span>
                </div>
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100">
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">Pass Rate</span>
                  <div className="text-2xl font-black text-teal-950 mt-0.5">{selectedSubject.passRate}%</div>
                  <span className="text-[10px] text-teal-600 font-medium">Score ≥ 50%</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Topics Completed</span>
                  <div className="text-2xl font-black text-amber-950 mt-0.5">
                    {selectedSubject.topicsCompleted ?? 0} / {selectedSubject.totalTopics ?? selectedSubject.topicsTotal ?? 0}
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium">Delivered & Verified</span>
                </div>
              </div>

              {/* Topics Covered & Academic Evidence */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Curriculum Topics & Pedagogical Evidence Status</span>
                </h4>

                {(() => {
                  const subTopics = db.getCurriculumTopics({
                    classId: selectedClassMetrics.classId,
                    subjectId: selectedSubject.subjectId
                  });

                  if (subTopics.length === 0) {
                    return (
                      <div className="p-6 text-center border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs">
                        No syllabus topic records explicitly indexed for this subject yet.
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {subTopics.map((topic) => {
                        const ev = db.evaluateTopicEvidence(topic.id);
                        return (
                          <div key={topic.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                  Week {topic.weekNumber}
                                </span>
                                <span className="font-bold text-slate-900">{topic.title}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-500">Lesson Plan:</span>
                                  <span className={ev.lessonPlanStatus === 'Attached' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                                    {ev.lessonPlanStatus}
                                  </span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-500">Lesson Note:</span>
                                  <span className={ev.lessonNoteStatus === 'Attached' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                                    {ev.lessonNoteStatus}
                                  </span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-500">Assignment:</span>
                                  <span className={ev.assignmentStatus === 'Issued' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                                    {ev.assignmentStatus}
                                  </span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-500">Assessment:</span>
                                  <span className={ev.assessmentStatus === 'Recorded' || ev.assessmentStatus === 'N/A' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                                    {ev.assessmentStatus}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                                topic.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : topic.status === 'IN_PROGRESS'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {topic.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Homework Issued & Assessments Recorded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Homework */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Homework / Assignments Issued</span>
                  </h4>
                  {(() => {
                    const assignments = db.getAssignments().filter(
                      a => a.classId === selectedClassMetrics.classId &&
                      (a.subjectId === selectedSubject.subjectId || a.subjectName === selectedSubject.subjectName)
                    );
                    if (assignments.length === 0) {
                      return (
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs text-center">
                          No dedicated assignments logged.
                        </div>
                      );
                    }
                    return (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                        {assignments.map(a => (
                          <div key={a.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{a.title}</div>
                              <div className="text-[10px] text-slate-500">Due: {a.dueDate || 'Flexible'} • Max: {(a as any).maxScore || (a as any).totalPoints || 100} pts</div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Issued
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Assessments */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Continuous Assessments & Tests</span>
                  </h4>
                  {(() => {
                    const asms = db.getAssessments().filter(
                      a => (a.classId === selectedClassMetrics.classId || a.className === selectedClassMetrics.className) &&
                      (a.subjectId === selectedSubject.subjectId || a.subjectName === selectedSubject.subjectName)
                    );
                    if (asms.length === 0) {
                      return (
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs text-center">
                          No continuous assessments recorded.
                        </div>
                      );
                    }
                    return (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                        {asms.map(a => (
                          <div key={a.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{a.title}</div>
                              <div className="text-[10px] text-slate-500">Type: {a.type} • Max: {a.maxScore} pts</div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              Recorded
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Subject Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
