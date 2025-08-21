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