#!/bin/bash

# 随舞社区服务器部署脚本

set -e

echo "========================================="
echo "  随舞社区服务器 - 部署脚本"
echo "========================================="

# 1. 检查 Node.js 版本
echo "📋 检查环境..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 需要 Node.js 18 或更高版本"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"

# 2. 安装依赖
echo "📦 安装依赖..."
npm install --production

# 3. 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data

# 4. 复制环境变量配置
if [ ! -f .env ]; then
    echo "📝 创建环境变量配置..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置生产环境参数"
    echo "nano .env"
    read -p "按回车继续..."
fi

# 5. 启动服务器
echo "🚀 启动服务器..."
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 启动..."
    pm2 start index.js --name community-server
    pm2 save
    echo "✅ 服务器已启动 (PM2)"
    echo "查看日志: pm2 logs community-server"
    echo "查看状态: pm2 status"
else
    echo "使用 Node.js 直接启动..."
    nohup node index.js > server.log 2>&1 &
    echo "✅ 服务器已启动"
    echo "查看日志: tail -f server.log"
    echo "进程ID: $!"
fi

echo ""
echo "========================================="
echo "  部署完成!"
echo "========================================="
echo "服务器地址: http://localhost:8787"
echo "健康检查: curl http://localhost:8787/api/health"
