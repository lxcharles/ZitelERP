import React, { useState } from 'react';
import {
  Smile,
  Award,
  Calendar,
  ClipboardList,
  Sparkles,
  Star,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Trophy,
  Flame,
  Check,
  ChevronRight
} from 'lucide-react';
import { User, Student, Assignment } from '../../types';
import { db } from '../../services/db';
import { DailyCalendarIntelligenceWidget } from '../common/DailyCalendarIntelligenceWidget';
import { SchoolCalendarManager } from '../calendar/SchoolCalendarManager';
import { Timetable } from '../common/Timetable';

interface StudentDashboardProps {
  currentUser: User;
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  activeTab,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeTab || 'overview');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  const studentProfile: Student =
    db.getStudents().find(s => s.id === currentUser.studentProfileId) ||
    db.getStudents()[0];

  const assignments = db.getAssignments().filter(a => a.classId === studentProfile.classId);
  const timetable = db.getTimetable().filter(t => t.classId === studentProfile.classId);

  // Practice Quiz Data
  const sampleQuiz = [
    {
      id: 1,
      question: 'What is 1/2 + 1/4 in simplest form?',
      options: ['2/6', '3/4', '2/4', '1/6'],
      correct: '3/4',
    },
    {
      id: 2,
      question: 'Which part of a plant absorbs water and minerals from the soil?',
      options: ['Leaves', 'Flower', 'Roots', 'Stem'],
      correct: 'Roots',
    },
    {
      id: 3,
      question: 'Which of the following is a noun?',
      options: ['Quickly', 'Elephant', 'Sing', 'Brightly'],
      correct: 'Elephant',
    },
  ];

  const handleSelectQuizAnswer = (qId: number, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [qId]: answer });
  };

  const handleFinishQuiz = () => {
    let score = 0;
    sampleQuiz.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) score += 1;
    });
    setQuizScore(score);
  };

  const handleToggleHomework = (id: string) => {
    setCompletedHomework({ ...completedHomework, [id]: !completedHomework[id] });
  };

  return (
    <div className="space-y-6">
      {/* Cheerful Student Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={studentProfile.avatar}
            alt={studentProfile.fullName}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/40 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white uppercase tracking-wider">
                Student Learning Zone
              </span>
              <span className="text-xs text-sky-100 font-bold">• {studentProfile.className}</span>
              <span className="font-mono text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
                {studentProfile.schoolId || currentUser.schoolId || studentProfile.studentId}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-0.5">
              Hi, {studentProfile.fullName}! ⭐
            </h1>
            <p className="text-xs text-sky-100 font-medium">
              You're doing amazing! Keep exploring and learning today.
            </p>
          </div>
        </div>

        {/* Gamified Star Badge */}
        <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-100 uppercase tracking-wider block">Reward Stars</span>
            <span className="text-xl font-black text-white">480 ⭐</span>
          </div>
        </div>
      </div>

      {/* Daily Calendar Intelligence: Active Session, Term Countdown & Upcoming Events */}
      <DailyCalendarIntelligenceWidget currentUser={currentUser} />

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'My Learning Space', icon: Smile },
          { id: 'calendar', label: 'School Calendar', icon: Calendar },
          { id: 'my_schedule', label: 'Today\'s Timetable', icon: Calendar },
          { id: 'my_homework', label: 'My Homework Tasks', icon: ClipboardList },
          { id: 'my_grades', label: 'My Badges & Stars', icon: Award },
          { id: 'practice_quiz', label: 'Fun Practice Quiz', icon: Sparkles },
        ].map(t => {
          const Icon = t.icon;
          const isCurrent = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCurrentTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Calendar */}
      {currentTab === 'calendar' && (
        <SchoolCalendarManager currentUser={currentUser} />
      )}

      {/* Tab 1: Overview */}
      {currentTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Tasks & Homework */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-sky-600" />
                <span>My Active Homework & Missions</span>
              </h3>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {assignments.length} Tasks
              </span>
            </div>

            <div className="space-y-3">
              {assignments.map(asg => {
                const isDone = completedHomework[asg.id];
                return (
                  <div
                    key={asg.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between ${
                      isDone ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">{asg.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {asg.subjectName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{asg.description}</p>
                      <p className="text-[10px] text-slate-400">Due Date: {asg.dueDate}</p>
                    </div>

                    <button
                      onClick={() => handleToggleHomework(asg.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isDone ? 'Finished!' : 'Mark Done'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Schedule Card */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Today's Periods</span>
                </h3>
                <button
                  onClick={() => setCurrentTab('my_schedule')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {timetable.slice(0, 4).map(slot => (
                  <div key={slot.id} className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-all space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{slot.subjectName}</span>
                      <span className="font-mono text-indigo-600">{slot.startTime} – {slot.endTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{slot.room || slot.roomNumber || 'Room 201'}</span>
                      <span className="font-medium text-slate-600">{slot.teacherName}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCurrentTab('my_schedule')}
                className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Open Interactive Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fun Practice Quiz Prompt */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-950 uppercase">Daily Brain Booster</h4>
              </div>
              <p className="text-xs text-slate-600">
                Test your knowledge in quick 3-minute quizzes and unlock golden reward badges!
              </p>
              <button
                onClick={() => setCurrentTab('practice_quiz')}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all"
              >
                Play Practice Quiz →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Practice Quiz */}
      {currentTab === 'practice_quiz' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Primary 3 Fun Practice Challenge</span>
              </h2>
              <p className="text-xs text-slate-500">Pick the best answer for each question!</p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
              3 Questions
            </span>
          </div>

          <div className="space-y-4">
            {sampleQuiz.map((q, qIndex) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-xs">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map(opt => {
                    const isSelected = selectedAnswers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectQuizAnswer(q.id, opt)}
                        className={`p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {quizScore === null ? (
            <button
              onClick={handleFinishQuiz}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md transition-all"
            >
              Submit Quiz & See Score!
            </button>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in zoom-in-95">
              <span className="text-3xl">🎉</span>
              <h3 className="text-base font-black text-emerald-900">
                You got {quizScore} out of {sampleQuiz.length} correct!
              </h3>
              <p className="text-xs text-emerald-700">
                Awesome work! You earned +50 Star Points for your profile.
              </p>
              <button
                onClick={() => {
                  setQuizScore(null);
                  setSelectedAnswers({});
                }}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Interactive Timetable Schedule */}
      {currentTab === 'my_schedule' && (
        <Timetable
          currentUser={currentUser}
          classId={studentProfile.classId}
          className={studentProfile.className}
          viewMode="student"
          onNavigateToTab={(tab) => setCurrentTab(tab)}
        />
      )}
    </div>
  );
};
