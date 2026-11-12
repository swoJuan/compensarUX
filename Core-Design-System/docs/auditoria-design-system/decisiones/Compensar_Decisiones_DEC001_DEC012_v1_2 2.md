# Documento maestro de decisiones y ajustes — Sistema de Diseño Compensar

**Versión:** 1.2  
**Fecha de apertura:** 5 de noviembre de 2026  
**Alcance:** Decisiones UX/UI aprobadas para su implementación posterior en Figma y HTML/SCSS.  
**Estado general:** En construcción; no constituye autorización para ejecutar cambios en producción.

## Registro de decisiones

| ID de decisión | Hallazgo | Componente | Decisión | Estado |
|---|---|---|---|---|
| DEC-001 | DS-01 | Botón primario corporativo | Conservar diseño; documentar advertencia de contraste | Definido para documentación; implementación pendiente |
| DEC-002 | DS-07 | Inputs — borde en estado normal | Conservar todos los estados; documentar recomendación de contraste | Definido para documentación; implementación pendiente |
| DEC-003 | DS-05, DS-15, DS-18, DS-19 (relacionados: DS-06, DS-09) | Inputs — Error, Focus y Disabled | Corregir divergencias de HTML/SCSS para respetar Figma; no cambiar el diseño oficial | **Implementada y validada en v2.2.1** (local, sin push). Ver `15-Diagnostico-DEC-003.md` §8–§9 y `00-Estado-Maestro.md`. Pendiente: formalizar en Figma las variantes provisionales (Readonly, Error+Focus, Error/Disabled en Dark/HC) |
| DEC-004 | DS-06, DS-21 | Focus transversal — componentes interactivos | Ajustar y documentar en Figma un patrón de foco coherente y visible, y alinear posteriormente HTML/SCSS; escalar cualquier cambio de identidad corporativa | Aprobado para implementación posterior en Figma y HTML; sin ejecutar |
| DEC-005 | DS-11, DS-13, DS-14 | Tipografía — tamaños, pesos y carga de Roboto | Conservar definiciones de Figma; corregir divergencias HTML/SCSS; preservar letter-spacing | Aprobado para implementación posterior en HTML/SCSS; sin ejecutar |
| DEC-006 | DS-02, DS-08, DS-20, DS-22 (relacionados) | Dark y High Contrast — legibilidad, colores y estados | Ajustar variantes en Figma y alinearlas con HTML/SCSS, respetando identidad corporativa y DEC-001 | Aprobado para implementación posterior en Figma y HTML/SCSS; sin ejecutar |
| DEC-007 | DS-03, DS-04 | Dropdown y Tabs — interacción accesible | Conservar el diseño visual oficial; corregir navegación de teclado, foco y semántica ARIA en HTML/JS y documentar comportamiento en Figma | **Implementada en código** (módulos `mp-dropdown.js` y `mp-tabs.js`, local, sin push). Ver `16-Implementacion-DEC-007.md` y `00-Estado-Maestro.md`. Pendiente: especificación de teclado en Figma, chips del multi-select (UX/UI) y foco provisional hasta DEC-004 |
| DEC-008 | DS-16, DS-17, DS-23, DS-24 (relacionados) | Tokens, radios, iconos, dimensiones y variantes | Alinear Figma y HTML/SCSS; corregir discrepancias verificadas sin rediseñar componentes oficiales y escalar contradicciones | Aprobado para implementación posterior; sin ejecutar |
| DEC-009 | DS-09, DS-12, DS-22 (DS-10 solo diagnóstico) | Estilos propios y legacy | Ajustar únicamente estilos Compensar; Bootstrap y sus clases quedan intactos; migración gradual sin cambios rompientes | Aprobado para implementación posterior; sin ejecutar |
| DEC-010 | DS-25, DS-26, DS-28, DS-38; Bottom Sheet pendiente de auditoría | Tables, Stepper, Modal, Bottom Sheet y Accordion | Mejorar accesibilidad y funcionamiento de componentes propios, documentar comportamientos en Figma y esperar evidencias pendientes | Aprobado para implementación posterior; sin ejecutar |
| DEC-011 | DS-27, DS-30, DS-31, DS-32 (relacionados: DS-35, DS-37) | Documentación, ejemplos y responsive | Corregir documentación y experiencia responsive propios; respetar Bootstrap y diseños oficiales, y escalar los cambios visuales que lo requieran | Aprobado para implementación posterior; sin ejecutar |
| DEC-012 | DEC-005, DEC-008, DEC-009 y DEC-011 (transversal) | Unidades CSS — `rem` y `em` | Utilizar unidades relativas para tipografía, espaciado y dimensiones escalables de nuestros estilos, con conversión fiel a Figma; conservar excepciones técnicas justificadas | Aprobado para implementación posterior; sin ejecutar |

---

## DEC-001 — Botón primario corporativo: conservar diseño y advertir sobre contraste

**Hallazgo relacionado:** DS-01 — Contraste de la marca naranja.  
**Componente:** Botón primario (variantes y estados que utilicen la combinación analizada).  
**Responsable de la definición visual:** Equipo UX de Compensar.  
**Tipo de decisión:** Mantener diseño aprobado y documentar riesgo de accesibilidad.  
**Estado:** Decisión registrada; pendiente de implementación documental y eventual revisión de UX de Compensar.

### Situación actual

El botón primario corporativo está aprobado por el equipo UX de Compensar y utiliza un degradado del naranja `#FF6600` a `#E63F0C` con texto blanco `#FFFFFF`. La auditoría reporta contrastes aproximados de **2,94:1** en el extremo `#FF6600` y **4,13:1** en el extremo `#E63F0C`. Ambos valores quedan por debajo de **4,5:1**, umbral WCAG 2.2 AA para texto normal (criterio 1.4.3). El degradado no elimina el incumplimiento.

### Decisión aprobada para este registro

1. **Conservar sin modificaciones** el aspecto del botón primario: colores, degradado, texto blanco, geometría y estados visuales actuales.
2. **No sustituir** el naranja corporativo, ni crear cambios automáticos en tokens de botones como respuesta a DS-01, sin aprobación expresa del equipo UX de Compensar.
3. Incorporar una **advertencia de accesibilidad** en la ficha documental del botón en Figma y en la página de documentación HTML correspondiente. La advertencia es informativa para equipos de diseño y desarrollo; **no debe insertarse como alerta visible para los usuarios finales de los productos**.
4. Mantener **DS-01 abierto como riesgo de accesibilidad pendiente de revisión por el equipo UX de Compensar**. La decisión de conservarlo no equivale a conformidad WCAG ni a una excepción automática a la norma.
5. Evaluar por separado otros usos de `#FF6600` (enlaces, tabs, paginación, etc.): esta decisión **solo autoriza conservar el botón primario aprobado**; no cierra ni autoriza conservar automáticamente todas las combinaciones asociadas a DS-01.

### Texto sugerido para la advertencia en Figma y en HTML

