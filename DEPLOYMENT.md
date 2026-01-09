# 🚀 دليل النشر - Deployment Guide

## نشر على Vercel (موصى به)

Vercel هي المنصة المثالية لنشر تطبيقات Next.js.

### الخطوات

1. **إنشاء حساب على Vercel**
   - اذهب إلى: https://vercel.com
   - سجل الدخول باستخدام GitHub

2. **رفع المشروع إلى GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

3. **ربط المشروع مع Vercel**
   - اذهب إلى Vercel Dashboard
   - اضغط على "New Project"
   - اختر المستودع من GitHub
   - اضغط على "Import"

4. **إعداد المتغيرات البيئية**
   في Vercel Dashboard، أضف المتغيرات التالية:
   
   ```env
   DATABASE_URL=your_supabase_connection_string
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=generate_random_secret_here
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

5. **نشر المشروع**
   - اضغط على "Deploy"
   - انتظر حتى يكتمل النشر
   - افتح الرابط المقدم

### توليد NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

أو استخدم: https://generate-secret.vercel.app/32

---

## نشر على Netlify

### الخطوات

1. **إنشاء حساب على Netlify**
   - اذهب إلى: https://netlify.com
   - سجل الدخول باستخدام GitHub

2. **رفع المشروع**
   - اضغط على "Add new site"
   - اختر "Import an existing project"
   - اختر المستودع من GitHub

3. **إعداد Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **إضافة المتغيرات البيئية**
   - اذهب إلى Site settings → Environment variables
   - أضف جميع المتغيرات من ملف `.env`

5. **نشر المشروع**
   - اضغط على "Deploy site"

---

## نشر على Railway

Railway منصة ممتازة لنشر تطبيقات Full-Stack.

### الخطوات

1. **إنشاء حساب على Railway**
   - اذهب إلى: https://railway.app
   - سجل الدخول باستخدام GitHub

2. **إنشاء مشروع جديد**
   - اضغط على "New Project"
   - اختر "Deploy from GitHub repo"
   - اختر المستودع

3. **إضافة قاعدة بيانات PostgreSQL**
   - اضغط على "New"
   - اختر "Database"
   - اختر "PostgreSQL"
   - انسخ `DATABASE_URL`

4. **إعداد المتغيرات البيئية**
   - اذهب إلى Variables
   - أضف جميع المتغيرات

5. **نشر المشروع**
   - سيتم النشر تلقائياً

---

## نشر على DigitalOcean App Platform

### الخطوات

1. **إنشاء حساب على DigitalOcean**
   - اذهب إلى: https://digitalocean.com

2. **إنشاء App**
   - اذهب إلى Apps
   - اضغط على "Create App"
   - اختر GitHub

3. **إعداد المشروع**
   ```
   Build Command: npm run build
   Run Command: npm start
   ```

4. **إضافة قاعدة بيانات**
   - أضف PostgreSQL Database
   - ربطها مع التطبيق

5. **إعداد المتغيرات البيئية**
   - أضف جميع المتغيرات في App Settings

---

## نشر على VPS (Ubuntu)

للنشر على خادم خاص (VPS).

### المتطلبات
- Ubuntu 20.04 أو أحدث
- Node.js 18 أو أحدث
- PostgreSQL 14 أو أحدث
- Nginx

### الخطوات

1. **تثبيت Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **تثبيت PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

3. **إنشاء قاعدة بيانات**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE cardoo;
   CREATE USER cardoo_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cardoo TO cardoo_user;
   \q
   ```

4. **رفع المشروع**
   ```bash
   cd /var/www
   git clone YOUR_REPO_URL cardoo
   cd cardoo
   npm install
   ```

5. **إعداد المتغيرات البيئية**
   ```bash
   nano .env
   # أضف جميع المتغيرات
   ```

6. **تشغيل Migrations**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

7. **بناء المشروع**
   ```bash
   npm run build
   ```

