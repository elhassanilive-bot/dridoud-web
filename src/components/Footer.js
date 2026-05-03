'use client';

import Link from 'next/link';
import { site } from '@/config/site';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const socials = site.socials;
  const hasSocials = Boolean(socials.x || socials.instagram || socials.youtube);

  return (
    <footer className="bg-gradient-to-br from-red-950 via-red-900 to-rose-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-red-100 mb-4">دريدود</h3>
            <p className="text-red-100/80 leading-relaxed">
              منصة عربية حديثة للتواصل، تجمع القصص، القنوات، المجموعات، والدردشة في مكان واحد آمن وسريع.
            </p>
            <p className="text-red-100/75 mt-4 text-sm">
              تواصل معنا عبر:{' '}
              <a className="text-white hover:text-red-200" href={`mailto:${site.supportEmail}`}>
                {site.supportEmail}
              </a>
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-red-100/75 hover:text-white transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-red-100/75 hover:text-white transition-colors">
                  الميزات
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-red-100/75 hover:text-white transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/download" className="text-red-100/75 hover:text-white transition-colors">
                  تحميل
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">سياسات وقوانين</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-red-100/75 hover:text-white transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-red-100/75 hover:text-white transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/agreements" className="text-red-100/75 hover:text-white transition-colors">
                  الاتفاقيات والسياسات
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-red-100/75 hover:text-white transition-colors">
                  حقوق النشر (DMCA)
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-red-100/75 hover:text-white transition-colors">
                  أمان البيانات
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">مساعدة ودعم</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-red-100/75 hover:text-white transition-colors">
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-red-100/75 hover:text-white transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="text-red-100/75 hover:text-white transition-colors">
                  شكاوى وبلاغات
                </Link>
              </li>
              <li>
                <Link href="/deletion" className="text-red-100/75 hover:text-white transition-colors">
                  طلب حذف الحساب
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {hasSocials && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-3">تابعنا</h4>
            <div className="flex items-center gap-4 text-red-100/75">
              {socials.x && (
                <a
                  href={socials.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="X"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.2L6.5 22H2l7.4-8.6L1 2h6.3l4.4 5.6L18.9 2zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20z" />
                  </svg>
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5A4.5 4.5 0 1112 16a4.5 4.5 0 010-9zm0 2A2.5 2.5 0 1014.5 12 2.5 2.5 0 0012 9.5zM17.8 6.2a1 1 0 11-1-1 1 1 0 011 1z" />
                  </svg>
                </a>
              )}
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M21.6 7.2a3 3 0 00-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 002.4 7.2 31.6 31.6 0 002 12a31.6 31.6 0 00.4 4.8 3 3 0 002.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 002.1-2.1A31.6 31.6 0 0022 12a31.6 31.6 0 00-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-red-300/20 pt-8">
          <p className="text-red-100/75 text-center">&copy; {currentYear} دريدود. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
