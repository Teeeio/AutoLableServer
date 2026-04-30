# AutoLableServer 部署审查报告

> 该文档记录的是修复前的审查结果，当前仓库代码已在此基础上继续整改，请结合最新实现一起判断。

审查时间：2026-03-13

审查对象：`F:\设计\快速项目\AutoLableServer`

## 结论

当前版本不建议直接部署到生产环境。

主要原因不是单点缺陷，而是同时存在：

- 认证绕过
- 私有数据泄露
- 实际路由与文档/测试脚本不一致
- 生产配置项与代码读取逻辑不一致
- 社区公开数据模型与分类浏览逻辑割裂

综合判断：服务可以本地调试，但尚未达到“可直接部署”的标准。

## 本次验证

已完成：

- 读取入口、配置、路由、服务层和数据持久化逻辑
- 本地启动服务 `node index.js`
- 运行最小接口复现

运行态已确认：

1. 未登录仅携带 `x-user-id: u-1` 即可访问 `GET /api/auth/session`
2. `GET /api/auth/session` 会返回完整用户对象，其中包含 `salt` 和 `passwordHash`
3. 未登录可直接通过 `GET /api/collections?userId=...` 枚举私有收藏夹
4. 未登录可直接通过 `GET /api/collections/:id?userId=...` 读取私有收藏夹详情
5. 文档和测试脚本中的 `GET /api/cards/public` 实际返回 `404`

## 关键问题

### 1. 阻断级：认证可被 `x-user-id` 伪造绕过

`getUserFromRequest()` 在没有有效 Bearer token 时，会直接信任请求头中的 `x-user-id`，然后把对应用户视为已登录用户。

证据：

- `services/auth.service.js:44-53`
- `services/auth.service.js:59-65`

影响：

- 所有依赖 `ensureUser()` 的受保护接口都可能被伪造身份访问
- 这不仅是读取问题，也意味着写操作接口同样可被冒用

部署判断：

- 这是直接阻断上线的问题

### 2. 阻断级：会话接口直接泄露密码派生信息

`/api/auth/session` 直接返回 `authService.checkSession(req)` 的结果，而该结果是完整用户对象，没有做字段裁剪。

证据：

- `routes/auth.routes.js:11-13`
- `services/auth.service.js:71-73`

运行态复现：

- 未登录携带 `x-user-id: u-1` 访问 `/api/auth/session`
- 服务返回了 `salt` 与 `passwordHash`

影响：

- 攻击者可同时完成身份伪造与密码哈希枚举
- 这会显著放大认证绕过造成的安全后果

部署判断：

- 这是直接阻断上线的问题

### 3. 阻断级：私有收藏夹可被未授权读取

收藏夹读取接口没有真正基于登录态做鉴权，而是信任 URL 查询参数中的 `userId`。

证据：

- `routes/collection.routes.js:12-20`
- `routes/collection.routes.js:30-38`
- `services/collection.service.js:12-15`
- `services/collection.service.js:38-49`

运行态复现：

1. 注册新用户后系统自动创建默认私有收藏夹
2. 未登录直接请求 `GET /api/collections?userId=<该用户ID>`，可枚举其私有收藏夹
3. 未登录直接请求 `GET /api/collections/<收藏夹ID>?userId=<该用户ID>`，可读取私有收藏夹详情

影响：

- 私有收藏夹元数据和内容都可能外泄
- 只要知道或猜到用户 ID，即可绕过“私有”限制

部署判断：

- 这是直接阻断上线的问题

### 4. 高风险：社区公开卡片路由与文档/测试脚本不一致

实际公开社区卡片入口是 `/api/published`，但文档和测试脚本仍把 `/api/cards/public` 作为公开查询接口。

证据：

- 实际注册：`routes/index.js:29-42`
- 文档描述：`README.md:104-113`
- 测试脚本：`test-api.js:134-137`

运行态复现：

- `GET /api/cards/public` 返回 `404`

影响：

- 现有客户端或联调脚本若按文档接入，会直接失败
- 说明接口契约尚未稳定，部署后前后端联调风险高

部署判断：

- 不一定阻断服务启动，但足以阻断稳定上线

### 5. 高风险：社区发布与分类浏览使用了两套不一致的数据源

社区公开卡片由 `publish.service.js` 写入 `publishedCards`，但分类接口 `category.service.js` 查询的却是普通 `cards`。

证据：

- 社区发布写入：`services/publish.service.js:23-78`
- 社区公开列表读取：`services/publish.service.js:124-167`
- 分类读取普通卡片：`services/category.service.js:35-43`

影响：

