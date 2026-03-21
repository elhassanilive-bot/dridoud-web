'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/features', label: 'الميزات' },
    { href: '/download', label: 'تحميل' },
  ];

  return (
    <nav className="fixed w-full top-0 z-50 bg-white dark:bg-gray-950 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <NavLink key={link.href} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-red-700 dark:text-red-500">
              دريدود
            </Link>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 text-right">
            {links.map((link) => (
              <NavLinkMobile key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                {link.label}
              </NavLinkMobile>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

function NavLinkMobile({ href, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block text-right text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-500 px-3 py-2 rounded-md text-base font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
