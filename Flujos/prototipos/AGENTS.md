# AGENTS.md — Compensar

Guía operativa **obligatoria** para cualquier agente (o persona) que trabaje en este proyecto. Léela completa antes de crear o modificar un flujo.

## Objetivo

Este proyecto contiene:

- Design System de Compensar
- prototipos y pruebas ZT
- prototipos y pruebas Drupal
- recursos compartidos entre flujos

La prioridad es:

1. reutilización
2. consistencia con el Design System
3. mantenibilidad
4. evitar duplicación
5. facilidad de publicación

## Fuente de verdad

El **Design System** (repo `Core-Design-System/`, hermano de `compensar/`) es la fuente de verdad visual. Vive en un repositorio aparte; este repo consume solo su distribución en `shared/`.

Antes de crear algo, revisar en este orden:

1. Design System (`../../Core-Design-System/`)
2. `shared/`
3. `zt/shared/` o `drupal/shared/`
4. otros flujos existentes

No crear algo nuevo si ya existe una solución equivalente.

## Estructura

Dos repositorios **separados**: el Design System y este repo de flujos.

```
Compensar/
├── Core-Design-System/       ← repo del Design System (fuente de verdad). Repo aparte, NO se publica.
└── compensar/
    └── flujos/               ← ESTE repo (prototipos publicables)
        ├── shared/
        │   ├── vendor/       ← core.css, portal.css (distribución del DS) — NO editar
        │   ├── icons/        ← icons.css + fonts (distribución del DS) — NO editar
        │   ├── css/          ← compensar.css (común entre flujos)
        │   ├── js/           ← compensar.js (común entre flujos)
        │   └── assets/       ← logos e imágenes compartidas
        ├── zt/
        │   ├── shared/       ← header, zt.css, zt.js de ZT
        │   └── <flujos>/     ← p. ej. agendamiento-citas/
        ├── drupal/
        │   ├── shared/       ← header, drupal.css, drupal.js, nav-* de Drupal
        │   └── <flujos>/     ← p. ej. navegacion/, ayudas-diagnosticas/
        ├── scripts/          ← sync-flows.mjs
        ├── README.md
        ├── kiro-context.md
        └── AGENTS.md
```

## Cómo crear un nuevo flujo

1. Determinar si pertenece a ZT o Drupal.
2. Crear carpeta con nombre descriptivo en kebab-case.
3. Consumir los recursos desde `shared`.
4. Crear `custom.css` o `custom.js` solo si realmente hace falta.
5. Reutilizar siempre componentes del Design System.

Ejemplos correctos:

- `flujos/zt/agendamiento-citas/`
- `flujos/zt/laboratorio/`
- `flujos/drupal/ayudas-diagnosticas/`

Evitar nombres como: `prueba1`, `prueba2`, `nuevo`, `final-final`, `test-final`.

Enlazado típico de recursos (desde `flujos/zt/<flujo>/`):

```html
<link rel="stylesheet" href="../../shared/vendor/core.css">
<link rel="stylesheet" href="../../shared/icons/icons.css">
<link rel="stylesheet" href="../../shared/css/compensar.css">
<link rel="stylesheet" href="../shared/zt.css">      <!-- o ../shared/drupal.css -->
<link rel="stylesheet" href="css/custom.css">        <!-- solo si hace falta -->
```

## Jerarquía de estilos

Siempre, en este orden (cada capa solo sobrescribe lo necesario):

```
Design System → Shared global → ZT / Drupal shared → Custom del flujo
```

## Design System

Solo deben vivir allí elementos globales:

- tokens
- colores
- tipografía
- botones
- inputs
- cards
- alertas
- modales
- iconografía
- componentes globales

No modificarlo para resolver una necesidad específica de un flujo.

## Shared global

`flujos/shared` es solo para elementos reutilizables entre varios flujos o entre ZT y Drupal.

No mover algo a shared solo porque "podría reutilizarse".

## ZT y Drupal

ZT y Drupal comparten el mismo Design System.

Las diferencias deben quedar únicamente en `flujos/zt/shared` o `flujos/drupal/shared`, principalmente para:

