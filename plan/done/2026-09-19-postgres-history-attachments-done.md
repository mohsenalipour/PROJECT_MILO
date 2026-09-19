# گزارش انجام ارتقای PostgreSQL، تاریخچه و پیوست‌ها

تاریخ: ۱۴۰۵/۰۶/۲۸ (2026-09-19)

## انجام‌شده

- placeholder فارسی composer صریحاً RTL و راست‌چین شد؛ متن تایپ‌شده بر اساس محتوای فارسی/انگلیسی RTL/LTR می‌شود.
- ستون تاریخچهٔ responsive با ساخت، انتخاب و حذف conversation اضافه شد.
- PostgreSQL 17 با Docker Compose، healthcheck و volume دائمی روی پورت محلی ۵۴۳۳ اجرا شد.
- جدول‌های conversations و messages به‌شکل idempotent از لایهٔ server-only ساخته می‌شوند.
- پاسخ‌های MILO با react-markdown و GFM به HTML امن تبدیل می‌شوند؛ HTML خام اجرا نمی‌شود.
- انتخاب، preview، حذف و ارسال تصویر و فایل متنی اضافه شد.
- تصویرهای JPEG/PNG/WebP/GIF به ورودی vision و فایل‌های TXT/Markdown/CSV/JSON به متن prompt افزوده می‌شوند.
- محدودیت ۴ فایل، ۴ مگابایت برای هر فایل و ۸ مگابایت مجموع در client و schema سرور اعمال شد.
- Route Handlerهای تاریخچه و persistence پیام‌های streaming اضافه شدند.
- README اصلی و README وب با راه‌اندازی دیتابیس و محدودیت‌های پیوست به‌روز شدند.

## راستی‌آزمایی

- PostgreSQL: healthy و اتصال مستقیم psql به 127.0.0.1:5433 موفق
- Web ESLint: موفق
- Web Vitest: ۷ فایل و ۱۸ تست موفق
- Web production build: موفق
- Web HTTP smoke test: صفحه با status 200
- Web database/API smoke test: ساخت conversation و تطبیق ۲ پیام در API و PostgreSQL
- Web AvalAI smoke test: streaming واقعی با gpt-4o-mini موفق
- Console pytest: ۱۱ تست موفق
- Console Ruff: موفق
- Console AvalAI smoke test: پاسخ streaming واقعی دریافت شد
- Console compatibility: رابط، خطاها و پاسخ مدل به انگلیسی محدود شد تا مشکل BiDi/RTL در Windows Terminal حذف شود؛ live prompt انگلیسی نیز با AvalAI تأیید شد.
- Secret scan: فایل کلید track نشده، هیچ متغیر محرمانهٔ NEXT_PUBLIC_ در source وجود ندارد

## اجرای فعال

- PostgreSQL: کانتینر milo-postgres روی localhost:5433
- Web: نسخهٔ production روی http://localhost:3000
- Console: در پنجرهٔ PowerShell مستقل با تنظیمات AvalAI
