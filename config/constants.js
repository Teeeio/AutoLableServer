/**
 * 服务器配置常量
 */

import crypto from 'crypto';
import './env.js';

function readNumber(...values) {
  for (const value of values) {
    const nextValue = Number(value);
    if (Number.isFinite(nextValue) && nextValue > 0) {
      return nextValue;
    }
  }

  return 0;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

function createDemoUser() {
  const salt = 'local-demo-salt';

  return {
    id: 'u-1',
    username: 'demo',
    createdAt: Date.now(),
    salt,
    passwordHash: crypto.scryptSync('demo', salt, 64).toString('hex')
  };
}

const SEED_USERS = IS_PRODUCTION ? [] : [createDemoUser()];
const SEED_TAGS = IS_PRODUCTION ? [] : [
  {
    id: 't-1',
    name: 'random-dance',
    aliases: ['rdg'],
    description: 'Random dance challenge tags.',
    creatorId: 'u-1',
    visibility: 'public',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    favoriteCount: 3,
    useCount: 42
  },
  {
    id: 't-2',
    name: 'love-live',
    aliases: ['ll'],
    description: 'LoveLive related tags.',
    creatorId: 'u-1',
    visibility: 'public',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 7200000,
    favoriteCount: 2,
    useCount: 30
  }
];

export const CONFIG = {
  NODE_ENV,

  // 服务器端口
  PORT: readNumber(process.env.PORT, process.env.COMMUNITY_PORT, 8787) || 8787,

  // Session配置
  SESSION_TTL_MS:
    readNumber(
      process.env.SESSION_TTL_MS,
      process.env.COMMUNITY_SESSION_TTL_MS,
      7 * 24 * 60 * 60 * 1000
    ) || 7 * 24 * 60 * 60 * 1000,

  // CORS配置
  CORS_ORIGIN: String(process.env.CORS_ORIGIN || '*').trim() || '*',

  // 文件路径
  DATA_PATH: null, // 将在运行时设置
  SESSION_PATH: null, // 将在运行时设置

  // B站API配置
  BILIBILI: {
    BASE_URL: 'https://api.bilibili.com',
    REFERER: 'https://www.bilibili.com/',
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },

  // 用户名和密码验证规则
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 4,
    MIN_USERNAME_LENGTH: 1
  },

  // ID前缀
  ID_PREFIX: {
    USER: 'u',
    TAG: 't',
    CARD: 'CV',
    COLLECTION: 'COL'
  }
};

/**
 * 种子数据
 */
export const SEED_DATA = {
  users: SEED_USERS,
  tags: SEED_TAGS,
  favorites: IS_PRODUCTION ? {} : { 'u-1': ['t-1', 't-2'] },
  cards: [],
  cardIdCounter: 0,
  collections: []
};
