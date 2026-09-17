export type UserRole = 'SUPER_ADMIN' | 'DIRECTOR' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
export type Role = UserRole;

export type AdminRoleType = 'DIRECTOR' | 'BRANCH_ADMIN' | 'BURSAR';

export type AcademicSection = 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';

export interface Branch {
  id: string;
  name: string; // e.g. "ZITEL CASTLE SCHOOL BUNGALOW"
  code: string; // e.g. "ZCS-BGL"
  address: string;
  phone: string;
  email: string;
  headTeacherOrPrincipal: string;
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  operationalStatus?: 'Active' | 'Maintenance' | 'Closed';
  sectionsOffered: AcademicSection[];
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
  establishedYear?: string;
  description?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    sortCode?: string;
    paymentInstructions?: string;
  };
  createdAt: string;
}

export type AdminPermission =
  | 'manage_administrators'
  | 'manage_branches'
  | 'manage_teachers'
  | 'manage_classes'
  | 'manage_subjects'
  | 'manage_students'
  | 'manage_parents'
  | 'manage_curriculum'
  | 'manage_timetable'
  | 'manage_fees'
  | 'manage_reports'
  | 'manage_library'
  | 'manage_transport'
  | 'manage_settings'
  | 'access_ai_tools'
  | 'view_audit_logs'
  | 'broadcast_announcements';

export type PermissionScope = 'ALL_SCHOOL' | 'ASSIGNED_CLASSES' | 'ASSIGNED_SUBJECTS' | 'FINANCE_ONLY' | 'ACADEMIC_ONLY';

export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'archived' | 'inactive' | 'merged';
export type TeacherStatus = 'active' | 'suspended' | 'deactivated' | 'archived';

export interface User {
  id: string; // Internal immutable identity (Firebase UID or unique DB UID)
  firebaseUid?: string; // Immutable Firebase Authentication UID
  schoolId: string; // Official School ID e.g. "ZCS/BUN/TCH/00001", "ZCS/SA/00001"
  username: string; // School ID or user handle
  email: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  role: UserRole;
  avatar?: string;
  status: AccountStatus;
  statusReason?: string;
  statusUpdatedAt?: string;
  statusUpdatedByAdminName?: string;
  permissions: AdminPermission[];
  scope?: PermissionScope;
  branchId?: string; // e.g. 'branch_bungalow' or 'branch_ijegun'
  branchName?: string;
  assignedBranchIds?: string[]; // For regional or branch-specific admins
  customRoleTitle?: string;
  adminRoleType?: AdminRoleType;
  assignedClasses?: string[]; // Class IDs
  assignedSubjects?: string[]; // Subject IDs
  formClassId?: string; // If Form Teacher of a specific class
  formClassName?: string;
  employmentStatus?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  staffId?: string;
  phone?: string;
  whatsApp?: string;
  address?: string;
  qualifications?: string | string[];
  linkedStudentIds?: string[]; // For parents: student IDs
  childrenIds?: string[]; // For parents: children student IDs
  studentProfileId?: string; // For students: student record ID
  mustChangePassword?: boolean; // Flag for first-time login temporary password change
  isTemporaryPassword?: boolean;
  temporaryPassword?: string; // Retained for administrative initial dispatch slip
  emailVerified?: boolean;
  passwordHash?: string;
  passwordChangedAt?: string;
  isMerged?: boolean;
  mergedIntoUserId?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface CredentialSlip {
  userId: string;
  firebaseUid: string;
  schoolId: string;
  name: string;
  role: UserRole;
  roleTitle?: string;
  branchId?: string;
  branchName?: string;
  temporaryPassword: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  issuedAt: string;
  issuedByAdminName: string;
  deliveryStatus?: 'PENDING' | 'DELIVERED' | 'FAILED' | 'PRINTED_ONLY';
  deliveryChannel?: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PRINT_SLIP';
  deliveryError?: string;
  deliveryId?: string;
}

export type SubjectCategory =
  | 'Core'
  | 'Science'
  | 'Mathematics'
  | 'Arts'
  | 'Commercial'
  | 'Vocational'
  | 'Technology'
  | 'Language'
  | 'Creative'
  | 'Physical Education'
  | 'Religious Studies'
  | 'Enrichment'
  | 'STEM'
  | 'Social'
  | 'Physical'
  | 'Elective'
  | 'Activity';

export type TeacherAssignmentType = 'FORM_TEACHER' | 'SUBJECT_TEACHER' | 'SPECIALIST_TEACHER';

export interface GradingBreakdownItem {
  name: string;
  weight: number;
  maxScore?: number;
}

export type GradingBreakdown = GradingBreakdownItem[] | {
  classwork?: number;
  assignment?: number;
  test?: number;
  project?: number;
  exam: number;
  [key: string]: any;
};

export interface GradingStructure {
  id: string;
  name: string; // e.g. "Option A (40% CA + 60% Exam)", "Option B (30% CA + 70% Exam)", "Custom Scheme"
  description?: string;
  type: '40_60' | '30_70' | 'CUSTOM';
  level: 'SCHOOL_DEFAULT' | 'SECTION' | 'CLASS' | 'SUBJECT';
  targetId?: string; // e.g. 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY', classId, or subjectId
  targetName?: string;
  caWeight: number; // e.g. 40
  examWeight: number; // e.g. 60
  breakdown?: GradingBreakdown;
  isDefault?: boolean;
  academicTerm?: string;
  createdAt: string;
  updatedBy: string;
  branchId?: string;
}

export interface ClassSubjectAssignment {
  id: string;
  classId: string;
  className: string;
  branchId: string;
  branchName?: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  category?: SubjectCategory | string;
  teacherId: string;
  teacherName: string;
  teacherSchoolId?: string;
  teacherType?: TeacherAssignmentType;
  assignmentType?: string;
  isCompulsory?: boolean;
  status: 'active' | 'inactive';
  notes?: string;
  academicYear?: string;
  startDate?: string;
  gradingStructureId?: string;
  periodsPerWeek?: number;
  updatedAt?: string;
}

export interface SchoolProfile {
  id: string;
  name: string;
  motto: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  currency: string; // e.g. 'NGN', 'USD', 'GBP'
  currencySymbol: string; // e.g. '₦', '$', '£'
  currencyName?: string; // e.g. 'Nigerian Naira'
  currencyPosition?: 'prefix' | 'suffix';
  currentAcademicYear: string;
  currentTerm: string;
  branches?: string[]; // Branch IDs
  includeBasic6?: boolean; // Toggle optional Basic 6
  teachersCanModifyGradingWeights?: boolean; // Super Admin toggle for teacher control
  defaultGradingStructureId?: string;
  gradingScheme: {
    grade: string;
    minScore: number;
    maxScore: number;
    gpa: number;
    remark: string;
  }[];
  branding: {
    primaryColor: string;
    secondaryColor: string;
    reportCardHeader: string;
    reportCardFooter: string;
    principalName: string;
    principalSignatureText: string;
  };
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    sortCode?: string;
    paymentInstructions?: string;
  };
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "Basic 1A", "JSS 2B", "SS 1 Science"
  levelName?: string; // e.g. "Basic 1", "JSS 2", "SS 1"
  sectionType: AcademicSection; // 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY'
  gradeLevel: number; // 1 to 12
  section: string; // "A", "B", "Science", "Commercial", "Arts"
  branchId: string; // 'branch_bungalow' | 'branch_ijegun'
  branchName?: string;
  formTeacherId: string;
  formTeacherName: string;
  capacity: number;
  enrolledCount: number;
  roomNumber: string;
  academicYear: string;
  status?: 'active' | 'inactive';
}

