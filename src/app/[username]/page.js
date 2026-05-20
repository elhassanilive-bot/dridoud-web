'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

function formatUrl(value) {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

function normalizeUsername(v = '') {
  return String(v).trim().replace(/^@+/, '');
}

async function findProfile(client, rawUsername) {
  const clean = normalizeUsername(rawUsername);
  if (!clean) return null;

  const projection = 'user_id,username,full_name,avatar_url,cover_url,bio,website,country,city,job_title,workplace,marital_status,is_verified';
  const candidates = Array.from(new Set([clean, clean.toLowerCase()]));

  for (const c of candidates) {
    const exact = await client.from('profiles').select(projection).eq('username', c).maybeSingle();
    if (exact.data) return exact.data;
  }

  for (const c of candidates) {
    const like = await client.from('profiles').select(projection).ilike('username', c).maybeSingle();
    if (like.data) return like.data;
  }

  const byName = await client.from('profiles').select(projection).ilike('full_name', clean).limit(1);
  if (Array.isArray(byName.data) && byName.data.length > 0) return byName.data[0];

  return null;
}

async function getCount(client, table, filters = [], nullFilters = []) {
  let q = client.from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of filters) q = q.eq(k, v);
  for (const f of nullFilters) q = q.is(f, null);
  const { count } = await q;
  return count || 0;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = useMemo(() => normalizeUsername(params?.username || ''), [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0, posts: 0 });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const client = await getSupabaseClient();
        if (!client) throw new Error('supabase_not_configured');

        const p = await findProfile(client, username);
        if (!mounted) return;
        if (!p) {
          setError('لم يتم العثور على هذا الملف الشخصي.');
          setLoading(false);
          return;
        }
        setProfile(p);

        const uid = p.user_id;
        const [linksRes, followersCount, followingCount, postsCount] = await Promise.all([
          client.from('profile_links').select('url,label,sort_order,created_at').eq('user_id', uid).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
          getCount(client, 'follows', [['following_id', uid]]),
          getCount(client, 'follows', [['follower_id', uid]]),
          getCount(client, 'posts', [['user_id', uid]], ['channel_id', 'group_id']),
        ]);

        if (!mounted) return;
        setLinks((linksRes.data || []).filter((x) => `${x.url || ''}`.trim().length > 0));
        setCounts({ followers: followersCount, following: followingCount, posts: postsCount });
      } catch (e) {
        if (!mounted) return;
        setError(`تعذر تحميل الملف الشخصي: ${e?.message || 'unknown_error'}`);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [username]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-600" dir="rtl">جاري تحميل الملف الشخصي...</div>;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center" dir="rtl">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error || 'تعذر فتح الملف الشخصي.'}</p>
        <Link href="/interface" className="mt-4 inline-flex rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white">العودة إلى الواجهة</Link>
      </div>
    );
  }

  const profileName = profile.full_name || profile.username || 'مستخدم';
  const atUsername = `@${profile.username || username}`;
  const details = [
    ['الدولة', profile.country],
    ['المدينة', profile.city],
    ['الوظيفة', profile.job_title],
    ['مكان العمل', profile.workplace],
    ['الحالة الاجتماعية', profile.marital_status],
  ].filter(([, v]) => `${v || ''}`.trim().length > 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fdf4f6] via-white to-[#fff1f2] py-8 sm:py-12" dir="rtl">
      <div className="relative mx-auto w-full max-w-6xl px-4">
        <section className="overflow-hidden rounded-[2rem] border border-rose-200/70 bg-white/95 shadow-[0_20px_50px_rgba(127,29,29,0.12)]">
          <div className="relative z-0 h-44 w-full bg-gradient-to-r from-red-700 via-rose-600 to-[#7f1d1d]">
            {profile.cover_url ? <Image src={profile.cover_url} alt="غلاف الملف الشخصي" fill unoptimized sizes="100vw" className="object-cover" /> : null}
          </div>

          <div className="px-5 pb-7 sm:px-8">
            <div className="relative z-20 flex flex-wrap items-start justify-between gap-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="relative z-30 -mt-16 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profileName} width={112} height={112} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-rose-50 text-3xl font-black text-red-700">{`${profileName}`.trim().slice(0, 1)}</div>
                  )}
                </div>

                <div className="pt-1 text-right">
                  <h1 className="text-3xl font-black text-[#450a0a]">{profileName}</h1>
                  <p className="mt-1 text-base font-semibold text-red-700">{atUsername}</p>
                </div>
              </div>

              <Link href="/account" className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">دخول إلى حسابي</Link>
            </div>

            {profile.bio ? <p className="mt-5 max-w-3xl text-base leading-8 text-[#3f1d1d]">{profile.bio}</p> : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard label="المتابعون" value={counts.followers} />
              <StatCard label="يتابع" value={counts.following} />
              <StatCard label="المنشورات" value={counts.posts} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-rose-200/70 bg-white/95 p-6 shadow-[0_14px_36px_rgba(127,29,29,0.1)]">
            <h2 className="text-2xl font-black text-[#450a0a]">نبذة وتعريف</h2>
            <div className="mt-4 space-y-3">
              {details.length === 0 ? <p className="text-[#5b2c2c]">لا توجد تفاصيل إضافية حالياً.</p> : details.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-rose-100 bg-[#fff7f7] px-4 py-3">
                  <p className="text-xs font-bold text-red-700">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#3f1d1d]">{value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-rose-200/70 bg-white/95 p-6 shadow-[0_14px_36px_rgba(127,29,29,0.1)]">
            <h2 className="text-2xl font-black text-[#450a0a]">الروابط</h2>
            <div className="mt-4 space-y-3">
              {profile.website ? <LinkCard href={formatUrl(profile.website)} label="الموقع الشخصي" /> : null}
              {links.map((link, i) => <LinkCard key={`${link.url}-${i}`} href={formatUrl(link.url)} label={link.label || `رابط ${i + 1}`} />)}
              {!profile.website && links.length === 0 ? <p className="text-[#5b2c2c]">لا توجد روابط مضافة.</p> : null}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-[#fff7f7] px-4 py-4 text-center">
      <p className="text-3xl font-black text-[#450a0a]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#5b2c2c]">{label}</p>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-rose-100 bg-[#fff7f7] px-4 py-3 transition hover:border-red-300 hover:bg-red-50">
      <p className="text-xs font-bold text-red-700">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#3f1d1d]" dir="ltr">{href}</p>
    </a>
  );
}
