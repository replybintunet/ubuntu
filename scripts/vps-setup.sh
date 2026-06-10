#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BintuNet VPS One-Time Setup Script
# Tested on Ubuntu 22.04 / 24.04
# Run as a non-root user with sudo privileges.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [1/8] System update ==="
sudo apt-get update -y && sudo apt-get upgrade -y

echo "=== [2/8] Install system tools ==="
sudo apt-get install -y curl git ffmpeg python3 python3-pip nginx ufw

echo "=== [3/8] Install streamlink ==="
pip3 install --user streamlink
# Make sure ~/.local/bin is on PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"

echo "=== [4/8] Install yt-dlp ==="
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

echo "=== [5/8] Install Node.js 22 via fnm ==="
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc || true
fnm install 22
fnm use 22
fnm default 22

echo "=== [6/8] Install pnpm ==="
npm install -g pnpm pm2

echo "=== [7/8] Clone repo & install deps ==="
DEPLOY_PATH="${DEPLOY_PATH:-$HOME/bintunet}"
if [ ! -d "$DEPLOY_PATH" ]; then
  git clone https://github.com/YOUR_ORG/YOUR_REPO.git "$DEPLOY_PATH"
fi
cd "$DEPLOY_PATH"
pnpm install --frozen-lockfile

echo "=== [8/8] Configure environment secrets ==="
# Write your secrets to a .env file that PM2 will load
# (or export them from your server's profile / use a secrets manager)
cat > "$DEPLOY_PATH/.env.production" << 'EOF'
# Fill in the values below — keep this file out of git!
SESSION_SECRET=replace_me_with_a_long_random_string
GOOGLE_API_KEY=replace_me_with_your_google_api_key
PORT=8080
NODE_ENV=production
EOF

echo ""
echo "─────────────────────────────────────────────────────────────"
echo " NEXT STEPS:"
echo "  1. Edit $DEPLOY_PATH/.env.production with real secrets"
echo "  2. Update ecosystem.config.cjs to load .env.production"
echo "  3. Run:  cd $DEPLOY_PATH && pm2 start ecosystem.config.cjs"
echo "  4. Run:  pm2 save && pm2 startup   (to survive reboots)"
echo "  5. Configure nginx reverse-proxy — see docs/nginx.conf"
echo "─────────────────────────────────────────────────────────────"
