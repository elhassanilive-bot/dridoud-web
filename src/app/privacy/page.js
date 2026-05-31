import LocalizedDocPage from '@/components/LocalizedDocPage';
import { docsContent } from '@/content/docs';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

const doc = docsContent.privacyPolicy;

export const metadata = buildPageMetadata({
  title: doc.ar.title || 'سياسة الخصوصية | دريدود',
  description: 'توضح سياسة دريدود كيفية جمع البيانات واستخدامها وحمايتها داخل منصة Dridoud.',
  path: '/privacy',
  keywords: ['سياسة الخصوصية', 'دريدود', 'Dridoud', 'privacy policy'],
});

export default function Privacy() {
  return <LocalizedDocPage doc={doc} page="privacy" />;
}
