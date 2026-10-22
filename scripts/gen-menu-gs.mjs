/**
 * Copies the dish list from src/data/menu.ts into apps-script/Code.gs (between the MENU-LIST markers), so the
 * Google Sheet "Menu" tab can list every dish with an Available YES/NO dropdown.
 * Run after changing the menu:   node scripts/gen-menu-gs.mjs      (then re-paste Code.gs into Apps Script)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/data/menu.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports, console });
const MENU = mod.exports.MENU;
if (!Array.isArray(MENU) || !MENU.length) throw new Error('could not read MENU from src/data/menu.ts');

const rows = [];
for (const cat of MENU) for (const it of cat.items) rows.push([it.id, cat.name, it.name, it.p ?? '']);
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const block = `// <MENU-LIST> (generated from src/data/menu.ts by scripts/gen-menu-gs.mjs — do not edit by hand)
var MENU_ITEMS = [
${rows.map((r) => `  [${q(r[0])}, ${q(r[1])}, ${q(r[2])}, ${r[3] === '' ? "''" : r[3]}]`).join(',\n')}
];
// </MENU-LIST>`;

const file = path.join(root, 'apps-script/Code.gs');
let gs = fs.readFileSync(file, 'utf8');
const re = /\/\/ <MENU-LIST>[\s\S]*?\/\/ <\/MENU-LIST>/;
if (!re.test(gs)) throw new Error('MENU-LIST markers not found in Code.gs');
gs = gs.replace(re, () => block);
fs.writeFileSync(file, gs);
console.log(`Code.gs updated with ${rows.length} dishes`);
