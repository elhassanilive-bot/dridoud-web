import ContactForm from './ContactForm';

export const metadata = {
  title: 'اتصل بنا | دريدود',
  description: 'تواصل مباشرة مع فريق دريدود عبر نموذج حديث يصل الرسائل إلى team@dridoud.com.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">تواصل مع فريق الدعم</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">اتصل بنا</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            نحن هنا لمساعدتك، لا تتردد في التواصل معنا في أي وقت. أرسل لنا رسالة عبر النموذج وسنرد عليك في أقرب فرصة.
          </p>
        </section>

        <ContactForm />
      </div>
    </div>
  );
}
