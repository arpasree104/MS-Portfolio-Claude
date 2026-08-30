/**
 * AdminService.gs
 * User whitelist / role management (Requirement: 4-level roles, admin can grant/reset access).
 */

function listUsers_(caller) {
  requireRole_(caller, ['admin']);
  return getAllRows_('Users');
}

/** Whitelist a new user (they must have already attempted Google sign-in at least once is NOT required —
 *  admin can pre-approve an email before the person ever logs in). */
function createOrUpdateUser_(caller, data) {
  requireRole_(caller, ['admin']);

  var existing = findRows_('Users', function (u) { return String(u.Email).toLowerCase() === String(data.Email).toLowerCase(); })[0];

  if (existing) {
    var patch = {};
    if (data.Role) patch.Role = data.Role;
    if (data.Status) patch.Status = data.Status;
    if (data.DisplayNameTH) patch.DisplayNameTH = data.DisplayNameTH;
    if (data.DisplayNameEN) patch.DisplayNameEN = data.DisplayNameEN;
    if (data.DivisionId !== undefined) patch.DivisionId = data.DivisionId;
    if (data.IsHeadOfDivision !== undefined) patch.IsHeadOfDivision = data.IsHeadOfDivision;
    updateRowById_('Users', existing.UserId, patch);
    logAudit_(caller.userId, 'update_user', 'Users', existing.UserId, JSON.stringify(patch));
    return findById_('Users', existing.UserId);
  }

  var userId = generateId_('Users');
  var row = {
    UserId: userId,
    Email: data.Email,
    Role: data.Role || 'student',
    Status: data.Status || 'active',
    DisplayNameTH: data.DisplayNameTH || '',
    DisplayNameEN: data.DisplayNameEN || '',
    CreatedAt: nowIso_(),
    LastLogin: '',
    DivisionId: data.DivisionId || '',
    IsHeadOfDivision: data.IsHeadOfDivision || 'FALSE'
  };
  appendRow_('Users', row);
  logAudit_(caller.userId, 'create_user', 'Users', userId, JSON.stringify(row));

  // If role is student, auto-create a linked Students profile shell
  if (row.Role === 'student') {
    var studentId = generateId_('Students');
    appendRow_('Students', {
      StudentId: studentId,
      UserId: userId,
      StudentCode: '',
      FirstNameTH: data.DisplayNameTH || '',
      LastNameTH: '',
      EnrollmentStatus: 'กำลังศึกษา',
      CreatedAt: nowIso_(),
      UpdatedAt: nowIso_()
    });
  }

  return row;
}

function disableUser_(caller, userId) {
  requireRole_(caller, ['admin']);
  updateRowById_('Users', userId, { Status: 'disabled' });
  logAudit_(caller.userId, 'disable_user', 'Users', userId, '');
  return true;
}

function logAudit_(userId, action, targetTable, targetId, detail) {
  appendRow_('AuditLog', {
    UserId: userId,
    Action: action,
    TargetTable: targetTable,
    TargetId: targetId,
    Timestamp: nowIso_(),
    Detail: detail
  });
}

/**
 * Called during NextAuth signIn callback (before the account is necessarily whitelisted).
 * If the email has never been seen before, creates a 'pending' Users row so the admin
 * can see and approve it later. Always returns the current status/role.
 */
function registerLoginAttempt_(email, displayName) {
  var existing = findRows_('Users', function (u) { return String(u.Email).toLowerCase() === String(email).toLowerCase(); })[0];

  if (existing) {
    updateRowById_('Users', existing.UserId, { LastLogin: nowIso_() });
    return { role: existing.Role, status: existing.Status };
  }

  var userId = generateId_('Users');
  appendRow_('Users', {
    UserId: userId,
    Email: email,
    Role: 'student',
    Status: 'pending',
    DisplayNameTH: displayName || '',
    DisplayNameEN: displayName || '',
    CreatedAt: nowIso_(),
    LastLogin: nowIso_()
  });
  return { role: 'student', status: 'pending' };
}
