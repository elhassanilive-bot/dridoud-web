import LocalizedDocPage from '@/components/LocalizedDocPage';
import { docsContent } from '@/content/docs';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

const doc = docsContent.dmca;

export const metadata = buildPageMetadata({
  title: 'سياسة حقوق النشر (DMCA) | دريدود',
  description: 'إجراءات دريدود للتعامل مع إشعارات حقوق النشر والإشعارات المضادة وفق مبادئ DMCA.',
  path: '/dmca',
  keywords: ['DMCA', 'حقوق النشر', 'دريدود', 'Dridoud'],
});

export default function DmcaPage() {
  return <LocalizedDocPage doc={doc} page="dmca" background="gray" />;
}
