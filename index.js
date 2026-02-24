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

// 中间件配置
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 注册路由
registerRoutes(app);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
app.listen(CONFIG.PORT, () => {
  console.log(`[community-server] listening on http://localhost:${CONFIG.PORT}`);
});
