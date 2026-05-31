'use client';

import Link from 'next/link';
import Image from 'next/image';
import heroBanner from '../../assets/baner.jpg';
import scren1 from '../../assets/scren/scren1.jpg';
import scren2 from '../../assets/scren/scren2.jpg';
import scren3 from '../../assets/scren/scren3.jpg';
import scren4 from '../../assets/scren/scren4.jpg';
import scren5 from '../../assets/scren/scren5.jpg';
import scren6 from '../../assets/scren/scren6.jpg';
import scren7 from '../../assets/scren/scren7.jpg';
import scren8 from '../../assets/scren/scren8.jpg';
import scren9 from '../../assets/scren/scren9.jpg';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const galleryScreenshots = [
  { title: 'Home', src: scren1, priority: true },
  { title: 'Stories', src: scren2 },
  { title: 'Discover', src: scren3 },
  { title: 'Photos', src: scren4 },
  { title: 'Chat', src: scren5 },
  { title: 'Groups', src: scren6 },
  { title: 'Channels', src: scren7 },
  { title: 'Messages', src: scren8 },
  { title: 'Profile', src: scren9 },
];

const englishScreenshots = [
  { title: 'Home Feed', tag: 'Posts, polls, media', lines: ['Follow updates', 'Share moments', 'React freely'] },
  { title: 'Stories', tag: 'Daily moments', lines: ['Create stories', 'Add photos', 'Stay close'] },
  { title: 'Discover', tag: 'Find creators', lines: ['Suggested people', 'Trending topics', 'Smart search'] },
  { title: 'Photos', tag: 'Visual gallery', lines: ['Clean grid', 'Fast browsing', 'Save memories'] },
  { title: 'Messages', tag: 'Private chat', lines: ['Direct messages', 'Quick replies', 'Secure inbox'] },
  { title: 'Groups', tag: 'Communities', lines: ['Join groups', 'Start discussions', 'Share knowledge'] },
  { title: 'Channels', tag: 'Creator spaces', lines: ['Build a channel', 'Publish updates', 'Grow your brand'] },
  { title: 'Notifications', tag: 'Stay updated', lines: ['Mentions', 'Likes', 'New followers'] },
  { title: 'Profile', tag: 'Your identity', lines: ['Bio and posts', 'Media library', 'Personal links'] },
];

