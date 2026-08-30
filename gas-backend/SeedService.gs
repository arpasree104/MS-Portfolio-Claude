/**
 * SeedService.gs
 * Admin-only demo data generator + safe cleanup. Every row this file creates uses a
 * hand-built ID starting with "SEED-" (never produced by generateId_/generateSequentialDivisionId_
 * or any real signup flow), so clearSeedData_ can safely delete exactly and only what this
 * file created, no matter how many times seedDemoData_ has been re-run or how much real
 * data has been entered since.
 */

var SEED_SHEETS_WITH_ID = [
  'Users', 'Students', 'EducationHistory', 'ProfessionalHistory', 'StudentGoals',
  'CourseEnrollments', 'SemesterRecords', 'PLOAssessments', 'Portfolio',
  'ThesisProgress', 'ThesisSteps', 'AdvisingLogs', 'Appointments',
  'Reflections', 'ProgressEvaluations', 'Notifications', 'Messages', 'Divisions'
];

function seedDemoData_(caller) {
  requireRole_(caller, ['admin']);

  var divisionId = 'SEED-DIV-1';
  appendRow_('Divisions', {
    DivisionId: divisionId,
    NameTH: 'สาขาทดสอบ (ตัวอย่าง)',
    NameEN: 'Demo Division (Sample)',
    IsActive: 'TRUE',
    CreatedAt: nowIso_()
  });

  var advisor1 = { UserId: 'SEED-USR-ADV-1', nameTH: 'อาจารย์ สมชาย ใจดี', nameEN: 'Somchai Jaidee' };
  var advisor2 = { UserId: 'SEED-USR-ADV-2', nameTH: 'อาจารย์ สมหญิง หัวหน้าสาขา', nameEN: 'Somying Head' };

  appendRow_('Users', {
    UserId: advisor1.UserId, Email: 'seed.advisor1@example.com', Role: 'advisor', Status: 'active',
    DisplayNameTH: advisor1.nameTH, DisplayNameEN: advisor1.nameEN,
    CreatedAt: nowIso_(), LastLogin: '', DivisionId: divisionId, IsHeadOfDivision: 'FALSE'
  });
  appendRow_('Users', {
    UserId: advisor2.UserId, Email: 'seed.advisor2@example.com', Role: 'advisor', Status: 'active',
    DisplayNameTH: advisor2.nameTH, DisplayNameEN: advisor2.nameEN,
    CreatedAt: nowIso_(), LastLogin: '', DivisionId: divisionId, IsHeadOfDivision: 'TRUE'
  });

  var students = [
    {
      idx: 1, userId: 'SEED-USR-STU-1', studentId: 'SEED-STU-1', code: '6801234501',
      firstTH: 'กัญญารัตน์', lastTH: 'วงศ์สกุล', firstEN: 'Kanyarat', lastEN: 'Wongsakul',
      cohort: '2568', status: 'กำลังศึกษา', advisor: advisor1.UserId,
      grades: ['A', 'B+', 'A-'], thesisStep: 1
    },
    {
      idx: 2, userId: 'SEED-USR-STU-2', studentId: 'SEED-STU-2', code: '6801234502',
      firstTH: 'จิรพงศ์', lastTH: 'แสงทอง', firstEN: 'Jirapong', lastEN: 'Saengthong',
      cohort: '2568', status: 'กำลังศึกษา', advisor: advisor1.UserId,
      grades: ['B', 'B', 'C+'], thesisStep: 3
    },
    {
      idx: 3, userId: 'SEED-USR-STU-3', studentId: 'SEED-STU-3', code: '6801234503',
      firstTH: 'ปรีณา', lastTH: 'ศรีสมบัติ', firstEN: 'Preena', lastEN: 'Srisombat',
      cohort: '2567', status: 'กำลังศึกษา', advisor: advisor2.UserId,
      grades: ['A', 'A-', 'A'], thesisStep: 5
    },
    {
      idx: 4, userId: 'SEED-USR-STU-4', studentId: 'SEED-STU-4', code: '6701234504',
      firstTH: 'ธนกร', lastTH: 'พิพัฒน์กุล', firstEN: 'Thanakorn', lastEN: 'Pipatkul',
      cohort: '2567', status: 'กำลังศึกษา', advisor: advisor2.UserId,
      grades: ['B+', 'A-', 'B+'], thesisStep: 7
    },
    {
      idx: 5, userId: 'SEED-USR-STU-5', studentId: 'SEED-STU-5', code: '6601234505',
      firstTH: 'อรวรรณ', lastTH: 'บุญมาก', firstEN: 'Orawan', lastEN: 'Boonmak',
      cohort: '2566', status: 'สำเร็จการศึกษา', advisor: advisor1.UserId,
      grades: ['A', 'A', 'A-'], thesisStep: 8
    }
  ];

  students.forEach(function (s) {
    appendRow_('Users', {
      UserId: s.userId, Email: 'seed.student' + s.idx + '@example.com', Role: 'student', Status: 'active',
      DisplayNameTH: s.firstTH + ' ' + s.lastTH, DisplayNameEN: s.firstEN + ' ' + s.lastEN,
      CreatedAt: nowIso_(), LastLogin: '', DivisionId: divisionId, IsHeadOfDivision: 'FALSE'
    });

    appendRow_('Students', {
      StudentId: s.studentId, UserId: s.userId, StudentCode: s.code,
      PrefixTH: 'นาย/นางสาว', FirstNameTH: s.firstTH, LastNameTH: s.lastTH,
      PrefixEN: 'Mr./Ms.', FirstNameEN: s.firstEN, LastNameEN: s.lastEN,
      Cohort: s.cohort, AdmissionYear: s.cohort, EnrollmentStatus: s.status,
      PhotoUrl: '', NationalIdMasked: 'x-xxxx-xxxxx-xx-x', BirthDate: '2540-01-15',
      Address: 'กรุงเทพมหานคร (ข้อมูลตัวอย่าง)', Phone: '08X-XXX-XXXX',
      UniversityEmail: 'seed.student' + s.idx + '@dome.tu.ac.th', SecondaryEmail: '',
      EmergencyContact: 'ผู้ปกครอง (ตัวอย่าง) 08X-XXX-XXXX', SupportNeeds: '',
      AcademicAdvisorId: s.advisor, MajorAdvisorId: s.advisor, CoAdvisorId: '',
      DriveFolderId: '', CreatedAt: nowIso_(), UpdatedAt: nowIso_(), DivisionId: divisionId
    });

    appendRow_('EducationHistory', {
      RecordId: 'SEED-EDU-' + s.idx, StudentId: s.studentId,
      BachelorDegree: 'พยาบาลศาสตรบัณฑิต', Institution: 'มหาวิทยาลัยตัวอย่าง',
      GraduationYear: String(Number(s.cohort) - 4), BachelorGPA: '3.4',
      AdditionalEducation: '', PreAdmissionEnglishScore: 'TU-GET 550', UpdatedAt: nowIso_()
    });

    appendRow_('ProfessionalHistory', {
      RecordId: 'SEED-PROF-' + s.idx, StudentId: s.studentId,
      LicenseNumber: 'RN-SEED-' + s.idx, LicenseExpiry: '2029-12-31',
      Workplace: 'โรงพยาบาลตัวอย่าง', PositionDept: 'พยาบาลวิชาชีพ / แผนกอายุรกรรม',
      WorkDuration: '3 ปี', ElderlyCareExperience: '2 ปี',
      Specialization: 'การพยาบาลผู้สูงอายุ', TrainingHistory: 'BLS, ACLS', UpdatedAt: nowIso_()
    });

    appendRow_('StudentGoals', {
      RecordId: 'SEED-GOAL-' + s.idx, StudentId: s.studentId,
      ReasonForEnrollment: 'ต้องการพัฒนาความเชี่ยวชาญด้านการพยาบาลผู้สูงอายุ (ข้อมูลตัวอย่าง)',
      AcademicGoals: 'สำเร็จการศึกษาตามแผน', ProfessionalGoals: 'เป็นพยาบาลผู้เชี่ยวชาญเฉพาะทาง',
      ThesisInterest: 'การดูแลผู้สูงอายุโรคเรื้อรัง', CompetenciesToImprove: 'การวิจัยและสถิติ',
      IDP: 'เข้าร่วมอบรมวิจัยเพิ่มเติมในภาคเรียนถัดไป', UpdatedAt: nowIso_()
    });

    var semesters = [{ y: s.cohort, sem: '1' }, { y: s.cohort, sem: '2' }];
    var courseNames = [
      ['NSAD 611', 'Advanced Pathophysiology for Nurses', 'วิชาแกน'],
      ['NSAD 612', 'Advanced Health Assessment', 'วิชาบังคับเฉพาะสาขา'],
      ['NSAD 613', 'Research Methodology for Nursing Science', 'วิชาบังคับเฉพาะสาขา']
    ];
    courseNames.forEach(function (c, ci) {
      var sem = semesters[ci % semesters.length];
      appendRow_('CourseEnrollments', {
        EnrollmentId: 'SEED-CRS-' + s.idx + '-' + ci, StudentId: s.studentId,
        AcademicYear: sem.y, Semester: sem.sem, CourseCode: c[0], CourseNameTH: c[1], CourseNameEN: c[1],
        CourseType: c[2], Credits: 3, Grade: s.grades[ci] || 'B+', Status: 'ผ่าน',
        EvidenceUrl: '', UpdatedAt: nowIso_()
      });
    });

    appendRow_('PLOAssessments', {
      AssessmentId: 'SEED-PLO-' + s.idx, StudentId: s.studentId, PLO: 'PLO1',
      CompetencyLevel: 'กำลังพัฒนา', EvidenceUrl: '',
      EvidenceDescription: 'รายงานกรณีศึกษาตัวอย่าง', StudentReflection: 'ได้เรียนรู้การประเมินผู้ป่วยผู้สูงอายุอย่างเป็นระบบ',
      AdvisorComment: '', AssessedDate: nowIso_(), UpdatedAt: nowIso_()
    });

    appendRow_('Portfolio', {
      ItemId: 'SEED-PF-' + s.idx, StudentId: s.studentId, Category: 'รายงานกรณีศึกษา',
      Title: 'กรณีศึกษาผู้สูงอายุโรคเรื้อรัง (ตัวอย่าง)', ItemDate: '2025-06-01',
      StudentRole: 'ผู้จัดทำหลัก', RelatedPLOs: 'PLO1, PLO3', Outcome: 'ผ่านการประเมิน',
      FileUrl: '', CreatedAt: nowIso_()
    });

    appendRow_('AdvisingLogs', {
      LogId: 'SEED-ADV-' + s.idx, StudentId: s.studentId, AdvisorId: s.advisor,
      LogDate: '2025-08-01', Format: 'On-site', ConsultType: 'การเรียน',
      Discussion: 'ติดตามความก้าวหน้าการเรียนและวิทยานิพนธ์ (ตัวอย่าง)',
      AdvisorSuggestion: 'ควรทบทวนบทที่ 2 เพิ่มเติม', ActionItems: 'ส่งร่างบทที่ 2', DueDate: '2025-09-01',
      FileUrl: '', AckByStudent: s.idx % 2 === 0 ? 'TRUE' : 'FALSE', AckByAdvisor: 'TRUE',
      IsConfidential: s.idx === 2 ? 'TRUE' : 'FALSE', CreatedAt: nowIso_()
    });

    appendRow_('Appointments', {
      AppointmentId: 'SEED-APT-' + s.idx, StudentId: s.studentId, AdvisorId: s.advisor,
      StartTime: '2025-09-15T10:00:00', EndTime: '2025-09-15T10:30:00', Location: 'ห้องพักอาจารย์ (ตัวอย่าง)',
      Topic: 'ปรึกษาความก้าวหน้าวิทยานิพนธ์', Status: s.idx % 2 === 0 ? 'confirmed' : 'proposed',
      CreatedBy: s.userId, ConfirmedBy: s.idx % 2 === 0 ? s.advisor : '', CreatedAt: nowIso_()
    });

    seedThesisForStudent_(s, divisionId);
  });

  return {
    divisionId: divisionId,
    advisorsCreated: 2,
    studentsCreated: students.length,
    message: 'สร้างข้อมูลตัวอย่างสำเร็จ: 1 สาขา, 2 อาจารย์, ' + students.length + ' นักศึกษา พร้อมข้อมูลประกอบครบทุกด้าน'
  };
}

