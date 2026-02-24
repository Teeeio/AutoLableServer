# 随舞社区 API 服务器

独立的 Express.js REST API 服务器，为随舞生成器提供社区功能。

## 📋 功能特性

- ✅ 用户认证 (注册/登录/Session管理)
- ✅ 卡片管理 (创建/更新/删除/查询)
- ✅ 标签系统 (创建/搜索/收藏)
- ✅ 收藏夹功能
- ✅ B站API代理
- ✅ 数据持久化 (JSON文件存储)

## 🚀 快速开始

### 1. 安装依赖

```bash
cd apps/server
npm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
nano .env
```

### 3. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器将运行在 `http://localhost:8787`

## 📁 目录结构

```
server/
├── config/
│   └── constants.js          # 配置常量
├── data/                     # 数据访问层
│   ├── index.js             # 数据层入口
│   ├── storage.js           # 文件存储
│   └── session.js           # Session管理
├── services/                 # 业务逻辑层
│   ├── auth.service.js      # 认证服务
│   ├── tag.service.js       # 标签服务
│   ├── card.service.js      # 卡片服务
│   ├── collection.service.js # 收藏夹服务
│   └── bilibili.service.js  # B站API服务
├── routes/                   # 路由层
│   ├── index.js             # 路由注册
│   ├── auth.routes.js       # 认证路由
│   ├── tag.routes.js        # 标签路由
│   ├── card.routes.js       # 卡片路由
│   ├── collection.routes.js # 收藏夹路由
│   └── bilibili.routes.js   # B站API路由
├── middleware/               # 中间件
│   └── error.middleware.js  # 错误处理
├── utils/                    # 工具函数
│   ├── helpers.js           # 辅助函数
│   ├── validators.js        # 验证函数
│   ├── idGenerator.js       # ID生成器
│   └── collectionIdGenerator.js
├── index.js                  # 服务器入口
├── package.json              # 依赖配置
└── .env.example              # 环境变量示例
```

## 🔌 API 端点

### 健康检查
```
GET /api/health
```

### 认证
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/session
```

### 标签
```
GET    /api/tags
GET    /api/my/tags
GET    /api/my/favorites
POST   /api/tags
PATCH  /api/tags/:id
POST   /api/favorites/:id
```

### 卡片
```
GET    /api/cards
GET    /api/cards/public
POST   /api/cards
PATCH  /api/cards/:id
DELETE /api/cards/:id
POST   /api/card-favorites/:cardId
GET    /api/my/card-favorites
```

### 收藏夹
```
GET    /api/collections
GET    /api/collections/public
GET    /api/collections/:id
POST   /api/collections
PATCH  /api/collections/:id
DELETE /api/collections/:id
```

### B站API
```
GET /api/bili/cover?bvid=xxx
```

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务器端口 | `8787` |
| `SESSION_TTL_MS` | Session过期时间(毫秒) | `604800000` (7天) |
| `CORS_ORIGIN` | CORS允许的源 | `*` |
| `LOG_LEVEL` | 日志级别 | `info` |

## 💾 数据存储

数据以 JSON 格式存储在本地文件系统：

- `data.json` - 用户、标签、卡片数据
- `sessions.json` - Session数据

**注意**: 生产环境建议使用数据库 (如 MongoDB、PostgreSQL)

## 🌦 生产部署

### 方式1: 直接使用 Node.js

```bash
# 1. 克隆代码
git clone <repository>
cd apps/server

# 2. 安装依赖
npm install --production

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 启动
npm start
```

### 方式2: 使用 PM2 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动服务器
pm2 start index.js --name community-server

# 查看状态
pm2 status

# 查看日志
pm2 logs community-server

# 设置开机自启
pm2 startup
pm2 save
```

### 方式3: Docker

```bash
# 构建镜像
docker build -t community-server .

# 运行容器
docker run -d \
  -p 8787:8787 \
  -v $(pwd)/data:/app/data \
  --name community-server \
  community-server
```

### 方式4: Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔒 安全建议

1. **使用 HTTPS**
   - 配置 SSL 证书 (Let's Encrypt)
   - 强制 HTTPS 重定向

2. **限制 CORS**
   ```bash
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **设置速率限制**
   - 使用 `express-rate-limit`
   - 防止 DDoS 攻击

4. **使用数据库**
   - 替换 JSON 文件存储
   - 使用 MongoDB/PostgreSQL

5. **备份策略**
   - 定期备份数据文件
   - 使用云存储 (S3/OSS)

## 🧪 测试

```bash
# 健康检查
curl http://localhost:8787/api/health

# 用户注册
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 用户登录
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

## 📊 性能优化

1. **启用 Gzip 压缩**
2. **使用 Redis 缓存 Session**
3. **数据库索引优化**
4. **CDN 加速静态资源**

## 🐛 常见问题

### Q: 端口被占用
```bash
# 查找占用端口的进程
lsof -i :8787

# 或修改端口
PORT=3000 npm start
```

### Q: 数据文件损坏
```bash
# 删除数据文件重新开始
rm data.json sessions.json
npm start
```

### Q: CORS 错误
检查 `.env` 中的 `CORS_ORIGIN` 配置

## 📝 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!
