import { site } from "@/config/site";

export default function sitemap() {
  const now = new Date();
  const routes = [
    "",
    "/about",
    "/features",
    "/download",
    "/privacy",
    "/terms",
    "/agreements",
    "/dmca",
    "/security",
    "/contact",
    "/faq",
    "/complaints",
    "/deletion",
  ];

  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}

