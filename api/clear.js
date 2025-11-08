// api/clear.js
import { list, del } from '@vercel/blob';


export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const { searchParams } = new URL(request.url);
  const room = (searchParams.get('room') || '').trim().toLowerCase();
  if (!room) return new Response(JSON.stringify({ ok: true }), { status: 200 });

  let cursor; const urls = [];
  do {
    const res = await list({ prefix: `${room}/`, cursor, limit: 1000 });
    urls.push(...res.blobs.map(b => b.url));
    cursor = res.cursor;
  } while (cursor);

  if (urls.length) await del(urls);
  return new Response(JSON.stringify({ ok: true, deleted: urls.length }), { status: 200, headers: { 'content-type': 'application/json' } });
}