export type Class = ClassRoom;

export type AcademicTermType = 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
export type TermStatus = 'upcoming' | 'active' | 'completed';

export interface AcademicTermConfig {
  id: string; // e.g. 'term_2026_2027_1'
  sessionId: string; // e.g. 'session_2026_2027'
  sessionName: string; // e.g. '2026/2027'
  termType: AcademicTermType;
  name: string; // e.g. "First Term"
  shortName?: string; // e.g. "1st Term"
  openingDate: string; // YYYY-MM-DD
  closingDate: string; // YYYY-MM-DD
  nextTermOpeningDate: string; // YYYY-MM-DD
  status: TermStatus;
  isOverrideActive?: boolean; // When Super Admin forces this term active
  midtermTestStartDate?: string;
  midtermTestEndDate?: string;
  midtermBreakStartDate?: string;
  midtermBreakEndDate?: string;
  examinationStartDate?: string;
  examinationEndDate?: string;
  resultCompilationStartDate?: string;
  resultReleaseDate?: string;
  notes?: string;
  totalWeeks?: number;
  vacationStartDate?: string;
  vacationEndDate?: string;
}

export interface AcademicSession {
  id: string; // e.g. 'session_2026_2027'
  name: string; // e.g. '2026/2027'
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent: boolean;
  status: 'upcoming' | 'active' | 'archived';
  terms: [AcademicTermConfig, AcademicTermConfig, AcademicTermConfig]; // Exactly three terms
  publishedCalendar: boolean;
  publishedAt?: string;
  publishedBy?: string;
  publishedByName?: string;
  revisionNumber: number;
  revisionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CalendarEventCategory =
  | 'ACADEMIC'
  | 'EXAMINATION'
  | 'MIDTERM_TEST'
  | 'MIDTERM_BREAK'
  | 'HOLIDAY'
  | 'SCHOOL_EVENT'
  | 'PTA_MEETING'
  | 'STAFF_MEETING'
  | 'SPORTS'
  | 'EXCURSION'
  | 'CULTURAL'
  | 'GRADUATION'
  | 'RESULT_RELEASE'
  | 'RESULT_COMPILATION'
  | 'TERM_DATES'
  | 'CUSTOM';

export type CalendarAudience = 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'BURSAR';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // "08:30"
  endTime?: string; // "10:30"
  type: 'EXAM' | 'HOMEWORK_DEADLINE' | 'QUIZ' | 'HOLIDAY' | 'SCHOOL_EVENT' | 'PARENT_CONFERENCE' | 'FACULTY_MEETING' | 'MIDTERM_TEST' | 'MIDTERM_BREAK' | 'STAFF_MEETING' | 'PTA_MEETING' | 'SPORTS' | 'EXCURSION' | 'CULTURAL' | 'GRADUATION' | 'RESULT_RELEASE' | 'RESULT_COMPILATION' | 'TERM_DATES' | 'ACADEMIC' | 'EXAMINATION' | 'CUSTOM';
  category?: CalendarEventCategory;
  sessionId?: string;
  sessionName?: string;
  termId?: string;
  termName?: string;
  classId?: string; // Optional if class specific
  className?: string;
  subjectId?: string;
  subjectName?: string;
  branchId?: string; // Optional if branch specific or all
  branchName?: string;
  audience?: CalendarAudience[];
  createdByTeacherId?: string;
  createdByName?: string;
  isSchoolWide: boolean;
  priority?: 'low' | 'medium' | 'high';
  color?: string;
  isOfficial?: boolean;
  googleCalendarEventId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoogleCalendarSyncState {
  isConnected: boolean;
  accountEmail?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  autoSync: boolean;
  syncedEventCount: number;
  syncExams?: boolean;
  syncHolidays?: boolean;
  syncStaffMeetings?: boolean;
  syncPTAMeetings?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // e.g. "MTH-P3", "ENG-J1", "PHY-SS1"
  category: SubjectCategory;
  description: string;
  icon?: string;
  gradeLevels: number[];
  sectionType?: AcademicSection;
  educationalLevel?: AcademicSection; // PRIMARY | JUNIOR_SECONDARY | SENIOR_SECONDARY
  isCompulsory?: boolean;
  status?: 'active' | 'inactive';
  branchId?: string; // Optional if branch specific or global
}

export interface Student {
  id: string; // Immutable database ID
  firebaseUid?: string; // Immutable Firebase Auth ID
  schoolId?: string; // e.g. "ZCS/BUN/STU/00001"
  studentId: string; // Official School ID or institutional admission number
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  dateOfBirth?: string;
  branchId: string; // 'branch_bungalow' | 'branch_ijegun'
  branchName?: string;
  classId: string;
  className: string;
  arm?: string; // e.g. "A", "B", "Science"
  stream?: string;
  section?: string;
  academicYear?: string;
  admissionDate?: string;
  enrollmentDate?: string;
  previousSchool?: string;
  parentIds: string[];
  parentId?: string; // Backwards compatible alias for single primary parent
  primaryContactPhone?: string;
  emergencyContact?: string | {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  medicalNotes?: string;
  address?: string;
  avatar: string;
  status: 'Active' | 'Enrolled' | 'Suspended' | 'Transferred' | 'Graduated' | 'Withdrawn' | 'Archived' | 'active' | 'inactive';
  statusReason?: string;
  statusUpdatedAt?: string;
  statusUpdatedByAdminName?: string;
  bloodGroup?: string;
  genotype?: string;
  house?: string;
  stateOfOrigin?: string;
  lgaOfOrigin?: string;
  nationality?: string;
  notes?: string;
  subjects?: string[];
}

export interface Parent {
  id: string;
  firebaseUid?: string;
  schoolId?: string; // e.g. "ZCS/PAR/00001"
  userId?: string;
  fullName: string;
  name?: string; // Backwards compatible alias
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsApp?: string;
  relationship: 'Mother' | 'Father' | 'Guardian' | string;
  address: string;
  occupation?: string;
  branchId?: string;
  branchName?: string;
  linkedStudentIds: string[];
  avatar?: string;
  status?: AccountStatus;
  statusReason?: string;
  statusUpdatedAt?: string;
  statusUpdatedByAdminName?: string;
  isMerged?: boolean;
  mergedIntoParentId?: string;
  mergedAt?: string;
  mergedByAdminName?: string;
}

export interface ParentLifecycleItem {
  parent: Parent;
  activeChildrenCount: number;
  inactiveChildrenCount: number;
  totalChildrenCount: number;
  isEligibleForInactiveReview: boolean;
  status: AccountStatus;
  children: {
    id: string;
    fullName: string;
    className: string;
    status: string;
    schoolId: string;
  }[];
}

export interface ParentDuplicateReport {
  id: string;
  reportedByUserId: string;
  reportedByUserName: string;
  reportedByParentId?: string;
  reportedParentName?: string;
  primaryParentId?: string;
  suspectedDuplicateParentId?: string;
  duplicateName?: string;
  duplicatePhone?: string;
  duplicateEmail?: string;
  matchedPhone?: string;
  matchedEmail?: string;
  reason?: string;
  notes: string;
  status: 'PENDING_REVIEW' | 'MERGED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolvedByAdminName?: string;
  resolutionDetails?: string;
}

export interface GatewayConfigDetails {
  enabled: boolean;
  provider: string;
  senderId?: string;
  accountSid?: string;
  apiKey?: string;
  phoneNumberId?: string;
  fromEmail?: string;
}

export interface MessagingIntegrationConfig {
  smsConfigured: boolean;
  smsProvider?: string; // e.g. 'Termii / Twilio'
  whatsAppConfigured: boolean;
  whatsAppProvider?: string; // e.g. 'Meta WhatsApp Cloud API'
  emailConfigured: boolean;
  emailProvider?: string; // e.g. 'SendGrid / Resend'
  schoolOfficialLoginUrl: string;
  sms?: GatewayConfigDetails;
  whatsApp?: GatewayConfigDetails;
  email?: GatewayConfigDetails;
}

export type CredentialDeliveryStatus = 'Not Sent' | 'Queued' | 'Sent' | 'Delivered' | 'Failed' | 'DELIVERED' | 'FAILED' | 'PENDING' | 'PRINTED_ONLY';

export interface StudentCredentialDeliveryRecord {
  id: string;
  studentId?: string;
  schoolId: string;
  studentName?: string;
  className?: string;
  branchId?: string;
  branchName?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  recipientUserId?: string;
  recipientName?: string;
  recipientRole?: UserRole;
  destination?: string;
  temporaryPassword?: string;
  loginUrl?: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Slip_Generated' | 'Direct_Copy' | 'WHATSAPP' | 'PRINT_SLIP' | string;
  status: CredentialDeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  errorMessage?: string;
  retryCount?: number;
  initiatedByAdminName?: string;
  lastAttemptByAdminName?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  branchId?: string;
  branchName?: string;
  classId: string;
  className?: string;
  studentId: string;
  studentName?: string;
  status: AttendanceStatus;
  reason?: string;
  markedByTeacherId?: string;
  markedByName?: string;
  markedBy?: string;
  timestamp: string;
}

export type StaffPunctualityStatus = 'ON_TIME' | 'LATE' | 'EXCUSED';

export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail?: string;
  staffRole: Role | string;
  department?: string;
  branchId: string;
  branchName?: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // e.g. "07:42 AM"
  timeOut?: string; // e.g. "04:15 PM"
  status: StaffPunctualityStatus;
  clockInTimestamp: number;
  clockOutTimestamp?: number;
  notes?: string;
}

export type AssessmentCategory = 'CLASSWORK' | 'ASSIGNMENT' | 'TEST' | 'EXAM' | 'PROJECT';

export interface Assessment {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  termId?: string;
  academicYear?: string;
  category?: AssessmentCategory;
  type?: string;
  maxScore: number;
  weightPercent?: number; // e.g. 10%, 20%, 60%
  date?: string;
  createdByTeacherId?: string;
}

export interface AssessmentScore {
  id: string;
  assessmentId: string;
  assessmentTitle?: string;
  studentId: string;
  studentName: string;
  classId?: string;
  subjectId?: string;
  branchId?: string;
  branchName?: string;
  score: number;
  maxScore: number;
  remarks?: string;
  gradedBy?: string;
  recordedByTeacherId?: string;
  recordedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  dueDate: string;
  teacherId: string;
  teacherName: string;
  maxPoints: number;
  attachmentName?: string;
  createdAt: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'GRADED';
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'GRADED' | 'LATE';
}

export interface LessonNoteAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'pdf' | 'worksheet' | 'diagram' | 'board_photo';
  url: string;
  size?: string;
  uploadedAt: string;
  category?: 'Textbook Page' | 'Board Work' | 'Teaching Aid' | 'Diagram' | 'Classroom Material' | 'Worksheet' | 'Other';
}

