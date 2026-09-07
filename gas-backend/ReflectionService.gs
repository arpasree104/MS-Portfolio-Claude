/**
 * ReflectionService.gs
 * Self-reflection (7 questions, Requirement section 6) and
 * per-semester progress evaluation (9 aspects, self + advisor rating, Requirement section 7).
 */

var PROGRESS_EVAL_ASPECTS = [
  'ความก้าวหน้าทางการเรียน',
  'การคิดวิเคราะห์และใช้หลักฐานเชิงประจักษ์',
  'การปฏิบัติการพยาบาลขั้นสูง',
  'ความก้าวหน้าวิทยานิพนธ์',
  'การสื่อสารทางวิชาการ',
  'ทักษะภาษาอังกฤษ',
  'การใช้เทคโนโลยีดิจิทัล',
  'ความรับผิดชอบและการบริหารเวลา',
  'ภาวะผู้นำและการทำงานร่วมกับผู้อื่น',
  'ความพร้อมเข้าสู่ภาคการศึกษาถัดไป'
];

function listReflections_(caller, studentId) {
  requireViewAccess_(caller, studentId);
  return findRows_('Reflections', function (r) { return r.StudentId === studentId; })
    .sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
}

function createReflection_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  requireRole_(caller, ['student', 'admin']);
  data.StudentId = studentId;
  data.CreatedAt = nowIso_();
  return appendRow_('Reflections', data);
}

/** Returns all 9 aspects for a period, merged with any existing self/advisor scores. */
function getProgressEvaluation_(caller, studentId, academicYear, semester) {
  requireViewAccess_(caller, studentId);
  var rows = findRows_('ProgressEvaluations', function (r) {
    return r.StudentId === studentId && String(r.AcademicYear) === String(academicYear) && String(r.Semester) === String(semester);
  });

  return PROGRESS_EVAL_ASPECTS.map(function (aspect) {
    var record = rows.filter(function (r) { return r.Aspect === aspect; })[0];
    return record || {
      EvalId: null, StudentId: studentId, AcademicYear: academicYear, Semester: semester,
      Aspect: aspect, SelfLevel: '', AdvisorLevel: '', EvidenceNotes: ''
    };
  });
}

/**
 * Summarizes every (AcademicYear, Semester) period that has at least one rated aspect
 * for this student, for a history table — average self/advisor level and when it was
 * last updated, so a viewer can see at a glance which periods have been evaluated and
 * jump to any of them (evaluations remain editable for any period, not just the
 * current one).
 */
function listEvaluatedPeriods_(caller, studentId) {
  requireViewAccess_(caller, studentId);
  var rows = findRows_('ProgressEvaluations', function (r) { return r.StudentId === studentId; });

  var byPeriod = {};
  rows.forEach(function (r) {
    var key = r.AcademicYear + '|' + r.Semester;
    if (!byPeriod[key]) {
      byPeriod[key] = {
        academicYear: r.AcademicYear, semester: r.Semester,
        selfSum: 0, selfCount: 0, advisorSum: 0, advisorCount: 0, updatedAt: r.UpdatedAt
      };
    }
    var p = byPeriod[key];
    if (r.SelfLevel) { p.selfSum += Number(r.SelfLevel); p.selfCount++; }
    if (r.AdvisorLevel) { p.advisorSum += Number(r.AdvisorLevel); p.advisorCount++; }
    if (r.UpdatedAt && (!p.updatedAt || new Date(r.UpdatedAt) > new Date(p.updatedAt))) p.updatedAt = r.UpdatedAt;
  });

  return Object.keys(byPeriod).map(function (key) {
    var p = byPeriod[key];
    return {
      academicYear: p.academicYear,
      semester: p.semester,
      aspectsRated: Math.max(p.selfCount, p.advisorCount),
      averageSelfLevel: p.selfCount > 0 ? +(p.selfSum / p.selfCount).toFixed(1) : null,
      averageAdvisorLevel: p.advisorCount > 0 ? +(p.advisorSum / p.advisorCount).toFixed(1) : null,
      updatedAt: p.updatedAt
    };
  }).sort(function (a, b) {
    if (a.academicYear !== b.academicYear) return String(b.academicYear).localeCompare(String(a.academicYear));
    return String(b.semester).localeCompare(String(a.semester));
  });
}

function upsertProgressEvaluation_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);

  var isAdvisorField = data.AdvisorLevel !== undefined;
  if (isAdvisorField) {
    requireRole_(caller, ['advisor', 'admin', 'executive']);
  } else {
    requireRole_(caller, ['student', 'admin']);
  }

  var existing = findRows_('ProgressEvaluations', function (r) {
    return r.StudentId === studentId && String(r.AcademicYear) === String(data.AcademicYear) &&
      String(r.Semester) === String(data.Semester) && r.Aspect === data.Aspect;
  })[0];

  data.StudentId = studentId;
  data.EvaluatedBy = caller.userId;
  data.UpdatedAt = nowIso_();

  if (existing) {
    updateRowById_('ProgressEvaluations', existing.EvalId, data);
    return existing.EvalId;
  }
  return appendRow_('ProgressEvaluations', data);
}
