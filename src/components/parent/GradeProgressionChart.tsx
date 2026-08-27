import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Layers,
  ArrowUpRight,
  Info,
  Compass,
  Download,
  Share2,
} from 'lucide-react';
import { getStudentProgression, TermProgressRecord } from '../../data/progressionData';
import { Student } from '../../types';

interface GradeProgressionChartProps {
  student: Student;
}

type ChartViewMode = 'composite' | 'subjects' | 'term_breakdown' | 'competencies';

export const GradeProgressionChart: React.FC<GradeProgressionChartProps> = ({ student }) => {
  const progression = getStudentProgression(student.id);
  const [activeView, setActiveView] = useState<ChartViewMode>('composite');
  const [selectedTermIndex, setSelectedTermIndex] = useState<number>(
    progression.terms.length > 0 ? progression.terms.length - 2 : 0 // Default to current term (second-to-last if last is projection)
  );

  const currentTermRecord: TermProgressRecord =
    progression.terms[selectedTermIndex] || progression.terms[0];

  // Prepare Composite Trend Data
  const compositeTrendData = progression.terms.map(term => ({
    termName: term.termCode,
    fullTermName: term.termName,
    studentScore: term.overallScore,
    cohortAverage: term.cohortAverage,
    gpa: term.gpa,
    rank: term.rankInClass,
    percentile: term.percentile,
    attendanceRate: term.attendanceRate,
    isTarget: term.termId.includes('proj'),
  }));

  // Prepare Subject Trajectory Data across all terms
  const subjectList = currentTermRecord.subjectScores.map(s => s.subjectName);
  const subjectTrajectoryData = progression.terms.map(term => {
    const entry: Record<string, any> = {
      termCode: term.termCode,
      termName: term.termName,
      isTarget: term.termId.includes('proj'),
    };
    term.subjectScores.forEach(sub => {
      entry[sub.subjectName] = sub.score;
    });
    return entry;
  });

  // Subject colors for lines
  const subjectColors: Record<string, string> = {
    Mathematics: '#2563eb', // Blue
    'English Language': '#7c3aed', // Purple
    'Basic Science': '#059669', // Green
    'Social Studies': '#d97706', // Amber
    'Creative Arts': '#db2777', // Pink
    'Computer Literacy': '#0284c7', // Sky
    'Early Numeracy': '#2563eb',
    'Phonics & Literacy': '#7c3aed',
    'Discovery Science': '#059669',
    'Creative Arts & Music': '#db2777',
  };

  // Prepare Term Breakdown Data (Student vs Cohort for selected term)
  const termBreakdownData = currentTermRecord.subjectScores.map(sub => ({
    subject: sub.subjectName,
    studentScore: sub.score,
    cohortAvg: sub.cohortAvg,
    gradeLetter: sub.gradeLetter,
    effort: sub.effort,
  }));

  // Prepare Competency Radar Data
  const competencyData = (currentTermRecord.coreCompetencies || []).map(comp => ({
    domain: comp.domain,
    studentScore: comp.score,
    cohortAverage: comp.cohortAvg,
    fullMark: 100,
  }));

  const handleExportSummary = () => {
    const summaryText = `Academic Growth Profile for ${student.fullName} (${progression.className})
Longitudinal Growth: +${progression.growthVelocity.annualScoreDelta}%
Best Improving Subject: ${progression.growthVelocity.bestImprovingSubject}
Current Score: ${currentTermRecord.overallScore}% (${currentTermRecord.gradeLetter})
Current Class Rank: ${currentTermRecord.rankInClass}
Percentile: ${currentTermRecord.percentile}th Percentile
Oakridge Primary School Management System`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.fullName.replace(/\s+/g, '_')}_Academic_Growth_Report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="grade_progression_analytics_wrapper" className="space-y-6">
      {/* Top Headline Growth Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-Term Growth</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">+{progression.growthVelocity.annualScoreDelta}%</span>
              <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                {progression.growthVelocity.learningTrajectory}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Growth since {progression.enrolledYear} baseline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Class Rank</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{currentTermRecord.rankInClass}</span>
              <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {currentTermRecord.percentile}th %ile
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">GPA: {currentTermRecord.gpa.toFixed(2)} / 4.0</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Velocity Subject</p>
            <div className="mt-1">
              <span className="text-lg font-bold text-slate-900 truncate block">
                {progression.growthVelocity.bestImprovingSubject}
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Highest continuous upward curve
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consistency Index</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{progression.growthVelocity.consistencyScore}%</span>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                High Reliability
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Assessed over {progression.terms.length} terms</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Compass className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Canvas Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Chart Header and Controls */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Multi-Term Academic Growth & Progression
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                D3 / Recharts Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizing {student.fullName}'s grade trajectory across {progression.terms.length} consecutive academic terms
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
            <button
              id="btn_chart_view_composite"
              type="button"
              onClick={() => setActiveView('composite')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'composite'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Composite Trend
            </button>

            <button
              id="btn_chart_view_subjects"
              type="button"
              onClick={() => setActiveView('subjects')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'subjects'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Subject Trajectories
            </button>

            <button
              id="btn_chart_view_term_breakdown"
              type="button"
              onClick={() => setActiveView('term_breakdown')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'term_breakdown'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Term vs Cohort
            </button>

            <button
              id="btn_chart_view_competencies"
              type="button"
              onClick={() => setActiveView('competencies')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'competencies'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Skills Radar
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        <div className="p-6">
          {/* VIEW 1: Composite Multi-Term Trend (Area + Line Chart) */}
          {activeView === 'composite' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 pb-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    <span className="font-medium text-slate-700">{student.fullName}'s Overall Score (%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span>Grade Cohort Average (%)</span>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dashed segment indicates Projected Target trajectory</span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={compositeTrendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="termName"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={[60, 100]}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val: number) => `${val}%`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-800">
                              <div className="font-semibold text-sm text-indigo-200">
                                {data.fullTermName}
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-200">
                                <span>Student Score:</span>
                                <span className="font-bold text-white text-sm">{data.studentScore}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-300">
                                <span>Cohort Average:</span>
                                <span>{data.cohortAverage}%</span>
                              </div>
                              <div className="pt-1.5 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-slate-300">
                                <div>Rank: <span className="text-white font-medium">{data.rank}</span></div>
                                <div>GPA: <span className="text-white font-medium">{data.gpa.toFixed(2)}</span></div>
                                <div>Percentile: <span className="text-emerald-400 font-medium">{data.percentile}th</span></div>
                                <div>Attendance: <span className="text-white font-medium">{data.attendanceRate}%</span></div>
                              </div>
                              {data.isTarget && (
                                <div className="mt-1 bg-indigo-500/20 text-indigo-300 text-[10px] p-1 rounded font-medium text-center">
                                  Forecasted Target Growth
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="studentScore"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#studentScoreGrad)"
                      activeDot={{ r: 7, strokeWidth: 2, stroke: '#ffffff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cohortAverage"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, stroke: '#94a3b8' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Term pills interactive navigation */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
                  Select Term to Inspect:
                </span>
                {progression.terms.map((t, idx) => (
                  <button
                    key={t.termId}
                    type="button"
                    onClick={() => setSelectedTermIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTermIndex === idx
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t.periodLabel} ({t.overallScore}%)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: Subject-by-Subject Deep Dive */}
          {activeView === 'subjects' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 flex items-center justify-between pb-2">
                <span>Multi-term longitudinal trajectory across individual subject domains</span>
                <span className="text-indigo-600 font-medium">All subjects plotted over {progression.terms.length} terms</span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={subjectTrajectoryData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="termCode"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={[70, 100]}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val: number) => `${val}%`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const termInfo = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-800 min-w-[200px]">
                              <div className="font-semibold text-indigo-200 border-b border-slate-700 pb-1">
                                {termInfo.termName}
                              </div>
                              {payload.map((entry: any, i: number) => (
                                <div key={i} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    ></div>
                                    <span className="text-slate-300">{entry.name}:</span>
                                  </div>
                                  <span className="font-bold text-white">{entry.value}%</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {subjectList.map(subject => (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={subject}
                        name={subject}
                        stroke={subjectColors[subject] || '#6366f1'}
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* VIEW 3: Term vs Cohort (Bar Chart) */}
          {activeView === 'term_breakdown' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
                <div className="text-xs text-slate-500">
                  Detailed comparison for <span className="font-semibold text-slate-800">{currentTermRecord.termName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Term:</span>
                  <select
                    value={selectedTermIndex}
                    onChange={e => setSelectedTermIndex(Number(e.target.value))}
                    className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {progression.terms.map((t, idx) => (
                      <option key={t.termId} value={idx}>
                        {t.termName} ({t.overallScore}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={termBreakdownData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="subject"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={[50, 100]}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val: number) => `${val}%`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-800">
                              <div className="font-semibold text-indigo-200">{data.subject}</div>
                              <div className="flex items-center justify-between gap-4 text-slate-200">
                                <span>{student.fullName}:</span>
                                <span className="font-bold text-white text-sm">
                                  {data.studentScore}% ({data.gradeLetter})
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-300">
                                <span>Class Average:</span>
                                <span>{data.cohortAvg}%</span>
                              </div>
                              <div className="pt-1 border-t border-slate-700 text-slate-300">
                                Effort Rating: <span className="text-emerald-400 font-medium">{data.effort}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="studentScore"
                      name={`${student.fullName}'s Score`}
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="cohortAvg"
                      name="Cohort Average"
                      fill="#cbd5e1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* VIEW 4: Competency Radar */}
          {activeView === 'competencies' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 flex items-center justify-between pb-2">
                <span>Holistic skill domain mastery assessed during {currentTermRecord.periodLabel}</span>
                <span className="text-emerald-600 font-medium">All domains exceed grade benchmarks</span>
              </div>

              <div className="h-80 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="domain" stroke="#475569" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[60, 100]} stroke="#94a3b8" fontSize={10} />
                    <Radar
                      name={`${student.fullName}'s Mastery`}
                      dataKey="studentScore"
                      stroke="#4f46e5"
                      fill="#6366f1"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Cohort Benchmark"
                      dataKey="cohortAverage"
                      stroke="#94a3b8"
                      fill="#cbd5e1"
                      fillOpacity={0.2}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Term Narrative & Teacher Remark Box */}
        <div className="bg-slate-50 border-t border-slate-200 p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                  Teacher Observation ({currentTermRecord.periodLabel})
                </span>
                <span className="text-xs text-slate-500">
                  Recorded by Class Form Tutor
                </span>
              </div>
              <p className="text-sm text-slate-700 italic">
                "{currentTermRecord.teacherRemarks}"
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn_download_growth_report"
                type="button"
                onClick={handleExportSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export Growth Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Term-by-Term Progress Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Longitudinal Multi-Term Academic Transcript
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical grade records, class rank, and performance trajectories across terms
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {progression.terms.length} Terms Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Academic Period</th>
                <th className="px-5 py-3">Overall Score</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">GPA</th>
                <th className="px-5 py-3">Cohort Average</th>
                <th className="px-5 py-3">Class Rank</th>
                <th className="px-5 py-3">Percentile</th>
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {progression.terms.map((t, idx) => (
                <tr
                  key={t.termId}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    selectedTermIndex === idx ? 'bg-indigo-50/40 font-medium' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-900">{t.termName}</span>
                        {t.termId.includes('proj') && (
                          <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-medium">
                            Target
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900">{t.overallScore}%</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        t.gradeLetter.startsWith('A')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {t.gradeLetter}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{t.gpa.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-slate-500">{t.cohortAverage}%</td>
                  <td className="px-5 py-3.5 text-slate-900">{t.rankInClass}</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-semibold">{t.percentile}th %ile</td>
                  <td className="px-5 py-3.5 text-slate-700">{t.attendanceRate}%</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTermIndex(idx);
                        setActiveView('term_breakdown');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
