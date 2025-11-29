# 股票实时行情系统部署指南

## 系统要求

### 硬件要求
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 50GB以上可用空间
- **网络**: 稳定的互联网连接

### 软件要求
- **操作系统**: Linux (Ubuntu 20.04+), macOS, Windows 10+
- **Node.js**: 18.0+
- **MySQL**: 8.0+
- **Redis**: 6.0+

## 环境准备

### 1. Node.js 安装
```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. MySQL 安装和配置
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 创建数据库
mysql -u root -p
CREATE DATABASE vietnam_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trading_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON vietnam_test.* TO 'trading_user'@'%';
FLUSH PRIVILEGES;
```

### 3. Redis 安装和配置
```bash
# Ubuntu/Debian
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# 启动Redis服务
sudo systemctl start redis
sudo systemctl enable redis

# 测试Redis连接
redis-cli ping
```

## 应用部署

### 1. 代码部署
```bash
# 克隆代码
git clone <repository-url>
cd JP-vietnam

# 安装依赖
npm install

# 构建项目
npm run build
```

### 2. 环境配置
```bash
# 复制环境配置文件
cp .env.dev .env.prod

# 编辑生产环境配置
nano .env.prod
```

**生产环境配置示例**:
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=trading_user
DB_PASSWD=your_secure_password
DB_DATABASE=vietnam_test

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# WebSocket行情源配置
QUOTE_WS_TOKEN=your_production_token

# 股票行情系统配置
TARGET_STOCK_SYMBOLS=NVDA.US,MSFT.US,AAPL.US,AMZN.US,GOOG.US
STOCK_QUOTE_CACHE_TTL=60
ALL_QUOTES_CACHE_TTL=2
SPREAD_CACHE_TTL=300
PRICE_DETECTION_THRESHOLD=0.0001

# 性能配置
MAX_CONCURRENT_DB_WRITES=20
BATCH_REDIS_UPDATE_SIZE=10

# 监控配置
ENABLE_PERFORMANCE_LOGGING=true
SLOW_QUERY_THRESHOLD_MS=100

# 生产环境设置
NODE_ENV=production
PORT=3000
```

### 3. 数据库初始化
```bash
# 运行数据库迁移脚本
mysql -u trading_user -p vietnam_test < src/migrations/001-create-stock-quote-tables.sql

# 或者使用TypeORM同步（开发环境）
npm run typeorm migration:run
```

## 进程管理

### 1. 使用 PM2 管理进程
```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'stock-quote-system',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart stock-quote-system
```

### 2. 使用 Systemd (Linux)
```bash
# 创建服务文件
sudo nano /etc/systemd/system/stock-quote.service
```

**服务配置内容**:
```ini
[Unit]
Description=Stock Quote System
After=network.target mysql.service redis.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/JP-vietnam
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl enable stock-quote
sudo systemctl start stock-quote

# 查看状态
sudo systemctl status stock-quote
```

## 负载均衡配置

### Nginx 配置
```bash
# 安装Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/stock-quote
```

**Nginx配置内容**:
```nginx
upstream stock_quote_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/quote {
        proxy_pass http://stock_quote_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://stock_quote_backend/api/quote/status/connection;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/stock-quote /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 监控和日志

### 1. 应用监控
```bash
# 安装监控工具
npm install -g clinic

# 性能分析
clinic doctor -- node dist/main.js
clinic bubbleprof -- node dist/main.js
clinic flame -- node dist/main.js
```

### 2. 日志管理
```bash
# 创建日志目录
mkdir -p logs

# 配置日志轮转
sudo nano /etc/logrotate.d/stock-quote
```

**日志轮转配置**:
```
/home/ubuntu/JP-vietnam/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. 系统监控脚本
```bash
# 创建监控脚本
nano monitor.sh
```

**监控脚本内容**:
```bash
#!/bin/bash

# 检查应用状态
check_app_status() {
    if ! pm2 describe stock-quote-system > /dev/null 2>&1; then
        echo "应用未运行，正在重启..."
        pm2 restart stock-quote-system
    fi
}

# 检查数据库连接
check_db_connection() {
    if ! mysql -u trading_user -p$DB_PASSWD -e "SELECT 1" > /dev/null 2>&1; then
        echo "数据库连接失败"
        # 发送告警
    fi
}

# 检查Redis连接
check_redis_connection() {
    if ! redis-cli ping > /dev/null 2>&1; then
        echo "Redis连接失败"
        # 发送告警
    fi
}

# 检查磁盘空间
check_disk_space() {
    USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        echo "磁盘空间不足: ${USAGE}%"
        # 发送告警
    fi
}

# 执行检查
check_app_status
check_db_connection
check_redis_connection
check_disk_space

echo "监控检查完成: $(date)"
```

```bash
# 设置定时任务
crontab -e

# 添加每5分钟检查一次
*/5 * * * * /home/ubuntu/JP-vietnam/monitor.sh >> /home/ubuntu/JP-vietnam/logs/monitor.log 2>&1
```

## 备份策略

### 1. 数据库备份
```bash
# 创建备份脚本
nano backup.sh
```

**备份脚本内容**:
```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="vietnam_test"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u trading_user -p$DB_PASSWD $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

```bash
# 设置每日凌晨2点备份
crontab -e
0 2 * * * /home/ubuntu/JP-vietnam/backup.sh >> /home/ubuntu/JP-vietnam/logs/backup.log 2>&1
```

### 2. 应用备份
```bash
# 创建应用备份脚本
nano backup_app.sh
```

**应用备份脚本内容**:
```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/ubuntu/JP-vietnam"

# 备份应用代码
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR src dist package.json ecosystem.config.js

# 删除30天前的应用备份
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +30 -delete

echo "应用备份完成: $BACKUP_DIR/app_backup_$DATE.tar.gz"
```

## 故障排除

### 常见问题

1. **WebSocket连接失败**
   - 检查网络连接
   - 验证QUOTE_WS_TOKEN是否正确
   - 查看防火墙设置

2. **Redis连接超时**
   - 检查Redis服务状态
   - 验证连接配置
   - 检查内存使用情况

3. **数据库连接失败**
   - 检查MySQL服务状态
   - 验证用户权限
   - 检查连接数限制

4. **API响应慢**
   - 检查Redis缓存命中率
   - 监控数据库查询性能
   - 检查网络延迟

### 日志分析
```bash
# 查看应用日志
pm2 logs stock-quote-system

# 查看错误日志
tail -f logs/err.log

# 查看访问日志
tail -f /var/log/nginx/access.log

# 查看系统日志
journalctl -u stock-quote -f
```

## 性能优化

### 1. 数据库优化
- 添加适当的索引
- 配置查询缓存
- 优化连接池大小

### 2. Redis优化
- 配置内存淘汰策略
- 优化数据结构
- 启用持久化

### 3. 应用优化
- 启用集群模式
- 配置负载均衡
- 优化缓存策略

## 安全配置

### 1. 防火墙设置
```bash
# 配置UFW防火墙
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL证书配置
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 安全加固
- 定期更新系统
- 配置fail2ban
- 限制SSH访问
- 使用强密码
