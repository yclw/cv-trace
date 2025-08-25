import sharp from "sharp";
import { buildPalette, utils, applyPalette } from "image-q";
import { LayerData, OriginalMetadata, Layer } from "../types/index.js";
import { rgbToHexString, rgbToBT709, rgbToHex } from "../utils/color.js";
import { bitwiseAnd, findNearestNonEmpty } from "../utils/buffer.js";
import { writeFileSync } from "fs";

export type QuantizeProOptions = {
  colorCount?: number;
  minPercent?: number;
  stack?: boolean;
  median?: number;
};

export async function quantizeProPreprocess(
  image: Buffer,
  options: QuantizeProOptions = {}
): Promise<LayerData> {
  const { colorCount = 8, minPercent = 0, stack = true, median } = options;

  const sharpImage = sharp(image);
  const metadata = await sharpImage.metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  const size = width * height;

  const originalMetadata: OriginalMetadata = {
    width,
    height,
    format: metadata.format,
  };

  // Apply image filters
  let processedSharp = sharpImage.clone();
  const processedImageBuffer = await processedSharp
    .ensureAlpha()
    .raw()
    .toBuffer();
  const inputImage = utils.PointContainer.fromBuffer(
    processedImageBuffer,
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
  const whiteBuffer = Buffer.alloc(width * height, 255); // Create white buffer
  const colorLayers = palettePointArray.map((point, index) => ({
    color: [point.r, point.g, point.b] as [number, number, number],
    brightness: rgbToBT709(point.r, point.g, point.b),
    index,
    maskBuffer: Buffer.from(whiteBuffer), // White buffer as mask
    count: 0,
  }));

  // Sort by brightness
  colorLayers.sort((a, b) => a.brightness - b.brightness);

  // RGB color hash -> sorted layer index
  const colorLayerMap = new Map<number, number>();
  colorLayers.forEach((layer, index) => {
    const colorKey = rgbToHex(layer.color[0], layer.color[1], layer.color[2]);
    colorLayerMap.set(colorKey, index);
  });

  // Generate layers directly while processing pixels
  for (let pixelIdx = 0; pixelIdx < size; pixelIdx++) {
    const rgbaIdx = pixelIdx * 4;
    const [r, g, b] = [
      quantizedPixelArray[rgbaIdx] ?? 0,
      quantizedPixelArray[rgbaIdx + 1] ?? 0,
      quantizedPixelArray[rgbaIdx + 2] ?? 0,
    ];

    const colorKey = rgbToHex(r, g, b);
    const layerIndex = colorLayerMap.get(colorKey);

    if (layerIndex === undefined) continue;

    const colorLayer = colorLayers[layerIndex];
    if (!colorLayer) continue;

    colorLayer.count++;
    colorLayer.maskBuffer[pixelIdx] = 0;
  }

  // Filter mask buffer
  let filteredMaskBuffer = Buffer.from(whiteBuffer);
  for (let layerIdx = 0; layerIdx < colorLayers.length; layerIdx++) {
    const colorLayer = colorLayers[layerIdx];
    if (!colorLayer) continue;
    let maskSharp = await sharp(colorLayer.maskBuffer, {
      raw: { width, height, channels: 1 },
    }).grayscale();
    if (median !== undefined) {
      maskSharp = await maskSharp.median(median);
    }
    const processedBuffer = await maskSharp.raw().toBuffer();
    colorLayer.maskBuffer = Buffer.from(processedBuffer);
    filteredMaskBuffer = Buffer.from(
      bitwiseAnd(filteredMaskBuffer, colorLayer.maskBuffer)
    );
  }

  for (let pixelIdx = 0; pixelIdx < size; pixelIdx++) {
    if (filteredMaskBuffer[pixelIdx] === 255) {
      // Find nearest non-empty pixel
      const nearestNonEmptyIdx = findNearestNonEmpty(
        filteredMaskBuffer,
        pixelIdx,
        width,
        height
      );
      if (nearestNonEmptyIdx !== -1) {
        // Find color layer of nearest non-empty pixel
        const rgbaIdx = nearestNonEmptyIdx * 4;
        const [r, g, b] = [
          quantizedPixelArray[rgbaIdx] ?? 0,
          quantizedPixelArray[rgbaIdx + 1] ?? 0,
          quantizedPixelArray[rgbaIdx + 2] ?? 0,
        ];

        const colorKey = rgbToHex(r, g, b);
        const layerIndex = colorLayerMap.get(colorKey);

        if (layerIndex === undefined) continue;

        const colorLayer = colorLayers[layerIndex];
        if (!colorLayer) continue;

        // Add pixel to color layer
        colorLayer.count++;
        colorLayer.maskBuffer[pixelIdx] = 0;
      }
    }
  }

  const layers: Layer[] = [];
  let canvas = Buffer.from(whiteBuffer);
  for (let layerIdx = 0; layerIdx < colorLayers.length; layerIdx++) {
    const colorLayer = colorLayers[layerIdx];
    if (!colorLayer) continue;
    const { count, color } = colorLayer;
    const [r, g, b] = color;

    // Stack mode
    if (stack) {
      canvas = Buffer.from(bitwiseAnd(canvas, colorLayer.maskBuffer));
      colorLayer.maskBuffer = Buffer.from(canvas);
    }

    // Skip if percent is less than minPercent
    const percent = count / size;
    if (percent < minPercent) continue;
    layers.push({
      id: `layer_${layerIdx}`,
      zIndex: layerIdx,
      color: rgbToHexString(r, g, b),
      imageBuffer: await sharp(colorLayer.maskBuffer, {
        raw: { width, height, channels: 1 },
      })
        .png()
        .toBuffer(),
    });
  }

  const preprocessedImage = await sharp(Buffer.from(quantizedPixelArray), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  return {
    layers,
    preprocessedImage,
    originalMetadata,
  };
}
