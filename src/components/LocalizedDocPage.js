'use client';

import DocViewer from '@/components/DocViewer';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const pageCopy = {
  terms: {
    ar: {
      eyebrow: 'Terms & Conditions',
      fallbackTitle: 'الشروط والأحكام',
      fallbackUpdated: 'آخر تحديث قريبًا',
      intro: 'نشاركك حدود الاستخدام وسياسة التعامل مع المحتوى، لضمان بيئة آمنة ومتوازنة داخل المنصة.',
    },
    en: {
      eyebrow: 'Terms & Conditions',
      fallbackTitle: 'Terms and Conditions',
      fallbackUpdated: 'Last updated soon',
      intro: 'Review the rules for using Dridoud and how content is managed to keep the platform safe and balanced.',
    },
  },
  privacy: {
    ar: {
      eyebrow: 'Privacy Policy',
      fallbackTitle: 'سياسة الخصوصية',
      fallbackUpdated: 'آخر تحديث قريبًا',
      intro: 'نضع الشفافية في صلب تعاملنا مع البيانات، وتوضح هذه الصفحة كيف تتحكم في المعلومات الخاصة بك على دريدود.',
    },
    en: {
      eyebrow: 'Privacy Policy',
      fallbackTitle: 'Privacy Policy',
      fallbackUpdated: 'Last updated soon',
      intro: 'Transparency guides how we handle data. This page explains how your information is used and controlled on Dridoud.',
    },
  },
  agreements: {
    ar: {
      eyebrow: 'الاتفاقيات والسياسات',
      fallbackTitle: 'كل ما تحتاج معرفته قبل استخدام دريدود',
      fallbackUpdated: 'آخر تحديث قريبًا',
      intro: 'هذه الصفحة تجمع الاتفاقيات والسياسات التي تحكم استخدام منصة دريدود لضمان تجربة مستقرة وآمنة وعادلة.',
    },
    en: {
      eyebrow: 'Agreements and Policies',
      fallbackTitle: 'Everything you need to know before using Dridoud',
      fallbackUpdated: 'Last updated soon',
      intro: 'This page brings together the policies and agreements that govern Dridoud so the experience stays stable, safe, and fair.',
    },
  },
  dmca: {
    ar: {
      eyebrow: 'سياسة حقوق النشر (DMCA)',
      fallbackTitle: 'إجراءات دريدود تجاه انتهاكات حقوق النشر',
      fallbackUpdated: 'آخر تحديث قريبًا',
      intro: 'نحترم حقوق الملكية الفكرية ونتعامل مع انتهاكات حقوق النشر بجدية عبر إجراءات واضحة ومباشرة.',
    },
    en: {
      eyebrow: 'Copyright Policy (DMCA)',
      fallbackTitle: 'How Dridoud handles copyright complaints',
      fallbackUpdated: 'Last updated soon',
      intro: 'We respect intellectual property and respond to copyright concerns through clear and practical procedures.',
    },
  },
  about: {
    ar: {
      eyebrow: 'من نحن',
      fallbackTitle: 'من نحن - فريق دريدود',
      fallbackUpdated: 'آخر تحديث قريبًا',
      intro: 'تعرف على رؤية دريدود ورسالتنا في بناء تجربة تواصل اجتماعي حديثة وآمنة.',
    },
    en: {
      eyebrow: 'About Us',
      fallbackTitle: 'About Dridoud',
      fallbackUpdated: 'Last updated soon',
      intro: 'Learn about Dridoud, our vision, and our mission to build a modern and safe social networking experience.',
    },
  },
};

export default function LocalizedDocPage({ doc, page = 'terms', background = 'white' }) {
  const { language, direction } = useLanguage();
  const copy = pageCopy[page][language];
  const activeDoc = language === 'ar' ? doc.ar : doc.en;
  const fallbackDoc = language === 'ar' ? doc.en : doc.ar;
  const title = activeDoc.title || copy.fallbackTitle;
  const updated = activeDoc.updated || fallbackDoc.updated || copy.fallbackUpdated;
  const sectionBg = background === 'gray' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-950';

  return (
    <div className="w-full" dir={direction}>
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 py-20 dark:from-gray-900 dark:to-gray-800 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-[0.4em] text-red-600">{copy.eyebrow}</p>
          <h1 className="mt-3 text-5xl font-bold text-gray-900 dark:text-white sm:text-6xl">{title}</h1>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{updated}</p>
          <p className="mx-auto mt-3 max-w-3xl text-base text-gray-700 dark:text-gray-300">{copy.intro}</p>
        </div>
      </section>

      <section className={`w-full py-20 sm:py-32 ${sectionBg}`}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <DocViewer arText={doc.ar.text} enText={doc.en.text} />
        </div>
      </section>
    </div>
  );
}