export type LessonNoteStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface LessonNote {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  subTopic?: string;
  date: string; // YYYY-MM-DD
  term: 'Term 1' | 'Term 2' | 'Term 3' | string;
  weekNumber: number; // 1-14
  duration: string; // e.g. "40 mins", "80 mins (2 periods)"
  learningObjectives: string[] | string;
  previousKnowledge: string;
  instructionalMaterials: string[] | string;
  introduction: string;
  lessonContent: string;
  teacherActivities: string;
  studentActivities: string;
  evaluation: string;
  assignment: string;
  conclusion: string;
  teacherRemarks?: string;
  status: LessonNoteStatus;
  attachments?: LessonNoteAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonPlanAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'pdf';
  url: string;
  size?: string;
  uploadedAt?: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  subTopic?: string;
  objectives: string[];
  date?: string; // YYYY-MM-DD
  time?: string; // e.g. "08:30"
  duration?: string; // e.g. "45 mins"
  weekNumber?: number; // 1-14
  term?: string; // 'Term 1' | 'Term 2' | 'Term 3'
  teachingActivities?: string;
  studentActivities?: string;
  learningResources?: string[] | string;
  assessmentMethod?: string;
  homework?: string;
  teacherNotes?: string;
  materials?: string[];
  materialsNeeded?: string[];
  introduction?: string;
  explanation?: string;
  activities?: any[];
  classroomActivities?: {
    name: string;
    duration: string;
    instructions: string;
    grouping: string;
  }[];
  questions?: {
    question: string;
    expectedAnswer: string;
  }[];
  differentiation?: {
    support: string;
    extension: string;
  };
  assessment?: string;
  summary?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESCHEDULED' | 'ARCHIVED' | 'NOT_STARTED' | 'NEEDS_REVISION' | 'PUBLISHED' | 'DRAFT';
  attachments?: LessonPlanAttachment[];
  aiGenerated?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassAnnouncement {
  id: string;
  classId: string;
  className: string;
  branchId?: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT' | 'HIGH';
  targetAudience: 'ALL' | 'STUDENTS' | 'PARENTS';
  date: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  grade: string;
  instructions: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  totalPoints: number;
  markingGuide: string;
  teacherId: string;
  createdAt: string;
}

export type BehaviorStatusType = 'Positive' | 'Neutral' | 'Concern' | 'Incident';
export type BehaviorVisibilityType = 'PARENT_VISIBLE' | 'STAFF_ONLY' | 'CONFIDENTIAL_ADMIN';

export interface BehaviorCategory {
  id: string;
  name: string;
  description: string;
  defaultStatus: BehaviorStatusType;
  defaultType?: BehaviorStatusType;
  defaultPoints?: number;
  color: string;
  iconName?: string;
  isSystem?: boolean;
  isActive: boolean;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  branchId?: string;
  date: string;
  category: string; // e.g. 'Participation', 'Punctuality', 'Cooperation', 'Leadership', 'Respect', 'Classroom Conduct', 'Homework', 'Concentration', 'Creativity', 'Responsibility', 'Social Interaction', 'Academic Effort', 'Positive Achievement', 'Incident', 'Other'
  status: BehaviorStatusType;
  headline?: string;
  observation: string;
  detailedComments?: string;
  actionTaken?: string;
  rating?: number; // 1 to 5
  points?: number; // e.g. +2, -1
  visibility?: BehaviorVisibilityType;
  isPublishedToParent: boolean;
  teacherId: string;
  teacherName: string;
  teacherRole?: string;
  subjectId?: string;
  subjectName?: string;
  notes?: string; // backwards compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentStatusReport {
  id: string;
  reportType: 'INDIVIDUAL' | 'CLASS';
  studentId?: string;
  studentName?: string;
  studentAvatar?: string;
  studentAdmissionNo?: string;
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  academicYear: string;
  term: string;
  date: string;
  teacherId: string;
  teacherName: string;
  academicSummary: {
    overallAverage: number;
    topSubjects: string[];
    strugglingSubjects: string[];
    assessmentCount: number;
    letterGrade?: string;
  };
  attendanceSummary: {
    attendanceRate: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    punctualityRating: string;
  };
  behaviorSummary: {
    positiveCount: number;
    concernCount: number;
    incidentCount: number;
    conductRating: string;
    keyHighlights?: string[];
  };
  participationNotes: string;
  strengths: string[];
  areasForImprovement: string[];
  teacherObservations: string;
  generalProgress: string;
  recommendations: string;
  importantIncidents?: string;
  createdAt: string;
  updatedAt: string;
}

export type WeeklyReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'RETURNED' | 'APPROVED';

export interface WeeklyTeacherReport {
  id: string;
  weekNumber: number;
  term: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  classId: string;
  className: string;
  branchId: string;
  branchName: string;
  teacherId: string;
  teacherName: string;
  recipientRole: 'BRANCH_ADMIN' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
  recipientAdminId?: string;
  recipientAdminName?: string;
  classActivities: string;
  academicProgress: string;
  attendanceMetrics: {
    totalDays: number;
    presentCount: number;
    averageRate: number;
    notes: string;
  };
  behavioralObservations: string;
  significantEvents: string;
  studentConcerns: string;
  studentAchievements: string;
  generalClassProgress: string;
  issuesRequiringAdminAttention: string;
  teacherRecommendations: string;
  status: WeeklyReportStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  classId: string; // or 'ALL'
  className: string;
  branchId?: string; // or 'ALL'
  branchName?: string;
  term: string;
  academicYear: string;
  amount: number;
  dueDate: string;
  mandatory: boolean;
  category?: string;
  description?: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isMandatory: boolean;
  frequency: 'TERMLY' | 'SESSIONAL' | 'ONE_TIME';
  defaultAmount?: number;
  applicableSection?: AcademicSection | 'ALL';
  status: 'active' | 'inactive';
}

export interface FeeDiscount {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className?: string;
  branchId?: string;
  branchName?: string;
  amount: number;
  percentage?: number;
  reason: string;
  category: 'SIBLING' | 'SCHOLARSHIP' | 'STAFF_CONCESSION' | 'SPECIAL_WAIVER' | 'EARLY_BIRD' | 'OTHER';
  authorizedBy: string;
  authorizedAt: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  notes?: string;
}

export interface FeeRefund {
  id: string;
  paymentId?: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className?: string;
  parentId?: string;
  parentName?: string;
  branchId?: string;
  branchName?: string;
  amount: number;
  refundMethod?: 'Bank Transfer' | 'Cash' | 'Credit Note' | string;
  reason: string;
  authorizedBy: string;
  authorizedAt?: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  refundDate: string;
  referenceNumber: string;
  beneficiaryAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  notes?: string;
}

export type FinancialReportType =
  | 'DAILY_COLLECTION'
  | 'WEEKLY_FINANCIAL'
  | 'WEEKLY_FINANCIAL_SUMMARY'
  | 'MONTHLY_FINANCIAL'
  | 'MONTHLY_FINANCIAL_STATEMENT'
  | 'TERMLY_FEE'
  | 'TERMLY_FEE_REPORT'
  | 'OUTSTANDING_DEFAULTERS'
  | 'FEE_DEFAULTERS_LIST'
  | 'PAID_STUDENTS'
  | 'UNPAID_STUDENTS'
  | 'PAYMENT_VERIFICATIONS'
  | 'BRANCH_COMPARISON'
  | 'FEE_CATEGORY_BREAKDOWN'
  | 'DISCOUNTS_REFUNDS_AUDIT'
  | string;

export interface DispatchedFinancialReport {
  id: string;
  reportType: FinancialReportType;
  title: string;
  generatedByUserId?: string;
  generatedByName?: string;
  generatedByRole?: string;
  dispatchedBy?: string;
  dispatchedByRole?: string;
  recipientRoles: ('SUPER_ADMIN' | 'ADMIN' | 'BRANCH_ADMIN' | string)[];
  recipientUserIds?: string[];
  recipientNames?: string[];
  branchFilter: string;
  classFilter?: string;
  termFilter?: string;
  sessionFilter?: string;
  academicYear?: string;
  term?: string;
  dateRangeFilter?: { startDate: string; endDate: string };
  summaryMetrics: {
    totalExpected?: number;
    totalCollected: number;
    totalOutstanding?: number;
    totalBilled?: number;
    totalPending?: number;
    collectionRate: number;
    paidStudentsCount?: number;
    unpaidStudentsCount?: number;
    partialStudentsCount?: number;
    pendingVerificationsCount?: number;
    overdueCount?: number;
    studentCount?: number;
  };
  notes?: string;
  status: 'SENT' | 'DELIVERED' | 'VIEWED' | string;
  sentAt: string;
}

export type FeeItemStatus = 'Paid' | 'Partial' | 'Pending' | 'PAID' | 'PARTIAL' | 'PENDING';

export interface InvoiceFeeItem {
  id?: string;
  title: string;
  category?: string;
  amount: number;
  paidAmount?: number;
  balance?: number;
  status?: FeeItemStatus;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  branchId?: string;
  branchName?: string;
  parentId: string;
  parentName: string;
  term: string;
  academicYear: string;
  items: InvoiceFeeItem[];
  totalAmount: number;
  paidAmount: number;
  discountAmount?: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'Paid' | 'Partial' | 'Pending';
  dueDate: string;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | string;
  url: string;
  size?: string;
}

export interface FeePayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  parentId?: string;
  parentName?: string;
  branchId?: string;
  branchName?: string;
  term?: string;
  academicYear?: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Direct Bank Deposit' | 'Cash' | 'POS / Card Terminal' | 'Cheque' | 'Other Approved Offline Method' | 'Card (Flutterwave/Paystack)' | 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | string;
  transactionRef: string;
  paymentReference?: string;
  receiptNumber?: string;
  paidAt: string;
  receivedBy: string;
  status?: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  bankName?: string;
  accountHolderName?: string;
  proofUrl?: string;
  proofFileName?: string;
  adminRemarks?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;

  // Manual Offline Confirmation & Channel Tracking
  paymentChannel?: 'ONLINE_PARENT' | 'OFFLINE_MANUAL_BURSAR';
  isOfflineConfirmed?: boolean;
  confirmationNote?: string;
  confirmedBy?: string;
  confirmedByRole?: string;
  confirmedAt?: string;
  independentVerificationChecked?: boolean;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  className: string;
  branchId?: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "09:15"
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room?: string;
  roomNumber?: string;
  periodNumber?: number;
  type?: 'CORE' | 'ELECTIVE' | 'LAB' | 'ACTIVITY' | 'BREAK';
  notes?: string;
}

