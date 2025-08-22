import { Jimp } from "jimp";
import { LayerData, OriginalMetadata, Layer } from "../types/index.js";

export interface BinaryOptions {
  threshold?: [number, number];
  brightness?: number;
  blur?: number;
  contrast?: number;
  color?: string;
}

export async function BinaryPreprocess(
  image: Buffer,
  options: BinaryOptions = {}
): Promise<LayerData> {
  const {
    color = "#000000",
    threshold = [128, 255],
    brightness,
    blur,
    contrast,
  } = options;

  const originalImage = await Jimp.read(image);

  const originalMetadata: OriginalMetadata = {
    width: originalImage.width,
    height: originalImage.height,
    format: originalImage.mime || "image/png",
  };

  // Apply image filters
  let processedImage = originalImage.clone();
  if (brightness) processedImage.brightness(brightness);
  if (blur) processedImage.blur(blur);
  if (contrast) processedImage.contrast(contrast);

  // binary
  for (const { idx } of processedImage.scanIterator()) {
    const gray = processedImage.bitmap.data[idx];
    if (!gray) continue;
    const bw = gray >= threshold[0] && gray <= threshold[1] ? 255 : 0;
    processedImage.bitmap.data.set([bw, bw, bw], idx);
  }

  const layer: Layer = {
    id: "binary",
    zIndex: 1,
    color: color,
    imageBuffer: await processedImage.getBuffer("image/png"),
  };

  const preprocessedImage = await processedImage.getBuffer("image/png");

  return {
    layers: [layer],
    preprocessedImage,
    originalMetadata,
  };
}
