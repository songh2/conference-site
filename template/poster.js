/* Poster helpers: render math if any, shrink long blocks until they fit,
   then scale the page for on-screen preview (printing uses the real size). */
(function () {
  'use strict';
  var poster = document.querySelector('.poster');
  if (!poster) return;

  function fitAll() {
    var overflow = false;
    // 1) title: shrink if it pushes the layout too far (very long names)
    var title = poster.querySelector('.title');
    if (title) {
      var k = 1;
      title.style.setProperty('--title-k', k);
      var maxH = poster.clientHeight * 0.30;
      while (title.scrollHeight > maxH && k > 0.55) { k -= 0.04; title.style.setProperty('--title-k', k.toFixed(2)); }
    }
    // 2) fit blocks: 남는 공간이 있으면 키우고, 넘치면 줄인다. 프로그램 표는 두 단이 더 크게 보이면 두 단으로.
    Array.prototype.forEach.call(poster.querySelectorAll('.fit'), function (box) {
      var body = box.querySelector('.fit-body');
      if (!body) return;
      var maxK = parseFloat(box.getAttribute('data-max-k') || '1.9');
      var fits = function () { return body.scrollHeight <= box.clientHeight + 1 && body.scrollWidth <= box.clientWidth + 1; };
      var solve = function () {
        var k = 1;
        body.style.setProperty('--k', k);
        if (fits()) {
          while (k < maxK) { k += 0.05; body.style.setProperty('--k', k.toFixed(3)); if (!fits()) { k -= 0.05; break; } }
          k = Math.min(k, maxK);
        } else {
          while (!fits() && k > 0.5) { k -= 0.025; body.style.setProperty('--k', k.toFixed(3)); }
        }
        body.style.setProperty('--k', k.toFixed(3));
        return k;
      };
      var k = solve();
      var cols = box.getAttribute('data-try-cols');
      var list = cols ? body.querySelector('.days') : null;
      if (list && k < 0.9) {
        list.classList.add('cols-' + cols);
        var k2 = solve();
        if (k2 < k + 0.08) { list.classList.remove('cols-' + cols); k = solve(); } else { k = k2; }
      }
      if (!fits()) { overflow = true; box.setAttribute('data-overflow', '1'); }
      box.setAttribute('data-k', k.toFixed(3));
    });
    // 3) whole page: nothing may spill past the paper
    if (poster.scrollHeight > poster.clientHeight + 1) overflow = true;
    document.body.setAttribute('data-overflow', overflow ? '1' : '0');
    document.body.setAttribute('data-fitted', '1');
  }

  function previewZoom() {
    if (window.matchMedia && window.matchMedia('print').matches) return;
    var avail = Math.max(320, window.innerWidth - 48);
    var w = poster.getBoundingClientRect().width / (parseFloat(poster.style.zoom) || 1);
    poster.style.zoom = Math.min(1, avail / w).toFixed(4);
  }

  function renderMath() {
    if (!/\$|\\\(/.test(poster.textContent)) return Promise.resolve();
    return new Promise(function (resolve) {
      var base = 'https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/';
      var done = false, finish = function () { if (!done) { done = true; resolve(); } };
      setTimeout(finish, 6000); // offline: leave the TeX source as it is
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'katex.min.css'; document.head.appendChild(css);
      var s1 = document.createElement('script'); s1.src = base + 'katex.min.js';
      s1.onload = function () {
        var s2 = document.createElement('script'); s2.src = base + 'contrib/auto-render.min.js';
        s2.onload = function () {
          try {
            window.renderMathInElement(poster, { delimiters: [
              { left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false });
          } catch (e) { /* keep source text */ }
          document.body.setAttribute('data-math', '1');
          finish();
        };
        s2.onerror = finish; document.head.appendChild(s2);
      };
      s1.onerror = finish; document.head.appendChild(s1);
    });
  }

  function start() {
    poster.style.zoom = 1;
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([fonts, renderMath()]).then(function () {
      poster.style.zoom = 1;
      fitAll();
      previewZoom();
    });
  }
  window.addEventListener('beforeprint', function () { poster.style.zoom = 1; });
  window.addEventListener('afterprint', previewZoom);
  window.addEventListener('resize', previewZoom);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
