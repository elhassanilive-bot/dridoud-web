export const metadata = {
  title: "دريدود - Dridoud تطبيق تواصل اجتماعي عصري",
  description: "شارك لحظتك مع دريدود، محتواك آمن وسريع الانتشار، لا خوارزميات للتصفية ولا قيود إضافية.",
  alternates: { canonical: "/" },
};

import Link from "next/link";
import Image from "next/image";
import heroBanner from "../../assets/baner.jpg";
import { homeContent } from "@/content/home";

const galleryScreenshots = homeContent.galleryScreenshots;
const comparisonPlatforms = [
  { key: "dridoud", label: "دريدود", color: "text-red-600 dark:text-red-400" },
  { key: "facebook", label: "Facebook", color: "text-blue-600" },
  { key: "instagram", label: "Instagram", color: "text-pink-500" },
  { key: "twitter", label: "Twitter (X)", color: "text-sky-500" },
  { key: "threads", label: "Threads", color: "text-fuchsia-600" },
  { key: "tiktok", label: "TikTok", color: "text-teal-500" },
];
const comparisonRows = [
  {
    feature: "تجربة الصفحة الرئيسية",
    dridoud: "منشورات + صور + فيديو + صوت في مكان واحد",
    facebook: "منشورات ونصوص مع بعض الصور والروابط",
    instagram: "صور وفيديو قصير فقط مع وصف بسيط",
    twitter: "تغريدات قصيرة وروابط",
    threads: "نقاشات نصية محدودة",
    tiktok: "فيديوهات قصيرة فقط",
  },
  {
    feature: "تنوع المحتوى",
    dridoud: "صور، فيديوهات، GIF، صوتيات، استطلاعات، بث مباشر",
    facebook: "صور، روابط، فيديوهات قصيرة وطويلة",
    instagram: "صور وفيديوهات قصيرة",
    twitter: "نصوص وروابط وصور بسيطة",
    threads: "نصوص وروابط قصيرة",
    tiktok: "فيديوهات قصيرة فقط",
  },
  {
    feature: "نظام الفيديو",
    dridoud: "فيديوهات قصيرة وطويلة مع بث حي وعرض متسلسل",
    facebook: "بث مباشر ومشاهدات فيديو",
    instagram: "Reels وفيديوهات قصيرة",
    twitter: " فيديو بسيط تقريباً",
    threads: "لا يدعم الفيديو المعقد",
    tiktok: "فيديوهات قصيرة فقط",
  },
  {
    feature: "المجتمعات والمجموعات",
    dridoud: "مجموعات، مجتمعات، قنوات في مكان واحد",
    facebook: "مجموعات فقط",
    instagram: "مجتمعات ضعيفة",
    twitter: "قنوات رسمية فقط",
    threads: "غير مخصص للمجتمعات",
    tiktok: "لا يوجد نظام مجتمعات متكامل",
  },
  {
    feature: "القنوات لصناع المحتوى",
    dridoud: "قنوات مخصصة للعلامات التجارية والمبدعين",
    facebook: "صفحات فقط",
    instagram: "حسابات تجارية عامة",
    twitter: "تحقق بسيط",
    threads: "لا توجد قنوات رسمية",
    tiktok: "قناة + حساب واحد فقط",
  },
  {
    feature: "نظام الاستكشاف",
    dridoud: "اقتراحات + منشورات المتابعين في نفس المكان",
    facebook: "خوارزميات منفصلة",
    instagram: "صفحة Explore فقط",
    twitter: "قائمة متداخلة",
    threads: "تعتمد على الحسابات المدعوة",
    tiktok: "فيديوهات مقترحة فقط",
  },
  {
    feature: "الدردشة",
    dridoud: "دردشة مدمجة داخل المنصة",
    facebook: "تطبيق Messenger منفصل",
    instagram: "رسائل داخل التطبيق ولكن محدودة",
    twitter: "رسائل خاصة فقط",
    threads: "غير مدمج بالكامل",
    tiktok: "رسائل محدودة وعشوائية",
  },
  {
    feature: "القصص",
    dridoud: "دعم كامل للقصص مع استمرارية المنشورات",
    facebook: "قصص مختصرة",
    instagram: "قصص قوية لكن بدون تفاعل متقدم",
    twitter: "غير مخصص للقصص",
    threads: "قصص نصية فقط",
    tiktok: "قصص فيديو قصيرة فقط",
  },
  {
    feature: "التحكم في المحتوى",
    dridoud: "تحديد محتوى حساس ومولد بالذكاء الاصطناعي",
    facebook: "تحكم محدود",
    instagram: "تعلم آلي ولكن غير واضح",
    twitter: "ازالة يدوي جزئي",
    threads: "إعدادات جديدة وغير مستقرة",
    tiktok: "تحكم آلي مع فلاتر قليلة",
  },
  {
    feature: "الخصوصية",
    dridoud: "إعدادات خصوصية متقدمة وتحكم كامل",
    facebook: "إعدادات معقدة",
    instagram: "تحكم بسيط فقط",
    twitter: "خيار عام فقط",
    threads: "محدود بسبب البيانات المشتركة",
    tiktok: "خصائص إفتراضية ثم ندخل في التعقيد",
  },
  {
    feature: "التفاعل",
    dridoud: "إعجاب + تعليق + مشاركة + استطلاع",
    facebook: "تعليقات ومشاركة فقط",
    instagram: "إعجاب وتعليق محدود",
    twitter: "إعجاب وتعليق ونشر",
    threads: "نشر فقط",
    tiktok: "إعجاب وتعليق شخصي",
  },
  {
    feature: "البحث",
    dridoud: "بحث شامل عن أشخاص، منشورات، وسوم",
    facebook: "بحث ضمن المجموعات",
    instagram: "بحث بالهاشتاق فقط",
    twitter: "بحث عن حسابات فقط",
    threads: "بحث محدود",
    tiktok: "بحث في الفيديوهات فقط",
  },
  {
    feature: "التعدد اللغوي",
    dridoud: "يدعم عدة لغات بسلاسة",
    facebook: "يدعم اللغات الأساسية فقط",
    instagram: "دعم محدود",
    twitter: "يدعم عدة لغات ولكن معقد",
    threads: "دعم إنجليزي في الغالب",
    tiktok: "ترجمة آلية فقط",
  },
  {
    feature: "تجربة المستخدم",
    dridoud: "منصة واحدة لكل شيء",
    facebook: "تعدد تطبيقات ومهام",
    instagram: "منصة منفردة للصور",
    twitter: "منصة لترندات سريعة",
    threads: "تجربة جديدة غير مكتملة",
    tiktok: "تجربة ترفيهية فقط",
  },
];
const downloadOptions = [
  {
    label: "Download on Google Play",
    platform: "Android",
    href: "/download",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v14m-4-6 4 4 4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
      </svg>
    ),
    variant: "primary",
  },
  {
    label: "Download on iOS",
    platform: "iOS",
    href: "/download",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0V8a4 4 0 0 1 4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8" />
      </svg>
    ),
    variant: "secondary",
  },
  {
    label: "Download APK",
    platform: "APK",
    href: "/download/apk",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14v10H5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8M8 15h4" />
      </svg>
    ),
    variant: "tertiary",
  },
];

