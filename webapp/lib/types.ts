// Shared TypeScript types mirroring the Google Sheets schema (see gas-backend/Setup.gs).
// Keep field names identical to the sheet headers so payloads can be passed straight through.

export type Role = 'student' | 'advisor' | 'executive' | 'admin';
export type UserStatus = 'pending' | 'awaiting_profile' | 'active' | 'disabled';

export interface AppUser {
  UserId: string;
  Email: string;
  Role: Role;
  Status: UserStatus;
  DisplayNameTH: string;
  DisplayNameEN: string;
  CreatedAt: string;
  LastLogin: string;
  DivisionId?: string;
  IsHeadOfDivision?: 'TRUE' | 'FALSE';
}

export interface CourseCatalogItem {
  CourseCode: string;
  CourseNameTH: string;
  CourseNameEN: string;
  CourseType: CourseType;
  Credits: number;
  IsActive: 'TRUE' | 'FALSE';
  CreatedAt: string;
}

export interface Division {
  DivisionId: string;
  NameTH: string;
  NameEN: string;
  IsActive: 'TRUE' | 'FALSE';
  CreatedAt: string;
}

export type EnrollmentStatus = 'กำลังศึกษา' | 'ลาพักการศึกษา' | 'รักษาสถานภาพ' | 'สำเร็จการศึกษา' | 'พ้นสภาพ';

export interface StudentActivityRow {
  studentId: string;
  studentCode: string;
  name: string;
  cohort: string;
  divisionId: string;
  enrollmentStatus: EnrollmentStatus;
  photoUrl: string;
  advisingLogCount: number;
  hasThesis: boolean;
  thesisCurrentStep: number | null;
  reflectionCount: number;
  lastActivityAt: string | null;
}

export interface Student {
  StudentId: string;
  UserId: string;
  StudentCode: string;
  PrefixTH: string;
  FirstNameTH: string;
  LastNameTH: string;
  PrefixEN: string;
  FirstNameEN: string;
  LastNameEN: string;
  Cohort: string;
  AdmissionYear: string;
  EnrollmentStatus: EnrollmentStatus;
  PhotoUrl: string;
  NationalIdMasked?: string;
  BirthDate?: string;
  Address?: string;
  Phone?: string;
  UniversityEmail?: string;
  SecondaryEmail?: string;
  EmergencyContact?: string;
  SupportNeeds?: string;
  AcademicAdvisorId: string;
  MajorAdvisorId: string;
  CoAdvisorId: string;
  DriveFolderId?: string;
  CreatedAt: string;
  UpdatedAt: string;
  DivisionId?: string;
}

export interface EducationHistory {
  RecordId: string;
  StudentId: string;
  BachelorDegree: string;
  Institution: string;
  GraduationYear: string;
  BachelorGPA: string;
  AdditionalEducation: string;
  PreAdmissionEnglishScore: string;
  UpdatedAt: string;
}

export interface ProfessionalHistory {
  RecordId: string;
  StudentId: string;
  LicenseNumber: string;
  LicenseExpiry: string;
  Workplace: string;
  PositionDept: string;
  WorkDuration: string;
  ElderlyCareExperience: string;
  Specialization: string;
  TrainingHistory: string;
  UpdatedAt: string;
}

export interface StudentGoals {
  RecordId: string;
  StudentId: string;
  ReasonForEnrollment: string;
  AcademicGoals: string;
  ProfessionalGoals: string;
  ThesisInterest: string;
  CompetenciesToImprove: string;
  IDP: string;
  UpdatedAt: string;
}

export type Semester = '1' | '2' | 'summer';
export type CourseType = 'วิชาแกน' | 'วิชาบังคับเฉพาะสาขา' | 'วิชาเลือก' | 'วิทยานิพนธ์';
export type CourseStatus = 'ลงทะเบียน' | 'กำลังศึกษา' | 'ผ่าน' | 'ถอน' | 'ไม่ผ่าน';