8. **تثبيت PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "cardoo" -- start
   pm2 startup
   pm2 save
   ```

9. **إعداد Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/cardoo
   ```
   
   أضف:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

10. **تفعيل الموقع**
    ```bash
    sudo ln -s /etc/nginx/sites-available/cardoo /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **تثبيت SSL (Let's Encrypt)**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

---

## إعداد قاعدة البيانات للإنتاج

### Supabase (موصى به)

1. أنشئ مشروع جديد على: https://supabase.com
2. اذهب إلى Settings → Database
3. انسخ Connection String
4. استخدمه في `DATABASE_URL`

### Railway PostgreSQL

1. أضف PostgreSQL من Railway Dashboard
2. انسخ `DATABASE_URL` تلقائياً

### Managed PostgreSQL (DigitalOcean, AWS RDS, etc.)

1. أنشئ قاعدة بيانات مُدارة
2. احصل على Connection String
3. استخدمه في `DATABASE_URL`

---

## إعداد Cloudinary

1. أنشئ حساب على: https://cloudinary.com
2. اذهب إلى Dashboard
3. انسخ:
   - Cloud Name
   - API Key
   - API Secret
4. أضفها إلى المتغيرات البيئية

---

## إعداد Stripe

1. أنشئ حساب على: https://stripe.com
2. اذهب إلى Developers → API Keys
3. انسخ:
   - Publishable Key
   - Secret Key
4. لـ Webhooks:
   - اذهب إلى Developers → Webhooks
   - أضف endpoint: `https://your-domain.com/api/webhooks/stripe`
   - انسخ Webhook Secret

---

## التحقق من النشر

بعد النشر، تحقق من:

- ✅ الصفحة الرئيسية تعمل
- ✅ تسجيل الدخول يعمل
- ✅ إنشاء حجز جديد يعمل
- ✅ رفع الصور يعمل (إذا تم إعداد Cloudinary)
- ✅ الدفع يعمل (إذا تم إعداد Stripe)

---

## استكشاف الأخطاء

### خطأ: "Internal Server Error"
- تحقق من logs في Vercel/Railway
- تأكد من صحة المتغيرات البيئية
- تحقق من الاتصال بقاعدة البيانات

### خطأ: "Database connection failed"
- تحقق من `DATABASE_URL`
- تأكد من أن قاعدة البيانات تعمل
- تحقق من IP whitelist

### خطأ: "NextAuth configuration error"
- تأكد من `NEXTAUTH_URL` صحيح
- تأكد من `NEXTAUTH_SECRET` موجود

---

## الأمان في الإنتاج

### قائمة التحقق

- ✅ تغيير `NEXTAUTH_SECRET` إلى قيمة عشوائية
- ✅ استخدام HTTPS فقط
- ✅ تفعيل CORS بشكل صحيح
- ✅ تحديث جميع الحزم
- ✅ إخفاء رسائل الأخطاء التفصيلية
- ✅ تفعيل Rate Limiting
- ✅ استخدام Environment Variables للأسرار
- ✅ تفعيل Database Backups

---

## المراقبة والصيانة

### أدوات المراقبة

- **Vercel Analytics**: مدمج مع Vercel
- **Sentry**: لتتبع الأخطاء
- **LogRocket**: لتسجيل جلسات المستخدمين
- **Uptime Robot**: لمراقبة توفر الموقع

### النسخ الاحتياطي

- قم بعمل نسخ احتياطي يومي لقاعدة البيانات
- احتفظ بنسخ من المتغيرات البيئية
- استخدم Git للتحكم في الإصدارات

---

## التحديثات

لتحديث المشروع:

```bash
git pull origin main
npm install
npm run build
pm2 restart cardoo  # إذا كنت تستخدم PM2
```

---

**ملاحظة**: تأكد من اختبار جميع المميزات بعد النشر في بيئة الإنتاج.