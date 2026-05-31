import FaqClient from './FaqClient';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

export const metadata = buildPageMetadata({
  title: 'الأسئلة الشائعة | دريدود',
  description: 'إجابات واضحة لأهم الأسئلة حول الحساب، النشر، الأمان، والدعم في Dridoud.',
  path: '/faq',
  keywords: ['الأسئلة الشائعة', 'FAQ', 'دريدود', 'Dridoud'],
});

export default function FaqPage() {
  return <FaqClient />;
}
