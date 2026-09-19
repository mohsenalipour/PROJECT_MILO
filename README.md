# PROJECT_MILO

پروژهٔ صفر بوت‌کمپ Agentic AI استارکوچ: ساخت اولین ارتباط «مایلو» با یک مدل زبانی.

این پوشه در حال حاضر شامل اسناد طراحی و اجرای دو خروجی مستقل است:

1. یک چت‌بات کنسولی با Python؛
2. یک رابط چت وب با Next.js.

نسخهٔ پیاده‌سازی‌شده علاوه بر معیارهای MVP، پاسخ streaming، هویت ثابت MILO، تم روشن/تیره، history محلی وب، جهت متن فارسی/انگلیسی و لوگوی اختصاصی را نیز دارد.

هدف MVP این است که کاربر بتواند پیام بفرستد، پاسخ مدل را دریافت کند و مکالمه را در چند نوبت ادامه دهد. قابلیت‌هایی مثل دیتابیس، ورود کاربران، ابزارها، RAG، حافظهٔ بلندمدت و Agentها عمداً خارج از محدودهٔ پروژهٔ صفر هستند.

## از کجا شروع کنم؟

1. ابتدا [صورت مسئله و معیارهای پذیرش](docs/00-project-brief.md) را بخوانید.
2. برای نسخهٔ ترمینال از [راهنمای Python](docs/01-python-console.md) استفاده کنید.
3. برای نسخهٔ گرافیکی از [راهنمای Next.js](docs/02-nextjs-web.md) استفاده کنید.
4. قراردادها و تصمیم‌های مشترک در [قرارداد فنی مشترک](docs/03-shared-contract.md) آمده‌اند.
5. فایل [پرامپت شروع در VS Code](prompts/vscode-build-prompt.md) را در Coding Agent دلخواه خود قرار دهید.

## ساختار هدف مخزن

```text
PROJECT_MILO/
├── README.md
├── docs/
├── prompts/
├── apps/
│   ├── console/        # برنامهٔ Python
│   └── web/            # برنامهٔ Next.js
└── .gitignore
```

پوشه‌های `apps/console` و `apps/web` باید هنگام پیاده‌سازی ساخته شوند؛ اسناد فعلی عمداً کد پروژه را تولید نمی‌کنند.

## معماری در یک نگاه

```text
Python terminal ──┐
                  ├── OpenAI-compatible SDK ──> Provider API ──> Model
Next.js browser ──> Next.js /api/chat ────────> Provider API ──> Model
```

در نسخهٔ وب، مرورگر هیچ‌وقت مستقیماً با سرویس مدل تماس نمی‌گیرد. کلید API فقط در Route Handler سمت سرور استفاده می‌شود.

## تنظیمات مشترک

هر دو برنامه از متغیرهای زیر استفاده می‌کنند:

```dotenv
OPENAI_API_KEY=replace_me
OPENAI_BASE_URL=https://provider.example/v1
OPENAI_MODEL=provider-model-id
```

- `OPENAI_API_KEY` محرمانه است و نباید commit شود.
- `OPENAI_BASE_URL` باید از مستندات همان ارائه‌دهنده کپی شود؛ حدس نزنید که مسیر `/v1` وجود دارد.
- `OPENAI_MODEL` باید دقیقاً یکی از شناسه‌های مدل قابل‌دسترسی در حساب شما باشد.
- برای اتصال مستقیم به OpenAI می‌توان `OPENAI_BASE_URL` را حذف کرد.

## تعریف پایان پروژهٔ صفر

- هر دو برنامه پیام کاربر را می‌پذیرند.
- درخواست معتبر به مدل ارسال می‌شود.
- پاسخ مدل نمایش داده می‌شود.
- مکالمهٔ چندنوبتی کار می‌کند.
- خطاهای معمول برای کاربر قابل‌فهم هستند.
- هیچ کلید یا راز محرمانه‌ای در Git یا کد سمت مرورگر وجود ندارد.

## منابع مرجع

- [OpenAI Developer Quickstart](https://platform.openai.com/docs/quickstart)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
- [OpenAI JavaScript SDK](https://github.com/openai/openai-node)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
