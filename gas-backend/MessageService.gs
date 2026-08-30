/**
 * MessageService.gs
 * "Send message via e-mail" feature (Requirement section on roles, page 15):
 * students can email their advisors, advisors can email their students / co-advisors,
 * executives/admin can email anyone in the system. Sends a real email via MailApp and logs it.
 */

function sendMessage_(caller, toUserId, subject, body, studentContextId) {
  var toUser = findById_('Users', toUserId);
  if (!toUser) throw new Error('Recipient not found: ' + toUserId);

  authorizeMessageRecipient_(caller, toUser, studentContextId);

  MailApp.sendEmail({
    to: toUser.Email,
    subject: '[MNS Portfolio] ' + subject,
    body: body + '\n\n---\nส่งจาก: ' + (caller.displayNameTH || caller.email) + ' (' + caller.email + ')'
  });

  return appendRow_('Messages', {
    FromUserId: caller.userId,
    ToUserId: toUserId,
    StudentContextId: studentContextId || '',
    Subject: subject,
    Body: body,
    SentAt: nowIso_(),
    ReadStatus: 'unread'
  });
}

function authorizeMessageRecipient_(caller, toUser, studentContextId) {
  if (caller.role === 'executive' || caller.role === 'admin') return; // can message anyone

  if (caller.role === 'student') {
    if (toUser.Role !== 'advisor' && toUser.Role !== 'admin') {
      throw new AuthError_('Students can only message advisors or admin');
    }
    return;
  }

  if (caller.role === 'advisor') {
    if (toUser.Role === 'student' && studentContextId) {
      requireViewAccess_(caller, studentContextId);
      return;
    }
    if (toUser.Role === 'advisor') return; // co-advisor messaging
    throw new AuthError_('Advisors can only message their own students or other advisors');
  }

  throw new AuthError_('Not permitted to send messages');
}

function listMessages_(caller) {
  return findRows_('Messages', function (m) { return m.ToUserId === caller.userId || m.FromUserId === caller.userId; })
    .sort(function (a, b) { return new Date(b.SentAt) - new Date(a.SentAt); });
}

function markMessageRead_(caller, messageId) {
  var msg = findById_('Messages', messageId);
  if (!msg || msg.ToUserId !== caller.userId) throw new AuthError_('Not your message');
  updateRowById_('Messages', messageId, { ReadStatus: 'read' });
  return true;
}
