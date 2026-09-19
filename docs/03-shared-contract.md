# قرارداد فنی و تصمیم‌های مشترک

این سند مانع می‌شود نسخهٔ Python و Next.js به دو پروژه با رفتار متفاوت تبدیل شوند.

## واژگان

| واژه | معنی |
|---|---|
| MILO | شخصیت دستیار و هویت محصول |
| MILO_COMM | لایهٔ گفت‌وگوی پروژه |
| Provider | OpenAI یا سرویس واسط OpenAI-compatible |
| Model ID | نام دقیق مدل در provider انتخابی |
| Session | تاریخچهٔ موقت یک اجرای ترمینال یا یک صفحهٔ وب |

## قرارداد پیام

نوع مشترک مفهومی:

```text
Message {
  role: "user" | "assistant"
  content: non-empty string
}
```

قواعد:

- نقش `system` بخشی از ورودی کاربر نیست و در لایهٔ provider افزوده می‌شود.
- whitespace ابتدا و انتهای پیام حذف می‌شود.
- پیام خالی رد می‌شود.
- تاریخچه حداکثر ۲۰ پیام آخر را به provider می‌فرستد.
- فقط پاسخ کامل و موفق به history افزوده می‌شود.

## قرارداد تنظیمات

هر دو برنامه دقیقاً از این نام‌ها استفاده می‌کنند:

| متغیر | الزامی | توضیح |
|---|---|---|
| `OPENAI_API_KEY` | بله | کلید provider |
| `OPENAI_MODEL` | بله | شناسهٔ مدل |
| `OPENAI_BASE_URL` | برای واسط‌ها | URL پایهٔ مستندشده توسط provider |

نام provider در کد hard-code نشود. این تصمیم باعث می‌شود تغییر بین OpenAI، AvalAI، Metis یا یک سرویس سازگار دیگر فقط با تنظیم محیط یا تغییر کوچک adapter انجام شود.

## سیاست سازگاری API

«OpenAI-compatible» تضمین نمی‌کند تمام endpointهای جدید OpenAI پشتیبانی شوند. بنابراین قبل از نوشتن کد:

1. مستندات provider انتخابی بررسی شود.
2. یک درخواست بسیار کوچک آزمایشی اجرا شود.
3. روش موفق در README ثبت شود: Responses یا Chat Completions.
4. نام مدل و Base URL هرگز حدس زده نشود.

## نگاشت خطا

هر دو خروجی باید خطاها را با زبان یکسان توضیح دهند:

| کد داخلی | معنی | قابل تلاش مجدد؟ |
|---|---|---|
| `CONFIG_MISSING` | تنظیمات ناقص | بعد از اصلاح تنظیمات |
| `AUTH_FAILED` | کلید نامعتبر | خیر، تا اصلاح کلید |
| `MODEL_NOT_FOUND` | مدل/endpoint ناسازگار | خیر، تا اصلاح تنظیمات |
| `RATE_LIMITED` | محدودیت نرخ یا اعتبار | بله، بسته به provider |
| `PROVIDER_TIMEOUT` | timeout یا قطع شبکه | بله |
| `PROVIDER_ERROR` | خطای عمومی upstream | معمولاً بله |
| `INVALID_INPUT` | ورودی نامعتبر کاربر | بعد از اصلاح ورودی |

## سیاست secrets

- secrets فقط در `.env` یا `.env.local` محلی هستند.
- فایل‌های example مقدار واقعی ندارند.
- هیچ secret در screenshot، commit، log، error response یا prompt قرار نمی‌گیرد.
- در صورت افشای اتفاقی، کلید باید فوراً revoke و جایگزین شود؛ حذف از آخرین commit کافی نیست.

## تصمیم‌های ساده‌ساز MVP

| موضوع | تصمیم MVP | دلیل |
|---|---|---|
| ذخیرهٔ history | حافظهٔ فرایند/صفحه | حذف نیاز به دیتابیس |
| streaming | فعلاً خیر | کاهش پیچیدگی و ریسک provider |
| auth کاربر | خیر | خارج از صورت مسئله |
| Markdown | متن ساده | کاهش ریسک XSS و وابستگی |
| retry خودکار | محدود یا هیچ | جلوگیری از هزینهٔ پنهان |
| model | از environment | سازگاری با provider |

## ترتیب توسعه

```text
Config validation
      ↓
Single-turn provider call
      ↓
Multi-turn history
      ↓
Friendly errors
      ↓
Console acceptance
      ↓
Next.js API route
      ↓
Chat UI
      ↓
Tests + security review
```

## شواهد لازم برای تحویل

- خروجی تست‌های Python؛
- خروجی lint/test/build وب؛
- screenshot یا ویدیوی کوتاه از مکالمهٔ چندنوبتی؛
- README راه‌اندازی بدون secret؛
- لینک repository یا فایل ZIP مطابق سامانهٔ بوت‌کمپ.

