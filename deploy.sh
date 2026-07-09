#!/bin/bash
# 部署脚本
git pull
npm install --production
cd frontend && npm install && npm run build && cd ..
cd backend && npm install && cd ..
pm2 restart nldocs || pm2 start ecosystem.config.js --env production