# Contrato de plataformas separado

| Frente | Etapa inicial | Evolución potencial | Cartera de artefactos |
|---|---|---|---|
| Drupal | HTML/CSS/JS interactivo de referencia UX | Twig/componentes Drupal tras aprobación | `compensar/flujos/drupal/` |
| ZT | HTML/CSS/JS interactivo de referencia UX con shell ZT | Angular/TypeScript tras aprobación | `compensar/flujos/zt/` |
| APP | Prototipo HTML o especificación móvil según solicitud | .NET MAUI (XAML/C#) tras aprobación | `compensar/flujos/app/` |

Cada agente mantiene reglas propias y no edita carpetas del otro. En todos los casos: Figma -> DS -> prototipo -> QA -> documentación -> paquete aprobado. `shared/` solo aloja recursos reutilizables, no componentes arbitrariamente clonados. Ningún HTML se etiqueta como código productivo listo para integrar.
