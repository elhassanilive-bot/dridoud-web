export const metadata = {
  title: "Ù…Ù† Ù†Ø­Ù†",
  description:
    "ÙØ±ÙŠÙ‚ Ø¯Ø±ÙŠØ¯ÙˆØ¯ ÙŠØ¹ÙŠØ¯ ØªØ¹Ø±ÙŠÙ Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠ Ø¹Ø¨Ø± Ù…Ù†ØµØ© Ø¹Ø±Ø¨ÙŠØ© Ø­Ø¯ÙŠØ«Ø© Ù…Ø¬Ù‡Ø²Ø© Ø¨Ø§Ù„Ø®ØµÙˆØµÙŠØ© ÙˆØ§Ù„Ø£Ù…Ø§Ù†.",
  alternates: { canonical: "/about" },
};

function SectionIcon({ type }) {
  const baseProps = {
    className: "h-12 w-12 text-red-600",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
  };

  switch (type) {
    case "team":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="20" cy="16" r="4" />
          <circle cx="32" cy="16" r="4" />
          <path d="M12 38c0-5 4-9 9-9h6c5 0 9 4 9 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="24" cy="24" r="12" />
          <path d="M24 12l5 14-14 5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="24" cy="24" r="12" />
          <circle cx="24" cy="24" r="6" />
          <path d="M6 24h12M30 24h12M24 6v12M24 30v12" strokeLinecap="round" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <path
            d="M24 6a10 10 0 00-10 10c0 4 2 7 5 9v5h10v-5c3-2 5-5 5-9a10 10 0 00-10-10z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17 38h14v4H17z" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <path
            d="M8 12l16-6 16 6v12c0 11-8 18-16 20-8-2-16-9-16-20z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 26h16" strokeLinecap="round" />
          <path d="M16 32h12" strokeLinecap="round" />
        </svg>
      );
    case "community":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="18" cy="16" r="4" />
          <circle cx="30" cy="16" r="4" />
          <path d="M10 38c0-6 5-11 14-11s14 5 14 11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 28h28" strokeLinecap="round" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <circle cx="24" cy="12" r="4" />
          <path d="M10 34c0-7 5-12 14-12s14 5 14 12v6H10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <rect x="8" y="12" width="32" height="24" rx="4" />
          <path d="M8 16l16 12 16-12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 48 48" {...baseProps}>
          <path
            d="M14 8h20a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M18 34h12" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

const sections = [
  {
    id: "vision",
    heading: "Ø±Ø¤ÙŠØªÙ†Ø§",
    icon: "compass",
    body: `Ù†Ø·Ù…Ø­ Ø¥Ù„Ù‰ Ø¨Ù†Ø§Ø¡ Ù…Ø¬ØªÙ…Ø¹ Ø±Ù‚Ù…ÙŠ Ø¹Ø§Ù„Ù…ÙŠ ÙŠØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø§Ù„Ù†Ø§Ø³ Ù…Ù† Ù…Ø®ØªÙ„Ù Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª ÙˆØ§Ù„Ø§Ù‡ØªÙ…Ø§Ù…Ø§ØªØŒ Ø­ÙŠØ« ÙŠÙ…ÙƒÙ† Ù„ÙƒÙ„ Ø´Ø®Øµ Ù…Ø´Ø§Ø±ÙƒØ©
Ø£ÙÙƒØ§Ø±Ù‡ØŒ Ø§ÙƒØªØ´Ø§Ù Ù…Ø­ØªÙˆÙ‰ Ø¬Ø¯ÙŠØ¯ØŒ ÙˆØ§Ù„ØªÙˆØ§ØµÙ„ Ø¨Ø¯ÙˆÙ† Ø­Ø¯ÙˆØ¯.`,
  },
  {
    id: "mission",
    heading: "Ù…Ù‡Ù…ØªÙ†Ø§",
    icon: "target",
    body: `Ù…Ù‡Ù…ØªÙ†Ø§ Ù‡ÙŠ ØªÙˆÙÙŠØ± Ù…Ù†ØµØ© ØªÙˆØ§ØµÙ„ Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠ Ù…ØªØ·ÙˆØ±Ø© ØªØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø³Ù‡ÙˆÙ„Ø© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…ØŒ Ù‚ÙˆØ© Ø§Ù„Ù…ÙŠØ²Ø§ØªØŒ ÙˆØ³Ø±Ø¹Ø© Ø§Ù„Ø£Ø¯Ø§Ø¡ Ù…Ø¹ Ø§Ù„ØªØ±ÙƒÙŠØ² Ø¹Ù„Ù‰
ØªØ¬Ø±Ø¨Ø© Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù…ÙŠØ²Ø© ØªÙ†Ø§ÙØ³ Ø£ÙƒØ¨Ø± Ø§Ù„ØªØ·Ø¨ÙŠÙ‚Ø§Øª Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ©.`,
    list: ["Ø³Ù‡ÙˆÙ„Ø© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…", "Ù‚ÙˆØ© Ø§Ù„Ù…ÙŠØ²Ø§Øª", "Ø³Ø±Ø¹Ø© Ø§Ù„Ø£Ø¯Ø§Ø¡"],
  },
  {
    id: "offer",
    heading: "Ù…Ø§Ø°Ø§ Ù†Ù‚Ø¯Ù…ØŸ",
    icon: "lightbulb",
    body: `ÙÙŠ Ø¯Ø±ÙŠØ¯ÙˆØ¯ØŒ Ù†ÙˆÙØ± Ù…Ø¬Ù…ÙˆØ¹Ø© ÙˆØ§Ø³Ø¹Ø© Ù…Ù† Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„ØªÙŠ ØªØ³Ø§Ø¹Ø¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø¹Ù„Ù‰ Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø¨Ø¬Ù…ÙŠØ¹ Ø£Ù†ÙˆØ§Ø¹Ù‡ØŒ Ø§Ù„ØªÙØ§Ø¹Ù„
Ù…Ø¹ Ø§Ù„Ø¢Ø®Ø±ÙŠÙ† Ø¨Ø³Ù‡ÙˆÙ„Ø©ØŒ Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø¬ØªÙ…Ø¹Ø§Øª ÙˆÙ‚Ù†ÙˆØ§Øª Ø®Ø§ØµØ©ØŒ ÙˆØ§ÙƒØªØ´Ø§Ù Ù…Ø­ØªÙˆÙ‰ Ø¬Ø¯ÙŠØ¯ Ø¨Ø´ÙƒÙ„ Ù…Ø³ØªÙ…Ø± ÙÙŠ Ø¨ÙŠØ¦Ø© Ø¢Ù…Ù†Ø© ÙˆÙ…Ø­ØªØ±Ù…Ø©.`,
  },
  {
    id: "commitment",
    heading: "Ø§Ù„ØªØ²Ø§Ù…Ù†Ø§",
    icon: "shield",
    body: `Ù†Ù„ØªØ²Ù… Ø¨Ø­Ù…Ø§ÙŠØ© Ø®ØµÙˆØµÙŠØ© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†ØŒ ØªÙˆÙÙŠØ± Ù†Ø¸Ø§Ù… Ø£Ù…Ø§Ù† Ù…ØªÙ‚Ø¯Ù…ØŒ ØªØ­Ø³ÙŠÙ† Ù…Ø³ØªÙ…Ø± Ù„Ù„Ù…Ù†ØµØ©ØŒ ÙˆØ§Ù„Ø§Ø³ØªÙ…Ø§Ø¹ Ù„Ø¢Ø±Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† ÙˆØªØ·ÙˆÙŠØ±
Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„ÙŠÙ‡Ø§.`,
    list: ["Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø®ØµÙˆØµÙŠØ©", "Ø£Ù…Ø§Ù† Ù…ØªÙ‚Ø¯Ù…", "ØªØ­Ø³ÙŠÙ† Ù…Ø³ØªÙ…Ø±", "Ø§Ø³ØªÙ…Ø§Ø¹ ÙˆØªØ·ÙˆÙŠØ±"],
  },
  {
    id: "community",
    heading: "Ù…Ø¬ØªÙ…Ø¹Ù†Ø§",
    icon: "community",
    body: `Ø¯Ø±ÙŠØ¯ÙˆØ¯ Ù„ÙŠØ³ Ù…Ø¬Ø±Ø¯ ØªØ·Ø¨ÙŠÙ‚ØŒ Ø¨Ù„ Ù‡Ùˆ Ù…Ø¬ØªÙ…Ø¹ Ù…ØªÙƒØ§Ù…Ù„ ÙŠØ¶Ù… Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ù…Ù† Ù…Ø®ØªÙ„Ù Ø£Ù†Ø­Ø§Ø¡ Ø§Ù„Ø¹Ø§Ù„Ù…ØŒ Ø­ÙŠØ« ÙŠÙ…ÙƒÙ† Ù„Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„ØªØ¹Ø¨ÙŠØ± Ø¹Ù†
Ø£Ù†ÙØ³Ù‡Ù… ÙˆØ¨Ù†Ø§Ø¡ Ø¹Ù„Ø§Ù‚Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ© Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ù†ØµØ©.`,
  },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-red-600 mb-3">Ù…Ù† Ù†Ø­Ù†</p>
          <div className="flex items-center justify-center gap-3">
            <SectionIcon type="team" />
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">
              Ù…Ù† Ù†Ø­Ù† â€“ ÙØ±ÙŠÙ‚ Ø¯Ø±ÙŠØ¯ÙˆØ¯
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-6 leading-relaxed">
            Ù†Ø­Ù† ÙØ±ÙŠÙ‚ Ø¯Ø±ÙŠØ¯ÙˆØ¯ØŒ Ù†Ø³Ø¹Ù‰ Ø¥Ù„Ù‰ Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹Ø±ÙŠÙ ØªØ¬Ø±Ø¨Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠ Ù…Ù† Ø®Ù„Ø§Ù„ ØªÙ‚Ø¯ÙŠÙ… Ù…Ù†ØµØ© Ø­Ø¯ÙŠØ«Ø©ØŒ Ù…ØªÙƒØ§Ù…Ù„Ø©ØŒ
            ÙˆØ¢Ù…Ù†Ø©ØŒ ØªÙ…Ù†Ø­ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø­Ø±ÙŠØ© Ø§Ù„ØªØ¹Ø¨ÙŠØ± ÙˆØ§Ù„ØªÙØ§Ø¹Ù„ Ø¨Ø·Ø±ÙŠÙ‚Ø© Ø³Ù„Ø³Ø© ÙˆÙ…Ø¨ØªÙƒØ±Ø©.
          </p>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {sections.map((section) => (
            <article
              key={section.id}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SectionIcon type={section.icon} />
                  <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{section.heading}</h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{section.id.toUpperCase()}</span>
              </div>
              <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
              {section.list && (
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <SectionIcon type="support" />
            <p className="text-lg font-semibold">Ù†Ø­Ù† Ù‡Ù†Ø§ Ø¯Ø§Ø¦Ù…Ù‹Ø§ Ù„Ù„Ø§Ø³ØªÙ…Ø§Ø¹ Ø¥Ù„ÙŠÙƒ</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-6 text-left">
            <div className="bg-white/10 rounded-3xl px-6 py-5">
              <div className="flex items-center gap-2">
                <SectionIcon type="email" />
                <p className="text-sm uppercase tracking-[0.4em] text-red-300">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</p>
              </div>
              <p className="text-xl font-semibold mt-2 text-white">support@dridoud.com</p>
            </div>
            <div className="bg-white/10 rounded-3xl px-6 py-5">
              <div className="flex items-center gap-2">
                <SectionIcon type="phone" />
                <p className="text-sm uppercase tracking-[0.4em] text-red-300">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</p>
              </div>
              <p className="text-xl font-semibold mt-2 text-white">+212638813823</p>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Ø´ÙƒØ±Ù‹Ø§ Ù„Ø§Ù†Ø¶Ù…Ø§Ù…Ùƒ Ø¥Ù„Ù‰ Ø¯Ø±ÙŠØ¯ÙˆØ¯. Ù…Ø¹Ù‹Ø§ Ù†Ø¨Ù†ÙŠ ØªØ¬Ø±Ø¨Ø© ØªÙˆØ§ØµÙ„ Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠ Ø£ÙØ¶Ù„.
          </p>
        </div>
      </section>
    </div>
  );
}

