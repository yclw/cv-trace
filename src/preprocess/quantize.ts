import sharp from "sharp";
import { buildPalette, utils, applyPalette } from "image-q";
import { LayerData, OriginalMetadata, Layer } from "../types/index.js";
import { rgbToHexString, rgbToBT709, rgbToHex } from "../utils/color.js";

export type QuantizeOptions = {
  colorCount?: number;
  minPercent?: number;
  stack?: boolean;
  brightness?: number;
  blur?: number;
};

export async function quantizePreprocess(
  image: Buffer,
  options: QuantizeOptions = {}
): Promise<LayerData> {
  const {
    colorCount = 8,
    minPercent = 0,
    stack = false,
    brightness,
    blur,
  } = options;

  const sharpImage = sharp(image);
  const metadata = await sharpImage.metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  const size = width * height;

  const originalMetadata: OriginalMetadata = {
    width,
    height,
    format: metadata.format ? `image/${metadata.format}` : "image/png",
  };

  // Apply image filters
  let processedSharp = sharpImage.clone();
  if (brightness !== undefined)
    processedSharp = processedSharp.modulate({ brightness: brightness });
  if (blur !== undefined) processedSharp = processedSharp.blur(blur);

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
  const whiteBuffer = Buffer.alloc(width * height * 4, 255); // Create white RGBA buffer
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

    colorLayers[layerIndex]!.count++;

    // Set pixel to black for current layer and subsequent layers (if stack mode)
    for (let layerIdx = layerIndex; layerIdx < colorLayers.length; layerIdx++) {
      const layer = colorLayers[layerIdx];
      if (!layer) continue;
      layer.maskBuffer.set([0, 0, 0], rgbaIdx);
      if (!stack) break;
    }
  }

  const layers: Layer[] = [];

  // Generate final layers
  for (let layerIdx = 0; layerIdx < colorLayers.length; layerIdx++) {
    const colorLayer = colorLayers[layerIdx];
    if (!colorLayer) continue;
    const { maskBuffer, count, color } = colorLayer;
    const [r, g, b] = color;

    // Skip if percent is less than minPercent
    const percent = count / size;
    if (percent < minPercent) continue;
    layers.push({
      id: `layer_${layerIdx}`,
      zIndex: layerIdx,
      color: rgbToHexString(r, g, b),
      imageBuffer: await sharp(maskBuffer, {
        raw: { width, height, channels: 4 },
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
