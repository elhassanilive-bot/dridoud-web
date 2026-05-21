import { createClient } from '@supabase/supabase-js';
import { site } from '@/config/site';
import PostDetailsClient from './PostDetailsClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getServerSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

function cleanText(text = '') {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function isVideoType(mediaType = '', mediaUrl = '') {
  const mt = String(mediaType || '').toLowerCase();
  const url = String(mediaUrl || '').toLowerCase();
  return mt.includes('video') || /\.(mp4|mov|webm|m3u8)(\?|$)/.test(url);
}

async function getPublicPostData(id) {
  const client = getServerSupabase();
  if (!client || !id) return null;

  const { data: post } = await client
    .from('posts')
    .select('id,user_id,content,description,created_at,privacy,is_sensitive')
    .eq('id', id)
    .maybeSingle();

  if (!post || String(post?.privacy || 'public') === 'private') return null;

  const [profileRes, mediaRes] = await Promise.all([
    client
      .from('profiles')
      .select('user_id,username,full_name,avatar_url')
      .eq('user_id', post.user_id)
      .maybeSingle(),
    client
      .from('post_media')
      .select('media_url,thumbnail_url,media_type')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(8),
  ]);

  return {
    post,
    profile: profileRes?.data || null,
    media: mediaRes?.data || [],
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || '';
  const canonical = `/post/${id}`;
  const fallback = {
    title: 'عرض المنشور',
    description: 'عرض المنشور الكامل على دريدود.',
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      url: canonical,
      title: 'عرض المنشور',
      description: 'عرض المنشور الكامل على دريدود.',
      siteName: site.nameEn,
      images: ['/icon.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'عرض المنشور',
      description: 'عرض المنشور الكامل على دريدود.',
      images: ['/icon.png'],
    },
  };

  const payload = await getPublicPostData(id);
  if (!payload) {
    return {
      ...fallback,
      robots: { index: false, follow: false },
    };
  }

  const { post, profile, media } = payload;
  const authorName = profile?.full_name || profile?.username || 'مستخدم';
  const postText = cleanText(post?.content || post?.description || 'منشور على دريدود');
  const title = postText.length > 80 ? `${postText.slice(0, 80)}...` : postText;
  const description = postText.length > 170 ? `${postText.slice(0, 170)}...` : postText;
  const firstMedia = media[0] || null;
  const imageUrl = firstMedia?.thumbnail_url || firstMedia?.media_url || `${site.url}/icon.png`;
  const hasVideo = isVideoType(firstMedia?.media_type, firstMedia?.media_url);

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: hasVideo ? 'video.other' : 'article',
      url: canonical,
      title,
      description,
      siteName: site.nameEn,
      locale: 'ar_SA',
      publishedTime: post?.created_at || undefined,
      authors: [authorName],
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PostDetailsPage({ params }) {
  const resolvedParams = await params;
  const postId = resolvedParams?.id;
  const payload = await getPublicPostData(postId);

  const jsonLd = payload
    ? (() => {
        const { post, profile, media } = payload;
        const postUrl = `${site.url}/post/${post.id}`;
        const text = cleanText(post?.content || post?.description || 'منشور على دريدود');
        const firstMedia = media[0] || null;
        const isVideo = isVideoType(firstMedia?.media_type, firstMedia?.media_url);
        const imageUrl = firstMedia?.thumbnail_url || firstMedia?.media_url || `${site.url}/icon.png`;
        const base = {
          '@context': 'https://schema.org',
          '@type': 'SocialMediaPosting',
          mainEntityOfPage: postUrl,
          url: postUrl,
          headline: text.slice(0, 110),
          articleBody: text,
          datePublished: post?.created_at || undefined,
          dateModified: post?.created_at || undefined,
          inLanguage: 'ar',
          image: [imageUrl],
          author: {
            '@type': 'Person',
            name: profile?.full_name || profile?.username || 'مستخدم',
            url: `${site.url}/${profile?.username || ''}`,
          },
          publisher: {
            '@type': 'Organization',
            name: site.nameEn,
            url: site.url,
            logo: {
              '@type': 'ImageObject',
              url: `${site.url}/icon.png`,
            },
          },
        };
        if (!isVideo || !firstMedia?.media_url) return base;
        return {
          ...base,
          video: {
            '@type': 'VideoObject',
            name: text.slice(0, 90),
            description: text.slice(0, 200),
            thumbnailUrl: [imageUrl],
            uploadDate: post?.created_at || undefined,
            contentUrl: firstMedia.media_url,
            embedUrl: postUrl,
            isFamilyFriendly: true,
          },
        };
      })()
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <PostDetailsClient postId={postId} />
    </>
  );
}

