import {
  SchoolProfile,
  Branch,
  User,
  ClassRoom,
  Subject,
  ClassSubjectAssignment,
  GradingStructure,
  SubjectCategory,
  AcademicSection,
  TeacherAssignmentType,
  Student,
  Parent,
  AttendanceRecord,
  Assessment,
  AssessmentScore,
  Assignment,
  AssignmentSubmission,
  LessonPlan,
  LessonNote,
  ClassAnnouncement,
  Quiz,
  BehaviorRecord,
  BehaviorCategory,
  StudentStatusReport,
  WeeklyTeacherReport,
  WeeklyReportStatus,
  BehaviorStatusType,
  BehaviorVisibilityType,
  FeeStructure,
  Invoice,
  FeePayment,
  TimetableSlot,
  Message,
  NotificationItem,
  AuditLog,
  AIGovernanceConfig,
  UserRole,
  CalendarEvent
} from '../types';

import {
  INITIAL_BRANCHES,
  INITIAL_SCHOOL_PROFILE,
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_GRADING_STRUCTURES,
  INITIAL_CLASS_SUBJECT_ASSIGNMENTS,
  INITIAL_STUDENTS,
  INITIAL_PARENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSESSMENT_SCORES,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_LESSON_PLANS,
  INITIAL_LESSON_NOTES,
  INITIAL_CLASS_ANNOUNCEMENTS,
  INITIAL_BEHAVIOR_RECORDS,
  INITIAL_FEE_STRUCTURES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_TIMETABLE,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_AI_GOVERNANCE
} from '../data/seedData';

import {
  INITIAL_BEHAVIOR_CATEGORIES,
  INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS,
  INITIAL_STUDENT_STATUS_REPORTS,
  INITIAL_WEEKLY_TEACHER_REPORTS
} from '../data/behaviorSeedData';

const STORAGE_KEYS = {
  SCHOOL_PROFILE: 'schoolos_profile_v1',
  BRANCHES: 'schoolos_branches_v1',
  ACTIVE_BRANCH_ID: 'schoolos_active_branch_id_v1',
  USERS: 'schoolos_users_v1',
  CLASSES: 'schoolos_classes_v1',
  SUBJECTS: 'schoolos_subjects_v1',
  GRADING_STRUCTURES: 'schoolos_grading_structures_v1',
  CLASS_SUBJECT_ASSIGNMENTS: 'schoolos_class_subject_assignments_v1',
  STUDENTS: 'schoolos_students_v1',
  PARENTS: 'schoolos_parents_v1',
  ATTENDANCE: 'schoolos_attendance_v1',
  ASSESSMENTS: 'schoolos_assessments_v1',
  ASSESSMENT_SCORES: 'schoolos_scores_v1',
  ASSIGNMENTS: 'schoolos_assignments_v1',
  SUBMISSIONS: 'schoolos_submissions_v1',
  CALENDAR_EVENTS: 'schoolos_calendar_events_v1',
  LESSON_PLANS: 'schoolos_lessonplans_v1',
  LESSON_NOTES: 'schoolos_lessonnotes_v1',
  CLASS_ANNOUNCEMENTS: 'schoolos_class_announcements_v1',
  QUIZZES: 'schoolos_quizzes_v1',
  BEHAVIOR_CATEGORIES: 'schoolos_behavior_categories_v1',
  BEHAVIOR: 'schoolos_behavior_v1',
  STUDENT_STATUS_REPORTS: 'schoolos_student_status_reports_v1',
  WEEKLY_TEACHER_REPORTS: 'schoolos_weekly_teacher_reports_v1',
  FEE_STRUCTURES: 'schoolos_feestructures_v1',
  INVOICES: 'schoolos_invoices_v1',
  PAYMENTS: 'schoolos_payments_v1',
  TIMETABLE: 'schoolos_timetable_v1',
  MESSAGES: 'schoolos_messages_v1',
  NOTIFICATIONS: 'schoolos_notifications_v1',
  AUDIT_LOGS: 'schoolos_audit_v1',
  AI_GOVERNANCE: 'schoolos_ai_gov_v1',
  CURRENT_USER_ID: 'schoolos_current_user_id_v1',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => {
    try { l(); } catch (e) { console.error('Listener error', e); }
  });
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notify();
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Ensure database is seeded
export function initDatabase(): void {
  if (!localStorage.getItem(STORAGE_KEYS.USERS) || !localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
    resetToSeedData();
  } else {
    // Ensure active logo and currency are synchronized with requested defaults
    const currentProfile = getItem<SchoolProfile>(STORAGE_KEYS.SCHOOL_PROFILE, INITIAL_SCHOOL_PROFILE);
    if (!currentProfile.logo || currentProfile.logo.includes('unsplash') || currentProfile.currency !== 'NAIRA') {
      setItem(STORAGE_KEYS.SCHOOL_PROFILE, {
        ...currentProfile,
        logo: 'https://res.cloudinary.com/dehvk3bre/image/upload/v1782745354/20260304_140255_weozqy.png',
        currency: 'NAIRA',
        currencySymbol: '₦',
        currencyName: 'NAIRA',
      });
    }

    // Ensure branch names and bank details are synchronized
    const currentBranches = getItem<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    const hasBranchBankDetails = currentBranches.some(b => b.bankDetails?.accountNumber);
    if (currentBranches.length === 2 && (currentBranches[0].name.includes('BUNGALOW') || !hasBranchBankDetails)) {
      const mergedBranches = currentBranches.map(b => {
        const seedB = INITIAL_BRANCHES.find(sb => sb.id === b.id);
        return {
          ...b,
          name: seedB?.name || b.name,
          bankDetails: b.bankDetails || seedB?.bankDetails || {
            bankName: b.id === 'branch_ijegun' ? 'Guaranty Trust Bank (GTBank) Plc' : 'Zenith Bank Plc',
            accountName: `Zitel Castle School (${b.name.includes('Ijegun') ? 'Ijegun Campus' : 'Bungalow Campus'})`,
            accountNumber: b.id === 'branch_ijegun' ? '0238194721' : '1014582910',
            sortCode: b.id === 'branch_ijegun' ? '058152062' : '057150013',
            paymentInstructions: 'Include student admission ID and invoice reference in transaction narration.',
          },
        };
      });
      setItem(STORAGE_KEYS.BRANCHES, mergedBranches);
    }

    // Ensure comprehensive subject catalogue exists
    const currentSubjects = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    if (!currentSubjects || currentSubjects.length < 25) {
      setItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    }

    // Ensure grading structures exist
    const currentGrading = getItem<GradingStructure[]>(STORAGE_KEYS.GRADING_STRUCTURES, []);
    if (!currentGrading || currentGrading.length === 0) {
      setItem(STORAGE_KEYS.GRADING_STRUCTURES, INITIAL_GRADING_STRUCTURES);
    }

    // Ensure class subject assignments exist
    const currentAssignments = getItem<ClassSubjectAssignment[]>(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, []);
    if (!currentAssignments || currentAssignments.length === 0) {
      setItem(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, INITIAL_CLASS_SUBJECT_ASSIGNMENTS);
    }

    // Ensure lesson notes exist
    const currentNotes = getItem<LessonNote[]>(STORAGE_KEYS.LESSON_NOTES, []);
    if (!currentNotes || currentNotes.length === 0) {
      setItem(STORAGE_KEYS.LESSON_NOTES, INITIAL_LESSON_NOTES);
    }

    // Ensure class announcements exist
    const currentAnnouncements = getItem<ClassAnnouncement[]>(STORAGE_KEYS.CLASS_ANNOUNCEMENTS, []);
    if (!currentAnnouncements || currentAnnouncements.length === 0) {
      setItem(STORAGE_KEYS.CLASS_ANNOUNCEMENTS, INITIAL_CLASS_ANNOUNCEMENTS);
    }

    // Ensure behavior categories exist
    const currentCategories = getItem<BehaviorCategory[]>(STORAGE_KEYS.BEHAVIOR_CATEGORIES, []);
    if (!currentCategories || currentCategories.length === 0) {
      setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, INITIAL_BEHAVIOR_CATEGORIES);
    }

    // Ensure comprehensive behavior records exist
    const currentBehavior = getItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR, []);
    if (!currentBehavior || currentBehavior.length <= 1) {
      setItem(STORAGE_KEYS.BEHAVIOR, INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS);
    }

    // Ensure student status reports exist
    const currentStatusReports = getItem<StudentStatusReport[]>(STORAGE_KEYS.STUDENT_STATUS_REPORTS, []);
    if (!currentStatusReports || currentStatusReports.length === 0) {
      setItem(STORAGE_KEYS.STUDENT_STATUS_REPORTS, INITIAL_STUDENT_STATUS_REPORTS);
    }

    // Ensure weekly teacher reports exist
    const currentWeeklyReports = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, []);
    if (!currentWeeklyReports || currentWeeklyReports.length === 0) {
      setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
    }

    // Ensure new teachers are present in users table if needed
    const currentUsers = getItem<User[]>(STORAGE_KEYS.USERS, []);
    const hasAmara = currentUsers.some(u => u.id === 'user_teacher_amara');
    if (!hasAmara) {
      const extraTeachers = INITIAL_USERS.filter(u => !currentUsers.some(cu => cu.id === u.id));
      if (extraTeachers.length > 0) {
        setItem(STORAGE_KEYS.USERS, [...currentUsers, ...extraTeachers]);
      }
    }
  }
}

