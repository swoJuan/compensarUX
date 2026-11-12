#!/usr/bin/env node
// DEC-006 · Sincroniza los valores de modo Dark y High Contrast de Figma con core/base/_theme.scss.
//
// Causa que corrige (DS-02): tokens/compensar.tokens.json define el valor Dark y High Contrast de cada token y el portal
// los inyecta en ejecución (js/ds-bundle.js · applyThemeTokenMode), pero _theme.scss solo traía el modo Light para la mayoría.
// Quien usa solo css/core.css veía Dark/HC con colores de Light (texto invisible, contraste 1:1).
//
// Escribe, entre marcadores, lo que falta al final de [data-theme='dark'] y [data-theme='high-contrast'].
// Nunca sobrescribe lo que _theme.scss ya declara. Es idempotente.
//
// Exclusiones (decisiones protegidas, no se tocan aquí):
//   use/border/*  → DEC-002 (bordes de Inputs)      use/focus/*   → DEC-004 (patrón de foco, sin definición de Figma)
//   use/primary/* → DEC-001 (botón primario corporativo)
//
// Uso: node scripts/sync-theme-modes.mjs [--check]   (--check no escribe; sale con 1 si hay cambios pendientes)
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const tokens = JSON.parse(fs.readFileSync(path.join(root, 'tokens/compensar.tokens.json'), 'utf8'));
const file = path.join(root, 'core/base/_theme.scss');
let scss = fs.readFileSync(file, 'utf8');
const EXCLUDED = ['use/border/', 'use/focus/', 'use/primary/'];
const MODES = [
  { mode: 'dark', selector: "[data-theme='dark']" },
  { mode: 'highContrast', selector: "[data-theme='high-contrast']" },
];
const START = '  // >>> sync-theme-modes (DEC-006) · generado desde tokens/compensar.tokens.json · no editar a mano';
const END = '  // <<< sync-theme-modes';

function blockRange(text, selector) {
  const start = text.lastIndexOf(`\n${selector} {`) + 1;               // último bloque con ese selector (no el compartido de :root)
  const open = text.indexOf('{', start);
  let depth = 1, i = open + 1;
  while (depth) { const c = text[i++]; depth += (c === '{') - (c === '}'); }
  return { start, open, close: i - 1 };
}

let total = 0;
for (const { mode, selector } of MODES) {
  let r = blockRange(scss, selector);
  let body = scss.slice(r.open + 1, r.close);
  const s = body.indexOf(START), e = body.indexOf(END);
  if (s >= 0 && e > s) {                                                   // quitar la región previa para que la corrida sea idempotente
    scss = scss.slice(0, r.open + 1) + body.slice(0, s).replace(/\s+$/, '\n') + body.slice(e + END.length).replace(/^\n/, '') + scss.slice(r.close);
    r = blockRange(scss, selector); body = scss.slice(r.open + 1, r.close);
  }
  const declared = name => new RegExp(`^\\s*${name.replace(/[-]/g, '\\-')}\\s*:`, 'm').test(body);
  const lines = [];
  for (const [name, t] of Object.entries(tokens)) {
    if (!t.css || t.type !== 'color' || !t.modes) continue;
    if (EXCLUDED.some(p => name.startsWith(p))) continue;
    if (/[()]/.test(t.css)) continue;                                      // nombre inválido generado (p. ej. --base-neutral-100-(negro))
    const v = t.modes[mode], light = t.modes.light;
    if (!v || v === light || declared(t.css)) continue;
    lines.push(`  ${t.css}: ${v};`);
  }
  total += lines.length;
  const region = lines.length ? `\n${START}\n${lines.join('\n')}\n${END}\n` : '';
  scss = scss.slice(0, r.close) + (region ? region : '') + scss.slice(r.close);
  console.log(`${mode.padEnd(13)} ${lines.length} tokens por sincronizar`);
}
const current = fs.readFileSync(file, 'utf8');
if (check) { console.log(scss === current ? 'sin cambios pendientes' : `cambios pendientes (${total} tokens)`); process.exit(scss === current ? 0 : 1); }
if (scss !== current) { fs.writeFileSync(file, scss); console.log('core/base/_theme.scss actualizado'); } else console.log('sin cambios');
