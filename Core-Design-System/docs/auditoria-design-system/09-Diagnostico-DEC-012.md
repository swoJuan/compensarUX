# 09 — Diagnóstico DEC-012 (Unidades `rem` / `em`)

**Decisión:** DEC-012 — Unidades relativas `rem` y `em` con fidelidad a Figma
**Alcance:** exclusivamente SCSS/estilos propios de Compensar (`core/`). Bootstrap intacto.
**Fase:** diagnóstico y plan. **Sin cambios de código.**
**Fecha:** Noviembre 2026
**Estado:** propuesta para aprobación del equipo UX/UI antes de implementar.

> No se modificó código, ni Bootstrap, ni Figma, ni `letter-spacing`, ni ninguna decisión DEC-001…DEC-011.

---

## 0. Base raíz verificada (requisito DEC-012 punto 2)

`core/base/_reset.scss` → `html { font-size: 100%; }`. **No** se usa el truco `62.5%` ni se fija un tamaño global que rompa la accesibilidad. Por tanto **1rem = 16px** es correcto en este proyecto, y las conversiones Figma→rem son exactas: `16px = 1rem`, `24px = 1.5rem`, `8px = 0.5rem`, `14px = 0.875rem`, `12px = 0.75rem`, `2px = 0.125rem`.

La función `rem($value, $base: 16)` ya existe en `core/abstracts/_functions.scss` y es la vía recomendada (no introducir literales rem a mano cuando se pueda usar la función o un token).

---

## 1. Inventario de unidades en SCSS propio (`core/`)

| Unidad / forma | Usos | Lectura |
|---|---|---|
| `px` (todas las apariciones) | **859** | bruto; incluye comentarios, fallbacks y `rem()` |
| `rem` (literal) | 104 | ya relativas |
| `em` (literal) | 34 | relativas al componente |
| `rem(...)` (llamadas a la función) | 300 | se compilan a `rem`; **no son deuda** |

### Desglose de los 859 `px` por contexto

| Contexto | Usos | Tratamiento |
|---|---|---|
| Dentro de `rem( … px )` | 297 | ✅ ya se compilan a rem — no tocar |
| En comentarios (`// … px`) | 164 | ✅ no afectan output — no tocar |
| En `@media` / breakpoints | 41 | ⏸ **se conservan px** (justificado, punto 4) |
| En bordes (`1px`/`1.5px`/`2px`/`3px`) | 85 | ⏸ **se conservan px** (líneas finas) |
| En `letter-spacing` | 1 | 🚫 **no tocar** (DEC-005) |
| En `box-shadow` / `outline` | 80 | ⚠ evaluar caso a caso (ver §3) |
| Fallback de `var(--token, Npx)` | 17 | ✅ el token real ya es rem — no urgente |
| **`px` directos dimensionales sin token** | **≈178** | 🎯 **candidatos reales de conversión** |

> Conclusión: la "deuda" real no son 859 px, sino **≈178 px directos** en propiedades dimensionales (font-size, width/height, padding, margin, gap, top/left, border-radius) que no pasan por `rem()` ni por un token.

---

## 2. Archivos afectados (px directos sin token — candidatos)

| Archivo | px directos | Notas |
|---|---|---|
| `components/web/_header.scss` | 26 | mayor foco; font-size 14/18, min-height 36/44/48, logo 44×44 |
| `components/web/_sidebar.scss` | 20 | dimensiones de nav |
| `components/web/_modals.scss` | 20 | icono 64, cierre 32, offsets top/right |
| `components/web/_selection-controls.scss` | 18 | ya usa custom props; px en control/visual/switch |
| `components/web/_toasts.scss` | 13 | icono 32, cierre 24 |
| `components/web/_buttons.scss` | 12 | icono 24, algunos tamaños |
| `components/web/_buttons-docs.scss` | 12 | estilos de documentación |
| `components/web/_alerts.scss` | 12 | icono 32, radius 12 |
| `vendors/_bootstrap-overrides.scss` | 9 | ⚠ **zona sensible DEC-009** (ver §3) |
| `vendors/_google-icons.scss` | 8 | ⚠ vendor |
| `components/web/_inputs.scss` | 6 | ya usa `rem()` mayormente |
| `components/web/_avatar.scss` | 6 | tamaños de avatar |
| `base/_icons.scss` | 6 | tamaños de icono |
| `components/web/_badges.scss` | 2 | — |
| `base/_theme.scss`, `base/_accessibility.scss`, `abstracts/_mixins.scss` | 2 c/u | focus ring, touch-target |

---

## 3. Conversiones recomendadas y excepciones

### 3.1 Convertir a `rem` (dimensiones escalables)
`font-size`, `width`/`height`/`min-*`/`max-*`, `padding`, `margin`, `gap`, `top`/`left`/`right`/`bottom`, `border-radius`, `inset`, `flex-basis` con valor en px directo.

- **Método:** usar la función `rem()` (o el token de spacing/radius equivalente cuando exista), no literales rem a mano.
- **Equivalencia:** exacta a 16px base (ver §0). No cambia el tamaño computado → sin impacto visual.
- **Prioridad por capa:** tokens/mixins → componentes transversales (alert, toast, tabs, pagination, inputs, selección, modal) → resto.

