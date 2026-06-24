#!/usr/bin/env bash
# 服务器诊断脚本：sudo bash scripts/diagnose.sh

set -uo pipefail

echo "========== 智愿填报 站点诊断 =========="
echo ""

echo "[1] Node 服务 (pm2)"
if command -v pm2 &>/dev/null; then
  pm2 list 2>/dev/null | grep -E "zytb|online|errored|stopped" || pm2 list
else
  echo "  pm2 未安装"
fi
echo ""

echo "[2] 3000 端口"
if curl -s --connect-timeout 3 http://127.0.0.1:3000/ >/dev/null; then
  echo "  ✓ 本地 3000 正常"
else
  echo "  ✗ 本地 3000 无响应 — 运行: cd /var/www/zytb && pm2 restart zytb"
fi
echo ""

echo "[3] Nginx 状态"
systemctl is-active nginx 2>/dev/null || echo "  nginx 未运行"
nginx -t 2>&1 | sed 's/^/  /'
echo ""

echo "[4] 监听端口"
ss -tlnp 2>/dev/null | grep -E ':80|:443|:3000' | sed 's/^/  /' || netstat -tlnp 2>/dev/null | grep -E ':80|:443|:3000' | sed 's/^/  /'
echo ""

echo "[5] SSL 证书"
if [[ -f /etc/letsencrypt/live/renxiangsan.com/fullchain.pem ]]; then
  echo "  ✓ 证书存在"
  openssl x509 -in /etc/letsencrypt/live/renxiangsan.com/fullchain.pem -noout -dates 2>/dev/null | sed 's/^/  /'
else
  echo "  ✗ 证书不存在 — 运行: sudo bash scripts/setup-ssl.sh your@email.com"
fi
echo ""

echo "[6] 外网探测"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://127.0.0.1/ 2>/dev/null || echo "fail")
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -k https://127.0.0.1/ 2>/dev/null || echo "fail")
echo "  HTTP  127.0.0.1 → ${HTTP_CODE}"
echo "  HTTPS 127.0.0.1 → ${HTTPS_CODE}"
echo ""

echo "========== 常见修复 =========="
echo "  HTTP 能访问、HTTPS 不能 → 未配置 SSL 或 443 未放行"
echo "  修复: sudo bash scripts/setup-ssl.sh your@email.com"
echo "  云服务器还需在安全组开放 443/TCP"
echo "  临时恢复 HTTP: sudo cp nginx.bootstrap.conf /etc/nginx/sites-available/zytb && sudo nginx -t && sudo systemctl reload nginx"