const homeCopy = {
  ar: {
    badge: 'دريدود Dridoud',
    heroPrefix: 'شارك لحظتك, عبر, أنشر, تألق في',
    heroHighlight: 'دريدود',
    heroSuffix: 'وتواصل مع العالم',
    heroDescription:
      'شارك لحظتك مع دريدود. محتواك آمن بلا قيود، بدون حظر للمحتوى، وبدون خوارزميات تصفية. نحن هنا ندعمك لتستمر.',
    apk: 'تنزيل تطبيق دريدود بصيغة Apk',
    features: 'استكشف الميزات',
    screenshotsTitle: 'لقطات شاشة',
    screenshotsHighlight: 'التطبيق',
    screenshotsSub: 'لقطات من الواجهات الرئيسية: الصفحة الرئيسية، الرسائل، القصص، المجموعات، والملف الشخصي.',
    comparisonTitle: 'دريدود',
    comparisonRest: 'باقي تطبيقات التواصل',
    comparisonSub: 'مقارنة مختصرة وعملية بدون ازدحام: عمود لدريدود وعمود لباقي التطبيقات الاجتماعية.',
    tableFeature: 'الميزة',
    tableDridoud: 'دريدود',
    tableOthers: 'باقي تطبيقات التواصل',
    whyPrefix: 'نختار',
    whyHighlight: 'دريدود',
    whySuffix: 'لأنها',
    whySub: 'منصة توازن بين الخصوصية والتواصل وتسمح لك بالتعبير عن آرائك بدون قيود ولا حظر للمحتوى.',
    downloadEyebrow: 'تنزيل',
    downloadHeading: 'حمل التطبيق',
    downloadSub: 'متاح الآن على Android وiOS مع تحديثات دورية وتصحيحات أمان منتظمة.',
    soon: 'قريبًا',
    rows: [
      {
        feature: 'تجربة الصفحة الرئيسية',
        dridoud: 'استطلاعات رأي، مقالات بعناوين وفقرات، صور، فيديو، بث مباشر، ملصقات، إشارات، ومنشورات نصية بخلفيات ملونة.',
        others: 'تجربة تعتمد غالباً على الخوارزميات والذكاء الاصطناعي في ترتيب المنشورات وإبراز الحسابات الكبيرة.',
      },
      {
        feature: 'تنوع المحتوى',
        dridoud: 'تنوع في المجالات والفئات بشرط أن يكون المحتوى قانونياً ومتوافقاً مع شروط المجتمع.',
        others: 'أنواع متعددة من المحتوى مع تصفية خوارزمية قد تقلل وصول بعض المنشورات.',
      },
      {
        feature: 'نظام الفيديو',
        dridoud: 'فيديوهات قصيرة وطويلة مع بث حي وعرض متسلسل.',
        others: 'دعم متفاوت للفيديو؛ بعض المنصات تركز على المحتوى القصير فقط.',
      },
      {
        feature: 'المجتمعات والقنوات',
        dridoud: 'مجموعات وقنوات في مكان واحد.',
        others: 'الميزات موزعة أو محدودة حسب كل منصة.',
      },
      {
        feature: 'الدردشة',
        dridoud: 'دردشة مدمجة داخل المنصة.',
        others: 'أحياناً عبر تطبيق منفصل أو بقدرات أقل.',
      },
      {
        feature: 'نظام الاستكشاف',
        dridoud: 'اقتراحات، هاشتاجات، منشنات، وبحث متقدم لاستكشاف منشورات المتابعين في نفس المكان.',
        others: 'تجارب استكشاف متباعدة وخوارزميات أقل شفافية.',
      },
    ],
    whyItems: [
      {
        title: 'التصويت والرأي',
        desc: 'أنشئ استطلاعاً واترك المستخدمين يصوتون. استطلاعات الرأي مكان مناسب للتعبير داخل التطبيق.',
      },
      {
        title: 'تغطية المحتوى',
        desc: 'منشورات نصية، مقالات، صور، فيديو، بث مباشر، ملصقات، وإشارات للأشخاص في تجربة نشر واحدة.',
      },
      {
        title: 'المجموعات',
        desc: 'تابع المجموعات التي تهمك أو أنشئ مجموعتك لمشاركة المعرفة والنقاشات.',
      },
      {
        title: 'القنوات',
        desc: 'ابن قناة متكاملة لعلامتك التجارية أو صوتك المهني واعرض أعمالك في مكان مخصص.',
      },
    ],
  },
  en: {
    badge: 'Dridoud',
    heroPrefix: 'Share your moments, express yourself, and shine on',
    heroHighlight: 'Dridoud',
    heroSuffix: 'while staying connected with the world',
    heroDescription:
      'Dridoud helps you publish freely with privacy, flexible content tools, and a social experience designed around people, not restrictive feeds.',
    apk: 'Download Dridoud APK',
    features: 'Explore Features',
    screenshotsTitle: 'App',
    screenshotsHighlight: 'Screenshots',
    screenshotsSub: 'Screenshots from the main experiences: home, messages, stories, groups, and profile.',
    comparisonTitle: 'Dridoud',
    comparisonRest: 'Other Social Apps',
    comparisonSub: 'A clear comparison between Dridoud and other social networking apps.',
    tableFeature: 'Feature',
    tableDridoud: 'Dridoud',
    tableOthers: 'Other social apps',
    whyPrefix: 'Why',
    whyHighlight: 'Dridoud',
    whySuffix: 'stands out',
    whySub: 'A platform that balances privacy, connection, and freedom of expression in one modern social experience.',
    downloadEyebrow: 'Download',
    downloadHeading: 'Get the App',
    downloadSub: 'Available for Android, with regular updates and security improvements.',
    soon: 'Coming soon',
    rows: [
      {
        feature: 'Home experience',
        dridoud: 'Polls, long-form posts, photos, videos, live streams, stickers, mentions, and colorful text posts.',
        others: 'Feeds often depend on algorithms and automated ranking that prioritize already prominent accounts.',
      },
      {
        feature: 'Content variety',
        dridoud: 'A broad range of categories and formats, as long as content is legal and follows community rules.',
        others: 'Many formats exist, but algorithmic filtering may limit reach for some posts.',
      },
      {
        feature: 'Video system',
        dridoud: 'Short and long videos with live streaming and smooth sequential viewing.',
        others: 'Video support varies, and some apps focus mostly on short video.',
      },
      {
        feature: 'Communities and channels',
        dridoud: 'Groups and channels are available in one place.',
        others: 'Features are often scattered or limited depending on the platform.',
      },
      {
        feature: 'Chat',
        dridoud: 'Messaging is built directly into the platform.',
        others: 'Messaging may require a separate app or offer fewer options.',
      },
      {
        feature: 'Discovery',
        dridoud: 'Suggestions, hashtags, mentions, and advanced search help users discover relevant posts.',
        others: 'Discovery experiences can be fragmented and less transparent.',
      },
    ],
    whyItems: [
      {
        title: 'Polls and opinions',
        desc: 'Create polls and let people vote. It is a simple space for public opinion inside the app.',
      },
      {
        title: 'Content coverage',
        desc: 'Text posts, articles, images, videos, live streams, stickers, and mentions in one publishing flow.',
      },
      {
        title: 'Groups',
        desc: 'Follow the groups you care about or create your own space for knowledge and discussion.',
      },
      {
        title: 'Channels',
        desc: 'Build a dedicated channel for your brand, professional voice, or creative work.',
      },
    ],
  },
};

