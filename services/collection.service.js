/**
 * 收藏夹服务
 * 处理收藏夹的业务逻辑
 */

import dataAPI from '../data/index.js';
import { generateNewCollectionId } from '../utils/collectionIdGenerator.js';

/**
 * 获取用户的所有收藏夹
 */
export function getUserCollections(userId) {
  const userCollections = dataAPI.filterCollections((c) => c.userId === userId);
  return { ok: true, items: userCollections, collections: userCollections };
}

/**
 * 获取所有公开收藏夹
 */
export function getPublicCollections() {
  const publicCollections = dataAPI.filterCollections((c) => c.visibility === 'public');

  // 为每个收藏夹附加创建者用户名
  const collectionsWithCreator = publicCollections.map((collection) => {
    const creator = dataAPI.findUser((u) => u.id === collection.userId);
    return {
      ...collection,
      creatorUsername: creator?.username || '未知用户'
    };
  });

  return { ok: true, items: collectionsWithCreator, collections: collectionsWithCreator };
}

/**
 * 获取指定收藏夹详情
 */
export function getCollectionById(collectionId, userId) {
  const collection = dataAPI.findCollection((c) => c.id === collectionId);

  if (!collection) {
    return { ok: false, status: 404, message: '收藏夹不存在' };
  }

  // 如果是私有收藏夹,验证访问权限
  if (collection.visibility === 'private') {
    if (collection.userId !== userId) {
      return { ok: false, status: 403, message: '无权访问此收藏夹' };
    }
  }

  const canViewPrivateCards = collection.userId === userId;
  const cards = dataAPI.getCards().filter((card) => {
    if (!collection.cardIds.includes(card.id)) {
      return false;
    }

    return canViewPrivateCards || card.visibility === 'public';
  });

  // 获取创建者信息
  const creator = dataAPI.findUser((u) => u.id === collection.userId);

  return {
    ok: true,
    item: {
      ...collection,
      creatorUsername: creator?.username || '未知用户',
      cards
    },
    collection: {
      ...collection,
      creatorUsername: creator?.username || '未知用户',
      cards
    }
  };
}

/**
 * 创建新收藏夹
 */
export function createCollection(userId, collectionData) {
  const { name, description, visibility, cardIds } = collectionData;

  if (!name || !name.trim()) {
    return { ok: false, status: 400, message: '缺少必要参数:name' };
  }

  // 验证用户存在
  const user = dataAPI.findUser((u) => u.id === userId);
  if (!user) {
    return { ok: false, status: 400, message: '用户不存在' };
  }

  const now = Date.now();
  const newCollection = {
    id: generateNewCollectionId(),
    userId,
    name: name.trim(),
    description: description?.trim() || '',
    visibility: visibility || 'private',
    cardIds: cardIds || [],
    isDefault: false,
    createdAt: now,
    updatedAt: now
  };

  dataAPI.addCollection(newCollection);

  return { ok: true, item: newCollection, collection: newCollection };
}

/**
 * 更新收藏夹
 */
export function updateCollection(collectionId, userId, updates) {
  const collection = dataAPI.findCollection((c) => c.id === collectionId);

  if (!collection) {
    return { ok: false, status: 404, message: '收藏夹不存在' };
  }

  // 验证权限:只有创建者可以修改
  if (collection.userId !== userId) {
    return { ok: false, status: 403, message: '无权修改此收藏夹' };
  }

  // 默认收藏夹的限制
  if (collection.isDefault) {
    // 默认收藏夹不能改名称和可见性
    if (updates.name !== undefined && updates.name.trim() !== '默认收藏夹') {
      return { ok: false, status: 400, message: '默认收藏夹不能修改名称' };
    }
    if (updates.visibility !== undefined && updates.visibility !== 'private') {
      return { ok: false, status: 400, message: '默认收藏夹只能为私有' };
    }
  }

  // 更新字段
  if (updates.name !== undefined && !collection.isDefault) {
    collection.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    collection.description = updates.description.trim();
  }
  if (updates.visibility !== undefined && !collection.isDefault) {
    collection.visibility = updates.visibility;
  }
  if (updates.cardIds !== undefined) {
    collection.cardIds = updates.cardIds;
  }
  collection.updatedAt = Date.now();

  dataAPI.updateCollection((c) => c.id === collectionId, collection);

  return { ok: true, item: collection, collection };
}

/**
 * 删除收藏夹
 */
export function deleteCollection(collectionId, userId) {
  const collection = dataAPI.findCollection((c) => c.id === collectionId);

  if (!collection) {
    return { ok: false, status: 404, message: '收藏夹不存在' };
  }

  // 验证权限:只有创建者可以删除
  if (collection.userId !== userId) {
    return { ok: false, status: 403, message: '无权删除此收藏夹' };
  }

  // 默认收藏夹不能删除
  if (collection.isDefault) {
    return { ok: false, status: 400, message: '默认收藏夹不能删除' };
  }

  dataAPI.deleteCollection((c) => c.id === collectionId);

  return { ok: true, message: '收藏夹已删除' };
}
