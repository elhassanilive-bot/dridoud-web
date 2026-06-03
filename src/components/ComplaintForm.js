'use client';

import { useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  topic: 'محتوى مسيء',
  details: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComplaintForm() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'الاسم مطلوب.';
    if (!formData.email.trim()) {
      nextErrors.email = 'البريد الإلكتروني مطلوب.';
    } else if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = 'الرجاء إدخال بريد إلكتروني صالح.';
    }
    if (!formData.details.trim()) nextErrors.details = 'تفاصيل البلاغ مطلوبة.';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus({ type: 'error', message: 'يرجى تصحيح الحقول قبل الإرسال.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'pending', message: 'يتم إرسال البلاغ...' });

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complaints',
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.topic,
          message: formData.details.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus({ type: 'error', message: payload.message || 'تعذر إرسال البلاغ.' });
        return;
      }

      setFormData(initialForm);
      setStatus({ type: 'success', message: 'تم إرسال البلاغ بنجاح وسيتم مراجعته.' });
    } catch (_) {
      setStatus({ type: 'error', message: 'تعذر إرسال البلاغ. حاول لاحقاً.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 space-y-4 shadow-sm" noValidate>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">أرسل شكوى أو بلاغ</h3>

      {status.message && (
        <div className={[
          'rounded-2xl border px-4 py-3 text-sm font-semibold',
          status.type === 'success'
            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
            : status.type === 'error'
              ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200'
              : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200',
        ].join(' ')}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block text-gray-700 dark:text-gray-200">
          الاسم *
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 w-full rounded-xl border bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-800'}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </label>
        <label className="block text-gray-700 dark:text-gray-200">
          البريد الإلكتروني *
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 w-full rounded-xl border bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none ${errors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-800'}`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </label>
      </div>

      <label className="block text-gray-700 dark:text-gray-200">
        نوع الشكوى
        <select
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none"
        >
          <option>محتوى مسيء</option>
          <option>انتحال هوية / حقوق نشر</option>
          <option>مشكلة تقنية</option>
          <option>طلب دعم عام</option>
        </select>
      </label>

      <label className="block text-gray-700 dark:text-gray-200">
        تفاصيل البلاغ *
        <textarea
          name="details"
          value={formData.details}
          onChange={handleChange}
          rows={5}
          className={`mt-1 w-full rounded-2xl border bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-red-500 focus:outline-none ${errors.details ? 'border-red-400' : 'border-gray-200 dark:border-gray-800'}`}
        />
        {errors.details && <p className="mt-1 text-xs text-red-500">{errors.details}</p>}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="sticky bottom-4 z-10 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-base font-black text-white shadow-2xl shadow-red-500/30 transition hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
      </button>
    </form>
  );
}