- header
- navegación
- shell
- estructura propia de plataforma
- comportamiento técnico particular

No duplicar estilos generales.

## Custom del flujo

Todo lo específico de un flujo debe quedar dentro de su carpeta. Ejemplo:

`flujos/zt/agendamiento-citas/css/custom.css`

Si posteriormente algo se reutiliza en dos o más flujos, evaluar si debe promoverse a shared. No hacerlo automáticamente.

## CSS

Nunca duplicar dentro de un flujo:

- core.css
- portal.css
- icons.css
- fonts
- tokens compilados

Los flujos deben consumir `flujos/shared/vendor/` y `flujos/shared/icons/`.

Los archivos dentro de `shared/vendor` (y `shared/icons`) **no se editan manualmente**. Para actualizarlos:

```bash
npm run sync-flows
```

## JavaScript

Según el alcance de la funcionalidad:

- solo aplica a un flujo → local (`<flujo>/js/custom.js`)
- aplica a varios flujos → evaluar `flujos/shared/js/`
- solo aplica a ZT → `flujos/zt/shared/`
- solo aplica a Drupal → `flujos/drupal/shared/`

Evitar dependencias globales innecesarias.

## Assets

- Compartidos: `flujos/shared/assets/`
- Específicos: `<flujo>/assets/`

No duplicar logos, iconos o imágenes globales.

## Iconos

Antes de usar un icono, confirmar que exista en `flujos/shared/icons/icons.css`. No inventar clases.

Si no existe:

1. buscar uno equivalente
2. reutilizarlo si funciona
3. reportar si realmente hace falta agregar uno nuevo

No modificar el set global sin aprobación.

## Responsive

Cada flujo nuevo debe revisarse en:

- mobile pequeño
- mobile
- tablet
- desktop

## Accesibilidad

Revisar al menos:

- labels
- foco visible
- teclado
- contraste
- estados hover/focus/disabled
- jerarquía de encabezados
- alt de imágenes funcionales
- nombres accesibles en botones

## Rutas

Todos los prototipos deben funcionar servidos desde `flujos/`.

No deben depender en runtime de:

- el repo del Design System (`Core-Design-System/`)
- `node_modules/`
- rutas absolutas locales
- archivos externos al árbol de `flujos/`

## Verificación obligatoria

Después de un cambio relevante:

1. levantar servidor local sobre `flujos/` (p. ej. `python3 -m http.server`)
2. revisar páginas
3. revisar consola
4. comprobar 404
5. comprobar CSS/JS/fonts/imágenes/JSON
6. validar navegación
7. validar responsive
8. revisar visualmente

No considerar terminado un flujo solo porque carga.

## Publicación

Antes de publicar:

```bash
npm run sync-flows
```

La carpeta publicable es este repo (`flujos/`).

No subir:

- el repo del Design System (`Core-Design-System/`)
- node_modules/
- scripts de desarrollo del Design System

## Regla anti-duplicación

No copiar código para avanzar más rápido si ya existe una implementación equivalente.

Evitar:

- CSS repetido
- JS repetido
- logos repetidos
- fuentes repetidas
- componentes equivalentes con nombres distintos

## Reglas para agentes

Cuando trabajes en este proyecto:

- no reestructures si no se pidió
- no borres archivos sin autorización
- no hagas commits automáticamente
- no modifiques Git
- no cambies componentes globales por necesidades locales
- no cambies diseño por preferencia personal
- respeta la arquitectura existente
- reporta mejoras arquitectónicas antes de implementarlas

## Checklist de una nueva prueba

Antes de entregar, confirmar:

- está correctamente en ZT o Drupal
- usa el Design System actual
- no duplica core.css
- no duplica icons/fonts
- reutiliza shared cuando corresponde
- custom contiene solo lo específico
- no hay 404
- no hay rutas rotas
- JS funciona
- JSON/fetch funciona
- mobile funciona
- desktop funciona
- estados de interacción funcionan
- se revisó accesibilidad básica
- se puede publicar copiando `flujos/`
