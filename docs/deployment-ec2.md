# EC2 Deployment Guide

This guide deploys the ShopAssist AI backend on a single Ubuntu EC2 instance using:

- `Node.js`
- `PM2`
- `Nginx`
- `Supabase`

Recommended architecture:

- frontend on `Vercel`
- backend on `EC2`
- database and auth on `Supabase`

## 1. Create the EC2 instance

Recommended starting point:

- Ubuntu LTS
- small general-purpose instance within your free-tier or credit budget
- 20 to 30 GB storage is enough for this project

Security group rules:

- `SSH (22)` from **your IP only**
- `HTTP (80)` from `0.0.0.0/0`
- `HTTPS (443)` from `0.0.0.0/0`

Do not expose port `3000` publicly. Nginx should be the public entry point.

Optional but recommended:

- allocate and attach an Elastic IP
- use a DNS record such as `api.yourdomain.com`

## 2. Connect to the server

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

Then update the server:

```bash
sudo apt update && sudo apt upgrade -y
```

## 3. Install system packages

```bash
sudo apt install -y git nginx
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

Verify:

```bash
node -v
npm -v
pm2 -v
nginx -v
```

## 4. Clone the repo

```bash
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www
cd /var/www
git clone https://github.com/your-username/shopassist-ai.git
cd shopassist-ai
```

If the repo is private, use your preferred private Git access method.

## 5. Install dependencies and build

```bash
npm install
npm run build --workspace backend
```

## 6. Configure production environment

Copy the production example:

```bash
cp backend/.env.production.example backend/.env
```

Edit it:

```bash
nano backend/.env
```

Minimum production values:

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.vercel.app,https://your-production-domain.com
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Notes:

- set `CORS_ORIGIN` to the exact frontend origins that should call the backend
- keep `SUPABASE_SERVICE_ROLE_KEY` private
- use only one live AI provider at a time unless you intentionally switch via env

## 7. Start the backend with PM2

This repo includes [`backend/ecosystem.config.cjs`](../backend/ecosystem.config.cjs).

From the repo root:

```bash
pm2 start backend/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

Run the printed `pm2 startup` command if PM2 asks for it, then:

```bash
pm2 save
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs shopassist-api
pm2 restart shopassist-api
pm2 delete shopassist-api
```

## 8. Configure Nginx

This repo includes a sample config:

- [`deploy/nginx/shopassist-api.conf`](../deploy/nginx/shopassist-api.conf)

Copy it into place:

```bash
sudo cp deploy/nginx/shopassist-api.conf /etc/nginx/sites-available/shopassist-api
```

Edit the domain:

```bash
sudo nano /etc/nginx/sites-available/shopassist-api
```

Replace:

```text
server_name api.example.com;
```

with your real domain or subdomain.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/shopassist-api /etc/nginx/sites-enabled/shopassist-api
sudo nginx -t
sudo systemctl restart nginx
```

Verify locally on the server:

```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1/api/health
```

## 9. Add HTTPS

Once DNS points to the instance, install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Then test renewal:

```bash
sudo certbot renew --dry-run
```

## 10. Connect the frontend

In Vercel, set:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Redeploy the frontend after updating the environment variables.

## 11. Verify production health

Check:

```bash
curl https://api.yourdomain.com/api/health
```

Expected:

- `status: "ok"`
- your configured `ai_provider`
- `supabase.status: "ready"` when Supabase credentials are valid

## 12. Operational checklist

Before calling the backend production-ready, make sure you also do this:

- keep SSH restricted to your IP
- rotate API keys if they were ever exposed
- store the `.pem` key securely
- use a dedicated subdomain for the API
- keep system packages updated
- monitor `pm2 logs`
- back up your Supabase project
- avoid editing production config directly without tracking the change

## Update workflow

For a normal app update:

```bash
cd /var/www/shopassist-ai
git pull
npm install
npm run build --workspace backend
pm2 restart shopassist-api
```

Then verify:

```bash
curl https://api.yourdomain.com/api/health
```
