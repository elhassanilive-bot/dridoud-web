import FaqAccordion from './FaqAccordion';
import { faqSections } from './faqData';

export const metadata = {
  title: 'الأسئلة الشائعة | دريدود',
  description: 'تصفح إجابات واضحة لأهم الأسئلة حول التسجيل، النشر، التفاعل، الأمان، والمشاكل التقنية في دريدود.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-100 p-10 shadow-2xl shadow-red-500/20 dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">دعم ذاتي</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">الأسئلة الشائعة</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            هنا ستجد إجابات لأكثر الأسئلة شيوعًا حول استخدام دريدود، من الحساب مرورًا بالنشر والتفاعل، وصولًا إلى الخصوصية والمشاكل التقنية.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-red-600">
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-red-600 dark:bg-white/10">الحساب</span>
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-red-600 dark:bg-white/10">النشر</span>
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-red-600 dark:bg-white/10">الأمان</span>
            <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-red-600 dark:bg-white/10">الدعم</span>
          </div>
        </section>

        <FaqAccordion sections={faqSections} />
      </div>
    </div>
  );
}
