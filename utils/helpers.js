/**
 * 辅助工具函数
 */

/**
 * 规范化字符串(用于搜索和比较)
 */
export function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * 分页函数
 */
export function paginate(items, page, pageSize, maxPageSize = 100) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(maxPageSize, Math.max(1, Number(pageSize) || 20));
  const start = (safePage - 1) * safeSize;
  return {
    page: safePage,
    pageSize: safeSize,
    total: items.length,
    items: items.slice(start, start + safeSize)
  };
}

/**
 * 为标签添加收藏状态
 */
export function withFavorite(tag, userId, favorites) {
  const favoriteSet = new Set(favorites || []);
  return { ...tag, isFavorite: favoriteSet.has(tag.id) };
}

/**
 * 生成用户ID
 */
export function generateUserId() {
  return `u-${Date.now()}`;
}

/**
 * 生成标签ID
 */
export function generateTagId() {
  return `t-${Date.now()}`;
}
