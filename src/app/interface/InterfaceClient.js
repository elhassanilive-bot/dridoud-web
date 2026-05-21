'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const SECTION_LABELS = [
  { key: 'home', label: 'الرئيسية' },
  { key: 'reels', label: 'الريلز' },
  { key: 'groups', label: 'المجموعات' },
  { key: 'channels', label: 'القنوات' },
  { key: 'explore', label: 'استكشاف' },
];

const SUGGESTED_FILTERS = [
  { key: 'following', label: 'من المتابعين فقط' },
  { key: 'similar', label: 'مشابه لاهتماماتي' },
  { key: 'engagement', label: 'الأكثر تفاعلاً' },
];

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

function isVideoUrl(url = '') {
  const l = String(url).toLowerCase();
  return l.endsWith('.mp4') || l.endsWith('.mov') || l.endsWith('.webm') || l.includes('.m3u8');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mediaFromPost(post) {
  const pm = asArray(post?.post_media);
  if (pm.length) {
    return pm.map((m) => ({
      url: m.thumbnail_url || m.media_url,
      full: m.media_url || m.thumbnail_url,
      type: (m.media_type || '').toLowerCase().includes('video') ? 'video' : 'image',
    }));
  }

  return [];
}

function deriveReactionsCount(reactions, postId) {
  return (reactions[postId] || 0);
}

function postPermalink(postId) {
  return `/post/${postId}`;
}

function extractInterestTokens(posts = []) {
  const bucket = new Set();
  const rx = /[A-Za-z\u0600-\u06FF0-9_]{3,}/g;
  for (const p of posts.slice(0, 30)) {
    const text = String(p?.content || p?.description || '').toLowerCase();
    const matches = text.match(rx) || [];
    for (const t of matches) bucket.add(t);
  }
  return bucket;
}

function overlapScore(text = '', tokens = new Set()) {
  if (!tokens.size) return 0;
  const lower = String(text).toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower.includes(token)) score += 1;
  }
  return score;
}

function normalizeHandle(raw = '') {
  return String(raw).replace(/^@+/, '').replace(/[^\w\u0600-\u06FF.]/g, '').trim();
}

