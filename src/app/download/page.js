import Image from "next/image";
import { downloadContent } from "@/content/download";

export const metadata = {
  title: "تحميل دريدود",
  description: "الصفحة الرسمية لتحميل تطبيق دريدود على Android وiOS بالإضافة إلى نسخة APK التجريبية.",
  alternates: { canonical: "/download" },
};

const downloadButtons = [
  {
    id: "android",
    label: "تحميل من Google Play",
    helper: "يتطلب Android 9.0 فأحدث",
    link: downloadContent.links.android,
    logo: "https://img.icons8.com/ios-filled/144/ffffff/android-os.png",
    alt: "شعار Android",
  },
  {
    id: "ios",
    label: "تحميل من App Store",
    helper: "متاح لأجهزة iOS 15 فأحدث",
    link: downloadContent.links.ios,
    icon: (className) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M16.7 12.4c0-2 1.6-3 1.7-3.1-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.4 2-.9 1.6-.2 4 .7 5.3.5.7 1 1.5 1.8 1.5s1.1-.5 2.1-.5c1 0 1.3.5 2.1.5.8 0 1.4-.8 1.8-1.5.6-.9.9-1.9.9-2 .1 0-1.7-.7-1.7-2.6Zm-2-6c.4-.5.7-1.2.6-1.9-.7 0-1.5.5-2 .9-.4.5-.8 1.1-.7 1.8.8.1 1.6-.4 2.1-.8Z" />
      </svg>
    ),
    alt: "شعار Apple",
  },
  {
    id: "apk",
    label: "تنزيل APK مباشرة",
    helper: "نسخة مبدئية بدون متجر",
    link: downloadContent.links.apk,
    logo: "https://img.icons8.com/ios-filled/144/ffffff/apk.png",
    alt: "ملف APK",
  },
];

const highlightIcons = {
  responsive: (className) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="4" width="12" height="16" rx="3" />
      <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
    </svg>
  ),
  privacy: (className) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 6v5c0 5 3.5 7 7 7s7-2 7-7V6l-7-3z" />
      <path d="M12 11v4" strokeLinecap="round" />
      <path d="M9 14h6" strokeLinecap="round" />
    </svg>
  ),
  media: (className) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="m10 9 5 3-5 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  security: (className) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="9" width="12" height="10" rx="3" />
      <path d="M12 9V7" strokeLinecap="round" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  ),
};

function DownloadButton({ button }) {
  const ready = Boolean(button.link);

  return (
    <div className="w-full sm:flex-1">
      <button
        disabled={!ready}
        className={`flex flex-col items-center gap-3 w-full rounded-3xl px-6 py-5 font-semibold transition ${
          ready
            ? "bg-white/20 text-white border border-white/40 hover:bg-white/30 backdrop-blur"
            : "bg-white/10 text-white/60 border border-dotted border-white/50 cursor-not-allowed"
        }`}
      >
        <span className="flex items-center gap-3">
          {button.logo && (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Image src={button.logo} alt={button.alt} width={28} height={28} className="object-contain" />
            </span>
          )}
          {button.icon && !button.logo && (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
              {button.icon("h-12 w-12")}
            </span>
          )}
          <span className="text-lg text-left">{button.label}</span>
        </span>
        {button.helper && <p className="text-xs text-white/70">{button.helper}</p>}
        <span className="text-xs tracking-[0.35em] uppercase text-white/70">{ready ? 'تنزيل' : 'قريباً'}</span>
      </button>
    </div>
  );
}

function AppVersionCard({ version }) {
  const available = Boolean(version.downloadLink);
  return (
    <article className="bg-gray-900 dark:bg-gray-800 text-white rounded-3xl p-6 shadow-2xl border border-white/5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-blue-200">إصدار</p>
          <h3 className="text-2xl font-bold">{version.version}</h3>
        </div>
        <span className="text-xs uppercase tracking-[0.4em] text-green-300">{version.date}</span>
      </div>
      <p className="text-gray-200 leading-relaxed">{version.description}</p>
      <button
        disabled={!available}
        className={`mt-3 w-full rounded-full px-4 py-2 font-semibold transition ${
          available
            ? "bg-white text-gray-900 hover:bg-gray-100"
            : "bg-white/20 text-white cursor-not-allowed"
        }`}
      >
        {available ? "تحميل الإصدار" : "تحديث قادم"}
      </button>
    </article>
  );
}

export default function DownloadPage() {
  const versions = downloadContent.versions;

  return (
    <div className="w-full">
      <section className="w-full min-h-[70vh] bg-gradient-to-br from-red-600 to-rose-700 text-white py-20 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div> 
            <p className="text-xs uppercase tracking-[0.6em] text-white/70">تحميل</p>
            <h1 className="text-5xl font-bold leading-tight">{downloadContent.hero.title}</h1>
            <p className="text-lg text-white/80 leading-relaxed">{downloadContent.hero.subtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {downloadButtons.map((button) => (
              <DownloadButton key={button.id} button={button} />
            ))}
          </div>
          <p className="text-sm text-white/70">
            جميع الروابط ستُفعّل تلقائياً عند توفرها. إذا لم تكن مرتبطة بعد، تعرض الأزرار حالة قريباً.
          </p>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-red-600">سجل الإصدارات</p>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">الإصدارات السابقة</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              كل إصدار يُضاف يظهر مباشرة دون الحاجة إلى إعادة التصميم.
            </span>
          </div>
          {versions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">لا توجد إصدارات متاحة حالياً</p>
              <p className="text-gray-500 dark:text-gray-400 mt-3">
                يعمل فريق دريدود على تجهيز أول نسخة. سيُعرض سجل التحديثات فور توفره.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {versions.map((version) => (
                <AppVersionCard key={version.version} version={version} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.4em] text-red-600">لماذا تحميل دريدود؟</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-3">ميزات تضعك في القلب</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {downloadContent.highlights.map((item) => (
              <div
                key={item.key}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
              >
                <span className="text-red-600 dark:text-red-200">{highlightIcons[item.key]?.("h-7 w-7")}</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">{item.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-gradient-to-br from-red-800 via-red-900 to-rose-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold">متاح الآن على كل الأجهزة</h2>
          <p className="text-lg text-red-100 leading-relaxed">
            نجمع التطبيق مع دعم الحماية والإشعارات والتخصيص الكامل. كل ما عليك هو اختيار جهازك والبدء في التنزيل.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <DownloadButton button={downloadButtons[0]} />
            <DownloadButton button={downloadButtons[1]} />
            <DownloadButton button={downloadButtons[2]} />
          </div>
        </div>
      </section>
    </div>
  );
}
