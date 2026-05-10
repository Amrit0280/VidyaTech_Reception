const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "electron", "assets");
const OUT_FILE = path.join(OUT_DIR, "app-icon.ico");
const SIZES = [16, 24, 32, 48, 64, 128, 256];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function pngEncode(width, height, rgba) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function blendPixel(buffer, width, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= width || y >= width || alpha <= 0) return;
  const offset = (y * width + x) * 4;
  const srcA = Math.min(1, Math.max(0, alpha));
  const dstA = buffer[offset + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;

  buffer[offset] = Math.round((color[0] * srcA + buffer[offset] * dstA * (1 - srcA)) / outA);
  buffer[offset + 1] = Math.round((color[1] * srcA + buffer[offset + 1] * dstA * (1 - srcA)) / outA);
  buffer[offset + 2] = Math.round((color[2] * srcA + buffer[offset + 2] * dstA * (1 - srcA)) / outA);
  buffer[offset + 3] = Math.round(outA * 255);
}

function mix(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * t));
}

function roundedRectAlpha(x, y, size, radius) {
  const dx = Math.max(radius - x, 0, x - (size - radius));
  const dy = Math.max(radius - y, 0, y - (size - radius));
  if (dx === 0 || dy === 0) return 1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.min(1, radius + 0.65 - distance));
}

function drawCircle(buffer, width, cx, cy, radius, color, opacity = 1) {
  const minX = Math.floor(cx - radius - 1);
  const maxX = Math.ceil(cx + radius + 1);
  const minY = Math.floor(cy - radius - 1);
  const maxY = Math.ceil(cy + radius + 1);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const alpha = Math.max(0, Math.min(1, radius + 0.55 - distance)) * opacity;
      blendPixel(buffer, width, x, y, color, alpha);
    }
  }
}

function drawLine(buffer, width, x1, y1, x2, y2, strokeWidth, color, opacity = 1) {
  const radius = strokeWidth / 2;
  const minX = Math.floor(Math.min(x1, x2) - radius - 1);
  const maxX = Math.ceil(Math.max(x1, x2) + radius + 1);
  const minY = Math.floor(Math.min(y1, y2) - radius - 1);
  const maxY = Math.ceil(Math.max(y1, y2) + radius + 1);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
      const distance = Math.hypot(px - closestX, py - closestY);
      const alpha = Math.max(0, Math.min(1, radius + 0.55 - distance)) * opacity;
      blendPixel(buffer, width, x, y, color, alpha);
    }
  }
}

function renderIcon(size) {
  const scale = 4;
  const canvasSize = size * scale;
  const buffer = Buffer.alloc(canvasSize * canvasSize * 4);
  const blue = [15, 76, 129];
  const teal = [0, 194, 203];
  const white = [255, 255, 255];

  for (let y = 0; y < canvasSize; y += 1) {
    for (let x = 0; x < canvasSize; x += 1) {
      const u = x / (canvasSize - 1);
      const v = y / (canvasSize - 1);
      const rectAlpha = roundedRectAlpha(x, y, canvasSize, 27 * (canvasSize / 120));
      if (rectAlpha <= 0) continue;
      const color = mix(blue, teal, Math.min(1, (u + v) / 2));
      blendPixel(buffer, canvasSize, x, y, color, rectAlpha);
      blendPixel(buffer, canvasSize, x, y, white, rectAlpha * 0.2 * (1 - v));
    }
  }

  const s = canvasSize / 120;
  drawLine(buffer, canvasSize, 22 * s, 28 * s, 55 * s, 87 * s, 9 * s, white, 1);
  drawLine(buffer, canvasSize, 60 * s, 93 * s, 98 * s, 28 * s, 9 * s, white, 0.5);
  drawLine(buffer, canvasSize, 22 * s, 28 * s, 98 * s, 28 * s, 2.8 * s, white, 0.4);
  drawCircle(buffer, canvasSize, 22 * s, 28 * s, 5.5 * s, white, 0.95);
  drawCircle(buffer, canvasSize, 60 * s, 28 * s, 4 * s, white, 0.55);
  drawCircle(buffer, canvasSize, 98 * s, 28 * s, 5.5 * s, white, 0.95);
  drawCircle(buffer, canvasSize, 55 * s, 87 * s, 7.5 * s, white, 1);
  drawCircle(buffer, canvasSize, 55 * s, 87 * s, 3.8 * s, mix(blue, teal, 0.68), 1);
  drawLine(buffer, canvasSize, 55 * s, 94 * s, 55 * s, 105 * s, 2.5 * s, white, 0.48);
  drawCircle(buffer, canvasSize, 55 * s, 109 * s, 4.5 * s, teal, 0.95);
  drawCircle(buffer, canvasSize, 55 * s, 109 * s, 2 * s, white, 0.88);
  drawCircle(buffer, canvasSize, 36 * s, 58 * s, 2 * s, white, 0.22);
  drawCircle(buffer, canvasSize, 79 * s, 58 * s, 2 * s, white, 0.22);

  const output = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const accum = [0, 0, 0, 0];
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const offset = ((y * scale + sy) * canvasSize + (x * scale + sx)) * 4;
          accum[0] += buffer[offset];
          accum[1] += buffer[offset + 1];
          accum[2] += buffer[offset + 2];
          accum[3] += buffer[offset + 3];
        }
      }
      const out = (y * size + x) * 4;
      output[out] = Math.round(accum[0] / (scale * scale));
      output[out + 1] = Math.round(accum[1] / (scale * scale));
      output[out + 2] = Math.round(accum[2] / (scale * scale));
      output[out + 3] = Math.round(accum[3] / (scale * scale));
    }
  }
  return pngEncode(size, size, output);
}

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry[0] = image.size === 256 ? 0 : image.size;
    entry[1] = image.size === 256 ? 0 : image.size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += image.png.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const images = SIZES.map((size) => ({ size, png: renderIcon(size) }));
fs.writeFileSync(OUT_FILE, createIco(images));
console.log(`Generated ${OUT_FILE}`);
