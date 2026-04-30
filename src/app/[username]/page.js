import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

function formatUrl(value) {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

async function getProfileByUsername(client, username) {
  const clean = `${username || ''}`.trim();
  if (!clean) return null;

  let result = await client.from('profiles').select('*').eq('username', clean).maybeSingle();
  if (result.data) return result.data;

  result = await client.from('profiles').select('*').ilike('username', clean).maybeSingle();
  return result.data || null;
}

async function getProfileLinks(client, userId) {
  try {
    const { data, error } = await client
      .from('profile_links')
      .select('url,label,sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).filter((item) => `${item.url || ''}`.trim().length > 0);
  } catch {
    try {
      const { data } = await client
        .from('profile_links')
        .select('url')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      return (data || [])
        .map((row, index) => ({ url: row.url, label: `رابط ${index + 1}` }))
        .filter((item) => `${item.url || ''}`.trim().length > 0);
    } catch {
      return [];
    }
  }
}

async function getCount(client, table, filters = [], nullFilters = []) {
  let query = client.from(table).select('*', { count: 'exact', head: true });
  for (const [key, value] of filters) query = query.eq(key, value);
  for (const field of nullFilters) query = query.is(field, null);
  const { count } = await query;
  return count || 0;
}

async function getProfileCounts(client, userId) {
  let followers = 0;
  let following = 0;
  let posts = 0;

  try {
    followers = await getCount(client, 'followers', [['following_id', userId]]);
    following = await getCount(client, 'followers', [['follower_id', userId]]);
  } catch {
    try {
      followers = await getCount(client, 'follows', [['following_id', userId]]);
      following = await getCount(client, 'follows', [['follower_id', userId]]);
    } catch {
      followers = 0;
      following = 0;
    }
  }

  try {
    posts = await getCount(client, 'posts', [['user_id', userId]], ['channel_id', 'group_id']);
  } catch {
    try {
      posts = await getCount(client, 'posts', [['user_id', userId]]);
    } catch {
      posts = 0;
    }
  }

  return { followers, following, posts };
}

export async function generateMetadata({ params }) {
  const routeParams = await params;
  const username = routeParams?.username || '';
  return {
    title: `@${username}`,
    description: `الملف الشخصي للمستخدم @${username} على دريدود.`,
    alternates: { canonical: `/${username}` },
  };
}

export default async function PublicProfilePage({ params }) {
  const routeParams = await params;
  const username = `${routeParams?.username || ''}`.trim();
  const client = getPublicClient();
  if (!client || !username) notFound();

  const profile = await getProfileByUsername(client, username);
  if (!profile) notFound();

  const userId = profile.user_id;
  const [links, counts] = await Promise.all([
    userId ? getProfileLinks(client, userId) : Promise.resolve([]),
    userId ? getProfileCounts(client, userId) : Promise.resolve({ followers: 0, following: 0, posts: 0 }),
  ]);

  const profileName = profile.full_name || profile.username || 'مستخدم';
  const atUsername = `@${profile.username || username}`;
  const coverUrl = profile.cover_url || '';
  const avatarUrl = profile.avatar_url || '';
  const bio = profile.bio || '';
  const website = profile.website || '';
  const details = [
    ['الدولة', profile.country],
    ['المدينة', profile.city],
    ['الوظيفة', profile.job_title],
    ['مكان العمل', profile.workplace],
    ['الحالة الاجتماعية', profile.marital_status],
  ].filter(([, value]) => `${value || ''}`.trim().length > 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f4fff8] via-white to-[#effaf3] py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-emerald-200/55 blur-3xl" />
        <div className="absolute -right-14 bottom-6 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-white/95 shadow-[0_20px_50px_rgba(7,58,34,0.12)]">
          <div className="relative z-0 h-44 w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-[#0f3a26]">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt="غلاف الملف الشخصي"
                fill
                unoptimized
                sizes="100vw"
                className="z-0 h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="px-5 pb-7 sm:px-8">
            <div className="relative z-20 flex flex-wrap items-start justify-between gap-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="relative z-30 -mt-16 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={profileName}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-3xl font-black text-emerald-700">
                      {`${profileName}`.trim().slice(0, 1)}
                    </div>
                  )}
                </div>

                <div className="pt-1 text-right">
                  <h1 className="text-3xl font-black text-[#072b19]">{profileName}</h1>
                  <p className="mt-1 text-base font-semibold text-emerald-700">{atUsername}</p>
                  {profile.is_verified ? (
                    <span className="mt-2 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      حساب موثّق
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/account"
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  دخول إلى حسابي
                </Link>
              </div>
            </div>

            {bio ? <p className="mt-5 max-w-3xl text-base leading-8 text-[#234736]">{bio}</p> : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard label="المتابعون" value={counts.followers} />
              <StatCard label="يتابع" value={counts.following} />
              <StatCard label="المنشورات" value={counts.posts} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-emerald-200/70 bg-white/95 p-6 shadow-[0_14px_36px_rgba(7,58,34,0.1)]">
            <h2 className="text-2xl font-black text-[#0f3a26]">نبذة وتعريف</h2>
            <div className="mt-4 space-y-3">
              {details.length === 0 ? (
                <p className="text-[#2d5644]">لا توجد تفاصيل إضافية حالياً.</p>
              ) : (
                details.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-emerald-100 bg-[#f6fcf8] px-4 py-3">
                    <p className="text-xs font-bold text-emerald-700">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1d4231]">{value}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-emerald-200/70 bg-white/95 p-6 shadow-[0_14px_36px_rgba(7,58,34,0.1)]">
            <h2 className="text-2xl font-black text-[#0f3a26]">الروابط</h2>
            <div className="mt-4 space-y-3">
              {website ? (
                <LinkCard href={formatUrl(website)} label="الموقع الشخصي" />
              ) : null}
              {links.map((link, index) => (
                <LinkCard key={`${link.url}-${index}`} href={formatUrl(link.url)} label={link.label || `رابط ${index + 1}`} />
              ))}
              {!website && links.length === 0 ? <p className="text-[#2d5644]">لا توجد روابط مضافة.</p> : null}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-[#f6fcf8] px-4 py-4 text-center">
      <p className="text-3xl font-black text-[#0e3925]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#2d5644]">{label}</p>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-emerald-100 bg-[#f6fcf8] px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50"
    >
      <p className="text-xs font-bold text-emerald-700">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#1d4231]" dir="ltr">
        {href}
      </p>
    </a>
  );
}
