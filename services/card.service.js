/**
 * 卡片服务
 * 处理用户卡片的业务逻辑（个人管理，不涉及社区发布）
 */

import dataAPI from '../data/index.js';
import { validateCardTitle, validateBvid, validateCardSource } from '../utils/validators.js';
import { normalize, paginate } from '../utils/helpers.js';
import { CONFIG } from '../config/constants.js';
import { generateCVId } from '../utils/idGenerator.js';

/**
 * 辅助函数:转换为数组
 */
function toArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

/**
 * 获取我的卡片
 */
export function getMyCards(userId, page, pageSize) {
  const mine = dataAPI.getCards().filter((card) => card.userId === userId);

  const result = paginate(mine, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);

  return {
    ok: true,
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

/**
 * 创建卡片
 */
export function createCard(userId, cardData) {
  const source = String(cardData.source || '').trim() || 'bilibili';

  // 拒绝存储本地来源的卡片
  if (source === 'local') {
    return {
      success: false,
      status: 403,
      message: '本地来源的卡片不能上传到服务器。请在本地设备管理。'
    };
  }

  const titleValidation = validateCardTitle(cardData.title);
  if (!titleValidation.valid) {
    return { success: false, status: 400, message: 'Invalid request.' };
  }

  const bvidValidation = validateBvid(cardData.bvid);
  if (!bvidValidation.valid) {
    return { success: false, status: 400, message: bvidValidation.message };
  }

  const now = Date.now();

  // 生成CV号
  const cardIdCounter = dataAPI.getCardIdCounter();
  const cvId = generateCVId(cardIdCounter);

  const newCard = {
    id: cvId,
    userId,
    title: titleValidation.value,
    source: 'bilibili',
    bvid: bvidValidation.value,
    aid: Number(cardData.aid) || 0,
    cid: Number(cardData.cid) || 0,
    localPath: '',
    start: Number(cardData.start) || 0,
    end: Number(cardData.end) || 0,
    tags: toArray(cardData.tags),
    clipTags: toArray(cardData.clipTags),
    bpm: String(cardData.bpm || '').trim(),
    notes: String(cardData.notes || '').trim(),
    visibility: cardData.visibility === 'public' ? 'public' : 'private',
    localDuration: 0,
    localFileSize: 0,
    localWidth: 0,
    localHeight: 0,
    localFps: 0,
    createdAt: now,
    updatedAt: now
  };

  dataAPI.addCard(newCard);

  return { success: true, item: newCard };
}

/**
 * 更新卡片
 */
export function updateCard(cardId, userId, updates) {
  const card = dataAPI.findCard((item) => item.id === cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  // 不允许将服务器卡片的来源改为本地
  if (updates.source === 'local') {
    return {
      success: false,
      status: 403,
      message: '不能将B站卡片修改为本地来源。'
    };
  }

  // 更新字段
  if (typeof updates.title === 'string') card.title = updates.title.trim();
  if (typeof updates.bvid === 'string') card.bvid = updates.bvid.trim();
  if (Number.isFinite(Number(updates.aid))) card.aid = Number(updates.aid);
  if (Number.isFinite(Number(updates.cid))) card.cid = Number(updates.cid);
  if (Number.isFinite(Number(updates.start))) card.start = Number(updates.start);
  if (Number.isFinite(Number(updates.end))) card.end = Number(updates.end);

  if (updates.tags) {
    const tags = toArray(updates.tags);
    if (tags) card.tags = tags;
  }

  if (updates.clipTags) {
    const clipTags = toArray(updates.clipTags);
    if (clipTags) card.clipTags = clipTags;
  }

  if (typeof updates.bpm === 'string') card.bpm = updates.bpm.trim();
  if (typeof updates.notes === 'string') card.notes = updates.notes.trim();

  if (updates.visibility) {
    card.visibility = updates.visibility === 'public' ? 'public' : 'private';
  }

  card.updatedAt = Date.now();
  dataAPI.saveState();

  return { success: true, item: card };
}

/**
 * 删除卡片
 */
export function deleteCard(cardId, userId) {
  const card = dataAPI.findCard((item) => item.id === cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  dataAPI.deleteCard((item) => item.id === cardId);

  return { success: true };
}

/**
 * 切换卡片收藏状态
 */
export function toggleCardFavorite(cardId, userId) {
  const card = dataAPI.findCard((item) => item.id === cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  const { isFavorite } = dataAPI.toggleCardFavorite(userId, cardId);

  return { success: true, isFavorite };
}

/**
 * 获取收藏的卡片
 */
export function getFavoriteCards(userId) {
  const favoriteCardIds = dataAPI.getCardFavorites(userId);
  const favoriteCards = dataAPI.getCards().filter((card) =>
    favoriteCardIds.includes(card.id)
  );

  return {
    ok: true,
    items: favoriteCards
  };
}

/**
 * 发布卡片到社区
 */
export function publishCard(cardId, userId, publishData) {
  const card = dataAPI.findCard((item) => item.id === cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  // 更新卡片可见性和发布信息
  card.visibility = 'public';
  card.publishedAt = Date.now();
  card.categoryId = publishData.categoryId || '';
  card.searchTags = toArray(publishData.searchTags);
  card.updatedAt = Date.now();

  dataAPI.saveState();

  return { success: true, item: card };
}

/**
 * 下架卡片
 */
export function unpublishCard(cardId, userId) {
  const card = dataAPI.findCard((item) => item.id === cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  card.visibility = 'private';
  card.updatedAt = Date.now();

  dataAPI.saveState();

  return { success: true, item: card };
}

/**
 * 点赞/取消点赞卡片
 */
export function toggleCardLike(cardId, userId) {
  const card = dataAPI.findCard((item) => item.id === cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  const { isLiked } = dataAPI.toggleCardLike(userId, cardId);

  return { success: true, isLiked };
}

/**
 * 获取我点赞的卡片列表
 */
export function getLikedCards(userId) {
  const likedCardIds = dataAPI.getCardLikes(userId);
  const likedCards = dataAPI.getCards().filter((card) =>
    likedCardIds.includes(card.id)
  );

  return {
    ok: true,
    items: likedCards
  };
}
