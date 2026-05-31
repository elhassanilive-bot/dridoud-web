import DownloadClient from './DownloadClient';

export const metadata = {
  title: 'تحميل دريدود',
  description: 'الصفحة الرسمية لتحميل تطبيق دريدود على Android وiOS بالإضافة إلى نسخة APK المباشرة.',
  alternates: { canonical: '/download' },
};

export default function DownloadPage() {
  return <DownloadClient />;
}
