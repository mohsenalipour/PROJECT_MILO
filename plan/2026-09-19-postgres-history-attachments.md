# برنامهٔ ارتقای تاریخچه، PostgreSQL و پیوست‌های MILO

تاریخ: ۱۴۰۵/۰۶/۲۸ (2026-09-19)

## هدف

- اصلاح جهت placeholder و تشخیص خودکار RTL/LTR ورودی
- افزودن ستون تاریخچهٔ گفت‌وگو با امکان انتخاب، ایجاد و حذف
- ذخیرهٔ conversationها و messageها در PostgreSQL محلی
- رندر امن پاسخ‌های Markdown در رابط وب
- افزودن پیوست عکس و فایل متنی با محدودیت نوع، تعداد و اندازه
- اجرای مجدد وب و کنسول و راستی‌آزمایی اتصال واقعی AvalAI

## مراحل

1. افزودن Docker Compose و schema راه‌اندازی خودکار PostgreSQL.
2. ساخت repository سمت سرور و Route Handlerهای تاریخچه.
3. توسعهٔ قرارداد chat برای `conversationId` و attachmentهای اعتبارسنجی‌شده.
4. ارسال تصویر به ورودی vision و افزودن محتوای فایل متنی به prompt در adapter سمت سرور.
5. بازطراحی ChatShell با sidebar، انتخاب conversation، مدیریت پیوست و جهت ورودی.
6. رندر پاسخ MILO با Markdown امن و GFM.
7. افزودن تست‌های بدون شبکه برای schema، API، UI و Markdown.
8. اجرای PostgreSQL، lint/test/build، smoke test وب و تست واقعی کنسول.
9. ثبت نتایج نهایی در `plan/done/`.

## محدودیت‌های امنیتی

- کلید AvalAI فقط از فایل ignored محلی به environment فرایند تزریق می‌شود.
- هیچ متغیر `NEXT_PUBLIC_` محرمانه‌ای ساخته نمی‌شود.
- فقط تصویر و فایل‌های متنی allowlist شده پذیرفته می‌شوند؛ حداکثر ۴ پیوست و ۸ مگابایت مجموع.
- HTML خام داخل Markdown اجرا نمی‌شود و خطای خام provider/database به مرورگر نمی‌رسد.
