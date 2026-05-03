import DocViewer from "@/components/DocViewer";
import { docsContent } from "@/content/docs";
import { buildPageMetadata } from "@/lib/seo/pageMeta";

const doc = docsContent.terms;

export const metadata = buildPageMetadata({
  title: doc.ar.title || 'الشروط والأحكام | دريدود',
  description: 'اطلع على الشروط والأحكام التي تنظّم استخدام منصة Dridoud والمحتوى داخلها.',
  path: '/terms',
  keywords: ['الشروط والأحكام', 'دريدود', 'Dridoud', 'terms and conditions'],
});

export default function Terms() {
  const title = doc.ar.title || "الشروط والأحكام";
  const updated = doc.ar.updated || doc.en.updated || "آخر تحديث قريبًا";

  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-red-600">{doc.en.title || "Terms & Conditions"}</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mt-3">{title}</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">{updated}</p>
          <p className="text-base text-gray-700 dark:text-gray-300 mt-3 max-w-3xl mx-auto">
            نشاركك حدود الاستخدام وسياسة التعامل مع المحتوى، لضمان بيئة آمنة ومتوازنة داخل المنصة.
          </p>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <DocViewer arText={doc.ar.text} enText={doc.en.text} />
        </div>
      </section>
    </div>
  );
}



