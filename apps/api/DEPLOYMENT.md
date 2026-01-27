# tsucast API Deployment Guide

Deploy the tsucast API to a Hetzner VPS (or any Linux server).

## Prerequisites

- Hetzner VPS with Ubuntu 22.04+ (or Debian 12+)
- Domain pointing to VPS IP (e.g., `api.tsucast.com`)
- SSH access to the server

## Quick Start (Recommended: Docker)

### 1. Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Caddy (reverse proxy with auto-HTTPS)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

### 2. Create App Directory

```bash
mkdir -p /opt/tsucast
cd /opt/tsucast
```

### 3. Create Environment File

```bash
cat > .env << 'EOF'
# Server
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=tsucast-audio
R2_PUBLIC_URL=https://audio.tsucast.com

# Kokoro TTS (RunPod Serverless)
KOKORO_API_URL=your-kokoro-api-url
KOKORO_API_KEY=your-kokoro-api-key

# RevenueCat (optional - for in-app purchases)
REVENUECAT_WEBHOOK_AUTH_KEY=your-webhook-auth-key
REVENUECAT_API_SECRET_KEY=sk_your-secret-key
EOF

# Secure the file
chmod 600 .env
```

### 4. Deploy with Docker

**Option A: Build locally and push to registry**

```bash
# On your local machine
cd apps/api
docker build -t your-registry/tsucast-api:latest .
docker push your-registry/tsucast-api:latest

# On VPS
docker pull your-registry/tsucast-api:latest
docker run -d \
  --name tsucast-api \
  --restart unless-stopped \
  --env-file /opt/tsucast/.env \
  -p 127.0.0.1:3001:3001 \
  your-registry/tsucast-api:latest
```

**Option B: Build on VPS (simpler for small projects)**

```bash
# Clone repo on VPS
git clone https://github.com/your-org/tsucast.git /opt/tsucast/repo
cd /opt/tsucast/repo/apps/api

# Build and run
docker build -t tsucast-api .
docker run -d \
  --name tsucast-api \
  --restart unless-stopped \
  --env-file /opt/tsucast/.env \
  -p 127.0.0.1:3001:3001 \
  tsucast-api
```

### 5. Configure Caddy (Reverse Proxy + HTTPS)

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
api.tsucast.com {
    reverse_proxy localhost:3001

    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }

    # Logging
    log {
        output file /var/log/caddy/tsucast-api.log
    }
}
EOF

# Reload Caddy
systemctl reload caddy
```

Caddy automatically provisions HTTPS certificates via Let's Encrypt.

### 6. Verify Deployment

```bash
# Check container is running
docker ps

# Check logs
docker logs tsucast-api

# Test health endpoint
curl https://api.tsucast.com/health

# Expected response:
# {"status":"ok","timestamp":"...","services":{"database":"healthy",...}}
```

---

## Alternative: Deploy Without Docker

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 2. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 3. Clone and Build

```bash
cd /opt/tsucast
git clone https://github.com/your-org/tsucast.git repo
cd repo/apps/api
npm ci
npm run build
```

### 4. Create PM2 Ecosystem File

```bash
cat > /opt/tsucast/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'tsucast-api',
    script: '/opt/tsucast/repo/apps/api/dist/index.js',
    cwd: '/opt/tsucast/repo/apps/api',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    env_file: '/opt/tsucast/.env',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    log_file: '/var/log/tsucast/api.log',
    error_file: '/var/log/tsucast/api-error.log',
    time: true,
  }]
};
EOF

mkdir -p /var/log/tsucast
```

### 5. Start with PM2

```bash
pm2 start /opt/tsucast/ecosystem.config.cjs
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

---

## Updating the API

### With Docker

```bash
cd /opt/tsucast/repo
git pull
cd apps/api
docker build -t tsucast-api .
docker stop tsucast-api
docker rm tsucast-api
docker run -d \
  --name tsucast-api \
  --restart unless-stopped \
  --env-file /opt/tsucast/.env \
  -p 127.0.0.1:3001:3001 \
  tsucast-api
```

### With PM2

```bash
cd /opt/tsucast/repo
git pull
cd apps/api
npm ci
npm run build
pm2 restart tsucast-api
```

---

## Monitoring

### View Logs

```bash
# Docker
docker logs -f tsucast-api

# PM2
pm2 logs tsucast-api

# Caddy
tail -f /var/log/caddy/tsucast-api.log
```

### Health Check Script

Create `/opt/tsucast/healthcheck.sh`:

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$RESPONSE" != "200" ] && [ "$RESPONSE" != "503" ]; then
    echo "API health check failed: $RESPONSE"
    # Optionally restart
    # docker restart tsucast-api
    exit 1
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/tsucast/healthcheck.sh >> /var/log/tsucast/healthcheck.log 2>&1
```

---

## Security Checklist

- [x] Run as non-root user (Docker handles this)
- [x] HTTPS enabled via Caddy
- [x] Environment file permissions (chmod 600)
- [ ] Firewall: Only allow 22, 80, 443
  ```bash
  ufw allow 22
  ufw allow 80
  ufw allow 443
  ufw enable
  ```
- [ ] Fail2ban for SSH protection
  ```bash
  apt install fail2ban
  systemctl enable fail2ban
  ```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs tsucast-api

# Common issues:
# - Missing environment variables
# - Database connection failed (check SUPABASE_URL)
# - Port already in use
```

### Health check returns "degraded"

Check which service is unhealthy:
```bash
curl http://localhost:3001/health | jq
```

- `database: unhealthy` - Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- `storage: unhealthy` - Check R2 credentials
- `tts: unhealthy` - Check KOKORO_API_URL and KOKORO_API_KEY

### 502 Bad Gateway

Caddy can't reach the API:
```bash
# Check if container is running
docker ps

# Check if API is listening
curl http://localhost:3001/health
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (default: development) |
| `LOG_LEVEL` | No | Logging level (default: info) |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role key |
| `R2_ACCOUNT_ID` | **Yes** | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | **Yes** | R2 access key |
| `R2_SECRET_ACCESS_KEY` | **Yes** | R2 secret key |
| `R2_BUCKET` | **Yes** | R2 bucket name |
| `R2_PUBLIC_URL` | **Yes** | Public URL for audio files |
| `KOKORO_API_URL` | **Yes** | Kokoro TTS RunPod Serverless URL |
| `KOKORO_API_KEY` | **Yes** | Kokoro TTS RunPod API key |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | No | RevenueCat webhook secret |
| `REVENUECAT_API_SECRET_KEY` | No | RevenueCat API key |
