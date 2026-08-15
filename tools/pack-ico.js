// 将多个 PNG 打包为单一 .ico（Vista+ 支持 PNG 内嵌格式）
// 用法: node pack-ico.js <输出.ico> <输入1.png> <输入2.png> ...
'use strict';
const fs = require('fs');
const path = require('path');

const [out, ...inputs] = process.argv.slice(2);
if (!out || inputs.length === 0) {
  console.error('usage: node pack-ico.js <out.ico> <in1.png> [in2.png ...]');
  process.exit(1);
}

const pngs = inputs.map((f) => fs.readFileSync(f));
const count = pngs.length;

// ICONDIR(6) + ICONDIRENTRY(16)*n
let offset = 6 + 16 * count;
const entries = [];
pngs.forEach((buf, i) => {
  const dim = pngDimension(buf);
  const w = dim.width >= 256 ? 0 : dim.width;
  const h = dim.height >= 256 ? 0 : dim.height;
  entries.push({ w, h, size: buf.length, offset, buf });
  offset += buf.length;
});

const head = Buffer.alloc(6);
head.writeUInt16LE(0, 0);      // reserved
head.writeUInt16LE(1, 2);      // type: icon
head.writeUInt16LE(count, 4);

const parts = [head];
for (const e of entries) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(e.w, 0);
  entry.writeUInt8(e.h, 1);
  entry.writeUInt8(0, 2);      // palette
  entry.writeUInt8(0, 3);      // reserved
  entry.writeUInt16LE(1, 4);   // color planes
  entry.writeUInt16LE(32, 6);  // bits per pixel
  entry.writeUInt32LE(e.size, 8);
  entry.writeUInt32LE(e.offset, 12);
  parts.push(entry);
}
for (const e of entries) parts.push(e.buf);

fs.writeFileSync(out, Buffer.concat(parts));
console.log(`ico written: ${out} (${count} images)`);

function pngDimension(buf) {
  // PNG: 8字节签名 + IHDR(长度4+类型4) + width(4) + height(4)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
