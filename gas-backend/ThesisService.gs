/**
 * ThesisService.gs
 * 8-step thesis tracking (Requirement section 4 / "ระบบติดตามวิทยานิพนธ์").
 * Step-specific fields (ethics approval, committee, sample size, etc.) are stored as
 * a JSON blob per step (DetailJson) since each step's shape differs significantly.
 */

var THESIS_STEP_DEFINITIONS = [
  { step: 1, nameTH: 'เสนอสอบเค้าโครงวิทยานิพนธ์', weightPercent: 10 },
  { step: 2, nameTH: 'สอบเค้าโครงวิทยานิพนธ์', weightPercent: 20 },
  { step: 3, nameTH: 'จริยธรรมและเก็บข้อมูล', weightPercent: 50 },
  { step: 4, nameTH: 'เสนอสอบวิทยานิพนธ์', weightPercent: 65 },
  { step: 5, nameTH: 'สอบวิทยานิพนธ์', weightPercent: 80 },
  { step: 6, nameTH: 'ตรวจรูปแบบ / TU e-Thesis', weightPercent: 90 },
  { step: 7, nameTH: 'ลงทะเบียนวิทยานิพนธ์ฉบับสมบูรณ์', weightPercent: 95 },
  { step: 8, nameTH: 'ขออนุมัติสำเร็จการศึกษา', weightPercent: 100 }
];

function getThesisByStudent_(caller, studentId) {
  requireViewAccess_(caller, studentId);
  var thesis = findRows_('ThesisProgress', function (t) { return t.StudentId === studentId; })[0];
  if (!thesis) return null;

  var steps = findRows_('ThesisSteps', function (s) { return s.ThesisId === thesis.ThesisId; });
  var stepsWithDefs = THESIS_STEP_DEFINITIONS.map(function (def) {
    var record = steps.filter(function (s) { return Number(s.StepNumber) === def.step; })[0];
    return {
      step: def.step,
      nameTH: def.nameTH,
      weightPercent: def.weightPercent,
      status: record ? record.Status : 'รอดำเนินการ',
      plannedDate: record ? record.PlannedDate : '',
      actualDate: record ? record.ActualDate : '',
      approvedBy: record ? record.ApprovedBy : '',
      detail: record && record.DetailJson ? safeJsonParse_(record.DetailJson) : {},
      stepRecordId: record ? record.StepRecordId : null
    };
  });

  return { thesis: thesis, steps: stepsWithDefs };
}

function createThesis_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  data.StudentId = studentId;
  data.CurrentStep = 1;
  data.OverallProgressPercent = 0;
  data.OnTrackStatus = 'เป็นไปตามแผน';
  data.CreatedAt = nowIso_();
  data.UpdatedAt = nowIso_();
  return appendRow_('ThesisProgress', data);
}

function updateThesisMeta_(caller, thesisId, patch) {
  var thesis = findById_('ThesisProgress', thesisId);
  if (!thesis) throw new Error('Thesis not found: ' + thesisId);
  requireEditAccess_(caller, thesis.StudentId);
  patch.UpdatedAt = nowIso_();
  updateRowById_('ThesisProgress', thesisId, patch);
  return findById_('ThesisProgress', thesisId);
}

/**
 * Update (or create) a step record. Advisors/admin set Status/ApprovedBy to certify a step;
 * students can fill in supporting detail fields but cannot self-approve.
 */
function upsertThesisStep_(caller, thesisId, stepNumber, patch) {
  var thesis = findById_('ThesisProgress', thesisId);
  if (!thesis) throw new Error('Thesis not found: ' + thesisId);
  requireEditAccess_(caller, thesis.StudentId);

  if (patch.Status === 'สำเร็จ' && caller.role === 'student') {
    throw new AuthError_('Students cannot self-certify a thesis step as complete');
  }

  var existing = findRows_('ThesisSteps', function (s) {
    return s.ThesisId === thesisId && Number(s.StepNumber) === Number(stepNumber);
  })[0];

  var detail = patch.detail || {};
  delete patch.detail;

  var row = {
    ThesisId: thesisId,
    StepNumber: stepNumber,
    Status: patch.Status || (existing ? existing.Status : 'รอดำเนินการ'),
    PlannedDate: patch.PlannedDate !== undefined ? patch.PlannedDate : (existing ? existing.PlannedDate : ''),
    ActualDate: patch.ActualDate !== undefined ? patch.ActualDate : (existing ? existing.ActualDate : ''),
    StepProgressPercent: patch.StepProgressPercent !== undefined ? patch.StepProgressPercent : (existing ? existing.StepProgressPercent : 0),
    ApprovedBy: patch.Status === 'สำเร็จ' ? caller.userId : (existing ? existing.ApprovedBy : ''),
    DetailJson: JSON.stringify(Object.assign(existing && existing.DetailJson ? safeJsonParse_(existing.DetailJson) : {}, detail)),
    UpdatedAt: nowIso_()
  };

  if (existing) {
    updateRowById_('ThesisSteps', existing.StepRecordId, row);
  } else {
    appendRow_('ThesisSteps', row);
  }

  recalculateThesisProgress_(thesisId);
  return getThesisByStudent_(caller, thesis.StudentId);
}

/** Recompute CurrentStep + OverallProgressPercent from the step weight table. */
function recalculateThesisProgress_(thesisId) {
  var steps = findRows_('ThesisSteps', function (s) { return s.ThesisId === thesisId; });
  var completedSteps = steps.filter(function (s) { return s.Status === 'สำเร็จ'; })
    .map(function (s) { return Number(s.StepNumber); });

  var highestCompleted = completedSteps.length ? Math.max.apply(null, completedSteps) : 0;
  var progressPercent = highestCompleted > 0
    ? THESIS_STEP_DEFINITIONS[highestCompleted - 1].weightPercent
    : 0;

  var currentStep = Math.min(highestCompleted + 1, 8);

  updateRowById_('ThesisProgress', thesisId, {
    CurrentStep: currentStep,
    OverallProgressPercent: progressPercent,
    UpdatedAt: nowIso_()
  });
}

function safeJsonParse_(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}

/** Aggregate thesis progress by cohort, for the advisor/executive dashboard chart. */
function getThesisProgressByCohort_() {
  var students = getAllRows_('Students');
  var thesisList = getAllRows_('ThesisProgress');
  var byCohort = {};

  students.forEach(function (s) {
    var thesis = thesisList.filter(function (t) { return t.StudentId === s.StudentId; })[0];
    if (!thesis) return;
    var cohort = s.Cohort;
    if (!byCohort[cohort]) byCohort[cohort] = { cohort: cohort, total: 0, completed: 0, inProgress: 0, notStarted: 0 };
    byCohort[cohort].total++;
    if (thesis.CurrentStep >= 8 && thesis.OverallProgressPercent >= 100) byCohort[cohort].completed++;
    else if (thesis.OverallProgressPercent > 0) byCohort[cohort].inProgress++;
    else byCohort[cohort].notStarted++;
  });

  return Object.keys(byCohort).sort().map(function (k) { return byCohort[k]; });
}
