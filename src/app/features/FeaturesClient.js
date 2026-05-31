'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

const copy = {
  ar: {
    eyebrow: 'المميزات',
    title: 'منصة دريدود تجمع كل أقسام التواصل في واجهة واحدة.',
    subtitle: 'استعدادك الكامل للتفاعل ينطلق من تبويبات مصممة للشبكات المتعددة، من القصص المباشرة إلى غرف المجموعات ونوافذ الدردشة.',
    items: [
      ['الرئيسية', 'تنقل بين المنشورات والصور والفيديوهات للمشاركة الفورية.'],
      ['الصور', 'تصفح شبكة صور احترافية بتجربة منظمة وسهلة.'],
      ['الفيديوهات', 'شاهد مقتطفات وفيديوهات طويلة وبثاً مباشراً في واجهة سلسة.'],
      ['الاستكشاف', 'اكتشف أشخاصاً ومنشورات تناسب اهتماماتك.'],
      ['المجموعات', 'انضم أو أنشئ مجموعات لتبادل الخبرات والنقاشات.'],
      ['القنوات', 'ابن قناة خاصة لعلامتك أو محتواك المهني.'],
      ['المحادثات', 'تواصل برسائل مباشرة ومحادثات سريعة.'],
      ['القصص', 'شارك لحظاتك اليومية وقربها من متابعيك.'],
    ],
  },
  en: {
    eyebrow: 'Features',
    title: 'Dridoud brings every social section into one clean experience.',
    subtitle: 'From stories and discovery to groups, channels, messaging, photos, and video, every section is designed for smooth interaction.',
    items: [
      ['Home', 'Move between posts, photos, and videos for instant sharing.'],
      ['Photos', 'Browse a polished visual grid with a clean discovery flow.'],
      ['Videos', 'Watch previews, long videos, and live content in a smooth interface.'],
      ['Discover', 'Find people and posts that match your interests.'],
      ['Groups', 'Join or create communities for discussions and shared knowledge.'],
      ['Channels', 'Build a dedicated space for your brand or professional content.'],
      ['Chats', 'Connect through fast direct messaging.'],
      ['Stories', 'Share daily moments and stay close to your followers.'],
    ],
  },
};

const icons = ['⌂', '▧', '▶', '◇', '◎', '▣', '✉', '◌'];

export default function FeaturesClient() {
  const { language, direction } = useLanguage();
  const t = copy[language];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-rose-50 to-red-50 py-20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800" dir={direction}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-6 text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-red-600 dark:text-red-400">{t.eyebrow}</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">{t.title}</h1>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">{t.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map(([title, description], index) => (
            <article key={title} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/70">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-600 dark:bg-red-900/30 dark:text-red-300">
                {icons[index]}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
