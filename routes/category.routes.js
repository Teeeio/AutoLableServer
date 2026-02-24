/**
 * 分类相关路由
 */

import express from 'express';
import * as categoryService from '../services/category.service.js';

const router = express.Router();

// 获取所有分类列表
router.get('/', (_req, res) => {
  const result = categoryService.getCategories();
  res.json(result);
});

// 获取指定分类下的卡片
router.get('/:id/cards', (req, res) => {
  const categoryId = req.params.id;
  const options = {
    sort: req.query.sort || 'latest',
    query: req.query.query || ''
  };

  const result = categoryService.getCategoryCards(categoryId, options);
  res.json(result);
});

export default router;