export interface ReportLinkMetadata {
  reportId: string;
  reportType: 'WEEKLY_STATUS' | 'ACADEMIC' | 'ATTENDANCE' | 'BEHAVIORAL' | 'ASSESSMENT' | 'END_OF_TERM' | string;
  reportTitle: string;
  studentId?: string;
  studentName?: string;
  className?: string;
  weekNumber?: number;
  term?: string;
  session?: string;
  summary?: string;
  submittedAt?: string;
  teacherName?: string;
}

export interface StaffQueryMetadata {
  isOfficialQuery: boolean;
  queryId: string;
  category: string;
  reason: string;
  deficiencies: string[];
  formalText: string;
  deadline?: string;
  response?: string;
  respondedAt?: string;
  status: 'PENDING_RESPONSE' | 'RESOLVED' | 'UNDER_REVIEW';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  studentId?: string;
  studentName?: string;
  subject: string;
  body?: string;
  content?: string;
  read: boolean;
  timestamp: string;
  attachments?: MessageAttachment[];
  reportMetadata?: ReportLinkMetadata;
  queryMetadata?: StaffQueryMetadata;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ATTENDANCE' | 'ACADEMIC' | 'FEE' | 'ANNOUNCEMENT' | 'SYSTEM';
  read: boolean;
  timestamp: string;
  actionLink?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  branchId?: string;
  branchName?: string;
  action: string;
  entityType: 'User' | 'Student' | 'Class' | 'Branch' | 'Assessment' | 'Attendance' | 'Fee' | 'Report' | 'AI' | 'Settings' | 'Calendar' | 'AcademicSession' | string;
  resourceType?: string;
  entityId?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AIGovernanceConfig {
  isAIEnabled: boolean;
  allowedRoles: UserRole[];
  enabledFeatures: {
    lessonGenerator: boolean;
    quizGenerator: boolean;
    reportCommentGenerator: boolean;
    studentInsights: boolean;
    parentInsights: boolean;
  };
  totalRequestsUsed: number;
  monthlyLimit: number;
}

export type PromotionStatus = 
  | 'Pending Promotion' 
  | 'Promoted' 
  | 'Not Promoted' 
  | 'Graduated' 
  | 'Withdrawn' 
  | 'Transferred' 
  | 'Repeating/Retained';

export interface StudentPromotionRecord {
  id: string;
  batchId?: string;
  studentId: string; // Database / Primary ID
  schoolId: string; // Institutional ID (e.g. ZCS/BUN/STU/00001)
  studentName: string;
  fromClassId: string;
  fromClassName: string;
  toClassId: string;
  toClassName: string;
  branchId: string;
  branchName: string;
  academicSession: string; // e.g. "2026/2027"
  term: string; // "Third Term"
  promotedAt: string;
  promotedByUserId: string;
  promotedByUserName: string;
  promotedByUserRole: UserRole;
  status: PromotionStatus;
  reason?: string;
  remarks?: string;
  averageScore?: number;
  isLocked: boolean;
}

export interface TermSubjectScoreRecord {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gpa?: number;
  remark: string;
  teacherName?: string;
}

export interface TermAcademicRecord {
  termId: string;
  termType: AcademicTermType;
  termName: string; // "First Term", "Second Term", "Third Term"
  subjects: TermSubjectScoreRecord[];
  totalScore: number;
  averageScore: number;
  letterGrade: string;
  gpa?: number;
  attendanceSummary: {
    presentDays: number;
    absentDays: number;
    totalDays: number;
    attendanceRate: number;
  };
  behaviorSummary?: {
    positiveCount: number;
    concernCount: number;
    conductRating: string;
  };
  teacherRemarks?: string;
  principalRemarks?: string;
  reportCardSnapshotUrl?: string;
}

export interface ArchiveCorrectionLog {
  id: string;
  correctedAt: string;
  correctedByUserId: string;
  correctedByUserName: string;
  correctedByUserRole: UserRole;
  reason: string;
  fieldChanged: string;
  oldValue: any;
  newValue: any;
}

export interface StudentSessionArchive {
  id: string;
  studentId: string; // Link to student ID
  schoolId: string; // Institutional ID
  studentName: string;
  avatar?: string;
  academicSession: string; // "2025/2026", "2026/2027"
  classId: string;
  className: string;
  branchId: string;
  branchName: string;
  terms: TermAcademicRecord[];
  sessionAverage: number;
  sessionGrade: string;
  promotionRecord?: StudentPromotionRecord;
  status: 'Active' | 'Completed' | 'Promoted' | 'Graduated' | 'Transferred' | 'Withdrawn' | 'Archived';
  graduationYear?: string;
  archivedAt: string;
  archivedByAdminName: string;
  isCorrected?: boolean;
  correctionHistory?: ArchiveCorrectionLog[];
}

export interface FormerStudentQueryFilter {
  search?: string;
  branchId?: string;
  status?: 'Graduated' | 'Transferred' | 'Withdrawn' | 'Archived' | 'ALL';
  academicSession?: string;
  graduationYear?: string;
  previousClassId?: string;
}

export interface ContactRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: UserRole;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// ==========================================
// TEACHER REASSIGNMENT AUDIT & DATA MODEL
// ==========================================
export interface TeacherReassignmentLog {
  id: string;
  teacherId: string;
  teacherName: string;
  staffId: string;
  previousBranchId: string;
  previousBranchName: string;
  previousClassIds: string[];
  previousClassNames: string[];
  previousSubjectIds: string[];
  previousSubjectNames: string[];
  previousFormClassId?: string;
  previousFormClassName?: string;
  newBranchId: string;
  newBranchName: string;
  newClassIds: string[];
  newClassNames: string[];
  newSubjectIds: string[];
  newSubjectNames: string[];
  newFormClassId?: string;
  newFormClassName?: string;
  effectiveDate: string; // YYYY-MM-DD
  reassignedByUserId: string;
  reassignedByUserName: string;
  reassignedByUserRole: string;
  reason?: string;
  createdAt: string;
}

// ==========================================
// TOPIC COMPLETION & CURRICULUM EVIDENCE
// ==========================================
export type TopicStatus = 'UPCOMING' | 'IN_PROGRESS' | 'READY_FOR_COMPLETION' | 'COMPLETED' | 'PENDING';

export interface CurriculumTopic {
  id: string;
  classId: string;
  className: string;
  branchId?: string;
  branchName?: string;
  subjectId: string;
  subjectName: string;
  term: string;
  weekNumber: number;
  topicTitle: string;
  title?: string;
  subTopic?: string;
  learningObjectives?: string[];
  teacherId?: string;
  teacherName?: string;
  status: TopicStatus;
  completedAt?: string;
  completedDate?: string;
  completedByTeacherId?: string;
  completedByTeacherName?: string;
  hasAssignmentRequired?: boolean;
  hasAssessmentAttached?: boolean;
  notes?: string;
  evidenceSummary?: string;
  academicSession?: string;
  estimatedPeriods?: number;
}

export interface TopicEvidence {
  topicId: string;
  hasLessonPlan: boolean;
  lessonPlanStatus?: 'Attached' | 'Missing';
  lessonPlanId?: string;
  hasLessonNote: boolean;
  lessonNoteStatus?: 'Attached' | 'Missing';
  lessonNoteId?: string;
  hasLessonPlanOrNote: boolean;
  lessonId?: string;
  lessonTitle?: string;
  lessonDelivered: boolean;
  hasAssignment: boolean;
  assignmentStatus?: 'Issued' | 'Missing';
  assignmentId?: string;
  assignmentTitle?: string;
  assignmentCompleted: boolean;
  hasAssessment: boolean;
  assessmentStatus?: 'Recorded' | 'Missing' | 'N/A';
  assessmentId?: string;
  assessmentTitle?: string;
  assessmentCompleted: boolean;
  isEligibleForCompletion: boolean;
  missingComponents: string[];
  pendingReason?: string;
}

// ==========================================
// CLASS PERFORMANCE & EVALUATION METRICS
// ==========================================
export type ClassHealthStatus = 'Excellent' | 'Very Good' | 'Satisfactory' | 'Needs Attention' | 'Critical';

export interface SubjectPerformanceMetric {
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  averageScore: number;
  grade: string;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  assessmentsCount: number;
  assignmentsCount: number;
  topicsTotal: number;
  topicsCompleted: number;
  topicsPending: number;
  isStrongest?: boolean;
  isWeakest?: boolean;
}

export interface ClassPerformanceMetrics {
  classId: string;
  className: string;
  branchId: string;
  branchName: string;
  sectionType: string;
  formTeacherId?: string;
  formTeacherName?: string;
  studentCount: number;
  totalStudents?: number;
  academicPerformance: number; // average %
  academicAverage?: number;
  attendanceRate: number; // %
  topicCompletionRate: number; // %
  assignmentCompletionRate: number; // %
  assessmentCompletionRate: number; // %
  overallScore: number; // multi-metric composite %
  healthStatus: ClassHealthStatus;
  subjectMetrics: SubjectPerformanceMetric[];
  subjectBreakdowns?: Array<{
    subjectName: string;
    teacherName?: string;
    averageScore: number;
    grade: string;
    passRate: number;
    topicsCompleted: number;
    totalTopics: number;
    assessmentsPending: number;
  }>;
  strongestSubject?: string;
  weakestSubject?: string;
  topStudents: Array<{
    id: string;
    name: string;
    admissionNumber?: string;
    average: number;
    grade: string;
  }>;
  topPerformers?: Array<{
    studentId: string;
    studentName: string;
    averageScore: number;
    grade: string;
    attendanceRate: number;
    rank: number;
  }>;
  financialStatus: {
    totalExpected: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    fullyPaidCount: number;
    partialCount: number;
    unpaidCount: number;
  };
  feeCollectionRate?: number;
  feeTotalOutstanding?: number;
  completedTopicsCount?: number;
  totalTopicsCount?: number;
  chronicAbsenteeismCount?: number;
  attendanceStats: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    totalRecords: number;
    atRiskStudentsCount: number;
  };
  academicTaskStats: {
    assignmentsIssued: number;
    assignmentsMarked: number;
    assessmentsConducted: number;
    assessmentsMissingResults: number;
  };
  topicsSummary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    upcoming: number;
  };
  attentionItems: string[];
  activitySummary: string;
}

