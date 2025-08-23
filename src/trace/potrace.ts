import potraceLib from "potrace";
import { LayerData, Layer, VectorizeResult } from "../types/index.js";

export type PotraceOptions = potraceLib.PotraceOptions;

export async function potrace(
  layerData: LayerData,
  options: PotraceOptions = {}
): Promise<VectorizeResult> {
  layerData.layers = layerData.layers.sort((a, b) => b.zIndex - a.zIndex);
  const svg = await generateCombinedSVG(layerData, options);
  return {
    svg,
    preprocessedImage: layerData.preprocessedImage,
    originalMetadata: layerData.originalMetadata,
  };
}

async function generateCombinedSVG(
  layerDate: LayerData,
  options: PotraceOptions = {}
): Promise<string> {
  const { width, height } = layerDate.originalMetadata;
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  for (const layer of layerDate.layers) {
    svg += await traceLayer(layer, options);
  }
  svg += "</svg>";
  return svg;
}

async function traceLayer(
  layer: Layer,
  options: PotraceOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tracer = new potraceLib.Potrace();
    options.color = layer.color;
    tracer.setParameters(options);
    tracer.loadImage(layer.imageBuffer, function (this: any, err: any) {
      if (err) {
        reject(new Error(`Layer load failed: ${err.message}`));
      }
      try {
        const pathTag = this.getPathTag();
        resolve(pathTag);
      } catch (err) {
        reject(err);
      }
    });
  });
}