> **Advertencia de accesibilidad — Contraste de texto (WCAG 2.2 AA).** El botón primario mantiene el diseño corporativo aprobado por el equipo UX de Compensar. No obstante, el texto blanco sobre su degradado naranja presenta un contraste aproximado de **2,94:1 a 4,13:1**, inferior al mínimo de **4,5:1** requerido por el criterio **1.4.3 — Contraste mínimo** para texto normal. **Se recomienda revisar una alternativa accesible con el equipo UX de Compensar.** Hasta que exista una decisión aprobada, no modificar el diseño oficial del componente. Este hallazgo continúa abierto.

### Instrucciones posteriores para Claude — Figma

- Localizar la ficha/documentación oficial del botón primario en `Compensar v2 - Sistema de diseño`.
- Añadir un bloque de advertencia junto a las recomendaciones de uso y accesibilidad existentes, respetando el estilo documental de Figma.
- No editar componentes maestros, variantes, instancias, variables, gradientes ni estilos del botón.
- Vincular la advertencia a **DS-01 / DEC-001**.

### Instrucciones posteriores para Claude — HTML/SCSS

- Incorporar la misma advertencia en la documentación del botón en el portal HTML del sistema de diseño.
- No modificar SCSS, CSS ni el HTML funcional del botón en virtud de esta decisión.
- No mostrar avisos extra en los flujos de usuario final.
- Registrar el riesgo como **pendiente de definición por UX de Compensar**, no como corregido.

### Criterios de aceptación

- [ ] El botón luce y se comporta igual antes y después de la actualización documental.
- [ ] La advertencia aparece en la ficha de Figma.
- [ ] La advertencia aparece en la página HTML de documentación.
- [ ] Los valores, el criterio WCAG y la recomendación se presentan con claridad.
- [ ] DS-01 permanece abierto y trazable; no se declara conformidad WCAG.
- [ ] No se alteran otras combinaciones cromáticas ni componentes sin una decisión específica.

### Evidencia de origen

- `01-Auditoria-Integral.md`, hallazgo DS-01.
- `04-Accesibilidad-WCAG.md`, tabla de contraste de texto.
- Capturas del tablero Figma 2.1 Buttons y mediciones computadas compartidas en la auditoría.

---

## DEC-002 — Inputs: conservar bordes y estados existentes; documentar recomendación

**Hallazgo relacionado:** DS-07 — Contraste no textual de los bordes de controles.  
**Componente:** Inputs (borde del campo en estado normal).  
**Tipo de decisión:** Mantener diseño actual; registrar observación de accesibilidad sin alterar el componente.  
**Estado:** Decisión registrada; documentación pendiente de implementación futura.

### Situación actual

El input utiliza un borde de **`#E0E0E0`** sobre fondo blanco en estado normal, con contraste aproximado de **1,32:1**. En otros estados se diferencia: **Hover `#E63F0C`** y **Active `#666666`**; también cuenta con un tratamiento específico de Focus. La mejora de contraste al interactuar **no sustituye por sí sola** la evaluación de la identificabilidad del campo en estado normal.

### Decisión UX/UI

1. **Conservar sin cambios** los bordes, colores y comportamientos de los estados Normal, Hover, Active y Focus definidos actualmente en Figma y HTML/SCSS.
2. **No modificar tokens, grosor, colores ni componentes** como resultado de DEC-002.
3. Añadir en el futuro una **observación informativa en la documentación de Inputs de Figma y HTML**, dirigida a los equipos de diseño y desarrollo; no mostrarla a usuarios finales.
4. Mantener DS-07 **abierto para evaluación**: verificar si el borde de estado normal es la señal visual necesaria para identificar el campo y, en tal caso, revisar el requisito de contraste no textual de WCAG 2.2 AA (1.4.11).
5. Esta decisión se limita a los **bordes de Inputs**. No cierra otros elementos de DS-07, como switch, checkbox y stepper.

### Texto sugerido de la observación

> **Recomendación de accesibilidad — Contraste no textual (WCAG 2.2 AA).** En su estado normal, el campo de entrada utiliza un borde `#E0E0E0` sobre blanco, con contraste aproximado de **1,32:1**. Aunque los estados Hover y Active presentan una mayor diferenciación visual, se recomienda revisar si el borde normal proporciona el contraste necesario para identificar el control conforme al criterio **1.4.11 — Contraste no textual** (3:1 cuando aplica). Por ahora se mantiene el diseño oficial sin modificaciones, pendiente de valoración por el equipo UX de Compensar.

### Instrucciones posteriores para Claude

- **Figma:** incorporar la observación en la ficha documental de Inputs, sin modificar componentes maestros, variantes, estados ni variables.
- **HTML:** incorporar la misma observación en la página de documentación de Inputs, sin modificar HTML funcional, CSS ni SCSS de los campos.
- **Trazabilidad:** asociar la nota a **DS-07 / DEC-002**, sin marcar el hallazgo como corregido.

### Criterios de aceptación

- [ ] Los inputs conservan exactamente la apariencia y respuesta actuales en Normal, Hover, Active y Focus.
- [ ] La observación aparece en la documentación de Figma y HTML, no en los productos finales.
- [ ] La documentación reconoce la diferencia entre el estado normal y los estados interactivos.
- [ ] DS-07 sigue abierto para valoración, sin declarar conformidad WCAG.

---

## DEC-003 — Inputs: corregir Error, Focus y Disabled en HTML/SCSS conforme a Figma

**Hallazgos principales:** DS-05 (Error en Dark/HC), DS-15 (diferencias de estados de Inputs), DS-18/DS-19 (Disabled y sobrescrituras de temas). **Relacionados:** DS-06 (visibilidad del foco) y DS-09 (regresión de foco de Readonly pendiente de publicación).  
**Componente:** Inputs y estilos asociados en Light, Dark y High Contrast.  
**Tipo de decisión:** Alinear la implementación con las definiciones oficiales de Figma; no rediseñar componentes.  
**Estado:** Decisión registrada y aprobada para implementación futura. **No ejecutar todavía.**

### Situación diagnosticada

- **Error:** en Dark y High Contrast, las reglas de tema pueden sobrescribir las reglas de error, de modo que borde y texto de ayuda pierden su diferenciación. En Light también existen diferencias documentadas entre la apariencia del estado Error en Figma y el código.
- **Focus:** el tratamiento implementado no coincide plenamente con la referencia Figma; además hay casos en los que el indicador es insuficientemente visible. El trabajo pendiente de `readonly` presenta un riesgo de pérdida de foco visible si se publica sin revisión.
- **Disabled:** las opacidades y reglas de tema de HTML/SCSS pueden producir apariencias distintas de la referencia Figma, especialmente en Dark/HC, y dificultar la diferenciación entre campos habilitados, deshabilitados y de solo lectura.

### Decisión UX/UI

