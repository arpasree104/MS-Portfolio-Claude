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

/**
 * Lets a not-yet-approved user pick their own role (student or advisor only — never
 * executive/admin/head-of-division, which stay admin-granted). Callable with no
 * resolveCaller_ gate (same as registerLoginAttempt_/bootstrapFirstAdmin_) since the
 * caller is by definition still 'pending' and cannot authenticate through the normal
 * active-caller path yet. Safe to call repeatedly while pending; becomes a no-op once
 * the account is approved (Status !== 'pending'), so it can never be replayed to
 * re-role an already-active account.
 *
 * - advisor: activated immediately (self-declared) — an admin reviews the roster
 *   afterwards and can disableUser_ anyone who isn't actually an advisor.
 * - student: matched against the pre-imported Students roster by email
 *   (UniversityEmail/SecondaryEmail). A match links UserId onto that row and
 *   activates immediately; no match leaves the account at 'awaiting_profile' so the
 *   student can fill in their own profile via completeStudentProfile_.
 */
function setInitialRole_(email, role) {
  if (role !== 'student' && role !== 'advisor') {
    throw new Error('Invalid role: only student or advisor may be self-selected');
  }

  var user = findRows_('Users', function (u) { return String(u.Email).toLowerCase() === String(email).toLowerCase(); })[0];
  if (!user) throw new Error('Account not registered: ' + email);
  if (user.Status !== 'pending') {
    throw new Error('Account is no longer pending; role can only be changed by an admin now');
  }

  if (role === 'advisor') {
    updateRowById_('Users', user.UserId, { Role: role, Status: 'active' });
    return { role: role, status: 'active' };
  }

  var lowerEmail = String(email).toLowerCase();
  var matchedStudent = findRows_('Students', function (s) {
    return (s.UniversityEmail && String(s.UniversityEmail).toLowerCase() === lowerEmail) ||
      (s.SecondaryEmail && String(s.SecondaryEmail).toLowerCase() === lowerEmail);
  })[0];

  if (matchedStudent) {
    updateRowById_('Students', matchedStudent.StudentId, { UserId: user.UserId, UpdatedAt: nowIso_() });
    updateRowById_('Users', user.UserId, { Role: role, Status: 'active' });
    return { role: role, status: 'active' };
  }

  updateRowById_('Users', user.UserId, { Role: role, Status: 'awaiting_profile' });
  return { role: role, status: 'awaiting_profile' };
}
