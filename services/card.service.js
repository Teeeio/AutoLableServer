/**
 * 卡片服务
 * 处理用户卡片、社区公开卡片以及交互行为。
 */

import dataAPI from '../data/index.js';
import { validateCardTitle, validateBvid } from '../utils/validators.js';
import { normalize, paginate } from '../utils/helpers.js';
import { CONFIG } from '../config/constants.js';
import { generateCVId } from '../utils/idGenerator.js';

function toArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function createCountMap(groups = {}) {
  const counts = new Map();

  for (const ids of Object.values(groups)) {
    for (const id of ids || []) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  return counts;
}

function buildInteractionContext(userId = null) {
  const state = dataAPI.getState();

  return {
    likedIds: new Set(userId ? dataAPI.getCardLikes(userId) : []),
    favoriteIds: new Set(userId ? dataAPI.getCardFavorites(userId) : []),
    likeCounts: createCountMap(state.cardLikes || {}),
    favoriteCounts: createCountMap(state.cardFavorites || {})
  };
}

function normalizeCommunityCard(card, sourceType, context) {
  const id = String(card.id || '').trim();
  const likeCount = context.likeCounts.get(id) ?? Number(card.likeCount) ?? 0;
  const favoriteCount = context.favoriteCounts.get(id) ?? Number(card.favoriteCount) ?? 0;
  const userId = card.userId || card.publisherId || '';
  const publishedAt = Number(card.publishedAt) || Number(card.createdAt) || Date.now();

  return {
    id,
    sourceType,
    userId,
    publisherId: userId,
    sourceCardId: card.sourceCardId || id,
    title: String(card.title || '').trim(),
    source: String(card.source || 'bilibili').trim(),
    bvid: String(card.bvid || '').trim(),
    aid: Number(card.aid) || 0,
    cid: Number(card.cid) || 0,
    start: Number(card.start) || 0,
    end: Number(card.end) || 0,
    tags: toArray(card.tags),
    clipTags: toArray(card.clipTags),
    searchTags: toArray(card.searchTags),
    bpm: String(card.bpm || '').trim(),
    notes: String(card.notes || '').trim(),
    categoryId: String(card.categoryId || '').trim(),
    visibility: 'public',
    likeCount,
    favoriteCount,
    isLiked: context.likedIds.has(id),
    isFavorite: context.favoriteIds.has(id),
    createdAt: Number(card.createdAt) || publishedAt,
    publishedAt,
    updatedAt: Number(card.updatedAt) || publishedAt
  };
}

function buildCommunityCatalog(userId = null) {
  const context = buildInteractionContext(userId);
  const directCards = dataAPI
    .getCards()
    .filter((card) => card.visibility === 'public')
    .map((card) => normalizeCommunityCard(card, 'card', context));
  const publishedCards = dataAPI
    .getPublishedCards()
    .map((card) => normalizeCommunityCard(card, 'published', context));

  return [...publishedCards, ...directCards];
}

function filterCommunityCards(cards, query = '', categoryId = '') {
  const normalizedQuery = normalize(query);

  return cards.filter((card) => {
    if (categoryId && card.categoryId !== categoryId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const titleMatch = normalize(card.title).includes(normalizedQuery);
    const bvidMatch = normalize(card.bvid).includes(normalizedQuery);
    const notesMatch = normalize(card.notes).includes(normalizedQuery);
    const tagMatch = card.tags.some((tag) => normalize(tag).includes(normalizedQuery));
    const searchTagMatch = card.searchTags.some((tag) => normalize(tag).includes(normalizedQuery));

    return titleMatch || bvidMatch || notesMatch || tagMatch || searchTagMatch;
  });
}

function sortCommunityCards(cards, sort = 'latest') {
  const sorted = [...cards];

  sorted.sort((left, right) => {
    switch (sort) {
      case 'oldest':
        return left.publishedAt - right.publishedAt;
      case 'popular':
      case 'trending':
        return right.likeCount - left.likeCount || right.publishedAt - left.publishedAt;
      case 'latest':
      case 'newest':
      default:
        return right.publishedAt - left.publishedAt;
    }
  });

  return sorted;
}

function findPublishedCard(cardId) {
  return dataAPI.findPublishedCard((item) => item.id === cardId) || null;
}

function findPersonalCard(cardId) {
  return dataAPI.findCard((item) => item.id === cardId) || null;
}

function resolveInteractionTarget(cardId) {
  const publishedCard = findPublishedCard(cardId);
  if (publishedCard) {
    return { sourceType: 'published', card: publishedCard };
  }

  const personalCard = findPersonalCard(cardId);
  if (!personalCard) {
    return null;
  }

  return { sourceType: 'card', card: personalCard };
}

function syncInteractionCounts(cardId, target) {
  const state = dataAPI.getState();
  const likeCount = (state.cardLikes && createCountMap(state.cardLikes).get(cardId)) || 0;
  const favoriteCount = (state.cardFavorites && createCountMap(state.cardFavorites).get(cardId)) || 0;

  target.card.likeCount = likeCount;
  target.card.favoriteCount = favoriteCount;
  target.card.updatedAt = Date.now();
  dataAPI.saveState();

  return { likeCount, favoriteCount };
}

function getVisibleCommunityItem(cardId, userId = null) {
  return buildCommunityCatalog(userId).find((item) => item.id === cardId) || null;
}

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

export function getPublicCards(query, sort, page, pageSize, userId = null) {
  const filtered = filterCommunityCards(buildCommunityCatalog(userId), query);
  const sorted = sortCommunityCards(filtered, sort);
  const result = paginate(sorted, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);

  return {
    ok: true,
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

export function getPublicCardsByCategory(categoryId, options = {}, userId = null) {
  const { sort = 'latest', query = '', page, pageSize } = options;
  const filtered = filterCommunityCards(buildCommunityCatalog(userId), query, categoryId);
  const sorted = sortCommunityCards(filtered, sort);

  if (page !== undefined || pageSize !== undefined) {
    const result = paginate(sorted, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);
    return {
      ok: true,
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    };
  }

  return {
    ok: true,
    items: sorted,
    total: sorted.length
  };
}

export function createCard(userId, cardData) {
  const source = String(cardData.source || '').trim() || 'bilibili';

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
    searchTags: toArray(cardData.searchTags),
    bpm: String(cardData.bpm || '').trim(),
    notes: String(cardData.notes || '').trim(),
    visibility: cardData.visibility === 'public' ? 'public' : 'private',
    categoryId: String(cardData.categoryId || '').trim(),
    publishedAt: cardData.visibility === 'public' ? now : 0,
    likeCount: 0,
    favoriteCount: 0,
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

export function updateCard(cardId, userId, updates) {
  const card = findPersonalCard(cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  if (updates.source === 'local') {
    return {
      success: false,
      status: 403,
      message: '不能将B站卡片修改为本地来源。'
    };
  }

  if (typeof updates.title === 'string') card.title = updates.title.trim();
  if (typeof updates.bvid === 'string') card.bvid = updates.bvid.trim();
  if (Number.isFinite(Number(updates.aid))) card.aid = Number(updates.aid);
  if (Number.isFinite(Number(updates.cid))) card.cid = Number(updates.cid);
  if (Number.isFinite(Number(updates.start))) card.start = Number(updates.start);
  if (Number.isFinite(Number(updates.end))) card.end = Number(updates.end);
  if (typeof updates.categoryId === 'string') card.categoryId = updates.categoryId.trim();

  if (updates.tags !== undefined) {
    card.tags = toArray(updates.tags);
  }

  if (updates.clipTags !== undefined) {
    card.clipTags = toArray(updates.clipTags);
  }

  if (updates.searchTags !== undefined) {
    card.searchTags = toArray(updates.searchTags);
  }

  if (typeof updates.bpm === 'string') card.bpm = updates.bpm.trim();
  if (typeof updates.notes === 'string') card.notes = updates.notes.trim();

  if (updates.visibility !== undefined) {
    card.visibility = updates.visibility === 'public' ? 'public' : 'private';
    if (card.visibility === 'public' && !card.publishedAt) {
      card.publishedAt = Date.now();
    }
  }

  card.updatedAt = Date.now();
  dataAPI.saveState();

  return { success: true, item: card };
}

export function deleteCard(cardId, userId) {
  const card = findPersonalCard(cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  dataAPI.deleteCard((item) => item.id === cardId);

  return { success: true };
}

export function toggleCardFavorite(cardId, userId) {
  const target = resolveInteractionTarget(cardId);

  if (!target) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  if (target.sourceType === 'card' && target.card.visibility !== 'public') {
    return { success: false, status: 403, message: 'Only public cards can be favorited.' };
  }

  const { isFavorite } = dataAPI.toggleCardFavorite(userId, cardId);
  const counts = syncInteractionCounts(cardId, target);

  return { success: true, isFavorite, favoriteCount: counts.favoriteCount };
}

export function getFavoriteCards(userId) {
  const favoriteIds = new Set(dataAPI.getCardFavorites(userId));
  const items = buildCommunityCatalog(userId).filter((card) => favoriteIds.has(card.id));

  return {
    ok: true,
    items
  };
}

export function publishCard(cardId, userId, publishData) {
  const card = findPersonalCard(cardId);

  if (!card) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  if (card.userId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  card.visibility = 'public';
  card.publishedAt = Date.now();
  card.categoryId = String(publishData.categoryId || '').trim();
  card.searchTags = toArray(publishData.searchTags);
  card.clipTags = publishData.clipTags !== undefined ? toArray(publishData.clipTags) : card.clipTags;
  card.likeCount = Number(card.likeCount) || 0;
  card.favoriteCount = Number(card.favoriteCount) || 0;
  card.updatedAt = Date.now();

  dataAPI.saveState();

  return { success: true, item: card };
}

export function unpublishCard(cardId, userId) {
  const card = findPersonalCard(cardId);

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

export function toggleCardLike(cardId, userId) {
  const target = resolveInteractionTarget(cardId);

  if (!target) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  if (target.sourceType === 'card' && target.card.visibility !== 'public') {
    return { success: false, status: 403, message: 'Only public cards can be liked.' };
  }

  const { isLiked } = dataAPI.toggleCardLike(userId, cardId);
  const counts = syncInteractionCounts(cardId, target);

  return { success: true, isLiked, likeCount: counts.likeCount };
}

export function getLikedCards(userId) {
  const likedIds = new Set(dataAPI.getCardLikes(userId));
  const items = buildCommunityCatalog(userId).filter((card) => likedIds.has(card.id));

  return {
    ok: true,
    items
  };
}

export function getPublicCardById(cardId, userId = null) {
  const item = getVisibleCommunityItem(cardId, userId);

  if (!item) {
    return { success: false, status: 404, message: 'Card not found.' };
  }

  return { success: true, item };
}
