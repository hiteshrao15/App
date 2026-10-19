// =====================================================
// Pagination Utilities
// =====================================================
export function paginateQuery(page: string, limit: string, maxLimit = 100) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * pageSize;
  return { pageNum, pageSize, offset };
}

export function paginate(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNext: page * pageSize < total,
    hasPrev: page > 1,
  };
}
