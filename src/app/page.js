export const metadata = {
  title: "Ø¯Ø±ÙŠØ¯ÙˆØ¯ - Dridoud ØªØ·Ø¨ÙŠÙ‚ ØªÙˆØ§ØµÙ„ Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠ Ø¹ØµØ±ÙŠ",
  description: "Ø´Ø§Ø±Ùƒ Ù„Ø­Ø¸ØªÙƒ Ù…Ø¹ Ø¯Ø±ÙŠØ¯ÙˆØ¯ØŒ Ù…Ø­ØªÙˆØ§Ùƒ Ø¢Ù…Ù† ÙˆØ³Ø±ÙŠØ¹ Ø§Ù„Ø§Ù†ØªØ´Ø§Ø±ØŒ Ù„Ø§ Ø®ÙˆØ§Ø±Ø²Ù…ÙŠØ§Øª Ù„Ù„ØªØµÙÙŠØ© ÙˆÙ„Ø§ Ù‚ÙŠÙˆØ¯ Ø¥Ø¶Ø§ÙÙŠØ©.",
  alternates: { canonical: "/" },
};

import Link from "next/link";
import Image from "next/image";
import heroBanner from "../../assets/baner.jpg";
import { homeContent } from "@/content/home";

const galleryScreenshots = homeContent.galleryScreenshots;
const comparisonPlatforms = [
  { key: "dridoud", label: "Ø¯Ø±ÙŠØ¯ÙˆØ¯", color: "text-red-600 dark:text-red-400" },
  { key: "facebook", label: "Facebook", color: "text-blue-600" },
  { key: "instagram", label: "Instagram", color: "text-pink-500" },
  { key: "twitter", label: "Twitter (X)", color: "text-sky-500" },
  { key: "threads", label: "Threads", color: "text-fuchsia-600" },
  { key: "tiktok", label: "TikTok", color: "text-teal-500" },
];
const comparisonRows = [
  {
    feature: "ØªØ¬Ø±Ø¨Ø© Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©",
    dridoud: "Ù…Ù†Ø´ÙˆØ±Ø§Øª + ØµÙˆØ± + ÙÙŠØ¯ÙŠÙˆ + ØµÙˆØª ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯",
    facebook: "Ù…Ù†Ø´ÙˆØ±Ø§Øª ÙˆÙ†ØµÙˆØµ Ù…Ø¹ Ø¨Ø¹Ø¶ Ø§Ù„ØµÙˆØ± ÙˆØ§Ù„Ø±ÙˆØ§Ø¨Ø·",
    instagram: "ØµÙˆØ± ÙˆÙÙŠØ¯ÙŠÙˆ Ù‚ØµÙŠØ± ÙÙ‚Ø· Ù…Ø¹ ÙˆØµÙ Ø¨Ø³ÙŠØ·",
    twitter: "ØªØºØ±ÙŠØ¯Ø§Øª Ù‚ØµÙŠØ±Ø© ÙˆØ±ÙˆØ§Ø¨Ø·",
    threads: "Ù†Ù‚Ø§Ø´Ø§Øª Ù†ØµÙŠØ© Ù…Ø­Ø¯ÙˆØ¯Ø©",
    tiktok: "ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø© ÙÙ‚Ø·",
  },
  {
    feature: "ØªÙ†ÙˆØ¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰",
    dridoud: "ØµÙˆØ±ØŒ ÙÙŠØ¯ÙŠÙˆÙ‡Ø§ØªØŒ GIFØŒ ØµÙˆØªÙŠØ§ØªØŒ Ø§Ø³ØªØ·Ù„Ø§Ø¹Ø§ØªØŒ Ø¨Ø« Ù…Ø¨Ø§Ø´Ø±",
    facebook: "ØµÙˆØ±ØŒ Ø±ÙˆØ§Ø¨Ø·ØŒ ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø© ÙˆØ·ÙˆÙŠÙ„Ø©",
    instagram: "ØµÙˆØ± ÙˆÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø©",
    twitter: "Ù†ØµÙˆØµ ÙˆØ±ÙˆØ§Ø¨Ø· ÙˆØµÙˆØ± Ø¨Ø³ÙŠØ·Ø©",
    threads: "Ù†ØµÙˆØµ ÙˆØ±ÙˆØ§Ø¨Ø· Ù‚ØµÙŠØ±Ø©",
    tiktok: "ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø© ÙÙ‚Ø·",
  },
  {
    feature: "Ù†Ø¸Ø§Ù… Ø§Ù„ÙÙŠØ¯ÙŠÙˆ",
    dridoud: "ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø© ÙˆØ·ÙˆÙŠÙ„Ø© Ù…Ø¹ Ø¨Ø« Ø­ÙŠ ÙˆØ¹Ø±Ø¶ Ù…ØªØ³Ù„Ø³Ù„",
    facebook: "Ø¨Ø« Ù…Ø¨Ø§Ø´Ø± ÙˆÙ…Ø´Ø§Ù‡Ø¯Ø§Øª ÙÙŠØ¯ÙŠÙˆ",
    instagram: "Reels ÙˆÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø©",
    twitter: " ÙÙŠØ¯ÙŠÙˆ Ø¨Ø³ÙŠØ· ØªÙ‚Ø±ÙŠØ¨Ø§Ù‹",
    threads: "Ù„Ø§ ÙŠØ¯Ø¹Ù… Ø§Ù„ÙÙŠØ¯ÙŠÙˆ Ø§Ù„Ù…Ø¹Ù‚Ø¯",
    tiktok: "ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø© ÙÙ‚Ø·",
  },
  {
    feature: "Ø§Ù„Ù…Ø¬ØªÙ…Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§Øª",
    dridoud: "Ù…Ø¬Ù…ÙˆØ¹Ø§ØªØŒ Ù…Ø¬ØªÙ…Ø¹Ø§ØªØŒ Ù‚Ù†ÙˆØ§Øª ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯",
    facebook: "Ù…Ø¬Ù…ÙˆØ¹Ø§Øª ÙÙ‚Ø·",
    instagram: "Ù…Ø¬ØªÙ…Ø¹Ø§Øª Ø¶Ø¹ÙŠÙØ©",
    twitter: "Ù‚Ù†ÙˆØ§Øª Ø±Ø³Ù…ÙŠØ© ÙÙ‚Ø·",
    threads: "ØºÙŠØ± Ù…Ø®ØµØµ Ù„Ù„Ù…Ø¬ØªÙ…Ø¹Ø§Øª",
    tiktok: "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù†Ø¸Ø§Ù… Ù…Ø¬ØªÙ…Ø¹Ø§Øª Ù…ØªÙƒØ§Ù…Ù„",
  },
  {
    feature: "Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ù„ØµÙ†Ø§Ø¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰",
    dridoud: "Ù‚Ù†ÙˆØ§Øª Ù…Ø®ØµØµØ© Ù„Ù„Ø¹Ù„Ø§Ù…Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ù…Ø¨Ø¯Ø¹ÙŠÙ†",
    facebook: "ØµÙØ­Ø§Øª ÙÙ‚Ø·",
    instagram: "Ø­Ø³Ø§Ø¨Ø§Øª ØªØ¬Ø§Ø±ÙŠØ© Ø¹Ø§Ù…Ø©",
    twitter: "ØªØ­Ù‚Ù‚ Ø¨Ø³ÙŠØ·",
    threads: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚Ù†ÙˆØ§Øª Ø±Ø³Ù…ÙŠØ©",
    tiktok: "Ù‚Ù†Ø§Ø© + Ø­Ø³Ø§Ø¨ ÙˆØ§Ø­Ø¯ ÙÙ‚Ø·",
  },
  {
    feature: "Ù†Ø¸Ø§Ù… Ø§Ù„Ø§Ø³ØªÙƒØ´Ø§Ù",
    dridoud: "Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª + Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ù…ØªØ§Ø¨Ø¹ÙŠÙ† ÙÙŠ Ù†ÙØ³ Ø§Ù„Ù…ÙƒØ§Ù†",
    facebook: "Ø®ÙˆØ§Ø±Ø²Ù…ÙŠØ§Øª Ù…Ù†ÙØµÙ„Ø©",
    instagram: "ØµÙØ­Ø© Explore ÙÙ‚Ø·",
    twitter: "Ù‚Ø§Ø¦Ù…Ø© Ù…ØªØ¯Ø§Ø®Ù„Ø©",
    threads: "ØªØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø¯Ø¹ÙˆØ©",
    tiktok: "ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù…Ù‚ØªØ±Ø­Ø© ÙÙ‚Ø·",
  },
  {
    feature: "Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©",
    dridoud: "Ø¯Ø±Ø¯Ø´Ø© Ù…Ø¯Ù…Ø¬Ø© Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ù†ØµØ©",
    facebook: "ØªØ·Ø¨ÙŠÙ‚ Messenger Ù…Ù†ÙØµÙ„",
    instagram: "Ø±Ø³Ø§Ø¦Ù„ Ø¯Ø§Ø®Ù„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ ÙˆÙ„ÙƒÙ† Ù…Ø­Ø¯ÙˆØ¯Ø©",
    twitter: "Ø±Ø³Ø§Ø¦Ù„ Ø®Ø§ØµØ© ÙÙ‚Ø·",
    threads: "ØºÙŠØ± Ù…Ø¯Ù…Ø¬ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„",
    tiktok: "Ø±Ø³Ø§Ø¦Ù„ Ù…Ø­Ø¯ÙˆØ¯Ø© ÙˆØ¹Ø´ÙˆØ§Ø¦ÙŠØ©",
  },
  {
    feature: "Ø§Ù„Ù‚ØµØµ",
    dridoud: "Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„ Ù„Ù„Ù‚ØµØµ Ù…Ø¹ Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª",
    facebook: "Ù‚ØµØµ Ù…Ø®ØªØµØ±Ø©",
    instagram: "Ù‚ØµØµ Ù‚ÙˆÙŠØ© Ù„ÙƒÙ† Ø¨Ø¯ÙˆÙ† ØªÙØ§Ø¹Ù„ Ù…ØªÙ‚Ø¯Ù…",
    twitter: "ØºÙŠØ± Ù…Ø®ØµØµ Ù„Ù„Ù‚ØµØµ",
    threads: "Ù‚ØµØµ Ù†ØµÙŠØ© ÙÙ‚Ø·",
    tiktok: "Ù‚ØµØµ ÙÙŠØ¯ÙŠÙˆ Ù‚ØµÙŠØ±Ø© ÙÙ‚Ø·",
  },
  {
    feature: "Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„Ù…Ø­ØªÙˆÙ‰",
    dridoud: "ØªØ­Ø¯ÙŠØ¯ Ù…Ø­ØªÙˆÙ‰ Ø­Ø³Ø§Ø³ ÙˆÙ…ÙˆÙ„Ø¯ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ",
    facebook: "ØªØ­ÙƒÙ… Ù…Ø­Ø¯ÙˆØ¯",
    instagram: "ØªØ¹Ù„Ù… Ø¢Ù„ÙŠ ÙˆÙ„ÙƒÙ† ØºÙŠØ± ÙˆØ§Ø¶Ø­",
    twitter: "Ø§Ø²Ø§Ù„Ø© ÙŠØ¯ÙˆÙŠ Ø¬Ø²Ø¦ÙŠ",
    threads: "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¬Ø¯ÙŠØ¯Ø© ÙˆØºÙŠØ± Ù…Ø³ØªÙ‚Ø±Ø©",
    tiktok: "ØªØ­ÙƒÙ… Ø¢Ù„ÙŠ Ù…Ø¹ ÙÙ„Ø§ØªØ± Ù‚Ù„ÙŠÙ„Ø©",
  },
  {
    feature: "Ø§Ù„Ø®ØµÙˆØµÙŠØ©",
    dridoud: "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø®ØµÙˆØµÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø© ÙˆØªØ­ÙƒÙ… ÙƒØ§Ù…Ù„",
    facebook: "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ù…Ø¹Ù‚Ø¯Ø©",
    instagram: "ØªØ­ÙƒÙ… Ø¨Ø³ÙŠØ· ÙÙ‚Ø·",
    twitter: "Ø®ÙŠØ§Ø± Ø¹Ø§Ù… ÙÙ‚Ø·",
    threads: "Ù…Ø­Ø¯ÙˆØ¯ Ø¨Ø³Ø¨Ø¨ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø´ØªØ±ÙƒØ©",
    tiktok: "Ø®ØµØ§Ø¦Øµ Ø¥ÙØªØ±Ø§Ø¶ÙŠØ© Ø«Ù… Ù†Ø¯Ø®Ù„ ÙÙŠ Ø§Ù„ØªØ¹Ù‚ÙŠØ¯",
  },
  {
    feature: "Ø§Ù„ØªÙØ§Ø¹Ù„",
    dridoud: "Ø¥Ø¹Ø¬Ø§Ø¨ + ØªØ¹Ù„ÙŠÙ‚ + Ù…Ø´Ø§Ø±ÙƒØ© + Ø§Ø³ØªØ·Ù„Ø§Ø¹",
    facebook: "ØªØ¹Ù„ÙŠÙ‚Ø§Øª ÙˆÙ…Ø´Ø§Ø±ÙƒØ© ÙÙ‚Ø·",
    instagram: "Ø¥Ø¹Ø¬Ø§Ø¨ ÙˆØªØ¹Ù„ÙŠÙ‚ Ù…Ø­Ø¯ÙˆØ¯",
    twitter: "Ø¥Ø¹Ø¬Ø§Ø¨ ÙˆØªØ¹Ù„ÙŠÙ‚ ÙˆÙ†Ø´Ø±",
    threads: "Ù†Ø´Ø± ÙÙ‚Ø·",
    tiktok: "Ø¥Ø¹Ø¬Ø§Ø¨ ÙˆØªØ¹Ù„ÙŠÙ‚ Ø´Ø®ØµÙŠ",
  },
  {
    feature: "Ø§Ù„Ø¨Ø­Ø«",
    dridoud: "Ø¨Ø­Ø« Ø´Ø§Ù…Ù„ Ø¹Ù† Ø£Ø´Ø®Ø§ØµØŒ Ù…Ù†Ø´ÙˆØ±Ø§ØªØŒ ÙˆØ³ÙˆÙ…",
    facebook: "Ø¨Ø­Ø« Ø¶Ù…Ù† Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§Øª",
    instagram: "Ø¨Ø­Ø« Ø¨Ø§Ù„Ù‡Ø§Ø´ØªØ§Ù‚ ÙÙ‚Ø·",
    twitter: "Ø¨Ø­Ø« Ø¹Ù† Ø­Ø³Ø§Ø¨Ø§Øª ÙÙ‚Ø·",
    threads: "Ø¨Ø­Ø« Ù…Ø­Ø¯ÙˆØ¯",
    tiktok: "Ø¨Ø­Ø« ÙÙŠ Ø§Ù„ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª ÙÙ‚Ø·",
  },
  {
    feature: "Ø§Ù„ØªØ¹Ø¯Ø¯ Ø§Ù„Ù„ØºÙˆÙŠ",
    dridoud: "ÙŠØ¯Ø¹Ù… Ø¹Ø¯Ø© Ù„ØºØ§Øª Ø¨Ø³Ù„Ø§Ø³Ø©",
    facebook: "ÙŠØ¯Ø¹Ù… Ø§Ù„Ù„ØºØ§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ÙÙ‚Ø·",
    instagram: "Ø¯Ø¹Ù… Ù…Ø­Ø¯ÙˆØ¯",
    twitter: "ÙŠØ¯Ø¹Ù… Ø¹Ø¯Ø© Ù„ØºØ§Øª ÙˆÙ„ÙƒÙ† Ù…Ø¹Ù‚Ø¯",
    threads: "Ø¯Ø¹Ù… Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ ÙÙŠ Ø§Ù„ØºØ§Ù„Ø¨",
    tiktok: "ØªØ±Ø¬Ù…Ø© Ø¢Ù„ÙŠØ© ÙÙ‚Ø·",
  },
  {
    feature: "ØªØ¬Ø±Ø¨Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…",
    dridoud: "Ù…Ù†ØµØ© ÙˆØ§Ø­Ø¯Ø© Ù„ÙƒÙ„ Ø´ÙŠØ¡",
    facebook: "ØªØ¹Ø¯Ø¯ ØªØ·Ø¨ÙŠÙ‚Ø§Øª ÙˆÙ…Ù‡Ø§Ù…",
    instagram: "Ù…Ù†ØµØ© Ù…Ù†ÙØ±Ø¯Ø© Ù„Ù„ØµÙˆØ±",
    twitter: "Ù…Ù†ØµØ© Ù„ØªØ±Ù†Ø¯Ø§Øª Ø³Ø±ÙŠØ¹Ø©",
    threads: "ØªØ¬Ø±Ø¨Ø© Ø¬Ø¯ÙŠØ¯Ø© ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©",
    tiktok: "ØªØ¬Ø±Ø¨Ø© ØªØ±ÙÙŠÙ‡ÙŠØ© ÙÙ‚Ø·",
  },
];
const downloadOptions = [
  {
    label: "Download on Google Play",
    platform: "Android",
    href: "/download",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v14m-4-6 4 4 4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
      </svg>
    ),
    variant: "primary",
  },
  {
    label: "Download on iOS",
    platform: "iOS",
    href: "/download",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0V8a4 4 0 0 1 4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8" />
      </svg>
    ),
    variant: "secondary",
  },
  {
    label: "Download APK",
    platform: "APK",
    href: "/download/apk",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14v10H5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8M8 15h4" />
      </svg>
    ),
    variant: "tertiary",
  },
];

