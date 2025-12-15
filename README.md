# Odaklanma Takip Uygulaması (Expo Router + React Native)

Bu proje, dijital dikkat dağınıklığı ile mücadele etmek için tasarlanmış bir mobil uygulamadır. Kullanıcı odak seanslarını başlatır, seans sırasında uygulamadan ayrılırsa (arka plana düşerse) bu durum “dikkat dağınıklığı” olarak sayılır ve seans otomatik duraklatılır. Seans verileri cihazda saklanır ve Raporlar ekranında istatistik + grafiklerle gösterilir.

## Özellikler

### Zamanlayıcı (Ana Ekran)
- Varsayılan **25 dakika** geri sayım.
- **Başlat / Duraklat / Sıfırla** kontrolleri.
- Seans başlamadan önce **kategori seçimi** (Ders Çalışma, Kodlama, Proje, Kitap Okuma).
- Seans **bittiğinde** veya **duraklatıldığında**:
  - Seans özeti oluşturulur (Kategori, Süre, Dikkat Dağınıklığı).
  - Veriler cihazda saklanır.

### Dikkat Dağınıklığı Takibi (AppState)
- Seans aktifken uygulama **background** olursa:
  - `distractionCount` artırılır.
  - Seans otomatik **duraklatılır**.
  - Seans özeti kaydedilir ve kullanıcıya gösterilir.

### Raporlar (Dashboard)
- Cihazda saklanan tüm seanslar okunur.
- Genel istatistikler:
  - **Bugün toplam odaklanma süresi**
  - **Tüm zamanların toplam odaklanma süresi**
  - **Toplam dikkat dağınıklığı**
- Veri görselleştirme:
  - **Son 7 gün odaklanma süreleri (Bar Chart)**
  - **Kategori dağılımı (Pie Chart)**
