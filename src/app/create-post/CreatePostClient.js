'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const BG_PRESETS = [
  { id: 'none', type: 'solid', colors: ['#00000000'], text: '#111827' },
  { id: 'solid-red', type: 'solid', colors: ['#D62839'], text: '#ffffff' },
  { id: 'solid-red-light', type: 'solid', colors: ['#F87171'], text: '#ffffff' },
  { id: 'solid-red-dark', type: 'solid', colors: ['#991B1B'], text: '#ffffff' },
  { id: 'grad-red', type: 'gradient', colors: ['#EF4444', '#B91C1C'], text: '#ffffff' },
  { id: 'solid-blue', type: 'solid', colors: ['#2563EB'], text: '#ffffff' },
  { id: 'solid-blue-light', type: 'solid', colors: ['#60A5FA'], text: '#111827' },
  { id: 'solid-blue-dark', type: 'solid', colors: ['#1E3A8A'], text: '#ffffff' },
  { id: 'grad-blue', type: 'gradient', colors: ['#3B82F6', '#1D4ED8'], text: '#ffffff' },
  { id: 'solid-green', type: 'solid', colors: ['#16A34A'], text: '#ffffff' },
  { id: 'solid-green-light', type: 'solid', colors: ['#4ADE80'], text: '#111827' },
  { id: 'solid-green-dark', type: 'solid', colors: ['#166534'], text: '#ffffff' },
  { id: 'grad-green', type: 'gradient', colors: ['#22C55E', '#15803D'], text: '#ffffff' },
  { id: 'solid-orange', type: 'solid', colors: ['#F97316'], text: '#ffffff' },
  { id: 'solid-yellow', type: 'solid', colors: ['#FACC15'], text: '#111827' },
  { id: 'solid-yellow-light', type: 'solid', colors: ['#FDE68A'], text: '#111827' },
  { id: 'solid-yellow-dark', type: 'solid', colors: ['#CA8A04'], text: '#ffffff' },
  { id: 'grad-yellow', type: 'gradient', colors: ['#FDE047', '#F59E0B'], text: '#111827' },
  { id: 'solid-pink', type: 'solid', colors: ['#EC4899'], text: '#ffffff' },
  { id: 'solid-pink-light', type: 'solid', colors: ['#F9A8D4'], text: '#111827' },
  { id: 'solid-pink-dark', type: 'solid', colors: ['#9D174D'], text: '#ffffff' },
  { id: 'grad-pink', type: 'gradient', colors: ['#F472B6', '#DB2777'], text: '#ffffff' },
  { id: 'solid-purple', type: 'solid', colors: ['#7C3AED'], text: '#ffffff' },
  { id: 'solid-violet', type: 'solid', colors: ['#8B5CF6'], text: '#ffffff' },
  { id: 'solid-indigo', type: 'solid', colors: ['#4338CA'], text: '#ffffff' },
  { id: 'solid-brown', type: 'solid', colors: ['#8B5E3C'], text: '#ffffff' },
  { id: 'solid-gray', type: 'solid', colors: ['#6B7280'], text: '#ffffff' },
  { id: 'solid-silver', type: 'solid', colors: ['#C0C0C0'], text: '#111827' },
  { id: 'solid-gold', type: 'solid', colors: ['#F59E0B'], text: '#111827' },
  { id: 'grad-sunset', type: 'gradient', colors: ['#EE0979', '#FF6A00'], text: '#ffffff' },
  { id: 'grad-ocean', type: 'gradient', colors: ['#0EA5E9', '#1D4ED8'], text: '#ffffff' },
  { id: 'grad-night', type: 'gradient', colors: ['#111827', '#374151'], text: '#ffffff' },
  { id: 'grad-fresh', type: 'gradient', colors: ['#10B981', '#06B6D4'], text: '#ffffff' },
  { id: 'grad-purple-fuchsia', type: 'gradient', colors: ['#7C3AED', '#C026D3'], text: '#ffffff' },
  { id: 'grad-indigo-sky', type: 'gradient', colors: ['#312E81', '#0EA5E9'], text: '#ffffff' },
  { id: 'grad-gold-brown', type: 'gradient', colors: ['#FBBF24', '#92400E'], text: '#111827' },
];

