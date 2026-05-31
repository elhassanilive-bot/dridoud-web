'use client';

import ContactForm from './ContactForm';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const copy = {
  ar: {
    eyebrow: 'تواصل مع فريق الدعم',
    title: 'اتصل بنا',
    subtitle: 'نحن هنا لمساعدتك، لا تتردد في التواصل معنا في أي وقت. أرسل لنا رسالة عبر النموذج وسنرد عليك في أقرب فرصة.',
  },
  en: {
    eyebrow: 'Contact Support',
    title: 'Contact Us',
    subtitle: 'We are here to help. Send us a message through the form and we will reply as soon as possible.',
  },
};

export default function ContactClient() {
  const { language, direction } = useLanguage();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white" dir={direction}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">{t.eyebrow}</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-700 dark:text-gray-300">{t.subtitle}</p>
        </section>

        <ContactForm />
      </div>
    </div>
  );
}
