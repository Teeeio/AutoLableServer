/**
 * 标签相关路由
 */

import express from 'express';
import * as authService from '../services/auth.service.js';
import * as tagService from '../services/tag.service.js';
import { normalize } from '../utils/helpers.js';

const router = express.Router();

// 获取公开标签列表
router.get('/', (req, res) => {
  const query = normalize(req.query.query);
  const sort = String(req.query.sort || 'trending');
  const page = req.query.page;
  const pageSize = req.query.pageSize;
  const user = authService.getUserFromRequest(req);

  const result = tagService.getPublicTags(query, sort, page, pageSize, user?.id);
  res.json(result);
});

// 获取我的标签
router.get('/my', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const { page, pageSize } = req.query;
  const result = tagService.getMyTags(user.id, page, pageSize);
  res.json(result);
});

// 获取我的收藏标签
router.get('/my/favorites', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const { page, pageSize } = req.query;
  const result = tagService.getMyFavorites(user.id, page, pageSize);
  res.json(result);
});

// 创建标签
router.post('/', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = tagService.createTag(user.id, req.body);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

// 更新标签
router.patch('/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = tagService.updateTag(req.params.id, user.id, req.body);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

// 切换标签收藏状态
router.post('/favorites/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = tagService.toggleTagFavorite(req.params.id, user.id);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item, isFavorite: result.isFavorite });
});

export default router;
