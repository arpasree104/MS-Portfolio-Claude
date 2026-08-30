/**
 * DriveService.gs
 * All evidence/attachment files are stored under DRIVE_ROOT_FOLDER_ID, one subfolder per student.
 */

/** Get (creating if needed) the Drive subfolder for a student, and cache its Id on the Students row. */
function getOrCreateStudentFolder_(studentId) {
  var student = findById_('Students', studentId);
  if (!student) throw new Error('Student not found: ' + studentId);

  if (student.DriveFolderId) {
    try {
      var existing = DriveApp.getFolderById(student.DriveFolderId);
      return existing.getId();
    } catch (e) {
      // fall through and recreate if the cached id is invalid/deleted
    }
  }

  var root = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
  var folderName = student.StudentCode ? (student.StudentCode + '_' + student.FirstNameEN) : studentId;
  var folders = root.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : root.createFolder(folderName);

  updateRowById_('Students', studentId, { DriveFolderId: folder.getId() });
  return folder.getId();
}

/**
 * Upload a base64-encoded file into a student's folder (optionally a named subfolder like "thesis", "portfolio").
 * Returns { fileId, url, name }.
 */
function uploadFileForStudent_(studentId, base64Data, filename, mimeType, subfolderName) {
  var studentFolderId = getOrCreateStudentFolder_(studentId);
  var targetFolder = DriveApp.getFolderById(studentFolderId);

  if (subfolderName) {
    var subs = targetFolder.getFoldersByName(subfolderName);
    targetFolder = subs.hasNext() ? subs.next() : targetFolder.createFolder(subfolderName);
  }

  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', filename);
  var file = targetFolder.createFile(blob);

  return {
    fileId: file.getId(),
    url: file.getUrl(),
    name: file.getName()
  };
}
