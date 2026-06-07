'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

function normalizeText(text = '') {
  return String(text || '').replace(/\s+/g, ' ').trim();
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
  const mt = String(mediaType).toLowerCase();
  const url = String(mediaUrl).toLowerCase();
  return mt.includes('video') || /\.(mp4|mov|webm|m3u8)(\?|$)/.test(url);
}

function normalizePostId(v) {
  const id = Array.isArray(v) ? v[0] : v;
  return String(id || '').trim();
}

function normalizeHandle(raw = '') {
  return String(raw).replace(/^@+/, '').replace(/[^\w\u0600-\u06FF.]/g, '').trim();
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v || '')
  );
}

function parseBackgroundStyle(value) {
  if (!value) return null;
  const bg =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        })()
      : value;

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

function mapMedia(rows = []) {
  return (rows || []).map((m) => ({
    type: isVideoType(m.media_type, m.media_url) ? 'video' : 'image',
    full: m.media_url || m.thumbnail_url,
    thumb: m.thumbnail_url || m.media_url,
  }));
}

function encodeMediaToken(type, url) {
  return `[[media:${type}:${url}]]`;
}

function extractMediaTokens(text = '') {
  const rx = /\[\[media:(image|video):([^\]]+)\]\]/g;
  const media = [];
  const source = String(text || '');
  let m;
  while ((m = rx.exec(source)) !== null) {
    media.push({ type: m[1], url: m[2] });
  }
  const cleaned = source.replace(rx, '').trim();
  return { text: cleaned, media };
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
  const raw = String(value || '').toLowerCase();
  if (['heading', 'title', 'h1', 'main_heading', 'main-title'].includes(raw)) return 'heading';
  if (['subheading', 'subtitle', 'h2', 'secondary_heading', 'sub-title'].includes(raw)) return 'subheading';
  if (['quote', 'blockquote'].includes(raw)) return 'quote';
  if (['divider', 'separator', 'hr'].includes(raw)) return 'divider';
  if (['image', 'photo', 'media_image', 'article_image'].includes(raw)) return 'image';
  if (['video', 'media_video', 'article_video'].includes(raw)) return 'video';
  return 'paragraph';
}

function textFromArticleBlock(block = {}) {
  return (
    block.text ||
    block.content ||
    block.value ||
    block.body ||
    block.title ||
    block.caption ||
    ''
  );
}

function plainTextArticleBlocks(text = '') {
  return String(text || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({ type: 'paragraph', text: part }));
}

function mediaToArticleBlock(item = {}) {
  const url = item.full || item.url || item.media_url || item.thumbnail_url || item.thumb;
  if (!url) return null;
  return {
    type: item.type === 'video' ? 'video' : 'image',
    url,
    thumbnail: item.thumb || item.thumbnail || url,
    caption: item.caption || '',
  };
}

function buildArticleBlocks(post) {
  const mediaQueue = (post?.media || []).map(mediaToArticleBlock).filter(Boolean);
  const stored = Array.isArray(post?.content_blocks)
    ? post.content_blocks
    : safeJsonParse(post?.content_blocks);

  if (Array.isArray(stored) && stored.length) {
    const blocks = stored
      .map((block) => {
        const type = normalizeArticleType(block?.type);
        if (type === 'divider') return { type: 'divider' };
        if (type === 'image') {
          return {
            type: 'image',
            url: block?.url || block?.media_url || block?.mediaUrl || block?.image_url || block?.imageUrl || block?.thumbnail || block?.thumbnail_url,
            thumbnail: block?.thumbnail || block?.thumbnail_url || block?.url || block?.media_url || block?.mediaUrl || block?.image_url || block?.imageUrl,
            caption: block?.caption || block?.alt || block?.description || '',
          };
        }
        if (type === 'video') {
          return {
            type: 'video',
            url: block?.url || block?.media_url || block?.mediaUrl || block?.video_url || block?.videoUrl,
            thumbnail: block?.thumbnail || block?.thumbnail_url || '',
            caption: block?.caption || block?.alt || block?.description || '',
          };
        }
        return { type, text: textFromArticleBlock(block) };
      })
      .filter((block) => block.type === 'divider' || block.url || String(block.text || '').trim());
    return blocks.length ? blocks : mediaQueue;
  }

  const rawText = post?.content || post?.description || '';
  const blocks = plainTextArticleBlocks(rawText);
  blocks.push(...mediaQueue);
  return blocks;
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
      tokens.push({ type: 'url', value: match[1], href: normalizeExternalUrl(match[2]) });
    } else if (match[3]) {
      tokens.push({ type: 'url', value: match[3], href: normalizeExternalUrl(match[3]) });
    } else if (match[4]) {
      const handle = normalizeHandle(match[4]);
      tokens.push(handle ? { type: 'mention', value: match[4], handle } : { type: 'text', value: match[4] });
    } else if (match[5]) {
      const tag = match[5].replace(/^#+/, '').replace(/[^\w\u0600-\u06FF]/g, '').trim();
      tokens.push(tag ? { type: 'hashtag', value: match[5], tag } : { type: 'text', value: match[5] });
    }

    lastIndex = richPattern.lastIndex;
  }

  if (lastIndex < source.length) tokens.push({ type: 'text', value: source.slice(lastIndex) });
  return tokens;
}

