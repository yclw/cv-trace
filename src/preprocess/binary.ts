import sharp from "sharp";
import { LayerData, OriginalMetadata, Layer } from "../types/index.js";

export type BinaryOptions = {
  threshold?: [number, number];
  color?: string;
};

export async function binaryPreprocess(
  image: Buffer,
  options: BinaryOptions = {}
): Promise<LayerData> {
  const { color = "#000000", threshold = [128, 255] } = options;

  const sharpImage = sharp(image);
  const metadata = await sharpImage.metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  const originalMetadata: OriginalMetadata = {
    width,
    height,
    format: metadata.format,
  };

  const pixelBuffer = await sharpImage
    .grayscale()
    .ensureAlpha()
    .raw()
    .toBuffer();

  for (let idx = 0; idx < pixelBuffer.length; idx++) {
    const gray = pixelBuffer[idx] ?? 0;
    const bw = gray >= threshold[0] && gray <= threshold[1] ? 255 : 0;
    pixelBuffer[idx] = bw;
  }

  const processedImageBuffer = await sharp(pixelBuffer, {
    raw: { width, height, channels: 1 },
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
