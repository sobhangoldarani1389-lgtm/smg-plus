# SMG Plus

نسخه دسکتاپ SMG Overlay Studio؛ ترکیب چند URL/Overlay در یک Scene و ارائه یک Browser Source برای OBS.

## اجرای توسعه

```bash
npm install
npm start
```

## ساخت Windows

```bash
npm run dist
```

خروجی در `dist/` شامل Installer و Portable خواهد بود.

## انتشار

Workflow داخل `.github/workflows/build-windows.yml` روی Windows Runner اجرا می‌شود. با tag نسخه مثل `v1.0.1`، فایل‌های نصب به GitHub Release اضافه می‌شوند.
