/**
 * PLOService.gs
 * Program Learning Outcome tracking, 7 PLOs (Requirement section 4).
 */

var PLO_DEFINITIONS = [
  { code: 'PLO1', nameTH: 'การปฏิบัติการพยาบาลขั้นสูงสำหรับผู้ใหญ่และผู้สูงอายุ' },
  { code: 'PLO2', nameTH: 'การสร้างนวัตกรรมทางการพยาบาล' },
  { code: 'PLO3', nameTH: 'การสร้างงานวิจัย' },
  { code: 'PLO4', nameTH: 'การเผยแพร่ผลงานวิชาการหรือวิจัย' },
  { code: 'PLO5', nameTH: 'ภาวะผู้นำและการทำงานร่วมกับเครือข่าย' },
  { code: 'PLO6', nameTH: 'การใช้เทคโนโลยีดิจิทัลทางสุขภาพ' },
  { code: 'PLO7', nameTH: 'ภาษาอังกฤษ การอ่าน การสรุป และการคิดวิเคราะห์' }
];

function listPLOAssessments_(caller, studentId) {
  requireViewAccess_(caller, studentId);
  var rows = findRows_('PLOAssessments', function (r) { return r.StudentId === studentId; });

  return PLO_DEFINITIONS.map(function (def) {
    var record = rows.filter(function (r) { return r.PLO === def.code; })
      .sort(function (a, b) { return new Date(b.AssessedDate) - new Date(a.AssessedDate); })[0];
    return {
      plo: def.code,
      nameTH: def.nameTH,
      assessment: record || null
    };
  });
}

function upsertPLOAssessment_(caller, studentId, data) {
  requireEditAccess_(caller, studentId);
  data.StudentId = studentId;
  data.UpdatedAt = nowIso_();
  if (!data.AssessedDate) data.AssessedDate = nowIso_();

  if (data.AssessmentId) {
    updateRowById_('PLOAssessments', data.AssessmentId, data);
    return data.AssessmentId;
  }
  return appendRow_('PLOAssessments', data);
}
