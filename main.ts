import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const sourcePath = join(here, "entry.png");

function fail(message: string): never {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

let source: Buffer;
try {
  source = readFileSync(sourcePath);
} catch (error) {
  fail(`could not read ${sourcePath}: ${(error as Error).message}`);
}

const MAX_BYTES = 1048576;
if (source.length === 0) {
  fail(`${sourcePath} is empty`);
}
if (source.length > MAX_BYTES) {
  fail(`${sourcePath} is too large (${source.length} bytes, max ${MAX_BYTES})`);
}

if (source.length < 8 || !source.subarray(0, 8).equals(PNG_MAGIC)) {
  fail(`${sourcePath} is not a valid PNG file (bad PNG signature)`);
}

if (source.subarray(12, 16).toString("ascii") !== "IHDR") {
  fail(`${sourcePath} is not a valid PNG file (missing IHDR chunk)`);
}

const width = source.readUInt32BE(16);
const height = source.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  fail(`${sourcePath} must be 1024x1024, got ${width}x${height}`);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(sourcePath, join(outputDir, "entry.png"));
