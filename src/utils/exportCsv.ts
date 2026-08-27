import { AttendanceRecord, Student, Assessment, AssessmentScore, Subject, Invoice, FeePayment, User } from '../types';

/**
 * Utility to trigger browser download of CSV string
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes CSV field value
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export Attendance Records to CSV
 */
export function exportAttendanceToCSV(
  records: AttendanceRecord[],
  students: Student[],
  className: string = 'All Classes'
) {
  const studentMap = new Map(students.map(s => [s.id, s]));
  
  const headers = [
    'Record ID',
    'Date',
    'Class',
    'Student ID',
    'Student Full Name',
    'Gender',
    'Status',
    'Time In',
    'Remarks / Excuse Note',
    'Marked By'
  ];

  const rows = records.map(r => {
    const student = studentMap.get(r.studentId);
    return [
      escapeCSV(r.id),
      escapeCSV(r.date),
      escapeCSV(r.className || className),
      escapeCSV(student?.studentId || 'N/A'),
      escapeCSV(r.studentName || student?.fullName || 'Unknown Student'),
      escapeCSV(student?.gender || 'N/A'),
      escapeCSV(r.status),
      escapeCSV(r.timestamp || '08:00 AM'),
      escapeCSV(r.reason || ''),
      escapeCSV(r.markedByName || r.markedBy || 'System')
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadCSV(`Attendance_Report_${safeClassName}_${dateStr}.csv`, csv);
}

/**
 * Export Student Gradebook / Assessment Records to CSV
 */
export function exportGradebookToCSV(
  assessments: Assessment[],
  scores: AssessmentScore[],
  students: Student[],
  subjects: Subject[],
  className: string = 'Class'
) {
  const studentMap = new Map(students.map(s => [s.id, s]));
  const subjectMap = new Map(subjects.map(sub => [sub.id, sub]));
  const assessmentMap = new Map(assessments.map(a => [a.id, a]));

  const headers = [
    'Assessment ID',
    'Assessment Title',
    'Type',
    'Subject',
    'Class',
    'Student ID',
    'Student Full Name',
    'Max Score',
    'Score Obtained',
    'Percentage (%)',
    'Letter Grade',
    'Teacher Feedback',
    'Submission Date'
  ];

  const rows = scores.map(s => {
    const assessment = assessmentMap.get(s.assessmentId);
    const student = studentMap.get(s.studentId);
    const subject = assessment ? subjectMap.get(assessment.subjectId) : null;
    const percentage = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return [
      escapeCSV(s.assessmentId),
      escapeCSV(assessment?.title || 'Continuous Assessment'),
      escapeCSV(assessment?.type || 'ASSIGNMENT'),
      escapeCSV(subject?.name || 'General'),
      escapeCSV(className),
      escapeCSV(student?.studentId || 'N/A'),
      escapeCSV(student?.fullName || s.studentName || 'Student'),
      escapeCSV(s.maxScore),
      escapeCSV(s.score),
      escapeCSV(percentage),
      escapeCSV(grade),
      escapeCSV(s.remarks || ''),
      escapeCSV(s.recordedAt || new Date().toISOString().split('T')[0])
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadCSV(`Gradebook_Export_${safeClassName}_${dateStr}.csv`, csv);
}

/**
 * Export Student Roster / Registry to CSV
 */
export function exportStudentRosterToCSV(students: Student[], schoolYear: string = '2025/2026') {
  const headers = [
    'Student ID',
    'Full Name',
    'Gender',
    'Class Name',
    'Enrollment Status',
    'Date of Birth',
    'Admission Date',
    'House',
    'Blood Group',
    'Emergency Contact Name',
    'Emergency Contact Phone'
  ];

  const rows = students.map(s => {
    const contactName = typeof s.emergencyContact === 'object' ? s.emergencyContact.name : 'Guardian';
    const contactPhone = typeof s.emergencyContact === 'object' ? s.emergencyContact.phone : s.primaryContactPhone || '';

    return [
      escapeCSV(s.studentId),
      escapeCSV(s.fullName),
      escapeCSV(s.gender),
      escapeCSV(s.className),
      escapeCSV(s.status),
      escapeCSV(s.dob || s.dateOfBirth || '2016-04-12'),
      escapeCSV(s.admissionDate || s.enrollmentDate || '2024-09-01'),
      escapeCSV(s.house || 'Blue House'),
      escapeCSV(s.bloodGroup || 'O+'),
      escapeCSV(contactName),
      escapeCSV(contactPhone)
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(`Students_Directory_Oakridge_${dateStr}.csv`, csv);
}

export const exportStudentsToCSV = (students: Student[], _classes?: any) => {
  exportStudentRosterToCSV(students);
};

/**
 * Export Financial Invoicing & Payment Records to CSV
 */
export function exportFinancialLedgerToCSV(invoices: Invoice[], _payments?: FeePayment[]) {
  const headers = [
    'Invoice Number',
    'Student Name',
    'Class',
    'Academic Year',
    'Term',
    'Total Amount (₦ NAIRA)',
    'Paid Amount (₦ NAIRA)',
    'Balance Due (₦ NAIRA)',
    'Status',
    'Due Date',
    'Created Date'
  ];

  const rows = invoices.map(inv => {
    return [
      escapeCSV(inv.invoiceNumber),
      escapeCSV(inv.studentName),
      escapeCSV(inv.className),
      escapeCSV(inv.academicYear),
      escapeCSV(inv.term),
      escapeCSV(inv.totalAmount),
      escapeCSV(inv.paidAmount),
      escapeCSV(inv.balance),
      escapeCSV(inv.status),
      escapeCSV(inv.dueDate),
      escapeCSV(inv.createdAt)
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(`School_Financial_Ledger_${dateStr}.csv`, csv);
}

export const exportFinancialsToCSV = (invoices: Invoice[]) => {
  exportFinancialLedgerToCSV(invoices, []);
};
