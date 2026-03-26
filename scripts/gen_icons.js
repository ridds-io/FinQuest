// Generates minimal valid 1x1 PNG files for PWA icons
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
    }
    let crc = 0xffffffff;
    for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function uint32BE(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n, 0);
    return b;
}

function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([t, data]);
    return Buffer.concat([uint32BE(data.length), t, data, uint32BE(crc32(crcBuf))]);
}

function makePNG(r, g, b) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR: 1x1, 8-bit RGB
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(1, 0); // width
    ihdr.writeUInt32BE(1, 4); // height
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // color type: RGB
    // compression, filter, interlace = 0

    // IDAT: filter byte (0) + RGB pixel, deflated
    const raw = Buffer.from([0, r, g, b]);
    const compressed = zlib.deflateSync(raw);

    const iend = Buffer.alloc(0);

    return Buffer.concat([
        sig,
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', iend),
    ]);
}

// Dark blue matching FinQuest theme (#1a1a2e)
const png = makePNG(0x1a, 0x1a, 0x2e);
fs.writeFileSync('public/icon-192.png', png);
fs.writeFileSync('public/icon-512.png', png);
console.log('Icons written:', png.length, 'bytes');
