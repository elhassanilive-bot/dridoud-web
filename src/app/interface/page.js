import { Suspense } from 'react';
import InterfaceClient from './InterfaceClient';

export const metadata = {
  title: 'الواجهة',
  description: 'واجهة تعرض أهم محتوى تطبيق دريدود.',
  alternates: { canonical: '/interface' },
};

export default function InterfacePage() {
  return (
    <main className="min-h-screen bg-[#f2f4f7] text-black">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-600">
            جاري تحميل الواجهة...
          </div>
        }
      >
        <InterfaceClient />
      </Suspense>
    </main>
  );
}
