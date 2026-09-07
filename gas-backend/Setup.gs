/**
 * Setup.gs
 * One-time / re-runnable schema setup for the MNS Portfolio spreadsheet.
 * Run setupSpreadsheet() once from the Apps Script editor (select the function, click Run).
 * It is idempotent: re-running it will NOT wipe existing data, only create missing
 * sheets/headers and add validation rules.
 */

var SPREADSHEET_ID = '1kFSFjl7uZ2J2LFhZ8pJp2FfM0gHhD2185gwvtpc984U';
var DRIVE_ROOT_FOLDER_ID = '1IcAcoYBS4sK9FDzQk7a1mQTM3I7Ejf-Z';

/**
 * Column definitions per sheet. First column of every sheet is a unique Id column.
 */
var SCHEMA = {
  Divisions: ['DivisionId', 'NameTH', 'NameEN', 'IsActive', 'CreatedAt'],

  Users: ['UserId', 'Email', 'Role', 'Status', 'DisplayNameTH', 'DisplayNameEN', 'CreatedAt', 'LastLogin',
    'DivisionId', 'IsHeadOfDivision'],

  Students: ['StudentId', 'UserId', 'StudentCode', 'PrefixTH', 'FirstNameTH', 'LastNameTH',
    'PrefixEN', 'FirstNameEN', 'LastNameEN', 'Cohort', 'AdmissionYear', 'EnrollmentStatus',
    'PhotoUrl', 'NationalIdMasked', 'BirthDate', 'Address', 'Phone', 'UniversityEmail',
    'SecondaryEmail', 'EmergencyContact', 'SupportNeeds', 'AcademicAdvisorId', 'MajorAdvisorId',
    'CoAdvisorId', 'DriveFolderId', 'CreatedAt', 'UpdatedAt', 'DivisionId'],

  EducationHistory: ['RecordId', 'StudentId', 'BachelorDegree', 'Institution', 'GraduationYear',
    'BachelorGPA', 'AdditionalEducation', 'PreAdmissionEnglishScore', 'UpdatedAt'],

  ProfessionalHistory: ['RecordId', 'StudentId', 'LicenseNumber', 'LicenseExpiry', 'Workplace',
    'PositionDept', 'WorkDuration', 'ElderlyCareExperience', 'Specialization',
    'TrainingHistory', 'UpdatedAt'],

  StudentGoals: ['RecordId', 'StudentId', 'ReasonForEnrollment', 'AcademicGoals', 'ProfessionalGoals',
    'ThesisInterest', 'CompetenciesToImprove', 'IDP', 'UpdatedAt'],

  CourseEnrollments: ['EnrollmentId', 'StudentId', 'AcademicYear', 'Semester', 'CourseCode',
    'CourseNameTH', 'CourseNameEN', 'CourseType', 'Credits', 'Grade', 'Status',
    'EvidenceUrl', 'UpdatedAt'],

  CourseCatalog: ['CourseCode', 'CourseNameTH', 'CourseNameEN', 'CourseType', 'Credits',
    'IsActive', 'CreatedAt'],

  SemesterRecords: ['RecordId', 'StudentId', 'AcademicYear', 'Semester', 'IssuesAndSupportNeeded',
    'NextSemesterPlan', 'SemesterGPA', 'OnTrackStatus', 'AdvisorFeedback', 'UpdatedAt'],

  PLOAssessments: ['AssessmentId', 'StudentId', 'PLO', 'CompetencyLevel', 'EvidenceUrl',
    'EvidenceDescription', 'StudentReflection', 'AdvisorComment', 'AssessedDate', 'UpdatedAt'],

  Portfolio: ['ItemId', 'StudentId', 'Category', 'Title', 'ItemDate', 'StudentRole',
    'RelatedPLOs', 'Outcome', 'FileUrl', 'CreatedAt'],

  ThesisProgress: ['ThesisId', 'StudentId', 'TitleTH', 'TitleEN', 'CurrentStep',
    'OverallProgressPercent', 'OnTrackStatus', 'MajorAdvisorId', 'CoAdvisorId',
    'CreatedAt', 'UpdatedAt'],

  ThesisSteps: ['StepRecordId', 'ThesisId', 'StepNumber', 'Status', 'PlannedDate', 'ActualDate',
    'StepProgressPercent', 'ApprovedBy', 'DetailJson', 'UpdatedAt'],

  AdvisingLogs: ['LogId', 'StudentId', 'AdvisorId', 'LogDate', 'Format', 'ConsultType',
    'Discussion', 'AdvisorSuggestion', 'ActionItems', 'DueDate', 'FileUrl',
    'AckByStudent', 'AckByAdvisor', 'IsConfidential', 'CreatedAt'],

  AdvisingLogReplies: ['ReplyId', 'LogId', 'StudentId', 'AuthorUserId', 'AuthorRole',
    'Message', 'FileUrl', 'IsSubmission', 'CreatedAt'],

  Appointments: ['AppointmentId', 'StudentId', 'AdvisorId', 'StartTime', 'EndTime', 'Location',
    'Topic', 'Status', 'CreatedBy', 'ConfirmedBy', 'CreatedAt'],

  Reflections: ['ReflectionId', 'StudentId', 'AcademicYear', 'Semester', 'Q1_GoalsAchieved',
    'Q2_BestWork', 'Q3_Problems', 'Q4_HowSolved', 'Q5_CompetenciesToImprove',
    'Q6_SupportNeeded', 'Q7_NextSemesterPlan', 'CreatedAt'],

  ProgressEvaluations: ['EvalId', 'StudentId', 'AcademicYear', 'Semester', 'Aspect',
    'SelfLevel', 'AdvisorLevel', 'EvidenceNotes', 'EvaluatedBy', 'UpdatedAt'],

  Notifications: ['NotificationId', 'UserId', 'AlertType', 'Message', 'ReadStatus',
    'Severity', 'RefTable', 'RefId', 'CreatedAt'],

  Messages: ['MessageId', 'FromUserId', 'ToUserId', 'StudentContextId', 'Subject', 'Body',
    'SentAt', 'ReadStatus'],

  ChatMessages: ['ChatMessageId', 'ThreadId', 'FromUserId', 'ToUserId', 'Body', 'FileUrl',
    'ReadStatus', 'CreatedAt'],

  AuditLog: ['LogId', 'UserId', 'Action', 'TargetTable', 'TargetId', 'Timestamp', 'Detail']
};