export type DailyDiaryType = 'CLASSROOM_EVENT' | 'STUDENT_MILESTONE' | 'QUICK_NOTE';

export type DailyDiaryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DailyDiaryActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyDiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "09:30 AM"
  type: DailyDiaryType;
  title: string;
  content: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  branchId?: string;
  studentId?: string;
  studentName?: string;
  milestoneCategory?: 'ACADEMIC' | 'BEHAVIORAL' | 'CREATIVE' | 'SOCIAL_EMOTIONAL' | 'LEADERSHIP' | 'SPORTS';
  tags: string[];
  priority: DailyDiaryPriority;
  isPinned: boolean;
  isSharedWithParents?: boolean;
  moodEmoji?: string;
  actionItems?: DailyDiaryActionItem[];
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// TEACHER DAILY DIARY & ACTIVITY SYSTEM
// ==========================================
export type TeacherDailyActivityType =
  | 'ATTENDANCE'
  | 'LESSON_NOTE'
  | 'LESSON_PLAN'
  | 'ASSIGNMENT'
  | 'ASSIGNMENT_MARKED'
  | 'ASSESSMENT'
  | 'ASSESSMENT_SCORES'
  | 'BEHAVIORAL_LOG'
  | 'STUDENT_PROGRESS'
  | 'TOPIC_COMPLETION'
  | 'REPORT'
  | 'COMMUNICATION'
  | 'DAILY_NOTE';

