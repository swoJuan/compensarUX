# Catálogo de componentes transversales ZT

Componentes reutilizables entre módulos y flujos de ZT. Viven en `zt/shared/components/`
y se consumen después del shell (cascada: Design System → `zt.css` → componente).

---

## Action Card (`zt-action-card`)

**Qué es:** card compacta de navegación/acción. Ícono a la izquierda, título (y descripción
opcional) al centro y un chevron a la derecha. Toda la card es interactiva.

**Cuándo usarla:** como acceso a un flujo o acción dentro de un módulo ZT
(p. ej. tipos de agendamiento, "Iniciar afiliación"). No es exclusiva de ningún módulo.

**Archivos:**
- `action-card.css` — estilos y estados.
- `action-card.js` — API opcional para crearla por JS (`ZTActionCard.create/render`).

**Cómo enlazar** (en el `<head>`, tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/action-card.css">
<!-- opcional, solo si se crea por JS: -->
<script src="../shared/components/action-card.js"></script>
```
(Ajustar la profundidad `../` según la ubicación de la pantalla.)

### Propiedades
| Prop | Obligatorio | Descripción |
|---|---|---|
| `title` | sí | Título (Body 3 Bold, 16px). |
| `description` | no | Texto secundario (Body M, 14px). **Solo se renderiza si se pasa.** |
| `icon` | no | Ruta a imagen del ícono (40×40). |
| `iconClass` | no | Alternativa: clases de icono de fuente (p. ej. `icon icon-user-plus icon-32 gs-violet`). |
| `href` | no | Con destino → `<a>` (navega). Sin destino → `<button>` (acción). |
| `disabled` | no | `aria-disabled="true"`, no navega, sin pointer. Nunca `href="#"`. |

### Estados
`default` · `hover` (fondo surface-orange #fff2e3 + borde 2px primary #f60; título, icono, caret y sombra no cambian; sin layout shift) ·
`focus-visible` (outline violeta) · `active` (pressed sutil) · `disabled` (opacidad reducida, sin interacción).

### Uso en HTML — SIN descripción
```html
<a class="zt-action-card" href="destino.html">
  <img class="zt-action-card__icon" src="assets/ic.svg" alt="" aria-hidden="true">
  <span class="zt-action-card__text">
    <span class="zt-action-card__title">Iniciar afiliación</span>
  </span>
  <span class="zt-action-card__caret icon icon-caret-right icon-24 gs-inherit" aria-hidden="true"></span>
</a>
```

### Uso en HTML — CON descripción
```html
<a class="zt-action-card" href="destino.html">
  <img class="zt-action-card__icon" src="assets/ic.svg" alt="" aria-hidden="true">
  <span class="zt-action-card__text">
    <span class="zt-action-card__title">Iniciar afiliación</span>
    <span class="zt-action-card__desc">Comienza el proceso de afiliación a Medicina Prepagada.</span>
  </span>
  <span class="zt-action-card__caret icon icon-caret-right icon-24 gs-inherit" aria-hidden="true"></span>
</a>
```

### Uso por JS (API)
```js
const card = ZTActionCard.create({
  title: 'Iniciar afiliación',
  description: 'Comienza el proceso de afiliación a Medicina Prepagada.', // opcional
  icon: 'assets/ic-iniciar-afiliacion.svg',
  href: 'afiliacion/index.html'
});
document.querySelector('.va-acciones__row').appendChild(card);
// o: ZTActionCard.render(contenedor, { ... });
```

### Variante de icono "acento" (`zt-action-card__icon--acento`)
**Qué es:** el icono de fuente se muestra en negro (`--use-text-primary`) sobre un círculo
naranja de 24px (`--base-orange-40`) centrado en el área de 40x40. Funciona con cualquier
glifo `.icon` (no aplica a `<img>`). El aspecto por defecto (icono violeta) no cambia.

**Cuándo usarla:** accesos principales de un módulo que deben destacar con icono de acento
(p. ej. Ventas y Afiliación: "Iniciar afiliación", "Ver afiliaciones"). Usarla de forma
consistente en todas las cards de un mismo grupo.

**Estados:** hover/focus no alteran el icono; disabled hereda la opacidad de la card.

**Origen:** Figma `u4bXqFvoAf9re85YN3yfB8`, nodo `13542:109548`.

```html
<a class="zt-action-card" href="iniciar-afiliacion/index.html">
  <span class="zt-action-card__icon zt-action-card__icon--acento icon icon-user-plus icon-40" aria-hidden="true"></span>
  <span class="zt-action-card__text">
    <span class="zt-action-card__title">Iniciar afiliación</span>
  </span>
  <span class="zt-action-card__caret icon icon-caret-right icon-24 gs-inherit" aria-hidden="true"></span>
</a>
```
Por JS: `ZTActionCard.create({ title, href, iconClass: 'icon icon-user-plus icon-40', iconAccent: true })`.

### Tokens usados
`--use-surface-white`, `--use-surface-orange`, `--use-primary-default`, `--use-border-violet-dark`, `--use-text-theme-violet`,
`--use-text-primary` y `--base-orange-40` (solo variante acento), `--color-text-primary`, `--color-text-secondary`, `--text-3`, `--space-2`, `--space-12`,
`--radius-xs` (8px), `--font-size-lg` (16px), `--font-size-md` (14px), `--font-weight-bold/regular`.
Sombra: `shadow 1` de Figma (`2px 5px 16px rgba(0,0,0,.15)`).

### Notas
- El ancho es `100%` (se adapta a la celda del grid: 4/3/2/1 columnas).
- Alto flexible (`min-height: 64px`); crece si hay descripción o texto largo (con wrap).
- No usar `white-space: nowrap` en título/descripción.

---

## Status Result (`zt-status-result`)

**Qué es:** bloque de **resultado contextual inline** (no modal, no overlay) que comunica
el desenlace de una operación dentro del propio contenido: ícono de estado, título,
descripción, datos opcionales de persona, badge de estado y una acción primaria opcional.

**Cuándo usarlo:** para mostrar el resultado de una consulta/acción sin sacar al usuario
de la pantalla (p. ej. resultado de viabilidad en afiliación). Sustituye al patrón modal
para respuestas positivas/negativas que deben conservar el contexto del formulario.

**Archivos:**
- `status-result.css` — estilos y variantes.
- `status-result.js` — API (`ZTStatusResult.create/render`).

**Cómo enlazar** (en el `<head>`, tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/status-result.css">
<script src="../shared/components/status-result.js"></script>
```
(Ajustar la profundidad `../` según la ubicación de la pantalla.)

### Propiedades
| Prop | Obligatorio | Descripción |
|---|---|---|
| `type` | sí | `success` \| `warning` (preparado para `info` \| `error`). |
| `title` | sí | Título (Heading H4, 28px bold). |
| `description` | no | Texto de apoyo (Body XL, 18px). |
| `personName` | no | Nombre de la persona. |
| `document` | no | Documento ya formateado para presentación (p. ej. `C.C. 1.234.567.890`). |
| `status` | no | Texto del badge → se muestra como `Estado: <status>`. |
| `primaryAction` | no | `{ label, onClick }` → botón primario (DS `.mp-btn--primario`). |

### Variantes
`success` (superficie/borde/texto success, ícono `icon-check`, badge `mp-badge--success`) ·
`warning` (amarillo suave — no error, ícono `icon-warning`, badge `mp-badge--warning`).

### Accesibilidad
- `warning`/`error` → `role="alert"`; `success`/`info` → `role="status"`. Siempre `aria-live="polite"`.
- No mueve el foco. El contenedor host debería declarar `aria-live` también si se re-renderiza.

### Uso por JS (API)
```js
ZTStatusResult.render(document.getElementById('afi-result'), {
  type: 'success',
  title: 'La afiliación puede continuar',
  description: 'No encontramos condiciones que impidan continuar...',
  personName: 'María Fernanda Ríos',
  document: 'C.C. 1.234.567.890',
  status: 'Viable',
  primaryAction: { label: 'Continuar', onClick: () => { /* siguiente paso */ } }
});
```

### Tokens usados
`--use-state-success-bg/border/text`, `--use-surface-theme-green-2-60`, `--use-text-on-dark-primary`,
`--use-state-warning-bg/border/icon-bg/text`, `--color-border-subtle`, `--color-text-primary/secondary`,
`--space-4/12/20/24`, `--radius-12`, `--font-weight-bold/regular`. Badge y botón: DS (`.mp-badge`, `.mp-btn`).

### Notas
- Ancho `100%` (ocupa el ancho de la card/formulario). Sin ancho fijo tipo modal.
- Renderizar dentro de un contenedor con `aria-live="polite"`; `render()` reemplaza el contenido previo.
- Para limpiarlo: `container.innerHTML = ''`.

---

## Radio (`mp-radio` — ajuste transversal ZT)

**Qué es:** el radio button es el componente del Design System (`.mp-choice.mp-radio`).
Este archivo **no** crea un radio nuevo: aporta un ajuste transversal de **alineación**
para ZT, de modo que control y label queden centrados verticalmente en una sola línea.

**Por qué:** el DS alinea el label arriba (`align-items:flex-start` + `padding-top:10px`
en `.mp-choice__text`), pensado para labels multilínea con helper. En ZT usamos el patrón
compacto `[ ○ ] Label` centrado. El ajuste se acota a `.mp-radio` (no toca checkboxes).

**Archivos:** `radio.css` (solo estilos; el markup y comportamiento son del DS).

**Cómo enlazar** (en el `<head>`, tras `zt.css`, antes del CSS del flujo):
```html
<link rel="stylesheet" href="../shared/components/radio.css">
```

### Markup (Design System)
```html
<label class="mp-choice mp-radio">
  <span class="mp-choice__field">
    <input class="mp-choice__input" type="radio" name="grupo" value="a" checked>
    <span class="mp-choice__control"></span>
  </span>
  <span class="mp-choice__text"><span class="mp-choice__label">Opción A</span></span>
</label>
```
Toda la opción (control + label) es clicable porque el `<label>` envuelve al `<input>`.

### Qué ajusta
- `.mp-radio.mp-choice { align-items:center }` — centra control y label.
- `.mp-radio .mp-choice__text { padding-top:0; align-self:center; padding-left:var(--space-4) }`
- Label: Roboto Regular 16px (`--font-size-lg`), lh 1.3, `--use-text-primary`.

### Notas
- Transversal: aplica a todos los flujos ZT con radios, no por pantalla.
- No modificar `font-size` para "cuadrar" la alineación: se resuelve con flexbox.
- Para filas de opciones usar un contenedor con `display:flex; flex-wrap:wrap; gap:var(--space-24)`.

---

## Process Stepper (`zt-stepper`)

**Qué es:** indicador de progreso por pasos. Cabecera **"Tu progreso · Paso N de M"**
con barra, y debajo una **línea de tiempo vertical** (badge + label, conector entre
pasos, verde en los tramos completados). Estados: `active` (fila violeta + ayuda
"En curso"), `completed` (check verde, texto legible), `future` (badge con borde,
texto terciario) y `disabled`.

**Cuándo usarlo:** procesos multi-paso (afiliación, onboarding, wizards). Es
**general**: los flujos definen los pasos y el paso activo. No crear `.afiliacion-step`.

**Archivos:**
- `stepper.css` — estilos y estados.
- `stepper.js` — API (`ZTStepper.create/render`).

**Cómo enlazar** (en el `<head>`, tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/stepper.css">
<script src="../shared/components/stepper.js"></script>
```

### Propiedades (`ZTStepper.render(container, cfg)`)
| Prop | Obligatorio | Descripción |
|---|---|---|
| `steps` | sí | Array `[{ label, state? }]`. `state` opcional fuerza `completed/active/disabled`. |
| `current` | sí | Número (1-based) del paso activo. Deriva estados: `<current`→completed, `=`→active, `>`→future. |
| `onSelect` | no | `function(index, step)` → hace clicables los pasos permitidos. |
| `allowFuture` | no | `true` para permitir navegar a pasos futuros (requiere `onSelect`). |
| `showProgress` | no | `false` oculta la cabecera "Tu progreso · Paso N de M" (por defecto visible). |
| `steps[].hint` | no | Texto de ayuda del paso activo (por defecto "En curso"). |

### Estados (tokens)
Active: bg `--use-surface-violet`, badge `--use-surface-theme-violet-60` + texto on-dark
(con halo blanco), label `--use-text-theme-violet` semibold + hint "En curso".
Completed: badge y conector `--use-surface-theme-green-2-60` + check, label `--use-text-secondary`.
Future: badge blanco con borde `--use-border-subtle`, label `--use-text-tertiary`.
Barra: fondo `--use-surface-theme-gray-5`, relleno verde = pasos completados.

### Panel lateral de proceso (`aside.pa-side`)
`stepper.css` también define la **composición transversal** del panel de los
procesos ZT: Person Summary (compact, con `eyebrow: 'Persona a afiliar'`) + Stepper
en **una sola card** (blanca, border subtle, radius 16). El ancho/flex del panel lo
sigue definiendo cada paso (`.pa-side`).

### Accesibilidad
`<ol role="list">`; el paso activo lleva `aria-current="step"`. Pasos clicables = `<button>`;
no clicables = `<li>`. Focus visible en los clicables. La barra es `role="progressbar"`
con `aria-valuenow/valuemax` y `aria-valuetext` ("3 de 8 pasos completados").

### Responsive
En ≤900px el panel va arriba del formulario a todo el ancho: se muestra la barra
"Paso N de M" y solo el paso activo (sin lista larga ni scroll horizontal).

### Uso por JS (API)
```js
ZTStepper.render(document.getElementById('stepper'), {
  current: 1,
  steps: [{ label: 'Iniciar afiliación' }, { label: 'Datos del contratante' }, /* … */]
});
```

---

## Modal (`zt-modal`)

**Qué es:** diálogo modal centrado sobre **overlay oscuro** (bloqueante). Usa el
componente de modales del Design System (`.mp-modal` / `.mp-modal__*`, variantes
`success/warning/info/error`) y aporta el shell de presentación (overlay fixed,
centrado, focus trap, cierre con Escape/overlay).

**Cuándo usarlo:** para desenlaces que deben interrumpir el flujo y requerir una
acción explícita (p. ej. confirmación de viabilidad positiva). Para avisos que NO
deben bloquear, usar `Alert` (inline). Es un componente **general**, no por flujo.

**Archivos:**
- `modal.css` — overlay + shell (reutiliza tokens y clases `.mp-modal*` del DS).
- `modal.js` — API (`ZTModal.open/close`).

**Cómo enlazar** (en el `<head>`, tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/modal.css">
<script src="../shared/components/modal.js"></script>
```

### Propiedades (`ZTModal.open`)
| Prop | Obligatorio | Descripción |
|---|---|---|
| `type` | no | `success` \| `warning` \| `info` (def.) \| `error`. Define el color del ícono. |
| `icon` | no | Clase de icono del sistema (def. por `type`: success→`icon-check`, etc.). |
| `title` | sí | Título (DS `.mp-modal__title`, 28px bold). |
| `body` | no | Texto de apoyo: `string` o `string[]` (una `.mp-modal__body` por línea). |
| `dismissible` | no | `true` (def.): botón cerrar + cierre con overlay/Escape. |
| `primaryAction` | no | `{ label, onClick }` → botón `.mp-btn--primario`. |
| `secondaryAction` | no | `{ label, onClick }` → botón `.mp-btn--secundario`. |
| `onClose` | no | Callback al cerrar. |

### Overlay y tokens
Overlay oscuro con el token del DS `--mp-modal-overlay` (`rgba(17,17,17,.30)`; en dark
`rgba(0,0,0,.62)`). El diálogo (icon 64px, título, body, actions) usa `.mp-modal__*`.

### Accesibilidad
`role="dialog"` + `aria-modal="true"` + `aria-labelledby` (título). Mueve el foco al
abrir y lo restaura al cerrar. Focus trap con Tab. Escape cierra (si `dismissible`).
Bloquea el scroll del fondo mientras está abierto.

### Uso por JS (API)
```js
ZTModal.open({
  type: 'success',
  title: 'La afiliación puede continuar',
  body: 'No encontramos condiciones que impidan continuar con la afiliación a Medicina Prepagada.',
  primaryAction: { label: 'Continuar', onClick: function () { ZTModal.close(); /* siguiente paso */ } }
});
// Cerrar programáticamente: ZTModal.close();
```

### Notas
- Un solo modal a la vez (`open` cierra el anterior).
- No depende del runtime JS de Bootstrap; el overlay centra y gestiona el ciclo de vida.

---

## Alert (`mp-alert` del Design System)
**Qué es:** **alerta contextual inline** (no modal, no overlay, no bloqueante). Usa el componente
oficial `mp-alert` del Design System (Figma 4574:1918, definido en `core.css`). ZT **no** tiene
estilos propios de alerta: `alert.js` solo es un helper que genera el marcado del DS.
**Cuándo usarlo:** avisos contextuales que NO deben interrumpir la interfaz
(p. ej. "No es posible continuar" tras una consulta). Es un Alert **general**: no crear variantes por flujo.
**Archivos:**
- `alert.js` — API (`ZTAlert.create/render/clear`). No requiere CSS adicional (viene en `core.css`).
**Cómo enlazar:**
```html
<script src="../shared/components/alert.js"></script>
```
(Ajustar la profundidad `../` según la ubicación de la pantalla.)
### Propiedades
| Prop | Obligatorio | Descripción |
|---|---|---|
| `type` | no | `warning` (def.) \| `success` \| `info` \| `error`. |
| `title` | no* | Título (`mp-alert__title`, 16px semibold). |
| `description` | no* | Texto de apoyo (`mp-alert__body`, 16px regular). |
*Se requiere `title` y/o `description`.
### Iconos (los de la documentación del DS)
`warning` → `icon-warning` · `success` → `icon-check-circle` · `info` → `icon-info` · `error` → `icon-warning-circle`.
### Accesibilidad
- `error` → `role="alert"`; las demás → `role="status"`. Se anuncian sin mover el foco.
- El DS aporta foco visible (`:focus-within`) y los colores por tema (Light, Dark, Alto contraste).
### Uso por JS (API)
```js
ZTAlert.render(document.getElementById('afi-alert'), {
  type: 'warning',
  title: 'No es posible continuar con la afiliación',
  description: 'La persona no cumple con las condiciones requeridas para continuar con la afiliación a Medicina Prepagada.'
});
// Para limpiarla: ZTAlert.clear(document.getElementById('afi-alert'));
```
### Uso en HTML (estático) — marcado oficial del DS
```html
<div class="mp-alert mp-alert--warning" role="status">
  <i class="icon icon-warning icon-32 mp-alert__icon" aria-hidden="true"></i>
  <div class="mp-alert__content">
    <p class="mp-alert__title">No es posible continuar con la afiliación</p>
    <p class="mp-alert__body">La persona no cumple con las condiciones requeridas para continuar con la afiliación a Medicina Prepagada.</p>
  </div>
</div>
```

### Notas
- Ancho `100%` (ocupa el ancho de la card/formulario). Sin dimensiones fijas del Figma.
- En mobile el icono conserva 32px y el contenido hace wrap sin overflow.
- Renderizar dentro de un host; `render()` reemplaza el contenido, `clear()` lo vacía.

---

## Dropdown List (`zt-dropdown`)

**Qué es:** lista desplegable reutilizable. **Visual = Dropdown Menu** del sistema de diseño,
**semántica = combobox + listbox** (selección de datos). Mejora un `<select>` nativo: lo
conserva oculto como fuente de verdad (su `value`, `disabled` y evento `change` siguen intactos)
y renderiza un trigger con estilo de campo + una lista de opciones accesible.

**Cuándo usarlo:** en cualquier select/dropdown de ZT — Tipo de documento, Especialidad,
Persona, Centro médico, etc. **No crear versiones por flujo.**

**Archivos:**
- `dropdown.css` — estilos, estados y variantes.
- `dropdown.js` — API (`ZTDropdown.enhance/enhanceAll`), auto-enhance en `DOMContentLoaded`.

**Cómo enlazar** (en el `<head>`, tras `zt.css`; el script tras el shell):
```html
<link rel="stylesheet" href="../shared/components/dropdown.css">
<script src="../shared/components/dropdown.js"></script>
```

### Uso (declarativo — recomendado)
Marca el `<select>` con `data-zt-dropdown`; se mejora solo:
```html
<div class="mp-input-group">
  <label class="mp-input-label" for="tipo">Tipo de documento</label>
  <select id="tipo" class="mp-input-field mp-select" data-zt-dropdown data-zt-dropdown-search="false">
    <option value="" disabled selected>Seleccionar</option>
    <option value="CC">Cédula de ciudadanía</option>
    ...
  </select>
</div>
```
`data-zt-dropdown-search="true|false"` fuerza el buscador (por defecto **AUTO**: se activa con ≥ 8 opciones).

### Uso (programático)
```js
ZTDropdown.enhance(document.getElementById('tipo'), { search: false });
```

### Anatomía
`.zt-dropdown` (posicionador) › `.zt-dropdown__trigger` (combobox, estilo campo DS) ·
`.zt-dropdown__list` (listbox) › `.zt-dropdown__search` (opcional) · `.zt-dropdown__scroll` ›
`.zt-dropdown__option` (role=option).

### Estados (tokens DS)
- **Default:** fondo `--use-surface-white`, texto `--use-text-primary`.
- **Hover:** `--use-surface-theme-orange-20` (naranja suave).
- **Focus (teclado):** `--use-surface-theme-orange-20` + borde 2px `--use-focus-outline` (inset, sin layout shift; el default ya lleva borde transparente de 2px).
- **Active/Selected:** `--use-primary-default` + texto `--use-text-on-dark-primary` + check visible.
- **Disabled:** texto `--base-neutral-50`, sin interacción.

### Item (DS)
Alto 56px · padding 16px · gap 10px · Roboto Regular 16px / line-height 1.5 / letter-spacing 1%.

### Lista
Fondo blanco · `--shadow-1` (2px 5px 16px rgba(0,0,0,.15)) · radius `--radius-xs` (8px) ·
overflow hidden · alineada al trigger (ancho ≥ trigger; por defecto = ancho del campo).

### Cuándo usar buscador
Solo listas largas (AUTO ≥ 8 opciones). **No** en listas cortas como Tipo de documento.

### Cuándo usar scroll
Si la lista supera `max-height` (~280px ≈ 5 items) aparece scroll vertical; scrollbar discreto,
no se muestra si no hace falta. En mobile `max-height: 60vh`.

### Single select vs. checkbox (futuro)
Por defecto es **single select** (una sola opción `aria-selected`). La variante multi con checkbox
está **preparada** (`.zt-dropdown--checkbox`) pero **no activa**; no añadir checkbox en selects de datos como Tipo de documento.

### Comportamiento
Abre con clic/Enter/Space/flechas · cierra al seleccionar, al clic fuera y con Escape ·
solo un dropdown abierto a la vez · posición alineada al trigger.

### Teclado
`Enter`/`Space` abre · `↓`/`↑` mueven el foco entre opciones · `Enter` selecciona ·
`Escape` cierra · `Tab` navegación natural (cierra al salir). Foco visible por opción vía `aria-activedescendant`.

### Semántica / Accesibilidad
Trigger: `role="combobox"` + `aria-haspopup="listbox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant`.
Lista: `role="listbox"`. Opción: `role="option"` + `aria-selected`. El `<select>` nativo permanece como fallback.

### Tokens usados
`--use-surface-white`, `--use-surface-theme-orange-20`, `--use-primary-default`, `--use-text-primary`,
`--use-text-on-dark-primary`, `--use-border-default/subtle`, `--use-text-tertiary`, `--use-focus-outline`,
`--space-16/12/10/8/4`, `--radius-xs`, `--radius-full`, `--shadow-1`, `--font-weight-regular/bold`.

---

## Person Summary (`zt-person`)

**Qué es:** resumen compacto de **identidad de una persona** (avatar + eyebrow
opcional + nombre completo + documento). Es **informativo**, no interactivo: presenta
datos que ya conocemos sin parecer un formulario ni repetir campos editables.

**Cuándo usarlo:** para identificar rápidamente a una persona dentro de un flujo:
afiliaciones (candidato/contratante), visitas, citas, resultados, autorizaciones, etc.
Es un componente **general**: no crear variantes por flujo (`afiliacion-persona`, etc.).

**Archivos:**
- `person-summary.css` — estilos y variantes.
- `person-summary.js` — API (`ZTPersonSummary.create/render`).

**Cómo enlazar** (en el `<head>`, tras `zt.css`; el script tras el shell):
```html
<link rel="stylesheet" href="../shared/components/person-summary.css">
<script src="../shared/components/person-summary.js"></script>
```
(Ajustar la profundidad `../` según la ubicación de la pantalla.)

### Propiedades (`ZTPersonSummary.render(container, cfg)`)
| Prop | Obligatorio | Descripción |
|---|---|---|
| `name` | sí | Nombre completo en una línea (elemento principal). |
| `documentType` | no | Código del tipo (`CC`, `TI`, `CE`, `PA`, `PPT`) → etiqueta corta (C.C., …). |
| `documentNumber` | no | Número **limpio**; el componente lo formatea con separador de miles. |
| `document` | no | Alternativa: documento ya formateado (p. ej. `"C.C. 222"`). Tiene prioridad. |
| `eyebrow` | no | Contexto opcional en mayúsculas (p. ej. `Persona a afiliar`). |
| `variant` | no | `default` (formulario) \| `compact` (sidebar ~280px). Def. `default`. |
| `icon` | no | Clase de font-icon del avatar (def. `icon-user`; afiliación usa `icon-user-plus`). |

### Variantes
- **default:** avatar 48px, padding 16, nombre en una línea con ellipsis (wrap en mobile).
- **compact:** avatar 40px, padding 12, nombre con wrap (hasta 2 líneas), pensada para
  el ancho del sidebar de pasos. Suele omitir el eyebrow.

### Anatomía
`.zt-person` (fila avatar + texto, surface violet, radius 12) ›
`.zt-person__avatar` (círculo blanco + icono violeta, decorativo) ·
`.zt-person__text` › `.zt-person__eyebrow` (opcional) · `.zt-person__name` · `.zt-person__doc`.

### Accesibilidad
No es clicable (no `button`/`link`) porque no tiene acción. El avatar es decorativo
(`aria-hidden`). Nombre y documento son texto. El eyebrow vacío no se renderiza.

### Uso por JS (API)
```js
ZTPersonSummary.render(document.getElementById('pa-identidad'), {
  name: 'Laura Fernanda Rodríguez Duarte',
  documentType: 'CC', documentNumber: '222',
  eyebrow: 'Persona a afiliar', variant: 'default', icon: 'icon-user-plus'
});
// Sidebar (misma persona, sin eyebrow):
ZTPersonSummary.render(document.getElementById('pa-cand-summary'), {
  name: 'Laura Fernanda Rodríguez Duarte',
  documentType: 'CC', documentNumber: '222', variant: 'compact', icon: 'icon-user-plus'
});
```

### Tokens usados
`--use-surface-violet`, `--use-surface-white`, `--use-text-theme-violet`, `--use-text-primary`,
`--use-text-secondary`, `--use-text-tertiary`, `--radius-12`, `--radius-full`, `--space-2/10/12/16`,
`--font-size-sm/md/lg`, `--font-weight-medium/semibold`. Icono: font-icon del sistema (`.gs-violet`).

### Notas
- Alto objetivo en desktop: ~80–96px. Evitar títulos grandes, avatar grande o labels repetidos.
- Mismo objeto de datos para todos los usos (p. ej. `candidate.name/documentType/documentNumber`):
  si cambia la fuente, cambian todos los lugares donde se renderiza.

---

## Date Picker / Calendar (`zt-datepicker`)

**Qué es:** calendario transversal para **todos los campos de fecha de ZT**. **Visual =
Figma `mp_modal`** (node `199:10483`), **semántica = date picker accesible**. Mejora un
`<input type="date">` nativo: lo conserva oculto como **fuente de verdad** (su `value` en
`YYYY-MM-DD`, sus atributos `min`/`max`, su `disabled` y su evento `change`) y renderiza un
**trigger con estilo de campo** que muestra la fecha en presentación `dd/mm/aaaa`, más un
calendario (popover en desktop / modal en mobile) idéntico al Figma.

**Cuándo usarlo:** en **cualquier** campo de fecha de ZT (fecha de nacimiento, vigencia,
agendamiento, etc.). **No crear calendarios por flujo** ni usar `input type="date"` nativo
en unas pantallas y custom en otras: todos deben usar este patrón.

**Archivos:**
- `datepicker.css` — estilos, estados y modo modal/popover.
- `datepicker.js` — API (`ZTDatePicker.enhance/enhanceAll`), auto-enhance en `DOMContentLoaded`.

**Cómo enlazar** (en el `<head>`, tras `zt.css`; el script tras el shell):
```html
<link rel="stylesheet" href="../shared/components/datepicker.css">
<script src="../shared/components/datepicker.js"></script>
```
(Ajustar la profundidad `../` según la ubicación de la pantalla.)

### Uso (declarativo — recomendado)
Marca el `<input type="date">` con `data-zt-datepicker`; se mejora solo:
```html
<div class="mp-input-wrapper">
  <input class="mp-input-field" id="pa-nacimiento" name="birthDate" type="date"
         required aria-required="true" placeholder="dd/mm/aaaa"
         max="2026-09-10" data-zt-datepicker aria-describedby="pa-nacimiento-error">
</div>
```
- `min` / `max` (atributos del input) acotan las fechas seleccionables; se leen **vivos** al abrir.
- `data-zt-datepicker-title="…"` cambia el título del diálogo (def. "Seleccione una fecha").
- `data-zt-datepicker-readonly="true"` **o** el atributo `readonly` → **Date Field readonly**
  (mismo estilo de campo, sin abrir calendario). Ver "Readonly date field".

### Uso (programático)
```js
ZTDatePicker.enhance(document.getElementById('pa-nacimiento'), {
  minDate: '2000-01-01',
  maxDate: '2026-09-10',
  disabledDates: ['2026-01-01'],            // Array ISO | function(iso) => bool
  onApply: function (iso) { /* iso = YYYY-MM-DD */ },
  onClose: function () { /* cerrado sin aplicar */ }
});
```

### API conceptual
`DatePicker({ value, minDate, maxDate, disabledDates, onApply, onClose })`
Adaptada a HTML/CSS/JS: `value` = `input.value` (`YYYY-MM-DD`); `minDate`/`maxDate` = `min`/`max`
del input (o opción); `disabledDates` = Array ISO o `function(iso)`; `onApply(iso)`/`onClose()` callbacks.

### Anatomía (Figma)
`.zt-datefield` (posicionador) › `.zt-datefield__trigger` (campo + icono calendario) ·
`.zt-datepicker` (contenedor: bg white, border 1px default, radius 12, padding 24, gap 24,
shadow 1) › `.zt-datepicker__head` (título "Seleccione una fecha" Roboto Bold 18px + cerrar X 32×32) ·
`.zt-datepicker__nav` (`< Mes Año >`, chevrons 20px, mes Roboto Regular 18px) ·
`.zt-datepicker__weekdays` (D L M M J V S, Roboto Regular 16px text secondary, Domingo primero) ·
`.zt-datepicker__grid` (CSS Grid 7 columnas, celdas 40×40) · `.zt-datepicker__footer`
(botón **Aplicar** = DS `.mp-btn--primario`, no un botón exclusivo).

### Estados (tokens)
- **Default (día del mes actual):** texto `--use-text-primary`, fondo transparente, sin borde.
- **Fuera del mes (anterior/siguiente):** `--use-text-tertiary` (no compite con el mes actual).
- **Hover:** `--use-surface-theme-orange-20` (sutil; nunca más fuerte que selected).
- **Focus (teclado):** outline `--use-focus-outline`.
- **Seleccionada:** círculo `--use-primary-default` (naranja, 40px, radius full) + texto
  `--use-text-on-dark-primary`. Una sola fecha seleccionada; siempre visualmente más fuerte que hover.
- **Disabled:** `--base-neutral-50`, sin hover, no clicable, no focus.

### Valor y formato
- **Presentación:** `dd/mm/aaaa` (en el trigger del campo). Ej.: `05/01/2026`.
- **Técnico (fuente de verdad):** `YYYY-MM-DD` en el `<input>`. Ej.: `2026-01-05`.
- Separación estricta valor de presentación / valor técnico.

### Comportamiento "Aplicar"
El usuario navega meses y selecciona una fecha **provisional**; el `<input>` (campo real)
**NO se actualiza** hasta pulsar **Aplicar**. Al aplicar: guarda la fecha, actualiza el campo
(`dd/mm/aaaa`), dispara `input` + `change` (validación/recálculo del flujo) y cierra. Cerrar
con **X / Escape / clic fuera / overlay** descarta la selección provisional (no cambia el valor).

### Navegación de meses
Chevron izquierdo → mes anterior; derecho → mes siguiente. Cambia de año correctamente en
enero/diciembre. `PageUp`/`PageDown` también cambian de mes. `min`/`max` deshabilitan la
navegación cuando el mes destino queda completamente fuera de rango.

### Teclado / Accesibilidad
`role="dialog"` + `aria-modal="true"` + `aria-labelledby` (título). Grid con `role="grid"` y
celdas `role="gridcell"` + `aria-selected`; hoy marcado con `aria-current="date"`. Roving
tabindex en el grid. Teclas: `↑`/`↓` semana anterior/siguiente · `←`/`→` día anterior/siguiente ·
`Home`/`End` inicio/fin de semana · `Enter`/`Space` selecciona · `Escape` cierra · `Tab` con
focus trap dentro del diálogo. Foco visible; al cerrar el foco vuelve al trigger.

### Modal vs. popover / responsive
En **desktop** el calendario se ancla al campo como **popover** (se reposiciona para no salir
del viewport). En **≤520px** se muestra como **modal centrado** sobre overlay
(`--mp-modal-overlay`), sin salir del viewport. La apariencia del componente es idéntica en ambos.

### Readonly date field
Para campos calculados por regla de negocio que el usuario **no** debe editar (p. ej. Fecha de
inicio de vigencia = primer día del mes siguiente): usar `readonly` (o
`data-zt-datepicker-readonly="true"`). Rinde el **mismo estilo de campo** (con `dd/mm/aaaa`),
pero **no abre calendario**, oculta el icono y queda fuera de la tabulación. No cambiar la regla
de negocio solo para usar el calendario.

### Tokens usados
`--use-surface-white`, `--use-border-default`, `--use-primary-default`, `--use-text-primary`,
`--use-text-secondary`, `--use-text-tertiary`, `--use-text-on-dark-primary`,
`--use-surface-theme-orange-20`, `--use-focus-outline`, `--use-state-error-border`,
`--mp-modal-overlay`, `--radius-12`, `--radius-full`, `--space-4/8/12/16/24`,
`--font-size-xl` (18px), `--font-size-lg` (16px), `--font-weight-bold/regular`,
`--line-height-normal` (1.3). Sombra: `shadow 1` de Figma (`2px 5px 16px rgba(0,0,0,.15)`).
Botón: DS (`.mp-btn--primario`). Iconos: `icon-calendar-blank`, `icon-x`, `icon-caret-left/right`.

### Notas
- **No** usar `input type="date"` nativo visible en unas pantallas y custom en otras: siempre este patrón.
- El `<input>` permanece como fallback y fuente de verdad; si el flujo cambia su `value` por JS,
  dispara `change` (`input.dispatchEvent(new Event('change', { bubbles: true }))`) para refrescar el trigger.
- Un solo calendario abierto a la vez.

---

## OTP Input / Verification Code (`zt-otp`)

**Qué es:** grupo de N campos de un dígito para códigos de verificación (OTP).
Autoavance, backspace inteligente, paste distribuido y estados success/error.
Informativo/interactivo, **general** (no crear `afiliacion-otp`).

**Cuándo usarlo:** validación por código en cualquier flujo ZT (afiliación,
cambios de datos sensibles, etc.).

**Archivos:** `otp-input.css` · `otp-input.js` (`ZTOtpInput.create`).

**Cómo enlazar** (tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/otp-input.css">
<script src="../shared/components/otp-input.js"></script>
```

### API (`ZTOtpInput.create(container, cfg)`)
| Prop | Obligatorio | Descripción |
|---|---|---|
| `length` | no | Nº de dígitos (def. 6). |
| `value` | no | Valor inicial. |
| `onChange(value)` | no | En cada cambio. |
| `onComplete(value)` | no | Al reunir los N dígitos (usar para validar automáticamente). |

Instancia: `getValue()`, `setValue(v)`, `clear()`, `setState('default'|'success'|'error'|'disabled')`, `focusFirst()`, `destroy()`.

### Comportamiento
Solo dígitos 0-9 (`inputmode="numeric"`); autoavance al escribir; Backspace en celda
vacía → celda anterior; `paste` distribuye el código (ignora no numéricos);
`autocomplete="one-time-code"` en el primer campo.

### Estados
`default` (borde subtle; celda con valor → borde strong) · `success` (borde
`--use-state-success-border`) · `error` (borde `--use-state-error-border`,
`aria-invalid`) · `disabled`.

### Accesibilidad
`role="group"`; cada input `aria-label="Dígito i de N"`; foco visible; en error
`aria-invalid`. El anuncio del resultado lo gestiona la pantalla con un host `aria-live`.

### Tokens usados
`--use-surface-white`, `--use-border-subtle/strong`, `--use-text-primary/tertiary`,
`--use-primary-default`, `--use-state-success-border`, `--use-state-error-border`,
`--use-surface-surface`, `--space-8/16`, `--radius-16` (1rem), `--font-weight-bold`.

### Notas
- Contenedor `width:100%; max-width:480px`, columnas `repeat(N,1fr)` (sin width fijo por input).
- Los 6 dígitos permanecen en una fila; en pantallas muy angostas se reduce gap/tamaño.

---

## Switch (`zt-switch`)

**Qué es:** interruptor booleano on/off. Track redondeado + knob circular que se
desplaza. Encendido = naranja (`--use-primary-default`); apagado = gris neutro.
Semántica `<button role="switch" aria-checked>`.

**Cuándo usarlo:** cualquier toggle de ZT (p. ej. "¿El contratante es beneficiario
del plan?"). **No crear switches por flujo** (`.beneficiario-switch`, etc.).

**Archivos:** `switch.css` · `switch.js` (`ZTSwitch.create/renderRow`).

**Cómo enlazar** (tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/switch.css">
<script src="../shared/components/switch.js"></script>
```

### API
| Prop | Obligatorio | Descripción |
|---|---|---|
| `checked` | no | Estado inicial (def. `false`). |
| `disabled` | no | No interactivo (def. `false`). |
| `ariaLabel` | no* | Nombre accesible si no hay label visible. |
| `labelledBy` | no* | Id del texto que lo describe. |
| `onChange(checked)` | no | Callback al cambiar. |

`renderRow(container, cfg)` añade además `label` (texto visible a la izquierda) y
asocia el nombre accesible por `id`. Devuelve `{ row, input, isChecked, setChecked, setDisabled }`.

### Uso por JS
```js
var sw = ZTSwitch.renderRow(document.getElementById('host'), {
  label: '¿El contratante es beneficiario del plan?',
  checked: true,
  onChange: function (checked) { /* … */ }
});
sw.isChecked();          // -> true/false
sw.setChecked(false);    // programático (dispara onChange)
```

### Estados / tokens
Encendido: `--use-primary-default`. Apagado: `--base-neutral-50`. Knob:
`--use-surface-white`. Foco: `--use-focus-outline`. Radio: `--radius-full`.
Enter/Space alternan (nativo del `<button>`).

---

## Beneficiary / Expandable Person Card (`zt-benef-card`)

**Qué es:** card expandible que representa **una persona en una lista editable**
(beneficiario, dependiente, etc.). Tiene dos presentaciones del MISMO componente:
**colapsada** (avatar + nombre + chip de estado + "Beneficiario N · Parentesco" +
acciones) y **expandida/edición** (mismo encabezado + acciones Eliminar/Cerrar + slot
para el formulario, separado por un divisor). Un solo componente renderiza cualquier ítem: **no** crear `.beneficiary1/2/3`.

**Cuándo usarlo:** listas de personas donde cada ítem se agrega, edita, valida y
elimina (Beneficiarios del Paso 3 de afiliación y equivalentes).

**Archivos:** `benef-card.css` · `benef-card.js` (`ZTBenefCard.create`).

**Cómo enlazar** (tras `zt.css`):
```html
<link rel="stylesheet" href="../shared/components/benef-card.css">
<script src="../shared/components/benef-card.js"></script>
```

### API (`ZTBenefCard.create(cfg)`)
| Prop | Descripción |
|---|---|
| `number` | Índice visible (1-based) → "Beneficiario N". |
| `name` | Nombre completo → título de la card. Vacío → "Nuevo beneficiario" atenuado. |
| `relationship` | Parentesco legible → línea secundaria "Beneficiario N · Parentesco". |
| `status` | `pending` \| `complete` → chip con icono (reloj/check) + acento lateral amarillo/verde. |
| `expanded` | `true` abre en edición; `false` colapsada. |
| `missing` | `string[]` de campos obligatorios pendientes → microcopy "Falta(n)…" (solo colapsada + pending). |
| `onEdit` / `onDelete` / `onClose` | Callbacks de las acciones. |
| `body` | HTMLElement con el formulario (slot de la vista expandida). |

Instancia: `el` (nodo raíz), `bodyId`, `setStatus(s)`, `setExpanded(b)`,
`setHeader({number,name,relationship})`, `setMissing(arr)`, `getBody()`,
`getToggleBtn()`, `getDeleteBtn()` (estos dos para gestión de foco desde el flujo).

### Accesibilidad
- El título es un **heading** (`<h4>` con `id`): la lista es navegable por encabezados.
- El botón de alternar (Editar/Cerrar) es el **control de expansión**: lleva
  `aria-expanded` y `aria-controls` apuntando al `id` del cuerpo; el cuerpo es
  `role="region"` con `aria-labelledby` al título.
- Cada acción tiene **nombre accesible único** ("Eliminar Beneficiario 2 — Nombre",
  "Editar…/Cerrar…"), para distinguir a quién afecta.
- `getToggleBtn()`/`getDeleteBtn()` permiten al flujo reubicar el foco tras
  cerrar/eliminar. `prefers-reduced-motion` desactiva transiciones.

### Integración de foco/anuncios (recomendado en el flujo)
Al **agregar** → foco al primer campo + anunciar por `aria-live`. Al **eliminar** →
foco a la card vecina o al botón "Agregar" + anunciar. Al **cerrar** → foco al botón
"Editar" de esa card + anunciar si quedó pendiente/completo. Al revelar un bloque
condicional → foco a su primer campo.

### Estados
- **Superficie SIEMPRE blanca** (`--use-surface-white`), colapsada y expandida: el
  fondo gris se percibía como "inactivo". Border subtle, radius 12 y padding 24 en
  ambos estados; sin sombras fuertes.
- **Jerarquía del encabezado:** avatar circular 44px (violeta; verde si está completo) ·
  **nombre** como título (18px bold) + **chip de estado** (icono + texto, nunca solo
  color) · línea secundaria "Beneficiario N · Parentesco" (14px, terciario).
- **Acento lateral** de 4px: amarillo (`--use-state-warning-border`) si está pendiente,
  verde (`--use-state-success-icon`) si está completo → el estado se lee al escanear la lista.
- **Acciones con peso distinto:** **Editar ✎ / Cerrar ^** es la principal (pill con
  borde `--use-primary-default`); **Eliminar** es secundaria y discreta (gris terciario,
  rojo solo en hover/foco) para evitar borrados accidentales.
- **Faltantes** (colapsada + pendiente): caja gris suave con icono de alerta,
  alineada con el texto del encabezado.
- **Expandida:** mismas superficie/border/padding; un divisor separa el encabezado
  del formulario.

### Preservación de datos (Cerrar / Editar)
El componente **no** guarda estado propio: el flujo mantiene un objeto por persona.
Cerrar solo colapsa (no resetea). Al reabrir con Editar, el flujo rehidrata los
valores desde su modelo. **Nota de integración:** al restaurar valores en campos
mejorados (dropdown/datepicker) que disparan `change`, evita sincronizar el modelo
campo a campo durante la rehidratación (usa un guard y sincroniza una sola vez al
final); de lo contrario un campo aún no restaurado puede sobrescribir con vacío a
otro ya restaurado.
- **Chip de estado:** `pending` → reloj + tokens `--use-state-warning-*`; `complete` →
  check + tokens `--use-state-success-*`.

### Accesibilidad
Acciones son `<button>`; el chip de estado es texto (su icono es `aria-hidden`).
El avatar de persona es decorativo (`aria-hidden`).

---

## File upload (`zt-upload`)

**Qué es:** zona para arrastrar o seleccionar un archivo (ref. Figma "mp upload file"). Al cargar,
se reemplaza por un campo gris con nombre y tamaño + "Eliminar".

**Cuándo usarla:** soportes y adjuntos de un formulario (certificado bancario, formato de libranza,
aprobación de la empresa, soportes del Paso 8).

**Archivos:** `file-upload.css` · `file-upload.js` (`ZTFileUpload.html(cfg)` + `ZTFileUpload.bind(root, onChange)`).

| Prop (`html`) | Obligatorio | Descripción |
|---|---|---|
| `id` | sí | id del `<input type="file">` (enlaza el label del campo). |
| `value` | no | `{ name, size }` si ya hay un archivo cargado. |
| `accept` | no | Extensiones permitidas. Def. `.pdf,.jpg,.jpeg,.png`. |
| `maxMB` | no | Tamaño máximo. Def. 5. |
| `attrs` | no | Atributos extra para el input (p. ej. `data-cfg="cert"`). |

`onChange(input, meta|null, error|null)`: se llama al cargar, quitar o rechazar (formato/tamaño).
Estados: vacío · hover/arrastrando · cargado · error (`.is-error`). Prototipo: solo guarda metadatos.
