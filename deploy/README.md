# NLDocs 部署指南

本目录包含 NLDocs 项目在生产服务器上的部署配置文件。

- 服务器 IP：`115.190.153.44`
- 域名：`doc.xuanjian.top`
- 部署路径：`/var/www/nldocs/`
- 后端端口：`3000`（Node.js + Express + SQLite）
- 前端：Vue3 + Vite 静态构建
- 进程管理：PM2
- 反向代理：Nginx

## 目录结构

```
deploy/
├── nginx-nldocs.conf      # Nginx 配置文件
├── ecosystem.config.js    # PM2 进程配置文件
└── README.md              # 本说明文档

deploy.sh                  # 主部署脚本（位于项目根目录）
```

## 一、前置条件

在开始部署前，请确保服务器已具备以下环境：

- **Node.js**（建议 v18 LTS 或以上）
- **npm**（随 Node.js 一并安装）
- **PM2**：Node 进程管理器
- **Nginx**：反向代理服务器
- **rsync**（可选，用于排除 node_modules 传输；无则脚本回退到 tar 方式）
- **SSL 证书**：通过 certbot 申请（见下文）
- 本地具备 `ssh` / `scp` 客户端，并已配置到服务器的免密登录

## 二、初始服务器配置（首次部署执行）

以下命令在服务器上以 `root` 用户执行：

### 1. 安装基础软件

```bash
# Node.js (以 NodeSource 为例)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2

# Nginx
apt-get install -y nginx

# certbot（用于申请 SSL 证书）
apt-get install -y certbot python3-certbot-nginx
```

### 2. 创建部署目录

```bash
mkdir -p /var/www/nldocs/frontend
mkdir -p /var/www/nldocs/backend
mkdir -p /var/log/nldocs
```

### 3. 配置 SSH 免密登录（在本地执行）

```bash
# 若本地尚无密钥，先生成
ssh-keygen -t rsa -b 4096

# 将公钥上传到服务器
ssh-copy-id root@115.190.153.44
```

## 三、配置 Nginx

### 1. 上传并启用 Nginx 配置

```bash
# 将本目录下的 nginx-nldocs.conf 上传到服务器
scp deploy/nginx-nldocs.conf root@115.190.153.44:/etc/nginx/conf.d/

# 测试配置语法
ssh root@115.190.153.44 "nginx -t"

# 重载 Nginx
ssh root@115.190.153.44 "nginx -s reload"
```

### 2. 申请 SSL 证书（certbot）

> 注意：申请证书前请确保域名 `doc.xuanjian.top` 已解析到 `115.190.153.44`，
> 且服务器的 80 端口可被外网访问。

```bash
ssh root@115.190.153.44 "certbot --nginx -d doc.xuanjian.top"
```

certbot 会自动修改 Nginx 配置并启用 HTTPS，同时配置自动续期。
默认证书路径为：

- `/etc/letsencrypt/live/doc.xuanjian.top/fullchain.pem`
- `/etc/letsencrypt/live/doc.xuanjian.top/privkey.pem`

## 四、启动 PM2 服务

将 `ecosystem.config.js` 上传到服务器后启动：

```bash
# 上传配置文件
scp deploy/ecosystem.config.js root@115.190.153.44:/var/www/nldocs/

# 启动后端进程
ssh root@115.190.153.44 "cd /var/www/nldocs && pm2 start ecosystem.config.js --env production"

# 保存进程列表（开机自启）
ssh root@115.190.153.44 "pm2 save"
ssh root@115.190.153.44 "pm2 startup"
```

常用 PM2 命令：

```bash
pm2 list                       # 查看进程列表
pm2 logs nldocs-backend        # 查看实时日志
pm2 restart nldocs-backend     # 重启进程
pm2 stop nldocs-backend        # 停止进程
pm2 delete nldocs-backend      # 删除进程
```

## 五、运行部署脚本

主部署脚本位于项目根目录 `deploy.sh`，它将完成：构建前端 → SCP 传输前端产物 →
传输后端代码（排除 node_modules）→ 安装后端依赖 → 重启 PM2 → 重载 Nginx。

### 1. 赋予执行权限（首次执行）

```bash
chmod +x deploy.sh
```

### 2. 执行部署

```bash
./deploy.sh
```

脚本内置颜色输出与错误处理，任何步骤失败都会终止并提示。
部署成功后访问：**https://doc.xuanjian.top**

## 六、目录结构（服务器端）

```
/var/www/nldocs/
├── frontend/              # 前端静态文件 (由 deploy.sh 传输)
│   ├── index.html
│   ├── assets/
│   └── ...
├── backend/               # 后端代码 (由 deploy.sh 传输)
│   ├── index.js
│   ├── package.json
│   ├── routes/
│   ├── ...
│   └── node_modules/      # 在服务器上 npm install 生成
└── ecosystem.config.js    # PM2 配置

/var/log/nldocs/           # PM2 日志目录
├── out.log
└── error.log
```

## 七、故障排查

| 问题 | 排查命令 |
| --- | --- |
| 后端未启动 | `ssh root@115.190.153.44 "pm2 logs nldocs-backend --lines 50"` |
| Nginx 报错 | `ssh root@115.190.153.44 "tail -f /var/log/nginx/error.log"` |
| 502 Bad Gateway | 检查后端是否监听 3000 端口：`ssh root@115.190.153.44 "pm2 list && netstat -tlnp \| grep 3000"` |
| SSL 证书过期 | `ssh root@115.190.153.44 "certbot renew --dry-run"` |
| 前端 404 | 检查 `try_files` 与 `root` 路径是否正确 |

## 八、相关文件路径

- 部署脚本：`deploy.sh`（项目根目录）
- Nginx 配置：`deploy/nginx-nldocs.conf`
- PM2 配置：`deploy/ecosystem.config.js`
