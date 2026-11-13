# Paquete CSS/JS versionado (estilo Bootstrap) — diseño corto

Fecha: 2026-11-13 · Estado: aprobado por Juan ("genéralo")

## Por qué
Los devs bajan los HTML de un flujo y hoy se rompen porque dependen de rutas
relativas a `shared/`. Queremos que cada flujo enlace un CSS y un JS únicos,
publicados en una URL pública con versión fija, para reproducir el flujo
localmente sin pedirle nada al equipo UX.

## Objetivos
- Un paquete del Design System: `compensar.min.css` + `compensar.min.js`
  (core + themes + icons + fuentes + JS de componentes que usan los flujos).
- Una capa por plataforma: `compensar-zt.min.css/js` (y drupal / app),
  con versión propia, generada desde `Flujos/prototipos/<plataforma>/shared`.
- Versiones inmutables: `dist/<paquete>/vX.Y.Z/…`; nunca se sobrescribe una
  versión publicada (el build falla si ya existe con contenido distinto).
- Manifiesto por versión con sha256 de cada archivo (permite SRI).

## No objetivos (por ahora)
- Cambiar los enlaces de los flujos (tarea 2, cuando exista la URL pública).
- Publicar / hacer push / crear el repo público o el CDN.
- Alias flotantes tipo `v2/` o `latest`: cada flujo apunta a versión exacta.

## Enfoques considerados
1. **Paquete único versionado en URL pública (elegido).** El flujo descargado funciona solo;
   las actualizaciones se adoptan flujo por flujo después de QA.
2. `DEPENDENCIAS.md` + rutas relativas: más frágil, el dev igual arma carpetas a mano.
3. Repo por flujo / submódulos: duplica `shared/` y se desincroniza.

## Decisiones
- Fuentes de iconos con URL relativa dentro del paquete (`fonts/…`), para que
  la carpeta de versión funcione igual servida por CDN, por Azure o local.
- La URL base pública se definirá después; los flujos la usarán como prefijo
  único, de modo que la tarea 2 sea un reemplazo mecánico.
- Copia local del paquete dentro del ZIP de descarga como respaldo sin internet
  (se integra en la tarea 2 junto con el cambio de enlaces).

## Lo que queda al implementador
Qué JS exactos del DS entran al paquete, minificación, nombres de scripts npm
y la página de prueba.
