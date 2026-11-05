import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple valid uncompressed/zlib PNG writer in pure Node
function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: 2 (truecolor RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image scanlines
  // Each line has 1 filter byte (0) + width * 3 bytes (RGB)
  const lineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * lineLength);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineLength;
    rawData[lineOffset] = 0; // filter type 0: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = lineOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded emerald background
      let pr = r;
      let pg = g;
      let pb = b;

      // Draw subtle landmark/bank column pattern in white in center
      const inCenterBox = Math.abs(dx) < width * 0.3 && Math.abs(dy) < height * 0.3;
      if (inCenterBox) {
        // Pediment roof top
        if (dy < -height * 0.12 && dy > -height * 0.28) {
          const roofWidth = (dy + height * 0.28) * 1.5;
          if (Math.abs(dx) < roofWidth) {
            pr = 255; pg = 255; pb = 255;
          }
        }
        // Columns
        else if (dy >= -height * 0.08 && dy <= height * 0.16) {
          const colX = Math.abs(dx) % (width * 0.12);
          if (colX < width * 0.06 && Math.abs(dx) < width * 0.26) {
            pr = 255; pg = 255; pb = 255;
          }
        }
        // Base
        else if (dy > height * 0.16 && dy < height * 0.22 && Math.abs(dx) < width * 0.28) {
          pr = 255; pg = 255; pb = 255;
        }
      }

      rawData[pixelOffset] = pr;
      rawData[pixelOffset + 1] = pg;
      rawData[pixelOffset + 2] = pb;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 implementation
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  table[n] = c;
}

// Generate the required icons into public/
const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 5, 150, 105));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 5, 150, 105));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 4, 120, 87));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 5, 150, 105));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, 5, 150, 105));

console.log('PWA icons created successfully in public/');
