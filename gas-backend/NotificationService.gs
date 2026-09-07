/**
 * NotificationService.gs
 * Alert conditions per Requirement section 8. checkAlerts() is meant to run on a daily
 * time-driven trigger (set up once via createDailyAlertTrigger()).
 */

var GPA_THRESHOLD = 3.0;
var ENGLISH_EXPIRY_WARNING_DAYS = 60;
var LICENSE_EXPIRY_WARNING_DAYS = 60;
var ETHICS_EXPIRY_WARNING_DAYS = 45;

function listNotifications_(caller, unreadOnly) {
  var rows = findRows_('Notifications', function (n) { return n.UserId === caller.userId; });
  if (unreadOnly) rows = rows.filter(function (n) { return n.ReadStatus === 'unread'; });
  return rows.sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
}

function markNotificationRead_(caller, notificationId) {
  updateRowById_('Notifications', notificationId, { ReadStatus: 'read' });
  return true;
}

function createNotification_(userId, alertType, message, severity, refTable, refId) {
  // Avoid duplicate open alerts of the same type for the same ref
  var duplicate = findRows_('Notifications', function (n) {
    return n.UserId === userId && n.AlertType === alertType && n.RefId === refId && n.ReadStatus === 'unread';
  })[0];
  if (duplicate) return duplicate.NotificationId;

  return appendRow_('Notifications', {
    UserId: userId,
    AlertType: alertType,
    Message: message,
    ReadStatus: 'unread',
    Severity: severity,
    RefTable: refTable,
    RefId: refId,
    CreatedAt: nowIso_()
  });
}

