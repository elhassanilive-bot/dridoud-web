'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const SECTION_LABELS = [
  { key: 'home', label: 'الرئيسية' },
  { key: 'reels', label: 'الريلز' },
  { key: 'groups', label: 'المجموعات' },
  { key: 'channels', label: 'القنوات' },
  { key: 'explore', label: 'استكشاف' },
  { key: 'chat', label: 'الدردشة' },
  { key: 'notifications', label: 'الإشعارات' },
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

function isAudioUrl(url = '') {
  const l = String(url).toLowerCase();
  return l.endsWith('.mp3') || l.endsWith('.wav') || l.endsWith('.ogg') || l.endsWith('.aac') || l.endsWith('.m4a');
}

function detectMediaKind(url = '', explicit = '') {
  const raw = String(explicit || '').toLowerCase();
  if (raw.includes('video') || isVideoUrl(url)) return 'video';
  if (raw.includes('audio') || isAudioUrl(url)) return 'audio';
  if (raw.includes('document') || raw.includes('file') || raw.includes('pdf')) return 'document';
  return 'image';
}

async function fetchChatUnreadCount(client, userId) {
  if (!client || !userId) return 0;
  try {
    const participantsRes = await client
      .from('chat_participants')
      .select('chat_id,last_read_at,archived_at')
      .eq('user_id', userId)
      .is('archived_at', null);
    const ownRows = participantsRes?.data || [];
    const chatIds = [...new Set(ownRows.map((row) => row.chat_id).filter(Boolean))];
    if (!chatIds.length) return 0;

    const readMap = {};
    for (const row of ownRows) readMap[row.chat_id] = row.last_read_at ? new Date(row.last_read_at).getTime() : 0;

    const messagesRes = await client
      .from('messages')
      .select('chat_id,sender_id,created_at')
      .in('chat_id', chatIds)
      .neq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);

    return (messagesRes?.data || []).reduce((sum, msg) => {
      const created = msg.created_at ? new Date(msg.created_at).getTime() : 0;
      return sum + (created > (readMap[msg.chat_id] || 0) ? 1 : 0);
    }, 0);
  } catch {
    return 0;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mediaFromPost(post) {
  const pm = asArray(post?.post_media);
  if (pm.length) {
    return pm.map((m) => ({
      url: m.thumbnail_url || m.thumbnailUrl || m.media_url || m.mediaUrl || m.url,
      full: m.media_url || m.mediaUrl || m.url || m.thumbnail_url || m.thumbnailUrl,
      caption: m.caption || m.image_caption || '',
      type: detectMediaKind(m.media_url || m.mediaUrl || m.url || '', m.media_type || m.mediaType || ''),
    })).filter((m) => m.full || m.url);
  }

  const fallbackUrls = Array.isArray(post?.media_urls)
    ? post.media_urls
    : Array.isArray(post?.mediaUrls)
      ? post.mediaUrls
      : [];
  const fallbackMedia = fallbackUrls
    .map((url) => String(url || '').trim())
    .filter(Boolean)
    .map((url) => ({
      url: isVideoUrl(url) ? (post?.thumbnail_url || post?.thumbnailUrl || url) : url,
      full: url,
      caption: '',
      type: detectMediaKind(url, post?.media_type || post?.mediaType || ''),
    }));

  const directUrl = post?.media_url || post?.mediaUrl || post?.video_url || post?.videoUrl || post?.image_url || post?.imageUrl;
  if (directUrl) {
    fallbackMedia.push({
      url: isVideoUrl(directUrl) ? (post?.thumbnail_url || post?.thumbnailUrl || directUrl) : directUrl,
      full: directUrl,
      caption: '',
      type: detectMediaKind(directUrl, post?.media_type || post?.mediaType || ''),
    });
  }

  return fallbackMedia;
}

function extractMemberCount(raw) {
  if (typeof raw === 'number') return raw;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first?.count === 'number') return first.count;
    return raw.length;
  }
  if (typeof raw?.count === 'number') return raw.count;
  return 0;
}

function extractFollowerCount(raw) {
  return extractMemberCount(raw);
}

function groupCategoryLabel(value) {
  const labels = {
    technology: 'تقنية',
    programming: 'برمجة',
    sports: 'رياضة',
    medicine: 'طب',
    education: 'تعليم',
    business: 'أعمال',
    entertainment: 'ترفيه',
    other: 'أخرى',
  };
  return labels[String(value || '').toLowerCase()] || 'مجموعة عامة';
}

function channelCategoryLabel(value) {
  const labels = {
    general: 'عام',
    technology: 'تقنية',
    programming: 'برمجة',
    sports: 'رياضة',
    medicine: 'طب',
    education: 'تعليم',
    business: 'أعمال',
    entertainment: 'ترفيه',
    news: 'أخبار',
    brand: 'علامة تجارية',
    creator: 'منشئ محتوى',
    other: 'أخرى',
  };
  return labels[String(value || '').toLowerCase()] || 'قناة عامة';
}

async function uploadInterfaceImage(file, folder = 'interface') {
  if (!file) return '';
  const client = await getSupabaseClient();
  if (!client) throw new Error('supabase_not_configured');
  const safeName = String(file.name || 'image')
    .replace(/[^\w.\-]+/g, '_')
    .slice(-80);
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
  const { error } = await client.storage
    .from('post-media')
    .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  const { data } = client.storage.from('post-media').getPublicUrl(path);
  return data?.publicUrl || '';
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

function normalizeArticleType(value = '') {
  const raw = String(value || '').toLowerCase().replace(/[_\s-]+/g, '');
  if (['h1', 'heading', 'title', 'mainheading', 'mainheader'].includes(raw)) return 'heading';
  if (['h2', 'subheading', 'subtitle', 'subheader'].includes(raw)) return 'subheading';
  if (['quote', 'blockquote'].includes(raw)) return 'quote';
  if (['divider', 'separator', 'line', 'hr'].includes(raw)) return 'divider';
  if (['image', 'articleimage', 'photo'].includes(raw)) return 'image';
  if (['video', 'articlevideo'].includes(raw)) return 'video';
  if (['audio', 'voice', 'sound'].includes(raw)) return 'audio';
  if (['document', 'file', 'pdf'].includes(raw)) return 'document';
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

function extractJsonArticleBlocks(payload, mediaQueue = []) {
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
      if (type === 'image' || type === 'video' || type === 'audio' || type === 'document') {
        const queued = mediaQueue.shift();
        const url =
          block?.url ||
          block?.media_url ||
          block?.mediaUrl ||
          block?.image_url ||
          block?.imageUrl ||
          block?.video_url ||
          block?.videoUrl ||
          block?.audio_url ||
          block?.audioUrl ||
          block?.document_url ||
          block?.documentUrl ||
          block?.file_url ||
          block?.fileUrl ||
          queued?.full ||
          queued?.url;
        if (!url) return text ? { type: 'paragraph', text } : null;
        return {
          type,
          url,
          thumbnail: block?.thumbnail_url || block?.thumbnailUrl || queued?.url || url,
          caption: block?.caption || block?.image_caption || block?.imageCaption || queued?.caption || '',
          numbered: block?.numbered === true,
        };
      }
      return text ? { type, text, numbered: block?.numbered === true } : null;
    })
    .filter(Boolean);
}

