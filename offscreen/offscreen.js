const objectUrls = new Map();
const hlsControllers = new Map();

async function fetchChecked(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'follow',
    ...options
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao acessar ${new URL(url).hostname}`);
  return response;
}

async function fetchImage(url) {
  const response = await fetchChecked(url, { credentials: 'include' });
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error(`Conteúdo não é imagem (${blob.type || 'sem MIME'})`);
  return blob;
}

async function probe(url) {
  const blob = await fetchImage(url);
  const bitmap = await createImageBitmap(blob);
  const result = { ok: true, width: bitmap.width, height: bitmap.height, mimeType: blob.type, bytes: blob.size };
  bitmap.close();
  return result;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Falha ao converter a imagem.')), mime, quality);
  });
}

function keepObjectUrl(blob) {
  const token = crypto.randomUUID();
  const objectUrl = URL.createObjectURL(blob);
  objectUrls.set(token, objectUrl);
  return { token, objectUrl };
}

async function convertImageToObjectUrl({ url, format, quality }) {
  const original = await fetchImage(url);
  const bitmap = await createImageBitmap(original);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { alpha: format !== 'jpeg' });
  if (format === 'jpeg') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, format === 'png' ? undefined : quality);
  const ref = keepObjectUrl(blob);
  return { ok: true, ...ref, width: canvas.width, height: canvas.height, mimeType: mime, bytes: blob.size };
}

function parseAttributes(text = '') {
  const out = {};
  const re = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/gi;
  let m;
  while ((m = re.exec(text))) {
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    out[m[1].toUpperCase()] = value;
  }
  return out;
}

function absoluteUrl(value, base) {
  try { return new URL(value, base).href; } catch { return null; }
}

function parseMasterPlaylist(text, baseUrl) {
  const lines = text.split(/\r?\n/).map((x) => x.trim());
  const variants = [];
  const audioGroups = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-MEDIA:')) {
      const attrs = parseAttributes(line.slice(13));
      if (attrs.TYPE === 'AUDIO' && attrs['GROUP-ID']) {
        const list = audioGroups.get(attrs['GROUP-ID']) || [];
        list.push({ ...attrs, url: attrs.URI ? absoluteUrl(attrs.URI, baseUrl) : null });
        audioGroups.set(attrs['GROUP-ID'], list);
      }
      continue;
    }
    if (!line.startsWith('#EXT-X-STREAM-INF:')) continue;
    const attrs = parseAttributes(line.slice(18));
    let next = i + 1;
    while (next < lines.length && (!lines[next] || lines[next].startsWith('#'))) next++;
    if (next >= lines.length) continue;
    const url = absoluteUrl(lines[next], baseUrl);
    if (!url) continue;
    const resolution = String(attrs.RESOLUTION || '').match(/(\d+)x(\d+)/i);
    variants.push({
      url,
      width: Number(resolution?.[1] || 0),
      height: Number(resolution?.[2] || 0),
      bandwidth: Number(attrs['AVERAGE-BANDWIDTH'] || attrs.BANDWIDTH || 0),
      codecs: attrs.CODECS || '',
      audioGroup: attrs.AUDIO || null
    });
    i = next;
  }
  return { variants, audioGroups };
}

function parseMediaPlaylist(text, baseUrl) {
  const lines = text.split(/\r?\n/).map((x) => x.trim());
  const segments = [];
  let duration = 0;
  let encryption = null;
  let byterange = false;
  let pendingDuration = 0;
  let mapUrl = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith('#EXT-X-KEY:')) {
      const attrs = parseAttributes(line.slice(11));
      if ((attrs.METHOD || 'NONE').toUpperCase() !== 'NONE') encryption = attrs.METHOD || 'UNKNOWN';
      continue;
    }
    if (line.startsWith('#EXT-X-BYTERANGE:')) { byterange = true; continue; }
    if (line.startsWith('#EXT-X-MAP:')) {
      const attrs = parseAttributes(line.slice(11));
      if (attrs.URI) mapUrl = absoluteUrl(attrs.URI, baseUrl);
      continue;
    }
    if (line.startsWith('#EXTINF:')) {
      pendingDuration = Number.parseFloat(line.slice(8).split(',')[0]) || 0;
      continue;
    }
    if (line.startsWith('#')) continue;
    const url = absoluteUrl(line, baseUrl);
    if (!url) continue;
    segments.push({ url, duration: pendingDuration });
    duration += pendingDuration;
    pendingDuration = 0;
  }
  return { segments, duration, encryption, byterange, mapUrl, ended: lines.includes('#EXT-X-ENDLIST') };
}

function chooseBestVariant(variants) {
  return [...variants].sort((a, b) => {
    const ap = (a.width || 0) * (a.height || 0);
    const bp = (b.width || 0) * (b.height || 0);
    return (bp - ap) || ((b.bandwidth || 0) - (a.bandwidth || 0));
  })[0] || null;
}

async function inspectHls(url, signal) {
  const firstResponse = await fetchChecked(url, { signal });
  const firstText = await firstResponse.text();
  const isMaster = /#EXT-X-STREAM-INF:/i.test(firstText);
  let variants = [];
  let selected = null;
  let playlistUrl = url;
  let audioSeparate = false;
  let audioUrl = null;

  if (isMaster) {
    const master = parseMasterPlaylist(firstText, url);
    variants = master.variants;
    selected = chooseBestVariant(variants);
    if (!selected) throw new Error('Master HLS sem variantes reproduzíveis.');
    playlistUrl = selected.url;
    if (selected.audioGroup) {
      const group = master.audioGroups.get(selected.audioGroup) || [];
      const audio = group.find((a) => a.DEFAULT === 'YES') || group[0];
      if (audio?.url) { audioSeparate = true; audioUrl = audio.url; }
    }
  }

  const mediaText = isMaster ? await (await fetchChecked(playlistUrl, { signal })).text() : firstText;
  const media = parseMediaPlaylist(mediaText, playlistUrl);
  const segmentKind = media.mapUrl || media.segments.some((s) => /\.m4s(?:[?#]|$)/i.test(s.url)) ? 'FMP4' :
    media.segments.some((s) => /\.ts(?:[?#]|$)/i.test(s.url)) ? 'MPEG_TS' : 'UNKNOWN';

  return {
    masterUrl: url,
    isMaster,
    variants: variants.map((v) => ({ width: v.width, height: v.height, bandwidth: v.bandwidth, codecs: v.codecs, url: v.url })),
    selectedVariant: selected ? { width: selected.width, height: selected.height, bandwidth: selected.bandwidth, codecs: selected.codecs, url: selected.url } : null,
    playlistUrl,
    segments: media.segments,
    segmentCount: media.segments.length,
    duration: media.duration,
    encryption: media.encryption || 'NONE',
    byterange: media.byterange,
    mapUrl: media.mapUrl,
    segmentKind,
    ended: media.ended,
    separateAudio: audioSeparate,
    audioUrl
  };
}

async function notifyProgress(jobId, payload) {
  try { await chrome.runtime.sendMessage({ target: 'background', type: 'HLS_PROGRESS', jobId, ...payload }); } catch (_) {}
}

async function parallelMap(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function assembleHlsTs({ url, jobId, concurrency = 4 }) {
  const controller = new AbortController();
  hlsControllers.set(jobId, controller);
  try {
    await notifyProgress(jobId, { stage: 'manifest', done: 0, total: 1, percent: 2 });
    const info = await inspectHls(url, controller.signal);
    if (info.encryption !== 'NONE') throw new Error(`HLS com criptografia ${info.encryption} não é suportado.`);
    if (info.byterange) throw new Error('HLS com EXT-X-BYTERANGE ainda não é suportado.');
    if (info.separateAudio) throw new Error('Esta variante HLS usa áudio separado; requer mux/remux dedicado.');
    if (info.segmentKind !== 'MPEG_TS') throw new Error(`Segmentos ${info.segmentKind}; esta versão monta HLS MPEG-TS.`);
    if (!info.segmentCount) throw new Error('Playlist HLS sem segmentos.');

    let completed = 0;
    let totalBytes = 0;
    const buffers = await parallelMap(info.segments, concurrency, async (segment) => {
      const response = await fetchChecked(segment.url, { signal: controller.signal });
      const buffer = await response.arrayBuffer();
      totalBytes += buffer.byteLength;
      if (totalBytes > 750 * 1024 * 1024) throw new Error('Vídeo excede o limite de memória desta versão (750 MB).');
      completed++;
      await notifyProgress(jobId, {
        stage: 'segments', done: completed, total: info.segmentCount,
        percent: Math.max(3, Math.min(96, Math.round((completed / info.segmentCount) * 94)))
      });
      return new Uint8Array(buffer);
    });

    await notifyProgress(jobId, { stage: 'assembling', done: info.segmentCount, total: info.segmentCount, percent: 98 });
    const blob = new Blob(buffers, { type: 'video/mp2t' });
    const ref = keepObjectUrl(blob);
    await notifyProgress(jobId, { stage: 'ready', done: info.segmentCount, total: info.segmentCount, percent: 100 });
    return { ok: true, ...ref, bytes: blob.size, info: { ...info, segments: undefined } };
  } finally {
    hlsControllers.delete(jobId);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== 'offscreen') return false;
  (async () => {
    try {
      if (message.type === 'PROBE_IMAGE') return sendResponse(await probe(message.url));
      if (message.type === 'CONVERT_IMAGE_TO_BLOB_URL') return sendResponse(await convertImageToObjectUrl(message));
      if (message.type === 'INSPECT_HLS') {
        const info = await inspectHls(message.url, undefined);
        const safeInfo = { ...info, segments: undefined };
        return sendResponse({ ok: true, info: safeInfo });
      }
      if (message.type === 'ASSEMBLE_HLS_TS') return sendResponse(await assembleHlsTs(message));
      if (message.type === 'CANCEL_HLS') {
        hlsControllers.get(message.jobId)?.abort();
        return sendResponse({ ok: true });
      }
      if (message.type === 'RELEASE_OBJECT_URL') {
        const url = objectUrls.get(message.token);
        if (url) URL.revokeObjectURL(url);
        objectUrls.delete(message.token);
        return sendResponse({ ok: true });
      }
      sendResponse({ ok: false, error: 'Comando offscreen desconhecido.' });
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.name === 'AbortError' ? 'Operação cancelada.' : (error?.message || error)) });
    }
  })();
  return true;
});
