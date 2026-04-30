/**
 * 卡片相关路由
 * 注意：用户卡片仅供个人管理使用，发布到社区请使用 /api/published 端点
 */

import express from 'express';
import * as authService from '../services/auth.service.js';
import * as cardService from '../services/card.service.js';

const router = express.Router();

// 获取公开社区卡片
router.get('/public', (req, res) => {
  const user = authService.getUserFromRequest(req);
  const { page, pageSize } = req.query;
  const query = req.query.query ? String(req.query.query).trim() : '';
  const sort = req.query.sort ? String(req.query.sort).trim() : 'latest';
  const result = cardService.getPublicCards(query, sort, page, pageSize, user?.id || null);
  res.json(result);
});

// 获取我的卡片
router.get('/', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const { page, pageSize } = req.query;
  const result = cardService.getMyCards(user.id, page, pageSize);
  res.json(result);
});

// 创建卡片
router.post('/', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = cardService.createCard(user.id, req.body);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

// 更新卡片
router.patch('/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = cardService.updateCard(req.params.id, user.id, req.body);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

// 删除卡片
router.delete('/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = cardService.deleteCard(req.params.id, user.id);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true });
});

// 发布卡片到社区
router.post('/:id/publish', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = cardService.publishCard(req.params.id, user.id, req.body);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

// 下架卡片
router.post('/:id/unpublish', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = cardService.unpublishCard(req.params.id, user.id);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, item: result.item });
});

// 点赞/取消点赞卡片
router.post('/:id/like', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = cardService.toggleCardLike(req.params.id, user.id);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, isLiked: result.isLiked, likeCount: result.likeCount });
});

export default router;
