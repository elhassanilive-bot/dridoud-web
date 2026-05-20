'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

const signupInitial = {
  email: '',
  username: '',
  fullName: '',
  city: '',
  country: '',
  password: '',
  confirmPassword: '',
};

const signinInitial = {
  email: '',
  password: '',
};

export default function AccountAuthClient() {
  const router = useRouter();
  const configured = useMemo(() => isSupabaseConfigured(), []);

  const [screen, setScreen] = useState('welcome');
  const [signupStep, setSignupStep] = useState(1);
  const [signup, setSignup] = useState(signupInitial);
  const [signin, setSignin] = useState(signinInitial);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '', '', '']);
  const [forgotOtpDigits, setForgotOtpDigits] = useState(['', '', '', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

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

      const listener = authClient.auth.onAuthStateChange((_event, sessionData) => {
        if (sessionData?.user) {
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

  function resetMessages() {
    setNotice('');
    setError('');
  }

  function goto(next) {
    resetMessages();
    setScreen(next);
  }

  function updateSignup(key, value) {
    setSignup((prev) => ({ ...prev, [key]: value }));
  }

  function updateSignin(key, value) {
    setSignin((prev) => ({ ...prev, [key]: value }));
  }

  function validateSignupStep(step) {
    const email = signup.email.trim().toLowerCase();
    const username = signup.username.trim();

    if (step === 1) {
      if (!email) return 'يرجى إدخال البريد الإلكتروني.';
      if (!username) return 'يرجى إدخال اسم المستخدم.';
      if (username.length < 3) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل.';
    }

    if (step === 3) {
      if (!signup.password) return 'يرجى إدخال كلمة المرور.';
      if (signup.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
      if (signup.password !== signup.confirmPassword) return 'تأكيد كلمة المرور غير مطابق.';
    }

    return '';
  }

  function nextSignupStep() {
    const validationError = validateSignupStep(signupStep);
    if (validationError) return setError(validationError);
    resetMessages();
    setSignupStep((prev) => Math.min(4, prev + 1));
  }

  function prevSignupStep() {
    resetMessages();
    setSignupStep((prev) => Math.max(1, prev - 1));
  }

  async function submitSignin(event) {
    event.preventDefault();
    resetMessages();

    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');

    const email = signin.email.trim().toLowerCase();
    if (!email) return setError('يرجى إدخال البريد الإلكتروني.');
    if (!signin.password) return setError('يرجى إدخال كلمة المرور.');

    setLoading(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');

      const { error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password: signin.password,
      });

      if (signInError) return setError(arabicAuthError(signInError.message));

      setNotice('تم تسجيل الدخول بنجاح.');
      router.replace('/account/me');
    } finally {
      setLoading(false);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    resetMessages();

    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');

    const finalValidation = validateSignupStep(1) || validateSignupStep(3);
    if (finalValidation) {
      setError(finalValidation);
      setSignupStep(1);
      return;
    }

    setLoading(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');

      const { data, error: signUpError } = await authClient.auth.signUp({
        email: signup.email.trim().toLowerCase(),
        password: signup.password,
        options: {
          data: {
            username: signup.username.trim(),
            full_name: signup.fullName.trim() || null,
            city: signup.city.trim() || null,
            country: signup.country.trim() || null,
            auth_source: 'dridoud_web',
          },
        },
      });

      if (signUpError) return setError(arabicAuthError(signUpError.message));

      if (data.session) {
        setNotice('تم إنشاء الحساب وتسجيل الدخول مباشرة.');
        router.replace('/account/me');
        return;
      }

      setOtpDigits(['', '', '', '', '', '', '', '']);
      setNotice('أرسلنا رمز التحقق إلى بريدك الإلكتروني. أدخل الرمز ثم اضغط تحقق.');
      setScreen('verify');
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot(event) {
    event.preventDefault();
    resetMessages();

    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');

    const email = forgotEmail.trim().toLowerCase();
    if (!email) return setError('يرجى إدخال البريد الإلكتروني.');

    setLoading(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');

      const { error: resetError } = await authClient.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined,
      });

      if (resetError) return setError(arabicAuthError(resetError.message));
      setForgotOtpDigits(['', '', '', '', '', '', '', '']);
      setNotice('أرسلنا رمز التحقق إلى بريدك الإلكتروني. أدخل الرمز للمتابعة.');
      setScreen('forgot_verify');
    } finally {
      setLoading(false);
    }
  }

  async function resendVerificationEmail() {
    resetMessages();
    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');
    const email = signup.email.trim().toLowerCase();
    if (!email) return setError('لا يوجد بريد لإعادة الإرسال.');

    setResending(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');
      const { error: resendError } = await authClient.auth.resend({ type: 'signup', email });
      if (resendError) return setError(arabicAuthError(resendError.message));
      setNotice('تمت إعادة إرسال رسالة التحقق بنجاح.');
    } finally {
      setResending(false);
    }
  }

  async function submitSignupOtp() {
    resetMessages();
    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');

    const email = signup.email.trim().toLowerCase();
    const otp = otpDigits.join('').trim();
    if (!email) return setError('لا يوجد بريد للتحقق.');
    if (otp.length !== 8) return setError('يرجى إدخال رمز تحقق مكوّن من 8 أرقام.');

    setChecking(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');

      const { data, error: verifyError } = await authClient.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (verifyError) return setError(arabicAuthError(verifyError.message));
      if (!data?.session?.user && !data?.user) {
        return setError('فشل التحقق من الرمز. حاول مرة أخرى.');
      }

      setNotice('تم التحقق من البريد بنجاح.');
      router.replace('/account/me');
    } finally {
      setChecking(false);
    }
  }


  async function resendForgotOtp() {
    resetMessages();
    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');
    const email = forgotEmail.trim().toLowerCase();
    if (!email) return setError('لا يوجد بريد لإعادة الإرسال.');

    setResending(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');
      const { error: resendError } = await authClient.auth.resend({ type: 'recovery', email });
      if (resendError) return setError(arabicAuthError(resendError.message));
      setNotice('تمت إعادة إرسال رمز الاستعادة بنجاح.');
    } finally {
      setResending(false);
    }
  }

  async function submitForgotOtp() {
    resetMessages();
    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');

    const email = forgotEmail.trim().toLowerCase();
    const otp = forgotOtpDigits.join('').trim();
    if (!email) return setError('لا يوجد بريد للتحقق.');
    if (otp.length !== 8) return setError('يرجى إدخال رمز تحقق مكوّن من 8 أرقام.');

    setChecking(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');

      const { error: verifyError } = await authClient.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });

      if (verifyError) return setError(arabicAuthError(verifyError.message));

      setNotice('تم التحقق من الرمز. الآن أدخل كلمة المرور الجديدة.');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setScreen('forgot_reset');
    } finally {
      setChecking(false);
    }
  }

  async function submitForgotResetPassword(event) {
    event.preventDefault();
    resetMessages();
    if (!configured) return setError('الخدمة غير متاحة حالياً. حاول لاحقاً.');

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      return setError('تأكيد كلمة المرور غير مطابق.');
    }

    setLoading(true);
    try {
      const authClient = await getSupabaseClient();
      if (!authClient) return setError('تعذر إكمال العملية الآن.');

      const { error: updateError } = await authClient.auth.updateUser({
        password: forgotNewPassword,
      });

      if (updateError) return setError(arabicAuthError(updateError.message));

      setNotice('تم تعيين كلمة المرور الجديدة بنجاح. يمكنك تسجيل الدخول الآن.');
      setTimeout(() => {
        goto('signin');
      }, 600);
    } finally {
      setLoading(false);
    }
  }
  function setOtpAt(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
  }

  const signupProgress = (signupStep / 4) * 100;
  function setForgotOtpAt(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setForgotOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
  }
  const signinChecks = [
    { label: 'البريد الإلكتروني صالح', ok: /.+@.+\..+/.test(signin.email.trim()) },
    { label: 'كلمة المرور مدخلة', ok: signin.password.trim().length > 0 },
  ];
  const forgotChecks = [{ label: 'البريد الإلكتروني صالح', ok: /.+@.+\..+/.test(forgotEmail.trim()) }];
  const signupChecks = [
    { label: 'البريد الإلكتروني صالح', ok: /.+@.+\..+/.test(signup.email.trim()) },
    { label: 'اسم المستخدم 3 أحرف+', ok: signup.username.trim().length >= 3 },
    { label: 'كلمة المرور 6 أحرف+', ok: signup.password.length >= 6 },
    { label: 'تأكيد كلمة المرور مطابق', ok: signup.password.length > 0 && signup.password === signup.confirmPassword },
  ];

  return (
    <section dir="rtl" className="relative overflow-hidden bg-gradient-to-b from-[#fff5f7] via-white to-[#fff0f3] py-8 sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-12 top-10 h-56 w-56 rounded-full bg-rose-200/60 blur-3xl" />
        <div className="absolute -right-12 bottom-8 h-72 w-72 rounded-full bg-red-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_460px] lg:items-center">
        <aside className="order-2 rounded-[2rem] border border-rose-200/70 bg-white/90 p-7 shadow-[0_20px_50px_rgba(127,17,22,0.12)] lg:order-1 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.42em] text-rose-700">DRIDOUD</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[#3f0d13] sm:text-5xl">مرحبا بك في عالم <span className="block text-rose-700">دريدود</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#5c1a25]">شارك لحظتك مع أبرز المبدعين مثلك. في دريدود أطلق العنان لأجمل لحظاتك وشاركها مع العالم الآن. أنشر قصصك. يومياتك. آراءك مع الجميع واستكشف وتابع المبدعين مثلك. بلا قيود ولا خوارزميات تقليدية.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <FeatureCard title="لمادا دريدود هو خيارك المثالي" text="تشارك ما تحب بحريتك وبدون قيود ولا حظر للمحتوى. بشرط أن يكون خاضع للسلوك القانونية ويحترم شرع الله والقيم الاسلامية." />
            <FeatureCard title="نحن نشجعك لتستمر" text="شارك بحريتك. عبر عن لحظاتك. نحن لا نقوم بحظر المحتوى الأخلاقي ولا قيود ولا خوارزميات. كما تنشره مباشرة يراه العالم." />
          </div>
        </aside>

        <div className="order-1 rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.12)] sm:p-6 lg:order-2">
          {screen === 'welcome' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#2c0b11]">مرحباً بك في دريدود</h2>
              <p className="text-sm leading-7 text-[#6c2732]">اختر طريقة المتابعة، ويمكنك دائماً الرجوع وتبديل الخيار.</p>
              <button type="button" onClick={() => goto('signin')} className="w-full rounded-2xl bg-rose-700 px-4 py-3 text-base font-black text-white hover:bg-rose-800">تسجيل الدخول</button>
              <button type="button" onClick={() => goto('signup')} className="w-full rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-base font-black text-rose-700 hover:bg-rose-100">إنشاء حساب جديد</button>
              <button type="button" onClick={() => goto('forgot')} className="w-full py-2 text-sm font-bold text-rose-700 hover:text-rose-800">نسيت كلمة المرور؟</button>
            </div>
          )}

          {screen === 'signin' && (
            <form className="space-y-3" onSubmit={submitSignin}>
              <HeaderRow title="تسجيل الدخول" back={() => goto('welcome')} />
              <LabeledInput label="البريد الإلكتروني" type="email" placeholder="you@example.com" value={signin.email} onChange={(v) => updateSignin('email', v)} />
              <LabeledInput label="كلمة المرور" type="password" placeholder="********" value={signin.password} onChange={(v) => updateSignin('password', v)} />
              <VerificationPanel title="التحقق قبل تسجيل الدخول" items={signinChecks} />
              <button type="button" onClick={() => goto('forgot')} className="w-full py-1 text-sm font-semibold text-rose-700 hover:text-rose-800">نسيت كلمة المرور؟</button>
              <Status error={error} notice={notice} />
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-rose-700 px-4 py-3.5 text-lg font-black text-white hover:bg-rose-800 disabled:opacity-70">{loading ? 'يرجى الانتظار...' : 'دخول'}</button>
              <button type="button" onClick={() => goto('signup')} className="w-full py-1 text-sm font-semibold text-[#5c1a25] hover:text-rose-800">ليس لديك حساب؟ إنشاء حساب</button>
            </form>
          )}

          {screen === 'forgot' && (
            <form className="space-y-3" onSubmit={submitForgot}>
              <HeaderRow title="نسيت كلمة المرور" back={() => goto('signin')} />
              <p className="text-sm leading-7 text-[#6c2732]">أدخل بريدك الإلكتروني وسنرسل لك رمز استعادة (OTP).</p>
              <LabeledInput label="البريد الإلكتروني" type="email" placeholder="you@example.com" value={forgotEmail} onChange={setForgotEmail} />
              <VerificationPanel title="التحقق قبل إرسال الرمز" items={forgotChecks} />
              <Status error={error} notice={notice} />
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-rose-700 px-4 py-3.5 text-lg font-black text-white hover:bg-rose-800 disabled:opacity-70">{loading ? 'جاري إرسال الرمز...' : 'إرسال رمز الاستعادة'}</button>
            </form>
          )}

          {screen === 'forgot_verify' && (
            <div className='space-y-4'>
              <HeaderRow title='تحقق من رمز الاستعادة' back={() => goto('forgot')} />
              <p className='text-sm leading-7 text-[#6c2732]'>أدخل رمز التحقق المرسل إلى: <strong>{forgotEmail}</strong></p>
              <div className='rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-600 to-rose-500 p-4 text-white'>
                <p className='text-xs font-bold opacity-90'>رمز الاستعادة (8 أرقام)</p>
                <div className='mt-3 flex items-center justify-between gap-2' dir='ltr'>
                  {forgotOtpDigits.map((d, i) => (
                    <input key={i} value={d} onChange={(e) => setForgotOtpAt(i, e.target.value)} maxLength={1} className='h-12 w-10 rounded-xl border border-white/60 bg-white text-center text-lg font-black text-rose-700 outline-none' inputMode='numeric' />
                  ))}
                </div>
              </div>
              <Status error={error} notice={notice} />
              <button type='button' onClick={submitForgotOtp} disabled={checking} className='w-full rounded-2xl bg-rose-700 px-4 py-3 font-bold text-white hover:bg-rose-800 disabled:opacity-70'>{checking ? 'جاري التحقق...' : 'تحقق من الرمز'}</button>
              <button type='button' onClick={resendForgotOtp} disabled={resending} className='w-full rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-70'>{resending ? 'جاري إعادة الإرسال...' : 'إعادة إرسال الرمز'}</button>
            </div>
          )}

          {screen === 'forgot_reset' && (
            <form className='space-y-3' onSubmit={submitForgotResetPassword}>
              <HeaderRow title='تعيين كلمة مرور جديدة' back={() => goto('forgot_verify')} />
              <p className='text-sm leading-7 text-[#6c2732]'>أدخل كلمة المرور الجديدة ثم أكدها لإكمال الاستعادة.</p>
              <LabeledInput label='كلمة المرور الجديدة' type='password' placeholder='********' value={forgotNewPassword} onChange={setForgotNewPassword} />
              <LabeledInput label='تأكيد كلمة المرور الجديدة' type='password' placeholder='********' value={forgotConfirmPassword} onChange={setForgotConfirmPassword} />
              <Status error={error} notice={notice} />
              <button type='submit' disabled={loading} className='w-full rounded-2xl bg-rose-700 px-4 py-3.5 text-lg font-black text-white hover:bg-rose-800 disabled:opacity-70'>{loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button>
            </form>
          )}

          {screen === 'signup' && (
            <form className="space-y-3" onSubmit={submitSignup}>
              <HeaderRow title="إنشاء حساب" back={() => goto('welcome')} />
              <ProgressCard step={signupStep} progress={signupProgress} />

              {signupStep === 1 && (
                <>
                  <LabeledInput label="البريد الإلكتروني" type="email" placeholder="you@example.com" value={signup.email} onChange={(v) => updateSignup('email', v)} />
                  <LabeledInput label="اسم المستخدم" type="text" placeholder="dridoud_user" value={signup.username} onChange={(v) => updateSignup('username', v)} />
                </>
              )}
              {signupStep === 2 && (
                <>
                  <LabeledInput label="الاسم الكامل (اختياري)" type="text" placeholder="الاسم الكامل" value={signup.fullName} onChange={(v) => updateSignup('fullName', v)} />
                  <LabeledInput label="المدينة (اختياري)" type="text" placeholder="المدينة" value={signup.city} onChange={(v) => updateSignup('city', v)} />
                  <LabeledInput label="البلد (اختياري)" type="text" placeholder="البلد" value={signup.country} onChange={(v) => updateSignup('country', v)} />
                </>
              )}
              {signupStep === 3 && (
                <>
                  <LabeledInput label="كلمة المرور" type="password" placeholder="********" value={signup.password} onChange={(v) => updateSignup('password', v)} />
                  <LabeledInput label="تأكيد كلمة المرور" type="password" placeholder="********" value={signup.confirmPassword} onChange={(v) => updateSignup('confirmPassword', v)} />
                </>
              )}
              {signupStep === 4 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-[#5c1a25]">
                  <p><strong>البريد:</strong> {signup.email || '-'}</p><p><strong>اسم المستخدم:</strong> {signup.username || '-'}</p><p><strong>الاسم الكامل:</strong> {signup.fullName || '-'}</p><p><strong>المدينة:</strong> {signup.city || '-'}</p><p><strong>البلد:</strong> {signup.country || '-'}</p>
                </div>
              )}

              <VerificationPanel title="التحقق من بيانات الحساب" items={signupChecks} />
              <Status error={error} notice={notice} />
              <div className="flex items-center gap-2">
                {signupStep > 1 && <button type="button" onClick={prevSignupStep} className="w-full rounded-2xl border border-rose-300 bg-white px-4 py-3 font-bold text-rose-700 hover:bg-rose-50">السابق</button>}
                {signupStep < 4 ? (
                  <button type="button" onClick={nextSignupStep} className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-bold text-white hover:bg-rose-800">التالي</button>
                ) : (
                  <button type="submit" disabled={loading} className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-bold text-white hover:bg-rose-800 disabled:opacity-70">{loading ? 'يرجى الانتظار...' : 'إنشاء الحساب'}</button>
                )}
              </div>
            </form>
          )}

          {screen === 'verify' && (
            <div className="space-y-4">
              <HeaderRow title="تحقق من بريدك الإلكتروني" back={() => goto('signin')} />
              <p className="text-sm leading-7 text-[#6c2732]">أرسلنا رسالة التحقق إلى: <strong>{signup.email}</strong></p>

              <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-600 to-rose-500 p-4 text-white">
                <p className="text-xs font-bold opacity-90">رمز التحقق (واجهة مطابقة للتطبيق)</p>
                <div className="mt-3 flex items-center justify-between gap-2" dir="ltr">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      value={d}
                      onChange={(e) => setOtpAt(i, e.target.value)}
                      maxLength={1}
                      className="h-12 w-10 rounded-xl border border-white/60 bg-white text-center text-lg font-black text-rose-700 outline-none"
                      inputMode="numeric"
                    />
                  ))}
                </div>
              </div>

              <Status error={error} notice={notice} />

              <button type="button" onClick={submitSignupOtp} disabled={checking} className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-bold text-white hover:bg-rose-800 disabled:opacity-70">
                {checking ? 'جاري التحقق...' : 'تحقق من الرمز'}
              </button>
              <button type="button" onClick={resendVerificationEmail} disabled={resending} className="w-full rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-70">
                {resending ? 'جاري إعادة الإرسال...' : 'إعادة إرسال رمز التحقق'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeaderRow({ title, back }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <h2 className="text-xl font-black text-[#2c0b11]">{title}</h2>
      <button type="button" onClick={back} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700 hover:bg-rose-100">رجوع</button>
    </div>
  );
}

function ProgressCard({ step, progress }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-rose-700"><span>الخطوة {step} من 4</span><span>{Math.round(progress)}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-rose-600 transition-all" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function VerificationPanel({ title, items }) {
  const passed = items.filter((i) => i.ok).length;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
      <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-extrabold text-rose-700">{title}</h4><span className="text-xs font-black text-rose-700">{passed}/{items.length}</span></div>
      <div className="space-y-1.5">{items.map((item) => (<div key={item.label} className="flex items-center gap-2 text-xs"><span className={item.ok ? 'text-emerald-600' : 'text-rose-500'}>{item.ok ? '●' : '○'}</span><span className={item.ok ? 'font-bold text-emerald-700' : 'text-rose-700'}>{item.label}</span></div>))}</div>
    </div>
  );
}

function Status({ error, notice }) {
  return <>{error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{notice && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{notice}</p>}</>;
}

function LabeledInput({ label, type, value, onChange, placeholder }) {
  return (
    <label className="block"><span className="mb-1.5 block text-sm font-bold text-[#3f0d13]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-[#f1c8d0] bg-[#fffafb] px-4 py-3 text-sm font-semibold text-[#2e0f15] outline-none transition placeholder:text-[#9a6a74] focus:border-rose-500 focus:bg-white" /></label>
  );
}

function FeatureCard({ title, text }) {
  return <article className="rounded-2xl border border-rose-100 bg-[#fff6f8] p-4"><h3 className="text-base font-black text-[#4b101a]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#6a2632]">{text}</p></article>;
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





