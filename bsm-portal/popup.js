document.addEventListener('DOMContentLoaded', () => {
    const UNIVERSITY_EMAIL_DOMAIN = 'kocaeli.edu.tr';

    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('kou-bsm-theme') || 'light';

    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const next = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', next);
        localStorage.setItem('kou-bsm-theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(t) {
        const i = themeToggle.querySelector('i');
        if (i) i.className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            const targetId = `tab-${btn.dataset.tab}`;
            document.getElementById(targetId).classList.add('active');
        });
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith('http')) {
            if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
                e.preventDefault();
                chrome.tabs.create({ url: link.href });
            }
        }
    });

    const staffData = [
        { name: "Prof. Dr. Halil Yiğit", emailPrefix: "halilyigit", title: "Bölüm Başkanı", course: "TBL222: Adli Bilişim (1041) / TBL436: Kablosuz Ağ Tekn.", category: "yonetim" },
        { name: "Prof. Dr. Hikmet Hakan Gürel", emailPrefix: "hhakan.gurel", title: "Profesör", course: "Fizik II / Yönetim Bilişim Sistemleri", category: "profesor" },
        { name: "Prof. Dr. Mehmet Yıldırım", emailPrefix: "myildirim", title: "Profesör", course: "TBL306: Bilgisayar Ağları (1036) / TBL424: Yapay Zeka", category: "profesor" },
        { name: "Prof. Dr. Süleyman Eken", emailPrefix: "suleyman.eken", title: "Profesör", course: "TBL220: Python (1044) / TBL426: Görüntü İşleme", category: "profesor" },
        { name: "Prof. Dr. Zeynep Hilal Kilimci", emailPrefix: "zeynep.kilimci", title: "Profesör", course: "TBL322: Makine Öğrenmesi (1036) / TBL451: Staj II", category: "profesor" },
        { name: "Prof. Dr. Çiğdem Gündüz Aras", emailPrefix: "caras", title: "Profesör", course: "Matematik II", category: "profesor" },
        { name: "Prof. Dr. Abdülkadir Aygünoğlu", emailPrefix: "aaygunoglu", title: "Profesör", course: "Lineer Cebir", category: "profesor" },
        { name: "Doç. Dr. Mustafa Hikmet Bilgehan Uçar", emailPrefix: "mhbucar", title: "Doçent", course: "TBL204: Mantık Devreleri (1044) / TBL318: Haberleşme", category: "docent" },
        { name: "Doç. Dr. Serdar Solak", emailPrefix: "serdars", title: "Doçent", course: "TBL224: Veri Yapıları ve Algoritmalar (1044)", category: "docent" },
        { name: "Doç. Dr. Önder Yakut", emailPrefix: "onder.yakut", title: "Doçent", course: "TBL304: Web Programlama (1036) / TBL334: Bulut Bilişim", category: "docent" },
        { name: "Doç. Dr. Adnan Sondaş", emailPrefix: "asondas", title: "Doçent", course: "TBL202: Sayısal Analiz (Z023)", category: "docent" },
        { name: "Doç. Dr. Faruk Selahattin Yolcu", emailPrefix: "fsyolcu", title: "Doçent", course: "Kariyer Planlama", category: "docent" },
        { name: "Dr. Öğr. Üyesi Samet Diri", emailPrefix: "samet.diri", title: "Dr. Öğretim Üyesi", course: "TBL206: Veritabanı YBS / TBL324: İleri Java", category: "drogr" },
        { name: "Dr. Öğr. Üyesi Seda Balta Kaç", emailPrefix: "seda.balta", title: "Dr. Öğretim Üyesi", course: "TBL302: İşletim Sistemleri (1036)", category: "drogr" },
        { name: "Dr. Öğr. Üyesi Faruk Aktaş", emailPrefix: "faruk.aktas", title: "Dr. Öğretim Üyesi", course: "TBL428: Gömülü Sistem Tasarımı (Z031)", category: "drogr" },
        { name: "Öğr. Gör. Alper Metin", emailPrefix: "alperm", title: "Öğretim Görevlisi", course: "TBL208: Teknik İng. / TBL308: Bil. Güvenliği / TBL320: E-Devlet", category: "ogrgör" },
        { name: "Öğr. Gör. Yavuz Selim Fatihoğlu", emailPrefix: "yselim", title: "Öğretim Görevlisi", course: "TBL214: Görsel Prog. / TBL422: Oyun Prog. / Algoritma II", category: "ogrgör" },
        { name: "Öğr. Gör. Dr. Adem Gültürk", emailPrefix: "adem.gulturk", title: "Öğretim Görevlisi", course: "TBL460: BSM Özel Konular (1044)", category: "ogrgör" },
        { name: "Öğr. Gör. Asiye Yüksel", emailPrefix: "asiye.yuksel", title: "Öğretim Görevlisi", course: "TBL450: Proje Yönetimi (1036)", category: "ogrgör" },
        { name: "Öğr. Gör. Dr. Kerem Çolak", emailPrefix: "kerem.colak", title: "Öğretim Görevlisi", course: "TKN406: Girişimcilik (1041)", category: "ogrgör" },
        { name: "Öğr. Gör. İsmail Hakkı Paslı", emailPrefix: "ihpasli", title: "Öğretim Görevlisi (UE)", course: "İngilizce II", category: "servis" },
        { name: "Öğr. Gör. Özgür Uçum", emailPrefix: "ozgur.ucum", title: "Öğretim Görevlisi (UE)", course: "Türk Dili II", category: "servis" },
        { name: "Öğr. Gör. Bilgin Ayhan", emailPrefix: "bilgin.ayhan", title: "Öğretim Görevlisi (UE)", course: "Atatürk İlkeleri ve İnkilap Tarihi II", category: "servis" },
        { name: "Emrah Özlü", emailPrefix: "emrah.ozlu", title: "Bölüm Sekreteri", course: "İdari İşler / Bölüm Sekreterliği", category: "idari" }
    ];

    const categoryMeta = {
        yonetim: { label: "Bölüm Yönetimi", icon: "fa-crown" },
        profesor: { label: "Profesörler", icon: "fa-user-tie" },
        docent: { label: "Doçentler", icon: "fa-user-tie" },
        drogr: { label: "Dr. Öğretim Üyeleri", icon: "fa-user-graduate" },
        ogrgör: { label: "Öğretim Görevlileri", icon: "fa-chalkboard-teacher" },
        servis: { label: "Servis Dersleri (UE/Ortak)", icon: "fa-book-open" },
        idari: { label: "İdari Kadro", icon: "fa-id-badge" }
    };

    const staffContainer = document.getElementById('staff-container');
    const searchInput = document.getElementById('staff-search');

    function renderStaff(filter = '') {
        staffContainer.innerHTML = '';
        const query = filter.toLowerCase().trim();
        const categories = ["yonetim", "profesor", "docent", "drogr", "ogrgör", "servis", "idari"];

        categories.forEach(catKey => {
            const members = staffData.filter(s => {
                if (s.category !== catKey) return false;
                return !query || s.name.toLowerCase().includes(query) || s.course.toLowerCase().includes(query);
            });

            if (members.length > 0) {
                const meta = categoryMeta[catKey] || { label: catKey, icon: 'fa-user' };
                const label = document.createElement('div');
                label.className = 'category-label';
                label.innerHTML = `<i class="fas ${meta.icon}"></i> ${meta.label}`;
                staffContainer.appendChild(label);

                members.forEach(s => {
                    const email = `${s.emailPrefix}@${UNIVERSITY_EMAIL_DOMAIN}`;
                    const card = document.createElement('div');
                    card.className = 'staff-card';
                    card.innerHTML = `
                        <div class="staff-name">${s.name}</div>
                        <div class="staff-course">${s.course}</div>
                        <div class="staff-meta">
                            <span class="staff-title">${s.title}</span>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <a href="mailto:${email}" class="staff-email">
                                    <i class="fas fa-envelope"></i> ${email}
                                </a>
                                <button class="copy-btn" data-email="${email}" title="E-postayı Kopyala">
                                    <i class="far fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    staffContainer.appendChild(card);
                });
            }
        });
    }

    staffContainer.addEventListener('click', e => {
        const btn = e.target.closest('.copy-btn');
        if (btn) {
            navigator.clipboard.writeText(btn.dataset.email).then(() => {
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<i class="far fa-copy"></i>';
                }, 1500);
            });
        }
    });

    searchInput.addEventListener('input', e => renderStaff(e.target.value));
    renderStaff();

    const announcementsContainer = document.getElementById('announcements-container');
    const refreshBtn = document.getElementById('refresh-btn');

    function loadAnnouncements() {
        chrome.storage.local.get(['bsmAnnouncements', 'lastUpdate'], (res) => {
            if (res.bsmAnnouncements && res.bsmAnnouncements.length > 0) {
                announcementsContainer.innerHTML = '';
                res.bsmAnnouncements.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'announcement-item';
                    div.innerHTML = `
                        <a href="${item.link}">${item.title}</a>
                        <div class="announcement-date">
                            <i class="fas fa-clock"></i> ${item.date}
                        </div>
                    `;
                    announcementsContainer.appendChild(div);
                });

                if (res.lastUpdate) {
                    const info = document.createElement('div');
                    info.style.cssText = 'text-align:center; font-size:0.6rem; opacity:0.6; margin-top:10px;';
                    info.textContent = `Son Güncelleme: ${res.lastUpdate}`;
                    announcementsContainer.appendChild(info);
                }
            } else {
                announcementsContainer.innerHTML = `
                    <div class="loading-state">
                        <i class="fas fa-info-circle"></i>
                        <span>Henüz duyuru bulunamadı.</span>
                    </div>
                `;
            }
        });
    }

    refreshBtn.addEventListener('click', () => {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yenileniyor...';
        refreshBtn.disabled = true;

        chrome.runtime.sendMessage({ action: 'refreshData' });

        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Yenile';
            refreshBtn.disabled = false;
            loadAnnouncements();
        }, 2000);
    });

    loadAnnouncements();
});
