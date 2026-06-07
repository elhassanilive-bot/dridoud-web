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

function normalizeHandle(raw = '') {
  return String(raw).replace(/^@+/, '').replace(/[^\w\u0600-\u06FF.]/g, '').trim();
}

function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir="rtl" aria-busy="true" aria-label="loading">
      <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-56 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100" />
        <div className="-mt-16 flex flex-col items-center px-6 pb-8">
          <div className="h-32 w-32 rounded-full border-4 border-white bg-slate-200" />
          <div className="mt-5 h-6 w-44 rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-28 rounded-full bg-slate-100" />
          <div className="mt-6 h-4 w-3/4 rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-100" />
          <div className="mt-7 grid w-full max-w-xl grid-cols-3 gap-3">
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="h-16 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-end gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded-full bg-slate-200" />
                  <div className="h-3 w-24 rounded-full bg-slate-100" />
                </div>
                <div className="h-11 w-11 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-10/12 rounded-full bg-slate-100" />
              <div className="h-52 rounded-2xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAgo(dateStr) {
  if (!dateStr) return 'الآن';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} ي`;
}

function isVideoType(mediaType = '', mediaUrl = '') {
  const mt = String(mediaType || '').toLowerCase();
  const url = String(mediaUrl || '').toLowerCase();
  return mt.includes('video') || /\.(mp4|mov|webm|m3u8)(\?|$)/.test(url);
}

function safeJsonParse(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function mediaToArticleBlock(media) {
  if (!media) return null;
  const url = media.media_url || media.thumbnail_url || media.url || media.image_url || media.video_url;
  if (!url) return null;
  return {
    type: isVideoType(media.media_type, url) ? 'video' : 'image',
    url,
    thumbnail: media.thumbnail_url || media.thumb || url,
    caption: media.caption || media.image_caption || '',
  };
}

function normalizeArticleType(value = '') {
  const raw = String(value || '').toLowerCase().replace(/[_\s-]+/g, '');
  if (['h1', 'heading', 'title', 'mainheading', 'mainheader'].includes(raw)) return 'heading';
  if (['h2', 'subheading', 'subtitle', 'subheader'].includes(raw)) return 'subheading';
  if (['quote', 'blockquote'].includes(raw)) return 'quote';
  if (['divider', 'separator', 'line', 'hr'].includes(raw)) return 'divider';
  if (['image', 'articleimage', 'photo'].includes(raw)) return 'image';
  if (['video', 'articlevideo'].includes(raw)) return 'video';
  return 'paragraph';
}

function textFromArticleBlock(block = {}) {
  return String(
    block.text ??
      block.content ??
      block.title ??
      block.value ??
      block.body ??
      block.caption ??
      ''
  ).trim();
}

function extractJsonArticleBlocks(payload, mediaQueue) {
  const source = Array.isArray(payload)
    ? payload
    : payload?.blocks || payload?.articleBlocks || payload?.contentBlocks || payload?.elements || payload?.items || [];
  if (!Array.isArray(source)) return [];

  return source
    .map((block) => {
      if (typeof block === 'string') {
        const text = block.trim();
        return text ? { type: 'paragraph', text } : null;
      }
      const type = normalizeArticleType(block?.type || block?.kind || block?.block_type || block?.blockType);
      const text = textFromArticleBlock(block);
      if (type === 'divider') return { type };
      if (type === 'image' || type === 'video') {
        const queued = mediaQueue.shift();
        const url =
          block?.url ||
          block?.media_url ||
          block?.mediaUrl ||
          block?.image_url ||
          block?.imageUrl ||
          block?.video_url ||
          block?.videoUrl ||
          queued?.url;
        if (!url) return text ? { type: 'paragraph', text } : null;
        return {
          type,
          url,
          thumbnail: block?.thumbnail_url || block?.thumbnailUrl || queued?.thumbnail || url,
          caption: block?.caption || block?.image_caption || block?.imageCaption || '',
        };
      }
      return text ? { type, text } : null;
    })
    .filter(Boolean);
}

function extractTokenArticleBlocks(text, mediaQueue) {
  const source = String(text || '');
  const rx = /\[\[media:(image|video):([^\]]+)\]\]/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = rx.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index).trim();
    if (before) blocks.push(...plainTextArticleBlocks(before));
    blocks.push({
      type: match[1],
      url: match[2],
      thumbnail: match[2],
      caption: '',
    });
    const matchedMediaIndex = mediaQueue.findIndex((m) => m.url === match[2]);
    if (matchedMediaIndex >= 0) mediaQueue.splice(matchedMediaIndex, 1);
    lastIndex = rx.lastIndex;
  }

  const after = source.slice(lastIndex).trim();
  if (after) blocks.push(...plainTextArticleBlocks(after));
  return blocks;
}

function plainTextArticleBlocks(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  return lines.map((line) => {
    if (/^(-{3,}|—{3,}|_{3,})$/.test(line)) return { type: 'divider' };
    if (line.startsWith('>')) return { type: 'quote', text: line.replace(/^>\s*/, '').trim() };
    if (line.startsWith('## ')) return { type: 'subheading', text: line.slice(3).trim() };
    if (line.startsWith('# ')) return { type: 'heading', text: line.slice(2).trim() };
    return { type: 'paragraph', text: line };
  });
}

function buildArticleBlocks(post) {
  const storedBlocks = Array.isArray(post?.content_blocks)
    ? post.content_blocks
    : safeJsonParse(post?.content_blocks);
  if (Array.isArray(storedBlocks) && storedBlocks.length) {
    return extractJsonArticleBlocks(storedBlocks, []);
  }

  const mediaQueue = (post?.post_media || [])
    .slice()
    .sort((a, b) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
    .map(mediaToArticleBlock)
    .filter(Boolean);
  const rawText = postText(post);
  const json = safeJsonParse(rawText);
  const blocks = json
    ? extractJsonArticleBlocks(json, mediaQueue)
    : extractTokenArticleBlocks(rawText, mediaQueue);

  if (!blocks.length && rawText) blocks.push(...plainTextArticleBlocks(rawText));
  blocks.push(...mediaQueue);
  return blocks;
}

function normalizeExternalUrl(raw = '') {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  return value;
}

function tokenizeRichText(text = '') {
  const source = String(text || '');
  const tokens = [];
  const richPattern = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s،,.!?:;"')\]]+|www\.[^\s،,.!?:;"')\]]+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s،,.!?:;"')\]]*)?)|(@[\w\u0600-\u06FF.]+)|(#[\w\u0600-\u06FF]+)/giu;
  let lastIndex = 0;
  let match;

  while ((match = richPattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      tokens.push({
        type: 'url',
        value: match[1],
        href: normalizeExternalUrl(match[2]),
        suffix: '',
      });
    } else if (match[3]) {
      tokens.push({
        type: 'url',
        value: match[3],
        href: normalizeExternalUrl(match[3]),
        suffix: '',
      });
    } else if (match[4]) {
      const handle = normalizeHandle(match[4]);
      tokens.push(handle ? { type: 'mention', value: match[4], handle, suffix: '' } : { type: 'text', value: match[4] });
    } else if (match[5]) {
      const tag = match[5].replace(/^#+/, '').replace(/[^\w\u0600-\u06FF]/g, '').trim();
      tokens.push(tag ? { type: 'hashtag', value: match[5], tag, suffix: '' } : { type: 'text', value: match[5] });
    }

    lastIndex = richPattern.lastIndex;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: 'text', value: source.slice(lastIndex) });
  }

  return tokens;
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

function postText(post) {
  return String(post?.content || post?.description || '').trim();
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = useMemo(() => normalizeUsername(params?.username || ''), [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0, posts: 0, media: 0, reels: 0 });
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [likeCounts, setLikeCounts] = useState({});
  const [shareCounts, setShareCounts] = useState({});
  const [commentsCount, setCommentsCount] = useState({});
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [commentModalPost, setCommentModalPost] = useState(null);

  const [me, setMe] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const client = await getSupabaseClient();
        if (!client) throw new Error('supabase_not_configured');

        const meRes = await client.auth.getUser();
        const meId = meRes?.data?.user?.id || null;
        if (mounted) setMe(meId);

        const p = await findProfile(client, username);
        if (!mounted) return;
        if (!p) {
          setError('لم يتم العثور على هذا الملف الشخصي.');
          setLoading(false);
          return;
        }
        setProfile(p);

        const uid = p.user_id;
        const [linksRes, followersCount, followingCount, postsCount, postsRes] = await Promise.all([
          client.from('profile_links').select('url,label,sort_order,created_at').eq('user_id', uid).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
          getCount(client, 'follows', [['following_id', uid]]),
          getCount(client, 'follows', [['follower_id', uid]]),
          getCount(client, 'posts', [['user_id', uid]], ['channel_id', 'group_id']),
          client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,created_at,background_style,is_sensitive,media_type,privacy,post_media(media_url,thumbnail_url,media_type,order_index)')
            .eq('user_id', uid)
            .neq('privacy', 'private')
            .is('channel_id', null)
            .is('group_id', null)
            .order('created_at', { ascending: false })
            .limit(120),
        ]);

        if (!mounted) return;

        const rows = postsRes?.data || [];
        const postIds = rows.map((r) => r.id).filter(Boolean);
        const mediaCount = rows.filter((r) => (r?.post_media || []).length > 0).length;
        const reelsCount = rows.filter((r) =>
          (r?.post_media || []).some((m) => isVideoType(m.media_type, m.media_url)) ||
          String(r?.media_type || '').toLowerCase().includes('video')
        ).length;

        setPosts(rows);
        setLinks((linksRes.data || []).filter((x) => `${x.url || ''}`.trim().length > 0));
        setCounts({ followers: followersCount, following: followingCount, posts: postsCount, media: mediaCount, reels: reelsCount });

        if (postIds.length) {
          const [likesRes, commentsRes, repostsRes] = await Promise.all([
            client.from('post_reactions').select('post_id,user_id,reaction_type').in('post_id', postIds),
            client.from('comments').select('id,post_id').in('post_id', postIds),
            client.from('reposts').select('post_id,user_id').in('post_id', postIds),
          ]);

          const nextLikes = {};
          const nextComments = {};
          const nextShares = {};
          const nextLiked = new Set();

          for (const pid of postIds) {
            nextLikes[pid] = 0;
            nextComments[pid] = 0;
            nextShares[pid] = 0;
          }
          for (const row of likesRes?.data || []) {
            nextLikes[row.post_id] = (nextLikes[row.post_id] || 0) + 1;
            if (meId && row.user_id === meId && row.reaction_type === 'like') nextLiked.add(row.post_id);
          }
          for (const row of commentsRes?.data || []) {
            nextComments[row.post_id] = (nextComments[row.post_id] || 0) + 1;
          }
          for (const row of repostsRes?.data || []) {
            nextShares[row.post_id] = (nextShares[row.post_id] || 0) + 1;
          }

          if (mounted) {
            setLikeCounts(nextLikes);
            setCommentsCount(nextComments);
            setShareCounts(nextShares);
            setLikedPostIds(nextLiked);
          }
          const commentsFull = await client
            .from('comments')
            .select('id,post_id,content,created_at,updated_at,user_id,parent_id')
            .in('post_id', postIds)
            .order('created_at', { ascending: true });
          const cRows = commentsFull?.data || [];
          const cIds = cRows.map((c) => c.id).filter(Boolean);
          const cUsers = [...new Set(cRows.map((c) => c.user_id).filter(Boolean))];
          const [profilesRes, cReactionsRes] = await Promise.all([
            cUsers.length ? client.from('profiles').select('user_id,username,full_name,avatar_url').in('user_id', cUsers) : { data: [] },
            cIds.length ? client.from('comment_reactions').select('comment_id,user_id,reaction_type').in('comment_id', cIds) : { data: [] },
          ]);
          const pMap = Object.fromEntries((profilesRes?.data || []).map((p) => [p.user_id, p]));
          const grouped = {};
          for (const c of cRows) {
            if (!grouped[c.post_id]) grouped[c.post_id] = [];
            grouped[c.post_id].push({ ...c, profiles: pMap[c.user_id] || null });
          }
          const cReacts = {};
          for (const id of cIds) cReacts[id] = { likeCount: 0, userReaction: null };
          for (const r of (cReactionsRes?.data || [])) {
            const cur = cReacts[r.comment_id] || { likeCount: 0, userReaction: null };
            if (r.reaction_type === 'like') cur.likeCount += 1;
            if (meId && r.user_id === meId) cur.userReaction = r.reaction_type;
            cReacts[r.comment_id] = cur;
          }
          if (mounted) {
            setCommentsByPost(grouped);
            setCommentReactions(cReacts);
          }
        } else if (mounted) {
          setLikeCounts({});
          setCommentsCount({});
          setShareCounts({});
          setLikedPostIds(new Set());
          setCommentsByPost({});
          setCommentReactions({});
        }

        if (meId && meId !== uid) {
          const followRes = await client
            .from('follows')
            .select('follower_id')
            .eq('follower_id', meId)
            .eq('following_id', uid)
            .maybeSingle();
          if (mounted) setIsFollowing(!!followRes?.data);
        } else if (mounted) {
          setIsFollowing(false);
        }
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

  async function toggleFollow() {
    if (!profile?.user_id || !me || me === profile.user_id || followLoading) return;
    const client = await getSupabaseClient();
    if (!client) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await client.from('follows').delete().eq('follower_id', me).eq('following_id', profile.user_id);
        setIsFollowing(false);
        setCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        await client.from('follows').insert({ follower_id: me, following_id: profile.user_id });
        setIsFollowing(true);
        setCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function copyProfileLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
  }

  async function shareProfile() {
    const payload = {
      title: `${profileName} (${atUsername})`,
      text: profile?.bio || `ملف ${profileName} على دريدود`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {}
    await copyProfileLink();
  }

  async function blockUser() {
    if (!me || !profile?.user_id || me === profile.user_id || busyAction) return;
    const ok = window.confirm(`هل تريد حظر ${profileName}؟`);
    if (!ok) return;

    const client = await getSupabaseClient();
    if (!client) return;
    setBusyAction(true);
    try {
      await client.from('hidden_users').upsert({ user_id: me, hidden_user_id: profile.user_id });
      await client.from('follows').delete().match({ follower_id: me, following_id: profile.user_id });
      await client.from('follows').delete().match({ follower_id: profile.user_id, following_id: me });
      setIsFollowing(false);
      setCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      setActionsOpen(false);
    } finally {
      setBusyAction(false);
    }
  }

  async function togglePostLike(postId) {
    if (!me || !postId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const hasLiked = likedPostIds.has(postId);
    if (hasLiked) {
      await client.from('post_reactions').delete().eq('post_id', postId).eq('user_id', me).eq('reaction_type', 'like');
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }));
      return;
    }
    await client.from('post_reactions').upsert({ post_id: postId, user_id: me, reaction_type: 'like' });
    setLikedPostIds((prev) => new Set([...prev, postId]));
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
  }

  async function deletePost(postId) {
    if (!me || !postId) return;
    const ok = window.confirm('هل تريد حذف هذا المنشور نهائياً؟');
    if (!ok) return;
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('posts').delete().eq('id', postId).eq('user_id', me);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function editPostText(postId, currentText) {
    if (!me || !postId) return;
    const next = window.prompt('تعديل نص المنشور', currentText || '');
    if (next == null) return;
    const trimmed = String(next).trim();
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('posts').update({ content: trimmed, description: trimmed }).eq('id', postId).eq('user_id', me);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content: trimmed, description: trimmed } : p)));
  }

  async function copyPostLink(postId) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    } catch {}
  }

  async function addComment(postId, content, parentId = null) {
    if (!me || !postId || !String(content || '').trim()) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const body = String(content || '').trim();
    const { data } = await client
      .from('comments')
      .insert({ post_id: postId, user_id: me, content: body, parent_id: parentId })
      .select('id,post_id,content,created_at,updated_at,user_id,parent_id')
      .single();
    if (!data) return;
    const profileRow = await client.from('profiles').select('user_id,username,full_name,avatar_url').eq('user_id', me).maybeSingle();
    const hydrated = { ...data, profiles: profileRow?.data || null };
    setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), hydrated] }));
    setCommentsCount((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    setCommentReactions((prev) => ({ ...prev, [hydrated.id]: { likeCount: 0, userReaction: null } }));
  }

  async function toggleCommentLike(commentId) {
    if (!me || !commentId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const cur = commentReactions[commentId] || { likeCount: 0, userReaction: null };
    if (cur.userReaction === 'like') {
      await client.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', me).eq('reaction_type', 'like');
      setCommentReactions((prev) => ({ ...prev, [commentId]: { likeCount: Math.max(0, cur.likeCount - 1), userReaction: null } }));
      return;
    }
    await client.from('comment_reactions').upsert({ comment_id: commentId, user_id: me, reaction_type: 'like' });
    setCommentReactions((prev) => ({ ...prev, [commentId]: { likeCount: cur.likeCount + 1, userReaction: 'like' } }));
  }

  async function editComment(postId, commentId, content) {
    if (!me || !commentId || !String(content || '').trim()) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const body = String(content || '').trim();
    await client.from('comments').update({ content: body, updated_at: new Date().toISOString() }).eq('id', commentId).eq('user_id', me);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c) => (c.id === commentId ? { ...c, content: body } : c)),
    }));
  }

  async function deleteComment(postId, commentId) {
    if (!me || !commentId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('comments').delete().eq('id', commentId).eq('user_id', me);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId && c.parent_id !== commentId),
    }));
    setCommentsCount((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
  }

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center" dir="rtl">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error || 'تعذر فتح الملف الشخصي.'}</p>
        <Link href="/interface" className="mt-4 inline-flex rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white">العودة إلى الواجهة</Link>
      </div>
    );
  }

  const isOwnProfile = !!me && me === profile.user_id;
  const profileName = profile.full_name || profile.username || 'مستخدم';
  const atUsername = `@${profile.username || username}`;
  const details = [
    ['الدولة', profile.country],
    ['المدينة', profile.city],
    ['الوظيفة', profile.job_title],
    ['مكان العمل', profile.workplace],
    ['الحالة الاجتماعية', profile.marital_status],
  ].filter(([, v]) => `${v || ''}`.trim().length > 0);

  const tabs = [
    { key: 'posts', label: 'المنشورات', count: counts.posts },
    { key: 'media', label: 'الوسائط', count: counts.media },
    { key: 'reels', label: 'الفيديو', count: counts.reels },
    { key: 'about', label: 'حول', count: details.length + links.length + (profile.website ? 1 : 0) },
  ];

  const visiblePosts = posts.filter((p) => {
    if (activeTab === 'posts') return true;
    if (activeTab === 'media') return (p?.post_media || []).length > 0;
    if (activeTab === 'reels') {
      return (p?.post_media || []).some((m) => isVideoType(m.media_type, m.media_url)) || String(p?.media_type || '').toLowerCase().includes('video');
    }
    return false;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,#ffe4e6,transparent_38%),radial-gradient(circle_at_top_left,#fff1f2,transparent_35%),#f8fafc]" dir="rtl">
      <div className="mx-auto w-full max-w-6xl px-3 pb-10 pt-4 sm:px-5 sm:pt-8">
        <section className="overflow-hidden rounded-3xl border border-rose-200/70 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="relative h-28 w-full bg-gradient-to-r from-rose-700 via-red-600 to-red-800 sm:h-48">
            {profile.cover_url ? <Image src={profile.cover_url} alt="غلاف الملف الشخصي" fill unoptimized sizes="100vw" className="object-cover" /> : null}
          </div>

          <div className="px-3 pb-4 sm:px-6 sm:pb-6">
            <div className="flex flex-col gap-3 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-3">
                <div className="relative -mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:-mt-12 sm:h-28 sm:w-28 sm:rounded-full">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profileName} width={112} height={112} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-rose-50 text-2xl font-black text-red-700">{`${profileName}`.trim().slice(0, 1)}</div>
                  )}
                </div>
                <div className="min-w-0 pb-1 text-right">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-black text-slate-900 sm:text-3xl">{profileName}</h1>
                    {profile.is_verified ? <VerifiedBadge /> : null}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-rose-700 sm:text-base">{atUsername}</p>
                  {profile.bio ? <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">{profile.bio}</p> : null}
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {isOwnProfile ? (
                  <>
                    <Link href="/account/me" className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 sm:flex-none">تعديل الملف الشخصي</Link>
                    <Link href="/create-post" className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:flex-none">إضافة منشور</Link>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={toggleFollow} disabled={!me || followLoading} className={['inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition sm:flex-none', isFollowing ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50' : 'bg-rose-700 text-white hover:bg-rose-800', !me || followLoading ? 'cursor-not-allowed opacity-60' : ''].join(' ')}>
                      {!me ? 'سجّل للدخول للمتابعة' : followLoading ? '...' : isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                    </button>
                    <Link href={`/interface?compose=dm&to=${profile.user_id}`} className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:flex-none">مراسلة</Link>
                  </>
                )}
                <div className="relative">
                  <button type="button" onClick={() => setActionsOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" title="إجراءات">
                    <DotsIcon />
                  </button>
                  {actionsOpen ? (
                    <div className="absolute left-0 top-12 z-20 min-w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button type="button" onClick={shareProfile} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ShareIconMini />مشاركة الملف</button>
                      <button type="button" onClick={copyProfileLink} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><LinkIconMini />نسخ الرابط</button>
                      <Link href={`/complaints?type=users&target=${profile.user_id}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"><ReportIconMini />إبلاغ</Link>
                      {!isOwnProfile ? <button type="button" disabled={!me || busyAction} onClick={blockUser} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"><BlockIconMini />حظر المستخدم</button> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <StatCard label="المنشورات" value={counts.posts} />
              <StatCard label="يتابع" value={counts.following} />
              <StatCard label="المتابعون" value={counts.followers} />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition sm:text-sm',
                    activeTab === t.key
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px]">{t.count}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeTab === 'about' ? (
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-rose-200/70 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-slate-900">نبذة وتعريف</h2>
              <div className="mt-3 space-y-2.5">
                {details.length === 0 ? <p className="text-sm text-slate-600">لا توجد تفاصيل إضافية حالياً.</p> : details.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-black text-rose-700">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-rose-200/70 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-slate-900">الروابط</h2>
              <div className="mt-3 space-y-2.5">
                {profile.website ? <LinkCard href={formatUrl(profile.website)} label="الموقع الشخصي" /> : null}
                {links.map((link, i) => <LinkCard key={`${link.url}-${i}`} href={formatUrl(link.url)} label={link.label || `رابط ${i + 1}`} />)}
                {!profile.website && links.length === 0 ? <p className="text-sm text-slate-600">لا توجد روابط مضافة.</p> : null}
              </div>
            </article>
          </section>
        ) : activeTab === 'media' ? (
          <section className="mt-4">
            {visiblePosts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">لا يوجد وسائط حالياً.</div>
            ) : <MediaGrid posts={visiblePosts} />}
          </section>
        ) : activeTab === 'reels' ? (
          <section className="mt-4 space-y-3">
            {visiblePosts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">لا يوجد فيديوهات حالياً.</div>
            ) : visiblePosts.map((p) => <ReelCard key={p.id} post={p} />)}
          </section>
        ) : (
          <section className="mt-4 space-y-3">
            {visiblePosts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">لا يوجد محتوى في هذا القسم حالياً.</div>
            ) : visiblePosts.map((p) => (
              <ProfilePostCard
                key={p.id}
                post={p}
                me={me}
                author={profile}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                isLiked={likedPostIds.has(p.id)}
                likeCount={likeCounts[p.id] || 0}
                commentCount={commentsCount[p.id] || 0}
                shareCount={shareCounts[p.id] || 0}
                onToggleFollow={toggleFollow}
                onToggleLike={() => togglePostLike(p.id)}
                onDeletePost={() => deletePost(p.id)}
                onEditPost={() => editPostText(p.id, postText(p))}
                onCopyLink={() => copyPostLink(p.id)}
                onBlockUser={blockUser}
                onOpenComments={() => setCommentModalPost(p)}
              />
            ))}
          </section>
        )}
        {commentModalPost ? (
          <CommentsModal
            post={commentModalPost}
            me={me}
            comments={commentsByPost[commentModalPost.id] || []}
            reactions={commentReactions}
            onClose={() => setCommentModalPost(null)}
            onAddComment={(text, parentId) => addComment(commentModalPost.id, text, parentId)}
            onEditComment={(commentId, text) => editComment(commentModalPost.id, commentId, text)}
            onDeleteComment={(commentId) => deleteComment(commentModalPost.id, commentId)}
            onToggleReaction={toggleCommentLike}
          />
        ) : null}
      </div>
    </div>
  );
}

