import { createClient } from '@supabase/supabase-js';
import { site } from '@/config/site';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getServerSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

export default async function sitemap() {
  const now = new Date();
  const routes = [
    '',
    '/about',
    '/features',
    '/download',
    '/privacy',
    '/terms',
    '/agreements',
    '/dmca',
    '/security',
    '/contact',
    '/faq',
    '/complaints',
    '/deletion',
    '/interface',
  ];

  const staticItems = routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const client = getServerSupabase();
  if (!client) return staticItems;

  const { data } = await client
    .from('posts')
    .select('id,created_at,privacy')
    .order('created_at', { ascending: false })
    .limit(1500);

  const postItems = (data || [])
    .filter((p) => String(p?.privacy || 'public') !== 'private')
    .map((p) => ({
      url: `${site.url}/post/${p.id}`,
      lastModified: p?.created_at ? new Date(p.created_at) : now,
      changeFrequency: 'daily',
      priority: 0.85,
    }));

  const { data: profiles } = await client
    .from('profiles')
    .select('username,created_at')
    .not('username', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3000);

  const profileItems = (profiles || [])
    .filter((p) => String(p?.username || '').trim())
    .map((p) => ({
      url: `${site.url}/${encodeURIComponent(String(p.username).trim())}`,
      lastModified: p?.created_at ? new Date(p.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.72,
    }));

  return [...staticItems, ...profileItems, ...postItems];
}
