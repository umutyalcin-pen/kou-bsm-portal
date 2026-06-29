const ALARM_NAME = 'fetchAnnouncements';
const API_BASE = 'https://api.kocaeli.edu.tr/api/';
const SITE_HOSTNAME = 'bilisim.kocaeli.edu.tr';
const FETCH_TIMEOUT_MS = 10000;

chrome.runtime.onInstalled.addListener(() => {
    scheduleAnnouncementsAlarm();
    refreshSilently();
});

chrome.runtime.onStartup.addListener(() => {
    scheduleAnnouncementsAlarm();
    refreshSilently();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) refreshSilently();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.action !== 'refreshData') return false;
    if (!sender || sender.id !== chrome.runtime.id) {
        sendResponse({ success: false, error: 'Yetkisiz istek.' });
        return false;
    }

    // Kullanıcı manuel tetiklediği için force=true gönderiyoruz
    fetchAnnouncements(true)
        .then((data) => sendResponse({ success: true, count: data.length }))
        .catch((err) => {
            chrome.storage.local.set({ announcementError: 'Duyurular alınamadı.' });
            sendResponse({ success: false, error: err.message });
        });

    return true;
});

let isFetching = false;

async function fetchAnnouncements(force = false) {
    if (isFetching) return [];

    const { fetchTimestamp, bsmAnnouncements } = await chrome.storage.local.get(['fetchTimestamp', 'bsmAnnouncements']);
    
    // Rate Limiting (Spam Koruması): Eğer force refresh değilse ve son 30 sn içinde istek atıldıysa, önbelleği dön.
    if (!force && fetchTimestamp && Date.now() - fetchTimestamp < 30000 && bsmAnnouncements) {
        return bsmAnnouncements;
    }

    isFetching = true;
    try {
        const siteCode = await fetchSiteCode();
        const data = await fetchAnnouncementList(siteCode);

        await chrome.storage.local.set({
            bsmAnnouncements: data,
            announcementError: null,
            lastUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            fetchTimestamp: Date.now()
        });

        return data;
    } finally {
        isFetching = false;
    }
}

function refreshSilently() {
    fetchAnnouncements().catch(() => {
        chrome.storage.local.set({ announcementError: 'Duyurular alınamadı.' });
    });
}

function scheduleAnnouncementsAlarm() {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
}

async function fetchSiteCode() {
    const url = `${API_BASE}Admin/Isp/GetIspCodeByName?IspWebUrl=${encodeURIComponent(SITE_HOSTNAME)}`;
    const json = await requestJson(url, {}, 'Site kodu alınamadı.');
    const code = json && json.data && json.data.code;

    return normalizeSiteCode(code);
}

async function fetchAnnouncementList(siteCode) {
    const endpoints = [
        'Announcement/GetAll',
        'Event/GetAll',
        'News/GetAll'
    ];

    const requests = endpoints.map(ep => 
        requestJson(`${API_BASE}${ep}`, { headers: { code: siteCode } }, 'Veri alınamadı')
            .catch(() => null)
    );

    const results = await Promise.allSettled(requests);
    let allItems = [];

    // 1. Duyurular (Announcements)
    if (results?.[0]?.status === 'fulfilled' && results?.[0]?.value && Array.isArray(results?.[0]?.value?.data)) {
        allItems.push(...results[0].value.data.map(item => {
            const ann = item && item.announcement;
            if (!ann || !ann.title || !ann.startDate) return null;
            return {
                title: String(ann.title).slice(0, 200),
                link: buildContentLink('duyurular', item.seoUrl),
                date: new Date(ann.startDate)
            };
        }).filter(Boolean));
    }

    // 2. Etkinlikler (Events)
    if (results?.[1]?.status === 'fulfilled' && results?.[1]?.value && Array.isArray(results?.[1]?.value?.data)) {
        const eventData = results?.[1]?.value?.data?.[0];
        if (eventData && Array.isArray(eventData.getAllEventViewModel)) {
            allItems.push(...eventData.getAllEventViewModel.map(item => {
                const ev = item && item.event;
                if (!ev || (!ev.title && !ev.shortDescription) || !ev.startDate) return null;
                return {
                    title: String(ev.title || ev.shortDescription).slice(0, 200),
                    link: `https://${SITE_HOSTNAME}/tr/etkinlikler`, 
                    date: new Date(ev.startDate)
                };
            }).filter(Boolean));
        }
    }

    // 3. Haberler (News)
    if (results?.[2]?.status === 'fulfilled' && results?.[2]?.value && Array.isArray(results?.[2]?.value?.data)) {
        allItems.push(...results[2].value.data.map(item => {
            const news = item && item.news;
            if (!news || !news.title || !news.startDate) return null;
            return {
                title: String(news.title).slice(0, 200),
                link: buildContentLink('haberler', item.seoUrl),
                date: new Date(news.startDate)
            };
        }).filter(Boolean));
    }

    if (allItems.length === 0) {
        throw new Error('Hiçbir veri alınamadı.');
    }

    // Tarihe göre yeniden eskiye sırala ve ilk 20 elemanı al
    allItems.sort((a, b) => b.date - a.date);
    allItems = allItems.slice(0, 20);

    // Tarihleri UI formatına çevir
    return allItems.map(item => ({
        ...item,
        date: item.date.toLocaleDateString('tr-TR')
    }));
}

async function requestJson(url, options = {}, errorMessage = 'İstek tamamlanamadı.', retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            if (!response.ok) throw new Error(errorMessage);

            // Yanıt tipi kontrolü (application/json)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Geçersiz yanıt tipi (JSON bekleniyordu).');
            }

            return await response.json();
        } catch (err) {
            if (i === retries - 1) {
                if (err && err.name === 'AbortError') {
                    throw new Error('İstek zaman aşımına uğradı.');
                }
                throw err;
            }
            await new Promise(r => setTimeout(r, backoff));
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

function normalizeSiteCode(value) {
    const code = String(value || '').trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(code)) {
        throw new Error('Site kodu yanıtı geçersiz.');
    }

    return code;
}

function normalizeSeoSlug(value) {
    const slug = String(value || '').trim();
    if (!slug || slug.includes('..') || slug.includes('/')) return '';
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(slug)) return '';
    return slug.slice(0, 200);
}

function buildContentLink(section, seoUrl) {
    const slug = normalizeSeoSlug(seoUrl);
    const base = `https://${SITE_HOSTNAME}/tr/${section}`;
    return slug ? `${base}/${slug}` : base;
}
