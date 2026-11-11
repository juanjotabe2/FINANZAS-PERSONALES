/**
 * Mis finanzas — puente entre la app (GitHub Pages) y esta hoja de cálculo.
 *
 * INSTALACIÓN (una sola vez, en tu cuenta PERSONAL de Google):
 *  1. Crea una hoja nueva en Google Sheets (p. ej. "Mis finanzas – datos").
 *  2. Extensiones → Apps Script. Borra lo que haya y pega este archivo completo. Guarda (💾).
 *  3. Arriba, elige la función "configurar" y pulsa ▶ Ejecutar. Acepta los permisos
 *     (Google avisará de que la app no está verificada: es tu propio script →
 *     "Configuración avanzada" → "Ir a … (no seguro)").
 *     Crea las pestañas y genera tu CLAVE SECRETA (la verás en el registro de ejecución
 *     y en el menú "Mis finanzas → Ver clave secreta" de la hoja).
 *  4. Implementar → Nueva implementación → tipo "Aplicación web":
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Copia la URL que termina en /exec.
 *  5. En la app: Ajustes → Sincronización → pega la URL y la clave → Conectar.
 *
 * Seguridad: la hoja sigue siendo privada. El script solo responde si recibe la clave
 * secreta correcta. No compartas la clave ni la URL. Si crees que se ha filtrado,
 * ejecuta "nuevaClave" y cámbiala en tus dispositivos.
 *
 * Si algún día actualizas este código: Implementar → Gestionar implementaciones →
 * ✎ → Versión: "Nueva versión" → Implementar (la URL no cambia).
 */

const HOJAS = {
  'Movimientos':          ['id', 'fecha', 'descripcion', 'importe', 'categoria', 'cuenta', 'etiqueta', 'nota', 'origen'],
  'Patrimonio':           ['id', 'nombre', 'tipo', 'moneda', 'valor', 'base_invertida', 'cuenta_enlazada', 'nota', 'actualizado', 'fecha_saldo'],
  'Categorias':           ['nombre', 'tipo', 'presupuesto_mensual'],
  'Reglas':               ['contiene', 'signo', 'categoria'],
  'Nominas':              ['id', 'mes', 'empresa', 'bruto', 'irpf', 'seg_social', 'liquido'],
  'Historial patrimonio': ['fecha', 'total_eur', 'por_tipo']
};
// columnas que deben guardarse como texto (para que Sheets no las convierta en fechas/números)
const TEXTO = { 'Movimientos': ['id', 'origen'], 'Patrimonio': ['id'], 'Nominas': ['id', 'mes'], 'Historial patrimonio': ['por_tipo'] };
const FECHAS = { 'Movimientos': ['fecha'], 'Patrimonio': ['actualizado', 'fecha_saldo'], 'Historial patrimonio': ['fecha'] };
const CONFIG = '_config';
const CLAVES_CONFIG = ['rev', 'ajustes', 'cuentas', 'borrados', 'actualizado'];

