/**
 * DashboardService.gs
 * Assembles the home-page dashboard summary per role (Requirement section 3.1).
 */

function getDashboard_(caller, filters) {
  if (caller.role === 'student') {
    return getStudentDashboard_(caller);
  }
  return getAdvisorOrExecutiveDashboard_(caller, filters || {});
}

function getStudentDashboard_(caller) {
  var student = findRows_('Students', function (s) { return s.UserId === caller.userId; })[0];
  if (!student) throw new Error('No student profile linked to this account');

  var academic = computeAcademicSummary_(student.StudentId);
  var thesis = findRows_('ThesisProgress', function (t) { return t.StudentId === student.StudentId; })[0];
  var portfolioCount = findRows_('Portfolio', function (p) { return p.StudentId === student.StudentId; }).length;
  var notifications = listNotifications_(caller, true);

  return {
    profile: stripSensitiveFields_(student, caller),
    academic: academic,
    thesis: thesis || null,
    portfolioCount: portfolioCount,
    alerts: notifications
  };
}

function getAdvisorOrExecutiveDashboard_(caller, filters) {
  var students = listStudents_(caller, filters);

  var summary = { total: students.length, onTrack: 0, needsFollowUp: 0, atRisk: 0, graduated: 0 };
  var rows = students.map(function (s) {
    var academic = computeAcademicSummary_(s.StudentId);
    var thesis = findRows_('ThesisProgress', function (t) { return t.StudentId === s.StudentId; })[0];

    var riskLevel = 'gray';
    if (s.EnrollmentStatus === 'สำเร็จการศึกษา') {
      riskLevel = 'graduated';
      summary.graduated++;
    } else if (academic.gpax !== null && academic.gpax < GPA_THRESHOLD) {
      riskLevel = 'red';
      summary.atRisk++;
    } else if (thesis && thesis.OnTrackStatus === 'ล่าช้า') {
      riskLevel = 'yellow';
      summary.needsFollowUp++;
    } else {
      riskLevel = 'green';
      summary.onTrack++;
    }

    return {
      studentId: s.StudentId,
      studentCode: s.StudentCode,
      name: s.FirstNameTH + ' ' + s.LastNameTH,
      cohort: s.Cohort,
      status: s.EnrollmentStatus,
      gpax: academic.gpax,
      creditsPassed: academic.creditsPassed,
      creditsRequired: academic.creditsRequired,
      thesisStep: thesis ? thesis.CurrentStep : null,
      thesisProgressPercent: thesis ? thesis.OverallProgressPercent : 0,
      riskLevel: riskLevel
    };
  });

  var cohortComparison = buildCohortComparison_(rows);
  var thesisByCohort = getThesisProgressByCohort_();
  var alerts = listNotifications_(caller, true).slice(0, 10);

  return {
    summary: summary,
    students: rows,
    cohortComparison: cohortComparison,
    thesisByCohort: thesisByCohort,
    alerts: alerts
  };
}

function buildCohortComparison_(rows) {
  var byCohort = {};
  rows.forEach(function (r) {
    if (!byCohort[r.cohort]) {
      byCohort[r.cohort] = { cohort: r.cohort, total: 0, onTrack: 0, needsFollowUp: 0, atRisk: 0, gpaxSum: 0, gpaxCount: 0, creditsSum: 0 };
    }
    var c = byCohort[r.cohort];
    c.total++;
    if (r.riskLevel === 'green') c.onTrack++;
    if (r.riskLevel === 'yellow') c.needsFollowUp++;
    if (r.riskLevel === 'red') c.atRisk++;
    if (r.gpax !== null) { c.gpaxSum += r.gpax; c.gpaxCount++; }
    c.creditsSum += r.creditsPassed;
  });

  return Object.keys(byCohort).sort().map(function (k) {
    var c = byCohort[k];
    return {
      cohort: c.cohort,
      total: c.total,
      onTrack: c.onTrack,
      needsFollowUp: c.needsFollowUp,
      atRisk: c.atRisk,
      averageGpax: c.gpaxCount > 0 ? +(c.gpaxSum / c.gpaxCount).toFixed(2) : null,
      averageCredits: c.total > 0 ? +(c.creditsSum / c.total).toFixed(1) : null
    };
  });
}
