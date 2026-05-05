# SocialBoost Backend — Update Package (master branch)

Ye zip aapke `socialboost-backend` repo ke **master** branch ke liye hai. Ismein 11 files hain (8 new + 3 modified).

---

## Step-by-Step via GitHub Web UI (No Git Needed!)

### Step 1: GitHub.com pe jayein
1. https://github.com/leapboostertechnology/socialboost-backend
2. Branch dropdown se **`master`** select karein
3. Naya branch banayein safety ke liye: "Branches" → "New branch" → name: `seo-cms-blog-backend` → Source: `master` → Create

### Step 2: Files Upload karein
1. Naye branch (`seo-cms-blog-backend`) pe rahein
2. Top right: **"Add file"** → **"Upload files"**
3. `backend-changes/` folder ki saari files (with folder structure) drag-drop karein
4. Commit message: `feat: SEO/CMS/Blog APIs + Sitemap + SuperAdmin seed + email OTP dev-fallback`
5. **"Commit changes"**

### Step 3: PR + Merge to Master
1. "Compare & pull request" → "Create pull request" → "Merge pull request"

### Step 4: Production Environment Variables
Apne hosting platform (DigitalOcean / Render / wherever) ke env vars mein ye add karein:

```
META_PIXEL_ID=1229012298172285
META_ACCESS_TOKEN=EAAOVx9CbNvwBRR8JZBfgr8kTMl5mhU9YW9S8DRf6LIylZAU3sjPv06jeie23pfG6sS5dWOtfQa5wCL8aMnM4QWknk6e6l67qwH5GeL6ZAvX1CmXrDpoZA5kF0s974QmC4cQ4ZCZAUFfrUGgl0ZCr3DQUaeQ4OedPgznJIAewZARfeHQMeZCs6CLgR0k9elEKMk3iuQQZDZD
SUPERADMIN_EMAIL=leapboostertechnology@gmail.com
SUPERADMIN_PASSWORD=<choose a strong password>
SUPERADMIN_FIRSTNAME=LeapBooster
SUPERADMIN_LASTNAME=Admin
```

⚠️ **Existing env vars ko mat hatana** — sirf ye 6 ADD karna hai. `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, etc. all production wale waise hi rahein.

### Step 5: Redeploy Backend
- DigitalOcean / Render / Heroku pe **manual redeploy** trigger karein from `master` branch
- Boot ke time:
  - SuperAdmin auto-promote ho jayega
  - SEO/CMS/Blog APIs available ho jayenge
  - Sitemap.xml accessible hoga

### Step 6: Verify Deployment Working
Browser/Postman se test karein:
- `GET https://your-backend-url/api/seo/about` → returns JSON with default title/description
- `GET https://your-backend-url/api/sitemap.xml` → returns XML with all pages
- `GET https://your-backend-url/api/health` → returns `{ status: 'ok' }`

---

## File Changes Summary

### 🆕 NEW Files (8)
| File | Purpose |
|------|---------|
| `models/BlogPost.js` | Blog post schema (slug, content, SEO meta, views) |
| `models/PageContent.js` | Per-page flexible content (Mixed type) |
| `models/SEOSettings.js` | Per-page SEO meta storage |
| `routes/blogRoutes.js` | Public + admin blog CRUD |
| `routes/cmsRoutes.js` | Page content management |
| `routes/seoRoutes.js` | SEO meta management |
| `routes/sitemapRoutes.js` | Dynamic /sitemap.xml + /robots.txt |
| `utils/seedSuperAdmin.js` | Auto-promotes SuperAdmin on boot |

### ✏️ MODIFIED Files (3)
| File | What Changed |
|------|--------------|
| `index.js` | Added 6 new route mounts; calls seedSuperAdmin after MongoDB connect; Google OAuth registration now conditional (only if env vars set) |
| `routes/stripe.js` | Added `GET /api/stripe/plans` (public endpoint) |
| `utils/emailService.js` | Added OTP-logging fallback when SMTP creds missing |

---

## ⚠️ Preserved (NOT TOUCHED)

✅ Google OAuth (passport-google-oauth20 + utils/googleAuthSetup.js)  
✅ Stripe payment endpoints — ZERO changes to checkout/webhook/subscriptions logic  
✅ Custom Plan Booking (/api/custombookings)  
✅ My Orders (/api/myOrders)  
✅ Content Management for homepage (/api/content)  
✅ Meta Conversions API (/api/meta-conversions)  
✅ Admin Subscriptions (/api/admin/subscriptions)  
✅ All existing models (User, Plan, Subscription, Payment, Campaign, ProcessStepContent, HeroContent, etc.)  
✅ Calendar, meetingService, googleCalendarService

---

## New API Endpoints Available After Deploy

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/seo/:pageKey` | Public |
| PUT | `/api/seo/:pageKey` | Admin |
| GET | `/api/cms/pages/:pageKey` | Public |
| PUT | `/api/cms/pages/:pageKey` | Admin |
| GET | `/api/blog?page=N` | Public |
| GET | `/api/blog/slug/:slug` | Public |
| GET | `/api/blog/admin/all` | Admin |
| POST | `/api/blog/admin` | Admin |
| PUT | `/api/blog/admin/:id` | Admin |
| DELETE | `/api/blog/admin/:id` | Admin |
| GET | `/sitemap.xml` & `/api/sitemap.xml` | Public |
| GET | `/robots.txt` & `/api/robots.txt` | Public |
| GET | `/api/stripe/plans` | Public |

---

## SuperAdmin First-Time Login

1. POST `/api/auth/login` with `{ email: "leapboostertechnology@gmail.com", password: "<your password>" }`
2. Server returns `{ requiresOTP: true }`. SMTP configured to your domain → email aayega. Otherwise → check server logs for `LOGIN OTP: NNNNNN`
3. POST `/api/auth/login` again with `{ email, otp }` → returns `{ token, user }`
4. Login pe `/admin/seo-blog` accessible hoga

---

## Production nginx (Recommended for SEO)

For `/sitemap.xml` and `/robots.txt` to be at **root** (Google standard), add to socialboosts.co nginx:

```nginx
location = /sitemap.xml {
    proxy_pass http://your-backend-host:port/sitemap.xml;
    proxy_set_header Host $host;
}
location = /robots.txt {
    proxy_pass http://your-backend-host:port/robots.txt;
    proxy_set_header Host $host;
}
```

Backend already serves both at root via `app.use('/', sitemapRoutes)` — bus nginx ko sahi route bata dena hai.

If you can't change nginx, then update `robots.txt` reference manually:
```
User-agent: *
Sitemap: https://socialboosts.co/api/sitemap.xml
```

---

## Order of Operations

1. ✅ **Frontend already deployed** (you confirmed this)
2. 📤 **Upload backend zip → master via PR → merge** (this step)
3. 🚀 **Add env vars on production hosting**
4. 🔄 **Trigger redeploy**
5. ✅ **Verify** via API test calls above

After backend is live:
- `/blog`, `/admin/seo-blog`, etc. on the frontend will be **fully functional**
- New Pixel ID `1229012298172285` will be tracking events both browser-side AND server-side via CAPI