/* ---------------- instalación ---------------- */
function configurar() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(HOJAS).forEach(function (n) {
    const cols = HOJAS[n];
    let sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    (TEXTO[n] || []).forEach(function (c) { sh.getRange(2, cols.indexOf(c) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@'); });
    (FECHAS[n] || []).forEach(function (c) { sh.getRange(2, cols.indexOf(c) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy'); });
  });
  ['importe'].forEach(function (c) { const sh = ss.getSheetByName('Movimientos'); sh.getRange(2, HOJAS['Movimientos'].indexOf(c) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('#,##0.00'); });
  let c = ss.getSheetByName(CONFIG) || ss.insertSheet(CONFIG);
  if (c.getLastRow() === 0) {
    c.getRange(1, 1, CLAVES_CONFIG.length, 2).setNumberFormat('@')
      .setValues([['rev', '0'], ['ajustes', '{}'], ['cuentas', '[]'], ['borrados', '[]'], ['actualizado', '']]);
  }
  c.hideSheet();
  // quitar la hoja vacía por defecto
  ['Hoja 1', 'Sheet1', 'Hoja1'].forEach(function (n) { const s = ss.getSheetByName(n); if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s); });
  // detectar cambios hechos a mano en la hoja (incluido borrar filas)
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'alCambiar'; })) {
    ScriptApp.newTrigger('alCambiar').forSpreadsheet(ss).onChange().create();
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('CLAVE')) props.setProperty('CLAVE', generarClave_());
  const k = props.getProperty('CLAVE');
  Logger.log('✅ Hoja preparada. Tu CLAVE SECRETA (cópiala en la app): ' + k);
  try { SpreadsheetApp.getUi().alert('Hoja preparada ✅\n\nTu clave secreta (cópiala en la app):\n\n' + k); } catch (e) { /* ejecutado desde el editor */ }
  return k;
}
function nuevaClave() {
  PropertiesService.getScriptProperties().setProperty('CLAVE', generarClave_());
  return configurar();
}
function verClave() {
  const k = PropertiesService.getScriptProperties().getProperty('CLAVE') || '(aún no configurada: ejecuta "configurar")';
  Logger.log(k);
  try { SpreadsheetApp.getUi().alert('Tu clave secreta:\n\n' + k); } catch (e) {}
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mis finanzas')
    .addItem('Configurar / reparar pestañas', 'configurar')
    .addItem('Ver clave secreta', 'verClave')
    .addItem('Generar clave nueva', 'nuevaClave')
    .addToUi();
}
function generarClave_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }

/* Cada cambio manual en la hoja sube la versión, para que la app lo descargue. */
function alCambiar() { const c = SpreadsheetApp.getActive().getSheetByName(CONFIG); if (c) c.getRange('B1').setValue(String(leerRev_() + 1)); }

/* ---------------- API ---------------- */
function doGet() { return salida_({ ok: true, info: 'Mis finanzas: el puente funciona. Conéctalo desde la app.' }); }

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return salida_({ ok: false, error: 'Petición no válida' }); }
  const clave = PropertiesService.getScriptProperties().getProperty('CLAVE');
  if (!clave || typeof req.key !== 'string' || req.key !== clave) { Utilities.sleep(1500); return salida_({ ok: false, error: 'Clave incorrecta' }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (req.action === 'get') return salida_(Object.assign({ ok: true }, leer_()));
    if (req.action === 'put') {
      const rev = leerRev_();
      if (Number(req.baseRev) !== rev) return salida_(Object.assign({ ok: false, conflict: true }, leer_()));
      escribir_(req.data);
      escribirConfig_('rev', String(rev + 1));
      escribirConfig_('actualizado', new Date().toISOString());
      return salida_({ ok: true, rev: rev + 1 });
    }
    return salida_({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return salida_({ ok: false, error: String(err && err.message || err) });
  } finally { lock.releaseLock(); }
}
function salida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------------- lectura ---------------- */
function leer_() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(CONFIG)) throw new Error('Ejecuta primero la función "configurar" en Apps Script');
  const tz = ss.getSpreadsheetTimeZone();
  const fd = function (v, fmt) { if (v instanceof Date) return Utilities.formatDate(v, tz, fmt || 'yyyy-MM-dd'); return normFecha_(String(v == null ? '' : v).trim()); };
  const n = function (v) { if (typeof v === 'number') return v; const s = String(v || '').replace(/[€\s]/g, ''); const x = parseFloat(s.indexOf(',') > -1 ? s.replace(/\./g, '').replace(',', '.') : s); return isNaN(x) ? 0 : x; };
  const s = function (v) { return v == null ? '' : String(v); };

  const mov = filas_('Movimientos', true).map(function (r) {
    return { id: s(r[0]), date: fd(r[1]), desc: s(r[2]), amount: Math.round(n(r[3]) * 100) / 100, cat: s(r[4]) || 'Sin categoría', account: s(r[5]), tag: s(r[6]), note: s(r[7]), src: s(r[8]) };
  }).filter(function (t) { return t.date; });
  const pat = filas_('Patrimonio', true).map(function (r) {
    return { id: s(r[0]), name: s(r[1]), type: s(r[2]) || 'Otros activos', currency: s(r[3]) || 'EUR', value: n(r[4]), cost: n(r[5]), account: s(r[6]), note: s(r[7]), updated: fd(r[8]), balDate: fd(r[9]) };
  });
  const cats = filas_('Categorias').map(function (r) { return { name: s(r[0]), type: s(r[1]) || 'expense', budget: n(r[2]) }; }).filter(function (c) { return c.name; });
  const reg = filas_('Reglas').map(function (r) { return { kw: s(r[0]), sign: s(r[1]), cat: s(r[2]) }; });
  const nom = filas_('Nominas', true).map(function (r) {
    return { id: s(r[0]), month: (r[1] instanceof Date ? fd(r[1], 'yyyy-MM') : s(r[1]).slice(0, 7)), company: s(r[2]), bruto: n(r[3]), irpf: n(r[4]), ss: n(r[5]), neto: n(r[6]) };
  });
  const his = filas_('Historial patrimonio').map(function (r) { let bt = {}; try { bt = JSON.parse(s(r[2]) || '{}'); } catch (e) {} return { date: fd(r[0]), total: n(r[1]), byType: bt }; }).filter(function (x) { return x.date; });

  const cfg = function (k, def) { try { return JSON.parse(leerConfig_(k)) || def; } catch (e) { return def; } };
  return {
    rev: leerRev_(),
    data: {
      version: 1, settings: cfg('ajustes', {}), accounts: cfg('cuentas', []), categories: cats, rules: reg,
      txs: mov, assets: pat, snapshots: his, payslips: nom, meta: { deleted: cfg('borrados', []) }
    }
  };
}
/* Devuelve las filas con datos; si con_id, rellena (y guarda) ids que falten en filas añadidas a mano. */
function filas_(nombre, con_id) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];
  const cols = HOJAS[nombre].length;
  const rango = sh.getRange(2, 1, sh.getLastRow() - 1, cols);
  const v = rango.getValues();
  if (con_id) {
    let cambiado = false;
    v.forEach(function (r) { if (r.slice(1).some(function (c) { return c !== '' && c !== null; }) && !String(r[0]).trim()) { r[0] = 'h' + Utilities.getUuid().slice(0, 8); cambiado = true; } });
    if (cambiado) sh.getRange(2, 1, v.length, 1).setValues(v.map(function (r) { return [r[0]]; }));
  }
  return v.filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); });
}
function normFecha_(s) {
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); }
  return '';
}

