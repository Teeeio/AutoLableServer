# AutoLableServer 快速启动指南

## Windows 用户

### 方式1: 使用部署脚本 (推荐)

```cmd
cd F:\设计\快速项目\AutoLableServer
deploy.bat
```

按照提示操作即可。

### 方式2: 直接启动

```cmd
cd F:\设计\快速项目\AutoLableServer
node index.js
```

### 方式3: 使用 npm

```cmd
cd F:\设计\快速项目\AutoLableServer
npm start
```

---

## Linux/Mac 用户

### 方式1: 使用部署脚本

```bash
cd /path/to/AutoLableServer
chmod +x deploy.sh
./deploy.sh
```

### 方式2: 直接启动

```bash
cd /path/to/AutoLableServer
node index.js
```

### 方式3: 使用 PM2

```bash
cd /path/to/AutoLableServer
npm install -g pm2
pm2 start index.js --name auto-label-server
pm2 save
```

---

## Docker 用户

```bash
cd /path/to/AutoLableServer
docker-compose up -d
```

---

## 验证服务器运行

打开浏览器访问:
```
http://localhost:8787/api/health
```

应该看到:
```json
{"ok":true}
```

---

## 常见问题

### 端口被占用

修改 `config/constants.js` 中的 PORT 配置。

### 依赖安装失败

```bash
# 删除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 权限错误 (Linux/Mac)

```bash
chmod +x deploy.sh
```

---

## 下一步

1. 测试服务器正常启动
2. 配置前端连接到服务器
3. 部署到生产环境
