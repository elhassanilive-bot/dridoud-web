import AccountManageClient from './AccountManageClient';

export const metadata = {
  title: 'إدارة الحساب',
  description: 'إدارة الملف الشخصي، الصورة، البريد الإلكتروني، وكلمة المرور في دريدود.',
  alternates: { canonical: '/account/me' },
};

export default function AccountManagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-100 text-black">
      <AccountManageClient />
    </div>
  );
}
