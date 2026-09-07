/**
 * CourseCatalogService.gs
 * Central list of courses (code, TH/EN name, type, credits) that admins maintain, so
 * students pick a course by name when logging an enrollment instead of retyping its
 * code/credits/English name by hand. CourseCode is the sheet's natural unique key.
 */

/** Reachable by any resolved caller. Non-admins should pass activeOnly=true. */
function listCourseCatalog_(activeOnly) {
  var rows = getAllRows_('CourseCatalog');
  if (activeOnly) {
    rows = rows.filter(function (c) { return c.IsActive === 'TRUE'; });
  }
  return rows;
}

function listAllCourseCatalogForAdmin_(caller) {
  requireRole_(caller, ['admin']);
  return getAllRows_('CourseCatalog');
}

function createCourseCatalogItem_(caller, data) {
  requireRole_(caller, ['admin']);
  if (!data.CourseCode) throw new Error('CourseCode is required');
  if (!data.CourseNameTH) throw new Error('CourseNameTH is required');
  if (findById_('CourseCatalog', data.CourseCode)) {
    throw new Error('CourseCode already exists: ' + data.CourseCode);
  }

  appendRow_('CourseCatalog', {
    CourseCode: data.CourseCode,
    CourseNameTH: data.CourseNameTH,
    CourseNameEN: data.CourseNameEN || '',
    CourseType: data.CourseType || 'วิชาเลือก',
    Credits: data.Credits || 0,
    IsActive: 'TRUE',
    CreatedAt: nowIso_()
  });
  return findById_('CourseCatalog', data.CourseCode);
}

function updateCourseCatalogItem_(caller, courseCode, patch) {
  requireRole_(caller, ['admin']);
  var allowed = {};
  if (patch.CourseNameTH !== undefined) allowed.CourseNameTH = patch.CourseNameTH;
  if (patch.CourseNameEN !== undefined) allowed.CourseNameEN = patch.CourseNameEN;
  if (patch.CourseType !== undefined) allowed.CourseType = patch.CourseType;
  if (patch.Credits !== undefined) allowed.Credits = patch.Credits;
  if (patch.IsActive !== undefined) allowed.IsActive = patch.IsActive;
  updateRowById_('CourseCatalog', courseCode, allowed);
  return findById_('CourseCatalog', courseCode);
}
