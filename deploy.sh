#!/bin/bash
# ==============================================================================
# NLDocs 部署脚本
# 通过 SCP 将前端构建产物与后端代码传输到生产服务器，并重启服务
# 服务器: 115.190.153.44 | 域名: doc.xuanjian.top | 部署路径: /var/www/nldocs/
# 前端端口: 3014 (Nginx) | 后端端口: 3015 (Node.js)
# ==============================================================================

set -e  # 任何命令失败立即退出

# ------------------------------ 颜色定义 ------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # 重置颜色

# ------------------------------ 配置项 ------------------------------
SERVER_IP="115.190.153.44"
SERVER_USER="root"
REMOTE_PATH="/var/www/nldocs"
DOMAIN="doc.xuanjian.top"
FRONTEND_PORT="3014"
BACKEND_PORT="3015"

SSH_TARGET="${SERVER_USER}@${SERVER_IP}"
FRONTEND_DIR="./frontend"
BACKEND_DIR="./backend"

# ------------------------------ 工具函数 ------------------------------

# 打印信息日志
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 打印成功日志
log_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

# 打印警告日志
log_warn() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

# 打印错误日志
log_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 打印步骤标题
log_step() {
    echo ""
    echo -e "${CYAN}========================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}========================================================${NC}"
}

# 错误捕获：脚本异常退出时输出失败步骤
on_error() {
    local exit_code=$?
    log_error "部署在执行过程中失败，退出码: ${exit_code}"
    log_error "请检查上方日志输出定位问题后重新运行本脚本"
    exit ${exit_code}
}
trap on_error ERR

# ------------------------------ 前置检查 ------------------------------

log_step "步骤 0：环境前置检查"

# 检查 frontend 目录
if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "未找到前端目录: $FRONTEND_DIR"
    exit 1
fi

# 检查 backend 目录
if [ ! -d "$BACKEND_DIR" ]; then
    log_error "未找到后端目录: $BACKEND_DIR"
    exit 1
fi

# 检查 npm 是否可用
if ! command -v npm &> /dev/null; then
    log_error "未检测到 npm，请先安装 Node.js"
    exit 1
fi

# 检查 scp / ssh 是否可用
if ! command -v scp &> /dev/null || ! command -v ssh &> /dev/null; then
    log_error "未检测到 scp/ssh，请先安装 OpenSSH 客户端"
    exit 1
fi

log_success "本地环境检查通过"

# ------------------------------ 1. 构建前端 ------------------------------

log_step "步骤 1：构建前端 (Vue3 + Vite)"

log_info "安装前端依赖..."
cd "$FRONTEND_DIR"
npm install
log_success "前端依赖安装完成"

log_info "开始构建生产版本..."
npm run build
log_success "前端构建完成，产物位于 dist/ 目录"

# 校验构建产物是否存在
if [ ! -d "dist" ]; then
    log_error "构建产物 dist/ 目录不存在，请检查 vite 构建配置"
    exit 1
fi

cd ..
log_success "前端构建流程全部完成"

# ------------------------------ 2. 传输前端产物 ------------------------------

log_step "步骤 2：通过 SCP 传输前端构建产物到服务器"

log_info "目标: ${SSH_TARGET}:${REMOTE_PATH}/frontend/"
# 确保远程目录存在
ssh "$SSH_TARGET" "mkdir -p ${REMOTE_PATH}/frontend"

