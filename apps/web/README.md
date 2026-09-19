# MILO_COMM — رابط وب

رابط چت streaming با Next.js App Router، تاریخچهٔ PostgreSQL، تم روشن/تیره، جهت متن هوشمند، Markdown امن و پیوست تصویر/فایل متنی. مرورگر فقط با Route Handlerهای خود برنامه صحبت می‌کند و کلید provider هرگز وارد Client Component نمی‌شود.

## پیش‌نیاز

- Node.js 20.9 یا جدیدتر
- npm
- Docker Desktop با Docker Compose

## راه‌اندازی

از ریشهٔ پروژه PostgreSQL را اجرا کنید:

~~~powershell
docker compose up -d postgres
docker compose ps
~~~

دیتابیس محلی با نام کاربری، رمز و دیتابیس **milo** روی **127.0.0.1:5433** اجرا می‌شود. پورت ۵۴۳۳ عمداً انتخاب شده تا با نصب‌های محلی PostgreSQL روی پورت پیش‌فرض تداخل نداشته باشد. این credential فقط برای محیط توسعهٔ محلی است و secret سرویس بیرونی محسوب نمی‌شود. جدول‌ها در اولین درخواست به‌صورت خودکار و idempotent ساخته می‌شوند و داده‌ها در volume با نام **milo_postgres_data** باقی می‌مانند.

سپس:

~~~powershell
cd apps/web
npm install
Copy-Item .env.local.example .env.local
~~~

در **.env.local** فقط این سه مقدار را تنظیم کنید:

~~~dotenv
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
~~~

برای AvalAI:

~~~dotenv
OPENAI_API_KEY=your-avalai-key
OPENAI_BASE_URL=https://api.avalai.ir/v1
OPENAI_MODEL=gpt-4o-mini
~~~

## اجرا

~~~powershell
npm run dev
~~~

سپس **http://localhost:3000** را باز کنید. Enter پیام را می‌فرستد و Shift+Enter خط جدید می‌سازد.

## قابلیت‌ها و محدودیت پیوست

- conversationها و پیام‌ها در PostgreSQL محلی ذخیره می‌شوند و از ستون تاریخچه قابل انتخاب یا حذف‌اند.
- پاسخ MILO به‌صورت deltaهای زنده می‌رسد و Markdown/GFM به HTML امن تبدیل می‌شود؛ HTML خام اجرا نمی‌شود.
- ورودی فارسی RTL و ورودی انگلیسی LTR است؛ placeholder فارسی صریحاً راست‌چین است.
- تصویرهای JPEG، PNG، WebP و GIF به ورودی vision مدل فرستاده می‌شوند.
- فایل‌های TXT، Markdown، CSV و JSON سمت سرور decode و به متن prompt افزوده می‌شوند.
- حداکثر ۴ فایل، ۴ مگابایت برای هر فایل و ۸ مگابایت مجموع پذیرفته می‌شود.
- تم روشن/تیره در localStorage حفظ می‌شود؛ محتوای گفتگو در PostgreSQL است.

## بررسی کیفیت و production

~~~powershell
npm run lint
npm test
npm run build
npm start
~~~

تست‌ها provider و fetch مرورگر را fake می‌کنند و API واقعی را صدا نمی‌زنند. برای توقف سرویس محلی:

~~~powershell
docker compose stop postgres
~~~
