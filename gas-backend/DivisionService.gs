/**
 * DivisionService.gs
 * สาขาวิชา (Division/track) management. Students pick one at onboarding; advisors are
 * assigned one by Admin (used for head-of-division scoping in Auth.gs). Divisions are
 * never hard-deleted — only deactivated (IsActive=FALSE) — so existing references never dangle.
 */

/** Reachable by any resolved caller. Non-admins should pass activeOnly=true. */
function listDivisions_(activeOnly) {
  var rows = getAllRows_('Divisions');
  if (activeOnly) {
    rows = rows.filter(function (d) { return d.IsActive === 'TRUE'; });
  }
  return rows;
}

function listAllDivisionsForAdmin_(caller) {
  requireRole_(caller, ['admin']);
  return getAllRows_('Divisions');
}

/** Sequential, zero-padded IDs (D0001, D0002, ...) instead of the generic UUID scheme,
 *  since divisions are a small, human-managed list where readable ordinal IDs are nicer. */
function generateSequentialDivisionId_() {
  var existing = getAllRows_('Divisions');
  var maxNum = 0;
  existing.forEach(function (d) {
    var match = /^D(\d+)$/.exec(d.DivisionId);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  var next = maxNum + 1;
  var padded = ('0000' + next).slice(-4);
  return 'D' + padded;
}

function createDivision_(caller, data) {
  requireRole_(caller, ['admin']);
  if (!data.NameTH) throw new Error('NameTH is required');

  var divisionId = generateSequentialDivisionId_();
  appendRow_('Divisions', {
    DivisionId: divisionId,
    NameTH: data.NameTH,
    NameEN: data.NameEN || '',
    IsActive: 'TRUE',
    CreatedAt: nowIso_()
  });
  return findById_('Divisions', divisionId);
}

/**
 * One-time cleanup: wipes ALL rows from the Divisions sheet (keeping the header row).
 * Run manually once from the Apps Script editor to clear out test data created before
 * IDs switched from UUIDs to the sequential D0001/D0002/... scheme.
 */
function clearAllDivisions() {
  var sheet = getSheet_('Divisions');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  Logger.log('Divisions sheet cleared.');
}

function updateDivision_(caller, divisionId, patch) {
  requireRole_(caller, ['admin']);
  var allowed = {};
  if (patch.NameTH !== undefined) allowed.NameTH = patch.NameTH;
  if (patch.NameEN !== undefined) allowed.NameEN = patch.NameEN;
  if (patch.IsActive !== undefined) allowed.IsActive = patch.IsActive;
  updateRowById_('Divisions', divisionId, allowed);
  return findById_('Divisions', divisionId);
}
