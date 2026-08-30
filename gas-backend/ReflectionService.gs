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
  requireStudentAccess_(caller, studentId);
  return findRows_('Reflections', function (r) { return r.StudentId === studentId; })
    .sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
}

function createReflection_(caller, studentId, data) {
  requireStudentAccess_(caller, studentId);
  requireRole_(caller, ['student', 'admin']);
  data.StudentId = studentId;
  data.CreatedAt = nowIso_();
  return appendRow_('Reflections', data);
}

/** Returns all 9 aspects for a period, merged with any existing self/advisor scores. */
function getProgressEvaluation_(caller, studentId, academicYear, semester) {
  requireStudentAccess_(caller, studentId);
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

function upsertProgressEvaluation_(caller, studentId, data) {
  requireStudentAccess_(caller, studentId);

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
