'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/interface', label: 'الواجهة', icon: InterfaceIcon },
    { href: '/', label: 'الرئيسية', icon: HomeIcon },
    { href: '/features', label: 'الميزات', icon: SparklesIcon },
    { href: '/download', label: 'تحميل', icon: DownloadIcon },
    { href: '/account', label: 'الحساب', icon: AccountIcon },
  ];

  const mobileMegaColumns = [
    {
      title: 'القنوات والصفحات',
      sections: [
        {
          title: 'التطبيق',
          items: [
            { href: '/', label: 'الرئيسية', icon: HomeIcon },
            { href: '/interface?view=reels', label: 'الريلز', icon: ReelIcon },
            { href: '/interface?view=groups', label: 'المجموعات', icon: GroupIcon },
            { href: '/interface?view=channels', label: 'القنوات', icon: ChannelIcon },
            { href: '/interface?view=discover', label: 'استكشاف', icon: SearchIcon },
          ],
        },
        {
          title: 'المحتوى والنشر',
          items: [
            { href: '/create-post', label: 'إنشاء منشور', icon: EditIcon },
            { href: '/features', label: 'الميزات', icon: SparklesIcon },
            { href: '/download', label: 'تحميل التطبيق', icon: DownloadIcon },
          ],
        },
      ],
    },
    {
      title: 'الأقسام والإعدادات',
      sections: [
        {
          title: 'إعدادات وتخصيص',
          items: [
            { href: '/account/me', label: 'إعدادات الحساب', icon: AccountIcon },
            { href: '/security', label: 'لوحة الأمان', icon: ShieldIcon },
            { href: '/account/me', label: 'إدارة طلبات التوثيق', icon: VerifyIcon },
            { href: '/account/me', label: 'مظهر التطبيق', icon: ThemeIcon },
            { href: '/account/me', label: 'إعدادات الإشعارات', icon: BellIcon },
            { href: '/account/me', label: 'توثيق الحساب', icon: VerifyIcon },
            { href: '/account/me', label: 'اللغات', icon: LanguageIcon },
            { href: '/account/me', label: 'الحسابات', icon: AccountsIcon },
          ],
        },
        {
          title: 'الأمن والخصوصية',
          items: [
            { href: '/account/me', label: 'خصوصية الحساب', icon: LockIcon },
            { href: '/account/me', label: 'النشاط والحالة', icon: ActivityIcon },
            { href: '/account/me', label: 'إدارة الحساب', icon: SettingsIcon },
            { href: '/account', label: 'الأمان وتسجيل الدخول', icon: ShieldIcon },
          ],
        },
        {
          title: 'أدوات المحتوى',
          items: [
            { href: '/interface?view=hashtags', label: 'الوسوم @ والذكر', icon: HashIcon },
            { href: '/interface?view=video-settings', label: 'التحكم بالفيديوهات', icon: VideoIcon },
          ],
        },
        {
          title: 'المعلومات والدعم',
          items: [
            { href: '/privacy', label: 'سياسة الخصوصية', icon: ShieldIcon },
            { href: '/terms', label: 'الشروط والأحكام', icon: DocumentIcon },
            { href: '/agreements', label: 'الاتفاقيات', icon: DocumentIcon },
            { href: '/security', label: 'أمان البيانات', icon: ShieldIcon },
            { href: '/dmca', label: 'حقوق DMCA', icon: CopyrightIcon },
            { href: '/contact', label: 'اتصل بنا', icon: MailIcon },
            { href: '/faq', label: 'الأسئلة الشائعة', icon: HelpIcon },
            { href: '/complaints', label: 'شكاوى وبلاغات', icon: AlertIcon },
            { href: '/deletion', label: 'طلب حذف الحساب والبيانات', icon: DeleteIcon },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/95 shadow-sm backdrop-blur" dir="rtl" style={{ unicodeBidi: 'plaintext' }}>
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
              aria-expanded={isOpen}
              aria-controls="mobile-mega-menu"
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
        <div id="mobile-mega-menu" className="border-t border-black/10 bg-white/95 px-4 pb-4 pt-3 md:hidden" dir="rtl" style={{ unicodeBidi: 'plaintext' }}>
          <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2">
              <p className="text-sm font-extrabold text-gray-900 text-right [unicode-bidi:plaintext]">القائمة</p>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                إغلاق
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto overflow-x-hidden pr-0.5 [unicode-bidi:plaintext]">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {mobileMegaColumns.map((column) => (
                  <section key={column.title} className="rounded-xl border border-gray-200 bg-gray-50/70 p-1.5 min-w-0">
                    <h3 className="mb-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-extrabold text-gray-900 text-right [unicode-bidi:plaintext]">
                      {column.title}
                    </h3>

                    <div className="space-y-1.5">
                      {column.sections.map((sec) => (
                        <div key={sec.title} className="rounded-lg border border-gray-200 bg-white p-1.5 min-w-0">
                          <p className="mb-1 text-[10px] font-bold text-gray-700 text-right [unicode-bidi:plaintext]">{sec.title}</p>
                          <div className="space-y-1">
                            {sec.items.map((item) => (
                              <NavLinkMobile
                                key={`${sec.title}-${item.label}-${item.href}`}
                                href={item.href}
                                icon={item.icon}
                                isActive={isLinkActive(pathname, item.href)}
                                onClick={() => setIsOpen(false)}
                                compact
                              >
                                {item.label}
                              </NavLinkMobile>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
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

function NavLinkMobile({ href, children, icon: Icon, isActive, onClick, compact = false }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex flex-row-reverse items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 font-semibold transition-colors text-right [unicode-bidi:plaintext]',
        compact ? 'text-[11px] leading-5' : 'text-xs leading-5',
        isActive ? 'bg-rose-100 text-rose-700' : 'text-gray-800 hover:bg-gray-100',
      ].join(' ')}
    >
      <ChevronLeftIcon className={['h-3 w-3 shrink-0', isActive ? 'text-rose-700' : 'text-gray-500'].join(' ')} />
      <span className="inline-flex items-center gap-1 min-w-0">
        <Icon className={['h-3.5 w-3.5 shrink-0', isActive ? 'text-rose-700' : 'text-gray-700'].join(' ')} />
        <span className="truncate">{children}</span>
      </span>
    </Link>
  );
}

function ChevronLeftIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function InterfaceIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 20H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function HomeIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H14.5V14H9.5V21H4C3.4 21 3 20.6 3 20V10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SparklesIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function DownloadIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 4V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 11L12 15L16 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 20H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function AccountIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20C4.8 16.9 7.7 15 12 15C16.3 15 19.2 16.9 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function SettingsIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 13a7.1 7.1 0 0 0 .1-2l-2-.7a5.9 5.9 0 0 0-.7-1.5l.9-1.9a7.9 7.9 0 0 0-1.4-1.4l-1.9.9c-.5-.3-1-.5-1.5-.7L12.2 3a7.1 7.1 0 0 0-2 0l-.7 2a5.9 5.9 0 0 0-1.5.7l-1.9-.9a7.9 7.9 0 0 0-1.4 1.4l.9 1.9c-.3.5-.5 1-.7 1.5l-2 .7a7.1 7.1 0 0 0 0 2l2 .7c.2.5.4 1 .7 1.5l-.9 1.9a7.9 7.9 0 0 0 1.4 1.4l1.9-.9c.5.3 1 .5 1.5.7l.7 2a7.1 7.1 0 0 0 2 0l.7-2c.5-.2 1-.4 1.5-.7l1.9.9a7.9 7.9 0 0 0 1.4-1.4l-.9-1.9c.3-.5.5-1 .7-1.5l2-.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function EditIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function HelpIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.7 1.2-1.7 2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16.8" r="1" fill="currentColor"/></svg>; }
function DocumentIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 3v5h5M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ShieldIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v6c0 5 3.4 7.8 7 9 3.6-1.2 7-4 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CopyrightIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M14.5 9.5a3.2 3.2 0 1 0 0 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function AlertIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 4 3.5 19h17L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 10v4M12 16.8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function MailIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ReelIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 5l2.5 4M13 5l2.5 4M3 9h18" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function GroupIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="16.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 19c1.2-2.5 3.2-4 5.5-4s4.3 1.5 5.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ChannelIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></svg>; }
function SearchIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ThemeIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 9 9c-4.5 1-8-2.5-9-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function BellIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1 1 12 0v4l1.5 2.5h-15L6 13V9Z" stroke="currentColor" strokeWidth="1.8"/><path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function VerifyIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="m8.5 12 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function LanguageIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M4 5h8M8 5c0 6-2.5 10-5 12M8 5c0 6 2.5 10 5 12M13 19h7M16.5 7l3 8M19.5 7l-3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function AccountsIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 18c1.1-2.2 2.9-3.5 5.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function LockIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function ActivityIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M3 12h4l2-4 4 8 2-4h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function HashIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M9 3 7 21M17 3l-2 18M4 9h16M3 15h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function VideoIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="m15 10 6-3v10l-6-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>; }
function DeleteIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6M14 11v6M6.5 7l1 12h9l1-12M9 7V5h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

function isLinkActive(pathname, href) {
  if (href === '/') return pathname === '/';
  const cleanHref = href.split('?')[0];
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}




