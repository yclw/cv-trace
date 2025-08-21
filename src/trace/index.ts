import potrace from "potrace";
import { LayerData, Layer, VectorizeResult } from "../types/index.js";

export interface TraceOptions {
  turdPolicy?: "minority" | "majority" | "black" | "white" | "left" | "right";
  turdSize?: number;
  alphaMax?: number;
  optCurve?: boolean;
  optTolerance?: number;
  threshold?: number;
  blackOnWhite?: boolean;
  color?: string | "auto";
  background?: string | "transparent";
}

export interface TraceResult {
  svg: string;
}

export async function TraceLayers(
  layerData: LayerData,
  options: TraceOptions = {}
): Promise<VectorizeResult> {
  layerData.layers = layerData.layers.sort((a, b) => a.zIndex - b.zIndex);
  const svg = await generateCombinedSVG(layerData, options);
  return {
    svg,
    preprocessedImage: layerData.preprocessedImage,
    originalMetadata: layerData.originalMetadata,
  };
}

async function generateCombinedSVG(
  layerDate: LayerData,
  options: TraceOptions = {}
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
  options: TraceOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tracer = new potrace.Potrace();

    const {
      turdPolicy = "minority",
      turdSize = 2,
      alphaMax = 1,
      optCurve = true,
      optTolerance = 0.2,
      threshold = -1,
      blackOnWhite = true,
      color = layer.color,
    } = options;

    tracer.setParameters({
      turdPolicy: turdPolicy,
      turdSize: turdSize,
      alphaMax: alphaMax,
      optCurve: optCurve,
      optTolerance: optTolerance,
      threshold: threshold,
      blackOnWhite: blackOnWhite,
      color: color,
      background: "transparent",
    });

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
