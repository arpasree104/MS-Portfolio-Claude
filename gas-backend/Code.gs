/**
 * Code.gs
 * Web App entrypoint. Deploy: Deploy > New deployment > Web app > Execute as "Me",
 * Who has access "Anyone". Only the Next.js server (never the browser directly) should
 * ever call this URL, because every request must carry the shared secret set in
 * Script Properties (key: SHARED_SECRET).
 *
 * Request contract (POST, JSON body):
 *   { secret: string, action: string, callerEmail: string, payload: object }
 * Response contract (always JSON):
 *   { ok: true, data: any } | { ok: false, error: string }
 */

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  // Support simple health checks via GET; all real actions go through POST.
  if (e.parameter.action === 'ping') {
    return jsonResponse_({ ok: true, data: 'pong' });
  }
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var body = parseRequestBody_(e);

    var expectedSecret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!expectedSecret || body.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: 'Unauthorized: invalid secret' });
    }

    var action = body.action;
    var payload = body.payload || {};

    // registerLoginAttempt / ping do not require a resolved caller (bootstrap case)
    if (action === 'registerLoginAttempt') {
      var result = registerLoginAttempt_(payload.email, payload.displayName);
      return jsonResponse_({ ok: true, data: result });
    }

    // One-time bootstrap: only works if no admin exists yet. Lets the very first
    // admin be created via HTTP instead of running a function by hand in the editor.
    if (action === 'bootstrapFirstAdmin') {
      var bootstrapResult = bootstrapFirstAdmin_(payload.email, payload.displayNameTH, payload.displayNameEN);
      return jsonResponse_({ ok: true, data: bootstrapResult });
    }

    var caller = resolveCaller_(body.callerEmail);
    var data = routeAction_(action, caller, payload);
    return jsonResponse_({ ok: true, data: data });

  } catch (err) {
    var isAuth = err && err.isAuthError;
    return jsonResponse_({ ok: false, error: (err && err.message) || String(err), authError: !!isAuth });
  }
}

function parseRequestBody_(e) {
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  // Fallback for GET/query-string style calls
  return {
    secret: e.parameter.secret,
    action: e.parameter.action,
    callerEmail: e.parameter.callerEmail,
    payload: e.parameter.payload ? JSON.parse(e.parameter.payload) : {}
  };
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Central action router. Keeping this as one big switch keeps Code.gs the single place
 * to see every API surface the frontend can call.
 */
function routeAction_(action, caller, p) {
  switch (action) {
    // --- Dashboard ---
    case 'getDashboard': return getDashboard_(caller, p.filters);

    // --- Students ---
    case 'listStudents': return listStudents_(caller, p.filters);
    case 'getStudentProfile': return getStudentProfile_(caller, p.studentId);
    case 'updateStudentProfile': return updateStudentProfile_(caller, p.studentId, p.patch);
    case 'setStudentAdvisors': return setStudentAdvisors_(caller, p.studentId, p.advisorIds);
    case 'upsertEducationHistory': return upsertEducationHistory_(caller, p.studentId, p.data);
    case 'upsertProfessionalHistory': return upsertProfessionalHistory_(caller, p.studentId, p.data);
    case 'upsertStudentGoals': return upsertStudentGoals_(caller, p.studentId, p.data);
    case 'listAdvisors': return listAdvisors_();

    // --- Academic ---
    case 'listCourseEnrollments': return listCourseEnrollments_(caller, p.studentId, p.filters);
    case 'upsertCourseEnrollment': return upsertCourseEnrollment_(caller, p.studentId, p.data);
    case 'deleteCourseEnrollment': return deleteCourseEnrollment_(caller, p.studentId, p.enrollmentId);
    case 'getAcademicSummary': requireStudentAccess_(caller, p.studentId); return computeAcademicSummary_(p.studentId);
    case 'listSemesterRecords': return listSemesterRecords_(caller, p.studentId);
    case 'upsertSemesterRecord': return upsertSemesterRecord_(caller, p.studentId, p.data);

    // --- PLO ---
    case 'listPLOAssessments': return listPLOAssessments_(caller, p.studentId);
    case 'upsertPLOAssessment': return upsertPLOAssessment_(caller, p.studentId, p.data);

    // --- Portfolio ---
    case 'listPortfolioItems': return listPortfolioItems_(caller, p.studentId, p.category);
    case 'createPortfolioItem': return createPortfolioItem_(caller, p.studentId, p.data);
    case 'updatePortfolioItem': return updatePortfolioItem_(caller, p.studentId, p.itemId, p.patch);
    case 'deletePortfolioItem': return deletePortfolioItem_(caller, p.studentId, p.itemId);

    // --- Thesis ---
    case 'getThesisByStudent': return getThesisByStudent_(caller, p.studentId);
    case 'createThesis': return createThesis_(caller, p.studentId, p.data);
    case 'updateThesisMeta': return updateThesisMeta_(caller, p.thesisId, p.patch);
    case 'upsertThesisStep': return upsertThesisStep_(caller, p.thesisId, p.stepNumber, p.patch);
    case 'getThesisProgressByCohort': return getThesisProgressByCohort_();

    // --- Advising & Appointments ---
    case 'listAdvisingLogs': return listAdvisingLogs_(caller, p.studentId);
    case 'createAdvisingLog': return createAdvisingLog_(caller, p.studentId, p.data);
    case 'acknowledgeAdvisingLog': return acknowledgeAdvisingLog_(caller, p.studentId, p.logId);
    case 'listAppointments': return listAppointments_(caller, p.studentId);
    case 'createAppointment': return createAppointment_(caller, p.studentId, p.data);
    case 'confirmAppointment': return confirmAppointment_(caller, p.studentId, p.appointmentId);
    case 'cancelAppointment': return cancelAppointment_(caller, p.studentId, p.appointmentId);

    // --- Reflection & Progress Evaluation ---
    case 'listReflections': return listReflections_(caller, p.studentId);
    case 'createReflection': return createReflection_(caller, p.studentId, p.data);
    case 'getProgressEvaluation': return getProgressEvaluation_(caller, p.studentId, p.academicYear, p.semester);
    case 'upsertProgressEvaluation': return upsertProgressEvaluation_(caller, p.studentId, p.data);

    // --- Notifications ---
    case 'listNotifications': return listNotifications_(caller, p.unreadOnly);
    case 'markNotificationRead': return markNotificationRead_(caller, p.notificationId);

    // --- Messages ---
    case 'sendMessage': return sendMessage_(caller, p.toUserId, p.subject, p.body, p.studentContextId);
    case 'listMessages': return listMessages_(caller);
    case 'markMessageRead': return markMessageRead_(caller, p.messageId);

    // --- Reports ---
    case 'generateProgramReport': return generateProgramReport_(caller);

    // --- Admin ---
    case 'listUsers': return listUsers_(caller);
    case 'createOrUpdateUser': return createOrUpdateUser_(caller, p.data);
    case 'disableUser': return disableUser_(caller, p.userId);

    default:
      throw new Error('Unknown action: ' + action);
  }
}
