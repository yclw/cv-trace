# cv-trace

A library for tracing images to SVG

## Core

### Type

```ts
export interface Layer {
  id: string;
  zIndex: number;
  color: string;
  imageBuffer: Buffer;
}

export interface OriginalMetadata {
  width: number;
  height: number;
  format?: string;
}

export interface LayerData {
  layers: Layer[];
  preprocessedImage: Buffer;
  originalMetadata: OriginalMetadata;
}

export interface VectorizeResult {
  svg: string;
  preprocessedImage: Buffer;
  originalMetadata: OriginalMetadata;
}
```

### Process

(Image Buffer) --preprocess--> (LayerData) --trace--> (VectorizeResult) --optimizer--> (VectorizeResult)

## Preprocess

Use Preprocessor to convert Image Buffer to LayerData

### Preprocessor

Convert the original image to layers of black and white binary image masks (Buffer), and carry layer and color information (although non-binary images are also supported, it is recommended to convert to binary images, because this provides better control)

> Plan to support more Preprocessor in the future. And quantization according to color will be preferred (Actually, color quantization has been implemented, but we are thinking about how to make the code more elegant)

## Trace

### Tracer

Currently uses potrace to convert LayerData to a hierarchical SVG image

> Plan to support more tracers in the future

## Optimizer

> Plan to use svgo to optimize svg string

## LICENSE

GPL-2.0-or-later

> Potrace is GPL LICENSE