1. **Conservar los valores, variantes y estados oficialmente definidos en Figma.** No alterar los componentes maestros, estilos o tokens de Figma por esta decisión.
2. **Corregir posteriormente HTML/SCSS** para que Error, Focus y Disabled reproduzcan las definiciones oficiales de Figma, incluidas las variantes de Light, Dark y High Contrast.
3. Priorizar la corrección de **sobrescrituras por especificidad, orden de reglas, variables y opacidades** que hacen perder los estados en el HTML.
4. **No trasladar ciegamente una solución que resulte inaccesible:** si un indicador oficial de Figma sigue siendo débil o insuficiente, conservar el diseño aprobado, registrar la discrepancia/riesgo y escalarlo a UX de Compensar para decisión específica, en lugar de inventar un nuevo color o modificar Figma.
5. **No modificar aún** ningún archivo productivo, ni hacer commits ni publicar. Esta es una especificación para la futura fase de implementación.
6. **Alcance diferenciado:** DEC-002 sigue vigente para los bordes Normal/Hover/Active; DEC-003 no autoriza cambiar sus colores ni sustituir el patrón de Focus oficial. Los cambios relativos a Readonly deben atender el riesgo DS-09 sin introducir regresiones.

### Instrucciones para Claude en la fase de implementación (posterior)

**Figma:** consultar los nodos oficiales de Inputs por estado y tema y registrar sus propiedades para comparación. No modificar Figma. Si falta una definición para un tema o hay contradicciones, dejarla como pendiente de UX/UI.

**HTML/SCSS:** localizar las reglas de los estados Error, Focus y Disabled en `_inputs.scss` y sus dependencias de tema; ajustar exclusivamente su implementación para reflejar los valores aprobados de Figma. Revisar cascada, especificidad, opacidad acumulada y conflictos de Readonly. Evitar cambios sobre componentes ajenos.

**Pruebas:** comparar capturas y estilos computados con Figma para cada estado en Light/Dark/HC; probar navegación con Tab y Shift+Tab; ejecutar axe-core y verificar que la corrección no degrade los demás estados ni el CSS compilado. Documentar por separado las discrepancias inherentes al propio diseño aprobado.

### Criterios de aceptación

- [ ] Error se diferencia del estado normal en los tres temas y su mensaje continúa asociado al campo.
- [ ] Focus sigue el patrón aprobado en Figma, mantiene un indicador visible cuando el campo puede recibir foco y no desaparece por los cambios de Readonly.
- [ ] Disabled refleja los estilos oficiales y no queda anulado por reglas posteriores de tema u opacidades globales.
- [ ] Las diferencias entre Figma y HTML/SCSS quedan resueltas o explícitamente escaladas si dependen de UX de Compensar.
- [ ] DEC-002 permanece intacta: no se modifican por esta decisión los bordes Normal, Hover y Active.
- [ ] No se realizan cambios hasta que se dé la instrucción de implementar.

### Evidencia de origen

- `01-Auditoria-Integral.md`: DS-05, DS-06, DS-09, DS-15, DS-18 y DS-19.
- `03-Fidelidad-Figma-HTML.md`: §4.2 Inputs.
- `04-Accesibilidad-WCAG.md`: resultados de Error, Focus y teclado.
- Capturas `focus-dark-inp-error.png`, `focus-light-inp-field.png`, `focus-wip-light-inp-readonly.png` y `harness-3temas.png`.

---

## DEC-004 — Focus transversal: definir y alinear Figma y HTML/SCSS

**Hallazgos:** DS-06 y DS-21 (foco de bajo contraste, diferencias de indicadores y estilos entre componentes).  
**Componentes:** Botones, enlaces, dropdowns, tabs, breadcrumb, inputs y demás elementos interactivos que reciben foco por teclado.  
**Tipo de decisión:** Ajuste coordinado de la especificación en Figma y su implementación en HTML/SCSS.  
**Estado:** **Aprobado** para implementación futura en **ambos entornos**, sin ejecutar todavía.

### Situación diagnosticada

La auditoría encontró estilos de foco inconsistentes: bordes, halos, anchos y contrastes diferentes según el componente y el tema; algunas variantes pierden visibilidad en HTML. Figma no cuenta todavía con una definición transversal totalmente consistente. Reproducir sin revisión los focos débiles de Figma no basta para resolver la accesibilidad.

### Decisión UX/UI aprobada

1. **Actualizar Figma y HTML/SCSS**, no solo el HTML. Establecer en la documentación de Figma una regla de foco transversal clara, consistente y visible para navegación por teclado, respetando la identidad visual de Compensar.
2. Tomar como punto de partida los patrones aprobados y existentes; **no alterar los colores corporativos ni el diseño base de los botones** establecidos en DEC-001. El foco puede ajustarse como estado de interacción, pero cualquier alteración del gradiente, texto o apariencia base corporativa requiere aprobación específica.
3. Resolver diferencias injustificadas de ancho, separación y contraste del indicador de foco entre componentes. Cuando sea técnicamente posible, usar tokens semánticos de foco compartidos y documentar las excepciones necesarias para superficies claras, oscuras y High Contrast.
4. Revisar el contraste y perceptibilidad del foco en Light, Dark y High Contrast, incluida navegación con teclado y `forced-colors`. Tomar **WCAG 2.2 AA** como objetivo; verificar los criterios aplicables en lugar de asumir que un color o un grosor aislados garantizan conformidad.
5. Si un ajuste de foco exige modificar una decisión visual corporativa fuera del estado Focus, **registrar la propuesta para revisión del equipo UX de Compensar** antes de cambiarla. No declarar cerrado un hallazgo sin evidencia de contraste y pruebas.
6. **La aprobación aquí es de la definición y del alcance de los ajustes**, no una orden de aplicarlos hoy. Implementar en una etapa posterior, después de revisar el resultado de la auditoría complementaria y entregar instrucciones a Claude.

### Instrucciones para Claude — implementación posterior en Figma

- Identificar los componentes interactivos y todos sus estados de foco en la biblioteca y documentación.
- Crear o actualizar la **definición documentada del patrón Focus** (tokens, geometría, separación/offset, comportamiento según tema y uso por componente) con propuestas accesibles verificables.
- Ajustar en Figma los **estados Focus** de los componentes que contradigan el patrón aprobado, sin modificar sus estilos base, gradientes o estados no relacionados; preservar variantes y prototipos.
- Señalar en la documentación aquellas variantes que requieran aprobación adicional antes de cambiarse.
- Vincular las actualizaciones a **DS-06 / DS-21 / DEC-004**.

### Instrucciones para Claude — implementación posterior en HTML/SCSS

- Alinear las reglas de `:focus-visible` y otros estados pertinentes con los valores finalmente documentados en Figma.
- Centralizar tokens o mixins de foco cuando sea viable y evitar sobrescrituras heredadas que oculten el indicador.
- Comprobar teclado, Light/Dark/HC, `forced-colors` y CSS compilado. No eliminar el foco visible para usuarios de teclado.
- Evitar modificar los estilos normales, Hover, Active o Disabled fuera de los ajustes ya autorizados por otras decisiones. **DEC-003** sigue gobernando los ajustes específicos de Inputs Error/Focus/Disabled y debe coordinarse con el patrón transversal.

