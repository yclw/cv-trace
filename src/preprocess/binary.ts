import sharp from "sharp";
import { LayerData, OriginalMetadata, Layer } from "../types/index.js";
import { rgbToBT709 } from "../utils/color.js";

export type BinaryOptions = {
  threshold?: [number, number];
  brightness?: number;
  blur?: number;
  color?: string;
};

export async function binaryPreprocess(
  image: Buffer,
  options: BinaryOptions = {}
): Promise<LayerData> {
  const {
    color = "#000000",
    threshold = [128, 255],
    brightness,
    blur,
  } = options;

  const sharpImage = sharp(image);
  const metadata = await sharpImage.metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  const originalMetadata: OriginalMetadata = {
    width,
    height,
    format: metadata.format,
  };

  // Apply image filters
  let processedSharp = sharpImage.clone();
  if (brightness !== undefined)
    processedSharp = processedSharp.modulate({ brightness: brightness });
  if (blur !== undefined) processedSharp = processedSharp.blur(blur);

  // Get RGBA pixel data
  const pixelBuffer = await processedSharp.ensureAlpha().raw().toBuffer();

  // Binary processing
  for (let i = 0; i < pixelBuffer.length; i += 4) {
    const r = pixelBuffer[i] || 0;
    const g = pixelBuffer[i + 1] || 0;
    const b = pixelBuffer[i + 2] || 0;

    // Convert to grayscale using luminance formula
    const gray = rgbToBT709(r, g, b);
    const bw = gray >= threshold[0] && gray <= threshold[1] ? 255 : 0;
    // Set RGB to binary value, keep alpha
    pixelBuffer.set([bw, bw, bw], i);
  }

  const processedImageBuffer = await sharp(pixelBuffer, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  const layer: Layer = {
    id: "binary",
    zIndex: 1,
    color: color,
    imageBuffer: processedImageBuffer,
  };

  return {
    layers: [layer],
    preprocessedImage: processedImageBuffer,
    originalMetadata,
  };
}
