/**
 * ChatService.gs
 * 1:1 in-app chat between a student and their advisor(s) — kept separate from
 * MessageService.gs (which sends a real email per "message" and is the older
 * one-shot contact-form style feature). Chat messages never send email; they're
 * meant for quick back-and-forth with an evidence trail (text + optional file/image),
 * an explicit alternative to conversations happening over LINE that leave no record.
 */

/** People the caller is allowed to open a chat thread with. */
function listChatContacts_(caller) {
  if (caller.role === 'student') {
    var student = findRows_('Students', function (s) { return s.UserId === caller.userId; })[0];
    if (!student) return [];
    var advisorIds = [student.AcademicAdvisorId, student.MajorAdvisorId, student.CoAdvisorId]
      .filter(function (id, idx, arr) { return !!id && arr.indexOf(id) === idx; });
    return advisorIds.map(function (id) { return findById_('Users', id); }).filter(function (u) { return !!u; })
      .map(chatContactView_);
  }

  if (caller.role === 'advisor') {
    var students = findRows_('Students', function (s) { return isPersonalAdvisee_(caller, s); });
    var userIds = students.map(function (s) { return s.UserId; }).filter(function (id) { return !!id; });
    return userIds.map(function (id) { return findById_('Users', id); }).filter(function (u) { return !!u; })
      .map(chatContactView_);
  }

  // admin/executive: not a primary chat use case, but allow reaching anyone active for support purposes.
  return findRows_('Users', function (u) { return u.Status === 'active' && u.UserId !== caller.userId; })
    .map(chatContactView_);
}

function chatContactView_(user) {
  return {
    userId: user.UserId,
    displayNameTH: user.DisplayNameTH,
    displayNameEN: user.DisplayNameEN,
    role: user.Role
  };
}

/** Throws unless caller and otherUserId are a valid chat pair (mirrors listChatContacts_). */
function requireChatPartner_(caller, otherUserId) {
  var contacts = listChatContacts_(caller);
  var allowed = contacts.some(function (c) { return c.userId === otherUserId; });
  if (!allowed) throw new AuthError_('Not permitted to chat with this user');
}

function chatThreadId_(userIdA, userIdB) {
  return [userIdA, userIdB].sort().join('__');
}

function listChatMessages_(caller, otherUserId) {
  requireChatPartner_(caller, otherUserId);
  var threadId = chatThreadId_(caller.userId, otherUserId);
  var messages = findRows_('ChatMessages', function (m) { return m.ThreadId === threadId; })
    .sort(function (a, b) { return new Date(a.CreatedAt) - new Date(b.CreatedAt); });

  // Mark the other person's messages as read now that the caller opened this thread.
  messages.forEach(function (m) {
    if (m.ToUserId === caller.userId && m.ReadStatus !== 'read') {
      updateRowById_('ChatMessages', m.ChatMessageId, { ReadStatus: 'read' });
      m.ReadStatus = 'read';
    }
  });

  return messages;
}

function sendChatMessage_(caller, toUserId, data) {
  requireChatPartner_(caller, toUserId);

  if (!data.Body && !data.fileBase64) {
    throw new Error('A chat message needs text or an attached file');
  }

  var fileUrl = '';
  if (data.fileBase64) {
    // Store chat attachments under the relevant student's Drive folder — for an advisor
    // sending a file, toUserId is the student; for a student sending one, callerId is.
    var studentUserId = caller.role === 'student' ? caller.userId : toUserId;
    var student = findRows_('Students', function (s) { return s.UserId === studentUserId; })[0];
    if (student) {
      var uploaded = uploadFileForStudent_(student.StudentId, data.fileBase64, data.fileName, data.fileMimeType, 'chat');
      if (data.fileMimeType && data.fileMimeType.indexOf('image/') === 0) {
        DriveApp.getFileById(uploaded.fileId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = 'https://drive.google.com/thumbnail?id=' + uploaded.fileId + '&sz=w1000';
      } else {
        fileUrl = uploaded.url;
      }
    }
  }

  var threadId = chatThreadId_(caller.userId, toUserId);
  var chatMessageId = appendRow_('ChatMessages', {
    ThreadId: threadId,
    FromUserId: caller.userId,
    ToUserId: toUserId,
    Body: data.Body || '',
    FileUrl: fileUrl,
    ReadStatus: 'unread',
    CreatedAt: nowIso_()
  });

  notifyAll_([toUserId], 'chat_message', (caller.displayNameTH || caller.email) + ' ส่งข้อความถึงคุณ', 'เขียว', 'ChatMessages', chatMessageId);

  return findById_('ChatMessages', chatMessageId);
}

/** Unread chat message count per contact, for a badge in the contact list. */
function listUnreadChatCounts_(caller) {
  var rows = findRows_('ChatMessages', function (m) { return m.ToUserId === caller.userId && m.ReadStatus !== 'read'; });
  var byFrom = {};
  rows.forEach(function (m) { byFrom[m.FromUserId] = (byFrom[m.FromUserId] || 0) + 1; });
  return byFrom;
}
