// Core Types
export type {
  LayerData,
  Layer,
  OriginalMetadata,
  VectorizeResult,
} from "./types/index.js";

// Preprocess

// Binary Preprocess
export { binaryPreprocess, type BinaryOptions } from "./preprocess/binary.js";

// Quantize Preprocess
export {
  quantizePreprocess,
  type QuantizeOptions,
} from "./preprocess/quantize.js";

// Trace

// Potrace Trace
export { potrace, type PotraceOptions } from "./trace/potrace.js";

// Optimizer

// SVGO
export { svgoOptimize, type SvgoOptions } from "./optimizer/svgo.js";
