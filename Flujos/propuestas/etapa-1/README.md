# Etapa 1 · Sistema de diseño versionado (propuesta)

Esta carpeta está **fuera** de los tres repositorios. No modifica el Portal UX, los prototipos ni el sistema de diseño. Contiene las herramientas preparadas para cuando se autorice la etapa.

| Archivo | Para qué |
|---|---|
| `ds-sync.mjs` | Sincroniza el sistema de diseño → prototipos **solo desde un tag**, y registra la versión en `shared/vendor/ds-version.json` |
| `regresion.mjs` | Compara todas las páginas de los prototipos con la versión actual y con la candidata (visual a 1440, 390 y 320 px, más estilos calculados, errores JS y 404) |
| `propuesta-temas-foco.patch` | Ajuste complementario propuesto a `_inputs.scss`: foco visible, tema oscuro y alto contraste para solo lectura y deshabilitado |
| `package.json` | Dependencias de la prueba de regresión (Playwright) |

## Flujo de una actualización del sistema de diseño

1. **Sistema de diseño:** commit y tag (`v2.2.0`).
2. **Plan:** `node ds-sync.mjs --ref v2.2.0` muestra qué archivos cambiarían. No escribe nada.
3. **Regresión:** `node regresion.mjs --ref v2.2.0` compara todas las páginas y deja el reporte en `regresion/<fecha>/`.
4. **Aplicar:** `node ds-sync.mjs --ref v2.2.0 --aplicar` copia los archivos y escribe `ds-version.json`. No hace commit.
5. **Revisar y confirmar:** UX revisa los prototipos y hace commit en el repositorio de prototipos con los comandos que imprime el script.
6. **Vigilar:** `node ds-sync.mjs --verificar` detecta cualquier edición a mano de la copia.

## Reglas de protección

- Rechaza versiones sin tag (salvo `--permitir-sin-tag`, solo para pruebas).
- Nunca lee la carpeta de trabajo del sistema de diseño: usa `git show <tag>:archivo`.
- No aplica si los prototipos tienen cambios sin commit en `shared/vendor` o `shared/icons`.
- No hace commit ni push.

## Requisitos de la prueba de regresión

```bash
npm install
npx playwright install chromium
```

Cuando se apruebe la etapa, estos scripts se conectan al Portal UX (`npm run ds:plan`, `ds:aplicar`, `ds:verificar`, `regresion`) y reemplazan a `ds-sincronizar.mjs`.
