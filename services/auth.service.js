/**
 * 认证服务
 * 处理用户认证、会话管理和密码加密
 */

import crypto from 'crypto';
import dataAPI from '../data/index.js';
import { validateUsername, validatePassword } from '../utils/validators.js';
import { generateUserId } from '../utils/helpers.js';
import { CONFIG } from '../config/constants.js';
import { generateNewCollectionId } from '../utils/collectionIdGenerator.js';

/**
 * 密码哈希
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * 确保用户有密码哈希
 */
function ensureUserPassword(user, password) {
  if (!user.passwordHash || !user.salt) {
    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = hashPassword(password, salt);
    dataAPI.saveState();
  }
}

/**
 * 验证密码
 */
function verifyPassword(user, password) {
  if (!user.passwordHash || !user.salt) return false;
  const hashed = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(user.passwordHash));
}

/**
 * 获取请求用户
 */
export function getUserFromRequest(req) {
  const auth = req.header('authorization') || '';
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);
  const token = tokenMatch ? tokenMatch[1] : '';
  const session = token ? dataAPI.getSession(token) : null;
  const sessionUserId = session?.userId;
  const userId = sessionUserId || req.header('x-user-id');

  if (!userId) return null;
  return dataAPI.findUser((user) => user.id === userId) || null;
}

/**
 * 获取用户(带认证检查)
 */
export function ensureUser(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ ok: false, message: 'Not logged in.' });
    return null;
  }
  return user;
}

/**
 * 检查session状态
 */
export function checkSession(req) {
  dataAPI.cleanupSessions();
  return getUserFromRequest(req);
}

/**
 * 用户登录
 */
export function login(username, password) {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, status: 400, message: 'Invalid request.' };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, status: 400, message: 'Invalid request.' };
  }

  const user = dataAPI.findUser(
    (item) => item.username.toLowerCase() === usernameValidation.value.toLowerCase()
  );

  if (!user) {
    return { success: false, status: 404, message: 'Not found.' };
  }

  if (!user.passwordHash || !user.salt) {
    ensureUserPassword(user, passwordValidation.value);
  } else if (!verifyPassword(user, passwordValidation.value)) {
    return { success: false, status: 403, message: 'Forbidden.' };
  }

  const { token } = dataAPI.createSession(user.id);

  return { success: true, user, token };
}

/**
 * 用户注册
 */
export function register(username, password) {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, status: 400, message: 'Invalid request.' };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, status: 400, message: 'Invalid request.' };
  }

  const exists = dataAPI.findUser(
    (item) => item.username.toLowerCase() === usernameValidation.value.toLowerCase()
  );

  if (exists) {
    return { success: false, status: 409, message: 'Conflict.' };
  }

  const user = {
    id: generateUserId(),
    username: usernameValidation.value,
    createdAt: Date.now()
  };

  dataAPI.addUser(user);
  ensureUserPassword(user, passwordValidation.value);

  // 自动创建默认收藏夹
  const defaultCollection = {
    id: generateNewCollectionId(),
    userId: user.id,
    name: '默认收藏夹',
    description: '我的默认收藏夹',
    visibility: 'private',
    cardIds: [],
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  dataAPI.addCollection(defaultCollection);

  return { success: true, user };
}

/**
 * 用户登出
 */
export function logout(authHeader) {
  const auth = authHeader || '';
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);
  const token = tokenMatch ? tokenMatch[1] : '';

  if (token) {
    dataAPI.deleteSession(token);
  }

  return { success: true };
}
