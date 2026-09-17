import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Award,
  Building2,
  Filter,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Branch } from '../../types';

export interface TermAcademicPerformanceDataPoint {
  termCode: string;
  termName: string;
  academicYear: string;
  termShort: string;
  bungalowScore: number;
  ijegunScore: number;
  institutionalAverage: number;
  benchmarkTarget: number;
  isCurrent?: boolean;
  isProjected?: boolean;
  notes?: string;
  subjectBreakdown?: {
    stem: { bungalow: number; ijegun: number };
    english: { bungalow: number; ijegun: number };
    sciences: { bungalow: number; ijegun: number };
    socialStudies: { bungalow: number; ijegun: number };
  };
}

// Historical and current term-over-term academic scores across Zitel Castle School branches
export const HISTORICAL_TERM_PERFORMANCE_DATA: TermAcademicPerformanceDataPoint[] = [
  {
    termCode: '2024_T1',
    academicYear: '2024/2025',
    termName: '2024/2025 First Term (Michaelmas)',
    termShort: '24/25 T1',
    bungalowScore: 81.2,
    ijegunScore: 77.8,
    institutionalAverage: 79.5,
    benchmarkTarget: 80.0,
    notes: 'Diagnostic baseline term for modern continuous assessment framework.',
    subjectBreakdown: {
      stem: { bungalow: 80.4, ijegun: 76.5 },
      english: { bungalow: 82.5, ijegun: 79.0 },
      sciences: { bungalow: 81.0, ijegun: 77.2 },
      socialStudies: { bungalow: 81.8, ijegun: 78.5 },
    },
  },
  {
    termCode: '2024_T2',
    academicYear: '2024/2025',
    termName: '2024/2025 Second Term (Lent)',
    termShort: '24/25 T2',
    bungalowScore: 82.6,
    ijegunScore: 79.4,
    institutionalAverage: 81.0,
    benchmarkTarget: 80.0,
    notes: 'Mid-session assessments showed accelerated progress in primary literacy.',
    subjectBreakdown: {
      stem: { bungalow: 82.1, ijegun: 78.6 },
      english: { bungalow: 83.8, ijegun: 80.5 },
      sciences: { bungalow: 82.4, ijegun: 79.0 },
      socialStudies: { bungalow: 83.0, ijegun: 79.8 },
    },
  },
  {
    termCode: '2024_T3',
    academicYear: '2024/2025',
    termName: '2024/2025 Third Term (Trinity)',
    termShort: '24/25 T3',
    bungalowScore: 84.1,
    ijegunScore: 81.2,
    institutionalAverage: 82.7,
    benchmarkTarget: 82.0,
    notes: 'End-of-year promotion examinations with institutional pass rate above 94%.',
    subjectBreakdown: {
      stem: { bungalow: 83.8, ijegun: 80.5 },
      english: { bungalow: 85.0, ijegun: 82.4 },
      sciences: { bungalow: 84.2, ijegun: 81.0 },
      socialStudies: { bungalow: 84.6, ijegun: 81.8 },
    },
  },
  {
    termCode: '2025_T1',
    academicYear: '2025/2026',
    termName: '2025/2026 First Term (Michaelmas)',
    termShort: '25/26 T1',
    bungalowScore: 85.4,
    ijegunScore: 82.5,
    institutionalAverage: 84.0,
    benchmarkTarget: 82.0,
    notes: 'Integration of STEM laboratory apparatus in both branches.',
    subjectBreakdown: {
      stem: { bungalow: 85.2, ijegun: 82.1 },
      english: { bungalow: 86.4, ijegun: 83.6 },
      sciences: { bungalow: 85.6, ijegun: 82.2 },
      socialStudies: { bungalow: 85.8, ijegun: 83.0 },
    },
  },
  {
    termCode: '2025_T2',
    academicYear: '2025/2026',
    termName: '2025/2026 Second Term (Lent - Current)',
    termShort: '25/26 T2 (Current)',
    bungalowScore: 86.2,
    ijegunScore: 83.1,
    institutionalAverage: 84.7,
    benchmarkTarget: 85.0,
    isCurrent: true,
    notes: 'Current mid-term continuous assessment scores and lesson objectives attainment.',
    subjectBreakdown: {
      stem: { bungalow: 86.0, ijegun: 82.8 },
      english: { bungalow: 87.2, ijegun: 84.2 },
      sciences: { bungalow: 86.5, ijegun: 83.0 },
      socialStudies: { bungalow: 86.6, ijegun: 83.5 },
    },
  },
  {
    termCode: '2025_T3',
    academicYear: '2025/2026',
    termName: '2025/2026 Third Term (Trinity - Projected)',
    termShort: '25/26 T3 (Proj)',
    bungalowScore: 87.5,
    ijegunScore: 84.8,
    institutionalAverage: 86.2,
    benchmarkTarget: 85.0,
    isProjected: true,
    notes: 'Statistical forecast based on current term learning momentum.',
    subjectBreakdown: {
      stem: { bungalow: 87.4, ijegun: 84.5 },
      english: { bungalow: 88.5, ijegun: 85.8 },
      sciences: { bungalow: 87.8, ijegun: 84.6 },
      socialStudies: { bungalow: 87.6, ijegun: 85.0 },
    },
  },
];

