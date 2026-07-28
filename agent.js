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
    model: "run the model", kural: "no model",
    hata: "The agent could not be reached. The measured figures are in OP-20 and in the repository.",
    limit: "Too many requests in a short time — try again in a minute.",
    bos: "Type a question first."
  } : {
    idle: "", bekle: "…", degerlendir: "DEĞERLENDİR", sor: "SOR",
    flag: "hızlandır / müşteriyi uyar", keep: "normal planda bırak",
    olasilik: "GECİKME OLASILIĞI", esik: "EŞİK", karar: "KARAR", oneri: "ÖNERİ",
    hareket: "ELDEKİ HAREKET", not: "AJANIN NOTU", uyari: "KORKULUK",
    model: "modeli çalıştır", kural: "modelsiz kural",
    hata: "Ajana ulaşılamadı. Ölçülmüş değerler OP-20'de ve depoda duruyor.",
    limit: "Kısa sürede çok fazla istek — bir dakika sonra tekrar deneyin.",
    bos: "Önce bir soru yazın."
  };

  function $(id) { return document.getElementById(id); }
  function yuzde(x) { var s = (x * 100).toFixed(1); return EN ? s + "%" : "%" + s.replace(".", ","); }
  function say(x, n) { var s = x.toFixed(n); return EN ? s : s.replace(".", ","); }
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

  function hataMetni(err) {
    if (err && (err.durum === 429 || err.kod === "rate_limited")) return T.limit;
    return T.hata;
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

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("is-busy");
      go.disabled = true;
      go.textContent = T.bekle;

      iste("/api/risk", {
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
    });

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
        h.push('<p class="ag__h">' + T.not + '</p><p class="ag__say">' + esc(d.explanation) + "</p>");
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

  /* ═══ site asistanı ═══ */
  var qaForm = $("qaForm");
  if (qaForm) (function () {
    var giris = $("qaQ"), cevap = $("qaA"), go = $("qaGo");

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