### Criterios de aceptación

- [ ] Existe una regla de Focus transversal, documentada y aplicable en Figma.
- [ ] Los componentes de Figma tienen estados Focus alineados, salvo excepciones justificadas y registradas.
- [ ] HTML/SCSS reproduce esos estados en los tres temas sin perder foco de teclado.
- [ ] Se validan contraste, navegación y colores forzados con evidencia reproducible.
- [ ] No se alteran el degradado, color de texto ni geometría base del botón corporativo de DEC-001.
- [ ] DS-06 y DS-21 solo se cierran si las pruebas acreditan que los problemas se resolvieron.
- [ ] No se ejecutan modificaciones antes de comenzar formalmente la fase de implementación.

---

## DEC-005 — Tipografía: alinear HTML/SCSS con las definiciones oficiales de Figma

**Hallazgos:** DS-11 (tamaños y aliases tipográficos), DS-13 y DS-14 (pesos y estilos tipográficos inconsistentes).  
**Componentes:** Alert, Toast, Tabs, Pagination, encabezados H4–H6, Display, Eyebrow y etiquetas con diferencias confirmadas.  
**Tipo de decisión:** Corrección de fidelidad entre Figma y código, sin rediseñar la especificación tipográfica.  
**Estado:** **Aprobado** para implementación posterior en HTML/SCSS. **No ejecutar todavía.**

### Situación diagnosticada

La auditoría reporta diferencias de tamaño, como textos descriptivos de Alert y Toast a **16 px en Figma frente a 12 px en HTML**, y textos de Tabs y Pagination a **16 px en Figma frente a 14 px en HTML**. También se identificaron discrepancias en los pesos de H4–H6, Display, Eyebrow y ciertas etiquetas, así como usos de pesos de Roboto no cargados correctamente. Las correspondencias de `letter-spacing` en Figma (porcentajes) y CSS (`em`) fueron verificadas como equivalentes y **no deben modificarse**.

### Decisión UX/UI aprobada

1. **Conservar la tipografía oficial de Figma** como fuente de verdad para tamaños, pesos, alturas de línea, familia y jerarquía.
2. **Corregir posteriormente HTML/SCSS** donde los estilos implementados se aparten de los valores confirmados de Figma, incluidos Alert, Toast, Tabs, Pagination y los estilos de encabezados y etiquetas documentados por la auditoría.
3. **Verificar y corregir la carga de Roboto** para que los pesos usados estén efectivamente disponibles y se eviten pesos sintetizados por el navegador; no reemplazar la familia tipográfica aprobada.
4. **No modificar `letter-spacing`**: los valores ya comprobados son equivalentes. No cambiar tokens o componentes que ya coincidan.
5. **No modificar Figma** por esta decisión. Si se detectan contradicciones internas en Figma, registrarlas para una decisión UX/UI separada, sin resolverlas unilateralmente.
6. Validar fidelidad, legibilidad y ausencia de regresiones en **Light, Dark y High Contrast**, incluyendo **zoom del 200 %**.
7. **No implementar todavía** ni editar archivos productivos, hacer commits o publicar. La autorización presente es para registrar la especificación, no ejecutarla.

### Instrucciones para Claude — fase de implementación posterior

**Figma:** consultar variables, estilos y componentes oficiales para extraer exactamente las propiedades tipográficas; no editar Figma. Documentar ambigüedades o discrepancias entre variantes.

**HTML/SCSS:** revisar los tokens y aliases, los estilos de Alert, Toast, Tabs y Pagination, los encabezados H4–H6, Display, Eyebrow y etiquetas. Ajustar solo las diferencias confirmadas, respetando los puntos de ruptura y la semántica. Revisar declaraciones `font-weight`, archivos/font-face disponibles y fallback para Roboto. No modificar el espaciado entre letras ya validado.

**Pruebas:** comparar propiedades computadas y capturas con Figma en los tres temas y a zoom 200 %, confirmar la carga de fuentes y verificar que no se desborden los componentes ni se rompan los diseños responsivos.

### Criterios de aceptación

- [ ] Los tamaños, pesos y jerarquías de los componentes auditados coinciden con la especificación oficial de Figma.
- [ ] La familia Roboto y los pesos requeridos se cargan correctamente, sin síntesis involuntaria.
- [ ] `letter-spacing` permanece sin cambios.
- [ ] No se editan definiciones de Figma como parte de DEC-005.
- [ ] Existen evidencias de validación Light, Dark, High Contrast y zoom 200 %.
- [ ] El trabajo permanece pendiente de implementación hasta una instrucción expresa.

### Evidencia de origen

- `01-Auditoria-Integral.md`: hallazgos DS-11, DS-13 y DS-14.
- `03-Fidelidad-Figma-HTML.md`: comparaciones tipográficas.
- Auditoría anterior: comprobación de equivalencia de `letter-spacing` entre Figma y CSS.

---

## DEC-006 — Corregir colores, legibilidad y estados en Dark y High Contrast

**Hallazgos:** DS-02 (contraste insuficiente en componentes Dark), DS-08 (switch en colores forzados), DS-20 (inconsistencias High Contrast), DS-22 (colores hardcoded y sobreescrituras); incluir hallazgos relacionados únicamente cuando las pruebas acrediten la relación.  
**Componentes de partida:** Badges, Chips, Tags, Alerts y otros componentes afectados, incluido Switch cuando corresponda.  
**Tipo de decisión:** Corrección de accesibilidad y consistencia entre Figma y HTML/SCSS.  
**Estado:** **Aprobado para implementación posterior en Figma y HTML/SCSS. No implementar todavía.**

### Situación diagnosticada

La auditoría reporta combinaciones de texto y fondo prácticamente iguales en ciertas variantes Dark de Badges, Chips y Tags (algunos contrastes cercanos a **1:1**), además de errores de tema que afectan Alerts y otros estados. En High Contrast y `forced-colors`, determinados controles pierden diferenciación visual; existen colores fijos en componentes que impiden la adaptación adecuada a cada tema. Es necesario comprobar caso por caso si la causa está en la definición de Figma, en la implementación o en ambas.

### Decisión UX/UI aprobada

