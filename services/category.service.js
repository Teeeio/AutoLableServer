/**
 * 分类服务
 * 处理分类的业务逻辑
 */

import { getPublicCardsByCategory } from './card.service.js';

/**
 * 预定义的分类列表
 */
const DEFAULT_CATEGORIES = [
  { id: 'kpop', name: 'K-POP', description: '韩国流行音乐舞蹈' },
  { id: 'jpop', name: 'J-POP', description: '日本流行音乐舞蹈' },
  { id: 'cpop', name: 'C-POP', description: '华语流行音乐舞蹈' },
  { id: 'anime', name: '动漫舞蹈', description: '动漫相关舞蹈' },
  { id: 'game', name: '游戏舞蹈', description: '游戏相关舞蹈' },
  { id: 'tiktok', name: '抖音热门', description: '抖音热门舞蹈' },
  { id: 'classic', name: '经典舞蹈', description: '经典舞蹈' },
  { id: 'other', name: '其他', description: '其他类型' }
];

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
