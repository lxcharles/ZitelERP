import React, { useState } from 'react';
import {
  Users,
  Award,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Heart,
  Send,
  Baby,
  Smile,
  Star,
  FileText,
  Clock,
  BarChart3,
  Receipt
} from 'lucide-react';
import { User, Student, Invoice, FeePayment, Message, BehaviorRecord, StudentStatusReport } from '../../types';
import { db } from '../../services/db';
import { aiService } from '../../services/aiService';
import { ReportCardModal } from '../common/ReportCardModal';
import { GradeProgressionChart } from './GradeProgressionChart';
import { ParentPerformanceAnalytics } from './ParentPerformanceAnalytics';
import { ParentFeePaymentManager } from './ParentFeePaymentManager';
import { DailyCalendarIntelligenceWidget } from '../common/DailyCalendarIntelligenceWidget';
import { SchoolCalendarManager } from '../calendar/SchoolCalendarManager';
import { CommunicationHubModal } from '../common/CommunicationHubModal';
import { Calendar } from 'lucide-react';

interface ParentDashboardProps {
  currentUser: User;
  activeTab: string;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  activeTab,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeTab || 'performance_analytics');
  const allStudents = db.getStudents();
  
  // Find linked children
  const linkedChildren = allStudents.filter(s =>
    currentUser.linkedStudentIds?.includes(s.id) ||
    currentUser.childrenIds?.includes(s.id)
  );
  
  const [selectedChildId, setSelectedChildId] = useState<string>(
    linkedChildren[0]?.id || allStudents[0]?.id || ''
  );

  const selectedChild = linkedChildren.find(c => c.id === selectedChildId) || linkedChildren[0] || allStudents[0];

  // Modals
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // AI Parent Insights State
  const [parentInsights, setParentInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Messages State
  const [messagesList, setMessagesList] = useState<Message[]>(() =>
    db.getMessages().filter(
      m => m.senderId === currentUser.id || m.recipientId === currentUser.id
    )
  );
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChild) return;

    const teacher = db.getUsers().find(u => u.role === 'TEACHER') || {
      id: 'usr_teacher_1',
      name: 'Class Teacher',
    };

    const newMsg = db.sendMessage(
      {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'PARENT',
        recipientId: teacher.id,
        recipientName: teacher.name,
        recipientRole: 'TEACHER',
        subject: `Inquiry regarding ${selectedChild.fullName}`,
        content: messageText.trim(),
      },
      currentUser
    );

    setMessagesList(prev => [...prev, newMsg]);
    setMessageText('');
  };

  // Academic collections
  const subjects = db.getSubjects();
  const assessments = db.getAssessments().filter(a => a.classId === selectedChild?.classId);
  const allScores = db.getAssessmentScores().filter(s => s.studentId === selectedChild?.id);
  const attendance = db.getAttendance().filter(a => a.studentId === selectedChild?.id);
  const invoices = db.getInvoices(currentUser).filter(i => i.studentId === selectedChild?.id);
  const payments = db.getPayments(currentUser).filter(p => p.studentId === selectedChild?.id);
  const assignments = db.getAssignments().filter(a => a.classId === selectedChild?.classId);

  // Attendance stats
  const totalDays = attendance.length || 20;
  const presentDays = attendance.filter(a => a.status === 'PRESENT').length || 19;
  const attendanceRate = Math.round((presentDays / totalDays) * 100);

  // Simulated subject mastery for selected child
  const subjectScores = [
    { subject: 'Mathematics', score: 92, classAvg: 81, grade: 'A+' },
    { subject: 'English & Reading', score: 88, classAvg: 83, grade: 'A' },
    { subject: 'Basic Science', score: 90, classAvg: 79, grade: 'A+' },
    { subject: 'Social Studies', score: 86, classAvg: 82, grade: 'A' },
    { subject: 'Creative Arts', score: 94, classAvg: 88, grade: 'A+' },
  ];

  const overallAvg = Math.round(
    subjectScores.reduce((a, b) => a + b.score, 0) / subjectScores.length
  );

  const handleGenerateParentInsights = async () => {
    if (!selectedChild) return;
    setAiLoading(true);
    try {
      const data = await aiService.generateParentInsights(
        {
          studentName: selectedChild.fullName,
          recentGrades: { Math: 92, Science: 90, English: 88 },
          attendance: `${attendanceRate}%`,
          term: 'Term 2',
        },
        currentUser
      );
      setParentInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Multi-Child Switcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
              Parent & Guardian Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">• Family Academic Hub</span>
            <span className="font-mono text-[11px] font-bold bg-white/10 text-amber-300 px-2 py-0.5 rounded-full border border-white/20">
              {currentUser.schoolId || currentUser.username}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 font-display">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-300">
            Monitoring academic growth, developmental milestones, and attendance.
          </p>
        </div>

        {/* Action Controls & Multi-Child Selector Chips */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2"
            title="Open ZITEL CHAT ROOM"
          >
            <MessageSquare className="w-4 h-4" />
            <span>ZITEL CHAT ROOM</span>
          </button>

          {linkedChildren.length > 0 && (
            <div className="flex items-center space-x-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-xs border border-white/10">
              {linkedChildren.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedChild?.id === child.id
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <img
                    src={child.avatar}
                    alt={child.fullName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                  />
                  <span>{child.fullName}</span>
                  <span className="text-[10px] opacity-80">({child.className})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Calendar Intelligence: Active Session, Term Countdown & Upcoming Events */}
      <DailyCalendarIntelligenceWidget currentUser={currentUser} />

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'performance_analytics', label: "My Child's Performance & Class Comparison", icon: BarChart3 },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'behavior_timeline', label: 'Behavioral & Pastoral Timeline', icon: ShieldCheck },
          { id: 'status_reports', label: 'Pupil Status Reports', icon: FileText },
          {
            id: 'fees',
            label: 'Fees & Payment Ledger',
            icon: Receipt,
            badge: invoices.some(i => i.balance > 0) ? (invoices.some(i => i.status === 'OVERDUE') ? 'Overdue' : 'Due') : undefined,
          },
          { id: 'growth_analytics', label: 'Multi-Term Grade Progression', icon: TrendingUp },
          { id: 'attendance', label: 'Attendance & Alerts', icon: CalendarCheck },
          { id: 'assignments', label: 'Homework & Due Dates', icon: ClipboardList },
          { id: 'report_cards', label: 'Official Term Report Cards', icon: FileSpreadsheet },
        ].map(t => {
          const Icon = t.icon;
          const isCurrent = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCurrentTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    t.badge === 'Overdue'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Calendar */}
      {currentTab === 'calendar' && (
        <SchoolCalendarManager currentUser={currentUser} />
      )}

      {/* Tab: Performance Analytics & Class Comparison (Requirements 21, 22, 23) */}
      {currentTab === 'performance_analytics' && selectedChild && (
        <ParentPerformanceAnalytics
          student={selectedChild}
          currentUser={currentUser}
        />
      )}

      {/* Tab: Fees & Payment Ledger (Requirement 30) */}
      {currentTab === 'fees' && selectedChild && (
        <ParentFeePaymentManager
          student={selectedChild}
          currentUser={currentUser}
        />
      )}

      {/* Tab: Overview */}
      {currentTab === 'overview' && selectedChild && (
        <div className="space-y-6">
          {/* Top Quick Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Term Average</span>
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-slate-900">{overallAvg}%</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Grade A+
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Classroom standing: Top 10%</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-emerald-600">{attendanceRate}%</span>
                  <span className="text-xs font-bold text-slate-500">Present</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{presentDays} of {totalDays} sessions</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Homework Status</span>
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-indigo-700">100%</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    Up to Date
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">All weekly tasks turned in</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Status</span>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {invoices.reduce((a, b) => a + (b.balance || 0), 0) === 0
                      ? 'Settled'
                      : `₦${invoices.reduce((a, b) => a + (b.balance || 0), 0).toLocaleString()}`}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      invoices.reduce((a, b) => a + (b.balance || 0), 0) === 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}>
                      {invoices.reduce((a, b) => a + (b.balance || 0), 0) === 0 ? '₦0 Due' : 'Balance Due'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {invoices.length} invoices
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {invoices.reduce((a, b) => a + (b.balance || 0), 0) === 0 ? 'All invoices paid' : 'Payment pending'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject Mastery List */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Subject Performance & Benchmark ({selectedChild.className})
                  </h3>
                  <p className="text-xs text-slate-500">Child's score compared securely against cohort average</p>
                </div>
                <button
                  onClick={() => setShowReportCardModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>View Official Report Card</span>
                </button>
              </div>

              <div className="space-y-3">
                {subjectScores.map((sub, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{sub.subject}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-slate-900 text-sm">{sub.score}%</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {sub.grade}
                        </span>
                      </div>
                    </div>

                    {/* Comparative Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${sub.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Child Score: <strong className="text-indigo-700">{sub.score}%</strong></span>
                        <span>Class Average: <strong className="text-slate-700">{sub.classAvg}%</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Parent Insights & Developmental Rings */}
            <div className="space-y-6">
              {/* AI Growth Highlights Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      AI Growth Highlights
                    </h4>
                  </div>
                  <button
                    onClick={handleGenerateParentInsights}
                    disabled={aiLoading}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                  >
                    {aiLoading ? 'Analyzing...' : 'Refresh AI'}
                  </button>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-2">
                  <p className="font-bold text-slate-900">
                    {parentInsights?.headline || `${selectedChild.fullName} is having a remarkable term!`}
                  </p>
                  <p>
                    {parentInsights?.academicHighlights ||
                      `${selectedChild.fullName} maintains outstanding accuracy in Mathematics problem-solving and participates enthusiastically during Science experiments.`}
                  </p>
                  
                  <div className="pt-2 border-t border-indigo-100">
                    <span className="font-bold text-[10px] uppercase text-indigo-900 block mb-1">
                      Home Reinforcement Tip
                    </span>
                    <p className="italic text-slate-600">
                      "Spend 10 minutes discussing the fractions of pizza or fruit slices during family meals to build real-world mathematical reasoning."
                    </p>
                  </div>
                </div>
              </div>

              {/* Developmental Competencies */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Developmental Competency Ratings
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Classroom Conduct</span>
                    <span className="font-bold text-emerald-700">Exemplary</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Social Cooperation</span>
                    <span className="font-bold text-emerald-700">High</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Reading Fluency</span>
                    <span className="font-bold text-indigo-700">Advanced</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Curiosity & Inquiry</span>
                    <span className="font-bold text-indigo-700">Outstanding</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Growth Analytics */}
      {currentTab === 'growth_analytics' && selectedChild && (
        <div className="space-y-6">
          <GradeProgressionChart student={selectedChild} />
        </div>
      )}

      {/* Tab: Attendance */}
      {currentTab === 'attendance' && selectedChild && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Attendance Log for {selectedChild.fullName}
              </h2>
              <p className="text-xs text-slate-500">Live verified classroom attendance and punctuality records.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {attendanceRate}% Overall Attendance
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{a.date}</td>
                    <td className="py-3 px-4 text-slate-600">{a.className || selectedChild.className}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{a.markedByName || a.markedBy || 'Form Teacher'}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400">
                      No recorded absences. 100% attendance rate for this term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Fees */}
      {currentTab === 'fees' && selectedChild && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              School Fee Statement: {selectedChild.fullName}
            </h2>
            <p className="text-xs text-slate-500">Invoices, paid receipts, and payment transaction references.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-700">{inv.term}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{inv.dueDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${inv.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">${inv.paidAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-amber-600">${inv.balance.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Receipts History */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Official Payment Receipts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {payments.map(pay => (
                <div key={pay.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="font-mono text-indigo-700">{pay.receiptNumber}</span>
                    <span className="text-emerald-700">${pay.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Method: {pay.paymentMethod} • Ref: {pay.transactionRef}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{new Date(pay.paidAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Messages */}
      {currentTab === 'messages' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs max-w-2xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Direct Teacher Messaging Thread</h2>
            <p className="text-xs text-slate-500">Communicate directly with {selectedChild?.fullName}'s form teacher.</p>
          </div>

          {/* Messages list */}
          <div className="space-y-3 max-h-72 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
            {messagesList.map(msg => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl max-w-md ${
                  msg.senderId === currentUser.id
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                  <span className="font-bold">{msg.senderName}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs font-semibold">{msg.subject}</p>
                <p className="text-xs mt-0.5">{msg.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type message to teacher..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab: Behavioral & Pastoral Timeline (Parent View) */}
      {currentTab === 'behavior_timeline' && selectedChild && (() => {
        const childBehaviorLogs = db.getBehaviorRecords({
          studentId: selectedChild.id,
          user: currentUser,
        }).filter(r => r.isPublishedToParent === true || r.visibility === 'PARENT_VISIBLE');

        return (
          <div className="space-y-6 animate-in fade-in" id="parent-behavior-timeline">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedChild.fullName}'s Behavioral & Pastoral Timeline
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Official classroom observations and commendations documented by Form Teacher
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                {childBehaviorLogs.length} Verified Entries
              </span>
            </div>

            {childBehaviorLogs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <Smile className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No Behavioral Records Logged</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Your child currently has no recorded behavioral concerns or formal behavioral notices.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {childBehaviorLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-3 ${
                      log.status === 'Positive'
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : log.status === 'Concern'
                        ? 'border-amber-200 bg-amber-50/20'
                        : log.status === 'Incident'
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block text-xs font-black uppercase px-2.5 py-1 rounded-md ${
                            log.status === 'Positive'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'Neutral'
                              ? 'bg-slate-100 text-slate-800'
                              : log.status === 'Concern'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status === 'Concern' ? 'Behavioral Concern' : log.status}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{log.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </div>
                    </div>

                    {log.headline && (
                      <h4 className="text-sm font-black text-slate-900">{log.headline}</h4>
                    )}

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      "{log.observation || log.notes}"
                    </p>

                    {log.detailedComments && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                        <strong className="text-slate-800 block text-[11px] mb-0.5">Form Teacher's Commentary:</strong>
                        <p>{log.detailedComments}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Recorded by: <strong className="text-slate-700">{log.teacherName}</strong> ({log.teacherRole || 'Form Teacher'})</span>
                      {log.rating && (
                        <div className="flex text-amber-500">
                          {Array.from({ length: log.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Tab: Pupil Status Reports (Parent View) */}
      {currentTab === 'status_reports' && selectedChild && (() => {
        const childStatusReports = db.getStudentStatusReports({
          studentId: selectedChild.id,
        });

        return (
          <div className="space-y-6 animate-in fade-in" id="parent-status-reports">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedChild.fullName}'s Official Status Reports
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Official mid-term and end-of-term developmental summaries published by the school
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                {childStatusReports.length} Official Reports
              </span>
            </div>

            {childStatusReports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No Published Status Reports</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  The Form Teacher is currently compiling this term's status report. It will appear here once finalized.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {childStatusReports.map((rpt) => (
                  <div key={rpt.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                    {/* Header Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                      <div>
                        <h4 className="text-lg font-black text-slate-900">
                          {rpt.term.toUpperCase()} STATUS REPORT ({rpt.academicYear})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Form Teacher: <strong className="text-slate-800">{rpt.teacherName}</strong> • Class: <strong className="text-slate-800">{rpt.className}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Document</span>
                      </button>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                        <span className="text-[10px] font-bold text-blue-700 uppercase block">Attendance</span>
                        <strong className="text-lg font-black text-blue-900">{rpt.attendanceSummary?.attendanceRate || 95}%</strong>
                        <span className="text-[10px] text-blue-700 block">{rpt.attendanceSummary?.presentDays || 19} Days Present</span>
                      </div>

                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">Conduct Standing</span>
                        <strong className="text-lg font-black text-emerald-900">{rpt.behaviorSummary?.conductRating || 'Excellent'}</strong>
                        <span className="text-[10px] text-emerald-700 block">{rpt.behaviorSummary?.positiveCount || 0} Positive Commendations</span>
                      </div>

                      <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                        <span className="text-[10px] font-bold text-purple-700 uppercase block">Punctuality</span>
                        <strong className="text-lg font-black text-purple-900">{rpt.attendanceSummary?.punctualityRating || 'Prompt'}</strong>
                        <span className="text-[10px] text-purple-700 block">{rpt.attendanceSummary?.lateDays || 0} Lates Recorded</span>
                      </div>

                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-700 uppercase block">Term Mean</span>
                        <strong className="text-lg font-black text-amber-900">{rpt.academicSummary?.overallAverage || 85}%</strong>
                        <span className="text-[10px] text-amber-700 block">Grade: {rpt.academicSummary?.letterGrade || 'A'}</span>
                      </div>
                    </div>

                    {/* Academic Narrative */}
                    <div className="space-y-1 text-xs">
                      <h5 className="font-black uppercase tracking-wider text-slate-800">Academic Progress & General Growth</h5>
                      <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
                        {rpt.generalProgress || rpt.teacherObservations}
                      </p>
                    </div>

                    {/* Participation & Strengths */}
                    {rpt.strengths && rpt.strengths.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <h5 className="font-black uppercase tracking-wider text-emerald-800">Key Strengths Identified</h5>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rpt.strengths.map((str, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-200">
                              ✓ {str}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Teacher's Recommendation to Parents */}
                    <div className="space-y-1 text-xs bg-indigo-50/50 p-4 rounded-xl border border-indigo-200">
                      <h5 className="font-black uppercase tracking-wider text-indigo-950">Teacher's Recommendations for Home Support</h5>
                      <p className="text-indigo-900 leading-relaxed font-medium">
                        {rpt.recommendations}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Report Card Modal */}
      {showReportCardModal && selectedChild && (
        <ReportCardModal
          student={selectedChild}
          onClose={() => setShowReportCardModal(false)}
        />
      )}

      {/* Communication Hub Modal */}
      {showChatModal && (
        <CommunicationHubModal
          currentUser={currentUser}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          initialStudentContext={selectedChild}
        />
      )}
    </div>
  );
};
