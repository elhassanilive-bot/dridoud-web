'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const copy = {
  ar: {
    eyebrow: 'تحميل',
    title: 'حمل تطبيق دريدود الآن',
    subtitle: 'اختر نسخة APK المناسبة لجهازك وابدأ تجربة دريدود فوراً. Google Play وApp Store قريباً.',
    android: 'تنزيل التطبيق من Google Play',
    ios: 'تحميل من App Store',
    apk: 'تنزيل APK مباشرة',
    androidHelper: 'يتطلب Android 9.0 فأحدث',
    iosHelper: 'متاح لأجهزة iOS 15 فأحدث',
    apkHelper: 'نسخة مستقرة بدون متجر',
    soon: 'قريبًا',
    variants: 'نسخ APK المتاحة',
    history: 'سجل الإصدارات',
    previous: 'الإصدارات السابقة',
    empty: 'لا توجد إصدارات متاحة حالياً',
    downloadVersion: 'تحميل الإصدار',
    expired: 'انتهت صلاحيته، يرجى استخدام أحدث إصدار APK',
    why: 'لماذا تحميل دريدود؟',
    whyTitle: 'ميزات تضعك في القلب',
    finalTitle: 'متاح الآن على كل الأجهزة',
    finalText: 'نجمع التطبيق مع دعم الحماية والإشعارات والتخصيص الكامل. كل ما عليك هو اختيار جهازك والبدء في التنزيل.',
    highlights: [
      ['واجهة عربية تستجيب لجميع الأجهزة.', 'متوفر لجميع الأجهزة واللغات.'],
      ['أدوات الخصوصية المتقدمة والتخصيص الشامل.', 'متوفر لجميع الأجهزة واللغات.'],
      ['دعم كامل للصوت والفيديو والملفات المتعددة.', 'متوفر لجميع الأجهزة واللغات.'],
      ['تطبيق آمن مع إشعارات فورية وتأمين الحسابات.', 'متوفر لجميع الأجهزة واللغات.'],
    ],
    apkVariants: [
      ['نسخة الأجهزة الحديثة (موصى بها)', 'ARM64-v8a • أغلب هواتف Android الحديثة', '/apk/dridoud-v2.7.0-arm64-v8a.apk'],
      ['نسخة الأجهزة الأقدم', 'armeabi-v7a • لأجهزة Android الأقدم', '/apk/dridoud-v2.7.0-armeabi-v7a.apk'],
      ['نسخة المحاكيات وبعض الأجهزة الخاصة', 'x86_64 • غالبًا للمحاكي', '/apk/dridoud-v2.7.0-x86_64.apk'],
    ],
    versions: [
      ['2.7.0', '2026-05-21', 'الإصدار الثالث من تطبيق دريدود بصيغ APK متعددة لتوافق أفضل مع مختلف الأجهزة.', '/apk/dridoud-v2.7.0-arm64-v8a.apk'],
      ['2.0.0', '2026-05-09', 'لم يعد هذا الإصدار متاحاً. يرجى تنزيل أحدث إصدار متاح.', null],
      ['1.2.1', '2026-05-04', 'لم يعد هذا الإصدار متاحاً. يرجى تنزيل أحدث إصدار متاح.', null],
    ],
  },
  en: {
    eyebrow: 'Download',
    title: 'Download Dridoud Now',
    subtitle: 'Choose the APK version that matches your device and start using Dridoud. Google Play and App Store are coming soon.',
    android: 'Get it on Google Play',
    ios: 'Download on the App Store',
    apk: 'Download APK Directly',
    androidHelper: 'Requires Android 9.0 or later',
    iosHelper: 'Available for iOS 15 or later',
    apkHelper: 'Stable version without a store',
    soon: 'Coming soon',
    variants: 'Available APK Builds',
    history: 'Version History',
    previous: 'Previous Versions',
    empty: 'No versions are available right now',
    downloadVersion: 'Download Version',
    expired: 'Expired. Please use the latest APK version.',
    why: 'Why Download Dridoud?',
    whyTitle: 'Features built around you',
    finalTitle: 'Available now for every device',
    finalText: 'The app brings protection, notifications, and customization together. Choose your device and start downloading.',
    highlights: [
      ['Responsive interface for all devices.', 'Available for supported devices and languages.'],
      ['Advanced privacy tools and full customization.', 'Available for supported devices and languages.'],
      ['Full support for audio, video, and multiple files.', 'Available for supported devices and languages.'],
      ['Secure app with instant notifications and account protection.', 'Available for supported devices and languages.'],
    ],
    apkVariants: [
      ['Modern devices build (recommended)', 'ARM64-v8a • Most modern Android phones', '/apk/dridoud-v2.7.0-arm64-v8a.apk'],
      ['Older devices build', 'armeabi-v7a • Older Android devices', '/apk/dridoud-v2.7.0-armeabi-v7a.apk'],
      ['Emulators and special devices build', 'x86_64 • Usually for emulators', '/apk/dridoud-v2.7.0-x86_64.apk'],
    ],
    versions: [
      ['2.7.0', '2026-05-21', 'The third Dridoud APK release with multiple builds for better device compatibility.', '/apk/dridoud-v2.7.0-arm64-v8a.apk'],
      ['2.0.0', '2026-05-09', 'This version is no longer available. Please download the latest version.', null],
      ['1.2.1', '2026-05-04', 'This version is no longer available. Please download the latest version.', null],
    ],
  },
};

