// #RRGGBB
export function rgbToHexString(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// RRGGBB
export function rgbToHex(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

// BT.709
export function rgbToBT709(r: number, g: number, b: number): number {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

// BT.601
export function rgbToBT601(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114;
}