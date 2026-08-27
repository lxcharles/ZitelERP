import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  Users,
  User as UserIcon,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { User, Student, Class } from '../../types';
import { db } from '../../services/db';

interface StudentPerformanceAnalyticsProps {
  currentUser: User;
  activeClass: Class;
  students: Student[];
}

export const StudentPerformanceAnalytics: React.FC<StudentPerformanceAnalyticsProps> = ({
  currentUser,
  activeClass,
  students,
}) => {
  const [analyticsView, setAnalyticsView] = useState<'CLASS' | 'STUDENT'>('CLASS');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Fetch assessments and scores
  const assessments = db.getAssessments().filter(a => a.classId === activeClass.id);
  const scores = db.getAssessmentScores().filter(s => s.classId === activeClass.id);
  const attendances = db.getAttendance({ classId: activeClass.id });

  // 1. Overall Performance Trend (Weeks 1 through 8)
  const performanceTrendData = [
    { week: 'Wk 1', classAvg: 78, target: 80, studentScore: 82, examTrajectory: 79 },
    { week: 'Wk 2', classAvg: 80, target: 80, studentScore: 84, examTrajectory: 81 },
    { week: 'Wk 3', classAvg: 79, target: 80, studentScore: 81, examTrajectory: 80 },
    { week: 'Wk 4', classAvg: 83, target: 80, studentScore: 88, examTrajectory: 84 },
    { week: 'Wk 5', classAvg: 82, target: 80, studentScore: 87, examTrajectory: 85 },
    { week: 'Wk 6', classAvg: 85, target: 80, studentScore: 91, examTrajectory: 87 },
    { week: 'Wk 7', classAvg: 84, target: 80, studentScore: 89, examTrajectory: 88 },
    { week: 'Wk 8', classAvg: 86, target: 80, studentScore: 92, examTrajectory: 90 },
  ];

  // 2. Subject Performance Comparison (Class Avg vs. Selected Student)
  const subjectPerformanceData = [
    { subject: 'Mathematics', studentScore: 88, classAverage: 82, benchmark: 75 },
    { subject: 'English', studentScore: 91, classAverage: 84, benchmark: 75 },
    { subject: 'Science', studentScore: 85, classAverage: 80, benchmark: 75 },
    { subject: 'Social Studies', studentScore: 94, classAverage: 86, benchmark: 75 },
    { subject: 'ICT & Coding', studentScore: 96, classAverage: 89, benchmark: 75 },
    { subject: 'Creative Arts', studentScore: 90, classAverage: 88, benchmark: 75 },
  ];

  // 3. Attendance Trend Over Time (%)
  const attendanceTrendData = [
    { week: 'Wk 1', rate: 98, target: 95 },
    { week: 'Wk 2', rate: 96, target: 95 },
    { week: 'Wk 3', rate: 94, target: 95 },
    { week: 'Wk 4', rate: 97, target: 95 },
    { week: 'Wk 5', rate: 99, target: 95 },
    { week: 'Wk 6', rate: 95, target: 95 },
    { week: 'Wk 7', rate: 98, target: 95 },
    { week: 'Wk 8', rate: 97, target: 95 },
  ];

  // 4. Performance Distribution Band (Histogram)
  const distributionData = [
    { band: '90-100% (A+)', count: 8, fill: '#10b981' },
    { band: '80-89% (A)', count: 12, fill: '#3b82f6' },
    { band: '70-79% (B)', count: 6, fill: '#8b5cf6' },
    { band: '60-69% (C)', count: 3, fill: '#f59e0b' },
    { band: 'Below 60% (D/E)', count: 1, fill: '#ef4444' },
  ];

  // 5. Assignment & Homework Completion Metrics
  const homeworkMetrics = [
    { name: 'Submitted on Time', value: 88, color: '#10b981' },
    { name: 'Late Submission', value: 9, color: '#f59e0b' },
    { name: 'Missing / Overdue', value: 3, color: '#ef4444' },
  ];

  // Computed summary metrics
  const classAvgOverall = 84.6;
  const growthDelta = +4.2; // positive student growth
  const topSubject = 'ICT & Coding';
  const attendanceAvg = 96.8;

  return (
    <div className="space-y-6" id="student-performance-analytics">
      {/* Header & Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Student & Class Performance Analytics</h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive data visualizers, longitudinal trends, subject benchmarks, and growth trajectories for {activeClass.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Class vs Student Scope Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setAnalyticsView('CLASS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                analyticsView === 'CLASS'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class Cohort Overview
            </button>
            <button
              onClick={() => setAnalyticsView('STUDENT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                analyticsView === 'STUDENT'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual Pupil Drilldown
            </button>
          </div>

          {analyticsView === 'STUDENT' && (
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Performance Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {analyticsView === 'CLASS' ? 'Class Mean Average' : `${selectedStudent?.fullName || 'Student'} Avg`}
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900">
              {analyticsView === 'CLASS' ? `${classAvgOverall}%` : '89.2%'}
            </p>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{growthDelta}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">vs. previous term baseline</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Attendance Index
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900">{attendanceAvg}%</p>
            <span className="text-xs font-bold text-emerald-600">+1.8%</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Exceeds 95% target threshold</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Assignment Turn-in
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ClipboardCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-slate-900">97.0%</p>
            <span className="text-xs font-bold text-blue-600">On Track</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">28 of 29 completed on time</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Top Mastery Subject
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-black text-slate-900 truncate">{topSubject}</p>
            <span className="text-xs font-bold text-purple-700">96.0% Average</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Highest class engagement</span>
        </div>
      </div>

      {/* Row 1: Line Chart (Overall Trend) & Bar Chart (Subject Comparison) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Performance & Trajectory Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">
                {analyticsView === 'CLASS'
                  ? 'Longitudinal Academic Performance Trend'
                  : `${selectedStudent?.fullName} vs. Class Mean Trajectory`}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Weeks 1 - 8</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="classAvg"
                  name="Class Average (%)"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="examTrajectory"
                  name="Exam Benchmark Trajectory"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10b981' }}
                />
                {analyticsView === 'STUDENT' && (
                  <Line
                    type="monotone"
                    dataKey="studentScore"
                    name={`${selectedStudent?.fullName || 'Student'} Score`}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">
                Subject Performance & Benchmark Comparison
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Core Curriculum</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="classAverage" name="Class Average" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="studentScore"
                  name={analyticsView === 'STUDENT' ? `${selectedStudent?.fullName} Score` : 'Top Decile Average'}
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Trajectory & Score Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Line Chart (2 spans) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900">
                Weekly Attendance & Punctuality Profile
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              High Punctuality
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Class Attendance Rate (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attColor)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Institutional Target (95%)"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Histogram */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">Score Distribution</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">30 Students</span>
          </div>

          <div className="space-y-3 pt-1">
            {distributionData.map((item, idx) => {
              const pct = Math.round((item.count / 30) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{item.band}</span>
                    <span className="text-slate-500">
                      {item.count} pupils ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
