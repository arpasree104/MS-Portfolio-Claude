/**
 * ReportService.gs
 * Executive/program-level reports (Requirement section 10). Only executive/admin may call these.
 */

function generateProgramReport_(caller) {
  requireRole_(caller, ['executive', 'admin']);

  var students = getAllRows_('Students');
  // Read CourseEnrollments/Portfolio ONCE and group in memory, instead of a full sheet
  // scan per student inside the loop below (same N+1 pattern already fixed in
  // getAdvisorOrExecutiveDashboard_ in DashboardService.gs).
  var coursesByStudent = groupByStudentId_(getAllRows_('CourseEnrollments'));
  var portfolioByStudent = groupByStudentId_(getAllRows_('Portfolio'));

  var byCohortStatus = {};
  var gpaByCohort = {};
  var riskStudents = [];
  var englishPassCount = 0;
  var publicationCount = 0;

  students.forEach(function (s) {
    var cohort = s.Cohort;
    byCohortStatus[cohort] = byCohortStatus[cohort] || {};
    byCohortStatus[cohort][s.EnrollmentStatus] = (byCohortStatus[cohort][s.EnrollmentStatus] || 0) + 1;

    var academic = computeAcademicSummaryFromCourses_(coursesByStudent[s.StudentId] || []);
    if (academic.gpax !== null) {
      gpaByCohort[cohort] = gpaByCohort[cohort] || { sum: 0, count: 0 };
      gpaByCohort[cohort].sum += academic.gpax;
      gpaByCohort[cohort].count++;

      if (academic.gpax < GPA_THRESHOLD) {
        riskStudents.push({
          studentId: s.StudentId,
          studentCode: s.StudentCode,
          name: s.FirstNameTH + ' ' + s.LastNameTH,
          cohort: cohort,
          gpax: academic.gpax
        });
      }
    }

    var pubItems = (portfolioByStudent[s.StudentId] || []).filter(function (p) {
      return p.Category === 'บทความหรือผลงานตีพิมพ์';
    });
    if (pubItems.length > 0) publicationCount++;
  });

  var gpaAverageByCohort = Object.keys(gpaByCohort).map(function (cohort) {
    return { cohort: cohort, averageGpax: +(gpaByCohort[cohort].sum / gpaByCohort[cohort].count).toFixed(2) };
  });

  var thesisStepDurations = computeAverageThesisStepDurations_();
  var thesisExamPassCounts = computeThesisExamPassCounts_();
  var ploSummary = computePLOSummaryByCohort_();

  return {
    studentCountByCohortStatus: byCohortStatus,
    gpaAverageByCohort: gpaAverageByCohort,
    riskStudents: riskStudents,
    thesisStepDurations: thesisStepDurations,
    thesisExamPassCounts: thesisExamPassCounts,
    publicationCount: publicationCount,
    ploSummaryByCohort: ploSummary,
    totalStudents: students.length
  };
}

function computeAverageThesisStepDurations_() {
  var steps = getAllRows_('ThesisSteps');
  var byStep = {};
  steps.forEach(function (s) {
    if (s.Status !== 'สำเร็จ' || !s.PlannedDate || !s.ActualDate) return;
    var stepNum = Number(s.StepNumber);
    byStep[stepNum] = byStep[stepNum] || { sum: 0, count: 0 };
    byStep[stepNum].sum += Math.abs(daysBetween_(s.PlannedDate, s.ActualDate));
    byStep[stepNum].count++;
  });
  return Object.keys(byStep).map(function (step) {
    return { step: Number(step), averageDaysFromPlan: +(byStep[step].sum / byStep[step].count).toFixed(1) };
  });
}

function computeThesisExamPassCounts_() {
  var steps = getAllRows_('ThesisSteps');
  var proposalPass = steps.filter(function (s) { return Number(s.StepNumber) === 2 && s.Status === 'สำเร็จ'; }).length;
  var finalPass = steps.filter(function (s) { return Number(s.StepNumber) === 5 && s.Status === 'สำเร็จ'; }).length;
  return { proposalExamPassed: proposalPass, finalExamPassed: finalPass };
}

function computePLOSummaryByCohort_() {
  var students = getAllRows_('Students');
  var assessmentsByStudent = groupByStudentId_(getAllRows_('PLOAssessments'));
  var levelScore = { 'เริ่มต้น': 1, 'กำลังพัฒนา': 2, 'บรรลุ': 3, 'สูงกว่าเกณฑ์': 4 };

  var byCohortPlo = {};
  students.forEach(function (s) {
    var studentAssessments = assessmentsByStudent[s.StudentId] || [];
    studentAssessments.forEach(function (a) {
      var key = s.Cohort + '|' + a.PLO;
      byCohortPlo[key] = byCohortPlo[key] || { cohort: s.Cohort, plo: a.PLO, sum: 0, count: 0 };
      if (levelScore[a.CompetencyLevel]) {
        byCohortPlo[key].sum += levelScore[a.CompetencyLevel];
        byCohortPlo[key].count++;
      }
    });
  });

  return Object.keys(byCohortPlo).map(function (key) {
    var entry = byCohortPlo[key];
    return {
      cohort: entry.cohort,
      plo: entry.plo,
      averageLevel: entry.count > 0 ? +(entry.sum / entry.count).toFixed(2) : null
    };
  });
}