export interface TeacherDailyActivityItem {
  id: string;
  type: TeacherDailyActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO string
  timeFormatted: string; // e.g. "8:05 AM"
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  status?: 'COMPLETED' | 'SUBMITTED' | 'APPROVED' | 'GRADED' | 'PUBLISHED' | 'RECORDED' | 'PENDING';
  referenceId?: string;
  referenceTab?: string;
  badgeColor?: string;
  iconType?: string;
  evidenceSummary?: string;
}

export interface TeacherDailyTaskStatus {
  id: string;
  category: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  timeFormatted?: string;
  actionRequired?: string;
  targetTab?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'ROUTINE';
}

export interface TeacherDailyWorkRecord {
  date: string;
  dateFormatted: string;
  teacherId: string;
  teacherName: string;
  role: string;
  branchId?: string;
  branchName?: string;
  formClassName?: string;
  formClassId?: string;
  assignedTasks: TeacherDailyTaskStatus[];
  totalAssignedCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  completionPercentage: number | null;
  completionStatusText: string;
  activities: TeacherDailyActivityItem[];
  conciseSummary: {
    headline: string;
    completedItemsBulletList: string[];
    outstandingItemsBulletList: string[];
  };
  personalNote?: DailyDiaryEntry;
}

// ==========================================
// STAFF PERFORMANCE & ACTIVITY EVALUATION
// ==========================================
export type StaffPerformanceRating =
  | 'Excellent'
  | 'Very Good'
  | 'Satisfactory'
  | 'Needs Attention'
  | 'Critical'
  | 'Insufficient Activity Data';

