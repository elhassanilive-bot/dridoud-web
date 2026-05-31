export const reportTypes = {
  ar: [
    { value: 'user', label: 'إبلاغ عن مستخدم', description: 'سلوك مخالف أو مضايقة من حساب معين.', icon: 'user' },
    { value: 'post', label: 'إبلاغ عن منشور', description: 'محتوى ينتهك السياسات أو مضلل.', icon: 'post' },
    { value: 'message', label: 'إبلاغ عن رسالة', description: 'رسائل غير مرغوبة أو مسيئة داخل الدردشة.', icon: 'message' },
    { value: 'channel', label: 'إبلاغ عن مجموعة أو قناة', description: 'محتوى المجموعة أو القناة مخالف.', icon: 'channels' },
    { value: 'technical', label: 'مشكلة تقنية', description: 'تعطل في التطبيق أو وظائف غير متوفرة.', icon: 'bug' },
    { value: 'general', label: 'شكوى عامة', description: 'ملاحظات عامة غير مشمولة بالأنواع السابقة.', icon: 'sparkles' },
  ],
  en: [
    { value: 'user', label: 'Report a User', description: 'Abusive behavior or harassment from a specific account.', icon: 'user' },
    { value: 'post', label: 'Report a Post', description: 'Content that violates policies or is misleading.', icon: 'post' },
    { value: 'message', label: 'Report a Message', description: 'Unwanted or abusive messages in chat.', icon: 'message' },
    { value: 'channel', label: 'Report a Group or Channel', description: 'Group or channel content violates policies.', icon: 'channels' },
    { value: 'technical', label: 'Technical Issue', description: 'App failure or unavailable features.', icon: 'bug' },
    { value: 'general', label: 'General Complaint', description: 'General notes not covered by the other report types.', icon: 'sparkles' },
  ],
};