function normalizeExternalUrl(value = '') {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  return url;
}

function RichArticleText({ text = '', className = '' }) {
  return (
    <p className={className} dir="rtl">
      {tokenizeRichText(text).map((part, idx) => {
        if (part.type === 'url') {
          return (
          <a
            key={`${part.value}-${idx}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="font-black text-blue-700 underline decoration-blue-400 underline-offset-2 transition hover:text-blue-900"
            dir="ltr"
          >
            {part.value}
          </a>
          );
        }
        if (part.type === 'mention') {
          return (
            <Link
              key={`m-${idx}`}
              href={`/${part.handle}`}
              onClick={(event) => event.stopPropagation()}
              className="font-black text-blue-700 underline decoration-blue-400 underline-offset-2 transition hover:text-blue-900"
            >
              {part.value}
            </Link>
          );
        }
        if (part.type === 'hashtag') {
          return (
            <Link
              key={`h-${idx}`}
              href={`/interface?tag=${encodeURIComponent(part.tag)}`}
              onClick={(event) => event.stopPropagation()}
              className="font-black text-blue-700 underline decoration-blue-400 underline-offset-2 transition hover:text-blue-900"
            >
              {part.value}
            </Link>
          );
        }
        return <span key={`txt-${idx}`}>{part.value}</span>;
      })}
    </p>
  );
}

function ArticleBlock({ block, index }) {
  if (!block) return null;
  if (block.type === 'divider') {
    return (
      <div className="py-2" aria-hidden="true">
        <div className="mx-auto h-px w-28 rounded-full bg-gradient-to-l from-transparent via-red-200 to-transparent" />
      </div>
    );
  }

  if (block.type === 'image') {
    if (!block.url) return null;
    return (
      <figure className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <img src={block.url} alt={block.caption || `article-image-${index}`} className="max-h-[720px] w-full object-contain" />
        {block.caption ? (
          <figcaption className="border-t border-gray-100 px-4 py-2 text-center text-xs font-bold text-gray-500">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === 'video') {
    if (!block.url) return null;
    return (
      <figure className="overflow-hidden rounded-3xl border border-gray-100 bg-black shadow-sm">
        <video src={block.url} poster={block.thumbnail || undefined} controls className="max-h-[720px] w-full bg-black object-contain" />
        {block.caption ? (
          <figcaption className="bg-white px-4 py-2 text-center text-xs font-bold text-gray-500">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const text = String(block.text || '').trim();
  if (!text) return null;

  if (block.type === 'heading') {
    return (
      <RichArticleText
        text={text}
        className="whitespace-pre-wrap text-center text-3xl font-black leading-[1.55] text-gray-950 sm:text-4xl"
      />
    );
  }

  if (block.type === 'subheading') {
    return (
      <RichArticleText
        text={text}
        className="whitespace-pre-wrap text-right text-2xl font-black leading-[1.55] text-gray-900 sm:text-3xl"
      />
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="rounded-3xl border-r-4 border-red-500 bg-red-50/70 px-5 py-4 text-right shadow-sm">
        <RichArticleText text={text} className="whitespace-pre-wrap text-xl font-extrabold leading-[1.8] text-gray-900" />
      </blockquote>
    );
  }

  return (
    <RichArticleText
      text={text}
      className="whitespace-pre-wrap text-right text-lg font-semibold leading-[1.9] text-gray-800 sm:text-xl"
    />
  );
}

function ArticleContent({ blocks = [], className = '' }) {
  const visibleBlocks = (blocks || []).filter(Boolean);
  if (!visibleBlocks.length) return null;
  return (
    <div className={['space-y-5', className].filter(Boolean).join(' ')}>
      {visibleBlocks.map((block, index) => (
        <ArticleBlock key={`${block.type}-${index}-${block.url || block.text || 'divider'}`} block={block} index={index} />
      ))}
    </div>
  );
}

function PostDetailsSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 text-right" dir="rtl" aria-busy="true" aria-label="loading">
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-end gap-3">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded-full bg-gray-200" />
              <div className="h-4 w-24 rounded-full bg-gray-100" />
            </div>
            <div className="h-12 w-12 rounded-full bg-gray-200" />
          </div>
          <div className="space-y-3">
            <div className="mr-auto h-5 w-11/12 rounded-full bg-gray-100" />
            <div className="mr-auto h-5 w-9/12 rounded-full bg-gray-100" />
            <div className="mr-auto h-5 w-7/12 rounded-full bg-gray-100" />
          </div>
          <div className="h-[420px] rounded-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-2xl bg-gray-100" />
            <div className="h-12 rounded-2xl bg-gray-100" />
            <div className="h-12 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </article>
    </main>
  );
}

function ExpandableText({
  text = '',
  maxChars = 360,
  className = '',
  buttonClassName = '',
}) {
  const fullText = String(text || '').trim();
  const [expanded, setExpanded] = useState(false);
  const shouldTrim = fullText.length > maxChars;
  const shownText =
    shouldTrim && !expanded
      ? `${fullText.slice(0, maxChars).trim()}...`
      : fullText;

  return (
    <div className="space-y-1.5">
      <p className={className}>{shownText}</p>
      {shouldTrim ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={[
            'text-xs font-black transition hover:underline',
            buttonClassName || 'text-blue-700',
          ].join(' ')}
        >
          {expanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      ) : null}
    </div>
  );
}

function Avatar({ src, alt }) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
      {src ? <img src={src} alt={alt || 'user'} className="h-full w-full object-cover" /> : null}
    </div>
  );
}

function MediaDeck({ media = [], isSensitive = false }) {
  const [active, setActive] = useState(0);
  const [revealSensitive, setRevealSensitive] = useState(false);
  if (!media.length) return null;

  const item = media[Math.max(0, Math.min(active, media.length - 1))];
  const isLive = /live|archive|broadcast|stream/i.test(String(item?.full || ''));

  return (
    <div className="mt-4 space-y-3">
      {isSensitive ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRevealSensitive((v) => !v)}
            className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-800"
          >
            {revealSensitive ? 'إخفاء الوسائط الحساسة' : 'عرض الوسائط الحساسة'}
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
        {isSensitive && !revealSensitive ? (
          <div className="flex h-[460px] items-center justify-center text-center text-sm font-black text-white/90">
            <div>
              <p>محتوى حساس</p>
              <p className="mt-1 text-xs text-white/70">اضغط زر عرض الوسائط الحساسة</p>
            </div>
          </div>
        ) : item?.type === 'video' ? (
          <div className="relative">
            <video src={item.full} controls playsInline preload="metadata" className="h-auto max-h-[78vh] w-full object-contain" />
            <div className="absolute right-3 top-3 rounded-full bg-black/65 px-2 py-1 text-[11px] font-black text-white">
              {isLive ? 'تسجيل بث مباشر' : 'فيديو'}
            </div>
          </div>
        ) : (
          <img src={item.full} alt="post-media" className="h-auto max-h-[78vh] w-full object-contain" loading="lazy" />
        )}
      </div>

      {media.length > 1 ? (
        <div className="flex flex-wrap gap-2" dir="ltr">
          {media.map((m, i) => (
            <button
              key={`m-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={[
                'overflow-hidden rounded-lg border transition',
                i === active ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300',
              ].join(' ')}
            >
              {m.type === 'video' ? (
                <div className="relative h-14 w-20 bg-black">
                  <img src={m.thumb || m.full} alt="thumb-video" className="h-full w-full object-cover opacity-80" />
                  <span className="absolute inset-0 flex items-center justify-center text-white">▶</span>
                </div>
              ) : (
                <img src={m.thumb || m.full} alt="thumb-image" className="h-14 w-20 object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LikeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" />
      <path d="M7 11 11 3a2.2 2.2 0 0 1 4.1 1.55L14 10h5.1a2 2 0 0 1 1.95 2.45l-1.6 7A2 2 0 0 1 17.5 21H7V11Z" />
    </svg>
  );
}

function CommentIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-6.5A8.5 8.5 0 1 1 21 12Z" />
    </svg>
  );
}

function ShareIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V3" />
      <path d="m7 8 5-5 5 5" />
    </svg>
  );
}


function ReplyIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 17-5-5 5-5" />
      <path d="M20 17v-2a7 7 0 0 0-7-7H4" />
    </svg>
  );
}
function PhotoIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-6 6-3-3-4 4" />
    </svg>
  );
}

function VideoIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3z" />
    </svg>
  );
}

export default function PostDetailsClient({ postId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [post, setPost] = useState(null);
  const [originalPost, setOriginalPost] = useState(null);
  const [me, setMe] = useState(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [expandedThreads, setExpandedThreads] = useState({});

  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const safePostId = useMemo(() => normalizePostId(postId), [postId]);

  async function fetchCommentsWithProfiles(client, pid, meId = null) {
    const commentsRes = await client
      .from('comments')
      .select('id,post_id,content,created_at,updated_at,user_id,parent_id')
      .eq('post_id', pid)
      .order('created_at', { ascending: true })
      .limit(1000);

    const rows = commentsRes?.data || [];
    const uids = [...new Set(rows.map((c) => c.user_id).filter(Boolean))];
    let map = {};
    if (uids.length) {
      const { data: ps } = await client
        .from('profiles')
        .select('user_id,username,full_name,avatar_url,is_verified')
        .in('user_id', uids);
      for (const p of ps || []) map[p.user_id] = p;
    }

    const ids = rows.map((c) => c.id).filter(Boolean);
    const reactionsMap = {};
    if (ids.length) {
      const { data: reactionRows } = await client
        .from('comment_reactions')
        .select('comment_id,user_id,reaction_type')
        .in('comment_id', ids);
      for (const id of ids) reactionsMap[id] = { likeCount: 0, userReaction: null };
      for (const r of reactionRows || []) {
        const current = reactionsMap[r.comment_id] || { likeCount: 0, userReaction: null };
        if (r.reaction_type === 'like') current.likeCount += 1;
        if (String(r.user_id || '') === String(meId || '')) current.userReaction = 'like';
        reactionsMap[r.comment_id] = current;
      }
    }

    return {
      comments: rows.map((c) => ({ ...c, profiles: map[c.user_id] || null })),
      map,
      reactionsMap,
    };
  }

  async function refreshCounts(client, pid, meId) {
    const [likesRes, myLikeRes, sharesRes] = await Promise.all([
      client.from('post_reactions').select('post_id').eq('post_id', pid).eq('reaction_type', 'like'),
      client
        .from('post_reactions')
        .select('post_id')
        .eq('post_id', pid)
        .eq('reaction_type', 'like')
        .eq('user_id', meId)
        .maybeSingle(),
      client.from('reposts').select('post_id').eq('post_id', pid),
    ]);

    setLikeCount((likesRes?.data || []).length);
    setIsLiked(!!myLikeRes?.data);
    setShareCount((sharesRes?.data || []).length);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        if (!isUuid(safePostId)) throw new Error('رابط المنشور غير صالح.');

        const client = await getSupabaseClient();
        if (!client) throw new Error('supabase_not_configured');

        const sessionRes = await client.auth.getSession();
        const meId = sessionRes?.data?.session?.user?.id || null;
        if (!meId) throw new Error('يجب تسجيل الدخول لعرض المنشور بالكامل.');
        if (mounted) setMe(meId);

        const { data: row, error: postErr } = await client
          .from('posts')
          .select(
            'id,user_id,content,description,content_blocks,media_type,created_at,privacy,is_sensitive,background_style,is_repost,original_post_id,allow_comments'
          )
          .eq('id', safePostId)
          .maybeSingle();

        if (postErr || !row) throw new Error(postErr?.message || 'المنشور غير موجود أو غير متاح.');

        const [{ data: profileRow }, { data: mediaRows }, commentsData] = await Promise.all([
          client
            .from('profiles')
            .select('user_id,username,full_name,avatar_url,is_verified')
            .eq('user_id', row.user_id)
            .maybeSingle(),
          client
            .from('post_media')
            .select('post_id,media_url,thumbnail_url,media_type,order_index')
            .eq('post_id', safePostId)
            .order('order_index', { ascending: true }),
          fetchCommentsWithProfiles(client, safePostId, meId),
        ]);

        let original = null;
        if (row?.is_repost && row?.original_post_id) {
          const { data: orgRow } = await client
            .from('posts')
            .select('id,user_id,content,description,content_blocks,media_type,created_at,privacy,is_sensitive,background_style')
            .eq('id', row.original_post_id)
            .maybeSingle();

          if (orgRow) {
            const [{ data: orgProfile }, { data: orgMediaRows }] = await Promise.all([
              client
                .from('profiles')
                .select('user_id,username,full_name,avatar_url,is_verified')
                .eq('user_id', orgRow.user_id)
                .maybeSingle(),
              client
                .from('post_media')
                .select('post_id,media_url,thumbnail_url,media_type,order_index')
                .eq('post_id', orgRow.id)
                .order('order_index', { ascending: true }),
            ]);
            original = {
              ...orgRow,
              profiles: orgProfile || null,
              media: mapMedia(orgMediaRows || []),
            };
          }
        }

        if (mounted) {
          setPost({ ...row, profiles: profileRow || null, media: mapMedia(mediaRows || []) });
          setOriginalPost(original);
          setComments(commentsData.comments);
          setProfilesMap(commentsData.map);
        }

        await refreshCounts(client, safePostId, meId);
      } catch (e) {
        if (mounted) setError(e?.message || 'تعذر فتح المنشور حالياً.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [safePostId]);

  useEffect(() => {
    if (!safePostId || !me) return;
    let channel;

    async function subscribe() {
      const client = await getSupabaseClient();
      if (!client) return;

      channel = client
        .channel(`post-live-${safePostId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${safePostId}` },
          async () => {
            const { comments: rows, map, reactionsMap } = await fetchCommentsWithProfiles(client, safePostId, me);
            setComments(rows);
            setProfilesMap(map);
            setCommentReactions(reactionsMap);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'comment_reactions' },
          async () => {
            const { comments: rows, map, reactionsMap } = await fetchCommentsWithProfiles(client, safePostId, me);
            setComments(rows);
            setProfilesMap(map);
            setCommentReactions(reactionsMap);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${safePostId}` },
          async () => {
            await refreshCounts(client, safePostId, me);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reposts', filter: `post_id=eq.${safePostId}` },
          async () => {
            await refreshCounts(client, safePostId, me);
          }
        )
        .subscribe();
    }

    subscribe();
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [safePostId, me]);

  const text = useMemo(() => normalizeText(post?.content || post?.description || 'منشور بدون نص'), [post]);
  const authorName = post?.profiles?.full_name || post?.profiles?.username || 'مستخدم دريدود';
  const username = post?.profiles?.username || '';
  const authorHandle = normalizeHandle(username) || post?.user_id || 'user';
  const bgStyle = useMemo(() => parseBackgroundStyle(post?.background_style), [post]);
  const articleBlocks = useMemo(() => buildArticleBlocks(post), [post]);
  const originalArticleBlocks = useMemo(() => buildArticleBlocks(originalPost), [originalPost]);
  const hasArticleMedia = articleBlocks.some((block) => block.type === 'image' || block.type === 'video');
  const originalHasArticleMedia = originalArticleBlocks.some((block) => block.type === 'image' || block.type === 'video');

  const byParent = useMemo(() => {
    const grouped = {};
    for (const c of comments) {
      const key = c.parent_id || 'root';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    }
    return grouped;
  }, [comments]);

  const rootComments = byParent.root || [];

  async function toggleLike() {
    if (!me || !post?.id) return;
    const client = await getSupabaseClient();
    if (!client) return;

    if (isLiked) {
      await client
        .from('post_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', me)
        .eq('reaction_type', 'like');
      setIsLiked(false);
      setLikeCount((v) => Math.max(0, v - 1));
    } else {
      await client
        .from('post_reactions')
        .upsert({ post_id: post.id, user_id: me, reaction_type: 'like' });
      setIsLiked(true);
      setLikeCount((v) => v + 1);
    }
  }

  async function sharePost() {
    if (!me || !post?.id) return;
    const client = await getSupabaseClient();
    if (!client) return;

    await client
      .from('reposts')
      .upsert({ post_id: post.id, user_id: me, quote_text: null }, { onConflict: 'post_id,user_id' });
    setShareCount((v) => v + 1);
  }

  async function uploadCommentMedia(client, file, index) {
    const ext = file.name.split('.').pop() || 'bin';
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const path = `comments/${me}/${post.id}/${Date.now()}-${index}.${ext}`;
    const buckets = ['post-media', 'posts', 'media'];

    for (const bucket of buckets) {
      const { error: upErr } = await client.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (!upErr) {
        const { data } = client.storage.from(bucket).getPublicUrl(path);
        if (data?.publicUrl) return { type, url: data.publicUrl };
      }
    }

    throw new Error('media_upload_failed');
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!me || !post?.id || sendingComment) return;

    const body = commentText.trim();
    if (!body && commentFiles.length === 0) return;

    setSendingComment(true);
    try {
      const client = await getSupabaseClient();
      if (!client) return;

      const uploaded = [];
      for (let i = 0; i < commentFiles.length; i += 1) {
        uploaded.push(await uploadCommentMedia(client, commentFiles[i], i));
      }

      const tokens = uploaded.map((m) => encodeMediaToken(m.type, m.url)).join('\n');
      const content = [body, tokens].filter(Boolean).join('\n').trim();

      const payload = {
        post_id: post.id,
        user_id: me,
        content,
        created_at: new Date().toISOString(),
        parent_id: replyingTo?.id || null,
      };

      const { data } = await client
        .from('comments')
        .insert(payload)
        .select('id,post_id,content,created_at,updated_at,user_id,parent_id')
        .single();

      const row = data || { ...payload, id: `local-${Date.now()}` };
      const hydrated = {
        ...row,
        profiles: profilesMap[me] || post?.profiles || null,
      };
      setComments((prev) => [...prev, hydrated]);
      setCommentReactions((prev) => ({
        ...prev,
        [hydrated.id]: { likeCount: 0, userReaction: null },
      }));
      setCommentText('');
      setCommentFiles([]);
      setReplyingTo(null);
    } finally {
      setSendingComment(false);
    }
  }

  async function toggleCommentReaction(commentId) {
    if (!me || !commentId) return;
    const client = await getSupabaseClient();
    if (!client) return;

    const current = commentReactions[commentId] || { likeCount: 0, userReaction: null };
    if (current.userReaction === 'like') {
      await client
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', me)
        .eq('reaction_type', 'like');
      setCommentReactions((prev) => ({
        ...prev,
        [commentId]: { likeCount: Math.max(0, current.likeCount - 1), userReaction: null },
      }));
      return;
    }

    await client
      .from('comment_reactions')
      .upsert({ comment_id: commentId, user_id: me, reaction_type: 'like' });
    setCommentReactions((prev) => ({
      ...prev,
      [commentId]: { likeCount: current.likeCount + 1, userReaction: 'like' },
    }));
  }

  function renderComment(comment, depth = 0) {
    const parsed = extractMediaTokens(comment.content || '');
    const cName = comment?.profiles?.full_name || comment?.profiles?.username || 'مستخدم';
    const cUser = comment?.profiles?.username || 'user';
    const cHandle = normalizeHandle(cUser) || comment?.user_id || 'user';
    const replies = byParent[comment.id] || [];
    const reaction = commentReactions[comment.id] || { likeCount: 0, userReaction: null };
    const maxVisible = 3;
    const expanded = !!expandedThreads[comment.id];
    const shownReplies = expanded ? replies : replies.slice(0, maxVisible);

    return (
      <article key={comment.id} className={depth ? 'relative mb-2 pr-3 sm:pr-5' : 'mb-3'}>
        {depth ? <span className="pointer-events-none absolute bottom-2 right-0 top-2 w-px bg-gray-200" /> : null}
        <div className={['rounded-2xl p-3', depth ? 'border border-gray-100 bg-white' : 'bg-gray-50'].join(' ')}>
          <div className="flex items-start gap-3">
            <div className={depth ? 'scale-[0.92] pt-0.5' : ''}>
              <Link href={`/${cHandle}`} className="block">
                <Avatar src={comment?.profiles?.avatar_url} alt={cUser} />
              </Link>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/${cHandle}`} className="text-[15px] font-black leading-6 text-gray-900 hover:underline sm:text-base">{cName}</Link>
                <Link href={`/${cHandle}`} className="text-xs font-semibold text-gray-500 hover:text-red-700 hover:underline">@{normalizeHandle(cUser) || cUser}</Link>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{formatAgo(comment.created_at)}</span>
              </div>
              <div className="mt-1">
                <ExpandableText
                  text={parsed.text}
                  maxChars={210}
                  className="whitespace-pre-wrap text-sm text-gray-800"
                  buttonClassName="text-[11px] text-blue-700"
                />
              </div>

              {parsed.media.length ? (
                <div className="mt-2 space-y-2">
                  {parsed.media.map((m, idx) =>
                    m.type === 'video' ? (
                      <video key={`cm-v-${idx}`} src={m.url} controls className="max-h-72 w-full rounded-xl bg-black object-contain" />
                    ) : (
                      <img key={`cm-i-${idx}`} src={m.url} alt="comment-media" className="max-h-72 w-full rounded-xl object-cover" />
                    )
                  )}
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-gray-600 sm:gap-2">
                <button
                  type="button"
                  onClick={() => toggleCommentReaction(comment.id)}
                  className={[
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition',
                    reaction.userReaction === 'like' ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700',
                  ].join(' ')}
                >
                  <LikeIcon className={`h-3.5 w-3.5 ${reaction.userReaction === 'like' ? 'text-red-700' : 'text-gray-600'}`} />
                  <span>إعجاب {reaction.likeCount ? reaction.likeCount : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplyingTo(comment)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  <ReplyIcon className="h-3.5 w-3.5 text-blue-700" />
                  <span>رد</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {replies.length ? (
          <div className="mt-2">
            {!expanded && replies.length > maxVisible ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedThreads((prev) => ({ ...prev, [comment.id]: true }))
                }
                className="mb-2 text-xs font-black text-blue-700 hover:underline"
              >
                عرض الردود ({replies.length})
              </button>
            ) : null}

            {shownReplies.map((r) => renderComment(r, depth + 1))}

            {expanded && replies.length > maxVisible ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedThreads((prev) => ({ ...prev, [comment.id]: false }))
                }
                className="text-xs font-black text-gray-600 hover:underline"
              >
                إخفاء الردود
              </button>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  if (loading) {
    return <PostDetailsSkeleton />;
  }

  if (error || !post) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-10 pt-8 text-right" dir="rtl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error || 'تعذر فتح المنشور.'}</div>
        <div className="mt-4">
          <Link href="/interface" className="rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-200">
            العودة إلى الواجهة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 text-right" dir="rtl">
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_32px_-22px_rgba(0,0,0,.35)]">
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link href={`/${authorHandle}`} className="block">
              <Avatar src={post?.profiles?.avatar_url} alt={username || 'user'} />
            </Link>
            <div className="min-w-0 text-right">
              <Link href={`/${authorHandle}`} className="block truncate text-2xl font-black text-gray-900 hover:underline">{authorName}</Link>
              <Link href={`/${authorHandle}`} className="mt-1 block text-lg text-gray-500 hover:text-red-700 hover:underline">{username ? `@${username}` : 'مستخدم'}</Link>
              <p className="mt-1 text-xs font-bold text-gray-500">{formatAgo(post?.created_at)}</p>
            </div>
          </div>
        </header>

        <div className="space-y-4 px-5 py-5">
          {post?.is_repost && originalPost ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-600">إعادة نشر</p>
              {text ? (
                <div className="rounded-2xl p-4" style={textContainerStyle(bgStyle) || undefined}>
                  <ArticleContent blocks={plainTextArticleBlocks(text)} />
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <Link href={`/${normalizeHandle(originalPost?.profiles?.username || 'user') || originalPost?.user_id || 'user'}`} className="block text-base font-black text-gray-900 hover:underline">{originalPost?.profiles?.full_name || originalPost?.profiles?.username || 'مستخدم'}</Link>
                    <Link href={`/${normalizeHandle(originalPost?.profiles?.username || 'user') || originalPost?.user_id || 'user'}`} className="block text-sm text-gray-500 hover:text-red-700 hover:underline">@{originalPost?.profiles?.username || 'user'}</Link>
                  </div>
                  <Link href={`/${normalizeHandle(originalPost?.profiles?.username || 'user') || originalPost?.user_id || 'user'}`} className="block">
                    <Avatar src={originalPost?.profiles?.avatar_url} alt={originalPost?.profiles?.username || 'user'} />
                  </Link>
                </div>
                <div className="rounded-2xl p-4" style={textContainerStyle(parseBackgroundStyle(originalPost?.background_style)) || undefined}>
                  <ArticleContent
                    blocks={
                      originalArticleBlocks.length
                        ? originalArticleBlocks
                        : plainTextArticleBlocks(normalizeText(originalPost?.content || originalPost?.description || 'منشور بدون نص'))
                    }
                  />
                </div>
                {!originalHasArticleMedia ? <MediaDeck media={originalPost?.media || []} isSensitive={!!originalPost?.is_sensitive} /> : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4" style={textContainerStyle(bgStyle) || undefined}>
              <ArticleContent blocks={articleBlocks.length ? articleBlocks : plainTextArticleBlocks(text)} />
            </div>
          )}

          {!post?.is_repost && !hasArticleMedia ? <MediaDeck media={post?.media || []} isSensitive={!!post?.is_sensitive} /> : null}

          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>{likeCount} إعجاب</span>
              <span>{rootComments.length} تعليق</span>
              <span>{shareCount} مشاركة</span>
            </div>
            <div className="flex items-center gap-2 border-t border-gray-200 pt-2">
              <button type="button" onClick={toggleLike} className={['flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition', isLiked ? 'bg-red-50 text-red-700' : 'bg-white text-gray-900 hover:bg-gray-100'].join(' ')}>
                <LikeIcon className="h-4 w-4" />
                <span>إعجاب</span>
              </button>
              <button type="button" onClick={() => document.getElementById('comments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-gray-900 hover:bg-gray-100">
                <CommentIcon className="h-4 w-4" />
                <span>تعليق</span>
              </button>
              <button type="button" onClick={sharePost} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-gray-900 hover:bg-gray-100">
                <ShareIcon className="h-4 w-4" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      <section id="comments-panel" className="mt-4 rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-black text-gray-900">التعليقات</h2>
          <p className="text-xs text-gray-500">{rootComments.length} تعليق</p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-3">
          {rootComments.length ? rootComments.map((c) => renderComment(c)) : <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد تعليقات بعد. كن أول من يعلق.</div>}
        </div>

        {replyingTo ? (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
            <button type="button" onClick={() => setReplyingTo(null)}>إلغاء</button>
            <span>الرد على {replyingTo?.profiles?.full_name || replyingTo?.profiles?.username || 'مستخدم'}</span>
          </div>
        ) : null}

        <form onSubmit={submitComment} className="border-t border-gray-100 px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50" title="إضافة صورة">
              <PhotoIcon className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) =>
                  setCommentFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
                }
              />
            </label>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-blue-700 hover:bg-blue-50" title="إضافة فيديو">
              <VideoIcon className="h-4 w-4" />
              <input
                type="file"
                accept="video/*"
                multiple
                hidden
                onChange={(e) =>
                  setCommentFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
                }
              />
            </label>
            {commentFiles.length ? <span className="text-xs text-gray-500">{commentFiles.length} ملف مرفق</span> : null}
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={sendingComment} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:opacity-60">
              {sendingComment ? 'جارِ الإرسال...' : replyingTo ? 'إرسال الرد' : 'إرسال'}
            </button>
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={replyingTo ? 'اكتب ردًا...' : 'اكتب تعليقًا...'} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-right text-sm outline-none focus:border-red-300 focus:bg-white" />
          </div>
        </form>
      </section>

      <div className="mt-4">
        <Link href="/interface" className="rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-200">العودة إلى الرئيسية</Link>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2" dir="rtl">
          <button type="button" onClick={toggleLike} className={['flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-black', isLiked ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-900'].join(' ')}>
            <LikeIcon className="h-4 w-4" />
            <span>{likeCount}</span>
          </button>
          <button type="button" onClick={() => document.getElementById('comments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-xs font-black text-gray-900">
            <CommentIcon className="h-4 w-4" />
            <span>{rootComments.length}</span>
          </button>
          <button type="button" onClick={sharePost} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-xs font-black text-gray-900">
            <ShareIcon className="h-4 w-4" />
            <span>{shareCount}</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-5 left-1/2 z-30 hidden w-[min(760px,92vw)] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-[0_12px_30px_-18px_rgba(0,0,0,.35)] backdrop-blur sm:block">
        <div className="flex items-center gap-2" dir="rtl">
          <button
            type="button"
            onClick={toggleLike}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-black transition',
              isLiked ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            ].join(' ')}
          >
            <LikeIcon className="h-4 w-4" />
            <span>{likeCount} إعجاب</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('comments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-sm font-black text-gray-900 transition hover:bg-gray-200"
          >
            <CommentIcon className="h-4 w-4" />
            <span>{rootComments.length} تعليق</span>
          </button>
          <button
            type="button"
            onClick={sharePost}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-sm font-black text-gray-900 transition hover:bg-gray-200"
          >
            <ShareIcon className="h-4 w-4" />
            <span>{shareCount} مشاركة</span>
          </button>
        </div>
      </div>
    </main>
  );
}

