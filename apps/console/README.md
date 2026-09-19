# MILO_COMM — نسخهٔ کنسولی

چت‌بات streaming پایتون با رابط مدرن Rich برای گفت‌وگوی چندنوبتی با OpenAI یا یک provider سازگار. پاسخ‌ها به‌صورت زنده از طرف MILO نمایش داده می‌شوند و تاریخچه در حافظهٔ همان اجرای برنامه نگهداری می‌شود. متن رابط و پاسخ مدل در نسخهٔ کنسولی عمداً انگلیسی است، چون Windows Terminal/PowerShell نمایش BiDi و RTL فارسی را قابل اتکا انجام نمی‌دهد؛ رابط وب همچنان فارسی را کامل پشتیبانی می‌کند.

## پیش‌نیاز

- Python 3.11 یا جدیدتر

## راه‌اندازی در PowerShell

```powershell
cd apps/console
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

اگر فرمان `py` در سیستم شما موجود نیست، خط ساخت محیط را با `python -m venv .venv` اجرا کنید.

اگر Python سیستمی ندارید اما `uv` نصب است، همین محیط را می‌توانید بدون نصب سراسری Python بسازید:

```powershell
uv venv --python 3.12 .venv
.\.venv\Scripts\Activate.ps1
uv pip install --python .\.venv\Scripts\python.exe -e ".[dev]"
Copy-Item .env.example .env
```

سپس در `.env` فقط مقادیر واقعی حساب خودتان را وارد کنید:

```dotenv
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

`OPENAI_API_KEY` و `OPENAI_MODEL` الزامی‌اند. برای OpenAI مستقیم، `OPENAI_BASE_URL` را خالی بگذارید؛ برنامه از Responses API استفاده می‌کند. اگر Base URL یک provider سازگار را وارد کنید، adapter از Chat Completions استفاده می‌کند تا با سرویس‌های واسط بیشتری سازگار باشد. URL و شناسهٔ مدل را فقط از مستندات provider خود بردارید.

### تنظیم AvalAI

مطابق [مستندات رسمی AvalAI](https://docs.avalai.ir/fa/quickstart)، مقادیر محلی `.env` برای مدل کوچک پیشنهادی به این شکل‌اند:

```dotenv
OPENAI_API_KEY=your-avalai-key
OPENAI_BASE_URL=https://api.avalai.ir/v1
OPENAI_MODEL=gpt-4o-mini
```

کلید واقعی را فقط در فایل ignored محلی قرار دهید. `gpt-4o-mini` از environment قابل‌تعویض است. چون AvalAI این مدل را برای Chat Completions مستند کرده، adapter در حضور Base URL از همان endpoint و `stream=True` استفاده می‌کند.

## اجرا

```powershell
python -m milo_console.main
```

فرمان‌های داخل برنامه:

- `/help`: نمایش راهنما
- `/history`: نمایش تاریخچهٔ نشست
- `/clear`: پاک‌کردن تاریخچه
- `exit`، `quit` یا `خروج`: پایان برنامه

## بررسی کیفیت

```powershell
pytest
ruff check .
```

تست‌ها از client جعلی استفاده می‌کنند و هیچ درخواست شبکه‌ای نمی‌فرستند. تست live AvalAI فقط به‌صورت دستی و با کلید محلی انجام می‌شود.
