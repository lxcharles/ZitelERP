import React, { useState, useEffect } from 'react';
import { User, StaffAttendanceRecord } from '../../types';
import { db } from '../../services/db';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  Sparkles,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface StaffAttendanceCheckInWidgetProps {
  currentUser: User;
  className?: string;
  onClockInSuccess?: (record: StaffAttendanceRecord) => void;
}

export const StaffAttendanceCheckInWidget: React.FC<StaffAttendanceCheckInWidgetProps> = ({
  currentUser,
  className = '',
  onClockInSuccess,
}) => {
  const [todayRecord, setTodayRecord] = useState<StaffAttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [optionalNote, setOptionalNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch status on mount or user change
  const refreshStatus = () => {
    if (currentUser?.id) {
      const rec = db.getTodayStaffClockIn(currentUser.id);
      setTodayRecord(rec);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [currentUser?.id]);

  const handleClockIn = () => {
    if (!currentUser?.id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const record = db.recordStaffClockIn(currentUser, optionalNote.trim() || undefined);
      setTodayRecord(record);
      setActionMessage(`Clock-in recorded successfully at ${record.timeIn}!`);
      if (onClockInSuccess) onClockInSuccess(record);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(err.message || 'Error clocking in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = () => {
    if (!currentUser?.id || isSubmitting || !todayRecord) return;
    setIsSubmitting(true);
    try {
      const updated = db.recordStaffClockOut(currentUser.id);
      if (updated) {
        setTodayRecord(updated);
        setActionMessage(`Clock-out recorded at ${updated.timeOut}! Have a great evening.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error clocking out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClockedIn = !!todayRecord;
  const isClockedOut = !!todayRecord?.timeOut;

  return (
    <div
      id="staff-attendance-checkin-widget"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Live Time & Status info */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isClockedIn
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Staff Digital Attendance
              </span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {currentDateStr}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                {currentTime || '08:00:00 AM'}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-slate-600">
                {isClockedIn ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Clocked in for today at {todayRecord.timeIn}
                    {todayRecord.status === 'ON_TIME' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                        Punctual
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                        Late Arrival
                      </span>
                    )}
                    {todayRecord.timeOut && ` • Clocked out: ${todayRecord.timeOut}`}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Daily clock-in pending for <span className="font-semibold text-slate-800">{currentUser.name}</span>. Official check-in threshold: 8:00 AM.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Action Box */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isClockedIn ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {showNoteInput && (
                <input
                  type="text"
                  placeholder="Optional arrival note..."
                  value={optionalNote}
                  onChange={e => setOptionalNote(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-44"
                />
              )}
              <button
                type="button"
                onClick={() => setShowNoteInput(prev => !prev)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer hidden sm:inline-block"
                title="Add arrival remark or note"
              >
                {showNoteInput ? 'Cancel note' : '+ Add Note'}
              </button>

              <button
                type="button"
                id="btn-staff-clock-in"
                onClick={handleClockIn}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{isSubmitting ? 'Clocking in...' : 'Tick to Clock In Today'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Attendance Confirmed
              </span>

              {!isClockedOut ? (
                <button
                  type="button"
                  id="btn-staff-clock-out"
                  onClick={handleClockOut}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  title="Record end-of-day clock out"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clock Out</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                  Shift Completed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="mt-3 p-2 rounded-xl bg-indigo-50 border border-indigo-200/80 text-xs text-indigo-900 font-medium flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}
    </div>
  );
};
