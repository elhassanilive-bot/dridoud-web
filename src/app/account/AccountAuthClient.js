'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

const initialState = {
  email: '',
  password: '',
  username: '',
  confirmPassword: '',
};

export default function AccountAuthClient() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const configured = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    let mounted = true;
    let unsub = null;

    async function initSession() {
      if (!configured) return;
      const authClient = await getSupabaseClient();
      if (!authClient || !mounted) return;

      const { data } = await authClient.auth.getSession();
      if (mounted && data.session?.user) {
        router.replace('/account/me');
      }

      const listener = authClient.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          router.replace('/account/me');
        }
      });
      unsub = listener.data.subscription;
    }

    initSession();

    return () => {
      mounted = false;
      if (unsub) unsub.unsubscribe();
    };
  }, [configured, router]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetMessages() {
    setNotice('');
    setError('');
  }

  function resetForm() {
    setForm(initialState);
  }

  function validate() {
    const email = form.email.trim().toLowerCase();
    if (!email) return 'يرجى إدخال البريد الإلكتروني.';
    if (!form.password) return 'يرجى إدخال كلمة المرور.';
    if (form.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';

    if (mode === 'signup') {
      const username = form.username.trim();
      if (!username) return 'يرجى إدخال اسم المستخدم.';
      if (username.length < 3) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل.';
      if (form.password !== form.confirmPassword) return 'تأكيد كلمة المرور غير مطابق.';
    }
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    resetMessages();

    if (!configured) {
      setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) {
        setError('تعذر إكمال العملية الآن.');
        return;
      }

      const email = form.email.trim().toLowerCase();
      if (mode === 'signin') {
        const { error: signInError } = await authClient.auth.signInWithPassword({
          email,
          password: form.password,
        });
        if (signInError) {
          setError(arabicAuthError(signInError.message));
          return;
        }

        setNotice('تم تسجيل الدخول بنجاح.');
        router.replace('/account/me');
        return;
      }

      const username = form.username.trim();
      const { data, error: signUpError } = await authClient.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            username,
            auth_source: 'dridoud_web',
          },
        },
      });

      if (signUpError) {
        setError(arabicAuthError(signUpError.message));
        return;
      }

      if (data.session) {
        setNotice('تم إنشاء الحساب وتسجيل الدخول مباشرة.');
        router.replace('/account/me');
      } else {
        setNotice('تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب.');
      }
      resetForm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f4fff8] via-white to-[#effaf3] py-8 sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-14 top-10 h-56 w-56 rounded-full bg-emerald-200/55 blur-3xl" />
        <div className="absolute -right-10 bottom-6 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_460px] lg:items-center">
        <aside className="order-2 rounded-[2rem] border border-emerald-200/70 bg-white/90 p-7 shadow-[0_20px_50px_rgba(7,58,34,0.12)] lg:order-1 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.42em] text-emerald-600">Dridoud</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[#072b19] sm:text-5xl">
            ادخل إلى حسابك
            <span className="block text-emerald-700">وتابع كل جديد</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#214737]">
            واجهة تسجيل سريعة وآمنة بأسلوب حديث، مصممة لتوصلك إلى حسابك خلال ثوانٍ مع تجربة مريحة على الهاتف والحاسوب.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <FeatureCard title="دخول سريع" text="الوصول لحسابك مباشرة بعد التحقق من البيانات." />
            <FeatureCard title="حماية قوية" text="تنبيهات واضحة وإدارة مرنة لبيانات الحساب." />
          </div>
        </aside>

        <div className="order-1 rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.12)] sm:p-6 lg:order-2">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-[#eef7f0] p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                resetMessages();
              }}
              className={[
                'rounded-xl px-4 py-2.5 text-sm font-bold transition',
                mode === 'signin' ? 'bg-emerald-700 text-white shadow-sm' : 'text-emerald-800 hover:bg-white',
              ].join(' ')}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                resetMessages();
              }}
              className={[
                'rounded-xl px-4 py-2.5 text-sm font-bold transition',
                mode === 'signup' ? 'bg-emerald-700 text-white shadow-sm' : 'text-emerald-800 hover:bg-white',
              ].join(' ')}
            >
              إنشاء حساب
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <LabeledInput
              label="البريد الإلكتروني"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(v) => updateField('email', v)}
            />

            <LabeledInput
              label="كلمة المرور"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(v) => updateField('password', v)}
            />

            {mode === 'signup' && (
              <>
                <LabeledInput
                  label="اسم المستخدم"
                  type="text"
                  placeholder="dridoud_user"
                  value={form.username}
                  onChange={(v) => updateField('username', v)}
                />
                <LabeledInput
                  label="تأكيد كلمة المرور"
                  type="password"
                  placeholder="********"
                  value={form.confirmPassword}
                  onChange={(v) => updateField('confirmPassword', v)}
                />
              </>
            )}

            {mode === 'signin' && (
              <button
                type="button"
                className="w-full py-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                هل نسيت كلمة السر؟
              </button>
            )}

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {notice && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-2xl bg-emerald-700 px-4 py-3.5 text-lg font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'يرجى الانتظار...' : mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function LabeledInput({ label, type, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#1b3a2c]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#d3e7da] bg-[#f9fdfb] px-4 py-3 text-sm font-semibold text-[#10291d] outline-none transition placeholder:text-[#6a8377] focus:border-emerald-500 focus:bg-white"
      />
    </label>
  );
}

function FeatureCard({ title, text }) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-[#f6fcf8] p-4">
      <h3 className="text-base font-black text-[#0f3a26]">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#2c5442]">{text}</p>
    </article>
  );
}

function arabicAuthError(message) {
  const text = `${message || ''}`.toLowerCase();
  if (text.includes('invalid login credentials')) return 'بيانات تسجيل الدخول غير صحيحة.';
  if (text.includes('email not confirmed')) return 'يرجى تأكيد البريد الإلكتروني أولاً.';
  if (text.includes('already registered')) return 'هذا البريد مسجل مسبقاً.';
  if (text.includes('password')) return 'كلمة المرور غير صالحة.';
  if (text.includes('network') || text.includes('fetch')) return 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
