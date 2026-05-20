import AccountAuthClient from './AccountAuthClient';

export const metadata = {
  title: 'الحساب',
  description: 'إنشاء حساب أو تسجيل الدخول إلى دريدود عبر واجهة ويب متصلة بـ Supabase.',
  alternates: { canonical: '/account' },
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gray-100 text-black">
      <AccountAuthClient />
    </div>
  );
}
