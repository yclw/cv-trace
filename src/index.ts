// Core Types
export type { LayerData, Layer, OriginalMetadata, VectorizeResult } from "./types/index.js";

// Preprocess

// Binary Preprocess
export { BinaryPreprocess, type BinaryOptions } from "./preprocess/binary.js";

// Quantize Preprocess
export {
  QuantizePreprocess,
  type QuantizeOptions,
} from "./preprocess/quantize.js";

// Trace

// Potrace Trace
export { Potrace, type PotraceOptions } from "./trace/potrace.js";

// Optimizer

// SVGO
export { OptimizeSvg, type SvgoOptions } from "./optimizer/svgo.js";
