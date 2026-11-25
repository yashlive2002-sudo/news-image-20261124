// THE WORLD TODAY — a one-image front page of Tuesday, November 24, 2026.
// Node 22, standard library only, no network. The page is built ahead of time from news.json by build.mjs and
// committed as entry.png; this program copies those exact bytes to /output/entry.png, so every run writes the same file.
//
// Locally, MAKEFUN_OUTPUT_DIR stands in for /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576; // 1 MiB cap
const SIDE = 1024; // 1024x1024 cap
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const png = readFileSync(new URL('./entry.png', import.meta.url));

// Fail loudly here rather than hand the gate an image it would refuse.
if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('entry.png is not a PNG');
// The gate takes only a whole PNG: a truncated file would lose its closing IEND chunk.
if (png.subarray(png.length - 8, png.length - 4).toString('latin1') !== 'IEND') throw new Error('entry.png is truncated (no IEND)');
if (png.length > MAX_BYTES) throw new Error(`entry.png is ${png.length} bytes, over ${MAX_BYTES}`);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width > SIDE || height > SIDE) throw new Error(`entry.png is ${width}x${height}, over ${SIDE}x${SIDE}`);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
// mode 0644: /output is collected as another user than the one the program runs as.
writeFileSync(join(outDir, 'entry.png'), png, { mode: 0o644 });
