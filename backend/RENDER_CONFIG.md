# Render Deployment Configuration

## Build Command
```bash
npm install && npm run build
```

## Start Command
```bash
npm start
```

## Environment Variables (for Render)
```bash
DATABASE_URL=postgresql://postgres:habideen224236%40za@db.qfdgpfzomwphghfoginm.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-longer
NODE_ENV=production
PORT=10000

# Email Configuration
SMTP_USER=habideen1111@gmail.com
SMTP_PASS=hbya ezpo dwel mndc
SMTP_FROM_NAME=Air Condition Management System
SMTP_FROM_EMAIL=habideen1111@gmail.com

# Frontend URL (Update with actual Vercel URL later)
FRONTEND_URL=https://your-app.vercel.app

# Base URL (Update with actual Render URL)
BASE_URL=https://your-backend.onrender.com

# PromptPay Configuration
PROMPTPAY_ID=0928980434
```

## Notes
- PORT must be 10000 for Render
- DATABASE_URL already points to Supabase
- Update FRONTEND_URL after deploying to Vercel
- Update BASE_URL after getting Render URL
