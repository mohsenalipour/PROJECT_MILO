# برنامهٔ ارتقای PROJECT_MILO: AvalAI، Streaming و تجربهٔ کاربری

تاریخ: ۱۴۰۵/۰۶/۲۸ (2026-09-19)

## هدف

ارتقای هر دو خروجی پروژه به یک تجربهٔ مدرن و قابل‌ارائه با اتصال واقعی AvalAI، پاسخ جریانی از طرف شخصیت MILO، تاریخچهٔ محلی، تم روشن/تیره، جهت متن هوشمند و هویت بصری مستقل؛ سپس انتشار امن به‌صورت repository عمومی در حساب `mohsenalipour`.

## فاز ۰ — مستندات و تصمیم‌های مجاز

منابع رسمی:

- [AvalAI Quickstart](https://docs.avalai.ir/fa/quickstart)
- [AvalAI OpenAI models](https://docs.avalai.ir/fa/providers/openai)
- [AvalAI streaming responses](https://docs.avalai.ir/fa/guides/streaming-responses)
- [AvalAI Chat Completions](https://docs.avalai.ir/fa/api-reference/chat)

APIهای مجاز و مستند:

- Base URL: `https://api.avalai.ir/v1`
- مدل هدف اولیه: `gpt-4o-mini`، همچنان از `OPENAI_MODEL` قابل‌تغییر
- Python/TypeScript SDK: `OpenAI(..., base_url/baseURL=...)`
- مدل `gpt-4o-mini` در مستندات AvalAI با `chat.completions.create(...)` آمده است و ممکن است روی Responses فعال نباشد.
- Streaming در Chat Completions با `stream=True` / `stream: true` و delta در `choices[0].delta.content`
- Streaming در Responses با رویداد `response.output_text.delta`

ضدالگوها:

- hard-code کردن کلید، مدل یا Base URL در کد برنامه
- قرار دادن کلید در Client Component، bundle، log یا Git
- استفاده از Responses برای `gpt-4o-mini` بدون اثبات پشتیبانی provider
- افزودن پیام ناقص به history پس از شکست stream
- ارسال role=`system` از مرورگر

## فاز ۱ — اتصال واقعی و Streaming کنسول

- تبدیل provider کنسول به iterator جریانی با پشتیبانی Chat Completions برای Base URL سفارشی و Responses برای OpenAI مستقیم
- جمع‌کردن deltaها و commit تاریخچه فقط پس از تکمیل موفق
- ارتقای CLI با Rich: header برند، prompt خوانا، spinner/stream، راهنمای فرمان‌ها و نمایش خطای کنترل‌شده
- تقویت system prompt تا تمام پاسخ‌ها صریحاً از هویت MILO باشند
- تست اتصال واقعی AvalAI با کلید محلی `prompts/keys/AvalAI.txt` فقط در حافظهٔ فرایند

راستی‌آزمایی:

- تست‌های fake بدون شبکه برای deltaها، history موفق/ناموفق و محدودیت ۲۰ پیام
- اجرای live کوتاه با `OPENAI_BASE_URL` و `OPENAI_MODEL=gpt-4o-mini`
- عدم چاپ کلید یا خطای خام

## فاز ۲ — Streaming و UX وب

- تبدیل `POST /api/chat` به جریان NDJSON امن روی HTTP با eventهای `delta`، `done` و `error`
- خواندن تدریجی stream در Client Component و نمایش لحظه‌ای پاسخ MILO
- حفظ retry، abort و جلوگیری از درخواست هم‌زمان
- ذخیرهٔ history در `localStorage` با سقف ۲۰ پیام و امکان پاک‌سازی کامل
- تم روشن/تیره با حفظ انتخاب کاربر
- تشخیص جهت هر پیام: فارسی/عربی RTL و انگلیسی LTR
- استفادهٔ local و self-hosted از فونت Vazirmatn
- به‌روزرسانی responsive UI و accessibility

راستی‌آزمایی:

- تست parser جریان، Route Handler، retry، history محلی، theme و جهت متن
- ESLint، Vitest و production build
- probe اجرای production و بررسی bundle برای نبود secret

## فاز ۳ — هویت بصری

- تولید لوگوی bitmap اختصاصی با silhouette سادهٔ ربات/حرف M، رنگ سبز-فیروزه‌ای و پس‌زمینهٔ transparent
- ذخیره در `apps/web/public/` و استفاده در header/metadata
- استفاده از نسخهٔ متنی هماهنگ در کنسول

راستی‌آزمایی:

- بررسی فایل نهایی، شفافیت و نمایش صحیح در light/dark
- نبود متن مخدوش، watermark یا نشان تجاری ثالث

## فاز ۴ — مستندات، امنیت و انتشار

- به‌روزرسانی READMEهای هر دو برنامه برای AvalAI، streaming، theme و history
- حفظ `.env.example` و `.env.local.example` به‌صورت خالی
- ثبت نتیجه در `plan/done/`
- اسکن source و client bundle برای secret و `NEXT_PUBLIC_`
- initialize کردن Git، commit فایل‌های مجاز، ساخت repository عمومی `mohsenalipour/PROJECT_MILO` و push بدون `prompts/keys/`

راستی‌آزمایی نهایی:

- Python: test + lint + اجرای واقعی کوتاه
- Web: lint + test + build + HTTP smoke test
- `git status` پاک و بررسی remote عمومی
- تأیید اینکه فایل کلید و envهای واقعی در commit حضور ندارند