### 3.2 Usar `em` (solo donde el valor deba escalar con la fuente del propio elemento)
- Mantener los `em` actuales legítimos: `letter-spacing` en tokens (`0.1em`, `0.08em`), `padding: 0.125em 0.375em` de badges, `gap: 0.375em` entre icono y texto. **No convertir a rem.**
- No introducir `em` nuevos salvo que haya una razón de escalado local; evitar anidamientos de `em` que multipliquen.

### 3.3 Conservar `px` (excepciones justificadas — punto 4)
| Caso | Motivo |
|---|---|
| Bordes `1px` / `1.5px` / `2px` | líneas finas; en rem pueden subpíxelear o desaparecer |
| `@media` / breakpoints (41) | los breakpoints se definen en px por convención y por Bootstrap |
| `letter-spacing` (1) | DEC-005: no tocar |
| `box-shadow` / `outline` offsets y blur | precisión visual; el foco (3px) debe ser estable y perceptible (coordinar con DEC-004) |
| Fallbacks `var(--token, Npx)` | el token real ya resuelve a rem; el px es solo respaldo |

### 3.4 Zona sensible — NO convertir sin acuerdo (DEC-009)
- `vendors/_bootstrap-overrides.scss` y `vendors/_google-icons.scss`: son la capa que ajusta clases/vendor. DEC-009 prohíbe alterar el comportamiento de Bootstrap. **Propuesta: excluir del alcance de DEC-012** o tratarlos por separado con aprobación específica. No se tocan en esta fase.

---

## 4. Riesgos y prioridades

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Conversión en **estados interactivos** (`:hover/:focus/:active`, `transform: translate`) | Media | Solo 6 px en estados; convertir con `rem()` y verificar que hover/focus/active no cambien de tamaño. Capturar antes/después |
| Conversión en **responsive** (componentes que colapsan) | Media | No tocar `@media` (quedan px). Verificar a 320px, 768px, 1440px + zoom 200% que no haya overflow nuevo |
| Tocar **vendor/Bootstrap** por error | Alta | Excluir `vendors/` del alcance; grep de control de que `node_modules/bootstrap` y `--bs-*` no cambian |
| **Subpíxel en bordes** si se convierten 1px | Baja | No convertir bordes finos (se quedan px) |
| **Fidelidad Figma** rota por redondeo | Baja | Base 16px exacta; usar `rem()` que divide por 16 sin pérdida |
| Regresión silenciosa en `css/core.css` | Media | Build + diff dirigido; el tamaño computado debe ser idéntico (conversión 1:1) |

**Prioridad de ejecución (propuesta):**
1. **P1 — Tokens y mixins** (`_theme.scss`, `_mixins.scss`): base del sistema, impacto amplio, riesgo bajo.
2. **P2 — Componentes transversales** (alert, toast, tabs, pagination, inputs, selección, modal): ya parcialmente en `rem()`.
3. **P3 — Header, sidebar, avatar, badges, icons**: mayor volumen de px directos.
4. **Excluido** — `vendors/*` (DEC-009) y `buttons-docs.scss` si se considera documentación.

---

## 5. Plan de implementación y pruebas (propuesta, por aprobar)

### Implementación (incremental, un grupo por vez, igual que DEC-005)
1. Convertir px dimensionales directos → `rem()` / token equivalente, grupo por grupo (P1 → P2 → P3).
2. No tocar: bordes finos, `@media`, `letter-spacing`, `box-shadow/outline`, fallbacks de token, `vendors/*`.
3. Mantener los `em` legítimos; no crear `em` anidados.
4. Un commit lógico por grupo (sin ejecutar commits hasta autorización).

### Pruebas por grupo
- `npm run build` y diff dirigido de `css/core.css`: los valores computados deben ser **idénticos** (conversión 1:1 a 16px base).
- Verificación en navegador real (como en DEC-005) de tamaños computados en px: deben coincidir con los de antes.
- Responsive 320 / 768 / 1440 + **zoom 200%**: sin overflow ni recortes nuevos.
- Estados `:hover/:focus/:active`: sin cambios de dimensión.
- Control DEC-009: `node_modules/bootstrap` y `--bs-*` sin cambios.
- 3 temas (Light/Dark/HC) en las secciones tocadas.
- Evidencias en `evidencias/dec012/`.

### Criterios de aceptación propuestos
- [ ] px dimensionales directos convertidos a rem/token en las capas P1–P3; valores computados sin cambio.
- [ ] Excepciones (bordes, media, shadow, letter-spacing, vendors) conservadas y justificadas.
- [ ] Sin overflow/recortes nuevos en responsive y zoom 200%.
- [ ] Bootstrap y sus clases/variables intactos.
- [ ] Evidencias y documento de implementación actualizados.

---

## 6. Resumen para decisión

- La deuda real de unidades es acotada: **≈178 px directos** (no 859). El resto ya es rem, comentario, fallback o px justificado.
- La conversión es **1:1 sin impacto visual** (base 16px exacta) → riesgo global **bajo**, concentrado en responsive/estados y en no tocar `vendors/`.
- Se propone excluir `vendors/*` del alcance (DEC-009) y ejecutar por capas P1→P3 con el mismo método validado en DEC-005.

**Pendiente de aprobación:** (a) confirmar el alcance (incluir/excluir `buttons-docs.scss` y `vendors/*`), (b) aprobar la prioridad P1→P3, (c) autorizar el inicio de la implementación por grupos.
