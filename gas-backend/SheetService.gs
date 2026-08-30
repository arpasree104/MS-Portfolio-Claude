/**
 * SheetService.gs
 * Generic row-based CRUD helpers shared by every domain service.
 * Sheets are treated like simple tables: row 1 = headers, col 1 = Id.
 */

function ss_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet_(name) {
  var sheet = ss_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

/** Read all rows of a sheet as an array of plain objects keyed by header name. */
function getAllRows_(sheetName) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    rows.push(rowToObject_(headers, row));
  }
  return rows;
}

function rowToObject_(headers, row) {
  var obj = {};
  for (var j = 0; j < headers.length; j++) {
    var value = row[j];
    // Sheets auto-converts cells written with the strings 'TRUE'/'FALSE' into native
    // booleans on read-back. Every boolean-flag column in this app (IsActive,
    // IsConfidential, AckByStudent, AckByAdvisor, IsHeadOfDivision, ...) is modeled as
    // the string 'TRUE'/'FALSE', so normalize native booleans back to match.
    if (value === true) value = 'TRUE';
    else if (value === false) value = 'FALSE';
    obj[headers[j]] = value;
  }
  return obj;
}

/** Get rows matching a predicate function(obj) -> boolean. */
function findRows_(sheetName, predicate) {
  return getAllRows_(sheetName).filter(predicate);
}

/** Get a single row by its Id (first column). Returns null if not found. */
function findById_(sheetName, id) {
  var sheet = getSheet_(sheetName);
  var idColName = sheet.getRange(1, 1).getValue();
  var rows = getAllRows_(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idColName]) === String(id)) return rows[i];
  }
  return null;
}

/** Append a new row from a plain object. Fills missing columns with ''. Returns the generated/used Id. */
function appendRow_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = headers[0];
  if (!obj[idCol]) {
    obj[idCol] = generateId_(sheetName);
  }
  var row = headers.map(function (h) {
    return obj.hasOwnProperty(h) ? obj[h] : '';
  });
  sheet.appendRow(row);
  return obj[idCol];
}

/** Update an existing row identified by Id with the given partial object. Returns true if found & updated. */
function updateRowById_(sheetName, id, patch) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      headers.forEach(function (h, colIdx) {
        if (patch.hasOwnProperty(h)) {
          sheet.getRange(i + 1, colIdx + 1).setValue(patch[h]);
        }
      });
      return true;
    }
  }
  return false;
}

/** Delete a row by Id. Returns true if found & deleted. */
function deleteRowById_(sheetName, id) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * Delete every row where predicate(rowObject) is true. Returns the count deleted.
 * Iterates bottom-up so deleting a row never shifts the index of rows not yet visited.
 */
function deleteRowsWhere_(sheetName, predicate) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return 0;
  var headers = values[0];
  var deletedCount = 0;
  for (var i = values.length - 1; i >= 1; i--) {
    var row = values[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    var obj = rowToObject_(headers, row);
    if (predicate(obj)) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  return deletedCount;
}

/** Simple incrementing-safe unique id generator, prefixed by sheet initial. */
function generateId_(sheetName) {
  var prefix = sheetName.replace(/[a-z]/g, '').slice(0, 4) || sheetName.slice(0, 4).toUpperCase();
  return prefix + '-' + Utilities.getUuid().slice(0, 8);
}

function nowIso_() {
  return new Date().toISOString();
}
