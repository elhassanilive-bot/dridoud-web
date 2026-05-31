import LocalizedDocPage from '@/components/LocalizedDocPage';
import { docsContent } from '@/content/docs';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

const doc = docsContent.agreements;

export const metadata = buildPageMetadata({
  title: 'الاتفاقيات والسياسات | دريدود',
  description: 'صفحة تجمع الاتفاقيات والسياسات التي تحكم استخدام منصة دريدود.',
  path: '/agreements',
  keywords: ['الاتفاقيات', 'السياسات', 'دريدود', 'Dridoud'],
});

export default function AgreementsPage() {
  return <LocalizedDocPage doc={doc} page="agreements" background="gray" />;
}
