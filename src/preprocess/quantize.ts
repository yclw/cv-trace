import { Jimp } from "jimp";
import { buildPalette, utils, applyPalette } from "image-q";
import { LayerData, OriginalMetadata, Layer } from "../types/index.js";
import { rgbToHexString, rgbToBT709, rgbToHex } from "../utils/color.js";

export interface QuantizeOptions {
  colorCount?: number;
  minPercent?: number;
  stack?: boolean;
  brightness?: number;
  blur?: number;
  contrast?: number;
}

export async function QuantizePreprocess(
  image: Buffer,
  options: QuantizeOptions = {}
): Promise<LayerData> {
  const {
    colorCount = 8,
    minPercent = 0,
    stack = false,
    brightness,
    blur,
    contrast,
  } = options;

  const originalImage = await Jimp.read(image);
  const width = originalImage.width;
  const height = originalImage.height;
  const size = width * height;

  const originalMetadata: OriginalMetadata = {
    width,
    height,
    format: originalImage.mime || "image/png",
  };

  // Apply image filters
  let processedImage = originalImage.clone();
  if (brightness) processedImage.brightness(brightness);
  if (blur) processedImage.blur(blur);
  if (contrast) processedImage.contrast(contrast);

  const inputImage = utils.PointContainer.fromBuffer(
    processedImage.bitmap.data,
    width,
    height
  );

  // Build palette
  const palette = await buildPalette([inputImage], { colors: colorCount });

  // Apply palette
  const quantizedImage = await applyPalette(inputImage, palette);
  const quantizedPixelArray = quantizedImage.toUint8Array();

  // Create color layers from palette points
  const palettePointArray = palette.getPointContainer().getPointArray();
  const colorLayers = palettePointArray.map((point, index) => ({
    color: [point.r, point.g, point.b] as [number, number, number],
    brightness: rgbToBT709(point.r, point.g, point.b),
    index,
    mask: Buffer.alloc(size, 255),
    count: 0,
  }));

  // Sort by brightness
  colorLayers.sort((a, b) => a.brightness - b.brightness);

  // RGB color hash -> sorted layer
  const colorLayerMap = new Map<number, (typeof colorLayers)[0]>();
  colorLayers.forEach((layer) => {
    const colorKey = rgbToHex(layer.color[0], layer.color[1], layer.color[2]);
    colorLayerMap.set(colorKey, layer);
  });

  // Create binary masks for each color layer
  for (let pixelIdx = 0; pixelIdx < size; pixelIdx++) {
    const rgbaIdx = pixelIdx * 4;
    const [r, g, b] = [
      quantizedPixelArray[rgbaIdx] ?? 0,
      quantizedPixelArray[rgbaIdx + 1] ?? 0,
      quantizedPixelArray[rgbaIdx + 2] ?? 0,
    ];

    const colorKey = rgbToHex(r, g, b);
    const targetLayer = colorLayerMap.get(colorKey);

    if (!targetLayer) continue;

    targetLayer.mask[pixelIdx] = 0;
    targetLayer.count++;
  }

  const layers: Layer[] = [];

  // Initialize base white canvas for layer composition
  const baseCanvas = new Jimp({ width, height, color: 0xffffffff });
  let canvas = baseCanvas.clone();

  // Generate layers from color masks
  for (let layerIdx = 0; layerIdx < colorLayers.length; layerIdx++) {
    const colorLayer = colorLayers[layerIdx];
    if (!colorLayer) continue;
    const { mask, count, color } = colorLayer;
    const [r, g, b] = color;

    // Apply mask to canvas
    for (const { idx, x, y } of canvas.scanIterator())
      if (mask[y * width + x] === 0) canvas.bitmap.data.set([0, 0, 0], idx);

    // Skip if percent is less than minPercent
    const percent = count / size;
    if (percent >= minPercent) {
      layers.push({
        id: `layer_${layerIdx}`,
        zIndex: layerIdx,
        color: rgbToHexString(r, g, b),
        imageBuffer: await canvas.getBuffer("image/png"),
      });
    }

    //  Clear canvas if not stack
    if (!stack) canvas = baseCanvas.clone();
  }

  const jimpImage = new Jimp({ width, height });
  jimpImage.bitmap.data = Buffer.from(quantizedPixelArray);
  const preprocessedImage = await jimpImage.getBuffer("image/png");

  return {
    layers,
    preprocessedImage,
    originalMetadata,
  };
}
