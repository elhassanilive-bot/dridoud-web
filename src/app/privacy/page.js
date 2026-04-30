import DocViewer from "@/components/DocViewer";
import { docsContent } from "@/content/docs";
import { buildPageMetadata } from "@/lib/seo/pageMeta";

const doc = docsContent.privacyPolicy;

export const metadata = buildPageMetadata({
  title: doc.ar.title || 'سياسة الخصوصية | دريدود',
  description: 'توضح سياسة دريدود كيفية جمع البيانات واستخدامها وحمايتها داخل منصة Dridoud.',
  path: '/privacy',
  keywords: ['سياسة الخصوصية', 'دريدود', 'Dridoud', 'privacy policy'],
});

export default function Privacy() {
  const title = doc.ar.title || "Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©";
  const updated = doc.ar.updated || doc.en.updated || "Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ« Ù‚Ø±ÙŠØ¨Ù‹Ø§";

  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-red-600">{doc.en.title || "Privacy Policy"}</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mt-3">{title}</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">{updated}</p>
          <p className="text-base text-gray-700 dark:text-gray-300 mt-3 max-w-3xl mx-auto">
            Ù†Ø¶Ø¹ Ø§Ù„Ø´ÙØ§ÙÙŠØ© ÙÙŠ ØµÙ„Ø¨ ØªØ¹Ø§Ù…Ù„Ù†Ø§ Ù…Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŒ ÙˆØªÙˆØ¶Ø­ Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø© ÙƒÙŠÙ ØªØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ Ø¹Ù„Ù‰ Ø¯Ø±ÙŠØ¯ÙˆØ¯.
          </p>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <DocViewer arText={doc.ar.text} enText={doc.en.text} />
        </div>
      </section>
    </div>
  );
}