export interface CourseEnrollment {
  EnrollmentId: string;
  StudentId: string;
  AcademicYear: string;
  Semester: Semester;
  CourseCode: string;
  CourseNameTH: string;
  CourseNameEN: string;
  CourseType: CourseType;
  Credits: number;
  Grade: string;
  Status: CourseStatus;
  EvidenceUrl: string;
  UpdatedAt: string;
}

export interface SemesterRecord {
  RecordId: string;
  StudentId: string;
  AcademicYear: string;
  Semester: Semester;
  IssuesAndSupportNeeded: string;
  NextSemesterPlan: string;
  SemesterGPA: string;
  OnTrackStatus: 'เป็นไปตามแผน' | 'ต้องติดตาม' | 'ล่าช้า';
  AdvisorFeedback: string;
  UpdatedAt: string;
}

export interface AcademicSummary {
  creditsRequired: number;
  creditsRegistered: number;
  creditsPassed: number;
  creditsRemaining: number;
  gpax: number | null;
  latestSemesterGpa: number | null;
  gpaTrend: { academicYear: string; semester: string; gpa: number | null }[];
  incompleteCourses: CourseEnrollment[];
}

export type PLOCode = 'PLO1' | 'PLO2' | 'PLO3' | 'PLO4' | 'PLO5' | 'PLO6' | 'PLO7';
export type CompetencyLevel = 'เริ่มต้น' | 'กำลังพัฒนา' | 'บรรลุ' | 'สูงกว่าเกณฑ์';

export interface PLOAssessment {
  AssessmentId: string;
  StudentId: string;
  PLO: PLOCode;
  CompetencyLevel: CompetencyLevel;
  EvidenceUrl: string;
  EvidenceDescription: string;
  StudentReflection: string;
  AdvisorComment: string;
  AssessedDate: string;
  UpdatedAt: string;
}

export interface PLOWithAssessment {
  plo: PLOCode;
  nameTH: string;
  assessment: PLOAssessment | null;
}

export type PortfolioCategory =
  | 'ผลงานรายวิชา' | 'รายงานกรณีศึกษา' | 'ผลงานการปฏิบัติการพยาบาลขั้นสูง'
  | 'โครงการพัฒนาคุณภาพ' | 'นวัตกรรมทางการพยาบาล' | 'การนำเสนอในชั้นเรียน'
  | 'การประชุมวิชาการ' | 'บทความหรือผลงานตีพิมพ์' | 'รางวัลและเกียรติบัตร'
  | 'กิจกรรมบริการวิชาการ' | 'กิจกรรมภาวะผู้นำและจิตอาสา' | 'การอบรมและการพัฒนาวิชาชีพ';

export interface PortfolioItem {
  ItemId: string;
  StudentId: string;
  Category: PortfolioCategory;
  Title: string;
  ItemDate: string;
  StudentRole: string;
  RelatedPLOs: string;
  Outcome: string;
  FileUrl: string;
  CreatedAt: string;
}

export type ThesisStepStatus = 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'สำเร็จ';