export default function DownloadClient() {
  const { language, direction } = useLanguage();
  const t = copy[language];
  const buttons = [
    { label: t.android, helper: t.androidHelper, href: null },
    { label: t.ios, helper: t.iosHelper, href: null },
    { label: t.apk, helper: t.apkHelper, href: '/apk/dridoud-v2.7.0-arm64-v8a.apk', apk: true },
  ];

  return (
    <div className="w-full" dir={direction}>
      <section className="min-h-[70vh] w-full bg-red-900 py-20 text-white sm:py-32">
        <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-white/70">{t.eyebrow}</p>
            <h1 className="text-5xl font-bold leading-tight">{t.title}</h1>
            <p className="text-lg leading-relaxed text-white/80">{t.subtitle}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {buttons.map((button) => (
              <DownloadButton key={button.label} button={button} soon={t.soon} />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-20 dark:bg-gray-950 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-[0.4em] text-red-600">{t.variants}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {t.apkVariants.map(([label, helper, href]) => (
              <a key={href} href={href} download className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 transition hover:bg-emerald-500/25">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200">{label}</p>
                <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-100/80">{helper}</p>
              </a>
            ))}
          </div>

          <div className="mt-16 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-red-600">{t.history}</p>
              <h2 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">{t.previous}</h2>
            </div>
          </div>
          <div className="grid gap-6">
            {t.versions.map(([version, date, description, href]) => (
              <article key={version} className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-gray-900 p-6 text-white shadow-2xl dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-blue-200">Version</p>
                    <h3 className="text-2xl font-bold">{version}</h3>
                  </div>
                  <span className="text-xs uppercase tracking-[0.4em] text-green-300">{date}</span>
                </div>
                <p className="leading-relaxed text-gray-200">{description}</p>
                {href ? (
                  <a href={href} download className="mt-3 rounded-full bg-white px-4 py-2 text-center font-semibold text-gray-900 transition hover:bg-gray-100">
                    {t.downloadVersion}
                  </a>
                ) : (
                  <span className="mt-3 rounded-full bg-white/20 px-4 py-2 text-center font-semibold text-white">{t.expired}</span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-br from-gray-50 to-white py-20 dark:from-black dark:to-gray-900 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-red-600">{t.why}</p>
            <h2 className="mt-3 text-4xl font-bold text-gray-900 dark:text-white">{t.whyTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {t.highlights.map(([title, detail]) => (
              <div key={title} className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-lg font-semibold leading-relaxed text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DownloadButton({ button, soon }) {
  const ready = Boolean(button.href);
  return (
    <div className="w-full sm:flex-1">
      <a
        href={ready ? button.href : '#'}
        download={ready ? true : undefined}
        aria-disabled={!ready}
        className={`flex w-full flex-col items-center gap-3 rounded-3xl px-6 py-5 font-semibold transition ${
          button.apk
            ? 'border border-green-400 bg-green-600 text-white shadow-lg shadow-green-900/35 hover:bg-green-500'
            : 'cursor-not-allowed border border-dotted border-white/50 bg-white/10 text-white/60'
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Image src="/android-white.svg" alt="" width={28} height={28} className="object-contain" />
          </span>
          <span className="text-lg">{button.label}</span>
        </span>
        <p className="text-xs text-white/70">{button.helper}</p>
        {!ready && <p className="text-xs text-white/70">{soon}</p>}
      </a>
    </div>
  );
}
