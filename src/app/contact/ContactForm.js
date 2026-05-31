'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const initialForm = {
  fullName: '',
  email: '',
  subject: '',
  message: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactCopy = {
  ar: {
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'اسمك الكامل',
    email: 'البريد الإلكتروني',
    subject: 'الموضوع',
    subjectPlaceholder: 'مثال: مشكلة في الحساب',
    message: 'نص الرسالة',
    messagePlaceholder: 'ما الذي يمكننا مساعدتك به؟',
    submit: 'إرسال',
    sending: 'جاري الإرسال...',
    sideTitle: 'أمان وتواصل مباشر',
    sideText: 'يوفر النموذج اتصالاً آمناً مباشرة إلى فريق دريدود. يتم التحقق من البريد والحقول المطلوبة قبل إرسال الرسالة.',
    phone: 'رقم الهاتف',
    errors: {
      fullName: 'الاسم الكامل مطلوب.',
      email: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'الرجاء إدخال بريد إلكتروني صالح.',
      message: 'نص الرسالة مطلوب.',
    },
    status: {
      fixFields: 'يرجى تصحيح الحقول قبل الإرسال.',
      pending: 'يتم إرسال الرسالة...',
      reviewFields: 'الرجاء مراجعة الحقول المشار إليها.',
      error: 'حدث خطأ أثناء الإرسال.',
      success: 'تم إرسال رسالتك بنجاح.',
      failed: 'تعذر إرسال الرسالة. حاول لاحقاً.',
    },
  },
  en: {
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your full name',
    email: 'Email Address',
    subject: 'Subject',
    subjectPlaceholder: 'Example: Account issue',
    message: 'Message',
    messagePlaceholder: 'How can we help you?',
    submit: 'Send',
    sending: 'Sending...',
    sideTitle: 'Secure direct contact',
    sideText: 'The form provides a secure direct connection to the Dridoud team. Email and required fields are checked before sending.',
    phone: 'Phone Number',
    errors: {
      fullName: 'Full name is required.',
      email: 'Email address is required.',
      emailInvalid: 'Please enter a valid email address.',
      message: 'Message text is required.',
    },
    status: {
      fixFields: 'Please correct the fields before sending.',
      pending: 'Sending your message...',
      reviewFields: 'Please review the highlighted fields.',
      error: 'An error occurred while sending.',
      success: 'Your message was sent successfully.',
      failed: 'Could not send the message. Try again later.',
    },
  },
};

function Icon({ name, className = 'h-5 w-5' }) {
  const shared = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    className,
  };

  switch (name) {
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M4 9l8 6 8-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M7 5h2l1 4-2 2a11 11 0 0 0 5 5l2-2 4 1v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 3 4 6v5c0 5.25 3.5 9.75 8 10 4.5-.25 8-4.75 8-10V6z" />
          <path d="M12 11v6" />
          <path d="M8 13h8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ContactForm() {
  const { language } = useLanguage();
  const t = contactCopy[language];
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const validationErrors = {};
    if (!form.fullName.trim()) {
      validationErrors.fullName = t.errors.fullName;
    }
    if (!form.email.trim()) {
      validationErrors.email = t.errors.email;
    } else if (!emailPattern.test(form.email)) {
      validationErrors.email = t.errors.emailInvalid;
    }
    if (!form.message.trim()) {
      validationErrors.message = t.errors.message;
    }
    return validationErrors;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setStatus({ type: 'error', message: t.status.fixFields });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'pending', message: t.status.pending });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload.errors) {
          setErrors(payload.errors);
          setStatus({ type: 'error', message: t.status.reviewFields });
        } else {
          setStatus({ type: 'error', message: payload.message || t.status.error });
        }
        return;
      }

      setStatus({ type: 'success', message: t.status.success });
      setForm(initialForm);
    } catch (error) {
      setStatus({ type: 'error', message: t.status.failed });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
      <div className="rounded-3xl bg-white/90 p-8 shadow-xl shadow-red-500/10 dark:bg-gray-900">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {status.message && (
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                status.type === 'success'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : status.type === 'error'
                  ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-200'
                  : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200'
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <span>{t.fullName} *</span>
              <input
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder={t.fullNamePlaceholder}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)] dark:bg-gray-900 dark:border-gray-800 ${
                  errors.fullName ? 'border-red-400' : 'border-gray-200'
                }`}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby="fullName-error"
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-xs text-red-500">
                  {errors.fullName}
                </p>
              )}
            </label>

            <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <span>{t.email} *</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="example@domain.com"
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)] dark:bg-gray-900 dark:border-gray-800 ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </label>
          </div>

          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>{t.subject}</span>
            <input
              type="text"
              value={form.subject}
              onChange={handleChange('subject')}
              placeholder={t.subjectPlaceholder}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)] dark:bg-gray-900 dark:border-gray-800"
            />
          </label>

          <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <span>{t.message} *</span>
            <textarea
              value={form.message}
              onChange={handleChange('message')}
              rows={5}
              placeholder={t.messagePlaceholder}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)] dark:bg-gray-900 dark:border-gray-800 ${
                errors.message ? 'border-red-400' : 'border-gray-200'
              }`}
              aria-invalid={Boolean(errors.message)}
              aria-describedby="message-error"
            />
            {errors.message && (
              <p id="message-error" className="text-xs text-red-500">
                {errors.message}
              </p>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? t.sending : t.submit}
          </button>
        </form>
      </div>

      <div className="rounded-3xl bg-gradient-to-b from-white to-red-50 p-8 shadow-xl shadow-red-500/10 dark:from-gray-900 dark:to-gray-950">
        <div className="space-y-5 text-gray-800 dark:text-gray-100">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Icon name="shield" className="h-6 w-6 text-red-600" />
            {t.sideTitle}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.sideText}
          </p>
        </div>
        <div className="mt-8 space-y-4 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm dark:bg-white/5">
            <Icon name="mail" className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold">{t.email}</p>
              <a className="text-sm text-red-600 hover:underline" href="mailto:support@dridoud.com">
                support@dridoud.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm dark:bg-white/5">
            <Icon name="phone" className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold">{t.phone}</p>
              <a className="text-sm text-red-600 hover:underline" href="tel:+212638813823">
                +212638813823
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

