document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_EMAIL_DOMAIN = 'kocaeli.edu.tr';
    const OFFICIAL_ANNOUNCEMENTS_URL = 'https://bilisim.kocaeli.edu.tr/tr/duyurular';
    const STAFF_DATA_PATH = 'staff.json';
    const DEFAULT_THEME = 'dark';

    const STAFF_ICON_MAP = {
        crown: 'fa-crown',
        user: 'fa-user-tie',
        graduate: 'fa-user-graduate',
        teacher: 'fa-chalkboard-user',
        book: 'fa-book-open',
        badge: 'fa-id-badge'
    };

    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime;

    async function getStorageData(keys, defaultValues = {}) {
        if (hasChromeStorage) {
            return new Promise(resolve => {
                chrome.storage.local.get(keys, resolve);
            });
        }
        const result = {};
        const keyList = Array.isArray(keys) ? keys : Object.keys(keys);
        keyList.forEach(key => {
            const localVal = localStorage.getItem(key);
            if (localVal !== null) {
                try {
                    result[key] = JSON.parse(localVal);
                } catch (_err) {
                    result[key] = localVal;
                }
            } else {
                result[key] = Array.isArray(keys) ? defaultValues[key] : keys[key];
            }
        });
        return result;
    }

    async function setStorageData(dataObj) {
        if (hasChromeStorage) {
            return new Promise(resolve => {
                chrome.storage.local.set(dataObj, resolve);
            });
        }
        Object.keys(dataObj).forEach(key => {
            const val = dataObj[key];
            const strVal = typeof val === 'object' ? JSON.stringify(val) : val;
            localStorage.setItem(key, strVal);
        });
    }

    let staffData = [];
    let staffCategories = [];
    let categoryMeta = {};
    let staffEmailDomain = DEFAULT_EMAIL_DOMAIN;

    function createFaIcon(classNames, spinning = false) {
        const icon = document.createElement('i');
        icon.className = spinning ? `${classNames} fa-spin` : classNames;
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function setFaIcon(element, classNames, spinning = false) {
        element.replaceChildren(createFaIcon(classNames, spinning));
    }

    function staffIconClass(iconKey) {
        const key = Object.prototype.hasOwnProperty.call(STAFF_ICON_MAP, iconKey) ? iconKey : 'user';
        return `fas ${STAFF_ICON_MAP[key]}`;
    }

    function applyTheme(theme) {
        body.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    }

    getStorageData({ 'kou-bsm-theme': DEFAULT_THEME }).then(res => {
        applyTheme(res['kou-bsm-theme']);
    });

    themeToggle.addEventListener('click', () => {
        const next = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        setStorageData({ 'kou-bsm-theme': next });
    });

    function updateThemeIcon(theme) {
        setFaIcon(themeToggle, theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon');
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');

            const target = document.getElementById(`tab-${btn.dataset.tab}`);
            if (target) target.classList.add('active');
        });
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href || !link.href.startsWith('http')) return;

        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            e.preventDefault();
            chrome.tabs.create({ url: link.href });
        }
    });

    const staffContainer = document.getElementById('staff-container');
    const searchInput = document.getElementById('staff-search');

    function createStaffCard(staff) {
        const email = `${staff.emailPrefix}@${staffEmailDomain}`;
        const card = document.createElement('div');
        card.className = 'staff-card';

        const name = document.createElement('div');
        name.className = 'staff-name';
        name.textContent = staff.name;

        const course = document.createElement('div');
        course.className = 'staff-course';
        course.textContent = staff.course;

        const meta = document.createElement('div');
        meta.className = 'staff-meta';

        const title = document.createElement('span');
        title.className = 'staff-title';
        title.textContent = staff.title;

        const contact = document.createElement('div');
        contact.className = 'staff-contact';

        const mail = document.createElement('a');
        mail.href = `mailto:${email}`;
        mail.className = 'staff-email';
        mail.append(createFaIcon('fas fa-envelope'), document.createTextNode(` ${email}`));

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'copy-btn';
        copy.dataset.email = email;
        copy.title = 'E-postayı Kopyala';
        copy.append(createFaIcon('far fa-copy'));

        contact.append(mail, copy);
        meta.append(title, contact);
        card.append(name, course, meta);

        return card;
    }

    function createCategoryLabel(categoryKey) {
        const meta = categoryMeta[categoryKey] || { label: categoryKey, icon: 'user' };
        const label = document.createElement('div');
        label.className = 'category-label';
        label.append(createFaIcon(staffIconClass(meta.icon)), document.createTextNode(` ${meta.label}`));
        return label;
    }

    function createState(iconClasses, message, spinning = false) {
        const state = document.createElement('div');
        state.className = 'loading-state';

        const text = document.createElement('span');
        text.textContent = String(message || '');

        state.append(createFaIcon(iconClasses, spinning), text);
        return state;
    }

    function getStaffDataUrl() {
        if (hasChromeRuntime && chrome.runtime.getURL) return chrome.runtime.getURL(STAFF_DATA_PATH);
        return STAFF_DATA_PATH;
    }

    function normalizeSearchValue(value) {
        return String(value || '').toLocaleLowerCase('tr-TR');
    }

    function normalizeStaffConfig(config) {
        const categories = Array.isArray(config.categories) ? config.categories : [];
        const staff = Array.isArray(config.staff) ? config.staff : [];

        staffEmailDomain = typeof config.emailDomain === 'string' && config.emailDomain.trim()
            ? config.emailDomain.trim()
            : DEFAULT_EMAIL_DOMAIN;

        categoryMeta = {};
        staffCategories = categories
            .filter(category => category && category.key)
            .map(category => {
                const key = String(category.key);
                categoryMeta[key] = {
                    label: String(category.label || key),
                    icon: String(category.icon || 'user')
                };
                return key;
            });

        staffData = staff
            .filter(person => person && person.name && person.emailPrefix && person.title && person.course && person.category)
            .map(person => ({
                name: String(person.name),
                emailPrefix: String(person.emailPrefix),
                title: String(person.title),
                course: String(person.course),
                category: String(person.category)
            }));

        if (staffCategories.length === 0) {
            staffCategories = [...new Set(staffData.map(person => person.category))];
        }
    }

    async function loadStaffData() {
        staffContainer.replaceChildren(createState('fas fa-spinner', 'Personel listesi yükleniyor...', true));

        try {
            const response = await fetch(getStaffDataUrl(), { cache: 'no-store' });
            if (!response.ok) throw new Error('Personel verisi alınamadı.');

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Geçersiz personel verisi tipi.');
            }

            normalizeStaffConfig(await response.json());
            renderStaff(searchInput.value);
        } catch (_err) {
            staffData = [];
            staffCategories = [];
            categoryMeta = {};
            staffContainer.replaceChildren(createState('fas fa-info-circle', 'Personel listesi yüklenemedi.'));
        }
    }

    function renderStaff(filter = '') {
        const query = normalizeSearchValue(filter).trim();
        const fragment = document.createDocumentFragment();
        let hasResults = false;

        staffCategories.forEach(catKey => {
            const members = staffData.filter(staff => {
                if (staff.category !== catKey) return false;
                return !query ||
                    normalizeSearchValue(staff.name).includes(query) ||
                    normalizeSearchValue(staff.course).includes(query) ||
                    normalizeSearchValue(staff.title).includes(query);
            });

            if (members.length === 0) return;

            hasResults = true;
            fragment.appendChild(createCategoryLabel(catKey));
            members.forEach(staff => fragment.appendChild(createStaffCard(staff)));
        });

        if (!hasResults) {
            fragment.appendChild(createState('fas fa-info-circle', 'Sonuç bulunamadı.'));
        }

        staffContainer.replaceChildren(fragment);
    }

    staffContainer.addEventListener('click', e => {
        const btn = e.target.closest('.copy-btn');
        if (!btn || !navigator.clipboard) return;

        navigator.clipboard.writeText(btn.dataset.email).then(() => {
            btn.classList.add('copied');
            setFaIcon(btn, 'fas fa-check');

            setTimeout(() => {
                btn.classList.remove('copied');
                setFaIcon(btn, 'far fa-copy');
            }, 1500);
        });
    });

    let searchTimeout;
    searchInput.addEventListener('input', e => {
        const val = e.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderStaff(val);
        }, 200);
    });
    loadStaffData();

    const announcementsContainer = document.getElementById('announcements-container');
    const refreshBtn = document.getElementById('refresh-btn');

    function safeAnnouncementUrl(value) {
        try {
            const url = new URL(value);
            if (url.protocol === 'https:' && url.hostname === 'bilisim.kocaeli.edu.tr') return url.href;
        } catch (_err) {
            return OFFICIAL_ANNOUNCEMENTS_URL;
        }

        return OFFICIAL_ANNOUNCEMENTS_URL;
    }

    function createAnnouncementItem(item) {
        const source = item || {};
        const wrapper = document.createElement('div');
        wrapper.className = 'announcement-item';

        const link = document.createElement('a');
        link.href = safeAnnouncementUrl(source.link);
        link.textContent = source.title || 'Duyuru';

        const date = document.createElement('div');
        date.className = 'announcement-date';
        date.append(createFaIcon('fas fa-clock'), document.createTextNode(` ${source.date || 'Tarih yok'}`));

        wrapper.append(link, date);
        return wrapper;
    }

    function createLastUpdate(value) {
        const info = document.createElement('div');
        info.className = 'last-update';
        info.textContent = `Son Güncelleme: ${value}`;
        return info;
    }

    function renderAnnouncements(items, lastUpdate, error) {
        const fragment = document.createDocumentFragment();

        if (Array.isArray(items) && items.length > 0) {
            items.forEach(item => fragment.appendChild(createAnnouncementItem(item)));
            if (lastUpdate) fragment.appendChild(createLastUpdate(lastUpdate));
        } else {
            const message = typeof error === 'string' && error.trim() ? error : 'Henüz duyuru bulunamadı.';
            fragment.appendChild(createState('fas fa-info-circle', message));
        }

        announcementsContainer.replaceChildren(fragment);
    }

    function setRefreshLoading(loading) {
        refreshBtn.disabled = loading;

        const label = document.createElement('span');
        label.textContent = loading ? 'Yenileniyor...' : 'Yenile';

        refreshBtn.replaceChildren(
            createFaIcon(loading ? 'fas fa-spinner' : 'fas fa-sync-alt', loading),
            label
        );
    }

    function loadAnnouncements() {
        if (!hasChromeStorage) {
            renderAnnouncements([], null, 'Duyurular yalnızca eklenti içinde görüntülenebilir.');
            return;
        }

        getStorageData(['bsmAnnouncements', 'lastUpdate', 'announcementError', 'fetchTimestamp']).then(res => {
            renderAnnouncements(res.bsmAnnouncements, res.lastUpdate, res.announcementError);

            const CACHE_EXPIRY_MS = 60 * 60 * 1000;
            if (hasChromeRuntime &&
                (!res.fetchTimestamp || (Date.now() - res.fetchTimestamp > CACHE_EXPIRY_MS))) {
                chrome.runtime.sendMessage({ action: 'refreshData' }, () => {
                    loadAnnouncements();
                });
            }
        });
    }

    let lastRefresh = 0;
    const REFRESH_COOLDOWN_MS = 10000;

    refreshBtn.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastRefresh < REFRESH_COOLDOWN_MS) {
            const secondsLeft = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastRefresh)) / 1000);
            alert(`Lütfen çok sık yenileme yapmayın. (${secondsLeft} saniye bekleyin)`);
            return;
        }
        lastRefresh = now;

        setRefreshLoading(true);

        if (!hasChromeRuntime) {
            setRefreshLoading(false);
            loadAnnouncements();
            return;
        }

        chrome.runtime.sendMessage({ action: 'refreshData' }, () => {
            setRefreshLoading(false);
            loadAnnouncements();
        });
    });

    loadAnnouncements();

    // ==========================================
    // YEMEKHANE MODÜLÜ (DINING MODULE)
    // ==========================================
    const diningPrevBtn = document.getElementById('dining-prev');
    const diningNextBtn = document.getElementById('dining-next');
    const diningDateLabel = document.getElementById('dining-date-label');
    
    const foodSoup = document.getElementById('food-soup');
    const foodMain = document.getElementById('food-main');
    const foodSide = document.getElementById('food-side');
    const foodDessert = document.getElementById('food-dessert');
    const foodCalories = document.getElementById('food-calories');
    
    const MIN_NAV_DATE = new Date(2026, 4, 4); // 4 Mayıs 2026
    const MAX_NAV_DATE = new Date(2026, 5, 1); // 1 Haziran 2026

    function resetTime(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function updateNavButtonsState() {
        const curTime = resetTime(activeDiningDate).getTime();
        const minTime = resetTime(MIN_NAV_DATE).getTime();
        const maxTime = resetTime(MAX_NAV_DATE).getTime();
        
        diningPrevBtn.disabled = curTime <= minTime;
        diningNextBtn.disabled = curTime >= maxTime;
    }

    let activeDiningDate = resetTime(new Date());
    
    // Eğer şu anki tarih sınırlar dışındaysa sınırlar içine çekelim
    const minTime = resetTime(MIN_NAV_DATE).getTime();
    const maxTime = resetTime(MAX_NAV_DATE).getTime();
    const activeTime = activeDiningDate.getTime();
    
    if (activeTime < minTime) {
        activeDiningDate = new Date(MIN_NAV_DATE);
    } else if (activeTime > maxTime) {
        activeDiningDate = new Date(MAX_NAV_DATE);
    }

    let localDiningMenu = null;

    function formatDateForAPI(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDateLabel(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('tr-TR', options);
    }

    async function loadDiningMenu(dateObj) {
        const dateKey = formatDateForAPI(dateObj);
        diningDateLabel.textContent = formatDateLabel(dateObj);
        
        updateNavButtonsState();

        // Hafta sonu kontrolü
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            renderDiningMenu(null, 'Hafta sonu yemek servisi yapılmamaktadır.');
            return;
        }

        // 1. Önbellek kontrolü
        const cachedRes = await getStorageData(['bsmDiningMenu']);
        const cached = cachedRes.bsmDiningMenu;
        if (cached && cached[dateKey]) {
            renderDiningMenu(cached[dateKey]);
            return;
        }

        // 2. Yerel veritabanı (yemekhane.json) kontrolü
        try {
            if (!localDiningMenu) {
                const response = await fetch('yemekhane.json');
                if (!response.ok) throw new Error('Yemekhane verisi yüklenemedi.');

                const contentType = response.headers.get('content-type');
                if (contentType && !contentType.includes('application/json')) {
                    throw new Error('Geçersiz yemekhane verisi tipi.');
                }

                localDiningMenu = await response.json();
            }

            if (localDiningMenu && localDiningMenu[dateKey]) {
                renderDiningMenu(localDiningMenu[dateKey]);
            } else {
                renderDiningMenu(null, 'Bu tarih için yemek listesi bulunamadı.');
            }
        } catch (_err) {
            renderDiningMenu(null, 'Yemek listesi yüklenemedi.');
        }
    }

    function renderDiningMenu(menu, errorMessage = '') {
        if (menu) {
            foodSoup.textContent = menu.corba || '-';
            foodMain.textContent = menu.anaYemek || '-';
            foodSide.textContent = menu.yardimciYemek || '-';
            foodDessert.textContent = menu.tatliMeyve || '-';
            foodCalories.textContent = menu.kalori || '-';
        } else {
            foodSoup.textContent = '-';
            foodMain.textContent = errorMessage;
            foodSide.textContent = '-';
            foodDessert.textContent = '-';
            foodCalories.textContent = '-';
        }
    }

    diningPrevBtn.addEventListener('click', () => {
        const prevDate = new Date(activeDiningDate);
        prevDate.setDate(prevDate.getDate() - 1);
        
        if (resetTime(prevDate).getTime() >= resetTime(MIN_NAV_DATE).getTime()) {
            activeDiningDate = prevDate;
            loadDiningMenu(activeDiningDate);
        }
    });

    diningNextBtn.addEventListener('click', () => {
        const nextDate = new Date(activeDiningDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        if (resetTime(nextDate).getTime() <= resetTime(MAX_NAV_DATE).getTime()) {
            activeDiningDate = nextDate;
            loadDiningMenu(activeDiningDate);
        }
    });

    loadDiningMenu(activeDiningDate);

    // ==========================================
    // DERS PROGRAMI MODÜLÜ (SCHEDULE MODULE)
    // ==========================================
    const SCHEDULE_STORAGE_KEY = 'bsmSchedule';
    const DAYS = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];

    const scheduleList = document.getElementById('schedule-list');
    const scheduleForm = document.getElementById('schedule-form');
    const scheduleAddBtn = document.getElementById('schedule-add');
    const scheduleSaveBtn = document.getElementById('schedule-save');
    const scheduleCancelBtn = document.getElementById('schedule-cancel');
    const scheduleNameInput = document.getElementById('schedule-name');
    const scheduleTimeInput = document.getElementById('schedule-time');
    const scheduleRoomInput = document.getElementById('schedule-room');
    const scheduleInstructorInput = document.getElementById('schedule-instructor');

    let activeScheduleDay = 'pazartesi';
    let scheduleData = {};
    let editingLessonId = null;

    const DEFAULT_SCHEDULE = {
        pazartesi: [
            { id: 'p1', name: 'Fizik II', time: '09:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'p2', name: 'Fizik II', time: '10:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'p3', name: 'Fizik II', time: '11:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'p4', name: 'Matematik II', time: '13:00', room: '1040', instructor: 'Prof. Dr. Çiğdem Gündüz' },
            { id: 'p5', name: 'Matematik II', time: '14:00', room: '1040', instructor: 'Prof. Dr. Çiğdem Gündüz' },
            { id: 'p6', name: 'Matematik II', time: '15:00', room: '1040', instructor: 'Prof. Dr. Çiğdem Gündüz' }
        ],
        sali: [
            { id: 's1', name: 'Kariyer Planlama', time: '10:00', room: '1040', instructor: 'Doç. Dr. Faruk Selahattin Yolcu' },
            { id: 's2', name: 'Kariyer Planlama', time: '11:00', room: '1040', instructor: 'Doç. Dr. Faruk Selahattin Yolcu' },
            { id: 's3', name: 'Matematik II', time: '13:00', room: '1040', instructor: 'Prof. Dr. Çiğdem Gündüz' },
            { id: 's4', name: 'Matematik II', time: '14:00', room: '1040', instructor: 'Prof. Dr. Çiğdem Gündüz' }
        ],
        carsamba: [
            { id: 'c1', name: 'Yönetim Bilişim Sistemleri', time: '09:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'c2', name: 'Yönetim Bilişim Sistemleri', time: '10:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'c3', name: 'Yönetim Bilişim Sistemleri', time: '11:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'c4', name: 'Fizik II', time: '13:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'c5', name: 'Fizik II', time: '14:00', room: '1040', instructor: 'Prof. Dr. Hikmet Hakan Gürel' },
            { id: 'c6', name: 'Programlama Laboratuvarı-II', time: '15:00', room: 'Lab', instructor: 'Öğr. Gör. Yavuz Selim Fatihoğlu' }
        ],
        persembe: [
            { id: 'pe1', name: 'Algoritma ve Programlama-II', time: '09:00', room: '1040', instructor: 'Öğr. Gör. Yavuz Selim Fatihoğlu' },
            { id: 'pe2', name: 'Algoritma ve Programlama-II', time: '10:00', room: '1040', instructor: 'Öğr. Gör. Yavuz Selim Fatihoğlu' },
            { id: 'pe3', name: 'Algoritma ve Programlama-II', time: '11:00', room: '1040', instructor: 'Öğr. Gör. Yavuz Selim Fatihoğlu' },
            { id: 'pe4', name: 'Lineer Cebir', time: '14:00', room: '1040', instructor: 'Prof. Dr. Abdülkadir Aygünoğlu' },
            { id: 'pe5', name: 'Lineer Cebir', time: '15:00', room: '1040', instructor: 'Prof. Dr. Abdülkadir Aygünoğlu' }
        ],
        cuma: [
            { id: 'cu1', name: 'Atatürk İlkeleri ve İnkılap Tarihi II', time: '08:00', room: 'UZEM', instructor: 'Öğr. Gör. Bilgin Ayhan' },
            { id: 'cu2', name: 'Atatürk İlkeleri ve İnkılap Tarihi II', time: '09:00', room: 'UZEM', instructor: 'Öğr. Gör. Bilgin Ayhan' },
            { id: 'cu3', name: 'İngilizce II', time: '10:00', room: 'UZEM', instructor: 'Öğr. Gör. İsmail Hakkı Paslı' },
            { id: 'cu4', name: 'İngilizce II', time: '11:00', room: 'UZEM', instructor: 'Öğr. Gör. İsmail Hakkı Paslı' },
            { id: 'cu5', name: 'İngilizce II', time: '12:00', room: 'UZEM', instructor: 'Öğr. Gör. İsmail Hakkı Paslı' },
            { id: 'cu6', name: 'Türk Dili II', time: '15:00', room: 'UZEM', instructor: 'Öğr. Gör. Özgür Uçum' }
        ]
    };

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    async function loadSchedule() {
        const res = await getStorageData([SCHEDULE_STORAGE_KEY]);
        if (res[SCHEDULE_STORAGE_KEY]) {
            scheduleData = res[SCHEDULE_STORAGE_KEY];
            
            // Otomatik Veri Migrasyonu: Kullanıcıda önbelleğe alınmış eski verileri (Z023 -> Lab, 1049 -> 1040, Online -> UZEM) otomatik düzelt
            let migrated = false;
            Object.keys(scheduleData).forEach(day => {
                if (Array.isArray(scheduleData[day])) {
                    scheduleData[day].forEach(lesson => {
                        if (lesson.room === 'Z023') {
                            lesson.room = 'Lab';
                            migrated = true;
                        }
                        if (lesson.room === 'Online') {
                            lesson.room = 'UZEM';
                            migrated = true;
                        }
                        if (lesson.room === '1049' && lesson.name === 'Kariyer Planlama') {
                            lesson.room = '1040';
                            migrated = true;
                        }
                    });
                }
            });
            if (migrated) {
                await saveSchedule();
            }
        } else {
            scheduleData = structuredClone(DEFAULT_SCHEDULE);
            await setStorageData({ [SCHEDULE_STORAGE_KEY]: scheduleData });
        }
        renderScheduleDay(activeScheduleDay);
    }

    async function saveSchedule() {
        await setStorageData({ [SCHEDULE_STORAGE_KEY]: scheduleData });
    }

    function renderScheduleDay(day) {
        const lessons = (scheduleData[day] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        const fragment = document.createDocumentFragment();

        if (lessons.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'schedule-empty';
            empty.append(createFaIcon('fas fa-calendar-xmark'), document.createTextNode('Bu gün ders yok.'));
            fragment.appendChild(empty);
        } else {
            lessons.forEach(lesson => {
                const card = document.createElement('div');
                card.className = 'schedule-card';

                const time = document.createElement('div');
                time.className = 'schedule-card-time';
                time.textContent = lesson.time || '-';

                const info = document.createElement('div');
                info.className = 'schedule-card-info';

                const name = document.createElement('div');
                name.className = 'schedule-card-name';
                name.textContent = lesson.name || '-';

                const detail = document.createElement('div');
                detail.className = 'schedule-card-detail';

                if (lesson.room) {
                    detail.append(createFaIcon('fas fa-door-open'), document.createTextNode(lesson.room));
                }
                if (lesson.instructor) {
                    detail.append(createFaIcon('fas fa-user'), document.createTextNode(lesson.instructor));
                }

                info.append(name, detail);

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'schedule-edit-btn';
                editBtn.title = 'Dersi Düzenle';
                editBtn.dataset.lessonId = lesson.id;
                editBtn.append(createFaIcon('fas fa-edit'));

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'schedule-delete-btn';
                delBtn.title = 'Dersi Sil';
                delBtn.dataset.lessonId = lesson.id;
                delBtn.append(createFaIcon('fas fa-trash-alt'));

                card.append(time, info, editBtn, delBtn);
                fragment.appendChild(card);
            });
        }

        scheduleList.replaceChildren(fragment);
    }

    document.querySelectorAll('.schedule-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.schedule-day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeScheduleDay = btn.dataset.day;
            renderScheduleDay(activeScheduleDay);
            hideScheduleForm();
        });
    });

    scheduleAddBtn.addEventListener('click', () => {
        editingLessonId = null;
        scheduleNameInput.value = '';
        scheduleTimeInput.value = '';
        scheduleRoomInput.value = '';
        scheduleInstructorInput.value = '';
        scheduleForm.classList.remove('d-none');
        scheduleAddBtn.classList.add('d-none');
        scheduleNameInput.focus();
    });

    scheduleCancelBtn.addEventListener('click', hideScheduleForm);

    function hideScheduleForm() {
        scheduleForm.classList.add('d-none');
        scheduleAddBtn.classList.remove('d-none');
        editingLessonId = null;
    }

    scheduleSaveBtn.addEventListener('click', () => {
        const name = scheduleNameInput.value.trim();
        const time = scheduleTimeInput.value.trim();
        const room = scheduleRoomInput.value.trim();
        const instructor = scheduleInstructorInput.value.trim();

        if (!name) { scheduleNameInput.focus(); return; }

        // Akıllı saat formatı dönüştürücü ve doğrulayıcı
        let formattedTime = time.replace(/[\.-]/g, ':'); // Nokta veya tireleri iki noktaya çevir
        
        // Tek veya çift haneli saat girişlerini otomatik düzelt (örn: "9" -> "09:00", "15" -> "15:00")
        if (/^\d{1,2}$/.test(formattedTime)) {
            formattedTime = formattedTime.padStart(2, '0') + ':00';
        }
        
        // H:MM formatını HH:MM yap (örn: "9:30" -> "09:30")
        if (/^\d:\d{2}$/.test(formattedTime)) {
            formattedTime = '0' + formattedTime;
        }

        // HH:MM format kontrolü (regex - geçersiz saatleri önler: 00-23 ve 00-59 arası)
        const isTimeValid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formattedTime);
        if (!isTimeValid) {
            alert('Lütfen geçerli bir saat girin! (Örn: 09:00 veya 15:30)');
            scheduleTimeInput.focus();
            return;
        }

        if (!scheduleData[activeScheduleDay]) scheduleData[activeScheduleDay] = [];

        if (editingLessonId) {
            const idx = scheduleData[activeScheduleDay].findIndex(l => l.id === editingLessonId);
            if (idx !== -1) {
                scheduleData[activeScheduleDay][idx] = { id: editingLessonId, name, time: formattedTime, room, instructor };
            }
        } else {
            scheduleData[activeScheduleDay].push({ id: generateId(), name, time: formattedTime, room, instructor });
        }

        saveSchedule();
        renderScheduleDay(activeScheduleDay);
        hideScheduleForm();
    });

    scheduleList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.schedule-edit-btn');
        if (editBtn) {
            const id = editBtn.dataset.lessonId;
            const lesson = (scheduleData[activeScheduleDay] || []).find(l => l.id === id);
            if (lesson) {
                editingLessonId = id;
                scheduleNameInput.value = lesson.name;
                scheduleTimeInput.value = lesson.time;
                scheduleRoomInput.value = lesson.room || '';
                scheduleInstructorInput.value = lesson.instructor || '';
                scheduleForm.classList.remove('d-none');
                scheduleAddBtn.classList.add('d-none');
                scheduleNameInput.focus();
            }
            return;
        }

        const delBtn = e.target.closest('.schedule-delete-btn');
        if (delBtn) {
            const id = delBtn.dataset.lessonId;
            if (!scheduleData[activeScheduleDay]) return;

            scheduleData[activeScheduleDay] = scheduleData[activeScheduleDay].filter(l => l.id !== id);
            saveSchedule();
            renderScheduleDay(activeScheduleDay);
        }
    });

    // Bugünün gününü aktif yap
    const todayIndex = new Date().getDay();
    if (todayIndex >= 1 && todayIndex <= 5) {
        const todayKey = DAYS[todayIndex - 1];
        activeScheduleDay = todayKey;
        document.querySelectorAll('.schedule-day-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.day === todayKey);
        });
    }

    loadSchedule();
});
