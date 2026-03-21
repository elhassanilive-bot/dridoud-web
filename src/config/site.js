export const site = {
  name: "دريدود",
  nameEn: "Dridoud",
  description:
    "منصة تواصل اجتماعي عربية تجمع المنشورات، القصص، القنوات، والمجتمعات في تجربة واحدة آمنة وسريعة.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@dridoud.app",
  socials: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || "",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL || "",
  },
};
