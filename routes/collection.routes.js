/**
 * 收藏夹相关路由
 */

import express from 'express';
import * as authService from '../services/auth.service.js';
import * as collectionService from '../services/collection.service.js';

const router = express.Router();

// 获取用户的所有收藏夹
router.get('/', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const requestedUserId = req.query.userId ? String(req.query.userId) : '';
  if (requestedUserId && requestedUserId !== user.id) {
    return res.status(403).json({ ok: false, message: '无权访问其他用户的收藏夹' });
  }

  const result = collectionService.getUserCollections(user.id);
  res.json(result);
});

// 获取所有公开收藏夹
router.get('/public', (req, res) => {
  const result = collectionService.getPublicCollections();
  res.json(result);
});

// 获取指定收藏夹详情
router.get('/:id', (req, res) => {
  const user = authService.getUserFromRequest(req);
  const result = collectionService.getCollectionById(req.params.id, user?.id || null);

  if (!result.ok) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json(result);
});

// 创建新收藏夹
router.post('/', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = collectionService.createCollection(user.id, req.body);

  if (!result.ok) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json(result);
});

// 更新收藏夹
router.patch('/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = collectionService.updateCollection(req.params.id, user.id, req.body);

  if (!result.ok) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json(result);
});

// 删除收藏夹
router.delete('/:id', (req, res) => {
  const user = authService.ensureUser(req, res);
  if (!user) return;

  const result = collectionService.deleteCollection(req.params.id, user.id);

  if (!result.ok) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json(result);
});

export default router;
