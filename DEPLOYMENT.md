# Deployment Guide

This guide explains how to deploy the MCP Analytics Portal to your own infrastructure with a custom domain.

## Prerequisites

- Node.js 20 or higher
- A PostgreSQL database (e.g., Neon, Supabase, or self-hosted)
- A Gemini API key from Google AI Studio
- A custom domain with DNS access

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` for deployment |
| `PORT` | No | Server port (default: 5000) |
| `SESSION_SECRET` | Yes | A secure random string for session encryption |
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides the easiest deployment experience with automatic builds and custom domain support.

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Add environment variables in the Railway dashboard:
   - `SESSION_SECRET`
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (or provision a Railway PostgreSQL database)
5. Railway will automatically build and deploy
6. Add your custom domain in Settings > Domains

### Option 2: Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Environment: Node
5. Add environment variables
6. Add your custom domain in Settings

### Option 3: Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -t mcp-analytics-portal .

# Run the container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e SESSION_SECRET=your-secret \
  -e GEMINI_API_KEY=your-key \
  -e DATABASE_URL=your-database-url \
  mcp-analytics-portal
```

### Option 4: Manual Deployment (VPS/Cloud VM)

1. Clone the repository on your server:
```bash
git clone https://github.com/your-username/mcp-analytics-portal.git
cd mcp-analytics-portal
```

2. Install dependencies:
```bash
npm ci
```

3. Build the application:
```bash
npm run build
```

4. Set environment variables:
```bash
export NODE_ENV=production
export SESSION_SECRET=your-secure-secret
export GEMINI_API_KEY=your-gemini-key
export DATABASE_URL=your-database-url
```

5. Start the server:
```bash
npm run start
```

6. Use a process manager like PM2 for production:
```bash
npm install -g pm2
pm2 start npm --name "mcp-analytics" -- run start
pm2 save
pm2 startup
```

## Reverse Proxy Configuration

For custom domains, you need a reverse proxy (nginx, Caddy, or Traefik) to handle HTTPS.

### Nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy Example (Automatic HTTPS)

```caddyfile
your-domain.com {
    reverse_proxy localhost:5000
}
```

## Database Setup

Run database migrations after setting up your PostgreSQL database:

```bash
npm run db:push
```

## Security Considerations

1. **Session Secret**: Generate a strong random secret:
   ```bash
   openssl rand -base64 32
   ```

2. **HTTPS Required**: The app uses secure cookies in production, which require HTTPS

3. **Snowflake Credentials**: Credentials are stored in memory only and never persisted to disk

4. **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### Cookies not working
- Ensure HTTPS is configured correctly
- Verify `X-Forwarded-Proto` header is passed by your reverse proxy
- Check that your domain has proper SSL certificates

### Session issues across restarts
- The default MemoryStore doesn't persist sessions. For production with multiple instances, use a shared session store like Redis or PostgreSQL

### Connection timeouts
- Snowflake connections may timeout; the app handles reconnection automatically
- Increase proxy timeout settings if queries take long

## Health Check

The application provides a health check endpoint:

```
GET /api/snowflake/session
```

Returns session status and can be used for load balancer health checks.
