const DEFAULTS = {
  imageFormat: 'jpeg', jpegQuality: 0.95, folderTemplate: '{produto}',
  imageTemplate: '{produto}-{numero_imagem:02}', videoTemplate: '{produto}-video-{numero_video:02}',
  posterTemplate: '{produto}-video-{numero_video:02}-capa', quickAllAction: 'prepare', singleSaveAs: false,
  includeVideos: true, includeVideoPosters: false, floatingButton: true, galleryControls: true,
  thumbnailControls: false, downloadConcurrency: 'auto', conversionConcurrency: 'auto', onboardingCompleted: false
};

const OFFSCREEN_URL = 'offscreen/offscreen.html';
const networkByTab = new Map();
const hlsJobs = new Map();
const mediaJobs = new Map();
const downloadJobs = new Map();
const MAX_NETWORK_ENTRIES = 500;
let activeConversions = 0;
const conversionWaiters = [];

function pumpConversionQueue() {
  for (let i = 0; i < conversionWaiters.length; i++) {
    const waiter = conversionWaiters[i];
    if (activeConversions >= waiter.limit) continue;
    conversionWaiters.splice(i, 1);
    activeConversions++;
    waiter.resolve(() => {
      activeConversions = Math.max(0, activeConversions - 1);
      pumpConversionQueue();
    });
    i--;
  }
}

function acquireConversionSlot(limit = 2) {
  const safeLimit = Math.max(1, Math.min(4, Number(limit) || 2));
  return new Promise((resolve) => {
    conversionWaiters.push({ limit: safeLimit, resolve });
    pumpConversionQueue();
  });
}

async function parallelLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const count = Math.max(1, Math.min(Number(limit) || 1, items.length || 1));
  await Promise.all(Array.from({ length: count }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  // Read raw storage: chrome.storage.get(DEFAULTS) substitutes defaults for missing keys,
  // which makes it impossible to know which values were actually persisted.
  const stored = await chrome.storage.local.get(null);
  const missing = {};
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!Object.prototype.hasOwnProperty.call(stored, key)) missing[key] = value;
  }
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
  if (details.reason === 'install') await chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
});

chrome.action.onClicked.addListener(async (tab) => {
  const supported = /^https:\/\/[^/]*(?:mercadolivre\.com\.br|mercadolibre\.com)\//i.test(tab?.url || '');
  if (supported && tab?.id >= 0) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_SETTINGS_MODAL' });
      return;
    } catch (_) {}
  }
  chrome.runtime.openOptionsPage();
});

