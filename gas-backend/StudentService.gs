/**
 * StudentService.gs
 * Student profile, education history, professional history, and goals (Requirement section 2).
 */

/** List students visible to the caller (own record / advisees / all). */
function listStudents_(caller, filters) {
  filters = filters || {};
  var students = getAllRows_('Students');

  if (caller.role === 'student') {
    students = students.filter(function (s) { return s.UserId === caller.userId; });
  } else if (caller.role === 'advisor' && caller.isHeadOfDivision && caller.divisionId) {
    students = students.filter(function (s) {
      return s.DivisionId === caller.divisionId || isPersonalAdvisee_(caller, s);
    });
  } else if (caller.role === 'advisor') {
    students = students.filter(function (s) { return isPersonalAdvisee_(caller, s); });
  }
  // executive / admin see all

  if (filters.cohort) {
    students = students.filter(function (s) { return String(s.Cohort) === String(filters.cohort); });
  }
  if (filters.status) {
    students = students.filter(function (s) { return s.EnrollmentStatus === filters.status; });
  }

  return students.map(function (s) { return stripSensitiveFields_(s, caller); });
}

/**
 * Same visibility scoping as listStudents_, plus a per-student activity summary
 * (advising log count, thesis record presence, reflection count, and the most recent
 * timestamp across all three) — for a roster view that shows who's actively being
 * tracked without opening each student individually. Reads AdvisingLogs/ThesisProgress/
 * Reflections ONCE each and groups by StudentId in memory (same batching pattern as
 * DashboardService.gs/NotificationService.gs), not per-student.
 */
function listStudentsWithActivity_(caller, filters) {
  var students = listStudents_(caller, filters);

  var logsByStudent = groupByStudentId_(getAllRows_('AdvisingLogs'));
  var thesisByStudent = groupByStudentId_(getAllRows_('ThesisProgress'));
  var reflectionsByStudent = groupByStudentId_(getAllRows_('Reflections'));

  // "Last activity" reflects ANY edit to the student's own data, not just the three
  // consultation-shaped logs above — otherwise a student who uploaded a photo, filled
  // in their profile, or logged a course/portfolio item (but has no advising/thesis/
  // reflection entry yet) always shows "ยังไม่มีการบันทึก" despite clearly having used
  // the system. Each of these is read once (not per student) and grouped by StudentId,
  // same batching pattern as everywhere else in this file.
  var educationByStudent = groupByStudentId_(getAllRows_('EducationHistory'));
  var professionalByStudent = groupByStudentId_(getAllRows_('ProfessionalHistory'));
  var goalsByStudent = groupByStudentId_(getAllRows_('StudentGoals'));
  var coursesByStudent = groupByStudentId_(getAllRows_('CourseEnrollments'));
  var portfolioByStudent = groupByStudentId_(getAllRows_('Portfolio'));
  var ploByStudent = groupByStudentId_(getAllRows_('PLOAssessments'));
  var advisingRepliesByStudent = groupByStudentId_(getAllRows_('AdvisingLogReplies'));
  var progressEvalByStudent = groupByStudentId_(getAllRows_('ProgressEvaluations'));

  return students.map(function (s) {
    var logs = logsByStudent[s.StudentId] || [];
    var thesisList = thesisByStudent[s.StudentId] || [];
    var reflections = reflectionsByStudent[s.StudentId] || [];

    var latest = s.UpdatedAt || null;
    function considerTimestamp(ts) {
      if (ts && (!latest || new Date(ts) > new Date(latest))) latest = ts;
    }
    [
      logs, thesisList, reflections,
      educationByStudent[s.StudentId] || [],
      professionalByStudent[s.StudentId] || [],
      goalsByStudent[s.StudentId] || [],
      coursesByStudent[s.StudentId] || [],
      portfolioByStudent[s.StudentId] || [],
      ploByStudent[s.StudentId] || [],
      advisingRepliesByStudent[s.StudentId] || [],
      progressEvalByStudent[s.StudentId] || []
    ].forEach(function (rows) {
      rows.forEach(function (r) {
        considerTimestamp(r.UpdatedAt || r.CreatedAt || r.LogDate);
      });
    });

    return {
      studentId: s.StudentId,
      studentCode: s.StudentCode,
      name: s.PrefixTH + s.FirstNameTH + ' ' + s.LastNameTH,
      cohort: s.Cohort,
      divisionId: s.DivisionId || '',
      enrollmentStatus: s.EnrollmentStatus,
      photoUrl: s.PhotoUrl || '',
      advisingLogCount: logs.length,
      hasThesis: thesisList.length > 0,
      thesisCurrentStep: thesisList.length > 0 ? thesisList[0].CurrentStep : null,
      reflectionCount: reflections.length,
      lastActivityAt: latest
    };
  });
}

function getStudentProfile_(caller, studentId) {
  requireViewAccess_(caller, studentId);
  var student = findById_('Students', studentId);
  if (!student) throw new Error('Student not found: ' + studentId);

  return {
    student: stripSensitiveFields_(student, caller),
    education: findRows_('EducationHistory', function (r) { return r.StudentId === studentId; }),
    professional: findRows_('ProfessionalHistory', function (r) { return r.StudentId === studentId; }),
    goals: findRows_('StudentGoals', function (r) { return r.StudentId === studentId; })
  };
}