interface TermAcademicPerformanceChartProps {
  branches: Branch[];
  selectedBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
  className?: string;
}

type SubjectCategory = 'composite' | 'stem' | 'english' | 'sciences' | 'socialStudies';

export const TermAcademicPerformanceChart: React.FC<TermAcademicPerformanceChartProps> = ({
  branches,
  selectedBranchId = 'all',
  onSelectBranch,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory>('composite');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [activeBranchFilter, setActiveBranchFilter] = useState<'both' | 'branch_bungalow' | 'branch_ijegun'>(
    selectedBranchId !== 'all' && (selectedBranchId === 'branch_bungalow' || selectedBranchId === 'branch_ijegun')
      ? (selectedBranchId as 'branch_bungalow' | 'branch_ijegun')
      : 'both'
  );

  // Sync when parent changes selectedBranchId
  React.useEffect(() => {
    if (selectedBranchId === 'branch_bungalow' || selectedBranchId === 'branch_ijegun') {
      setActiveBranchFilter(selectedBranchId);
    } else if (selectedBranchId === 'all') {
      setActiveBranchFilter('both');
    }
  }, [selectedBranchId]);

  const bungalowBranch = branches.find(b => b.id === 'branch_bungalow') || {
    name: 'Bungalow Branch',
    code: 'ZCS-BGL'
  };

  const ijegunBranch = branches.find(b => b.id === 'branch_ijegun') || {
    name: 'Ijegun Branch',
    code: 'ZCS-IJG'
  };

  // Compute dataset according to category
  const chartData = useMemo(() => {
    return HISTORICAL_TERM_PERFORMANCE_DATA.map(item => {
      let bScore = item.bungalowScore;
      let iScore = item.ijegunScore;

      if (selectedCategory !== 'composite' && item.subjectBreakdown) {
        bScore = item.subjectBreakdown[selectedCategory].bungalow;
        iScore = item.subjectBreakdown[selectedCategory].ijegun;
      }

      const instAvg = parseFloat(((bScore + iScore) / 2).toFixed(1));

      return {
        ...item,
        bungalowDisplay: bScore,
        ijegunDisplay: iScore,
        institutionalDisplay: instAvg,
      };
    });
  }, [selectedCategory]);

  // Summary Metrics
  const currentTerm = chartData.find(d => d.isCurrent) || chartData[chartData.length - 2];
  const initialTerm = chartData[0];
  const bungalowGrowth = (currentTerm.bungalowDisplay - initialTerm.bungalowDisplay).toFixed(1);
  const ijegunGrowth = (currentTerm.ijegunDisplay - initialTerm.ijegunDisplay).toFixed(1);
  const gap = (currentTerm.bungalowDisplay - currentTerm.ijegunDisplay).toFixed(1);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}
      id="container-term-academic-performance-chart"
    >
      {/* Header with Title & Filter Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Term-over-Term Academic Performance Trends
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Multi-Branch Telemetry
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparative examination performance and continuous assessment trajectory across Bungalow and Ijegun branches
              </p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Focus Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs hover:bg-slate-200/70 transition-colors">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Focus:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as SubjectCategory)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="composite">Composite (All Subjects)</option>
                <option value="stem">STEM / Mathematics</option>
                <option value="english">English Language Arts</option>
                <option value="sciences">Natural Sciences</option>
              </select>
            </div>
          </div>

          {/* Branch View Filter */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setActiveBranchFilter('both');
                if (onSelectBranch) onSelectBranch('all');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeBranchFilter === 'both'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Both Branches
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveBranchFilter('branch_bungalow');
                if (onSelectBranch) onSelectBranch('branch_bungalow');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeBranchFilter === 'branch_bungalow'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Bungalow
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveBranchFilter('branch_ijegun');
                if (onSelectBranch) onSelectBranch('branch_ijegun');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeBranchFilter === 'branch_ijegun'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Ijegun
            </button>
          </div>

          {/* Toggle Benchmark Line */}
          <button
            type="button"
            onClick={() => setShowBenchmark(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showBenchmark
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle institutional target benchmark line"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showBenchmark ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>Target: 85%</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Ribbon - Sleek, tight, no overshoot */}
      <div className="bg-slate-50/70 border-b border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Bungalow Current Score */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Bungalow Branch
            </span>
            <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              Lead: +{gap}%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-black text-slate-900 font-mono">
              {currentTerm.bungalowDisplay}%
            </span>
            <span className="text-xs font-bold text-emerald-600 shrink-0">
              ▲ +{bungalowGrowth}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            5-Term Trajectory Momentum
          </span>
        </div>

        {/* Ijegun Current Score */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Ijegun Branch
            </span>
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              Pacing Up
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-black text-slate-900 font-mono">
              {currentTerm.ijegunDisplay}%
            </span>
            <span className="text-xs font-bold text-emerald-600 shrink-0">
              ▲ +{ijegunGrowth}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            Rapid multi-term catchup
          </span>
        </div>

        {/* Inter-Branch Variance / Gap */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Variance / Gap
            </span>
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              Converging
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-black text-slate-900 font-mono">
              {gap}%
            </span>
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              spread
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            Down from 3.4% baseline gap
          </span>
        </div>

        {/* Institutional Average */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Institutional Average
            </span>
            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              Target: 85%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-black text-indigo-600 font-mono">
              {currentTerm.institutionalDisplay}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 shrink-0">
              Pass: 96%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            ZCS High Standard Maintained
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-5">
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="bungalowLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="ijegunLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="termShort"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                dy={8}
              />

              <YAxis
                domain={[74, 92]}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val: number) => `${val}%`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as (typeof chartData)[0];
                    const diff = (data.bungalowDisplay - data.ijegunDisplay).toFixed(1);
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-2xl text-xs space-y-2 border border-slate-800 min-w-[240px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <div className="font-bold text-indigo-300">{data.termName}</div>
                          {data.isCurrent && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded">
                              Current Term
                            </span>
                          )}
                          {data.isProjected && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded">
                              Projection
                            </span>
                          )}
                        </div>

                        {/* Bungalow Stats */}
                        {(activeBranchFilter === 'both' || activeBranchFilter === 'branch_bungalow') && (
                          <div className="flex items-center justify-between text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span>Bungalow Branch:</span>
                            </div>
                            <span className="font-extrabold text-white text-sm">
                              {data.bungalowDisplay}%
                            </span>
                          </div>
                        )}

                        {/* Ijegun Stats */}
                        {(activeBranchFilter === 'both' || activeBranchFilter === 'branch_ijegun') && (
                          <div className="flex items-center justify-between text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Ijegun Branch:</span>
                            </div>
                            <span className="font-extrabold text-white text-sm">
                              {data.ijegunDisplay}%
                            </span>
                          </div>
                        )}

                        {/* Differential */}
                        {activeBranchFilter === 'both' && (
                          <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                            <span>Branch Variance:</span>
                            <span className="text-amber-300 font-semibold">{diff}% differential</span>
                          </div>
                        )}

                        {/* Institutional Average */}
                        <div className="flex items-center justify-between text-slate-300 text-[11px]">
                          <span>Combined Average:</span>
                          <span className="font-bold text-indigo-200">{data.institutionalDisplay}%</span>
                        </div>

                        {data.notes && (
                          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                            {data.notes}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {showBenchmark && (
                <ReferenceLine
                  y={85.0}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Institutional Target: 85%',
                    position: 'top',
                    fill: '#b45309',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
              )}

              {/* Line 1: Bungalow Branch (Indigo) */}
              {(activeBranchFilter === 'both' || activeBranchFilter === 'branch_bungalow') && (
                <Line
                  type="monotone"
                  dataKey="bungalowDisplay"
                  name="Bungalow Branch"
                  stroke="url(#bungalowLineGrad)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4338ca', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Line 2: Ijegun Branch (Emerald) */}
              {(activeBranchFilter === 'both' || activeBranchFilter === 'branch_ijegun') && (
                <Line
                  type="monotone"
                  dataKey="ijegunDisplay"
                  name="Ijegun Branch"
                  stroke="url(#ijegunLineGrad)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Line 3: Institutional Composite (Dashed Gray) */}
              {activeBranchFilter === 'both' && (
                <Line
                  type="monotone"
                  dataKey="institutionalDisplay"
                  name="Institutional Average"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Qualitative Insights Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-indigo-600 rounded-full" />
              <span className="font-semibold text-slate-700">Bungalow Branch (Main)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-600 rounded-full" />
              <span className="font-semibold text-slate-700">Ijegun Branch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-slate-400 rounded-full" />
              <span>Combined Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500 rounded-full" />
              <span>Accreditation Target (85%)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Both branches currently outperform national average standards by +11.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
