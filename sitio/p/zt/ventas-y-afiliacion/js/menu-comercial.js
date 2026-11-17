/* ============================================================
 * menu-comercial.js — Menú lateral del perfil Comercial (ZT)
 * ------------------------------------------------------------
 * Define window.ZT_MENU_LOCAL para el flujo Ventas y afiliación.
 * Debe cargarse ANTES de shared/zt-sidebar.js. Mismos ítems que
 * inicio-comercial/index.html (Figma "Afiliacion01 - Comercial").
 * href relativo a la raíz zt/ (zt-sidebar.js antepone el prefijo).
 * ============================================================ */
window.ZT_MENU_LOCAL = [
  { id: 'inicio', label: 'Inicio',              icon: 'icon-house',     href: 'ventas-y-afiliacion/inicio-comercial/index.html' },
  { id: 'ventas', label: 'Ventas y afiliación', icon: 'icon-handshake', href: 'ventas-y-afiliacion/index.html' }
];
