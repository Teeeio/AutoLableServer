/**
 * 发布卡片路由
 * 管理社区发布卡片的独立API
 */

import express from 'express';
import * as authService from '../services/auth.service.js';
import * as publishService from '../services/publish.service.js';

const router = express.Router();

/**
 * POST /api/published/publish
 * 发布卡片到社区
 */
router.post('/publish', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = publishService.publishCardToCommunity(user.id, req.body);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

/**
 * GET /api/published/my
 * 获取我发布的卡片列表
 */
router.get('/my', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  const result = publishService.getMyPublishedCards(user.id, page, pageSize);
  res.json(result);
});

/**
 * DELETE /api/published/:id
 * 下架发布的卡片
 */
router.delete('/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = publishService.unpublishFromCommunity(req.params.id, user.id);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true });
});

/**
 * GET /api/published
 * 获取社区卡片列表（公开）
 */
router.get('/', (req, res) => {
  const query = req.query.q ? String(req.query.q).trim() : '';
  const categoryId = req.query.categoryId ? String(req.query.categoryId).trim() : '';
  const sort = req.query.sort || 'newest';
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  const result = publishService.getCommunityCards(query, categoryId, sort, page, pageSize);
  res.json(result);
});

/**
 * GET /api/published/:id
 * 获取单张社区卡片详情
 */
router.get('/:id', (req, res) => {
  const result = publishService.getCommunityCardById(req.params.id);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

export default router;
