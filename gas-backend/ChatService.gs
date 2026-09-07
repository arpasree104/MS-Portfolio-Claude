/**
 * ChatService.gs
 * 1:1 in-app chat between a student and their advisor(s) — kept separate from
 * MessageService.gs (which sends a real email per "message" and is the older
 * one-shot contact-form style feature). Chat messages never send email; they're
 * meant for quick back-and-forth with an evidence trail (text + optional file/image),
 * an explicit alternative to conversations happening over LINE that leave no record.
 */

/**
 * People the caller is allowed to open a chat thread with.
 * - student: their own advisor(s) (academic/major/co), plus every executive and every
 *   admin — a student can always reach program leadership or an admin directly, not
 *   just their assigned advisor.
 * - advisor: only their own advisees (unchanged) — a 1:1 relationship each student
 *   controls per-advisor; another advisor's thread with the same student stays private.
 * - executive / admin: every student in the system (they can proactively reach out to
 *   anyone), but NOT each other's private conversations — see listChatMessages_ for the
 *   content-visibility rule, which is stricter than "who you can list as a contact".
 */
function listChatContacts_(caller) {
  if (caller.role === 'student') {
    var student = findRows_('Students', function (s) { return s.UserId === caller.userId; })[0];
    if (!student) return [];
    var advisorIds = [student.AcademicAdvisorId, student.MajorAdvisorId, student.CoAdvisorId]
      .filter(function (id, idx, arr) { return !!id && arr.indexOf(id) === idx; });
    var advisors = advisorIds.map(function (id) { return findById_('Users', id); }).filter(function (u) { return !!u; });
    var leadership = findRows_('Users', function (u) {
      return u.Status === 'active' && (u.Role === 'executive' || u.Role === 'admin');
    });
    return advisors.concat(leadership).map(chatContactView_);
  }

  if (caller.role === 'advisor') {
    var students = findRows_('Students', function (s) { return isPersonalAdvisee_(caller, s); });
    var userIds = students.map(function (s) { return s.UserId; }).filter(function (id) { return !!id; });
    return userIds.map(function (id) { return findById_('Users', id); }).filter(function (u) { return !!u; })
      .map(chatContactView_);
  }

  // executive / admin: every student, so they can proactively reach out to anyone.
  if (caller.role === 'executive' || caller.role === 'admin') {
    var allStudents = getAllRows_('Students');
    return allStudents.map(function (s) { return findById_('Users', s.UserId); }).filter(function (u) { return !!u; })
      .map(chatContactView_);
  }

  return [];
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

/**
 * Admin-only: total chat message count per student, across ALL of that student's
 * threads (with any advisor, executive, or admin) — a activity signal for oversight
 * without exposing what was actually said. An admin's own thread with a student is
 * covered by the normal listChatMessages_ content view; this is deliberately
 * content-free for every other student's threads, per the privacy rule that only the
 * two people in a thread can read its messages.
 */
function listChatActivityStats_(caller) {
  requireRole_(caller, ['admin', 'executive']);
  var students = getAllRows_('Students');
  var allMessages = getAllRows_('ChatMessages');

  var countByUserId = {};
  allMessages.forEach(function (m) {
    countByUserId[m.FromUserId] = (countByUserId[m.FromUserId] || 0) + 1;
    countByUserId[m.ToUserId] = (countByUserId[m.ToUserId] || 0) + 1;
  });

  var lastActivityByUserId = {};
  allMessages.forEach(function (m) {
    [m.FromUserId, m.ToUserId].forEach(function (uid) {
      if (!lastActivityByUserId[uid] || new Date(m.CreatedAt) > new Date(lastActivityByUserId[uid])) {
        lastActivityByUserId[uid] = m.CreatedAt;
      }
    });
  });

  return students.map(function (s) {
    return {
      studentId: s.StudentId,
      userId: s.UserId,
      messageCount: countByUserId[s.UserId] || 0,
      lastActivityAt: lastActivityByUserId[s.UserId] || null
    };
  });
}
