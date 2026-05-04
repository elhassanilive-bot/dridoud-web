export const site = {
  name: "دريدود",
  nameEn: "Dridoud",
  description:
    "دريدود هو تطبيق تواصل اجتماعي من الجيل الجديد. يتميز بعدة مزايا مثل القنوات والمجموعات والقصص والفيديوهات واستطلاعات الرأي والعديد من المزايا التي تجعله مميزًا من بين تطبيقات التواصل الأخرى.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dridoud.com").replace(/\/+$/, ""),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@dridoud.app",
  socials: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || "",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL || "",
  },
};