function MediaGrid({ posts }) {
  const mediaItems = posts.flatMap((p) => (p?.post_media || []).map((m, i) => ({ postId: p.id, key: `${p.id}-${i}`, url: m.thumbnail_url || m.media_url, full: m.media_url, type: isVideoType(m.media_type, m.media_url) ? 'video' : 'image' })));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {mediaItems.map((item) => (
        <Link key={item.key} href={`/post/${item.postId}`} className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <Image src={item.url} alt="media" width={480} height={480} unoptimized className="h-44 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-52" />
          {item.type === 'video' ? <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black text-white">فيديو</span> : null}
        </Link>
      ))}
    </div>
  );
}

function ReelCard({ post }) {
  const media = (post?.post_media || []).filter((m) => isVideoType(m.media_type, m.media_url));
  const first = media[0] || null;
  if (!first) return null;
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="px-4 py-3 text-xs font-bold text-slate-500">{formatAgo(post?.created_at)}</div>
      <Link href={`/post/${post.id}`} className="block bg-black">
        <video src={first.media_url} controls className="mx-auto aspect-[9/16] max-h-[78vh] w-full max-w-sm object-contain" />
      </Link>
      <div className="border-t border-slate-100 px-4 py-3">
        <p className="line-clamp-2 text-sm text-slate-700">{postText(post) || 'فيديو بدون وصف'}</p>
      </div>
    </article>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center sm:py-3">
      <p className="text-xl font-black text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-600 sm:text-sm">{label}</p>
    </div>
  );
}