const downloadOptions = [
  { label: 'Google Play', platform: 'Android', href: null, variant: 'primary', available: false },
  { label: 'iOS', platform: 'iOS', href: null, variant: 'secondary', available: false },
  { label: 'APK', platform: 'APK', href: '/apk/dridoud-v2.7.0-arm64-v8a.apk', variant: 'tertiary', available: true },
];

function ScreenshotCard({ item, copy }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/70 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={item.src}
          alt={`${copy.screenshotsTitle}: ${item.title}`}
          width={360}
          height={720}
          className="h-auto w-full"
          priority={item.priority}
        />
      </div>
    </div>
  );
}

function EnglishHeroVisual() {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-500 p-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.24),transparent_35%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/75">Dridoud Social</p>
          <h2 className="mt-4 max-w-xl text-5xl font-black leading-tight">Share. Connect. Create.</h2>
          <p className="mt-4 max-w-lg text-lg leading-8 text-white/85">
            A modern social experience for posts, stories, groups, channels, messages, and real communities.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['Posts', 'Stories', 'Chats'].map((label) => (
            <div key={label} className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
              <div className="mb-3 h-2 w-10 rounded-full bg-white/70" />
              <p className="text-sm font-bold">{label}</p>
              <p className="mt-1 text-xs text-white/70">Ready</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-8 h-40 w-24 rounded-[2rem] border border-white/25 bg-white/20 p-2 shadow-2xl backdrop-blur">
        <div className="h-full rounded-[1.5rem] bg-white p-2">
          <div className="mb-2 h-2 w-10 rounded-full bg-red-200" />
          <div className="space-y-2">
            <div className="h-12 rounded-xl bg-red-100" />
            <div className="h-8 rounded-xl bg-gray-100" />
            <div className="h-8 rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EnglishScreenshotCard({ item }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/80 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-500 p-4 text-white">
        <div className="mx-auto flex h-[520px] w-full max-w-[245px] flex-col rounded-[2rem] border border-white/25 bg-white p-3 text-gray-950 shadow-2xl">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gray-200" />
          <div className="rounded-2xl bg-red-50 px-3 py-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">{item.tag}</p>
            <h3 className="mt-1 text-xl font-black text-gray-950">{item.title}</h3>
          </div>
          <div className="mt-4 flex-1 space-y-3">
            {item.lines.map((line, index) => (
              <div key={line} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-950">{line}</p>
                    <div className="mt-1 h-1.5 w-24 rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {['H', 'S', 'M', 'P'].map((nav) => (
              <div key={nav} className="rounded-xl bg-gray-100 py-2 text-center text-xs font-black text-gray-500">
                {nav}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
  const { language, direction, isArabic } = useLanguage();
  const copy = homeCopy[language];
  const textAlign = isArabic ? 'lg:text-right' : 'lg:text-left';
  const tableAlign = isArabic ? 'text-right' : 'text-left';

  return (
    <div className="w-full" dir={direction}>
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 py-20 dark:from-gray-900 dark:to-gray-800 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className={['text-center', textAlign].join(' ')}>
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-5 py-2 text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
                <span className="font-semibold">{copy.badge}</span>
              </div>

              <h1 className="mt-6 mb-6 text-5xl font-bold leading-tight text-gray-900 dark:text-white sm:text-6xl">
                {copy.heroPrefix}{' '}
                <span className="text-red-700 dark:text-red-500">{copy.heroHighlight}</span>{' '}
                {copy.heroSuffix}
              </h1>
              <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-700 dark:text-gray-300 lg:mx-0">
                {copy.heroDescription}
              </p>

              <div className={['mt-10 flex flex-col gap-4 sm:flex-row', isArabic ? 'justify-center lg:justify-start' : 'justify-center lg:justify-start'].join(' ')}>
                <Link
                  href="/apk/dridoud-v2.7.0-arm64-v8a.apk"
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow-lg shadow-green-900/30 transition-colors hover:bg-green-500"
                >
                  <Image src="/android-white.svg" alt="Android" width={20} height={20} className="h-5 w-5" />
                  <span>{copy.apk}</span>
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  {copy.features}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/70 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
              <div className="relative overflow-hidden rounded-2xl">
                {isArabic ? (
                  <Image src={heroBanner} alt="Dridoud banner" width={1200} height={900} className="h-auto w-full" priority />
                ) : (
                  <EnglishHeroVisual />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-20 dark:bg-gray-950 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              {copy.screenshotsTitle} <span className="text-red-700 dark:text-red-500">{copy.screenshotsHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">{copy.screenshotsSub}</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex snap-x snap-mandatory gap-6 pb-2">
            {galleryScreenshots.map((s, index) => (
              <div key={s.title} className="w-72 shrink-0 snap-start">
                {isArabic ? <ScreenshotCard item={s} copy={copy} /> : <EnglishScreenshotCard item={englishScreenshots[index]} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-gray-50 py-20 dark:bg-gray-900 sm:py-32" style={{ unicodeBidi: 'plaintext' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              {copy.comparisonTitle} <span className="text-red-600 dark:text-red-400">vs</span> {copy.comparisonRest}
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">{copy.comparisonSub}</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <div className="overflow-x-auto">
              <table className={['w-full min-w-[720px]', tableAlign].join(' ')} dir={direction} style={{ unicodeBidi: 'plaintext' }}>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/90 dark:border-gray-800 dark:bg-gray-900">
                    <th className="px-6 py-5 text-base font-bold text-gray-900 dark:text-white">{copy.tableFeature}</th>
                    <th className="px-6 py-5 text-base font-bold text-red-700 dark:text-red-300">{copy.tableDridoud}</th>
                    <th className="px-6 py-5 text-base font-bold text-gray-700 dark:text-gray-300">{copy.tableOthers}</th>
                  </tr>
                </thead>
                <tbody>
                  {copy.rows.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={[
                        'border-b border-gray-200 last:border-b-0 dark:border-gray-800',
                        idx % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50/70 dark:bg-gray-900/60',
                      ].join(' ')}
                    >
                      <th className="w-[22%] px-6 py-5 align-top text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                        {row.feature}
                      </th>
                      <td className="w-[39%] bg-red-100/80 px-6 py-5 align-top text-sm font-semibold leading-8 dark:bg-red-950/35 sm:text-base" style={{ color: '#7a1020', unicodeBidi: 'plaintext' }}>
                        {row.dridoud}
                      </td>
                      <td className="w-[39%] px-6 py-5 align-top text-sm leading-8 text-gray-700 dark:text-gray-300 sm:text-base">
                        {row.others}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-gray-50 py-20 dark:bg-gray-900 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              {copy.whyPrefix} <span className="text-red-700 dark:text-red-500">{copy.whyHighlight}</span> {copy.whySuffix}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-400">{copy.whySub}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {copy.whyItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 py-20 dark:from-gray-900 dark:to-gray-800 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-xl dark:border-gray-800 dark:bg-gray-950 sm:p-14">
            <p className="text-sm uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">{copy.downloadEyebrow}</p>
            <h2 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">{copy.downloadHeading}</h2>
            <p className="mb-10 text-lg text-gray-600 dark:text-gray-300">{copy.downloadSub}</p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {downloadOptions.map((option) => {
                let variantClass = 'border-transparent bg-gray-900 text-white hover:bg-gray-800 dark:bg-red-600 dark:hover:bg-red-500';
                if (option.variant === 'secondary') {
                  variantClass = 'border-gray-200 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/70 dark:text-white dark:hover:bg-gray-800';
                } else if (option.variant === 'tertiary') {
                  variantClass = 'border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900';
                }
                if (!option.available) {
                  variantClass = 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-500 opacity-80 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400';
                }

                const label = option.platform === 'APK' ? copy.apk : option.label;
                return option.available ? (
                  <Link
                    key={option.platform}
                    href={option.href}
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3 font-semibold shadow-lg transition-colors sm:w-auto ${variantClass}`}
                  >
                    <span className="text-base">{label}</span>
                  </Link>
                ) : (
                  <span
                    key={option.platform}
                    aria-disabled="true"
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3 font-semibold shadow-lg sm:w-auto ${variantClass}`}
                  >
                    <span className="text-base">{label} - {copy.soon}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
