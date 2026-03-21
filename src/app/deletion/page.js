import DeletionForm from './DeletionForm';

export const metadata = {
  title: 'طلب حذف الحساب | دريدود',
  description: 'أرسل طلب حذف نهائي لحسابك عبر واجهة آمنة مع شرح العواقب والحماية.',
  alternates: { canonical: '/deletion' },
};

export default function DeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-100 p-10 shadow-2xl shadow-red-500/20 dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">طلب حذف الحساب</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">طلب حذف الحساب</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            يمكنك من خلال هذه الصفحة إرسال طلب حذف نهائي لحسابك في دريدود. نُراجع الطلبات بحرص ونرسل تأكيدًا بعد مراجعة التفاصيل.
          </p>
          <div className="rounded-3xl border border-red-200 bg-white/90 p-6 text-sm text-red-700 shadow-inner dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200">
            <p className="font-semibold text-base">تنبيه واضح</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed">
              <li>حذف الحساب نهائي ولا يمكن التراجع عنه.</li>
              <li>سيتم حذف المنشورات، الصور، الفيديوهات، الرسائل، والتفاعلات.</li>
              <li>قد يستغرق تنفيذ الطلب عدة أيام بعد التحقق.</li>
            </ul>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <DeletionForm />
          <aside className="space-y-6 rounded-3xl bg-gradient-to-b from-white to-red-50 p-8 text-gray-700 shadow-xl dark:from-gray-900 dark:to-gray-950 dark:text-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">معلومات مهمة</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              نطلب تأكيد كلمة المرور للتأكد من هوية الطلب، كما يمكنك إرفاق تفاصيل إضافية لسرعة المراجعة. سنرسل تأكيدًا إلى بريدك بعد المراجعة.
            </p>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <span className="text-red-600">📧</span>
                <a href="mailto:team@dridoud.com" className="font-semibold text-red-600 hover:underline">
                  team@dridoud.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-red-600">📱</span>
                +212638813823
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-red-600">حماية الطلبات</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
