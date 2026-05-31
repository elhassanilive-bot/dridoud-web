import ComplaintsClient from './ComplaintsClient';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

export const metadata = buildPageMetadata({
  title: 'شكاوى وبلاغات | دريدود',
  description: 'أرسل بلاغاً عن محتوى مخالف أو مشكلة تقنية عبر صفحة الشكاوى الرسمية في دريدود.',
  path: '/complaints',
  keywords: ['شكاوى', 'بلاغات', 'دريدود', 'Dridoud complaints'],
});

export default function ComplaintsPage() {
  return <ComplaintsClient />;
}
