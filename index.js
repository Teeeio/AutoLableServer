/**
 * Community Server 主入口
 * 随舞社区API服务器
 */

import cors from 'cors';
import express from 'express';
import { CONFIG } from './config/constants.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

function createCorsOptions() {
  if (CONFIG.CORS_ORIGIN === '*') {
    return {
      origin: true,
      credentials: false
    };
  }

  const allowedOrigins = CONFIG.CORS_ORIGIN
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed.'));
    },
    credentials: true
  };
}

app.disable('x-powered-by');

// 中间件配置
app.use(cors(createCorsOptions()));
app.use(express.json({ limit: '1mb' }));

// 注册路由
registerRoutes(app);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
app.listen(CONFIG.PORT, () => {
  console.log(`[community-server] listening on http://localhost:${CONFIG.PORT}`);
});
