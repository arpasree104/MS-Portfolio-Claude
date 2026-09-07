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
