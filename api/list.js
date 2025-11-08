import { list } from '@vercel/blob';

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const room = (searchParams.get('room') || '').trim();
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!room) {
      return new Response(JSON.stringify({ files: [] }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    let cursor; const files = [];
    do {
      const res = await list({ prefix: `${room}/`, limit: 1000, cursor, token });
      files.push(...res.blobs);
      cursor = res.cursor;
    } while (cursor);

    return new Response(JSON.stringify({ files }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
}
