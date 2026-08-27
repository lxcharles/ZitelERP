import { AttendanceRecord, Student } from '../types';

export type AbsenteeismRiskTier = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'EXEMPLARY';

export interface StudentAttendanceForecast {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  className: string;
  totalTrackedDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  currentAttendanceRate: number; // 0 - 100
  projectedAttendanceRate: number; // 0 - 100
  riskScore: number; // 0 - 100 (higher = worse risk)
  riskTier: AbsenteeismRiskTier;
  velocityTrend: 'Rapid Decline' | 'Moderate Slippage' | 'Stable' | 'Improving';
  dayOfWeekAbsences: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    absentCount: number;
    lateCount: number;
    percentageOfTotalAbsences: number;
  }[];
  isFridayMondayDominant: boolean;
  consecutiveAbsenceStreak: number;
  unexcusedToExcusedRatio: string;
  riskContributingFactors: string[];
  earlyInterventionRecommendation: string;
  aiSuggestedParentSubject: string;
  aiSuggestedParentMessage: string;
  aiCounselorReferralRequired: boolean;
}

export interface ClassAttendanceForecastSummary {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendanceRate: number;
  projectedClassAttendanceRate: number;
  chronicAbsenteeismRiskCount: number; // At risk of < 85%
  moderateRiskCount: number;
  healthyAttendanceCount: number;
  dayOfWeekSummary: {
    day: string;
    totalAbsences: number;
    totalLates: number;
  }[];
  studentForecasts: StudentAttendanceForecast[];
}

