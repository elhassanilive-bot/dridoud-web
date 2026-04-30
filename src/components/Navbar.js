'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'الرئيسية', icon: HomeIcon },
    { href: '/features', label: 'الميزات', icon: SparklesIcon },
    { href: '/download', label: 'تحميل', icon: DownloadIcon },
    { href: '/account', label: 'الحساب', icon: AccountIcon },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-2xl border border-black/10 bg-black/[0.02] p-1 md:flex">
              {links.map((link) => (
                <NavLink key={link.href} href={link.href} icon={link.icon} isActive={isLinkActive(pathname, link.href)}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            <button
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black hover:bg-black/[0.04] md:hidden"
              aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <Link href="/" className="text-2xl font-bold text-emerald-600">
            دريدود
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-black/10 bg-white/95 px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
            {links.map((link) => (
              <NavLinkMobile
                key={link.href}
                href={link.href}
                icon={link.icon}
                isActive={isLinkActive(pathname, link.href)}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLinkMobile>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children, icon: Icon, isActive }) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
        isActive ? 'bg-white text-black shadow-sm ring-1 ring-black/10' : 'text-black/75 hover:bg-white hover:text-black',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 shrink-0 text-black" />
      {children}
    </Link>
  );
}

function NavLinkMobile({ href, children, icon: Icon, isActive, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center justify-end gap-2 rounded-xl px-3 py-2 text-base font-semibold transition-colors',
        isActive ? 'bg-black text-white' : 'text-black hover:bg-black/[0.04]',
      ].join(' ')}
    >
      <span>{children}</span>
      <Icon className={['h-5 w-5 shrink-0', isActive ? 'text-white' : 'text-black'].join(' ')} />
    </Link>
  );
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H14.5V14H9.5V21H4C3.4 21 3 20.6 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 3L19.6 4.4L21 5L19.6 5.6L19 7L18.4 5.6L17 5L18.4 4.4L19 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16L5.6 17.4L7 18L5.6 18.6L5 20L4.4 18.6L3 18L4.4 17.4L5 16Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 11L12 15L16 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccountIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 20C4.8 16.9 7.7 15 12 15C16.3 15 19.2 16.9 20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isLinkActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
