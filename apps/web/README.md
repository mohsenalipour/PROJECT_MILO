# MILO_COMM — رابط وب

رابط چت streaming با Next.js App Router، تم روشن/تیره، history محلی و جهت متن هوشمند. مرورگر فقط با `POST /api/chat` صحبت می‌کند و کلید provider هرگز وارد Client Component نمی‌شود.

## پیش‌نیاز

- Node.js 20.9 یا جدیدتر
- npm

## راه‌اندازی

```powershell
cd apps/web
npm install
Copy-Item .env.local.example .env.local
```

اگر policy پاورشل اجرای `npm.ps1` را مسدود می‌کند، در همهٔ فرمان‌ها `npm.cmd` را جایگزین `npm` کنید.

مقادیر حساب خود را در `.env.local` وارد کنید:

```dotenv
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

`OPENAI_API_KEY` و `OPENAI_MODEL` الزامی‌اند. برای OpenAI مستقیم، `OPENAI_BASE_URL` را خالی بگذارید؛ adapter سمت سرور از Responses API استفاده می‌کند. با Base URL سفارشی، adapter از Chat Completions استفاده می‌کند تا providerهای واسط سازگاری بیشتری داشته باشند. Base URL و Model ID را از مستندات provider انتخابی کپی کنید.

### تنظیم AvalAI

```dotenv
OPENAI_API_KEY=your-avalai-key
OPENAI_BASE_URL=https://api.avalai.ir/v1
OPENAI_MODEL=gpt-4o-mini
```

این مقادیر با [Quickstart رسمی AvalAI](https://docs.avalai.ir/fa/quickstart) هماهنگ‌اند. مدل همچنان با environment قابل‌تعویض است و برای `gpt-4o-mini` از Chat Completions streaming استفاده می‌شود.

## اجرا

```powershell
npm run dev
```

سپس `http://localhost:3000` را باز کنید. Enter پیام را می‌فرستد و Shift+Enter خط جدید می‌سازد.

## تجربهٔ کاربری

- پاسخ MILO به‌صورت deltaهای زنده نمایش داده می‌شود.
- حداکثر ۲۰ پیام آخر در `localStorage` مرورگر حفظ می‌شود.
- دکمهٔ «گفت‌وگوی جدید» history ذخیره‌شده را پاک می‌کند.
- تم روشن/تیره انتخاب کاربر را حفظ می‌کند.
- متن فارسی و عربی RTL و متن انگلیسی LTR رندر می‌شود.
- فونت Vazirmatn به‌صورت local داخل build قرار دارد و از CDN دریافت نمی‌شود.

## بررسی کیفیت و اجرای production

```powershell
npm run lint
npm test
npm run build
npm start
```

تست‌ها adapter را fake می‌کنند و هیچ API واقعی را صدا نمی‌زنند. Route Handler خروجی جریانی را با NDJSON امن به مرورگر می‌فرستد؛ خطاهای خام provider در این stream قرار نمی‌گیرند.
