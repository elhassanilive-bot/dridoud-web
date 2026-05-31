'use client';

import ComplaintsForm from './ComplaintsForm';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const copy = {
  ar: {
    eyebrow: 'النظام الإشرافي',
    title: 'شكاوى وبلاغات',
    subtitle:
      'إذا واجهت محتوى مخالفاً أو مشكلة تقنية، أرسل بلاغاً واضحاً إلى فريق دريدود عبر النموذج الآمن. سنراجع البلاغ ونرد عليك بأقرب وقت.',
    cards: ['الإبلاغ عن محتوى', 'دعم سريع وآمن'],
  },
  en: {
    eyebrow: 'Moderation System',
    title: 'Complaints and Reports',
    subtitle:
      'If you find violating content or a technical issue, send a clear report to the Dridoud team through the secure form. We will review it and reply as soon as possible.',
    cards: ['Report Content', 'Fast and Secure Support'],
  },
};

export default function ComplaintsClient() {
  const { language, direction } = useLanguage();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white" dir={direction}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-4 rounded-3xl bg-gradient-to-br from-red-50 to-rose-100 p-10 shadow-2xl shadow-red-500/20 dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">{t.eyebrow}</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-700 dark:text-gray-300">{t.subtitle}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.cards.map((card) => (
              <div key={card} className="rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-600 dark:border-red-600/40 dark:bg-red-900/40">
                {card}
              </div>
            ))}
          </div>
        </section>

        <ComplaintsForm />
      </div>
    </div>
  );
}
