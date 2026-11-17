# Portal UX Compensar (repositorio centralizador)

El portal reúne el **sistema de diseño** y los **prototipos** de Compensar para revisarlos y comentarlos. Es el repositorio **centralizador**: no contiene diseño ni flujos. Los lee de los otros dos repositorios, decide qué versión de cada uno se publica y genera un sitio estático.

Está hecho con HTML, CSS y JavaScript nativos y scripts de Node.js, sin frameworks ni dependencias.

## Los tres repositorios

| Carpeta | Nombre | Rol | Nombre propuesto en GitHub |
|---|---|---|---|
| `Flujos/portal/` | Portal UX | Centralizador: reúne, controla versiones y publica | `compensar-ux-portal` |
| `Core-Design-System/` | Sistema de diseño | Fuente de verdad visual: tokens, estilos y componentes | `compensar-ux-design-system` |
| `Flujos/prototipos/` | Prototipos | Flujos de Drupal, ZT y APP | `compensar-ux-prototipos` |

```
Sistema de diseño ──(copia controlada: npm run ds:sincronizar)──▶ Prototipos
        │                                                          │
        └───────────────────── el portal lee ambos ◀───────────────┘
                                     │
                                   dist/  →  (más adelante) Vercel
```

El portal solo **lee** los repositorios fuente (`git ls-tree`, `archive`, `log`, `show`, `grep` y `status --no-optional-locks`). La única acción que escribe en otro repositorio es `npm run ds:sincronizar`, y solo cuando tú la ejecutas.

## Uso diario

```bash
npm run dev     # construye, abre el servidor y se reconstruye solo cuando cambia algo
```

También funciona con doble clic en **Portal UX.app** o **Abrir portal.command**. Se abre http://127.0.0.1:4173/.

El portal se reconstruye solo cuando:
- haces un commit o cambias archivos en el sistema de diseño o en los prototipos;
- cambias la plantilla del portal, `catalogo.json` o `fuentes.json`.

Otros comandos:

```bash
npm run build           # construir una vez
npm run publicar        # generar la carpeta lista para subir (Compensar/publicar/)
npm run check           # buscar referencias rotas
npm run serve           # solo servidor
npm run ds:estado       # ¿los prototipos usan la versión actual del sistema de diseño?
npm run ds:sincronizar  # actualizar los prototipos con el sistema de diseño (controlado)
```

## Subir el portal a un hosting

```bash
npm run publicar
```

Deja el sitio completo en `Compensar/sitio/`, con `index.html` en su raíz:

```
sitio/
├── index.html          ← entrada a todo
├── prototipos.html · sistema-de-diseno.html · estado.html · entregables.html · flujo.html
├── ds/                 ← sistema de diseño publicado
├── p/                  ← prototipos publicados
├── css/ · js/
├── catalogo.json · estado.json
└── robots.txt          ← bloquea buscadores y rastreadores de IA
```

`sitio/` **sí está en el repositorio**: así, quien clone o descargue el proyecto lo tiene
listo sin construir nada, y el `index.html` de la raíz lleva directo allí. Se borra y se
regenera en cada ejecución, así que no guardes nada tuyo dentro: cambia la plantilla del
portal y vuelve a ejecutar `npm run publicar`.

Lo que **no** se publica: Nara, `node_modules`, los respaldos y las fuentes que la lista
blanca de `fuentes.json` deja fuera (auditorías, guías técnicas y código SCSS).

El bloqueo de rastreadores es una indicación que se respeta voluntariamente. La protección
real es el control de acceso del hosting.

## Sistema de diseño → prototipos (actualización controlada)

Los prototipos no enlazan al sistema de diseño en vivo. Usan una copia en `flujos/shared/vendor` y `flujos/shared/icons`. Eso evita que un cambio del sistema rompa los prototipos sin que nadie lo revise.

1. Cambias el sistema de diseño y haces commit.
2. El portal muestra en **Repositorios y sincronización** que los prototipos quedaron en una versión anterior, y cuál.
3. Ejecutas `npm run ds:sincronizar`. Corre el script propio de los prototipos (`sync-flows.mjs`) y **no hace commit**.
4. Revisas los prototipos en el portal y, si todo está bien, haces commit en el repositorio de prototipos. El script te muestra el comando.

## Qué versión se publica

En `fuentes.json`, `ref` decide qué se publica:

- `"HEAD"`: el último commit de la rama. Los cambios sin commit no se publican.
- un tag (por ejemplo `ds-2.2.0`): una versión fija, aunque sigas trabajando encima.
- `"WORKTREE"`: la carpeta tal como está. Sirve solo para pruebas locales.

Convención sugerida para los mensajes de commit, que se ven en "Últimos cambios": `DS · Botones: …`, `ZT · Agendamiento: …`, `APP · Historia clínica: …`.

