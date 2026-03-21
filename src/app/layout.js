import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { site } from "@/config/site";

export const metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.nameEn,
  title: {
    default: `${site.name} | ${site.nameEn}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: site.nameEn,
    title: `${site.name} | ${site.nameEn}`,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.nameEn}`,
    description: site.description,
  },
};

// Root layout must include <html> and <body> according to Next.js App Router
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background text-foreground font-sans">
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
