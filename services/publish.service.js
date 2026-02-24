/**
 * 发布卡片服务
 * 管理独立的社区发布卡片（与用户卡片分离）
 */

import dataAPI from '../data/index.js';
import { normalize, paginate } from '../utils/helpers.js';
import { CONFIG } from '../config/constants.js';

/**
 * 辅助函数:转换为数组
 */
function toArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

/**
 * 发布卡片到社区
 * 创建独立的社区卡片副本
 */
export function publishCardToCommunity(userId, cardData) {
  // 拒绝发布本地来源的卡片
  const source = String(cardData.source || 'bilibili').trim();
  if (source === 'local') {
    return {
      success: false,
      status: 403,
      message: '本地来源的卡片不能发布到社区。'
    };
  }

  // 验证必要字段
  if (!cardData.bvid) {
    return { success: false, status: 400, message: '缺少bvid字段。' };
  }

  const now = Date.now();
  const publishedCardIdCounter = dataAPI.getPublishedCardIdCounter();

  // 生成独立的发布卡片ID (PC开头)
  const publishedCardId = `PC${String(publishedCardIdCounter + 1).padStart(8, '0')}`;

  // 创建独立的发布卡片副本
  const publishedCard = {
    id: publishedCardId,
    publisherId: userId,           // 发布者ID
    sourceCardId: cardData.id || null, // 原始卡片ID（可选关联）

    // 卡片内容（独立副本）
    title: String(cardData.title || '').trim() || '未命名卡片',
    source: 'bilibili',
    bvid: String(cardData.bvid || '').trim(),
    aid: Number(cardData.aid) || 0,
    cid: Number(cardData.cid) || 0,
    start: Number(cardData.start) || 0,
    end: Number(cardData.end) || 0,
    tags: toArray(cardData.tags),
    clipTags: toArray(cardData.clipTags),
    bpm: String(cardData.bpm || '').trim(),
    notes: String(cardData.notes || '').trim(),

    // 发布信息
    categoryId: String(cardData.categoryId || '').trim(),
    searchTags: toArray(cardData.searchTags),
    likeCount: 0,                  // 点赞数
    favoriteCount: 0,              // 收藏数

    // 时间戳
    createdAt: now,
    publishedAt: now,
    updatedAt: now
  };

  dataAPI.addPublishedCard(publishedCard);

  return { success: true, item: publishedCard };
}

/**
 * 获取我发布的卡片列表
 */
export function getMyPublishedCards(userId, page = 1, pageSize = 20) {
  const myPublished = dataAPI.filterPublishedCards((card) => card.publisherId === userId);

  // 按发布时间倒序
  const sorted = [...myPublished].sort((a, b) => b.publishedAt - a.publishedAt);

  const result = paginate(sorted, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);

  return {
    ok: true,
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

/**
 * 下架发布的卡片
 * 从社区中移除，但不影响原始用户卡片
 */
export function unpublishFromCommunity(publishedCardId, userId) {
  const publishedCard = dataAPI.findPublishedCard((card) => card.id === publishedCardId);

  if (!publishedCard) {
    return { success: false, status: 404, message: '发布的卡片不存在。' };
  }

  if (publishedCard.publisherId !== userId) {
    return { success: false, status: 403, message: '无权下架此卡片。' };
  }

  dataAPI.deletePublishedCard((card) => card.id === publishedCardId);

  return { success: true };
}

/**
 * 获取社区卡片列表（公开）
 */
export function getCommunityCards(query, categoryId, sort = 'newest', page = 1, pageSize = 20) {
  let cards = dataAPI.getPublishedCards();

  // 分类过滤
  if (categoryId) {
    cards = cards.filter((card) => card.categoryId === categoryId);
  }

  // 搜索过滤
  if (query) {
    const normalizedQuery = normalize(query);
    cards = cards.filter((card) => {
      const titleMatch = normalize(card.title).includes(normalizedQuery);
      const bvidMatch = normalize(card.bvid).includes(normalizedQuery);
      const notesMatch = normalize(card.notes).includes(normalizedQuery);
      const tagMatch = card.tags.some((tag) => normalize(tag).includes(normalizedQuery));
      const searchTagMatch = card.searchTags.some((tag) => normalize(tag).includes(normalizedQuery));
      return titleMatch || bvidMatch || notesMatch || tagMatch || searchTagMatch;
    });
  }

  // 排序
  const sorted = [...cards].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.publishedAt - b.publishedAt;
      case 'popular':
        return b.likeCount - a.likeCount;
      case 'newest':
      default:
        return b.publishedAt - a.publishedAt;
    }
  });

  const result = paginate(sorted, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);

  return {
    ok: true,
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

/**
 * 获取单张社区卡片详情
 */
export function getCommunityCardById(publishedCardId) {
  const card = dataAPI.findPublishedCard((c) => c.id === publishedCardId);

  if (!card) {
    return { success: false, status: 404, message: '卡片不存在。' };
  }

  return { success: true, item: card };
}

/**
 * 增加卡片点赞数
 */
export function incrementCardLikeCount(publishedCardId) {
  const card = dataAPI.findPublishedCard((c) => c.id === publishedCardId);
  if (card) {
    card.likeCount = (card.likeCount || 0) + 1;
    card.updatedAt = Date.now();
    dataAPI.saveState();
  }
}

/**
 * 减少卡片点赞数
 */
export function decrementCardLikeCount(publishedCardId) {
  const card = dataAPI.findPublishedCard((c) => c.id === publishedCardId);
  if (card && card.likeCount > 0) {
    card.likeCount -= 1;
    card.updatedAt = Date.now();
    dataAPI.saveState();
  }
}

/**
 * 增加卡片收藏数
 */
export function incrementCardFavoriteCount(publishedCardId) {
  const card = dataAPI.findPublishedCard((c) => c.id === publishedCardId);
  if (card) {
    card.favoriteCount = (card.favoriteCount || 0) + 1;
    card.updatedAt = Date.now();
    dataAPI.saveState();
  }
}

/**
 * 减少卡片收藏数
 */
export function decrementCardFavoriteCount(publishedCardId) {
  const card = dataAPI.findPublishedCard((c) => c.id === publishedCardId);
  if (card && card.favoriteCount > 0) {
    card.favoriteCount -= 1;
    card.updatedAt = Date.now();
    dataAPI.saveState();
  }
}

/**
 * 检查用户是否发布了某张卡片（通过原始卡片ID）
 */
export function isCardPublished(sourceCardId, userId) {
  const published = dataAPI.findPublishedCard(
    (card) => card.sourceCardId === sourceCardId && card.publisherId === userId
  );
  return !!published;
}

/**
 * 获取用户对某张原始卡片的发布版本
 */
export function getPublishedVersionOfCard(sourceCardId, userId) {
  return dataAPI.findPublishedCard(
    (card) => card.sourceCardId === sourceCardId && card.publisherId === userId
  );
}
