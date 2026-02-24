/**
 * 标签服务
 * 处理标签的业务逻辑
 */

import dataAPI from '../data/index.js';
import { validateTagName, validateVisibility } from '../utils/validators.js';
import { normalize, paginate, withFavorite, generateTagId } from '../utils/helpers.js';
import { CONFIG } from '../config/constants.js';

/**
 * 获取公开标签列表
 */
export function getPublicTags(query, sort, page, pageSize, userId) {
  const visible = dataAPI.getTags().filter((tag) => tag.visibility === 'public');

  // 搜索过滤
  const filtered = query
    ? visible.filter((tag) => {
        const nameMatch = normalize(tag.name).includes(query);
        const aliasMatch = (tag.aliases || []).some((alias) =>
          normalize(alias).includes(query)
        );
        const descMatch = normalize(tag.description).includes(query);
        return nameMatch || aliasMatch || descMatch;
      })
    : visible;

  // 排序
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'latest') return b.createdAt - a.createdAt;
    if (sort === 'favorites') return b.favoriteCount - a.favoriteCount;
    return b.useCount - a.useCount;
  });

  // 分页
  const result = paginate(sorted, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);

  // 添加收藏状态
  const items = userId
    ? result.items.map((tag) => {
        const favorites = dataAPI.getFavorites(userId);
        return withFavorite(tag, userId, favorites);
      })
    : result.items;

  return {
    ok: true,
    items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

/**
 * 获取我的标签
 */
export function getMyTags(userId, page, pageSize) {
  const mine = dataAPI.getTags().filter((tag) => tag.creatorId === userId);
  const result = paginate(mine, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);
  const favorites = dataAPI.getFavorites(userId);

  return {
    ok: true,
    items: result.items.map((tag) => withFavorite(tag, userId, favorites)),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

/**
 * 获取我的收藏标签
 */
export function getMyFavorites(userId, page, pageSize) {
  const favoriteIds = dataAPI.getFavorites(userId);
  const items = dataAPI.getTags().filter((tag) => favoriteIds.includes(tag.id));
  const result = paginate(items, page, pageSize, CONFIG.PAGINATION.MAX_PAGE_SIZE);
  const favorites = dataAPI.getFavorites(userId);

  return {
    ok: true,
    items: result.items.map((tag) => withFavorite(tag, userId, favorites)),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  };
}

/**
 * 创建标签
 */
export function createTag(userId, tagData) {
  const nameValidation = validateTagName(tagData.name);
  if (!nameValidation.valid) {
    return { success: false, status: 400, message: 'Invalid request.' };
  }

  const normalizedName = normalize(nameValidation.value);

  // 检查是否已存在
  const exists = dataAPI.findTag(
    (tag) => normalize(tag.name) === normalizedName
  );

  if (exists) {
    return { success: false, status: 409, message: 'Conflict.' };
  }

  const now = Date.now();
  const newTag = {
    id: generateTagId(),
    name: nameValidation.value,
    aliases: Array.isArray(tagData.aliases)
      ? tagData.aliases.filter(Boolean)
      : [],
    description: String(tagData.description || '').trim(),
    creatorId: userId,
    visibility: tagData.visibility === 'private' ? 'private' : 'public',
    createdAt: now,
    updatedAt: now,
    favoriteCount: 0,
    useCount: 0
  };

  dataAPI.addTag(newTag);

  const favorites = dataAPI.getFavorites(userId);
  const tagWithFavorite = withFavorite(newTag, userId, favorites);

  return { success: true, item: tagWithFavorite };
}

/**
 * 更新标签
 */
export function updateTag(tagId, userId, updates) {
  const tag = dataAPI.findTag((item) => item.id === tagId);

  if (!tag) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  if (tag.creatorId !== userId) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  if (updates.visibility) {
    const visibilityValidation = validateVisibility(updates.visibility);
    if (!visibilityValidation.valid) {
      return { success: false, status: 400, message: 'Invalid visibility.' };
    }
    tag.visibility = visibilityValidation.value;
  }

  tag.updatedAt = Date.now();
  dataAPI.updateTag((item) => item.id === tagId, { updatedAt: tag.updatedAt, visibility: tag.visibility });

  const favorites = dataAPI.getFavorites(userId);
  const tagWithFavorite = withFavorite(tag, userId, favorites);

  return { success: true, item: tagWithFavorite };
}

/**
 * 切换标签收藏状态
 */
export function toggleTagFavorite(tagId, userId) {
  const tag = dataAPI.findTag((item) => item.id === tagId);

  if (!tag) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  const { isFavorite, favorites } = dataAPI.toggleFavorite(userId, tagId);

  // 更新收藏计数
  tag.favoriteCount = isFavorite
    ? tag.favoriteCount + 1
    : Math.max(0, tag.favoriteCount - 1);

  dataAPI.saveState();

  const tagWithFavorite = withFavorite(tag, userId, favorites);

  return { success: true, item: tagWithFavorite, isFavorite };
}
