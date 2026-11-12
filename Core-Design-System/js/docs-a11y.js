/*!
 * docs-a11y · SOLO documentación (no es parte del Core).
 * Los bloques de código (<pre>) hacen scroll horizontal dentro de su caja cuando el texto es más ancho que la pantalla. Una región con
 * scroll tiene que poder alcanzarse con el teclado (WCAG 2.1.1; regla axe scrollable-region-focusable). Este script añade tabindex="0"
 * únicamente a los <pre> que realmente desbordan y lo retira cuando dejan de hacerlo. No cambia el contenido ni los estilos.
 */
(function () {
  'use strict';
  var pending = false;
  function sync() {
    pending = false;
    var root = document.getElementById('content') || document;
    root.querySelectorAll('pre').forEach(function (pre) {
      var scrolls = pre.scrollWidth > pre.clientWidth + 1;
      if (scrolls && !pre.hasAttribute('tabindex')) {
        pre.setAttribute('tabindex', '0');
        pre.setAttribute('data-docs-a11y', '');
        if (!pre.hasAttribute('aria-label') && !pre.hasAttribute('aria-labelledby')) pre.setAttribute('aria-label', 'Código (desplazable con el teclado)');
      } else if (!scrolls && pre.hasAttribute('data-docs-a11y')) {
        pre.removeAttribute('tabindex');
        pre.removeAttribute('data-docs-a11y');
      }
    });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(sync); } }
  function start() {
    var target = document.getElementById('content') || document.body;
    new MutationObserver(schedule).observe(target, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('ds:theme-change', schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
