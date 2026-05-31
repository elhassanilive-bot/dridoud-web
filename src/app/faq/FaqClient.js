'use client';

import FaqAccordion from './FaqAccordion';
import { faqCopy, normalizeFaqSections } from './faqData';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function FaqClient() {
  const { language, direction } = useLanguage();
  const copy = faqCopy[language];
  const sections = normalizeFaqSections(copy.sections);

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950" dir={direction}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-100 p-10 shadow-2xl shadow-red-500/20 dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">{copy.eyebrow}</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-700 dark:text-gray-300">{copy.subtitle}</p>
          <div className="flex flex-wrap gap-3 text-sm text-red-600">
            {copy.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/70 px-3 py-1 font-semibold text-red-600 dark:bg-white/10">{tag}</span>
            ))}
          </div>
        </section>

        <FaqAccordion sections={sections} copy={copy} />
      </div>
    </div>
  );
}
