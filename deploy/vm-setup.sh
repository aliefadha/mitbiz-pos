#!/bin/bash
set -e

DEPLOY_DIR="/opt/mitbiz-deploy"
DOMAINS="api-pos.mitbiz.id pos.mitbiz.id"
EMAIL="admin@mitbiz.id"

echo "=== VM Setup Script for Mitbiz POS ==="
echo "This script will configure Docker, nginx, and SSL on this VM"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

echo "=== Installing Docker Compose ==="
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed"
else
    echo "Docker Compose already installed"
fi

echo "=== Creating deployment directory ==="
sudo mkdir -p ${DEPLOY_DIR}/{env_vars,logs}
sudo chown -R $USER:$USER ${DEPLOY_DIR}

echo "=== Installing nginx ==="
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

echo "=== Setting up nginx reverse proxy ==="
sudo cp /opt/mitbiz-deploy/nginx.conf /etc/nginx/sites-available/mitbiz-pos
sudo ln -sf /etc/nginx/sites-available/mitbiz-pos /etc/nginx/sites-enabled/

echo "=== Testing nginx config ==="
sudo nginx -t

echo "=== Reloading nginx ==="
sudo systemctl reload nginx

echo ""
echo "=== SSL Certificate Setup ==="
echo "Domains: ${DOMAINS}"
echo "Email: ${EMAIL}"
echo ""
read -p "Get SSL certificates now? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipped. Run manually: sudo certbot --nginx -d ${DOMAINS} --non-interactive --agree-tos -m ${EMAIL}"
else
    sudo certbot --nginx -d ${DOMAINS} --non-interactive --agree-tos -m ${EMAIL}
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "1. Copy deploy scripts: rsync -av ./deploy/ ${VM_IP}:/opt/mitbiz-deploy/"
echo "2. Create backend.env in /opt/mitbiz-deploy/env_vars/ with your secrets"
echo "3. Add GitHub secrets: VM_EXTERNAL_IP, VM_SSH_USER, SSH_PRIVATE_KEY"
echo "4. Test deployment by pushing to main branch"
