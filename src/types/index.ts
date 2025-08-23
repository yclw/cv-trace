export type Layer = {
  id: string;
  zIndex: number;
  color: string;
  imageBuffer: Buffer;
}

export type OriginalMetadata = {
  width: number;
  height: number;
  format?: string;
}

export type LayerData = {
  layers: Layer[];
  preprocessedImage: Buffer;
  originalMetadata: OriginalMetadata;
}

export type VectorizeResult = {
  svg: string;
  preprocessedImage: Buffer;
  originalMetadata: OriginalMetadata;
}