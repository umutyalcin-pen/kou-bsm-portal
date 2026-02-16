const ALARM_NAME = 'fetchAnnouncements';
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
    fetchAnnouncements();
});
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === ALARM_NAME) fetchAnnouncements(); });
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'refreshData') fetchAnnouncements();
    if (message.type === 'scrapeResult') handleScrapeResult(message);
});
async function ensureOffscreen() {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (contexts.length > 0) return;
    await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['DOM_SCRAPING'], justification: 'Scraping Announcements' });
}
async function fetchAnnouncements() {
    await ensureOffscreen();
    chrome.runtime.sendMessage({ type: 'startScrape', target: 'offscreen' });
}
function handleScrapeResult(msg) {
    if (msg.success) {
        chrome.storage.local.set({
            bsmAnnouncements: msg.data,
            lastUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        });
    }
}
