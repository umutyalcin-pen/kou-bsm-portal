const API_BASE = 'https://api.kocaeli.edu.tr/api/';
const SITE_HOSTNAME = 'bilisim.kocaeli.edu.tr';

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target !== 'offscreen' || message.type !== 'startScrape') return;
    try {
        const codeResp = await fetch(`${API_BASE}Admin/Isp/GetIspCodeByName?IspWebUrl=${SITE_HOSTNAME}`);
        const codeJson = await codeResp.json();
        const siteCode = codeJson.data.code;
        const annResp = await fetch(`${API_BASE}Announcement/GetLimitedCount?LimitCount=20`, { headers: { 'code': String(siteCode) } });
        const annJson = await annResp.json();
        const data = annJson.data.map(i => ({
            title: i.announcement.title,
            link: `https://${SITE_HOSTNAME}/tr/duyurular`,
            date: new Date(i.announcement.startDate).toLocaleDateString('tr-TR')
        }));
        chrome.runtime.sendMessage({ type: 'scrapeResult', target: 'background', success: true, data });
    } catch (err) {
        chrome.runtime.sendMessage({ type: 'scrapeResult', target: 'background', success: false, error: err.message });
    }
});
