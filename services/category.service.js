/**
 * 分类服务
 * 处理分类的业务逻辑
 */

import dataAPI from '../data/index.js';

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
  const { sort = 'latest', query = '' } = options;

  // 获取该分类下的公开卡片
  let cards = dataAPI.getCards().filter((card) => {
    if (card.visibility !== 'public') return false;
    if (card.categoryId !== categoryId) return false;
    return true;
  });

  // 搜索过滤
  if (query) {
    const normalizedQuery = query.toLowerCase().trim();
    cards = cards.filter((card) => {
      const titleMatch = (card.title || '').toLowerCase().includes(normalizedQuery);
      const bvidMatch = (card.bvid || '').toLowerCase().includes(normalizedQuery);
      return titleMatch || bvidMatch;
    });
  }

  // 排序
  cards.sort((a, b) => {
    if (sort === 'oldest') return a.createdAt - b.createdAt;
    return b.createdAt - a.createdAt;
  });

  return {
    ok: true,
    items: cards,
    total: cards.length
  };
}
