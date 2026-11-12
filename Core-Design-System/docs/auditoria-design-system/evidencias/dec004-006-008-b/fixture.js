// Fixture compartido por los arneses de DEC-004/006/008
const fs = require('fs');
const ROOT = '/Users/juan.soto/Documents/Desarrollo/Compensar/Core-Design-System';
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const choice = (kind, id, { checked, error, disabled, label = 'Etiqueta de ejemplo' } = {}) => `<label class="mp-choice mp-${kind}${error ? ' mp-choice--error' : ''}" id="${id}-wrap"><span class="mp-choice__field"><input class="form-check-input mp-choice__input" id="${id}" type="${kind}" name="g-${kind}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span class="mp-choice__control" aria-hidden="true"></span></span><span class="mp-choice__text"><span class="mp-choice__label" id="${id}-label">${label}</span></span></label>`;
const sw = (id, { checked, disabled } = {}) => `<label class="mp-switch" id="${id}-wrap"><span class="mp-switch__field"><input class="form-check-input mp-switch__input" id="${id}" type="checkbox" role="switch"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span class="mp-switch__track" aria-hidden="true"></span></span><span class="mp-switch__text"><span class="mp-switch__label" id="${id}-label">Interruptor</span></span></label>`;
const tab = (id, label, { active, disabled } = {}) => `<button class="mp-tab${active ? ' is-active' : ''}" role="tab" id="${id}" aria-selected="${!!active}" aria-controls="p-${id}"${active ? '' : ' tabindex="-1"'}${disabled ? ' disabled' : ''} type="button">${label}</button>`;
function page(css, extra = '') {
  return `<!doctype html><html><head><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"><style>${css}</style></head><body style="margin:0;padding:24px;background:var(--use-background-page);color:var(--use-text-primary);font-family:Roboto,Arial,sans-serif">
<div style="display:flex;flex-direction:column;gap:12px;max-width:700px">
<button id="btn-first" type="button" class="mp-btn mp-btn--primario">Primario</button>
<button id="btn-sec" type="button" class="mp-btn mp-btn--secundario">Secundario</button>
<button id="btn-ter" type="button" class="mp-btn mp-btn--terciario">Terciario</button>
<div class="mp-input-group"><label class="mp-input-label" for="inp">Campo</label><input class="mp-input-field" id="inp" type="text" placeholder="Texto"></div>
${choice('checkbox', 'cb-off')}${choice('checkbox', 'cb-on', { checked: true })}${choice('checkbox', 'cb-err', { error: true })}
${choice('radio', 'rd-a', { checked: true })}${choice('radio', 'rd-b')}
${sw('sw-off')}${sw('sw-on', { checked: true })}${sw('sw-dis', { disabled: true })}
<div class="mp-dropdown" id="dd"><button class="mp-dropdown__trigger" id="dd-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="dd-list"><span>Seleccione</span></button><div class="mp-dropdown__panel"><div class="mp-dropdown__options" id="dd-list" role="listbox" aria-label="Opciones"><div class="mp-dropdown__option" role="option" aria-selected="false" data-value="a">Opción A</div><div class="mp-dropdown__option" role="option" aria-selected="false" data-value="b">Opción B</div><div class="mp-dropdown__option" role="option" aria-selected="true" data-value="c">Opción C</div></div></div></div>
<div class="mp-tabs" role="tablist" aria-label="Pestañas" id="tabs">${tab('tab-1', 'General', { active: true })}${tab('tab-2', 'Datos')}${tab('tab-3', 'Pagos', { disabled: true })}</div>
<div role="tabpanel" id="p-tab-1" aria-labelledby="tab-1">Panel 1</div><div role="tabpanel" id="p-tab-2" aria-labelledby="tab-2" hidden>Panel 2</div>
${extra}
</div></body></html>`;
}
const read = f => fs.readFileSync(f, 'utf8');
module.exports = { page, read, ROOT, EXE, choice, sw, tab };