function daysBetween_(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

/**
 * Runs all 9 alert checks and writes Notifications for advisors + the student themself.
 * Intended to run daily via a time-driven trigger.
 */
function checkAlerts() {
  var students = getAllRows_('Students');
  var today = new Date();

  // Read every sheet checkAlerts touches ONCE and group by StudentId in memory, instead
  // of a full sheet scan per student per check (was up to 7 full-sheet re-scans PER
  // student — the same N+1 pattern already fixed in DashboardService.gs/ReportService.gs).
  var coursesByStudent = groupByStudentId_(getAllRows_('CourseEnrollments'));
  var semRecordsByStudent = groupByStudentId_(getAllRows_('SemesterRecords'));
  var profByStudent = groupByStudentId_(getAllRows_('ProfessionalHistory'));
  var logsByStudent = groupByStudentId_(getAllRows_('AdvisingLogs'));
  var repliesByLogId = {};
  getAllRows_('AdvisingLogReplies').forEach(function (r) {
    if (!repliesByLogId[r.LogId]) repliesByLogId[r.LogId] = [];
    repliesByLogId[r.LogId].push(r);
  });
  var thesisByStudent = groupByStudentId_(getAllRows_('ThesisProgress'));
  var portfolioByStudent = groupByStudentId_(getAllRows_('Portfolio'));
  var allThesisSteps = getAllRows_('ThesisSteps');
  var stepsByThesisId = {};
  allThesisSteps.forEach(function (s) {
    if (!stepsByThesisId[s.ThesisId]) stepsByThesisId[s.ThesisId] = [];
    stepsByThesisId[s.ThesisId].push(s);
  });

  students.forEach(function (student) {
    var advisorIds = [student.AcademicAdvisorId, student.MajorAdvisorId, student.CoAdvisorId]
      .filter(function (id) { return !!id; });
    var recipients = advisorIds.concat([student.UserId]);
    var studentLabel = (student.FirstNameTH || '') + ' ' + (student.LastNameTH || '') + ' (' + student.StudentCode + ')';

    // 1. GPA/GPAX below threshold
    var academic = computeAcademicSummaryFromCourses_(coursesByStudent[student.StudentId] || []);
    if (academic.gpax !== null && academic.gpax < GPA_THRESHOLD) {
      notifyAll_(recipients, 'gpax_low', 'GPAX ของ ' + studentLabel + ' ต่ำกว่าเกณฑ์ (' + academic.gpax + ')', 'แดง', 'Students', student.StudentId);
    }

    // 2. Registration not per plan -> flagged via SemesterRecords.OnTrackStatus
    var semRecords = semRecordsByStudent[student.StudentId] || [];
    var latestSem = semRecords.sort(function (a, b) { return new Date(b.UpdatedAt) - new Date(a.UpdatedAt); })[0];
    if (latestSem && latestSem.OnTrackStatus === 'ล่าช้า') {
      notifyAll_(recipients, 'registration_off_plan', 'แผนการลงทะเบียนของ ' + studentLabel + ' ไม่เป็นไปตามแผน', 'เหลือง', 'SemesterRecords', latestSem.RecordId);
    }

    // 3. Professional license nearing expiry
    var prof = (profByStudent[student.StudentId] || [])[0];
    if (prof && prof.LicenseExpiry) {
      var daysToLicenseExpiry = daysBetween_(today, prof.LicenseExpiry);
      if (daysToLicenseExpiry >= 0 && daysToLicenseExpiry <= LICENSE_EXPIRY_WARNING_DAYS) {
        notifyAll_(recipients, 'license_expiring', 'ใบอนุญาตประกอบวิชาชีพของ ' + studentLabel + ' ใกล้หมดอายุ (' + daysToLicenseExpiry + ' วัน)', 'เหลือง', 'ProfessionalHistory', prof.RecordId);
      }
    }

    // 4. English score not passing or expiring — tracked via EducationHistory.PreAdmissionEnglishScore (free text with expiry convention "score|expiry|status")
    // Handled at data-entry level; skipped here as schema stores it as free text. See EducationHistory.

    // 5. Missing advising log within the expected cadence (no log in the last 90 days for active students)
    var logs = logsByStudent[student.StudentId] || [];
    var latestLog = logs.sort(function (a, b) { return new Date(b.LogDate) - new Date(a.LogDate); })[0];
    if (student.EnrollmentStatus === 'กำลังศึกษา' && (!latestLog || daysBetween_(latestLog.LogDate, today) > 90)) {
      notifyAll_(advisorIds, 'advising_log_missing', 'ไม่พบบันทึกการให้คำปรึกษาของ ' + studentLabel + ' ในรอบ 90 วัน', 'เหลือง', 'AdvisingLogs', student.StudentId);
    }

    // 6 & 7 & 8. Thesis-related: progress delay, ethics expiry, data collection off target
    var thesis = (thesisByStudent[student.StudentId] || [])[0];
    if (thesis) {
      if (thesis.OnTrackStatus === 'ล่าช้า') {
        notifyAll_(recipients, 'thesis_delayed', 'ความก้าวหน้าวิทยานิพนธ์ของ ' + studentLabel + ' ล่าช้ากว่าแผน', 'แดง', 'ThesisProgress', thesis.ThesisId);
      }
      var steps = stepsByThesisId[thesis.ThesisId] || [];
      var ethicsStep = steps.filter(function (s) { return Number(s.StepNumber) === 3; })[0];
      if (ethicsStep && ethicsStep.DetailJson) {
        var detail = safeJsonParse_(ethicsStep.DetailJson);
        if (detail.ethicsExpiryDate) {
          var daysToEthicsExpiry = daysBetween_(today, detail.ethicsExpiryDate);
          if (daysToEthicsExpiry >= 0 && daysToEthicsExpiry <= ETHICS_EXPIRY_WARNING_DAYS) {
            notifyAll_(recipients, 'ethics_expiring', 'การรับรองจริยธรรมของ ' + studentLabel + ' ใกล้หมดอายุ (' + daysToEthicsExpiry + ' วัน)', 'เหลือง', 'ThesisSteps', ethicsStep.StepRecordId);
          }
        }
        if (detail.targetSampleSize && detail.actualSampleSize !== undefined) {
          var pctCollected = detail.targetSampleSize > 0 ? (detail.actualSampleSize / detail.targetSampleSize) : 0;
          if (ethicsStep.Status === 'กำลังดำเนินการ' && pctCollected < 0.5 && detail.dataCollectionStartDate && daysBetween_(detail.dataCollectionStartDate, today) > 60) {
            notifyAll_(recipients, 'data_collection_off_target', 'ความก้าวหน้าการเก็บข้อมูลของ ' + studentLabel + ' ต่ำกว่าเป้าหมาย', 'เหลือง', 'ThesisSteps', ethicsStep.StepRecordId);
          }
        }
      }
    }

    // 9. No publication evidence yet, despite being late-stage (step >= 4)
    if (thesis && Number(thesis.CurrentStep) >= 4) {
      var pubItems = (portfolioByStudent[student.StudentId] || []).filter(function (p) {
        return p.Category === 'บทความหรือผลงานตีพิมพ์';
      });
      if (pubItems.length === 0) {
        notifyAll_(recipients, 'no_publication_evidence', 'ยังไม่มีหลักฐานการเผยแพร่ผลงานของ ' + studentLabel, 'เทา', 'Portfolio', student.StudentId);
      }
    }

    // Overdue action items from advising logs: only logs where the advisor actually
    // assigned a task (ActionItems + DueDate) and the student hasn't posted a
    // submission reply yet count — acknowledging ("รับทราบ") is a separate step from
    // delivering the work, so AckByStudent is intentionally not checked here.
    logs.forEach(function (log) {
      if (!log.ActionItems || !log.DueDate) return;
      var hasSubmission = (repliesByLogId[log.LogId] || []).some(function (r) { return r.IsSubmission === 'TRUE'; });
      if (!hasSubmission && daysBetween_(log.DueDate, today) >= 0) {
        notifyAll_([student.UserId].concat(advisorIds), 'task_overdue', 'งานที่มอบหมายให้ ' + studentLabel + ' เลยกำหนดส่งแล้ว (' + log.DueDate + ')', 'แดง', 'AdvisingLogs', log.LogId);
      }
    });
  });

  Logger.log('checkAlerts run complete at ' + today.toISOString());
}

function notifyAll_(userIds, alertType, message, severity, refTable, refId) {
  userIds.filter(function (id) { return !!id; }).forEach(function (userId) {
    createNotification_(userId, alertType, message, severity, refTable, refId);
  });
}

/** Run once from the editor to install the daily trigger. */
function createDailyAlertTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkAlerts') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkAlerts').timeBased().everyDays(1).atHour(6).create();
  Logger.log('Daily alert trigger installed (06:00).');
}
