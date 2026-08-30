/**
 * Auth.gs
 * Every inbound request must present the shared secret (checked in Code.gs) AND
 * a callerEmail that resolves to an active user in the Users sheet.
 * This file resolves that email into a { userId, role, status, displayName } context
 * and provides authorization helpers used by every domain service.
 */

/**
 * Resolve the caller's identity. Throws if not found or not active.
 */
function resolveCaller_(email) {
  if (!email) throw new AuthError_('Missing callerEmail');
  var user = findRows_('Users', function (u) {
    return String(u.Email).toLowerCase() === String(email).toLowerCase();
  })[0];

  if (!user) throw new AuthError_('Account not registered: ' + email);
  if (user.Status === 'pending') throw new AuthError_('Account pending admin approval');
  if (user.Status === 'disabled') throw new AuthError_('Account disabled');
  if (user.Status !== 'active') throw new AuthError_('Account not active');

  return {
    userId: user.UserId,
    email: user.Email,
    role: user.Role, // student | advisor | executive | admin
    displayNameTH: user.DisplayNameTH,
    displayNameEN: user.DisplayNameEN
  };
}

function AuthError_(message) {
  var e = new Error(message);
  e.isAuthError = true;
  return e;
}

/** Throws if caller's role is not in the allowed list. */
function requireRole_(caller, allowedRoles) {
  if (allowedRoles.indexOf(caller.role) === -1) {
    throw new AuthError_('Forbidden: role ' + caller.role + ' cannot perform this action');
  }
}

/**
 * Returns true if caller is allowed to view/edit the given studentId's data:
 * - student: only their own record
 * - advisor: only students where they are AcademicAdvisorId / MajorAdvisorId / CoAdvisorId
 * - executive / admin: any student
 */
function canAccessStudent_(caller, studentId) {
  if (caller.role === 'executive' || caller.role === 'admin') return true;

  var student = findById_('Students', studentId);
  if (!student) return false;

  if (caller.role === 'student') {
    return student.UserId === caller.userId;
  }

  if (caller.role === 'advisor') {
    return student.AcademicAdvisorId === caller.userId ||
      student.MajorAdvisorId === caller.userId ||
      student.CoAdvisorId === caller.userId;
  }

  return false;
}

function requireStudentAccess_(caller, studentId) {
  if (!canAccessStudent_(caller, studentId)) {
    throw new AuthError_('Forbidden: no access to student ' + studentId);
  }
}

/** Fields hidden from executive-level aggregate views (sensitive personal/health data). */
var SENSITIVE_STUDENT_FIELDS = ['NationalIdMasked', 'Address', 'Phone', 'EmergencyContact', 'SupportNeeds'];

function stripSensitiveFields_(studentObj, caller) {
  if (caller.role === 'executive') {
    var copy = Object.assign({}, studentObj);
    SENSITIVE_STUDENT_FIELDS.forEach(function (f) { delete copy[f]; });
    return copy;
  }
  return studentObj;
}