export interface StaffPerformanceEvaluation {
  staffId: string;
  userId: string;
  schoolId: string;
  name: string;
  role: string;
  rawRole: UserRole;
  branchId: string;
  branchName: string;
  accountStatus: 'active' | 'deactivated' | 'inactive' | 'suspended' | 'archived';
  loginAccessRevoked: boolean;
  assignedClasses: string[];
  assignedSubjects: string[];
  formClassName?: string;

  // Real platform metrics
  activityPercentage: number;
  deliveryPercentage: number;
  overallEffectiveness: number;
  rating: StaffPerformanceRating;
  insufficientData: boolean;

  // Breakdown
  activeDays: number;
  totalPeriodDays: number;
  lastLogin?: string;
  lastActivity?: string;

  // Completed & Outstanding
  completedActivities: Array<{ label: string; count: number; detail?: string }>;
  outstandingActivities: Array<{ label: string; count: number; detail?: string; isUrgent?: boolean }>;

  // Teaching Delivery (for teachers)
  teachingDelivery?: {
    classesTaught: string[];
    subjects: string[];
    topicsCompleted: number;
    topicsInProgress: number;
    topicsOutstanding: number;
    assignmentsIssued: number;
    assignmentsMarked: number;
    assessmentsConducted: number;
    resultsSubmitted: number;
    lessonPlansCount: number;
    lessonNotesCount: number;
  };

  // Administrative Delivery (for admins & bursars)
  administrativeDelivery?: {
    recordsHandled?: number;
    reportsGenerated?: number;
    financesProcessed?: number;
  };

  // Factual Natural Language Summaries
  performanceSummary: string;
  weeklyEvaluationSummary: string;
  requiresAttention: boolean;
}

export interface StaffQueryRecord {
  id: string;
  staffUserId: string;
  staffName: string;
  staffSchoolId: string;
  staffRole: string;
  directorUserId: string;
  directorName: string;
  date: string;
  time: string;
  category: string;
  reason: string;
  deficiencies: string[];
  content: string;
  deliveryStatus: 'DELIVERED' | 'SENT';
  readStatus: boolean;
  response?: string;
  respondedAt?: string;
  status: 'PENDING_RESPONSE' | 'RESOLVED' | 'UNDER_REVIEW';
}



