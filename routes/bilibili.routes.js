/**
 * B站API相关路由
 */

import express from 'express';
import * as bilibiliService from '../services/bilibili.service.js';

const router = express.Router();

// 获取B站视频封面
router.get('/cover', async (req, res) => {
  const bvid = String(req.query?.bvid || '').trim();
  const result = await bilibiliService.getBilibiliCover(bvid);

  if (!result.ok) {
    return res.status(500).json(result);
  }

  res.json(result);
});

export default router;
