/**
 * 路由注册器
 * 集中管理所有路由
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import tagRoutes from './tag.routes.js';
import cardRoutes from './card.routes.js';
import categoryRoutes from './category.routes.js';
import collectionRoutes from './collection.routes.js';
import bilibiliRoutes from './bilibili.routes.js';
import publishRoutes from './publish.routes.js';
import * as authService from '../services/auth.service.js';
import * as cardService from '../services/card.service.js';

export function registerRoutes(app) {
  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // 认证路由
  app.use('/api/auth', authRoutes);

  // 标签路由
  app.use('/api/tags', tagRoutes);

  // 卡片路由（用户个人卡片）
  app.use('/api/cards', cardRoutes);

  // 分类路由
  app.use('/api/categories', categoryRoutes);

  // 收藏夹路由
  app.use('/api/collections', collectionRoutes);

  // B站API路由
  app.use('/api/bili', bilibiliRoutes);

  // 发布卡片路由（社区公开卡片）
  app.use('/api/published', publishRoutes);

  // 我的路由（需要认证）
  app.get('/api/my/liked-cards', (req, res) => {
    const user = authService.ensureUser(req, res);
    if (!user) return;

    const result = cardService.getLikedCards(user.id);
    res.json(result);
  });

  app.get('/api/my/card-favorites', (req, res) => {
    const user = authService.ensureUser(req, res);
    if (!user) return;

    const result = cardService.getFavoriteCards(user.id);
    res.json(result);
  });

  app.post('/api/card-favorites/:cardId', (req, res) => {
    const user = authService.ensureUser(req, res);
    if (!user) return;

    const result = cardService.toggleCardFavorite(req.params.cardId, user.id);

    if (!result.success) {
      return res.status(result.status).json({ ok: false, message: result.message });
    }

    res.json({
      ok: true,
      isFavorite: result.isFavorite,
      favoriteCount: result.favoriteCount
    });
  });
}
