'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function FaqAccordion({ sections }) {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.location.hash.replace('#', '');
  });
  const hashHandledRef = useRef(false);

  const filteredSections = useMemo(() => filterSections(sections, search), [search, sections]);

  useEffect(() => {
    if (hashHandledRef.current) return;
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    hashHandledRef.current = true;
  }, []);

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearch(nextValue);
    if (nextValue.trim()) {
      const nextFiltered = filterSections(sections, nextValue);
      setOpenId(nextFiltered[0]?.items[0]?.id ?? '');
    }
  };

  const totalMatches = filteredSections.reduce((sum, section) => sum + section.items.length, 0);

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? '' : id));
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
        <label className="relative w-full">
          <span className="sr-only">بحث الأسئلة</span>
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="ابحث عن موضوع أو سؤال"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-700 outline-none transition focus:border-red-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </label>
        <p className="mt-3 text-xs uppercase tracking-[0.4em] text-red-600">
          {totalMatches} نتيجة
        </p>
      </div>

      {filteredSections.length === 0 && (
        <div className="rounded-3xl border border-dashed border-red-300 bg-red-50/70 p-6 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/60">
          لم يتم العثور على نتائج مطابقة. جرّب كلمات مختلفة.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {filteredSections.map((section) => (
          <article key={section.id} className="space-y-4">
            <header className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                {renderIcon(section.icon)}
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-red-600">{section.title}</p>
              </div>
            </header>
            <div className="space-y-3">
              {section.items.map((item) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isOpen={openId === item.id}
                  onToggle={() => handleToggle(item.id)}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function filterSections(sections, query) {
  if (!query) {
    return sections;
  }
  const term = query.trim().toLowerCase();
  if (!term) {
    return sections;
  }

  return sections
    .map((section) => {
      const matched = section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term)
      );
      return { ...section, items: matched };
    })
    .filter((section) => section.items.length);
}

function renderIcon(name) {
  const baseProps = {
    viewBox: '0 0 24 24',
    role: 'img',
    'aria-hidden': true,
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  };

  switch (name) {
    case 'user':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="9" r="4" />
          <path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...baseProps}>
          <path d="M12 3 4 6v5c0 5.25 3.5 9.75 8 10 4.5-.25 8-4.75 8-10V6z" />
          <path d="M9 12h6" />
          <path d="M12 9v6" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...baseProps}>
          <path d="M4 7a8 8 0 1 1 2.1 12" />
          <polyline points="4 7 4 3 8 3" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...baseProps}>
          <path d="M12 2v4M12 18v4M4.5 9.5h4M15.5 9.5h4M6.2 4.8l2.8 2.8M14.9 13.5l2.8 2.8" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'users':
      return (
        <svg {...baseProps}>
          <path d="M8 7a4 4 0 1 1 8 0" />
          <path d="M4 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 14c0-2.5 2-4.5 4.5-4.5M18 20c0-1.1-.9-2-2-2" />
        </svg>
      );
    case 'message':
      return (
        <svg {...baseProps}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M8 10h8M8 14h6" />
        </svg>
      );
    case 'cog':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
        </svg>
      );
    case 'bug':
      return (
        <svg {...baseProps}>
          <rect x="7" y="6" width="10" height="12" rx="3" />
          <path d="M9 6V4M15 6V4M9 18v2M15 18v2" />
          <path d="M3 12h18" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="1" />
          <path d="M12 6v2M12 16v2" />
        </svg>
      );
  }
}
function AccordionItem({ item, isOpen, onToggle }) {
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState('0px');

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    setMaxHeight(`${contentRef.current.scrollHeight}px`);
  }, [isOpen]);

  return (
    <div
      id={item.id}
      className={`rounded-3xl border border-gray-200 bg-white/80 shadow-sm transition dark:border-gray-800 dark:bg-gray-900/60 ${
        isOpen ? 'border-red-300 dark:border-red-500/40' : ''
      }`}
    >
      <button
        onClick={onToggle}
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right text-base font-semibold text-gray-900 dark:text-white"
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <span className="text-xl text-red-500">{isOpen ? '−' : '+'}</span>
      </button>
      <div
        ref={contentRef}
        style={{ maxHeight: isOpen ? maxHeight : '0px' }}
        className="overflow-hidden px-5 transition-[max-height] duration-300 ease-in-out"
      >
        <p className="pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.answer}</p>
      </div>
    </div>
  );
}
