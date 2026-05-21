export const metadata = {
  title: "دريدود - Dridoud تطبيق تواصل اجتماعي عصري",
  description: "شارك لحظتك مع دريدود، محتواك آمن وسريع الانتشار، لا خوارزميات للتصفية ولا قيود إضافية.",
  keywords: [
    "دريدود",
    "Dridoud",
    "تطبيق دريدود",
    "منصة تواصل اجتماعي",
    "تطبيق عربي",
    "منشورات",
    "فيديو",
    "قنوات",
    "مجموعات",
  ],
  alternates: { canonical: "/" },
};

import Link from "next/link";
import Image from "next/image";
import heroBanner from "../../assets/baner.jpg";
import { homeContent } from "@/content/home";

const galleryScreenshots = homeContent.galleryScreenshots;
const comparisonRows = [
  {
    feature: "تجربة الصفحة الرئيسية",
    dridoud: "استطلاعات الرأي التصويت + نشر منشور على شكل مقال بعناوين وفقرات + صور + فيديو + بث مباشر + ملصقات Gift + الاشارة لأشخاص في منشور + منشورات نصية ومنشورات بخلفيات ملونة ",
    others: "         تجربة تعتمد على الخوارزميات والدكاء الاصطناعي في النشر والتنظيم واقتراح المنشورات في الصفحة الرئيسية كما أن الأولوية دائما للبارزين فقط.",
  },
  {
    feature: "تنوع المحتوى",
    dridoud: " تنوع المحتوى بكل المجالات والفئات بشرط أن يكون قانوني ولا يخالف شروط المجتمع ",
    others: "أنواع عديدة من المحتوى والتصفية للخوارزميات والدكاء الاصطناعي        .",
  },
  {
    feature: "نظام الفيديو",
    dridoud: "فيديوهات قصيرة وطويلة مع بث حي وعرض متسلسل.",
    others: "دعم متفاوت للفيديو؛ بعض المنصات تركز على القصير .",
  },
  {
    feature: "المجتمعات والقنوات",
    dridoud: "مجموعات، وقنوات في مكان واحد.",
    others: "الميزات موزعة أو محدودة حسب كل منصة.",
  },
  {
    feature: "الدردشة",
    dridoud: "دردشة مدمجة داخل المنصة.",
    others: "أحياناً عبر تطبيق منفصل أو بقدرات أقل.",
  },
  {
    feature: "نظام الاستكشاف",
    dridoud: "اقتراحات + هاشتاجات ومنشنات والبحث المتقدم للستكشاف منشورات المتابعين في نفس المكان.",
    others: "تجارب استكشاف متباعدة وخوارزميات أقل شفافية.",
  },
  {
    feature: "التحكم في المحتوى",
    dridoud: "إعدادات أوضح مع تصنيف المحتوى الحساس ومولدات الذكاء الاصطناعي.",
    others: "إعدادات متباينة بين منصة وأخرى وقد تكون معقدة.",
  },
  {
    feature: "تجربة المستخدم",
    dridoud: "منصة سهلة بمحتوى منظم دون قيود دون خوارزميات ودون حظر للمحتوى ",
    others: "  منصات معقدة + تشتت تركيز المستخدم بمحتويات عشوائية + ادمان غير مقبول  .",
  },
];

const downloadOptions = [
  {
    label: "Google Play",
    platform: "Android",
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v14m-4-6 4 4 4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
      </svg>
    ),
    variant: "primary",
    available: false,
  },
  {
    label: "iOS",
    platform: "iOS",
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0V8a4 4 0 0 1 4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8" />
      </svg>
    ),
    variant: "secondary",
    available: false,
  },
  {
    label: "تنزيل تطبيق دريدود بصيغة Apk",
    platform: "APK",
    href: "/apk/dridoud-v2.7.0-arm64-v8a.apk",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14v10H5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8M8 15h4" />
      </svg>
    ),
    variant: "tertiary",
    available: true,
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
              <div className="inline-flex items-center bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-5 py-2 rounded-full text-gray-700 dark:text-gray-300">
                <span className="font-semibold">دريدود Dridoud</span>
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
                  href="/apk/dridoud-v2.7.0-arm64-v8a.apk"
                  className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-green-900/30"
                >
                  <Image src="/android-white.svg" alt="Android" width={20} height={20} className="h-5 w-5" />
                  <span>تنزيل تطبيق دريدود بصيغة Apk</span>
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
      <section className="w-full py-20 sm:py-32 bg-gray-50 dark:bg-gray-900" dir="rtl" style={{ unicodeBidi: "plaintext" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              دريدود <span className="text-red-600 dark:text-red-400">vs</span> باقي تطبيقات التواصل
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              مقارنة مختصرة وعملية بدون ازدحام: عمود لدريدود وعمود لباقي التطبيقات الاجتماعية.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-right" dir="rtl" style={{ unicodeBidi: "plaintext" }}>
                <thead>
                  <tr className="bg-gray-100/90 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-5 text-base font-bold text-gray-900 dark:text-white">الميزة</th>
                    <th className="px-6 py-5 text-base font-bold text-red-700 dark:text-red-300">دريدود</th>
                    <th className="px-6 py-5 text-base font-bold text-gray-700 dark:text-gray-300">باقي تطبيقات التواصل</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-gray-200 dark:border-gray-800 last:border-b-0 ${
                        idx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50/70 dark:bg-gray-900/60"
                      }`}
                    >
                      <th className="px-6 py-5 align-top text-sm sm:text-base font-semibold text-gray-900 dark:text-white w-[22%]">
                        {row.feature}
                      </th>
                      <td className="px-6 py-5 align-top text-sm sm:text-base leading-8 bg-red-100/80 dark:bg-red-950/35 font-semibold w-[39%]" style={{ color: "#7a1020", unicodeBidi: "plaintext" }}>
                        {row.dridoud}
                      </td>
                      <td className="px-6 py-5 align-top text-sm sm:text-base leading-8 text-gray-700 dark:text-gray-300 w-[39%]">
                        {row.others}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                if (!option.available) {
                  variantClass =
                    "border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80";
                }

                return (
                option.available ? (
                  <Link
                    key={option.platform}
                    href={option.href}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg transition-colors ${variantClass}`}
                  >
                    <span className="text-base">{option.label}</span>
                  </Link>
                ) : (
                  <span
                    key={option.platform}
                    aria-disabled="true"
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg ${variantClass}`}
                  >
                    <span className="text-base">{option.label} - قريبًا</span>
                  </span>
                )
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}









