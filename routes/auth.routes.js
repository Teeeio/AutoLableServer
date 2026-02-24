/**
 * 认证相关路由
 */

import express from 'express';
import * as authService from '../services/auth.service.js';

const router = express.Router();

// 获取当前session状态
router.get('/session', (req, res) => {
  const user = authService.checkSession(req);
  res.json({ ok: true, user });
});

// 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const result = authService.login(username, password);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, user: result.user, token: result.token });
});

// 用户注册
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const result = authService.register(username, password);

  if (!result.success) {
    return res.status(result.status).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, user: result.user });
});

// 用户登出
router.post('/logout', (req, res) => {
  authService.logout(req.header('authorization'));
  res.json({ ok: true });
});

export default router;