1. **Autorizar ajustes en Figma** para resolver las combinaciones ilegibles o de contraste insuficiente en **Dark y High Contrast**, incluidos estados y variantes afectados, sin rediseñar innecesariamente los componentes.
2. **Implementar posteriormente en HTML/SCSS** las variantes aprobadas en Figma; corregir tokens, mappings y sobreescrituras que causen colores erróneos en cada tema.
3. Validar **Light, Dark, High Contrast y `forced-colors`**, incluyendo texto, iconografía, límites de control, estados interactivos y mensajes de error según el criterio WCAG aplicable.
4. **Respetar la identidad corporativa** de Compensar y las decisiones anteriores. **DEC-001 prevalece:** no cambiar el degradado, texto ni diseño base del botón primario corporativo; sus problemas de contraste continúan documentados y escalados.
5. Priorizar el uso de **tokens semánticos por tema** y evitar hexadecimales fijos cuando impidan adaptar los componentes; no hacer refactorizaciones globales ajenas al alcance.
6. Documentar excepciones que dependan de una definición externa del equipo UX de Compensar; no presentarlas como corregidas hasta contar con autorización o evidencia.
7. **No modificar todavía Figma ni código**, hacer commits, reconstruir entregables ni publicar. Esta decisión aprueba el alcance del ajuste posterior, no su ejecución inmediata.

### Instrucciones para Claude — fase de implementación posterior

**Figma:** inventariar variantes y estados Dark/High Contrast afectados; proponer y establecer colores y tokens semánticos con contraste medido; conservar geometría, jerarquía y componentes oficiales; vincular las actualizaciones a **DEC-006** y a sus hallazgos.

**HTML/SCSS:** seguir las definiciones finalmente aprobadas en Figma, corregir los estilos específicos de tema, eliminar las sobreescrituras defectuosas y verificar que los componentes reutilizables no dependan de colores hardcoded que rompan Dark/HC. Considerar colores de sistema en `forced-colors` cuando correspondan.

**Pruebas:** comprobar componentes y estados antes/después; medir contraste conforme a WCAG 2.2 AA donde corresponda; realizar pruebas de teclado y `forced-colors`, capturas Light/Dark/HC y registrar excepciones aún pendientes.

### Criterios de aceptación

- [ ] Las variantes de Figma en Dark y High Contrast tienen combinaciones legibles y contrastes validados según su función.
- [ ] HTML/SCSS reproduce con fidelidad las variantes y estados aprobados en Figma.
- [ ] Badges, Chips, Tags, Alerts y controles afectados se distinguen correctamente en cada tema.
- [ ] Switch y otros controles auditados conservan identificación y estado visible en `forced-colors`.
- [ ] No se modifica el botón primario protegido por DEC-001.
- [ ] Los hallazgos solo se cierran con evidencia de pruebas; los pendientes externos permanecen abiertos.
- [ ] No se ejecuta ningún cambio antes de una instrucción expresa para iniciar implementación.

### Evidencia de origen

- `01-Auditoria-Integral.md` y `04-Accesibilidad-WCAG.md`: DS-02, DS-08, DS-20 y DS-22.
- `evidencias/`: capturas de variantes Dark, harness de tres temas y comprobaciones de High Contrast / `forced-colors`.

---

## DEC-007 — Dropdown y Tabs: navegación por teclado y semántica accesible

**Hallazgos:** DS-03 (Dropdown/Select), DS-04 (Tabs).  
**Componentes:** Dropdown Web, Dropdown App, Select personalizado y Tabs, según su implementación concreta.  
**Tipo de decisión:** Corrección funcional y documental de accesibilidad, conservando la apariencia oficial.  
**Estado:** **Aprobado para implementación posterior en Figma (documentación) y HTML/JavaScript. No implementar todavía.**

### Situación diagnosticada

La auditoría detectó ejemplos de Dropdown que dependen de clics y no gestionan adecuadamente el teclado y ciertos atributos ARIA. En Tabs se reportó que algunos controles tienen `tabindex="-1"` y no incorporan navegación mediante flechas, por lo que no pueden alcanzarse mediante teclado. Antes de modificar código, determinar en cada caso si el problema se encuentra en el portal documental, el componente reutilizable o ambos.

### Decisión UX/UI aprobada

1. **Conservar la apariencia oficial de Figma** para Dropdown y Tabs (color, dimensiones, tipografía, espaciados y estados), salvo ajustes de foco ya autorizados en DEC-004.
2. **Corregir HTML/JavaScript** para soportar una interacción completa con teclado, administración coherente del foco y semántica de accesibilidad apropiada al patrón de cada control.
3. **Dropdown/Select:** distinguir entre un selector nativo, un botón que despliega un menú y un combobox/listbox; aplicar el patrón WAI-ARIA correspondiente, sin imponer roles incorrectos. Mantener `aria-expanded`, relaciones y selección sincronizadas con el estado real; implementar apertura, navegación, selección y cierre por teclado según el patrón elegido.
4. **Tabs:** usar la estructura semántica `tablist`/`tab`/`tabpanel`, administrar `aria-selected`, `aria-controls`, `id` y `tabindex`, y habilitar navegación con flechas; establecer explícitamente si la activación será automática o manual según el comportamiento previsto del componente.
5. **Actualizar la documentación de Figma** con una especificación breve de interacciones de teclado, estados de foco, roles y ejemplos de comportamiento accesible. No rediseñar los componentes maestros por esta decisión.
6. **Diferenciar código demostrativo del portal y código reutilizable** antes de atribuir o corregir cada defecto. Ajustar ambas ubicaciones solo cuando corresponda.
7. **No implementar todavía ni publicar**: la aprobación se incorpora al documento maestro para su posterior aplicación coordinada.

### Instrucciones para Claude — fase posterior

**Figma:** documentar en las fichas de Dropdown y Tabs las reglas de interacción accesible, teclado, activación, cierre y foco; reflejar las dependencias con DEC-004 sin modificar innecesariamente el diseño visual.

**HTML/JavaScript:** localizar las implementaciones concretas en el repositorio, corregir eventos, atributos y manejo del foco según el patrón apropiado; reutilizar soluciones donde sea posible sin introducir cambios funcionales a productos ajenos al alcance.

**Pruebas:** comprobar Tab y Shift+Tab, flechas, Enter, Espacio y Escape donde corresponda; verificar atributos ARIA en los estados abierto/cerrado/seleccionado, foco visible, lectores de pantalla cuando sea viable y temas Light/Dark/High Contrast.

### Criterios de aceptación

- [ ] Dropdown y Tabs se operan completamente mediante teclado siguiendo el patrón accesible definido para cada uno.
- [ ] Los estados de foco y atributos ARIA son correctos y reflejan el estado de la interfaz.
- [ ] La apariencia visual aprobada en Figma se conserva, salvo cambios permitidos por DEC-004.
- [ ] Figma incluye especificaciones de interacción para diseño y desarrollo.
- [ ] Se verifican por separado el código documental y el componente reutilizable.
- [ ] Se adjuntan evidencias funcionales y de accesibilidad antes de cerrar DS-03 y DS-04.
- [ ] No se ejecutan cambios hasta recibir la instrucción de implementación.

### Evidencia de origen

- `01-Auditoria-Integral.md` y `04-Accesibilidad-WCAG.md`: DS-03 y DS-04.
- `evidencias/`: scripts y pruebas de navegación/atributos existentes.

---

## DEC-008 — Consistencia de tokens, radios, iconos y dimensiones de componentes

