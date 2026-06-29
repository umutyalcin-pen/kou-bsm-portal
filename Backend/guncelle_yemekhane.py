# -*- coding: utf-8 -*-
"""
KOÜ BSM Portal - Yemekhane Veritabanı Güncelleyici 🍽️
Bu araç, Kocaeli Üniversitesi SKSDB resmi sitesindeki yemek menüsü tablosunu 
otomatik olarak tarar veya kopyalanan metni saniyeler içinde sıfır hatayla 
'yemekhane.json' dosyasına dönüştürür.

Kullanım:
1. Terminalden çalıştırın: python guncelle_yemekhane.py
2. Canlı tarama yapmak için '1' tuşuna basın.
3. Veya web sitesindeki tabloyu kopyalayıp yapıştırarak hatasız dönüştürmek için '2' tuşuna basın.
"""

import os
import json
import re
import urllib.request

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

DEFAULT_JSON_PATH = "yemekhane.json"
VARSAYILAN_KALORI = 920

def temizle(metin):
    if not metin:
        return "-"
    metin = re.sub(r'\s+', ' ', metin).strip()
    kelimeler = metin.split()
    buyutulmus = []
    for k in kelimeler:
        if len(k) > 1:
            buyutulmus.append(k[0].upper() + k[1:].lower())
        else:
            buyutulmus.append(k.upper())
    return " ".join(buyutulmus)

def kalori_hesapla(kalori_str):
    """Kalori string'inden sayısal değeri çıkarır, bulunamazsa varsayılan değeri döner."""
    kaloriler = re.findall(r'\d+', str(kalori_str))
    toplam_kalori = sum(int(k) for k in kaloriler)
    if toplam_kalori == 0:
        toplam_kalori = VARSAYILAN_KALORI
    return f"{toplam_kalori} kcal"

def canli_web_tara():
    print("\n[+] KOÜ SKSDB resmi sitesinden canlı veri çekiliyor...")
    url = "https://sksdb.kocaeli.edu.tr/tr/beslenme"
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read()
    except Exception as e:
        print(f"[-] Resmi siteye erişilemedi veya bağlantı reddedildi: {e}")
        return None

    if not HAS_BS4:
        print("[-] Canlı tarama için 'beautifulsoup4' kütüphanesi yüklü değil.")
        print("[!] 'pip install beautifulsoup4' yazarak yükleyebilirsiniz.")
        return None

    soup = BeautifulSoup(html, 'html.parser')
    tablolar = soup.find_all('table')
    if not tablolar:
        print("[-] Sitede yemek tablosu bulunamadı.")
        return None

    menuler = {}
    for tablo in tablolar:
        satirlar = tablo.find_all('tr')
        for satir in satirlar:
            hucreler = [h.text.strip() for h in satir.find_all(['td', 'th'])]
            if len(hucreler) >= 5:
                tarih_match = re.search(r'(\d{2})[\./-](\d{2})[\./-](\d{4})', hucreler[0])
                if tarih_match:
                    gun, ay, yil = tarih_match.groups()
                    tarih_key = f"{yil}-{ay}-{gun}"

                    corba = temizle(hucreler[1])
                    ana_yemek = temizle(hucreler[2])
                    yardimci = temizle(hucreler[3])
                    tatli = temizle(hucreler[4])
                    kalori_str = hucreler[5] if len(hucreler) > 5 else ""

                    menuler[tarih_key] = {
                        "corba": corba,
                        "anaYemek": ana_yemek,
                        "yardimciYemek": yardimci,
                        "tatliMeyve": tatli,
                        "kalori": kalori_hesapla(kalori_str)
                    }

    return menuler

def metinden_parsa_et():
    print("\n" + "="*50)
    print("📋 KOÜ SKSDB SİTESİNDEN KOPYALANAN TABLOYU DÖNÜŞTÜRÜCÜ")
    print("="*50)
    print("Nasıl Yapılır:")
    print("1. Resmi sitedeki yemek tablosunu fareyle seçip kopyalayın (Ctrl+C).")
    print("2. Buraya yapıştırın (Ctrl+V).")
    print("3. Yapıştırma işlemi bittiğinde yeni boş bir satıra geçip 'ENTER' tuşuna basın, ardından 'TAMAM' yazıp tekrar ENTER'a basın.")
    print("="*50)

    satirlar = []
    while True:
        try:
            satir = input()
            if satir.strip().upper() == "TAMAM":
                break
            satirlar.append(satir)
        except EOFError:
            break

    kopyalanan_metin = "\n".join(satirlar)
    menuler = {}

    for satir in kopyalanan_metin.split('\n'):
        satir = satir.strip()
        if not satir:
            continue

        parcalar = [p.strip() for p in re.split(r'\t|\s{2,}', satir) if p.strip()]
        if len(parcalar) >= 5:
            tarih_match = re.search(r'(\d{2})[\./-](\d{2})[\./-](\d{4})', parcalar[0])
            if tarih_match:
                gun, ay, yil = tarih_match.groups()
                tarih_key = f"{yil}-{ay}-{gun}"

                corba = temizle(parcalar[1])
                ana_yemek = temizle(parcalar[2])
                yardimci = temizle(parcalar[3])
                tatli = temizle(parcalar[4])
                kalori_str = parcalar[5] if len(parcalar) > 5 else ""

                menuler[tarih_key] = {
                    "corba": corba,
                    "anaYemek": ana_yemek,
                    "yardimciYemek": yardimci,
                    "tatliMeyve": tatli,
                    "kalori": kalori_hesapla(kalori_str)
                }

    return menuler

def main():
    print("="*60)
    print("🌐 KOÜ BSM Portal - Yemekhane Veritabanı Sihirbazı v1.0 🌐")
    print("="*60)
    print("Lütfen yapmak istediğiniz işlemi seçin:")
    print("1) Canlı SKSDB Web Sitesinden Tarama Yap (BeautifulSoup Gerekir)")
    print("2) Siteden Kopyalanan Menü Metnini JSON'a Dönüştür (Garanti ve Hatasız Metot)")
    print("="*60)

    secim = input("Seçiminiz (1 veya 2): ").strip()
    menuler = None

    if secim == "1":
        menuler = canli_web_tara()
        if not menuler:
            print("\n[-] Canlı tarama başarısız oldu. Kopyala-Yapıştır metoduna geçiliyor...")
            menuler = metinden_parsa_et()
    elif secim == "2":
        menuler = metinden_parsa_et()
    else:
        print("[-] Geçersiz seçim.")
        return

    if menuler:
        mevcut_veri = {}
        if os.path.exists(DEFAULT_JSON_PATH):
            try:
                with open(DEFAULT_JSON_PATH, "r", encoding="utf-8") as f:
                    mevcut_veri = json.load(f)
            except Exception:
                pass

        mevcut_veri.update(menuler)
        siralanmis_veri = dict(sorted(mevcut_veri.items(), key=lambda item: item[0]))

        try:
            with open(DEFAULT_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(siralanmis_veri, f, ensure_ascii=False, indent=2)
            print(f"\n[+] BAŞARILI! Toplam {len(menuler)} adet günlük menü başarıyla '{DEFAULT_JSON_PATH}' dosyasına yazıldı.")
            print("[+] Eklentiyi güncellemek için 'chrome://extensions' sayfasından Yenile (🔄) yapmanız yeterlidir.")
        except Exception as e:
            print(f"[-] Dosya yazma hatası: {e}")
    else:
        print("\n[-] Herhangi bir menü verisi işlenemedi. Lütfen kopyaladığınız tablonun formatını kontrol edin.")

if __name__ == "__main__":
    main()