/**
 * Dropdown validations: sheetName -> { columnName: [allowed values] }
 */
var VALIDATIONS = {
  Users: {
    Role: ['student', 'advisor', 'executive', 'admin'],
    Status: ['pending', 'awaiting_profile', 'active', 'disabled'],
    IsHeadOfDivision: ['TRUE', 'FALSE']
  },
  Students: {
    EnrollmentStatus: ['กำลังศึกษา', 'ลาพักการศึกษา', 'รักษาสถานภาพ', 'สำเร็จการศึกษา', 'พ้นสภาพ']
  },
  CourseCatalog: {
    CourseType: ['วิชาแกน', 'วิชาบังคับเฉพาะสาขา', 'วิชาเลือก', 'วิทยานิพนธ์'],
    IsActive: ['TRUE', 'FALSE']
  },
  CourseEnrollments: {
    Semester: ['1', '2', 'summer'],
    CourseType: ['วิชาแกน', 'วิชาบังคับเฉพาะสาขา', 'วิชาเลือก', 'วิทยานิพนธ์'],
    Grade: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'S', 'U', 'I', 'W', ''],
    Status: ['ลงทะเบียน', 'กำลังศึกษา', 'ผ่าน', 'ถอน', 'ไม่ผ่าน']
  },
  SemesterRecords: {
    Semester: ['1', '2', 'summer'],
    OnTrackStatus: ['เป็นไปตามแผน', 'ต้องติดตาม', 'ล่าช้า']
  },
  PLOAssessments: {
    PLO: ['PLO1', 'PLO2', 'PLO3', 'PLO4', 'PLO5', 'PLO6', 'PLO7'],
    CompetencyLevel: ['เริ่มต้น', 'กำลังพัฒนา', 'บรรลุ', 'สูงกว่าเกณฑ์']
  },
  Portfolio: {
    Category: [
      'ผลงานรายวิชา', 'รายงานกรณีศึกษา', 'ผลงานการปฏิบัติการพยาบาลขั้นสูง',
      'โครงการพัฒนาคุณภาพ', 'นวัตกรรมทางการพยาบาล', 'การนำเสนอในชั้นเรียน',
      'การประชุมวิชาการ', 'บทความหรือผลงานตีพิมพ์', 'รางวัลและเกียรติบัตร',
      'กิจกรรมบริการวิชาการ', 'กิจกรรมภาวะผู้นำและจิตอาสา', 'การอบรมและการพัฒนาวิชาชีพ'
    ]
  },
  ThesisSteps: {
    StepNumber: ['1', '2', '3', '4', '5', '6', '7', '8'],
    Status: ['รอดำเนินการ', 'กำลังดำเนินการ', 'สำเร็จ']
  },
  AdvisingLogs: {
    Format: ['On-site', 'Online', 'โทรศัพท์'],
    ConsultType: ['การเรียน', 'วิทยานิพนธ์', 'การเผยแพร่', 'ปัญหาส่วนบุคคล'],
    IsConfidential: ['TRUE', 'FALSE']
  },
  AdvisingLogReplies: {
    AuthorRole: ['student', 'advisor', 'executive', 'admin'],
    IsSubmission: ['TRUE', 'FALSE']
  },
  Appointments: {
    Status: ['proposed', 'confirmed', 'cancelled']
  },
  Notifications: {
    Severity: ['เขียว', 'เหลือง', 'แดง', 'เทา'],
    ReadStatus: ['read', 'unread']
  },
  ChatMessages: {
    ReadStatus: ['read', 'unread']
  }
};

function setupSpreadsheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  Object.keys(SCHEMA).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    var headers = SCHEMA[sheetName];
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold').setBackground('#8B1A1A').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    if (sheet.getMaxColumns() > headers.length) {
      sheet.deleteColumns(headers.length + 1, sheet.getMaxColumns() - headers.length);
    }
  });

  // Remove default "Sheet1" if it still exists and is empty
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  applyValidations_(ss);
  applyDateColumnFormats_(ss);

  Logger.log('setupSpreadsheet complete. Sheets: ' + ss.getSheets().map(function (s) { return s.getName(); }).join(', '));
}

/**
 * Columns fed exclusively by <input type="date"> (plain 'YYYY-MM-DD', no time-of-day).
 * Forced to plain-text number format so Sheets never silently re-types them as its
 * native date type on setValue()/manual entry — rowToObject_ still normalizes any Date
 * object that slips through (e.g. pre-existing cells), but this stops new ones at the
 * write side too.
 */
var DATE_COLUMNS = {
  Students: ['BirthDate'],
  ProfessionalHistory: ['LicenseExpiry'],
  ThesisSteps: ['PlannedDate', 'ActualDate'],
  Portfolio: ['ItemDate'],
  AdvisingLogs: ['LogDate', 'DueDate']
};

function applyDateColumnFormats_(ss) {
  Object.keys(DATE_COLUMNS).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var headers = SCHEMA[sheetName];
    DATE_COLUMNS[sheetName].forEach(function (colName) {
      var colIndex = headers.indexOf(colName) + 1;
      if (colIndex === 0) return;
      sheet.getRange(2, colIndex, 999, 1).setNumberFormat('@');
    });
  });
}

function applyValidations_(ss) {
  Object.keys(VALIDATIONS).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var headers = SCHEMA[sheetName];
    var colValidations = VALIDATIONS[sheetName];

    Object.keys(colValidations).forEach(function (colName) {
      var colIndex = headers.indexOf(colName) + 1;
      if (colIndex === 0) return;
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(colValidations[colName], true)
        .setAllowInvalid(true)
        .build();
      // Apply to a generous range (rows 2-1000) to cover future data entry
      sheet.getRange(2, colIndex, 999, 1).setDataValidation(rule);
    });
  });
}

/**
 * Bootstrap the very first Admin user so someone can log in and whitelist others.
 * Run manually once from the Apps Script editor:
 *   seedFirstAdmin('yourname@gmail.com', 'Your Name TH', 'Your Name EN')
 */
function seedFirstAdmin(email, nameTH, nameEN) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === String(email).toLowerCase()) {
      sheet.getRange(i + 1, 3).setValue('admin');
      sheet.getRange(i + 1, 4).setValue('active');
      invalidateSheetCache_('Users');
      Logger.log('Existing user updated to admin/active: ' + email);
      return;
    }
  }
  var userId = 'U-' + Utilities.getUuid().slice(0, 8);
  sheet.appendRow([userId, email, 'admin', 'active', nameTH || '', nameEN || '', new Date(), '']);
  invalidateSheetCache_('Users');
  Logger.log('Admin user created: ' + email + ' (' + userId + ')');
}

/**
 * HTTP-reachable one-time bootstrap (see Code.gs action 'bootstrapFirstAdmin').
 * Refuses to run if any admin user already exists, so it cannot be used to mint
 * extra admins later — only to get the very first one in without hand-editing
 * the Apps Script editor.
 */
function bootstrapFirstAdmin_(email, nameTH, nameEN) {
  if (!email) throw new Error('email is required');

  var existingAdmins = findRows_('Users', function (u) { return u.Role === 'admin'; });
  if (existingAdmins.length > 0) {
    throw new Error('An admin already exists. Use the admin UI to grant access instead.');
  }

  var existing = findRows_('Users', function (u) {
    return String(u.Email).toLowerCase() === String(email).toLowerCase();
  })[0];

  if (existing) {
    updateRowById_('Users', existing.UserId, { Role: 'admin', Status: 'active' });
    return { userId: existing.UserId, email: email, role: 'admin', status: 'active' };
  }

  var userId = generateId_('Users');
  appendRow_('Users', {
    UserId: userId,
    Email: email,
    Role: 'admin',
    Status: 'active',
    DisplayNameTH: nameTH || '',
    DisplayNameEN: nameEN || '',
    CreatedAt: nowIso_(),
    LastLogin: ''
  });
  return { userId: userId, email: email, role: 'admin', status: 'active' };
}