**Hallazgos principales:** DS-16 (variantes de botones y dimensiones), DS-17 (etiquetas de checkbox y radios de paginación), DS-23 (referencias incorrectas de tokens), DS-24 (radio de 12 px fuera de la escala registrada). Incluir otros hallazgos únicamente si la auditoría evidencia una relación concreta.  
**Componentes:** botones y sus variantes, checkbox, pagination y otros elementos con diferencias verificadas entre Figma y HTML/SCSS.  
**Tipo de decisión:** alineación de especificaciones y código sin rediseñar la identidad oficial de Compensar.  
**Estado:** **Aprobado para implementación posterior en Figma y HTML/SCSS; no ejecutar todavía.**

### Situación diagnosticada

La auditoría identificó radios empleados por componentes que no figuran en la escala actual de tokens (por ejemplo 12 px), diferencias entre radios de Pagination (12 px en Figma y 8 px en HTML), etiquetas de Checkbox (16 px en Figma frente a 14 px en HTML), tamaños de iconos de botones que dependen de variantes o instancias (16, 20 y 24 px) y dimensiones de botones con definiciones que requieren comprobación (32, 44 y 48 px). También se detectaron referencias erróneas o inexistentes en el mapeo de tokens. **La sola diferencia de un valor no demuestra un defecto**: debe comprobarse a qué variante, estado, plataforma y componente pertenece.

### Decisión UX/UI aprobada

1. **Conservar los diseños oficiales de Figma** como referencia para cada componente y variante. No imponer una medida o un estilo global que modifique otras variantes válidas.
2. **Corregir posteriormente HTML/SCSS** solo donde una comparación verificable muestre divergencia frente al componente o variante oficial de Figma.
3. **Ajustar en Figma únicamente errores de referencias, organización o documentación de variables/tokens** que estén demostrados, sin cambiar la apariencia de los componentes maestros o instancias aprobadas. No rediseñar componentes como resultado de esta decisión.
4. **Radio de 12 px:** comprobar los usos aprobados y, si se confirma que es parte del diseño oficial, formalizar `radius/12` en el sistema de tokens y alinearlo en Figma/código; no sustituirlo indiscriminadamente por radios ya existentes.
5. **Iconos y dimensiones:** contrastar cada botón con su variante, plataforma y estado antes de corregir valores de 16/20/24 px o alturas 32/44/48 px. Registrar contradicciones en Figma como pendientes de decisión UX/UI, **sin resolverlas unilateralmente**.
6. **Checkbox, Pagination y demás componentes:** ajustar valores del HTML cuando la definición de Figma sea inequívoca; registrar evidencia antes/después y evitar regresiones responsivas y de accesibilidad.
7. **Tokens de color:** corregir referencias inválidas o que apunten a valores incorrectos cuando la intención semántica esté documentada. Si una corrección cambia visualmente un diseño corporativo aprobado, escalarla para autorización antes de aplicarla.
8. **Respetar DEC-001 a DEC-007.** Especialmente, no alterar el degradado, texto ni estilo base del botón primario corporativo protegido por DEC-001. Los estados Focus quedan coordinados por DEC-004.
9. **No implementar todavía** en Figma, HTML ni SCSS, no compilar, hacer commits ni publicar. Esta decisión registra criterios para una fase posterior.

### Instrucciones para Claude — implementación posterior

**Figma:** identificar componentes maestros, propiedades y variantes oficiales; contrastar instancias con sus componentes, inventariar dimensiones, tamaños de iconos, radios y variables utilizadas. Corregir únicamente referencias documentales o de tokens verificadamente equivocadas y aprobadas bajo esta decisión. Documentar contradicciones que requieran autorización de UX de Compensar antes de modificar diseños.

**HTML/SCSS:** contrastar cada regla con la variante Figma correspondiente; corregir diferencias verificadas de radios, tamaños de iconos, alturas, etiquetas y referencias de tokens sin hacer cambios globales que afecten otras variantes. Registrar dependencias con las decisiones anteriores.

**Pruebas:** comparar evidencias visuales Figma/HTML por variante y estado en Light, Dark y High Contrast, comprobar responsive, zoom 200 % y ausencia de regresiones de foco, contraste o comportamiento. Mantener registro de cambios por componente.

### Criterios de aceptación

- [ ] Cada cambio tiene una referencia inequívoca al componente/variante oficial de Figma.
- [ ] Las diferencias comprobadas de radios, iconos, dimensiones y etiquetas están corregidas en HTML/SCSS o escaladas si requieren definición UX/UI.
- [ ] Las referencias de tokens erróneas están identificadas y se corrigen sin cambios visuales no autorizados.
- [ ] El radio de 12 px se formaliza solo si su uso aprobado queda verificado.
- [ ] No se modifican las variantes oficiales contradictorias sin una decisión adicional.
- [ ] Se conserva el botón primario de DEC-001 y se respetan DEC-002 a DEC-007.
- [ ] La documentación y las evidencias permiten rastrear cada ajuste.
- [ ] Ningún cambio se ejecuta hasta la instrucción expresa de implementación.

### Evidencia de origen

- `01-Auditoria-Integral.md`: DS-16, DS-17, DS-23 y DS-24.
- `03-Fidelidad-Figma-HTML.md`: comparaciones de dimensiones, radios y componentes.
- Tableros oficiales de botones y formularios en Figma y capturas de `evidencias/`.

---

## DEC-009 — Mantenimiento de estilos propios sin modificar Bootstrap

**Hallazgos relacionados:** DS-09 (desfase entre SCSS fuente y CSS compilado), DS-12 (coexistencia de estilos heredados y nuevos), DS-22 (valores fijos en estilos de componentes). DS-10 se considera solo para diagnosticar posibles conflictos: **no autoriza cambios en Bootstrap**.  
**Alcance:** exclusivamente código y clases de estilos propios del sistema de diseño Compensar.  
**Estado:** **Aprobado con restricción de alcance; implementación pendiente.**

### Decisión UX/UI aprobada

1. **Bootstrap es una dependencia protegida.** No modificar archivos fuente, variables, configuración, compilación, utilidades, componentes ni clases de Bootstrap. Tampoco redefinir, sustituir, eliminar ni alterar el comportamiento de sus selectores (`.btn`, `.form-control`, `.row`, etc.) mediante reglas globales propias.
2. **Intervenir solo estilos propios** del sistema de diseño: componentes bajo el espacio de nombres propio (por ejemplo `.mp-*`), tokens semánticos propios y archivos SCSS/CSS propios, siempre que el cambio no afecte a los componentes estándar de Bootstrap.
3. **Estilos heredados:** inventariar cuáles son realmente propios y cuáles pueden coincidir con selectores de Bootstrap. Si una clase es ambigua o compartida, no modificarla ni deprecarla de forma que cambie Bootstrap; documentar y proponer una migración optativa hacia clases propias con nombres diferenciados.
4. **Compatibilidad:** no eliminar clases existentes ni introducir cambios rompientes a páginas consumidoras. La migración de estilos propios heredados será gradual y requerirá validación de usos y regresiones.
5. **Compilación:** verificar que el CSS generado refleja los cambios autorizados del SCSS propio. No cambiar el proceso ni la configuración de compilación de Bootstrap. No publicar CSS desactualizado.
6. **Figma:** documentar, cuando corresponda, la relación entre componentes oficiales y sus selectores propios; no modificar diseños visuales por ajustes de arquitectura.
7. **No implementar todavía.** Esta decisión no autoriza cambios de código, compilación, publicación o despliegue en esta etapa.

