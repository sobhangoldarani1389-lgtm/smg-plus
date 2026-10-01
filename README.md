# 🎮 SMG Plus

**SMG Plus** یک ابزار دسکتاپ برای استریمرهاست که به شما اجازه می‌دهد چندین **Overlay / Widget** را در یک Scene ترکیب کنید و در نهایت فقط با **یک Browser Source** آن را داخل OBS استفاده کنید.

> **چند Overlay → یک Scene → یک URL → یک Browser Source**

---

## ✨ قابلیت‌ها

* 🔗 ترکیب چند Overlay و Widget مبتنی بر URL
* 🖥️ ساخت یک Scene یکپارچه برای OBS
* 🌐 ارائه یک URL نهایی برای استفاده در Browser Source
* 📦 نسخه **Installer** و **Portable** برای Windows
* 🔄 پشتیبانی از سیستم Auto Update
* 🎨 رابط کاربری دسکتاپ اختصاصی SMG Plus
* ⚡ اجرای مستقل بدون نیاز به نصب Node.js برای کاربران نهایی

---

## 🎯 چرا SMG Plus؟

در OBS، استفاده از چندین Browser Source برای Overlayهای مختلف می‌تواند مدیریت Scene را سخت‌تر کند.

SMG Plus این فرآیند را ساده می‌کند:

```text
Overlay 1 ─┐
Overlay 2 ─┤
Overlay 3 ─┼──> SMG Plus ──> یک URL نهایی ──> OBS Browser Source
Overlay 4 ─┤
Overlay 5 ─┘
```

به‌جای مدیریت چند Browser Source، می‌توانید Overlayهای خود را داخل SMG Plus مدیریت و ترکیب کنید.

---

## 📥 دانلود

آخرین نسخه را از بخش **Releases** دریافت کنید:

**[Download SMG Plus v1.0.0](https://github.com/sobhangoldarani1389-lgtm/smg-plus/releases/latest)**

### Windows x64

| نسخه         | توضیح                  |
| ------------ | ---------------------- |
| **Setup**    | نصب معمولی روی Windows |
| **Portable** | اجرای مستقیم بدون نصب  |

---

## 🚀 شروع کار

بعد از نصب SMG Plus:

1. برنامه را اجرا کنید.
2. Overlay یا Widget موردنظر خود را اضافه کنید.
3. موقعیت و اندازه عناصر را تنظیم کنید.
4. Scene نهایی را ایجاد کنید.
5. URL نهایی را در OBS به‌عنوان **Browser Source** استفاده کنید.

---

## 🖥️ استفاده با OBS

در OBS یک **Browser Source** ایجاد کنید و URL تولیدشده توسط SMG Plus را وارد کنید.

سپس می‌توانید ابعاد Browser Source را مطابق Scene خود تنظیم کنید.

---

## 🔄 بروزرسانی

SMG Plus از سیستم **Auto Update** استفاده می‌کند.

نسخه‌های جدید از طریق GitHub Releases منتشر می‌شوند و برنامه می‌تواند بروزرسانی‌های جدید را دریافت کند.

---

## 🛠️ اجرای نسخه توسعه

ابتدا وابستگی‌ها را نصب کنید:

```bash
npm install
```

سپس برنامه را اجرا کنید:

```bash
npm start
```

---

## 📦 ساخت نسخه Windows

برای ساخت Installer و Portable:

```bash
npm run dist
```

فایل‌های خروجی در پوشه `dist/` قرار می‌گیرند.

---

## 🏗️ تکنولوژی

* Electron
* Node.js
* HTML / CSS / JavaScript
* electron-builder
* electron-updater

---

## 📋 Roadmap

قابلیت‌های آینده SMG Plus می‌توانند شامل موارد زیر باشند:

* [ ] مدیریت بهتر Overlayها
* [ ] امکانات بیشتر برای طراحی Scene
* [ ] ذخیره و مدیریت پروژه‌ها
* [ ] Presetهای آماده
* [ ] امکانات بیشتر برای استریمرها
* [ ] بهبود رابط کاربری
* [ ] قابلیت‌های پیشرفته‌تر برای Browser Source

---

## 🐛 گزارش مشکل و پیشنهاد قابلیت

اگر Bug، پیشنهاد یا ایده‌ای برای بهتر شدن SMG Plus دارید، می‌توانید از بخش **Issues** پروژه استفاده کنید.

---

## 📄 License

این پروژه تحت مجوز **MIT** منتشر شده است.

---

### SMG Plus

**All-in-one OBS Overlay Manager for Streamers** 🎮
