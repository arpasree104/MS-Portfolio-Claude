/**
 * PortfolioService.gs
 * Academic/professional work portfolio, 12 categories (Requirement section 5).
 * File upload is handled via DriveService and passed in as base64 from the client.
 */

var PORTFOLIO_CATEGORIES = [
  'ผลงานรายวิชา', 'รายงานกรณีศึกษา', 'ผลงานการปฏิบัติการพยาบาลขั้นสูง',
  'โครงการพัฒนาคุณภาพ', 'นวัตกรรมทางการพยาบาล', 'การนำเสนอในชั้นเรียน',
  'การประชุมวิชาการ', 'บทความหรือผลงานตีพิมพ์', 'รางวัลและเกียรติบัตร',
  'กิจกรรมบริการวิชาการ', 'กิจกรรมภาวะผู้นำและจิตอาสา', 'การอบรมและการพัฒนาวิชาชีพ'
];

function listPortfolioItems_(caller, studentId, category) {
  requireStudentAccess_(caller, studentId);
  var rows = findRows_('Portfolio', function (r) { return r.StudentId === studentId; });
  if (category) rows = rows.filter(function (r) { return r.Category === category; });
  return rows;
}

/**
 * Create a portfolio item. If fileBase64 is provided, uploads it to the student's
 * Drive "portfolio" subfolder first and stores the resulting URL.
 */
function createPortfolioItem_(caller, studentId, data) {
  requireStudentAccess_(caller, studentId);

  if (data.fileBase64) {
    var uploaded = uploadFileForStudent_(studentId, data.fileBase64, data.fileName, data.fileMimeType, 'portfolio');
    data.FileUrl = uploaded.url;
    delete data.fileBase64;
    delete data.fileName;
    delete data.fileMimeType;
  }

  data.StudentId = studentId;
  data.CreatedAt = nowIso_();
  return appendRow_('Portfolio', data);
}

function updatePortfolioItem_(caller, studentId, itemId, patch) {
  requireStudentAccess_(caller, studentId);

  if (patch.fileBase64) {
    var uploaded = uploadFileForStudent_(studentId, patch.fileBase64, patch.fileName, patch.fileMimeType, 'portfolio');
    patch.FileUrl = uploaded.url;
    delete patch.fileBase64;
    delete patch.fileName;
    delete patch.fileMimeType;
  }

  updateRowById_('Portfolio', itemId, patch);
  return findById_('Portfolio', itemId);
}

function deletePortfolioItem_(caller, studentId, itemId) {
  requireStudentAccess_(caller, studentId);
  return deleteRowById_('Portfolio', itemId);
}
