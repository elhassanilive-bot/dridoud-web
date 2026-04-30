'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const emptyProfile = {
  full_name: '',
  username: '',
  avatar_url: '',
};

export default function AccountManageClient() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [emailForm, setEmailForm] = useState('');
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });

  useEffect(() => {
    let mounted = true;
    let unsub = null;

    async function boot() {
      const authClient = await getSupabaseClient();
      if (!authClient) {
        if (mounted) {
          setError('الخدمة غير متاحة حالياً.');
          setLoading(false);
        }
        return;
      }

      const { data } = await authClient.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      if (!sessionUser) {
        router.replace('/account');
        return;
      }

      if (mounted) {
        setUser(sessionUser);
        setEmailForm(sessionUser.email ?? '');
      }

      await loadProfile(authClient, sessionUser.id, mounted);

      const listener = authClient.auth.onAuthStateChange((_event, session) => {
        const authUser = session?.user ?? null;
        if (!authUser) {
          router.replace('/account');
          return;
        }
        setUser(authUser);
        setEmailForm(authUser.email ?? '');
      });
      unsub = listener.data.subscription;
    }

    boot();

    return () => {
      mounted = false;
      if (unsub) unsub.unsubscribe();
    };
  }, [router]);

  async function loadProfile(authClient, userId, mounted = true) {
    try {
      const { data, error: queryError } = await authClient
        .from('profiles')
        .select('full_name,username,avatar_url')
        .eq('user_id', userId)
        .single();

      if (queryError) throw queryError;
      if (!mounted) return;

      const resolved = {
        full_name: data?.full_name ?? '',
        username: data?.username ?? '',
        avatar_url: data?.avatar_url ?? '',
      };
      setProfile(resolved);
      setAvatarPreview(resolved.avatar_url || '');
      setLoading(false);
    } catch (e) {
      if (!mounted) return;
      setError(normalizeError(e));
      setLoading(false);
    }
  }

  function resetMessages() {
    setNotice('');
    setError('');
  }

  function updateProfileField(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function pickAvatar() {
    fileInputRef.current?.click();
  }

  function onAvatarPicked(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 2MB.');
      return;
    }
    resetMessages();
    setPendingImageFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function removeAvatar() {
    resetMessages();
    setPendingImageFile(null);
    setAvatarPreview('');
    updateProfileField('avatar_url', '');
  }

  async function saveProfile() {
    resetMessages();
    if (!user) return;
    if (!profile.username.trim()) {
      setError('اسم المستخدم مطلوب.');
      return;
    }

    setBusy(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) throw new Error('service unavailable');

      let avatarUrl = profile.avatar_url || '';
      if (pendingImageFile) {
        avatarUrl = await uploadAvatar(authClient, user.id, pendingImageFile);
      }

      const payload = {
        full_name: profile.full_name.trim(),
        username: profile.username.trim(),
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await authClient.from('profiles').update(payload).eq('user_id', user.id);
      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      setPendingImageFile(null);
      setNotice('تم حفظ الملف الشخصي بنجاح.');
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function updateEmail() {
    resetMessages();
    if (!emailForm.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setBusy(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) throw new Error('service unavailable');

      const { error: updateError } = await authClient.auth.updateUser({
        email: emailForm.trim().toLowerCase(),
      });
      if (updateError) throw updateError;

      setNotice('تم إرسال طلب تحديث البريد الإلكتروني. تحقق من رسالة التأكيد.');
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword() {
    resetMessages();
    const password = passwordForm.password;
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== passwordForm.confirm) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    setBusy(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) throw new Error('service unavailable');

      const { error: updateError } = await authClient.auth.updateUser({ password });
      if (updateError) throw updateError;

      setPasswordForm({ password: '', confirm: '' });
      setNotice('تم تحديث كلمة المرور بنجاح.');
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return;
      await authClient.auth.signOut();
      router.replace('/account');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-emerald-200/70 bg-white p-8 text-center text-[#1f4735] shadow-sm">
          جاري تحميل بيانات الحساب...
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -left-16 top-2 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -right-10 bottom-2 h-72 w-72 rounded-full bg-emerald-100/65 blur-3xl" />
      </div>

      <header className="mb-7 rounded-[2rem] border border-emerald-200/70 bg-white/95 p-6 shadow-[0_18px_45px_rgba(7,58,34,0.12)]">
        <p className="text-xs font-bold uppercase tracking-[0.42em] text-emerald-600">DRIDOUD ACCOUNT</p>
        <h1 className="mt-2 text-4xl font-black text-[#072b19]">الحساب</h1>
        <p className="mt-2 text-[#214737]">إدارة الملف الشخصي وأمان الحساب بنفس هوية دريدود.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-emerald-200/70 bg-white/95 p-6 shadow-[0_14px_36px_rgba(7,58,34,0.1)]">
          <h2 className="text-3xl font-black text-[#0f3a26]">الملف الشخصي</h2>
          <p className="mt-2 text-[#2d5644]">تعديل بياناتك الشخصية وصورتك بنفس بيانات التطبيق.</p>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Link
              href={profile.username?.trim() ? `/${profile.username.trim()}` : '/'}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              فتح صفحتي
            </Link>
            <button
              type="button"
              className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"
            >
              المحفوظات
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="الاسم الكامل">
              <input
                value={profile.full_name}
                onChange={(e) => updateProfileField('full_name', e.target.value)}
                className="w-full rounded-2xl border border-[#d3e7da] bg-[#f9fdfb] px-4 py-3 text-right font-semibold text-[#10291d] outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </Field>

            <Field label="اسم المستخدم">
              <input
                value={profile.username}
                onChange={(e) => updateProfileField('username', e.target.value)}
                className="w-full rounded-2xl border border-[#d3e7da] bg-[#f9fdfb] px-4 py-3 text-right font-semibold text-[#10291d] outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </Field>

            <Field label="البريد الإلكتروني">
              <input
                value={emailForm}
                onChange={(e) => setEmailForm(e.target.value)}
                className="w-full rounded-2xl border border-[#d3e7da] bg-[#f9fdfb] px-4 py-3 text-right font-semibold text-[#10291d] outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </Field>

            <div className="rounded-2xl border border-emerald-100 bg-[#f6fcf8] p-4">
              <p className="text-right text-lg font-black text-[#0f3a26]">الصورة الشخصية</p>
              <p className="mt-1 text-right text-xs text-[#2d5644]">اختر صورة من جهازك (JPG/PNG/WEBP) أقل من 2MB.</p>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={pickAvatar}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  رفع صورة
                </button>
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-bold text-[#325643] transition hover:bg-[#f2faf5]"
                >
                  إزالة الصورة
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onAvatarPicked}
              />
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-[#f6fcf8] p-3">
              <p className="mb-2 text-right text-sm text-[#2d5644]">معاينة الصورة الشخصية</p>
              <div className="flex justify-end">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="الصورة الشخصية"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-full border border-emerald-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-white text-xs text-[#5a7a6b]">
                    بدون صورة
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={busy}
              className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-black text-white transition hover:bg-emerald-800 disabled:opacity-70"
            >
              حفظ الملف الشخصي
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-200/70 bg-white/95 p-6 shadow-[0_14px_36px_rgba(7,58,34,0.1)]">
          <h2 className="text-3xl font-black text-[#0f3a26]">الأمان</h2>
          <p className="mt-2 text-[#2d5644]">تحديث البريد الإلكتروني وكلمة المرور ثم تسجيل الخروج.</p>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={updateEmail}
              disabled={busy}
              className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-base font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
            >
              تحديث البريد الإلكتروني
            </button>

            <Field label="كلمة المرور الجديدة">
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-2xl border border-[#d3e7da] bg-[#f9fdfb] px-4 py-3 text-right font-semibold text-[#10291d] outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </Field>

            <Field label="تأكيد كلمة المرور">
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                className="w-full rounded-2xl border border-[#d3e7da] bg-[#f9fdfb] px-4 py-3 text-right font-semibold text-[#10291d] outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </Field>

            <button
              type="button"
              onClick={updatePassword}
              disabled={busy}
              className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-black text-white transition hover:bg-emerald-800 disabled:opacity-70"
            >
              تحديث كلمة المرور
            </button>

            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-base font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
            >
              تسجيل الخروج
            </button>
          </div>
        </section>
      </div>

      {(notice || error) && (
        <div className="mt-6 space-y-2">
          {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-right text-sm font-black text-[#1b3a2c]">{label}</span>
      {children}
    </label>
  );
}

async function uploadAvatar(authClient, userId, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await authClient.storage.from('avatars').upload(fileName, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = authClient.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}

function normalizeError(err) {
  const text = `${err?.message || err || ''}`.toLowerCase();
  if (text.includes('duplicate key') || text.includes('username')) return 'اسم المستخدم مستخدم من قبل.';
  if (text.includes('email') && text.includes('already')) return 'هذا البريد مستخدم مسبقاً.';
  if (text.includes('auth') || text.includes('session')) return 'انتهت الجلسة. سجل دخولك من جديد.';
  if (text.includes('network') || text.includes('fetch')) return 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
