export const metadata = {
  title: "من نحن",
  description:
    "فريق دريدود يعيد تعريف التواصل الاجتماعي عبر منصة عربية حديثة مجهزة بالخصوصية والأمان.",
  alternates: { canonical: "/about" },
};

function SectionIcon({ type }) {
  const baseProps = {
    className: "h-12 w-12 text-red-600",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
  };

  switch (type) {
    case "team":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="20" cy="16" r="4" />
          <circle cx="32" cy="16" r="4" />
          <path d="M12 38c0-5 4-9 9-9h6c5 0 9 4 9 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="24" cy="24" r="12" />
          <path d="M24 12l5 14-14 5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="24" cy="24" r="12" />
          <circle cx="24" cy="24" r="6" />
          <path d="M6 24h12M30 24h12M24 6v12M24 30v12" strokeLinecap="round" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <path
            d="M24 6a10 10 0 00-10 10c0 4 2 7 5 9v5h10v-5c3-2 5-5 5-9a10 10 0 00-10-10z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17 38h14v4H17z" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <path
            d="M8 12l16-6 16 6v12c0 11-8 18-16 20-8-2-16-9-16-20z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 26h16" strokeLinecap="round" />
          <path d="M16 32h12" strokeLinecap="round" />
        </svg>
      );
    case "community":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="18" cy="16" r="4" />
          <circle cx="30" cy="16" r="4" />
          <path d="M10 38c0-6 5-11 14-11s14 5 14 11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 28h28" strokeLinecap="round" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="24" cy="12" r="4" />
          <path d="M10 34c0-7 5-12 14-12s14 5 14 12v6H10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <rect x="8" y="12" width="32" height="24" rx="4" />
          <path d="M8 16l16 12 16-12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <path
            d="M14 8h20a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M18 34h12" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

const sections = [
  {
    id: "vision",
    heading: "رؤيتنا",
    icon: "compass",
    body: `نطمح إلى بناء مجتمع رقمي عالمي يجمع بين الناس من مختلف الثقافات والاهتمامات، حيث يمكن لكل شخص مشاركة
أفكاره، اكتشاف محتوى جديد، والتواصل بدون حدود.`,
  },
  {
    id: "mission",
    heading: "مهمتنا",
    icon: "target",
    body: `مهمتنا هي توفير منصة تواصل اجتماعي متطورة تجمع بين سهولة الاستخدام، قوة الميزات، وسرعة الأداء مع التركيز على
تجربة مستخدم مميزة تنافس أكبر التطبيقات العالمية.`,
    list: ["سهولة الاستخدام", "قوة الميزات", "سرعة الأداء"],
  },
  {
    id: "offer",
    heading: "ماذا نقدم؟",
    icon: "lightbulb",
    body: `في دريدود، نوفر مجموعة واسعة من الأدوات التي تساعد المستخدمين على مشاركة المحتوى بجميع أنواعه، التفاعل
مع الآخرين بسهولة، إنشاء مجتمعات وقنوات خاصة، واكتشاف محتوى جديد بشكل مستمر في بيئة آمنة ومحترمة.`,
  },
  {
    id: "commitment",
    heading: "التزامنا",
    icon: "shield",
    body: `نلتزم بحماية خصوصية المستخدمين، توفير نظام أمان متقدم، تحسين مستمر للمنصة، والاستماع لآراء المستخدمين وتطوير
التطبيق بناءً عليها.`,
    list: ["حماية الخصوصية", "أمان متقدم", "تحسين مستمر", "استماع وتطوير"],
  },
  {
    id: "community",
    heading: "مجتمعنا",
    icon: "community",
    body: `دريدود ليس مجرد تطبيق، بل هو مجتمع متكامل يضم مستخدمين من مختلف أنحاء العالم، حيث يمكن للجميع التعبير عن
أنفسهم وبناء علاقات حقيقية داخل المنصة.`,
  },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-red-600 mb-3">من نحن</p>
          <div className="flex items-center justify-center gap-3">
            <SectionIcon type="team" />
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">
              من نحن – فريق دريدود
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-6 leading-relaxed">
            نحن فريق دريدود، نسعى إلى إعادة تعريف تجربة التواصل الاجتماعي من خلال تقديم منصة حديثة، متكاملة،
            وآمنة، تمنح المستخدمين حرية التعبير والتفاعل بطريقة سلسة ومبتكرة.
          </p>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {sections.map((section) => (
            <article
              key={section.id}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SectionIcon type={section.icon} />
                  <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{section.heading}</h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{section.id.toUpperCase()}</span>
              </div>
              <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
              {section.list && (
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <SectionIcon type="support" />
            <p className="text-lg font-semibold">نحن هنا دائمًا للاستماع إليك</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-6 text-left">
            <div className="bg-white/10 rounded-3xl px-6 py-5">
              <div className="flex items-center gap-2">
                <SectionIcon type="email" />
                <p className="text-sm uppercase tracking-[0.4em] text-red-300">البريد الإلكتروني</p>
              </div>
              <p className="text-xl font-semibold mt-2 text-white">team@dridoud.com</p>
            </div>
            <div className="bg-white/10 rounded-3xl px-6 py-5">
              <div className="flex items-center gap-2">
                <SectionIcon type="phone" />
                <p className="text-sm uppercase tracking-[0.4em] text-red-300">رقم الهاتف</p>
              </div>
              <p className="text-xl font-semibold mt-2 text-white">+212638813823</p>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed">
            شكرًا لانضمامك إلى دريدود. معًا نبني تجربة تواصل اجتماعي أفضل.
          </p>
        </div>
      </section>
    </div>
  );
}
