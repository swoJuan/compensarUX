#!/usr/bin/env node
// Verificación estática (NO sustituye compilar con dotnet):
//  1) los XAML (páginas, controles y diccionarios) son XML bien formados (xmllint, si está disponible),
//  2) cada {StaticResource X} existe en Compensar.Colors.xaml, Compensar.Sizes.xaml o en los diccionarios de estilos del paquete,
//  3) no hay colores hexadecimales sueltos en los XAML propios (solo vía recursos del sistema de diseño),
//  4) cada imagen «xxx.png» referenciada en XAML existe como Resources/Images/xxx.svg,
//  5) los nombres de Resources/Images son válidos para MAUI (minúsculas, dígitos y guion bajo).
// Uso: node tools/verificar-claves.mjs [carpeta con Compensar.Colors.xaml y Compensar.Sizes.xaml]
//      Sin argumento usa las copias incluidas en Resources/Styles/ (DS v2.4.0).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const aqui = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ds = path.resolve(process.argv[2] || path.join(aqui, 'Resources/Styles'));
const leer = (f) => fs.readFileSync(f, 'utf8');
const quitaComentarios = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
const estilosPropios = ['CargaInfinita.Styles.xaml', 'EfectoSwap.Styles.xaml'].map((n) => path.join(aqui, 'Resources/Styles', n));
const claves = new Set();
for (const f of [path.join(ds, 'Compensar.Colors.xaml'), path.join(ds, 'Compensar.Sizes.xaml'), ...estilosPropios])
  for (const m of quitaComentarios(leer(f)).matchAll(/x:Key="([^"]+)"/g)) claves.add(m[1]);
const xamls = [];
for (const d of ['Views', 'Controls']) for (const n of fs.readdirSync(path.join(aqui, d)).sort()) if (n.endsWith('.xaml')) xamls.push(path.join(aqui, d, n));
xamls.push(...estilosPropios);
const imagenes = fs.readdirSync(path.join(aqui, 'Resources/Images')).filter((n) => !n.startsWith('.'));
let errores = 0;
for (const n of imagenes) if (!/^[a-z][a-z0-9_]*\.(svg|png|jpg|jpeg)$/.test(n)) { errores++; console.error(`Nombre de imagen no válido para MAUI: ${n}`); }
const svgs = new Set(imagenes.filter((n) => n.endsWith('.svg')).map((n) => n.replace(/\.svg$/, '')));
for (const f of xamls) {
  try { execFileSync('xmllint', ['--noout', f], { stdio: 'pipe' }); console.log('XML bien formado:', path.relative(aqui, f)); }
  catch (e) { if (e.code === 'ENOENT') console.log('(xmllint no disponible: se omite la verificación XML)'); else { errores++; console.error('XML mal formado:', f, String(e.stderr || e)); } }
  const t = quitaComentarios(leer(f));
  for (const m of t.matchAll(/\{StaticResource\s+([^}\s]+)\s*\}/g)) if (!claves.has(m[1])) { errores++; console.error(`Clave inexistente en ${path.basename(f)}: ${m[1]}`); }
  for (const m of t.matchAll(/(?:=|\s)"(#[0-9A-Fa-f]{3,8})"/g)) { errores++; console.error(`Color hexadecimal suelto en ${path.basename(f)}: ${m[1]}`); }
  for (const m of t.matchAll(/"([a-z0-9_]+)\.png"/g)) if (!svgs.has(m[1])) { errores++; console.error(`Imagen sin SVG en Resources/Images (${path.basename(f)}): ${m[1]}.png`); }
}
console.log(`Imágenes SVG: ${[...svgs].sort().join(', ')}`);
console.log(errores ? `FALLÓ: ${errores} problema(s)` : `OK: ${claves.size} claves disponibles, todas las referencias resueltas, sin hexadecimales sueltos, imágenes referenciadas presentes`);
process.exit(errores ? 1 : 0);
