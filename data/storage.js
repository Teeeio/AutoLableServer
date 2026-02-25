/**
 * 文件存储操作
 * 负责数据的读取、写入和初始化
 */

import fs from 'fs';
import path from 'path';
import { CONFIG, SEED_DATA } from '../config/constants.js';

/**
 * 加载数据文件
 */
export function loadData(dataPath) {
  if (!fs.existsSync(dataPath)) {
    // 如果文件不存在,创建种子数据
    fs.writeFileSync(dataPath, JSON.stringify(SEED_DATA, null, 2), 'utf8');
    return {
      users: [...SEED_DATA.users],
      tags: [...SEED_DATA.tags],
      favorites: { ...SEED_DATA.favorites },
      cards: [...SEED_DATA.cards],
      cardIdCounter: SEED_DATA.cardIdCounter,
      collections: SEED_DATA.collections.map(col => ({
        ...col,
        isDefault: col.isDefault || false
      }))
    };
  }

  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      tags: parsed.tags || [],
      favorites: parsed.favorites || {},
      cards: parsed.cards || [],
      cardIdCounter: parsed.cardIdCounter || 0,
      collections: (parsed.collections || []).map(col => ({
        ...col,
        isDefault: col.isDefault || false
      })),
      cardFavorites: parsed.cardFavorites || {},
      cardLikes: parsed.cardLikes || {},
      // 发布卡片（独立于用户卡片）
      publishedCards: parsed.publishedCards || [],
      publishedCardIdCounter: parsed.publishedCardIdCounter || 0
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    return {
      users: [...SEED_DATA.users],
      tags: [...SEED_DATA.tags],
      favorites: { ...SEED_DATA.favorites },
      cards: [...SEED_DATA.cards],
      cardIdCounter: SEED_DATA.cardIdCounter,
      collections: SEED_DATA.collections.map(col => ({
        ...col,
        isDefault: col.isDefault || false
      })),
      cardFavorites: {},
      cardLikes: {},
      publishedCards: [],
      publishedCardIdCounter: 0
    };
  }
}

/**
 * 保存数据文件
 */
export function saveData(data, dataPath) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

/**
 * 初始化数据存储
 */
export function initDataStorage(baseDir) {
  const dataPath = path.join(baseDir, 'data.json');
  const sessionPath = path.join(baseDir, 'sessions.json');

  // 更新配置中的路径
  CONFIG.DATA_PATH = dataPath;
  CONFIG.SESSION_PATH = sessionPath;

  return { dataPath, sessionPath };
}
