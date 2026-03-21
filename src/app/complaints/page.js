import ComplaintsForm from './ComplaintsForm';

export const metadata = {
  title: 'شكاوى وبلاغات | دريدود',
  description: 'أرسل بلاغاً عن محتوى مخالف أو مشكلة تقنية، ويصلك رد فريق دريدود بعد المراجعة.',
  alternates: { canonical: '/complaints' },
};

export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-4 rounded-3xl bg-gradient-to-br from-red-50 to-rose-100 p-10 shadow-2xl shadow-red-500/20 dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">النظام الإشرافي</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">شكاوى وبلاغات</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            إذا واجهت محتوى مخالفاً أو مشكلة تقنية، أرسل بلاغاً واضحاً إلى فريق دريدود عبر النموذج الآمن. سنراجع البلاغ ونرد عليك بأقرب وقت.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-600 dark:border-red-600/40 dark:bg-red-900/40">
              الإبلاغ عن محتوى
            </div>
            <div className="rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-600 dark:border-red-600/40 dark:bg-red-900/40">
              دعم سريع وآمن
            </div>
          </div>
        </section>

        <ComplaintsForm />
      </div>
    </div>
  );
}
