# راهنمای پیاده‌سازی رابط وب با Next.js

## هدف

یک Chat UI واقعی، راست‌به‌چپ و واکنش‌گرا که تجربه‌ای آشنا شبیه ابزارهای گفت‌وگوی هوش مصنوعی داشته باشد و از طریق یک endpoint امن سمت سرور با مدل ارتباط بگیرد.

## فناوری پیشنهادی

- Next.js با App Router؛
- TypeScript؛
- React؛
- Tailwind CSS؛
- SDK رسمی `openai` در سمت سرور؛
- `zod` برای اعتبارسنجی body؛
- Vitest یا Jest برای واحدهای مستقل؛
- Playwright فقط اگر زمان کافی وجود داشت.

## ساختار پیشنهادی

```text
apps/web/
├── README.md
├── .env.local.example
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat-shell.tsx
│   ├── message-list.tsx
│   ├── message-bubble.tsx
│   └── composer.tsx
├── lib/
│   ├── chat-schema.ts
│   ├── llm-client.ts
│   └── errors.ts
└── tests/
```

## مرز امنیتی

```text
Browser --> POST /api/chat --> server-only SDK --> provider
```

- SDK تماس با مدل فقط در `lib/llm-client.ts` و Route Handler استفاده شود.
- هیچ متغیر محرمانه‌ای پیشوند `NEXT_PUBLIC_` نداشته باشد.
- browser نباید `OPENAI_API_KEY` یا `OPENAI_BASE_URL` را بداند.
- Route Handler باید `POST` را در `app/api/chat/route.ts` پیاده کند.

## تنظیمات محیطی

```dotenv
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

فایل واقعی `.env.local` است و باید در `.gitignore` باشد. فقط `.env.local.example` بدون مقدار واقعی commit می‌شود.

## قرارداد endpoint

### درخواست

`POST /api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "سلام مایلو" },
    { "role": "assistant", "content": "سلام! آماده‌ام." },
    { "role": "user", "content": "پروژه‌ات چیست؟" }
  ]
}
```

قواعد اعتبارسنجی پیشنهادی:

- آرایه خالی نباشد؛
- فقط نقش‌های `user` و `assistant` پذیرفته شوند؛
- آخرین پیام حتماً `user` باشد؛
- هر `content` پس از trim بین ۱ و ۴۰۰۰ نویسه باشد؛
- تعداد پیام‌ها حداکثر ۲۰ باشد؛
- system prompt فقط در سرور افزوده شود.

### پاسخ موفق

```json
{
  "message": {
    "role": "assistant",
    "content": "من اولین پل ارتباطی PROJECT_MILO با یک مدل زبانی هستم."
  },
  "meta": {
    "model": "configured-model-id"
  }
}
```

### پاسخ خطا

```json
{
  "error": {
    "code": "PROVIDER_UNAVAILABLE",
    "message": "ارتباط با سرویس مدل برقرار نشد."
  }
}
```

کدهای پیشنهادی:

- `400 INVALID_REQUEST`
- `401 PROVIDER_AUTH_FAILED`
- `429 RATE_LIMITED`
- `502 PROVIDER_UNAVAILABLE`
- `500 INTERNAL_ERROR`

## رفتار رابط کاربری

### حالت خالی

- نام `MILO_COMM` و توضیح یک‌خطی نمایش داده شود.
- چند پیشنهاد کوتاه برای شروع گفتگو وجود داشته باشد.

### ارسال پیام

1. متن trim شود.
2. پیام کاربر فوراً در UI نمایش داده شود.
3. composer تا پایان درخواست غیرفعال یا کنترل‌شده باشد.
4. نشانگر «مایلو در حال فکر کردن است…» نمایش داده شود.
5. پاسخ موفق افزوده شود؛ در خطا، پیام کاربر باقی بماند و دکمهٔ تلاش مجدد ظاهر شود.

### دسترس‌پذیری

- textarea دارای label قابل‌دسترسی باشد؛
- Enter ارسال و Shift+Enter خط جدید ایجاد کند؛
- focus بعد از پاسخ به ورودی برگردد؛
- وضعیت loading با `aria-live` قابل‌اعلام باشد؛
- کنتراست رنگ‌ها و focus ring واضح باشد.

### طراحی بصری

- جهت اصلی صفحه `rtl` باشد، اما بلوک‌های کد در پاسخ‌ها `ltr` شوند.
- ظاهر صنعتی/آینده‌نگر مایلو می‌تواند با خاکستری، سبز و نور محدود ساخته شود.
- اولویت با خوانایی و سرعت است، نه انیمیشن سنگین.
- موبایل در عرض ۳۲۰ پیکسل قابل‌استفاده باشد.

## مدیریت state

برای MVP، history در state همان صفحه نگهداری شود. پایگاه داده یا Local Storage الزامی نیست. دکمهٔ «گفت‌وگوی جدید» state را پاک می‌کند.

شناسهٔ محلی برای render پیام‌ها می‌تواند در UI وجود داشته باشد، اما فقط `role` و `content` به API ارسال شوند.

## انتخاب API مدل

همان تصمیم نسخهٔ Python اعمال شود:

- برای OpenAI مستقیم، `Responses API` ترجیح دارد.
- برای provider واسط، endpoint واقعاً پشتیبانی‌شده را بررسی کنید.
- اگر تنها Chat Completions سازگار است، از همان استفاده کنید.
- جزئیات provider فقط در `lib/llm-client.ts` بماند.

## مدیریت خطا و حریم خصوصی

- متن خطای خام SDK را مستقیماً به browser برنگردانید.
- در log سرور از چاپ API key و headerها جلوگیری کنید.
- برای خطاهای موقت، UI امکان retry داشته باشد.
- درخواست‌های هم‌زمان اتفاقی با غیرفعال‌کردن ارسال یا AbortController کنترل شوند.
- تاریخچهٔ بسیار بلند قبل از ارسال محدود شود.

## تست‌های حداقلی

- schema پیام خالی و role نامعتبر را رد می‌کند.
- Route Handler برای body نامعتبر `400` می‌دهد.
- پاسخ provider به قرارداد عمومی برنامه تبدیل می‌شود.
- خطای provider متن خام یا کلید را افشا نمی‌کند.
- composer با Enter ارسال و با Shift+Enter خط جدید ایجاد می‌کند.
- شروع گفت‌وگوی جدید history را پاک می‌کند.

## چک‌لیست پایان

- [ ] Chat UI واکنش‌گرا و RTL؛
- [ ] Route Handler امن؛
- [ ] مکالمهٔ چندنوبتی؛
- [ ] loading، empty و error state؛
- [ ] دکمهٔ گفت‌وگوی جدید و retry؛
- [ ] `.env.local.example` و README؛
- [ ] عدم وجود secret در bundle؛
- [ ] تست‌ها و build موفق.

## بهبودهای بعد از MVP

این موارد فقط بعد از تکمیل معیارهای اصلی انجام شوند:

1. streaming پاسخ؛
2. رندر Markdown و code block امن؛
3. نگهداری history در Local Storage؛
4. theme روشن/تاریک؛
5. نمایش token usage یا هزینه، در صورت پشتیبانی provider.

