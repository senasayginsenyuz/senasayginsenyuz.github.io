/* ═══════════════════════════════════════════════════════════
   senasayginsenyuz.com — ROTA KARTI
   OP-20 kontrol kartı · tema · sevkiyat formu
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* Betik gerçekten çalıştıysa .no-js kalkar — yüklenemezse HTML yedekleri görünür kalır. */
document.documentElement.classList.replace('no-js','js');

/* ── DİL ─────────────────────────────────────────────────────
   Aynı motor iki sayfayı sürüyor; ölçümler tek, yalnızca dili değişir. */
var EN = document.documentElement.lang === 'en';
function num(x, d){
  var v = x.toFixed(d);
  return EN ? v : v.replace('.', ',');
}
function pct(oran){ return EN ? num(oran*100,1) + '%' : '%' + num(oran*100,1); }
var T = EN ? {
  koyu:'DARK', acik:'LIGHT', koyuAria:'Switch to dark theme', acikAria:'Switch to light theme',
  limitAria:'control limit ',
  gonderiliyor:'Sending…',
  gonderildi:'Your message is on its way. Thank you — I will get back to you shortly.',
  gonderilemedi:'Could not send. You can also reach me on LinkedIn.',
  notlar:[
    'Limit at its lowest: almost every delay is caught. The price is that nearly half the alarms are false — the team chases unnecessary orders every day.',
    'The balanced zone. Three quarters of delays are seen in advance and two thirds of alarms are real. A sensible start when capacity is tight.',
    'The default limit. Roughly nine in ten alarms raised are real delays; in return, 44% of delays slip through unseen.',
    'Returns shrink as the limit rises: precision gains 1.3 points while caught delays lose 1.6. Tightening further stops paying off.'
  ]
} : {
  koyu:'KOYU', acik:'AÇIK', koyuAria:'Koyu temaya geç', acikAria:'Açık temaya geç',
  limitAria:'kontrol limiti ',
  gonderiliyor:'Gönderiliyor…',
  gonderildi:'Mesajınız iletildi. Teşekkürler — en kısa sürede dönüş yapacağım.',
  gonderilemedi:'Gönderilemedi. LinkedIn üzerinden de ulaşabilirsiniz.',
  notlar:[
    'Limit en aşağıda: gecikmelerin neredeyse tamamı yakalanır. Bedeli, alarmların yarıya yakınının boşa çıkması — ekip her gün gereksiz sipariş kovalar.',
    'Dengeli bölge. Gecikmelerin dörtte üçü önceden görülür, alarmların üçte ikisi gerçektir. Kapasite darsa makul başlangıç.',
    'Varsayılan limit. Verilen her on alarmdan yaklaşık dokuzu gerçek gecikmedir; karşılığında gecikmelerin %44\'ü gözden kaçar.',
    'Limit yükseldikçe kazanç azalıyor: isabet 1,3 puan artarken yakalanan gecikme 1,6 puan düşüyor. Bu noktadan sonra sıkmak işe yaramıyor.'
  ]
};

/* ── 1. TEMA ─────────────────────────────────────────────────
   Sıra: ?shift → kayıtlı tercih → işletim sistemi tercihi.
   Betik varken tarayıcı çubuğu rengi de temayla birlikte güncellenir; betik yoksa
   HTML'deki medya koşullu theme-color etiketleri CSS'in OS paletiyle zaten uyumlu. */
var root = document.documentElement, btn = document.getElementById('themeBtn');
var TC = { light:'#F1EEE9', dark:'#1C1E1D' };
var tcMeta = (function(){
  var m = document.querySelectorAll('meta[name="theme-color"]');
  if(!m.length) return null;
  for(var i = m.length - 1; i > 0; i--){ if(m[i].parentNode) m[i].parentNode.removeChild(m[i]); }
  m[0].removeAttribute('media');
  return m[0];
})();
function paint(t){
  root.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  if(tcMeta) tcMeta.setAttribute('content', t === 'light' ? TC.light : TC.dark);
  if(btn){
    btn.textContent = (t === 'light') ? T.koyu : T.acik;
    btn.setAttribute('aria-label', (t === 'light') ? T.koyuAria : T.acikAria);
  }
}
var q = new URLSearchParams(location.search).get('shift');
var saved = q || (function(){ try{ return localStorage.getItem('v2theme'); }catch(e){ return null; } })();
var osLight = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
paint(saved ? (saved === 'light' ? 'light' : 'dark') : (osLight ? 'light' : 'dark'));
if(btn) btn.addEventListener('click', function(){
  var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  paint(next);
  try{ localStorage.setItem('v2theme', next); }catch(e){}
});

/* ── 2. OP-20 KONTROL KARTI ──────────────────────────────────
   120 sipariş — temsilî örneklem, projedeki gerçek sınıf
   dağılımı (%54,8 geç) ve gerçek eşik metrikleri korunur.
   [olasılık, gerçekte geç mi]                                */
