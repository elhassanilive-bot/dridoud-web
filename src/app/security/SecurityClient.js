'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

const copy = {
  ar: {
    eyebrow: 'أمان البيانات',
    title: 'كيف يحمي دريدود حسابك وبياناتك',
    subtitle: 'نستخدم طبقات متعددة من الحماية، ونوضح للمستخدمين كيف تتم إدارة الأمان والخصوصية داخل المنصة.',
    updated: 'آخر تحديث: 31 مايو 2026',
    sections: [
      ['1.', 'الحماية الأساسية', ['اتصالات مشفرة', 'حماية تسجيل الدخول', 'مراقبة الأنشطة المشبوهة']],
      ['2.', 'خصوصية الحساب', ['تحكم في معلوماتك الشخصية', 'إعدادات ظهور واضحة', 'خيارات حظر وإبلاغ']],
      ['3.', 'التعامل مع البلاغات', ['مراجعة البلاغات بسرية', 'اتخاذ قرارات حسب المخالفة', 'تقييد السلوك الضار عند الحاجة']],
      ['4.', 'مسؤولية المستخدم', ['استخدم كلمة مرور قوية', 'لا تشارك رموز التحقق', 'تجنب الروابط المشبوهة']],
      ['5.', 'الشفافية', ['نوضح سياساتنا بوضوح', 'نحدّث الإجراءات عند الحاجة', 'نوفر قنوات تواصل للدعم']],
    ],
    contact: 'لأي استفسار أمني، تواصل معنا عبر support@dridoud.com',
  },
  en: {
    eyebrow: 'Data Security',
    title: 'How Dridoud protects your account and data',
    subtitle: 'We use multiple layers of protection and explain how safety and privacy are managed across the platform.',
    updated: 'Last updated: May 31, 2026',
    sections: [
      ['1.', 'Core protection', ['Encrypted connections', 'Login protection', 'Monitoring suspicious activity']],
      ['2.', 'Account privacy', ['Control your personal information', 'Clear visibility settings', 'Blocking and reporting options']],
      ['3.', 'Report handling', ['Reports are reviewed confidentially', 'Actions depend on the violation', 'Harmful behavior may be restricted']],
      ['4.', 'User responsibility', ['Use a strong password', 'Never share verification codes', 'Avoid suspicious links']],
      ['5.', 'Transparency', ['We explain policies clearly', 'We update procedures when needed', 'We provide support channels']],
    ],
    contact: 'For security questions, contact us at support@dridoud.com',
  },
};

export default function SecurityClient() {
  const { language, direction } = useLanguage();
  const t = copy[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-gray-100" dir={direction}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">{t.eyebrow}</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{t.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t.updated}</p>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">{t.subtitle}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {t.sections.map(([number, title, items]) => (
            <section key={title} className="rounded-3xl border border-gray-200/60 bg-white/80 px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tracking-[0.2em] text-gray-400">{number}</span>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
              </div>
              <ul className="mt-4 list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>

        <p className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {t.contact}
        </p>
      </div>
    </div>
  );
}
