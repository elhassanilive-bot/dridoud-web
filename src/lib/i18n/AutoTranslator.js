'use client';

import { useEffect } from 'react';

const exact = {
  'طلب حذف الحساب': 'Delete Account Request',
  'تنبيه واضح': 'Important Notice',
  'حذف الحساب نهائي ولا يمكن التراجع عنه.': 'Account deletion is permanent and cannot be undone.',
  'سيتم حذف المنشورات، الصور، الفيديوهات، الرسائل، والتفاعلات.': 'Posts, photos, videos, messages, and interactions will be deleted.',
  'قد يستغرق تنفيذ الطلب عدة أيام بعد التحقق.': 'Processing may take several days after verification.',
  'معلومات مهمة': 'Important Information',
  'نطلب تأكيد كلمة المرور للتأكد من هوية الطلب، كما يمكنك إرفاق تفاصيل إضافية لسرعة المراجعة. سنرسل تأكيدًا إلى بريدك بعد المراجعة.': 'We ask for your password to confirm the request. You may add extra details to speed up review. We will email confirmation after review.',
  'حماية الطلبات': 'Request Protection',
  'البريد الإلكتروني *': 'Email Address *',
  'اسم المستخدم *': 'Username *',
  'سبب الحذف': 'Deletion Reason',
  'اختر سبباً': 'Choose a reason',
  'صف سببك': 'Describe your reason',
  'رسالة إضافية': 'Additional Message',
  'تأكيد كلمة المرور *': 'Confirm Password *',
  'إرسال طلب الحذف': 'Submit Deletion Request',
  'تأكيد حذف الحساب': 'Confirm Account Deletion',
  'هل أنت متأكد أنك تريد حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.': 'Are you sure you want to permanently delete your account? This action cannot be undone.',
  'إلغاء': 'Cancel',
  'نعم، احذف الحساب': 'Yes, Delete Account',
  'لا أستخدم الموقع كثيراً': 'I do not use the site often',
  'مخاوف تتعلق بالخصوصية': 'Privacy concerns',
  'مشاكل تقنية': 'Technical issues',
  'وجدت بديلاً آخر': 'I found another alternative',
  'محتوى غير مناسب': 'Inappropriate content',
  'سبب آخر': 'Other reason',

  'شكاوى وبلاغات': 'Complaints and Reports',
  'النظام الإشرافي': 'Moderation System',
  'الإبلاغ عن محتوى': 'Report Content',
  'دعم سريع وآمن': 'Fast and Secure Support',
  'الاسم الكامل': 'Full Name',
  'الاسم الكامل *': 'Full Name *',
  'اختر نوع البلاغ *': 'Choose Report Type *',
  'رابط المحتوى أو اسم المستخدم *': 'Content Link or Username *',
  'وصف المشكلة *': 'Problem Description *',
  'إرفاق دليل (اختياري)': 'Attach Evidence (Optional)',
  'إرسال البلاغ': 'Submit Report',
  'معلومات إضافية': 'Additional Information',
  'بعد الإرسال، سيقوم فريق دريدود بدراسة البلاغ خلال أيام العمل. يمكنك متابعة الحالة عبر البريد الإلكتروني.': 'After submission, the Dridoud team will review your report during business days. You can follow up by email.',
  'تأكد من توضيح التفاصيل قدر الإمكان': 'Make sure to include as many details as possible',
  'إبلاغ عن مستخدم': 'Report a User',
  'سلوك مخالف أو مضايقة من حساب معين.': 'Abusive behavior or harassment from a specific account.',
  'إبلاغ عن منشور': 'Report a Post',
  'محتوى ينتهك السياسات أو مضلل.': 'Content that violates policies or is misleading.',
  'إبلاغ عن رسالة': 'Report a Message',
  'رسائل غير مرغوبة أو مسيئة داخل الدردشة.': 'Unwanted or abusive chat messages.',
  'إبلاغ عن مجموعة أو قناة': 'Report a Group or Channel',
  'محتوى المجموعة أو القناة مخالف.': 'Group or channel content violates policies.',
  'مشكلة تقنية': 'Technical Issue',
  'تعطل في التطبيق أو وظائف غير متوفرة.': 'App failure or unavailable features.',
  'شكوى عامة': 'General Complaint',
  'ملاحظات عامة غير مشمولة بالأنواع السابقة.': 'General notes not covered by the previous types.',

  'الحساب': 'Account',
  'الواجهة': 'Interface',
  'الرئيسية': 'Home',
  'الميزات': 'Features',
  'تحميل': 'Download',
  'من نحن': 'About Us',
  'سياسة الخصوصية': 'Privacy Policy',
  'الشروط والأحكام': 'Terms and Conditions',
  'الاتفاقيات': 'Agreements',
  'أمان البيانات': 'Data Security',
  'اتصل بنا': 'Contact Us',
  'الأسئلة الشائعة': 'FAQ',
  'إنشاء منشور': 'Create Post',
  'إعدادات الحساب': 'Account Settings',
  'الملف الشخصي': 'Profile',
  'البريد الإلكتروني': 'Email Address',
  'كلمة المرور': 'Password',
  'اسم المستخدم': 'Username',
  'المدينة': 'City',
  'البلد': 'Country',
  'الاسم الكامل (اختياري)': 'Full Name (Optional)',
  'المدينة (اختياري)': 'City (Optional)',
  'البلد (اختياري)': 'Country (Optional)',
  'تسجيل الدخول': 'Sign In',
  'إنشاء حساب': 'Create Account',
  'إنشاء حساب جديد': 'Create New Account',
  'نسيت كلمة المرور؟': 'Forgot Password?',
  'رجوع': 'Back',
  'التالي': 'Next',
  'السابق': 'Previous',
  'يرجى الانتظار...': 'Please wait...',
  'دخول': 'Sign In',
  'حفظ': 'Save',
  'إرسال': 'Send',
  'جاري الإرسال...': 'Sending...',
  'بحث': 'Search',
  'إضافة': 'Add',
  'استطلاع': 'Poll',
  'سؤال الاستطلاع': 'Poll Question',
  'الخيار الأول': 'First Option',
  'الخيار الثاني': 'Second Option',
  'شارك لحظتك...': 'Share your moment...',
  'ابحث عن ملصق...': 'Search for a sticker...',
  'جاري تحميل الملصقات...': 'Loading stickers...',
  'جاري تحميل الملف الشخصي...': 'Loading profile...',
  'العودة إلى الواجهة': 'Back to Interface',
  'تعديل الملف الشخصي': 'Edit Profile',
  'إضافة منشور': 'Add Post',
  'متابعة': 'Follow',
  'إلغاء المتابعة': 'Unfollow',
  'سجّل للدخول للمتابعة': 'Sign in to follow',
  'المنشورات': 'Posts',
  'الوسائط': 'Media',
  'الفيديو': 'Video',
  'حول': 'About',
  'الدولة': 'Country',
  'الوظيفة': 'Job',
  'مكان العمل': 'Workplace',
  'الحالة الاجتماعية': 'Marital Status',
};

