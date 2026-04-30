function cleanData(rows, requiredColumns, filename) {
  if (!rows || !Array.isArray(rows)) return [];

  const standardizationMap = {
    'DEPARTMENT': ['DEPARTMENT', 'DEPT', 'DISCIPLINE'],
    'BLOCK': ['BLOCK', 'ROOM', 'VENUE'],
    'PCS': ["PCS", "PC'S", "COMPUTERS", "PC_COUNT", "PCS_COUNT"],
    'DEPARTMENT_INCHARGE': ['DEPARTMENT_INCHARGE', 'INCHARGE', 'HOD'],
    'NAME': ['NAME', 'INVIGILATOR', 'INVIGILATOR_NAME', 'NAMES'],
    'EXTENSION': ['EXTENSION', 'EXT', 'PHONE', 'PHONE_EXT'],
    'SHORT_FORM': ['SHORT_FORM', 'SHORT', 'CODE'],
    'STUDENTS_FOR_EVENING': ['STUDENTS_FOR_EVENING', 'EVENING', 'EVE'],
    'STUDENTS_FOR_WEEKEND': ['STUDENTS_FOR_WEEKEND', 'WEEKEND', 'WEEK']
  };

  // Helper to find standard column name
  function getStandardName(colName) {
    for (const [standardName, variants] of Object.entries(standardizationMap)) {
      if (variants.includes(colName)) {
        return standardName;
      }
    }
    return colName;
  }

  // Normalize all column names: trim whitespace, convert to uppercase, apply mapping
  const normalizedRows = rows.map(row => {
    const newRow = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        let normalizedKey = String(key).trim().replace(/"/g, '').replace(/'/g, '').replace(/ /g, '_').toUpperCase();
        normalizedKey = getStandardName(normalizedKey);
        
        const value = row[key];
        newRow[normalizedKey] = typeof value === 'string' ? value.trim() : value;
      }
    }
    return newRow;
  });

  if (normalizedRows.length === 0) return [];

  // Check required columns exist in at least one row or check globally
  // Wait, SheetJS only outputs keys that exist. We should check if the required columns
  // are present in the dataset. We can check the first row or collect all keys.
  const allKeys = new Set();
  normalizedRows.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });

  const missingColumns = requiredColumns.filter(reqCol => {
    const upperReqCol = reqCol.toUpperCase();
    return !allKeys.has(upperReqCol);
  });

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns in '${filename}': ${missingColumns.join(', ')}`);
  }

  // Drop rows where ALL required columns are empty/null
  const cleanedRows = normalizedRows.filter(row => {
    let hasAtLeastOneValue = false;
    for (const reqCol of requiredColumns) {
      const upperReqCol = reqCol.toUpperCase();
      const val = row[upperReqCol];
      if (val !== null && val !== undefined && val !== '') {
        hasAtLeastOneValue = true;
        break;
      }
    }
    return hasAtLeastOneValue;
  });

  return cleanedRows;
}

module.exports = {
  cleanData
};
