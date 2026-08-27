export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export type AcademicSection = 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';

export interface Branch {
  id: string;
  name: string; // e.g. "ZITEL CASTLE SCHOOL BUNGALOW"
  code: string; // e.g. "ZCS-BGL"
  address: string;
  phone: string;
  email: string;
  headTeacherOrPrincipal: string;
  status: 'active' | 'inactive';
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

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'suspended' | 'inactive';
  permissions: AdminPermission[];
  scope?: PermissionScope;
  branchId?: string; // e.g. 'branch_bungalow' or 'branch_ijegun'
  branchName?: string;
  assignedBranchIds?: string[]; // For regional or branch-specific admins
  customRoleTitle?: string;
  assignedClasses?: string[]; // Class IDs
  assignedSubjects?: string[]; // Subject IDs
  staffId?: string;
  phone?: string;
  address?: string;
  qualifications?: string | string[];
  linkedStudentIds?: string[]; // For parents: student IDs
  childrenIds?: string[]; // For parents: children student IDs
  studentProfileId?: string; // For students: student record ID
  createdAt: string;
  lastLogin?: string;
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
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  category: SubjectCategory | string;
  teacherId: string;
  teacherName: string;
  teacherType: TeacherAssignmentType;
  isCompulsory: boolean;
  status: 'active' | 'inactive';
  notes?: string;
  gradingStructureId?: string;
  periodsPerWeek?: number;
  updatedAt: string;
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

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string; // "08:30"
  endTime?: string; // "10:30"
  type: 'EXAM' | 'HOMEWORK_DEADLINE' | 'QUIZ' | 'HOLIDAY' | 'SCHOOL_EVENT' | 'PARENT_CONFERENCE' | 'FACULTY_MEETING';
  classId?: string; // Optional if class specific
  className?: string;
  subjectId?: string;
  subjectName?: string;
  branchId?: string; // Optional if branch specific or all
  branchName?: string;
  createdByTeacherId?: string;
  createdByName?: string;
  isSchoolWide: boolean;
  priority?: 'low' | 'medium' | 'high';
  color?: string;
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
  id: string;
  studentId: string; // e.g. "STU-2026-041"
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  dateOfBirth?: string;
  branchId: string; // 'branch_bungalow' | 'branch_ijegun'
  branchName?: string;
  classId: string;
  className: string;
  section?: string;
  admissionDate?: string;
  enrollmentDate?: string;
  parentIds: string[];
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
  status: 'Enrolled' | 'Graduated' | 'Transferred' | 'Suspended' | 'active' | 'inactive';
  bloodGroup?: string;
  house?: string;
}

export interface Parent {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  relationship: 'Mother' | 'Father' | 'Guardian' | string;
  address: string;
  occupation?: string;
  branchId?: string;
  branchName?: string;
  linkedStudentIds: string[];
  avatar?: string;
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
  paymentMethod: 'Bank Transfer' | 'Card (Flutterwave/Paystack)' | 'Cash' | 'Cheque' | 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | string;
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
  entityType: 'User' | 'Student' | 'Class' | 'Branch' | 'Assessment' | 'Attendance' | 'Fee' | 'Report' | 'AI' | 'Settings';
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