function ScreenshotCard({ item }) {
  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-3 shadow-sm">
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={item.src}
          alt={`Ù„Ù‚Ø·Ø© Ø´Ø§Ø´Ø©: ${item.title}`}
          width={360}
          height={720}
          className="w-full h-auto"
          priority={item.priority ?? item.subtitle === "Home"}
        />
      </div>
      <div className="mt-3 text-center">
        <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="w-full">
      {/* 1) Hero */}
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-full text-gray-700 dark:text-gray-300">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-700 text-white font-bold">
                  D
                </span>
                <span className="font-semibold">{homeContent.hero.badgeName}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mt-6 mb-6 leading-tight">
                {homeContent.hero.title.prefix}{" "}
                <span className="text-red-700 dark:text-red-500">{homeContent.hero.title.highlight}</span>{" "}
                {homeContent.hero.title.suffix}
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {homeContent.hero.description}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="http://dridoud/download"
                  className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {homeContent.hero.ctaPrimary}
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {homeContent.hero.ctaSecondary}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src={heroBanner}
                  alt="Ø¨Ø§Ù†Ø± Ø¯Ø±ÙŠØ¯ÙˆØ¯"
                  width={1200}
                  height={900}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

{/* 2) Screenshots */}
      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Ù„Ù‚Ø·Ø§Øª Ø´Ø§Ø´Ø© <span className="text-red-700 dark:text-red-500">Ø§Ù„ØªØ·Ø¨ÙŠÙ‚</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Ù„Ù‚Ø·Ø§Øª Ù…Ù† Ø§Ù„ÙˆØ§Ø¬Ù‡Ø§Øª Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©: Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©ØŒ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ØŒ Ø§Ù„Ù‚ØµØµØŒ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§ØªØŒ ÙˆØ§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-6 snap-x snap-mandatory pb-2">
              {galleryScreenshots.map((s) => (
                <div key={s.subtitle} className="snap-start shrink-0 w-72">
                  <ScreenshotCard item={s} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Comparison */}
      <section className="w-full py-20 sm:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Ø¯Ø±ÙŠØ¯ÙˆØ¯ <span className="text-red-600 dark:text-red-400">vs</span> Ø§Ù„Ù…Ù†ØµØ§Øª Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ© Ø§Ù„Ø£Ø®Ø±Ù‰
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ø¯Ø±ÙŠØ¯ÙˆØ¯ ÙŠØ¬Ù…Ø¹ ÙƒÙ„ Ø§Ù„Ù…ÙŠØ²Ø§Øª ÙÙŠ Ù…Ù†ØµØ© ÙˆØ§Ø­Ø¯Ø©ØŒ ÙŠÙ…Ù†Ø­Ùƒ Ø§Ù„ØªØ­ÙƒÙ… Ø§Ù„ÙƒØ§Ù…Ù„ØŒ ÙˆÙŠÙˆØ§Ø²Ù† Ø¨ÙŠÙ† Ø§Ù„ØªØ±ÙÙŠÙ‡ ÙˆØ§Ù„ØªÙˆØ§ØµÙ„ ÙˆØµÙ†Ø§Ø¹Ø© Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø¯ÙˆÙ†
              ÙØ±Ø¶ ØªØ¬Ø±Ø¨Ø© Ù…Ø­Ø¯ÙˆØ¯Ø©.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm text-gray-700 dark:text-gray-300 border-separate border-spacing-0 rounded-3xl shadow-lg">
              <thead>
                <tr className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <th className="sticky left-0 bg-white dark:bg-gray-950 px-6 py-4 text-lg font-semibold text-gray-800 dark:text-white text-left">
                    Ø§Ù„Ù…ÙŠØ²Ø©
                  </th>
                  {comparisonPlatforms.map((platform) => (
                    <th
                      key={platform.key}
                      className={`px-6 py-4 text-left font-semibold text-sm uppercase tracking-[0.3em] border-l border-gray-200 dark:border-gray-800 ${platform.color}`}
                    >
                      {platform.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}`}
                  >
                    <th className="px-6 py-4 text-base font-semibold text-gray-900 dark:text-white text-left">
                      {row.feature}
                    </th>
                    {comparisonPlatforms.map((platform) => (
                      <td
                        key={`${row.feature}-${platform.key}`}
                        className={`px-6 py-4 text-sm leading-relaxed border-l border-gray-200 dark:border-gray-800 ${
                          platform.key === "dridoud"
                            ? "bg-red-50 dark:bg-red-900/60 text-red-700 dark:text-red-100 font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row[platform.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5) Why Dridoud */}
      <section className="w-full py-20 sm:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {homeContent.why.heading.prefix}{" "}
              <span className="text-red-700 dark:text-red-500">{homeContent.why.heading.highlight}</span>
              {homeContent.why.heading.suffix}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {homeContent.why.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {homeContent.why.items.map((i) => (
              <div key={i.title} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{i.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6) Download */}
      <section className="w-full py-20 sm:py-32 bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 sm:p-14 text-center shadow-xl">
            <p className="text-sm uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">ØªÙ†Ø²ÙŠÙ„</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{homeContent.download.heading}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">{homeContent.download.sub}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {downloadOptions.map((option) => {
                let variantClass = "border-transparent bg-gray-900 dark:bg-red-600 text-white hover:bg-gray-800 dark:hover:bg-red-500";
                if (option.variant === "secondary") {
                  variantClass =
                    "border-gray-200 dark:border-gray-700 bg-white text-gray-900 dark:bg-gray-900/70 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800";
                } else if (option.variant === "tertiary") {
                  variantClass =
                    "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 shadow-sm";
                }

                return (
                <Link
                  key={option.platform}
                  href={option.href}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold shadow-lg transition-colors ${variantClass}`}
                >
                  <span className="text-base">{option.label}</span>
                </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


