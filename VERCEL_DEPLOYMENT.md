# Vercel Deployment Guide

This guide covers deploying the Fusion Starter application to Vercel with 100% compatibility.

## Prerequisites

- Vercel account: https://vercel.com
- GitHub/GitLab/Bitbucket repository connected to Vercel
- Required environment variables set up

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Select your repository (GitHub, GitLab, or Bitbucket)
4. Select the project root directory (default: `.`)
5. Click "Deploy"

### 2. Configure Build Settings

The project is pre-configured with `vercel.json`. Vercel will automatically:
- Use `pnpm` as the package manager (specified in `package.json`)
- Run `pnpm run build` to build both client and server
- Deploy static files from `dist/spa/`
- Deploy serverless API handlers from `api/`

**Build Command:** `pnpm run build`
**Install Command:** `pnpm install --frozen-lockfile`
**Output Directory:** `dist/spa`

### 3. Set Environment Variables

Add these variables to your Vercel project settings (Project Settings > Environment Variables):

#### Required Variables

- **OPENAI_API_KEY** - Your OpenAI API key for image generation and analysis
  - Get from: https://platform.openai.com/api-keys

- **STORY_API_KEY** - Your Story Protocol API key for IP asset management
  - Get from: https://storyapis.com

- **VITE_GUEST_PRIVATE_KEY** - Private key for guest wallet authentication
  - Should be base64 encoded for security

#### Optional Variables

- **OPENAI_VERIFIER_MODEL** - Default: `gpt-4o` (OpenAI model for verification)
- **OPENAI_PRIMARY_MODEL** - Default: `gpt-4o-mini` (OpenAI model for primary tasks)
- **VITE_PUBLIC_STORY_RPC** - Default: `https://aeneid.storyrpc.io`
- **VITE_PUBLIC_SPG_COLLECTION** - SPG Collection address: `0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc`
- **PINATA_JWT** - JWT token for Pinata IPFS storage
- **PINATA_GATEWAY** - Pinata gateway domain
- **VITE_PRIVY_APP_ID** - Privy app ID for authentication
- **PING_MESSAGE** - Custom ping message for `/api/ping` endpoint
- **APP_ORIGIN** - Your app's origin URL (for CORS configuration)

### 4. Deploy

After setting environment variables, Vercel will automatically redeploy your project.

## How It Works

### Frontend (SPA)
- Built with Vite and React
- Served as static files from `dist/spa/`
- React Router handles client-side routing
- All non-API routes fall back to `index.html` for SPA routing

### Backend (Serverless Functions)
- Express server wrapped in serverless-http
- Deployed as a single serverless function: `/api`
- All routes starting with `/api/` are handled by the function
- Static files and other routes are served before API routes

### Build Process
1. **Client Build**: `vite build` creates optimized SPA in `dist/spa/`
2. **Server Build**: `vite build --config vite.config.server.ts` creates serverless function
3. **Deployment**: Vercel combines static files and functions

## Architecture

```
Request Flow:
1. Static assets (JS, CSS) → Served from dist/spa/
2. /api/* routes → Routed to serverless function (api/index.ts)
3. All other routes → Serve dist/spa/index.html for SPA routing
```

## Troubleshooting

### Build Fails

**Issue**: "pnpm: command not found"
- **Solution**: Vercel automatically uses the package manager specified in `package.json` (pnpm)
- Ensure `packageManager` field is set correctly in package.json

**Issue**: "Module not found" errors
- **Solution**: Check that all dependencies are in package.json
- Run `pnpm install` locally and verify everything works
- Commit pnpm-lock.yaml to git

### API Routes Not Working

**Issue**: 404 on API endpoints
- **Solution**: Ensure environment variables are set (some endpoints require API keys)
- Check `/api/_debug_openai` to verify OPENAI_API_KEY is loaded
- Check server logs in Vercel dashboard

### Static Files Not Serving

**Issue**: Missing CSS/JS or 404 on assets
- **Solution**: Verify `dist/spa/` directory exists after build
- Check `vercel.json` routing rules are correct
- Ensure build command runs `build:client` first

### CORS Issues

**Issue**: Frontend can't call API
- **Solution**: Check CORS configuration in `server/index.ts`
- Ensure `APP_ORIGIN` environment variable is set if needed
- Vercel preview and production URLs are automatically allowed

## Performance Tips

1. **Image Optimization**: The app uses `sharp` for image processing. Consider using Vercel's image optimization for better performance.

2. **Function Timeout**: Serverless functions have a timeout limit. For long-running operations:
   - Consider using Background Functions
   - Implement request timeouts in your API endpoints

3. **Cold Starts**: To minimize cold starts:
   - Ensure dependencies are tree-shaked during build
   - Use lightweight alternatives for heavy libraries

## Security Best Practices

1. **Environment Variables**: Always use Vercel's environment variable settings, not hardcoded values
2. **API Keys**: Never commit `.env` files or API keys to git
3. **CORS**: Configured to only allow your domain and preview domains
4. **Headers**: Security headers are set in the Express middleware

## Custom Domain

To use a custom domain:
1. Go to Project Settings > Domains
2. Add your domain
3. Update your domain's DNS settings to point to Vercel
4. Environment variables using your domain will need `APP_ORIGIN` updated

## Rollback

To rollback to a previous deployment:
1. Go to Vercel dashboard
2. Find the deployment you want to restore
3. Click the three dots menu
4. Select "Promote to Production"

## Support

For Vercel-specific issues:
- Visit: https://vercel.com/docs
- Check: https://vercel.com/support

For application-specific issues:
- Check server logs in Vercel dashboard
- Review build logs for errors
- Test locally with `pnpm dev` before pushing
