import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlAMarkdown } from '../lib/html-md.mjs';

test('html-md: títulos, listas, tablas y descarte de demos', () => {
  const md = htmlAMarkdown('<h1>A</h1><p>uno <strong>x</strong></p><ul><li>a</li><li>b</li></ul><div class="x-demo">DEMO</div><button>Copiar</button><table><tr><th>H</th></tr><tr><td>v</td></tr></table>');
  assert.match(md, /^# A\n\nuno \*\*x\*\*/);
  assert.match(md, /- a\n- b/);
  assert.match(md, /\| H \|\n\| --- \|\n\| v \|/);
  assert.ok(!/DEMO|Copiar/.test(md));
});
