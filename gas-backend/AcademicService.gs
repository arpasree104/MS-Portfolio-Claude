/**
 * AcademicService.gs
 * Course enrollments and semester records (Requirement section 3).
 * 2 academic years x 3 semesters (1, 2, summer) = 6 tracked periods.
 */

var PROGRAM_TOTAL_CREDITS = 37;

var GRADE_POINTS = {
  'A': 4.0, 'A-': 3.5, 'B+': 3.5, 'B': 3.0, 'B-': 2.5,
  'C+': 2.5, 'C': 2.0, 'C-': 1.5, 'D+': 1.5, 'D': 1.0, 'F': 0.0
};

function listCourseEnrollments_(caller, studentId, filters) {
  requireViewAccess_(caller, studentId);
  filters = filters || {};
  var rows = findRows_('CourseEnrollments', function (r) { return r.StudentId === studentId; });
  if (filters.academicYear) rows = rows.filter(function (r) { return String(r.AcademicYear) === String(filters.academicYear); });
  if (filters.semester) rows = rows.filter(function (r) { return String(r.Semester) === String(filters.semester); });
  return rows;
}

function upsertCourseEnrollment_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  data.StudentId = studentId;
  data.UpdatedAt = nowIso_();
  if (data.EnrollmentId) {
    updateRowById_('CourseEnrollments', data.EnrollmentId, data);
    return data.EnrollmentId;
  }
  return appendRow_('CourseEnrollments', data);
}

function deleteCourseEnrollment_(caller, studentId, enrollmentId) {
  requireEditAccess_(caller, studentId);
  return deleteRowById_('CourseEnrollments', enrollmentId);
}

/** Computes credits registered/passed/remaining, GPA per semester, and GPAX. */
function computeAcademicSummary_(studentId) {
  var courses = findRows_('CourseEnrollments', function (r) { return r.StudentId === studentId; });
  return computeAcademicSummaryFromCourses_(courses);
}

/**
 * Same computation as computeAcademicSummary_, but takes an already-fetched course list
 * instead of re-reading CourseEnrollments from the sheet. Lets callers that need this
 * for many students at once (e.g. the advisor dashboard) read the sheet a single time
 * and group in memory, instead of a full sheet scan per student (N+1).
 */
function computeAcademicSummaryFromCourses_(courses) {
  var creditsRegistered = 0, creditsPassed = 0;
  var gradedCourses = [];

  courses.forEach(function (c) {
    var credits = Number(c.Credits) || 0;
    if (c.Status === 'ลงทะเบียน' || c.Status === 'กำลังศึกษา' || c.Status === 'ผ่าน') {
      creditsRegistered += credits;
    }
    if (c.Status === 'ผ่าน') {
      creditsPassed += credits;
    }
    if (GRADE_POINTS.hasOwnProperty(c.Grade)) {
      gradedCourses.push(c);
    }
  });

  // GPAX (cumulative, all graded courses)
  var totalPoints = 0, totalGradedCredits = 0;
  gradedCourses.forEach(function (c) {
    var credits = Number(c.Credits) || 0;
    totalPoints += GRADE_POINTS[c.Grade] * credits;
    totalGradedCredits += credits;
  });
  var gpax = totalGradedCredits > 0 ? +(totalPoints / totalGradedCredits).toFixed(2) : null;

  // GPA trend per (academicYear, semester)
  var periods = {};
  gradedCourses.forEach(function (c) {
    var key = c.AcademicYear + '/' + c.Semester;
    if (!periods[key]) periods[key] = { academicYear: c.AcademicYear, semester: c.Semester, points: 0, credits: 0 };
    var credits = Number(c.Credits) || 0;
    periods[key].points += GRADE_POINTS[c.Grade] * credits;
    periods[key].credits += credits;
  });
  var gpaTrend = Object.keys(periods).sort().map(function (key) {
    var p = periods[key];
    return {
      academicYear: p.academicYear,
      semester: p.semester,
      gpa: p.credits > 0 ? +(p.points / p.credits).toFixed(2) : null
    };
  });

  var incompleteCourses = courses.filter(function (c) {
    return c.Status !== 'ผ่าน' && c.Status !== 'ถอน';
  });

  return {
    creditsRequired: PROGRAM_TOTAL_CREDITS,
    creditsRegistered: creditsRegistered,
    creditsPassed: creditsPassed,
    creditsRemaining: Math.max(PROGRAM_TOTAL_CREDITS - creditsPassed, 0),
    gpax: gpax,
    latestSemesterGpa: gpaTrend.length ? gpaTrend[gpaTrend.length - 1].gpa : null,
    gpaTrend: gpaTrend,
    incompleteCourses: incompleteCourses
  };
}

function listSemesterRecords_(caller, studentId) {
  requireViewAccess_(caller, studentId);
  return findRows_('SemesterRecords', function (r) { return r.StudentId === studentId; });
}

function upsertSemesterRecord_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  data.StudentId = studentId;
  data.UpdatedAt = nowIso_();

  var existing = findRows_('SemesterRecords', function (r) {
    return r.StudentId === studentId && String(r.AcademicYear) === String(data.AcademicYear) && String(r.Semester) === String(data.Semester);
  })[0];

  if (existing) {
    updateRowById_('SemesterRecords', existing.RecordId, data);
    return existing.RecordId;
  }
  return appendRow_('SemesterRecords', data);
}
