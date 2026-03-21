export const metadata = {
  title: 'مميزات دريدود',
  description: 'استكشف أقسام دريدود: الرئيسية، الاستكشاف، المجموعات، القنوات، المحادثات، والقصص في واجهة واحدة.',
  alternates: { canonical: '/features' },
};

const featureSections = [
  {
    title: 'الرئيسية',
    description:
      'في قسم الرئيسية لك كامل الحرية للتنقل بين التبويبات الثلاثة: المنشورات، الصور، الفيديوهات للمشاركة الفورية.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <path d="M3 11.5 12 4l9 7.5V21H3z" />
      </svg>
    ),
  },
  {
    title: 'الصور',
    description:
      'من تبويب الصور تتصفح مجموعة مميزة بتصميم يشبه Pinterest وتنتقل عبر شبكة احترافية من الصور.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8" cy="9" r="1.5" />
        <path d="m3 20 4-5 3 4 4-6 5 7" />
      </svg>
    ),
  },
  {
    title: 'الفيديوهات',
    description:
      'يتم عرض مقتطفات الفيديو مع صور مصغرة وواجهة سهلة تشبه YouTube قبل البث الكامل.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="m10 9 6 3-6 3z" />
      </svg>
    ),
  },
  {
    title: 'الاستكشاف',
    description:
      'نقترح لك الأشخاص المناسبين وتتابع منشوراتهم فقط، مع انسيابية في عرض المحتوى الجديد.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-4 8-4-4 8-4z" />
      </svg>
    ),
  },
  {
    title: 'المجموعات',
    description:
      'انضم أو أنشئ مجموعاتك لتبادل الخبرات مع المبدعين الآخرين وتقاسم الأخبار والتجارب.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <path d="M4 17v-2a4 4 0 0 1 4-4h1" />
        <path d="M20 17v-2a4 4 0 0 0-4-4h-1" />
        <path d="M12 11a4 4 0 1 0-4-4" />
        <path d="M6 21a6 6 0 0 1 12 0" />
      </svg>
    ),
  },
  {
    title: 'القنوات',
    description:
      'قم ببناء قناة خاصة بك للترويج لعلامتك التجارية أو محتواك كصانع محترف.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <path d="M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V7z" />
        <path d="m14 12 6-3-6-3z" />
      </svg>
    ),
  },
  {
    title: 'المحادثات',
    description:
      'دردش بدون تأخير مع الأصدقاء عبر الرسائل والنقاشات المتاحة بضغطة زر واحدة.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H9l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        <path d="M7 8h10M7 12h6" />
      </svg>
    ),
  },
  {
    title: 'القصص',
    description:
      'شارك قصصك في التطبيق وكن أنت أول مبدع يشارك القصص في دريدود، مشاركة القصص تزيد من انتاجيتك وتقربك أكثر لمتابعيك.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-10 h-10"
        aria-hidden="true"
      >
        <path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V8a2 2 0 0 1 2-2z" />
        <path d="m8 11 2 2 4-4 4 4" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white via-rose-50 to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 text-center mb-12">
          <p className="text-sm uppercase tracking-[0.5em] text-red-600 dark:text-red-400">المميزات</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            منصة دريدود تجمع كل أقسام التواصل في واجهة واحدة.
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            استعدادك الكامل للتفاعل ينطلق من تبويبات مصممة للشبكات المتعددة، من القصص المباشرة إلى غرف
            المجموعات ونوافذ الدردشة.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureSections.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center text-red-600 dark:text-red-400">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
