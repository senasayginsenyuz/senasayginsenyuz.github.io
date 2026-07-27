# senasayginsenyuz.com

Sena Saygın Şenyüz — kişisel vitrin sitesi.
Bağımlılık yok, derleme adımı yok, izleme yok: düz HTML + CSS + vanilla JS.

## Yapı

```
index.html      → Türkçe sayfa (tek sayfa, bölümler #id ile)
en/index.html   → İngilizce sayfa (aynı CSS ve JS'i kullanır)
site.css        → tasarım sistemi (iki tema: koyu varsayılan, açık)
site.js         → kontrol kartı, tema, iletişim formu — iki dilli
agent.js        → OP-25 karar ajanı ve site asistanı istemcisi
robots.txt      → tarayıcılara açık
sitemap.xml     → iki dil, hreflang ile
assets/
  fonts/        → Inter · Inter Tight · JetBrains Mono (yerelden, woff2)
  portre.jpg    → portre
  favicon.svg   → sekme ikonu
  og.png        → paylaşım kartı (TR)
  og-en.png     → paylaşım kartı (EN)
  Sena_Saygin_Senyuz_CV_TR.pdf
  Sena_Saygin_Senyuz_CV_EN.pdf
```

## Tasarım: ROTA KARTI

Belge kimliği, fabrikada parçanın peşinden giden **iş kartı**: üst şeritte PARÇA / ROTA /
REV / DURUM, sol kenarda zımba delikleri, bölümler `OP-10 … OP-70` operasyonları, projeler
`İE-2601` iş emirleri, altta KONTROL VE ONAY şeridi.

**Renk sözlüğü** — her rengin tek bir anlamı var ve o anlamın dışında kullanılmaz:

| Renk | Anlam | Nerede |
|---|---|---|
| Yeşil | "şu an geçerli" | aktif durum, canlı rozet, yürüyen dönem, birincil düğme, onay işaretleri |
| Mavi | ölçülmüş / modelden gelen | akış şemasının veri yarısı, doğru alarm noktaları |
| Pas | burada kayıp var | sızıntı dalı, boş alarm, kaçan gecikme |
| Çelik | fiziksel malzeme, saha | hattın veri öncesi yarısı |

Kural: **yeşil grafiklerin içine girmez, mavi/pas/çelik arayüze çıkmaz.**

## İlkeler

- **Uydurma sayı yok.** Sayfadaki her metrik `supply-chain-late-delivery-ml` projesinin
  ölçülmüş değerlerinden gelir. Kontrol kartındaki örneklem temsilîdir ama oranları gerçektir.
- **Telefon ve e-posta yayımlanmaz** — otomatik toplayıcılara karşı bilinçli tercih.
  İletişim: site içi form (Formspree) + LinkedIn.
- **Erişilebilirlik ölçülür, tahmin edilmez.** Her metin/zemin çifti WCAG'e karşı hesaplanır;
  kontrol kartındaki dört sınıf renkten bağımsız olarak boyut ve dolu/boş farkıyla da kodlanır.
- **JavaScript kapalıyken** sayfa okunur kalır: şekillerin yerine gerçek değerleri taşıyan
  yedek metinler görünür.
- **Google Fonts bağımlılığı yok** — yazı tipleri yerelden servis edilir, dışarıya istek atılmaz.
- **Tek dış istek OP-25'te**, o da ziyaretçi düğmeye bastığında:
  [`late-delivery-agent`](https://github.com/senasayginsenyuz/late-delivery-agent)
  uç noktası. Sayfa açılışında yoklama yapılmaz; uç nokta cevap vermezse bölüm
  hata metnini gösterir, sayfanın geri kalanı etkilenmez.

## Yerelde çalıştırma

```bash
python3 -m http.server 8899
```

Sonra `http://localhost:8899/` (TR) ve `http://localhost:8899/en/` (EN).
Açık temayı doğrudan görmek için URL'ye `?shift=light` ekleyin.

## Yayın

GitHub Pages, `main` dalı, kök dizin. Özel alan adı için `CNAME` dosyası ve DNS'te
dört A kaydı (185.199.108–111.153) ile `www` için CNAME gerekir.
