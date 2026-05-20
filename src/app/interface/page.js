import InterfaceClient from './InterfaceClient';

export const metadata = {
  title: 'الواجهة',
  description: 'واجهة تعرض أهم محتوى تطبيق دريدود.',
  alternates: { canonical: '/interface' },
};

export default function InterfacePage() {
  return (
    <main className="min-h-screen bg-[#f2f4f7] text-black">
      <InterfaceClient />
    </main>
  );
}