function LinkCard({ href, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-rose-300 hover:bg-rose-50">
      <p className="text-[11px] font-black text-rose-700">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-700 sm:text-sm" dir="ltr">{href}</p>
    </a>
  );
}

function CommentsModal({
  post,
  me,
  comments,
  reactions,
  onClose,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleReaction,
}) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const byParent = comments.reduce((acc, comment) => {
    const key = comment.parent_id || 'root';
    if (!acc[key]) acc[key] = [];
    acc[key].push(comment);
    return acc;
  }, {});

  async function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    await onAddComment(value, replyTo?.id || null);
    setText('');
    setReplyTo(null);
  }

  async function saveEdit(commentId) {
    const value = editingText.trim();
    if (!value) return;
    await onEditComment(commentId, value);
    setEditingId(null);
    setEditingText('');
  }

  function renderComment(comment, depth = 0) {
    const authorName = comment?.profiles?.full_name || comment?.profiles?.username || 'مستخدم';
    const username = comment?.profiles?.username || 'user';
    const summary = reactions[comment.id] || { likeCount: 0, userReaction: null };
    const replies = byParent[comment.id] || [];
    const canManage = comment.user_id === me;
    const isReply = depth > 0;
    return (
      <div key={comment.id} className={isReply ? 'relative mt-2 pr-3 sm:pr-5' : 'mt-3'}>
        {isReply ? <span className="pointer-events-none absolute bottom-2 right-0 top-2 w-px bg-gray-200" /> : null}
        <div className={['rounded-2xl p-3 text-right', isReply ? 'border border-gray-100 bg-white' : 'bg-gray-50'].join(' ')} dir="rtl">
          <div className="flex items-start gap-3">
            <div className={isReply ? 'scale-[0.92] pt-0.5' : ''}>
              <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                {comment?.profiles?.avatar_url ? <Image src={comment?.profiles?.avatar_url} alt={username} width={40} height={40} unoptimized className="h-full w-full object-cover" /> : null}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/${username}`} className="text-[15px] font-black leading-6 text-gray-950 hover:underline sm:text-base">{authorName}</Link>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{formatAgo(comment.created_at)}</span>
              </div>
              {editingId === comment.id ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => saveEdit(comment.id)} className="rounded-lg bg-red-700 px-3 py-1 text-xs font-black text-white">حفظ</button>
                  <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-right text-sm outline-none" />
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{comment.content}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-gray-600 sm:gap-2">
                <button type="button" onClick={() => onToggleReaction(comment.id)} className={['inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition', summary.userReaction === 'like' ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700'].join(' ')}>
                  <LikeMiniIcon />
                  <span>إعجاب {summary.likeCount ? summary.likeCount : ''}</span>
                </button>
                <button type="button" onClick={() => setReplyTo(comment)} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-blue-200 hover:text-blue-700">
                  <CommentMiniIcon />
                  <span>رد</span>
                </button>
                {canManage ? <button type="button" onClick={() => { setEditingId(comment.id); setEditingText(comment.content || ''); }} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-amber-200 hover:text-amber-700"><ReportIconMini /><span>تعديل</span></button> : null}
                {canManage ? <button type="button" onClick={() => onDeleteComment(comment.id)} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-red-200 hover:text-red-700"><BlockIconMini /><span>حذف</span></button> : null}
              </div>
            </div>
          </div>
        </div>
        {replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-1 sm:items-center sm:p-4" dir="rtl">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h2 className="text-lg font-black text-gray-950">التعليقات</h2>
            <p className="text-xs text-gray-500">{comments.length} تعليق على المنشور</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {(byParent.root || []).length ? (byParent.root || []).map((comment) => renderComment(comment, 0)) : <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد تعليقات بعد. كن أول من يعلّق.</div>}
        </div>
        {replyTo ? (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
            <button type="button" onClick={() => setReplyTo(null)}>إلغاء</button>
            <span>الرد على {replyTo?.profiles?.full_name || replyTo?.profiles?.username || 'مستخدم'}</span>
          </div>
        ) : null}
        <form onSubmit={submit} className="flex flex-col gap-2 border-t border-gray-100 p-3 sm:flex-row sm:p-4">
          <button type="submit" className="order-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800 sm:order-1">إرسال</button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? 'اكتب ردًا...' : 'اكتب تعليقًا...'} className="order-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-right text-sm outline-none focus:border-red-300 focus:bg-white sm:order-2" />
        </form>
      </div>
    </div>
  );
}

function ProfilePostCard({
  post,
  me,
  author,
  isOwnProfile,
  isFollowing,
  isLiked,
  likeCount,
  commentCount,
  shareCount,
  onToggleLike,
  onDeletePost,
  onEditPost,
  onCopyLink,
  onBlockUser,
  onToggleFollow,
  onOpenComments,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const text = postText(post);
  const media = post?.post_media || [];
  const articleBlocks = buildArticleBlocks(post);
  const longText = text.length > 260;
  const mentionMatches = Array.from(new Set((text.match(/@([\w\u0600-\u06FF.]{2,})/g) || []).map((m) => m.replace('@', ''))));
  const shownMentions = mentionMatches.slice(0, 4);
  const extraMentions = Math.max(0, mentionMatches.length - shownMentions.length);
  const authorName = author?.full_name || author?.username || 'مستخدم';
  const authorUser = author?.username || 'user';

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate-override' }}>
        <div className="flex items-center gap-2" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
          {!isOwnProfile ? (
            <button type="button" onClick={onToggleFollow} className={['rounded-full px-3 py-1 text-xs font-black', isFollowing ? 'bg-slate-100 text-slate-700' : 'bg-rose-700 text-white'].join(' ')}>
              {isFollowing ? 'متابع' : 'متابعة'}
            </button>
          ) : null}
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
              <DotsIcon />
            </button>
            {menuOpen ? (
              <div className="absolute left-0 top-9 z-20 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                <button type="button" onClick={() => { setMenuOpen(false); onCopyLink?.(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><LinkIconMini />نسخ الرابط</button>
                {isOwnProfile ? (
                  <>
                    <button type="button" onClick={() => { setMenuOpen(false); onEditPost?.(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"><ReportIconMini />تعديل المنشور</button>
                    <button type="button" onClick={() => { setMenuOpen(false); onDeletePost?.(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"><BlockIconMini />حذف المنشور</button>
                  </>
                ) : (
                  <button type="button" disabled={!me} onClick={() => { setMenuOpen(false); onBlockUser?.(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"><BlockIconMini />حظر المستخدم</button>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate-override' }}>
          <div className="text-right" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
            <p className="text-base font-black text-slate-900">{authorName}</p>
            <p className="text-sm font-semibold text-rose-700">@{authorUser} · {formatAgo(post?.created_at)}</p>
          </div>
          <div className="relative h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {author?.avatar_url ? <Image src={author.avatar_url} alt={authorName} fill unoptimized className="object-cover" /> : null}
          </div>
        </div>
      </div>

      {articleBlocks.length ? (
        <div className="px-4 pb-3">
          <ArticleContentPreview
            blocks={articleBlocks}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((v) => !v)}
            postId={post.id}
          />
          {shownMentions.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {shownMentions.map((u) => (
                <Link key={u} href={`/${u}`} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">
                  @{u}
                </Link>
              ))}
              {extraMentions > 0 ? <span className="inline-flex items-center text-xs font-black text-blue-700">عرض المزيد من الإشارات (+{extraMentions})</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-slate-100 px-4 py-2">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{likeCount} إعجاب</span>
          <span>{commentCount} تعليق</span>
          <span>{shareCount} مشاركة</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleLike} className={['flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-black', isLiked ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'].join(' ')}>
            <LikeMiniIcon />
            <span>إعجاب</span>
          </button>
          <button type="button" onClick={onOpenComments} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-xs font-black text-slate-800 hover:bg-slate-200">
            <CommentMiniIcon />
            <span>تعليق</span>
          </button>
          <button type="button" onClick={onCopyLink} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-xs font-black text-slate-800 hover:bg-slate-200">
            <ShareIconMini />
            <span>مشاركة</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ArticleContentPreview({ blocks = [], expanded = false, onToggleExpanded, postId }) {
  const visibleLimit = 3;
  const hasLongParagraph = blocks.some((block) => String(block?.text || '').length > 260);
  const shouldClip = blocks.length > visibleLimit || hasLongParagraph;
  const visibleBlocks = shouldClip && !expanded ? blocks.slice(0, visibleLimit) : blocks;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {visibleBlocks.map((block, index) => (
        <ArticleBlock key={`${block.type}-${index}-${block.url || block.text || ''}`} block={block} postId={postId} compact={!expanded && index === visibleBlocks.length - 1 && hasLongParagraph} />
      ))}
      {shouldClip ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100 hover:underline"
        >
          {expanded ? 'عرض أقل' : 'عرض المقال كاملًا'}
        </button>
      ) : null}
    </div>
  );
}

function ArticleBlock({ block, postId, compact = false }) {
  const text = String(block?.text || '').trim();
  if (block?.type === 'divider') {
    return <div className="mx-auto h-px w-2/3 bg-gradient-to-l from-transparent via-slate-300 to-transparent" />;
  }
  if (block?.type === 'heading') {
    return <RichArticleText as="h2" text={text} className="text-2xl font-black leading-[1.55] text-slate-950" />;
  }
  if (block?.type === 'subheading') {
    return <RichArticleText as="h3" text={text} className="text-xl font-extrabold leading-[1.6] text-slate-900" />;
  }
  if (block?.type === 'quote') {
    return (
      <blockquote className="rounded-2xl border-r-4 border-rose-600 bg-rose-50 px-4 py-3 text-base font-bold leading-8 text-rose-950">
        <RichArticleText as="span" text={text} />
      </blockquote>
    );
  }
  if (block?.type === 'image' || block?.type === 'video') {
    const mediaUrl = block.url || block.thumbnail;
    if (!mediaUrl) return null;
    return (
      <Link href={`/post/${postId}`} className="block overflow-hidden rounded-2xl border border-slate-100 bg-black">
        {block.type === 'video' ? (
          <video src={mediaUrl} controls className="max-h-[72vh] w-full object-contain" preload="metadata" />
        ) : (
          <Image src={mediaUrl} alt={block.caption || 'post-media'} width={1200} height={800} unoptimized className="h-auto max-h-[72vh] w-full object-contain" />
        )}
        {block.caption ? (
          <div className="bg-white px-3 py-2 text-center text-xs font-semibold text-slate-500">{block.caption}</div>
        ) : null}
      </Link>
    );
  }
  if (!text) return null;
  const shown = compact && text.length > 260 ? `${text.slice(0, 260).trim()}...` : text;
  return <RichArticleText as="p" text={shown} className="whitespace-pre-wrap text-base font-semibold leading-8 text-slate-800" />;
}

function RichArticleText({ text = '', as: Tag = 'span', className = '' }) {
  const tokens = tokenizeRichText(text);
  return (
    <Tag className={className} dir="rtl">
      {tokens.map((token, index) => {
        if (token.type === 'space') return <span key={`s-${index}`}>{token.value}</span>;
        if (token.type === 'url') {
          return (
            <span key={`u-${index}`}>
              <a
                href={token.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="font-black text-blue-700 underline decoration-blue-400 underline-offset-2 transition hover:text-blue-900"
                dir="ltr"
              >
                {token.value}
              </a>
              {token.suffix ? <span>{token.suffix}</span> : null}
            </span>
          );
        }
        if (token.type === 'mention') {
          return (
            <span key={`m-${index}`}>
              <Link
                href={`/${token.handle}`}
                onClick={(event) => event.stopPropagation()}
                className="font-black text-blue-700 underline decoration-blue-400 underline-offset-2 transition hover:text-blue-900"
              >
                {token.value}
              </Link>
              {token.suffix ? <span>{token.suffix}</span> : null}
            </span>
          );
        }
        if (token.type === 'hashtag') {
          return (
            <span key={`h-${index}`}>
              <Link
                href={`/interface?tag=${encodeURIComponent(token.tag)}`}
                onClick={(event) => event.stopPropagation()}
                className="font-black text-blue-700 underline decoration-blue-400 underline-offset-2 transition hover:text-blue-900"
              >
                {token.value}
              </Link>
              {token.suffix ? <span>{token.suffix}</span> : null}
            </span>
          );
        }
        return <span key={`t-${index}`}>{token.value}</span>;
      })}
    </Tag>
  );
}
function VerifiedBadge() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200" title="حساب موثق">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 12 4 4 8-8" />
      </svg>
    </span>
  );
}

function DotsIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>;
}
function ShareIconMini() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 16V3" /><path d="m7 8 5-5 5 5" /></svg>;
}
function LinkIconMini() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" /><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L14 19" /></svg>;
}
function ReportIconMini() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v16" /><path d="M4 5h11l-1.5 3L15 11H4" /></svg>;
}
function BlockIconMini() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="m7 17 10-10" /></svg>;
}
function LikeMiniIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" /><path d="M7 11 11 3a2.2 2.2 0 0 1 4.1 1.55L14 10h5.1a2 2 0 0 1 1.95 2.45l-1.6 7A2 2 0 0 1 17.5 21H7V11Z" /></svg>;
}
function CommentMiniIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-6.5A8.5 8.5 0 1 1 21 12Z" /></svg>;
}

