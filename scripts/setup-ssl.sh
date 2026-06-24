#!/usr/bin/env bash
# 在服务器上运行，自动申请 Let's Encrypt 证书并切换到 HTTPS 配置
# 用法: sudo bash scripts/setup-ssl.sh [邮箱]
# 示例: sudo bash scripts/setup-ssl.sh admin@renxiangsan.com

set -euo pipefail

DOMAIN="renxiangsan.com"
WWW="www.${DOMAIN}"
EMAIL="${1:-}"
PROJECT_DIR="${PROJECT_DIR:-/var/www/zytb}"
NGINX_SITE="/etc/nginx/sites-available/zytb"
CERTBOT_WEBROOT="/var/www/certbot"

if [[ "${EUID}" -ne 0 ]]; then
  echo "请使用 root 权限运行: sudo bash scripts/setup-ssl.sh your@email.com"
  exit 1
fi

if [[ -z "${EMAIL}" ]]; then
  echo "用法: sudo bash scripts/setup-ssl.sh your@email.com"
  exit 1
fi

echo "==> 安装 certbot..."
if command -v apt-get &>/dev/null; then
  apt-get update -qq
  apt-get install -y certbot
elif command -v yum &>/dev/null; then
  yum install -y certbot
else
  echo "未检测到 apt/yum，请手动安装 certbot 后重试"
  exit 1
fi

echo "==> 创建 ACME 验证目录..."
mkdir -p "${CERTBOT_WEBROOT}/.well-known/acme-challenge"

echo "==> 部署临时 HTTP 配置（用于证书验证）..."
cp "${PROJECT_DIR}/nginx.bootstrap.conf" "${NGINX_SITE}"
ln -sf "${NGINX_SITE}" /etc/nginx/sites-enabled/zytb
nginx -t
systemctl reload nginx

echo "==> 申请证书 (${DOMAIN}, ${WWW})..."
certbot certonly \
  --webroot \
  -w "${CERTBOT_WEBROOT}" \
  -d "${DOMAIN}" \
  -d "${WWW}" \
  --email "${EMAIL}" \
  --agree-tos \
  --non-interactive

echo "==> 生成 SSL 参数（若不存在）..."
if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
  mkdir -p /etc/letsencrypt
  curl -sS https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf
fi
if [[ ! -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "==> 检查 443 端口防火墙..."
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 443/tcp || true
  echo "    已尝试 ufw allow 443/tcp"
fi
echo "    若仍无法访问 HTTPS，请在云控制台安全组放行 443 端口（腾讯云/阿里云）"

echo "==> 部署 HTTPS 生产配置..."
cp "${PROJECT_DIR}/nginx.example.conf" "${NGINX_SITE}"
nginx -t
systemctl reload nginx

echo "==> 配置证书自动续期..."
CRON_CMD="0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"
(crontab -l 2>/dev/null | grep -v 'certbot renew' || true; echo "${CRON_CMD}") | crontab -

echo "==> 验证续期流程..."
certbot renew --dry-run

echo ""
echo "✓ HTTPS 配置完成"
echo "  访问: https://${WWW}/"
echo "  证书: /etc/letsencrypt/live/${DOMAIN}/"
echo ""
echo "请确认 .env 中已设置:"
echo "  SITE_URL=https://${WWW}"
