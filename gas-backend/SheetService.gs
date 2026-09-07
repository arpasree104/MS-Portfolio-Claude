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

/**
 * Trim defensively: a hand-edited header cell with stray leading/trailing whitespace
 * would otherwise silently produce a differently-named key (e.g. 'UniversityEmail '),
 * making every row look like that column is empty even though the data is there, and
 * making every write to that column silently a no-op (patch.hasOwnProperty(h) never
 * matches). Every place that reads a sheet's header row goes through this.
 */
function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return typeof h === 'string' ? h.trim() : h; });
}

/**
 * Sheets that are read far more often than written (read on nearly every request, via
 * resolveCaller_ for Users, or via dropdown/catalog lookups for CourseCatalog/Divisions)
 * and change rarely (admin actions only). Safe to cache briefly: a few minutes of
 * staleness on "did an admin just approve/rename something" is a low-risk tradeoff for
 * cutting out a full sheet scan on every single routed action. Every write path below
 * (appendRow_/updateRowById_/deleteRowById_/deleteRowsWhere_) invalidates the cache for
 * the sheet it just wrote to, so a write is visible to the writer's own very next read.
 */
var CACHEABLE_SHEETS = { Users: true, CourseCatalog: true, Divisions: true };
var CACHE_TTL_SECONDS = 300;

function cacheKeyForSheet_(sheetName) {
  return 'sheet_rows_' + sheetName;
}

function invalidateSheetCache_(sheetName) {
  if (!CACHEABLE_SHEETS[sheetName]) return;
  CacheService.getScriptCache().remove(cacheKeyForSheet_(sheetName));
}

/** Read all rows of a sheet as an array of plain objects keyed by header name. */
function getAllRows_(sheetName) {
  if (CACHEABLE_SHEETS[sheetName]) {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(cacheKeyForSheet_(sheetName));
    if (cached !== null) return JSON.parse(cached);
  }

  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = getHeaders_(sheet);
  var rows = [];
  if (values.length >= 2) {
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.every(function (c) { return c === '' || c === null; })) continue;
      rows.push(rowToObject_(headers, row));
    }
  }

  if (CACHEABLE_SHEETS[sheetName]) {
    try {
      CacheService.getScriptCache().put(cacheKeyForSheet_(sheetName), JSON.stringify(rows), CACHE_TTL_SECONDS);
    } catch (e) {
      // Cache put can fail if the serialized sheet exceeds the 100KB-per-key limit;
      // that's fine, just means this sheet stops being cached until it shrinks again.
    }
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
    // Every date-bearing column in this app (BirthDate, LicenseExpiry, PlannedDate,
    // ActualDate, ItemDate, LogDate, DueDate, ...) is only ever written as a plain
    // 'YYYY-MM-DD' string from an <input type="date">, or hand-typed into the sheet as
    // a calendar date. Sheets auto-converts such cells to its native date type, and
    // Apps Script hands those back as JS Date objects, which JSON.stringify would
    // otherwise serialize via toJSON() into a UTC ISO timestamp (wrong shape for a date
    // input, and can shift the calendar day). Normalize back to 'YYYY-MM-DD' in the
    // script's own timezone so every read matches what was originally written.
    else if (value instanceof Date) value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
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
  var idColName = getHeaders_(sheet)[0];
  var rows = getAllRows_(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idColName]) === String(id)) return rows[i];
  }
  return null;
}

/** Append a new row from a plain object. Fills missing columns with ''. Returns the generated/used Id. */
function appendRow_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  var idCol = headers[0];
  if (!obj[idCol]) {
    obj[idCol] = generateId_(sheetName);
  }
  var row = headers.map(function (h) {
    return obj.hasOwnProperty(h) ? obj[h] : '';
  });
  sheet.appendRow(row);
  invalidateSheetCache_(sheetName);
  return obj[idCol];
}

/** Update an existing row identified by Id with the given partial object. Returns true if found & updated. */
function updateRowById_(sheetName, id, patch) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = getHeaders_(sheet);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      headers.forEach(function (h, colIdx) {
        if (patch.hasOwnProperty(h)) {
          sheet.getRange(i + 1, colIdx + 1).setValue(patch[h]);
        }
      });
      invalidateSheetCache_(sheetName);
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
      invalidateSheetCache_(sheetName);
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
  var headers = getHeaders_(sheet);
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
  if (deletedCount > 0) invalidateSheetCache_(sheetName);
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