var PTS = [
  [0.3793,0],[0.9187,1],[0.7937,1],[0.3815,0],[0.6688,1],[0.4179,1],[0.3837,0],[0.3859,0],
  [0.388,0],[0.3902,0],[0.425,1],[0.9313,1],[0.3924,0],[0.8063,1],[0.6813,1],[0.3946,0],
  [0.5563,1],[0.775,0],[0.3967,0],[0.4321,1],[0.3989,0],[0.275,0],[0.4024,0],[0.9437,1],
  [0.4393,1],[0.8188,1],[0.6937,1],[0.4071,0],[0.5688,1],[0.4119,0],[0.4464,1],[0.4167,0],
  [0.9563,1],[0.8313,1],[0.4536,1],[0.7063,1],[0.5813,1],[0.4214,0],[0.4262,0],[0.4607,1],
  [0.175,0],[0.9688,1],[0.8438,1],[0.431,0],[0.7188,1],[0.685,0],[0.5938,1],[0.4679,1],
  [0.4357,0],[0.4405,0],[0.475,1],[0.9812,1],[0.8562,1],[0.3517,1],[0.7313,1],[0.4452,0],
  [0.6063,1],[0.355,1],[0.4821,1],[0.955,0],[0.45,0],[0.3583,1],[0.325,0],[0.3617,1],
  [0.9938,1],[0.4548,0],[0.4893,1],[0.8688,1],[0.7438,1],[0.365,1],[0.6188,1],[0.4595,0],
  [0.3683,1],[0.4964,1],[0.3717,1],[0.4643,0],[0.375,1],[0.8813,1],[0.545,0],[0.469,0],
  [0.7562,1],[0.3783,1],[0.6313,1],[0.3817,1],[0.4738,0],[0.385,1],[0.3511,0],[0.225,0],
  [0.4786,0],[0.3533,0],[0.3883,1],[0.8938,1],[0.3554,0],[0.7688,1],[0.6438,1],[0.4833,0],
  [0.3917,1],[0.3576,0],[0.3598,0],[0.865,0],[0.395,1],[0.4881,0],[0.362,0],[0.3983,1],
  [0.3641,0],[0.525,1],[0.3663,0],[0.4929,0],[0.9062,1],[0.7812,1],[0.3685,0],[0.4036,1],
  [0.6562,1],[0.3707,0],[0.4976,0],[0.3728,0],[0.375,0],[0.4107,1],[0.3772,0],[0.125,0]
];

/* projedeki gerçek eşik ölçümleri — uydurma yok, biçim dile göre kurulur */
var STOPS = [
  { t:0.35, rec:0.998, pre:0.574 },
  { t:0.40, rec:0.780, pre:0.664 },
  { t:0.50, rec:0.560, pre:0.874 },
  { t:0.55, rec:0.544, pre:0.887 }
];

var X0 = 76, X1 = 1046, Y0 = 258, Y1 = 44, R = 3.6;
var RK = { k1: 3.4, k2: 4.9, k3: 4.7, k4: 2.7 };
var NS = 'http://www.w3.org/2000/svg';
function yFor(s){ return Y1 + (Y0 - Y1) * (1 - s); }

var host = document.getElementById('ckPts');
var rng  = document.getElementById('ckR');
var limit= document.getElementById('ckLimit');
var elT  = document.getElementById('ckT');
var elRec= document.getElementById('ckRec');
var elPre= document.getElementById('ckPre');
var elNote = document.getElementById('ckNote');
var circles = [];

if(host){
  var frag = document.createDocumentFragment();
  for(var i = 0; i < PTS.length; i++){
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', (X0 + i * (X1 - X0) / (PTS.length - 1)).toFixed(1));
    c.setAttribute('cy', yFor(PTS[i][0]).toFixed(1));
    c.setAttribute('r', R);
    c.setAttribute('class', 'cp');
    frag.appendChild(c);
    circles.push(c);
  }
  host.appendChild(frag);
}

function apply(idx){
  var st = STOPS[idx];
  for(var i = 0; i < circles.length; i++){
    var alarm = PTS[i][0] >= st.t, late = PTS[i][1] === 1;
    var k = alarm ? (late ? 'k1' : 'k2') : (late ? 'k3' : 'k4');
    circles[i].setAttribute('class', 'cp ' + k);
    circles[i].setAttribute('r', RK[k]);   /* dört sınıf renkten bağımsız da ayrılsın */
  }
  if(limit) limit.setAttribute('transform', 'translate(0,' + (yFor(st.t) - yFor(0.50)).toFixed(1) + ')');
  if(elT)   elT.textContent   = num(st.t, 2);
  if(elRec) elRec.textContent = pct(st.rec);
  if(elPre) elPre.textContent = pct(st.pre);
  if(elNote)elNote.textContent = T.notlar[idx];
  if(rng)   rng.setAttribute('aria-valuetext', T.limitAria + num(st.t, 2));
}

if(circles.length){
  apply(rng ? (parseInt(rng.value, 10) || 0) : 2);
  if(rng) rng.addEventListener('input', function(){ apply(parseInt(rng.value, 10) || 0); });
}

/* ── 3. SEVKİYAT FORMU ───────────────────────────────────── */
var modal = document.getElementById('formModal');
var form  = document.getElementById('mform');
var open  = document.getElementById('formOpen');
var close = document.getElementById('formClose');
var send  = document.getElementById('formSend');
var msg   = document.getElementById('formMsg');

if(modal && form && open && typeof modal.showModal === 'function'){
  open.addEventListener('click', function(e){
    e.preventDefault();
    modal.showModal();
    var first = form.querySelector('input:not(.hide)');
    if(first) first.focus();
  });
  if(close) close.addEventListener('click', function(){ modal.close(); });
  modal.addEventListener('click', function(e){ if(e.target === modal) modal.close(); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!form.reportValidity()) return;
    send.disabled = true;
    msg.textContent = T.gonderiliyor;
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function(r){
      if(!r.ok) throw new Error('http');
      form.classList.add('is-sent');
      msg.textContent = T.gonderildi;
      /* gönder düğmesi gizlenince odak gövdeye düşerdi — açıkça kapatma düğmesine taşınır */
      if(close) close.focus();
    }).catch(function(){
      send.disabled = false;
      msg.textContent = T.gonderilemedi;
    });
  });
}
})();