function looksLikeMediaRequest(url, type) {
  if (!url) return false;
  const u = url.toLowerCase();
  return type === 'media' || /\.(mp4|webm|m3u8|mpd|m4s|ts)(?:[?#]|$)/i.test(u) || /(?:video|clip|stream|manifest|playlist)/i.test(u);
}

function classifyDelivery(url = '') {
  const u = url.toLowerCase();
  if (/\.mp4(?:[?#]|$)/.test(u)) return 'DIRECT_MP4';
  if (/\.webm(?:[?#]|$)/.test(u)) return 'DIRECT_WEBM';
  if (/\.m3u8(?:[?#]|$)/.test(u)) return 'HLS';
  if (/\.mpd(?:[?#]|$)/.test(u)) return 'DASH';
  if (/\.m4s(?:[?#]|$)/.test(u)) return 'SEGMENT_FMP4';
  if (/\.ts(?:[?#]|$)/.test(u)) return 'SEGMENT_TS';
  return 'UNKNOWN';
}

chrome.webRequest.onBeforeRequest.addListener((details) => {
  if (details.tabId < 0 || !looksLikeMediaRequest(details.url, details.type)) return;
  const entry = { url: details.url, type: details.type, delivery: classifyDelivery(details.url), time: Date.now() };
  const list = networkByTab.get(details.tabId) || [];
  if (!list.some((x) => x.url === entry.url)) list.push(entry);
  if (list.length > MAX_NETWORK_ENTRIES) list.splice(0, list.length - MAX_NETWORK_ENTRIES);
  networkByTab.set(details.tabId, list);
}, { urls: ['https://*.mercadolivre.com.br/*', 'https://*.mercadolibre.com/*', 'https://*.mlstatic.com/*', 'https://*.meli.net/*'] });

chrome.tabs.onRemoved.addListener((tabId) => {
  networkByTab.delete(tabId);
  for (const [jobId, job] of mediaJobs) if (job.tabId === tabId) mediaJobs.delete(jobId);
});
chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === 'loading') networkByTab.delete(tabId); });

async function sendMediaProgress(jobId, payload = {}) {
  const job = mediaJobs.get(jobId);
  if (!job || job.tabId < 0) return;
  try {
    await chrome.tabs.sendMessage(job.tabId, {
      type: 'MEDIA_PROGRESS', jobId,
      mediaId: job.mediaId || null,
      kind: job.kind || 'media',
      ...payload
    });
  } catch (_) {}
}

function registerDownloadProgress(downloadId, jobId, startPercent = 55) {
  const job = mediaJobs.get(jobId);
  if (!job) return;
  downloadJobs.set(downloadId, { jobId, startPercent: Math.max(0, Math.min(95, startPercent)) });
  sendMediaProgress(jobId, { stage: 'download', percent: startPercent }).catch(() => {});
}

chrome.downloads.onChanged.addListener((delta) => {
  const tracked = downloadJobs.get(delta.id);
  if (!tracked) return;
  chrome.downloads.search({ id: delta.id }).then((items) => {
    const item = items?.[0];
    if (!item) return;
    const { jobId, startPercent } = tracked;
    if (item.state === 'complete') {
      sendMediaProgress(jobId, { stage: 'complete', percent: 100, bytesReceived: item.bytesReceived || item.fileSize || 0, totalBytes: item.totalBytes || item.fileSize || 0 }).catch(() => {});
      downloadJobs.delete(delta.id);
      mediaJobs.delete(jobId);
      return;
    }
    if (item.state === 'interrupted') {
      sendMediaProgress(jobId, { stage: 'error', percent: startPercent, error: item.error || 'Download interrompido.' }).catch(() => {});
      downloadJobs.delete(delta.id);
      mediaJobs.delete(jobId);
      return;
    }
    const total = Number(item.totalBytes || 0);
    const received = Number(item.bytesReceived || 0);
    const ratio = total > 0 ? Math.max(0, Math.min(1, received / total)) : 0;
    const percent = total > 0 ? Math.min(99, Math.round(startPercent + ratio * (99 - startPercent))) : startPercent;
    sendMediaProgress(jobId, { stage: item.paused ? 'paused' : 'download', percent, bytesReceived: received, totalBytes: total }).catch(() => {});
  }).catch(() => {});
});

async function ensureOffscreen() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_URL);
  const contexts = await chrome.runtime.getContexts?.({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [offscreenUrl] });
  if (contexts?.length) return;
  try {
    await chrome.offscreen.createDocument({ url: OFFSCREEN_URL, reasons: ['BLOBS'], justification: 'Processar imagens e montar HLS MPEG-TS localmente antes do download.' });
  } catch (error) {
    if (!String(error?.message || error).toLowerCase().includes('single offscreen')) throw error;
  }
}

async function offscreen(message) {
  await ensureOffscreen();
  return chrome.runtime.sendMessage({ target: 'offscreen', ...message });
}

function sanitizeSegment(value) {
  return String(value || '').normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-').replace(/\s+/g, ' ').replace(/[. ]+$/g, '').trim().slice(0, 160) || 'arquivo';
}
function sanitizePath(path) { return String(path || '').split('/').map(sanitizeSegment).filter(Boolean).join('/'); }

async function probeImage(url) { return offscreen({ type: 'PROBE_IMAGE', url }); }

async function resolveBestImage(media, jobId = null) {
  const candidates = [...new Set([...(media.candidateUrls || []), media.bestUrl, media.sourceUrl].filter(Boolean))];
  const probes = [];
  const limited = candidates.slice(0, 6);
  let completed = 0;
  if (jobId) await sendMediaProgress(jobId, { stage: 'resolving', percent: 5 });
  await parallelLimit(limited, 3, async (url) => {
    try {
      const result = await probeImage(url);
      if (result?.ok) probes.push({ ...result, url });
    } catch (_) {}
    completed++;
    if (jobId) await sendMediaProgress(jobId, { stage: 'resolving', percent: Math.min(30, 8 + Math.round((completed / Math.max(1, limited.length)) * 22)) });
  });
  probes.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return probes[0] || { ok: Boolean(media.sourceUrl), url: media.sourceUrl, width: media.width || 0, height: media.height || 0, mimeType: media.mimeType || '' };
}

async function downloadOriginal(url, filename, saveAs, jobId, startPercent = 45) {
  if (jobId) await sendMediaProgress(jobId, { stage: 'starting-download', percent: startPercent });
  const id = await chrome.downloads.download({ url, filename: sanitizePath(filename), saveAs: Boolean(saveAs), conflictAction: 'uniquify' });
  if (jobId) registerDownloadProgress(id, jobId, startPercent);
  return { ok: true, downloadId: id, jobId };
}

async function downloadObjectUrl(result, filename, saveAs, jobId, startPercent = 65) {
  if (!result?.ok || !result.objectUrl) throw new Error(result?.error || 'Falha ao preparar arquivo local.');
  if (jobId) await sendMediaProgress(jobId, { stage: 'starting-download', percent: startPercent });
  const id = await chrome.downloads.download({ url: result.objectUrl, filename: sanitizePath(filename), saveAs: Boolean(saveAs), conflictAction: 'uniquify' });
  if (jobId) registerDownloadProgress(id, jobId, startPercent);
  setTimeout(() => offscreen({ type: 'RELEASE_OBJECT_URL', token: result.token }).catch(() => {}), 90_000);
  return { ok: true, downloadId: id, bytes: result.bytes, info: result.info, jobId };
}

async function downloadConverted(url, filename, format, quality, saveAs, jobId, conversionConcurrency = 2) {
  const release = await acquireConversionSlot(conversionConcurrency);
  try {
    if (jobId) await sendMediaProgress(jobId, { stage: 'converting', percent: 38, format });
    const result = await offscreen({ type: 'CONVERT_IMAGE_TO_BLOB_URL', url, format, quality });
    if (jobId) await sendMediaProgress(jobId, { stage: 'converted', percent: 58, format, bytes: result?.bytes || 0 });
    return downloadObjectUrl(result, filename, saveAs, jobId, 62);
  } finally {
    release();
  }
}

async function downloadHls(url, filename, saveAs, tabId, jobId) {
  if (tabId >= 0) hlsJobs.set(jobId, tabId);
  try {
    const result = await offscreen({ type: 'ASSEMBLE_HLS_TS', url, jobId, concurrency: 4 });
    const downloaded = await downloadObjectUrl(result, filename, saveAs, jobId, 91);
    return { ...downloaded, jobId, delivery: 'HLS', output: 'MPEG_TS' };
  } finally {
    hlsJobs.delete(jobId);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  if (message.target === 'background' && message.type === 'HLS_PROGRESS') {
    const tabId = hlsJobs.get(message.jobId);
    if (tabId >= 0) chrome.tabs.sendMessage(tabId, { type: 'HLS_PROGRESS', ...message }).catch(() => {});
    const mapped = Math.max(1, Math.min(89, Math.round(Number(message.percent || 0) * 0.89)));
    sendMediaProgress(message.jobId, { stage: `hls-${message.stage || 'processing'}`, percent: mapped, done: message.done, total: message.total }).catch(() => {});
    return false;
  }
  if (message.target === 'offscreen') return false;

  if (message.type === 'OPEN_OPTIONS') { chrome.runtime.openOptionsPage().then(() => sendResponse({ ok: true })); return true; }
  if (message.type === 'GET_NETWORK_MEDIA') {
    const tabId = sender.tab?.id;
    sendResponse({ ok: true, entries: tabId >= 0 ? (networkByTab.get(tabId) || []).slice(-MAX_NETWORK_ENTRIES) : [] });
    return false;
  }
  if (message.type === 'CLEAR_NETWORK_MEDIA') {
    const tabId = sender.tab?.id; if (tabId >= 0) networkByTab.set(tabId, []); sendResponse({ ok: true }); return false;
  }
  if (message.type === 'PROBE_IMAGE') {
    probeImage(message.url).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) })); return true;
  }
  if (message.type === 'INSPECT_HLS') {
    offscreen({ type: 'INSPECT_HLS', url: message.url }).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e?.message || e) })); return true;
  }

  if (message.type === 'DOWNLOAD_MEDIA') {
    (async () => {
      const jobId = message.jobId || crypto.randomUUID();
      const tabId = sender.tab?.id ?? -1;
      const media = message.media || {};
      mediaJobs.set(jobId, { tabId, mediaId: media.id || null, kind: media.type || 'image' });
      try {
        const filename = message.filename || 'download';
        const saveAs = Boolean(message.saveAs);
        await sendMediaProgress(jobId, { stage: 'queued', percent: 1, filename });
        if (media.type === 'video') {
          const delivery = media.delivery || classifyDelivery(media.bestUrl || media.sourceUrl || '');
          const url = media.bestUrl || media.sourceUrl;
          if (['DIRECT_MP4', 'DIRECT_WEBM'].includes(delivery)) return sendResponse(await downloadOriginal(url, filename, saveAs, jobId, 20));
          if (delivery === 'HLS' && url) return sendResponse(await downloadHls(url, filename, saveAs, tabId, jobId));
          mediaJobs.delete(jobId);
          return sendResponse({ ok: false, jobId, unsupportedStream: true, delivery, error: `Vídeo ${delivery} ainda não é suportado para download.` });
        }

        const resolved = await resolveBestImage(media, jobId);
        if (!resolved?.ok || !resolved.url) throw new Error('Nenhuma fonte de imagem válida foi encontrada.');
        await sendMediaProgress(jobId, { stage: 'resolved', percent: 34, width: resolved.width, height: resolved.height });
        const format = message.imageFormat || 'original';
        if (format === 'original') return sendResponse(await downloadOriginal(resolved.url, filename, saveAs, jobId, 42));
        sendResponse(await downloadConverted(resolved.url, filename, format, Number(message.jpegQuality || 0.95), saveAs, jobId, Number(message.conversionConcurrency || 2)));
      } catch (error) {
        await sendMediaProgress(jobId, { stage: 'error', percent: 0, error: String(error?.message || error) });
        mediaJobs.delete(jobId);
        sendResponse({ ok: false, jobId, error: String(error?.message || error) });
      }
    })();
    return true;
  }
  return false;
});