/** Student edits their own core profile fields (and admin can too). */
function updateStudentProfile_(caller, studentId, patch) {
  requireEditAccess_(caller, studentId);
  if (caller.role === 'advisor' || caller.role === 'executive') {
    throw new AuthError_('Advisors/executives cannot edit student personal profile fields');
  }
  patch.UpdatedAt = nowIso_();
  updateRowById_('Students', studentId, patch);
  return findById_('Students', studentId);
}

/**
 * Upload/replace the student's profile photo. Shared "anyone with link can view" so it
 * renders as an <img>. Uses the thumbnail content-proxy URL (not drive.google.com/uc?
 * export=view) because that legacy URL often serves an HTML interstitial ("can't scan
 * for viruses" / sign-in prompt) instead of raw image bytes when hit from a browser
 * <img> tag with no active Drive session — the thumbnail proxy is built for public
 * embedding and doesn't have that problem.
 */
function uploadStudentPhoto_(caller, studentId, base64Data, filename, mimeType) {
  requireEditAccess_(caller, studentId);
  var uploaded = uploadFileForStudent_(studentId, base64Data, filename, mimeType, 'photo');
  DriveApp.getFileById(uploaded.fileId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var photoUrl = 'https://drive.google.com/thumbnail?id=' + uploaded.fileId + '&sz=w1000';
  updateRowById_('Students', studentId, { PhotoUrl: photoUrl, UpdatedAt: nowIso_() });
  return { photoUrl: photoUrl };
}

/**
 * Lets an 'awaiting_profile' user (self-declared student with no roster match) create
 * their own Students row and activate their account. No resolveCaller_ gate — same
 * pattern as setInitialRole_ — since the caller can't authenticate through the normal
 * active-caller path yet. Becomes a no-op guard once the account is no longer
 * 'awaiting_profile', so it can't be replayed to create duplicate Students rows.
 */
function completeStudentProfile_(email, data) {
  var user = findRows_('Users', function (u) { return String(u.Email).toLowerCase() === String(email).toLowerCase(); })[0];
  if (!user) throw new Error('Account not registered: ' + email);
  if (user.Status !== 'awaiting_profile') {
    throw new Error('Account is not awaiting profile completion');
  }

  var studentId = generateId_('Students');
  appendRow_('Students', {
    StudentId: studentId,
    UserId: user.UserId,
    StudentCode: data.StudentCode || '',
    PrefixTH: data.PrefixTH || '',
    FirstNameTH: data.FirstNameTH || user.DisplayNameTH || '',
    LastNameTH: data.LastNameTH || '',
    PrefixEN: data.PrefixEN || '',
    FirstNameEN: data.FirstNameEN || '',
    LastNameEN: data.LastNameEN || '',
    Cohort: data.Cohort || '',
    AdmissionYear: data.AdmissionYear || '',
    EnrollmentStatus: 'กำลังศึกษา',
    UniversityEmail: email,
    CreatedAt: nowIso_(),
    UpdatedAt: nowIso_()
  });

  updateRowById_('Users', user.UserId, { Status: 'active' });
  return { studentId: studentId, status: 'active' };
}

/** Student selects their own advisors. */
function setStudentAdvisors_(caller, studentId, advisorIds) {
  requireEditAccess_(caller, studentId);
  requireRole_(caller, ['student', 'admin']);
  var patch = { UpdatedAt: nowIso_() };
  if (advisorIds.academicAdvisorId !== undefined) patch.AcademicAdvisorId = advisorIds.academicAdvisorId;
  if (advisorIds.majorAdvisorId !== undefined) patch.MajorAdvisorId = advisorIds.majorAdvisorId;
  if (advisorIds.coAdvisorId !== undefined) patch.CoAdvisorId = advisorIds.coAdvisorId;
  updateRowById_('Students', studentId, patch);
  return findById_('Students', studentId);
}

function upsertEducationHistory_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  var existing = findRows_('EducationHistory', function (r) { return r.StudentId === studentId; })[0];
  data.StudentId = studentId;
  data.UpdatedAt = nowIso_();
  if (existing) {
    updateRowById_('EducationHistory', existing.RecordId, data);
    return existing.RecordId;
  }
  return appendRow_('EducationHistory', data);
}

function upsertProfessionalHistory_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  var existing = findRows_('ProfessionalHistory', function (r) { return r.StudentId === studentId; })[0];
  data.StudentId = studentId;
  data.UpdatedAt = nowIso_();
  if (existing) {
    updateRowById_('ProfessionalHistory', existing.RecordId, data);
    return existing.RecordId;
  }
  return appendRow_('ProfessionalHistory', data);
}

function upsertStudentGoals_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  var existing = findRows_('StudentGoals', function (r) { return r.StudentId === studentId; })[0];
  data.StudentId = studentId;
  data.UpdatedAt = nowIso_();
  if (existing) {
    updateRowById_('StudentGoals', existing.RecordId, data);
    return existing.RecordId;
  }
  return appendRow_('StudentGoals', data);
}

/** Student picks (or admin reassigns) which division they belong to. */
function setStudentDivision_(caller, studentId, divisionId) {
  requireEditAccess_(caller, studentId);
  requireRole_(caller, ['student', 'admin']);
  updateRowById_('Students', studentId, { DivisionId: divisionId, UpdatedAt: nowIso_() });
  return findById_('Students', studentId);
}

/** List all users with role=advisor, for student advisor-selection dropdowns. */
function listAdvisors_() {
  return findRows_('Users', function (u) { return u.Role === 'advisor' && u.Status === 'active'; })
    .map(function (u) {
      return { userId: u.UserId, displayNameTH: u.DisplayNameTH, displayNameEN: u.DisplayNameEN, email: u.Email };
    });
}
