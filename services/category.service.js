/**
 * 分类服务
 * 处理分类的业务逻辑
 */

import { DEFAULT_CATEGORIES } from '../config/categories.js';
import { getPublicCardsByCategory } from './card.service.js';

/**
 * 获取所有分类列表
 */
export function getCategories() {
  return {
    ok: true,
    items: DEFAULT_CATEGORIES
  };
}

/**
 * 获取指定分类下的卡片
 */
export function getCategoryCards(categoryId, options = {}) {
  return getPublicCardsByCategory(categoryId, options);
}
