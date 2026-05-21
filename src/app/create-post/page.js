import { Suspense } from 'react';
import CreatePostClient from './CreatePostClient';

export const metadata = {
  title: 'إنشاء منشور | Dridoud',
};

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-600">
          جاري تحميل صفحة إنشاء المنشور...
        </div>
      }
    >
      <CreatePostClient />
    </Suspense>
  );
}
