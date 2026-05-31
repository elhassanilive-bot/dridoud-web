import LocalizedDocPage from '@/components/LocalizedDocPage';
import { docsContent } from '@/content/docs';

export const metadata = {
  title: 'من نحن',
  description: 'فريق دريدود يعيد تعريف التواصل الاجتماعي عبر منصة عربية حديثة مجهزة بالخصوصية والأمان.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return <LocalizedDocPage doc={docsContent.about} page="about" />;
}
