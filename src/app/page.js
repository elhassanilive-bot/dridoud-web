import HomeClient from './HomeClient';

export const metadata = {
  title: 'دريدود - Dridoud تطبيق تواصل اجتماعي عصري',
  description: 'شارك لحظتك مع دريدود، محتواك آمن وسريع الانتشار، لا خوارزميات للتصفية ولا قيود إضافية.',
  keywords: [
    'دريدود',
    'Dridoud',
    'تطبيق دريدود',
    'منصة تواصل اجتماعي',
    'تطبيق عربي',
    'منشورات',
    'فيديو',
    'قنوات',
    'مجموعات',
  ],
  alternates: { canonical: '/' },
};

export default function Home() {
  return <HomeClient />;
}