function tokenizePostText(text = '') {
  const parts = String(text).split(/(\s+)/);
  return parts.map((part) => {
    if (!part || /^\s+$/.test(part)) return { type: 'space', value: part };

    const clean = part.replace(/[،,.!?:;"')\]]+$/g, '');
    const suffix = part.slice(clean.length);

    if (clean.startsWith('@')) {
      const handle = normalizeHandle(clean);
      if (handle) return { type: 'mention', value: clean, handle, suffix };
    }

    if (clean.startsWith('#')) {
      const tag = clean.replace(/^#+/, '').replace(/[^\w\u0600-\u06FF]/g, '').trim();
      if (tag) return { type: 'hashtag', value: clean, tag, suffix };
    }

    return { type: 'text', value: part };
  });
}

function PostText({ text, mentionMap = {} }) {
  const fullText = String(text || '').trim();
  const [expanded, setExpanded] = useState(false);
  const [mentionsExpanded, setMentionsExpanded] = useState(false);
  const shouldTrim = fullText.length > 220;
  const shownText = shouldTrim && !expanded ? `${fullText.slice(0, 220).trim()}...` : fullText;
  const tokens = tokenizePostText(shownText);
  const mentionRanks = [];
  let rankCounter = 0;
  for (const t of tokens) {
    if (t.type === 'mention') {
      rankCounter += 1;
      mentionRanks.push(rankCounter);
    } else {
      mentionRanks.push(0);
    }
  }
  const mentionTotal = rankCounter;

  return (
    <div className="text-right text-xl font-black leading-9 text-current" dir="rtl">
      {tokens.map((t, i) => {
        if (t.type === 'space') return <span key={`s-${i}`}>{t.value}</span>;

        if (t.type === 'mention') {
          const mentionRank = mentionRanks[i] || 0;
          if (mentionTotal > 5 && !mentionsExpanded && mentionRank > 5) return null;

          const key = String(t.handle || '').toLowerCase();
          const mentioned = mentionMap[key] || null;
          if (mentioned) {
            const mentionName = mentioned.full_name || mentioned.username || t.handle;
            const mentionUsername = mentioned.username || t.handle;
            return (
              <span key={`m-${i}`} className="inline-flex align-middle">
                <Link
                  href={`/${normalizeHandle(mentionUsername)}`}
                  className="mx-1 my-0.5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100"
                  dir="rtl"
                >
                  <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-blue-300 bg-white">
                    {mentioned.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mentioned.avatar_url} alt={mentionUsername} className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="truncate text-[13px] font-black text-blue-800">{mentionName}</span>
                  <span className="text-[12px] font-semibold text-blue-600/90 ltr">@{normalizeHandle(mentionUsername)}</span>
                </Link>
                {t.suffix ? <span>{t.suffix}</span> : null}
              </span>
            );
          }

          return (
            <span key={`m-${i}`}>
              <Link href={`/${t.handle}`} className="font-black underline decoration-current/70 underline-offset-2 hover:opacity-80">
                {t.value}
              </Link>
              {t.suffix ? <span>{t.suffix}</span> : null}
            </span>
          );
        }

        if (t.type === 'hashtag') {
          return (
            <span key={`h-${i}`}>
              <Link href={`/interface?tag=${encodeURIComponent(t.tag)}`} className="font-black underline decoration-current/70 underline-offset-2 hover:opacity-80">
                {t.value}
              </Link>
              {t.suffix ? <span>{t.suffix}</span> : null}
            </span>
          );
        }

        return <span key={`t-${i}`}>{t.value}</span>;
      })}

      {mentionTotal > 5 ? (
        <button
          type="button"
          onClick={() => setMentionsExpanded((v) => !v)}
          className="mr-2 inline text-xs font-black text-blue-700 hover:underline"
        >
          {mentionsExpanded ? 'إخفاء الإشارات' : `عرض المزيد من الإشارات (+${mentionTotal - 5})`}
        </button>
      ) : null}

      {shouldTrim ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mr-2 inline text-xs font-black text-red-700 hover:underline"
        >
          {expanded ? 'إخفاء' : 'عرض المزيد'}
        </button>
      ) : null}
    </div>
  );
}

function ExpandableCommentText({ text = '', maxChars = 210 }) {
  const fullText = String(text || '').trim();
  const [expanded, setExpanded] = useState(false);
  const shouldTrim = fullText.length > maxChars;
  const shownText =
    shouldTrim && !expanded
      ? `${fullText.slice(0, maxChars).trim()}...`
      : fullText;

  return (
    <div className="space-y-1">
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{shownText}</p>
      {shouldTrim ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-black text-blue-700 hover:underline"
        >
          {expanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      ) : null}
    </div>
  );
}

export default function InterfaceClient() {
  const router = useRouter();
  const [active, setActive] = useState('home');
  const [homeTab, setHomeTab] = useState('latest'); // latest | suggested
  const [suggestedFilter, setSuggestedFilter] = useState('following');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedPosts, setFeedPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [pollsByPost, setPollsByPost] = useState({});
  const [commentModalPost, setCommentModalPost] = useState(null);
  const [likedByPost, setLikedByPost] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [followed, setFollowed] = useState(new Set());
  const [me, setMe] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [toast, setToast] = useState(null);
  const [shareComposerPost, setShareComposerPost] = useState(null);
  const [shareQuote, setShareQuote] = useState('');
  const [editPostTarget, setEditPostTarget] = useState(null);
  const [editPostDraft, setEditPostDraft] = useState('');
  const [deleteTargetPost, setDeleteTargetPost] = useState(null);
  const [blockTargetPost, setBlockTargetPost] = useState(null);
  const LOAD_STEP = 30;
  const [fetchLimit, setFetchLimit] = useState(LOAD_STEP);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const bottomSentinelRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      const initialLoad = fetchLimit <= LOAD_STEP;
      if (initialLoad) setLoading(true); else setIsFetchingMore(true);
      setError('');

      try {
        const client = await getSupabaseClient();
        if (!client) throw new Error('supabase_not_configured');

        const session = await client.auth.getSession();
        const meId = session?.data?.session?.user?.id || null;
        if (!mounted) return;

        setMe(meId);
        setAuthRequired(!meId);
        if (!meId) {
          setError('يجب تسجيل الدخول لعرض المحتوى.');
          setLoading(false);
          return;
        }

        const postsRes = await client
          .from('posts')
          .select('id,user_id,content,description,media_type,created_at,group_id,channel_id,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
          .order('created_at', { ascending: false })
          .limit(fetchLimit);

        if (postsRes.error) {
          throw new Error(postsRes.error.message || postsRes.error.code || 'posts_query_failed');
        }

        const posts = postsRes.data || [];
        setHasMore(posts.length >= fetchLimit);
        setFeedPosts(posts);

        const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
        const groupIds = [...new Set(posts.map((p) => p.group_id).filter(Boolean))];
        const channelIds = [...new Set(posts.map((p) => p.channel_id).filter(Boolean))];
        const postIds = posts.map((p) => p.id).filter(Boolean);

        const [peopleRes, postMediaRes, commentsRes, likesRes, myLikesRes, followsRes, groupsRes, channelsRes] = await Promise.all([
          client.from('profiles').select('user_id,username,full_name,avatar_url,is_verified,created_at').order('created_at', { ascending: false }).limit(200),
          postIds.length
            ? client.from('post_media').select('post_id,media_url,thumbnail_url,media_type,order_index').in('post_id', postIds).order('order_index', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
          postIds.length
            ? client.from('comments').select('id,post_id,content,created_at,updated_at,user_id,parent_id').in('post_id', postIds).order('created_at', { ascending: true }).limit(400)
            : Promise.resolve({ data: [], error: null }),
          postIds.length
            ? client.from('post_reactions').select('post_id,reaction_type').in('post_id', postIds).eq('reaction_type', 'like')
            : Promise.resolve({ data: [], error: null }),
          postIds.length
            ? client.from('post_reactions').select('post_id').in('post_id', postIds).eq('reaction_type', 'like').eq('user_id', meId)
            : Promise.resolve({ data: [], error: null }),
          client.from('follows').select('following_id').eq('follower_id', meId),
          groupIds.length
            ? client.from('groups').select('id,name,avatar_url').in('id', groupIds)
            : Promise.resolve({ data: [], error: null }),
          channelIds.length
            ? client.from('channels').select('id,name,username,avatar_url,is_verified').in('id', channelIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const people = peopleRes?.data || [];
        setProfiles(people);

        const pMap = {};
        for (const p of people) pMap[p.user_id] = p;
        setProfilesMap(pMap);

        const pmMap = {};
        for (const m of (postMediaRes?.data || [])) {
          if (!pmMap[m.post_id]) pmMap[m.post_id] = [];
          pmMap[m.post_id].push(m);
        }

        const gMap = {};
        for (const g of (groupsRes?.data || [])) gMap[g.id] = g;
        const cMap = {};
        for (const c of (channelsRes?.data || [])) cMap[c.id] = c;

        setFeedPosts((prev) =>
          prev.map((p) => ({
            ...p,
            profiles: pMap[p.user_id] || null,
            groups: p.group_id ? gMap[p.group_id] || null : null,
            channels: p.channel_id ? cMap[p.channel_id] || null : null,
            post_media: pmMap[p.id] || [],
          }))
        );

        const commentsRows = commentsRes?.data || [];
        const commentsGrouped = {};
        for (const c of commentsRows) {
          if (!commentsGrouped[c.post_id]) commentsGrouped[c.post_id] = [];
          commentsGrouped[c.post_id].push({ ...c, profiles: pMap[c.user_id] || null });
        }
        setCommentsByPost(commentsGrouped);

        const commentIds = commentsRows.map((c) => c.id).filter(Boolean);
        if (commentIds.length) {
          const commentReactionsRes = await client
            .from('comment_reactions')
            .select('comment_id,user_id,reaction_type')
            .in('comment_id', commentIds);
          const nextCommentReactions = {};
          for (const id of commentIds) nextCommentReactions[id] = { likeCount: 0, userReaction: null };
          for (const row of (commentReactionsRes?.data || [])) {
            const summary = nextCommentReactions[row.comment_id] || { likeCount: 0, userReaction: null };
            if (row.reaction_type === 'like') summary.likeCount += 1;
            if (row.user_id === meId) summary.userReaction = row.reaction_type;
            nextCommentReactions[row.comment_id] = summary;
          }
          setCommentReactions(nextCommentReactions);
        } else {
          setCommentReactions({});
        }

        const likeMap = {};
        for (const r of (likesRes?.data || [])) {
          likeMap[r.post_id] = (likeMap[r.post_id] || 0) + 1;
        }
        setLikeCounts(likeMap);

        const likedSet = new Set((myLikesRes?.data || []).map((r) => r.post_id));
        setLikedByPost(likedSet);

        const followsSet = new Set((followsRes?.data || []).map((r) => r.following_id));
        setFollowed(followsSet);

        if (postIds.length) {
          const pollsRes = await client
            .from('post_polls')
            .select(`
              id,post_id,question,expires_at,
              post_poll_options (
                id,option_text,order_index,
                post_poll_votes ( user_id )
              )
            `)
            .in('post_id', postIds);
          const nextPolls = {};
          for (const poll of (pollsRes?.data || [])) {
            const options = [...((poll?.post_poll_options || []))].sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
            let myOptionId = null;
            for (const opt of options) {
              const votes = opt?.post_poll_votes || [];
              if (votes.some((v) => String(v?.user_id || '') === String(meId || ''))) {
                myOptionId = opt.id;
                break;
              }
            }
            nextPolls[poll.post_id] = { ...poll, post_poll_options: options, myOptionId };
            if (poll?.expires_at) {
              const expiresAtMs = new Date(poll.expires_at).getTime();
              nextPolls[poll.post_id].isExpired = Number.isFinite(expiresAtMs) ? expiresAtMs < Date.now() : false;
            } else {
              nextPolls[poll.post_id].isExpired = false;
            }
          }
          setPollsByPost(nextPolls);
        } else {
          setPollsByPost({});
        }

        setFeedPosts((prev) =>
          prev.filter((p) => {
            const v = String(p?.privacy || 'public');
            if (p?.user_id === meId) return true;
            if (v === 'private') return false;
            if (v === 'followers') return followsSet.has(p?.user_id);
            return true;
          })
        );
      } catch (e) {
        if (!mounted) return;
        const msg = e?.message || 'unknown_error';
        setError(`تعذر تحميل المنشورات حالياً: ${msg}`);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [fetchLimit]);


  useEffect(() => {
    const node = bottomSentinelRef.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || isFetchingMore || !hasMore) return;
        setFetchLimit((prev) => prev + LOAD_STEP);
      },
      { root: null, rootMargin: '500px 0px', threshold: 0.01 }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [loading, isFetchingMore, hasMore]);

  const derived = useMemo(() => {
    const home = feedPosts;
    const reels = feedPosts.filter((p) => (p?.media_type || '').toLowerCase().includes('video') || mediaFromPost(p).some((m) => m.type === 'video'));
    const groups = feedPosts.filter((p) => !!p.group_id);
    const channels = feedPosts.filter((p) => !!p.channel_id);
    return { home, reels, groups, channels };
  }, [feedPosts]);

  const counts = useMemo(
    () => ({
      posts: derived.home.length,
      reels: derived.reels.length,
      groups: derived.groups.length,
      channels: derived.channels.length,
      profiles: profiles.length,
    }),
    [derived, profiles]
  );
  const postsById = useMemo(() => Object.fromEntries(feedPosts.map((p) => [p.id, p])), [feedPosts]);
  const mentionMap = useMemo(() => {
    const map = {};
    for (const p of profiles || []) {
      const u = normalizeHandle(p?.username || '');
      if (u) map[u.toLowerCase()] = p;
    }
    return map;
  }, [profiles]);

  const suggestedHomePosts = useMemo(() => {
    const now = Date.now();
    const interestTokens = extractInterestTokens(
      feedPosts.filter((p) => likedByPost.has(p.id)).length
        ? feedPosts.filter((p) => likedByPost.has(p.id))
        : feedPosts
    );

    const list = [...feedPosts];
    list.sort((a, b) => {
      const dateA = new Date(a?.created_at || 0).getTime();
      const dateB = new Date(b?.created_at || 0).getTime();
      const ageA = Math.max(1, (now - dateA) / 60000);
      const ageB = Math.max(1, (now - dateB) / 60000);
      const recA = 1 / (1 + ageA / 180);
      const recB = 1 / (1 + ageB / 180);
      const likeA = deriveReactionsCount(likeCounts, a.id);
      const likeB = deriveReactionsCount(likeCounts, b.id);
      const comA = (commentsByPost[a.id] || []).length;
      const comB = (commentsByPost[b.id] || []).length;
      const followA = followed.has(a?.user_id) ? 1 : 0;
      const followB = followed.has(b?.user_id) ? 1 : 0;
      const ovA = overlapScore(a?.content || a?.description || '', interestTokens);
      const ovB = overlapScore(b?.content || b?.description || '', interestTokens);

      let scoreA = 0;
      let scoreB = 0;
      if (suggestedFilter === 'following') {
        scoreA = followA * 5 + recA * 2.2 + likeA * 0.05 + comA * 0.08 + ovA * 0.16;
        scoreB = followB * 5 + recB * 2.2 + likeB * 0.05 + comB * 0.08 + ovB * 0.16;
      } else if (suggestedFilter === 'similar') {
        scoreA = ovA * 1.4 + recA * 2.4 + followA * 1.2 + likeA * 0.04 + comA * 0.06;
        scoreB = ovB * 1.4 + recB * 2.4 + followB * 1.2 + likeB * 0.04 + comB * 0.06;
      } else {
        scoreA = likeA * 0.14 + comA * 0.2 + recA * 1.8 + ovA * 0.24 + followA * 0.7;
        scoreB = likeB * 0.14 + comB * 0.2 + recB * 1.8 + ovB * 0.24 + followB * 0.7;
      }
      return scoreB - scoreA;
    });

    if (suggestedFilter === 'following') {
      const onlyFollowing = list.filter((p) => followed.has(p?.user_id));
      if (onlyFollowing.length >= 8) return onlyFollowing;
    }
    return list;
  }, [feedPosts, likedByPost, commentsByPost, likeCounts, followed, suggestedFilter]);

  const homeRenderPosts = homeTab === 'suggested' ? suggestedHomePosts : derived.home;

  async function toggleFollow(userId) {
    if (!me || !userId || userId === me) return;
    const client = await getSupabaseClient();
    if (!client) return;

    const currentlyFollowing = followed.has(userId);
    const next = new Set(followed);

    if (currentlyFollowing) {
      await client.from('follows').delete().eq('follower_id', me).eq('following_id', userId);
      next.delete(userId);
    } else {
      await client.from('follows').insert({ follower_id: me, following_id: userId });
      next.add(userId);
    }

    setFollowed(next);
  }

  async function toggleLike(postId) {
    if (!me || !postId) return;
    const client = await getSupabaseClient();
    if (!client) return;

    const isLiked = likedByPost.has(postId);
    const nextLiked = new Set(likedByPost);
    const nextCounts = { ...likeCounts };

    if (isLiked) {
      await client.from('post_reactions').delete().eq('post_id', postId).eq('user_id', me).eq('reaction_type', 'like');
      nextLiked.delete(postId);
      nextCounts[postId] = Math.max(0, (nextCounts[postId] || 0) - 1);
    } else {
      await client.from('post_reactions').upsert({ post_id: postId, user_id: me, reaction_type: 'like' });
      nextLiked.add(postId);
      nextCounts[postId] = (nextCounts[postId] || 0) + 1;
    }

    setLikedByPost(nextLiked);
    setLikeCounts(nextCounts);
  }

  async function addComment(postId, content, parentId = null) {
    if (!me || !postId || !content.trim()) return null;
    const client = await getSupabaseClient();
    if (!client) return null;

    const payload = {
      post_id: postId,
      user_id: me,
      content: content.trim(),
      parent_id: parentId,
      created_at: new Date().toISOString(),
    };

    const { data, error: insertErr } = await client
      .from('comments')
      .insert(payload)
      .select('id,post_id,content,created_at,updated_at,user_id,parent_id')
      .single();

    const row = insertErr || !data ? { ...payload, id: `local-${Date.now()}` } : data;
    const hydrated = { ...row, profiles: profilesMap[me] || null };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), hydrated],
    }));
    setCommentReactions((prev) => ({ ...prev, [hydrated.id]: { likeCount: 0, userReaction: null } }));
    return hydrated;
  }

  async function editComment(postId, commentId, content) {
    if (!me || !postId || !commentId || !content.trim()) return;
    const client = await getSupabaseClient();
    if (!client) return;

    await client.from('comments').update({ content: content.trim(), updated_at: new Date().toISOString() }).eq('id', commentId).eq('user_id', me);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).map((c) => (c.id === commentId ? { ...c, content: content.trim(), updated_at: new Date().toISOString() } : c)),
    }));
  }

  async function deleteComment(postId, commentId) {
    if (!me || !postId || !commentId) return;
    const client = await getSupabaseClient();
    if (!client) return;

    await client.from('comments').delete().eq('id', commentId).eq('user_id', me);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId && c.parent_id !== commentId),
    }));
  }

  async function toggleCommentReaction(commentId) {
    if (!me || !commentId) return;
    const client = await getSupabaseClient();
    if (!client) return;

    const current = commentReactions[commentId] || { likeCount: 0, userReaction: null };
    if (current.userReaction === 'like') {
      await client.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', me).eq('reaction_type', 'like');
      setCommentReactions((prev) => ({ ...prev, [commentId]: { likeCount: Math.max(0, current.likeCount - 1), userReaction: null } }));
      return;
    }

    await client.from('comment_reactions').upsert({ comment_id: commentId, user_id: me, reaction_type: 'like' });
    setCommentReactions((prev) => ({ ...prev, [commentId]: { likeCount: current.likeCount + 1, userReaction: 'like' } }));
  }

  function notify(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  }

  function openShareComposer(post) {
    setShareComposerPost(post);
    setShareQuote('');
  }

  async function sharePost(post, quoteText = null) {
    if (!me || !post?.id) return;
    const client = await getSupabaseClient();
    if (!client) return;

    const trimmedQuote = String(quoteText || '').trim();
    const existingMyRepost = await client
      .from('posts')
      .select('id,content,description')
      .eq('user_id', me)
      .eq('is_repost', true)
      .eq('original_post_id', post.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingMyRepost?.data?.id) {
      const patch = { content: trimmedQuote, description: trimmedQuote };
      await client.from('posts').update(patch).eq('id', existingMyRepost.data.id).eq('user_id', me);
      await client
        .from('reposts')
        .upsert({ post_id: post.id, user_id: me, quote_text: trimmedQuote || null }, { onConflict: 'post_id,user_id' });
      setFeedPosts((prev) => prev.map((item) => (item.id === existingMyRepost.data.id ? { ...item, ...patch } : item)));
      notify('تم تحديث المشاركة بنجاح');
      return;
    }

    const newPostRes = await client
      .from('posts')
      .insert({ user_id: me, content: trimmedQuote, description: trimmedQuote, media_type: 'none', original_post_id: post.id, is_repost: true })
      .select('id,user_id,content,description,media_type,created_at,group_id,channel_id,original_post_id,is_repost')
      .single();

    await client.from('reposts').upsert({ post_id: post.id, user_id: me, quote_text: trimmedQuote || null }, { onConflict: 'post_id,user_id' });

    if (newPostRes?.data) setFeedPosts((prev) => [{ ...newPostRes.data, profiles: profilesMap[me] || null, post_media: [] }, ...prev]);
    notify('تمت مشاركة المنشور');
  }

  async function deletePost(post) {
    if (!me || !post?.id || post.user_id !== me) return;
    setFeedPosts((prev) => prev.filter((item) => item.id !== post.id));

    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('posts').delete().eq('id', post.id).eq('user_id', me);
    if (error) {
      setFeedPosts((prev) => [post, ...prev]);
      notify('تعذر حذف المنشور حالياً', 'error');
      return;
    }
    notify('تم حذف المنشور');
  }

  function openEditPostModal(post) {
    const currentText = String(post?.content || post?.description || '').trim();
    setEditPostTarget(post);
    setEditPostDraft(currentText);
  }

  async function editPostText(post, nextText) {
    if (!me || !post?.id || post.user_id !== me) return;
    const trimmed = nextText.trim();
    if (!trimmed) {
      notify('نص المنشور لا يمكن أن يكون فارغاً', 'error');
      return;
    }

    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client
      .from('posts')
      .update({ content: trimmed, description: trimmed })
      .eq('id', post.id)
      .eq('user_id', me);

    if (error) {
      notify('تعذر تعديل المنشور حالياً', 'error');
      return;
    }

    setFeedPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, content: trimmed, description: trimmed } : item)));
    notify('تم تعديل المنشور');
  }

  async function copyPostLink(post) {
    if (!post?.id) return;
    const link = `${window.location.origin}${postPermalink(post.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      notify('تم نسخ رابط المنشور');
    } catch {
      notify('تعذر النسخ التلقائي، الرابط جاهز في شريط العنوان', 'error');
    }
  }

  function openPostPage(post) {
    if (!post?.id) return;
    router.push(postPermalink(post.id));
  }

  async function reportPost(post) {
    if (!me || !post?.id) return;
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('reports').insert({ reporter_id: me, target_type: 'post', target_id: post.id, reason: 'reported_from_web' });
    notify('تم إرسال البلاغ');
  }

  async function blockUser(post) {
    if (!me || !post?.user_id || post.user_id === me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('blocks').upsert({ blocker_id: me, blocked_id: post.user_id }, { onConflict: 'blocker_id,blocked_id' });
    await client.from('follows').delete().match({ follower_id: me, following_id: post.user_id });
    await client.from('follows').delete().match({ follower_id: post.user_id, following_id: me });
    setFeedPosts((prev) => prev.filter((item) => item.user_id !== post.user_id));
    notify('تم حظر المستخدم');
  }

  async function votePoll(optionId) {
    if (!me || !optionId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    try {
      await client.rpc('cast_post_poll_vote', { p_option_id: optionId });
      setPollsByPost((prev) => {
        const next = { ...prev };
        for (const [postId, poll] of Object.entries(next)) {
          const options = (poll?.post_poll_options || []).map((opt) => {
            const votes = [...(opt?.post_poll_votes || [])];
            const filtered = votes.filter((v) => String(v?.user_id || '') !== String(me));
            if (String(opt?.id || '') === String(optionId)) filtered.push({ user_id: me });
            return { ...opt, post_poll_votes: filtered };
          });
          let myOptionId = null;
          for (const opt of options) {
            if ((opt?.post_poll_votes || []).some((v) => String(v?.user_id || '') === String(me))) {
              myOptionId = opt.id;
              break;
            }
          }
          next[postId] = { ...poll, post_poll_options: options, myOptionId };
        }
        return next;
      });
    } catch {
      // ignore noisy failures for now
    }
  }

  const centerContent = (
    <div className="space-y-4">
      {active === 'home' ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm" dir="rtl">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setHomeTab('latest')}
              className={[
                'rounded-full px-4 py-2 text-xs font-black transition',
                homeTab === 'latest' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ].join(' ')}
            >
              الأحدث
            </button>
            <button
              type="button"
              onClick={() => setHomeTab('suggested')}
              className={[
                'rounded-full px-4 py-2 text-xs font-black transition',
                homeTab === 'suggested' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ].join(' ')}
            >
              مقترح لك
            </button>
          </div>
          {homeTab === 'suggested' ? (
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              {SUGGESTED_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSuggestedFilter(f.key)}
                  className={[
                    'rounded-full px-3 py-1.5 text-[11px] font-bold transition',
                    suggestedFilter === f.key
                      ? 'border border-sky-400 bg-sky-50 text-sky-700'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {active === 'home' && homeRenderPosts.map((p) => (
        <PostCard
          key={`home-${p.id}`}
          post={p}
          me={me}
          isLiked={likedByPost.has(p.id)}
          likeCount={deriveReactionsCount(likeCounts, p.id)}
          isFollowing={followed.has(p.user_id)}
          comments={commentsByPost[p.id] || []}
          originalPost={p?.original_post_id ? postsById[p.original_post_id] || null : null}
          onToggleLike={() => toggleLike(p.id)}
          onToggleFollow={() => toggleFollow(p.user_id)}
          onOpenComments={() => setCommentModalPost(p)}
          onShare={() => openShareComposer(p)}
          onDeletePost={() => setDeleteTargetPost(p)}
          onEditPost={() => openEditPostModal(p)}
          onCopyLink={() => copyPostLink(p)}
          onReportPost={() => reportPost(p)}
          onBlockUser={() => setBlockTargetPost(p)}
          label="منشور"
          mentionMap={mentionMap}
          poll={pollsByPost[p.id] || null}
          onVotePoll={votePoll}
          onOpenPost={() => openPostPage(p)}
        />
      ))}

      {active === 'reels' && derived.reels.map((p) => (
        <PostCard key={`reel-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={p?.original_post_id ? postsById[p.original_post_id] || null : null} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label="ريلز" mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
      ))}

      {active === 'groups' && derived.groups.map((p) => (
        <PostCard key={`group-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={p?.original_post_id ? postsById[p.original_post_id] || null : null} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label={`مجموعة: ${p?.groups?.name || ''}`} mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
      ))}

      {active === 'channels' && derived.channels.map((p) => (
        <PostCard key={`channel-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={p?.original_post_id ? postsById[p.original_post_id] || null : null} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label={`قناة: ${p?.channels?.name || p?.channels?.username || ''}`} mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
      ))}
      {active === 'explore' && profiles.map((u) => (
        <article key={u.user_id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <h3 className="text-sm font-black text-gray-900">{u.full_name || u.username || 'مستخدم'}</h3>
              <p className="text-xs text-gray-500">@{u.username || 'user'}</p>
            </div>
            <Avatar src={u.avatar_url} alt={u.username || 'user'} />
          </div>
        </article>
      ))}


      {!loading ? (
        <div className="py-3 text-center text-sm text-gray-500">
          {isFetchingMore ? 'جاري تحميل المزيد...' : hasMore ? 'اسحب لأسفل لتحميل المزيد' : 'وصلت لنهاية المحتوى الحالي'}
        </div>
      ) : null}
      <div ref={bottomSentinelRef} className="h-4 w-full" />


      {!loading &&
      ((active === 'home' && homeRenderPosts.length === 0) ||
        (active === 'reels' && derived.reels.length === 0) ||
        (active === 'groups' && derived.groups.length === 0) ||
        (active === 'channels' && derived.channels.length === 0) ||
        (active === 'explore' && profiles.length === 0)) ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">لا توجد بيانات حالياً في هذا القسم.</div>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 pb-10 pt-6 sm:px-5 lg:px-8 text-right [unicode-bidi:plaintext]" dir="rtl">
      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
        <h1 className="text-right text-2xl font-black text-gray-900">واجهة دريدود</h1>
        <div className="mt-2 rounded-xl border border-amber-300 bg-amber-100/70 px-3 py-2 text-xs font-semibold text-amber-900" dir="rtl">
          <p className="text-right leading-6 [unicode-bidi:plaintext]">
            <span aria-hidden="true" className="ml-2 inline-block align-middle text-sm">⚠️</span>
            <span className="align-middle">تنبيه مهم: موقع دريدود قيد التطوير والتحسين حالياً، وما زلنا نعمل على إكمال الإصلاحات وتقديم تجربة أسرع وأفضل. شكراً لصبركم ودعمكم، القادم أجمل بإذن الله.</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" dir="rtl">
        <aside className="order-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:order-1 lg:col-span-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h2 className="mb-3 text-right text-sm font-black text-gray-900">الأقسام</h2>
          <div className="space-y-2">
            {SECTION_LABELS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={[
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition',
                  active === s.key ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-2">
                  <SectionIcon section={s.key} />
                  <span>{s.label}</span>
                </span>
                <span>•</span>
              </button>
            ))}          </div>
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-2 text-right [unicode-bidi:isolate-override]" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override', textAlign: 'right' }}>
            <h3 className="px-2 pb-2 text-right text-sm font-black text-gray-900">المعلومات والدعم</h3>
            <details className="group rounded-xl bg-white [unicode-bidi:isolate-override]" open>
              <summary className="flex flex-row-reverse cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 hover:bg-gray-50 [unicode-bidi:isolate-override]">
                <ChevronLeftIcon />
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><span className="text-black"><PolicyIcon /></span><span>السياسات</span></span>
              </summary>
              <div className="space-y-1 px-2 pb-2 [unicode-bidi:isolate-override]">
                <Link href="/privacy" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><ShieldIcon /></span><span>سياسة الخصوصية</span></span></Link>
                <Link href="/terms" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><PolicyIcon /></span><span>الشروط والأحكام</span></span></Link>
                <Link href="/about" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><UserIcon /></span><span>من نحن</span></span></Link>
                <Link href="/dmca" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><BadgeIcon /></span><span>حقوق DMCA</span></span></Link>
                <Link href="/agreements" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><AccountsIcon /></span><span>الاتفاقيات</span></span></Link>
                <Link href="/security" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><ShieldIcon /></span><span>أمان البيانات</span></span></Link>
              </div>
            </details>
            <details className="group mt-2 rounded-xl bg-white [unicode-bidi:isolate-override]" open>
              <summary className="flex flex-row-reverse cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 hover:bg-gray-50 [unicode-bidi:isolate-override]">
                <ChevronLeftIcon />
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900"><span className="text-black"><SupportIcon /></span><span>التواصل والدعم</span></span>
              </summary>
              <div className="space-y-1 px-2 pb-2 [unicode-bidi:isolate-override]">
                <Link href="/contact" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><SupportIcon /></span><span>اتصل بنا</span></span></Link>
                <Link href="/faq" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><LanguageIcon /></span><span>الأسئلة الشائعة</span></span></Link>
                <Link href="/complaints" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><BellIcon /></span><span>شكاوى وبلاغات</span></span></Link>
                <Link href="/deletion" className="flex flex-row-reverse items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 [unicode-bidi:isolate-override]"><ChevronLeftIcon /><span className="flex items-center gap-2"><span className="text-black"><HiddenIcon /></span><span>طلب حذف الحساب والبيانات</span></span></Link>
              </div>
            </details>
          </div>
        </aside>

        <section className="order-1 lg:col-span-6"> 
          <CreatePostEntry />
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">جاري تحميل المحتوى...</div>
          ) : error ? (
            <div className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-8 text-center shadow-[0_18px_45px_-28px_rgba(190,24,93,0.45)]">
              <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-rose-200/40 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />
              <div className="relative">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
                  <span className="text-xl" aria-hidden="true">🔒</span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">يلزم تسجيل الدخول</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-gray-600">{error}</p>
                {authRequired ? (
                  <Link
                    href="/account"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-6 py-2.5 text-sm font-black text-white shadow-[0_10px_22px_-14px_rgba(190,24,93,0.9)] transition hover:scale-[1.02] hover:from-rose-800 hover:to-rose-700"
                  >
                    <span>تسجيل الدخول لعرض المحتوى</span>
                    <span aria-hidden="true">←</span>
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            centerContent
          )}
        </section>

        <aside className="order-2 lg:col-span-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <SettingsSidebar />
        </aside>
      </div>

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
          onToggleReaction={toggleCommentReaction}
        />
      ) : null}

      {shareComposerPost ? (
        <ShareComposerModal
          post={shareComposerPost}
          quote={shareQuote}
            onChangeQuote={setShareQuote}
          onClose={() => { setShareComposerPost(null); setShareQuote(''); }}
          onShareNow={async () => { await sharePost(shareComposerPost, ''); setShareComposerPost(null); setShareQuote(''); }}
          onShareWithQuote={async () => { await sharePost(shareComposerPost, shareQuote); setShareComposerPost(null); setShareQuote(''); }}
        />
      ) : null}

      {deleteTargetPost ? (
        <ConfirmModal
          title="حذف المنشور"
          message="هل تريد حذف هذا المنشور نهائياً؟"
          confirmText="حذف"
          onCancel={() => setDeleteTargetPost(null)}
          onConfirm={async () => { const target = deleteTargetPost; setDeleteTargetPost(null); await deletePost(target); }}
        />
      ) : null}

      {blockTargetPost ? (
        <ConfirmModal
          title="حظر المستخدم"
          message={`هل تريد حظر ${blockTargetPost?.profiles?.full_name || blockTargetPost?.profiles?.username || 'هذا المستخدم'}؟`}
          confirmText="حظر"
          onCancel={() => setBlockTargetPost(null)}
          onConfirm={async () => { const target = blockTargetPost; setBlockTargetPost(null); await blockUser(target); }}
        />
      ) : null}

      {editPostTarget ? (
        <EditPostModal
          text={editPostDraft}
          onChangeText={setEditPostDraft}
          onCancel={() => { setEditPostTarget(null); setEditPostDraft(''); }}
          onSave={async () => {
            const target = editPostTarget;
            await editPostText(target, editPostDraft);
            setEditPostTarget(null);
            setEditPostDraft('');
          }}
        />
      ) : null}

      {toast ? <ToastBanner message={toast.message} type={toast.type} /> : null}
    </div>
  );
}

