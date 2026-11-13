/* Escritor de ZIP mínimo (deflate), sin dependencias: el portal genera los
 * paquetes de descarga en el build y no conviene añadirle librerías. */
import zlib from 'node:zlib';

const TABLA = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** Fecha y hora en el formato de MS-DOS que usa el ZIP. */
function fechaDos(d) {
  const anio = Math.max(1980, d.getFullYear());
  return {
    fecha: ((anio - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    hora: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
  };
}

/** entradas: [{ nombre, datos }] — nombre con "/" como separador. */
export function crearZip(entradas, cuando = new Date()) {
  const { fecha, hora } = fechaDos(cuando);
  const locales = [];
  const central = [];
  let offset = 0;

  for (const e of entradas) {
    const datos = Buffer.isBuffer(e.datos) ? e.datos : Buffer.from(e.datos, 'utf8');
    const comprimido = zlib.deflateRawSync(datos, { level: 9 });
    const nombre = Buffer.from(e.nombre, 'utf8');
    const crc = crc32(datos);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);      // versión necesaria
    local.writeUInt16LE(0x0800, 6);  // nombres en UTF-8
    local.writeUInt16LE(8, 8);       // deflate
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(fecha, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nombre.length, 26);
    locales.push(local, nombre, comprimido);

    const cab = Buffer.alloc(46);
    cab.writeUInt32LE(0x02014b50, 0);
    cab.writeUInt16LE(20, 4);
    cab.writeUInt16LE(20, 6);
    cab.writeUInt16LE(0x0800, 8);
    cab.writeUInt16LE(8, 10);
    cab.writeUInt16LE(hora, 12);
    cab.writeUInt16LE(fecha, 14);
    cab.writeUInt32LE(crc, 16);
    cab.writeUInt32LE(comprimido.length, 20);
    cab.writeUInt32LE(datos.length, 24);
    cab.writeUInt16LE(nombre.length, 28);
    cab.writeUInt32LE(offset, 42);
    central.push(cab, nombre);

    offset += local.length + nombre.length + comprimido.length;
  }

  const directorio = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(offset, 16);

  return Buffer.concat([...locales, directorio, fin]);
}