- 通过 `/api/published/publish` 发布的社区卡片，不一定能在 `/api/categories/:id/cards` 中出现
- 这会造成“社区首页有数据，但分类页为空或不一致”的行为缺陷

部署判断：

- 这是明显的业务逻辑不闭合问题

### 6. 高风险：环境变量命名与部署文档/compose 不一致

代码实际读取的是 `COMMUNITY_PORT` 和 `COMMUNITY_SESSION_TTL_MS`，但 `.env.example`、README 和 `docker-compose.yml` 配置的是 `PORT` 和 `SESSION_TTL_MS`。

证据：

- 代码读取：`config/constants.js:7-10`
- 示例配置：`.env.example:4-11`
- Docker 配置：`docker-compose.yml:10-14`
- README 说明：`README.md:130-138`

影响：

- 运维按文档设置环境变量，可能根本不会生效
- 端口和 Session TTL 实际上被硬编码默认值接管

部署判断：

- 这是明显的部署链路不健全问题

### 7. 高风险：CORS 配置被硬编码，且与文档承诺不一致

服务入口把 CORS 固定为 `origin: '*'`，同时设置 `credentials: true`，并未读取 `.env` 中的 `CORS_ORIGIN`。

证据：

- `index.js:14-18`
- `.env.example:10-11`
- `docker-compose.yml:10-14`
- `README.md:230-233`

影响：

- 文档中宣称可通过 `CORS_ORIGIN` 限制来源，但实际代码并未接通
- `origin: '*'` 与 `credentials: true` 组合本身也不适合需要凭证的浏览器跨域场景

部署判断：

- 生产跨域行为不可控，不建议直接上线

### 8. 中风险：种子 `demo` 用户可在全新部署时被首次登录者“认领”

种子数据中预置了 `demo` 用户，但没有预置 `passwordHash` 和 `salt`。登录逻辑会在用户没有密码哈希时，使用本次提交的密码为该用户即时补写密码。

证据：

- 种子用户：`config/constants.js:47-48`
- 首次登录补写密码：`services/auth.service.js:23-29`
- 登录逻辑：`services/auth.service.js:98-100`

影响：

- 全新部署后，第一个用 `demo` 登录的人会实际接管该账号
- 这对演示环境或首次上线环境尤其危险

部署判断：

- 即使不是阻断项，也不应带着该逻辑进入生产

## 其他观察

### 1. 数据持久化方式不适合生产并发场景

当前使用 JSON 文件直接读写整个状态，没有事务、锁或并发控制。

证据：

- `data/storage.js:13-17`
- `data/storage.js:72-79`
- `data/index.js` 中多处写操作都会直接 `saveData(...)`

影响：

- 单进程、小流量下可以工作
- 但并不适合高并发、故障恢复或多实例部署

说明：

- 这一点 README 也已经提示更适合换成数据库
- 单独看它不是“现在一定跑不起来”的问题，但会限制生产稳定性

### 2. 仓库中存在多套数据文件，容易造成运维误判

仓库根目录存在 `data.json`、`sessions.json`，`data/` 目录下也存在实际被代码使用的 `data/data.json`、`data/sessions.json`。

影响：

- 容易误以为根目录数据文件在生效
- 排障和备份路径容易混淆

## 是否可以直接部署

结论：不可以。

原因：

1. 认证边界已失效
2. 私有数据可被未授权读取
3. 公开路由契约与文档、测试脚本不一致
4. 社区发布与分类浏览逻辑不一致
5. 生产配置项与实际代码读取不一致

## 上线前最低修复清单

建议至少完成以下修复后再进入部署验证：

1. 删除 `x-user-id` 作为认证依据，只接受有效的 Bearer token
2. `/api/auth/session`、`/api/auth/login` 等接口只返回脱敏后的用户字段
3. 收藏夹读取接口改为基于认证用户做权限判断，禁止通过查询参数冒充身份
4. 统一“公开社区卡片”的正式路由，并同步修正文档、测试脚本和客户端
5. 统一社区公开数据源，避免 `publishedCards` 与 `cards` 并行造成分类页错乱
6. 统一环境变量命名，确保代码、`.env.example`、README、compose 一致
7. 让 CORS 真正读取配置，并按生产域名白名单生效
8. 移除或重构 `demo` 种子账号逻辑，避免首次登录认领
9. 评估是否继续使用 JSON 文件存储；若用于生产，建议切换数据库

## 最终判断

`AutoLableServer` 当前实现不具备直接部署条件。

如果只是内网自测或单人临时使用，可以运行；如果目标是公网部署或正式联调，当前版本风险过高，建议先完成上述修复再上线。
