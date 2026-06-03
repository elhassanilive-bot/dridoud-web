import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 6;
const rateLimitStore = new Map();

const allowedTypes = new Set(['contact', 'complaints', 'delete_account']);

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function enforceRateLimit(request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, expires: 0 };

  if (entry.expires < now) {
    entry.count = 0;
    entry.expires = now + RATE_LIMIT_WINDOW_MS;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return true;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role is not configured.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request) {
  if (!enforceRateLimit(request)) {
    return NextResponse.json(
      { message: 'تم الوصول للحد الأقصى للإرسال. حاول لاحقاً.' },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return NextResponse.json({ message: 'الطلب غير صالح.' }, { status: 400 });
  }

  const type = normalizeText(body.type || 'contact');
  const name = normalizeText(body.fullName || body.name);
  const email = normalizeText(body.email);
  const phone = normalizeText(body.phone);
  const subject = normalizeText(body.subject);
  const message = normalizeText(body.message || body.details);
  const errors = {};

  if (!allowedTypes.has(type)) errors.type = 'نوع الطلب غير صالح.';
  if (!name) errors.fullName = 'الاسم مطلوب.';
  if (!email) {
    errors.email = 'البريد الإلكتروني مطلوب.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'الرجاء إدخال بريد إلكتروني صالح.';
  }
  if (!message) errors.message = 'نص الرسالة مطلوب.';

  if (Object.keys(errors).length) {
    return NextResponse.json(
      { errors, message: 'استكمل الحقول المطلوبة.' },
      { status: 400 },
    );
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('support_requests').insert({
      user_id: null,
      source: 'web',
      type,
      name,
      email,
      phone: phone || null,
      subject: subject || (type === 'delete_account' ? 'طلب حذف الحساب' : 'طلب دعم'),
      message,
      status: 'new',
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('support request error', error);
    const detail = error instanceof Error ? error.message : 'فشل إرسال الطلب.';
    return NextResponse.json(
      { message: `تعذر إرسال الطلب. ${detail}` },
      { status: 500 },
    );
  }
}
