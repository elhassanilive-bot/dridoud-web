import ContactClient from './ContactClient';
import { buildPageMetadata } from '@/lib/seo/pageMeta';

export const metadata = buildPageMetadata({
  title: 'اتصل بنا | دريدود',
  description: 'تواصل مباشرة مع فريق دريدود عبر صفحة الاتصال الرسمية.',
  path: '/contact',
  keywords: ['اتصل بنا', 'دعم دريدود', 'Dridoud support'],
});

export default function ContactPage() {
  return <ContactClient />;
}
