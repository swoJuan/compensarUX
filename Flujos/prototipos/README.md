# Compensar — Prototipos (flujos)

Este repositorio contiene los **prototipos** de Compensar, organizados en flujos por plataforma (ZT y Drupal). Es un repo **independiente** del Design System.

> 📌 **Antes de crear o modificar un flujo, lee [`AGENTS.md`](AGENTS.md)** — es la guía operativa obligatoria del proyecto (reglas de reutilización, estructura, estilos, iconos, verificación y publicación).

## Dos repositorios separados

```
Compensar/
├── Core-Design-System/     ← repo del Design System (fuente de verdad visual). Repo aparte.
└── Flujos/
    └── prototipos/         ← ESTE repo (prototipos publicables)
```

- El **Design System** vive en su propio repositorio (`Core-Design-System/`) y es la **fuente de verdad visual**.
- Este repo (`flujos/`) **no** contiene el Design System. Consume una **copia de distribución** de sus recursos en `shared/vendor` y `shared/icons`, generada con `npm run sync-flows`.

## Estructura de este repo

```
flujos/
├── shared/                ← recursos comunes a todos los flujos
│   ├── vendor/            ← core.css, portal.css (distribución del DS) — NO editar a mano
│   ├── icons/             ← icons.css + fonts (distribución del DS) — NO editar a mano
│   ├── css/               ← compensar.css (estilos comunes entre flujos)
│   ├── js/                ← compensar.js (helpers comunes)
│   └── assets/            ← logos e imágenes compartidas
├── zt/                    ← plataforma Zona Transaccional
│   ├── shared/            ← header, zt.css / zt.js propios de ZT
│   ├── agendamiento-citas/ ← flujo: agendamiento de citas médicas
│   └── laboratorio/       ← flujo futuro
├── drupal/                ← plataforma Drupal
│   ├── shared/            ← header, drupal.css / drupal.js y nav-* propios de Drupal
│   ├── navegacion/        ← flujo: pruebas de navegación (menu-1/2/3)
│   └── ayudas-diagnosticas/ ← flujo futuro
├── scripts/sync-flows.mjs ← sincroniza recursos del Design System hacia shared/
├── package.json
├── .gitignore
├── README.md
├── kiro-context.md
└── AGENTS.md              ← guía operativa obligatoria
```

---

## 1. Dónde está el Design System

En un repositorio **aparte**: `Core-Design-System/` (hermano de `compensar/`). Es la fuente de verdad visual: tokens, componentes, tipografía, colores, iconos. Su CSS se compila con Sass (`npm run build` dentro de ese repo).

**Antes de crear cualquier interfaz, revisa primero el Design System.** Reutiliza colores, tokens, tipografía, espaciados, botones, inputs, cards, alertas, modales, iconografía, estados, componentes, responsive y patrones existentes.

## 2. Dónde crear un flujo

Bajo la plataforma que corresponda:

- ZT → `zt/<nombre-del-flujo>/`
- Drupal → `drupal/<nombre-del-flujo>/`

Estructura recomendada de un flujo:

```
<nombre-del-flujo>/
├── index.html
├── css/custom.css     ← solo si el flujo necesita estilos propios
├── js/custom.js       ← solo si el flujo necesita JS propio
└── assets/            ← solo assets específicos del flujo
```

Enlazado de recursos (rutas relativas, ejemplo desde `zt/<flujo>/`):

```html
<link rel="stylesheet" href="../../shared/vendor/core.css">
<link rel="stylesheet" href="../../shared/icons/icons.css">
<link rel="stylesheet" href="../../shared/css/compensar.css">
<link rel="stylesheet" href="../shared/zt.css">      <!-- o ../shared/drupal.css -->
<link rel="stylesheet" href="css/custom.css">        <!-- solo si hace falta -->
```

Orden de la cascada:

```
Design System → shared global → ZT / Drupal shared → custom del flujo
```

## 3. Diferencia entre ZT y Drupal

ZT y Drupal **usan el mismo Design System y el mismo lenguaje visual**. No se duplican estilos generales. Sus diferencias se mantienen en `zt/shared/` y `drupal/shared/` (header, navegación, estructura y comportamientos de plataforma).

## 4. Dónde colocar estilos específicos

- Si un estilo/JS **solo aplica a un flujo** → dentro de ese flujo (`css/custom.css`, `js/custom.js`).
- **No** modificar `shared` para una necesidad exclusiva de un flujo.
- Si algo se usa en **dos o más** flujos → evaluar promoverlo a `shared`.

## 5. Cuándo usar shared

- `shared/` → reutilizable entre cualquier flujo (ZT y Drupal).
- `zt/shared/` y `drupal/shared/` → reutilizable dentro de esa plataforma.
- Abstraer solo cuando se usa en 2+ lugares.

## 6. Cómo sincronizar el Design System

Los prototipos consumen una **copia de distribución** en `shared/`. Para actualizarla desde el repo del Design System:

```bash
# 1) (si cambió el CSS del DS) compilar dentro del repo del Design System
cd ../../Core-Design-System && npm install && npm run build && cd -

# 2) desde este repo (flujos/), sincronizar solo lo necesario
npm run sync-flows
```

`sync-flows` copia únicamente:

| Origen (Core-Design-System) | Destino (este repo) |
|---|---|
| `css/core.css` | `shared/vendor/core.css` |
| `css/portal.css` | `shared/vendor/portal.css` |
| `icons/icons.css` + `fonts/` | `shared/icons/` |

Por defecto busca el Design System en `../../Core-Design-System`. Si está en otra ruta:

```bash
DS_PATH=/ruta/al/Core-Design-System npm run sync-flows
```

**Regla:** los archivos en `shared/vendor` y `shared/icons` son una copia de distribución. **No se editan a mano.** La fuente de verdad es el repo del Design System.

**Nunca** copiar `core.css`, `portal.css`, iconos o fuentes manualmente dentro de un flujo. Se consumen desde `shared`.

## 7. Qué subir al hosting

Solo el contenido de **este repo (`flujos/`)**. Es autosuficiente. No se sube el Design System ni `node_modules`.

> Antes de publicar, corre `npm run sync-flows` para asegurar que `shared` tiene la última versión del Design System.

---

## Notas

- `node_modules/` no se versiona (ver `.gitignore`).
- Los prototipos usan Google Fonts vía CDN (Roboto, Material Symbols / Material Icons).
- Historial de prototipos anteriores: ver la branch `history/pruebas-compensar`.