scp -r frontend/dist/* "${SSH_TARGET}:${REMOTE_PATH}/frontend/"
log_success "前端产物已成功传输到服务器"

# ------------------------------ 3. 传输后端代码 ------------------------------

log_step "步骤 3：传输后端代码到服务器 (排除 node_modules)"

log_info "目标: ${SSH_TARGET}:${REMOTE_PATH}/backend/"
# 确保远程目录存在
ssh "$SSH_TARGET" "mkdir -p ${REMOTE_PATH}/backend"

# 说明：scp 原生不支持 exclude，这里使用 rsync 排除 node_modules
# 若服务器无 rsync，则回退到 tar 管道方式传输
if command -v rsync &> /dev/null; then
    log_info "使用 rsync 传输后端代码 (排除 node_modules)..."
    rsync -avz --exclude 'node_modules' \
        "${BACKEND_DIR}/" \
        "${SSH_TARGET}:${REMOTE_PATH}/backend/"
else
    log_warn "本地未检测到 rsync，回退到 tar 管道方式传输..."
    tar --exclude='node_modules' -czf - -C "$BACKEND_DIR" . | \
        ssh "$SSH_TARGET" "cd ${REMOTE_PATH}/backend && tar -xzf -"
fi
log_success "后端代码已成功传输到服务器"

# ------------------------------ 4. 安装后端依赖 ------------------------------

log_step "步骤 4：在服务器上安装后端依赖"

log_info "执行远程命令: npm install --production"
ssh "$SSH_TARGET" "cd ${REMOTE_PATH}/backend && npm install --production"
log_success "后端依赖安装完成"

# ------------------------------ 5. 部署 Nginx 配置 ------------------------------

log_step "步骤 5：部署 Nginx 配置"

log_info "传输 Nginx 配置文件..."
scp deploy/nginx-nldocs.conf "${SSH_TARGET}:/etc/nginx/conf.d/nldocs.conf"
log_success "Nginx 配置已传输"

log_info "校验 Nginx 配置语法..."
ssh "$SSH_TARGET" "nginx -t"
log_success "Nginx 配置语法正确"

log_info "重载 Nginx..."
ssh "$SSH_TARGET" "nginx -s reload"
log_success "Nginx 已重载 (监听端口 ${FRONTEND_PORT})"

# ------------------------------ 6. 重启 PM2 进程 ------------------------------

log_step "步骤 6：重启 PM2 进程 (端口 ${BACKEND_PORT})"

log_info "传输 PM2 配置文件..."
scp deploy/ecosystem.config.js "${SSH_TARGET}:${REMOTE_PATH}/ecosystem.config.js"

log_info "停止旧的 PM2 进程 (如存在)..."
ssh "$SSH_TARGET" "pm2 delete nldocs-backend 2>/dev/null || true"

log_info "启动 PM2 进程..."
ssh "$SSH_TARGET" "cd ${REMOTE_PATH} && pm2 start ecosystem.config.js --env production"
log_success "PM2 进程已启动 (端口 ${BACKEND_PORT})"

log_info "保存 PM2 进程列表 (开机自启)..."
ssh "$SSH_TARGET" "pm2 save"
log_success "PM2 进程列表已保存"

log_info "当前 PM2 进程列表:"
ssh "$SSH_TARGET" "pm2 list"

# ------------------------------ 部署完成 ------------------------------

log_step "部署完成"
echo -e "${GREEN}NLDocs 已成功部署到生产环境！${NC}"
echo -e "  服务器 IP   : ${YELLOW}${SERVER_IP}${NC}"
echo -e "  域名        : ${YELLOW}${DOMAIN}${NC}"
echo -e "  部署路径    : ${YELLOW}${REMOTE_PATH}${NC}"
echo -e "  前端端口    : ${YELLOW}${FRONTEND_PORT} (Nginx)${NC}"
echo -e "  后端端口    : ${YELLOW}${BACKEND_PORT} (Node.js)${NC}"
echo -e "  访问地址    : ${CYAN}http://${DOMAIN}:${FRONTEND_PORT}${NC}"
echo ""
log_info "如遇问题，可查看服务器日志："
echo -e "  ${CYAN}ssh ${SSH_TARGET} \"pm2 logs nldocs-backend --lines 50\"${NC}"
echo -e "  ${CYAN}ssh ${SSH_TARGET} \"tail -f /var/log/nginx/error.log\"${NC}"
