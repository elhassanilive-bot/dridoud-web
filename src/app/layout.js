import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { site } from "@/config/site";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.nameEn,
  keywords: [
    "دريدود",
    "Dridoud",
    "منصة تواصل اجتماعي",
    "تطبيق اجتماعي عربي",
    "منشورات وصور وفيديو",
    "قنوات ومجموعات",
    "dridoud app",
    "arab social media app",
  ],
  authors: [{ name: "Dridoud Team", url: site.url }],
  creator: "Dridoud",
  publisher: "Dridoud",
  category: "social networking",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", type: "image/png" },
      { url: "/icon.png?v=4", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/apple-icon.png?v=4",
  },
  title: {
    default: `${site.name} | ${site.nameEn}`,
    template: `%s | ${site.nameEn}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
      en: "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: site.nameEn,
    title: `${site.name} | ${site.nameEn}`,
    description: site.description,
    url: "/",
    locale: "ar_SA",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Dridoud Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.nameEn}`,
    description: site.description,
    images: ["/icon.png"],
  },
};

// Root layout must include <html> and <body> according to Next.js App Router
export default function RootLayout({ children }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Dridoud",
    alternateName: "دريدود",
    url: site.url,
    logo: `${site.url}/icon.png`,
    email: site.supportEmail,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dridoud",
    alternateName: "دريدود",
    url: site.url,
    inLanguage: ["ar", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background text-foreground font-sans">
        <Script
          id="ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Script
          id="ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