const phraseRules = [
  [/آخر تحديث/g, 'Last updated'],
  [/رقم الهاتف/g, 'Phone Number'],
  [/البريد:/g, 'Email:'],
  [/اسم المستخدم:/g, 'Username:'],
  [/الاسم الكامل:/g, 'Full name:'],
  [/المدينة:/g, 'City:'],
  [/البلد:/g, 'Country:'],
  [/جاري/g, 'Loading'],
  [/منذ/g, 'ago'],
  [/قريبًا/g, 'Coming soon'],
  [/دريدود/g, 'Dridoud'],
];

const textOriginals = new WeakMap();
const translatedAttr = 'data-i18n-original';

export default function AutoTranslator({ language }) {
  useEffect(() => {
    let scheduled = false;

    const scheduleTranslation = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        translateDocument(language);
      });
    };

    translateDocument(language);
    const observer = new MutationObserver(scheduleTranslation);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}

function translateDocument(language) {
  translateTextNodes(document.body, language);
  translateAttributes(document.body, language);
}

function translateTextNodes(root, language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
    const original = textOriginals.get(node);
    const nextValue = language === 'ar' ? original : translateText(original);
    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
  }
}

function translateAttributes(root, language) {
  const elements = root.querySelectorAll('input, textarea, option, button, [aria-label], [title]');
  for (const element of elements) {
    for (const attr of ['placeholder', 'aria-label', 'title']) {
      if (!element.hasAttribute(attr)) continue;
      const storeName = `${translatedAttr}-${attr}`;
      if (!element.hasAttribute(storeName)) element.setAttribute(storeName, element.getAttribute(attr));
      const original = element.getAttribute(storeName);
      const nextValue = language === 'ar' ? original : translateText(original);
      if (element.getAttribute(attr) !== nextValue) {
        element.setAttribute(attr, nextValue);
      }
    }
  }
}

function translateText(value) {
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const text = value.trim();
  if (!text) return value;
  if (exact[text]) return `${leading}${exact[text]}${trailing}`;
  let translated = text;
  for (const [pattern, replacement] of phraseRules) translated = translated.replace(pattern, replacement);
  return `${leading}${translated}${trailing}`;
}
