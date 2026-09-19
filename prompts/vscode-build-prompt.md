# پرامپت شروع ساخت PROJECT_MILO در VS Code

متن داخل بلوک زیر را کامل در Coding Agent داخل VS Code قرار دهید. بهتر است خود پوشهٔ `PROJECT_MILO` را به‌عنوان workspace باز کنید تا Agent به همهٔ اسناد دسترسی داشته باشد.

```text
تو مهندس مسئول پیاده‌سازی PROJECT_MILO هستی. این پروژه، پروژهٔ صفر بوت‌کمپ Agentic AI استارکوچ است و باید دو خروجی مستقل اما هماهنگ بسازد:

1) یک چت‌بات کنسولی با Python؛
2) یک Chat UI با Next.js و TypeScript.

قبل از هر تغییری این فایل‌ها را کامل بخوان و آن‌ها را منبع حقیقت پروژه بدان:
- README.md
- docs/00-project-brief.md
- docs/01-python-console.md
- docs/02-nextjs-web.md
- docs/03-shared-contract.md

هدف MVP:
- دریافت پیام کاربر؛
- ارسال امن پیام و history به یک API سازگار با OpenAI؛
- نمایش پاسخ مدل؛
- ادامهٔ مکالمه در چند نوبت؛
- مدیریت خطاهای رایج؛
- عدم افشای API key.

قواعد مهم:
- ابتدا وضعیت workspace، ابزارهای نصب‌شده و فایل‌های موجود را بررسی کن و هیچ فایل متعلق به کاربر را overwrite نکن.
- کار را در apps/console و apps/web انجام بده.
- نام متغیرهای محیطی در هر دو برنامه فقط OPENAI_API_KEY، OPENAI_BASE_URL و OPENAI_MODEL باشد.
- مقدار واقعی secret نساز، حدس نزن و commit نکن. فقط فایل‌های example خالی بساز.
- نام مدل یا Base URL را hard-code نکن.
- برای اتصال مستقیم OpenAI، Responses API را ترجیح بده؛ اما اگر provider انتخابی فقط Chat Completions را پشتیبانی می‌کند، از همان استفاده کن. این تفاوت را در یک فایل adapter/client محصور کن.
- در Next.js، تماس با provider فقط در Route Handler سمت سرور انجام شود. هیچ secret یا SDK server-side وارد Client Component نشود و هیچ متغیر محرمانه‌ای NEXT_PUBLIC_ نباشد.
- MVP را ساده نگه دار: بدون database، auth، RAG، tools، MCP، agent loop یا streaming.
- رابط وب فارسی، RTL، responsive و keyboard-accessible باشد. Enter پیام را بفرستد و Shift+Enter خط جدید ایجاد کند.
- system prompt مایلو سمت سرور/لایهٔ client باشد و کاربر نتواند role=system تزریق کند.
- body ورودی، تعداد پیام‌ها و طول content را اعتبارسنجی کن.
- خطای خام provider، header یا API key را به کاربر نشان نده.
- تست‌ها نباید API واقعی را صدا بزنند؛ provider را mock/fake کن.

روش اجرا:

فاز 0 — بررسی و برنامه:
1. اسناد را بخوان.
2. ابزارهای Python، Node و package manager را بررسی کن.
3. یک برنامهٔ کوتاه و مرحله‌ای ارائه بده و سپس بدون توقف غیرضروری اجرا کن.

فاز 1 — Python console:
1. ساختار apps/console را مطابق سند بساز.
2. config validation و .env.example را اضافه کن.
3. یک تماس تک‌پیامی را پیاده کن.
4. حلقهٔ گفتگو، history، /clear، /help و exit را اضافه کن.
5. خطاها را به پیام‌های کاربرپسند تبدیل کن.
6. تست‌های بدون شبکه و README راه‌اندازی بنویس.
7. lint/test مناسب را اجرا و نتیجه را گزارش کن.

فاز 2 — Next.js web:
1. apps/web را با App Router، TypeScript و Tailwind بساز.
2. Route Handler امن POST /api/chat و schema ورودی را بساز.
3. provider client را server-only نگه دار.
4. Chat UI شامل empty، loading، success و error state بساز.
5. retry و «گفت‌وگوی جدید» را اضافه کن.
6. تست‌های لازم و README راه‌اندازی بنویس.
7. lint، test و production build را اجرا کن.

فاز 3 — بازبینی نهایی:
1. معیارهای پذیرش همهٔ اسناد را یک‌به‌یک کنترل کن.
2. repository را برای secret یا NEXT_PUBLIC_ اشتباه بررسی کن.
3. راه‌اندازی هر دو برنامه را از روی READMEها آزمایش کن.
4. فقط پس از سبز شدن بررسی‌ها، گزارشی کوتاه شامل فایل‌های مهم، فرمان‌های اجرا، نتایج تست و موارد باقی‌مانده بده.

تعریف Done:
- هر دو برنامه build/run می‌شوند؛
- مکالمهٔ چندنوبتی دارند؛
- provider با environment قابل‌تعویض است؛
- secrets امن هستند؛
- خطاها قابل‌فهم‌اند؛
- README، فایل‌های example و تست‌های بدون شبکه وجود دارند؛
- معیارهای پروژهٔ صفر و امتیاز کامل بخش API و Next.js پوشش داده شده‌اند.

اکنون اسناد را بخوان، وضعیت workspace را بررسی کن و پیاده‌سازی را از فاز 0 آغاز کن.
```

## قبل از اجرای پرامپت

سه مقدار زیر را از provider خود آماده داشته باشید، اما آن‌ها را داخل prompt ننویسید:

- API key؛
- Base URL دقیق؛
- Model ID دقیق.

وقتی Agent فایل‌های `.env.example` را ساخت، آن‌ها را به فایل محلی واقعی کپی کنید و مقادیر را فقط همان‌جا قرار دهید.

## اگر می‌خواهید فقط یک بخش ساخته شود

در ابتدای prompt اصلی یکی از جمله‌های زیر را اضافه کنید:

```text
در این مرحله فقط فاز 1، یعنی برنامهٔ کنسولی Python را اجرا کن و بعد از تحویل متوقف شو.
```

یا:

```text
در این مرحله فقط فاز 2، یعنی برنامهٔ Next.js را اجرا کن؛ فرض کن قراردادهای فاز Python منبع مرجع هستند.
```
