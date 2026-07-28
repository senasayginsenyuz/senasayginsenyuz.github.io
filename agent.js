/* OP-25 karar ajanı ve site asistanı — istemci tarafı.
 *
 * Burada hiçbir şey hesaplanmaz. Olasılık, eşik, beklenen maliyet ve
 * karşı-olgular uç noktada üretilir; bu dosya yalnızca gösterir. Aynı ayrım
 * sunucuda dil modeli için de geçerli — sayıyı üreten yer tektir.
 *
 * Betik yoksa bölüm CSS ile düşer. Uç nokta yanıt vermezse bölüm durur ama
 * boş kalmaz: hata metni ziyaretçiyi ölçümlerin durduğu yere — OP-20'ye ve
 * depoya — yollar. Açılışta yoklama isteği atılmaz; her ziyaret için bir istek
 * harcamak, yılda birkaç kez görülecek bir hatayı önlemeye değmez.
 */
(function () {
  "use strict";

  var yerel = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = yerel ? "http://localhost:8787"
                  : "https://late-delivery-agent.senasayginsenyuz.workers.dev";
  var EN = document.documentElement.lang === "en";

  var T = EN ? {
    idle: "", bekle: "…", degerlendir: "EVALUATE", sor: "ASK",
    flag: "expedite / warn the customer", keep: "leave on the normal plan",
    olasilik: "LATE PROBABILITY", esik: "THRESHOLD", karar: "DECISION", oneri: "RECOMMENDATION",
    hareket: "WHAT WOULD CHANGE IT", not: "THE AGENT'S NOTE", uyari: "GUARDRAILS",
    egri: "COST CURVE", egriAlt: "expected cost per order", modelsiz: "no model", secilen: "chosen",
    model: "run the model", kural: "no model",
    hata: "The agent could not be reached. The measured figures are in OP-20 and in the repository.",
    limit: "Too many requests in a short time — try again in a minute.",
    kota: "The agent's free daily quota is used up; it resets each day. "
        + "The measured figures are in OP-20 and in the repository.",
    notyok: "The written note could not be produced — the figures above are unaffected.",
    bos: "Type a question first."
  } : {
    idle: "", bekle: "…", degerlendir: "DEĞERLENDİR", sor: "SOR",
    flag: "hızlandır / müşteriyi uyar", keep: "normal planda bırak",
    olasilik: "GECİKME OLASILIĞI", esik: "EŞİK", karar: "KARAR", oneri: "ÖNERİ",
    hareket: "ELDEKİ HAREKET", not: "AJANIN NOTU", uyari: "KORKULUK",
    egri: "MALİYET EĞRİSİ", egriAlt: "sipariş başına beklenen maliyet", modelsiz: "modelsiz", secilen: "seçilen",
    model: "modeli çalıştır", kural: "modelsiz kural",
    hata: "Ajana ulaşılamadı. Ölçülmüş değerler OP-20'de ve depoda duruyor.",
    limit: "Kısa sürede çok fazla istek — bir dakika sonra tekrar deneyin.",
    kota: "Ajanın günlük ücretsiz kotası doldu; kota her gün sıfırlanıyor. "
        + "Ölçülmüş değerler OP-20'de ve depoda duruyor.",
    notyok: "Yazılı not üretilemedi — yukarıdaki sayılar bundan etkilenmez.",
    bos: "Önce bir soru yazın."
  };

  function $(id) { return document.getElementById(id); }
  function yuzde(x) { var s = (x * 100).toFixed(1); return EN ? s + "%" : "%" + s.replace(".", ","); }
  function say(x, n) { var s = x.toFixed(n); return EN ? s : s.replace(".", ","); }
  // Cümleyi hangi modelin yazdığı künyede görünür: Gemini'nin günlük kotası
  // bitince yedek devreye giriyor ve bunu gizlemek projenin tezine aykırı olur.
  function kisaModel(ad) {
    if (!ad) return "";
    if (ad === "gemini") return "GEMINI";
    if (ad.indexOf("llama-3.3-70b") > -1) return "LLAMA 3.3 70B";
    return ad.replace(/^@cf\//, "").toUpperCase();
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function iste(yol, govde) {
    return fetch(API + yol, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(govde)
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) { var e = new Error(d.message || "hata"); e.kod = d.error; e.durum = r.status; throw e; }
        return d;
      });
    });
  }

  // İki ayrı 429 var ve ikisine aynı cümleyi yazmak yanıltıcı: biri bizim
  // dakikalık sınırımız ("birazdan tekrar deneyin" doğru), diğeri Gemini'nin
  // günlük ücretsiz kotası — orada bir dakika beklemek işe yaramaz.
  function hataMetni(err) {
    if (!err) return T.hata;
    if (err.kod === "rate_limited") return T.limit;
    if (err.kod === "llm" && err.durum === 429) return T.kota;
    return T.hata;
  }


  /* Eşiğin nasıl seçildiğini gösteren küçük eğri.
     "Beklenen maliyeti en aza indiren eşiği seçer" demek başka, o minimumu
     göstermek başka. Dokuz ölçülmüş eşik noktası, seçilen nokta ve modelsiz
     kuralın maliyeti tek karede. */
  function egriCiz(d) {
    var o = d.policy.options, taban = d.policy.baselines.best_blanket;
    if (!o || o.length < 2) return "";

    var W = 480, H = 128, SOL = 10, SAG = 78, UST = 12, ALT = 24;
    var t0 = o[0].threshold, t1 = o[o.length - 1].threshold;
    var deg = o.map(function (p) { return p.expected_cost; }).concat([taban]);
    var yMin = Math.min.apply(null, deg), yMax = Math.max.apply(null, deg);
    var bosluk = (yMax - yMin) * 0.18 || 1;
    yMin -= bosluk; yMax += bosluk;

    function X(t) { return SOL + (t - t0) / (t1 - t0) * (W - SOL - SAG); }
    function Y(v) { return UST + (1 - (v - yMin) / (yMax - yMin)) * (H - UST - ALT); }

    var nokta = o.map(function (p) { return X(p.threshold).toFixed(1) + "," + Y(p.expected_cost).toFixed(1); });
    var sec = d.policy.chosen;
    var kotu = d.policy.recommendation.use !== "model";
    var sx = X(sec.threshold), sy = Y(sec.expected_cost), ty = Y(taban);

    // Seçilen eşik uçlardan birine denk gelince etiketler üst üste biniyordu
    // ("0,3030"). Yakınsa uç etiketi düşer; kenardaysa hizalama içeri döner.
    var yakinSol = Math.abs(sx - X(t0)) < 30, yakinSag = Math.abs(sx - X(t1)) < 30;
    var hiza = yakinSol ? "start" : yakinSag ? "end" : "middle";
    var eksenY = H - ALT + 13;

    return '<p class="ag__h">' + T.egri + ' <s>· ' + T.egriAlt + '</s></p>' +
      '<svg class="ag__eg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
        esc(T.egri + ": " + say(sec.threshold, 2)) + '">' +
      '<line class="eg-ax" x1="' + SOL + '" y1="' + (H - ALT) + '" x2="' + (W - SAG) + '" y2="' + (H - ALT) + '"/>' +
      '<line class="eg-base" x1="' + SOL + '" y1="' + ty.toFixed(1) + '" x2="' + (W - SAG) + '" y2="' + ty.toFixed(1) + '"/>' +
      '<text class="eg-lab" x="' + (W - SAG + 6) + '" y="' + (ty + 3.2).toFixed(1) + '">' + T.modelsiz + '</text>' +
      '<polyline class="eg-line" points="' + nokta.join(" ") + '"/>' +
      (yakinSol ? "" : '<text class="eg-lab" x="' + SOL + '" y="' + eksenY + '" text-anchor="start">' + say(t0, 2) + '</text>') +
      (yakinSag ? "" : '<text class="eg-lab" x="' + (W - SAG) + '" y="' + eksenY + '" text-anchor="end">' + say(t1, 2) + '</text>') +
      '<circle class="eg-dot' + (kotu ? " kotu" : "") + '" cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="4.5"/>' +
      '<text class="eg-sec' + (kotu ? " kotu" : "") + '" x="' + sx.toFixed(1) + '" y="' + eksenY +
        '" text-anchor="' + hiza + '">' + say(sec.threshold, 2) + '</text>' +
      '</svg>';
  }

  /* ═══ OP-25 ═══ */
  var form = $("agForm");
  if (form) (function () {
    var out = $("agOut"), go = $("agGo"), market = $("agMarket"), region = $("agRegion");

    // Bölge listesi pazara bağlı: eşleşmeyen seçenek gizlenir, seçili olan
    // geçersiz kaldıysa o pazarın ilk bölgesine düşer.
    function bolgeleriSuz() {
      var m = market.value, ilk = null, gecerli = false;
      for (var i = 0; i < region.options.length; i++) {
        var o = region.options[i], uygun = o.getAttribute("data-m") === m;
        o.hidden = !uygun;
        o.disabled = !uygun;
        if (uygun) { if (!ilk) ilk = o; if (o.selected) gecerli = true; }
      }
      if (!gecerli && ilk) ilk.selected = true;
    }
    market.addEventListener("change", bolgeleriSuz);
    bolgeleriSuz();

    // Maliyet oranını görünür tut ve hazır senaryoları bağla.
    var oranEt = $("agOran"), miss = $("agMiss"), fals = $("agFalse");
    function oranYaz() {
      var m = Number(miss.value), f = Number(fals.value);
      oranEt.textContent = (isFinite(m) ? m : "?") + " : " + (isFinite(f) ? f : "?");
    }
    miss.addEventListener("input", oranYaz);
    fals.addEventListener("input", oranYaz);
    Array.prototype.forEach.call(form.querySelectorAll(".ag__on button"), function (b) {
      b.addEventListener("click", function () {
        miss.value = b.getAttribute("data-m");
        fals.value = b.getAttribute("data-f");
        oranYaz();
        calistir(true);
      });
    });
    oranYaz();

    // Bölüm ilk görünüşünde kendini çalıştırır — ziyaretçi boş bir form yerine
    // hazır bir karar görsün. Açıklama İSTENMEZ: sayılar uçta bedava üretiliyor,
    // cümleyi yazdırmak Gemini'nin günlük kotasından yiyor. Cümle ancak
    // ziyaretçi DEĞERLENDİR'e bastığında geliyor.
    if ("IntersectionObserver" in window) {
      var gozcu = new IntersectionObserver(function (girdiler) {
        if (girdiler.some(function (g) { return g.isIntersecting; })) {
          gozcu.disconnect();
          calistir(false);
        }
      }, { rootMargin: "120px" });
      gozcu.observe(form);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      calistir(true);
    });

    function calistir(aciklamaIste) {
      form.classList.add("is-busy");
      go.disabled = true;
      go.textContent = T.bekle;

      iste("/api/risk", {
        explain: !!aciklamaIste,
        lang: EN ? "en" : "tr",
        costs: {
          missed_late: Number($("agMiss").value),
          false_alarm: Number($("agFalse").value)
        },
        order: {
          shipping_mode: $("agMode").value,
          market: market.value,
          region: region.value,
          category: $("agCat").value,
          payment_type: $("agPay").value,
          unit_price: Number($("agPrice").value)
        }
      }).then(ciz).catch(function (err) {
        out.innerHTML = '<p class="ag__err">' + esc(hataMetni(err)) + "</p>";
      }).then(function () {
        form.classList.remove("is-busy");
        go.disabled = false;
        go.textContent = T.degerlendir;
      });
    }

    function ciz(d) {
      var h = [];
      h.push('<p class="ag__p"><b>' + yuzde(d.probability) + "</b><i>" + T.olasilik + "</i></p>");

      var oneri = d.policy.recommendation;
      h.push('<div class="ag__row">' +
        "<div><i>" + T.esik + "</i><b>" + say(d.decision.threshold, 2) + "</b></div>" +
        "<div><i>" + T.karar + "</i><b>" +
          esc(d.decision.flagged ? T.flag : T.keep) + "</b></div>" +
        "<div><i>" + T.oneri + "</i><b>" +
          esc(oneri.use === "model" ? T.model : T.kural + " · " + oneri.rule) + "</b></div></div>");

      h.push(egriCiz(d));

      if (d.counterfactuals && d.counterfactuals.length) {
        h.push('<p class="ag__h">' + T.hareket + "</p><ul class=\"ag__cf\">");
        d.counterfactuals.forEach(function (c) {
          h.push('<li class="' + (c.crosses_threshold ? "win" : "") + '">' +
            "<em>" + esc(c.shipping_mode) + " · " + c.scheduled_days + (EN ? "d" : " gün") + "</em>" +
            "<b>" + yuzde(c.probability) + "</b>" +
            '<s class="' + (c.delta > 0 ? "up" : "") + '">' +
              (c.delta > 0 ? "+" : "−") + yuzde(Math.abs(c.delta)) + "</s></li>");
        });
        h.push("</ul>");
      }

      if (d.explanation) {
        h.push('<p class="ag__h">' + T.not +
          (d.explained_by ? ' <s>· ' + esc(kisaModel(d.explained_by)) + '</s>' : '') +
          '</p><p class="ag__say">' + esc(d.explanation) + "</p>");
      } else if (d.explanation_error) {
        // Sayılar ürün, cümle kolaylık. Dil modeli düşünce analiz kalır —
        // ama bunu söylemeden geçmek, bölüm eksik basılmış gibi görünür.
        h.push('<p class="ag__h">' + T.not + '</p><p class="ag__err">' +
          esc(/429/.test(d.explanation_error) ? T.kota : T.notyok) + "</p>");
      }

      var uyarilar = (d.guardrails || []).map(function (g) { return g.message; })
        .concat(d.warnings || []);
      if (uyarilar.length) {
        h.push('<p class="ag__h">' + T.uyari + '</p><ul class="ag__gr">');
        uyarilar.forEach(function (m) { h.push("<li>" + esc(m) + "</li>"); });
        h.push("</ul>");
      }

      out.innerHTML = h.join("");
    }
  })();

  /* ═══ sayfa ajanı — sabit köşe ═══ */
  var qaForm = $("qaForm");
  if (qaForm) (function () {
    var giris = $("qaQ"), cevap = $("qaA"), go = $("qaGo");
    var kap = $("ajan"), ac = $("ajanAc"), panel = $("ajanPanel"), kapat = $("ajanKapat");

    function ayarla(acik) {
      panel.hidden = !acik;
      kap.classList.toggle("is-open", acik);
      ac.setAttribute("aria-expanded", acik ? "true" : "false");
      if (acik) giris.focus();
      else ac.focus();
    }
    ac.addEventListener("click", function () { ayarla(panel.hidden); });
    kapat.addEventListener("click", function () { ayarla(false); });

    // Kalıcı bir denetim; sayfayı kilitlemez. Esc kapatır, dışarı tıklamak da —
    // ama panelin içinde metin seçerken kapanmasın diye hedef kontrol edilir.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) ayarla(false);
    });
    document.addEventListener("pointerdown", function (e) {
      if (!panel.hidden && !kap.contains(e.target)) ayarla(false);
    });

    Array.prototype.forEach.call(document.querySelectorAll(".qa__ex button"), function (b) {
      b.addEventListener("click", function () {
        giris.value = b.getAttribute("data-q");
        qaForm.requestSubmit ? qaForm.requestSubmit() : qaForm.dispatchEvent(new Event("submit"));
      });
    });

    qaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var soru = giris.value.trim();
      if (!soru) { cevap.textContent = T.bos; return; }

      go.disabled = true;
      go.textContent = T.bekle;
      cevap.textContent = T.bekle;

      iste("/api/ask", { question: soru, lang: EN ? "en" : "tr" })
        .then(function (d) { cevap.textContent = d.answer; })
        .catch(function (err) { cevap.textContent = hataMetni(err); })
        .then(function () { go.disabled = false; go.textContent = T.sor; });
    });
  })();
})();