function CreatePostEntry() {
  const router = useRouter();

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3" dir="ltr">
        <div className="flex items-center gap-3 text-red-700">
          <button type="button" onClick={() => router.push('/create-post?tool=sticker')} className="rounded-full p-1 hover:bg-gray-100" aria-label="ملصقات">
            <EntryEmojiIcon />
          </button>
          <button type="button" onClick={() => router.push('/create-post?tool=video')} className="rounded-full p-1 hover:bg-gray-100" aria-label="فيديو">
            <EntryVideoIcon />
          </button>
          <button type="button" onClick={() => router.push('/create-post?tool=image')} className="rounded-full p-1 hover:bg-gray-100" aria-label="صورة">
            <EntryImageIcon />
          </button>
        </div>
        <button type="button" onClick={() => router.push('/create-post')} className="flex items-center gap-2 text-gray-600" dir="rtl">
          <span className="text-lg font-bold">شارك لحظتك...</span>
          <EntryPencilIcon />
        </button>
      </div>
    </div>
  );
}

function PostCard({
  post,
  label,
  me,
  isLiked,
  likeCount,
  isFollowing,
  comments,
  originalPost,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onShare,
  onDeletePost,
  onEditPost,
  onCopyLink,
  onReportPost,
  onBlockUser,
  mentionMap,
  poll,
  onVotePoll,
  onOpenPost,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);
  const media = mediaFromPost(post);
  const first = media[0];
  const isOwner = post?.user_id === me;
  const isTextOnly = !first && String(post?.content || post?.description || '').trim().length > 0;


  const authorName = post?.profiles?.full_name || post?.profiles?.username || 'مستخدم';
  const username = post?.profiles?.username || post?.user_id?.slice(0, 8) || 'user';
  const profileHandle = normalizeHandle(username) || (post?.user_id || 'user');
  const isVerified = !!post?.profiles?.is_verified || !!post?.channels?.is_verified;

  function parseBackgroundStyle(value) {
    if (!value) return null;
    const bg = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return null; } })() : value;
    if (!bg || !Array.isArray(bg.colors) || !bg.colors.length) return null;
    const colors = bg.colors.filter(Boolean);
    if (!colors.length) return null;
    return {
      type: bg.type === 'gradient' ? 'gradient' : 'solid',
      colors,
      textColor: bg.textColor || '#111827',
      id: bg.id || null,
    };
  }

  function textContainerStyle(bg) {
    if (!bg || bg.id === 'none') return null;
    if (bg.type === 'gradient' && bg.colors.length > 1) {
      return {
        backgroundImage: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`,
        color: bg.textColor,
      };
    }
    return {
      backgroundColor: bg.colors[0],
      color: bg.textColor,
    };
  }

  const bgStyle = parseBackgroundStyle(post?.background_style);

  function handleCardOpen(event) {
    const interactive = event?.target?.closest?.('button,a,input,textarea,select,label,summary,[data-no-open-post]');
    if (interactive) return;
    onOpenPost?.();
  }

  function openFromSurface(event) {
    event?.stopPropagation?.();
    onOpenPost?.();
  }

  return (
    <article id={`post-${post.id}`} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" dir="rtl" onClick={handleCardOpen}>
      <div className="mb-4 flex items-start justify-between gap-4" dir="rtl">
        <div className="flex min-w-0 items-start gap-3 text-right">
          <Avatar src={post?.profiles?.avatar_url || post?.channels?.avatar_url || post?.groups?.avatar_url} alt={username} />
          <div className="min-w-0 pt-1 text-right">
            <div className="flex items-center justify-start gap-1.5">
              <Link href={`/${profileHandle}`} className="truncate text-lg font-black leading-tight text-gray-950 hover:underline">{authorName}</Link>
              {isVerified ? <VerifiedBadge /> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-start gap-1 text-sm text-gray-500">
              <Link href={`/${profileHandle}`} className="font-medium italic text-gray-500 hover:text-red-700 hover:underline">@{normalizeHandle(username) || username}</Link>
              <span>•</span>
              <span>{formatAgo(post.created_at)}</span>
              {label ? <span className="sr-only">{label}</span> : null}
            </div>
          </div>
        </div>

        <div className="relative flex shrink-0 items-start gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
            aria-label="خيارات المنشور"
          >
            <MoreIcon />
          </button>
                    {menuOpen ? (
            <div className="absolute left-0 top-10 z-20 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 text-right text-sm font-bold shadow-xl">
              {isOwner ? (
                <>
                  {isTextOnly ? (
                    <button type="button" onClick={() => { setMenuOpen(false); onEditPost(); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">تعديل المنشور</button>
                  ) : null}
                  <button type="button" onClick={() => { setMenuOpen(false); onCopyLink(); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">نسخ رابط المنشور</button>
                  <button type="button" onClick={() => { setMenuOpen(false); onDeletePost(); }} className="block w-full px-4 py-2 text-red-700 hover:bg-red-50">حذف المنشور</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => { setMenuOpen(false); onCopyLink(); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">نسخ رابط المنشور</button>
                  <button type="button" onClick={() => { setMenuOpen(false); onReportPost(); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">الإبلاغ عن المنشور</button>
                  <button type="button" onClick={() => { setMenuOpen(false); onBlockUser(); }} className="block w-full px-4 py-2 text-red-700 hover:bg-red-50">حظر المستخدم</button>
                </>
              )}
            </div>
           ) : null}

          {me && post?.user_id && post.user_id !== me ? (
            <button
              type="button"
              onClick={onToggleFollow}
              className={[
                'shrink-0 rounded-full px-4 py-2 text-xs font-black transition',
                isFollowing ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-red-700 text-white hover:bg-red-800',
              ].join(' ')}
            >
              {isFollowing ? 'متابع' : 'متابعة'}
            </button>
          ) : null}
        </div>
      </div>

      {post?.is_ai_generated || post?.ai_generated ? (
        <div className="mb-4 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-gray-900">
            <span>محتوى منشأ بالذكاء الاصطناعي</span>
            <span className="text-red-700">▣</span>
          </div>
        </div>
      ) : null}
      {post?.is_sensitive ? (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={() => setRevealSensitive((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-800">
            <span>{revealSensitive ? 'إخفاء الوسائط الحساسة' : 'عرض الوسائط الحساسة'}</span>
            <span>⚠</span>
          </button>
        </div>
      ) : null}

      {post?.is_repost && originalPost ? (
        <div className="space-y-3">
          <div className="text-right text-sm font-semibold text-gray-700">أعاد {authorName} نشر هذا</div>
          {String(post?.content || post?.description || '').trim() ? (
            <div className="rounded-2xl p-3" style={textContainerStyle(bgStyle) || undefined} onClick={openFromSurface}>
              <PostText text={post.content || post.description} mentionMap={mentionMap} />
            </div>
          ) : null}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-right">
                <div className="text-base font-black text-gray-950">{originalPost?.profiles?.full_name || originalPost?.profiles?.username || 'مستخدم'}</div>
                <div className="text-sm text-gray-500">@{normalizeHandle(originalPost?.profiles?.username || 'user')}</div>
              </div>
              <Avatar src={originalPost?.profiles?.avatar_url || originalPost?.channels?.avatar_url || originalPost?.groups?.avatar_url} alt={originalPost?.profiles?.username || 'user'} />
            </div>
            <PostText text={originalPost?.content || originalPost?.description || 'منشور بدون نص'} mentionMap={mentionMap} />
            {mediaFromPost(originalPost)[0] ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-black" onClick={openFromSurface}>
                {mediaFromPost(originalPost)[0].type === 'video' ? (
                  <video src={mediaFromPost(originalPost)[0].full || mediaFromPost(originalPost)[0].url} controls className="h-72 w-full object-contain" preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaFromPost(originalPost)[0].url} alt="original-post" className="h-72 w-full object-cover" />
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="w-full rounded-2xl p-3 text-right transition hover:opacity-95" style={textContainerStyle(bgStyle) || undefined} onClick={openFromSurface}>
          <PostText text={post.content || post.description || 'منشور بدون نص'} mentionMap={mentionMap} />
        </div>
      )}

      {first ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-black" onClick={openFromSurface}>
          {post?.is_sensitive && !revealSensitive ? (
            <div className="flex h-72 w-full items-center justify-center bg-gray-900 text-center text-sm font-black text-white/90">
              <div>
                <p>محتوى حساس</p>
                <p className="mt-1 text-xs text-white/70">اضغط زر عرض الوسائط الحساسة</p>
              </div>
            </div>
          ) : first.type === 'video' ? (
            <video src={first.full || first.url} controls className="h-72 w-full object-contain" preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={first.url} alt="post" className="h-72 w-full object-cover" />
          )}
        </div>
      ) : null}

      {poll ? <PostPollWidget poll={poll} onVote={onVotePoll} /> : null}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-gray-600">

        <span>{likeCount} إعجاب</span>
        <button type="button" onClick={post?.allow_comments === false ? undefined : onOpenComments} className={post?.allow_comments === false ? 'opacity-50' : 'hover:text-red-700 hover:underline'}>{comments.length} تعليق</button>
      </div>

      <div className="mt-3 flex items-center gap-2 border-y border-gray-100 py-2">
        <button
          type="button"
          onClick={onToggleLike}
          className={[
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition',
            isLiked ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-900 hover:bg-gray-100',
          ].join(' ')}
        >
          <LikeIcon filled={isLiked} className={isLiked ? 'text-red-700' : 'text-black'} />
          <span>إعجاب</span>
        </button>
        <button
          type="button"
          onClick={post?.allow_comments === false ? undefined : onOpenComments}
          className={['flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold', post?.allow_comments === false ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'].join(' ')}
        >
          <CommentIcon className="text-black" />
          <span>{post?.allow_comments === false ? 'التعليقات مغلقة' : 'تعليق'}</span>
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-50 py-2 text-xs font-bold text-gray-900 hover:bg-gray-100"
        >
          <ShareIcon className="text-black" />
          <span>مشاركة</span>
        </button>
      </div>

    </article>
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
    const profileHandle = normalizeHandle(username) || comment?.user_id || 'user';
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
              <Link href={`/${profileHandle}`} className="block">
                <Avatar src={comment?.profiles?.avatar_url} alt={username} />
              </Link>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/${profileHandle}`} className="text-[15px] font-black leading-6 text-gray-950 hover:underline sm:text-base">{authorName}</Link>
                <Link href={`/${profileHandle}`} className="text-xs font-semibold text-gray-500 hover:text-red-700 hover:underline">@{normalizeHandle(username) || username}</Link>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{formatAgo(comment.created_at)}</span>
              </div>
              {editingId === comment.id ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => saveEdit(comment.id)} className="rounded-lg bg-red-700 px-3 py-1 text-xs font-black text-white">حفظ</button>
                  <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-right text-sm outline-none" />
                </div>
              ) : <ExpandableCommentText text={comment.content} />}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-gray-600 sm:gap-2">
                <button type="button" onClick={() => onToggleReaction(comment.id)} className={[
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition',
                  summary.userReaction === 'like' ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700',
                ].join(' ')}>
                  <LikeIcon filled={summary.userReaction === 'like'} className={summary.userReaction === 'like' ? 'text-red-700' : 'text-gray-600'} />
                  <span>إعجاب {summary.likeCount ? summary.likeCount : ''}</span>
                </button>
                <button type="button" onClick={() => setReplyTo(comment)} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-blue-200 hover:text-blue-700">
                  <ReplyIcon className="text-blue-700" />
                  <span>رد</span>
                </button>
                {canManage ? <button type="button" onClick={() => { setEditingId(comment.id); setEditingText(comment.content || ''); }} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-amber-200 hover:text-amber-700"><EditIcon className="text-amber-700" /><span>تعديل</span></button> : null}
                {canManage ? <button type="button" onClick={() => onDeleteComment(comment.id)} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-red-200 hover:text-red-700"><DeleteIcon className="text-red-700" /><span>حذف</span></button> : null}
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
          {(byParent.root || []).length ? (byParent.root || []).map((comment) => renderComment(comment, 0)) : <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد تعليقات بعد. كن أول من يعلق.</div>}
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

function Avatar({ src, alt }) {
  return (
    <div className="h-11 w-11 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || 'user'} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200" title="حساب موثق">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 12 4 4 8-8" />
      </svg>
    </span>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function LikeIcon({ filled = false, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" />
      <path d="M7 11 11 3a2.2 2.2 0 0 1 4.1 1.55L14 10h5.1a2 2 0 0 1 1.95 2.45l-1.6 7A2 2 0 0 1 17.5 21H7V11Z" />
    </svg>
  );
}

function CommentIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-6.5A8.5 8.5 0 1 1 21 12Z" />
    </svg>
  );
}

function ShareIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V3" />
      <path d="m7 8 5-5 5 5" />
    </svg>
  );
}


function ReplyIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 17-5-5 5-5" />
      <path d="M20 17v-2a7 7 0 0 0-7-7H4" />
    </svg>
  );
}

function EditIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function DeleteIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function SettingsSidebar() {
  const sections = [
    {
      title: 'الإعدادات والحساب',
      items: [
        { label: 'إعدادات الحساب', icon: <UserIcon />, href: '/account/me' },
        { label: 'لوحة الأمان', icon: <ShieldAlertIcon />, href: '/security' },
        { label: 'إدارة طلبات التوثيق', icon: <BadgeIcon />, href: '/account/me' },
        { label: 'مظهر التطبيق', icon: <ThemeIcon />, href: '/features' },
        { label: 'إعدادات الإشعارات', icon: <BellIcon />, href: '/account/me' },
        { label: 'توثيق الحساب', icon: <VerifyIcon />, href: '/account/me' },
        { label: 'اللغات', icon: <LanguageIcon />, href: '/account/me' },
        { label: 'الحسابات', icon: <AccountsIcon />, href: '/account/me' },
      ],
    },
    {
      title: 'الأمان والحماية',
      items: [
        { label: 'خصوصية الحساب', icon: <LockIcon />, href: '/privacy', sub: 'عام' },
        { label: 'النشاط والحالة', icon: <ActivityIcon />, href: '/account/me' },
        { label: 'إدارة الحساب', icon: <AccountsIcon />, href: '/account/me' },
        { label: 'الأمان وتسجيل الدخول', icon: <ShieldIcon />, href: '/security' },
      ],
    },
    {
      title: 'أدوات المحتوى',
      items: [
        { label: 'الوسوم و @الذكر', icon: <AtIcon />, href: '/interface' },
        { label: 'التحكم بالفيديوهات', icon: <VideoSettingsIcon />, href: '/interface', sub: 'التشغيل التلقائي، كتم الصوت' },
        { label: 'إعدادات الترجمة', icon: <LanguageIcon />, href: '/interface', sub: 'الكشف التلقائي وإظهار الزر' },
        { label: 'أكاديمية المبدعين', icon: <AcademyIcon />, href: '/features' },
      ],
    },
    {
      title: 'الحظر',
      items: [
        { label: 'الحسابات المحظورة', icon: <BanIcon />, href: '/account/me' },
        { label: 'المنشورات المخفية', icon: <HiddenIcon />, href: '/account/me' },
      ],
    },
    {
      title: 'محفوظاتك',
      items: [{ label: 'العناصر المحفوظة', icon: <BookmarkIcon />, href: '/account/me', sub: 'المنشورات، الريلز' }],
    },
    {
      title: 'السجل',
      items: [{ label: 'سجل المشاهدات', icon: <HistoryIcon />, href: '/account/me', sub: 'آخر الفيديوهات التي شاهدتها' }],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 text-right shadow-sm [unicode-bidi:isolate-override]" dir="rtl">
      <h2 className="px-2 pb-2 text-right text-xl font-black text-gray-950">الإعدادات</h2>
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-gray-100 bg-gray-50/50 p-2">
            <h3 className="px-2 pb-2 text-right text-sm font-black text-gray-900">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-right hover:bg-gray-50 [unicode-bidi:isolate-override]" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
                  <ChevronLeftIcon />
                  <span className="flex flex-1 items-center gap-2 text-right [unicode-bidi:isolate-override]" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
                    <span className="text-black">{item.icon}</span>
                    <span className="text-right [unicode-bidi:isolate-override]" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
                      <span className="block text-right text-sm font-bold text-gray-900">{item.label}</span>
                      {item.sub ? <span className="block text-right text-xs text-gray-500">{item.sub}</span> : null}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostPollWidget({ poll, onVote }) {
  const options = [...(poll?.post_poll_options || [])].sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
  const totalVotes = options.reduce((sum, opt) => sum + ((opt?.post_poll_votes || []).length || 0), 0);
  const isExpired = !!poll?.isExpired;

  return (
    <div className="mt-3 rounded-2xl border border-[#F0D1D5] bg-[#FFF6F7] p-3" dir="rtl">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[#D62839]">▣</span>
        <p className="text-lg font-black text-gray-900">{poll?.question || 'استطلاع'}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt) => {
          const votes = (opt?.post_poll_votes || []).length || 0;
          const pct = totalVotes === 0 ? 0 : (votes / totalVotes) * 100;
          const mine = String(poll?.myOptionId || '') === String(opt?.id || '');
          return (
            <button
              key={opt?.id}
              type="button"
              onClick={isExpired ? undefined : () => onVote?.(opt?.id)}
              className={['relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-white px-3 py-2 text-right', mine ? 'border-[#2D6A4F] ring-1 ring-[#2D6A4F]' : 'border-gray-200'].join(' ')}
            >
              <div
                className="absolute inset-y-2 right-2 rounded-lg"
                style={{
                  width: `${Math.max(0, Math.min(100, pct))}%`,
                  background: mine ? '#B7E4C7' : '#F3E5E7',
                }}
              />
              <span className={['relative z-10 text-xl', mine ? 'text-[#2D6A4F]' : 'text-gray-500'].join(' ')}>{mine ? '◉' : '◯'}</span>
              <span className={['relative z-10 flex-1 truncate text-lg font-black', mine ? 'text-[#2D6A4F]' : 'text-gray-900'].join(' ')}>{opt?.option_text || ''}</span>
              <span className={['relative z-10 text-sm font-black', mine ? 'text-[#2D6A4F]' : 'text-gray-700'].join(' ')}>{`${Math.round(pct)}% · ${votes}`}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm font-bold text-gray-600">
        <span>{`إجمالي الأصوات: ${totalVotes}`}</span>
        {!poll?.myOptionId && !isExpired ? <span>اضغط للتصويت</span> : null}
      </div>
    </div>
  );
}

function EntryPencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m3 21 3.75-.75L19 8l-3-3L3.75 17.25z" />
      <path d="m14 5 3 3" />
    </svg>
  );
}

function EntryImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-6 6-3-3-4 4" />
    </svg>
  );
}

function EntryVideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3z" />
    </svg>
  );
}

function EntryEmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function SectionIcon({ section }) {
  const common = 'h-4 w-4 text-black';
  if (section === 'home') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  }
  if (section === 'reels') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m9 9 6 3-6 3Z" />
      </svg>
    );
  }
  if (section === 'groups') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
        <path d="M14 19c.2-1.8 1.8-3.2 4-3.2 1.3 0 2.4.4 3 1.2" />
      </svg>
    );
  }
  if (section === 'channels') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ToastBanner({ message, type = 'success' }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl border px-4 py-2 text-sm font-bold shadow-lg"
      style={{ background: type === 'error' ? '#fef2f2' : '#f0fdf4', borderColor: type === 'error' ? '#fecaca' : '#bbf7d0', color: type === 'error' ? '#b91c1c' : '#166534' }}>
      {message}
    </div>
  );
}

function ChevronLeftIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>; }
function UserIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.7-3.3 4.4-5 8-5s6.3 1.7 8 5" /></svg>; }
function ShieldAlertIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 5 6v6c0 5 3.5 8.5 7 9 3.5-.5 7-4 7-9V6l-7-3Z" /><circle cx="12" cy="12" r="1" /><path d="M12 8v2" /></svg>; }
function BadgeIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 2 2.2 2.2 3.1-.6.6 3.1L20 9l-2.2 2.2.6 3.1-3.1.6L13 17l-2.2-2.2-3.1.6-.6-3.1L4 10l2.2-2.2-.6-3.1 3.1-.6Z" /></svg>; }
function ThemeIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18" /></svg>; }
function BellIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 10a6 6 0 1 1 12 0v5l2 2H4l2-2z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>; }
function VerifyIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>; }
function LanguageIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h12M10 3c0 6-2 11-6 14M8 11c1.5 2 3.5 4 6 6M14 13h6M17 10l-3 10M20 10l3 10" /></svg>; }
function AccountsIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path d="M3 19c1.3-2.5 3.3-4 6-4" /><circle cx="17" cy="10" r="2.5" /><path d="M14 19c.8-1.8 2.3-2.8 4.5-2.8" /></svg>; }
function LockIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></svg>; }
function ActivityIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 5 6v6c0 5 3.5 8.5 7 9 3.5-.5 7-4 7-9V6l-7-3Z" /></svg>; }
function AtIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 1 1-2.5 4.9V13a2 2 0 1 0 4 0V8" /></svg>; }
function VideoSettingsIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3z" /><circle cx="8" cy="12" r="1.5" /></svg>; }
function AcademyIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4" /></svg>; }
function BanIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="m7 17 10-10" /></svg>; }
function HiddenIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" /><path d="m4 4 16 16" /></svg>; }
function BookmarkIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>; }
function HistoryIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>; }
function PolicyIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 5 6v6c0 5 3.5 8.5 7 9 3.5-.5 7-4 7-9V6l-7-3Z" /><path d="M9 12h6" /></svg>; }
function SupportIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12a8 8 0 1 1 16 0" /><path d="M4 12v5a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2Zm16 0v5a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2Z" /><path d="M12 19v2" /></svg>; }

