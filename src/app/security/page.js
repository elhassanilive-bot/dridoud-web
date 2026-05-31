import SecurityClient from './SecurityClient';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

export const metadata = buildPageMetadata({
  title: 'أمان البيانات | دريدود',
  description: 'تعرف على مبادئ الأمان وحماية البيانات في منصة دريدود.',
  path: '/security',
  keywords: ['أمان البيانات', 'دريدود', 'Dridoud', 'security'],
});

export default function SecurityPage() {
  return <SecurityClient />;
}