export function resetToSeedData(): void {
  setItem(STORAGE_KEYS.SCHOOL_PROFILE, INITIAL_SCHOOL_PROFILE);
  setItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  setItem(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'all');
  setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  setItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  setItem(STORAGE_KEYS.GRADING_STRUCTURES, INITIAL_GRADING_STRUCTURES);
  setItem(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, INITIAL_CLASS_SUBJECT_ASSIGNMENTS);
  setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  setItem(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
  setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  setItem(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
  setItem(STORAGE_KEYS.ASSESSMENT_SCORES, INITIAL_ASSESSMENT_SCORES);
  setItem(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  setItem(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  setItem(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
  setItem(STORAGE_KEYS.LESSON_PLANS, INITIAL_LESSON_PLANS);
  setItem(STORAGE_KEYS.LESSON_NOTES, INITIAL_LESSON_NOTES);
  setItem(STORAGE_KEYS.CLASS_ANNOUNCEMENTS, INITIAL_CLASS_ANNOUNCEMENTS);
  setItem(STORAGE_KEYS.QUIZZES, []);
  setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, INITIAL_BEHAVIOR_CATEGORIES);
  setItem(STORAGE_KEYS.BEHAVIOR, INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS);
  setItem(STORAGE_KEYS.STUDENT_STATUS_REPORTS, INITIAL_STUDENT_STATUS_REPORTS);
  setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
  setItem(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES);
  setItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  setItem(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
  setItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  setItem(STORAGE_KEYS.AI_GOVERNANCE, INITIAL_AI_GOVERNANCE);
  setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user_superadmin_01');
  notify();
}

export const db = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Auth / Current User
  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = getItem<string>(STORAGE_KEYS.CURRENT_USER_ID, 'user_superadmin_01');
    const found = users.find(u => u.id === currentId);
    return found || users[0] || INITIAL_USERS[0];
  },

  setCurrentUser(userId: string) {
    setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },

  login(emailOrUsername: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const query = emailOrUsername.trim().toLowerCase();
    const user = users.find(
      u => u.email.toLowerCase() === query || u.username.toLowerCase() === query
    );
    if (!user) {
      return { success: false, error: 'Invalid username or email address.' };
    }
    if (user.status === 'suspended') {
      return { success: false, error: 'Your account is suspended. Please contact the Super Admin.' };
    }
    if (user.status === 'inactive') {
      return { success: false, error: 'Your account is inactive. Please contact your school administrator.' };
    }
    this.setCurrentUser(user.id);
    this.addAuditLog(user.id, user.name, user.role, 'LOGIN', 'User', user.id, `User logged into the platform`);
    return { success: true, user };
  },

  logout() {
    const user = this.getCurrentUser();
    this.addAuditLog(user.id, user.name, user.role, 'LOGOUT', 'User', user.id, `User logged out`);
    setItem(STORAGE_KEYS.CURRENT_USER_ID, '');
  },

  // School Profile
  getSchoolProfile(): SchoolProfile {
    return getItem<SchoolProfile>(STORAGE_KEYS.SCHOOL_PROFILE, INITIAL_SCHOOL_PROFILE);
  },

  updateSchoolProfile(profile: Partial<SchoolProfile>, actor: User) {
    const current = this.getSchoolProfile();
    const updated = { ...current, ...profile };
    setItem(STORAGE_KEYS.SCHOOL_PROFILE, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'SCHOOL_PROFILE_UPDATED', 'Settings', 'profile', 'Updated school branding & configurations');
    return updated;
  },

  // Active Branch Context (for Super Admin switching or persistent user selection)
  getActiveBranchId(): string {
    return getItem<string>(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'all');
  },

  setActiveBranchId(branchId: string) {
    setItem(STORAGE_KEYS.ACTIVE_BRANCH_ID, branchId);
  },

  // Branches Management
  getBranches(): Branch[] {
    return getItem<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  },

  getBranch(id: string): Branch | undefined {
    return this.getBranches().find(b => b.id === id);
  },

  createBranch(branch: Omit<Branch, 'id' | 'createdAt'>, actor: User): Branch {
    const branches = this.getBranches();
    const newBranch: Branch = {
      ...branch,
      id: `branch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      studentCount: branch.studentCount || 0,
      teacherCount: branch.teacherCount || 0,
      classCount: branch.classCount || 0,
    };
    branches.push(newBranch);
    setItem(STORAGE_KEYS.BRANCHES, branches);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BRANCH_CREATED',
      'Branch',
      newBranch.id,
      `Created new school branch: ${newBranch.name} (${newBranch.code})`
    );
    return newBranch;
  },

  updateBranch(id: string, updates: Partial<Branch>, actor: User): Branch {
    const branches = this.getBranches();
    const idx = branches.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Branch not found');
    const updated = { ...branches[idx], ...updates };
    branches[idx] = updated;
    setItem(STORAGE_KEYS.BRANCHES, branches);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BRANCH_UPDATED',
      'Branch',
      id,
      `Updated branch details for ${updated.name}`
    );
    return updated;
  },

  toggleBranchStatus(id: string, actor: User): Branch {
    const branches = this.getBranches();
    const idx = branches.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Branch not found');
    const nextStatus = branches[idx].status === 'active' ? 'inactive' : 'active';
    branches[idx].status = nextStatus;
    setItem(STORAGE_KEYS.BRANCHES, branches);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BRANCH_STATUS_TOGGLED',
      'Branch',
      id,
      `Changed branch status of ${branches[idx].name} to ${nextStatus.toUpperCase()}`
    );
    return branches[idx];
  },

  deleteBranch(id: string, actor: User): boolean {
    let branches = this.getBranches();
    const target = branches.find(b => b.id === id);
    if (!target) return false;
    branches = branches.filter(b => b.id !== id);
    setItem(STORAGE_KEYS.BRANCHES, branches);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BRANCH_DELETED',
      'Branch',
      id,
      `Removed branch: ${target.name}`
    );
    return true;
  },

  // Calendar Events Management
  getCalendarEvents(branchId?: string, classId?: string): CalendarEvent[] {
    const events = getItem<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    if (!branchId || branchId === 'all') {
      if (!classId) return events;
      return events.filter(e => e.isSchoolWide || e.classId === classId);
    }
    return events.filter(e => e.isSchoolWide || !e.branchId || e.branchId === branchId || (classId && e.classId === classId));
  },

  createCalendarEvent(event: Omit<CalendarEvent, 'id'>, actor: User): CalendarEvent {
    const events = getItem<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    const newEvent: CalendarEvent = {
      ...event,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdByName: actor.name,
      createdByTeacherId: actor.id,
    };
    events.push(newEvent);
    setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'CALENDAR_EVENT_CREATED',
      'Settings',
      newEvent.id,
      `Scheduled calendar event "${newEvent.title}" on ${newEvent.date}`
    );
    return newEvent;
  },

  updateCalendarEvent(id: string, updates: Partial<CalendarEvent>, actor: User): CalendarEvent {
    const events = getItem<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Event not found');
    const updated = { ...events[idx], ...updates };
    events[idx] = updated;
    setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'CALENDAR_EVENT_UPDATED',
      'Settings',
      id,
      `Updated calendar event "${updated.title}"`
    );
    return updated;
  },

  deleteCalendarEvent(id: string, actor: User): boolean {
    let events = getItem<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    const target = events.find(e => e.id === id);
    if (!target) return false;
    events = events.filter(e => e.id !== id);
    setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'CALENDAR_EVENT_DELETED',
      'Settings',
      id,
      `Deleted calendar event "${target.title}"`
    );
    return true;
  },

  // Users
  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  createUser(user: Omit<User, 'id' | 'createdAt'>, actor: User): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'USER_CREATED',
      'User',
      newUser.id,
      `Created ${newUser.role} account for ${newUser.name} (${newUser.email})`
    );
    return newUser;
  },

  updateUser(id: string, updates: Partial<User>, actor: User): User {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    setItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'USER_UPDATED',
      'User',
      id,
      `Updated user profile & permissions for ${updated.name}`
    );
    return updated;
  },

  deleteUser(id: string, actor: User): boolean {
    let users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return false;
    if (target.role === 'SUPER_ADMIN') {
      throw new Error('Cannot delete Super Admin account.');
    }
    users = users.filter(u => u.id !== id);
    setItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'USER_DELETED',
      'User',
      id,
      `Deleted user account: ${target.name} (${target.email})`
    );
    return true;
  },

  // Classes
  getClasses(): ClassRoom[] {
    return getItem<ClassRoom[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },

  createClass(cls: Omit<ClassRoom, 'id' | 'enrolledCount'>, actor: User): ClassRoom {
    const classes = this.getClasses();
    const newClass: ClassRoom = {
      ...cls,
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      enrolledCount: 0,
    };
    classes.push(newClass);
    setItem(STORAGE_KEYS.CLASSES, classes);
    this.addAuditLog(actor.id, actor.name, actor.role, 'CLASS_CREATED', 'Class', newClass.id, `Created class ${newClass.name}`);
    return newClass;
  },

  updateClass(id: string, updates: Partial<ClassRoom>, actor: User): ClassRoom {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Class not found');
    const updated = { ...classes[idx], ...updates };
    classes[idx] = updated;
    setItem(STORAGE_KEYS.CLASSES, classes);
    this.addAuditLog(actor.id, actor.name, actor.role, 'CLASS_UPDATED', 'Class', id, `Updated class ${updated.name}`);
    return updated;
  },

  // Subjects
  getSubjects(filter?: { educationalLevel?: AcademicSection; category?: SubjectCategory; status?: 'active' | 'inactive'; search?: string }): Subject[] {
    let subjects = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    if (!filter) return subjects;

    if (filter.educationalLevel) {
      subjects = subjects.filter(s => s.educationalLevel === filter.educationalLevel || s.sectionType === filter.educationalLevel);
    }
    if (filter.category) {
      subjects = subjects.filter(s => s.category === filter.category);
    }
    if (filter.status) {
      subjects = subjects.filter(s => (s.status || 'active') === filter.status);
    }
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      subjects = subjects.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.code.toLowerCase().includes(q) || 
        s.description?.toLowerCase().includes(q)
      );
    }
    return subjects;
  },

  getSubjectById(id: string): Subject | undefined {
    return this.getSubjects().find(s => s.id === id);
  },

  createSubject(subject: Omit<Subject, 'id'>, actor: User): Subject {
    const subjects = this.getSubjects();
    const newSub: Subject = {
      ...subject,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: subject.status || 'active',
    };
    subjects.push(newSub);
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
    this.addAuditLog(actor.id, actor.name, actor.role, 'SUBJECT_CREATED', 'Settings', newSub.id, `Created subject ${newSub.name} (${newSub.code})`);
    return newSub;
  },

  updateSubject(id: string, updates: Partial<Subject>, actor: User): Subject {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subject not found');
    const updated: Subject = { ...subjects[idx], ...updates };
    subjects[idx] = updated;
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
    this.addAuditLog(actor.id, actor.name, actor.role, 'SUBJECT_UPDATED', 'Settings', id, `Updated subject ${updated.name} (${updated.code})`);
    return updated;
  },

  deleteSubject(id: string, actor: User): boolean {
    let subjects = this.getSubjects();
    const target = subjects.find(s => s.id === id);
    if (!target) return false;
    subjects = subjects.filter(s => s.id !== id);
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
    this.addAuditLog(actor.id, actor.name, actor.role, 'SUBJECT_DELETED', 'Settings', id, `Deleted subject ${target.name} (${target.code})`);
    return true;
  },

  toggleSubjectStatus(id: string, actor: User): Subject {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subject not found');
    const currentStatus = subjects[idx].status || 'active';
    const newStatus: 'active' | 'inactive' = currentStatus === 'active' ? 'inactive' : 'active';
    subjects[idx].status = newStatus;
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'SUBJECT_STATUS_CHANGED',
      'Settings',
      id,
      `Changed subject status of ${subjects[idx].name} to ${newStatus}`
    );
    return subjects[idx];
  },

  bulkCreateSubjects(subjectsToAdd: Array<Omit<Subject, 'id'>>, actor: User): Subject[] {
    const subjects = this.getSubjects();
    const created: Subject[] = [];
    subjectsToAdd.forEach((s, idx) => {
      const newSub: Subject = {
        ...s,
        id: `sub_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        status: s.status || 'active',
      };
      subjects.push(newSub);
      created.push(newSub);
    });
    setItem(STORAGE_KEYS.SUBJECTS, subjects);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BULK_SUBJECTS_CREATED',
      'Settings',
      'bulk',
      `Imported and created ${created.length} new academic subjects in catalogue.`
    );
    return created;
  },

  // ==========================================
  // GRADING STRUCTURES CRUD & CALCULATION
  // ==========================================
  getGradingStructures(): GradingStructure[] {
    return getItem<GradingStructure[]>(STORAGE_KEYS.GRADING_STRUCTURES, INITIAL_GRADING_STRUCTURES);
  },

  getGradingStructureById(id: string): GradingStructure | undefined {
    return this.getGradingStructures().find(g => g.id === id);
  },

  getEffectiveGradingStructure(classId?: string, subjectId?: string, sectionType?: AcademicSection): GradingStructure {
    const structures = this.getGradingStructures();
    
    // 1. Subject specific in class
    if (classId && subjectId) {
      const subjectSpecific = structures.find(
        g => g.level === 'SUBJECT' && g.targetId === `${classId}_${subjectId}`
      );
      if (subjectSpecific) return subjectSpecific;
    }

    // 2. Class specific
    if (classId) {
      const classSpecific = structures.find(
        g => g.level === 'CLASS' && g.targetId === classId
      );
      if (classSpecific) return classSpecific;
    }

    // 3. Section specific (Primary / JSS / SSS)
    if (sectionType) {
      const sectionSpecific = structures.find(
        g => g.level === 'SECTION' && g.targetId === sectionType
      );
      if (sectionSpecific) return sectionSpecific;
    }

    // 4. School Default
    const defaultStructure = structures.find(g => g.isDefault) || structures[0] || INITIAL_GRADING_STRUCTURES[0];
    return defaultStructure;
  },

  createGradingStructure(
    structure: Omit<GradingStructure, 'id' | 'createdAt' | 'updatedBy' | 'type'> & { type?: '40_60' | '30_70' | 'CUSTOM'; updatedBy?: string },
    actor: User
  ): GradingStructure {
    // Validate that CA + Exam = 100
    const total = (structure.caWeight || 0) + (structure.examWeight || 0);
    if (total !== 100) {
      throw new Error(`Invalid grading weights: Total must be exactly 100% (currently ${total}%).`);
    }

    const structures = this.getGradingStructures();
    const type = structure.type || (structure.caWeight === 40 && structure.examWeight === 60 ? '40_60' : structure.caWeight === 30 && structure.examWeight === 70 ? '30_70' : 'CUSTOM');
    const newStructure: GradingStructure = {
      ...structure,
      type,
      id: `gs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedBy: actor.name,
    };

    if (newStructure.isDefault) {
      // Unset previous defaults
      structures.forEach(g => { g.isDefault = false; });
    }

    structures.push(newStructure);
    setItem(STORAGE_KEYS.GRADING_STRUCTURES, structures);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'GRADING_STRUCTURE_CREATED',
      'Settings',
      newStructure.id,
      `Created grading scheme "${newStructure.name}" (CA ${newStructure.caWeight}%, Exam ${newStructure.examWeight}%)`
    );
    return newStructure;
  },

  updateGradingStructure(id: string, updates: Partial<GradingStructure>, actor: User): GradingStructure {
    const structures = this.getGradingStructures();
    const idx = structures.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Grading structure not found');

    const merged = { ...structures[idx], ...updates };
    const total = (merged.caWeight || 0) + (merged.examWeight || 0);
    if (total !== 100) {
      throw new Error(`Invalid grading weights: Total must be exactly 100% (currently ${total}%).`);
    }

    if (updates.isDefault) {
      structures.forEach((g, i) => { if (i !== idx) g.isDefault = false; });
    }

    merged.updatedBy = actor.name;
    structures[idx] = merged;
    setItem(STORAGE_KEYS.GRADING_STRUCTURES, structures);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'GRADING_STRUCTURE_UPDATED',
      'Settings',
      id,
      `Updated grading scheme "${merged.name}" (CA ${merged.caWeight}%, Exam ${merged.examWeight}%)`
    );
    return merged;
  },

  deleteGradingStructure(id: string, actor: User): boolean {
    let structures = this.getGradingStructures();
    const target = structures.find(g => g.id === id);
    if (!target) return false;
    if (target.isDefault) {
      throw new Error('Cannot delete the default grading structure.');
    }
    structures = structures.filter(g => g.id !== id);
    setItem(STORAGE_KEYS.GRADING_STRUCTURES, structures);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'GRADING_STRUCTURE_DELETED',
      'Settings',
      id,
      `Deleted grading scheme "${target.name}"`
    );
    return true;
  },

  // ==========================================
  // CLASS-SUBJECT-TEACHER ASSIGNMENTS CRUD
  // ==========================================
  getClassSubjectAssignments(filter?: { classId?: string; teacherId?: string; subjectId?: string; branchId?: string }): ClassSubjectAssignment[] {
    let assignments = getItem<ClassSubjectAssignment[]>(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, INITIAL_CLASS_SUBJECT_ASSIGNMENTS);
    if (!filter) return assignments;

    if (filter.classId) {
      assignments = assignments.filter(a => a.classId === filter.classId);
    }
    if (filter.teacherId) {
      assignments = assignments.filter(a => a.teacherId === filter.teacherId);
    }
    if (filter.subjectId) {
      assignments = assignments.filter(a => a.subjectId === filter.subjectId);
    }
    if (filter.branchId && filter.branchId !== 'all') {
      assignments = assignments.filter(a => a.branchId === filter.branchId);
    }
    return assignments;
  },

  getClassSubjectAssignmentById(id: string): ClassSubjectAssignment | undefined {
    return this.getClassSubjectAssignments().find(a => a.id === id);
  },

  assignTeacherToClassSubject(assignment: Omit<ClassSubjectAssignment, 'id' | 'updatedAt'>, actor: User): ClassSubjectAssignment {
    const assignments = this.getClassSubjectAssignments();
    // Check if assignment already exists for this class and subject
    const existingIdx = assignments.findIndex(
      a => a.classId === assignment.classId && a.subjectId === assignment.subjectId
    );

    const newAssignment: ClassSubjectAssignment = {
      ...assignment,
      id: existingIdx !== -1 ? assignments[existingIdx].id : `csa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      assignments[existingIdx] = newAssignment;
    } else {
      assignments.push(newAssignment);
    }

    setItem(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, assignments);

    // Keep user assignedClasses and assignedSubjects in sync for fast lookup
    const users = this.getUsers();
    const teacherIdx = users.findIndex(u => u.id === assignment.teacherId);
    if (teacherIdx !== -1) {
      const t = users[teacherIdx];
      const classes = Array.from(new Set([...(t.assignedClasses || []), assignment.classId]));
      const subjects = Array.from(new Set([...(t.assignedSubjects || []), assignment.subjectId]));
      users[teacherIdx] = { ...t, assignedClasses: classes, assignedSubjects: subjects };
      setItem(STORAGE_KEYS.USERS, users);
    }

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'TEACHER_ASSIGNED_TO_SUBJECT',
      'Settings',
      newAssignment.id,
      `Assigned ${assignment.teacherName} as ${assignment.teacherType} for ${assignment.subjectName} in ${assignment.className}`
    );
    return newAssignment;
  },

  updateClassSubjectAssignment(id: string, updates: Partial<ClassSubjectAssignment>, actor: User): ClassSubjectAssignment {
    const assignments = this.getClassSubjectAssignments();
    const idx = assignments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Assignment not found');

    const updated = { ...assignments[idx], ...updates, updatedAt: new Date().toISOString() };
    assignments[idx] = updated;
    setItem(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, assignments);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'CLASS_SUBJECT_ASSIGNMENT_UPDATED',
      'Settings',
      id,
      `Updated assignment for ${updated.subjectName} in ${updated.className}`
    );
    return updated;
  },

  removeClassSubjectAssignment(id: string, actor: User): boolean {
    let assignments = this.getClassSubjectAssignments();
    const target = assignments.find(a => a.id === id);
    if (!target) return false;

    assignments = assignments.filter(a => a.id !== id);
    setItem(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, assignments);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'TEACHER_UNASSIGNED_FROM_SUBJECT',
      'Settings',
      id,
      `Removed assignment of ${target.teacherName} for ${target.subjectName} in ${target.className}`
    );
    return true;
  },

  bulkAssignClassSubjects(assignmentsToSave: Array<Omit<ClassSubjectAssignment, 'id' | 'updatedAt'>>, actor: User): ClassSubjectAssignment[] {
    const assignments = this.getClassSubjectAssignments();
    const createdOrUpdated: ClassSubjectAssignment[] = [];

    assignmentsToSave.forEach((item, idx) => {
      const existIdx = assignments.findIndex(a => a.classId === item.classId && a.subjectId === item.subjectId);
      const record: ClassSubjectAssignment = {
        ...item,
        id: existIdx !== -1 ? assignments[existIdx].id : `csa_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        updatedAt: new Date().toISOString(),
      };
      if (existIdx !== -1) {
        assignments[existIdx] = record;
      } else {
        assignments.push(record);
      }
      createdOrUpdated.push(record);
    });

    setItem(STORAGE_KEYS.CLASS_SUBJECT_ASSIGNMENTS, assignments);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BULK_CLASS_SUBJECTS_ASSIGNED',
      'Settings',
      'bulk',
      `Saved ${createdOrUpdated.length} subject-teacher allocations across academic classes.`
    );
    return createdOrUpdated;
  },

  // ==========================================
  // STRICT SUBJECT-BASED ACCESS CONTROL HELPERS
  // ==========================================
  getTeacherAssignedSubjects(teacherId: string, classId?: string): Subject[] {
    const allSubjects = this.getSubjects();
    const user = this.getUsers().find(u => u.id === teacherId);
    if (!user) return [];

    // Admins have access to all subjects
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      return allSubjects;
    }

    const assignments = this.getClassSubjectAssignments({ teacherId, classId });
    const assignedSubjectIds = new Set(assignments.map(a => a.subjectId));

    // Also check if teacher is a Form Teacher in a Primary class (Basic 1-6) without explicit specialist
    if (classId) {
      const cls = this.getClasses().find(c => c.id === classId);
      if (cls && cls.sectionType === 'PRIMARY' && cls.formTeacherId === teacherId) {
        // Form teacher gets primary subjects that are not explicitly assigned to a specialist
        const classAssignments = this.getClassSubjectAssignments({ classId });
        const specialistSubjectIds = new Set(
          classAssignments.filter(a => a.teacherType === 'SPECIALIST_TEACHER' && a.teacherId !== teacherId).map(a => a.subjectId)
        );
        const primarySubjects = allSubjects.filter(s => (s.sectionType === 'PRIMARY' || s.educationalLevel === 'PRIMARY') && !specialistSubjectIds.has(s.id));
        primarySubjects.forEach(s => assignedSubjectIds.add(s.id));
      }
    }

    return allSubjects.filter(s => assignedSubjectIds.has(s.id) || (user.assignedSubjects && user.assignedSubjects.includes(s.id)));
  },

  getTeacherAssignedClasses(teacherId: string): ClassRoom[] {
    const allClasses = this.getClasses();
    const user = this.getUsers().find(u => u.id === teacherId);
    if (!user) return [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      return allClasses;
    }

    const assignments = this.getClassSubjectAssignments({ teacherId });
    const classIds = new Set(assignments.map(a => a.classId));

    // Also add classes where teacher is Form Teacher
    allClasses.forEach(c => {
      if (c.formTeacherId === teacherId || (user.assignedClasses && user.assignedClasses.includes(c.id))) {
        classIds.add(c.id);
      }
    });

    return allClasses.filter(c => classIds.has(c.id));
  },

  isTeacherAuthorizedForSubject(teacherId: string, classId: string, subjectId: string): boolean {
    const user = this.getUsers().find(u => u.id === teacherId);
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') return true;

    const assignments = this.getClassSubjectAssignments({ classId, subjectId });
    const myAssignment = assignments.find(a => a.teacherId === teacherId);
    if (myAssignment) return true;

    // Check primary school form teacher fallback
    const cls = this.getClasses().find(c => c.id === classId);
    if (cls && cls.sectionType === 'PRIMARY' && cls.formTeacherId === teacherId) {
      // If there's a specialist teacher explicitly assigned to this subject and it's not me, false
      const specialistAssignment = assignments.find(a => a.teacherType === 'SPECIALIST_TEACHER');
      if (specialistAssignment && specialistAssignment.teacherId !== teacherId) {
        return false;
      }
      return true;
    }

    return false;
  },

  getAuthorizedAssessmentsForTeacher(teacherId: string, classId?: string): Assessment[] {
    const user = this.getUsers().find(u => u.id === teacherId);
    let assessments = getItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
    if (!user) return [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      if (classId) return assessments.filter(a => a.classId === classId);
      return assessments;
    }

    return assessments.filter(a => {
      if (classId && a.classId !== classId) return false;
      return this.isTeacherAuthorizedForSubject(teacherId, a.classId, a.subjectId);
    });
  },

  getAuthorizedAssignmentsForTeacher(teacherId: string, classId?: string): Assignment[] {
    const user = this.getUsers().find(u => u.id === teacherId);
    let assignments = getItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    if (!user) return [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      if (classId) return assignments.filter(a => a.classId === classId);
      return assignments;
    }

    return assignments.filter(a => {
      if (classId && a.classId !== classId) return false;
      return this.isTeacherAuthorizedForSubject(teacherId, a.classId, a.subjectId);
    });
  },

  getAuthorizedLessonPlansForTeacher(teacherId: string, classId?: string): LessonPlan[] {
    const user = this.getUsers().find(u => u.id === teacherId);
    let lessonPlans = getItem<LessonPlan[]>(STORAGE_KEYS.LESSON_PLANS, INITIAL_LESSON_PLANS);
    if (!user) return [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      if (classId) return lessonPlans.filter(l => l.classId === classId);
      return lessonPlans;
    }

    return lessonPlans.filter(l => {
      if (l.teacherId === teacherId) return true;
      if (classId && l.classId !== classId) return false;
      return this.isTeacherAuthorizedForSubject(teacherId, l.classId, l.subjectId);
    });
  },

  getAuthorizedScoresForTeacher(teacherId: string, assessmentId: string): AssessmentScore[] {
    const user = this.getUsers().find(u => u.id === teacherId);
    const scores = getItem<AssessmentScore[]>(STORAGE_KEYS.ASSESSMENT_SCORES, INITIAL_ASSESSMENT_SCORES);
    const assessment = getItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS).find(a => a.id === assessmentId);
    if (!user || !assessment) return [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      return scores.filter(s => s.assessmentId === assessmentId);
    }

    if (this.isTeacherAuthorizedForSubject(teacherId, assessment.classId, assessment.subjectId)) {
      return scores.filter(s => s.assessmentId === assessmentId);
    }

    return [];
  },

  getAuthorizedAssessments(teacherId: string, classId?: string, subjectId?: string): Assessment[] {
    const list = this.getAuthorizedAssessmentsForTeacher(teacherId, classId);
    if (subjectId) return list.filter(a => a.subjectId === subjectId);
    return list;
  },

  getAuthorizedAssignments(teacherId: string, classId?: string, subjectId?: string): Assignment[] {
    const list = this.getAuthorizedAssignmentsForTeacher(teacherId, classId);
    if (subjectId) return list.filter(a => a.subjectId === subjectId);
    return list;
  },

  getAuthorizedLessonPlans(teacherId: string, classId?: string, subjectId?: string): LessonPlan[] {
    const list = this.getAuthorizedLessonPlansForTeacher(teacherId, classId);
    if (subjectId) return list.filter(l => l.subjectId === subjectId);
    return list;
  },

  getAuthorizedLessonNotes(teacherId: string, classId?: string, subjectId?: string): LessonNote[] {
    const user = this.getUsers().find(u => u.id === teacherId);
    let notes = getItem<LessonNote[]>(STORAGE_KEYS.LESSON_NOTES, INITIAL_LESSON_NOTES);
    if (!user) return [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRINCIPAL') {
      if (classId) notes = notes.filter(n => n.classId === classId);
      if (subjectId) notes = notes.filter(n => n.subjectId === subjectId);
      return notes;
    }

    return notes.filter(n => {
      if (n.teacherId === teacherId) return true;
      if (classId && n.classId !== classId) return false;
      if (subjectId && n.subjectId !== subjectId) return false;
      return this.isTeacherAuthorizedForSubject(teacherId, n.classId, n.subjectId);
    });
  },

  getAuthorizedAssessmentScores(teacherId: string, classId?: string, subjectId?: string): AssessmentScore[] {
    const scores = this.getAssessmentScores();
    const assessments = this.getAuthorizedAssessments(teacherId, classId, subjectId);
    const authorizedAssessmentIds = new Set(assessments.map(a => a.id));
    return scores.filter(s => authorizedAssessmentIds.has(s.assessmentId));
  },

  getBranchEnrollmentStats(): Array<{
    branch: Branch;
    branchId: string;
    branchName: string;
    code: string;
    studentCount: number;
    totalStudents: number;
    teacherCount: number;
    totalTeachers: number;
    classCount: number;
    totalClasses: number;
    capacity: number;
    totalCapacity: number;
    utilizationRate: number;
  }> {
    const branches = this.getBranches();
    const students = this.getStudents();
    const users = this.getUsers();
    const classes = this.getClasses();

    return branches.map(b => {
      const bStudents = students.filter(s => s.branchId === b.id);
      const bTeachers = users.filter(u => u.role === 'TEACHER' && u.branchId === b.id);
      const bClasses = classes.filter(c => c.branchId === b.id);
      const totalCapacity = bClasses.reduce((acc, c) => acc + (c.capacity || 30), 0) || (b.id === 'branch_bungalow' ? 450 : 350);
      const studentCount = bStudents.length;
      const utilizationRate = Math.round((studentCount / (totalCapacity || 1)) * 100);

      return {
        branch: b,
        branchId: b.id,
        branchName: b.name,
        code: b.code,
        studentCount,
        totalStudents: studentCount,
        teacherCount: bTeachers.length,
        totalTeachers: bTeachers.length,
        classCount: bClasses.length,
        totalClasses: bClasses.length,
        capacity: totalCapacity,
        totalCapacity,
        utilizationRate,
      };
    });
  },

  // Students
  getStudents(): Student[] {
    return getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },

  createStudent(student: Omit<Student, 'id' | 'studentId'>, actor: User): Student {
    const students = this.getStudents();
    const count = students.length + 1;
    const studentId = `STU-2026-${String(count).padStart(3, '0')}`;
    const newStudent: Student = {
      ...student,
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
    };
    students.push(newStudent);
    setItem(STORAGE_KEYS.STUDENTS, students);

    // Update class enrolled count
    const classes = this.getClasses();
    const clsIdx = classes.findIndex(c => c.id === newStudent.classId);
    if (clsIdx !== -1) {
      classes[clsIdx].enrolledCount += 1;
      setItem(STORAGE_KEYS.CLASSES, classes);
    }

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'STUDENT_ONBOARDED',
      'Student',
      newStudent.id,
      `Onboarded student ${newStudent.fullName} (${newStudent.studentId}) into ${newStudent.className}`
    );
    return newStudent;
  },

  bulkCreateStudents(studentsToCreate: Array<Omit<Student, 'id' | 'studentId'>>, actor: User): { created: Student[]; count: number } {
    const students = this.getStudents();
    const classes = this.getClasses();
    const created: Student[] = [];
    let currentCount = students.length;

    studentsToCreate.forEach((stData, index) => {
      currentCount += 1;
      const studentId = `STU-2026-${String(currentCount).padStart(3, '0')}`;
      const newStudent: Student = {
        ...stData,
        id: `stu_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        studentId,
        avatar: stData.avatar || `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80`,
        parentIds: stData.parentIds || [],
        status: stData.status || 'Enrolled',
      };
      students.push(newStudent);
      created.push(newStudent);

      // Increment class count
      const clsIdx = classes.findIndex(c => c.id === newStudent.classId);
      if (clsIdx !== -1) {
        classes[clsIdx].enrolledCount += 1;
      }
    });

    setItem(STORAGE_KEYS.STUDENTS, students);
    setItem(STORAGE_KEYS.CLASSES, classes);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BULK_STUDENTS_ENROLLED',
      'Student',
      'bulk_import',
      `Bulk enrolled ${created.length} students into class cohorts for academic session.`
    );

    return { created, count: created.length };
  },

  updateStudent(id: string, updates: Partial<Student>, actor: User): Student {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Student not found');
    const updated = { ...students[idx], ...updates };
    students[idx] = updated;
    setItem(STORAGE_KEYS.STUDENTS, students);
    this.addAuditLog(actor.id, actor.name, actor.role, 'STUDENT_UPDATED', 'Student', id, `Updated student profile for ${updated.fullName}`);
    return updated;
  },

  // Parents
  getParents(): Parent[] {
    return getItem<Parent[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
  },

  createParent(parent: Omit<Parent, 'id'>, actor: User): Parent {
    const parents = this.getParents();
    const newParent: Parent = {
      ...parent,
      id: `par_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    parents.push(newParent);
    setItem(STORAGE_KEYS.PARENTS, parents);

    // Also link parents to any linked student records
    if (newParent.linkedStudentIds && newParent.linkedStudentIds.length > 0) {
      const students = this.getStudents();
      students.forEach(s => {
        if (newParent.linkedStudentIds.includes(s.id) && !s.parentIds.includes(newParent.id)) {
          s.parentIds.push(newParent.id);
        }
      });
      setItem(STORAGE_KEYS.STUDENTS, students);
    }

    this.addAuditLog(actor.id, actor.name, actor.role, 'PARENT_ONBOARDED', 'User', newParent.id, `Onboarded parent ${newParent.fullName}`);
    return newParent;
  },

  linkParentToStudent(parentId: string, studentId: string, actor: User): void {
    const parents = this.getParents();
    const students = this.getStudents();

    const parent = parents.find(p => p.id === parentId);
    const student = students.find(s => s.id === studentId);

    if (parent && !parent.linkedStudentIds.includes(studentId)) {
      parent.linkedStudentIds.push(studentId);
      setItem(STORAGE_KEYS.PARENTS, parents);
    }

    if (student && !student.parentIds.includes(parentId)) {
      student.parentIds.push(parentId);
      setItem(STORAGE_KEYS.STUDENTS, students);
    }

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'PARENT_STUDENT_LINKED',
      'Student',
      studentId,
      `Linked parent ${parent?.fullName} to student ${student?.fullName}`
    );
  },

  // Attendance
  getAttendance(filter?: { classId?: string; studentId?: string; date?: string }): AttendanceRecord[] {
    let records = getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    if (!filter) return records;
    if (filter.classId) records = records.filter(r => r.classId === filter.classId);
    if (filter.studentId) records = records.filter(r => r.studentId === filter.studentId);
    if (filter.date) records = records.filter(r => r.date === filter.date);
    return records;
  },

  recordAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'timestamp'>[], actor: User): void {
    const existing = this.getAttendance();
    const timestamp = new Date().toISOString();
    
    // Remove existing records for the same class, date, and students to prevent duplicates
    const studentIds = new Set(records.map(r => r.studentId));
    const targetDate = records[0]?.date;
    const targetClass = records[0]?.classId;

    const filtered = existing.filter(
      e => !(e.date === targetDate && e.classId === targetClass && studentIds.has(e.studentId))
    );

    const newRecords: AttendanceRecord[] = records.map(r => ({
      ...r,
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
    }));

    setItem(STORAGE_KEYS.ATTENDANCE, [...filtered, ...newRecords]);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'ATTENDANCE_RECORDED',
      'Attendance',
      targetClass,
      `Recorded attendance for ${newRecords.length} students on ${targetDate}`
    );
  },

  // Assessments
  getAssessments(): Assessment[] {
    return getItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
  },

  createAssessment(assessment: Omit<Assessment, 'id'>, actor: User): Assessment {
    const list = this.getAssessments();
    const newAsm: Assessment = {
      ...assessment,
      id: `asm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    list.push(newAsm);
    setItem(STORAGE_KEYS.ASSESSMENTS, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'ASSESSMENT_CREATED',
      'Assessment',
      newAsm.id,
      `Created assessment "${newAsm.title}" for ${newAsm.className} (${newAsm.subjectName})`
    );
    return newAsm;
  },

  // Assessment Scores
  getAssessmentScores(): AssessmentScore[] {
    return getItem<AssessmentScore[]>(STORAGE_KEYS.ASSESSMENT_SCORES, INITIAL_ASSESSMENT_SCORES);
  },

  saveAssessmentScoresBatch(scores: Omit<AssessmentScore, 'id' | 'recordedAt'>[], actor: User): void {
    const existing = this.getAssessmentScores();
    const recordedAt = new Date().toISOString();
    const assessmentId = scores[0]?.assessmentId;

    const studentIds = new Set(scores.map(s => s.studentId));
    const filtered = existing.filter(
      e => !(e.assessmentId === assessmentId && studentIds.has(e.studentId))
    );

    const newScores: AssessmentScore[] = scores.map(s => ({
      ...s,
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recordedAt,
    }));

    setItem(STORAGE_KEYS.ASSESSMENT_SCORES, [...filtered, ...newScores]);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'SCORES_RECORDED',
      'Assessment',
      assessmentId,
      `Entered ${newScores.length} student scores for assessment`
    );
  },

  // Assignments
  getAssignments(): Assignment[] {
    return getItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },

  createAssignment(asg: Omit<Assignment, 'id' | 'createdAt'>, actor: User): Assignment {
    const list = this.getAssignments();
    const newAsg: Assignment = {
      ...asg,
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newAsg);
    setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'ASSIGNMENT_CREATED', 'Assessment', newAsg.id, `Created assignment "${newAsg.title}"`);
    return newAsg;
  },

  getSubmissions(): AssignmentSubmission[] {
    return getItem<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  },

  submitAssignment(sub: Omit<AssignmentSubmission, 'id' | 'submittedAt'>, actor: User): AssignmentSubmission {
    const submissions = this.getSubmissions();
    const newSub: AssignmentSubmission = {
      ...sub,
      id: `subm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: new Date().toISOString(),
    };
    submissions.push(newSub);
    setItem(STORAGE_KEYS.SUBMISSIONS, submissions);
    this.addAuditLog(actor.id, actor.name, actor.role, 'ASSIGNMENT_SUBMITTED', 'Assessment', newSub.id, `Submitted assignment work`);
    return newSub;
  },

  gradeSubmission(submissionId: string, score: number, feedback: string, actor: User): void {
    const list = this.getSubmissions();
    const sub = list.find(s => s.id === submissionId);
    if (sub) {
      sub.score = score;
      sub.feedback = feedback;
      sub.status = 'GRADED';
      setItem(STORAGE_KEYS.SUBMISSIONS, list);
      this.addAuditLog(actor.id, actor.name, actor.role, 'ASSIGNMENT_GRADED', 'Assessment', submissionId, `Graded submission for ${sub.studentName}`);
    }
  },

  // Lesson Plans
  getLessonPlans(): LessonPlan[] {
    return getItem<LessonPlan[]>(STORAGE_KEYS.LESSON_PLANS, INITIAL_LESSON_PLANS);
  },

  createLessonPlan(lp: Omit<LessonPlan, 'id' | 'createdAt'>, actor: User): LessonPlan {
    const list = this.getLessonPlans();
    const newLp: LessonPlan = {
      ...lp,
      id: `lp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newLp);
    setItem(STORAGE_KEYS.LESSON_PLANS, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'LESSON_PLAN_CREATED',
      'Settings',
      newLp.id,
      `Created lesson plan "${newLp.topic}" (${newLp.subjectName})`
    );
    return newLp;
  },

  saveLessonPlan(lp: Omit<LessonPlan, 'id' | 'createdAt'>, actor: User): LessonPlan {
    return this.createLessonPlan(lp, actor);
  },

  updateLessonPlan(id: string, updates: Partial<LessonPlan>, actor: User): LessonPlan {
    const list = this.getLessonPlans();
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lesson plan not found');
    const updated = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    setItem(STORAGE_KEYS.LESSON_PLANS, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'LESSON_PLAN_UPDATED', 'Settings', id, `Updated lesson plan "${updated.topic}"`);
    return updated;
  },

  deleteLessonPlan(id: string, actor: User): void {
    const list = this.getLessonPlans();
    const item = list.find(l => l.id === id);
    const updated = list.filter(l => l.id !== id);
    setItem(STORAGE_KEYS.LESSON_PLANS, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'LESSON_PLAN_DELETED', 'Settings', id, `Deleted lesson plan "${item?.topic || id}"`);
  },

  duplicateLessonPlan(id: string, actor: User): LessonPlan {
    const list = this.getLessonPlans();
    const source = list.find(l => l.id === id);
    if (!source) throw new Error('Source lesson plan not found');
    const newLp: LessonPlan = {
      ...source,
      id: `lp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      topic: `${source.topic} (Copy)`,
      status: 'PLANNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newLp);
    setItem(STORAGE_KEYS.LESSON_PLANS, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'LESSON_PLAN_DUPLICATED', 'Settings', newLp.id, `Duplicated lesson plan "${source.topic}"`);
    return newLp;
  },

  // Lesson Notes
  getLessonNotes(): LessonNote[] {
    return getItem<LessonNote[]>(STORAGE_KEYS.LESSON_NOTES, INITIAL_LESSON_NOTES);
  },

  createLessonNote(note: Omit<LessonNote, 'id' | 'createdAt' | 'updatedAt'>, actor: User): LessonNote {
    const list = this.getLessonNotes();
    const newNote: LessonNote = {
      ...note,
      id: `ln_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newNote);
    setItem(STORAGE_KEYS.LESSON_NOTES, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'LESSON_NOTE_CREATED',
      'Settings',
      newNote.id,
      `Created lesson note "${newNote.topic}" for ${newNote.subjectName}`
    );
    return newNote;
  },

  updateLessonNote(id: string, updates: Partial<LessonNote>, actor: User): LessonNote {
    const list = this.getLessonNotes();
    const idx = list.findIndex(n => n.id === id);
    if (idx === -1) throw new Error('Lesson note not found');
    const updated = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    setItem(STORAGE_KEYS.LESSON_NOTES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'LESSON_NOTE_UPDATED', 'Settings', id, `Updated lesson note "${updated.topic}"`);
    return updated;
  },

  deleteLessonNote(id: string, actor: User): void {
    const list = this.getLessonNotes();
    const item = list.find(n => n.id === id);
    const updated = list.filter(n => n.id !== id);
    setItem(STORAGE_KEYS.LESSON_NOTES, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'LESSON_NOTE_DELETED', 'Settings', id, `Deleted lesson note "${item?.topic || id}"`);
  },

  duplicateLessonNote(id: string, actor: User): LessonNote {
    const list = this.getLessonNotes();
    const source = list.find(n => n.id === id);
    if (!source) throw new Error('Source lesson note not found');
    const newNote: LessonNote = {
      ...source,
      id: `ln_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      topic: `${source.topic} (Copy)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newNote);
    setItem(STORAGE_KEYS.LESSON_NOTES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'LESSON_NOTE_DUPLICATED', 'Settings', newNote.id, `Duplicated lesson note "${source.topic}"`);
    return newNote;
  },

  // Class Announcements
  getClassAnnouncements(classId?: string): ClassAnnouncement[] {
    const list = getItem<ClassAnnouncement[]>(STORAGE_KEYS.CLASS_ANNOUNCEMENTS, INITIAL_CLASS_ANNOUNCEMENTS);
    if (classId) return list.filter(a => a.classId === classId);
    return list;
  },

  createClassAnnouncement(ann: Omit<ClassAnnouncement, 'id' | 'createdAt'>, actor: User): ClassAnnouncement {
    const list = this.getClassAnnouncements();
    const newAnn: ClassAnnouncement = {
      ...ann,
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newAnn);
    setItem(STORAGE_KEYS.CLASS_ANNOUNCEMENTS, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'ANNOUNCEMENT_POSTED', 'Settings', newAnn.id, `Posted class announcement "${newAnn.title}"`);
    return newAnn;
  },

  deleteClassAnnouncement(id: string, actor: User): void {
    const list = this.getClassAnnouncements();
    const item = list.find(a => a.id === id);
    const updated = list.filter(a => a.id !== id);
    setItem(STORAGE_KEYS.CLASS_ANNOUNCEMENTS, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'ANNOUNCEMENT_DELETED', 'Settings', id, `Deleted announcement "${item?.title || id}"`);
  },

  // Quizzes
  getQuizzes(): Quiz[] {
    return getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, []);
  },

  saveQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>, actor: User): Quiz {
    const list = this.getQuizzes();
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newQuiz);
    setItem(STORAGE_KEYS.QUIZZES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'QUIZ_CREATED', 'AI', newQuiz.id, `Created interactive quiz "${newQuiz.title}"`);
    return newQuiz;
  },

  // ==========================================
  // Behavior Categories Management
  // ==========================================
  getBehaviorCategories(): BehaviorCategory[] {
    return getItem<BehaviorCategory[]>(STORAGE_KEYS.BEHAVIOR_CATEGORIES, INITIAL_BEHAVIOR_CATEGORIES);
  },

  createBehaviorCategory(cat: Omit<BehaviorCategory, 'id'>, actor: User): BehaviorCategory {
    const list = this.getBehaviorCategories();
    const newCat: BehaviorCategory = {
      ...cat,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    list.push(newCat);
    setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'BEHAVIOR_CATEGORY_CREATED', 'Settings', newCat.id, `Created behavior category "${newCat.name}"`);
    return newCat;
  },

  updateBehaviorCategory(id: string, updates: Partial<BehaviorCategory>, actor: User): BehaviorCategory {
    const list = this.getBehaviorCategories();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'BEHAVIOR_CATEGORY_UPDATED', 'Settings', id, `Updated behavior category "${updated.name}"`);
    return updated;
  },

  deleteBehaviorCategory(id: string, actor: User): void {
    const list = this.getBehaviorCategories();
    const item = list.find(c => c.id === id);
    const updated = list.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'BEHAVIOR_CATEGORY_DELETED', 'Settings', id, `Deleted behavior category "${item?.name || id}"`);
  },

  toggleBehaviorCategory(id: string, actor: User): BehaviorCategory {
    const list = this.getBehaviorCategories();
    const cat = list.find(c => c.id === id);
    if (!cat) throw new Error('Category not found');
    cat.isActive = !cat.isActive;
    setItem(STORAGE_KEYS.BEHAVIOR_CATEGORIES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'BEHAVIOR_CATEGORY_TOGGLED', 'Settings', id, `${cat.isActive ? 'Activated' : 'Deactivated'} category "${cat.name}"`);
    return cat;
  },

  // ==========================================
  // Behavior Records & Timeline (Role-Based Permissions)
  // ==========================================
  getBehaviorRecords(options?: {
    studentId?: string;
    classId?: string;
    branchId?: string;
    status?: BehaviorStatusType;
    category?: string;
    user?: User;
  }): BehaviorRecord[] {
    let list = getItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR, INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS);

    // Apply strict role-based visibility filter
    if (options?.user) {
      const u = options.user;
      if (u.role === 'PARENT') {
        const parents = this.getParents();
        const parent = parents.find(p => p.id === u.id || p.email.toLowerCase() === u.email.toLowerCase());
        const linkedIds = parent?.linkedStudentIds || [];
        // Strict guard: Parents can ONLY see published records of their linked children
        list = list.filter(
          r =>
            linkedIds.includes(r.studentId) &&
            r.isPublishedToParent !== false &&
            r.visibility !== 'CONFIDENTIAL_ADMIN' &&
            r.visibility !== 'STAFF_ONLY'
        );
      } else if (u.role === 'STUDENT') {
        list = list.filter(
          r =>
            r.studentId === u.id &&
            r.isPublishedToParent !== false &&
            r.visibility !== 'CONFIDENTIAL_ADMIN' &&
            r.visibility !== 'STAFF_ONLY'
        );
      } else if (u.role === 'ADMIN') {
        if (u.branchId) {
          list = list.filter(r => !r.branchId || r.branchId === u.branchId);
        }
      }
      // Super admin sees all records across branches
    }

    if (options?.studentId) {
      list = list.filter(r => r.studentId === options.studentId);
    }
    if (options?.classId) {
      list = list.filter(r => r.classId === options.classId);
    }
    if (options?.branchId && options.branchId !== 'all') {
      list = list.filter(r => !r.branchId || r.branchId === options.branchId);
    }
    if (options?.status) {
      list = list.filter(r => r.status === options.status);
    }
    if (options?.category) {
      list = list.filter(r => r.category === options.category);
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getBehaviorRecord(id: string): BehaviorRecord | undefined {
    const list = this.getBehaviorRecords();
    return list.find(r => r.id === id);
  },

  addBehaviorRecord(rec: Omit<BehaviorRecord, 'id' | 'createdAt' | 'updatedAt'>, actor: User): BehaviorRecord {
    const list = getItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR, INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS);
    const newRec: BehaviorRecord = {
      ...rec,
      id: `beh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newRec);
    setItem(STORAGE_KEYS.BEHAVIOR, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BEHAVIOR_RECORDED',
      'Student',
      rec.studentId,
      `Recorded ${rec.status} (${rec.category}) observation for ${rec.studentName}`
    );
    return newRec;
  },

  updateBehaviorRecord(id: string, updates: Partial<BehaviorRecord>, actor: User): BehaviorRecord {
    const list = getItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR, INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Behavior record not found');
    const updated = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    setItem(STORAGE_KEYS.BEHAVIOR, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'BEHAVIOR_RECORD_UPDATED', 'Student', updated.studentId, `Updated behavior log for ${updated.studentName}`);
    return updated;
  },

  deleteBehaviorRecord(id: string, actor: User): void {
    const list = getItem<BehaviorRecord[]>(STORAGE_KEYS.BEHAVIOR, INITIAL_COMPREHENSIVE_BEHAVIOR_RECORDS);
    const item = list.find(r => r.id === id);
    const updated = list.filter(r => r.id !== id);
    setItem(STORAGE_KEYS.BEHAVIOR, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'BEHAVIOR_RECORD_DELETED', 'Student', item?.studentId || id, `Deleted behavior record for ${item?.studentName || id}`);
  },

  getStudentBehaviorTimeline(studentId: string, viewer?: User): BehaviorRecord[] {
    return this.getBehaviorRecords({ studentId, user: viewer });
  },

  getBehaviorStatsForStudent(studentId: string) {
    const records = this.getBehaviorRecords({ studentId });
    const positiveCount = records.filter(r => r.status === 'Positive').length;
    const neutralCount = records.filter(r => r.status === 'Neutral').length;
    const concernCount = records.filter(r => r.status === 'Concern').length;
    const incidentCount = records.filter(r => r.status === 'Incident').length;
    const totalPoints = records.reduce((acc, r) => acc + (r.points || 0), 0);

    const categoryMap: Record<string, number> = {};
    records.forEach(r => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
    });

    return {
      totalRecords: records.length,
      positiveCount,
      neutralCount,
      concernCount,
      incidentCount,
      totalPoints,
      categoryCounts: categoryMap,
      latestRecord: records[0] || null,
    };
  },

  getBehaviorStatsForClass(classId: string) {
    const records = this.getBehaviorRecords({ classId });
    const positiveCount = records.filter(r => r.status === 'Positive').length;
    const neutralCount = records.filter(r => r.status === 'Neutral').length;
    const concernCount = records.filter(r => r.status === 'Concern').length;
    const incidentCount = records.filter(r => r.status === 'Incident').length;

    return {
      totalRecords: records.length,
      positiveCount,
      neutralCount,
      concernCount,
      incidentCount,
      conductIndex: records.length > 0 ? Math.round(((positiveCount + neutralCount * 0.5) / records.length) * 100) : 100,
    };
  },

  // ==========================================
  // Student & Class Status Reports
  // ==========================================
  getStudentStatusReports(options?: { studentId?: string; classId?: string; term?: string }): StudentStatusReport[] {
    let list = getItem<StudentStatusReport[]>(STORAGE_KEYS.STUDENT_STATUS_REPORTS, INITIAL_STUDENT_STATUS_REPORTS);
    if (options?.studentId) {
      list = list.filter(r => r.studentId === options.studentId);
    }
    if (options?.classId) {
      list = list.filter(r => r.classId === options.classId);
    }
    if (options?.term) {
      list = list.filter(r => r.term === options.term);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getStudentStatusReport(id: string): StudentStatusReport | undefined {
    const list = this.getStudentStatusReports();
    return list.find(r => r.id === id);
  },

  createStudentStatusReport(report: Omit<StudentStatusReport, 'id' | 'createdAt' | 'updatedAt'>, actor: User): StudentStatusReport {
    const list = getItem<StudentStatusReport[]>(STORAGE_KEYS.STUDENT_STATUS_REPORTS, INITIAL_STUDENT_STATUS_REPORTS);
    const newReport: StudentStatusReport = {
      ...report,
      id: `sr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newReport);
    setItem(STORAGE_KEYS.STUDENT_STATUS_REPORTS, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'STATUS_REPORT_GENERATED',
      'Report',
      newReport.id,
      `Generated ${newReport.reportType} status report for ${newReport.studentName || newReport.className}`
    );
    return newReport;
  },

  updateStudentStatusReport(id: string, updates: Partial<StudentStatusReport>, actor: User): StudentStatusReport {
    const list = getItem<StudentStatusReport[]>(STORAGE_KEYS.STUDENT_STATUS_REPORTS, INITIAL_STUDENT_STATUS_REPORTS);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Status report not found');
    const updated = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    setItem(STORAGE_KEYS.STUDENT_STATUS_REPORTS, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'STATUS_REPORT_UPDATED', 'Report', id, `Updated status report for ${updated.studentName || updated.className}`);
    return updated;
  },

  deleteStudentStatusReport(id: string, actor: User): void {
    const list = getItem<StudentStatusReport[]>(STORAGE_KEYS.STUDENT_STATUS_REPORTS, INITIAL_STUDENT_STATUS_REPORTS);
    const item = list.find(r => r.id === id);
    const updated = list.filter(r => r.id !== id);
    setItem(STORAGE_KEYS.STUDENT_STATUS_REPORTS, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'STATUS_REPORT_DELETED', 'Report', id, `Deleted status report for ${item?.studentName || id}`);
  },

  // Generates automatic data draft for Student Status Report
  generateStudentStatusReportDraft(studentId: string, term: string, actor: User): Omit<StudentStatusReport, 'id' | 'createdAt' | 'updatedAt'> {
    const student = this.getStudent(studentId);
    if (!student) throw new Error('Student not found');
    const classRoom = this.getClass(student.classId);
    const scores = this.getAssessmentScores().filter(s => s.studentId === studentId);
    const attendances = this.getAttendance({ studentId });
    const behaviors = this.getBehaviorRecords({ studentId });

    // Academic calculations
    const scoreValues = scores.map(s => s.score);
    const overallAverage = scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 82;

    const topScores = [...scores].sort((a, b) => b.score - a.score).slice(0, 3);
    const lowScores = [...scores].sort((a, b) => a.score - b.score).slice(0, 2);

    // Attendance calculations
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length || 22;
    const lateDays = attendances.filter(a => a.status === 'LATE').length || 1;
    const absentDays = attendances.filter(a => a.status === 'ABSENT').length || 0;
    const totalDays = Math.max(presentDays + lateDays + absentDays, 1);
    const attendanceRate = Math.round(((presentDays + lateDays) / totalDays) * 100);

    // Behavior calculations
    const positiveCount = behaviors.filter(b => b.status === 'Positive').length;
    const concernCount = behaviors.filter(b => b.status === 'Concern').length;
    const incidentCount = behaviors.filter(b => b.status === 'Incident').length;

    let conductRating = 'Exemplary';
    if (concernCount > 2 || incidentCount > 1) conductRating = 'Requires Guidance';
    else if (concernCount > 0) conductRating = 'Satisfactory';

    return {
      reportType: 'INDIVIDUAL',
      studentId: student.id,
      studentName: student.fullName,
      studentAvatar: student.avatar,
      studentAdmissionNo: student.studentId,
      classId: student.classId,
      className: student.className,
      branchId: student.branchId,
      branchName: student.branchName || classRoom?.branchName,
      academicYear: '2025/2026',
      term: term || 'First Term',
      date: new Date().toISOString().split('T')[0],
      teacherId: actor.id,
      teacherName: actor.name,
      academicSummary: {
        overallAverage,
        topSubjects: topScores.map(s => `${s.subjectName} (${s.score}%)`),
        strugglingSubjects: lowScores.filter(s => s.score < 75).map(s => `${s.subjectName} (${s.score}%)`),
        assessmentCount: scores.length,
        letterGrade: overallAverage >= 80 ? 'A' : overallAverage >= 70 ? 'B' : overallAverage >= 60 ? 'C' : 'D',
      },
      attendanceSummary: {
        attendanceRate,
        presentDays,
        absentDays,
        lateDays,
        punctualityRating: lateDays === 0 ? 'Excellent' : lateDays <= 2 ? 'Good' : 'Needs Improvement',
      },
      behaviorSummary: {
        positiveCount,
        concernCount,
        incidentCount,
        conductRating,
        keyHighlights: behaviors.slice(0, 3).map(b => b.headline || b.observation.slice(0, 50)),
      },
      participationNotes: `${student.fullName} engages actively in class activities, demonstrating keen interest during classroom discussions and collaborating well with peers.`,
      strengths: [
        'Demonstrates consistent academic effort across core subjects',
        'Follows classroom rules and shows respect to teachers and classmates',
        'Participates with enthusiasm during hands-on exercises',
      ],
      areasForImprovement: [
        'Refine revision discipline before timed examinations',
        'Maintain consistent neatness in handwriting and workbook exercises',
      ],
      teacherObservations: `${student.fullName} has made commendable progress this term in cognitive and social growth. Continues to show dedication to learning.`,
      generalProgress: 'Steady and positive trajectory across academic and behavioral domains.',
      recommendations: 'Maintain home reading schedule and practice mental math exercises regularly.',
      importantIncidents: incidentCount > 0 ? `${incidentCount} pastoral incident(s) logged and addressed with constructive guidance.` : 'No critical disciplinary incidents recorded.',
    };
  },

  // Generates automatic data draft for Entire Class Status Report
  generateClassStatusReportDraft(classId: string, term: string, actor: User): Omit<StudentStatusReport, 'id' | 'createdAt' | 'updatedAt'> {
    const classRoom = this.getClass(classId);
    const students = this.getStudents().filter(s => s.classId === classId);
    const classScores = this.getAssessmentScores().filter(s => s.classId === classId);
    const classAttendance = this.getAttendance({ classId });
    const classBehaviors = this.getBehaviorRecords({ classId });

    const avgScore = classScores.length > 0
      ? Math.round(classScores.reduce((a, b) => a + b.score, 0) / classScores.length)
      : 84;

    const presentCount = classAttendance.filter(a => a.status === 'PRESENT').length;
    const lateCount = classAttendance.filter(a => a.status === 'LATE').length;
    const absentCount = classAttendance.filter(a => a.status === 'ABSENT').length;
    const totalAtt = Math.max(presentCount + lateCount + absentCount, 1);
    const attRate = Math.round(((presentCount + lateCount) / totalAtt) * 100);

    const positiveCount = classBehaviors.filter(b => b.status === 'Positive').length;
    const concernCount = classBehaviors.filter(b => b.status === 'Concern').length;
    const incidentCount = classBehaviors.filter(b => b.status === 'Incident').length;

    return {
      reportType: 'CLASS',
      classId,
      className: classRoom?.name || 'Class Cohort',
      branchId: classRoom?.branchId,
      branchName: classRoom?.branchName,
      academicYear: '2025/2026',
      term: term || 'First Term',
      date: new Date().toISOString().split('T')[0],
      teacherId: actor.id,
      teacherName: actor.name,
      academicSummary: {
        overallAverage: avgScore,
        topSubjects: ['Mathematics (86%)', 'English Studies (84%)', 'Basic Science (88%)'],
        strugglingSubjects: [],
        assessmentCount: classScores.length,
        letterGrade: avgScore >= 80 ? 'A' : 'B',
      },
      attendanceSummary: {
        attendanceRate: attRate || 96,
        presentDays: presentCount,
        absentDays: absentCount,
        lateDays: lateCount,
        punctualityRating: 'High Class Punctuality',
      },
      behaviorSummary: {
        positiveCount,
        concernCount,
        incidentCount,
        conductRating: 'Positive Class Culture',
        keyHighlights: ['Strong peer collaboration', 'High homework completion', 'Clean classroom environment banner winners'],
      },
      participationNotes: `The ${classRoom?.name} cohort demonstrates lively interaction during whole-class inquiries and group projects.`,
      strengths: [
        'High average attendance and enthusiastic participation in STEM lessons',
        'Strong sense of community and mutual respect among pupils',
        'Commitment to continuous assessment schedules',
      ],
      areasForImprovement: [
        'Targeted phonics & spelling support for identified student sub-groups',
        'Encouraging quieter pupils to speak up during whole-class presentations',
      ],
      teacherObservations: `The entire ${classRoom?.name} class is performing commendably. Pacing remains on schedule for the academic term.`,
      generalProgress: 'Excellent collective academic advancement and disciplined classroom conduct.',
      recommendations: 'Continue weekly quizzes, interactive reading circles, and reward charts for house points.',
      importantIncidents: `${incidentCount} total incident(s) handled effectively via restorative pastoral resolution.`,
    };
  },

  // ==========================================
  // Weekly Teacher Status Reports (Form Teacher Workflow)
  // ==========================================
  getWeeklyTeacherReports(options?: {
    classId?: string;
    teacherId?: string;
    branchId?: string;
    status?: WeeklyReportStatus;
    user?: User;
  }): WeeklyTeacherReport[] {
    let list = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);

    if (options?.user) {
      const u = options.user;
      if (u.role === 'TEACHER') {
        // Teacher sees reports they authored or for their assigned classes
        list = list.filter(r => r.teacherId === u.id || (u.assignedClasses || []).includes(r.classId));
      } else if (u.role === 'ADMIN') {
        // Branch Admin sees reports from their campus/branch
        if (u.branchId) {
          list = list.filter(r => !r.branchId || r.branchId === u.branchId);
        }
      }
      // Super Admin sees all reports across all branches
    }

    if (options?.classId) {
      list = list.filter(r => r.classId === options.classId);
    }
    if (options?.teacherId) {
      list = list.filter(r => r.teacherId === options.teacherId);
    }
    if (options?.branchId && options.branchId !== 'all') {
      list = list.filter(r => !r.branchId || r.branchId === options.branchId);
    }
    if (options?.status) {
      list = list.filter(r => r.status === options.status);
    }

    return list.sort((a, b) => b.weekNumber - a.weekNumber);
  },

  getWeeklyTeacherReport(id: string): WeeklyTeacherReport | undefined {
    const list = this.getWeeklyTeacherReports();
    return list.find(r => r.id === id);
  },

  createWeeklyTeacherReport(report: Omit<WeeklyTeacherReport, 'id' | 'createdAt' | 'updatedAt'>, actor: User): WeeklyTeacherReport {
    const list = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
    const newReport: WeeklyTeacherReport = {
      ...report,
      id: `wtr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newReport);
    setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'WEEKLY_REPORT_CREATED',
      'Report',
      newReport.id,
      `Created Week ${newReport.weekNumber} Status Report for ${newReport.className} (${newReport.status})`
    );
    return newReport;
  },

  updateWeeklyTeacherReport(id: string, updates: Partial<WeeklyTeacherReport>, actor: User): WeeklyTeacherReport {
    const list = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Weekly report not found');
    const updated = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'WEEKLY_REPORT_UPDATED', 'Report', id, `Updated Week ${updated.weekNumber} Status Report for ${updated.className}`);
    return updated;
  },

  deleteWeeklyTeacherReport(id: string, actor: User): void {
    const list = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
    const item = list.find(r => r.id === id);
    const updated = list.filter(r => r.id !== id);
    setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'WEEKLY_REPORT_DELETED', 'Report', id, `Deleted Week ${item?.weekNumber} Status Report for ${item?.className || id}`);
  },

  submitWeeklyTeacherReport(id: string, actor: User): WeeklyTeacherReport {
    const list = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
    const report = list.find(r => r.id === id);
    if (!report) throw new Error('Weekly report not found');
    report.status = 'SUBMITTED';
    report.submittedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, list);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'WEEKLY_REPORT_SUBMITTED',
      'Report',
      id,
      `Submitted Week ${report.weekNumber} report for ${report.className} to ${report.recipientAdminName || 'Branch Administrator'}`
    );
    return report;
  },

  reviewWeeklyTeacherReport(
    id: string,
    status: 'REVIEWED' | 'RETURNED' | 'APPROVED',
    feedback: string,
    admin: User
  ): WeeklyTeacherReport {
    const list = getItem<WeeklyTeacherReport[]>(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, INITIAL_WEEKLY_TEACHER_REPORTS);
    const report = list.find(r => r.id === id);
    if (!report) throw new Error('Weekly report not found');
    report.status = status;
    report.reviewedAt = new Date().toISOString();
    report.reviewedByAdminId = admin.id;
    report.reviewedByAdminName = admin.name;
    report.adminFeedback = feedback;
    report.updatedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.WEEKLY_TEACHER_REPORTS, list);
    this.addAuditLog(
      admin.id,
      admin.name,
      admin.role,
      'WEEKLY_REPORT_REVIEWED',
      'Report',
      id,
      `Admin ${status.toLowerCase()} Week ${report.weekNumber} report for ${report.className} (${feedback.slice(0, 40)}...)`
    );
    return report;
  },

  generateWeeklyReportDraft(classId: string, weekNumber: number, term: string, actor: User): Omit<WeeklyTeacherReport, 'id' | 'createdAt' | 'updatedAt'> {
    const classRoom = this.getClass(classId);
    const students = this.getStudents().filter(s => s.classId === classId);
    const attendance = this.getAttendance({ classId });
    const behaviors = this.getBehaviorRecords({ classId });
    const lessonNotes = this.getLessonNotes().filter(n => n.classId === classId && n.weekNumber === weekNumber);

    // Compute metrics
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const totalAtt = Math.max(attendance.length, 1);
    const avgRate = Math.round((presentCount / totalAtt) * 100) || 96;

    const posBehaviors = behaviors.filter(b => b.status === 'Positive');
    const concernBehaviors = behaviors.filter(b => b.status === 'Concern');

    // Dates
    const today = new Date();
    const startDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    // Branch Admin recipient
    const admins = this.getUsers().filter(u => u.role === 'ADMIN');
    const branchAdmin = admins.find(a => a.branchId === classRoom?.branchId) || admins[0];

    const noteTopics = lessonNotes.map(n => `${n.subjectName}: ${n.topic}`).join('. ');

    return {
      weekNumber,
      term: term || 'First Term',
      academicYear: '2025/2026',
      startDate,
      endDate,
      classId,
      className: classRoom?.name || 'Class Cohort',
      branchId: classRoom?.branchId || 'branch_bungalow',
      branchName: classRoom?.branchName || 'ZITEL CASTLE SCHOOL',
      teacherId: actor.id,
      teacherName: actor.name,
      recipientRole: 'BRANCH_ADMIN',
      recipientAdminId: branchAdmin?.id,
      recipientAdminName: branchAdmin?.name || 'Branch Administrator',
      classActivities: noteTopics || `Covered core modules in Mathematics, English Studies, and Basic Science. Conducted weekly practical activities and classroom exercises with active student participation.`,
      academicProgress: `Weekly continuous assessment completed with encouraging results. ${students.length} pupils completed all required classroom tasks and weekly homework assignments.`,
      attendanceMetrics: {
        totalDays: 5,
        presentCount,
        averageRate: avgRate,
        notes: `Class attendance remained strong at ${avgRate}%. Punctuality was commendable across morning assemblies.`,
      },
      behavioralObservations: `Classroom atmosphere was respectful and orderly. Observed ${posBehaviors.length} positive conduct milestones. Mutual cooperation during group work was excellent.`,
      significantEvents: `Class completed the weekly reading circles and participated enthusiastically in the Friday academic quiz session.`,
      studentConcerns: concernBehaviors.length > 0
        ? `${concernBehaviors.length} student concern(s) logged regarding homework completion and concentration; remedial support scheduled.`
        : `No critical academic or behavioral concerns noted. Two students given brief recap on fraction conversions.`,
      studentAchievements: posBehaviors.length > 0
        ? `${posBehaviors.slice(0, 2).map(b => `${b.studentName} (${b.headline || b.category})`).join(', ')} awarded Star Pupil commendations.`
        : `High overall enthusiasm and clean classroom compliance award.`,
      generalClassProgress: `Curriculum pacing is right on target for Week ${weekNumber}. Students are actively demonstrating mastery of weekly learning objectives.`,
      issuesRequiringAdminAttention: `Routine supplies top-up requested (whiteboard markers, graph workbooks). Room facilities in good working condition.`,
      teacherRecommendations: `Encourage parents to monitor daily reading records in student diaries over the weekend.`,
      status: 'DRAFT',
    };
  },

  // Fees & Finance
  getFeeStructures(): FeeStructure[] {
    return getItem<FeeStructure[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES);
  },

  createFeeStructure(structure: Omit<FeeStructure, 'id'>, actor: User): FeeStructure {
    const list = this.getFeeStructures();
    const newStructure: FeeStructure = {
      ...structure,
      id: `fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    list.push(newStructure);
    setItem(STORAGE_KEYS.FEE_STRUCTURES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'FEE_STRUCTURE_CREATED', 'Fee', newStructure.id, `Created fee structure "${newStructure.name}"`);
    return newStructure;
  },

  // Helper to dynamically calculate fee item statuses, paid amounts, and remaining balances
  recalculateInvoiceFeeItems(inv: Invoice): Invoice {
    const totalInvPaid = Number(inv.paidAmount) || 0;
    let remainingToAllocate = totalInvPaid;

    const items = (inv.items || []).map((item, idx) => {
      const itemAmount = Number(item.amount) || 0;
      let itemPaid = 0;

      if (remainingToAllocate >= itemAmount) {
        itemPaid = itemAmount;
        remainingToAllocate -= itemAmount;
      } else if (remainingToAllocate > 0) {
        itemPaid = remainingToAllocate;
        remainingToAllocate = 0;
      } else {
        itemPaid = 0;
      }

      const itemBalance = Math.max(0, itemAmount - itemPaid);
      let itemStatus: 'Paid' | 'Partial' | 'Pending' = 'Pending';
      if (itemPaid >= itemAmount && itemAmount > 0) {
        itemStatus = 'Paid';
      } else if (itemPaid > 0) {
        itemStatus = 'Partial';
      } else {
        itemStatus = 'Pending';
      }

      return {
        ...item,
        id: item.id || `item_${inv.id}_${idx + 1}`,
        amount: itemAmount,
        paidAmount: itemPaid,
        balance: itemBalance,
        status: itemStatus,
      };
    });

    const totalAmount = items.reduce((sum, it) => sum + it.amount, 0) || Number(inv.totalAmount) || 0;
    const paidAmount = Math.min(totalAmount, totalInvPaid);
    const balance = Math.max(0, totalAmount - paidAmount);

    let status: Invoice['status'] = 'UNPAID';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else {
      const isPastDue = inv.dueDate && new Date(inv.dueDate).getTime() < Date.now();
      status = isPastDue ? 'OVERDUE' : 'UNPAID';
    }

    return {
      ...inv,
      items,
      totalAmount,
      paidAmount,
      balance,
      status,
    };
  },

  getInvoices(actor?: User): Invoice[] {
    const raw = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const enriched = raw.map(inv => this.recalculateInvoiceFeeItems(inv));

    if (!actor) return enriched;

    // Role-Based Access Control (RBAC)
    if (actor.role === 'PARENT') {
      return enriched.filter(
        i =>
          i.parentId === actor.id ||
          actor.linkedStudentIds?.includes(i.studentId) ||
          actor.childrenIds?.includes(i.studentId)
      );
    }

    // Branch Admin Scoping: Restrict to assigned branch if branchId is set
    if (
      (actor.role === 'ADMIN' || (actor.role as string) === 'BRANCH_ADMIN') &&
      actor.branchId &&
      actor.scope !== 'ALL_SCHOOL' &&
      actor.scope !== 'FINANCE_ONLY'
    ) {
      return enriched.filter(i => i.branchId === actor.branchId);
    }

    return enriched;
  },

  createInvoice(inv: Omit<Invoice, 'id' | 'createdAt'>, actor: User): Invoice {
    const list = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const rawInv: Invoice = {
      ...inv,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const newInv = this.recalculateInvoiceFeeItems(rawInv);
    list.push(newInv);
    setItem(STORAGE_KEYS.INVOICES, list);
    this.addAuditLog(actor.id, actor.name, actor.role, 'INVOICE_GENERATED', 'Fee', newInv.id, `Generated invoice ${newInv.invoiceNumber} for ${newInv.studentName}`);
    return newInv;
  },

  getPayments(actor?: User): FeePayment[] {
    const payments = getItem<FeePayment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);

    if (!actor) return payments;

    // Role-Based Access Control (RBAC)
    if (actor.role === 'PARENT') {
      return payments.filter(
        p =>
          p.parentId === actor.id ||
          actor.linkedStudentIds?.includes(p.studentId) ||
          actor.childrenIds?.includes(p.studentId)
      );
    }

    // Branch Admin Scoping
    if (
      (actor.role === 'ADMIN' || (actor.role as string) === 'BRANCH_ADMIN') &&
      actor.branchId &&
      actor.scope !== 'ALL_SCHOOL' &&
      actor.scope !== 'FINANCE_ONLY'
    ) {
      return payments.filter(p => p.branchId === actor.branchId);
    }

    return payments;
  },

  recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: FeePayment['paymentMethod'],
    actor: User
  ): FeePayment {
    const rawInvoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const inv = rawInvoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const payments = this.getPayments();
    const receiptNumber = `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: FeePayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceId,
      invoiceNumber: inv.invoiceNumber,
      studentId: inv.studentId,
      studentName: inv.studentName,
      branchId: inv.branchId,
      branchName: inv.branchName,
      parentId: inv.parentId,
      parentName: inv.parentName,
      amount,
      paymentMethod,
      transactionRef: `TXN-${Date.now().toString().slice(-8)}`,
      receiptNumber,
      paidAt: new Date().toISOString(),
      receivedBy: actor.name,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: actor.name,
    };
    payments.unshift(newPayment);
    setItem(STORAGE_KEYS.PAYMENTS, payments);

    // Update invoice paid amount and recalculate all fee item breakdown statuses
    inv.paidAmount = (Number(inv.paidAmount) || 0) + Number(amount);
    const updatedInv = this.recalculateInvoiceFeeItems(inv);
    const invIdx = rawInvoices.findIndex(i => i.id === invoiceId);
    if (invIdx !== -1) {
      rawInvoices[invIdx] = updatedInv;
    }
    setItem(STORAGE_KEYS.INVOICES, rawInvoices);

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'PAYMENT_RECORDED',
      'Fee',
      invoiceId,
      `Recorded direct payment of ${this.getSchoolProfile().currencySymbol || '₦'}${amount.toLocaleString()} for ${inv.studentName} (Receipt: ${receiptNumber})`
    );

    return newPayment;
  },

  // Manual payment verification submission from parent
  submitManualPaymentProof(params: {
    invoiceId: string;
    amount: number;
    paymentMethod: FeePayment['paymentMethod'];
    transactionRef?: string;
    paymentReference?: string;
    paymentDate?: string;
    bankName?: string;
    accountHolderName?: string;
    proofUrl?: string;
    proofFileName?: string;
    parentUser: User;
  }): FeePayment {
    const rawInvoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const inv = rawInvoices.find(i => i.id === params.invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const students = this.getStudents();
    const student = students.find(s => s.id === inv.studentId);

    const payments = this.getPayments();
    const cleanRef = params.paymentReference || `ZCS-${student?.admissionNumber || student?.id.replace('stu_', '').toUpperCase().slice(0, 4) || 'LEO1'}-${inv.invoiceNumber.replace(/[^0-9]/g, '').slice(-4) || '2041'}`;

    const newPayment: FeePayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentId: inv.studentId,
      studentName: inv.studentName,
      studentCode: student?.admissionNumber || student?.id || 'ZCS-2024-001',
      className: inv.className,
      parentId: inv.parentId,
      parentName: inv.parentName,
      branchId: inv.branchId,
      branchName: inv.branchName,
      term: inv.term,
      academicYear: inv.academicYear,
      amount: params.amount,
      paymentMethod: params.paymentMethod || 'Bank Transfer',
      transactionRef: params.transactionRef || `TRF-${Date.now().toString().slice(-6)}`,
      paymentReference: cleanRef,
      paidAt: params.paymentDate ? new Date(params.paymentDate).toISOString() : new Date().toISOString(),
      receivedBy: 'Pending Bursar Verification',
      status: 'PENDING_VERIFICATION',
      bankName: params.bankName,
      accountHolderName: params.accountHolderName || params.parentUser.name,
      proofUrl: params.proofUrl,
      proofFileName: params.proofFileName,
    };

    payments.unshift(newPayment);
    setItem(STORAGE_KEYS.PAYMENTS, payments);

    // Notify School Finance & Bursary Admins (respecting branch scope)
    const currency = this.getSchoolProfile().currencySymbol || '₦';
    const admins = this.getUsers().filter(u => {
      if (u.role === 'SUPER_ADMIN') return true;
      if (u.role === 'ADMIN') {
        if (!u.branchId || u.branchId === inv.branchId || u.scope === 'ALL_SCHOOL' || u.scope === 'FINANCE_ONLY') return true;
      }
      return false;
    });

    admins.forEach(adm => {
      this.addNotification({
        userId: adm.id,
        title: 'New Fee Payment Verification Required',
        message: `${params.parentUser.name} submitted proof of payment (${currency}${params.amount.toLocaleString()}) for ${inv.studentName} (Ref: ${cleanRef}).`,
        type: 'FEE',
        actionLink: 'finance',
      });
    });

    this.addAuditLog(
      params.parentUser.id,
      params.parentUser.name,
      params.parentUser.role,
      'PAYMENT_PROOF_SUBMITTED',
      'Fee',
      inv.id,
      `Submitted bank transfer payment proof of ${currency}${params.amount.toLocaleString()} for ${inv.studentName} (Ref: ${cleanRef})`
    );

    return newPayment;
  },

  // Admin approves or rejects manual fee payment proof
  verifyManualPayment(
    paymentId: string,
    action: 'APPROVE' | 'REJECT',
    adminRemarks: string,
    actor: User,
    rejectionReason?: string
  ): FeePayment {
    const payments = getItem<FeePayment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const inv = invoices.find(i => i.id === payment.invoiceId);

    const currency = this.getSchoolProfile().currencySymbol || '₦';

    if (action === 'APPROVE') {
      payment.status = 'VERIFIED';
      payment.receiptNumber = `ZCS-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      payment.receivedBy = actor.name;
      payment.verifiedAt = new Date().toISOString();
      payment.verifiedBy = actor.name;
      payment.adminRemarks = adminRemarks || 'Payment verified against bank statement.';

      if (inv) {
        inv.paidAmount = (Number(inv.paidAmount) || 0) + Number(payment.amount);
        const updatedInv = this.recalculateInvoiceFeeItems(inv);
        const invIdx = invoices.findIndex(i => i.id === inv.id);
        if (invIdx !== -1) {
          invoices[invIdx] = updatedInv;
        }
        setItem(STORAGE_KEYS.INVOICES, invoices);

        // Find parent to notify
        const parentUser = this.getUsers().find(u => u.id === inv.parentId || u.email === inv.parentId || u.linkedStudentIds?.includes(inv.studentId));
        if (parentUser) {
          this.addNotification({
            userId: parentUser.id,
            title: 'School Fee Payment Verified & Approved',
            message: `Your payment of ${currency}${payment.amount.toLocaleString()} for ${inv.studentName} has been verified. Official Receipt: ${payment.receiptNumber}. Remaining Balance: ${currency}${updatedInv.balance.toLocaleString()}.`,
            type: 'FEE',
            actionLink: 'fees',
          });

          // Send formal internal message with updated balance view
          try {
            this.sendMessage({
              senderId: actor.id,
              senderName: `${actor.name} (Bursary)`,
              senderRole: 'ADMIN',
              recipientId: parentUser.id,
              recipientName: parentUser.name,
              recipientRole: 'PARENT',
              subject: `Official Fee Payment Verified - Receipt #${payment.receiptNumber}`,
              body: `Dear ${parentUser.name},\n\nWe are pleased to inform you that your fee payment for ${inv.studentName} has been officially verified and credited.\n\n• Student: ${inv.studentName} (${inv.className})\n• Term & Session: ${inv.term} ${inv.academicYear}\n• Amount Verified: ${currency}${payment.amount.toLocaleString()}\n• Payment Reference: ${payment.paymentReference || payment.transactionRef}\n• Official Receipt Number: ${payment.receiptNumber}\n• Updated Remaining Balance: ${currency}${updatedInv.balance.toLocaleString()}\n\nYou can now view, print, and download your official receipt directly from your Fee Portal.\n\nWarm regards,\n${actor.name}\nBursary & Financial Accounts\nZitel Castle School`,
              content: `Official Fee Payment Verified - Receipt #${payment.receiptNumber}`,
            }, actor);
          } catch (e) {
            console.error('Error dispatching parent message:', e);
          }
        }
      }

      this.addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'PAYMENT_VERIFIED',
        'Fee',
        payment.invoiceId,
        `Approved payment ${payment.receiptNumber} (${currency}${payment.amount.toLocaleString()}) for ${payment.studentName}`
      );
    } else {
      const finalReason = rejectionReason || adminRemarks || 'Bank transfer transaction could not be reconciled with school account statement.';
      payment.status = 'REJECTED';
      payment.rejectionReason = finalReason;
      payment.verifiedAt = new Date().toISOString();
      payment.verifiedBy = actor.name;
      payment.adminRemarks = finalReason;

      if (inv) {
        const parentUser = this.getUsers().find(u => u.id === inv.parentId || u.email === inv.parentId || u.linkedStudentIds?.includes(inv.studentId));
        if (parentUser) {
          this.addNotification({
            userId: parentUser.id,
            title: 'Fee Payment Proof Requires Attention',
            message: `Your submitted proof of payment for ${inv.studentName} was rejected: ${finalReason}. You may resubmit corrected proof.`,
            type: 'FEE',
            actionLink: 'fees',
          });

          // Send formal internal message
          try {
            this.sendMessage({
              senderId: actor.id,
              senderName: `${actor.name} (Bursary)`,
              senderRole: 'ADMIN',
              recipientId: parentUser.id,
              recipientName: parentUser.name,
              recipientRole: 'PARENT',
              subject: `Attention Required: Fee Payment Proof Rejected (${inv.invoiceNumber})`,
              body: `Dear ${parentUser.name},\n\nYour submitted proof of payment of ${currency}${payment.amount.toLocaleString()} for ${inv.studentName} could not be approved for the following reason:\n\nReason: ${finalReason}\n\nPlease review your bank transaction receipt and resubmit the corrected proof directly from your Parent Fee Portal, or contact the bursary department for further assistance.\n\nBursary & Accounts Department\nZitel Castle School`,
              content: `Payment Proof Rejected: ${finalReason}`,
            }, actor);
          } catch (e) {
            console.error('Error dispatching rejection message:', e);
          }
        }
      }

      this.addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'PAYMENT_REJECTED',
        'Fee',
        payment.invoiceId,
        `Rejected payment verification (${currency}${payment.amount.toLocaleString()}) for ${payment.studentName}. Reason: ${finalReason}`
      );
    }

    setItem(STORAGE_KEYS.PAYMENTS, payments);
    return payment;
  },

  // Update Branch Bank Payment Configuration (Bungalow, Ijegun, etc.)
  updateBranchBankDetails(
    branchId: string,
    bankDetails: NonNullable<Branch['bankDetails']>,
    actor: User
  ): Branch {
    const branches = this.getBranches();
    const idx = branches.findIndex(b => b.id === branchId);
    if (idx === -1) throw new Error('Branch not found');

    branches[idx] = {
      ...branches[idx],
      bankDetails,
    };

    setItem(STORAGE_KEYS.BRANCHES, branches);
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BRANCH_BANK_DETAILS_UPDATED',
      'Settings',
      branchId,
      `Updated bank payment details for campus ${branches[idx].name} (${bankDetails.bankName} - ${bankDetails.accountNumber})`
    );

    return branches[idx];
  },

  // Send single payment reminder for an invoice (e.g., 7+ days overdue or due fee)
  sendPaymentReminder(
    invoiceId: string,
    actor: User,
    customNote?: string
  ): {
    success: boolean;
    invoice: Invoice;
    parentName: string;
    messageId?: string;
  } {
    const invoices = this.getInvoices();
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const students = this.getStudents();
    const student = students.find(s => s.id === inv.studentId);
    const branches = this.getBranches();
    const branch = branches.find(b => b.id === inv.branchId || b.id === student?.branchId) || branches[0];
    const bankDetails = branch?.bankDetails || this.getSchoolProfile().bankDetails || {
      bankName: 'Zenith Bank Plc',
      accountName: 'Zitel Castle School',
      accountNumber: '1014582910',
    };

    const currency = this.getSchoolProfile().currencySymbol || '₦';
    const users = this.getUsers();
    const parentUser = users.find(u =>
      u.id === inv.parentId ||
      u.email === inv.parentId ||
      (u.childrenIds && u.childrenIds.includes(inv.studentId)) ||
      (u.linkedStudentIds && u.linkedStudentIds.includes(inv.studentId))
    );

    const targetRecipientId = parentUser?.id || inv.parentId || 'user_parent_elena';
    const targetRecipientName = parentUser?.name || inv.parentName || 'Parent / Guardian';

    const dueDateObj = new Date(inv.dueDate);
    const today = new Date();
    const diffTime = today.getTime() - dueDateObj.getTime();
    const daysPastDue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // Generate unique payment reference
    const studentCode = student?.admissionNumber || student?.id.replace('stu_', '').toUpperCase().slice(0, 4) || 'LEO1';
    const invNum = inv.invoiceNumber.replace(/[^0-9]/g, '').slice(-4) || '2041';
    const paymentRef = `ZCS-${studentCode}-${invNum}`;

    // 1. Dispatch in-app Push Notification
    this.addNotification({
      userId: targetRecipientId,
      title: `⚠️ Fee Payment Reminder: ${inv.studentName} (${daysPastDue > 0 ? `${daysPastDue} Days Overdue` : 'Payment Notice'})`,
      message: `Outstanding school fee balance of ${currency}${inv.balance.toLocaleString()} for ${inv.studentName} (${inv.className}) is ${daysPastDue > 0 ? `${daysPastDue} days past due date (${inv.dueDate})` : `due on ${inv.dueDate}`}. Please remit payment via bank transfer.`,
      type: 'FEE',
      actionLink: 'fees',
    });

    // 2. Dispatch Formal Internal Message
    let messageId: string | undefined;
    try {
      const msg = this.sendMessage({
        senderId: actor.id,
        senderName: `${actor.name} (Bursary & Accounts)`,
        senderRole: 'ADMIN',
        recipientId: targetRecipientId,
        recipientName: targetRecipientName,
        recipientRole: 'PARENT',
        subject: `REMINDER: Outstanding School Fee Notice (${inv.invoiceNumber}) - ${inv.studentName}`,
        body: `Dear ${targetRecipientName},\n\nThis is a formal reminder from the Bursary & Accounts Department regarding the outstanding school fee invoice for ${inv.studentName}.\n\n• Invoice Number: ${inv.invoiceNumber}\n• Student: ${inv.studentName} (${inv.className})\n• Term: ${inv.term} (${inv.academicYear})\n• Total Billed: ${currency}${inv.totalAmount.toLocaleString()}\n• Total Paid to Date: ${currency}${inv.paidAmount.toLocaleString()}\n• Outstanding Balance: ${currency}${inv.balance.toLocaleString()}\n• Due Date: ${inv.dueDate} ${daysPastDue > 0 ? `(${daysPastDue} days past due)` : ''}\n\n${customNote ? `Note from Bursar: ${customNote}\n\n` : ''}OFFICIAL BANK PAYMENT DETAILS (${branch?.name || 'School Campus'}):\n• Bank Name: ${bankDetails.bankName}\n• Account Name: ${bankDetails.accountName}\n• Account Number: ${bankDetails.accountNumber}\n• Unique Payment Reference: ${paymentRef}\n\nPlease quote the unique payment reference "${paymentRef}" in your transaction narration for automatic reconciliation. After making the transfer, please upload your proof of payment directly in the Parent Fee Portal to receive your official digital receipt.\n\nThank you for your cooperation.\n\nBursary & Financial Operations\nZitel Castle School`,
        content: `Outstanding School Fee Notice - Balance: ${currency}${inv.balance.toLocaleString()}`,
      }, actor);
      messageId = msg.id;
    } catch (e) {
      console.error('Error dispatching parent reminder message:', e);
    }

    // 3. Log Audit
    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'PAYMENT_REMINDER_SENT',
      'Fee',
      inv.id,
      `Dispatched automated fee reminder to ${targetRecipientName} for ${inv.studentName} (Invoice: ${inv.invoiceNumber}, Balance: ${currency}${inv.balance.toLocaleString()})`
    );

    return {
      success: true,
      invoice: inv,
      parentName: targetRecipientName,
      messageId,
    };
  },

  // Automated trigger for bulk overdue payment reminders (e.g., 7+ days past due date)
  sendBulkOverduePaymentReminders(
    actor: User,
    minimumDaysOverdue: number = 7
  ): {
    totalSent: number;
    totalOverdueAmount: number;
    affectedInvoices: Invoice[];
  } {
    const invoices = this.getInvoices();
    const today = new Date();
    const currency = this.getSchoolProfile().currencySymbol || '₦';

    const overdueInvoices = invoices.filter(inv => {
      if (inv.balance <= 0 || inv.status === 'PAID') return false;
      const dueDate = new Date(inv.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const daysPastDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return daysPastDue >= minimumDaysOverdue;
    });

    let totalSent = 0;
    let totalOverdueAmount = 0;

    overdueInvoices.forEach(inv => {
      try {
        this.sendPaymentReminder(
          inv.id,
          actor,
          `Automated ${minimumDaysOverdue}-day post-due reminder triggered by School Finance & Bursary.`
        );
        totalSent++;
        totalOverdueAmount += inv.balance;
      } catch (err) {
        console.error(`Failed to send reminder for invoice ${inv.id}:`, err);
      }
    });

    this.addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'BULK_PAYMENT_REMINDERS_SENT',
      'Fee',
      undefined,
      `Dispatched bulk payment reminders to ${totalSent} parent(s) with invoices ${minimumDaysOverdue}+ days overdue (Total Overdue: ${currency}${totalOverdueAmount.toLocaleString()})`
    );

    return {
      totalSent,
      totalOverdueAmount,
      affectedInvoices: overdueInvoices,
    };
  },

  // Timetable
  getTimetable(): TimetableSlot[] {
    return getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE);
  },

  addTimetableSlot(slot: Omit<TimetableSlot, 'id'>, actor: User): { slot?: TimetableSlot; conflict?: string } {
    const timetable = this.getTimetable();

    // Check teacher clash: teacher busy in another class at same day & time
    const teacherClash = timetable.find(
      t => t.day === slot.day && t.startTime === slot.startTime && t.teacherId === slot.teacherId
    );
    if (teacherClash) {
      return { conflict: `Teacher conflict: ${slot.teacherName} is already assigned to ${teacherClash.className} on ${slot.day} at ${slot.startTime}.` };
    }

    // Check class clash: class already has another subject at same day & time
    const classClash = timetable.find(
      t => t.day === slot.day && t.startTime === slot.startTime && t.classId === slot.classId
    );
    if (classClash) {
      return { conflict: `Class conflict: ${slot.className} already has ${classClash.subjectName} scheduled on ${slot.day} at ${slot.startTime}.` };
    }

    const newSlot: TimetableSlot = {
      ...slot,
      id: `tt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    timetable.push(newSlot);
    setItem(STORAGE_KEYS.TIMETABLE, timetable);
    this.addAuditLog(actor.id, actor.name, actor.role, 'TIMETABLE_SLOT_ADDED', 'Settings', newSlot.id, `Added timetable slot for ${newSlot.className} (${newSlot.subjectName})`);
    return { slot: newSlot };
  },

  // ==========================================
  // Communication Permissions & Messaging
  // ==========================================
  getAccessibleChatContacts(user: User): {
    id: string;
    name: string;
    role: UserRole;
    roleLabel: string;
    studentScope?: string;
    avatar?: string;
    subtitle?: string;
  }[] {
    const allUsers = this.getUsers();
    const students = this.getStudents();
    const classes = this.getClasses();
    const subjectAssignments = this.getClassSubjectAssignments();
    const parents = this.getParents();

    const contacts: {
      id: string;
      name: string;
      role: UserRole;
      roleLabel: string;
      studentScope?: string;
      avatar?: string;
      subtitle?: string;
    }[] = [];

    if (user.role === 'PARENT') {
      // 1. Parent can ONLY message teachers responsible for their child:
      // - Form Teacher of their child's class
      // - Subject Teachers assigned to their child's class/subjects
      // - School/Branch Admin
      const parentRecord = parents.find(p => p.email === user.email || p.userId === user.id || p.fullName === user.name);
      const myStudents = students.filter(s =>
        (user.childrenIds || []).includes(s.id) ||
        (parentRecord?.linkedStudentIds || []).includes(s.id)
      );

      const authorizedTeacherIds = new Set<string>();
      const teacherStudentContextMap: Record<string, string[]> = {};

      myStudents.forEach(st => {
        const classObj = classes.find(c => c.id === st.classId);
        if (classObj?.formTeacherId) {
          authorizedTeacherIds.add(classObj.formTeacherId);
          if (!teacherStudentContextMap[classObj.formTeacherId]) teacherStudentContextMap[classObj.formTeacherId] = [];
          teacherStudentContextMap[classObj.formTeacherId].push(`${st.fullName} (Form Teacher, ${st.className})`);
        }

        // Subject teachers
        const subTeachers = subjectAssignments.filter(a => a.classId === st.classId);
        subTeachers.forEach(sa => {
          if (sa.teacherId) {
            authorizedTeacherIds.add(sa.teacherId);
            if (!teacherStudentContextMap[sa.teacherId]) teacherStudentContextMap[sa.teacherId] = [];
            teacherStudentContextMap[sa.teacherId].push(`${st.fullName} (${sa.subjectName})`);
          }
        });
      });

      // Add authorized teachers
      allUsers.filter(u => authorizedTeacherIds.has(u.id)).forEach(t => {
        contacts.push({
          id: t.id,
          name: t.name,
          role: t.role,
          roleLabel: 'Authorized Teacher',
          avatar: t.avatar,
          subtitle: teacherStudentContextMap[t.id]?.join(' • ') || 'Class Teacher',
        });
      });

      // Add School Admin
      allUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').forEach(a => {
        contacts.push({
          id: a.id,
          name: a.name,
          role: a.role,
          roleLabel: a.role === 'SUPER_ADMIN' ? 'Principal / Super Admin' : 'Branch Admin & Bursar',
          avatar: a.avatar,
          subtitle: 'School Administration & Support',
        });
      });

    } else if (user.role === 'TEACHER') {
      // 2. Teacher can message:
      // - Parents of students in their homeroom/assigned classes
      // - Admins
      // - Peer teachers
      const myClassIds = new Set<string>(user.assignedClasses || []);
      const homeroomClasses = classes.filter(c => c.formTeacherId === user.id);
      homeroomClasses.forEach(c => myClassIds.add(c.id));

      const mySubjectClasses = subjectAssignments.filter(a => a.teacherId === user.id);
      mySubjectClasses.forEach(a => myClassIds.add(a.classId));

      const myPupils = students.filter(s => myClassIds.has(s.classId));

      // Get parents of these pupils
      parents.forEach(p => {
        const pupilMatches = myPupils.filter(st => (p.linkedStudentIds || []).includes(st.id));
        if (pupilMatches.length > 0) {
          const parentUser = allUsers.find(u => u.email === p.email || u.fullName === p.fullName) || {
            id: p.id,
            name: p.fullName,
            role: 'PARENT' as UserRole,
            avatar: p.avatar,
          };
          contacts.push({
            id: parentUser.id,
            name: parentUser.name,
            role: 'PARENT',
            roleLabel: 'Parent / Guardian',
            avatar: parentUser.avatar,
            subtitle: `Parent of ${pupilMatches.map(m => `${m.fullName} (${m.className})`).join(', ')}`,
          });
        }
      });

      // Add Admins
      allUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').forEach(a => {
        contacts.push({
          id: a.id,
          name: a.name,
          role: a.role,
          roleLabel: a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Branch Admin',
          avatar: a.avatar,
          subtitle: 'Administration',
        });
      });

    } else {
      // Admin / Super Admin has oversight of all users
      allUsers.filter(u => u.id !== user.id).forEach(u => {
        contacts.push({
          id: u.id,
          name: u.name,
          role: u.role,
          roleLabel: u.role === 'PARENT' ? 'Parent' : u.role === 'TEACHER' ? 'Teacher' : 'Administrator',
          avatar: u.avatar,
          subtitle: u.role === 'TEACHER' ? 'Faculty Member' : u.role === 'PARENT' ? 'Parent / Guardian' : 'School Official',
        });
      });
    }

    return contacts;
  },

  // Messages
  getMessages(filter?: { senderId?: string; recipientId?: string; participantId?: string }): Message[] {
    let list = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    if (!filter) return list;
    if (filter.participantId) {
      list = list.filter(m => m.senderId === filter.participantId || m.recipientId === filter.participantId);
    }
    if (filter.senderId) {
      list = list.filter(m => m.senderId === filter.senderId);
    }
    if (filter.recipientId) {
      list = list.filter(m => m.recipientId === filter.recipientId);
    }
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage(msg: Omit<Message, 'id' | 'timestamp' | 'read'>, actor: User): Message {
    const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    messages.push(newMsg);
    setItem(STORAGE_KEYS.MESSAGES, messages);

    // Create In-App Notification for recipient
    this.addNotification({
      userId: newMsg.recipientId,
      title: `New message from ${newMsg.senderName}`,
      message: `${newMsg.subject || 'Direct message'}: ${newMsg.content?.slice(0, 70) || 'Attachment sent'}`,
      type: 'ANNOUNCEMENT',
      actionLink: 'messages',
    });

    this.addAuditLog(actor.id, actor.name, actor.role, 'MESSAGE_SENT', 'User', newMsg.recipientId, `Sent message "${newMsg.subject}" to ${newMsg.recipientName}`);
    return newMsg;
  },

  markMessageAsRead(messageId: string): void {
    const messages = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      msg.read = true;
      setItem(STORAGE_KEYS.MESSAGES, messages);
    }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const list = this.getNotifications();
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newNotif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string | undefined,
    details: string
  ): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1 (Authenticated Session)',
    };
    logs.unshift(newLog);
    // Keep last 500 logs
    if (logs.length > 500) logs.pop();
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  },

  // AI Governance
  getAIGovernance(): AIGovernanceConfig {
    return getItem<AIGovernanceConfig>(STORAGE_KEYS.AI_GOVERNANCE, INITIAL_AI_GOVERNANCE);
  },

  updateAIGovernance(updates: Partial<AIGovernanceConfig>, actor: User): AIGovernanceConfig {
    const current = this.getAIGovernance();
    const updated = { ...current, ...updates };
    setItem(STORAGE_KEYS.AI_GOVERNANCE, updated);
    this.addAuditLog(actor.id, actor.name, actor.role, 'AI_GOVERNANCE_UPDATED', 'AI', 'governance', `Updated school AI governance policies`);
    return updated;
  },

  recordAIUsage(feature: string, actor: User): void {
    const gov = this.getAIGovernance();
    gov.totalRequestsUsed += 1;
    setItem(STORAGE_KEYS.AI_GOVERNANCE, gov);
    this.addAuditLog(actor.id, actor.name, actor.role, 'AI_FEATURE_INVOKED', 'AI', feature, `AI feature used: ${feature}`);
  },

  resetToSeedData(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    initDatabase();
    notify();
  }
};