### Instrucciones para Claude — implementación posterior

- Antes de modificar estilos, **separar selectores propios y selectores de Bootstrap** mediante inspección de origen y usos reales.
- Limitar cada ajuste a archivos y selectores del Design System Compensar; evitar estilos globales que se propaguen a Bootstrap.
- No tocar paquetes, variables, clases, configuración ni archivos de Bootstrap.
- Proponer la migración de estilos legacy propios únicamente si es compatible y está respaldada por evidencia; no eliminar clases ni renombrar selectores sin aprobación específica.
- Ejecutar pruebas de regresión que demuestren que componentes nativos de Bootstrap no cambiaron visual ni funcionalmente.

### Criterios de aceptación

- [ ] No se modifica ningún archivo, variable, configuración o clase de Bootstrap.
- [ ] No hay nuevas sobrescrituras globales de selectores Bootstrap.
- [ ] Los ajustes afectan únicamente al sistema de estilos propios de Compensar.
- [ ] Se conservan los consumidores actuales y la compatibilidad de clases legacy.
- [ ] Se documentan conflictos existentes sin resolverlos alterando Bootstrap.
- [ ] El CSS propio compilado refleja el SCSS autorizado y se comprueba sin regresiones.
- [ ] No se implementa nada antes de la instrucción expresa.

---

## DEC-010 — Accesibilidad y comportamiento de componentes estructurales

**Hallazgos relacionados:** DS-25 (tablas), DS-26 (stepper), DS-28 (modal), DS-38 (accordion). Bottom Sheet: validación funcional y accesibilidad pendientes de la auditoría complementaria.  
**Estado:** **Aprobado por UX/UI; implementación pendiente.**  
**Alcance:** Figma como documentación y especificación de interacciones; HTML, JavaScript y SCSS **exclusivamente de los componentes propios de Compensar**.

### Decisión aprobada

1. **Conservar la apariencia oficial** de los componentes en Figma. Completar la documentación de estados, interacción y accesibilidad. Cualquier cambio visual necesario que contradiga diseños aprobados se eleva a una decisión UX/UI específica antes de implementarse.
2. **Tables:** revisar las regiones de desplazamiento horizontal y añadir accesibilidad por teclado y semántica adecuadas en la implementación propia, cuando corresponda. Mantener la apariencia.
3. **Stepper:** diferenciar adecuadamente los estados actual/completado/pending en la semántica y, si se requiere un cambio visual no contemplado en Figma, documentarlo para aprobación. Dar un nombre accesible a indicadores de progreso cuando aplique.
4. **Modal:** documentar y estandarizar el patrón de gestión del foco, navegación por teclado, Escape y retorno del foco al origen en los módulos propios. **No afirmar que la documentación actual carece de focus trap:** la auditoría indicó que el ejemplo documental sí lo implementa, pero la lógica no se ofrece como solución reutilizable.
5. **Bottom Sheet:** no inventar defectos ni implementar correcciones sin el diagnóstico complementario. Incorporar únicamente hallazgos confirmados, con sus evidencias y severidad.
6. **Accordion:** revisar el límite fijo de altura que puede recortar contenidos y corregir la expansión mediante comportamiento dinámico en código propio, sin alterar el diseño visual.
7. **Bootstrap queda completamente fuera de alcance:** no modificar sus archivos, variables, configuración, clases, reglas ni comportamiento nativo; tampoco sobrescribir sus selectores globales.
8. **No implementar todavía:** esta aprobación autoriza el alcance de trabajo futuro y su documentación, no cambios inmediatos en Figma, repositorio ni producción.

### Instrucciones para implementación posterior

- Confirmar antes de cada cambio si el componente es propio del sistema Compensar o proviene de Bootstrap.
- Vincular cada corrección con su hallazgo y evidencia. Registrar la diferencia entre ejemplo documental y componente reutilizable.
- Documentar en Figma los estados e interacciones verificables; mantener el diseño oficial y solicitar aprobación para cualquier modificación visual nueva.
- Corregir solo HTML/JS/SCSS propios, con especial atención a teclado, semántica, foco y responsive.
- Realizar pruebas manuales y automatizadas disponibles en Light, Dark, High Contrast, móvil y zoom al 200 %, sin declarar aprobadas pruebas no ejecutadas.

### Criterios de aceptación

- [ ] Figma documenta las interacciones y estados relevantes de estos componentes.
- [ ] Tables permite interacción accesible en los casos que requieran scroll.
- [ ] Stepper comunica su progreso y estado mediante semántica accesible.
- [ ] El Modal propio gestiona foco, Escape y retorno de foco de manera consistente.
- [ ] Bottom Sheet tiene hallazgos confirmados antes de cualquier modificación.
- [ ] Accordion permite visualizar su contenido completo al expandir.
- [ ] Ningún cambio afecta los componentes o selectores de Bootstrap.
- [ ] No se han realizado implementaciones antes de la instrucción expresa.

---

## DEC-011 — Documentación, ejemplos y experiencia responsive

**Hallazgos relacionados:** DS-27 (ejemplos y etiquetas accesibles), DS-30 (documentación a 320 px), DS-31 (componentes/documentación pendientes de comprobar), DS-32 (identificación de enlaces); relacionados DS-35 (semántica de listas en Safari) y DS-37 (navegación móvil del Header).  
**Estado:** **Aprobado por UX/UI; implementación pendiente.**  
**Alcance:** documentación oficial en Figma y sitio HTML de documentación, así como estilos y scripts **propios de Compensar** cuando correspondan.

### Decisión aprobada