## Componentes transversales

La página **Repositorios y sincronización** muestra:

- qué componentes del sistema de diseño (`mp-*`) usan los prototipos y cuánto;
- los componentes propios de cada plataforma (`zt/shared/components`, …): los que **duplican** uno del sistema y los que son **candidatos** a convertirse en transversales.

## Estructura

```
fuentes.json         Repositorios, nombres, roles, versión publicada, lista blanca, robots
catalogo.json        Ficha de cada flujo (nombre, plataforma, estado, versión, Figma, publicar)
portal/              Plantilla del portal: páginas, _partials/, css/portal-ux.css, js/portal.js
scripts/
  lib/fuentes.mjs    Acceso de solo lectura a los repositorios, sincronización y mapa de componentes
  build.mjs          Genera dist/
  watch.mjs          Portal local siempre sincronizado
  ds-sincronizar.mjs Estado y actualización controlada sistema de diseño → prototipos
  check.mjs          Verificación de enlaces y recursos
  serve.mjs          Servidor local
vercel.json          Configuración para el despliegue (aún no se usa)
```

## Privacidad y rastreadores

- Todas las páginas llevan `noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai`. El servidor local y `vercel.json` envían la misma cabecera `X-Robots-Tag`.
- `robots.txt` bloquea todo el sitio para todos los rastreadores, con reglas explícitas para buscadores y bots de IA (GPTBot, ClaudeBot, CCBot, PerplexityBot, Google-Extended, Bytespider…).
- Esas reglas son indicaciones que los rastreadores respetan de forma voluntaria. La protección real será **Vercel Authentication** (*All Deployments*) cuando se publique: sin iniciar sesión, nadie ni nada puede leer el contenido.

## Seguridad de la salida

- Solo se copia lo que coincide con `incluir` y no coincide con `excluir`.
- `prohibidos` es una red de seguridad: si algún archivo de `dist/` coincide (`*.md`, `nara/`, auditorías, `.env`…), el build falla.


## Versiones publicadas por flujo

Cada flujo tiene su propio historial de versiones en `Flujos/versiones/` (ver su `LEEME.md`).

```
npm run guardar -- estado                              # cambios pendientes por ámbito (flujo, portal, sitio…)
npm run guardar -- commit <ámbito> -m "tipo(plat): …"  # commit local solo de ese ámbito
npm run registrar-flujo -- --id … --nombre … --plataforma zt --ruta zt/…/   # flujo nuevo (borrador, sin versiones)
npm run version-propuesta -- <id>                      # solo lectura: número, notas y almacenamiento propuestos
npm run version-flujo -- <id> <x.y.z> --notas "…" --aprobado-por "…" --actualizar-catalogo
npm run guardar -- commit-version <id>                 # commit propio de la versión
npm run version-verificar -- <id> <x.y.z>              # aparece en el historial y abre
npm run versiones:verificar                            # integridad de todo el almacén
npm test                                               # pruebas (versiones y escenarios de extremo a extremo)
```

- La versión se congela desde un commit y es inmutable; un commit de desarrollo no la crea y requiere aprobación.
- El build la copia a `versiones/<id>/v<x.y.z>/` (navegable) sin tocar la vigente en `p/`.
- `catalogo.json → version` debe coincidir con la última versión publicada.
- El detalle de cada flujo en el portal lista sus versiones y permite abrirlas.
- Los commits solo son locales: push y despliegue requieren autorización aparte.
## Ficha del flujo: pantallas, HU, versiones y despliegues
`flujo.html?id=<flujo>` tiene cuatro pestañas (Resumen, Pantallas y HU, Versiones, Despliegues). Datos:
- `catalogo.json` → HU del flujo (una sola vez por flujo; vincular no la duplica).
- `trazabilidad/<flujo>.json` → pantallas registradas (id estable `scr-…`) y relaciones HU↔pantalla. Se crea al registrar la primera pantalla.
- `Flujos/versiones/` → versiones publicadas (manifiestos inmutables); las pantallas de cada versión salen de sus huellas.
- `despliegues.json` → publicaciones efectivas, con evidencia obligatoria. Se agrega con `npm run despliegue-registrar -- --flujo … --entorno … --commit … --estado … --evidencia "…"`. Vacío por defecto: no se infiere nada.
- Commits: `git log` filtrado por los archivos del flujo (propios) y por los archivos `shared/` que sus pantallas referencian (transversales).
La edición (registrar pantallas, vincular HU) usa una API local de `npm run dev` / `npm run serve` (solo loopback); el sitio publicado es de solo lectura. Toda validación de URLs está en `scripts/lib/trazabilidad.mjs`.
