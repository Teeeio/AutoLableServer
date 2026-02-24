/**
 * 验证工具函数
 */

import { CONFIG } from '../config/constants.js';

/**
 * 验证用户名
 */
export function validateUsername(username) {
  const trimmed = String(username || '').trim();
  if (!trimmed) {
    return { valid: false, message: '用户名不能为空' };
  }
  return { valid: true, value: trimmed };
}

/**
 * 验证密码
 */
export function validatePassword(password) {
  const trimmed = String(password || '');
  if (!trimmed) {
    return { valid: false, message: '密码不能为空' };
  }
  if (trimmed.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `密码长度至少为 ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} 位`
    };
  }
  return { valid: true, value: trimmed };
}

/**
 * 验证标签名称
 */
export function validateTagName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return { valid: false, message: '标签名不能为空' };
  }
  return { valid: true, value: trimmed };
}

/**
 * 验证卡片标题
 */
export function validateCardTitle(title) {
  const trimmed = String(title || '').trim();
  if (!trimmed) {
    return { valid: false, message: '标题不能为空' };
  }
  return { valid: true, value: trimmed };
}

/**
 * 验证BVID
 */
export function validateBvid(bvid) {
  const trimmed = String(bvid || '').trim();
  if (!trimmed) {
    return { valid: false, message: 'B站视频ID不能为空' };
  }
  return { valid: true, value: trimmed };
}

/**
 * 验证可见性
 */
export function validateVisibility(visibility) {
  if (visibility === 'private' || visibility === 'public') {
    return { valid: true, value: visibility };
  }
  return { valid: false, message: '可见性只能是 public 或 private' };
}

/**
 * 验证卡片来源
 */
export function validateCardSource(source) {
  const validSources = ['bilibili', 'local'];
  if (validSources.includes(source)) {
    return { valid: true, value: source };
  }
  return { valid: false, message: '来源只能是 bilibili 或 local' };
}
