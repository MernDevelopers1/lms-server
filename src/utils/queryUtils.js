function buildSortClause(
  sortBy,
  sortOrder,
  validSortColumns,
  defaultSortClause,
) {
  const order =
    String(sortOrder || "").toLowerCase() === "desc" ? "DESC" : "ASC";
  if (
    sortBy &&
    Object.prototype.hasOwnProperty.call(validSortColumns, String(sortBy))
  ) {
    return `ORDER BY ${validSortColumns[String(sortBy)]} ${order}`;
  }
  return `ORDER BY ${defaultSortClause}`;
}

module.exports = {
  buildSortClause,
};