/** Builds a ThesisProgress + full ThesisSteps set parked at student.thesisStep, all earlier steps marked complete. */
function seedThesisForStudent_(s, divisionId) {
  var thesisId = 'SEED-THESIS-' + s.idx;
  var weights = [10, 20, 50, 65, 80, 90, 95, 100];
  var currentStep = s.thesisStep;
  var overallProgress = currentStep > 0 ? weights[currentStep - 1] : 0;
  var onTrack = currentStep === 3 ? 'ต้องติดตาม' : 'เป็นไปตามแผน';

  appendRow_('ThesisProgress', {
    ThesisId: thesisId, StudentId: s.studentId,
    TitleTH: 'ผลของโปรแกรมการดูแล...ต่อผู้สูงอายุโรคเรื้อรัง (ชื่อตัวอย่าง #' + s.idx + ')',
    TitleEN: 'Effect of a care program on chronic-disease older adults (sample #' + s.idx + ')',
    CurrentStep: currentStep, OverallProgressPercent: overallProgress, OnTrackStatus: onTrack,
    MajorAdvisorId: s.advisor, CoAdvisorId: '', CreatedAt: nowIso_(), UpdatedAt: nowIso_()
  });

  for (var step = 1; step <= 8; step++) {
    var status = step < currentStep ? 'สำเร็จ' : step === currentStep ? 'กำลังดำเนินการ' : 'รอดำเนินการ';
    var detail = {};
    if (step === 3) {
      detail = {
        ethicsApprovalNumber: 'MTU-EC-SEED-' + s.idx,
        ethicsApprovalDate: '2025-03-01',
        ethicsExpiryDate: '2026-03-01',
        dataCollectionStartDate: '2025-04-01',
        targetSampleSize: 60,
        actualSampleSize: status === 'สำเร็จ' ? 60 : 28
      };
    }
    appendRow_('ThesisSteps', {
      StepRecordId: 'SEED-STEP-' + s.idx + '-' + step, ThesisId: thesisId, StepNumber: step,
      Status: status,
      PlannedDate: status !== 'รอดำเนินการ' ? '2025-0' + Math.min(step, 9) + '-01' : '',
      ActualDate: status === 'สำเร็จ' ? '2025-0' + Math.min(step, 9) + '-10' : '',
      StepProgressPercent: status === 'สำเร็จ' ? 100 : status === 'กำลังดำเนินการ' ? 50 : 0,
      ApprovedBy: status === 'สำเร็จ' ? s.advisor : '',
      DetailJson: JSON.stringify(detail), UpdatedAt: nowIso_()
    });
  }
}

/**
 * Deletes every row across every seedable sheet whose primary Id starts with "SEED-".
 * Structurally cannot match a real row: generateId_/generateSequentialDivisionId_ and every
 * real signup path (registerLoginAttempt_, bootstrapFirstAdmin_, createOrUpdateUser_) produce
 * IDs like "U-xxxxxxxx", "Stud-xxxxxxxx", "D0001" — never "SEED-...".
 */
function clearSeedData_(caller) {
  requireRole_(caller, ['admin']);

  var results = {};
  var totalDeleted = 0;

  SEED_SHEETS_WITH_ID.forEach(function (sheetName) {
    var count = deleteRowsWhere_(sheetName, function (row) {
      var idCol = Object.keys(row)[0];
      return typeof row[idCol] === 'string' && row[idCol].indexOf('SEED-') === 0;
    });
    if (count > 0) results[sheetName] = count;
    totalDeleted += count;
  });

  return {
    totalDeleted: totalDeleted,
    bySheet: results,
    message: totalDeleted > 0
      ? 'ลบข้อมูลตัวอย่างแล้วทั้งหมด ' + totalDeleted + ' รายการ'
      : 'ไม่พบข้อมูลตัวอย่างในระบบ'
  };
}
