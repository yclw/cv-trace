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
  const { color = "#000000", threshold = [128, 255] } = options;

  const originalImage = await Jimp.read(image);

  const originalMetadata: OriginalMetadata = {
    width: originalImage.width,
    height: originalImage.height,
    format: originalImage.mime || "image/png",
  };

  const layerData: LayerData = {
    layers: [],
    preprocessedImage: image,
    originalMetadata,
  };

  let processedImage = originalImage.clone();

  // brightness
  if (options.brightness) {
    processedImage.brightness(options.brightness);
  }

  // blur
  if (options.blur) {
    processedImage.blur(options.blur);
  }

  // greyscale
  processedImage.greyscale();

  // contrast
  if (options.contrast) {
    processedImage.contrast(options.contrast);
  }

  // binary
  for (const { idx } of processedImage.scanIterator()) {
    const gray = processedImage.bitmap.data[idx];
    if (!gray) continue;
    const bw = gray >= threshold[0] && gray <= threshold[1] ? 255 : 0;
    processedImage.bitmap.data[idx + 0] = bw;
    processedImage.bitmap.data[idx + 1] = bw;
    processedImage.bitmap.data[idx + 2] = bw;
  }

  const layer: Layer = {
    id: "binary",
    zIndex: 1,
    color: color,
    imageBuffer: await processedImage.getBuffer("image/png"),
  };

  layerData.layers.push(layer);

  layerData.preprocessedImage = await processedImage.getBuffer("image/png");

  return layerData;
}
