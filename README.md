# CareerBoost AI - Deployment Guide

## Quick Deploy to Vercel

### Method 1: Using Vercel CLI (Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd career-boost-deploy
   vercel
   ```

4. Follow the prompts (press Enter to accept defaults)

### Method 2: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Upload this entire `career-boost-deploy` folder as a ZIP
4. Vercel will auto-detect it's a Vite project
5. Click "Deploy"

### Method 3: Using GitHub (Most Professional)

1. Create a GitHub account (if you don't have one)
2. Create a new repository
3. Upload all files from `career-boost-deploy` folder
4. Go to https://vercel.com
5. Click "Import Project"
6. Select your GitHub repository
7. Click "Deploy"

## After Deployment

Your site will be live at: `https://your-project-name.vercel.app`

You can customize the domain in Vercel settings.

## Environment Variables (Optional)

For production, you may want to add:
- Stripe API keys (when you add payments)
- Analytics tracking codes

Add these in Vercel Dashboard > Settings > Environment Variables

## Support

If you need help, email support@yoursite.com or DM on Twitter.
