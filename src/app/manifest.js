import { site } from "@/config/site";

export default function manifest() {
  return {
    name: "دريدود - Dridoud",
    short_name: "Dridoud",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "ar",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