const PRIVACY_OPTIONS = [
  { id: 'public', label: 'عام' },
  { id: 'followers', label: 'المتابعون' },
  { id: 'private', label: 'خاص' },
];

export default function CreatePostClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [step, setStep] = useState('compose');
  const [text, setText] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [allowComments, setAllowComments] = useState(true);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isSensitive, setIsSensitive] = useState(false);

  const [bgId, setBgId] = useState('none');
  const [files, setFiles] = useState([]);
  const [remoteMedia, setRemoteMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [profiles, setProfiles] = useState([]);

  const [showStickers, setShowStickers] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [stickerQuery, setStickerQuery] = useState('');
  const [loadingStickers, setLoadingStickers] = useState(false);

  const [showPoll, setShowPoll] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollA, setPollA] = useState('');
  const [pollB, setPollB] = useState('');
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = await getSupabaseClient();
      if (!client) return;
      const { data } = await client.from('profiles').select('user_id,username,full_name').order('created_at', { ascending: false }).limit(60);
      if (mounted) setProfiles(data || []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool === 'image') imageInputRef.current?.click();
    if (tool === 'video') videoInputRef.current?.click();
    if (tool === 'sticker') setShowStickers(true);
  }, [searchParams]);

  const previewUrls = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  const activeBg = BG_PRESETS.find((b) => b.id === bgId) || BG_PRESETS[0];

  function notify(message, type = 'ok') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  }

  function onPickFiles(event) {
    const picked = Array.from(event.target.files || []);
    if (!picked.length) return;
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
    event.target.value = '';
  }

  async function loadStickers(query = '') {
    const giphyKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (!giphyKey) {
      notify('أضف NEXT_PUBLIC_GIPHY_API_KEY في .env.local لتفعيل الملصقات المتحركة', 'error');
      return;
    }
    setLoadingStickers(true);
    try {
      const endpoint = query
        ? `https://api.giphy.com/v1/stickers/search?api_key=${giphyKey}&q=${encodeURIComponent(query)}&limit=24&rating=pg`
        : `https://api.giphy.com/v1/stickers/trending?api_key=${giphyKey}&limit=24&rating=pg`;
      const res = await fetch(endpoint);
      const json = await res.json();
      const rows = (json?.data || []).map((item) => ({
        id: item.id,
        preview: item.images?.fixed_height_small?.url || item.images?.preview_gif?.url,
        original: item.images?.original?.url || item.images?.downsized?.url,
      })).filter((x) => x.preview && x.original);
      setStickers(rows);
    } catch {
      notify('تعذر تحميل الملصقات حالياً', 'error');
    } finally {
      setLoadingStickers(false);
    }
  }

  function insertMention(username) {
    const clean = String(username || '').replace(/^@+/, '');
    setText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@${clean} `);
    setShowMention(false);
  }

  function insertLink() {
    const candidate = linkValue.trim();
    if (!candidate) return;
    const normalized = candidate.startsWith('http://') || candidate.startsWith('https://') ? candidate : `https://${candidate}`;
    setText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${normalized} `);
    setLinkValue('');
    setShowLink(false);
  }

  async function uploadMedia(client, userId, file, postId, index) {
    const ext = file.name.split('.').pop() || 'bin';
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const path = `${userId}/${postId}/${Date.now()}-${index}.${ext}`;
    const buckets = ['post-media', 'posts', 'media'];
    let publicUrl = null;
    for (const bucket of buckets) {
      const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
      if (!error) {
        const { data } = client.storage.from(bucket).getPublicUrl(path);
        publicUrl = data?.publicUrl || null;
        break;
      }
    }
    if (!publicUrl) throw new Error('media_upload_failed');
    await client.from('post_media').insert({ post_id: postId, media_url: publicUrl, thumbnail_url: type === 'image' ? publicUrl : null, media_type: type, order_index: index });
  }

  async function submitPost() {
    if (submitting) return;
    const body = text.trim();
    const hasPoll = pollQuestion.trim() && pollA.trim() && pollB.trim();
    if (!body && files.length === 0 && remoteMedia.length === 0 && !hasPoll) {
      notify('اكتب شيئًا أو أضف وسائط أولاً', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('supabase_not_configured');
      const session = await client.auth.getSession();
      const userId = session?.data?.session?.user?.id;
      if (!userId) {
        notify('يجب تسجيل الدخول أولاً', 'error');
        setSubmitting(false);
        return;
      }

      let finalContent = body;
      if (hasPoll) finalContent = `${finalContent}${finalContent ? '\n\n' : ''}📊 ${pollQuestion.trim()}\n• ${pollA.trim()}\n• ${pollB.trim()}`;

      const hasVideo = files.some((f) => f.type.startsWith('video/'));
      const hasAnyMedia = files.length > 0 || remoteMedia.length > 0;
      const mediaType = hasVideo ? 'video' : hasAnyMedia ? 'image' : 'none';

      const { data: newPost, error: postErr } = await client.from('posts').insert({
        user_id: userId,
        content: finalContent,
        description: finalContent,
        media_type: mediaType,
        privacy,
        allow_comments: allowComments,
        is_ai_generated: isAiGenerated,
        is_sensitive: isSensitive,
        background_style: { id: activeBg.id, type: activeBg.type, colors: activeBg.colors, textColor: activeBg.text },
      }).select('id').single();

      if (postErr || !newPost?.id) throw new Error(postErr?.message || 'post_create_failed');

      for (let i = 0; i < files.length; i += 1) await uploadMedia(client, userId, files[i], newPost.id, i);
      for (let i = 0; i < remoteMedia.length; i += 1) {
        await client.from('post_media').insert({ post_id: newPost.id, media_url: remoteMedia[i].url, thumbnail_url: remoteMedia[i].preview || remoteMedia[i].url, media_type: 'image', order_index: files.length + i });
      }

      notify('تم نشر المنشور بنجاح');
      setTimeout(() => router.push('/interface'), 450);
    } catch (e) {
      notify(`تعذر نشر المنشور: ${e?.message || 'unknown_error'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const bgStyle = activeBg.type === 'gradient'
    ? { backgroundImage: `linear-gradient(135deg, ${activeBg.colors[0]}, ${activeBg.colors[1]})`, color: activeBg.text }
    : { backgroundColor: activeBg.colors[0] === '#00000000' ? '#ffffff' : activeBg.colors[0], color: activeBg.text };

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-5" dir="rtl" style={{ unicodeBidi: 'plaintext', direction: 'rtl' }}>
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          {step === 'compose' ? (
            <button type="button" onClick={() => setStep('settings')} className="rounded-full bg-red-700 px-8 py-2 text-sm font-black text-white hover:bg-red-800">التالي</button>
          ) : (
            <button type="button" onClick={submitPost} disabled={submitting} className="rounded-full bg-red-700 px-8 py-2 text-sm font-black text-white hover:bg-red-800 disabled:opacity-60">{submitting ? 'جاري النشر...' : 'نشر'}</button>
          )}
          <h1 className="text-3xl font-black text-gray-950">{step === 'compose' ? 'إنشاء منشور' : 'إعدادات النشر'}</h1>
          <Link href="/interface" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-700 hover:bg-gray-200">×</Link>
        </div>

        <div className="space-y-4 p-5">
          {step === 'compose' ? (
            <>
              <div className="rounded-2xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {PRIVACY_OPTIONS.map((p) => (<button key={p.id} type="button" onClick={() => setPrivacy(p.id)} className={['rounded-full px-5 py-2 text-sm font-black transition', privacy === p.id ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'].join(' ')}>{p.label}</button>))}
                  </div>
                  <p className="text-lg font-black text-gray-900">الخصوصية: {PRIVACY_OPTIONS.find((p) => p.id === privacy)?.label}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 p-4" style={{ ...bgStyle, unicodeBidi: 'plaintext', direction: 'rtl' }}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="شارك لحظتك..." className="min-h-[300px] w-full resize-none bg-transparent text-right text-6xl font-extrabold leading-[1.4] outline-none placeholder:text-gray-500 sm:text-7xl" dir="rtl" style={{ unicodeBidi: 'plaintext', direction: 'rtl' }} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {BG_PRESETS.map((b) => {
                    const dotStyle = b.type === 'gradient' ? { backgroundImage: `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[1]})` } : { backgroundColor: b.colors[0] === '#00000000' ? '#ffffff' : b.colors[0] };
                    return <button key={b.id} type="button" onClick={() => setBgId(b.id)} className={['h-8 w-8 rounded-full border-2 transition', b.id === bgId ? 'border-red-600 ring-2 ring-red-200' : 'border-gray-200'].join(' ')} style={dotStyle} title={b.id} />;
                  })}
                </div>
                <span className="text-xl font-black text-gray-700">الخلفيات</span>
              </div>

              {(previewUrls.length > 0 || remoteMedia.length > 0) ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {previewUrls.map((m, index) => (<div key={`${m.file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100">{m.file.type.startsWith('video/') ? <video src={m.url} className="h-28 w-full object-cover" /> : <img src={m.url} alt="preview" className="h-28 w-full object-cover" />}<button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-black text-white">حذف</button></div>))}
                  {remoteMedia.map((m, index) => (<div key={`${m.url}-${index}`} className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100"><img src={m.preview || m.url} alt="sticker" className="h-28 w-full object-cover" /><button type="button" onClick={() => setRemoteMedia((prev) => prev.filter((_, i) => i !== index))} className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-black text-white">حذف</button></div>))}
                </div>
              ) : null}

              {(showPoll || showMention || showLink || showStickers) ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  {showPoll ? <div className="space-y-2"><p className="text-sm font-black text-gray-800">استطلاع</p><input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="سؤال الاستطلاع" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none" dir="rtl" style={{ unicodeBidi: 'plaintext' }} /><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><input value={pollA} onChange={(e) => setPollA(e.target.value)} placeholder="الخيار الأول" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none" dir="rtl" style={{ unicodeBidi: 'plaintext' }} /><input value={pollB} onChange={(e) => setPollB(e.target.value)} placeholder="الخيار الثاني" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none" dir="rtl" style={{ unicodeBidi: 'plaintext' }} /></div></div> : null}
                  {showLink ? <div className="mt-3 flex gap-2"><button type="button" onClick={insertLink} className="rounded-lg bg-red-700 px-4 py-2 text-xs font-black text-white">إضافة</button><input value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm outline-none" dir="ltr" /></div> : null}
                  {showMention ? <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2">{profiles.map((p) => (<button key={p.user_id} type="button" onClick={() => insertMention(p.username || '')} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-right hover:bg-gray-50"><span className="text-xs text-gray-500">@{p.username || 'user'}</span><span className="text-sm font-bold text-gray-900">{p.full_name || p.username || 'مستخدم'}</span></button>))}</div> : null}
                  {showStickers ? <div className="mt-3 space-y-2"><div className="flex gap-2"><button type="button" onClick={() => loadStickers(stickerQuery.trim())} className="rounded-lg bg-red-700 px-4 py-2 text-xs font-black text-white">بحث</button><input value={stickerQuery} onChange={(e) => setStickerQuery(e.target.value)} placeholder="ابحث عن ملصق..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right text-sm outline-none" dir="rtl" /></div>{loadingStickers ? <div className="text-center text-xs text-gray-500">جاري تحميل الملصقات...</div> : null}<div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{stickers.map((s) => (<button key={s.id} type="button" onClick={() => { setRemoteMedia((prev) => [...prev, { url: s.original, preview: s.preview, type: 'image' }]); setShowStickers(false); }} className="overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-red-300"><img src={s.preview} alt="sticker" className="h-16 w-full object-cover" /></button>))}</div></div> : null}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><ImageIcon /> صورة<input ref={imageInputRef} type="file" accept="image/*" hidden onChange={onPickFiles} /></label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><GalleryIcon /> صور مجمعة<input type="file" accept="image/*" multiple hidden onChange={onPickFiles} /></label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><VideoIcon /> فيديو<input ref={videoInputRef} type="file" accept="video/*" hidden onChange={onPickFiles} /></label>
                <button type="button" onClick={() => { setShowStickers((v) => !v); if (!showStickers) loadStickers(''); }} className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><StickerIcon /> ملصقات</button>
                <button type="button" onClick={() => setShowPoll((v) => !v)} className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><PollIcon /> استطلاع</button>
                <button type="button" onClick={() => setShowMention((v) => !v)} className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><MentionIcon /> ذكر شخص</button>
                <button type="button" onClick={() => setShowLink((v) => !v)} className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-900 hover:bg-gray-50"><LinkIcon /> إضافة رابط</button>
                <Link href="/live" className="flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-700 hover:bg-red-100"><LiveIcon /> بث مباشر</Link>
                <button type="button" className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-400" disabled><HashIcon /> هاشتاغات</button>
              </div>
            </>
          ) : (
            <>
              <Card title="من يمكنه رؤية هذا المنشور"><div className="flex flex-wrap gap-2">{PRIVACY_OPTIONS.map((p) => <button key={p.id} type="button" onClick={() => setPrivacy(p.id)} className={['rounded-full px-5 py-2 text-sm font-black', privacy === p.id ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-gray-100 text-gray-700'].join(' ')}>{p.label}</button>)}</div></Card>
              <Card title="من يمكنه التعليق"><ToggleRow value={allowComments} onChange={setAllowComments} label={allowComments ? 'الجميع' : 'تم تعطيل التعليقات'} /></Card>
              <Card title="محتوى بالذكاء الاصطناعي"><ToggleRow value={isAiGenerated} onChange={setIsAiGenerated} label="إضافة وسم أن المحتوى مولد بالذكاء الاصطناعي" /></Card>
              <Card title="تحذير محتوى حساس"><ToggleRow value={isSensitive} onChange={setIsSensitive} label="إظهار تحذير قبل عرض الوسائط الحساسة" /></Card>
              <div className="flex justify-start"><button type="button" onClick={() => setStep('compose')} className="rounded-full bg-gray-100 px-5 py-2 text-sm font-black text-gray-700">رجوع</button></div>
            </>
          )}
        </div>
      </div>

      {toast ? <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm font-bold shadow-lg" style={{ background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', borderColor: toast.type === 'error' ? '#fecaca' : '#bbf7d0', color: toast.type === 'error' ? '#b91c1c' : '#166534' }}>{toast.message}</div> : null}
    </div>
  );
}

function Card({ title, children }) { return <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="mb-3 text-lg font-black text-gray-900">{title}</p>{children}</div>; }
function ToggleRow({ value, onChange, label }) { return <div className="mt-1 flex items-center justify-between"><p className="text-sm text-gray-600">{label}</p><button type="button" onClick={() => onChange(!value)} className={['relative h-8 w-14 rounded-full transition', value ? 'bg-sky-400' : 'bg-gray-300'].join(' ')}><span className={['absolute top-1 h-6 w-6 rounded-full bg-white shadow transition', value ? 'right-1' : 'left-1'].join(' ')} /></button></div>; }

function ImageIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-6 6-3-3-4 4" /></svg>; }
function GalleryIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="13" height="12" rx="2" /><path d="M16 9h5v10a2 2 0 0 1-2 2h-9" /><path d="m6 15 3-3 4 4" /></svg>; }
function VideoIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></svg>; }
function LiveIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M5 12a7 7 0 0 1 2-5M19 12a7 7 0 0 0-2-5M5 12a7 7 0 0 0 2 5M19 12a7 7 0 0 1-2 5" /></svg>; }
function HashIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3 8 21M16 3l-2 18M4 9h16M3 15h16" /></svg>; }
function PollIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>; }
function StickerIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="15" cy="10" r="1" fill="currentColor" /><path d="M8 15s1.3 1.5 4 1.5S16 15 16 15" /></svg>; }
function MentionIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 1 1-2.5 4.9V13a2 2 0 1 0 4 0V8" /><circle cx="10" cy="10" r="1" fill="currentColor" /></svg>; }
function LinkIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 14 8 16a3 3 0 1 1-4-4l3-3a3 3 0 0 1 4 0" /><path d="m14 10 2-2a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0" /><path d="m8 12 8 0" /></svg>; }