/* ---------------- escritura ---------------- */
function escribir_(d) {
  const fecha = function (s) { if (!s) return ''; const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }; // mediodía: evita saltos de zona horaria
  volcar_('Movimientos', (d.txs || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; })
    .map(function (t) { return [t.id, fecha(t.date), t.desc, t.amount, t.cat, t.account, t.tag || '', t.note || '', t.src || '']; }));
  volcar_('Patrimonio', (d.assets || []).map(function (a) { return [a.id, a.name, a.type, a.currency, a.value, a.cost || 0, a.account || '', a.note || '', fecha(a.updated), fecha(a.balDate)]; }));
  volcar_('Categorias', (d.categories || []).map(function (c) { return [c.name, c.type, c.budget || 0]; }));
  volcar_('Reglas', (d.rules || []).map(function (r) { return [r.kw, r.sign || '', r.cat]; }));
  volcar_('Nominas', (d.payslips || []).map(function (p) { return [p.id, p.month, p.company || '', p.bruto || 0, p.irpf || 0, p.ss || 0, p.neto || 0]; }));
  volcar_('Historial patrimonio', (d.snapshots || []).map(function (x) { return [fecha(x.date), x.total, JSON.stringify(x.byType || {})]; }));
  escribirConfig_('ajustes', JSON.stringify(d.settings || {}));
  escribirConfig_('cuentas', JSON.stringify(d.accounts || []));
  escribirConfig_('borrados', JSON.stringify(((d.meta && d.meta.deleted) || []).slice(-5000)));
}
function volcar_(nombre, filas) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nombre);
  const cols = HOJAS[nombre].length;
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cols).clearContent();
  if (!filas.length) return;
  if (sh.getMaxRows() < filas.length + 1) sh.insertRowsAfter(sh.getMaxRows(), filas.length + 1 - sh.getMaxRows());
  (TEXTO[nombre] || []).forEach(function (c) { sh.getRange(2, HOJAS[nombre].indexOf(c) + 1, filas.length, 1).setNumberFormat('@'); });
  (FECHAS[nombre] || []).forEach(function (c) { sh.getRange(2, HOJAS[nombre].indexOf(c) + 1, filas.length, 1).setNumberFormat('dd/mm/yyyy'); });
  sh.getRange(2, 1, filas.length, cols).setValues(filas);
}
function filaConfig_(k) { return CLAVES_CONFIG.indexOf(k) + 1; }
function leerConfig_(k) { return String(SpreadsheetApp.getActive().getSheetByName(CONFIG).getRange(filaConfig_(k), 2).getValue()); }
function escribirConfig_(k, v) { SpreadsheetApp.getActive().getSheetByName(CONFIG).getRange(filaConfig_(k), 2).setValue(v); }
function leerRev_() { const c = SpreadsheetApp.getActive().getSheetByName(CONFIG); return c ? (Number(c.getRange('B1').getValue()) || 0) : 0; }
