import sharp = require('sharp');
import { promises as fs } from 'fs';
import * as path from 'path';

export interface ResizeOptions {
  sizes: number[]; // widths in px
  qualityWebp?: number; // 1..100
  qualityJpeg?: number; // 1..100
  outputDir?: string; // defaults to same dir as input
  baseName?: string; // defaults to input name without ext
  toWebp?: boolean; // default true
}

export interface ProcessResult {
  originalPath: string;
  variants: Array<{ width: number; format: 'webp' | 'jpeg'; path: string; bytes: number }>; 
}

export async function processImageVariants(inputPath: string, options: ResizeOptions): Promise<ProcessResult> {
  const {
    sizes,
    qualityWebp = 82,
    qualityJpeg = 82,
    outputDir,
    baseName,
    toWebp = true,
  } = options;

  const dir = outputDir || path.dirname(inputPath);
  const name = baseName || path.parse(inputPath).name;

  await fs.mkdir(dir, { recursive: true });

  const variants: ProcessResult['variants'] = [];

  for (const width of sizes) {
    // Ensure positive width
    if (!width || width <= 0) continue;

    // WebP variant
    if (toWebp) {
      const webpOut = path.join(dir, `${name}-${width}.webp`);
      const webpBuf = await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: qualityWebp })
        .toBuffer();
      await fs.writeFile(webpOut, webpBuf);
      variants.push({ width, format: 'webp', path: webpOut, bytes: webpBuf.length });
    }

    // JPEG fallback
    const jpegOut = path.join(dir, `${name}-${width}.jpg`);
    const jpegBuf = await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: qualityJpeg, mozjpeg: true })
      .toBuffer();
    await fs.writeFile(jpegOut, jpegBuf);
    variants.push({ width, format: 'jpeg', path: jpegOut, bytes: jpegBuf.length });
  }

  return { originalPath: inputPath, variants };
}

export async function toWebp(inputPath: string, outPath?: string, quality: number = 82): Promise<string> {
  const output = outPath || inputPath.replace(/\.[^/.]+$/, '.webp');
  const buf = await sharp(inputPath).webp({ quality }).toBuffer();
  await fs.writeFile(output, buf);
  return output;
}