function ScreenshotCard({ item }) {
  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-3 shadow-sm">
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={item.src}
          alt={`لقطة شاشة: ${item.title}`}
          width={360}
          height={720}
          className="w-full h-auto"
          priority={item.priority ?? item.subtitle === "Home"}
        />
      </div>
      <div className="mt-3 text-center">
        <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="w-full">
      {/* 1) Hero */}
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-full text-gray-700 dark:text-gray-300">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-700 text-white font-bold">
                  D
                </span>
                <span className="font-semibold">{homeContent.hero.badgeName}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mt-6 mb-6 leading-tight">
                {homeContent.hero.title.prefix}{" "}
                <span className="text-red-700 dark:text-red-500">{homeContent.hero.title.highlight}</span>{" "}
                {homeContent.hero.title.suffix}
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {homeContent.hero.description}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="http://dridoud/download"
                  className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {homeContent.hero.ctaPrimary}
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {homeContent.hero.ctaSecondary}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src={heroBanner}
                  alt="Dridoud banner"
                  width={1200}
                  height={900}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

{/* 2) Screenshots */}
      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              لقطات شاشة <span className="text-red-700 dark:text-red-500">التطبيق</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              لقطات من الواجهات الرئيسية: الصفحة الرئيسية، الرسائل، القصص، المجموعات، والملف الشخصي.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-6 snap-x snap-mandatory pb-2">
              {galleryScreenshots.map((s) => (
                <div key={s.subtitle} className="snap-start shrink-0 w-72">
                  <ScreenshotCard item={s} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Comparison */}
      <section className="w-full py-20 sm:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              دريدود <span className="text-red-600 dark:text-red-400">vs</span> المنصات الاجتماعية الأخرى
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              دريدود يجمع كل الميزات في منصة واحدة، يمنحك التحكم الكامل، ويوازن بين الترفيه والتواصل وصناعة المحتوى دون
              فرض تجربة محدودة.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm text-gray-700 dark:text-gray-300 border-separate border-spacing-0 rounded-3xl shadow-lg">
              <thead>
                <tr className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <th className="sticky left-0 bg-white dark:bg-gray-950 px-6 py-4 text-lg font-semibold text-gray-800 dark:text-white text-left">
                    الميزة
                  </th>
                  {comparisonPlatforms.map((platform) => (
                    <th
                      key={platform.key}
                      className={`px-6 py-4 text-left font-semibold text-sm uppercase tracking-[0.3em] border-l border-gray-200 dark:border-gray-800 ${platform.color}`}
                    >
                      {platform.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}`}
                  >
                    <th className="px-6 py-4 text-base font-semibold text-gray-900 dark:text-white text-left">
                      {row.feature}
                    </th>
                    {comparisonPlatforms.map((platform) => (
                      <td
                        key={`${row.feature}-${platform.key}`}
                        className={`px-6 py-4 text-sm leading-relaxed border-l border-gray-200 dark:border-gray-800 ${
                          platform.key === "dridoud"
                            ? "bg-red-50 dark:bg-red-900/60 text-red-700 dark:text-red-100 font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row[platform.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5) Why Dridoud */}
      <section className="w-full py-20 sm:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {homeContent.why.heading.prefix}{" "}
              <span className="text-red-700 dark:text-red-500">{homeContent.why.heading.highlight}</span>
              {homeContent.why.heading.suffix}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {homeContent.why.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {homeContent.why.items.map((i) => (
              <div key={i.title} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{i.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6) Download */}
      <section className="w-full py-20 sm:py-32 bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 sm:p-14 text-center shadow-xl">
            <p className="text-sm uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">تنزيل</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{homeContent.download.heading}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">{homeContent.download.sub}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {downloadOptions.map((option) => {
                let variantClass = "border-transparent bg-gray-900 dark:bg-red-600 text-white hover:bg-gray-800 dark:hover:bg-red-500";
                if (option.variant === "secondary") {
                  variantClass =
                    "border-gray-200 dark:border-gray-700 bg-white text-gray-900 dark:bg-gray-900/70 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800";
                } else if (option.variant === "tertiary") {
                  variantClass =
                    "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 shadow-sm";
                }

                return (
                <Link
                  key={option.platform}
                  href={option.href}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg transition-colors ${variantClass}`}
                >
                  <span className="text-base">{option.label}</span>
                </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

