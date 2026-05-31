export const faqCopy = {
  ar: {
    eyebrow: 'دعم ذاتي',
    title: 'الأسئلة الشائعة',
    subtitle: 'هنا ستجد إجابات لأكثر الأسئلة شيوعًا حول استخدام دريدود، من الحساب مرورًا بالنشر والتفاعل، وصولًا إلى الخصوصية والمشاكل التقنية.',
    tags: ['الحساب', 'النشر', 'الأمان', 'الدعم'],
    search: 'ابحث عن موضوع أو سؤال',
    results: 'نتيجة',
    noResults: 'لم يتم العثور على نتائج مطابقة. جرّب كلمات مختلفة.',
    sections: [
      {
        id: 'account',
        title: 'الحساب والتسجيل',
        icon: 'user',
        items: [
          ['create-account', 'كيف يمكنني إنشاء حساب في دريدود؟', 'اضغط على زر إنشاء حساب، واملأ البيانات الأساسية. ستتلقى رسالة تأكيد لإكمال التسجيل.'],
          ['email-unique', 'هل يمكنني استخدام نفس البريد لأكثر من حساب؟', 'تتطلب المنصة بريدًا إلكترونيًا فريدًا لكل حساب.'],
          ['confirmation-delay', 'لماذا لم تصلني رسالة التأكيد؟', 'تحقق من مجلد الرسائل المزعجة، وانتظر بضع دقائق، ثم أعد إرسال رابط التأكيد.'],
        ],
      },
      {
        id: 'login-security',
        title: 'تسجيل الدخول والأمان',
        icon: 'shield',
        items: [
          ['forgot-password', 'ماذا أفعل إذا نسيت كلمة المرور؟', 'استخدم رابط نسيت كلمة المرور وسنرسل تعليمات إعادة التعيين إلى بريدك.'],
          ['change-password', 'كيف أغير كلمة المرور؟', 'ادخل إلى الإعدادات ثم الأمان، واستخدم قسم تحديث كلمة المرور.'],
          ['protect-account', 'كيف أحمي حسابي؟', 'استخدم كلمة مرور قوية ولا تشارك بيانات الدخول مع أي جهة.'],
        ],
      },
      {
        id: 'content',
        title: 'النشر والمحتوى',
        icon: 'sparkles',
        items: [
          ['create-post', 'كيف أنشر منشوراً؟', 'انقر على إنشاء منشور، أضف النص أو الوسائط، ثم انشره مباشرة.'],
          ['content-types', 'ما أنواع المحتوى التي يمكنني نشرها؟', 'يمكنك نشر نصوص وصور وفيديوهات وGIF واستطلاعات رأي.'],
          ['edit-post', 'هل يمكنني تعديل أو حذف منشور؟', 'نعم، استخدم قائمة المنشور لاختيار تعديل أو حذف.'],
        ],
      },
      {
        id: 'settings',
        title: 'الإعدادات والخصوصية',
        icon: 'cog',
        items: [
          ['change-language', 'كيف أغير اللغة؟', 'استخدم زر اللغة في أعلى الموقع للتبديل بين العربية والإنجليزية.'],
          ['privacy-settings', 'كيف أتحكم في الخصوصية؟', 'توفر الإعدادات التحكم بخصوصية المنشورات ومن يمكنه رؤيتها.'],
          ['report-content', 'كيف أبلغ عن محتوى؟', 'استخدم زر الإبلاغ بجانب المنشور واختر سبب البلاغ.'],
        ],
      },
    ],
  },
  en: {
    eyebrow: 'Self Support',
    title: 'Frequently Asked Questions',
    subtitle: 'Find clear answers about using Dridoud, from accounts and publishing to privacy, safety, and technical issues.',
    tags: ['Account', 'Publishing', 'Security', 'Support'],
    search: 'Search a topic or question',
    results: 'results',
    noResults: 'No matching results found. Try different keywords.',
    sections: [
      {
        id: 'account',
        title: 'Account and Registration',
        icon: 'user',
        items: [
          ['create-account', 'How can I create a Dridoud account?', 'Tap Create Account, fill in the basic details, and confirm your email to complete registration.'],
          ['email-unique', 'Can I use the same email for more than one account?', 'Each account needs a unique email address.'],
          ['confirmation-delay', 'Why did I not receive the confirmation email?', 'Check your spam folder, wait a few minutes, then resend the confirmation link.'],
        ],
      },
      {
        id: 'login-security',
        title: 'Login and Security',
        icon: 'shield',
        items: [
          ['forgot-password', 'What should I do if I forgot my password?', 'Use the Forgot Password link and we will send reset instructions to your email.'],
          ['change-password', 'How can I change my password?', 'Open Settings, then Security, and use the password update section.'],
          ['protect-account', 'How do I protect my account?', 'Use a strong password and never share your login details.'],
        ],
      },
      {
        id: 'content',
        title: 'Publishing and Content',
        icon: 'sparkles',
        items: [
          ['create-post', 'How do I publish a post?', 'Click Create Post, add text or media, then publish it.'],
          ['content-types', 'What content types can I publish?', 'You can publish text, photos, videos, GIFs, and polls.'],
          ['edit-post', 'Can I edit or delete a post?', 'Yes. Use the post menu to choose Edit or Delete.'],
        ],
      },
      {
        id: 'settings',
        title: 'Settings and Privacy',
        icon: 'cog',
        items: [
          ['change-language', 'How do I change the language?', 'Use the language button at the top of the site to switch between Arabic and English.'],
          ['privacy-settings', 'How do I control privacy?', 'Settings let you control post privacy and who can view your content.'],
          ['report-content', 'How do I report content?', 'Use the report button next to a post and choose the reason.'],
        ],
      },
    ],
  },
};

export function normalizeFaqSections(sections) {
  return sections.map((section) => ({
    ...section,
    items: section.items.map(([id, question, answer]) => ({ id, question, answer })),
  }));
}
