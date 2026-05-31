import LocalizedDocPage from '@/components/LocalizedDocPage';
import { docsContent } from '@/content/docs';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

const doc = docsContent.terms;

export const metadata = buildPageMetadata({
  title: doc.ar.title || 'الشروط والأحكام | دريدود',
  description: 'اطلع على الشروط والأحكام التي تنظّم استخدام منصة Dridoud والمحتوى داخلها.',
  path: '/terms',
  keywords: ['الشروط والأحكام', 'دريدود', 'Dridoud', 'terms and conditions'],
});

export default function Terms() {
  return <LocalizedDocPage doc={doc} page="terms" background="gray" />;
}
