/**
 * Session管理
 */

import fs from 'fs';
import crypto from 'crypto';
import { CONFIG } from '../config/constants.js';

/**
 * 加载sessions
 */
export function loadSessions(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    fs.writeFileSync(sessionPath, JSON.stringify({}, null, 2), 'utf8');
    return new Map();
  }

  try {
    const raw = fs.readFileSync(sessionPath, 'utf8');
    const parsed = JSON.parse(raw);
    return new Map(Object.entries(parsed || {}));
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return new Map();
  }
}

/**
 * 保存sessions
 */
export function saveSessions(sessions, sessionPath) {
  try {
    fs.writeFileSync(
      sessionPath,
      JSON.stringify(Object.fromEntries(sessions), null, 2),
      'utf8'
    );
    return true;
  } catch (error) {
    console.error('Failed to save sessions:', error);
    return false;
  }
}

/**
 * 清理过期sessions
 */
export function cleanupSessions(sessions, sessionPath) {
  const now = Date.now();
  let changed = false;

  sessions.forEach((session, token) => {
    if (!session || (session.expiresAt && session.expiresAt <= now)) {
      sessions.delete(token);
      changed = true;
    }
  });

  if (changed) {
    saveSessions(sessions, sessionPath);
  }

  return sessions;
}

/**
 * 创建session
 */
export function createSession(sessions, userId, sessionPath) {
  const token = crypto.randomBytes(24).toString('hex');
  const session = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + CONFIG.SESSION_TTL_MS
  };

  sessions.set(token, session);
  saveSessions(sessions, sessionPath);

  return { token, session };
}

/**
 * 删除session
 */
export function deleteSession(sessions, token, sessionPath) {
  if (token && sessions.has(token)) {
    sessions.delete(token);
    saveSessions(sessions, sessionPath);
    return true;
  }
  return false;
}

/**
 * 获取session
 */
export function getSession(sessions, token) {
  return sessions.get(token) || null;
}