function ConfirmModal({ title, message, confirmText, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-right text-lg font-black text-gray-950">{title}</h3>
        <p className="mt-2 text-right text-sm text-gray-700">{message}</p>
        <div className="mt-4 flex justify-start gap-2">
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800">{confirmText}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-200">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function EditPostModal({ text, onChangeText, onCancel, onSave }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-right text-lg font-black text-gray-950">تعديل المنشور</h3>
        <textarea value={text} onChange={(e) => onChangeText(e.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-right text-sm outline-none focus:border-red-300" />
        <div className="mt-4 flex justify-start gap-2">
          <button type="button" onClick={onSave} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800">حفظ</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-200">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ShareComposerModal({ post, quote, onChangeQuote, onClose, onShareNow, onShareWithQuote }) {
  const authorName = post?.profiles?.full_name || post?.profiles?.username || 'مستخدم';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-right text-lg font-black text-gray-950">مشاركة المنشور</h3>
        <p className="mt-1 text-right text-xs text-gray-500">منشور {authorName}</p>
        <textarea value={quote} onChange={(e) => onChangeQuote(e.target.value)} rows={4} placeholder="أضف تعليقًا (اختياري)..." className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-right text-sm outline-none focus:border-red-300" />
        <div className="mt-4 flex justify-start gap-2">
          <button type="button" onClick={onShareWithQuote} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800">نشر المشاركة</button>
          <button type="button" onClick={onShareNow} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-200">مشاركة فورية</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-white px-4 py-2 text-sm font-black text-gray-500 hover:bg-gray-50">إغلاق</button>
        </div>
      </div>
    </div>
  );
}