export interface ThesisProgress {
  ThesisId: string;
  StudentId: string;
  TitleTH: string;
  TitleEN: string;
  CurrentStep: number;
  OverallProgressPercent: number;
  OnTrackStatus: 'เป็นไปตามแผน' | 'ต้องติดตาม' | 'ล่าช้า';
  MajorAdvisorId: string;
  CoAdvisorId: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ThesisStepView {
  step: number;
  nameTH: string;
  weightPercent: number;
  status: ThesisStepStatus;
  plannedDate: string;
  actualDate: string;
  approvedBy: string;
  detail: Record<string, unknown>;
  stepRecordId: string | null;
}

export interface ThesisDetail {
  thesis: ThesisProgress;
  steps: ThesisStepView[];
}

export interface AdvisingLog {
  LogId: string;
  StudentId: string;
  AdvisorId: string;
  LogDate: string;
  Format: 'On-site' | 'Online' | 'โทรศัพท์';
  ConsultType: 'การเรียน' | 'วิทยานิพนธ์' | 'การเผยแพร่' | 'ปัญหาส่วนบุคคล';
  Discussion: string;
  AdvisorSuggestion: string;
  ActionItems: string;
  DueDate: string;
  FileUrl: string;
  AckByStudent: 'TRUE' | 'FALSE';
  AckByAdvisor: 'TRUE' | 'FALSE';
  IsConfidential: 'TRUE' | 'FALSE';
  CreatedAt: string;
}

export interface AdvisingLogReply {
  ReplyId: string;
  LogId: string;
  StudentId: string;
  AuthorUserId: string;
  AuthorRole: Role;
  Message: string;
  FileUrl: string;
  IsSubmission: 'TRUE' | 'FALSE';
  CreatedAt: string;
}

export interface Appointment {
  AppointmentId: string;
  StudentId: string;
  AdvisorId: string;
  StartTime: string;
  EndTime: string;
  Location: string;
  Topic: string;
  Status: 'proposed' | 'confirmed' | 'cancelled';
  CreatedBy: string;
  ConfirmedBy: string;
  CreatedAt: string;
}

export interface Reflection {
  ReflectionId: string;
  StudentId: string;
  AcademicYear: string;
  Semester: Semester;
  Q1_GoalsAchieved: string;
  Q2_BestWork: string;
  Q3_Problems: string;
  Q4_HowSolved: string;
  Q5_CompetenciesToImprove: string;
  Q6_SupportNeeded: string;
  Q7_NextSemesterPlan: string;
  CreatedAt: string;
}

export interface ProgressEvaluation {
  EvalId: string | null;
  StudentId: string;
  AcademicYear: string;
  Semester: Semester;
  Aspect: string;
  SelfLevel: string;
  AdvisorLevel: string;
  EvidenceNotes: string;
}

export interface EvaluatedPeriod {
  academicYear: string;
  semester: Semester;
  aspectsRated: number;
  averageSelfLevel: number | null;
  averageAdvisorLevel: number | null;
  updatedAt: string;
}

export type NotificationSeverity = 'เขียว' | 'เหลือง' | 'แดง' | 'เทา';

export interface AppNotification {
  NotificationId: string;
  UserId: string;
  AlertType: string;
  Message: string;
  ReadStatus: 'read' | 'unread';
  Severity: NotificationSeverity;
  RefTable: string;
  RefId: string;
  CreatedAt: string;
}

export interface AppMessage {
  MessageId: string;
  FromUserId: string;
  ToUserId: string;
  StudentContextId: string;
  Subject: string;
  Body: string;
  SentAt: string;
  ReadStatus: 'read' | 'unread';
}

export interface ChatContact {
  userId: string;
  displayNameTH: string;
  displayNameEN: string;
  role: Role;
}

export interface ChatMessage {
  ChatMessageId: string;
  ThreadId: string;
  FromUserId: string;
  ToUserId: string;
  Body: string;
  FileUrl: string;
  ReadStatus: 'read' | 'unread';
  CreatedAt: string;
}

export type RiskLevel = 'green' | 'yellow' | 'red' | 'gray' | 'graduated';

export interface DashboardStudentRow {
  studentId: string;
  studentCode: string;
  name: string;
  cohort: string;
  status: EnrollmentStatus;
  gpax: number | null;
  creditsPassed: number;
  creditsRequired: number;
  thesisStep: number | null;
  thesisProgressPercent: number;
  riskLevel: RiskLevel;
}

export interface CohortComparisonRow {
  cohort: string;
  total: number;
  onTrack: number;
  needsFollowUp: number;
  atRisk: number;
  averageGpax: number | null;
  averageCredits: number | null;
}

export interface AdvisorDashboard {
  summary: { total: number; onTrack: number; needsFollowUp: number; atRisk: number; graduated: number };
  students: DashboardStudentRow[];
  cohortComparison: CohortComparisonRow[];
  thesisByCohort: { cohort: string; total: number; completed: number; inProgress: number; notStarted: number }[];
  alerts: AppNotification[];
}

export interface StudentDashboard {
  profile: Student;
  academic: AcademicSummary;
  thesis: ThesisProgress | null;
  portfolioCount: number;
  alerts: AppNotification[];
}

export type DashboardData = AdvisorDashboard | StudentDashboard;

export interface GasResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  authError?: boolean;
}