export const attendanceForecastEngine = {
  analyzeClassAttendance(
    classId: string,
    className: string,
    students: Student[],
    attendanceRecords: AttendanceRecord[]
  ): ClassAttendanceForecastSummary {
    const classRecords = attendanceRecords.filter(r => r.classId === classId);
    const studentForecasts: StudentAttendanceForecast[] = students.map(st => {
      const studentRecords = classRecords.filter(r => r.studentId === st.id);
      return this.analyzeStudentAttendance(st, studentRecords, className);
    });

    // Sort by risk score descending (highest risk first)
    studentForecasts.sort((a, b) => b.riskScore - a.riskScore);

    const totalStudents = students.length || 1;
    const totalPresent = studentForecasts.reduce((acc, f) => acc + f.presentDays, 0);
    const totalDays = studentForecasts.reduce((acc, f) => acc + f.totalTrackedDays, 0) || 1;
    const avgRate = Math.round((totalPresent / totalDays) * 100) || 94;

    const projectedAvg = Math.round(
      studentForecasts.reduce((acc, f) => acc + f.projectedAttendanceRate, 0) / totalStudents
    );

    const chronicRiskCount = studentForecasts.filter(
      f => f.riskTier === 'CRITICAL' || f.riskTier === 'HIGH'
    ).length;

    const moderateRiskCount = studentForecasts.filter(f => f.riskTier === 'MODERATE').length;
    const healthyCount = studentForecasts.filter(
      f => f.riskTier === 'LOW' || f.riskTier === 'EXEMPLARY'
    ).length;

    // Aggregate day of week absences
    const dayMap: Record<string, { absences: number; lates: number }> = {
      Monday: { absences: 0, lates: 0 },
      Tuesday: { absences: 0, lates: 0 },
      Wednesday: { absences: 0, lates: 0 },
      Thursday: { absences: 0, lates: 0 },
      Friday: { absences: 0, lates: 0 },
    };

    classRecords.forEach(rec => {
      const date = new Date(rec.date);
      const dayIndex = date.getDay(); // 0 is Sun, 1 is Mon, 5 is Fri
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dayIndex];

      if (dayMap[dayName]) {
        if (rec.status === 'ABSENT') {
          dayMap[dayName].absences += 1;
        } else if (rec.status === 'LATE') {
          dayMap[dayName].lates += 1;
        }
      }
    });

    const dayOfWeekSummary = Object.keys(dayMap).map(day => ({
      day,
      totalAbsences: dayMap[day].absences,
      totalLates: dayMap[day].lates,
    }));

    return {
      classId,
      className,
      totalStudents: students.length,
      averageAttendanceRate: avgRate,
      projectedClassAttendanceRate: projectedAvg,
      chronicAbsenteeismRiskCount: chronicRiskCount,
      moderateRiskCount: moderateRiskCount,
      healthyAttendanceCount: healthyCount,
      dayOfWeekSummary,
      studentForecasts,
    };
  },

  analyzeStudentAttendance(
    student: Student,
    records: AttendanceRecord[],
    className: string
  ): StudentAttendanceForecast {
    const totalTrackedDays = records.length || 20;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const excusedDays = records.filter(r => r.status === 'EXCUSED').length;

    const currentAttendanceRate =
      totalTrackedDays > 0 ? Math.round(((presentDays + excusedDays * 0.5) / totalTrackedDays) * 100) : 95;

    // Day of week breakdown
    const dayCounts: Record<string, { absent: number; late: number }> = {
      Monday: { absent: 0, late: 0 },
      Tuesday: { absent: 0, late: 0 },
      Wednesday: { absent: 0, late: 0 },
      Thursday: { absent: 0, late: 0 },
      Friday: { absent: 0, late: 0 },
    };

    records.forEach(r => {
      const d = new Date(r.date);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[d.getDay()];
      if (dayCounts[dayName]) {
        if (r.status === 'ABSENT') dayCounts[dayName].absent += 1;
        if (r.status === 'LATE') dayCounts[dayName].late += 1;
      }
    });

    const totalAbsences = absentDays || 1;
    const dayOfWeekAbsences = (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => ({
      day,
      absentCount: dayCounts[day].absent,
      lateCount: dayCounts[day].late,
      percentageOfTotalAbsences: Math.round((dayCounts[day].absent / totalAbsences) * 100),
    }));

    const fridayMondayAbsences = dayCounts['Friday'].absent + dayCounts['Monday'].absent;
    const isFridayMondayDominant = absentDays >= 2 && fridayMondayAbsences / totalAbsences >= 0.6;

    // Consecutive absence streak calculation
    const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let consecutiveAbsenceStreak = 0;
    for (const r of sortedRecords) {
      if (r.status === 'ABSENT') {
        consecutiveAbsenceStreak++;
      } else {
        break;
      }
    }

    // Velocity Trend & Projected Rate
    let riskTier: AbsenteeismRiskTier = 'LOW';
    let riskScore = 10;
    let velocityTrend: 'Rapid Decline' | 'Moderate Slippage' | 'Stable' | 'Improving' = 'Stable';
    let projectedAttendanceRate = currentAttendanceRate;

    // Risk scoring algorithm
    if (currentAttendanceRate < 75 || absentDays >= 5) {
      riskTier = 'CRITICAL';
      riskScore = 92;
      velocityTrend = 'Rapid Decline';
      projectedAttendanceRate = Math.max(62, currentAttendanceRate - 6);
    } else if (currentAttendanceRate < 85 || absentDays >= 3 || (absentDays >= 2 && isFridayMondayDominant)) {
      riskTier = 'HIGH';
      riskScore = 78;
      velocityTrend = 'Rapid Decline';
      projectedAttendanceRate = Math.max(72, currentAttendanceRate - 5);
    } else if (currentAttendanceRate < 92 || lateDays >= 3 || absentDays >= 2) {
      riskTier = 'MODERATE';
      riskScore = 52;
      velocityTrend = 'Moderate Slippage';
      projectedAttendanceRate = Math.max(84, currentAttendanceRate - 3);
    } else if (currentAttendanceRate >= 98 && lateDays === 0) {
      riskTier = 'EXEMPLARY';
      riskScore = 0;
      velocityTrend = 'Stable';
      projectedAttendanceRate = 99;
    } else {
      riskTier = 'LOW';
      riskScore = 15;
      velocityTrend = 'Stable';
      projectedAttendanceRate = currentAttendanceRate;
    }

    // Risk factors synthesis
    const riskContributingFactors: string[] = [];
    if (isFridayMondayDominant) {
      riskContributingFactors.push(
        `${Math.round((fridayMondayAbsences / totalAbsences) * 100)}% of absences occur on Fridays & Mondays (Pre/Post weekend pattern)`
      );
    }
    if (lateDays >= 2) {
      riskContributingFactors.push(
        `${lateDays} recorded tardy arrivals leading to missed morning instructional periods`
      );
    }
    if (consecutiveAbsenceStreak >= 2) {
      riskContributingFactors.push(
        `Currently on a ${consecutiveAbsenceStreak}-day consecutive absence streak`
      );
    }
    if (absentDays >= 3) {
      riskContributingFactors.push(
        `Missed ${absentDays} total school days in recent tracking window`
      );
    }
    if (riskContributingFactors.length === 0) {
      riskContributingFactors.push('Consistent and punctual classroom attendance');
    }

    // Recommendation synthesis
    let earlyInterventionRecommendation = 'Continue regular positive reinforcement and praise.';
    let aiSuggestedParentSubject = `Attendance Check-in for ${student.fullName}`;
    let aiSuggestedParentMessage = '';
    let aiCounselorReferralRequired = false;

    if (riskTier === 'CRITICAL' || riskTier === 'HIGH') {
      aiCounselorReferralRequired = true;
      earlyInterventionRecommendation =
        'Schedule urgent parent attendance conference, assign morning welcome buddy, and alert Pastoral Lead & Guidance Counselor.';
      aiSuggestedParentSubject = `Important Notice: Attendance Concern for ${student.fullName} (${className})`;
      aiSuggestedParentMessage = `Dear Guardian of ${student.fullName},\n\nWe are reaching out from Oakridge Primary Academy to express our care and support for ${student.fullName}. Our attendance records indicate that ${student.fullName} has missed ${absentDays} days recently, particularly clustering around Fridays and Mondays.\n\nConsistent attendance is crucial for continuous academic momentum. We would like to invite you for a brief 10-minute check-in this week to explore how we can partner together to support smooth morning transitions and ensure ${student.fullName} doesn't miss key foundational lessons.\n\nWarm regards,\n${className} Teaching Team`;
    } else if (riskTier === 'MODERATE') {
      earlyInterventionRecommendation =
        'Send proactive friendly guardian notification, monitor first-period arrival logs, and review transportation routine.';
      aiSuggestedParentSubject = `Friendly Attendance & Punctuality Note for ${student.fullName}`;
      aiSuggestedParentMessage = `Hello Guardian of ${student.fullName},\n\nHope your week is off to a great start! We're doing a routine mid-term punctuality review and noticed ${student.fullName} has had ${lateDays} late arrivals recently. Arriving by 08:00 AM ensures ${student.fullName} is ready for our morning math warm-up. Please let us know if there's anything the school can assist with!\n\nBest regards,\nForm Teacher`;
    } else {
      aiSuggestedParentMessage = `Dear Guardian of ${student.fullName},\n\nWe want to celebrate ${student.fullName}'s excellent attendance of ${currentAttendanceRate}%! Their consistent punctuality creates a wonderful foundation for learning. Thank you for your continued partnership!`;
    }

    return {
      studentId: student.id,
      studentName: student.fullName,
      studentAvatar: student.avatar,
      className,
      totalTrackedDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      currentAttendanceRate,
      projectedAttendanceRate,
      riskScore,
      riskTier,
      velocityTrend,
      dayOfWeekAbsences,
      isFridayMondayDominant,
      consecutiveAbsenceStreak,
      unexcusedToExcusedRatio: `${absentDays}:${excusedDays || 1}`,
      riskContributingFactors,
      earlyInterventionRecommendation,
      aiSuggestedParentSubject,
      aiSuggestedParentMessage,
      aiCounselorReferralRequired,
    };
  },
};
