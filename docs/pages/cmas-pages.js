/* ══════════════════════════════════════════════════════════════════════
   CMAS · พฤติกรรมร่วมของหน้าเอกสาร — เล็กที่สุดเท่าที่จำเป็น ไม่มี dependency
   สารบัญบอกว่าอ่านถึงไหน · สารบัญยุบได้บนจอเล็ก · ฉบับพิมพ์ไม่ขาดเนื้อหา
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── สารบัญ + scroll-spy ─────────────────────────────────────────────
     สร้างจาก <section class="sec"> ที่มี id และ <h2> — หน้าไหนเพิ่มหัวข้อใหม่
     สารบัญตามเอง ไม่ต้องแก้สองที่ */
  var toc = document.querySelector('.toc');
  var secs = [].slice.call(document.querySelectorAll('section.sec[id]'));

  if (toc && secs.length) {
    toc.innerHTML = '<span class="over">สารบัญ</span>' + secs.map(function (s, i) {
      var h = s.querySelector('h2');
      var label = h ? h.textContent.replace(/^\s*\d+[.\s]*/, '').trim() : s.id;
      return '<a href="#' + s.id + '"><span class="n">' + (i + 1) + '</span>' +
             '<span>' + label + '</span></a>';
    }).join('');

    var links = [].slice.call(toc.querySelectorAll('a'));
    var mark = function (id) {
      links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + id); });
    };

    /* หัวข้อที่ "กำลังอ่าน" คือหัวข้อบนสุดที่ยังอยู่เหนือเส้น 40% ของจอ
       IntersectionObserver อย่างเดียวจะสลับไปมาเมื่อหัวข้อสั้นสองอันอยู่ในจอพร้อมกัน */
    var spy = function () {
      var line = window.innerHeight * 0.4, cur = secs[0];
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].getBoundingClientRect().top <= line) cur = secs[i]; else break;
      }
      /* ถึงท้ายหน้าแล้วให้หัวข้อสุดท้ายติดไว้ ไม่งั้นหัวข้อท้าย ๆ ไม่มีวันถูกเลือก */
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = secs[secs.length - 1];
      if (cur) mark(cur.id);
    };
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () { spy(); tick = false; });
    }, { passive: true });
    window.addEventListener('resize', spy, { passive: true });
    spy();

    links.forEach(function (a) {
      a.addEventListener('click', function () {
        if (toc) toc.classList.remove('open');
        var sc = document.querySelector('.tocScrim'); if (sc) sc.classList.remove('open');
      });
    });
  }

  /* ── สารบัญยุบได้เมื่อจอแคบ ────────────────────────────────────────
     สถานะอยู่เป็นคลาสบนตัว .toc และ .tocScrim เอง ไม่ใช่ attribute บน body
     — ดูเหตุผลใน cmas-pages.css §11 */
  var scrim = function () { return document.querySelector('.tocScrim'); };
  var setToc = function (open) {
    if (toc) toc.classList.toggle('open', open);
    var sc = scrim();
    if (sc) sc.classList.toggle('open', open);
    var btn = document.querySelector('[data-toc-toggle]');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-toc-toggle], .tocScrim');
    if (!t) return;
    setToc(t.classList.contains('tocScrim') ? false : !(toc && toc.classList.contains('open')));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setToc(false);
  });

  /* ── ฉบับพิมพ์ต้องไม่ขาดเนื้อหา ──────────────────────────────────────
     CSS สั่งให้ <details> ที่ปิดอยู่กางไม่ได้ — UA ซ่อนเนื้อในเอง
     จึงต้องเปิดจริงก่อนพิมพ์ แล้วคืนสภาพเดิมหลังพิมพ์ */
  var wasOpen = null;
  var expand = function () {
    var all = [].slice.call(document.querySelectorAll('details'));
    wasOpen = all.map(function (d) { return d.open; });
    all.forEach(function (d) { d.open = true; });
  };
  var restore = function () {
    if (!wasOpen) return;
    [].slice.call(document.querySelectorAll('details')).forEach(function (d, i) { d.open = wasOpen[i]; });
    wasOpen = null;
  };
  window.addEventListener('beforeprint', expand);
  window.addEventListener('afterprint', restore);
  if (window.matchMedia) {
    var mq = window.matchMedia('print');
    var onmq = function (m) { (m.matches ? expand : restore)(); };
    if (mq.addEventListener) mq.addEventListener('change', onmq);
    else if (mq.addListener) mq.addListener(onmq);
  }
})();
