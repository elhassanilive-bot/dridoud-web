'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { getSupabaseClient } from '@/lib/supabase/client';

function formatClock(seconds) {
  const s = Math.max(0, Number(seconds || 0));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function recorderProfileForQuality(quality) {
  if (quality === '1080p') return { width: 1280, height: 720, fps: 24, bps: 2200000 };
  if (quality === '720p') return { width: 960, height: 540, fps: 24, bps: 1400000 };
  return { width: 854, height: 480, fps: 20, bps: 900000 };
}

export default function LiveStreamClient() {
  const [description, setDescription] = useState('');
  const [quality, setQuality] = useState('720p');
  const [duration, setDuration] = useState(60);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [connected, setConnected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [createdPostId, setCreatedPostId] = useState('');
  const [toast, setToast] = useState(null);

  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStreamRef = useRef(null);

  const canStart = useMemo(() => !starting && !ending && !connected, [starting, ending, connected]);

  function notify(message, type = 'ok') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (roomRef.current) roomRef.current.disconnect();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      recordingStreamRef.current = null;
    };
  }, []);

  async function uploadVideoAsPost(supabase, session, blob) {
    if (!blob || blob.size <= 0) return null;
    const userId = session.user.id;
    const content = description.trim().length
      ? `${description.trim()} #live_archive`
      : 'تسجيل البث المباشر #live_archive';

    const { data: newPost, error: postErr } = await supabase
      .from('posts')
      .insert({ user_id: userId, content, description: content, media_type: 'video', privacy: 'public', allow_comments: true })
      .select('id')
      .single();

    if (postErr || !newPost?.id) throw new Error(postErr?.message || 'فشل إنشاء منشور البث');

    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const filePath = `${userId}/${newPost.id}/${Date.now()}-live.${ext}`;
    const buckets = ['post-media', 'posts', 'media'];
    let publicUrl = null;

    for (const bucket of buckets) {
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, { upsert: false, contentType: blob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm') });
      if (!uploadErr) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        publicUrl = data?.publicUrl || null;
        break;
      }
    }

    if (!publicUrl) throw new Error('تعذر رفع تسجيل البث إلى التخزين');

    const { error: mediaErr } = await supabase.from('post_media').insert({
      post_id: newPost.id,
      media_url: publicUrl,
      thumbnail_url: null,
      media_type: 'video',
      storage_provider: 'supabase',
      order_index: 0,
    });
    if (mediaErr) throw new Error(mediaErr.message || 'تعذر حفظ ميديا البث');

    return newPost.id;
  }

  async function startLocalRecording(stream) {
    if (!stream || typeof MediaRecorder === 'undefined') {
      console.warn('[live/web] recorder skipped: no stream or no MediaRecorder');
      return false;
    }
    try {
      const profile = recorderProfileForQuality(quality);
      const vTrack = stream.getVideoTracks?.()[0];
      if (vTrack?.applyConstraints) {
        try {
          await vTrack.applyConstraints({
            width: { ideal: profile.width },
            height: { ideal: profile.height },
            frameRate: { ideal: profile.fps, max: profile.fps },
          });
        } catch (e) {
          console.warn('[live/web] applyConstraints failed', e);
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: profile.bps });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      console.log(`[live/web] recorder started v=${stream.getVideoTracks().length} a=${stream.getAudioTracks().length} bps=${profile.bps}`);
      return true;
    } catch (e) {
      console.error('[live/web] recorder start failed', e);
      notify('تعذر بدء تسجيل البث المحلي، سيتم البث بدون أرشفة فيديو.', 'warn');
      return false;
    }
  }

  async function stopLocalRecordingBlob() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      console.warn('[live/web] recorder inactive at stop');
      return null;
    }
    const blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const out = new Blob(chunksRef.current, { type: 'video/webm' });
        console.log(`[live/web] recorder stopped chunks=${chunksRef.current.length} size=${out.size}`);
        resolve(out.size > 0 ? out : null);
      };
      recorder.stop();
    });
    recorderRef.current = null;
    return blob;
  }

  async function startLive() {
    setCreatedPostId('');
    setStarting(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error('خدمة Supabase غير مهيأة على الويب.');

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) throw new Error('يجب تسجيل الدخول أولاً قبل بدء البث.');

      const tokenRes = await supabase.functions.invoke('create-livekit-token', {
        body: { description: description.trim(), quality, max_duration_minutes: duration },
      });

      const payload = tokenRes?.data || {};
      const wsUrl = String(payload.ws_url || '').trim();
      const token = String(payload.token || '').trim();
      const rn = String(payload.room_name || '').trim();
      if (!wsUrl || !token || !rn) throw new Error(payload.message || 'فشل تجهيز جلسة البث من الخادم.');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      setRoomName(rn);

      room.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        if (timerRef.current) clearInterval(timerRef.current);
      });

      await room.connect(wsUrl, token);
      await room.localParticipant.setMicrophoneEnabled(micOn);
      await room.localParticipant.setCameraEnabled(camOn);

      try {
        await supabase.rpc('notify_live_stream_followers', {
          p_event: 'live_started',
          p_room_name: rn,
          p_description: description.trim(),
        });
      } catch (e) {
        console.warn('[live/web] notify started failed', e);
      }

      if (camOn) {
        const videoPub = [...room.localParticipant.videoTrackPublications.values()][0];
        if (videoPub?.videoTrack && localVideoRef.current) {
          videoPub.videoTrack.attach(localVideoRef.current);
        }

        const mediaTracks = [];
        const vTrack = videoPub?.videoTrack?.mediaStreamTrack;
        if (vTrack) mediaTracks.push(vTrack);
        const audioPub = [...room.localParticipant.audioTrackPublications.values()][0];
        const aTrack = audioPub?.audioTrack?.mediaStreamTrack;
        if (aTrack) mediaTracks.push(aTrack);
        recordingStreamRef.current = mediaTracks.length > 0
          ? new MediaStream(mediaTracks)
          : (localVideoRef.current?.srcObject || null);
      }

      setConnected(true);
      setTimer(0);
      timerRef.current = setInterval(() => setTimer((v) => v + 1), 1000);
      notify('تم بدء البث المباشر بنجاح.', 'ok');

      if (camOn) {
        const ok = await startLocalRecording(recordingStreamRef.current);
        if (!ok) notify('تم بدء البث لكن تعذر تشغيل أرشفة الفيديو. تحقق من صلاحيات المتصفح.', 'warn');
      }
    } catch (e) {
      notify(`تعذر بدء البث: ${e?.message || String(e)}`, 'error');
    } finally {
      setStarting(false);
    }
  }

  async function endLive() {
    if (!connected || ending) return;
    setEnding(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) throw new Error('خدمة Supabase غير متاحة.');
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) throw new Error('انتهت جلسة الدخول.');

      if (timerRef.current) clearInterval(timerRef.current);
      const room = roomRef.current;
      if (room) {
        await room.disconnect();
        roomRef.current = null;
      }
      recordingStreamRef.current = null;
      setConnected(false);

      try {
        await supabase.rpc('notify_live_stream_followers', {
          p_event: 'live_ended',
          p_room_name: roomName || 'web_live_room',
          p_description: description.trim(),
        });
      } catch (e) {
        console.warn('[live/web] notify ended failed', e);
      }

      notify('جاري حفظ تسجيل البث...', 'warn');
      const recordingBlob = await stopLocalRecordingBlob();
      if (!recordingBlob) {
        console.warn('[live/web] no recording blob produced on endLive');
        notify('تم إنهاء البث بدون أرشفة فيديو.', 'warn');
        return;
      }

      const postId = await uploadVideoAsPost(supabase, session, recordingBlob);
      if (postId) {
        setCreatedPostId(postId);
        notify('تم إنهاء البث ونشره كمنشور بنجاح.', 'ok');
      } else {
        notify('تم إنهاء البث لكن لم يتم إنشاء منشور.', 'warn');
      }
    } catch (e) {
      notify(`تعذر إنهاء البث بشكل كامل: ${e?.message || String(e)}`, 'error');
    } finally {
      setEnding(false);
    }
  }

  async function toggleMic() {
    const room = roomRef.current;
    if (!room || !connected) return;
    try {
      const next = !micOn;
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch (e) {
      notify(`فشل تغيير الميكروفون: ${e?.message || String(e)}`, 'error');
    }
  }

  async function toggleCam() {
    const room = roomRef.current;
    if (!room || !connected) return;
    try {
      const next = !camOn;
      await room.localParticipant.setCameraEnabled(next);
      setCamOn(next);
    } catch (e) {
      notify(`فشل تغيير الكاميرا: ${e?.message || String(e)}`, 'error');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-5" dir="rtl">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900">البث المباشر</h1>
          <Link href="/create-post" className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200">رجوع</Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 p-3">
              <label className="mb-1 block text-sm font-bold text-gray-700">وصف البث</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-2 text-sm outline-none focus:border-red-300"
                placeholder="جلسة مباشرة مع المتابعين..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={quality} onChange={(e) => setQuality(e.target.value)} className="rounded-xl border border-gray-200 p-2 text-sm font-bold">
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="rounded-xl border border-gray-200 p-2 text-sm font-bold">
                <option value={15}>15 دقيقة</option>
                <option value={30}>30 دقيقة</option>
                <option value={45}>45 دقيقة</option>
                <option value={60}>60 دقيقة</option>
                <option value={90}>90 دقيقة</option>
                <option value={120}>120 دقيقة</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={startLive} disabled={!canStart} className="rounded-full bg-red-700 px-5 py-2 text-sm font-black text-white disabled:opacity-50">{starting ? 'جاري البدء...' : 'ابدأ البث'}</button>
              <button onClick={endLive} disabled={!connected || ending} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-black text-white disabled:opacity-50">{ending ? 'جاري الإنهاء...' : 'إنهاء البث'}</button>
              <button onClick={toggleMic} disabled={!connected} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold disabled:opacity-50">{micOn ? 'إيقاف المايك' : 'تشغيل المايك'}</button>
              <button onClick={toggleCam} disabled={!connected} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold disabled:opacity-50">{camOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}</button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm">
              <div>الحالة: <span className={connected ? 'font-black text-green-700' : 'font-bold text-gray-700'}>{connected ? 'مباشر الآن' : 'غير متصل'}</span></div>
              <div>المدة: <span className="font-black">{formatClock(timer)}</span></div>
              {roomName ? <div className="truncate">Room: <span className="font-mono text-xs">{roomName}</span></div> : null}
              {createdPostId ? <div className="mt-1"><Link href={`/post/${createdPostId}`} className="font-bold text-red-700 underline">فتح منشور تسجيل البث</Link></div> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-black p-2">
            <video ref={localVideoRef} autoPlay muted playsInline className="h-[360px] w-full rounded-xl bg-black object-cover" />
          </div>
        </div>
      </div>

      {toast ? (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm font-bold shadow-lg"
          style={{
            background: toast.type === 'error' ? '#fef2f2' : toast.type === 'warn' ? '#fff7ed' : '#f0fdf4',
            borderColor: toast.type === 'error' ? '#fecaca' : toast.type === 'warn' ? '#fed7aa' : '#bbf7d0',
            color: toast.type === 'error' ? '#b91c1c' : toast.type === 'warn' ? '#9a3412' : '#166534',
          }}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
