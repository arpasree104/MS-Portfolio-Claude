/**
 * AdvisingService.gs
 * Advising session logs (Requirement section 5) and appointment scheduling (Requirement section 15/role spec).
 * Confidential logs (IsConfidential = TRUE) are never returned to students.
 */

function listAdvisingLogs_(caller, studentId) {
  requireStudentAccess_(caller, studentId);
  var rows = findRows_('AdvisingLogs', function (r) { return r.StudentId === studentId; });

  if (caller.role === 'student') {
    rows = rows.filter(function (r) { return String(r.IsConfidential).toUpperCase() !== 'TRUE'; });
  }
  return rows.sort(function (a, b) { return new Date(b.LogDate) - new Date(a.LogDate); });
}

function createAdvisingLog_(caller, studentId, data) {
  requireStudentAccess_(caller, studentId);
  requireRole_(caller, ['advisor', 'admin', 'executive']);

  if (data.fileBase64) {
    var uploaded = uploadFileForStudent_(studentId, data.fileBase64, data.fileName, data.fileMimeType, 'advising');
    data.FileUrl = uploaded.url;
    delete data.fileBase64;
    delete data.fileName;
    delete data.fileMimeType;
  }

  data.StudentId = studentId;
  data.AdvisorId = caller.userId;
  data.AckByAdvisor = 'TRUE';
  data.AckByStudent = 'FALSE';
  data.CreatedAt = nowIso_();
  if (!data.IsConfidential) data.IsConfidential = 'FALSE';
  return appendRow_('AdvisingLogs', data);
}

function acknowledgeAdvisingLog_(caller, studentId, logId) {
  requireStudentAccess_(caller, studentId);
  var field = caller.role === 'student' ? 'AckByStudent' : 'AckByAdvisor';
  var patch = {};
  patch[field] = 'TRUE';
  updateRowById_('AdvisingLogs', logId, patch);
  return findById_('AdvisingLogs', logId);
}

// --- Appointments ---

function listAppointments_(caller, studentId) {
  requireStudentAccess_(caller, studentId);
  return findRows_('Appointments', function (a) { return a.StudentId === studentId; })
    .sort(function (a, b) { return new Date(a.StartTime) - new Date(b.StartTime); });
}

function createAppointment_(caller, studentId, data) {
  requireStudentAccess_(caller, studentId);
  data.StudentId = studentId;
  data.Status = 'proposed';
  data.CreatedBy = caller.userId;
  data.CreatedAt = nowIso_();
  return appendRow_('Appointments', data);
}

function confirmAppointment_(caller, studentId, appointmentId) {
  requireStudentAccess_(caller, studentId);
  requireRole_(caller, ['advisor', 'student', 'executive', 'admin']);
  updateRowById_('Appointments', appointmentId, { Status: 'confirmed', ConfirmedBy: caller.userId });
  return findById_('Appointments', appointmentId);
}

function cancelAppointment_(caller, studentId, appointmentId) {
  requireStudentAccess_(caller, studentId);
  updateRowById_('Appointments', appointmentId, { Status: 'cancelled' });
  return findById_('Appointments', appointmentId);
}
