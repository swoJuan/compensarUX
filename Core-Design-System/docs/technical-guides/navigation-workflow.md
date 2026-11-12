# Navigation workflow

This guide documents how the Design System portal builds its sidebar navigation.

The portal shell is `drupal.html` (web / Drupal / ZT) and `app.html` (App / .NET MAUI).
Both load `js/ds-bundle.js`, which contains the router, the route map and the
sidebar generator. `app.html` sets `window.DS_PLATFORM = 'app'` before the bundle
so App-specific routes override the defaults.

## Source of truth

There are two related sources of truth, both inside `js/ds-bundle.js`:

1. **Routes** — `ROUTES` (and `APP_ROUTES` for the App platform). Each key is a
   section id and the value is the HTML fragment path loaded from the project root:

   ```js
   // in js/ds-bundle.js
   var ROUTES = {
     'cards': 'docs/transversales/components/cards.html',
     // ...
   };
   ```

   - key (`'cards'`): section id used in the URL hash (`#cards`) and the sidebar link.
   - value: HTML fragment, path **relative to the site root** (starts with `docs/`,
     never with `/docs/`, so the portal works from a subdirectory too).

2. **Sidebar structure** — `DRUPAL_NAV_SECTIONS`. It defines the visible groups and
   items, their order, labels and icons:

   ```js
   { id: 'cards', label: 'Cards', icon: 'credit-card' }
   ```

   Every `id` here must have a matching key in `ROUTES` (or `APP_ROUTES`), otherwise
   clicking the link logs `[router] Ruta no encontrada` and nothing loads.

Do not hardcode sidebar markup in `drupal.html` / `app.html`; it is generated.

## Rendering flow

1. The shell keeps `<nav id="drupal-sidebar"></nav>` empty.
2. On `DOMContentLoaded`, the bundle runs `buildSidebar()`, then `init()` and `initRouter()`.
3. `buildSidebar()` walks `DRUPAL_NAV_SECTIONS` and creates one anchor per item with:
   - `href="#<id>"`
   - class `sidebar-link`
   - an icon (`icon-<icon>`) and the visible `label`
4. `navigateTo(sectionId)` resolves the fragment via `resolveRoute(sectionId)`,
   fetches it, injects it into `#content`, updates the hash and marks the active link.
5. Repeated clicks on the same fragment only scroll (see `SCROLL_TARGETS`).

## Adding a section

1. Create the HTML fragment under `docs/`.
2. Add one entry to `ROUTES` in `js/ds-bundle.js` (and to `APP_ROUTES` if the App
   platform needs a different fragment for the same id).
3. Add one item (with `id`, `label`, `icon`) to the right group in `DRUPAL_NAV_SECTIONS`.
4. If the page needs page-specific JavaScript, load the script in `drupal.html` /
   `app.html` and initialize it from the router's `onSectionReady` hook.

## Group and item order

The visual order of the sidebar groups and the items inside each group follows the
array order of `DRUPAL_NAV_SECTIONS` in `js/ds-bundle.js`.

## Active state

`navigateTo(sectionId)` calls `updateSidebarActive(sectionId)`, which toggles the
`active` class on the link whose `href` equals `#<sectionId>`. For that reason the
sidebar `href` must stay equal to the route id.

## Internal links inside fragments

Links between sections inside a fragment must use the route id, e.g.
`href="#iconos-libreria"` — not a path-style slug. A slug that is not a key in
`ROUTES` is a broken link.

## Caching

`ds-bundle.js` caches fetched fragments in memory (`CACHE`). The shells also load
`css/*.css` and `js/*.js` with a `?v=` query string; bump it when a browser keeps
showing stale assets during local review.
