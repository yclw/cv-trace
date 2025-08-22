import { readFileSync, writeFileSync } from "fs";
import { BinaryPreprocess, Potrace, OptimizeSvg } from "../dist/index.js";

const imageBuffer = readFileSync("./test.jpg");

// 1. Preprocess (if use BinaryPreprocess)
const layerData = await BinaryPreprocess(imageBuffer, {
  threshold: [128, 255],
  color: "#000000",
});

// 2. Trace (if use Potrace)
const result = await Potrace(layerData);
// 3. Optimize (optional)
result.svg = await OptimizeSvg(result.svg);

writeFileSync("./output.svg", result.svg);
writeFileSync("./preview.png", result.preprocessedImage);