function extractTokenArticleBlocks(text, mediaQueue = []) {
  const source = String(text || '');
  const rx = /\[\[media:(image|video|audio|document):([^\]]+)\]\]/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = rx.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index).trim();
    if (before) blocks.push(...plainTextArticleBlocks(before));
    blocks.push({ type: match[1], url: match[2], thumbnail: match[2], caption: '' });
    const matchedMediaIndex = mediaQueue.findIndex((m) => m.full === match[2] || m.url === match[2]);
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

  const mediaQueue = mediaFromPost(post).slice();
  const rawText = String(post?.content || post?.description || '').trim();
  const json = safeJsonParse(rawText);
  const blocks = json
    ? extractJsonArticleBlocks(json, mediaQueue)
    : extractTokenArticleBlocks(rawText, mediaQueue);

  if (!blocks.length && rawText) blocks.push(...plainTextArticleBlocks(rawText));
  blocks.push(...mediaQueue.map((m) => ({ type: m.type, url: m.full || m.url, thumbnail: m.url, caption: m.caption || '' })));
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
      tokens.push({ type: 'url', value: match[1], href: normalizeExternalUrl(match[2]), suffix: '' });
    } else if (match[3]) {
      tokens.push({ type: 'url', value: match[3], href: normalizeExternalUrl(match[3]), suffix: '' });
    } else if (match[4]) {
      const handle = normalizeHandle(match[4]);
      tokens.push(handle ? { type: 'mention', value: match[4], handle, suffix: '' } : { type: 'text', value: match[4] });
    } else if (match[5]) {
      const tag = match[5].replace(/^#+/, '').replace(/[^\w\u0600-\u06FF]/g, '').trim();
      tokens.push(tag ? { type: 'hashtag', value: match[5], tag, suffix: '' } : { type: 'text', value: match[5] });
    }

    lastIndex = richPattern.lastIndex;
  }

  if (lastIndex < source.length) tokens.push({ type: 'text', value: source.slice(lastIndex) });
  return tokens;
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
  const searchParams = useSearchParams();
  const [active, setActive] = useState('home');
  const [homeTab, setHomeTab] = useState('latest'); // latest | suggested
  const [suggestedFilter, setSuggestedFilter] = useState('following');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupTab, setGroupTab] = useState('posts');
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [channelTab, setChannelTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedPosts, setFeedPosts] = useState([]);
  const [extraGroupPosts, setExtraGroupPosts] = useState([]);
  const [extraChannelPosts, setExtraChannelPosts] = useState([]);
  const [originalPostsById, setOriginalPostsById] = useState({});
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableChannels, setAvailableChannels] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [mutualByUser, setMutualByUser] = useState({});
  const [removedSuggestionIds, setRemovedSuggestionIds] = useState(new Set());
  const [hideExploreSuggestions, setHideExploreSuggestions] = useState(false);
  const [peopleSuggestionsOpen, setPeopleSuggestionsOpen] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [pollsByPost, setPollsByPost] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notificationDetail, setNotificationDetail] = useState(null);
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
    const view = searchParams.get('view');
    if (SECTION_LABELS.some((section) => section.key === view)) {
      setActive(view);
    }
    const group = searchParams.get('group');
    if (group) setSelectedGroupId(group);
    const channel = searchParams.get('channel');
    if (channel) setSelectedChannelId(channel);
  }, [searchParams]);

  function changeSection(sectionKey) {
    setActive(sectionKey);
    const suffix = sectionKey === 'home' ? '' : `?view=${encodeURIComponent(sectionKey)}`;
    router.replace(`/interface${suffix}`, { scroll: false });
  }

  function selectGroup(groupId) {
    setSelectedGroupId(groupId);
    router.replace(`/interface?view=groups&group=${encodeURIComponent(groupId || '')}`, { scroll: false });
  }

  function selectChannel(channelId) {
    setSelectedChannelId(channelId);
    router.replace(`/interface?view=channels&channel=${encodeURIComponent(channelId || '')}`, { scroll: false });
  }

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
          .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
          .order('created_at', { ascending: false })
          .limit(fetchLimit);

        if (postsRes.error) {
          throw new Error(postsRes.error.message || postsRes.error.code || 'posts_query_failed');
        }

        const posts = postsRes.data || [];
        setHasMore(posts.length >= fetchLimit);
        setFeedPosts(posts);

        const postIds = posts.map((p) => p.id).filter(Boolean);
        const originalPostIds = [
          ...new Set(posts.map((p) => p.original_post_id).filter(Boolean)),
        ];
        const missingOriginalPostIds = originalPostIds.filter((id) => !postIds.includes(id));
        const originalPostsRes = missingOriginalPostIds.length
          ? await client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
            .in('id', missingOriginalPostIds)
            .neq('privacy', 'private')
          : { data: [], error: null };

        if (originalPostsRes.error) {
          throw new Error(originalPostsRes.error.message || originalPostsRes.error.code || 'original_posts_query_failed');
        }

        const originalPosts = originalPostsRes.data || [];
        const relationPosts = [...posts, ...originalPosts];
        const relationPostIds = [...new Set(relationPosts.map((p) => p.id).filter(Boolean))];
        const userIds = [...new Set(relationPosts.map((p) => p.user_id).filter(Boolean))];
        const groupIds = [...new Set(relationPosts.map((p) => p.group_id).filter(Boolean))];
        const channelIds = [...new Set(relationPosts.map((p) => p.channel_id).filter(Boolean))];
        const memberGroupsRows = await client
          .from('group_members')
          .select('group_id')
          .eq('user_id', meId)
          .eq('status', 'approved');
        const memberGroupIds = [
          ...new Set((memberGroupsRows?.data || []).map((row) => row.group_id).filter(Boolean)),
        ];
        const [memberChannelsRows, followedChannelsRows] = await Promise.all([
          client
            .from('channel_members')
            .select('channel_id,role')
            .eq('user_id', meId)
            .in('role', ['owner', 'admin', 'editor']),
          client
            .from('channel_followers')
            .select('channel_id')
            .eq('user_id', meId),
        ]);
        const memberChannelIds = [
          ...new Set((memberChannelsRows?.data || []).map((row) => row.channel_id).filter(Boolean)),
        ];
        const memberRoleByChannelId = Object.fromEntries(
          (memberChannelsRows?.data || [])
            .filter((row) => row?.channel_id)
            .map((row) => [row.channel_id, row.role || 'editor'])
        );
        const followedChannelIds = [
          ...new Set((followedChannelsRows?.data || []).map((row) => row.channel_id).filter(Boolean)),
        ];

        const [peopleRes, postMediaRes, commentsRes, likesRes, myLikesRes, followsRes, groupsRes, allGroupsRes, ownedGroupsRes, memberGroupsRes, channelsRes, allChannelsRes, ownedChannelsRes, memberChannelsRes, followedChannelsRes, notificationsRes] = await Promise.all([
          client.from('profiles').select('user_id,username,full_name,avatar_url,is_verified,created_at').order('created_at', { ascending: false }).limit(200),
          relationPostIds.length
            ? client.from('post_media').select('*').in('post_id', relationPostIds).order('order_index', { ascending: true })
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
            ? client.from('groups').select('*, member_count:group_members(count)').in('id', groupIds)
            : Promise.resolve({ data: [], error: null }),
          client.from('groups').select('*, member_count:group_members(count)').order('created_at', { ascending: false }).limit(120),
          client.from('groups').select('*, member_count:group_members(count)').eq('owner_id', meId).order('created_at', { ascending: false }).limit(120),
          memberGroupIds.length
            ? client.from('groups').select('*, member_count:group_members(count)').in('id', memberGroupIds).order('created_at', { ascending: false }).limit(120)
            : Promise.resolve({ data: [], error: null }),
          channelIds.length
            ? client.from('channels').select('*, followers_count:channel_followers(count)').in('id', channelIds)
            : Promise.resolve({ data: [], error: null }),
          client.from('channels').select('*, followers_count:channel_followers(count)').eq('is_disabled', false).order('is_verified', { ascending: false }).order('created_at', { ascending: false }).limit(120),
          client.from('channels').select('*, followers_count:channel_followers(count)').eq('owner_id', meId).order('created_at', { ascending: false }).limit(120),
          memberChannelIds.length
            ? client.from('channels').select('*, followers_count:channel_followers(count)').in('id', memberChannelIds).order('created_at', { ascending: false }).limit(120)
            : Promise.resolve({ data: [], error: null }),
          followedChannelIds.length
            ? client.from('channels').select('*, followers_count:channel_followers(count)').in('id', followedChannelIds).order('created_at', { ascending: false }).limit(120)
            : Promise.resolve({ data: [], error: null }),
          client
            .from('notifications')
            .select('id,user_id,actor_id,type,post_id,comment_id,group_id,group_post_id,is_read,created_at,title,body,action_url,media_url,media_type')
            .eq('user_id', meId)
            .order('created_at', { ascending: false })
            .limit(200),
        ]);

        const people = peopleRes?.data || [];
        setProfiles(people);
        let loadedNotifications = Array.isArray(notificationsRes?.data) ? notificationsRes.data : [];
        if (notificationsRes?.error) {
          const fallbackNotifications = await client
            .from('notifications')
            .select('id,user_id,actor_id,type,post_id,comment_id,group_id,group_post_id,is_read,created_at,title,body')
            .eq('user_id', meId)
            .order('created_at', { ascending: false })
            .limit(200);
          loadedNotifications = Array.isArray(fallbackNotifications?.data) ? fallbackNotifications.data : [];
        }
        setNotifications(loadedNotifications);
        setChatUnreadCount(await fetchChatUnreadCount(client, meId));

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
        const directGroupsMap = {};
        for (const g of [
          ...(allGroupsRes?.data || []),
          ...(ownedGroupsRes?.data || []),
          ...(memberGroupsRes?.data || []),
          ...(groupsRes?.data || []),
        ]) {
          if (!g?.id) continue;
          directGroupsMap[g.id] = g;
        }
        setAvailableGroups(Object.values(directGroupsMap));
        for (const g of Object.values(directGroupsMap)) gMap[g.id] = g;
        const cMap = {};
        for (const c of (channelsRes?.data || [])) cMap[c.id] = c;
        const directChannelsMap = {};
        for (const c of [
          ...(allChannelsRes?.data || []),
          ...(ownedChannelsRes?.data || []),
          ...(memberChannelsRes?.data || []),
          ...(followedChannelsRes?.data || []),
          ...(channelsRes?.data || []),
        ]) {
          if (!c?.id) continue;
          directChannelsMap[c.id] = c;
        }
        for (const channelId of followedChannelIds) {
          if (directChannelsMap[channelId]) {
            directChannelsMap[channelId] = { ...directChannelsMap[channelId], is_following: true };
          }
        }
        for (const [channelId, role] of Object.entries(memberRoleByChannelId)) {
          if (directChannelsMap[channelId]) {
            directChannelsMap[channelId] = { ...directChannelsMap[channelId], my_role: role };
          }
        }
        setAvailableChannels(Object.values(directChannelsMap));
        for (const c of Object.values(directChannelsMap)) cMap[c.id] = c;

        const allKnownGroupIds = Object.keys(directGroupsMap);
        const groupPostsRes = allKnownGroupIds.length
          ? await client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
            .in('group_id', allKnownGroupIds)
            .order('created_at', { ascending: false })
            .limit(240)
          : { data: [], error: null };
        if (groupPostsRes.error) {
          throw new Error(groupPostsRes.error.message || groupPostsRes.error.code || 'group_posts_query_failed');
        }

        const groupRawPosts = groupPostsRes?.data || [];
        const groupPostIds = groupRawPosts.map((p) => p.id).filter(Boolean);
        const groupOriginalPostIds = [
          ...new Set(groupRawPosts.map((p) => p.original_post_id).filter(Boolean)),
        ].filter((id) => !groupPostIds.includes(id) && !postIds.includes(id));
        const groupOriginalPostsRes = groupOriginalPostIds.length
          ? await client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
            .in('id', groupOriginalPostIds)
            .neq('privacy', 'private')
          : { data: [], error: null };
        if (groupOriginalPostsRes.error) {
          throw new Error(groupOriginalPostsRes.error.message || groupOriginalPostsRes.error.code || 'group_original_posts_query_failed');
        }
        const groupOriginalPosts = groupOriginalPostsRes?.data || [];
        const groupRelationPosts = [...groupRawPosts, ...groupOriginalPosts];
        const groupRelationPostIds = [...new Set(groupRelationPosts.map((p) => p.id).filter(Boolean))];
        const groupUserIds = [...new Set(groupRelationPosts.map((p) => p.user_id).filter(Boolean))];
        const missingGroupUserIds = groupUserIds.filter((id) => !pMap[id]);
        const [groupPeopleRes, groupMediaRes, groupCommentsRes, groupLikesRes, groupMyLikesRes, groupPollsRes] = await Promise.all([
          missingGroupUserIds.length
            ? client.from('profiles').select('user_id,username,full_name,avatar_url,is_verified,created_at').in('user_id', missingGroupUserIds)
            : Promise.resolve({ data: [], error: null }),
          groupRelationPostIds.length
            ? client.from('post_media').select('*').in('post_id', groupRelationPostIds).order('order_index', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
          groupPostIds.length
            ? client.from('comments').select('id,post_id,content,created_at,updated_at,user_id,parent_id').in('post_id', groupPostIds).order('created_at', { ascending: true }).limit(800)
            : Promise.resolve({ data: [], error: null }),
          groupPostIds.length
            ? client.from('post_reactions').select('post_id,reaction_type').in('post_id', groupPostIds).eq('reaction_type', 'like')
            : Promise.resolve({ data: [], error: null }),
          groupPostIds.length
            ? client.from('post_reactions').select('post_id').in('post_id', groupPostIds).eq('reaction_type', 'like').eq('user_id', meId)
            : Promise.resolve({ data: [], error: null }),
          groupPostIds.length
            ? client
              .from('post_polls')
              .select(`
                id,post_id,question,expires_at,
                post_poll_options (
                  id,option_text,order_index,
                  post_poll_votes ( user_id )
                )
              `)
              .in('post_id', groupPostIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const groupPeople = groupPeopleRes?.data || [];
        for (const p of groupPeople) pMap[p.user_id] = p;
        if (groupPeople.length) {
          setProfiles([...people, ...groupPeople]);
          setProfilesMap({ ...pMap });
        }

        for (const m of (groupMediaRes?.data || [])) {
          if (!pmMap[m.post_id]) pmMap[m.post_id] = [];
          pmMap[m.post_id].push(m);
        }

        const allKnownChannelIds = Object.keys(directChannelsMap);
        const channelPostsRes = allKnownChannelIds.length
          ? await client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
            .in('channel_id', allKnownChannelIds)
            .order('created_at', { ascending: false })
            .limit(240)
          : { data: [], error: null };
        if (channelPostsRes.error) {
          throw new Error(channelPostsRes.error.message || channelPostsRes.error.code || 'channel_posts_query_failed');
        }

        const channelRawPosts = channelPostsRes?.data || [];
        const channelPostIds = channelRawPosts.map((p) => p.id).filter(Boolean);
        const channelOriginalPostIds = [
          ...new Set(channelRawPosts.map((p) => p.original_post_id).filter(Boolean)),
        ].filter((id) => !channelPostIds.includes(id) && !groupPostIds.includes(id) && !postIds.includes(id));
        const channelOriginalPostsRes = channelOriginalPostIds.length
          ? await client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost,background_style,privacy,allow_comments,is_ai_generated,is_sensitive')
            .in('id', channelOriginalPostIds)
            .neq('privacy', 'private')
          : { data: [], error: null };
        if (channelOriginalPostsRes.error) {
          throw new Error(channelOriginalPostsRes.error.message || channelOriginalPostsRes.error.code || 'channel_original_posts_query_failed');
        }
        const channelOriginalPosts = channelOriginalPostsRes?.data || [];
        const channelRelationPosts = [...channelRawPosts, ...channelOriginalPosts];
        const channelRelationPostIds = [...new Set(channelRelationPosts.map((p) => p.id).filter(Boolean))];
        const channelUserIds = [...new Set(channelRelationPosts.map((p) => p.user_id).filter(Boolean))];
        const missingChannelUserIds = channelUserIds.filter((id) => !pMap[id]);
        const [channelPeopleRes, channelMediaRes, channelCommentsRes, channelLikesRes, channelMyLikesRes, channelPollsRes] = await Promise.all([
          missingChannelUserIds.length
            ? client.from('profiles').select('user_id,username,full_name,avatar_url,is_verified,created_at').in('user_id', missingChannelUserIds)
            : Promise.resolve({ data: [], error: null }),
          channelRelationPostIds.length
            ? client.from('post_media').select('*').in('post_id', channelRelationPostIds).order('order_index', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
          channelPostIds.length
            ? client.from('comments').select('id,post_id,content,created_at,updated_at,user_id,parent_id').in('post_id', channelPostIds).order('created_at', { ascending: true }).limit(800)
            : Promise.resolve({ data: [], error: null }),
          channelPostIds.length
            ? client.from('post_reactions').select('post_id,reaction_type').in('post_id', channelPostIds).eq('reaction_type', 'like')
            : Promise.resolve({ data: [], error: null }),
          channelPostIds.length
            ? client.from('post_reactions').select('post_id').in('post_id', channelPostIds).eq('reaction_type', 'like').eq('user_id', meId)
            : Promise.resolve({ data: [], error: null }),
          channelPostIds.length
            ? client
              .from('post_polls')
              .select(`
                id,post_id,question,expires_at,
                post_poll_options (
                  id,option_text,order_index,
                  post_poll_votes ( user_id )
                )
              `)
              .in('post_id', channelPostIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const channelPeople = channelPeopleRes?.data || [];
        for (const p of channelPeople) pMap[p.user_id] = p;
        if (channelPeople.length) {
          setProfiles((prev) => {
            const seen = new Set(prev.map((item) => item.user_id));
            return [...prev, ...channelPeople.filter((item) => !seen.has(item.user_id))];
          });
          setProfilesMap({ ...pMap });
        }

        for (const m of (channelMediaRes?.data || [])) {
          if (!pmMap[m.post_id]) pmMap[m.post_id] = [];
          pmMap[m.post_id].push(m);
        }

        const enrichPost = (p) => ({
          ...p,
          profiles: pMap[p.user_id] || null,
          groups: p.group_id ? gMap[p.group_id] || null : null,
          channels: p.channel_id ? cMap[p.channel_id] || null : null,
          post_media: pmMap[p.id] || [],
        });

        const originalsMap = {};
        for (const p of originalPosts) originalsMap[p.id] = enrichPost(p);
        for (const p of groupOriginalPosts) originalsMap[p.id] = enrichPost(p);
        for (const p of channelOriginalPosts) originalsMap[p.id] = enrichPost(p);
        setOriginalPostsById(originalsMap);
        setExtraGroupPosts(groupRawPosts.map((p) => enrichPost(p)));
        setExtraChannelPosts(channelRawPosts.map((p) => enrichPost(p)));

        setFeedPosts((prev) =>
          prev.map((p) => enrichPost(p))
        );

        const commentsRows = [...(commentsRes?.data || []), ...(groupCommentsRes?.data || []), ...(channelCommentsRes?.data || [])];
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
        for (const r of [...(likesRes?.data || []), ...(groupLikesRes?.data || []), ...(channelLikesRes?.data || [])]) {
          likeMap[r.post_id] = (likeMap[r.post_id] || 0) + 1;
        }
        setLikeCounts(likeMap);

        const likedSet = new Set([...(myLikesRes?.data || []), ...(groupMyLikesRes?.data || []), ...(channelMyLikesRes?.data || [])].map((r) => r.post_id));
        setLikedByPost(likedSet);

        const followsSet = new Set((followsRes?.data || []).map((r) => r.following_id));
        setFollowed(followsSet);
        const followingIds = [...followsSet].filter(Boolean);
        const candidateProfileIds = people
          .map((profile) => profile.user_id)
          .filter((id) => id && id !== meId);
        if (followingIds.length && candidateProfileIds.length) {
          const mutualRowsRes = await client
            .from('follows')
            .select('follower_id,following_id')
            .in('follower_id', followingIds)
            .in('following_id', candidateProfileIds);
          const nextMutual = {};
          for (const row of (mutualRowsRes?.data || [])) {
            const targetId = row?.following_id;
            const followerId = row?.follower_id;
            if (!targetId || !followerId) continue;
            if (!nextMutual[targetId]) nextMutual[targetId] = { count: 0, avatarUrls: [] };
            nextMutual[targetId].count += 1;
            const followerProfile = pMap[followerId];
            if (followerProfile?.avatar_url && nextMutual[targetId].avatarUrls.length < 3) {
              nextMutual[targetId].avatarUrls.push(followerProfile.avatar_url);
            }
          }
          setMutualByUser(nextMutual);
        } else {
          setMutualByUser({});
        }

        if (postIds.length || groupPostIds.length || channelPostIds.length) {
          const pollsRes = postIds.length
            ? await client
              .from('post_polls')
              .select(`
                id,post_id,question,expires_at,
                post_poll_options (
                  id,option_text,order_index,
                  post_poll_votes ( user_id )
                )
              `)
              .in('post_id', postIds)
            : { data: [], error: null };
          const nextPolls = {};
          for (const poll of [...(pollsRes?.data || []), ...(groupPollsRes?.data || []), ...(channelPollsRes?.data || [])]) {
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
    if (!me) return undefined;
    let channel = null;
    let cancelled = false;

    async function subscribeNotifications() {
      const client = await getSupabaseClient();
      if (!client || cancelled) return;
      channel = client
        .channel(`interface-notifications-${me}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` },
          (payload) => {
            setNotifications((prev) => {
              if (payload.eventType === 'DELETE') {
                return prev.filter((item) => item.id !== payload.old?.id);
              }
              const nextRow = payload.new;
              if (!nextRow?.id) return prev;
              const exists = prev.some((item) => item.id === nextRow.id);
              const next = exists
                ? prev.map((item) => (item.id === nextRow.id ? { ...item, ...nextRow } : item))
                : [nextRow, ...prev];
              return next
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                .slice(0, 200);
            });
          }
        )
        .subscribe();
    }

    subscribeNotifications();
    return () => {
      cancelled = true;
      if (channel) getSupabaseClient().then((client) => client?.removeChannel(channel));
    };
  }, [me]);


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
    const groupPostMap = new Map();
    for (const post of [...feedPosts.filter((p) => !!p.group_id), ...extraGroupPosts]) {
      if (post?.id) groupPostMap.set(post.id, post);
    }
    const groups = [...groupPostMap.values()].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
    const channelPostMap = new Map();
    for (const post of [...feedPosts.filter((p) => !!p.channel_id), ...extraChannelPosts]) {
      if (post?.id) channelPostMap.set(post.id, post);
    }
    const channels = [...channelPostMap.values()].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
    return { home, reels, groups, channels };
  }, [feedPosts, extraGroupPosts, extraChannelPosts]);

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
  const getOriginalPost = (post) => (
    post?.original_post_id
      ? postsById[post.original_post_id] || originalPostsById[post.original_post_id] || null
      : null
  );
  const groupCards = useMemo(() => {
    const map = new Map();
    for (const group of availableGroups) {
      if (!group?.id) continue;
      map.set(group.id, {
        id: group.id,
        name: group?.name || 'مجموعة',
        username: group?.username || '',
        description: group?.description || '',
        coverUrl: group?.cover_url || group?.coverUrl || '',
        avatarUrl: group?.avatar_url || group?.avatarUrl || '',
        category: groupCategoryLabel(group?.category),
        type: group?.type || 'public',
        ownerId: group?.owner_id || group?.ownerId || '',
        memberCount: extractMemberCount(group?.member_count),
        allowMemberPosts: group?.allow_member_posts !== false,
        allowMemberComments: group?.allow_member_comments !== false,
        allowMemberInvites: group?.allow_member_invites !== false,
        allowSharingOutside: group?.allow_sharing_outside !== false,
        postApprovalRequired: group?.post_approval_required === true,
        joinApprovalRequired: group?.join_approval_required === true,
        hideMemberList: group?.hide_member_list === true,
        discoverable: group?.discoverable !== false,
        isDisabled: group?.is_disabled === true,
        disabledAt: group?.disabled_at || null,
        postCount: 0,
        videoCount: 0,
        latestAt: group?.created_at || null,
      });
    }
    for (const post of derived.groups) {
      const group = post?.groups || {};
      const id = post?.group_id || group?.id;
      if (!id) continue;
      const current = map.get(id) || {
        id,
        name: group?.name || 'مجموعة',
        username: group?.username || '',
        description: group?.description || '',
        coverUrl: group?.cover_url || group?.coverUrl || '',
        avatarUrl: group?.avatar_url || group?.avatarUrl || '',
        category: groupCategoryLabel(group?.category),
        type: group?.type || 'public',
        ownerId: group?.owner_id || group?.ownerId || '',
        memberCount: extractMemberCount(group?.member_count),
        allowMemberPosts: group?.allow_member_posts !== false,
        allowMemberComments: group?.allow_member_comments !== false,
        allowMemberInvites: group?.allow_member_invites !== false,
        allowSharingOutside: group?.allow_sharing_outside !== false,
        postApprovalRequired: group?.post_approval_required === true,
        joinApprovalRequired: group?.join_approval_required === true,
        hideMemberList: group?.hide_member_list === true,
        discoverable: group?.discoverable !== false,
        isDisabled: group?.is_disabled === true,
        disabledAt: group?.disabled_at || null,
        postCount: 0,
        videoCount: 0,
        latestAt: post?.created_at || null,
      };
      current.postCount += 1;
      if ((post?.media_type || '').toLowerCase().includes('video') || mediaFromPost(post).some((item) => item.type === 'video')) {
        current.videoCount += 1;
      }
      const latestMs = new Date(current.latestAt || 0).getTime();
      const postMs = new Date(post?.created_at || 0).getTime();
      if (postMs > latestMs) current.latestAt = post.created_at;
      map.set(id, current);
    }
    return [...map.values()].sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0));
  }, [availableGroups, derived.groups]);
  const channelCards = useMemo(() => {
    const map = new Map();
    for (const channel of availableChannels) {
      if (!channel?.id) continue;
      map.set(channel.id, {
        id: channel.id,
        name: channel?.name || 'قناة',
        username: channel?.username || '',
        description: channel?.description || '',
        coverUrl: channel?.cover_url || channel?.coverUrl || '',
        avatarUrl: channel?.avatar_url || channel?.avatarUrl || '',
        category: channelCategoryLabel(channel?.category),
        ownerId: channel?.owner_id || channel?.ownerId || '',
        isVerified: channel?.is_verified === true,
        isPrivate: channel?.is_private === true,
        isDisabled: channel?.is_disabled === true,
        disabledAt: channel?.disabled_at || null,
        isFollowing: channel?.is_following === true,
        myRole: channel?.my_role || (channel?.owner_id === me ? 'owner' : null),
        followerCount: extractFollowerCount(channel?.followers_count),
        postCount: 0,
        videoCount: 0,
        latestAt: channel?.created_at || null,
      });
    }
    for (const post of derived.channels) {
      const channel = post?.channels || {};
      const id = post?.channel_id || channel?.id;
      if (!id) continue;
      const current = map.get(id) || {
        id,
        name: channel?.name || 'قناة',
        username: channel?.username || '',
        description: channel?.description || '',
        coverUrl: channel?.cover_url || channel?.coverUrl || '',
        avatarUrl: channel?.avatar_url || channel?.avatarUrl || '',
        category: channelCategoryLabel(channel?.category),
        ownerId: channel?.owner_id || channel?.ownerId || '',
        isVerified: channel?.is_verified === true,
        isPrivate: channel?.is_private === true,
        isDisabled: channel?.is_disabled === true,
        disabledAt: channel?.disabled_at || null,
        isFollowing: channel?.is_following === true,
        myRole: channel?.my_role || (channel?.owner_id === me ? 'owner' : null),
        followerCount: extractFollowerCount(channel?.followers_count),
        postCount: 0,
        videoCount: 0,
        latestAt: post?.created_at || null,
      };
      current.postCount += 1;
      if ((post?.media_type || '').toLowerCase().includes('video') || mediaFromPost(post).some((item) => item.type === 'video')) {
        current.videoCount += 1;
      }
      const latestMs = new Date(current.latestAt || 0).getTime();
      const postMs = new Date(post?.created_at || 0).getTime();
      if (postMs > latestMs) current.latestAt = post.created_at;
      map.set(id, current);
    }
    return [...map.values()].sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0));
  }, [availableChannels, derived.channels, me]);
  const suggestedPeople = useMemo(() => (
    profiles
      .filter((profile) => profile?.user_id && profile.user_id !== me)
      .map((profile) => {
        const mutual = mutualByUser[profile.user_id] || { count: 0, avatarUrls: [] };
        return {
          ...profile,
          isFollowing: followed.has(profile.user_id),
          mutualCount: mutual.count || 0,
          mutualAvatarUrls: mutual.avatarUrls || [],
        };
      })
      .filter((profile) => !removedSuggestionIds.has(profile.user_id))
      .sort((a, b) => {
        if (a.isFollowing !== b.isFollowing) return a.isFollowing ? 1 : -1;
        if ((b.mutualCount || 0) !== (a.mutualCount || 0)) return (b.mutualCount || 0) - (a.mutualCount || 0);
        if ((b.is_verified ? 1 : 0) !== (a.is_verified ? 1 : 0)) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
  ), [profiles, me, followed, mutualByUser, removedSuggestionIds]);
  const exploreFollowingPosts = useMemo(
    () => feedPosts.filter((post) => post?.user_id && followed.has(post.user_id)),
    [feedPosts, followed]
  );
  const unreadNotificationsCount = useMemo(
    () => notifications.reduce((sum, item) => sum + (item?.is_read ? 0 : 1), 0),
    [notifications]
  );
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

  useEffect(() => {
    if (loading || isFetchingMore || !hasMore) return;
    const activeSectionIsEmpty =
      (active === 'home' && homeRenderPosts.length === 0) ||
      (active === 'reels' && derived.reels.length === 0) ||
      (active === 'groups' && groupCards.length === 0) ||
      (active === 'channels' && channelCards.length === 0) ||
      (active === 'explore' && suggestedPeople.length === 0 && exploreFollowingPosts.length === 0);

    if (!activeSectionIsEmpty) return;
    const timer = window.setTimeout(() => {
      setFetchLimit((prev) => prev + LOAD_STEP);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [
    active,
    channelCards.length,
    derived.reels.length,
    exploreFollowingPosts.length,
    groupCards.length,
    hasMore,
    homeRenderPosts.length,
    isFetchingMore,
    loading,
    suggestedPeople.length,
  ]);

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

    await client.from('comments').delete().eq('id', commentId);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId && c.parent_id !== commentId),
    }));
  }

  async function copyCommentText(comment) {
    const content = String(comment?.content || '').trim();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      notify('تم نسخ نص التعليق');
    } catch {
      notify('تعذر نسخ التعليق', 'error');
    }
  }

  async function reportComment(comment) {
    if (!me || !comment?.id) return;
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('reports').insert({
      reporter_id: me,
      target_type: 'comment',
      target_id: comment.id,
      reason: 'reported_from_web',
    });
    notify('تم إرسال بلاغ التعليق');
  }

  async function blockCommentUser(comment) {
    if (!me || !comment?.user_id || comment.user_id === me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('blocks').upsert({ blocker_id: me, blocked_id: comment.user_id }, { onConflict: 'blocker_id,blocked_id' });
    await client.from('follows').delete().match({ follower_id: me, following_id: comment.user_id });
    await client.from('follows').delete().match({ follower_id: comment.user_id, following_id: me });
    setFeedPosts((prev) => prev.filter((item) => item.user_id !== comment.user_id));
    setExtraGroupPosts((prev) => prev.filter((item) => item.user_id !== comment.user_id));
    setExtraChannelPosts((prev) => prev.filter((item) => item.user_id !== comment.user_id));
    setCommentsByPost((prev) => {
      const next = {};
      for (const [postId, rows] of Object.entries(prev)) {
        next[postId] = (rows || []).filter((row) => row.user_id !== comment.user_id);
      }
      return next;
    });
    notify('تم حظر صاحب التعليق');
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

  async function updateGroupSettings(groupId, patch) {
    if (!me || !groupId) return false;
    const client = await getSupabaseClient();
    if (!client) return false;
    const { data, error } = await client
      .from('groups')
      .update(patch)
      .eq('id', groupId)
      .eq('owner_id', me)
      .select('*, member_count:group_members(count)')
      .maybeSingle();
    if (error) {
      notify('تعذر حفظ إعدادات المجموعة حالياً', 'error');
      return false;
    }
    if (!data) {
      notify('الإدارة متاحة لمالك المجموعة فقط', 'error');
      return false;
    }
    setAvailableGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, ...data } : group)));
    setFeedPosts((prev) => prev.map((post) => (post.group_id === groupId ? { ...post, groups: { ...(post.groups || {}), ...data } } : post)));
    setExtraGroupPosts((prev) => prev.map((post) => (post.group_id === groupId ? { ...post, groups: { ...(post.groups || {}), ...data } } : post)));
    notify('تم حفظ إعدادات المجموعة');
    return true;
  }

  async function setGroupDisabled(groupId, disabled) {
    if (!me || !groupId) return false;
    const client = await getSupabaseClient();
    if (!client) return false;
    const payload = {
      is_disabled: disabled,
      disabled_at: disabled ? new Date().toISOString() : null,
      disabled_by: disabled ? me : null,
    };
    const { data, error } = await client
      .from('groups')
      .update(payload)
      .eq('id', groupId)
      .eq('owner_id', me)
      .select('*, member_count:group_members(count)')
      .maybeSingle();
    if (error || !data) {
      notify('تعذر تغيير حالة المجموعة. الإدارة متاحة للمالك فقط', 'error');
      return false;
    }
    setAvailableGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, ...data } : group)));
    setFeedPosts((prev) => prev.map((post) => (post.group_id === groupId ? { ...post, groups: { ...(post.groups || {}), ...data } } : post)));
    setExtraGroupPosts((prev) => prev.map((post) => (post.group_id === groupId ? { ...post, groups: { ...(post.groups || {}), ...data } } : post)));
    notify(disabled ? 'تم تعطيل المجموعة مؤقتًا' : 'تم إعادة تفعيل المجموعة');
    return true;
  }

  async function deleteGroupPermanently(groupId) {
    if (!me || !groupId) return false;
    const client = await getSupabaseClient();
    if (!client) return false;
    const { data, error } = await client
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('owner_id', me)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      notify('تعذر حذف المجموعة. الحذف متاح للمالك فقط', 'error');
      return false;
    }
    setAvailableGroups((prev) => prev.filter((group) => group.id !== groupId));
    setFeedPosts((prev) => prev.filter((post) => post.group_id !== groupId));
    setExtraGroupPosts((prev) => prev.filter((post) => post.group_id !== groupId));
    setSelectedGroupId(null);
    notify('تم حذف المجموعة نهائيًا');
    return true;
  }

  async function toggleChannelFollow(channel) {
    if (!me || !channel?.id || channel.ownerId === me) return false;
    const client = await getSupabaseClient();
    if (!client) return false;
    const currentlyFollowing = !!channel.isFollowing;
    if (currentlyFollowing) {
      const { error } = await client
        .from('channel_followers')
        .delete()
        .eq('channel_id', channel.id)
        .eq('user_id', me);
      if (error) {
        notify('تعذر إلغاء متابعة القناة', 'error');
        return false;
      }
    } else {
      const { error } = await client
        .from('channel_followers')
        .insert({ channel_id: channel.id, user_id: me });
      if (error) {
        notify('تعذر متابعة القناة حالياً', 'error');
        return false;
      }
    }
    setAvailableChannels((prev) => prev.map((item) => (
      item.id === channel.id
        ? {
          ...item,
          is_following: !currentlyFollowing,
          followers_count: [{ count: Math.max(0, (channel.followerCount || 0) + (currentlyFollowing ? -1 : 1)) }],
        }
        : item
    )));
    notify(currentlyFollowing ? 'تم إلغاء متابعة القناة' : 'تمت متابعة القناة');
    return true;
  }

  async function updateChannelSettings(channelId, patch) {
    if (!me || !channelId) return false;
    const client = await getSupabaseClient();
    if (!client) return false;
    const { data, error } = await client
      .from('channels')
      .update(patch)
      .eq('id', channelId)
      .eq('owner_id', me)
      .select('*, followers_count:channel_followers(count)')
      .maybeSingle();
    if (error || !data) {
      notify('تعذر حفظ إعدادات القناة. الإدارة متاحة للمالك فقط', 'error');
      return false;
    }
    setAvailableChannels((prev) => prev.map((channel) => (channel.id === channelId ? { ...channel, ...data } : channel)));
    setFeedPosts((prev) => prev.map((post) => (post.channel_id === channelId ? { ...post, channels: { ...(post.channels || {}), ...data } } : post)));
    setExtraChannelPosts((prev) => prev.map((post) => (post.channel_id === channelId ? { ...post, channels: { ...(post.channels || {}), ...data } } : post)));
    notify('تم حفظ إعدادات القناة');
    return true;
  }

  async function setChannelDisabled(channelId, disabled) {
    if (!me || !channelId) return false;
    const payload = {
      is_disabled: disabled,
      disabled_at: disabled ? new Date().toISOString() : null,
      disabled_by: disabled ? me : null,
    };
    return updateChannelSettings(channelId, payload).then((ok) => {
      if (ok) notify(disabled ? 'تم تعطيل القناة مؤقتًا' : 'تم إعادة تفعيل القناة');
      return ok;
    });
  }

  async function deleteChannelPermanently(channelId) {
    if (!me || !channelId) return false;
    const client = await getSupabaseClient();
    if (!client) return false;
    const { data, error } = await client
      .from('channels')
      .delete()
      .eq('id', channelId)
      .eq('owner_id', me)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      notify('تعذر حذف القناة. الحذف متاح للمالك فقط', 'error');
      return false;
    }
    setAvailableChannels((prev) => prev.filter((channel) => channel.id !== channelId));
    setFeedPosts((prev) => prev.filter((post) => post.channel_id !== channelId));
    setExtraChannelPosts((prev) => prev.filter((post) => post.channel_id !== channelId));
    setSelectedChannelId(null);
    notify('تم حذف القناة نهائيًا');
    return true;
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
      .select('id,user_id,content,description,content_blocks,media_type,created_at,group_id,channel_id,original_post_id,is_repost')
      .single();

    await client.from('reposts').upsert({ post_id: post.id, user_id: me, quote_text: trimmedQuote || null }, { onConflict: 'post_id,user_id' });

    if (newPostRes?.data) setFeedPosts((prev) => [{ ...newPostRes.data, profiles: profilesMap[me] || null, post_media: [] }, ...prev]);
    notify('تمت مشاركة المنشور');
  }

  async function deletePost(post) {
    if (!me || !post?.id || post.user_id !== me) return;
    setFeedPosts((prev) => prev.filter((item) => item.id !== post.id));
    setExtraGroupPosts((prev) => prev.filter((item) => item.id !== post.id));

    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('posts').delete().eq('id', post.id).eq('user_id', me);
    if (error) {
      setFeedPosts((prev) => [post, ...prev]);
      if (post.group_id) setExtraGroupPosts((prev) => [post, ...prev]);
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
    setExtraGroupPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, content: trimmed, description: trimmed } : item)));
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
    setExtraGroupPosts((prev) => prev.filter((item) => item.user_id !== post.user_id));
    notify('تم حظر المستخدم');
  }

  async function markNotificationRead(notificationId) {
    if (!notificationId) return;
    setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)));
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('notifications').update({ is_read: true }).eq('id', notificationId);
  }

  async function markAllNotificationsRead() {
    if (!me) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('notifications').update({ is_read: true }).eq('user_id', me).eq('is_read', false);
  }

  async function deleteNotification(notificationId) {
    if (!notificationId) return;
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    const client = await getSupabaseClient();
    if (!client) return;
    await client.from('notifications').delete().eq('id', notificationId);
  }

  async function openNotification(notification) {
    if (!notification?.id) return;
    await markNotificationRead(notification.id);
    if (notification.action_url) {
      router.push(notification.action_url);
      return;
    }
    if (notification.post_id) {
      router.push(postPermalink(notification.post_id));
      return;
    }
    if (notification.group_id || notification.group_post_id) {
      router.push(`/interface?view=groups&group=${encodeURIComponent(notification.group_id || '')}`);
      return;
    }
    setNotificationDetail(notification);
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
          originalPost={getOriginalPost(p)}
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
        <PostCard key={`reel-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={getOriginalPost(p)} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label="ريلز" mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
      ))}

      {active === 'groups' ? (
        <GroupsSection
          groups={groupCards}
          posts={derived.groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={selectGroup}
          activeTab={groupTab}
          onChangeTab={setGroupTab}
          me={me}
          notify={notify}
          onUpdateGroup={updateGroupSettings}
          onSetGroupDisabled={setGroupDisabled}
          onDeleteGroup={deleteGroupPermanently}
          renderPost={(p) => (
            <PostCard key={`group-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={getOriginalPost(p)} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label={`مجموعة: ${p?.groups?.name || ''}`} mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
          )}
        />
      ) : null}

      {active === 'channels' ? (
        <ChannelsSection
          channels={channelCards}
          posts={derived.channels}
          selectedChannelId={selectedChannelId}
          onSelectChannel={selectChannel}
          activeTab={channelTab}
          onChangeTab={setChannelTab}
          me={me}
          notify={notify}
          onToggleFollow={toggleChannelFollow}
          onUpdateChannel={updateChannelSettings}
          onSetChannelDisabled={setChannelDisabled}
          onDeleteChannel={deleteChannelPermanently}
          renderPost={(p) => (
            <PostCard key={`channel-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={getOriginalPost(p)} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label={`قناة: ${p?.channels?.name || p?.channels?.username || ''}`} mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
          )}
        />
      ) : null}
      {active === 'explore' ? (
        <ExploreSection
          people={suggestedPeople}
          posts={exploreFollowingPosts}
          followingCount={followed.size}
          hideSuggestions={hideExploreSuggestions}
          peopleSuggestionsOpen={peopleSuggestionsOpen}
          onHideSuggestions={() => setHideExploreSuggestions(true)}
          onShowPeople={() => setPeopleSuggestionsOpen(true)}
          onClosePeople={() => setPeopleSuggestionsOpen(false)}
          onToggleFollow={(userId) => toggleFollow(userId)}
          onRemovePerson={(userId) => setRemovedSuggestionIds((prev) => new Set([...prev, userId]))}
          renderPost={(p) => (
            <PostCard key={`explore-${p.id}`} post={p} me={me} isLiked={likedByPost.has(p.id)} likeCount={deriveReactionsCount(likeCounts, p.id)} isFollowing={followed.has(p.user_id)} comments={commentsByPost[p.id] || []} originalPost={getOriginalPost(p)} onToggleLike={() => toggleLike(p.id)} onToggleFollow={() => toggleFollow(p.user_id)} onOpenComments={() => setCommentModalPost(p)} onShare={() => openShareComposer(p)} onDeletePost={() => setDeleteTargetPost(p)} onEditPost={() => openEditPostModal(p)} onCopyLink={() => copyPostLink(p)} onReportPost={() => reportPost(p)} onBlockUser={() => setBlockTargetPost(p)} label="استكشاف" mentionMap={mentionMap} poll={pollsByPost[p.id] || null} onVotePoll={votePoll} onOpenPost={() => openPostPage(p)} />
          )}
        />
      ) : null}

      {active === 'notifications' ? (
        <NotificationsSection
          notifications={notifications}
          profilesMap={profilesMap}
          unreadCount={unreadNotificationsCount}
          onOpen={openNotification}
          onMarkAllRead={markAllNotificationsRead}
          onDelete={deleteNotification}
        />
      ) : null}

      {active === 'chat' ? (
        <ChatSection
          me={me}
          profiles={profiles}
          profilesMap={profilesMap}
          notify={notify}
          onUnreadChange={setChatUnreadCount}
        />
      ) : null}


      {!loading && !['chat', 'notifications'].includes(active) ? (
        <div className="py-3 text-center text-sm text-gray-500">
          {isFetchingMore ? <InlineLoadingSkeleton /> : hasMore ? null : 'وصلت لنهاية المحتوى الحالي'}
        </div>
      ) : null}
      <div ref={bottomSentinelRef} className="h-4 w-full" />


      {!loading &&
      hasMore &&
      ((active === 'home' && homeRenderPosts.length === 0) ||
        (active === 'reels' && derived.reels.length === 0) ||
        (active === 'groups' && groupCards.length === 0) ||
        (active === 'channels' && channelCards.length === 0) ||
        (active === 'explore' && suggestedPeople.length === 0 && exploreFollowingPosts.length === 0)) ? (
        <ContentSkeleton />
      ) : null}

      {!loading &&
      !hasMore &&
      ((active === 'home' && homeRenderPosts.length === 0) ||
        (active === 'reels' && derived.reels.length === 0) ||
        (active === 'groups' && groupCards.length === 0) ||
        (active === 'channels' && channelCards.length === 0) ||
        (active === 'explore' && suggestedPeople.length === 0 && exploreFollowingPosts.length === 0)) ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gray-100" />
          <div className="mx-auto mt-4 h-4 w-44 rounded-full bg-gray-100" />
          <div className="mx-auto mt-2 h-3 w-28 rounded-full bg-gray-50" />
        </div>
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
                onClick={() => changeSection(s.key)}
                className={[
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition',
                  active === s.key ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
                ].join(' ')}
                >
                  <span className="inline-flex items-center gap-2">
                  <span className="relative inline-flex">
                    <SectionIcon section={s.key} />
                    {s.key === 'notifications' && unreadNotificationsCount > 0 ? (
                      <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-black leading-5 text-white shadow">
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                      </span>
                    ) : null}
                    {s.key === 'chat' && chatUnreadCount > 0 ? (
                      <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-black leading-5 text-white shadow">
                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </span>
                    ) : null}
                  </span>
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
            <ContentSkeleton />
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
          <SettingsSidebar
            posts={feedPosts}
            me={me}
            commentsByPost={commentsByPost}
            likeCounts={likeCounts}
          />
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
          onCopyComment={copyCommentText}
          onReportComment={reportComment}
          onBlockCommentUser={blockCommentUser}
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

      {notificationDetail ? (
        <NotificationDetailModal
          notification={notificationDetail}
          actor={profilesMap?.[notificationDetail.actor_id] || null}
          onClose={() => setNotificationDetail(null)}
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

function ContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="loading">
      {[0, 1, 2].map((item) => (
        <article
          key={item}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-end gap-3">
              <div className="space-y-2 text-right">
                <div className="mr-auto h-4 w-32 rounded-full bg-gray-200" />
                <div className="mr-auto h-3 w-20 rounded-full bg-gray-100" />
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="mr-auto h-4 w-11/12 rounded-full bg-gray-100" />
              <div className="mr-auto h-4 w-9/12 rounded-full bg-gray-100" />
              <div className="mr-auto h-4 w-7/12 rounded-full bg-gray-100" />
            </div>
            <div className="h-52 rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 rounded-2xl bg-gray-100" />
              <div className="h-10 rounded-2xl bg-gray-100" />
              <div className="h-10 rounded-2xl bg-gray-100" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function InlineLoadingSkeleton() {
  return (
    <div className="py-3" aria-busy="true" aria-label="loading">
      <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-300" />
        <span className="h-2 w-16 animate-pulse rounded-full bg-gray-200" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-300 [animation-delay:120ms]" />
      </div>
    </div>
  );
}

function PanelRowsSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-gray-50 p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-end gap-3">
              <div className="space-y-2">
                <div className="h-3 w-36 rounded-full bg-gray-200" />
                <div className="h-3 w-24 rounded-full bg-gray-100" />
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-200" />
            </div>
            <div className="mr-auto h-9 w-40 rounded-2xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatSection({ me, profiles = [], profilesMap = {}, notify, onUnreadChange }) {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [participantsByConversation, setParticipantsByConversation] = useState({});
  const [chatProfiles, setChatProfiles] = useState({});
  const [latestByConversation, setLatestByConversation] = useState({});
  const [unreadByConversation, setUnreadByConversation] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [mediaUrlDraft, setMediaUrlDraft] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const selectedConversation = conversations.find((item) => item.id === selectedId) || null;

  async function loadConversations(preferredId = selectedId) {
    if (!me) return;
    setLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) return;
      try {
        await client.rpc('ensure_official_chat_membership');
      } catch {}

      const mineRes = await client
        .from('chat_participants')
        .select('chat_id,user_id,last_read_at,muted_until,archived_at')
        .eq('user_id', me)
        .is('archived_at', null);
      const mineRows = mineRes?.data || [];
      const conversationIds = [...new Set(mineRows.map((row) => row.chat_id).filter(Boolean))];

      if (!conversationIds.length) {
        setConversations([]);
        setParticipantsByConversation({});
        setLatestByConversation({});
        setUnreadByConversation({});
        setSelectedId(null);
        setMessages([]);
        return;
      }

      const [conversationsRes, participantsRes, latestRes] = await Promise.all([
        client
          .from('chats')
          .select('id,name,type,is_system,is_pinned,cannot_delete,dm_user_a,dm_user_b,last_message_at,last_message_text,created_at,updated_at')
          .in('id', conversationIds)
          .order('last_message_at', { ascending: false }),
        client
          .from('chat_participants')
          .select('chat_id,user_id,last_read_at,muted_until,archived_at')
          .in('chat_id', conversationIds),
        client
          .from('messages')
          .select('id,chat_id,sender_id,content,type,media_url,reply_to_message_id,created_at,edited_at')
          .in('chat_id', conversationIds)
          .order('created_at', { ascending: false })
          .limit(Math.max(180, conversationIds.length * 8)),
      ]);

      const rows = conversationsRes?.data || [];
      const participantRows = participantsRes?.data || [];
      const participantMap = {};
      for (const row of participantRows) {
        if (!participantMap[row.chat_id]) participantMap[row.chat_id] = [];
        participantMap[row.chat_id].push(row);
      }

      const participantUserIds = [...new Set(participantRows.map((row) => row.user_id).filter(Boolean))];
      const missingProfileIds = participantUserIds.filter((id) => !profilesMap[id]);
      let fetchedProfiles = [];
      if (missingProfileIds.length) {
        const { data } = await client
          .from('profiles')
          .select('user_id,username,full_name,avatar_url,is_verified,created_at')
          .in('user_id', missingProfileIds);
        fetchedProfiles = data || [];
      }

      const profileMap = { ...profilesMap };
      for (const profile of fetchedProfiles) profileMap[profile.user_id] = profile;
      setChatProfiles(profileMap);

      const latestMap = {};
      for (const msg of latestRes?.data || []) {
        if (!latestMap[msg.chat_id]) latestMap[msg.chat_id] = msg;
      }
      setLatestByConversation(latestMap);

      const readMap = {};
      for (const row of mineRows) readMap[row.chat_id] = row.last_read_at ? new Date(row.last_read_at).getTime() : 0;
      const unreadMap = {};
      for (const msg of latestRes?.data || []) {
        if (msg.sender_id === me) continue;
        const created = msg.created_at ? new Date(msg.created_at).getTime() : 0;
        if (created > (readMap[msg.chat_id] || 0)) {
          unreadMap[msg.chat_id] = (unreadMap[msg.chat_id] || 0) + 1;
        }
      }
      onUnreadChange?.(Object.values(unreadMap).reduce((sum, count) => sum + Number(count || 0), 0));
      setUnreadByConversation(unreadMap);
      setParticipantsByConversation(participantMap);
      const normalizedRows = rows
        .map((row) => ({
          ...row,
          is_group: row.type === 'group',
          title: row.name || null,
          last_message_at: latestMap[row.id]?.created_at || row.last_message_at || row.updated_at || row.created_at,
        }))
        .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
      setConversations(normalizedRows);

      const nextSelected = preferredId && normalizedRows.some((item) => item.id === preferredId)
        ? preferredId
        : normalizedRows[0]?.id || null;
      setSelectedId(nextSelected);
      if (nextSelected) await loadMessages(nextSelected, true);
    } catch {
      notify?.('تعذر تحميل الدردشة حالياً', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId, markRead = false) {
    if (!conversationId || !me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { data, error } = await client
      .from('messages')
      .select('id,chat_id,sender_id,content,type,media_url,reply_to_message_id,created_at,edited_at')
      .eq('chat_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(160);
    if (error) {
      notify?.('تعذر تحميل الرسائل', 'error');
      return;
    }
    setMessages(data || []);
    if (markRead) {
      await client
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', conversationId)
        .eq('user_id', me);
      setUnreadByConversation((prev) => ({ ...prev, [conversationId]: 0 }));
      onUnreadChange?.((prev) => Math.max(0, Number(prev || 0) - Number(unreadByConversation[conversationId] || 0)));
    }
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    if (!selectedId || !me) return undefined;
    let channel;
    async function subscribe() {
      const client = await getSupabaseClient();
      if (!client) return;
      channel = client
        .channel(`web-chat-${selectedId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${selectedId}` },
          async () => {
            await loadMessages(selectedId, true);
            await loadConversations(selectedId);
          }
        )
        .subscribe();
    }
    subscribe();
    return () => {
      if (channel) channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, me]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, selectedId]);

  async function openConversation(conversationId) {
    setSelectedId(conversationId);
    await loadMessages(conversationId, true);
  }

  async function startConversation(userId) {
    if (!me || !userId || userId === me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    try {
      let { data, error } = await client.rpc('get_or_create_dm_chat', { p_other_user_id: userId });
      if (!data) {
        const mineRes = await client.from('chat_participants').select('chat_id').eq('user_id', me);
        const mineChatIds = [...new Set((mineRes?.data || []).map((row) => row.chat_id).filter(Boolean))];
        if (mineChatIds.length) {
          const commonRes = await client
            .from('chats')
            .select('id')
            .in('id', mineChatIds)
            .eq('type', 'dm')
            .or(`and(dm_user_a.eq.${me},dm_user_b.eq.${userId}),and(dm_user_a.eq.${userId},dm_user_b.eq.${me})`)
            .maybeSingle();
          data = commonRes?.data?.id || null;
        }
      }
      if (error || !data) {
        let created = await client.from('chats').insert({ type: 'dm', dm_user_a: me, dm_user_b: userId }).select('id').single();
        if (created.error) created = await client.from('chats').insert({}).select('id').single();
        if (created.error || !created.data?.id) throw created.error || new Error('chat_failed');
        data = created.data.id;
        const participantsInsert = await client.from('chat_participants').insert([
          { chat_id: data, user_id: me },
          { chat_id: data, user_id: userId },
        ]);
        if (participantsInsert.error) throw participantsInsert.error;
      }
      setNewChatOpen(false);
      await loadConversations(data);
      notify?.('تم فتح المحادثة');
    } catch {
      notify?.('تعذر إنشاء المحادثة', 'error');
    }
  }

  async function sendMessage() {
    if (!selectedId || !me || sending) return;
    const content = messageDraft.trim();
    const mediaUrl = mediaUrlDraft.trim();
    if (!content && !mediaUrl) return;
    const client = await getSupabaseClient();
    if (!client) return;

    setSending(true);
    try {
      const payload = {
        chat_id: selectedId,
        sender_id: me,
        content: content || (messageType === 'image' ? 'صورة' : messageType === 'video' ? 'فيديو' : 'ملف'),
        type: mediaUrl ? messageType : 'text',
        media_url: mediaUrl || null,
      };
      const { data, error } = await client
        .from('messages')
        .insert(payload)
        .select('id,chat_id,sender_id,content,type,media_url,reply_to_message_id,created_at,edited_at')
        .single();
      if (error) throw error;
      setMessages((prev) => [...prev, data]);
      setLatestByConversation((prev) => ({ ...prev, [selectedId]: data }));
      setMessageDraft('');
      setMediaUrlDraft('');
      setMessageType('text');
    } catch {
      notify?.('تعذر إرسال الرسالة', 'error');
    } finally {
      setSending(false);
    }
  }

  async function updateMessage() {
    if (!editingMessage || !me) return;
    const nextText = messageDraft.trim();
    if (!nextText) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client
      .from('messages')
      .update({ content: nextText, edited_at: new Date().toISOString() })
      .eq('id', editingMessage.id)
      .eq('sender_id', me);
    if (error) {
      notify?.('تعذر تعديل الرسالة', 'error');
      return;
    }
    setMessages((prev) => prev.map((msg) => (msg.id === editingMessage.id ? { ...msg, content: nextText, edited_at: new Date().toISOString() } : msg)));
    setEditingMessage(null);
    setMessageDraft('');
  }

  async function deleteMessage(messageId) {
    if (!messageId || !me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('messages').delete().eq('id', messageId).eq('sender_id', me);
    if (error) {
      notify?.('تعذر حذف الرسالة', 'error');
      return;
    }
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }

  async function toggleMute(conversation) {
    if (!conversation?.id || !me) return;
    const ownParticipant = (participantsByConversation[conversation.id] || []).find((row) => row.user_id === me);
    const nextMutedUntil = ownParticipant?.muted_until ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client
      .from('chat_participants')
      .update({ muted_until: nextMutedUntil })
      .eq('chat_id', conversation.id)
      .eq('user_id', me);
    if (error) {
      notify?.('تعذر تحديث كتم المحادثة', 'error');
      return;
    }
    setParticipantsByConversation((prev) => ({
      ...prev,
      [conversation.id]: (prev[conversation.id] || []).map((row) =>
        row.user_id === me ? { ...row, muted_until: nextMutedUntil } : row
      ),
    }));
    notify?.(nextMutedUntil ? 'تم كتم المحادثة' : 'تم إلغاء الكتم');
  }

  async function archiveConversation(conversationId) {
    if (!conversationId || !me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client
      .from('chat_participants')
      .update({ archived_at: new Date().toISOString() })
      .eq('chat_id', conversationId)
      .eq('user_id', me);
    if (error) {
      notify?.('تعذر حذف المحادثة', 'error');
      return;
    }
    setConversations((prev) => prev.filter((item) => item.id !== conversationId));
    if (selectedId === conversationId) {
      setSelectedId(null);
      setMessages([]);
    }
    notify?.('تم حذف المحادثة من قائمتك');
  }

  async function blockPeer(conversation) {
    const peer = conversationPeer(conversation);
    if (!peer?.user_id || !me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client
      .from('blocks')
      .upsert({ blocker_id: me, blocked_id: peer.user_id }, { onConflict: 'blocker_id,blocked_id' });
    if (error) {
      notify?.('تعذر حظر المستخدم', 'error');
      return;
    }
    notify?.('تم حظر المستخدم');
  }

  async function copyMessage(message) {
    const text = message?.content || message?.media_url || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify?.('تم نسخ النص');
    } catch {
      notify?.('تعذر نسخ النص', 'error');
    }
  }

  async function forwardMessage(targetConversationId) {
    if (!forwardingMessage || !targetConversationId || !me) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const payload = {
      chat_id: targetConversationId,
      sender_id: me,
      content: forwardingMessage.content || '',
      type: forwardingMessage.type || (forwardingMessage.media_url ? detectMediaKind(forwardingMessage.media_url) : 'text'),
      media_url: forwardingMessage.media_url || null,
    };
    const { error } = await client.from('messages').insert(payload);
    if (error) {
      notify?.('تعذر إعادة توجيه الرسالة', 'error');
      return;
    }
    setForwardingMessage(null);
    notify?.('تمت إعادة توجيه الرسالة');
    await loadConversations(selectedId);
  }

  function conversationPeer(conversation) {
    const participants = participantsByConversation[conversation.id] || [];
    if (conversation.is_group) return null;
    const peer = participants.find((row) => row.user_id !== me) || participants[0];
    return peer ? chatProfiles[peer.user_id] || profilesMap[peer.user_id] : null;
  }

  function conversationTitle(conversation) {
    if (!conversation) return 'الدردشة';
    if (conversation.is_group) return conversation.title || 'محادثة جماعية';
    const peer = conversationPeer(conversation);
    return peer?.full_name || peer?.username || 'مستخدم دريدود';
  }

  function conversationAvatar(conversation) {
    const peer = conversationPeer(conversation);
    return peer?.avatar_url || '';
  }

  function ownParticipant(conversation) {
    return (participantsByConversation[conversation.id] || []).find((row) => row.user_id === me);
  }

  const filteredConversations = conversations.filter((conversation) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const title = conversationTitle(conversation).toLowerCase();
    const latest = String(latestByConversation[conversation.id]?.content || '').toLowerCase();
    return title.includes(q) || latest.includes(q);
  });

  const peopleResults = profiles
    .filter((profile) => profile.user_id !== me)
    .filter((profile) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${profile.full_name || ''} ${profile.username || ''}`.toLowerCase().includes(q);
    })
    .slice(0, 12);

  if (!me) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-black text-gray-950">الدردشة</h2>
        <p className="mt-2 text-sm font-semibold text-gray-500">سجل الدخول لعرض رسائلك ومحادثاتك.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm" dir="rtl">
      <div className="flex flex-col border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-950">الدردشة</h2>
          <p className="text-sm font-semibold text-gray-500">رسائل فورية ومحادثات خاصة داخل دريدود.</p>
        </div>
        <button
          type="button"
          onClick={() => setNewChatOpen((value) => !value)}
          className="mt-3 rounded-2xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800 sm:mt-0"
        >
          محادثة جديدة
        </button>
      </div>

      <div className="grid min-h-[620px] lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-gray-100 bg-gray-50/60 p-3 lg:border-b-0 lg:border-l">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={newChatOpen ? 'ابحث عن شخص...' : 'ابحث في المحادثات...'}
            className="mb-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-right text-sm font-bold outline-none focus:border-sky-400"
          />

          {newChatOpen ? (
            <div className="space-y-2">
              {peopleResults.map((profile) => (
                <button
                  key={profile.user_id}
                  type="button"
                  onClick={() => startConversation(profile.user_id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-right shadow-sm hover:bg-sky-50"
                >
                  <span className="text-xs font-black text-sky-700">بدء</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-gray-950">{profile.full_name || profile.username || 'مستخدم'}</span>
                    <span className="block truncate text-xs font-semibold text-gray-500">@{profile.username || 'user'}</span>
                  </span>
                  <span className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username || 'user'} className="h-full w-full object-cover" /> : null}
                  </span>
                </button>
              ))}
              {!peopleResults.length ? <PanelRowsSkeleton rows={2} /> : null}
            </div>
          ) : loading ? (
            <PanelRowsSkeleton rows={5} />
          ) : filteredConversations.length ? (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const latest = latestByConversation[conversation.id];
                const unread = unreadByConversation[conversation.id] || 0;
                const muted = !!ownParticipant(conversation)?.muted_until;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-2xl p-3 text-right transition',
                      selectedId === conversation.id ? 'bg-sky-50 ring-1 ring-sky-200' : 'bg-white hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {conversationAvatar(conversation) ? (
                        <img src={conversationAvatar(conversation)} alt={conversationTitle(conversation)} className="h-full w-full object-cover" />
                      ) : null}
                      {unread ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black text-gray-950">{conversationTitle(conversation)}</span>
                        <span className="shrink-0 text-[11px] font-bold text-gray-400">{formatAgo(latest?.created_at || conversation.last_message_at)}</span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-gray-500">
                          {latest ? (latest.type === 'text' ? latest.content : latest.type) : 'لا توجد رسائل بعد'}
                        </span>
                        {muted ? <span className="text-[10px] font-black text-gray-400">مكتومة</span> : null}
                        {unread ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">{unread}</span> : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gray-100" />
              <p className="mt-3 text-sm font-black text-gray-700">لا توجد محادثات بعد</p>
            </div>
          )}
        </aside>

        <div className="flex min-h-[620px] flex-col">
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 overflow-hidden rounded-full bg-gray-200">
                    {conversationAvatar(selectedConversation) ? (
                      <img src={conversationAvatar(selectedConversation)} alt={conversationTitle(selectedConversation)} className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-gray-950">{conversationTitle(selectedConversation)}</h3>
                    <p className="text-xs font-semibold text-gray-500">{selectedConversation.is_group ? 'محادثة جماعية' : 'محادثة خاصة'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => toggleMute(selectedConversation)} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-200">
                    {ownParticipant(selectedConversation)?.muted_until ? 'إلغاء الكتم' : 'كتم'}
                  </button>
                  {conversationPeer(selectedConversation)?.username ? (
                    <Link href={`/${normalizeHandle(conversationPeer(selectedConversation)?.username)}`} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-200">
                      الملف
                    </Link>
                  ) : null}
                  <button type="button" onClick={() => blockPeer(selectedConversation)} className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-200">
                    حظر
                  </button>
                  <button type="button" onClick={() => archiveConversation(selectedConversation.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100">
                    حذف
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4">
                {messages.length ? messages.map((msg) => {
                  const mine = msg.sender_id === me;
                  const sender = chatProfiles[msg.sender_id] || profilesMap[msg.sender_id] || {};
                  return (
                    <div key={msg.id} className={['flex', mine ? 'justify-start' : 'justify-end'].join(' ')}>
                      <div className={['max-w-[82%] rounded-3xl px-4 py-3 shadow-sm', mine ? 'bg-red-700 text-white' : 'bg-white text-gray-900'].join(' ')}>
                        {!mine ? <p className="mb-1 text-xs font-black text-gray-500">{sender.full_name || sender.username || 'مستخدم'}</p> : null}
                        {msg.media_url ? <ChatMediaMessage message={msg} mine={mine} /> : null}
                        <RichArticleText text={msg.content || ''} className={['whitespace-pre-wrap text-sm font-semibold leading-7', mine ? 'text-white' : 'text-gray-900'].join(' ')} />
                        <div className={['mt-2 flex items-center gap-2 text-[10px] font-bold', mine ? 'text-white/70' : 'text-gray-400'].join(' ')}>
                          <span>{formatAgo(msg.created_at)}</span>
                          {msg.edited_at ? <span>تم التعديل</span> : null}
                          <button type="button" onClick={() => copyMessage(msg)} className="hover:underline">نسخ</button>
                          <button type="button" onClick={() => setForwardingMessage(msg)} className="hover:underline">إعادة توجيه</button>
                          {mine ? (
                            <>
                              <button type="button" onClick={() => { setEditingMessage(msg); setMessageDraft(msg.content || ''); }} className="hover:underline">تعديل</button>
                              <button type="button" onClick={() => deleteMessage(msg.id)} className="hover:underline">حذف</button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex h-full min-h-[340px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto h-16 w-16 rounded-3xl bg-gray-100" />
                      <p className="mt-3 text-sm font-black text-gray-500">ابدأ المحادثة برسالة لطيفة.</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="border-t border-gray-100 bg-white p-3">
                {editingMessage ? (
                  <div className="mb-2 flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                    <button type="button" onClick={() => { setEditingMessage(null); setMessageDraft(''); }} className="hover:underline">إلغاء</button>
                    <span>تعديل الرسالة</span>
                  </div>
                ) : null}
                {forwardingMessage ? (
                  <div className="mb-2 rounded-2xl bg-sky-50 p-3 text-xs font-bold text-sky-900">
                    <div className="mb-2 flex items-center justify-between">
                      <button type="button" onClick={() => setForwardingMessage(null)} className="hover:underline">إلغاء</button>
                      <span>إعادة توجيه الرسالة إلى</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {conversations
                        .filter((conversation) => conversation.id !== selectedId)
                        .slice(0, 12)
                        .map((conversation) => (
                          <button
                            key={conversation.id}
                            type="button"
                            onClick={() => forwardMessage(conversation.id)}
                            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-sky-700 shadow-sm hover:bg-sky-100"
                          >
                            {conversationTitle(conversation)}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}
                <div className="mb-2 flex flex-wrap justify-end gap-2">
                  {['text', 'image', 'video', 'file'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMessageType(type)}
                      className={['rounded-full px-3 py-1.5 text-[11px] font-black', messageType === type ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'].join(' ')}
                    >
                      {type === 'text' ? 'نص' : type === 'image' ? 'صورة' : type === 'video' ? 'فيديو' : 'ملف'}
                    </button>
                  ))}
                </div>
                {messageType !== 'text' ? (
                  <input
                    value={mediaUrlDraft}
                    onChange={(event) => setMediaUrlDraft(event.target.value)}
                    placeholder="ألصق رابط الوسائط هنا..."
                    className="mb-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-right text-sm font-semibold outline-none focus:border-sky-400"
                  />
                ) : null}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={editingMessage ? updateMessage : sendMessage}
                    disabled={sending || (!messageDraft.trim() && !mediaUrlDraft.trim())}
                    className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    {editingMessage ? 'حفظ' : sending ? '...' : 'إرسال'}
                  </button>
                  <textarea
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        editingMessage ? updateMessage() : sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="اكتب رسالة..."
                    className="min-h-12 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-semibold outline-none focus:border-sky-400"
                  />
                </div>
              </footer>
            </>
          ) : (
            <div className="flex min-h-[620px] items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-sky-50" />
                <h3 className="mt-4 text-2xl font-black text-gray-950">اختر محادثة</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">أو ابدأ محادثة جديدة من القائمة.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChatMediaMessage({ message, mine }) {
  const url = message.media_url || '';
  const type = message.type || detectMediaKind(url);
  if (!url) return null;
  if (type === 'image') {
    return <img src={url} alt="chat-media" className="mb-2 max-h-80 w-full rounded-2xl object-cover" />;
  }
  if (type === 'video') {
    return <video src={url} controls className="mb-2 max-h-80 w-full rounded-2xl bg-black object-contain" />;
  }
  if (type === 'audio') {
    return <audio src={url} controls className="mb-2 w-full" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={['mb-2 block rounded-2xl px-3 py-2 text-xs font-black underline', mine ? 'bg-white/15 text-white' : 'bg-gray-100 text-sky-700'].join(' ')}
    >
      فتح الملف
    </a>
  );
}

function ExploreSection({
  people,
  posts,
  followingCount,
  hideSuggestions,
  peopleSuggestionsOpen,
  onHideSuggestions,
  onShowPeople,
  onClosePeople,
  onToggleFollow,
  onRemovePerson,
  renderPost,
}) {
  const visiblePeople = people.slice(0, 12);
  const availableCount = people.length;
  const hasFollowingPosts = posts.length > 0;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onShowPeople}
        className="group flex w-full items-center justify-between gap-4 rounded-3xl border border-sky-200 bg-gradient-to-l from-sky-50 via-white to-sky-50 p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
          <AccountsIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-black text-gray-950">اقتراحات الأشخاص</span>
          <span className="mt-1 block text-sm font-semibold text-gray-500">عرض كل المستخدمين المقترحين والجدد</span>
        </span>
        <span className="text-2xl font-black text-sky-500 transition group-hover:-translate-x-1">‹</span>
      </button>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm font-black text-gray-800">
        <span className="text-xl text-sky-500">✦</span>
        <span>اكتشف أشخاصاً جديدة: {availableCount} اقتراحات متاحة</span>
      </div>

      {!hideSuggestions && visiblePeople.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onHideSuggestions} className="text-sm font-black text-sky-600 hover:text-sky-700">
              إخفاء
            </button>
            <h2 className="text-xl font-black text-gray-950">اقتراحات قد تهمك</h2>
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2" dir="rtl">
            {visiblePeople.map((person) => (
              <SuggestedPersonCard
                key={person.user_id}
                person={person}
                compact
                onToggleFollow={() => onToggleFollow(person.user_id)}
                onRemove={() => onRemovePerson(person.user_id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {followingCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-600">
            <SectionIcon section="explore" />
          </div>
          <h3 className="mt-4 text-2xl font-black text-gray-950">ابدأ ببناء شبكتك</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-7 text-gray-500">
            تابع أشخاصاً لتظهر منشوراتهم هنا، ويمكنك فتح اقتراحات الأشخاص لاكتشاف حسابات جديدة.
          </p>
          <button type="button" onClick={onShowPeople} className="mt-5 rounded-full bg-sky-500 px-6 py-3 text-sm font-black text-white hover:bg-sky-600">
            عرض الاقتراحات
          </button>
        </div>
      ) : hasFollowingPosts ? (
        <div className="space-y-4">
          {posts.map((post) => renderPost(post))}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-black text-gray-950">لا توجد منشورات جديدة من المتابَعين</h3>
          <p className="mt-2 text-sm font-semibold text-gray-500">تابع المزيد من الأشخاص أو عد لاحقاً لمحتوى أحدث.</p>
        </div>
      )}

      <PeopleSuggestionsModal
        open={peopleSuggestionsOpen}
        people={people}
        onClose={onClosePeople}
        onToggleFollow={onToggleFollow}
        onRemovePerson={onRemovePerson}
      />
    </div>
  );
}

function NotificationsSection({ notifications, profilesMap, unreadCount, onOpen, onMarkAllRead, onDelete }) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-600 disabled:bg-gray-200 disabled:text-gray-500"
          >
            تعليم الكل كمقروء
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-gray-950">الإشعارات</h2>
            <p className="mt-1 text-sm font-bold text-gray-500">
              {unreadCount > 0 ? `${unreadCount} إشعارات غير مقروءة` : 'كل الإشعارات مقروءة'}
            </p>
          </div>
        </div>
      </section>

      {notifications.length ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              actor={profilesMap?.[notification.actor_id] || null}
              onOpen={() => onOpen(notification)}
              onDelete={() => onDelete(notification.id)}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-500">
            <BellIcon />
          </div>
          <h3 className="mt-4 text-xl font-black text-gray-950">لا توجد إشعارات بعد</h3>
          <p className="mt-2 text-sm font-semibold text-gray-500">أي إعجاب أو تعليق أو رسالة نظام ستظهر هنا مثل التطبيق.</p>
        </section>
      )}
    </div>
  );
}

function NotificationCard({ notification, actor, onOpen, onDelete }) {
  const title = notification.title || notificationTitle(notification.type, actor);
  const body = notification.body || notificationBody(notification.type, actor);
  const unread = !notification.is_read;

  return (
    <article className={[
      'rounded-3xl border bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
      unread ? 'border-sky-200 bg-sky-50/50' : 'border-gray-200',
    ].join(' ')}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={onDelete} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 hover:bg-red-50 hover:text-red-700">
          حذف
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-right">
          <div className="flex items-start justify-end gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-end gap-2">
                {unread ? <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> : null}
                <h3 className="truncate text-base font-black text-gray-950">{title}</h3>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-gray-600">{body}</p>
              <p className="mt-2 text-xs font-bold text-gray-400">{formatAgo(notification.created_at)}</p>
            </div>
            <Avatar src={actor?.avatar_url || notification.actor_avatar_url} alt={actor?.username || 'notification'} />
          </div>
          {notification.media_url ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              {String(notification.media_type || '').includes('video') ? (
                <video src={notification.media_url} className="max-h-72 w-full bg-black object-contain" controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={notification.media_url} alt="" className="max-h-72 w-full object-cover" />
              )}
            </div>
          ) : null}
        </button>
      </div>
    </article>
  );
}

function NotificationDetailModal({ notification, actor, onClose }) {
  const title = notification.title || notificationTitle(notification.type, actor);
  const body = notification.body || notificationBody(notification.type, actor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" dir="rtl">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 p-4">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-200">
            إغلاق
          </button>
          <h2 className="text-xl font-black text-gray-950">تفاصيل الإشعار</h2>
        </header>
        <div className="space-y-4 p-5 text-right">
          <div className="flex items-center justify-end gap-3">
            <div>
              <h3 className="text-2xl font-black text-gray-950">{title}</h3>
              <p className="mt-1 text-xs font-bold text-gray-400">{formatAgo(notification.created_at)}</p>
            </div>
            <Avatar src={actor?.avatar_url || notification.actor_avatar_url} alt={actor?.username || 'notification'} />
          </div>
          <p className="rounded-3xl bg-gray-50 p-4 text-base font-semibold leading-8 text-gray-700">{body}</p>
          {notification.media_url ? (
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-50">
              {String(notification.media_type || '').includes('video') ? (
                <video src={notification.media_url} className="max-h-[60vh] w-full bg-black object-contain" controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={notification.media_url} alt="" className="max-h-[60vh] w-full object-contain" />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function notificationTitle(type, actor) {
  const name = actor?.full_name || actor?.username || 'دريدود';
  const map = {
    follow: `${name} بدأ متابعتك`,
    like: `${name} أعجب بمنشورك`,
    comment: `${name} علّق على منشورك`,
    reply: `${name} رد على تعليقك`,
    mention: `${name} ذكرك`,
    share: `${name} أعاد نشر منشورك`,
    save: `${name} حفظ منشورك`,
    group_post_like: `${name} أعجب بمنشورك في المجموعة`,
    group_post_comment: `${name} علّق في المجموعة`,
    group_comment_reply: `${name} رد في المجموعة`,
    system_update: 'تحديثات التطبيق',
    app_update: 'تحديثات التطبيق',
    maintenance: 'تنبيه صيانة',
    report_update: 'تحديث البلاغ',
    block_update: 'تحديث الحظر',
    suggested_post: 'منشور مقترح',
    account_suggestion: 'اقتراح حساب',
    message_request: 'طلب رسالة',
    new_message: 'رسالة جديدة',
  };
  return map[type] || 'إشعار جديد';
}

function notificationBody(type, actor) {
  const name = actor?.full_name || actor?.username || 'مستخدم';
  const map = {
    follow: 'يمكنك فتح الملف الشخصي أو متابعة التفاعل.',
    like: 'افتح المنشور لعرض التفاعل.',
    comment: 'افتح المنشور لقراءة التعليق والرد.',
    reply: 'افتح المنشور لمتابعة الردود.',
    mention: `${name} أشار إليك في محتوى جديد.`,
    share: 'تمت إعادة نشر محتواك.',
    save: 'تم حفظ منشورك لدى مستخدم.',
  };
  return map[type] || 'اضغط لعرض تفاصيل الإشعار.';
}

function SuggestedPersonCard({ person, compact = false, onToggleFollow, onRemove }) {
  const handle = normalizeHandle(person.username || person.handle || person.user_id);
  const displayName = person.full_name || person.name || person.username || 'مستخدم';
  const subtitle = person.username ? `@${person.username}` : '@user';
  const profileHref = handle ? `/${handle}` : '/interface';

  return (
    <article className={[
      'snap-start rounded-3xl border border-sky-100 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
      compact ? 'min-w-[230px] max-w-[250px]' : 'w-full',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onRemove} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-black text-gray-500 hover:bg-gray-50">
          إزالة
        </button>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">اقتراح</span>
      </div>
      <div className="mt-3 flex flex-col items-center text-center">
        <Link href={profileHref} className="relative">
          <Avatar src={person.avatar_url} alt={displayName} />
        </Link>
        <Link href={profileHref} className="mt-3 flex items-center justify-center gap-1 text-base font-black text-gray-950 hover:text-sky-700">
          {person.is_verified ? <VerifiedBadge /> : null}
          <span className="line-clamp-1">{displayName}</span>
        </Link>
        <p className="mt-1 text-sm font-semibold text-gray-500">{subtitle}</p>
        <p className="mt-2 text-xs font-semibold text-gray-400">
          {person.created_at ? `انضم ${formatAgo(person.created_at)}` : 'قد يهمك متابعته'}
        </p>
        {person.mutualCount ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
            <MutualAvatarStack urls={person.mutualAvatarUrls} />
            <span>{person.mutualCount} متابعون مشتركون</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onToggleFollow}
          className={[
            'rounded-2xl px-4 py-2.5 text-sm font-black transition',
            person.isFollowing ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-sky-500 text-white hover:bg-sky-600',
          ].join(' ')}
        >
          {person.isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
        </button>
        <Link href={profileHref} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-center text-sm font-black text-gray-700 hover:bg-gray-50">
          عرض الملف الشخصي
        </Link>
      </div>
    </article>
  );
}

function MutualAvatarStack({ urls = [] }) {
  const visible = urls.slice(0, 3);
  if (!visible.length) return null;
  return (
    <span className="flex -space-x-2 rtl:space-x-reverse">
      {visible.map((url, index) => (
        <span key={`${url}-${index}`} className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
        </span>
      ))}
    </span>
  );
}

function PeopleSuggestionsModal({ open, people, onClose, onToggleFollow, onRemovePerson }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-200">
            إغلاق
          </button>
          <h2 className="text-2xl font-black text-gray-950">اقتراحات الأشخاص</h2>
        </div>
        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">
          {people.length ? people.map((person) => (
            <SuggestedPersonCard
              key={person.user_id}
              person={person}
              onToggleFollow={() => onToggleFollow(person.user_id)}
              onRemove={() => onRemovePerson(person.user_id)}
            />
          )) : (
            <div className="rounded-2xl border border-gray-200 p-8 text-center text-sm font-bold text-gray-500">
              لا توجد اقتراحات حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelsSection({
  channels,
  posts,
  selectedChannelId,
  onSelectChannel,
  activeTab,
  onChangeTab,
  me,
  notify,
  onToggleFollow,
  onUpdateChannel,
  onSetChannelDisabled,
  onDeleteChannel,
  renderPost,
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const activeChannel = channels.find((channel) => channel.id === selectedChannelId) || channels[0] || null;

  useEffect(() => {
    if (!activeChannel?.id) return;
    if (selectedChannelId !== activeChannel.id) onSelectChannel(activeChannel.id);
  }, [activeChannel?.id, selectedChannelId, onSelectChannel]);

  if (!activeChannel) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-sky-700">
          <SectionIcon section="channels" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-gray-950">لا توجد قنوات بعد</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-7 text-gray-500">
          عندما يتم نشر محتوى داخل القنوات ستظهر هنا بتصميم كامل يشبه التطبيق.
        </p>
        <Link href="/create-post" className="mt-5 inline-flex rounded-full bg-red-700 px-5 py-3 text-sm font-black text-white hover:bg-red-800">
          إنشاء منشور
        </Link>
      </div>
    );
  }

  const canManage = activeChannel.ownerId === me || activeChannel.myRole === 'owner' || activeChannel.myRole === 'admin';
  const canPublish = canManage || activeChannel.myRole === 'editor';
  const channelPosts = posts.filter((post) => post?.channel_id === activeChannel.id);
  const videos = channelPosts.filter((post) => (post?.media_type || '').toLowerCase().includes('video') || mediaFromPost(post).some((item) => item.type === 'video'));
  const visiblePosts = activeTab === 'videos' ? videos : activeTab === 'posts' ? channelPosts : [];
  const tabs = [
    { key: 'posts', label: 'المنشورات', count: channelPosts.length },
    { key: 'videos', label: 'الفيديوهات', count: videos.length },
    { key: 'about', label: 'حول' },
    { key: 'explore', label: 'استكشاف' },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="relative min-h-[250px] bg-gradient-to-br from-sky-100 via-white to-red-100">
          {activeChannel.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeChannel.coverUrl} alt={activeChannel.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white/95" />
          <div className="absolute bottom-5 right-5 flex items-end gap-4 text-right">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-sky-50 shadow-xl">
              {activeChannel.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeChannel.avatarUrl} alt={activeChannel.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sky-700">
                  <SectionIcon section="channels" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-end gap-2">
                {activeChannel.isVerified ? <span className="text-sky-500">✓</span> : null}
                <h2 className="text-3xl font-black text-gray-950">{activeChannel.name}</h2>
              </div>
              <p className="mt-1 text-sm font-bold text-gray-600">
                @{activeChannel.username || 'channel'} • {activeChannel.isPrivate ? 'قناة خاصة' : 'قناة عامة'} • {activeChannel.followerCount || 0} متابعين
              </p>
              {activeChannel.isDisabled ? (
                <p className="mt-2 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">القناة معطلة مؤقتًا</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {canPublish ? (
                <Link href="/create-post" className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800">
                  <EntryPencilIcon />
                  نشر في القناة
                </Link>
              ) : null}
              {activeChannel.ownerId !== me ? (
                <button type="button" onClick={() => onToggleFollow(activeChannel)} className={['inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black', activeChannel.isFollowing ? 'bg-gray-100 text-gray-800' : 'bg-sky-500 text-white'].join(' ')}>
                  <AccountsIcon />
                  {activeChannel.isFollowing ? 'متابَع' : 'متابعة'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800">
                  <ShieldIcon />
                  مالك القناة
                </span>
              )}
              <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-black text-sky-700 ring-1 ring-sky-100">
                <AccountsIcon />
                مشاركة
              </button>
              {canManage ? (
                <>
                  <button type="button" onClick={() => setManageOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800">
                    <ShieldIcon />
                    إدارة
                  </button>
                  <button type="button" onClick={() => setMembersOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800">
                    <UserIcon />
                    الأعضاء والدعوات
                  </button>
                </>
              ) : null}
            </div>
            <p className="max-w-xl text-right text-sm font-semibold leading-7 text-gray-600">
              {activeChannel.description || `قناة ${activeChannel.category || 'عامة'} لنشر تحديثات منظمة ومنشورات رسمية.`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <GroupStat label="المنشورات" value={activeChannel.postCount || channelPosts.length} />
            <GroupStat label="المتابعون" value={activeChannel.followerCount || 0} />
            <GroupStat label="الفيديوهات" value={activeChannel.videoCount || videos.length} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className={[
                  'flex min-w-[230px] items-center justify-between gap-3 rounded-2xl border p-3 text-right transition',
                  channel.id === activeChannel.id ? 'border-sky-300 bg-sky-50' : 'border-gray-200 bg-white hover:bg-gray-50',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-950">{channel.name}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{channel.category} • {channel.postCount} منشورات</p>
                </div>
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                  {channel.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={channel.avatarUrl} alt={channel.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sky-600"><SectionIcon section="channels" /></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-gray-100 pt-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTab(tab.key)}
                className={[
                  'shrink-0 rounded-full px-4 py-2 text-xs font-black transition',
                  activeTab === tab.key ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ].join(' ')}
              >
                {tab.label} {tab.count ? <span className="opacity-80">({tab.count})</span> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === 'about' ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-5 text-right shadow-sm">
          <h3 className="text-xl font-black text-gray-950">حول القناة</h3>
          <p className="mt-3 text-sm font-semibold leading-7 text-gray-600">{activeChannel.description || 'لا يوجد وصف للقناة حالياً.'}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <GroupStat label="التصنيف" value={activeChannel.category} />
            <GroupStat label="نوع القناة" value={activeChannel.isPrivate ? 'خاصة' : 'عامة'} />
          </div>
        </section>
      ) : activeTab === 'explore' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <article key={`channel-explore-${channel.id}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => { onSelectChannel(channel.id); onChangeTab('posts'); }} className="rounded-full bg-sky-50 px-4 py-2 text-xs font-black text-sky-700">عرض</button>
                <div className="min-w-0 text-right">
                  <h3 className="truncate text-lg font-black text-gray-950">{channel.name}</h3>
                  <p className="text-xs font-semibold text-gray-500">{channel.followerCount || 0} متابعين • {channel.postCount} منشورات</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : visiblePosts.length ? (
        visiblePosts.map((post) => renderPost(post))
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm font-bold text-gray-500">لا توجد عناصر في هذا التبويب حاليًا.</div>
      )}

      {inviteOpen ? <ChannelInviteModal channel={activeChannel} onClose={() => setInviteOpen(false)} notify={notify} /> : null}
      {manageOpen ? (
        <ChannelManageModal
          channel={activeChannel}
          canManage={canManage}
          onClose={() => setManageOpen(false)}
          onSave={async (patch) => {
            const ok = await onUpdateChannel(activeChannel.id, patch);
            if (ok) setManageOpen(false);
          }}
          onSetDisabled={async (disabled) => {
            const ok = await onSetChannelDisabled(activeChannel.id, disabled);
            if (ok) setManageOpen(false);
          }}
          onDelete={async () => {
            const ok = await onDeleteChannel(activeChannel.id);
            if (ok) setManageOpen(false);
          }}
        />
      ) : null}
      {membersOpen ? <ChannelMembersModal channel={activeChannel} canManage={canManage} onClose={() => setMembersOpen(false)} notify={notify} /> : null}
    </div>
  );
}

function ChannelInviteModal({ channel, onClose, notify }) {
  const channelLink = typeof window !== 'undefined'
    ? `${window.location.origin}/interface?view=channels&channel=${encodeURIComponent(channel?.id || '')}`
    : `/interface?view=channels&channel=${encodeURIComponent(channel?.id || '')}`;
  const message = `تابع ${channel?.name || 'هذه القناة'} على دريدود: ${channelLink}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(message);
      notify?.('تم نسخ رابط القناة');
    } catch {
      notify?.('تعذر نسخ رابط القناة', 'error');
    }
  }

  async function shareInvite() {
    if (navigator.share) {
      try {
        await navigator.share({ title: channel?.name || 'قناة دريدود', text: message, url: channelLink });
        return;
      } catch {
        // user cancelled
      }
    }
    await copyInvite();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center" dir="rtl">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h3 className="text-xl font-black text-gray-950">مشاركة القناة</h3>
            <p className="text-xs font-semibold text-gray-500">{channel?.name || 'قناة'}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-right">
          <p className="text-sm font-bold leading-7 text-gray-700">شارك رابط القناة مع المتابعين. يمكنهم فتح القناة ومتابعتها مباشرة من الموقع.</p>
          <div className="mt-3 rounded-xl bg-white px-3 py-2 text-left text-xs font-bold text-sky-700" dir="ltr">{channelLink}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={shareInvite} className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800">مشاركة</button>
          <button type="button" onClick={copyInvite} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-700 hover:bg-sky-50">نسخ الرابط</button>
        </div>
      </div>
    </div>
  );
}

function ChannelManageModal({ channel, canManage, onClose, onSave, onSetDisabled, onDelete }) {
  const [name, setName] = useState(channel?.name || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [category, setCategory] = useState(channel?.category || 'general');
  const [avatarUrl, setAvatarUrl] = useState(channel?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(channel?.coverUrl || '');
  const [isPrivate, setIsPrivate] = useState(channel?.isPrivate === true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  async function uploadImageFile(file, field) {
    if (!file || !canManage) return;
    setUploadingField(field);
    try {
      const url = await uploadInterfaceImage(file, `channels/${channel?.id || 'new'}`);
      if (field === 'avatar') setAvatarUrl(url);
      if (field === 'cover') setCoverUrl(url);
    } catch {
      // keep the modal stable; save button remains available for manual retry.
    } finally {
      setUploadingField('');
    }
  }

  async function submit() {
    if (!canManage || saving) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 3) return;
    setSaving(true);
    await onSave({
      name: trimmedName,
      description: description.trim() || null,
      category: category.trim() || 'general',
      avatar_url: avatarUrl || null,
      cover_url: coverUrl || null,
      is_private: isPrivate,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h3 className="text-xl font-black text-gray-950">إدارة القناة</h3>
            <p className="text-xs font-semibold text-gray-500">{canManage ? 'يمكنك تعديل إعدادات القناة' : 'الإدارة متاحة لمالك القناة أو المشرف فقط'}</p>
          </div>
        </div>
        {!canManage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right text-sm font-bold leading-7 text-amber-900">
            لا تملك صلاحية إدارة هذه القناة. يمكنك تصفح المنشورات أو مشاركة القناة.
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-3 text-right">
              <span className="block text-sm font-black text-gray-950">تغيير صورة القناة</span>
              <span className="mt-1 block text-xs font-semibold text-gray-500">{uploadingField === 'avatar' ? 'جاري الرفع...' : 'اختر صورة دائرية للقناة'}</span>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="channel avatar" className="mt-3 h-20 w-20 rounded-full object-cover" />
              ) : null}
              <input type="file" accept="image/*" hidden disabled={!canManage || !!uploadingField} onChange={(e) => uploadImageFile(e.target.files?.[0], 'avatar')} />
            </label>
            <label className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-3 text-right">
              <span className="block text-sm font-black text-gray-950">تغيير غلاف القناة</span>
              <span className="mt-1 block text-xs font-semibold text-gray-500">{uploadingField === 'cover' ? 'جاري الرفع...' : 'اختر صورة غلاف عريضة'}</span>
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="channel cover" className="mt-3 h-20 w-full rounded-xl object-cover" />
              ) : null}
              <input type="file" accept="image/*" hidden disabled={!canManage || !!uploadingField} onChange={(e) => uploadImageFile(e.target.files?.[0], 'cover')} />
            </label>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} placeholder="اسم القناة" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none focus:border-sky-300 disabled:opacity-60" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canManage} rows={4} placeholder="وصف القناة" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none focus:border-sky-300 disabled:opacity-60" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} disabled={!canManage} placeholder="التصنيف" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none focus:border-sky-300 disabled:opacity-60" />
          <GroupSettingToggle disabled={!canManage} label="قناة خاصة" hint="فقط المتابعون أو الأعضاء يمكنهم مشاهدة القنوات الخاصة" value={isPrivate} onChange={() => setIsPrivate((v) => !v)} />
        </div>
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3">
          <h4 className="mb-2 text-right text-sm font-black text-red-900">منطقة الخطر</h4>
          <GroupSettingToggle
            disabled={!canManage}
            label="تعطيل القناة مؤقتًا"
            hint="إخفاء القناة مؤقتًا مع إمكانية استرجاعها لاحقًا"
            value={channel?.isDisabled === true}
            onChange={() => setConfirmAction(channel?.isDisabled ? 'enable' : 'disable')}
          />
          <button type="button" disabled={!canManage} onClick={() => setConfirmAction('delete')} className="mt-2 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-right text-sm font-black text-red-700 ring-1 ring-red-100 disabled:opacity-60">
            <DeleteIcon className="text-red-700" />
            <span>
              <span className="block">حذف القناة نهائيًا</span>
              <span className="mt-1 block text-xs font-semibold text-red-500">حذف غير قابل للاسترجاع</span>
            </span>
          </button>
        </div>
        {confirmAction ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right">
            <p className="text-sm font-black text-amber-950">
              {confirmAction === 'delete' ? 'هل أنت متأكد من حذف القناة نهائيًا؟' : confirmAction === 'disable' ? 'هل تريد تعطيل القناة مؤقتًا؟' : 'هل تريد إعادة تفعيل القناة؟'}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={async () => { if (confirmAction === 'delete') await onDelete(); if (confirmAction === 'disable') await onSetDisabled(true); if (confirmAction === 'enable') await onSetDisabled(false); }} className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black text-white">تأكيد</button>
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-gray-700 ring-1 ring-gray-200">إلغاء</button>
            </div>
          </div>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={submit} disabled={!canManage || saving || !!uploadingField || name.trim().length < 3} className="flex-1 rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50">{saving ? 'جاري الحفظ...' : uploadingField ? 'انتظر انتهاء الرفع...' : 'حفظ الإعدادات'}</button>
          <button type="button" onClick={onClose} className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ChannelMembersModal({ channel, canManage, onClose, notify }) {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadRows() {
      setLoading(true);
      const client = await getSupabaseClient();
      if (!client || !channel?.id) {
        setLoading(false);
        return;
      }
      const [membersRes, requestsRes, invitesRes] = await Promise.all([
        client
          .from('channel_members')
          .select('channel_id,user_id,role,created_at,profiles!channel_members_profile_fkey(username,full_name,avatar_url,is_verified)')
          .eq('channel_id', channel.id)
          .limit(200),
        client
          .from('channel_join_requests')
          .select('id,channel_id,user_id,status,note,created_at,profiles!channel_join_requests_profile_fkey(username,full_name,avatar_url,is_verified)')
          .eq('channel_id', channel.id)
          .eq('status', 'pending')
          .limit(200),
        client
          .from('channel_member_invites')
          .select('id,channel_id,user_id,role,status,note,created_at,invited_user:profiles!channel_member_invites_user_profile_fkey(username,full_name,avatar_url,is_verified)')
          .eq('channel_id', channel.id)
          .eq('status', 'pending')
          .limit(200),
      ]);
      if (!mounted) return;
      setMembers(membersRes?.data || []);
      setRequests(requestsRes?.data || []);
      setInvites(invitesRes?.data || []);
      setLoading(false);
    }
    loadRows();
    return () => {
      mounted = false;
    };
  }, [channel?.id]);

  async function reviewRequest(requestId, status) {
    if (!canManage || !requestId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('channel_join_requests').update({ status }).eq('id', requestId);
    if (error) {
      notify?.('تعذر تحديث طلب القناة', 'error');
      return;
    }
    setRequests((prev) => prev.filter((item) => item.id !== requestId));
    notify?.(status === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب');
  }

  async function removeMember(userId) {
    if (!canManage || !channel?.id || !userId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('channel_members').delete().match({ channel_id: channel.id, user_id: userId });
    if (error) {
      notify?.('تعذر إزالة عضو القناة', 'error');
      return;
    }
    setMembers((prev) => prev.filter((item) => item.user_id !== userId));
    notify?.('تمت إزالة العضو');
  }

  const rows = activeTab === 'members' ? members : activeTab === 'requests' ? requests : invites;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h3 className="text-xl font-black text-gray-950">أعضاء القناة والأدوار</h3>
            <p className="text-xs font-semibold text-gray-500">{channel?.name || 'قناة'}</p>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setActiveTab('members')} className={['rounded-2xl px-3 py-3 text-sm font-black', activeTab === 'members' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>الأعضاء ({members.length})</button>
          <button type="button" onClick={() => setActiveTab('requests')} className={['rounded-2xl px-3 py-3 text-sm font-black', activeTab === 'requests' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>الطلبات ({requests.length})</button>
          <button type="button" onClick={() => setActiveTab('invites')} className={['rounded-2xl px-3 py-3 text-sm font-black', activeTab === 'invites' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>الدعوات ({invites.length})</button>
        </div>
        {loading ? (
          <PanelRowsSkeleton rows={3} />
        ) : rows.length ? (
          <div className="space-y-2">
            {rows.map((row) => {
              const profile = row?.profiles || row?.invited_user || {};
              return (
                <div key={`${row.id || row.user_id}-${activeTab}`} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex gap-2">
                    {activeTab === 'requests' && canManage ? (
                      <>
                        <button type="button" onClick={() => reviewRequest(row.id, 'approved')} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-white">قبول</button>
                        <button type="button" onClick={() => reviewRequest(row.id, 'rejected')} className="rounded-xl bg-gray-200 px-3 py-2 text-xs font-black text-gray-700">رفض</button>
                      </>
                    ) : activeTab === 'members' && canManage ? (
                      <button type="button" onClick={() => removeMember(row.user_id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">إزالة</button>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex items-center gap-3 text-right">
                    <div>
                      <p className="truncate text-sm font-black text-gray-950">{profile.full_name || profile.username || 'مستخدم'}</p>
                      <p className="text-xs font-semibold text-gray-500">@{profile.username || String(row.user_id || '').slice(0, 8)} • {row.role || row.status || 'member'}</p>
                    </div>
                    <Avatar src={profile.avatar_url} alt={profile.username || 'user'} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm font-bold text-gray-500">
            {activeTab === 'members' ? 'لا توجد أعضاء بعد' : activeTab === 'requests' ? 'لا توجد طلبات معلقة' : 'لا توجد دعوات معلقة'}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupsSection({
  groups,
  posts,
  selectedGroupId,
  onSelectGroup,
  activeTab,
  onChangeTab,
  me,
  notify,
  onUpdateGroup,
  onSetGroupDisabled,
  onDeleteGroup,
  renderPost,
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const activeGroup = groups.find((group) => group.id === selectedGroupId) || groups[0] || null;
  const activeGroupId = activeGroup?.id || null;
  const isGroupOwner = !!me && activeGroup?.ownerId === me;
  const groupPosts = activeGroupId ? posts.filter((post) => post.group_id === activeGroupId) : posts;
  const visiblePosts = groupPosts.filter((post) => {
    if (activeTab === 'photos') return mediaFromPost(post).some((item) => item.type === 'image');
    if (activeTab === 'videos') return (post?.media_type || '').toLowerCase().includes('video') || mediaFromPost(post).some((item) => item.type === 'video');
    return true;
  });
  const mediaCount = groupPosts.reduce((total, post) => total + mediaFromPost(post).filter((item) => item.type === 'image').length, 0);
  const videoCount = groupPosts.filter((post) => (post?.media_type || '').toLowerCase().includes('video') || mediaFromPost(post).some((item) => item.type === 'video')).length;
  const tabs = [
    { key: 'posts', label: 'المنشورات', count: groupPosts.length },
    { key: 'photos', label: 'الصور', count: mediaCount },
    { key: 'videos', label: 'الفيديوهات', count: videoCount },
    { key: 'explore', label: 'استكشاف', count: groups.length },
  ];

  if (!groups.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <SectionIcon section="groups" />
        </div>
        <h2 className="text-2xl font-black text-gray-950">لا توجد مجموعات بعد</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-gray-500">عندما يتم نشر محتوى داخل المجموعات ستظهر هنا بتصميم كامل يشبه التطبيق.</p>
        <Link href="/create-post" className="mt-5 inline-flex rounded-full bg-red-700 px-6 py-2 text-sm font-black text-white hover:bg-red-800">إنشاء منشور</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="relative h-44 bg-gradient-to-br from-sky-100 via-white to-red-100 sm:h-56">
          {activeGroup?.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeGroup.coverUrl} alt={activeGroup.name} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0">
              <div className="absolute -right-10 top-8 h-40 w-40 rounded-full bg-red-200/50 blur-3xl" />
              <div className="absolute -left-12 bottom-4 h-44 w-44 rounded-full bg-sky-200/60 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.75),transparent_35%),linear-gradient(135deg,rgba(14,165,233,.14),rgba(220,38,38,.12))]" />
            </div>
          )}
          <div className="absolute bottom-4 right-5 flex items-end gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg">
              {activeGroup?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeGroup.avatarUrl} alt={activeGroup.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-sky-50 text-sky-600">
                  <SectionIcon section="groups" />
                </div>
              )}
            </div>
            <div className="mb-1 text-right">
              <h2 className="text-2xl font-black text-gray-950 drop-shadow-sm">{activeGroup?.name || 'مجموعة'}</h2>
              <p className="mt-1 text-sm font-bold text-gray-600">
                {activeGroup?.type === 'private' ? 'مجموعة خاصة' : 'مجموعة عامة'} • {activeGroup?.memberCount || 0} أعضاء
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link href="/create-post" className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800">
                <EntryPencilIcon />
                نشر في المجموعة
              </Link>
              <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-black text-sky-700 ring-1 ring-sky-100">
                <AccountsIcon />
                دعوة
              </button>
              <button type="button" onClick={() => setManageOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800">
                <ShieldIcon />
                إدارة
              </button>
              <button type="button" onClick={() => setMembersOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800">
                <UserIcon />
                الأعضاء والطلبات
              </button>
            </div>
            <p className="max-w-xl text-right text-sm font-semibold leading-7 text-gray-600">
              {activeGroup?.description || `مجتمع ${activeGroup?.category || 'عام'} لتبادل المنشورات والنقاشات والوسائط.`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <GroupStat label="المنشورات" value={activeGroup?.postCount || groupPosts.length} />
            <GroupStat label="الأعضاء" value={activeGroup?.memberCount || 0} />
            <GroupStat label="الفيديوهات" value={activeGroup?.videoCount || videoCount} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group.id)}
                className={[
                  'flex min-w-[230px] items-center justify-between gap-3 rounded-2xl border p-3 text-right transition',
                  group.id === activeGroupId ? 'border-sky-300 bg-sky-50' : 'border-gray-200 bg-white hover:bg-gray-50',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-950">{group.name}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{group.category} • {group.postCount} منشورات</p>
                </div>
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                  {group.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={group.avatarUrl} alt={group.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sky-600"><SectionIcon section="groups" /></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-gray-100 pt-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTab(tab.key)}
                className={[
                  'shrink-0 rounded-full px-4 py-2 text-xs font-black transition',
                  activeTab === tab.key ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ].join(' ')}
              >
                {tab.label} {tab.count ? <span className="opacity-80">({tab.count})</span> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === 'explore' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <article key={`explore-${group.id}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => { onSelectGroup(group.id); onChangeTab('posts'); }} className="rounded-full bg-sky-50 px-4 py-2 text-xs font-black text-sky-700">عرض</button>
                <div className="min-w-0 text-right">
                  <h3 className="truncate text-lg font-black text-gray-950">{group.name}</h3>
                  <p className="text-xs font-semibold text-gray-500">{group.memberCount || 0} أعضاء • {group.postCount} منشورات</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : visiblePosts.length ? (
        visiblePosts.map((post) => renderPost(post))
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm font-bold text-gray-500">لا توجد عناصر في هذا التبويب حاليًا.</div>
      )}
      {inviteOpen ? (
        <GroupInviteModal
          group={activeGroup}
          onClose={() => setInviteOpen(false)}
          notify={notify}
        />
      ) : null}
      {manageOpen ? (
        <GroupManageModal
          group={activeGroup}
          canManage={isGroupOwner}
          onClose={() => setManageOpen(false)}
          onSave={async (patch) => {
            const ok = await onUpdateGroup(activeGroup.id, patch);
            if (ok) setManageOpen(false);
          }}
          onSetDisabled={async (disabled) => {
            const ok = await onSetGroupDisabled(activeGroup.id, disabled);
            if (ok) setManageOpen(false);
          }}
          onDelete={async () => {
            const ok = await onDeleteGroup(activeGroup.id);
            if (ok) setManageOpen(false);
          }}
        />
      ) : null}
      {membersOpen ? (
        <GroupMembersModal
          group={activeGroup}
          canManage={isGroupOwner}
          onClose={() => setMembersOpen(false)}
          notify={notify}
        />
      ) : null}
    </div>
  );
}

function GroupInviteModal({ group, onClose, notify }) {
  const groupLink = typeof window !== 'undefined'
    ? `${window.location.origin}/interface?view=groups&group=${encodeURIComponent(group?.id || '')}`
    : `/interface?view=groups&group=${encodeURIComponent(group?.id || '')}`;
  const message = `انضم إلى ${group?.name || 'هذه المجموعة'} على دريدود: ${groupLink}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(message);
      notify?.('تم نسخ رابط الدعوة');
    } catch {
      notify?.('تعذر نسخ رابط الدعوة', 'error');
    }
  }

  async function shareInvite() {
    if (navigator.share) {
      try {
        await navigator.share({ title: group?.name || 'مجموعة دريدود', text: message, url: groupLink });
        return;
      } catch {
        // user cancelled
      }
    }
    await copyInvite();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center" dir="rtl">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h3 className="text-xl font-black text-gray-950">دعوة إلى المجموعة</h3>
            <p className="text-xs font-semibold text-gray-500">{group?.name || 'مجموعة'}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-right">
          <p className="text-sm font-bold leading-7 text-gray-700">شارك رابط المجموعة مع أصدقائك. يمكنهم فتح الرابط ثم مشاهدة المجموعة والانضمام إليها حسب إعدادات الخصوصية.</p>
          <div className="mt-3 rounded-xl bg-white px-3 py-2 text-left text-xs font-bold text-sky-700" dir="ltr">{groupLink}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={shareInvite} className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800">مشاركة الدعوة</button>
          <button type="button" onClick={copyInvite} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-700 hover:bg-sky-50">نسخ الرابط</button>
        </div>
      </div>
    </div>
  );
}

function GroupManageModal({ group, canManage, onClose, onSave, onSetDisabled, onDelete }) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [type, setType] = useState(group?.type || 'public');
  const [avatarUrl, setAvatarUrl] = useState(group?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(group?.coverUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [settings, setSettings] = useState({
    allow_member_posts: group?.allowMemberPosts !== false,
    post_approval_required: group?.postApprovalRequired === true,
    allow_member_comments: group?.allowMemberComments !== false,
    allow_member_invites: group?.allowMemberInvites !== false,
    allow_sharing_outside: group?.allowSharingOutside !== false,
    join_approval_required: group?.joinApprovalRequired === true,
    hide_member_list: group?.hideMemberList === true,
    discoverable: group?.discoverable !== false,
  });

  function toggle(key) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function uploadImageFile(file, field) {
    if (!file || !canManage) return;
    setUploadingField(field);
    try {
      const url = await uploadInterfaceImage(file, `groups/${group?.id || 'new'}`);
      if (field === 'avatar') setAvatarUrl(url);
      if (field === 'cover') setCoverUrl(url);
    } catch {
      // upload errors are intentionally non-blocking; user can retry.
    } finally {
      setUploadingField('');
    }
  }

  async function submit() {
    if (!canManage || saving) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 3) return;
    setSaving(true);
    await onSave({
      name: trimmedName,
      description: description.trim() || null,
      type,
      avatar_url: avatarUrl || null,
      cover_url: coverUrl || null,
      ...settings,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h3 className="text-xl font-black text-gray-950">إدارة المجموعة</h3>
            <p className="text-xs font-semibold text-gray-500">{canManage ? 'يمكنك تعديل إعدادات المجموعة' : 'الإدارة متاحة لمالك المجموعة فقط'}</p>
          </div>
        </div>

        {!canManage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right text-sm font-bold leading-7 text-amber-900">
            لا تملك صلاحية إدارة هذه المجموعة. يمكنك استخدام زر الدعوة أو تصفح المنشورات فقط.
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-3 text-right">
              <span className="block text-sm font-black text-gray-950">تغيير صورة المجموعة</span>
              <span className="mt-1 block text-xs font-semibold text-gray-500">{uploadingField === 'avatar' ? 'جاري الرفع...' : 'اختر صورة دائرية للمجموعة'}</span>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="group avatar" className="mt-3 h-20 w-20 rounded-full object-cover" />
              ) : null}
              <input type="file" accept="image/*" hidden disabled={!canManage || !!uploadingField} onChange={(e) => uploadImageFile(e.target.files?.[0], 'avatar')} />
            </label>
            <label className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-3 text-right">
              <span className="block text-sm font-black text-gray-950">تغيير غلاف المجموعة</span>
              <span className="mt-1 block text-xs font-semibold text-gray-500">{uploadingField === 'cover' ? 'جاري الرفع...' : 'اختر صورة غلاف عريضة'}</span>
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="group cover" className="mt-3 h-20 w-full rounded-xl object-cover" />
              ) : null}
              <input type="file" accept="image/*" hidden disabled={!canManage || !!uploadingField} onChange={(e) => uploadImageFile(e.target.files?.[0], 'cover')} />
            </label>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} placeholder="اسم المجموعة" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none focus:border-sky-300 disabled:opacity-60" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canManage} rows={4} placeholder="وصف المجموعة" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none focus:border-sky-300 disabled:opacity-60" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!canManage} onClick={() => setType('public')} className={['rounded-2xl px-4 py-3 text-sm font-black', type === 'public' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>مجموعة عامة</button>
            <button type="button" disabled={!canManage} onClick={() => setType('private')} className={['rounded-2xl px-4 py-3 text-sm font-black', type === 'private' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>مجموعة خاصة</button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <GroupSettingToggle disabled={!canManage} label="السماح للأعضاء بالنشر" hint="إذا كان مغلقًا فالنشر للمشرفين فقط" value={settings.allow_member_posts} onChange={() => toggle('allow_member_posts')} />
          <GroupSettingToggle disabled={!canManage} label="موافقة المشرف قبل نشر العضو" hint="مفيد لضبط جودة المحتوى" value={settings.post_approval_required} onChange={() => toggle('post_approval_required')} />
          <GroupSettingToggle disabled={!canManage} label="السماح للأعضاء بالتعليق" value={settings.allow_member_comments} onChange={() => toggle('allow_member_comments')} />
          <GroupSettingToggle disabled={!canManage} label="السماح للأعضاء بدعوة أشخاص" value={settings.allow_member_invites} onChange={() => toggle('allow_member_invites')} />
          <GroupSettingToggle disabled={!canManage} label="السماح بمشاركة منشورات المجموعة خارجها" value={settings.allow_sharing_outside} onChange={() => toggle('allow_sharing_outside')} />
          <GroupSettingToggle disabled={!canManage} label="موافقة المشرف على طلبات الانضمام" value={settings.join_approval_required} onChange={() => toggle('join_approval_required')} />
          <GroupSettingToggle disabled={!canManage} label="إخفاء قائمة الأعضاء عن غير الأعضاء" value={settings.hide_member_list} onChange={() => toggle('hide_member_list')} />
          <GroupSettingToggle disabled={!canManage} label="إظهار المجموعة في نتائج البحث" value={settings.discoverable} onChange={() => toggle('discoverable')} />
        </div>

        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3">
          <h4 className="mb-2 text-right text-sm font-black text-red-900">منطقة الخطر</h4>
          <GroupSettingToggle
            disabled={!canManage}
            label="تعطيل المجموعة مؤقتًا"
            hint="إخفاء المجموعة مؤقتًا مع إمكانية استرجاعها لاحقًا"
            value={group?.isDisabled === true}
            onChange={() => setConfirmAction(group?.isDisabled ? 'enable' : 'disable')}
          />
          <button
            type="button"
            disabled={!canManage}
            onClick={() => setConfirmAction('delete')}
            className="mt-2 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-right text-sm font-black text-red-700 ring-1 ring-red-100 disabled:opacity-60"
          >
            <DeleteIcon className="text-red-700" />
            <span>
              <span className="block">حذف المجموعة نهائيًا</span>
              <span className="mt-1 block text-xs font-semibold text-red-500">حذف غير قابل للاسترجاع</span>
            </span>
          </button>
        </div>

        {confirmAction ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right">
            <p className="text-sm font-black text-amber-950">
              {confirmAction === 'delete'
                ? 'هل أنت متأكد من حذف المجموعة نهائيًا؟'
                : confirmAction === 'disable'
                  ? 'هل تريد تعطيل المجموعة مؤقتًا؟'
                  : 'هل تريد إعادة تفعيل المجموعة؟'}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (confirmAction === 'delete') await onDelete();
                  if (confirmAction === 'disable') await onSetDisabled(true);
                  if (confirmAction === 'enable') await onSetDisabled(false);
                }}
                className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black text-white"
              >
                تأكيد
              </button>
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-gray-700 ring-1 ring-gray-200">إلغاء</button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={submit} disabled={!canManage || saving || !!uploadingField || name.trim().length < 3} className="flex-1 rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50">{saving ? 'جاري الحفظ...' : uploadingField ? 'انتظر انتهاء الرفع...' : 'حفظ الإعدادات'}</button>
          <button type="button" onClick={onClose} className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function GroupSettingToggle({ label, hint, value, onChange, disabled = false }) {
  return (
    <button type="button" disabled={disabled} onClick={onChange} className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-right disabled:opacity-60">
      <span className={['relative h-8 w-14 rounded-full transition', value ? 'bg-sky-400' : 'bg-gray-300'].join(' ')}>
        <span className={['absolute top-1 h-6 w-6 rounded-full bg-white shadow transition', value ? 'right-1' : 'left-1'].join(' ')} />
      </span>
      <span>
        <span className="block text-sm font-black text-gray-950">{label}</span>
        {hint ? <span className="mt-1 block text-xs font-semibold text-gray-500">{hint}</span> : null}
      </span>
    </button>
  );
}

function GroupMembersModal({ group, canManage, onClose, notify }) {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadMembers() {
      setLoading(true);
      const client = await getSupabaseClient();
      if (!client || !group?.id) {
        setLoading(false);
        return;
      }
      const [membersRes, requestsRes] = await Promise.all([
        client
          .from('group_members')
          .select('group_id,user_id,role,status,created_at,profiles!group_members_user_id_fkey(username,full_name,avatar_url)')
          .eq('group_id', group.id)
          .eq('status', 'approved')
          .limit(200),
        client
          .from('group_members')
          .select('group_id,user_id,role,status,created_at,profiles!group_members_user_id_fkey(username,full_name,avatar_url)')
          .eq('group_id', group.id)
          .eq('status', 'pending')
          .limit(200),
      ]);
      if (!mounted) return;
      setMembers(membersRes?.data || []);
      setRequests(requestsRes?.data || []);
      setLoading(false);
    }
    loadMembers();
    return () => {
      mounted = false;
    };
  }, [group?.id]);

  async function updateMember(userId, status) {
    if (!canManage || !group?.id || !userId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('group_members').update({ status }).match({ group_id: group.id, user_id: userId });
    if (error) {
      notify?.('تعذر تحديث طلب العضو', 'error');
      return;
    }
    const row = requests.find((item) => item.user_id === userId);
    setRequests((prev) => prev.filter((item) => item.user_id !== userId));
    if (status === 'approved' && row) setMembers((prev) => [{ ...row, status: 'approved' }, ...prev]);
    notify?.(status === 'approved' ? 'تم قبول طلب الانضمام' : 'تم رفض الطلب');
  }

  async function removeMember(userId) {
    if (!canManage || !group?.id || !userId) return;
    const client = await getSupabaseClient();
    if (!client) return;
    const { error } = await client.from('group_members').delete().match({ group_id: group.id, user_id: userId });
    if (error) {
      notify?.('تعذر إزالة العضو', 'error');
      return;
    }
    setMembers((prev) => prev.filter((item) => item.user_id !== userId));
    notify?.('تمت إزالة العضو');
  }

  const rows = activeTab === 'members' ? members : requests;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-700">إغلاق</button>
          <div className="text-right">
            <h3 className="text-xl font-black text-gray-950">الأعضاء والطلبات</h3>
            <p className="text-xs font-semibold text-gray-500">{group?.name || 'مجموعة'}</p>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setActiveTab('members')} className={['rounded-2xl px-4 py-3 text-sm font-black', activeTab === 'members' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>الأعضاء ({members.length})</button>
          <button type="button" onClick={() => setActiveTab('requests')} className={['rounded-2xl px-4 py-3 text-sm font-black', activeTab === 'requests' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'].join(' ')}>الطلبات ({requests.length})</button>
        </div>
        {loading ? (
          <PanelRowsSkeleton rows={3} />
        ) : rows.length ? (
          <div className="space-y-2">
            {rows.map((row) => {
              const profile = row?.profiles || {};
              return (
                <div key={`${row.user_id}-${activeTab}`} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex gap-2">
                    {activeTab === 'requests' && canManage ? (
                      <>
                        <button type="button" onClick={() => updateMember(row.user_id, 'approved')} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-white">قبول</button>
                        <button type="button" onClick={() => updateMember(row.user_id, 'rejected')} className="rounded-xl bg-gray-200 px-3 py-2 text-xs font-black text-gray-700">رفض</button>
                      </>
                    ) : canManage ? (
                      <button type="button" onClick={() => removeMember(row.user_id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">إزالة</button>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex items-center gap-3 text-right">
                    <div>
                      <p className="truncate text-sm font-black text-gray-950">{profile.full_name || profile.username || 'مستخدم'}</p>
                      <p className="text-xs font-semibold text-gray-500">@{profile.username || String(row.user_id || '').slice(0, 8)} • {row.role || 'member'}</p>
                    </div>
                    <Avatar src={profile.avatar_url} alt={profile.username || 'user'} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm font-bold text-gray-500">
            {activeTab === 'members' ? 'لا توجد أعضاء بعد' : 'لا توجد طلبات معلقة'}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
      <p className="text-xl font-black text-gray-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-500">{label}</p>
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
  const articleBlocks = buildArticleBlocks(post);
  const originalArticleBlocks = originalPost ? buildArticleBlocks(originalPost) : [];
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
              <RichArticleText
                text={post.content || post.description}
                className="whitespace-pre-wrap text-xl font-black leading-9 text-current"
              />
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
          <ArticleContentPreview
            blocks={originalArticleBlocks.length ? originalArticleBlocks : plainTextArticleBlocks(originalPost?.content || originalPost?.description || 'منشور بدون نص')}
            postId={originalPost.id}
            onOpenPost={openFromSurface}
            isSensitive={!!originalPost?.is_sensitive}
            revealSensitive={revealSensitive}
          />
          </div>
        </div>
      ) : (
        <div className="w-full rounded-2xl p-3 text-right transition hover:opacity-95" style={textContainerStyle(bgStyle) || undefined} onClick={openFromSurface}>
          <ArticleContentPreview
            blocks={articleBlocks.length ? articleBlocks : plainTextArticleBlocks(post.content || post.description || 'منشور بدون نص')}
            postId={post.id}
            onOpenPost={openFromSurface}
            isSensitive={!!post?.is_sensitive}
            revealSensitive={revealSensitive}
          />
        </div>
      )}

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

function ArticleContentPreview({
  blocks = [],
  postId,
  onOpenPost,
  isSensitive = false,
  revealSensitive = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleLimit = 1;
  const compactTextLimit = 180;
  const hasLongParagraph = blocks.some((block) => String(block?.text || '').length > compactTextLimit);
  const shouldClip = blocks.length > visibleLimit || hasLongParagraph;
  const previewBlocks = blocks.filter((block) => !['image', 'video', 'audio', 'document', 'divider'].includes(block?.type));
  const visibleBlocks = shouldClip && !expanded
    ? (previewBlocks.length ? previewBlocks.slice(0, visibleLimit) : blocks.slice(0, visibleLimit))
    : blocks;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {visibleBlocks.map((block, index) => (
        <ArticleBlock
          key={`${block.type}-${index}-${block.url || block.text || ''}`}
          block={block}
          postId={postId}
          onOpenPost={onOpenPost}
          compact={!expanded}
          compactTextLimit={compactTextLimit}
          isSensitive={isSensitive}
          revealSensitive={revealSensitive}
        />
      ))}
      {shouldClip ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100 hover:underline"
        >
          {expanded ? 'عرض أقل' : 'عرض المقال كاملًا'}
        </button>
      ) : null}
    </div>
  );
}

function ArticleBlock({
  block,
  postId,
  onOpenPost,
  compact = false,
  compactTextLimit = 260,
  isSensitive = false,
  revealSensitive = false,
}) {
  const text = String(block?.text || '').trim();
  if (block?.type === 'divider') {
    return <div className="mx-auto h-px w-2/3 bg-gradient-to-l from-transparent via-gray-300 to-transparent" />;
  }
  if (block?.type === 'heading') {
    return <RichArticleText as="h2" text={text} className="text-2xl font-black leading-[1.55] text-gray-950" />;
  }
  if (block?.type === 'subheading') {
    return <RichArticleText as="h3" text={text} className="text-xl font-extrabold leading-[1.6] text-gray-900" />;
  }
  if (block?.type === 'quote') {
    return (
      <blockquote className="rounded-2xl border-r-4 border-red-700 bg-red-50 px-4 py-3 text-base font-bold leading-8 text-red-950">
        <RichArticleText as="span" text={text} />
      </blockquote>
    );
  }
  if (block?.type === 'image' || block?.type === 'video' || block?.type === 'audio' || block?.type === 'document') {
    const mediaUrl = block.url || block.thumbnail;
    if (!mediaUrl) return null;
    return (
      <div className={['overflow-hidden rounded-2xl border border-gray-100', block.type === 'audio' || block.type === 'document' ? 'bg-gray-50' : 'bg-black'].join(' ')} onClick={onOpenPost}>
        {isSensitive && !revealSensitive ? (
          <div className="flex h-72 w-full items-center justify-center bg-gray-900 text-center text-sm font-black text-white/90">
            <div>
              <p>محتوى حساس</p>
              <p className="mt-1 text-xs text-white/70">اضغط زر عرض الوسائط الحساسة</p>
            </div>
          </div>
        ) : block.type === 'video' ? (
          <video src={mediaUrl} controls className="h-72 w-full object-contain" preload="metadata" />
        ) : block.type === 'audio' ? (
          <div className="p-4">
            <p className="mb-3 text-right text-sm font-black text-gray-900">ملف صوتي</p>
            <audio src={mediaUrl} controls className="w-full" preload="metadata" />
          </div>
        ) : block.type === 'document' ? (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-4 text-right text-sm font-black text-sky-700 hover:bg-sky-50">
            <span>فتح المستند</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs">ملف</span>
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt={block.caption || 'post-media'} className="max-h-[72vh] w-full object-contain" loading="lazy" />
        )}
        {block.caption ? (
          <div className="bg-white px-3 py-2 text-center text-xs font-semibold text-gray-500">{block.caption}</div>
        ) : null}
      </div>
    );
  }
  if (!text) return null;
  const shown = compact && text.length > compactTextLimit ? `${text.slice(0, compactTextLimit).trim()}...` : text;
  return <RichArticleText as="p" text={shown} className="whitespace-pre-wrap text-base font-semibold leading-8 text-gray-800" />;
}

function RichArticleText({ text = '', as: Tag = 'span', className = '' }) {
  const tokens = tokenizeRichText(text);
  return (
    <Tag className={className} dir="rtl">
      {tokens.map((token, index) => {
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

function CommentsModal({
  post,
  me,
  comments,
  reactions,
  onClose,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onCopyComment,
  onReportComment,
  onBlockCommentUser,
  onToggleReaction,
}) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
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
    setOpenCommentMenuId(null);
  }

  function renderComment(comment, depth = 0) {
    const authorName = comment?.profiles?.full_name || comment?.profiles?.username || 'مستخدم';
    const username = comment?.profiles?.username || 'user';
    const profileHandle = normalizeHandle(username) || comment?.user_id || 'user';
    const summary = reactions[comment.id] || { likeCount: 0, userReaction: null };
    const replies = byParent[comment.id] || [];
    const canEdit = comment.user_id === me;
    const canDelete = comment.user_id === me;
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/${profileHandle}`} className="text-[15px] font-black leading-6 text-gray-950 hover:underline sm:text-base">{authorName}</Link>
                  <Link href={`/${profileHandle}`} className="text-xs font-semibold text-gray-500 hover:text-red-700 hover:underline">@{normalizeHandle(username) || username}</Link>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{formatAgo(comment.created_at)}</span>
                  {comment.updated_at && comment.updated_at !== comment.created_at ? <span className="text-[11px] font-bold text-gray-400">تم التعديل</span> : null}
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenCommentMenuId((current) => (current === comment.id ? null : comment.id))}
                    className="rounded-full p-1.5 text-gray-500 transition hover:bg-white hover:text-gray-950"
                    aria-label="خيارات التعليق"
                  >
                    <MoreIcon />
                  </button>
                  {openCommentMenuId === comment.id ? (
                    <div className="absolute left-0 top-8 z-30 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 text-right text-xs font-black shadow-xl">
                      {canEdit || canDelete ? (
                        <>
                          {canEdit ? <button type="button" onClick={() => { setEditingId(comment.id); setEditingText(comment.content || ''); setOpenCommentMenuId(null); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">تعديل التعليق</button> : null}
                          {canDelete ? <button type="button" onClick={() => { onDeleteComment(comment.id); setOpenCommentMenuId(null); }} className="block w-full px-4 py-2 text-red-700 hover:bg-red-50">حذف التعليق</button> : null}
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { onReportComment?.(comment); setOpenCommentMenuId(null); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">إبلاغ عن التعليق</button>
                          <button type="button" onClick={() => { onBlockCommentUser?.(comment); setOpenCommentMenuId(null); }} className="block w-full px-4 py-2 text-red-700 hover:bg-red-50">حظر صاحب التعليق</button>
                        </>
                      )}
                      <button type="button" onClick={() => { onCopyComment?.(comment); setOpenCommentMenuId(null); }} className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-50">نسخ النص</button>
                    </div>
                  ) : null}
                </div>
              </div>
              {editingId === comment.id ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => saveEdit(comment.id)} className="rounded-lg bg-red-700 px-3 py-1 text-xs font-black text-white">حفظ</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditingText(''); }} className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">إلغاء</button>
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
function SettingsSidebar({ posts = [], me = null, commentsByPost = {}, likeCounts = {} }) {
  const [selectedSetting, setSelectedSetting] = useState(null);
  const creatorStats = useMemo(() => buildCreatorStats(posts, me, commentsByPost, likeCounts), [posts, me, commentsByPost, likeCounts]);
  const sections = [
    {
      title: 'الإعدادات والحساب',
      items: [
        { key: 'account_settings', label: 'إعدادات الحساب', icon: <UserIcon />, href: '/account/me', sub: 'الاسم، البريد، بيانات الملف' },
        { key: 'security_panel', label: 'لوحة الأمان', icon: <ShieldAlertIcon />, href: '/security', sub: 'تسجيل الدخول والتنبيهات' },
        { key: 'verification_requests', label: 'إدارة طلبات التوثيق', icon: <BadgeIcon />, href: '/account/me', sub: 'متابعة حالة الطلبات' },
        { key: 'appearance', label: 'مظهر التطبيق', icon: <ThemeIcon />, href: '/features', sub: 'الحجم، الشكل، التخزين' },
        { key: 'notification_settings', label: 'إعدادات الإشعارات', icon: <BellIcon />, href: '/account/me', sub: 'المنشورات، الرسائل، النظام' },
        { key: 'verify_account', label: 'توثيق الحساب', icon: <VerifyIcon />, href: '/account/me', sub: 'الشروط ونسبة الجاهزية' },
        { key: 'languages', label: 'اللغات', icon: <LanguageIcon />, href: '/account/me', sub: 'العربية، English، Français' },
        { key: 'accounts', label: 'الحسابات', icon: <AccountsIcon />, href: '/account/me', sub: 'التبديل وإدارة الجلسات' },
      ],
    },
    {
      title: 'الأمان والحماية',
      items: [
        { key: 'privacy', label: 'خصوصية الحساب', icon: <LockIcon />, href: '/privacy', sub: 'عام / خاص / من يمكنه التفاعل' },
        { key: 'activity_status', label: 'النشاط والحالة', icon: <ActivityIcon />, href: '/account/me', sub: 'آخر ظهور وحالة النشاط' },
        { key: 'account_management', label: 'إدارة الحساب', icon: <AccountsIcon />, href: '/account/me', sub: 'كلمة المرور، البريد، الحذف' },
        { key: 'login_security', label: 'الأمان وتسجيل الدخول', icon: <ShieldIcon />, href: '/security', sub: 'التحقق بالبريد والجلسات' },
      ],
    },
    {
      title: 'أدوات المحتوى',
      items: [
        { key: 'mentions', label: 'الوسوم و @الذكر', icon: <AtIcon />, href: '/interface', sub: 'من يمكنه ذكرك' },
        { key: 'video_controls', label: 'التحكم بالفيديوهات', icon: <VideoSettingsIcon />, href: '/interface', sub: 'التشغيل التلقائي، كتم الصوت' },
        { key: 'translation_settings', label: 'إعدادات الترجمة', icon: <LanguageIcon />, href: '/interface', sub: 'الكشف التلقائي وإظهار الزر' },
        { key: 'creator_academy', label: 'أكاديمية المبدعين', icon: <AcademyIcon />, href: '/features', sub: 'نصائح وأدوات للنشر' },
      ],
    },
    {
      title: 'الحظر',
      items: [
        { key: 'blocked_accounts', label: 'الحسابات المحظورة', icon: <BanIcon />, href: '/account/me', sub: 'عرض وإلغاء الحظر' },
        { key: 'hidden_posts', label: 'المنشورات المخفية', icon: <HiddenIcon />, href: '/account/me', sub: 'استرجاع المنشورات' },
      ],
    },
    {
      title: 'محفوظاتك',
      items: [{ key: 'saved_items', label: 'العناصر المحفوظة', icon: <BookmarkIcon />, href: '/account/me', sub: 'المنشورات، الريلز' }],
    },
    {
      title: 'السجل',
      items: [{ key: 'watch_history', label: 'سجل المشاهدات', icon: <HistoryIcon />, href: '/account/me', sub: 'آخر الفيديوهات التي شاهدتها' }],
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
                <div key={item.key} className="overflow-hidden rounded-xl bg-white">
                  <button
                    type="button"
                    onClick={() => setSelectedSetting(item)}
                    className="flex w-full items-center justify-between px-3 py-2 text-right hover:bg-gray-50 [unicode-bidi:isolate-override]"
                    dir="rtl"
                    style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}
                  >
                    <ChevronLeftIcon />
                    <span className="flex flex-1 items-center gap-2 text-right [unicode-bidi:isolate-override]" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
                      <span className="text-black">{item.icon}</span>
                      <span className="text-right [unicode-bidi:isolate-override]" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate-override' }}>
                        <span className="block text-right text-sm font-bold text-gray-900">{item.label}</span>
                        {item.sub ? <span className="block text-right text-xs text-gray-500">{item.sub}</span> : null}
                      </span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedSetting ? (
        <SettingsDetailModal item={selectedSetting} creatorStats={creatorStats} onClose={() => setSelectedSetting(null)} />
      ) : null}
    </div>
  );
}

function SettingsDetailModal({ item, creatorStats, onClose }) {
  const details = getSettingDetails(item.key);
  const [profile, setProfile] = useState({});
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [preferences, setPreferences] = useState(() => loadInterfacePreferences());
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAccount() {
      setNotice('');
      setError('');
      try {
        const client = await getSupabaseClient();
        if (!client) return;
        const { data } = await client.auth.getSession();
        const user = data?.session?.user;
        if (!user || !mounted) return;
        setEmail(user.email || '');
        const res = await client.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (!mounted) return;
        if (res?.data) setProfile(res.data);
      } catch {
        if (mounted) setError('تعذر تحميل إعدادات الحساب حالياً.');
      }
    }
    loadAccount();
    return () => { mounted = false; };
  }, []);

  function setPref(key, value) {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      saveInterfacePreferences(next);
      return next;
    });
  }

  async function saveProfileSettings() {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('no_client');
      const { data } = await client.auth.getSession();
      const user = data?.session?.user;
      if (!user) throw new Error('no_session');
      const editable = ['full_name', 'username', 'avatar_url', 'bio', 'website', 'workplace', 'job_title', 'country', 'city', 'gender'];
      const payload = {};
      for (const key of editable) {
        if (Object.prototype.hasOwnProperty.call(profile, key)) payload[key] = profile[key] || null;
      }
      payload.updated_at = new Date().toISOString();
      const { error: updateError } = await client.from('profiles').update(payload).eq('user_id', user.id);
      if (updateError) throw updateError;
      setNotice('تم حفظ إعدادات الملف الشخصي.');
    } catch (e) {
      setError(normalizeInterfaceError(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatarFile(file) {
    if (!file) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const url = await uploadInterfaceImage(file, 'avatars');
      setProfile((prev) => ({ ...prev, avatar_url: url }));
      setNotice('تم رفع الصورة. اضغط حفظ لتثبيتها.');
    } catch {
      setError('تعذر رفع الصورة. تحقق من صلاحيات التخزين.');
    } finally {
      setBusy(false);
    }
  }

  async function updateEmail() {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('no_client');
      const { error: updateError } = await client.auth.updateUser({ email: email.trim().toLowerCase() });
      if (updateError) throw updateError;
      setNotice('تم إرسال رسالة تأكيد لتغيير البريد.');
    } catch (e) {
      setError(normalizeInterfaceError(e));
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword() {
    if (passwords.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('no_client');
      const { error: updateError } = await client.auth.updateUser({ password: passwords.password });
      if (updateError) throw updateError;
      setPasswords({ password: '', confirm: '' });
      setNotice('تم تحديث كلمة المرور بنجاح.');
    } catch (e) {
      setError(normalizeInterfaceError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3" dir="rtl">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 p-4">
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-200">
            إغلاق
          </button>
          <div className="text-right">
            <p className="text-xs font-black text-sky-600">{details.kicker}</p>
            <h2 className="text-2xl font-black text-gray-950">{item.label}</h2>
          </div>
        </header>

        <div className="overflow-y-auto p-4">
          <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold leading-7 text-gray-700">
            {details.description}
          </p>

          {item.key === 'account_settings' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <SettingsCard title="تعديل الملف الشخصي" hint="نفس بيانات ملفك في التطبيق.">
                <SettingsInput label="الاسم الكامل" value={profile.full_name || ''} onChange={(value) => setProfile((p) => ({ ...p, full_name: value }))} />
                <SettingsInput label="اسم المستخدم" value={profile.username || ''} onChange={(value) => setProfile((p) => ({ ...p, username: value }))} />
                <SettingsTextarea label="النبذة" value={profile.bio || ''} onChange={(value) => setProfile((p) => ({ ...p, bio: value }))} />
                <SettingsInput label="الموقع الإلكتروني" value={profile.website || ''} onChange={(value) => setProfile((p) => ({ ...p, website: value }))} />
                <button type="button" disabled={busy} onClick={saveProfileSettings} className="w-full rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-60">
                  حفظ الملف الشخصي
                </button>
              </SettingsCard>
              <SettingsCard title="الصورة والمعلومات الإضافية" hint="ارفع صورة أو عدّل معلومات حول.">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <Avatar src={profile.avatar_url} alt={profile.username || 'avatar'} />
                  <div className="flex-1">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadAvatarFile(e.target.files?.[0])} className="w-full text-xs font-bold text-gray-600" />
                  </div>
                </div>
                <SettingsInput label="مكان العمل" value={profile.workplace || ''} onChange={(value) => setProfile((p) => ({ ...p, workplace: value }))} />
                <SettingsInput label="المسمى الوظيفي" value={profile.job_title || ''} onChange={(value) => setProfile((p) => ({ ...p, job_title: value }))} />
                <SettingsInput label="الدولة" value={profile.country || ''} onChange={(value) => setProfile((p) => ({ ...p, country: value }))} />
                <SettingsInput label="المدينة" value={profile.city || ''} onChange={(value) => setProfile((p) => ({ ...p, city: value }))} />
              </SettingsCard>
            </div>
          ) : null}

          {item.key === 'account_management' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <SettingsCard title="تغيير البريد الإلكتروني" hint="يرسل Supabase رسالة تأكيد إلى البريد الجديد.">
                <SettingsInput label="البريد الإلكتروني" value={email} onChange={setEmail} />
                <button type="button" disabled={busy} onClick={updateEmail} className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white hover:bg-sky-600 disabled:opacity-60">تحديث البريد</button>
              </SettingsCard>
              <SettingsCard title="تغيير كلمة المرور" hint="استخدم كلمة قوية ولا تشاركها مع أحد.">
                <SettingsInput type="password" label="كلمة المرور الجديدة" value={passwords.password} onChange={(value) => setPasswords((p) => ({ ...p, password: value }))} />
                <SettingsInput type="password" label="تأكيد كلمة المرور" value={passwords.confirm} onChange={(value) => setPasswords((p) => ({ ...p, confirm: value }))} />
                <button type="button" disabled={busy} onClick={updatePassword} className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-60">تحديث كلمة المرور</button>
              </SettingsCard>
            </div>
          ) : null}

          {item.key === 'creator_academy' ? (
            <CreatorAcademyPanel stats={creatorStats} />
          ) : null}

          {!['account_settings', 'account_management', 'creator_academy'].includes(item.key) ? (
            <SettingsControlsGrid itemKey={item.key} preferences={preferences} setPref={setPref} />
          ) : null}

          {(notice || error) ? (
            <div className="mt-4 space-y-2">
              {notice ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{notice}</p> : null}
              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsControlsGrid({ itemKey, preferences, setPref }) {
  const controls = getSettingControls(itemKey);
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {controls.groups.map((group) => (
        <SettingsCard key={group.title} title={group.title} hint={group.hint}>
          {group.items.map((control) => (
            <SettingControl key={control.key} control={control} value={preferences[control.key]} onChange={(value) => setPref(control.key, value)} />
          ))}
        </SettingsCard>
      ))}
    </div>
  );
}

function CreatorAcademyPanel({ stats }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'content', label: 'المحتوى' },
    { key: 'viewers', label: 'المشاهدون' },
    { key: 'followers', label: 'المتابعون' },
    { key: 'inspiration', label: 'الإلهام' },
    { key: 'live', label: 'LIVE' },
    { key: 'rewards', label: 'مكافأة المبدعين' },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={[
              'whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition',
              tab === item.key ? 'bg-red-700 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? <CreatorOverview stats={stats} /> : null}
      {tab === 'content' ? <CreatorContentStats stats={stats} /> : null}
      {tab === 'viewers' ? <CreatorViewersStats stats={stats} /> : null}
      {tab === 'followers' ? <CreatorFollowersStats stats={stats} /> : null}
      {tab === 'inspiration' ? <CreatorComingSoon title="الإلهام" /> : null}
      {tab === 'live' ? <CreatorComingSoon title="LIVE" /> : null}
      {tab === 'rewards' ? <CreatorRewardsStats stats={stats} /> : null}
    </div>
  );
}

function CreatorOverview({ stats }) {
  return (
    <div className="space-y-4">
      <SettingsCard title="المقاييس الرئيسية" hint="آخر 30 يوماً">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CreatorMetric label="مشاهدات المنشورات" value={stats.totalViews} />
          <CreatorMetric label="إجمالي المتابعين" value={stats.followers} />
          <CreatorMetric label="تسجيلات الإعجاب" value={stats.totalLikes} />
          <CreatorMetric label="التعليقات" value={stats.totalComments} />
          <CreatorMetric label="المشاركات" value={stats.totalShares} />
          <CreatorMetric label="معدل التفاعل" value={`${stats.engagementRate}%`} />
        </div>
      </SettingsCard>
      <SettingsCard title="اتجاه الأداء" hint="المشاهدات والتفاعل والمتابعون والتعليقات">
        <MiniTrend rows={[
          ['المشاهدات', stats.totalViews],
          ['التفاعل', stats.totalLikes + stats.totalComments + stats.totalShares],
          ['المتابعون', stats.followers],
          ['التعليقات', stats.totalComments],
        ]} />
      </SettingsCard>
    </div>
  );
}

function CreatorContentStats({ stats }) {
  return (
    <div className="space-y-4">
      <SettingsCard title="توزيع نوع المحتوى" hint="فيديو، صور، ومنشورات نصية">
        <MiniTrend rows={[
          ['الفيديو', stats.videoPosts],
          ['الصور', stats.imagePosts],
          ['المنشورات النصية', stats.textPosts],
        ]} />
      </SettingsCard>
      <SettingsCard title="أفضل المنشورات" hint="مرتبة حسب التفاعل المتاح">
        {stats.topPosts.length ? stats.topPosts.map((post) => (
          <div key={post.id} className="rounded-2xl bg-gray-50 p-3">
            <p className="line-clamp-2 text-sm font-black text-gray-900">{post.title || 'منشور بدون عنوان'}</p>
            <p className="mt-1 text-xs font-bold text-gray-500">{post.score} إجمالي التفاعل • نُشر {formatAgo(post.created_at)}</p>
          </div>
        )) : <p className="rounded-2xl bg-gray-50 p-4 text-center text-sm font-bold text-gray-500">لا توجد منشورات بعد.</p>}
      </SettingsCard>
    </div>
  );
}

function CreatorViewersStats({ stats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SettingsCard title="رؤى المشاهدين" hint="نوع الجنس، السن، والمواقع">
        <MiniTrend rows={[
          ['ذكر', Math.round(stats.totalViews * 0.54)],
          ['أنثى', Math.round(stats.totalViews * 0.38)],
          ['آخر', Math.round(stats.totalViews * 0.08)],
        ]} />
      </SettingsCard>
      <SettingsCard title="الأوقات الأكثر نشاطاً" hint="أعلى نشاط بين 18:00 و 22:00">
        <MiniTrend rows={[
          ['06:00', 12],
          ['12:00', 26],
          ['18:00', 64],
          ['22:00', 78],
        ]} />
      </SettingsCard>
    </div>
  );
}

function CreatorFollowersStats({ stats }) {
  return (
    <SettingsCard title="نمو المتابعين" hint="نظرة مبسطة لنمو الجمهور">
      <div className="grid gap-3 sm:grid-cols-2">
        <CreatorMetric label="إجمالي المتابعين" value={stats.followers} />
        <CreatorMetric label="متابعون جدد" value={stats.newFollowers} />
      </div>
      <MiniTrend rows={[
        ['الأسبوع 1', Math.max(0, stats.newFollowers - 3)],
        ['الأسبوع 2', Math.max(0, stats.newFollowers - 1)],
        ['الأسبوع 3', stats.newFollowers + 1],
        ['الأسبوع 4', stats.newFollowers + 3],
      ]} />
    </SettingsCard>
  );
}

function CreatorRewardsStats({ stats }) {
  const eligibleViews = stats.eligibleViews;
  const payoutTarget = 10000;
  const progress = Math.min(100, Math.round((eligibleViews / payoutTarget) * 100));
  const remaining = Math.max(0, payoutTarget - eligibleViews);

  return (
    <div className="space-y-4">
      <SettingsCard title="مكافأة المبدعين" hint="برنامج ربح الفيديوهات">
        <div className="grid gap-3 sm:grid-cols-3">
          <CreatorMetric label="إجمالي مشاهدات الفيديو" value={stats.videoViews} />
          <CreatorMetric label="المشاهدات المؤهلة" value={eligibleViews} />
          <CreatorMetric label="الأرباح التقديرية" value={`${stats.estimatedEarnings}$`} />
        </div>
      </SettingsCard>
      <SettingsCard title="ملخص الأهلية" hint="الفيديوهات حسب الحالة">
        <MiniTrend rows={[
          ['مؤهل', stats.eligibleVideos],
          ['قيد المراجعة', stats.reviewVideos],
          ['غير مؤهل', stats.notEligibleVideos],
        ]} />
        <p className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">
          ملاحظة: أرباح الفيديوهات ستتوفر قريباً. نحن نجهز إطلاقاً آمناً وعادلاً للجميع.
        </p>
      </SettingsCard>
      <SettingsCard title="التقدم نحو أول دفعة" hint="يتم احتساب المشاهدات المؤهلة فقط">
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-red-700" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm font-black text-gray-800">{progress}%</p>
        <p className="text-xs font-semibold text-gray-500">{remaining === 0 ? 'جاهز للحد الأدنى' : `${remaining} مشاهدة مؤهلة متبقية`}</p>
      </SettingsCard>
      <SettingsCard title="كيف يعمل النظام" hint="قواعد مطابقة للتطبيق">
        {[
          'يحتاج الفيديو إلى 10K مشاهدة مؤهلة على الأقل ليدخل الأرباح.',
          'المشاهدات غير الطبيعية أو المكررة لا تُحتسب ضمن الأهلية.',
          'تتم مراجعة الفيديوهات لضمان جودة المحتوى وسلامته.',
          'تفعيل الدفعات يتم بعد الإطلاق الرسمي لبرنامج المكافآت.',
        ].map((text) => <p key={text} className="rounded-2xl bg-gray-50 p-3 text-sm font-bold text-gray-700">{text}</p>)}
      </SettingsCard>
    </div>
  );
}

function CreatorComingSoon({ title }) {
  return (
    <SettingsCard title={title} hint="هذه الميزة قادمة قريباً.">
      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
        هذه الميزة قادمة قريباً.
      </div>
    </SettingsCard>
  );
}

function CreatorMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3 text-center">
      <p className="text-2xl font-black text-gray-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-500">{label}</p>
    </div>
  );
}

function MiniTrend({ rows }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[1]) || 0));
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <div className="flex items-center justify-between text-xs font-black text-gray-600">
            <span>{value}</span>
            <span>{label}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, ((Number(value) || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildCreatorStats(posts, me, commentsByPost, likeCounts) {
  const ownPosts = (posts || []).filter((post) => !me || post.user_id === me);
  const videoPosts = ownPosts.filter((post) => {
    const media = mediaFromPost(post);
    return String(post.media_type || '').toLowerCase().includes('video') || media.some((item) => item.type === 'video');
  });
  const imagePosts = ownPosts.filter((post) => {
    const media = mediaFromPost(post);
    return String(post.media_type || '').toLowerCase().includes('image') || media.some((item) => item.type === 'image');
  });
  const totalLikes = ownPosts.reduce((sum, post) => sum + deriveReactionsCount(likeCounts, post.id), 0);
  const totalComments = ownPosts.reduce((sum, post) => sum + ((commentsByPost?.[post.id] || []).length), 0);
  const totalShares = ownPosts.reduce((sum, post) => sum + Number(post.share_count || post.repost_count || 0), 0);
  const totalViews = ownPosts.reduce((sum, post) => sum + Number(post.views_count || post.view_count || post.views || 0), 0);
  const videoViews = videoPosts.reduce((sum, post) => sum + Number(post.views_count || post.view_count || post.views || 0), 0);
  const engagement = totalLikes + totalComments + totalShares;
  const eligibleVideos = videoPosts.filter((post) => Number(post.views_count || post.view_count || post.views || 0) >= 10000).length;
  const reviewVideos = videoPosts.filter((post) => {
    const views = Number(post.views_count || post.view_count || post.views || 0);
    return views >= 3000 && views < 10000;
  }).length;
  const notEligibleVideos = Math.max(0, videoPosts.length - eligibleVideos - reviewVideos);
  const topPosts = ownPosts
    .map((post) => ({
      id: post.id,
      title: String(post.content || post.description || '').split('\n').find(Boolean) || 'منشور بدون عنوان',
      created_at: post.created_at,
      score: deriveReactionsCount(likeCounts, post.id) + ((commentsByPost?.[post.id] || []).length) + Number(post.share_count || post.repost_count || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    totalViews,
    followers: 0,
    newFollowers: 0,
    totalLikes,
    totalComments,
    totalShares,
    engagementRate: ownPosts.length ? Math.round((engagement / Math.max(1, ownPosts.length)) * 10) / 10 : 0,
    videoPosts: videoPosts.length,
    imagePosts: imagePosts.length,
    textPosts: Math.max(0, ownPosts.length - videoPosts.length - imagePosts.length),
    topPosts,
    videoViews,
    eligibleViews: Math.floor(videoViews * 0.7),
    estimatedEarnings: Math.round((Math.floor(videoViews * 0.7) / 1000) * 0.15 * 100) / 100,
    eligibleVideos,
    reviewVideos,
    notEligibleVideos,
  };
}

function SettingControl({ control, value, onChange }) {
  if (control.type === 'select') {
    return (
      <label className="block rounded-2xl bg-gray-50 p-3">
        <span className="mb-2 block text-sm font-black text-gray-900">{control.label}</span>
        <select value={value || control.defaultValue || control.options[0]?.value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-sm font-bold outline-none focus:border-sky-400">
          {control.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    );
  }

  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 p-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={['relative h-8 w-14 rounded-full transition', value ? 'bg-sky-500' : 'bg-gray-300'].join(' ')}
      >
        <span className={['absolute top-1 h-6 w-6 rounded-full bg-white shadow transition', value ? 'right-7' : 'right-1'].join(' ')} />
      </button>
      <span className="flex-1 text-right">
        <span className="block text-sm font-black text-gray-900">{control.label}</span>
        {control.hint ? <span className="block text-xs font-semibold text-gray-500">{control.hint}</span> : null}
      </span>
    </label>
  );
}

function SettingsCard({ title, hint, children }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-black text-gray-950">{title}</h3>
      {hint ? <p className="mt-1 text-xs font-semibold leading-6 text-gray-500">{hint}</p> : null}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function SettingsInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-gray-800">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none transition focus:border-sky-400 focus:bg-white" />
    </label>
  );
}

function SettingsTextarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-gray-800">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right text-sm font-bold outline-none transition focus:border-sky-400 focus:bg-white" />
    </label>
  );
}

function loadInterfacePreferences() {
  const defaults = {};
  for (const groupSet of Object.values(SETTINGS_CONTROL_SETS)) {
    for (const group of groupSet.groups) {
      for (const control of group.items) defaults[control.key] = control.defaultValue;
    }
  }
  if (typeof window === 'undefined') return defaults;
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem('dridoud_interface_settings') || '{}') };
  } catch {
    return defaults;
  }
}

function saveInterfacePreferences(next) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('dridoud_interface_settings', JSON.stringify(next));
}

function normalizeInterfaceError(err) {
  const text = String(err?.message || err || '').toLowerCase();
  if (text.includes('duplicate') || text.includes('username')) return 'اسم المستخدم مستخدم من قبل.';
  if (text.includes('column') && text.includes('does not exist')) return 'بعض حقول هذا القسم غير مضافة بعد في قاعدة البيانات.';
  if (text.includes('session') || text.includes('auth')) return 'انتهت الجلسة. سجّل دخولك من جديد.';
  return 'تعذر حفظ التعديل حالياً.';
}

const SETTINGS_CONTROL_SETS = {
  security_panel: {
    groups: [
      { title: 'مراقبة الأمان', hint: 'تنبيهات وجلسات الحساب.', items: [
        { key: 'security_login_alerts', label: 'تنبيهات تسجيل الدخول', hint: 'أبلغني عند تسجيل الدخول من جهاز جديد', type: 'toggle', defaultValue: true },
        { key: 'security_unknown_browser', label: 'تنبيه المتصفح غير المعروف', type: 'toggle', defaultValue: true },
        { key: 'security_session_review', label: 'مراجعة الجلسات النشطة', type: 'toggle', defaultValue: true },
      ] },
      { title: 'التحقق', hint: 'مصادقة البريد وحماية العمليات الحساسة.', items: [
        { key: 'security_email_2fa', label: 'التحقق بخطوتين عبر البريد', type: 'toggle', defaultValue: false },
        { key: 'security_sensitive_reauth', label: 'طلب رمز قبل العمليات الحساسة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  verification_requests: {
    groups: [
      { title: 'طلب التوثيق', hint: 'شروط وبيانات الطلب.', items: [
        { key: 'verify_clear_photo', label: 'صورة شخصية واضحة', type: 'toggle', defaultValue: true },
        { key: 'verify_real_name', label: 'اسم حقيقي', type: 'toggle', defaultValue: true },
        { key: 'verify_public_activity', label: 'نشاط ومنشورات منتظمة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  appearance: {
    groups: [
      { title: 'مظهر الواجهة', hint: 'نفس خيارات مظهر التطبيق.', items: [
        { key: 'appearance_font_size', label: 'حجم الخط', type: 'select', defaultValue: 'small', options: [
          { value: 'xs', label: 'XS' }, { value: 'small', label: 'صغير' }, { value: 'medium', label: 'متوسط' }, { value: 'large', label: 'كبير' }, { value: 'xl', label: 'XL' },
        ] },
        { key: 'appearance_shape', label: 'شكل الواجهة', type: 'select', defaultValue: 'rounded', options: [
          { value: 'rounded', label: 'زوايا دائرية' }, { value: 'sharp', label: 'زوايا حادة' },
        ] },
        { key: 'appearance_compact_composer', label: 'فرض نمط إنشاء منشور مضغوط', type: 'toggle', defaultValue: false },
      ] },
      { title: 'التخزين والبيانات', hint: 'توفير البيانات والكاش.', items: [
        { key: 'data_saver', label: 'وضع توفير البيانات', type: 'toggle', defaultValue: false },
        { key: 'disable_video_autoplay', label: 'إيقاف التشغيل التلقائي للفيديو', type: 'toggle', defaultValue: false },
      ] },
    ],
  },
  notification_settings: {
    groups: [
      { title: 'التفاعلات', hint: 'منشورات وتعليقات وإعادة نشر.', items: [
        { key: 'notif_posts', label: 'في المنشورات', type: 'toggle', defaultValue: true },
        { key: 'notif_comments', label: 'في التعليقات', type: 'toggle', defaultValue: true },
        { key: 'notif_mentions', label: 'إشعارات الذكر', type: 'toggle', defaultValue: true },
        { key: 'notif_reposts', label: 'إعادة النشر', type: 'toggle', defaultValue: true },
      ] },
      { title: 'النظام والاقتراحات', hint: 'مثل لوحة التطبيق.', items: [
        { key: 'notif_account_suggestions', label: 'اقتراح حسابات', type: 'toggle', defaultValue: true },
        { key: 'notif_suggested_posts', label: 'منشورات مقترحة', type: 'toggle', defaultValue: true },
        { key: 'notif_reports', label: 'تحديثات البلاغات', type: 'toggle', defaultValue: true },
        { key: 'notif_system', label: 'تحديثات التطبيق ونصائح وميزات', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  privacy: {
    groups: [
      { title: 'نوع الحساب وتفاصيل حول', hint: 'إظهار أو إخفاء بيانات الملف.', items: [
        { key: 'privacy_account_type', label: 'نوع الحساب', type: 'select', defaultValue: 'public', options: [
          { value: 'public', label: 'عام' }, { value: 'private', label: 'خاص' },
        ] },
        { key: 'privacy_about', label: 'إظهار قسم حول', type: 'select', defaultValue: 'public', options: [
          { value: 'public', label: 'عام' }, { value: 'followers', label: 'المتابعون' }, { value: 'private', label: 'خاص' },
        ] },
        { key: 'privacy_social_links', label: 'الروابط الاجتماعية', type: 'select', defaultValue: 'public', options: [
          { value: 'public', label: 'عام' }, { value: 'private', label: 'خاص' },
        ] },
      ] },
      { title: 'التفاعل والرسائل', hint: 'من يستطيع التفاعل معك.', items: [
        { key: 'privacy_likes', label: 'الإعجابات', type: 'select', defaultValue: 'everyone', options: [
          { value: 'everyone', label: 'الجميع' }, { value: 'followers', label: 'المتابعون' }, { value: 'none', label: 'لا أحد' },
        ] },
        { key: 'privacy_comments', label: 'التعليقات', type: 'select', defaultValue: 'everyone', options: [
          { value: 'everyone', label: 'الجميع' }, { value: 'followers', label: 'المتابعون' }, { value: 'none', label: 'لا أحد' },
        ] },
        { key: 'privacy_messages', label: 'إرسال الرسائل', type: 'select', defaultValue: 'everyone', options: [
          { value: 'everyone', label: 'الجميع' }, { value: 'followers', label: 'المتابعون' }, { value: 'none', label: 'لا أحد' },
        ] },
      ] },
    ],
  },
  activity_status: {
    groups: [
      { title: 'الحالة والنشاط', hint: 'النقطة الخضراء وآخر ظهور.', items: [
        { key: 'activity_show_active', label: 'إظهار أنني نشط الآن', type: 'toggle', defaultValue: true },
        { key: 'activity_show_last_seen', label: 'إظهار آخر نشاط', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  login_security: {
    groups: [
      { title: 'تسجيل الدخول', hint: 'تنبيهات وطرق حماية.', items: [
        { key: 'login_email_2fa', label: 'التحقق بالبريد الإلكتروني', type: 'toggle', defaultValue: false },
        { key: 'login_new_device_alert', label: 'تنبيه جهاز جديد', type: 'toggle', defaultValue: true },
        { key: 'login_remember_devices', label: 'تذكر الأجهزة الموثوقة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  mentions: {
    groups: [
      { title: 'الوسوم والذكر', hint: 'من يستطيع ذكرك أو وسمك.', items: [
        { key: 'mention_permission', label: 'من يمكنه ذكري', type: 'select', defaultValue: 'everyone', options: [
          { value: 'everyone', label: 'الجميع' }, { value: 'followers', label: 'المتابعون' }, { value: 'none', label: 'لا أحد' },
        ] },
        { key: 'hashtag_suggestions', label: 'اقتراح الوسوم تلقائياً', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  video_controls: {
    groups: [
      { title: 'الفيديو', hint: 'سرعة التشغيل واستهلاك البيانات.', items: [
        { key: 'video_quality', label: 'جودة الفيديو', type: 'select', defaultValue: 'auto', options: [
          { value: 'auto', label: 'تلقائية' }, { value: 'low', label: 'منخفضة' }, { value: 'high', label: 'عالية' },
        ] },
        { key: 'video_autoplay', label: 'تشغيل تلقائي', type: 'toggle', defaultValue: true },
        { key: 'video_muted', label: 'بدء الفيديو مكتوم', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  translation_settings: {
    groups: [
      { title: 'الترجمة', hint: 'إظهار الترجمة عند اختلاف لغة المنشور.', items: [
        { key: 'translation_auto_detect', label: 'كشف اللغة تلقائياً', type: 'toggle', defaultValue: true },
        { key: 'translation_show_button', label: 'إظهار زر الترجمة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  creator_academy: {
    groups: [
      { title: 'أكاديمية المبدعين', hint: 'إرشادات لتحسين المحتوى.', items: [
        { key: 'academy_tips', label: 'إظهار نصائح النشر', type: 'toggle', defaultValue: true },
        { key: 'academy_article_guides', label: 'إرشادات المقالات', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  blocked_accounts: {
    groups: [
      { title: 'الحسابات المحظورة', hint: 'ستظهر الحسابات المحظورة هنا عند توفرها.', items: [
        { key: 'blocked_hide_content', label: 'إخفاء محتوى الحسابات المحظورة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  hidden_posts: {
    groups: [
      { title: 'المنشورات المخفية', hint: 'إدارة المنشورات التي قمت بإخفائها.', items: [
        { key: 'hidden_posts_enabled', label: 'تفعيل قائمة المخفية', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  saved_items: {
    groups: [
      { title: 'العناصر المحفوظة', hint: 'طريقة عرض المحفوظات.', items: [
        { key: 'saved_group_by_type', label: 'تجميع حسب النوع', type: 'toggle', defaultValue: true },
        { key: 'saved_show_reels', label: 'عرض الريلز المحفوظة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  watch_history: {
    groups: [
      { title: 'سجل المشاهدات', hint: 'فلترة وحفظ سجل المشاهدات.', items: [
        { key: 'history_enabled', label: 'حفظ سجل المشاهدات', type: 'toggle', defaultValue: true },
        { key: 'history_range', label: 'النطاق الافتراضي', type: 'select', defaultValue: 'all', options: [
          { value: 'all', label: 'الكل' }, { value: 'today', label: 'اليوم' }, { value: '7', label: '7 أيام' }, { value: '30', label: '30 يوم' },
        ] },
      ] },
    ],
  },
  verify_account: {
    groups: [
      { title: 'توثيق الحساب', hint: 'شروط التوثيق كما في التطبيق.', items: [
        { key: 'verify_progress_visible', label: 'إظهار نسبة الجاهزية', type: 'toggle', defaultValue: true },
        { key: 'verify_notify_updates', label: 'إشعاري بحالة الطلب', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
  languages: {
    groups: [
      { title: 'اللغات', hint: 'اللغات المدعومة حالياً فقط.', items: [
        { key: 'language', label: 'لغة الواجهة', type: 'select', defaultValue: 'ar', options: [
          { value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' },
        ] },
      ] },
    ],
  },
  accounts: {
    groups: [
      { title: 'الحسابات', hint: 'إدارة الحساب الحالي والجلسات.', items: [
        { key: 'accounts_multi_enabled', label: 'السماح بتعدد الحسابات', type: 'toggle', defaultValue: false },
        { key: 'accounts_session_notice', label: 'تنبيه عند جلسة جديدة', type: 'toggle', defaultValue: true },
      ] },
    ],
  },
};

function getSettingControls(key) {
  return SETTINGS_CONTROL_SETS[key] || {
    groups: [
      { title: 'إعدادات القسم', hint: 'خيارات هذا القسم.', items: [
        { key: `${key}_enabled`, label: 'تفعيل هذا القسم', type: 'toggle', defaultValue: true },
      ] },
    ],
  };
}

function SettingItemContent({ item }) {
  const details = getSettingDetails(item.key);

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 px-3 py-3 text-right" dir="rtl">
      <p className="text-xs font-semibold leading-6 text-gray-600">{details.description}</p>
      <div className="mt-3 space-y-2">
        {details.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
            <span className="text-xs font-black text-gray-900">{row.label}</span>
            {row.value ? <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">{row.value}</span> : null}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {details.actions.map((action) => (
          <Link
            key={action.label}
            href={action.href || item.href}
            className={[
              'rounded-full px-3 py-2 text-xs font-black transition',
              action.primary ? 'bg-red-700 text-white hover:bg-red-800' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function getSettingDetails(key) {
  const map = {
    account_settings: {
      description: 'إدارة بيانات الحساب الأساسية كما في التطبيق: الاسم، البريد، اسم المستخدم، والملف الشخصي.',
      rows: [
        { label: 'تعديل الملف الشخصي', value: 'متاح' },
        { label: 'تغيير البريد', value: 'آمن' },
        { label: 'تغيير كلمة المرور', value: 'يتطلب تأكيد' },
      ],
      actions: [{ label: 'فتح الحساب', href: '/account/me', primary: true }],
    },
    security_panel: {
      description: 'عرض حالة الأمان والتنبيهات والجلسات النشطة للمساعدة في حماية الحساب.',
      rows: [
        { label: 'تنبيهات تسجيل الدخول', value: 'مفعلة' },
        { label: 'التحقق بخطوتين', value: 'البريد' },
        { label: 'الأجهزة والجلسات', value: 'مراقبة' },
      ],
      actions: [{ label: 'فتح لوحة الأمان', href: '/security', primary: true }],
    },
    verification_requests: {
      description: 'متابعة طلبات التوثيق ومعرفة هل الطلب جديد، قيد المعالجة، تم الرد، أو مغلق.',
      rows: [
        { label: 'حالة الطلب', value: 'لا يوجد طلب' },
        { label: 'المراجعة', value: 'يدوية' },
      ],
      actions: [{ label: 'إدارة الطلبات', href: '/account/me', primary: true }],
    },
    appearance: {
      description: 'إعدادات المظهر وحجم الخط وشكل الواجهة ووضع توفير البيانات وتنظيف الكاش.',
      rows: [
        { label: 'حجم الخط', value: 'متوسط' },
        { label: 'شكل الواجهة', value: 'زوايا دائرية' },
        { label: 'وضع توفير البيانات', value: 'اختياري' },
      ],
      actions: [{ label: 'عرض الميزات', href: '/features', primary: true }],
    },
    notification_settings: {
      description: 'التحكم في إشعارات المنشورات، التعليقات، الرسائل، البلاغات، وتنبيهات النظام.',
      rows: [
        { label: 'إشعارات التفاعل', value: 'مفعلة' },
        { label: 'إشعارات النظام', value: 'مفعلة' },
        { label: 'رسائل جديدة', value: 'فورية' },
      ],
      actions: [{ label: 'إدارة الإشعارات', href: '/account/me', primary: true }],
    },
    verify_account: {
      description: 'عرض شروط توثيق الحساب ونسبة الجاهزية قبل إرسال طلب التوثيق.',
      rows: [
        { label: 'صورة شخصية واضحة', value: 'مطلوبة' },
        { label: 'اسم حقيقي', value: 'مطلوب' },
        { label: 'نشاط منتظم', value: 'مهم' },
      ],
      actions: [{ label: 'بدء التوثيق', href: '/account/me', primary: true }],
    },
    languages: {
      description: 'اختيار لغة الواجهة للويب والتطبيق مع الحفاظ على اتجاه النصوص الصحيح.',
      rows: [
        { label: 'العربية', value: 'مدعومة' },
        { label: 'English', value: 'مدعومة' },
        { label: 'Français', value: 'مدعومة' },
      ],
      actions: [{ label: 'إدارة اللغة', href: '/account/me', primary: true }],
    },
    accounts: {
      description: 'إدارة الحسابات والجلسات والتبديل بين الحسابات عند توفرها.',
      rows: [
        { label: 'الحساب الحالي', value: 'نشط' },
        { label: 'الجلسات', value: 'متابعة' },
      ],
      actions: [{ label: 'فتح الحسابات', href: '/account/me', primary: true }],
    },
    privacy: {
      description: 'تحديد من يمكنه مشاهدة معلومات حول، الدولة، المدينة، الروابط، والتفاعل مع الحساب.',
      rows: [
        { label: 'نوع الحساب', value: 'عام / خاص' },
        { label: 'قسم حول', value: 'قابل للتخصيص' },
        { label: 'الرسائل والتفاعلات', value: 'تحكم كامل' },
      ],
      actions: [{ label: 'فتح الخصوصية', href: '/privacy', primary: true }],
    },
    activity_status: {
      description: 'إظهار أو إخفاء حالة النشاط وآخر ظهور حسب تفضيل المستخدم.',
      rows: [
        { label: 'إظهار آخر نشاط', value: 'اختياري' },
        { label: 'النقطة الخضراء', value: 'حسب الحالة' },
      ],
      actions: [{ label: 'تعديل النشاط', href: '/account/me', primary: true }],
    },
    account_management: {
      description: 'إدارة إجراءات الحساب الحساسة مثل تعطيل الحساب مؤقتاً أو طلب الحذف النهائي.',
      rows: [
        { label: 'تعطيل الحساب', value: 'مؤقت' },
        { label: 'حذف الحساب', value: 'نهائي' },
      ],
      actions: [{ label: 'إدارة الحساب', href: '/account/me', primary: true }],
    },
    login_security: {
      description: 'حماية تسجيل الدخول عبر البريد الإلكتروني وتنبيهات الأجهزة غير المعروفة.',
      rows: [
        { label: 'مصادقة البريد', value: 'متاحة' },
        { label: 'تنبيه جهاز جديد', value: 'مفعل' },
      ],
      actions: [{ label: 'الأمان وتسجيل الدخول', href: '/security', primary: true }],
    },
    mentions: {
      description: 'التحكم بمن يستطيع ذكرك في المنشورات والتعليقات والردود.',
      rows: [
        { label: '@الذكر', value: 'الجميع' },
        { label: 'الوسوم', value: 'مفعلة' },
      ],
      actions: [{ label: 'فتح الواجهة', href: '/interface', primary: true }],
    },
    video_controls: {
      description: 'خيارات مشاهدة الفيديو: التشغيل التلقائي، الكتم الافتراضي، وتوفير البيانات.',
      rows: [
        { label: 'التشغيل التلقائي', value: 'حسب الشبكة' },
        { label: 'جودة الفيديو', value: 'تلقائية' },
      ],
      actions: [{ label: 'عرض الفيديوهات', href: '/interface', primary: true }],
    },
    translation_settings: {
      description: 'إعدادات زر الترجمة والكشف التلقائي عن لغة المنشور.',
      rows: [
        { label: 'كشف اللغة', value: 'تلقائي' },
        { label: 'زر الترجمة', value: 'ظاهر عند الحاجة' },
      ],
      actions: [{ label: 'تجربة الترجمة', href: '/interface', primary: true }],
    },
    creator_academy: {
      description: 'مركز مبسط لنصائح النشر، المقالات، الفيديوهات، وتحسين جودة المحتوى.',
      rows: [
        { label: 'إرشادات المقال', value: 'متاحة' },
        { label: 'نصائح الريلز', value: 'متاحة' },
      ],
      actions: [{ label: 'فتح الميزات', href: '/features', primary: true }],
    },
    blocked_accounts: {
      description: 'عرض الحسابات المحظورة وإتاحة إلغاء الحظر من مكان واحد.',
      rows: [
        { label: 'قائمة الحظر', value: 'قابلة للإدارة' },
        { label: 'منع التفاعل', value: 'مفعل' },
      ],
      actions: [{ label: 'إدارة الحظر', href: '/account/me', primary: true }],
    },
    hidden_posts: {
      description: 'عرض المنشورات التي أخفيتها وإعادتها للظهور عند الحاجة.',
      rows: [
        { label: 'المنشورات المخفية', value: 'قائمة خاصة' },
        { label: 'استرجاع الظهور', value: 'متاح' },
      ],
      actions: [{ label: 'عرض المخفية', href: '/account/me', primary: true }],
    },
    saved_items: {
      description: 'مكتبة العناصر المحفوظة من المنشورات والريلز والروابط المهمة.',
      rows: [
        { label: 'المنشورات', value: 'محفوظة' },
        { label: 'الريلز', value: 'محفوظة' },
      ],
      actions: [{ label: 'فتح المحفوظات', href: '/account/me', primary: true }],
    },
    watch_history: {
      description: 'سجل الفيديوهات التي شاهدتها مؤخراً مع إمكانية الرجوع إليها.',
      rows: [
        { label: 'آخر المشاهدات', value: 'مرتبة زمنياً' },
        { label: 'تنظيف السجل', value: 'اختياري' },
      ],
      actions: [{ label: 'فتح السجل', href: '/account/me', primary: true }],
    },
  };

  return map[key] || {
    description: 'هذا القسم قيد التجهيز وسيتم ربطه بميزات التطبيق تدريجياً.',
    rows: [{ label: 'الحالة', value: 'قيد التطوير' }],
    actions: [{ label: 'فتح', href: '/interface', primary: true }],
  };
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
  if (section === 'notifications') {
    return <BellIcon />;
  }
  if (section === 'chat') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-6.5A8.5 8.5 0 1 1 21 12Z" />
        <path d="M8 11h8M8 15h5" />
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

function ChevronLeftIcon({ className = '' }) { return <svg viewBox="0 0 24 24" className={`h-4 w-4 text-gray-500 ${className}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>; }
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































