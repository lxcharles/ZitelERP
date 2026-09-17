import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { db } from '../../services/db';
import { BehaviorRecord, User } from '../../types';
import { 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  FileWarning
} from 'lucide-react';

interface Props {
  currentUser: User;
  classId?: string;
  onSelectStudent?: (studentId: string) => void;
}

interface WeekDataPoint {
  weekNum: number;
  label: string;
  startDateStr: string;
  endDateStr: string;
  count: number;
  isEscalated: boolean;
  categories: Record<string, number>;
  records: BehaviorRecord[];
  studentsInvolved: { id: string; name: string; count: number }[];
}

interface StudentEscalationTrigger {
  studentId: string;
  studentName: string;
  className?: string;
  concernCount: number;
  categories: string[];
  records: BehaviorRecord[];
  triggerLevel: 'ELEVATED' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
}

export const BehaviorConcernTrendsChart: React.FC<Props> = ({
  currentUser,
  classId: initialClassId,
  onSelectStudent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 680,
    height: 300,
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [escalationThreshold, setEscalationThreshold] = useState<number>(3);
  const [hoveredWeek, setHoveredWeek] = useState<WeekDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Active term context
  const termCtx = useMemo(() => db.getTermContext(), []);
  const activeTerm = termCtx.activeTerm;

  // Available classes for filter
  const classes = useMemo(() => {
    const list = db.getClasses();
    if (currentUser.branchId) {
      return list.filter(c => !c.branchId || c.branchId === currentUser.branchId);
    }
    return list;
  }, [currentUser.branchId]);

  // Fetch behavior records
  const allRecords = useMemo(() => {
    return db.getBehaviorRecords({ user: currentUser });
  }, [currentUser]);

  // Filter records to concerns for current term
  const concernRecords = useMemo(() => {
    return allRecords.filter(r => {
      // Must be Concern status
      if (r.status !== 'Concern') return false;

      // Class filter
      if (selectedClassId !== 'all' && r.classId !== selectedClassId) return false;

      // Category filter
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

      // Filter by term dates if available
      if (activeTerm?.openingDate && activeTerm?.closingDate) {
        if (r.date < activeTerm.openingDate || r.date > activeTerm.closingDate) {
          // If record date is before openingDate, allow early pre-term records within 30 days
          const openingTime = new Date(activeTerm.openingDate).getTime();
          const recordTime = new Date(r.date).getTime();
          const diffDays = (openingTime - recordTime) / (1000 * 3600 * 24);
          if (diffDays > 35) return false;
        }
      }

      return true;
    });
  }, [allRecords, selectedClassId, selectedCategory, activeTerm]);

  // Unique categories in concerns for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    allRecords.filter(r => r.status === 'Concern').forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [allRecords]);

  // Calculate Weekly Aggregation (Weeks 1 to 12)
  const weeklyData: WeekDataPoint[] = useMemo(() => {
    const totalWeeks = Math.max(10, activeTerm?.totalWeeks || 12);
    const termStart = activeTerm?.openingDate 
      ? new Date(activeTerm.openingDate) 
      : new Date('2026-08-01');

    // Create week buckets
    const weeks: WeekDataPoint[] = [];

    for (let w = 1; w <= totalWeeks; w++) {
      const wStart = new Date(termStart.getTime() + (w - 1) * 7 * 24 * 3600 * 1000);
      const wEnd = new Date(termStart.getTime() + (w * 7 - 1) * 24 * 3600 * 1000);

      const startStr = wStart.toISOString().split('T')[0];
      const endStr = wEnd.toISOString().split('T')[0];

      weeks.push({
        weekNum: w,
        label: `Wk ${w}`,
        startDateStr: startStr,
        endDateStr: endStr,
        count: 0,
        isEscalated: false,
        categories: {},
        records: [],
        studentsInvolved: [],
      });
    }

    // Map each concern record to a week
    concernRecords.forEach(rec => {
      const recDate = new Date(rec.date);
      const diffTime = recDate.getTime() - termStart.getTime();
      let weekIndex = Math.floor(diffTime / (7 * 24 * 3600 * 1000));

      if (weekIndex < 0) weekIndex = 0; // Map early resumption to week 1
      if (weekIndex >= weeks.length) weekIndex = weeks.length - 1;

      const targetWeek = weeks[weekIndex];
      targetWeek.count += 1;
      targetWeek.records.push(rec);

      // Tally category
      const cat = rec.category || 'General Concern';
      targetWeek.categories[cat] = (targetWeek.categories[cat] || 0) + 1;

      // Tally student
      const existingStudent = targetWeek.studentsInvolved.find(s => s.id === rec.studentId);
      if (existingStudent) {
        existingStudent.count += 1;
      } else {
        targetWeek.studentsInvolved.push({
          id: rec.studentId,
          name: rec.studentName,
          count: 1,
        });
      }
    });

    // Mark escalation flag
    weeks.forEach(w => {
      w.isEscalated = w.count >= escalationThreshold;
    });

    return weeks;
  }, [concernRecords, activeTerm, escalationThreshold]);

  // Identify Potential Escalation Triggers across students
  const studentEscalationTriggers: StudentEscalationTrigger[] = useMemo(() => {
    const studentMap = new Map<string, {
      name: string;
      className?: string;
      records: BehaviorRecord[];
      categories: Set<string>;
    }>();

    concernRecords.forEach(rec => {
      if (!studentMap.has(rec.studentId)) {
        studentMap.set(rec.studentId, {
          name: rec.studentName,
          className: rec.className,
          records: [],
          categories: new Set(),
        });
      }
      const entry = studentMap.get(rec.studentId)!;
      entry.records.push(rec);
      if (rec.category) entry.categories.add(rec.category);
    });

    const triggers: StudentEscalationTrigger[] = [];

    studentMap.forEach((val, id) => {
      const count = val.records.length;
      if (count >= 2) {
        let triggerLevel: 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'ELEVATED';
        let recommendedAction = 'Form Teacher 1-on-1 pastoral check-in & review diary';

        if (count >= 4) {
          triggerLevel = 'CRITICAL';
          recommendedAction = 'Dean of Students & Executive Guardian Intervention Conference';
        } else if (count >= 3) {
          triggerLevel = 'HIGH';
          recommendedAction = 'Formal Parent-Teacher Conference & Behavioral Support Plan';
        }

        triggers.push({
          studentId: id,
          studentName: val.name,
          className: val.className,
          concernCount: count,
          categories: Array.from(val.categories),
          records: val.records,
          triggerLevel,
          recommendedAction,
        });
      }
    });

    // Sort highest concerns first
    return triggers.sort((a, b) => b.concernCount - a.concernCount);
  }, [concernRecords]);

  // ResizeObserver for dynamic container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width: Math.max(320, width),
            height: Math.max(260, Math.min(360, width * 0.42)),
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render D3 Line Chart
  useEffect(() => {
    if (!svgRef.current || weeklyData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 32, right: 30, bottom: 44, left: 42 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients & Defs
    const defs = svg.append('defs');

    // Area Fill Gradient
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'concern-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f43f5e')
      .attr('stop-opacity', 0.38);

    areaGradient
      .append('stop')
      .attr('offset', '70%')
      .attr('stop-color', '#fb7185')
      .attr('stop-opacity', 0.12);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', 0.0);

    // Escalation line gradient
    const thresholdGradient = defs
      .append('linearGradient')
      .attr('id', 'threshold-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    thresholdGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#e11d48');

    thresholdGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f59e0b');

    // Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(weeklyData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.35);

    const maxCount = d3.max(weeklyData, d => d.count) || 0;
    const yMax = Math.max(escalationThreshold + 1.5, maxCount + 1);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(Math.min(6, Math.ceil(yMax)));
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Escalation Threshold Reference Zone & Line
    const thresholdY = yScale(escalationThreshold);

    // Shaded Alert Zone above threshold
    if (thresholdY > 0) {
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', Math.max(0, thresholdY))
        .attr('fill', '#fff1f2')
        .attr('opacity', 0.45);
    }

    // Dashed threshold line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', thresholdY)
      .attr('y2', thresholdY)
      .attr('stroke', 'url(#threshold-gradient)')
      .attr('stroke-width', 1.75)
      .attr('stroke-dasharray', '5,5');

    // Threshold label
    g.append('text')
      .attr('x', innerWidth - 6)
      .attr('y', thresholdY - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#be123c')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text(`Trigger Threshold (≥ ${escalationThreshold}/wk)`);

    // D3 Area Generator
    const areaGen = d3
      .area<WeekDataPoint>()
      .x(d => xScale(d.label) || 0)
      .y0(innerHeight)
      .y1(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // D3 Line Generator
    const lineGen = d3
      .line<WeekDataPoint>()
      .x(d => xScale(d.label) || 0)
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Append Area
    g.append('path')
      .datum(weeklyData)
      .attr('fill', 'url(#concern-area-gradient)')
      .attr('d', areaGen);

    // Append Main Line
    g.append('path')
      .datum(weeklyData)
      .attr('fill', 'none')
      .attr('stroke', '#e11d48')
      .attr('stroke-width', 2.8)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGen);

    // Data Point Dots
    const dotsGroup = g.append('g').attr('class', 'data-points');

    weeklyData.forEach(d => {
      const cx = xScale(d.label) || 0;
      const cy = yScale(d.count);

      // If escalated, draw outer pulse aura
      if (d.isEscalated) {
        dotsGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 11)
          .attr('fill', '#f43f5e')
          .attr('opacity', 0.22);

        dotsGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', '#e11d48')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2');
      }

      // Point Circle
      const circle = dotsGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', d.isEscalated ? 5.5 : 4)
        .attr('fill', d.isEscalated ? '#be123c' : '#ffffff')
        .attr('stroke', d.isEscalated ? '#ffffff' : '#e11d48')
        .attr('stroke-width', d.isEscalated ? 2 : 2.2)
        .attr('cursor', 'pointer');

      // Value label on points with counts > 0
      if (d.count > 0) {
        g.append('text')
          .attr('x', cx)
          .attr('y', cy - (d.isEscalated ? 12 : 8))
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', d.isEscalated ? '800' : '600')
          .attr('fill', d.isEscalated ? '#be123c' : '#64748b')
          .text(d.count);
      }

      // Hit area for easy mouse interaction
      dotsGroup
        .append('rect')
        .attr('x', cx - 18)
        .attr('y', 0)
        .attr('width', 36)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          circle.attr('r', 7).attr('stroke-width', 3);
          setHoveredWeek(d);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on('mousemove', (event: MouseEvent) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on('mouseleave', () => {
          circle.attr('r', d.isEscalated ? 5.5 : 4).attr('stroke-width', d.isEscalated ? 2 : 2.2);
          setHoveredWeek(null);
          setTooltipPos(null);
        });
    });

    // X Axis
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(10);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1').attr('stroke-width', 1);
    xAxisGroup
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#475569');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(Math.min(5, Math.ceil(yMax)))
      .tickFormat(d => `${d}`)
      .tickSize(0)
      .tickPadding(8);

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').attr('stroke', '#cbd5e1').attr('stroke-width', 1);
    yAxisGroup
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b');

    // Axis Titles
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -30)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#94a3b8')
      .text('CONCERNS LOGGED');

  }, [weeklyData, dimensions, escalationThreshold]);

  // Overall Statistics
  const totalConcerns = concernRecords.length;
  const escalatedWeeksCount = weeklyData.filter(w => w.isEscalated).length;
  const peakWeek = weeklyData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), weeklyData[0]);

  return (
    <div id="behavioral-concern-trends-container" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50/40 via-white to-amber-50/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-rose-100/80 text-rose-700">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  Behavioral Concern Weekly Trajectory
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    D3 Analytics
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Term weekly patterns, incident frequencies & potential escalation triggers ({activeTerm?.name || 'Active Term'})
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Class filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="concern-class-filter"
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <select
                id="concern-category-filter"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold Setting */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 font-medium">Trigger Alert:</span>
              <select
                id="escalation-threshold-select"
                value={escalationThreshold}
                onChange={e => setEscalationThreshold(Number(e.target.value))}
                className="bg-transparent font-bold text-rose-700 outline-none cursor-pointer"
              >
                <option value={2}>≥ 2 / wk</option>
                <option value={3}>≥ 3 / wk (Standard)</option>
                <option value={4}>≥ 4 / wk</option>
                <option value={5}>≥ 5 / wk</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Level Stat Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Concerns
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalConcerns}</span>
              <span className="text-xs text-slate-500 font-medium">this term</span>
            </div>
          </div>

          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Peak Week
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-600">
                {peakWeek && peakWeek.count > 0 ? peakWeek.label : 'None'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {peakWeek && peakWeek.count > 0 ? `(${peakWeek.count} logs)` : 'calm'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Escalation Weeks
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${escalatedWeeksCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {escalatedWeeksCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">exceed threshold</span>
            </div>
          </div>

          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Repeat Students
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${studentEscalationTriggers.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {studentEscalationTriggers.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">require review</span>
            </div>
          </div>
        </div>
      </div>

      {/* D3 Canvas Stage */}
      <div className="p-4 sm:p-6 relative">
        <div ref={containerRef} className="w-full relative min-h-[260px]">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="overflow-visible mx-auto"
          />

          {/* Interactive Floating Hover Tooltip */}
          {hoveredWeek && tooltipPos && (
            <div
              className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 text-white rounded-xl shadow-xl p-3 text-xs w-64 border border-slate-700 transition-all duration-150"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  {hoveredWeek.label} Overview
                </span>
                <span className="text-[10px] text-slate-400">
                  {hoveredWeek.startDateStr} to {hoveredWeek.endDateStr}
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-medium">Concerns Logged:</span>
                <span className="text-sm font-bold text-rose-400">{hoveredWeek.count}</span>
              </div>

              {hoveredWeek.isEscalated && (
                <div className="mb-2 p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center gap-1.5 text-rose-300 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  Escalation Trigger: Exceeds threshold!
                </div>
              )}

              {Object.keys(hoveredWeek.categories).length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Categories:</p>
                  {Object.entries(hoveredWeek.categories).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between text-slate-300 text-[11px]">
                      <span>{cat}</span>
                      <span className="font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {hoveredWeek.studentsInvolved.length > 0 && (
                <div className="pt-1.5 mt-1.5 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Pupils Involved:</p>
                  <p className="text-slate-200 text-[11px] font-medium truncate">
                    {hoveredWeek.studentsInvolved.map(s => `${s.name} (${s.count})`).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-600 rounded-full" />
              <span className="font-medium">Weekly Concern Trajectory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
              <span className="font-medium">Escalation Alert Threshold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-200" />
              <span className="font-medium">Threshold Exceeded Spike</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            *Hover points to inspect weekly student observations
          </div>
        </div>
      </div>

      {/* Potential Escalation Triggers & Early Intervention Panel */}
      <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Potential Escalation Triggers & Repeat Infraction Alerts
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {studentEscalationTriggers.length} pupil(s) flagged for pastoral follow-up
          </span>
        </div>

        {studentEscalationTriggers.length === 0 ? (
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            No repetitive concern escalation patterns detected for the selected filter. Positive classroom culture maintained.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studentEscalationTriggers.map(trigger => (
              <div
                key={trigger.studentId}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {trigger.studentName}
                      </span>
                      {trigger.className && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {trigger.className}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {trigger.concernCount} behavioral concerns logged this term • Categories: {trigger.categories.join(', ')}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      trigger.triggerLevel === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : trigger.triggerLevel === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}
                  >
                    {trigger.triggerLevel} TRIGGER
                  </span>
                </div>

                {/* Recommended Protocol */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-medium line-clamp-1">
                      {trigger.recommendedAction}
                    </span>
                  </div>

                  {onSelectStudent && (
                    <button
                      onClick={() => onSelectStudent(trigger.studentId)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 ml-2 whitespace-nowrap"
                    >
                      Inspect Profile →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
