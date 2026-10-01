# سیستم آپدیت SMG Plus

SMG Plus دسکتاپ با `electron-updater` آماده دریافت آپدیت از GitHub Releases است.

در `package.json` مقصد انتشار فعلاً روی `sobhangoldarani1389-lgtm/smg-plus` تنظیم شده است. اگر مخزن نهایی نام دیگری دارد، owner/repo را قبل از اولین Release تغییر دهید.

برای انتشار نسخه جدید:
1. مقدار `version` در package.json را افزایش دهید.
2. یک tag مانند `v1.0.1` بسازید و push کنید.
3. GitHub Actions روی Windows Installer و Portable را می‌سازد و Release را ایجاد می‌کند.
4. نسخه نصب‌شده با `electron-updater` نسخه جدید را بررسی و دانلود می‌کند.

اطلاعات صحنه‌ها در `%APPDATA%/SMG Plus/data/scenes.json` ذخیره می‌شود و با آپدیت برنامه پاک نمی‌شود.