1. **Documentación en Figma:** completar o corregir ejemplos, estados, indicaciones de interacción, comportamiento responsive y notas de accesibilidad respaldadas por la auditoría. Mantener los diseños visuales oficiales; cualquier rediseño no aprobado debe quedar como propuesta pendiente.
2. **Ejemplos HTML:** añadir cuando corresponda etiquetas asociadas a formularios, campos requeridos, textos de ayuda vinculados con `aria-describedby`, nombres accesibles y semántica apropiada. No presentar como funcional un ejemplo meramente visual.
3. **Responsive del portal documental:** corregir en nuestros estilos la superposición de sidebar y controles a 320 px, el desplazamiento indebido y otros problemas reproducibles de navegación; verificar a 320 px y zoom 200 %. No modificar componentes Bootstrap ni sus reglas.
4. **Enlaces y navegación:** evitar que un enlace se identifique únicamente por color cuando aplique WCAG 1.4.1; emplear señales visuales accesibles respetando las definiciones oficiales o elevar la diferencia para aprobación de UX/UI.
5. **Header móvil y componentes sin documentación completa:** confirmar primero el comportamiento previsto en Figma y los resultados de la auditoría complementaria. No asumir que la ocultación de búsqueda/CTA sea un defecto ni inventar patrones de navegación.
6. **Compatibilidad:** conservar URLs, anclas, estructura documental y ejemplos existentes salvo que se compruebe un defecto; evitar cambios que rompan consumidores.
7. **Bootstrap fuera de alcance:** no modificar clases, archivos, variables, configuración ni comportamientos nativos o añadir sobrescrituras globales que los alteren.
8. **Sin implementación inmediata:** esta decisión solo incorpora el ajuste al backlog aprobado para ejecutar posteriormente en Figma y HTML/SCSS/JS, previa planificación por componente.

### Instrucciones para Claude — implementación posterior

- Referenciar los hallazgos y las evidencias de la auditoría, distinguiendo defectos confirmados de asuntos pendientes de comprobación.
- Implementar ajustes documentales y de responsive solo en componentes, scripts y selectores propios de Compensar.
- Mantener Figma como fuente oficial; si la recomendación implica cambiar un diseño aprobado, presentar la discrepancia antes de modificarlo.
- Validar teclado, atributos semánticos, Light/Dark/High Contrast, 320 px y 200 % de zoom; no marcar como aprobadas pruebas que no se ejecutaron.
- Entregar un registro de archivos afectados y capturas o resultados comparativos antes/después.

### Criterios de aceptación

- [ ] Los ejemplos de formularios documentan y utilizan asociaciones accesibles correctas cuando corresponde.
- [ ] El sitio documental no presenta controles o navegación superpuestos a 320 px ni al 200 % de zoom en casos verificados.
- [ ] Los enlaces se identifican con señales adicionales al color cuando lo exige el criterio aplicable.
- [ ] Los comportamientos de Header y otros componentes pendientes se respaldan por Figma o una decisión UX/UI, no por suposiciones.
- [ ] No se altera ningún elemento de Bootstrap ni un diseño oficial sin autorización expresa.
- [ ] No se implementa nada antes de la instrucción expresa.

---

## DEC-012 — Unidades relativas `rem` y `em` con fidelidad a Figma

**Relación:** Decisión transversal a DEC-005 (tipografía), DEC-008 (tokens y dimensiones), DEC-009 (estilos propios) y DEC-011 (responsive).  
**Estado:** **Aprobado por UX/UI; implementación pendiente.**  
**Alcance:** Exclusivamente estilos, tokens y componentes propios del Sistema de Diseño Compensar. **Bootstrap permanece intacto.**

### Decisión aprobada

1. **Priorizar `rem` y `em`** en las reglas CSS/SCSS propias para tamaños de fuente, alturas y anchos escalables, espaciados, padding, gap, márgenes y radios cuando sea apropiado. El objetivo es un sistema adaptable al tamaño de texto del navegador y al zoom, sin perder fidelidad visual.
2. **Respetar rigurosamente los valores de Figma**: convertir las medidas de referencia a unidades relativas manteniendo su tamaño computado al tamaño raíz de referencia. Por ejemplo, **16 px = 1rem, 24 px = 1.5rem y 8 px = 0.5rem**, *solo cuando la raíz equivale a 16 px*. Verificar el tamaño raíz real del proyecto antes de convertir.
3. **Elegir conscientemente entre `rem` y `em`**: preferir `rem` para escalas globales y tokens; usar `em` cuando un valor deba variar con la fuente del propio componente, por ejemplo determinados espaciados de iconos o controles. Evitar anidamientos de `em` que multipliquen tamaños de manera involuntaria.
4. **No forzar todas las propiedades a unidades relativas**. Conservar `px` u otras unidades cuando sean técnicamente adecuadas y justificadas, por ejemplo bordes finos de 1 px, detalles de precisión, media queries y recursos gráficos. Evitar convertir sin criterio valores que deban conservar precisión física o comportamientos especiales.
5. **No fijar la raíz tipográfica** con trucos como `html { font-size: 62.5%; }` ni establecer tamaños globales que cambien Bootstrap o impidan las preferencias de accesibilidad de los usuarios.
6. **Mantener el `letter-spacing` oficial** conforme a DEC-005; no modificarlo como consecuencia de la conversión de unidades. Conservar asimismo gradientes, colores y geometrías aprobadas, y todas las restricciones DEC-001 a DEC-011.
7. **Validar los valores computados y el comportamiento** con comparaciones Figma vs. HTML a escala normal, zoom del 200 %, ajustes de tamaño de fuente del navegador, viewport de 320 px y los temas Light, Dark y High Contrast. No aceptar desbordamientos, recortes ni variaciones injustificadas.
8. **Sin implementación inmediata.** Esta decisión debe incorporarse a la especificación que se entregará a Claude para ejecutar los ajustes posteriormente, sin tocar Figma ni HTML/SCSS por ahora.

### Instrucciones para Claude — implementación posterior

- Auditar primero cómo se define la raíz tipográfica y cómo se consumen los tokens de medidas. No asumir que 1rem siempre equivale a 16 px.
- Actualizar **únicamente tokens y reglas de Compensar**. No modificar archivos, clases, variables ni estilos Bootstrap, tampoco mediante selectores globales que los sobrescriban.
- Documentar las conversiones cuando sean relevantes y comparar las medidas resultantes con los valores oficiales de Figma por componente/variante/estado.
- Preferir tokens semánticos reutilizables en lugar de introducir numerosas conversiones literales diferentes.
- Conservar excepciones justificadas en `px`, `%`, `vw`, `vh` u otras unidades cuando aporten un mejor comportamiento y sean necesarias para reproducir el diseño.

### Criterios de aceptación

- [ ] Las dimensiones y la tipografía computadas corresponden a las definiciones oficiales de Figma en su escala de referencia.
- [ ] El uso de `rem`/`em` permite adaptación al tamaño de texto del usuario sin romper los componentes.
- [ ] No se introducen multiplicaciones accidentales de `em`, saltos de layout ni desbordamientos.
- [ ] No se modifica la configuración o ninguna clase de Bootstrap.
- [ ] No se altera `letter-spacing` ni los diseños protegidos por las decisiones previas.
- [ ] Las excepciones al uso de unidades relativas quedan justificadas.
- [ ] No se implementa nada hasta autorización expresa.

---

## Próximas acciones

Consolidar DEC-001 a DEC-012 y contrastarlas con el cierre de la auditoría complementaria de Claude. Luego preparar instrucciones de implementación por etapas y mantener aparte las recomendaciones que requieren aprobación del equipo UX de Compensar.
