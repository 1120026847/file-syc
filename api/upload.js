// api/upload.js
import { put, list, del } from '@vercel/blob';


function sanitize(name) {
  return name.replace(/[\\s]+/g, '-').replace(/[\\\\/]+/g, '-').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 200) || 'file';
}

export default async function handler(request) {
  try {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    const { searchParams } = new URL(request.url);
    const room = (searchParams.get('room') || '').trim().toLowerCase();
    if (!room) return new Response(JSON.stringify({ error: 'missing room' }), { status: 400 });

    const form = await request.formData();
    const files = form.getAll('file').filter(Boolean);
    if (!files.length) {
      return new Response(JSON.stringify({ error: 'no files' }), { status: 400 });
    }

    // 1) 列出并删除该 room 旧文件
    let cursor; const toDelete = [];
    do {
      const res = await list({ prefix: `${room}/`, cursor, limit: 1000 });
      toDelete.push(...res.blobs.map(b => b.url));
      cursor = res.cursor;
    } while (cursor);
    if (toDelete.length) await del(toDelete);

    // 2) 逐个上传新文件（public 可直接外链）
    const results = [];
    for (const file of files) {
      const fname = sanitize(file.name || 'file');
      const blob = await put(`${room}/${fname}`, file, {
        access: 'public',
        addRandomSuffix: false,        // 不追加随机后缀，方便覆盖式语义（已先清空）
        contentType: file.type || undefined,
      });
      results.push(blob);
    }

    return new Response(JSON.stringify({ ok: true, files: results }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    // 常见错误：请求体过大（Server Upload 在 Vercel 上约 4.5MB）
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
