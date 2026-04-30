import { site } from "@/config/site";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}




