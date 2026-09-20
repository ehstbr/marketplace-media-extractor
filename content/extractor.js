(() => {
  const MME = globalThis.MME;

  function safeUrl(url) {
    try { return new URL(url, location.href).href; } catch { return null; }
  }

  function getMeta(name, prop = false) {
    const selector = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    return document.querySelector(selector)?.content?.trim() || '';
  }

  function parseIds() {
    const all = `${location.pathname} ${location.search} ${location.hash}`;
    const catalog = location.pathname.match(/\/p\/(MLB\d+)/i)?.[1]?.toUpperCase() || null;
    const queryItem = new URL(location.href).searchParams.get('item_id')?.toUpperCase() || null;
    const wid = new URL(location.href).searchParams.get('wid')?.toUpperCase() || null;
    const pathItem = location.pathname.match(/\/(MLB\d+)(?:[-/?#]|$)/i)?.[1]?.toUpperCase() || null;
    const allItems = [...all.matchAll(/\bMLB\d+\b/gi)].map((m) => m[0].toUpperCase());
    const listing = queryItem || wid || (pathItem !== catalog ? pathItem : null) || allItems.find((id) => id !== catalog) || null;
    return { listingId: listing, catalogId: catalog };
  }

  function parseJsonLdProducts() {
    const products = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(script.textContent || '{}');
        const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
        while (queue.length) {
          const node = queue.shift();
          if (!node || typeof node !== 'object') continue;
          if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
          if (String(node['@type'] || '').toLowerCase().includes('product')) products.push(node);
        }
      } catch (_) {}
    }
    return products;
  }

  function detectTitle(products) {
    return products.find((p) => p.name)?.name?.trim() ||
      getMeta('og:title', true) ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.title.replace(/\s*\|\s*Mercado Livre.*$/i, '').trim();
  }

  function detectBrand(products) {
    for (const p of products) {
      if (typeof p.brand === 'string') return p.brand;
      if (p.brand?.name) return p.brand.name;
    }
    return '';
  }

  function extractExtension(url) {
    const match = String(url).match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);
    return match?.[1]?.toLowerCase() || '';
  }

  function imageKey(url) {
    try {
      const u = new URL(url);
      let path = u.pathname;
      path = path.replace(/-[A-Z](?=\.(?:jpe?g|png|webp)$)/i, '-SIZE');
      return `${u.hostname}${path}`.toLowerCase();
    } catch {
      return String(url).toLowerCase();
    }
  }

  function highResCandidates(url) {
    const out = [url];
    try {
      const u = new URL(url);
      const cleanPath = u.pathname;
      if (/mlstatic\.com$/i.test(u.hostname) || /\.mlstatic\.com$/i.test(u.hostname)) {
        const fJpg = cleanPath.replace(/-[A-Z](?=\.(?:jpe?g|png|webp)$)/i, '-F').replace(/\.(?:png|webp|jpeg)$/i, '.jpg');
        const fSame = cleanPath.replace(/-[A-Z](?=\.(?:jpe?g|png|webp)$)/i, '-F');
        for (const path of [fJpg, fSame]) {
          const clone = new URL(u.href);
          clone.pathname = path;
          clone.search = '';
          out.unshift(clone.href);
        }
      }
    } catch (_) {}
    return [...new Set(out.filter(Boolean))];
  }

  function addImage(map, url, meta = {}) {
    url = safeUrl(url);
    if (!url || !/^https?:/i.test(url)) return;
    if (!/mlstatic|mercadolivre|mercadolibre/i.test(url) && !meta.structured) return;
    const key = imageKey(url);
    const current = map.get(key) || {
      id: `img-${map.size + 1}`,
      type: 'image',
      subtype: meta.subtype || null,
      galleryPosition: meta.galleryPosition || map.size + 1,
      sourceUrl: url,
      candidateUrls: [],
      mimeType: '',
      extension: extractExtension(url) || 'jpg',
      originalExtension: extractExtension(url) || 'jpg',
      width: meta.width || 0,
      height: meta.height || 0,
      selected: meta.subtype !== 'video_poster',
      source: meta.source || 'dom'
    };
    current.candidateUrls.push(...highResCandidates(url));
    current.candidateUrls = [...new Set(current.candidateUrls)];
    current.width = Math.max(current.width || 0, meta.width || 0);
    current.height = Math.max(current.height || 0, meta.height || 0);
    if (meta.galleryPosition && meta.galleryPosition < current.galleryPosition) current.galleryPosition = meta.galleryPosition;
    map.set(key, current);
  }

  function visibleRect(el, min = 80) {
    if (!el?.getBoundingClientRect) return null;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (rect.width < min || rect.height < min || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) <= 0) return null;
    return rect;
  }

  function galleryRootFor(mediaEl = null) {
    mediaEl = mediaEl || [...document.querySelectorAll('video, img')]
      .filter((el) => visibleRect(el, 180))
      .sort((a, b) => {
        const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
        return (br.width * br.height) - (ar.width * ar.height);
      })[0] || null;
    if (!mediaEl) return null;

    const preferred = [
      '.ui-pdp-gallery',
      '[class*="ui-pdp-gallery"]',
      '[data-testid*="gallery"]',
      '[class*="product-gallery"]',
      '[class*="media-gallery"]',
      '[class*="shorts"][class*="viewer"]',
      '[class*="video"][class*="viewer"]'
    ];
    for (const selector of preferred) {
      const found = mediaEl.closest?.(selector);
      const rect = found && visibleRect(found, 180);
      if (found && rect && rect.width <= innerWidth * 1.25 && rect.height <= innerHeight * 1.5) return found;
    }

    let best = null;
    let node = mediaEl.parentElement;
    const mediaRect = mediaEl.getBoundingClientRect();
    for (let depth = 0; node && node !== document.body && depth < 8; depth++, node = node.parentElement) {
      const rect = visibleRect(node, 180);
      if (!rect) continue;
      const classText = `${node.className || ''} ${node.id || ''}`.toLowerCase();
      const semantic = /(gallery|picture|image|media|carousel|viewer|shorts|pdp)/.test(classText);
      const notHuge = rect.width <= Math.max(mediaRect.width * 2.4, innerWidth * .9) && rect.height <= Math.max(mediaRect.height * 2.8, innerHeight * 1.15);
      if (semantic && notHuge) best = node;
    }
    return best || mediaEl.parentElement;
  }

  function collectImages(products) {
    const map = new Map();
    let pos = 1;
    for (const p of products) {
      const images = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
      for (const image of images) addImage(map, typeof image === 'string' ? image : image?.url, { structured: true, source: 'jsonld', galleryPosition: pos++ });
    }

    const og = getMeta('og:image', true);
    if (og) addImage(map, og, { structured: true, source: 'og', galleryPosition: 1 });

    // Prefer the actual product gallery. Scanning document.images collected recommendation
    // cards and banners on catalog pages, which inflated the count considerably.
    const main = findMainMediaElementInternal();
    const root = galleryRootFor(main);
    const scopeImages = root ? [...root.querySelectorAll('img')] : [];
    const fallback = scopeImages.length ? scopeImages : [...document.images].filter((img) => {
      const src = img.currentSrc || img.src || '';
      return /D_NQ_|mlstatic/i.test(src) && (img.naturalWidth >= 450 || img.naturalHeight >= 450 || visibleRect(img, 180));
    });

    for (const img of fallback) {
      const rect = img.getBoundingClientRect();
      const srcs = [img.currentSrc, img.src, img.getAttribute('data-src'), img.getAttribute('data-zoom'), img.getAttribute('data-srcset')].filter(Boolean);
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        for (const part of srcset.split(',')) srcs.push(part.trim().split(/\s+/)[0]);
      }
      const likelyProduct = img.naturalWidth >= 250 || img.naturalHeight >= 250 || rect.width >= 100 || rect.height >= 100;
      if (!likelyProduct) continue;
      for (const src of srcs) addImage(map, src, {
        width: img.naturalWidth,
        height: img.naturalHeight,
        source: root ? 'gallery-dom' : 'dom-fallback',
        galleryPosition: pos++
      });
    }

    const images = [...map.values()]
      .filter((x) => x.candidateUrls.some((u) => /D_NQ_|mlstatic/i.test(u)) || x.source === 'jsonld' || x.source === 'og')
      .sort((a, b) => a.galleryPosition - b.galleryPosition);

    images.forEach((img, index) => {
      img.galleryPosition = index + 1;
      img.imageIndex = index + 1;
    });
    return images;
  }

  function classifyDelivery(url = '') {
    const u = url.toLowerCase();
    if (u.startsWith('blob:')) return 'BLOB';
    if (/\.mp4(?:[?#]|$)/.test(u)) return 'DIRECT_MP4';
    if (/\.webm(?:[?#]|$)/.test(u)) return 'DIRECT_WEBM';
    if (/\.m3u8(?:[?#]|$)/.test(u)) return 'HLS';
    if (/\.mpd(?:[?#]|$)/.test(u)) return 'DASH';
    if (/\.m4s(?:[?#]|$)/.test(u)) return 'SEGMENT_FMP4';
    if (/\.ts(?:[?#]|$)/.test(u)) return 'SEGMENT_TS';
    return 'UNKNOWN';
  }

  function videoKey(url, clipId) {
    return clipId ? `clip:${clipId}` : String(url || '').replace(/[?#].*$/, '');
  }

  function addVideo(map, data) {
    const url = data.url ? safeUrl(data.url) || data.url : null;
    const delivery = data.delivery || classifyDelivery(url || '');
    if (['SEGMENT_FMP4', 'SEGMENT_TS'].includes(delivery)) return;
    const key = videoKey(url, data.clipId);
    if (!key) return;
    const existing = map.get(key) || {
      id: `video-${map.size + 1}`,
      type: 'video',
      galleryPosition: data.galleryPosition || 999,
      clipId: data.clipId || null,
      clipUrl: data.clipUrl || null,
      sourceUrl: url,
      bestUrl: url,
      delivery,
      extension: delivery === 'DIRECT_WEBM' ? 'webm' : 'mp4',
      width: data.width || 0,
      height: data.height || 0,
      duration: data.duration || 0,
      posterUrl: data.posterUrl || null,
      selected: true,
      source: data.source || 'dom'
    };
    if (!existing.bestUrl && url) existing.bestUrl = url;
    if (['DIRECT_MP4', 'DIRECT_WEBM'].includes(delivery)) {
      existing.bestUrl = url;
      existing.sourceUrl = url;
      existing.delivery = delivery;
    } else if (!existing.sourceUrl && url) {
      existing.sourceUrl = url;
      existing.bestUrl = url;
      existing.delivery = delivery;
    }
    existing.posterUrl = existing.posterUrl || data.posterUrl || null;
    map.set(key, existing);
  }

  function clipIdFromHlsUrl(url, knownClipIds = []) {
    for (const id of knownClipIds) {
      if (id && new RegExp(`/${id.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\.m3u8(?:[?#]|$)`, 'i').test(url)) return id;
    }
    const direct = String(url || '').match(/\/([A-Za-z0-9_-]{4,})\.m3u8(?:[?#]|$)/);
    return direct?.[1] || null;
  }

  function isLikelyMasterHls(url) {
    return /\/playlists\//i.test(url) || /shorts-api\/videos-middleware/i.test(url);
  }

  async function collectNetworkMediaEntries() {
    const entries = [];
    for (const entry of performance.getEntriesByType('resource')) {
      const delivery = classifyDelivery(entry.name);
      if (['DIRECT_MP4', 'DIRECT_WEBM', 'HLS', 'DASH'].includes(delivery)) entries.push({ url: entry.name, delivery, source: 'performance' });
    }
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_NETWORK_MEDIA' });
      for (const entry of response?.entries || []) {
        if (['DIRECT_MP4', 'DIRECT_WEBM', 'HLS', 'DASH'].includes(entry.delivery)) entries.push({ ...entry, source: 'webRequest' });
      }
    } catch (_) {}
    const seen = new Set();
    return entries.filter((e) => e.url && !seen.has(e.url) && seen.add(e.url));
  }

  async function collectVideos() {
    const map = new Map();
    let pos = 2;

    for (const video of document.querySelectorAll('video')) {
      const sources = [video.currentSrc, video.src, ...[...video.querySelectorAll('source')].map((s) => s.src)].filter(Boolean);
      if (!sources.length && video.poster) {
        addVideo(map, { url: null, posterUrl: video.poster, delivery: 'UNKNOWN', source: 'video-dom', galleryPosition: pos++ });
      }
      for (const src of sources) addVideo(map, {
        url: src,
        posterUrl: video.poster,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        source: 'video-dom',
        galleryPosition: pos++
      });
    }

    for (const anchor of document.querySelectorAll('a[href*="/shorts/clips/"]')) {
      const href = safeUrl(anchor.href);
      const match = href?.match(/\/shorts\/clips\/([^/?#]+)/i);
      const image = anchor.querySelector('img');
      const bg = getComputedStyle(anchor).backgroundImage?.match(/url\(["']?(.*?)["']?\)/)?.[1] || null;
      addVideo(map, {
        url: null,
        clipId: match?.[1] || null,
        clipUrl: href,
        posterUrl: image?.currentSrc || image?.src || bg || null,
        delivery: 'UNKNOWN',
        source: 'clip-link',
        galleryPosition: pos++
      });
    }

    const knownClipIds = [...map.values()].map((v) => v.clipId).filter(Boolean);
    const network = await collectNetworkMediaEntries();
    const masterHls = network.filter((e) => e.delivery === 'HLS' && isLikelyMasterHls(e.url));

    // Correlate the Mercado Livre Clip ID with its master HLS manifest. Avoid creating
    // a second video item for the variant playlist loaded by the player.
    for (const entry of masterHls) {
      const clipId = clipIdFromHlsUrl(entry.url, knownClipIds) || (knownClipIds.length === 1 ? knownClipIds[0] : null);
      addVideo(map, { url: entry.url, delivery: 'HLS', clipId, source: entry.source, galleryPosition: pos++ });
    }

    for (const entry of network) {
      if (entry.delivery === 'HLS') {
        if (masterHls.some((m) => m.url === entry.url)) continue;
        // A variant playlist is diagnostic data, not a separate Clip.
        if (/video-vod-clips\.mms\.mlstatic\.com/i.test(entry.url) && masterHls.length) continue;
      }
      const clipId = entry.delivery === 'HLS' ? clipIdFromHlsUrl(entry.url, knownClipIds) : null;
      addVideo(map, { url: entry.url, delivery: entry.delivery, clipId, source: entry.source, galleryPosition: pos++ });
    }

    const videos = [...map.values()].sort((a, b) => a.galleryPosition - b.galleryPosition);
    videos.forEach((v, index) => {
      v.videoIndex = index + 1;
      v.galleryPosition = Math.min(v.galleryPosition, index + 2);
    });
    return videos;
  }

  MME.refreshVideoSourcesFromNetwork = async () => {
    const listing = MME.state.listing;
    if (!listing) return;
    const videos = listing.media.filter((m) => m.type === 'video');
    const knownClipIds = videos.map((v) => v.clipId).filter(Boolean);
    const network = await collectNetworkMediaEntries();
    const masters = network.filter((e) => e.delivery === 'HLS' && isLikelyMasterHls(e.url));
    for (const video of videos) {
      let match = null;
      if (video.clipId) match = masters.find((e) => clipIdFromHlsUrl(e.url, [video.clipId]) === video.clipId);
      if (!match && videos.length === 1 && masters.length === 1) match = masters[0];
      if (match) {
        video.sourceUrl = match.url;
        video.bestUrl = match.url;
        video.delivery = 'HLS';
        video.source = `${video.source || 'clip'}+${match.source || 'network'}`;
      }
    }
  };

  function buildPosterMedia(videos, imageStartIndex) {
    const out = [];
    let idx = imageStartIndex;
    for (const video of videos) {
      if (!video.posterUrl) continue;
      out.push({
        id: `poster-${video.id}`,
        type: 'image',
        subtype: 'video_poster',
        sourceUrl: video.posterUrl,
        candidateUrls: highResCandidates(video.posterUrl),
        extension: extractExtension(video.posterUrl) || 'jpg',
        originalExtension: extractExtension(video.posterUrl) || 'jpg',
        width: 0,
        height: 0,
        selected: false,
        videoIndex: video.videoIndex,
        imageIndex: ++idx,
        galleryPosition: video.galleryPosition + 0.01,
        source: 'video-poster'
      });
    }
    return out;
  }

  MME.extractListing = async () => {
    const products = parseJsonLdProducts();
    const ids = parseIds();
    const images = collectImages(products);
    const videos = await collectVideos();
    const posters = buildPosterMedia(videos, images.length);

    const originalTitle = detectTitle(products) || 'Produto Mercado Livre';
    const previousNameKey = `productName:${ids.listingId || ids.catalogId || location.pathname}`;
    const savedName = (await chrome.storage.local.get(previousNameKey))[previousNameKey];

    const listing = {
      marketplace: 'mercadolivre',
      listingId: ids.listingId,
      catalogId: ids.catalogId,
      originalTitle,
      productName: savedName || originalTitle,
      brand: detectBrand(products),
      seller: '',
      url: location.href,
      productNameStorageKey: previousNameKey,
      media: [...images, ...videos, ...posters].sort((a, b) => a.galleryPosition - b.galleryPosition)
    };

    MME.state.listing = listing;
    return listing;
  };

  function findMainMediaElementInternal() {
    const all = [...document.querySelectorAll('video, img')].filter((el) => !el.closest?.('[id^="mme-"]'));
    const candidates = all.map((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const visible = rect.width > 180 && rect.height > 180 && rect.bottom > 0 && rect.top < innerHeight &&
        style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) > 0;
      const src = el.tagName === 'VIDEO' ? (el.currentSrc || el.src || el.poster || '') : (el.currentSrc || el.src || '');
      const likely = /mlstatic|blob:|mercadolivre|mercadolibre/i.test(src) || el.tagName === 'VIDEO';
      const classText = `${el.className || ''} ${el.parentElement?.className || ''}`.toLowerCase();
      const bonus = /(gallery|pdp|shorts|viewer|zoom|picture|media)/.test(classText) ? 1.35 : 1;
      return { el, rect, score: rect.width * rect.height * bonus, visible, likely };
    }).filter((x) => x.visible && x.likely);
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.el || null;
  }

  MME.findMainMediaElement = findMainMediaElementInternal;
  MME.findGalleryRoot = () => galleryRootFor(findMainMediaElementInternal());
  MME.imageKey = imageKey;

  MME.mediaForElement = (el) => {
    const listing = MME.state.listing;
    if (!listing || !el) return null;

    const clipAnchor = el.closest?.('a[href*="/shorts/clips/"]') || (el.matches?.('a[href*="/shorts/clips/"]') ? el : null);
    if (clipAnchor) {
      const clipId = clipAnchor.href?.match(/\/shorts\/clips\/([^/?#]+)/i)?.[1];
      if (clipId) {
        const video = listing.media.find((m) => m.type === 'video' && m.clipId === clipId);
        if (video) return video;
      }
    }

    const video = el.tagName === 'VIDEO' ? el : el.querySelector?.('video');
    if (video) {
      const src = video.currentSrc || video.src;
      const direct = listing.media.find((m) => m.type === 'video' && src && (m.bestUrl === src || m.sourceUrl === src));
      return direct || listing.media.find((m) => m.type === 'video') || null;
    }

    const img = el.tagName === 'IMG' ? el : el.querySelector?.('img');
    const src = img?.currentSrc || img?.src || img?.getAttribute?.('data-src') || '';
    if (!src) return null;
    const key = imageKey(src);
    return listing.media.find((m) => m.type === 'image' && m.subtype !== 'video_poster' && imageKey(m.sourceUrl) === key) ||
      listing.media.find((m) => m.type === 'image' && m.subtype !== 'video_poster' && (m.candidateUrls || []).some((u) => imageKey(u) === key)) || null;
  };

  MME.getCurrentMedia = () => {
    const listing = MME.state.listing;
    if (!listing) return null;
    const el = findMainMediaElementInternal();
    if (!el) return listing.media.find((m) => m.selected) || null;

    if (el.tagName === 'VIDEO') {
      const src = el.currentSrc || el.src;
      const direct = listing.media.find((m) => m.type === 'video' && src && (m.bestUrl === src || m.sourceUrl === src));
      return direct || listing.media.find((m) => m.type === 'video') || null;
    }

    const src = el.currentSrc || el.src;
    const key = imageKey(src);
    return listing.media.find((m) => m.type === 'image' && m.subtype !== 'video_poster' && imageKey(m.sourceUrl) === key) ||
      listing.media.find((m) => m.type === 'image' && m.subtype !== 'video_poster' && (m.candidateUrls || []).some((u) => imageKey(u) === key)) ||
      listing.media.find((m) => m.type === 'image' && m.subtype !== 'video_poster') || null;
  };

  MME.buildDiagnostics = async () => {
    const listing = MME.state.listing || await MME.extractListing();
    await MME.refreshVideoSourcesFromNetwork();
    let network = [];
    try { network = (await chrome.runtime.sendMessage({ type: 'GET_NETWORK_MEDIA' }))?.entries || []; } catch (_) {}
    const videoReports = [];
    for (const v of listing.media.filter((m) => m.type === 'video')) {
      let hls = null;
      if (v.delivery === 'HLS' && (v.bestUrl || v.sourceUrl)) {
        try {
          const info = await chrome.runtime.sendMessage({ type: 'INSPECT_HLS', url: v.bestUrl || v.sourceUrl });
          if (info?.ok) hls = info.info;
          else hls = { error: info?.error || 'Falha ao inspecionar HLS' };
        } catch (error) { hls = { error: String(error?.message || error) }; }
      }
      videoReports.push({
        clipId: v.clipId,
        delivery: v.delivery,
        source: v.source,
        url: v.bestUrl || v.sourceUrl || null,
        poster: Boolean(v.posterUrl),
        hls
      });
    }
    return {
      extension: 'Marketplace Media Extractor',
      version: '0.2.1',
      url: location.href,
      listingId: listing.listingId,
      catalogId: listing.catalogId,
      title: listing.originalTitle,
      images: listing.media.filter((m) => m.type === 'image' && m.subtype !== 'video_poster').length,
      videoPosters: listing.media.filter((m) => m.subtype === 'video_poster').length,
      videos: videoReports,
      network: network.slice(-120),
      resourceVideoCandidates: performance.getEntriesByType('resource')
        .map((r) => r.name)
        .filter((u) => /\.(mp4|webm|m3u8|mpd|m4s|ts)(?:[?#]|$)/i.test(u))
        .slice(-120),
      generatedAt: new Date().toISOString()
    };
  };

})();
